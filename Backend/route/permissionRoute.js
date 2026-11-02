
const express = require('express');
const router = express.Router();

const permission = require('../Controller/permissionController');

const { protect } = require('../middleware/authMiddleware');
const { restrictTo } = require('../middleware/roleMiddleware');
const { requirePermission } = require('../middleware/permissionMiddleware');

// Fetch permissions belonging to the logged-in user.
router.get(
  '/mine',
  protect,
  permission.getMyPermissions
);

// Permission catalogue: super_admin only.
router.get(
  '/',
  protect,
  restrictTo('super_admin'),
  permission.getPermissions
);

// Fetch one permission: super_admin only.
router.get(
  '/:id',
  protect,
  restrictTo('super_admin'),
  permission.getPermissionById
);

// Assign permissions to another user.
// Requires the logged-in user to have assign_permissions.
router.post(
  '/assign',
  protect,
  requirePermission('assign_permissions'),
  permission.assignPermissions
);

module.exports = router;
