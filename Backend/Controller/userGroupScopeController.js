
const UserGroup = require('../models/userGroupScopeModel');

const toPositiveInt = (value) => {
  const parsed = Number(value);
  return Number.isSafeInteger(parsed) && parsed > 0 ? parsed : null;
};

const UserGroupController = {
  // POST /user-groups
  async add(req, res) {
    try {
      const userId = toPositiveInt(req.body?.userId);
      const groupId = toPositiveInt(req.body?.groupId);

      if (!userId || !groupId) {
        return res.status(400).json({
          error: 'userId and groupId are required',
        });
      }

      if (
        req.user.role !== 'super_admin' &&
        req.user.id !== userId
      ) {
        return res.status(403).json({
          error: 'You can only manage your own group membership',
        });
      }

      const added = await UserGroup.add(userId, groupId);

      if (!added) {
        return res.status(409).json({
          error: 'User is already in this group',
        });
      }

      return res.status(201).json({
        message: 'User added to group',
      });
    } catch (err) {
      console.error('userGroup.add error:', err);
      return res.status(500).json({
        error: 'Failed to add user to group',
      });
    }
  },

  // DELETE /user-groups
  async remove(req, res) {
    try {
      const userId = toPositiveInt(req.body?.userId);
      const groupId = toPositiveInt(req.body?.groupId);

      if (!userId || !groupId) {
        return res.status(400).json({
          error: 'userId and groupId are required',
        });
      }

      if (
        req.user.role !== 'super_admin' &&
        req.user.id !== userId
      ) {
        return res.status(403).json({
          error: 'You can only manage your own group membership',
        });
      }

      const removed = await UserGroup.remove(userId, groupId);

      if (!removed) {
        return res.status(404).json({
          error: 'Group membership not found',
        });
      }

      return res.json({
        message: 'User removed from group',
      });
    } catch (err) {
      console.error('userGroup.remove error:', err);
      return res.status(500).json({
        error: 'Failed to remove user from group',
      });
    }
  },

  // GET /user-groups/user/:userId
  async findGroupsByUser(req, res) {
    try {
      const userId = toPositiveInt(req.params.userId);

      if (!userId) {
        return res.status(400).json({
          error: 'Invalid user id',
        });
      }

      if (
        req.user.role !== 'super_admin' &&
        req.user.id !== userId
      ) {
        return res.status(403).json({
          error: 'You can only view your own group memberships',
        });
      }

      const groupIds = await UserGroup.findGroupIdsByUser(userId);

      return res.json({ userId, groupIds });
    } catch (err) {
      console.error('userGroup.findGroupsByUser error:', err);
      return res.status(500).json({
        error: 'Failed to fetch user groups',
      });
    }
  },

  // GET /user-groups/group/:groupId/members
  async findMembersByGroup(req, res) {
    try {
      const groupId = toPositiveInt(req.params.groupId);

      if (!groupId) {
        return res.status(400).json({
          error: 'Invalid group id',
        });
      }

      const members = await UserGroup.findMembersByGroupId(groupId);

      return res.json(members);
    } catch (err) {
      console.error('userGroup.findMembersByGroup error:', err);
      return res.status(500).json({
        error: 'Failed to fetch group members',
      });
    }
  },

  // GET /user-groups/check
  async checkAccess(req, res) {
    try {
      const userId = toPositiveInt(req.query.userId);
      const groupId = toPositiveInt(req.query.groupId);

      if (!userId || !groupId) {
        return res.status(400).json({
          error: 'userId and groupId are required',
        });
      }

      if (
        req.user.role !== 'super_admin' &&
        req.user.id !== userId
      ) {
        return res.status(403).json({
          error: 'You can only check your own group membership',
        });
      }

      const hasAccess = await UserGroup.hasGroupAccess(userId, groupId);

      return res.json({ userId, groupId, hasAccess });
    } catch (err) {
      console.error('userGroup.checkAccess error:', err);
      return res.status(500).json({
        error: 'Failed to check group membership',
      });
    }
  },
};

module.exports = UserGroupController;
