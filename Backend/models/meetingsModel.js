const pool = require('../Config/db');

// Columns that update() may change (keys are the camelCase fields the controller sends)
const UPDATABLE_COLUMNS = {
  title: 'title',
  description: 'description',
  startDate: 'start_date',
  endDate: 'end_date',
  location: 'location',
};

const Meeting = {
  async create(
    {
      groupId,
      title,
      description,
      startDate,
      endDate,
      location = null,
      createdBy,
    },
    db = pool
  ) {
    const { rows } = await db.query(
      `INSERT INTO meetings
         (group_id, title, description, start_date, end_date, location, created_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [groupId, title, description, startDate, endDate, location, createdBy]
    );

    return rows[0];
  },

  // Meetings for a group, soonest first.
  // from / to are YYYY-MM-DD, and "to" includes that whole day.
  async findByGroup(groupId, { from, to } = {}) {
    const params = [groupId];
    let sql = `SELECT * FROM meetings WHERE group_id = $1`;

    if (from) {
      params.push(from);
      sql += ` AND start_date >= $${params.length}::date`;
    }

    if (to) {
      params.push(to);
      sql += ` AND start_date < ($${params.length}::date + 1)`;
    }

    sql += ` ORDER BY start_date ASC, id ASC`;

    const { rows } = await pool.query(sql, params);
    return rows;
  },

  async findById(id, db = pool) {
    const { rows } = await db.query(`SELECT * FROM meetings WHERE id = $1`, [id]);
    return rows[0] || null;
  },

  // Only the fields that are not undefined are updated.
  // Passing location: null clears the location.
  async update(id, fields, db = pool) {
    const params = [id];
    const sets = [];

    for (const [key, column] of Object.entries(UPDATABLE_COLUMNS)) {
      if (fields[key] !== undefined) {
        params.push(fields[key]);
        sets.push(`${column} = $${params.length}`);
      }
    }

    if (sets.length === 0) {
      return Meeting.findById(id, db);
    }

    const { rows } = await db.query(
      `UPDATE meetings
       SET ${sets.join(', ')}
       WHERE id = $1
       RETURNING *`,
      params
    );

    return rows[0] || null;
  },

  async remove(id, db = pool) {
    const { rowCount } = await db.query(`DELETE FROM meetings WHERE id = $1`, [id]);
    return rowCount > 0;
  },

  // Is this user in this group (via user_groups)?
  async isUserInGroup(userId, groupId) {
    const { rows } = await pool.query(
      `SELECT 1 FROM user_groups WHERE user_id = $1 AND group_id = $2 LIMIT 1`,
      [userId, groupId]
    );

    return rows.length > 0;
  },
};

module.exports = Meeting;