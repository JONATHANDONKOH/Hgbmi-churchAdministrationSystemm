
const express = require('express');
const router = express.Router();

const GroupDutiesController = require('../Controller/groupDutiesController');
const { protect } = require('../middleware/authMiddleware');

// Protect every route in this router.
router.use(protect);

// ============================================================
// GROUP DUTIES
// ============================================================

// Create a duty.
router.post(
  '/groups/:groupId',
  GroupDutiesController.createDuty
);

// Create a duty and assign it to a member in one request.
// Supports email-based member lookup and automatic group membership.
router.post(
  '/groups/:groupId/create-and-assign',
  GroupDutiesController.createAndAssignDuty
);

// Fetch duties belonging to a group.
router.get(
  '/groups/:groupId',
  GroupDutiesController.findDutiesByGroup
);

// Update a duty.
router.put(
  '/groups/:groupId/:dutyId',
  GroupDutiesController.updateDuty
);

// Delete a duty.
router.delete(
  '/groups/:groupId/:dutyId',
  GroupDutiesController.deleteDuty
);

// ============================================================
// DUTY ASSIGNMENTS
// ============================================================

// Assign an existing duty to a group member.
router.post(
  '/groups/:groupId/assignments',
  GroupDutiesController.assignDuty
);

// Fetch all duty assignments belonging to a group.
router.get(
  '/groups/:groupId/assignments',
  GroupDutiesController.findAssignmentsByGroup
);

// Fetch one member's duties within a specific group.
router.get(
  '/groups/:groupId/members/:userId',
  GroupDutiesController.findAssignmentsByMember
);

// Remove a duty assignment.
router.delete(
  '/groups/:groupId/assignments/:assignmentId',
  GroupDutiesController.removeAssignment
);

module.exports = router;
