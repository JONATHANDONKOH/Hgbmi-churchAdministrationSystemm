const express = require('express');
const router = express.Router();
const auth = require('../Controller/authController');
const { protect } = require('../middleware/authMiddleware');
const { restrictTo } = require('../middleware/roleMiddleware');

router.post('/register-super-admin', auth.createSuperAdmin);
router.post('/register', auth.register);
router.post('/login', auth.login);
router.post('/logout', auth.logout);
router.get('/me', protect, auth.getMe);

// Example: only the super admin can reach this
// router.get('/users', protect, restrictTo('super_admin'), auth.getAllUsers);

module.exports = router;