const pool = require('../Config/db');

const EventModel = {
  // Create a new event
  async create({
    group_id,
    title,
    description,
    start_date,
    end_date,
    event_location,
    created_by,
  }) {
    const query = `
      INSERT INTO events (
        group_id,
        title,
        description,
        start_date,
        end_date,
        event_location,
        created_by
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *
    `;

    const values = [
      group_id,
      title,
      description,
      start_date,
      end_date,
      event_location || null,
      created_by,
    ];

    const result = await pool.query(query, values);
    return result.rows[0];
  },

  // Retrieve all events across all groups
  async findAll() {
    const result = await pool.query(`
      SELECT *
      FROM events
      ORDER BY start_date DESC
    `);

    return result.rows;
  },

  // Retrieve events belonging to one group
  async findAllByGroup(groupId) {
    const result = await pool.query(
      `
        SELECT *
        FROM events
        WHERE group_id = $1
        ORDER BY start_date DESC
      `,
      [groupId]
    );

    return result.rows;
  },

  // Retrieve one event by ID
  async findById(id) {
    const result = await pool.query(
      'SELECT * FROM events WHERE id = $1',
      [id]
    );

    return result.rows[0];
  },

  // Retrieve one event belonging to a particular group
  async findByIdAndGroup(id, groupId) {
    const result = await pool.query(
      `
        SELECT *
        FROM events
        WHERE id = $1 AND group_id = $2
      `,
      [id, groupId]
    );

    return result.rows[0];
  },

  // Update an existing event
  async update(id, {
    title,
    description,
    start_date,
    end_date,
    event_location,
  }) {
    const result = await pool.query(
      `
        UPDATE events
        SET title = $1,
            description = $2,
            start_date = $3,
            end_date = $4,
            event_location = $5
        WHERE id = $6
        RETURNING *
      `,
      [
        title,
        description,
        start_date,
        end_date,
        event_location || null,
        id,
      ]
    );

    return result.rows[0];
  },

  // Delete an existing event
  async delete(id) {
    const result = await pool.query(
      'DELETE FROM events WHERE id = $1 RETURNING *',
      [id]
    );

    return result.rows[0];
  },
};

module.exports = EventModel;