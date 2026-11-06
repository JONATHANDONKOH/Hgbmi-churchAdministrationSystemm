const GroupDutiesModel = require('../models/groupDutiesModel');
const GroupHierarchy = require('../models/groupHierarchyModel');
const UserGroup = require('../models/userGroupScopeModel');
const pool = require('../Config/db');

const validDutyTypes = ['leadership', 'functional'];
const validGroupTypes = ['department', 'ministry'];

const GroupDutiesController = {
  // Validate that the group exists and is a department or ministry.
  async validateDutyGroup(groupId) {
    const { rows } = await pool.query(
      `SELECT id, name, type
       FROM groups
       WHERE id = $1`,
      [groupId]
    );

    if (!rows.length) {
      return null;
    }

    if (!validGroupTypes.includes(rows[0].type)) {
      return null;
    }

    return rows[0];
  },

  // CREATE A DUTY WITHOUT ASSIGNING IT.
  async createDuty(req, res) {
    try {
      const { groupId } = req.params;
      const loggedInUserId = req.user.id;

      const {
        dutyName,
        dutyType,
        description,
      } = req.body;

      if (!dutyName || !dutyType) {
        return res.status(400).json({
          success: false,
          message: 'Duty name and duty type are required.',
        });
      }

      if (!validDutyTypes.includes(dutyType)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid duty type.',
        });
      }

      const group = await GroupDutiesController.validateDutyGroup(groupId);

      if (!group) {
        return res.status(404).json({
          success: false,
          message: 'Department or ministry not found.',
        });
      }

      const canManage = await GroupHierarchy.canManageGroup(
        loggedInUserId,
        groupId
      );

      if (!canManage) {
        return res.status(403).json({
          success: false,
          message: 'You are not allowed to manage duties in this group.',
        });
      }

      const duty = await GroupDutiesModel.createDuty({
        groupId,
        dutyName: dutyName.trim(),
        dutyType,
        description: description || null,
        createdBy: loggedInUserId,
      });

      return res.status(201).json({
        success: true,
        message: 'Duty created successfully.',
        duty,
      });
    } catch (error) {
      console.error('Create duty error:', error);

      return res.status(500).json({
        success: false,
        message: 'Failed to create duty.',
      });
    }
  },

  // CREATE A DUTY AND ASSIGN IT TO A MEMBER IN ONE TRANSACTION.
  async createAndAssignDuty(req, res) {
    try {
      const { groupId } = req.params;
      const loggedInUserId = req.user.id;

      const {
        email,
        userId,
        dutyName,
        dutyType,
        description,
      } = req.body;

      if (!dutyName || !dutyType || (!email && !userId)) {
        return res.status(400).json({
          success: false,
          message: 'Duty name, duty type and a member are required.',
        });
      }

      if (!validDutyTypes.includes(dutyType)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid duty type.',
        });
      }

      const group = await GroupDutiesController.validateDutyGroup(groupId);

      if (!group) {
        return res.status(404).json({
          success: false,
          message: 'Department or ministry not found.',
        });
      }

      const canManage = await GroupHierarchy.canManageGroup(
        loggedInUserId,
        groupId
      );

      if (!canManage) {
        return res.status(403).json({
          success: false,
          message: 'You are not allowed to manage duties in this group.',
        });
      }

      let targetUserId = userId;

      if (email) {
        const member = await UserGroup.findMemberByEmail(
          email.trim(),
          groupId
        );

        if (!member || !member.is_member) {
          return res.status(400).json({
            success: false,
            message: 'This user is not a member of the selected group.',
          });
        }

        targetUserId = member.id;
      }

      const result = await GroupDutiesModel.createAndAssignDuty({
        groupId,
        userId: targetUserId,
        dutyName: dutyName.trim(),
        dutyType,
        description: description || null,
        createdBy: loggedInUserId,
        assignedBy: loggedInUserId,
      });

      if (!result) {
        return res.status(400).json({
          success: false,
          message: 'The selected user must belong to this group.',
        });
      }

      return res.status(201).json({
        success: true,
        message: 'Duty created and assigned successfully.',
        duty: result.duty,
        assignment: result.assignment,
      });
    } catch (error) {
      console.error('Create and assign duty error:', error);

      return res.status(500).json({
        success: false,
        message: 'Failed to create and assign duty.',
      });
    }
  },

  // VIEW ALL DUTIES IN A GROUP.
  // No canViewGroup restriction: authenticated users can view.
  async findDutiesByGroup(req, res) {
    try {
      const { groupId } = req.params;

      const group = await GroupDutiesController.validateDutyGroup(groupId);

      if (!group) {
        return res.status(404).json({
          success: false,
          message: 'Department or ministry not found.',
        });
      }

      const duties = await GroupDutiesModel.findDutiesByGroup(groupId);

      return res.status(200).json({
        success: true,
        duties,
      });
    } catch (error) {
      console.error('Find duties by group error:', error);

      return res.status(500).json({
        success: false,
        message: 'Failed to fetch group duties.',
      });
    }
  },

  // UPDATE A DUTY.
  async updateDuty(req, res) {
    try {
      const { groupId, dutyId } = req.params;
      const loggedInUserId = req.user.id;

      const {
        dutyName,
        dutyType,
        description,
      } = req.body;

      if (dutyType && !validDutyTypes.includes(dutyType)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid duty type.',
        });
      }

      const group = await GroupDutiesController.validateDutyGroup(groupId);

      if (!group) {
        return res.status(404).json({
          success: false,
          message: 'Department or ministry not found.',
        });
      }

      const canManage = await GroupHierarchy.canManageGroup(
        loggedInUserId,
        groupId
      );

      if (!canManage) {
        return res.status(403).json({
          success: false,
          message: 'You are not allowed to manage duties in this group.',
        });
      }

      const existingDuty = await GroupDutiesModel.findDutyById(
        dutyId,
        groupId
      );

      if (!existingDuty) {
        return res.status(404).json({
          success: false,
          message: 'Duty not found.',
        });
      }

      const duty = await GroupDutiesModel.updateDuty(
        dutyId,
        groupId,
        {
          dutyName,
          dutyType,
          description,
        }
      );

      return res.status(200).json({
        success: true,
        message: 'Duty updated successfully.',
        duty,
      });
    } catch (error) {
      console.error('Update duty error:', error);

      return res.status(500).json({
        success: false,
        message: 'Failed to update duty.',
      });
    }
  },

  // DELETE A DUTY.
  async deleteDuty(req, res) {
    try {
      const { groupId, dutyId } = req.params;
      const loggedInUserId = req.user.id;

      const group = await GroupDutiesController.validateDutyGroup(groupId);

      if (!group) {
        return res.status(404).json({
          success: false,
          message: 'Department or ministry not found.',
        });
      }

      const canManage = await GroupHierarchy.canManageGroup(
        loggedInUserId,
        groupId
      );

      if (!canManage) {
        return res.status(403).json({
          success: false,
          message: 'You are not allowed to manage duties in this group.',
        });
      }

      const existingDuty = await GroupDutiesModel.findDutyById(
        dutyId,
        groupId
      );

      if (!existingDuty) {
        return res.status(404).json({
          success: false,
          message: 'Duty not found.',
        });
      }

      await GroupDutiesModel.deleteDuty(dutyId, groupId);

      return res.status(200).json({
        success: true,
        message: 'Duty deleted successfully.',
      });
    } catch (error) {
      console.error('Delete duty error:', error);

      return res.status(500).json({
        success: false,
        message: 'Failed to delete duty.',
      });
    }
  },

  // ASSIGN AN EXISTING DUTY TO A MEMBER.
  async assignDuty(req, res) {
    try {
      const { groupId } = req.params;
      const loggedInUserId = req.user.id;

      const { userId, dutyId } = req.body;

      if (!userId || !dutyId) {
        return res.status(400).json({
          success: false,
          message: 'User ID and duty ID are required.',
        });
      }

      const group = await GroupDutiesController.validateDutyGroup(groupId);

      if (!group) {
        return res.status(404).json({
          success: false,
          message: 'Department or ministry not found.',
        });
      }

      const canManage = await GroupHierarchy.canManageGroup(
        loggedInUserId,
        groupId
      );

      if (!canManage) {
        return res.status(403).json({
          success: false,
          message: 'You are not allowed to manage duties in this group.',
        });
      }

      const isMember = await UserGroup.hasGroupAccess(userId, groupId);

      if (!isMember) {
        return res.status(400).json({
          success: false,
          message: 'The selected user is not a member of this group.',
        });
      }

      const duty = await GroupDutiesModel.findDutyById(
        dutyId,
        groupId
      );

      if (!duty) {
        return res.status(404).json({
          success: false,
          message: 'Duty not found in this group.',
        });
      }

      const assignment = await GroupDutiesModel.assignDuty({
        userId,
        groupId,
        dutyId,
        assignedBy: loggedInUserId,
      });

      return res.status(201).json({
        success: true,
        message: 'Duty assigned successfully.',
        assignment,
      });
    } catch (error) {
      console.error('Assign duty error:', error);

      return res.status(500).json({
        success: false,
        message: 'Failed to assign duty.',
      });
    }
  },

  // VIEW ALL DUTY ASSIGNMENTS IN A GROUP.
  // No canViewGroup restriction: authenticated users can view.
  async findAssignmentsByGroup(req, res) {
    try {
      const { groupId } = req.params;

      const group = await GroupDutiesController.validateDutyGroup(groupId);

      if (!group) {
        return res.status(404).json({
          success: false,
          message: 'Department or ministry not found.',
        });
      }

      const assignments =
        await GroupDutiesModel.findAssignmentsByGroup(groupId);

      return res.status(200).json({
        success: true,
        assignments,
      });
    } catch (error) {
      console.error('Find group assignments error:', error);

      return res.status(500).json({
        success: false,
        message: 'Failed to fetch group assignments.',
      });
    }
  },

  // VIEW A MEMBER'S DUTY ASSIGNMENTS.
  // No canViewGroup restriction: authenticated users can view.
  async findAssignmentsByMember(req, res) {
    try {
      const { groupId, userId } = req.params;

      const group = await GroupDutiesController.validateDutyGroup(groupId);

      if (!group) {
        return res.status(404).json({
          success: false,
          message: 'Department or ministry not found.',
        });
      }

      const assignments =
        await GroupDutiesModel.findAssignmentsByMember(
          userId,
          groupId
        );

      return res.status(200).json({
        success: true,
        assignments,
      });
    } catch (error) {
      console.error('Find member assignments error:', error);

      return res.status(500).json({
        success: false,
        message: 'Failed to fetch member duty assignments.',
      });
    }
  },

  // REMOVE A DUTY ASSIGNMENT.
  async removeAssignment(req, res) {
    try {
      const { groupId, assignmentId } = req.params;
      const loggedInUserId = req.user.id;

      const group = await GroupDutiesController.validateDutyGroup(groupId);

      if (!group) {
        return res.status(404).json({
          success: false,
          message: 'Department or ministry not found.',
        });
      }

      const canManage = await GroupHierarchy.canManageGroup(
        loggedInUserId,
        groupId
      );

      if (!canManage) {
        return res.status(403).json({
          success: false,
          message: 'You are not allowed to manage duties in this group.',
        });
      }

      await GroupDutiesModel.removeAssignment(
        assignmentId,
        groupId
      );

      return res.status(200).json({
        success: true,
        message: 'Duty assignment removed successfully.',
      });
    } catch (error) {
      console.error('Remove duty assignment error:', error);

      return res.status(500).json({
        success: false,
        message: 'Failed to remove duty assignment.',
      });
    }
  },
};

module.exports = GroupDutiesController;