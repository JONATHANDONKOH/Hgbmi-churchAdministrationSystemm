
const express = require('express');
const router = express.Router();

const SuperAdminController = require('../Controller/superAdminController');
const { protect } = require('../middleware/authMiddleware');
const { restrictTo } = require('../middleware/roleMiddleware');

// Protect every route: only authenticated super_admin users
router.use(protect, restrictTo('super_admin'));

// Group management
router.get('/cells', SuperAdminController.getCells);
router.get('/fellowships', SuperAdminController.getFellowships);
router.get('/departments', SuperAdminController.getDepartments);
router.get('/ministries', SuperAdminController.getMinistries);

// Administrator management
router.get('/admins', SuperAdminController.getAllAdmins);

// Request monitoring
router.get(
  '/request-overview',
  SuperAdminController.getRequestOverview
);

router.get(
  '/admin-request-stats',
  SuperAdminController.getAdminRequestStats
);

router.get(
  '/admins/:id/requests',
  SuperAdminController.getAdminRequests
);

module.exports = router;
