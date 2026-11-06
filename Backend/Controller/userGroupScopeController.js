const UserGroup = require('../models/userGroupScopeModel');

const UserGroupController = {
  // Add an existing user to a group.
  async add(req, res) {
    try {
      const userId = Number(req.body.userId);
      const groupId = Number(req.body.groupId);

      if (
        !Number.isInteger(userId) ||
        userId <= 0 ||
        !Number.isInteger(groupId) ||
        groupId <= 0
      ) {
        return res.status(400).json({
          success: false,
          message: 'Valid userId and groupId are required.',
        });
      }

      const added = await UserGroup.add(userId, groupId);

      return res.status(200).json({
        success: true,
        message: added
          ? 'Member added successfully.'
          : 'This user is already a member of the group.',
        alreadyMember: !added,
      });
    } catch (error) {
      console.error('Add group member error:', error);

      return res.status(500).json({
        success: false,
        message: 'Failed to add group member.',
      });
    }
  },

  // Search for a registered user by email.
  async searchByEmail(req, res) {
    try {
      const groupId = Number(req.query.groupId);
      const email = String(req.query.email || '').trim();

      if (
        !Number.isInteger(groupId) ||
        groupId <= 0 ||
        !email
      ) {
        return res.status(400).json({
          success: false,
          message: 'A valid groupId and email are required.',
        });
      }

      const user = await UserGroup.findMemberByEmail(email, groupId);

      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'No registered user was found with that email.',
        });
      }

      return res.status(200).json({
        success: true,
        user,
      });
    } catch (error) {
      console.error('Search user by email error:', error);

      return res.status(500).json({
        success: false,
        message: 'Failed to search for user.',
      });
    }
  },

  // Add a registered user to a group using their email.
  async addByEmail(req, res) {
    try {
      const email = String(req.body.email || '').trim();
      const groupId = Number(req.body.groupId);

      if (
        !email ||
        !Number.isInteger(groupId) ||
        groupId <= 0
      ) {
        return res.status(400).json({
          success: false,
          message: 'Email and a valid groupId are required.',
        });
      }

      const result = await UserGroup.addByEmail(email, groupId);

      if (!result) {
        return res.status(404).json({
          success: false,
          message: 'No registered user was found with that email.',
        });
      }

      return res.status(200).json({
        success: true,
        message: result.alreadyMember
          ? 'This user is already a member of the group.'
          : 'Member added successfully.',
        user: result.user,
        alreadyMember: result.alreadyMember,
      });
    } catch (error) {
      console.error('Add member by email error:', error);

      return res.status(500).json({
        success: false,
        message: 'Failed to add member.',
      });
    }
  },

  // Remove a user from a group.
  async remove(req, res) {
    try {
      const userId = Number(req.params.userId);
      const groupId = Number(req.params.groupId);

      if (
        !Number.isInteger(userId) ||
        userId <= 0 ||
        !Number.isInteger(groupId) ||
        groupId <= 0
      ) {
        return res.status(400).json({
          success: false,
          message: 'Valid userId and groupId are required.',
        });
      }

      const removed = await UserGroup.remove(userId, groupId);

      return res.status(200).json({
        success: true,
        message: removed
          ? 'Member removed successfully.'
          : 'Member was not found in this group.',
      });
    } catch (error) {
      console.error('Remove group member error:', error);

      return res.status(500).json({
        success: false,
        message: 'Failed to remove group member.',
      });
    }
  },

  // Fetch the group IDs belonging to a user.
  async findGroupsByUser(req, res) {
    try {
      const userId = Number(req.params.userId);

      if (!Number.isInteger(userId) || userId <= 0) {
        return res.status(400).json({
          success: false,
          message: 'Valid userId is required.',
        });
      }

      const groupIds = await UserGroup.findGroupIdsByUser(userId);

      return res.status(200).json({
        success: true,
        groupIds,
      });
    } catch (error) {
      console.error('Find user groups error:', error);

      return res.status(500).json({
        success: false,
        message: 'Failed to retrieve user groups.',
      });
    }
  },

  // Fetch members belonging to a group.
  async findMembersByGroup(req, res) {
    try {
      const groupId = Number(req.params.groupId);

      if (!Number.isInteger(groupId) || groupId <= 0) {
        return res.status(400).json({
          success: false,
          message: 'Valid groupId is required.',
        });
      }

      const members = await UserGroup.findMembersByGroupId(groupId);

      return res.status(200).json({
        success: true,
        members,
      });
    } catch (error) {
      console.error('Find group members error:', error);

      return res.status(500).json({
        success: false,
        message: 'Failed to retrieve group members.',
      });
    }
  },

  // Fetch users who are not yet members of a group.
  async findAvailableMembers(req, res) {
    try {
      const groupId = Number(req.query.groupId);

      if (!Number.isInteger(groupId) || groupId <= 0) {
        return res.status(400).json({
          success: false,
          message: 'Valid groupId is required.',
        });
      }

      const members =
        await UserGroup.findAvailableMembersByGroupId(groupId);

      return res.status(200).json({
        success: true,
        members,
      });
    } catch (error) {
      console.error('Find available members error:', error);

      return res.status(500).json({
        success: false,
        message: 'Failed to retrieve available members.',
      });
    }
  },

  // Check whether the logged-in user belongs to a group.
  async checkAccess(req, res) {
    try {
      const groupId = Number(req.params.groupId);
      const userId = Number(req.user.id);

      if (!Number.isInteger(groupId) || groupId <= 0) {
        return res.status(400).json({
          success: false,
          message: 'Valid groupId is required.',
        });
      }

      const hasAccess = await UserGroup.hasGroupAccess(
        userId,
        groupId
      );

      return res.status(200).json({
        success: true,
        hasAccess,
      });
    } catch (error) {
      console.error('Check group access error:', error);

      return res.status(500).json({
        success: false,
        message: 'Failed to check group access.',
      });
    }
  },
};

module.exports = UserGroupController;