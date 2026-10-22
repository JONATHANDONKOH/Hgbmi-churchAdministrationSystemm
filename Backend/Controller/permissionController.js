const Permission = require('../models/permissionModel');
const User = require('../models/usersModel');
const { ALL_PERMISSIONS } = require('../middleware/permissionMiddleware');

const MAX_INT = 2147483647;

// Accepts 5 or "5". Returns a positive integer, or null if invalid.
const toId = (value) => {
  const n =
    typeof value === 'string' && /^\d+$/.test(value) ? Number(value) : value;

  return Number.isInteger(n) && n > 0 && n <= MAX_INT ? n : null;
};

// Permission names the logged-in user holds (cached for this request)
const ownedNames = async (req) => {
  if (!Array.isArray(req.user.permissions)) {
    req.user.permissions = await Permission.findNamesByUserId(req.user.id);
  }

  return req.user.permissions;
};

// Compares the permissions table with ALL_PERMISSIONS in permissionMiddleware.
// Call once after the server starts. It only logs, it never stops the server.
exports.verifyPermissionSync = async () => {
  try {
    const dbNames = await Permission.findAllNames();

    const missingFromCode = dbNames.filter((n) => !ALL_PERMISSIONS.includes(n));
    const missingFromDb = ALL_PERMISSIONS.filter((n) => !dbNames.includes(n));

    if (missingFromCode.length > 0) {
      console.warn(
        'Permissions in the database but not in permissionMiddleware ALL_PERMISSIONS:',
        missingFromCode.join(', ')
      );
    }

    if (missingFromDb.length > 0) {
      console.warn(
        'Permissions in permissionMiddleware ALL_PERMISSIONS but not in the database:',
        missingFromDb.join(', ')
      );
    }

    if (missingFromCode.length === 0 && missingFromDb.length === 0) {
      console.log('Permissions are in sync with the database.');
    }
  } catch (err) {
    console.error('Could not verify permissions:', err.message);
  }
};

// GET /api/permissions   (route is super_admin only)
exports.getPermissions = async (req, res) => {
  try {
    const permissions = await Permission.findAll();

    return res.status(200).json({ permissions });

  } catch (err) {
    console.error(err);

    return res.status(500).json({
      message: 'Server error',
    });
  }
};

// GET /api/permissions/:id   (route is super_admin only)
exports.getPermissionById = async (req, res) => {
  try {
    const id = toId(req.params.id);

    if (!id) {
      return res.status(400).json({
        message: 'Invalid permission id',
      });
    }

    const permission = await Permission.findById(id);

    if (!permission) {
      return res.status(404).json({
        message: 'Permission not found',
      });
    }

    return res.status(200).json({ permission });

  } catch (err) {
    console.error(err);

    return res.status(500).json({
      message: 'Server error',
    });
  }
};

// POST /api/permissions/assign   body: { userId, permissionIds: [..] }
// Replaces the user's permissions with the ticked ones.
exports.assignPermissions = async (req, res) => {
  try {
    const userId = toId(req.body.userId);

    if (!userId) {
      return res.status(400).json({
        message: 'A valid userId is required',
      });
    }

    if (!Array.isArray(req.body.permissionIds)) {
      return res.status(400).json({
        message: 'permissionIds must be an array',
      });
    }

    let permissionIds = [...new Set(req.body.permissionIds.map(toId))];

    if (permissionIds.includes(null)) {
      return res.status(400).json({
        message: 'permissionIds must contain valid permission ids',
      });
    }

    const target = await User.findById(userId);

    if (!target) {
      return res.status(404).json({
        message: 'User not found',
      });
    }

    if (target.role === 'super_admin') {
      return res.status(403).json({
        message: "The super admin's access cannot be changed",
      });
    }

    const isSuper = req.user.role === 'super_admin';

    if (!isSuper && target.id === req.user.id) {
      return res.status(403).json({
        message: 'You cannot change your own permissions',
      });
    }

    // Every id must exist
    if (permissionIds.length > 0) {
      const found = await Permission.findByIds(permissionIds);

      if (found.length !== permissionIds.length) {
        return res.status(400).json({
          message: 'One or more permissions do not exist',
        });
      }

      // Non-super-admins can only hand out what they hold themselves
      if (!isSuper) {
        const owned = await ownedNames(req);

        if (found.some((p) => !owned.includes(p.name))) {
          return res.status(403).json({
            message: 'You can only assign permissions that you hold yourself',
          });
        }
      }
    }

    // A non-super-admin can't see permissions they don't hold,
    // so the target keeps those untouched.
    if (!isSuper) {
      const owned = await ownedNames(req);
      const existing = await Permission.findByUserId(userId);

      const kept = existing
        .filter((p) => !owned.includes(p.name))
        .map((p) => p.id);

      permissionIds = [...new Set([...permissionIds, ...kept])];
    }

    await Permission.assignToUser(userId, permissionIds);

    const permissions = await Permission.findByUserId(userId);

    return res.status(200).json({
      message: 'Permissions assigned successfully',
      user: target,
      permissions,
    });

  } catch (err) {
    console.error(err);

    return res.status(500).json({
      message: 'Server error',
    });
  }
};