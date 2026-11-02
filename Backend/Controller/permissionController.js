
const Permission = require('../models/permissionModel');
const User = require('../models/usersModel');
const { ALL_PERMISSIONS } = require('../middleware/permissionMiddleware');

const MAX_INT = 2147483647;

// Accepts 5 or "5". Returns a positive integer, or null if invalid.
const toId = (value) => {
  const n =
    typeof value === 'string' && /^\d+$/.test(value)
      ? Number(value)
      : value;

  return Number.isInteger(n) && n > 0 && n <= MAX_INT ? n : null;
};

// Permission names the logged-in user holds (cached for this request).
const ownedNames = async (req) => {
  if (!Array.isArray(req.user.permissions)) {
    req.user.permissions = await Permission.findNamesByUserId(
      req.user.id
    );
  }

  return req.user.permissions;
};

// Verify database permissions against ALL_PERMISSIONS.
exports.verifyPermissionSync = async () => {
  try {
    const dbNames = await Permission.findAllNames();

    const missingFromCode = dbNames.filter(
      (name) => !ALL_PERMISSIONS.includes(name)
    );

    const missingFromDb = ALL_PERMISSIONS.filter(
      (name) => !dbNames.includes(name)
    );

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

    if (
      missingFromCode.length === 0 &&
      missingFromDb.length === 0
    ) {
      console.log('Permissions are in sync with the database.');
    }
  } catch (err) {
    console.error(
      'Could not verify permissions:',
      err.message
    );
  }
};

// GET /api/permissions
// Permission catalogue: super_admin only.
exports.getPermissions = async (req, res) => {
  try {
    const permissions = await Permission.findAll();

    return res.status(200).json({
      permissions,
    });
  } catch (err) {
    console.error('GET PERMISSIONS ERROR:', err);

    return res.status(500).json({
      message: 'Server error',
    });
  }
};

// GET /api/permissions/mine
// Fetch permissions belonging to the logged-in user.
exports.getMyPermissions = async (req, res) => {
  try {
    if (!req.user || !req.user.id) {
      return res.status(401).json({
        message: 'Authentication required',
      });
    }

    const permissions = await Permission.findByUserId(
      req.user.id
    );

    return res.status(200).json({
      permissions,
    });
  } catch (err) {
    console.error('GET MY PERMISSIONS ERROR:', err);

    return res.status(500).json({
      message: 'Unable to fetch your permissions',
    });
  }
};

// GET /api/permissions/:id
// Permission details: super_admin only.
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

    return res.status(200).json({
      permission,
    });
  } catch (err) {
    console.error('GET PERMISSION BY ID ERROR:', err);

    return res.status(500).json({
      message: 'Server error',
    });
  }
};

// POST /api/permissions/assign
// Body: { userId, permissionIds: [...] }
//
// Assigns selected permissions to another user.
// A non-super-admin can only assign permissions they already hold.
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

    let permissionIds = [
      ...new Set(req.body.permissionIds.map(toId)),
    ];

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

    if (!isSuper && Number(target.id) === Number(req.user.id)) {
      return res.status(403).json({
        message: 'You cannot change your own permissions',
      });
    }

    // Every submitted permission ID must exist.
    let found = [];

    if (permissionIds.length > 0) {
      found = await Permission.findByIds(permissionIds);

      if (found.length !== permissionIds.length) {
        return res.status(400).json({
          message: 'One or more permissions do not exist',
        });
      }

      // Non-super-admins can only assign permissions they hold.
      if (!isSuper) {
        const owned = await ownedNames(req);

        if (found.some((permission) => !owned.includes(permission.name))) {
          return res.status(403).json({
            message: 'You can only assign permissions that you hold yourself',
          });
        }
      }
    }

    // Preserve permissions the non-super-admin does not own.
    if (!isSuper) {
      const owned = await ownedNames(req);

      const existing = await Permission.findByUserId(userId);

      const kept = existing
        .filter((permission) => !owned.includes(permission.name))
        .map((permission) => permission.id);

      permissionIds = [
        ...new Set([...permissionIds, ...kept]),
      ];
    }

    await Permission.assignToUser(userId, permissionIds);

    const permissions = await Permission.findByUserId(userId);

    return res.status(200).json({
      message: 'Permissions assigned successfully',
      user: target,
      permissions,
    });
  } catch (err) {
    console.error('ASSIGN PERMISSIONS ERROR:', err);

    return res.status(500).json({
      message: 'Server error',
    });
  }
};
