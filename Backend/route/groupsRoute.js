
const express = require('express');
const router = express.Router();

const GroupsController = require('../Controller/groupController');
const { protect } = require('../middleware/authMiddleware');
const { requirePermission } = require('../middleware/permissionMiddleware');

const groupTypePermissionMap = {
  cell: 'create_cell',
  fellowship: 'create_fellowship',
  ministry: 'create_ministry',
  department: 'create_department',
};

// Reads req.body.type and requires create_<type>.
// super_admin passes through the permission middleware.
const requireGroupCreatePermission = (req, res, next) => {
  const requestedType = String(req.body?.type || '').trim().toLowerCase();
  const permissionName = groupTypePermissionMap[requestedType];

  if (!permissionName) {
    return res.status(400).json({
      message: 'Unsupported group type for permission check',
    });
  }

  return requirePermission(permissionName)(req, res, next);
};

// Create a group with a leader.
router.post(
  '/with-leader',
  protect,
  requireGroupCreatePermission,
  GroupsController.createWithLeader
);

// Create a group.
router.post(
  '/',
  protect,
  requireGroupCreatePermission,
  GroupsController.create
);

// Fetch all groups.
router.get('/', protect, GroupsController.findAll);

// Fetch parent groups.
router.get('/parents', protect, GroupsController.findParents);

// Fetch child groups.
router.get('/:id/children', protect, GroupsController.findChildren);

// Fetch a group by ID.
router.get('/:id', protect, GroupsController.findById);

// Delete a group by ID.
router.delete('/:id', protect, GroupsController.delete);

module.exports = router;
