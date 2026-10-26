
const bcrypt = require('bcryptjs');
const pool = require('../Config/db');
const GroupsModel = require('../models/groupsModel');
const User = require('../models/usersModel');
const UserGroup = require('../models/userGroupScopeModel');
const Permission = require('../models/permissionModel');

const MAX_INT = 2147483647;
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const ALLOWED_ROLES = ['group_leader', 'assistant_leader', 'member'];

// Accepts 5 or "5". Returns a positive integer, or null if invalid.
const toId = (value) => {
  const n =
    typeof value === 'string' && /^\d+$/.test(value) ? Number(value) : value;

  return Number.isInteger(n) && n > 0 && n <= MAX_INT ? n : null;
};

const isBlank = (value) =>
  value === undefined || value === null || value === '';

const ownedNames = async (req) => {
  if (!Array.isArray(req.user.permissions)) {
    req.user.permissions = await Permission.findNamesByUserId(req.user.id);
  }

  return req.user.permissions;
};

const GroupsController = {
  // POST /groups (group only, optional existing leader)
  async create(req, res) {
    try {
      const { name, type, location, description, parentGroupId, leaderId } =
        req.body;

      if (!req.user || !req.user.id) {
        return res.status(401).json({ error: 'Authentication required' });
      }

      if (!name || !type) {
        return res.status(400).json({
          error: 'name and type are required',
        });
      }

      let normalizedParentId = null;

      if (!isBlank(parentGroupId)) {
        normalizedParentId = toId(parentGroupId);

        if (!normalizedParentId) {
          return res.status(400).json({
            error: 'Invalid parentGroupId',
          });
        }

        if (!(await GroupsModel.findById(normalizedParentId))) {
          return res.status(404).json({
            error: 'Parent group not found',
          });
        }
      }

      let normalizedLeaderId = null;

      if (!isBlank(leaderId)) {
        normalizedLeaderId = toId(leaderId);

        if (!normalizedLeaderId) {
          return res.status(400).json({
            error: 'Invalid leaderId',
          });
        }

        if (!(await User.findById(normalizedLeaderId))) {
          return res.status(404).json({
            error: 'Leader not found',
          });
        }
      }

      const group = await GroupsModel.create({
        name: String(name).trim(),
        type: String(type).trim().toLowerCase(),
        location,
        description,
        parentGroupId: normalizedParentId,
        leaderId: normalizedLeaderId,
        createdBy: req.user.id,
      });

      return res.status(201).json(group);
    } catch (err) {
      console.error('create group error:', err);
      return res.status(500).json({
        error: 'Failed to create group',
      });
    }
  },

  // POST /groups/with-leader
  // One transaction: users + groups + user_groups + user_permissions.
  async createWithLeader(req, res) {
    if (!req.user || !req.user.id) {
      return res.status(401).json({
        error: 'Authentication required',
      });
    }

    const {
      fullName,
      email,
      password,
      confirmPassword,
      phoneNumber,
      role,
      groupName,
      type,
      location,
      description,
      parentGroupId,
      permissionIds,
    } = req.body;

    // Validation
    if (!fullName || !email || !password || !confirmPassword) {
      return res.status(400).json({
        error: 'User fields are required',
      });
    }

    if (!groupName || !type) {
      return res.status(400).json({
        error: 'Group name and type are required',
      });
    }

    if (!emailRegex.test(String(email).trim())) {
      return res.status(400).json({
        error: 'Invalid email address',
      });
    }

    if (password !== confirmPassword) {
      return res.status(400).json({
        error: 'Passwords do not match',
      });
    }

    if (password.length < 8) {
      return res.status(400).json({
        error: 'Password must be at least 8 characters',
      });
    }

    if (!ALLOWED_ROLES.includes(role)) {
      return res.status(400).json({
        error: `Role must be one of: ${ALLOWED_ROLES.join(', ')}`,
      });
    }

    // The route middleware already checked create_<type> for this type.
    const groupType = String(type).trim().toLowerCase();

    let normalizedParentId = null;

    if (!isBlank(parentGroupId)) {
      normalizedParentId = toId(parentGroupId);

      if (!normalizedParentId) {
        return res.status(400).json({
          error: 'Invalid parentGroupId',
        });
      }
    }

    // permissionIds: optional list of valid IDs.
    let ids = [];

    if (permissionIds !== undefined && permissionIds !== null) {
      if (!Array.isArray(permissionIds)) {
        return res.status(400).json({
          error: 'permissionIds must be an array',
        });
      }

      ids = [...new Set(permissionIds.map(toId))];

      if (ids.includes(null)) {
        return res.status(400).json({
          error: 'permissionIds must contain valid permission ids',
        });
      }
    }

    const normalizedEmail = String(email).trim().toLowerCase();

    // Database checks
    try {
      if (
        normalizedParentId &&
        !(await GroupsModel.findById(normalizedParentId))
      ) {
        return res.status(404).json({
          error: 'Parent group not found',
        });
      }

      if (ids.length > 0) {
        const found = await Permission.findByIds(ids);

        if (found.length !== ids.length) {
          return res.status(400).json({
            error: 'One or more permissions do not exist',
          });
        }

        // Only super_admin may grant permissions they do not hold.
        if (req.user.role !== 'super_admin') {
          const owned = await ownedNames(req);

          if (found.some((p) => !owned.includes(p.name))) {
            return res.status(403).json({
              error: 'You can only assign permissions that you hold yourself',
            });
          }
        }
      }

      if (await User.findByEmail(normalizedEmail)) {
        return res.status(409).json({
          error: 'Email already exists',
        });
      }
    } catch (err) {
      console.error('createWithLeader check error:', err);
      return res.status(500).json({
        error: 'Failed to create group leader',
      });
    }

    // Hash the password before opening the transaction.
    let passwordHash;

    try {
      passwordHash = await bcrypt.hash(password, 10);
    } catch (hashErr) {
      console.error('hash error:', hashErr);
      return res.status(500).json({
        error: 'Failed to create group leader',
      });
    }

    // Transaction
    const client = await pool.connect();

    try {
      await client.query('BEGIN');

      // 1. Create user.
      const userResult = await client.query(
        `INSERT INTO users
           (full_name, email, password, role, phone_number)
         VALUES ($1, $2, $3, $4, $5)
         RETURNING id, full_name, email, role, phone_number, created_at`,
        [
          String(fullName).trim(),
          normalizedEmail,
          passwordHash,
          role,
          phoneNumber || null,
        ]
      );

      const user = userResult.rows[0];

      // 2. Create group.
      const groupResult = await client.query(
        `INSERT INTO groups
           (name, type, location, description, parent_group_id, leader_id, created_by)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         RETURNING *`,
        [
          String(groupName).trim(),
          groupType,
          location || null,
          description || null,
          normalizedParentId,
          user.id,
          req.user.id,
        ]
      );

      const group = groupResult.rows[0];

      // 3. Add user to group.
      await UserGroup.add(user.id, group.id, client);

      // 4. Assign permissions using the same transaction.
      if (ids.length > 0) {
        await Permission.assignToUser(user.id, ids, client);
      }

      await client.query('COMMIT');

      return res.status(201).json({
        user,
        group,
      });
    } catch (err) {
      await client.query('ROLLBACK').catch(() => {});
      console.error('createWithLeader error:', err);

      if (err.code === '23505') {
        const isEmail = String(err.constraint || '')
          .toLowerCase()
          .includes('email');

        return res.status(409).json({
          error: isEmail
            ? 'Email already exists'
            : 'A group with this name and type already exists here',
        });
      }

      if (err.code === '23503') {
        return res.status(400).json({
          error: 'A referenced group or permission no longer exists',
        });
      }

      return res.status(500).json({
        error: 'Failed to create group leader',
      });
    } finally {
      client.release();
    }
  },

  // GET /groups
  async findAll(req, res) {
    try {
      const groups = await GroupsModel.findAll();
      return res.json(groups);
    } catch (err) {
      console.error('findAll groups error:', err);
      return res.status(500).json({
        error: 'Failed to fetch groups',
      });
    }
  },

  // GET /groups/parents
  async findParents(req, res) {
    try {
      const groups = await GroupsModel.findParents();
      return res.json(groups);
    } catch (err) {
      console.error('findParents error:', err);
      return res.status(500).json({
        error: 'Failed to fetch parent groups',
      });
    }
  },

  // GET /groups/:id
  async findById(req, res) {
    try {
      const groupId = toId(req.params.id);

      if (!groupId) {
        return res.status(400).json({
          error: 'Invalid group id',
        });
      }

      const group = await GroupsModel.findById(groupId);

      if (!group) {
        return res.status(404).json({
          error: 'Group not found',
        });
      }

      return res.json(group);
    } catch (err) {
      console.error('findById error:', err);
      return res.status(500).json({
        error: 'Failed to fetch group',
      });
    }
  },

  // GET /groups/:id/children
  async findChildren(req, res) {
    try {
      const groupId = toId(req.params.id);

      if (!groupId) {
        return res.status(400).json({
          error: 'Invalid group id',
        });
      }

      const children = await GroupsModel.findChildren(groupId);
      return res.json(children);
    } catch (err) {
      console.error('findChildren error:', err);
      return res.status(500).json({
        error: 'Failed to fetch children',
      });
    }
  },

  // DELETE /groups/:id
  async delete(req, res) {
    try {
      if (!req.user || !req.user.id) {
        return res.status(401).json({
          error: 'Authentication required',
        });
      }

      const groupId = toId(req.params.id);

      if (!groupId) {
        return res.status(400).json({
          error: 'Invalid group id',
        });
      }

      const group = await GroupsModel.delete(groupId);

      if (!group) {
        return res.status(404).json({
          error: 'Group not found',
        });
      }

      return res.json({
        message: 'Group deleted successfully',
        group,
      });
    } catch (err) {
      console.error('delete group error:', err);

      if (err.code === '23503') {
        return res.status(409).json({
          error:
            'Cannot delete this group because it is referenced by other records',
        });
      }

      return res.status(500).json({
        error: 'Failed to delete group',
      });
    }
  },
};

module.exports = GroupsController;
