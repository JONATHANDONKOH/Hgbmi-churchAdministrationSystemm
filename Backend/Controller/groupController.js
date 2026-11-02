
const bcrypt = require('bcryptjs');
const pool = require('../Config/db');

const GroupsModel = require('../models/groupsModel');
const User = require('../models/usersModel');
const UserGroup = require('../models/userGroupScopeModel');
const GroupHierarchy = require('../models/groupHierarchyModel');

const MAX_INT = 2147483647;
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const ALLOWED_ROLES = [
  'group_leader',
  'assistant_leader',
  'member',
];

const toId = (value) => {
  const n =
    typeof value === 'string' && /^\d+$/.test(value)
      ? Number(value)
      : value;

  return Number.isInteger(n) && n > 0 && n <= MAX_INT ? n : null;
};

const isBlank = (value) =>
  value === undefined || value === null || value === '';

const isAdmin = (user) =>
  user && ['super_admin', 'admin'].includes(user.role);

// Get all groups visible to the authenticated user.
// Admins and super admins can see all groups.
const getVisibleGroupIds = async (user) => {
  if (!user || !user.id) {
    throw new Error('Authenticated user information is missing');
  }

  if (isAdmin(user)) {
    return null;
  }

  return GroupHierarchy.getAccessibleGroupIds(user.id);
};

// Filter groups using the user's accessible group IDs.
const filterAccessibleGroups = (groups, accessibleIds) => {
  if (accessibleIds === null) {
    return groups;
  }

  const accessibleSet = new Set(
    (accessibleIds || []).map(Number)
  );

  return groups.filter((group) =>
    accessibleSet.has(Number(group.id))
  );
};

const GroupsController = {

  // POST /groups
  // Create a group, optionally under an existing parent.
  async create(req, res) {
    try {
      if (!req.user || !req.user.id) {
        return res.status(401).json({
          error: 'Authentication required',
        });
      }

      const {
        name,
        type,
        location,
        description,
        parentGroupId,
        leaderId,
      } = req.body;

      if (!name || !type) {
        return res.status(400).json({
          error: 'name and type are required',
        });
      }

      const normalizedName = String(name).trim();
      const normalizedType = String(type).trim().toLowerCase();

      if (!normalizedName || !normalizedType) {
        return res.status(400).json({
          error: 'A valid group name and type are required',
        });
      }

      let normalizedParentId = null;

      // Validate parent group and creator's authority.
      if (!isBlank(parentGroupId)) {
        normalizedParentId = toId(parentGroupId);

        if (!normalizedParentId) {
          return res.status(400).json({
            error: 'Invalid parentGroupId',
          });
        }

        const parentGroup = await GroupsModel.findById(
          normalizedParentId
        );

        if (!parentGroup) {
          return res.status(404).json({
            error: 'Parent group not found',
          });
        }

        const canCreate =
          await GroupHierarchy.canCreateUnderParent(
            req.user,
            normalizedParentId
          );

        if (!canCreate) {
          return res.status(403).json({
            error: 'You are not authorized to create a group under this parent',
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

        const leader = await User.findById(normalizedLeaderId);

        if (!leader) {
          return res.status(404).json({
            error: 'Leader not found',
          });
        }
      }

      const group = await GroupsModel.create({
        name: normalizedName,
        type: normalizedType,
        location: location || null,
        description: description || null,
        parentGroupId: normalizedParentId,
        leaderId: normalizedLeaderId,
        createdBy: req.user.id,
      });

      return res.status(201).json(group);

    } catch (err) {
      console.error('CREATE GROUP ERROR:', err);

      return res.status(500).json({
        error: 'Failed to create group',
      });
    }
  },


  // POST /groups/with-leader
  // Creates a user and their group in one transaction.
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
    } = req.body;

    // Validate user information.
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

    const normalizedEmail = String(email).trim().toLowerCase();
    const normalizedName = String(groupName).trim();
    const groupType = String(type).trim().toLowerCase();

    if (!normalizedName || !groupType) {
      return res.status(400).json({
        error: 'A valid group name and type are required',
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
    }

    // Validate parent group and authority.
    try {
      if (normalizedParentId) {
        const parentGroup = await GroupsModel.findById(
          normalizedParentId
        );

        if (!parentGroup) {
          return res.status(404).json({
            error: 'Parent group not found',
          });
        }

        const canCreate =
          await GroupHierarchy.canCreateUnderParent(
            req.user,
            normalizedParentId
          );

        if (!canCreate) {
          return res.status(403).json({
            error: 'You are not authorized to create a group under this parent',
          });
        }
      }

      const existingUser = await User.findByEmail(normalizedEmail);

      if (existingUser) {
        return res.status(409).json({
          error: 'Email already exists',
        });
      }

    } catch (err) {
      console.error('CREATE WITH LEADER VALIDATION ERROR:', err);

      return res.status(500).json({
        error: 'Failed to validate group creation',
      });
    }

    // Hash password before opening the transaction.
    let passwordHash;

    try {
      passwordHash = await bcrypt.hash(password, 10);
    } catch (err) {
      console.error('PASSWORD HASH ERROR:', err);

      return res.status(500).json({
        error: 'Failed to create group leader',
      });
    }

    const client = await pool.connect();

    try {
      await client.query('BEGIN');

      // 1. Create the new user.
      const userResult = await client.query(
        `INSERT INTO users (
           full_name,
           email,
           password,
           role,
           phone_number
         )
         VALUES ($1, $2, $3, $4, $5)
         RETURNING
           id,
           full_name,
           email,
           role,
           phone_number,
           created_at`,
        [
          String(fullName).trim(),
          normalizedEmail,
          passwordHash,
          role,
          phoneNumber || null,
        ]
      );

      const user = userResult.rows[0];

      // 2. Create the group.
      const groupResult = await client.query(
        `INSERT INTO groups (
           name,
           type,
           location,
           description,
           parent_group_id,
           leader_id,
           created_by
         )
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         RETURNING *`,
        [
          normalizedName,
          groupType,
          location || null,
          description || null,
          normalizedParentId,
          user.id,
          req.user.id,
        ]
      );

      const group = groupResult.rows[0];

      // 3. Add the new leader to their own group.
      // Pass the transaction client to UserGroup.add.
      await UserGroup.add(user.id, group.id, client);

      await client.query('COMMIT');

      return res.status(201).json({
        message: 'User and group created successfully',
        user,
        group,
      });

    } catch (err) {
      await client.query('ROLLBACK').catch(() => {});

      console.error('CREATE WITH LEADER ERROR:', err);

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
          error: 'A referenced group no longer exists',
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
  // Returns the user's own groups and all their descendants.
  async findAll(req, res) {
    try {
      if (!req.user || !req.user.id) {
        return res.status(401).json({
          error: 'Authentication required',
        });
      }

      const accessibleIds = await getVisibleGroupIds(req.user);

      const groups = await GroupsModel.findAll();

      return res.json(
        filterAccessibleGroups(groups, accessibleIds)
      );

    } catch (err) {
      console.error('FIND ALL GROUPS ERROR:', {
        message: err.message,
        code: err.code,
        detail: err.detail,
        stack: err.stack,
      });

      return res.status(500).json({
        error: 'Failed to fetch groups',
      });
    }
  },


  // GET /groups/parents
  // Returns accessible root groups.
  async findParents(req, res) {
    try {
      if (!req.user || !req.user.id) {
        return res.status(401).json({
          error: 'Authentication required',
        });
      }

      const accessibleIds = await getVisibleGroupIds(req.user);

      const groups = await GroupsModel.findParents();

      return res.json(
        filterAccessibleGroups(groups, accessibleIds)
      );

    } catch (err) {
      console.error('FIND PARENTS ERROR:', err);

      return res.status(500).json({
        error: 'Failed to fetch parent groups',
      });
    }
  },


  // GET /groups/:id
  // Returns a group only if it belongs to the user's hierarchy.
  async findById(req, res) {
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

      const group = await GroupsModel.findById(groupId);

      if (!group) {
        return res.status(404).json({
          error: 'Group not found',
        });
      }

      const canView = await GroupHierarchy.canViewGroup(
        req.user,
        groupId
      );

      if (!canView) {
        return res.status(403).json({
          error: 'You are not authorized to view this group',
        });
      }

      return res.json(group);

    } catch (err) {
      console.error('FIND GROUP BY ID ERROR:', err);

      return res.status(500).json({
        error: 'Failed to fetch group',
      });
    }
  },


  // GET /groups/:id/children
  // Returns direct children of an accessible group.
  async findChildren(req, res) {
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

      const parentGroup = await GroupsModel.findById(groupId);

      if (!parentGroup) {
        return res.status(404).json({
          error: 'Parent group not found',
        });
      }

      const canViewParent = await GroupHierarchy.canViewGroup(
        req.user,
        groupId
      );

      if (!canViewParent) {
        return res.status(403).json({
          error: 'You are not authorized to view this group',
        });
      }

      const children = await GroupsModel.findChildren(groupId);

      const accessibleIds = await getVisibleGroupIds(req.user);

      return res.json(
        filterAccessibleGroups(children, accessibleIds)
      );

    } catch (err) {
      console.error('FIND CHILDREN ERROR:', err);

      return res.status(500).json({
        error: 'Failed to fetch child groups',
      });
    }
  },


  // DELETE /groups/:id
  // Only the creator, assigned leader, admin or super admin can delete.
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

      const group = await GroupsModel.findById(groupId);

      if (!group) {
        return res.status(404).json({
          error: 'Group not found',
        });
      }

      const canManage = await GroupHierarchy.canManageGroup(
        req.user,
        groupId
      );

      if (!canManage) {
        return res.status(403).json({
          error: 'You are not authorized to delete this group',
        });
      }

      const deletedGroup = await GroupsModel.delete(groupId);

      if (!deletedGroup) {
        return res.status(404).json({
          error: 'Group not found',
        });
      }

      return res.json({
        message: 'Group deleted successfully',
        group: deletedGroup,
      });

    } catch (err) {
      console.error('DELETE GROUP ERROR:', err);

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
