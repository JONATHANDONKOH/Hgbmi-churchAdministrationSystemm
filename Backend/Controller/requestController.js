
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
  'meeting',
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

const getMemberInformation = (user) => {
  if (!user) return null;

  return {
    id: getId(user.id),
    full_name: user.full_name || user.fullName || user.name || '',
    email: user.email || '',
    phone_number:
      user.phone_number || user.phoneNumber || user.phone || '',
    current_role: user.role || 'member',
  };
};

const validateRequestData = (type, data) => {
  if (!data || typeof data !== 'object' || Array.isArray(data)) {
    throw new HttpError(400, 'request_data must be an object');
  }

  // MEMBER REQUEST
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

  // LEADER ASSIGNMENT REQUEST
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

  // GROUP CREATION REQUEST
  if (type === 'group_creation') {
    const name = typeof data.name === 'string' ? data.name.trim() : '';

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

  // EVENT REQUEST
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

  // MEETING REQUEST
  if (type === 'meeting') {
    if (
      typeof data.title !== 'string' ||
      !data.title.trim() ||
      typeof data.description !== 'string' ||
      !data.description.trim() ||
      !data.start_date ||
      !data.end_date
    ) {
      throw new HttpError(
        400,
        'title, description, start_date and end_date are required'
      );
    }

    const start = new Date(data.start_date);
    const end = new Date(data.end_date);

    if (
      Number.isNaN(start.getTime()) ||
      Number.isNaN(end.getTime()) ||
      end <= start
    ) {
      throw new HttpError(
        400,
        'Invalid meeting date or time range'
      );
    }

    if (data.location != null && typeof data.location !== 'string') {
      throw new HttpError(400, 'Meeting location must be a string');
    }

    return {
      data: {
        title: data.title.trim(),
        description: data.description.trim(),
        start_date: start.toISOString(),
        end_date: end.toISOString(),
        location: data.location?.trim() || null,
      },
    };
  }

  throw new HttpError(400, 'Unsupported request type');
};

// SUBMIT A REQUEST
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

    const validated = validateRequestData(type, body.request_data);
    const { data } = validated;

    let passwordHash = null;

    if (type === 'user') {
      const existingUser = await User.findByEmail(data.email);

      if (existingUser) {
        throw new HttpError(409, 'Email already exists');
      }

      passwordHash = await bcrypt.hash(validated.password, 10);
    }

    if (type === 'leader_assignment') {
      const target = await User.findById(data.target_user_id);

      if (!target) {
        throw new HttpError(404, 'Selected user not found');
      }

      if (
        !(await UserGroup.hasGroupAccess(data.target_user_id, groupId))
      ) {
        throw new HttpError(
          400,
          'Selected user is not a member of this group'
        );
      }

      const member = getMemberInformation(target);

      data.selected_member = member;
      data.full_name = member.full_name;
      data.email = member.email;
      data.phone_number = member.phone_number;
      data.current_role = member.current_role;
    }

    if (type === 'group_creation') {
      if (data.parent_group_id !== groupId) {
        throw new HttpError(
          400,
          'parent_group_id must match the selected group'
        );
      }

      const parentGroup = await Groups.findById(data.parent_group_id);

      if (!parentGroup) {
        throw new HttpError(404, 'Parent group not found');
      }

      const target = await User.findById(data.target_user_id);

      if (!target) {
        throw new HttpError(404, 'Selected user not found');
      }

      if (
        !(await UserGroup.hasGroupAccess(data.target_user_id, groupId))
      ) {
        throw new HttpError(
          400,
          'Selected user is not a member of the parent group'
        );
      }

      const member = getMemberInformation(target);

      data.selected_member = member;
      data.full_name = member.full_name;
      data.email = member.email;
      data.phone_number = member.phone_number;
      data.current_role = member.current_role;
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
      error: err.status ? err.message : 'Failed to submit request',
    });
  }
};

// LIST REQUESTS FOR ADMINISTRATORS
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

    return res.status(200).json(requests);
  } catch (err) {
    console.error('Fetch requests error:', err);

    return res.status(err.status || 500).json({
      error: err.status ? err.message : 'Failed to fetch requests',
    });
  }
};

// GET REQUESTS SUBMITTED BY THE LOGGED-IN USER
exports.findMyRequests = async (req, res) => {
  const userId = getId(req.user?.id);

  if (!userId) {
    return res.status(401).json({
      error: 'Authentication required',
    });
  }

  try {
    const requests = await Requests.findByUser(userId);

    return res.status(200).json(requests);
  } catch (err) {
    console.error('Fetch my requests error:', err);

    return res.status(500).json({
      error: 'Failed to fetch your requests',
    });
  }
};

// FETCH ONE REQUEST
exports.findById = async (req, res) => {
  const id = getId(req.params.id);

  if (!id) {
    return res.status(400).json({
      error: 'Invalid request ID',
    });
  }

  try {
    const request = await Requests.findById(id);

    if (!request) {
      return res.status(404).json({
        error: 'Request not found',
      });
    }

    const isRequester =
      Number(request.requested_by) === Number(req.user.id);

    const hasViewPermission =
      Array.isArray(req.user.permissions) &&
      req.user.permissions.includes('view_requests');

    const isSuperAdmin =
      normalizeRole(req.user.role) === 'super_admin';

    if (!isRequester && !hasViewPermission && !isSuperAdmin) {
      return res.status(403).json({
        error: 'Access denied',
      });
    }

    return res.status(200).json(request);
  } catch (err) {
    console.error('Fetch request error:', err);

    return res.status(500).json({
      error: 'Failed to fetch request',
    });
  }
};

// APPROVE A PENDING REQUEST
exports.approve = async (req, res) => {
  const id = getId(req.params.id);

  if (!id) {
    return res.status(400).json({
      error: 'Invalid request ID',
    });
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

      const existingUser = await User.findByEmail(data.email, client);

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
      const requestedRole = validateRequestedRole(data?.requested_role);

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

      const name = typeof data.name === 'string' ? data.name.trim() : '';

      const groupType =
        typeof data.type === 'string'
          ? data.type.trim().toLowerCase()
          : '';

      const parentGroupId = getId(data.parent_group_id);
      const targetId = getId(data.target_user_id);
      const requestedRole = validateRequestedRole(data.requested_role);

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

      const parentGroup = await Groups.findById(parentGroupId, client);

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
      const data = request.request_data || {};
      const groupId = getId(request.group_id);

      if (!groupId) {
        throw new HttpError(
          400,
          'The event request has an invalid group_id'
        );
      }

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
          'The event request is missing required information'
        );
      }

      const startDate = new Date(data.start_datetime);
      const endDate = new Date(data.end_datetime);

      if (
        Number.isNaN(startDate.getTime()) ||
        Number.isNaN(endDate.getTime()) ||
        endDate <= startDate
      ) {
        throw new HttpError(
          400,
          'The event request has an invalid date or time range'
        );
      }

      if (data.location != null && typeof data.location !== 'string') {
        throw new HttpError(
          400,
          'The event location must be text'
        );
      }

      const eventResult = await client.query(
        `INSERT INTO events (
          group_id,
          title,
          description,
          start_date,
          end_date,
          event_location,
          created_by
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        RETURNING *`,
        [
          groupId,
          data.title.trim(),
          data.description.trim(),
          startDate.toISOString(),
          endDate.toISOString(),
          data.location?.trim() || null,
          request.requested_by,
        ]
      );

      if (!eventResult.rows[0]) {
        throw new HttpError(
          500,
          'Failed to create the approved event'
        );
      }
    } else if (request.request_type === 'meeting') {
      // MEETING APPROVAL
      // The meeting is inserted only after administrator approval.
      const data = request.request_data || {};
      const groupId = getId(request.group_id);

      if (!groupId) {
        throw new HttpError(
          400,
          'The meeting request has an invalid group_id'
        );
      }

      if (
        typeof data.title !== 'string' ||
        !data.title.trim() ||
        typeof data.description !== 'string' ||
        !data.description.trim() ||
        !data.start_date ||
        !data.end_date
      ) {
        throw new HttpError(
          400,
          'The meeting request is missing required information'
        );
      }

      const startDate = new Date(data.start_date);
      const endDate = new Date(data.end_date);

      if (
        Number.isNaN(startDate.getTime()) ||
        Number.isNaN(endDate.getTime()) ||
        endDate <= startDate
      ) {
        throw new HttpError(
          400,
          'The meeting request has an invalid date or time range'
        );
      }

      if (data.location != null && typeof data.location !== 'string') {
        throw new HttpError(
          400,
          'The meeting location must be text'
        );
      }

      const meetingResult = await client.query(
        `INSERT INTO meetings (
          group_id,
          title,
          description,
          start_date,
          end_date,
          created_by,
          location
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        RETURNING *`,
        [
          groupId,
          data.title.trim(),
          data.description.trim(),
          startDate.toISOString(),
          endDate.toISOString(),
          request.requested_by,
          data.location?.trim() || null,
        ]
      );

      if (!meetingResult.rows[0]) {
        throw new HttpError(
          500,
          'Failed to create the approved meeting'
        );
      }
    } else {
      throw new HttpError(400, 'Unsupported request type');
    }

    const approved = await Requests.approve(
      id,
      {
        reviewedBy: req.user.id,
        reviewNote:
          typeof req.body?.review_note === 'string'
            ? req.body.review_note.trim() || null
            : null,
      },
      client
    );

    if (!approved) {
      throw new HttpError(409, 'Request has already been reviewed');
    }

    await client.query('COMMIT');

    return res.status(200).json({
      message: 'Request approved successfully',
      request: approved,
    });
  } catch (err) {
    if (client) {
      await client.query('ROLLBACK').catch(() => {});
    }

    console.error('Approve request error:', err);

    return res.status(err.status || 500).json({
      error: err.status ? err.message : 'Failed to approve request',
    });
  } finally {
    if (client) {
      client.release();
    }
  }
};

// REJECT A PENDING REQUEST
exports.reject = async (req, res) => {
  const id = getId(req.params.id);

  if (!id) {
    return res.status(400).json({
      error: 'Invalid request ID',
    });
  }

  const reviewerId = getId(req.user?.id);

  if (!reviewerId) {
    return res.status(401).json({
      error: 'Authentication required',
    });
  }

  try {
    const reviewNote =
      typeof req.body?.review_note === 'string'
        ? req.body.review_note.trim() || null
        : null;

    const rejected = await Requests.reject(id, {
      reviewedBy: reviewerId,
      reviewNote,
    });

    if (!rejected) {
      return res.status(409).json({
        error: 'Request not found or already reviewed',
      });
    }

    return res.status(200).json({
      message: 'Request rejected successfully',
      request: rejected,
    });
  } catch (err) {
    console.error('Reject request error:', err);

    return res.status(err.status || 500).json({
      error: err.status ? err.message : 'Failed to reject request',
    });
  }
};

// DELETE A REQUEST PERMANENTLY
exports.remove = async (req, res) => {
  const id = getId(req.params.id);

  if (!id) {
    return res.status(400).json({
      error: 'Invalid request ID',
    });
  }

  try {
    const deleted = await Requests.delete(id);

    if (!deleted) {
      return res.status(404).json({
        error: 'Request not found',
      });
    }

    return res.status(200).json(deleted);
  } catch (err) {
    console.error('Delete request error:', err);

    return res.status(500).json({
      error: 'Failed to delete request',
    });
  }
};
