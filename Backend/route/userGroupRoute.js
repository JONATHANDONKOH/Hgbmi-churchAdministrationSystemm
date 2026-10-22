
const express = require('express');
const router = express.Router();

const UserGroupController = require('../Controller/userGroupScopeController');
const { protect } = require('../middleware/authMiddleware');

router.use(protect);

router.post('/', UserGroupController.add);
router.delete('/', UserGroupController.remove);

router.get('/user/:userId', UserGroupController.findGroupsByUser);

// Fetch members belonging to a selected group.
router.get('/group/:groupId/members', UserGroupController.findMembersByGroup);

router.get('/check', UserGroupController.checkAccess);

module.exports = router;
