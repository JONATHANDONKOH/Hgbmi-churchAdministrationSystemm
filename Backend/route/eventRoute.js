const express = require('express');
const router = express.Router();

const EventController = require('../Controller/eventController');
const { protect } = require('../middleware/authMiddleware');

// All event routes require authentication
router.use(protect);

// ==========================================
// SUPERADMIN EVENT ROUTES
// ==========================================

router.get(
  '/super-admin',
  EventController.findAllSuperAdmin
);

router.get(
  '/super-admin/:id',
  EventController.findByIdSuperAdmin
);

// ==========================================
// ADMIN EVENT ROUTES
// ==========================================

router.get(
  '/admin',
  EventController.findAllAdmin
);

router.get(
  '/admin/:id',
  EventController.findByIdAdmin
);

// ==========================================
// GROUP EVENT ROUTES
// ==========================================

router.get(
  '/group/:groupId',
  EventController.findAllGroup
);

router.get(
  '/group/:groupId/:id',
  EventController.findByIdGroup
);

// ==========================================
// GENERAL EVENT ROUTES
// Retained for existing frontend connections
// ==========================================

router.get('/', EventController.findAll);

router.get('/:id', EventController.findById);

router.post('/', EventController.create);

router.put('/:id', EventController.update);

router.delete('/:id', EventController.delete);

module.exports = router;