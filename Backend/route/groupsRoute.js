
const express = require('express');
const router = express.Router();

const GroupsController = require('../Controller/groupController');
const { protect } = require('../middleware/authMiddleware');

// Create a group with a leader.
router.post('/with-leader', protect, GroupsController.createWithLeader);

// Create a group.
router.post('/', protect, GroupsController.create);

// Fetch groups.
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
