const pool = require('../Config/db');

const UserGroup = {
  async hasGroupAccess(userId, groupId, db = pool) {
    const { rowCount } = await db.query(
      `SELECT 1
       FROM user_groups
       WHERE user_id = $1 AND group_id = $2
       LIMIT 1`,
      [userId, groupId]
    );

    return rowCount > 0;
  },

  async findGroupIdsByUser(userId, db = pool) {
    const { rows } = await db.query(
      `SELECT group_id
       FROM user_groups
       WHERE user_id = $1`,
      [userId]
    );

    return rows.map((row) => row.group_id);
  },

  async add(userId, groupId, db = pool) {
    const { rowCount } = await db.query(
      `INSERT INTO user_groups (user_id, group_id)
       VALUES ($1, $2)
       ON CONFLICT (user_id, group_id) DO NOTHING`,
      [userId, groupId]
    );

    return rowCount > 0;
  },

  async remove(userId, groupId, db = pool) {
    const { rowCount } = await db.query(
      `DELETE FROM user_groups
       WHERE user_id = $1 AND group_id = $2`,
      [userId, groupId]
    );

    return rowCount > 0;
  },

  async findUserByEmail(email, db = pool) {
    const normalizedEmail = String(email || '').trim().toLowerCase();

    if (!normalizedEmail) return null;

    const { rows } = await db.query(
      `SELECT id, full_name, email, phone_number, role
       FROM users
       WHERE LOWER(TRIM(email)) = $1
       LIMIT 1`,
      [normalizedEmail]
    );

    return rows[0] || null;
  },

  async findMemberByEmail(email, groupId, db = pool) {
    const normalizedEmail = String(email || '').trim().toLowerCase();

    const { rows } = await db.query(
      `SELECT
         u.id,
         u.full_name,
         u.email,
         u.phone_number,
         u.role,
         EXISTS (
           SELECT 1
           FROM user_groups ug
           WHERE ug.user_id = u.id
             AND ug.group_id = $2
         ) AS is_member
       FROM users u
       WHERE LOWER(TRIM(u.email)) = $1
       LIMIT 1`,
      [normalizedEmail, groupId]
    );

    return rows[0] || null;
  },

  async addByEmail(email, groupId, db = pool) {
    const user = await this.findUserByEmail(email, db);

    if (!user) return null;

    const alreadyMember = await this.hasGroupAccess(
      user.id,
      groupId,
      db
    );

    if (alreadyMember) {
      return {
        user,
        alreadyMember: true,
      };
    }

    await this.add(user.id, groupId, db);

    return {
      user,
      alreadyMember: false,
    };
  },

  async findMembersByGroupId(groupId, db = pool) {
    const { rows } = await db.query(
      `SELECT
         u.id,
         u.full_name,
         u.email,
         u.phone_number,
         u.role
       FROM user_groups ug
       INNER JOIN users u ON u.id = ug.user_id
       WHERE ug.group_id = $1
       ORDER BY u.full_name ASC`,
      [groupId]
    );

    return rows;
  },

  async findAvailableMembersByGroupId(groupId, db = pool) {
    const { rows } = await db.query(
      `SELECT
         u.id,
         u.full_name,
         u.email,
         u.phone_number,
         u.role
       FROM users u
       WHERE NOT EXISTS (
         SELECT 1
         FROM user_groups ug
         WHERE ug.user_id = u.id
           AND ug.group_id = $1
       )
       ORDER BY u.full_name ASC`,
      [groupId]
    );

    return rows;
  },
};

module.exports = UserGroup;