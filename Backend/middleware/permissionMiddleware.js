const Permission = require('../models/permissionsModel');

// Loads the user's permission names once per request and caches
// them on req.user.permissions so the DB isn't queried repeatedly.
const loadPermissions = async (req) => {
  if (!Array.isArray(req.user.permissions)) {
    req.user.permissions = await Permission.findNamesByUserId(req.user.id);
  }

  return req.user.permissions;
};

// Shared check used by both exports
const buildMiddleware = (check) => async (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        message: 'Not authorized',
      });
    }

    // super_admin has full access
    if (req.user.role === 'super_admin') {
      return next();
    }

    const owned = await loadPermissions(req);

    if (!check(owned)) {
      return res.status(403).json({
        message: 'You do not have permission to perform this action',
      });
    }

    return next();

  } catch (err) {
    console.error(err);

    return res.status(500).json({
      message: 'Server error',
    });
  }
};

// User must have ALL of the listed permissions
// Usage: requirePermission('<exact name from permissions.name>')
exports.requirePermission = (...required) =>
  buildMiddleware((owned) =>
    required.every((name) => owned.includes(name))
  );

// User must have AT LEAST ONE of the listed permissions
// Usage: requireAnyPermission('<name one>', '<name two>')
exports.requireAnyPermission = (...permissions) =>
  buildMiddleware((owned) =>
    permissions.some((name) => owned.includes(name))
  );