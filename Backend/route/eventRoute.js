const express = require('express');
const router = express.Router();

const EventController = require('../Controller/eventController');
const { protect } = require('../middleware/authMiddleware');
const { requirePermission } = require('../middleware/permissionMiddleware');
const { restrictTo } = require('../middleware/roleMiddleware');

// Protect all event routes
router.use(protect);

// Super Admin endpoints — role-based access
router.get(
  '/super-admin',
  restrictTo('super_admin'),
  EventController.findAll
);

router.get(
  '/super-admin/:id',
  restrictTo('super_admin'),
  EventController.findById
);

router.put(
  '/super-admin/:id',
  restrictTo('super_admin'),
  EventController.update
);

router.delete(
  '/super-admin/:id',
  restrictTo('super_admin'),
  EventController.delete
);

// Regular user endpoints — permission-based access
router.post(
  '/',
  requirePermission('create_event'),
  EventController.create
);

router.get(
  '/',
  requirePermission('view_events'),
  EventController.findAll
);

router.get(
  '/:id',
  requirePermission('view_events'),
  EventController.findById
);

router.put(
  '/:id',
  requirePermission('edit_event'),
  EventController.update
);

router.delete(
  '/:id',
  requirePermission('delete_event'),
  EventController.delete
);

module.exports = router;