const express = require('express');
const router = express.Router();
const RequestsController = require('../Controller/requestController');
const { protect } = require('../middleware/authMiddleware');
const { requirePermission } = require('../middleware/permissionMiddleware');

// Submit (the controller checks the user leads the group)
router.post('/', protect, RequestsController.create);

// Administrators
router.get('/', protect, requirePermission('view_requests'), RequestsController.findAll);

// The logged-in user's own requests (before /:id)
router.get('/mine', protect, RequestsController.findMyRequests);

// One request (the controller allows the requester or view_requests)
router.get('/:id', protect, RequestsController.findById);

router.patch('/:id/approve', protect, requirePermission('approve_requests'), RequestsController.approve);
router.patch('/:id/reject', protect, requirePermission('reject_requests'), RequestsController.reject);

module.exports = router;