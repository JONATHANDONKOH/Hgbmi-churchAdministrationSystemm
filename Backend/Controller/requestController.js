const pool = require('../Config/db');
const bcrypt = require('bcryptjs');
const Groups = require('../models/groupsModel');
const User = require('../models/usersModel');
const UserGroup = require('../models/userGroupScopeModel');
const Requests = require('../models/requestModel');

const REQUEST_TYPES = [
  'user',
  'leader_assignment',
  'group_creation',
  'event',
];

const GROUP_TYPES = [
  'cell',
  'fellowship',
  'ministry',
  'department',
];

class HttpError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

const getId = (value) => {
  const id = Number(value);

  return Number.isSafeInteger(id) && id > 0 ? id : null;
};

const normalizeRole = (value) =>
  typeof value === 'string' ? value.trim().toLowerCase() : '';

const validateRequestedRole = (role) => {
  if (
    typeof role !== 'string' ||
    !role.trim() ||
    role.trim().length > 60 ||
    !/^[a-zA-Z][a-zA-Z0-9 _-]*$/.test(role.trim())
  ) {
    throw new HttpError(
      400,
      'Enter a valid role using letters, numbers, spaces, underscores or hyphens. Maximum 60 characters.'
    );
  }

  return role.trim().toLowerCase();
};

// Read user information regardless of whether the model returns
// snake_case database fields or camelCase JavaScript fields.
const getMemberInformation = (user) => {
  if (!user) {
    return null;
  }

  return {
    id: getId(user.id),
    full_name:
      user.full_name ||
      user.fullName ||
      user.name ||
      '',
    email: user.email || '',
    phone_number:
      user.phone_number ||
      user.phoneNumber ||
      user.phone ||
      '',
    current_role: user.role || 'member',
  };
};

// Validate request data before saving it.
const validateRequestData = (type, data) => {
  if (!data || typeof data !== 'object' || Array.isArray(data)) {
    throw new HttpError(400, 'request_data must be an object');
  }

  if (type === 'user') {
    const { full_name, email, phone, password } = data;

    if (
      typeof full_name !== 'string' ||
      !full_name.trim() ||
      typeof email !== 'string' ||
      !email.trim() ||
      typeof password !== 'string' ||
      !password
    ) {
      throw new HttpError(
        400,
        'full_name, email and password are required'
      );
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      throw new HttpError(400, 'Invalid email address');
    }

    const passwordLength = Buffer.byteLength(password, 'utf8');

    if (passwordLength < 8 || passwordLength > 72) {
      throw new HttpError(400, 'Password must be 8–72 bytes long');
    }

    if (phone != null && typeof phone !== 'string') {
      throw new HttpError(400, 'phone must be a string');
    }

    return {
      data: {
        full_name: full_name.trim(),
        email: email.trim().toLowerCase(),
        phone: phone?.trim() || null,
        requested_role: 'member',
      },
      password,
    };
  }

  if (type === 'leader_assignment') {
    const targetId = getId(data.target_user_id);
    const requestedRole = validateRequestedRole(data.requested_role);

    if (!targetId) {
      throw new HttpError(400, 'Valid target_user_id is required');
    }

    return {
      data: {
        target_user_id: targetId,
        requested_role: requestedRole,
      },
    };
  }

  if (type === 'group_creation') {
    const name =
      typeof data.name === 'string' ? data.name.trim() : '';

    const groupType =
      typeof data.type === 'string'
        ? data.type.trim().toLowerCase()
        : '';

    const parentGroupId = getId(data.parent_group_id);
    const targetUserId = getId(data.target_user_id);
    const requestedRole = validateRequestedRole(data.requested_role);

    if (!name) {
      throw new HttpError(400, 'New group name is required');
    }

    if (!GROUP_TYPES.includes(groupType)) {
      throw new HttpError(400, 'Invalid new group type');
    }

    if (!parentGroupId) {
      throw new HttpError(400, 'Valid parent_group_id is required');
    }

    if (!targetUserId) {
      throw new HttpError(400, 'Valid target_user_id is required');
    }

    if (data.location != null && typeof data.location !== 'string') {
      throw new HttpError(400, 'location must be a string');
    }

    if (
      data.description != null &&
      typeof data.description !== 'string'
    ) {
      throw new HttpError(400, 'description must be a string');
    }

    return {
      data: {
        name,
        type: groupType,
        parent_group_id: parentGroupId,
        location: data.location?.trim() || null,
        description: data.description?.trim() || null,
        target_user_id: targetUserId,
        requested_role: requestedRole,
      },
    };
  }

  if (type === 'event') {
    if (
      typeof data.title !== 'string' ||
      !data.title.trim() ||
      typeof data.description !== 'string' ||
      !data.description.trim() ||
      !data.start_datetime ||
      !data.end_datetime
    ) {
      throw new HttpError(
        400,
        'title, description, start_datetime and end_datetime are required'
      );
    }

    const start = new Date(data.start_datetime);
    const end = new Date(data.end_datetime);

    if (
      Number.isNaN(start.getTime()) ||
      Number.isNaN(end.getTime()) ||
      end <= start
    ) {
      throw new HttpError(400, 'Invalid event date or time range');
    }

    if (data.location != null && typeof data.location !== 'string') {
      throw new HttpError(400, 'location must be a string');
    }

    return {
      data: {
        title: data.title.trim(),
        description: data.description.trim(),
        location: data.location?.trim() || null,
        start_datetime: start.toISOString(),
        end_datetime: end.toISOString(),
      },
    };
  }

  throw new HttpError(400, 'Unsupported request type');
};

// Submit a member, role assignment, group creation, or event request.
exports.create = async (req, res) => {
  try {
    const body = req.body || {};

    const type =
      typeof body.request_type === 'string'
        ? body.request_type.trim().toLowerCase()
        : '';

    const groupId = getId(body.group_id);
    const requesterId = getId(req.user?.id);

    if (!requesterId) {
      throw new HttpError(401, 'Authentication required');
    }

    if (!REQUEST_TYPES.includes(type)) {
      throw new HttpError(400, 'Unsupported request type');
    }

    if (!groupId) {
      throw new HttpError(400, 'Valid group_id is required');
    }

    const group = await Groups.findById(groupId);

    if (!group) {
      throw new HttpError(404, 'Group not found');
    }

    if (normalizeRole(req.user.role) !== 'super_admin') {
      const allowedRoles = [
        'group_leader',
        'assistant_leader',
        'cell_leader',
        'fellowship_leader',
        'department_leader',
        'ministry_leader',
        'women_leader',
      ];

      if (
        !allowedRoles.includes(normalizeRole(req.user.role)) ||
        !(await UserGroup.hasGroupAccess(requesterId, groupId))
      ) {
        throw new HttpError(
          403,
          'You cannot submit requests for this group'
        );
      }
    }

    const validated = validateRequestData(
      type,
      body.request_data
    );

    const { data } = validated;
    let passwordHash = null;

    if (type === 'user') {
      const existingUser = await User.findByEmail(data.email);

      if (existingUser) {
        throw new HttpError(409, 'Email already exists');
      }

      passwordHash = await bcrypt.hash(validated.password, 10);
    }

    // Existing member role-assignment request.
    if (type === 'leader_assignment') {
      const target = await User.findById(data.target_user_id);

      if (!target) {
        throw new HttpError(404, 'Selected user not found');
      }

      if (
        !(await UserGroup.hasGroupAccess(
          data.target_user_id,
          groupId
        ))
      ) {
        throw new HttpError(
          400,
          'Selected user is not a member of this group'
        );
      }

      const member = getMemberInformation(target);

      // Save actual member information from the database.
      data.selected_member = member;
      data.full_name = member.full_name;
      data.email = member.email;
      data.phone_number = member.phone_number;
      data.current_role = member.current_role;
    }

    // Request to create a new group and appoint its leader.
    if (type === 'group_creation') {
      if (data.parent_group_id !== groupId) {
        throw new HttpError(
          400,
          'parent_group_id must match the selected group'
        );
      }

      const parentGroup = await Groups.findById(
        data.parent_group_id
      );

      if (!parentGroup) {
        throw new HttpError(404, 'Parent group not found');
      }

      const target = await User.findById(data.target_user_id);

      if (!target) {
        throw new HttpError(404, 'Selected user not found');
      }

      if (
        !(await UserGroup.hasGroupAccess(
          data.target_user_id,
          groupId
        ))
      ) {
        throw new HttpError(
          400,
          'Selected user is not a member of the parent group'
        );
      }

      const member = getMemberInformation(target);

      // Keep group details and selected leader details together
      // inside request_data so the admin can review them.
      data.selected_member = member;
      data.full_name = member.full_name;
      data.email = member.email;
      data.phone_number = member.phone_number;
      data.current_role = member.current_role;

      // Explicit leader fields are also saved for convenient display.
      data.leader_full_name = member.full_name;
      data.leader_email = member.email;
      data.leader_phone_number = member.phone_number;
      data.leader_current_role = member.current_role;
    }

    const request = await Requests.create({
      requestType: type,
      requestedBy: requesterId,
      groupId,
      requestData: data,
      passwordHash,
    });

    return res.status(201).json(request);
  } catch (err) {
    console.error('Create request error:', err);

    return res.status(err.status || 500).json({
      error: err.status
        ? err.message
        : 'Failed to submit request',
    });
  }
};

// List requests.
exports.findAll = async (req, res) => {
  try {
    const { status, request_type } = req.query;
    const filters = {};

    if (status) {
      filters.status = status;
    }

    if (request_type) {
      const type = request_type.trim().toLowerCase();

      if (!REQUEST_TYPES.includes(type)) {
        throw new HttpError(400, 'Unsupported request type');
      }

      filters.requestType = type;
    }

    const requests = await Requests.findAll(filters);

    return res.json(requests);
  } catch (err) {
    console.error('Fetch requests error:', err);

    return res.status(err.status || 500).json({
      error: err.status
        ? err.message
        : 'Failed to fetch requests',
    });
  }
};

// List requests submitted by the logged-in user.
exports.findMyRequests = async (req, res) => {
  try {
    const requests = await Requests.findByUser(req.user.id);
    return res.json(requests);
  } catch (err) {
    console.error('Fetch my requests error:', err);

    return res.status(500).json({
      error: 'Failed to fetch your requests',
    });
  }
};

// Fetch one request.
exports.findById = async (req, res) => {
  const id = getId(req.params.id);

  if (!id) {
    return res.status(400).json({ error: 'Invalid request ID' });
  }

  try {
    const request = await Requests.findById(id);

    if (!request) {
      return res.status(404).json({ error: 'Request not found' });
    }

    const isRequester =
      Number(request.requested_by) === Number(req.user.id);

    const hasViewPermission =
      Array.isArray(req.user.permissions) &&
      req.user.permissions.includes('view_requests');

    const isSuperAdmin = req.user.role === 'super_admin';

    if (!isRequester && !hasViewPermission && !isSuperAdmin) {
      return res.status(403).json({ error: 'Access denied' });
    }

    return res.json(request);
  } catch (err) {
    console.error('Fetch request error:', err);

    return res.status(500).json({
      error: 'Failed to fetch request',
    });
  }
};

// Approve a pending request.
exports.approve = async (req, res) => {
  const id = getId(req.params.id);

  if (!id) {
    return res.status(400).json({ error: 'Invalid request ID' });
  }

  let client;

  try {
    client = await pool.connect();

    await client.query('BEGIN');

    const request = await Requests.findByIdForUpdate(id, client);

    if (!request) {
      throw new HttpError(404, 'Request not found');
    }

    if (request.status !== 'pending') {
      throw new HttpError(409, 'Request has already been reviewed');
    }

    if (Number(request.requested_by) === Number(req.user.id)) {
      throw new HttpError(403, 'You cannot approve your own request');
    }

    if (request.request_type === 'user') {
      const data = request.request_data;

      if (!request.password_hash) {
        throw new HttpError(
          400,
          'Member request has no stored password hash'
        );
      }

      const existingUser = await User.findByEmail(
        data.email,
        client
      );

      if (existingUser) {
        throw new HttpError(409, 'Email already exists');
      }

      const user = await User.createFromHash(
        {
          fullName: data.full_name,
          email: data.email,
          passwordHash: request.password_hash,
          role: 'member',
          phoneNumber: data.phone,
        },
        client
      );

      await UserGroup.add(user.id, request.group_id, client);
    } else if (request.request_type === 'leader_assignment') {
      const data = request.request_data;
      const targetId = getId(data?.target_user_id);
      const requestedRole = validateRequestedRole(
        data?.requested_role
      );

      if (!targetId) {
        throw new HttpError(
          400,
          'Invalid leadership assignment request data'
        );
      }

      const target = await User.findById(targetId, client);

      if (!target) {
        throw new HttpError(404, 'Selected user not found');
      }

      if (
        !(await UserGroup.hasGroupAccess(
          targetId,
          request.group_id,
          client
        ))
      ) {
        throw new HttpError(
          400,
          'Selected user is no longer a member of this group'
        );
      }

      const updatedUser = await User.updateRole(
        targetId,
        requestedRole,
        client
      );

      if (!updatedUser) {
        throw new HttpError(404, 'Failed to update user role');
      }
    } else if (request.request_type === 'group_creation') {
      const data = request.request_data || {};

      const name =
        typeof data.name === 'string' ? data.name.trim() : '';

      const groupType =
        typeof data.type === 'string'
          ? data.type.trim().toLowerCase()
          : '';

      const parentGroupId = getId(data.parent_group_id);
      const targetId = getId(data.target_user_id);
      const requestedRole = validateRequestedRole(
        data.requested_role
      );

      if (
        !name ||
        !GROUP_TYPES.includes(groupType) ||
        !parentGroupId ||
        !targetId
      ) {
        throw new HttpError(
          400,
          'Invalid group-creation request data'
        );
      }

      const parentGroup = await Groups.findById(
        parentGroupId,
        client
      );

      if (!parentGroup) {
        throw new HttpError(404, 'Parent group not found');
      }

      const target = await User.findById(targetId, client);

      if (!target) {
        throw new HttpError(404, 'Selected user not found');
      }

      if (
        !(await UserGroup.hasGroupAccess(
          targetId,
          parentGroupId,
          client
        ))
      ) {
        throw new HttpError(
          400,
          'Selected user is no longer a member of the parent group'
        );
      }

      const newGroup = await Groups.create(
        {
          name,
          type: groupType,
          parentGroupId,
          location: data.location || null,
          description: data.description || null,
          leaderId: targetId,
          createdBy: request.requested_by,
        },
        client
      );

      if (!newGroup?.id) {
        throw new HttpError(500, 'Failed to create the new group');
      }

      const updatedUser = await User.updateRole(
        targetId,
        requestedRole,
        client
      );

      if (!updatedUser) {
        throw new HttpError(404, 'Failed to update user role');
      }

      await UserGroup.add(targetId, newGroup.id, client);
    } else if (request.request_type === 'event') {
      throw new HttpError(
        501,
        'Event approval is not implemented yet'
      );
    } else {
      throw new HttpError(400, 'Unsupported request type');
    }

    const approved = await Requests.approve(
      id,
      {
        reviewedBy: req.user.id,
        reviewNote: req.body?.review_note || null,
      },
      client
    );

    if (!approved) {
      throw new HttpError(409, 'Request has already been reviewed');
    }

    await client.query('COMMIT');

    return res.json(approved);
  } catch (err) {
    if (client) {
      await client.query('ROLLBACK').catch(() => {});
    }

    console.error('Approve request error:', err);

    return res.status(err.status || 500).json({
      error: err.status
        ? err.message
        : 'Failed to approve request',
    });
  } finally {
    if (client) {
      client.release();
    }
  }
};

// Reject a pending request.
exports.reject = async (req, res) => {
  const id = getId(req.params.id);

  if (!id) {
    return res.status(400).json({ error: 'Invalid request ID' });
  }

  try {
    const rejected = await Requests.reject(
      id,
      {
        reviewedBy: req.user.id,
        reviewNote: req.body?.review_note || null,
      }
    );

    if (!rejected) {
      return res.status(409).json({
        error: 'Request not found or already reviewed',
      });
    }

    return res.json(rejected);
  } catch (err) {
    console.error('Reject request error:', err);

    return res.status(500).json({
      error: 'Failed to reject request',
    });
  }
};

// Delete a request permanently.
exports.remove = async (req, res) => {
  const id = getId(req.params.id);

  if (!id) {
    return res.status(400).json({ error: 'Invalid request ID' });
  }

  try {
    const deleted = await Requests.delete(id);

    if (!deleted) {
      return res.status(404).json({ error: 'Request not found' });
    }

    return res.json(deleted);
  } catch (err) {
    console.error('Delete request error:', err);

    return res.status(500).json({
      error: 'Failed to delete request',
    });
  }
};