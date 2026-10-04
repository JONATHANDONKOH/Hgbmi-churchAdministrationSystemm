const jwt = require('jsonwebtoken');
const User = require('../models/usersModel');

// Verifies token and attaches user to req
exports.protect = async (req, res, next) => {
  try {
    const token = req.cookies?.token;

    if (!token) {
      return res.status(401).json({
        message: 'Not authorized, no token'
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const user = await User.findById(decoded.id);

    if (!user) {
      return res.status(401).json({
        message: 'User no longer exists'
      });
    }

    req.user = user;
    next();

  } catch (err) {
    console.error(err);
    return res.status(401).json({
      message: 'Not authorized, invalid or expired token'
    });
  }
};

// Restricts a route to specific roles, e.g. restrictTo('super_admin')
// Must be used after protect
