const express = require('express');
const router = express.Router();

const SuperAdminController = require('../Controller/superAdminController');
const { protect } = require('../middleware/authMiddleware');
const { restrictTo } = require('../middleware/roleMiddleware');

router.use(protect, restrictTo('super_admin'));

router.get('/cells', SuperAdminController.getCells);
router.get('/fellowships', SuperAdminController.getFellowships);
router.get('/departments', SuperAdminController.getDepartments);
router.get('/ministries', SuperAdminController.getMinistries);
router.get('/admins', SuperAdminController.getAllAdmins);

module.exports = router;