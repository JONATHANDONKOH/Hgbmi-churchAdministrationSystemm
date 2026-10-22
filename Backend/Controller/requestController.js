
const pool = require('../Config/db');
const bcrypt = require('bcryptjs');

const Groups = require('../models/groupsModel');
const User = require('../models/usersModel');
const UserGroup = require('../models/userGroupScopeModel');
const Requests = require('../models/requestModel');

const REQUEST_TYPES = ['user', 'leader_assignment', 'event'];

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

// Validate and normalize request data.
const validateRequestData = (type, data) => {
  if (!data || typeof data !== 'object' || Array.isArray(data)) {
    throw new HttpError(400, 'request_data must be an object');
  }

  // New member request.
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

  // Leadership assignment for an existing group member.
  if (type === 'leader_assignment') {
    const targetId = getId(data.target_user_id);

    const requestedRole =
      typeof data.requested_role === 'string'
        ? data.requested_role.trim().toLowerCase()
        : '';

    if (!targetId || !requestedRole) {
      throw new HttpError(
        400,
        'target_user_id and requested_role are required'
      );
    }

    // Accept any non-empty role entered by the requester.
    return {
      data: {
        target_user_id: targetId,
        requested_role: requestedRole,
      },
    };
  }

  // Event request.
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

    if (
      data.location != null &&
      typeof data.location !== 'string'
    ) {
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

// Submit a member, leadership-assignment, or event request.
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

    // Superadmins may submit for any group.
    // Other submitters must be authorized leaders in the group.
    if (req.user.role !== 'super_admin') {
      const allowedRoles = ['group_leader', 'assistant_leader'];

      if (
        !allowedRoles.includes(req.user.role) ||
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

    // Membership request handling.
    if (type === 'user') {
      const existingUser = await User.findByEmail(data.email);

      if (existingUser) {
        throw new HttpError(409, 'Email already exists');
      }

      passwordHash = await bcrypt.hash(validated.password, 10);
    }

    // Leadership assignment: selected user must exist and
    // already belong to the selected group.
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

// List requests. Protect this endpoint with administrator
// or view_requests permission middleware.
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

    // Lock the request to prevent concurrent approvals.
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

    // Approve a new membership request.
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
    }

    // Approve a leadership assignment.
    else if (request.request_type === 'leader_assignment') {
      const data = request.request_data;
      const targetId = getId(data?.target_user_id);

      const requestedRole =
        typeof data?.requested_role === 'string'
          ? data.requested_role.trim().toLowerCase()
          : '';

      // Validate the stored request again during approval.
      if (!targetId || !requestedRole) {
        throw new HttpError(
          400,
          'Invalid leadership assignment request data'
        );
      }

      const target = await User.findById(targetId, client);

      if (!target) {
        throw new HttpError(404, 'Selected user not found');
      }

      // Ensure the target still belongs to the requested group.
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

      // Change users.role only after approval.
      const updatedUser = await User.updateRole(
        targetId,
        requestedRole,
        client
      );

      if (!updatedUser) {
        throw new HttpError(404, 'Failed to update user role');
      }
    }

    // Event approval is not implemented yet.
    else if (request.request_type === 'event') {
      throw new HttpError(
        501,
        'Event approval is not implemented yet'
      );
    } else {
      throw new HttpError(400, 'Unsupported request type');
    }

    // Update request status within the same transaction.
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
