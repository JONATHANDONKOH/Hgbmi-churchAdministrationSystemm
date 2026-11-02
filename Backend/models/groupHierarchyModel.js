
const pool = require('../Config/db');

const isAdmin = (user) =>
  user && ['admin', 'super_admin'].includes(user.role);

const GroupHierarchy = {
  // Find the user's starting groups and every descendant.
  async getAccessibleGroupIds(userId) {
    const { rows } = await pool.query(
      `WITH RECURSIVE accessible_groups AS (
         -- Starting groups: membership or leadership.
         SELECT g.id
         FROM groups g
         WHERE g.id IN (
           SELECT ug.group_id
           FROM user_groups ug
           WHERE ug.user_id = $1

           UNION

           SELECT g2.id
           FROM groups g2
           WHERE g2.leader_id = $1
         )

         UNION

         -- Recursively retrieve children, grandchildren,
         -- great-grandchildren and every further generation.
         SELECT child.id
         FROM groups child
         INNER JOIN accessible_groups parent
           ON child.parent_group_id = parent.id
       )
       SELECT DISTINCT id
       FROM accessible_groups
       ORDER BY id`,
      [userId]
    );

    return rows.map((row) => Number(row.id));
  },

  // Check whether the user can view a group.
  async canViewGroup(user, groupId) {
    if (isAdmin(user)) return true;
    if (!user || !user.id) return false;

    const accessibleIds = await this.getAccessibleGroupIds(user.id);

    return accessibleIds.includes(Number(groupId));
  },

  // Management is separate from visibility.
  // A descendant relationship alone does not grant management.
  async canManageGroup(user, groupId) {
    if (isAdmin(user)) return true;
    if (!user || !user.id) return false;

    const { rows } = await pool.query(
      `SELECT id
       FROM groups
       WHERE id = $1
         AND (leader_id = $2 OR created_by = $2)
       LIMIT 1`,
      [groupId, user.id]
    );

    return rows.length > 0;
  },

  // Only users authorized to manage a parent can create under it.
  async canCreateUnderParent(user, parentGroupId) {
    return this.canManageGroup(user, parentGroupId);
  },
};

module.exports = GroupHierarchy;
