const express = require('express');
const router = express.Router();
const MeetingsController = require('../Controller/meetingController');
const { protect } = require('../middleware/authMiddleware');
const { requirePermission } = require('../middleware/permissionMiddleware');

router.post('/', protect, requirePermission('create_meeting'), MeetingsController.create);
router.get('/', protect, requirePermission('view_meetings'), MeetingsController.findByGroup);
router.get('/:id', protect, requirePermission('view_meetings'), MeetingsController.findById);
router.put('/:id', protect, requirePermission('edit_meeting'), MeetingsController.update);
router.delete('/:id', protect, requirePermission('delete_meeting'), MeetingsController.remove);

module.exports = router;