const Permission = require('../models/permissionModel');

// Every permission in the system, copied exactly from the permissions table.
const ALL_PERMISSIONS = [
  // Dashboard
  'view_dashboard', 'view_statistics', 'view_analytics', 'view_activity',

  // Account Management
  'view_account_requests', 'review_account_requests',
  'approve_account_requests', 'reject_account_requests',
  'manage_user_accounts',

  // Member Management
  'view_members', 'delete_member', 'search_members',
  'view_member_profile', 'manage_member_status', 'export_members',

  // Cell Management
  'view_cells', 'create_cell', 'edit_cell', 'delete_cell',
  'manage_cell_members', 'assign_cell_leader', 'view_cell_records',

  // Fellowship Management
  'view_fellowships', 'create_fellowship', 'edit_fellowship',
  'delete_fellowship', 'manage_fellowship_members',
  'assign_fellowship_leader', 'view_fellowship_records',

  // Finance Management
  'view_finances', 'create_transaction', 'edit_transaction',
  'delete_transaction', 'view_financial_records',
  'export_financial_records',

  // Event Management
  'view_events', 'create_event', 'edit_event', 'delete_event',
  'publish_event', 'cancel_event', 'manage_event_registrations',
  'manage_event_attendance',

  // Ministry Management
  'view_ministries', 'create_ministry', 'edit_ministry',
  'delete_ministry', 'manage_ministry_members', 'assign_ministry_leader',

  // Department Management
  'view_departments', 'create_department', 'edit_department',
  'delete_department', 'manage_department_members',
  'assign_department_leader',

  // Document Management
  'view_documents', 'upload_documents', 'download_documents',
  'edit_documents', 'delete_documents', 'share_documents',

  // Communication Management
  'view_messages', 'send_messages', 'send_announcements',
  'create_announcement', 'edit_announcement', 'delete_announcement',
  'manage_notifications',

  // Request Management
  'view_requests', 'review_requests', 'approve_requests',
  'reject_requests', 'delete_requests',

  // Search
  'search_cells', 'search_fellowships', 'search_events',
  'search_documents', 'search_finances',

  // Administrator Management
  'view_administrators', 'create_administrator', 'edit_administrator',
  'disable_administrator', 'assign_permissions', 'remove_permissions',
  'assign_office',

  // Meeting Management
  'view_meetings', 'create_meeting', 'edit_meeting', 'delete_meeting',

  // Report Management
  'view_reports', 'view_meeting_reports', 'view_attendance_reports',
  'view_event_reports', 'view_financial_reports', 'create_reports',
  'edit_reports', 'delete_reports', 'export_reports',
];

const KNOWN = new Set(ALL_PERMISSIONS);

// Stops the server at startup if a route uses a name that doesn't exist
const assertKnown = (names) => {
  const unknown = names.filter((name) => !KNOWN.has(name));

  if (unknown.length > 0) {
    throw new Error(
      `Unknown permission name(s) in route: ${unknown.join(', ')}`
    );
  }
};

// Loads the user's assigned permission names once per request and caches
// them on req.user.permissions so the DB isn't queried repeatedly.
const loadPermissions = async (req) => {
  if (!Array.isArray(req.user.permissions)) {
    req.user.permissions = await Permission.findNamesByUserId(req.user.id);
  }

  return req.user.permissions;
};

// Shared check used by every guard
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
// Usage: requirePermission('view_cells')
const requirePermission = (...required) => {
  assertKnown(required);

  return buildMiddleware((owned) =>
    required.every((name) => owned.includes(name))
  );
};

// User must have AT LEAST ONE of the listed permissions
// Usage: requireAnyPermission('view_cells', 'view_fellowships')
const requireAnyPermission = (...permissions) => {
  assertKnown(permissions);

  return buildMiddleware((owned) =>
    permissions.some((name) => owned.includes(name))
  );
};

// Ready-made guard for every permission:
//   guard.view_cells, guard.create_cell, guard.create_meeting ...
const guard = Object.fromEntries(
  ALL_PERMISSIONS.map((name) => [name, requirePermission(name)])
);

module.exports = {
  ALL_PERMISSIONS,
  requirePermission,
  requireAnyPermission,
  guard,
};