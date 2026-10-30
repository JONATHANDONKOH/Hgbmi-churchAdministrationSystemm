const express = require('express');
const router = express.Router();
const MeetingsController = require('../Controller/meetingController');
const { protect } = require('../middleware/authMiddleware');

router.post('/', protect, MeetingsController.create);
router.get('/', protect, MeetingsController.findByGroup);
router.get('/:id', protect, MeetingsController.findById);
router.put('/:id', protect, MeetingsController.update);
router.delete('/:id', protect, MeetingsController.remove);

module.exports = router;