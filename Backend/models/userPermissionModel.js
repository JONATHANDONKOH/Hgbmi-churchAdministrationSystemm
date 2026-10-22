const pool = require('../Config/db');

const UserPermission = {
  // Full permission rows for a user (used to pre-tick checkboxes)
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

  // Just the names, e.g. ['view_cells', 'create_cell']
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

  async has(userId, permissionId) {
    const { rowCount } = await pool.query(
      `SELECT 1 FROM user_permissions
       WHERE user_id = $1 AND permission_id = $2`,
      [userId, permissionId]
    );

    return rowCount > 0;
  },

  // Users who hold a given permission
  async findUsersByPermissionId(permissionId) {
    const { rows } = await pool.query(
      `SELECT u.id, u.full_name, u.email, u.role
       FROM user_permissions up
       JOIN users u ON u.id = up.user_id
       WHERE up.permission_id = $1
       ORDER BY u.full_name`,
      [permissionId]
    );

    return rows;
  },

  // Adds permissions, keeping the ones the user already has.
  // Pass `db` (a transaction client) to run inside a transaction.
  async add(userId, permissionIds = [], db = pool) {
    if (permissionIds.length === 0) return 0;

    const { rowCount } = await db.query(
      `INSERT INTO user_permissions (user_id, permission_id)
       SELECT $1, UNNEST($2::int[])
       ON CONFLICT DO NOTHING`,
      [userId, permissionIds]
    );

    return rowCount;
  },

  // Removes one permission. Returns true if a row was deleted.
  async remove(userId, permissionId) {
    const { rowCount } = await pool.query(
      `DELETE FROM user_permissions
       WHERE user_id = $1 AND permission_id = $2`,
      [userId, permissionId]
    );

    return rowCount > 0;
  },

  // Removes several permissions
  async removeMany(userId, permissionIds = []) {
    if (permissionIds.length === 0) return 0;

    const { rowCount } = await pool.query(
      `DELETE FROM user_permissions
       WHERE user_id = $1 AND permission_id = ANY($2::int[])`,
      [userId, permissionIds]
    );

    return rowCount;
  },

  // Replaces everything the user has with the given ids
  async replace(userId, permissionIds = [], db) {
    const run = async (client) => {
      await client.query(
        `DELETE FROM user_permissions WHERE user_id = $1`,
        [userId]
      );

      await this.add(userId, permissionIds, client);
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

  // Removes every permission from a user
  async clear(userId) {
    const { rowCount } = await pool.query(
      `DELETE FROM user_permissions WHERE user_id = $1`,
      [userId]
    );

    return rowCount;
  },
};

module.exports = UserPermission;