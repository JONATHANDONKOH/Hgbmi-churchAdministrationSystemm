const pool = require('../Config/db');

const Permission = {
  async findAll() {
    const { rows } = await pool.query(
      `SELECT
         p.id,
         p.name,
         p.description,
         p.category_id,
         c.name AS category_name
       FROM permissions p
       LEFT JOIN permission_categories c ON c.id = p.category_id
       ORDER BY c.name NULLS LAST, p.name`
    );

    return rows;
  },

  async findById(id) {
    const { rows } = await pool.query(
      `SELECT
         p.id,
         p.name,
         p.description,
         p.category_id,
         c.name AS category_name
       FROM permissions p
       LEFT JOIN permission_categories c ON c.id = p.category_id
       WHERE p.id = $1`,
      [id]
    );

    return rows[0] || null;
  },

  // Returns the exact permission names stored in the database
  // for a user: user_permissions -> permissions
  async findNamesByUserId(userId) {
    const { rows } = await pool.query(
      `SELECT p.name
       FROM user_permissions up
       JOIN permissions p ON p.id = up.permission_id
       WHERE up.user_id = $1`,
      [userId]
    );

    return rows.map((row) => row.name);
  },

  // Replaces all of a user's permissions with the given ids
  async assignToUser(userId, permissionIds = []) {
    const client = await pool.connect();

    try {
      await client.query('BEGIN');

      await client.query(
        `DELETE FROM user_permissions WHERE user_id = $1`,
        [userId]
      );

      if (permissionIds.length > 0) {
        await client.query(
          `INSERT INTO user_permissions (user_id, permission_id)
           SELECT $1, UNNEST($2::int[])
           ON CONFLICT DO NOTHING`,
          [userId, permissionIds]
        );
      }

      await client.query('COMMIT');
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  },
};

module.exports = Permission;