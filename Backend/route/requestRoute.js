const express = require('express');
const router = express.Router();

const RequestController = require('../Controller/requestController');
const { protect } = require('../middleware/authMiddleware');

router.use(protect);

// Submit a request
router.post('/', RequestController.create);

// Get requests submitted by the logged-in user
// (must stay above '/:id' or it will be treated as an ID)
router.get('/mine', RequestController.findMyRequests);
router.get('/my', RequestController.findMyRequests);

// Get all requests (apply your existing admin authorization here)
router.get('/', RequestController.findAll);

// Get one request
router.get('/:id', RequestController.findById);

// Approve a request
router.patch('/:id/approve', RequestController.approve);

// Reject a request
router.patch('/:id/reject', RequestController.reject);

// Delete a request
router.delete('/:id', RequestController.remove);

module.exports = router;