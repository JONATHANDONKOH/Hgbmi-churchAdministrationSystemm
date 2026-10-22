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

  // Just the names, used to compare the table with ALL_PERMISSIONS
  async findAllNames() {
    const { rows } = await pool.query(`SELECT name FROM permissions`);

    return rows.map((row) => row.name);
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

  // Used to check that every ticked id really exists
  async findByIds(ids) {
    const { rows } = await pool.query(
      `SELECT id, name FROM permissions WHERE id = ANY($1::int[])`,
      [ids]
    );

    return rows;
  },

  // Exact permission names a user holds: user_permissions -> permissions.
  // This is what permissionMiddleware calls.
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

  // Full rows for a user, used to pre-tick the checkboxes
  async findByUserId(userId) {
    const { rows } = await pool.query(
      `SELECT
         p.id,
         p.name,
         p.description,
         p.category_id,
         c.name AS category_name
       FROM user_permissions up
       JOIN permissions p ON p.id = up.permission_id
       LEFT JOIN permission_categories c ON c.id = p.category_id
       WHERE up.user_id = $1
       ORDER BY c.name NULLS LAST, p.name`,
      [userId]
    );

    return rows;
  },

  // Replaces all of a user's permissions with the given ids.
  // Pass `db` (a transaction client) to run inside a bigger transaction;
  // otherwise it opens its own.
  async assignToUser(userId, permissionIds = [], db) {
    const run = async (client) => {
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
    };

    if (db) return run(db);

    const client = await pool.connect();

    try {
      await client.query('BEGIN');
      await run(client);
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