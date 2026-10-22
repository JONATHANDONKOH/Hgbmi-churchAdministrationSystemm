
const pool = require('../Config/db');

const UserGroup = {
  // True if the user belongs to the group.
  async hasGroupAccess(userId, groupId, db = pool) {
    const { rowCount } = await db.query(
      `SELECT 1
       FROM user_groups
       WHERE user_id = $1
         AND group_id = $2
       LIMIT 1`,
      [userId, groupId]
    );

    return rowCount > 0;
  },

  // IDs of every group the user belongs to.
  async findGroupIdsByUser(userId, db = pool) {
    const { rows } = await db.query(
      `SELECT group_id
       FROM user_groups
       WHERE user_id = $1`,
      [userId]
    );

    return rows.map((row) => row.group_id);
  },

  // Adds the user to a group.
  async add(userId, groupId, db = pool) {
    const { rowCount } = await db.query(
      `INSERT INTO user_groups (user_id, group_id)
       VALUES ($1, $2)
       ON CONFLICT DO NOTHING`,
      [userId, groupId]
    );

    return rowCount > 0;
  },

  // Removes the user from a group.
  async remove(userId, groupId, db = pool) {
    const { rowCount } = await db.query(
      `DELETE FROM user_groups
       WHERE user_id = $1
         AND group_id = $2`,
      [userId, groupId]
    );

    return rowCount > 0;
  },

  // Fetches users who belong to a particular group.
  // Includes phone_number for the member details modal.
  async findMembersByGroupId(groupId) {
    const { rows } = await pool.query(
      `SELECT
         u.id,
         u.full_name,
         u.email,
         u.phone_number,
         u.role
       FROM user_groups AS ug
       INNER JOIN users AS u
         ON u.id = ug.user_id
       WHERE ug.group_id = $1
       ORDER BY u.full_name ASC`,
      [groupId]
    );

    return rows;
  },
};

module.exports = UserGroup;
