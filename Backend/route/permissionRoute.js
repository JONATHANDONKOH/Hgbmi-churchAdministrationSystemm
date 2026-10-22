const express = require('express');
const router = express.Router();
const permission = require('../Controller/permissionController');
const { protect } = require('../middleware/authMiddleware');
const { restrictTo } = require('../middleware/roleMiddleware');
const { requirePermission } = require('../middleware/permissionMiddleware');

// Permission catalogue: super_admin only
router.get('/', protect, restrictTo('super_admin'), permission.getPermissions);
router.get('/:id', protect, restrictTo('super_admin'), permission.getPermissionById);

// Existing endpoint, left as it was
router.post('/assign', protect, requirePermission('assign_permissions'), permission.assignPermissions);

module.exports = router;