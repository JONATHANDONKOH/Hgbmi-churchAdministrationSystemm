const User = require('../models/usersModel');
const Permission = require('../models/permissionModel');
const UserPermission = require('../models/userPermissionModel');

const MAX_INT = 2147483647;

// Accepts 5 or "5". Returns a positive integer, or null if invalid.
const toId = (value) => {
  const n =
    typeof value === 'string' && /^\d+$/.test(value) ? Number(value) : value;

  return Number.isInteger(n) && n > 0 && n <= MAX_INT ? n : null;
};

// De-duplicated array of ids, or null if the input isn't a valid list
const toIdList = (value) => {
  if (!Array.isArray(value)) return null;

  const ids = value.map(toId);

  if (ids.includes(null)) return null;

  return [...new Set(ids)];
};

const isSuper = (req) => req.user.role === 'super_admin';

// Permission names the logged-in user holds (cached for this request)
const ownedNames = async (req) => {
  if (!Array.isArray(req.user.permissions)) {
    req.user.permissions = await UserPermission.findNamesByUserId(req.user.id);
  }

  return req.user.permissions;
};

// Loads the target user and blocks changes that are never allowed.
// Returns { target } or { status, message }.
const loadEditableTarget = async (req) => {
  const userId = toId(req.params.userId);

  if (!userId) return { status: 400, message: 'Invalid user id' };

  const target = await User.findById(userId);

  if (!target) return { status: 404, message: 'User not found' };

  if (target.role === 'super_admin') {
    return { status: 403, message: "The super admin's access cannot be changed" };
  }

  if (!isSuper(req) && target.id === req.user.id) {
    return { status: 403, message: 'You cannot change your own permissions' };
  }

  return { target };
};

// Every id must exist, and a non-super-admin may only hand out
// permissions they hold themselves. Returns { status, message } or null.
const checkGrant = async (req, ids) => {
  if (ids.length === 0) return null;

  const found = await Permission.findByIds(ids);

  if (found.length !== ids.length) {
    return { status: 400, message: 'One or more permissions do not exist' };
  }

  if (isSuper(req)) return null;

  const owned = await ownedNames(req);

  if (found.some((p) => !owned.includes(p.name))) {
    return {
      status: 403,
      message: 'You can only assign permissions that you hold yourself',
    };
  }

  return null;
};

const sendError = (res, error) =>
  res.status(error.status).json({ message: error.message });

// GET /api/user-permissions/me
exports.getMyPermissions = async (req, res) => {
  try {
    const permissions = await UserPermission.findByUserId(req.user.id);

    return res.status(200).json({
      role: req.user.role,
      permissions,
      permissionNames: permissions.map((p) => p.name),
    });

  } catch (err) {
    console.error(err);

    return res.status(500).json({ message: 'Server error' });
  }
};

// GET /api/user-permissions/:userId
exports.getUserPermissions = async (req, res) => {
  try {
    const userId = toId(req.params.userId);

    if (!userId) {
      return res.status(400).json({ message: 'Invalid user id' });
    }

    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const permissions = await UserPermission.findByUserId(userId);

    return res.status(200).json({ user, permissions });

  } catch (err) {
    console.error(err);

    return res.status(500).json({ message: 'Server error' });
  }
};

// POST /api/user-permissions/:userId   body: { permissionIds: [..] }
// Adds the ticked permissions and keeps the ones the user already has.
exports.addPermissions = async (req, res) => {
  try {
    const ids = toIdList(req.body.permissionIds);

    if (!ids || ids.length === 0) {
      return res.status(400).json({
        message: 'permissionIds must be a non-empty list of permission ids',
      });
    }

    const result = await loadEditableTarget(req);
    if (!result.target) return sendError(res, result);

    const grantError = await checkGrant(req, ids);
    if (grantError) return sendError(res, grantError);

    await UserPermission.add(result.target.id, ids);

    const permissions = await UserPermission.findByUserId(result.target.id);

    return res.status(200).json({
      message: 'Permissions added successfully',
      user: result.target,
      permissions,
    });

  } catch (err) {
    console.error(err);

    return res.status(500).json({ message: 'Server error' });
  }
};

// PUT /api/user-permissions/:userId   body: { permissionIds: [..] }
// Replaces the user's permissions with the ticked ones.
exports.replacePermissions = async (req, res) => {
  try {
    let ids = toIdList(req.body.permissionIds);

    if (!ids) {
      return res.status(400).json({
        message: 'permissionIds must be a list of permission ids',
      });
    }

    const result = await loadEditableTarget(req);
    if (!result.target) return sendError(res, result);

    const grantError = await checkGrant(req, ids);
    if (grantError) return sendError(res, grantError);

    // A non-super-admin can't see permissions they don't hold,
    // so the target keeps those untouched.
    if (!isSuper(req)) {
      const owned = await ownedNames(req);
      const existing = await UserPermission.findByUserId(result.target.id);

      const kept = existing
        .filter((p) => !owned.includes(p.name))
        .map((p) => p.id);

      ids = [...new Set([...ids, ...kept])];
    }

    await UserPermission.replace(result.target.id, ids);

    const permissions = await UserPermission.findByUserId(result.target.id);

    return res.status(200).json({
      message: 'Permissions updated successfully',
      user: result.target,
      permissions,
    });

  } catch (err) {
    console.error(err);

    return res.status(500).json({ message: 'Server error' });
  }
};

// DELETE /api/user-permissions/:userId/:permissionId
exports.removePermission = async (req, res) => {
  try {
    const permissionId = toId(req.params.permissionId);

    if (!permissionId) {
      return res.status(400).json({ message: 'Invalid permission id' });
    }

    const result = await loadEditableTarget(req);
    if (!result.target) return sendError(res, result);

    // A non-super-admin can only remove permissions they hold themselves
    if (!isSuper(req)) {
      const permission = await Permission.findById(permissionId);
      const owned = await ownedNames(req);

      if (!permission || !owned.includes(permission.name)) {
        return res.status(403).json({
          message: 'You can only remove permissions that you hold yourself',
        });
      }
    }

    const removed = await UserPermission.remove(result.target.id, permissionId);

    if (!removed) {
      return res.status(404).json({
        message: 'The user does not have this permission',
      });
    }

    return res.status(200).json({ message: 'Permission removed successfully' });

  } catch (err) {
    console.error(err);

    return res.status(500).json({ message: 'Server error' });
  }
};

// DELETE /api/user-permissions/:userId   (removes all of the user's permissions)
exports.clearPermissions = async (req, res) => {
  try {
    const result = await loadEditableTarget(req);
    if (!result.target) return sendError(res, result);

    if (isSuper(req)) {
      await UserPermission.clear(result.target.id);
    } else {
      // Only the permissions the caller holds can be removed
      const owned = await ownedNames(req);
      const existing = await UserPermission.findByUserId(result.target.id);

      const removable = existing
        .filter((p) => owned.includes(p.name))
        .map((p) => p.id);

      await UserPermission.removeMany(result.target.id, removable);
    }

    const permissions = await UserPermission.findByUserId(result.target.id);

    return res.status(200).json({
      message: 'Permissions removed successfully',
      user: result.target,
      permissions,
    });

  } catch (err) {
    console.error(err);

    return res.status(500).json({ message: 'Server error' });
  }
};