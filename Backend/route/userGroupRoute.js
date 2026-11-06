
const express = require('express');
const router = express.Router();

const UserGroupController = require('../Controller/userGroupScopeController');
const { protect } = require('../middleware/authMiddleware');

router.use(protect);

// ============================================================
// EMAIL-BASED MEMBER MANAGEMENT
// ============================================================

// Search for an existing church user by email.
router.get(
  '/search',
  UserGroupController.searchByEmail
);

// Add an existing church user to a group using email.
router.post(
  '/by-email',
  UserGroupController.addByEmail
);

// ============================================================
// GROUP MEMBERSHIP
// ============================================================

// Add an existing user to a group.
router.post(
  '/',
  UserGroupController.add
);

// Remove a user from a group.
router.delete(
  '/',
  UserGroupController.remove
);

// ============================================================
// USER GROUPS
// ============================================================

// Fetch all groups belonging to a user.
router.get(
  '/user/:userId',
  UserGroupController.findGroupsByUser
);

// ============================================================
// GROUP MEMBERS
// ============================================================

// Fetch members belonging to a selected group.
router.get(
  '/group/:groupId/members',
  UserGroupController.findMembersByGroup
);

// Existing available-members endpoint.
// Can remain for backward compatibility.
router.get(
  '/available-members',
  UserGroupController.findAvailableMembers
);

// Check whether a user belongs to a group.
router.get(
  '/check',
  UserGroupController.checkAccess
);

module.exports = router;
