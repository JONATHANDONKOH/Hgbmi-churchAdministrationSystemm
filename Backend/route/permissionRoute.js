const express = require('express');
const router = express.Router();
const permission = require('../Controller/permissionController');
const { protect } = require('../middleware/authMiddleware');
const { restrictTo } = require('../middleware/roleMiddleware');

router.get('/', protect, restrictTo('super_admin'), permission.getPermissions);
router.get('/:id', protect, restrictTo('super_admin'), permission.getPermissionById);

module.exports = router;