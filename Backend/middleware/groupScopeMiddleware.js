const UserGroup = require('../models/userGroupScopeModel');

/*
 * GROUP SCOPE: WHICH group can the user access?
 * It does not check permissions (that is permissionMiddleware).
 *
 * Expected route: /groups/:id  ->  req.params.id = group ID
 * Must run after protect.
 */
const groupScope = async (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        message: 'Not authorized',
      });
    }

    // Super admin has access to every group
    if (req.user.role === 'super_admin') {
      return next();
    }

    const raw = String(req.params.id);
    const groupId = /^\d+$/.test(raw) ? Number(raw) : NaN;

    if (!Number.isInteger(groupId) || groupId <= 0 || groupId > 2147483647) {
      return res.status(400).json({
        message: 'Invalid group ID',
      });
    }

    // user_groups: user_id + group_id
    const hasAccess = await UserGroup.hasGroupAccess(req.user.id, groupId);

    if (!hasAccess) {
      return res.status(403).json({
        message: 'Access denied to this group',
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

module.exports = {
  groupScope,
};