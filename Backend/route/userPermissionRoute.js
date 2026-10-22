const express = require('express');
const router = express.Router();

const userPermission = require('../Controller/userPermissionController');
const { protect } = require('../middleware/authMiddleware');
const { requirePermission } = require('../middleware/permissionMiddleware');

// Any logged-in user can see their own permissions (must stay above '/:userId')
router.get('/me', protect, userPermission.getMyPermissions);

router.get(
  '/:userId',
  protect,
  requirePermission('assign_permissions'),
  userPermission.getUserPermissions
);

router.post(
  '/:userId',
  protect,
  requirePermission('assign_permissions'),
  userPermission.addPermissions
);

router.put(
  '/:userId',
  protect,
  requirePermission('assign_permissions'),
  userPermission.replacePermissions
);

router.delete(
  '/:userId/:permissionId',
  protect,
  requirePermission('remove_permissions'),
  userPermission.removePermission
);

router.delete(
  '/:userId',
  protect,
  requirePermission('remove_permissions'),
  userPermission.clearPermissions
);

module.exports = router;