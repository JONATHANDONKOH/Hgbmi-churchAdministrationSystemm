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

// Reads req.body.type, requires create_<type> (super_admin passes)
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

// Static paths first, then parameterized ones
router.post('/with-leader', protect, requireGroupCreatePermission, GroupsController.createWithLeader);
router.post('/', protect, requireGroupCreatePermission, GroupsController.create);

router.get('/', protect, GroupsController.findAll);
router.get('/parents', protect, GroupsController.findParents);
router.get('/:id/children', protect, GroupsController.findChildren);
router.get('/:id', protect, GroupsController.findById);

module.exports = router;