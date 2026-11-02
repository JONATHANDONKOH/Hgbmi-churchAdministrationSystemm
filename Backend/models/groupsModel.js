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

  // Get all groups together with their parent group details.
  async findAll() {
    const { rows } = await pool.query(
      `SELECT
         child.*,
         parent.id AS parent_id,
         parent.name AS parent_group_name,
         parent.type AS parent_group_type,
         parent.location AS parent_group_location
       FROM groups AS child
       LEFT JOIN groups AS parent
         ON parent.id = child.parent_group_id
       ORDER BY child.name`
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

  // Find a group together with its parent group's details.
  async findById(id, db = pool) {
    const { rows } = await db.query(
      `SELECT
         child.*,
         parent.id AS parent_id,
         parent.name AS parent_group_name,
         parent.type AS parent_group_type,
         parent.location AS parent_group_location
       FROM groups AS child
       LEFT JOIN groups AS parent
         ON parent.id = child.parent_group_id
       WHERE child.id = $1
       LIMIT 1`,
      [id]
    );

    return rows[0] || null;
  },

  async findChildren(parentGroupId) {
    const { rows } = await pool.query(
      `SELECT
         child.*,
         parent.name AS parent_group_name,
         parent.type AS parent_group_type
       FROM groups AS child
       LEFT JOIN groups AS parent
         ON parent.id = child.parent_group_id
       WHERE child.parent_group_id = $1
       ORDER BY child.name`,
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
         g.created_by,
         parent.name AS parent_group_name,
         ug.group_id
       FROM user_groups AS ug
       INNER JOIN groups AS g
         ON g.id = ug.group_id
       LEFT JOIN groups AS parent
         ON parent.id = g.parent_group_id
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