
const pool = require('../Config/db');

const Group = {
  async create(
    {
      name,
      type,
      parentGroupId = null,
      location = null,
      description = null,
      leaderId = null,
      createdBy,
    },
    db = pool
  ) {
    const { rows } = await db.query(
      `INSERT INTO groups
         (name, type, parent_group_id, location, description, leader_id, created_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [name, type, parentGroupId, location, description, leaderId, createdBy]
    );

    return rows[0];
  },

  async findAll() {
    const { rows } = await pool.query(
      `SELECT *
       FROM groups
       ORDER BY name`
    );

    return rows;
  },

  async findParents() {
    const { rows } = await pool.query(
      `SELECT *
       FROM groups
       WHERE parent_group_id IS NULL
       ORDER BY name`
    );

    return rows;
  },

  async findById(id, db = pool) {
    const { rows } = await db.query(
      `SELECT *
       FROM groups
       WHERE id = $1`,
      [id]
    );

    return rows[0] || null;
  },

  async findChildren(parentGroupId) {
    const { rows } = await pool.query(
      `SELECT *
       FROM groups
       WHERE parent_group_id = $1
       ORDER BY name`,
      [parentGroupId]
    );

    return rows;
  },

  async findGroupsByUserId(userId) {
    const { rows } = await pool.query(
      `SELECT
         g.id,
         g.name,
         g.type,
         g.parent_group_id,
         g.location,
         g.description,
         ug.group_id
       FROM user_groups AS ug
       INNER JOIN groups AS g
         ON g.id = ug.group_id
       WHERE ug.user_id = $1
       ORDER BY g.name ASC`,
      [userId]
    );

    return rows;
  },

  // Delete a group by ID.
  async delete(id) {
    const { rows } = await pool.query(
      `DELETE FROM groups
       WHERE id = $1
       RETURNING *`,
      [id]
    );

    return rows[0] || null;
  },
};

module.exports = Group;
