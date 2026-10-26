
const pool = require('../Config/db');

// Columns that are safe to send to the client.
// password_hash is deliberately NOT in this list.
const PUBLIC_COLUMNS = [
  'id',
  'request_type',
  'requested_by',
  'group_id',
  'request_data',
  'status',
  'reviewed_by',
  'reviewed_at',
  'review_note',
  'created_at',
];

const columns = (alias) =>
  PUBLIC_COLUMNS.map((name) => (alias ? `${alias}.${name}` : name)).join(', ');

// Requests plus the names an administrator needs to see in a list.
const BASE_SELECT = `
  SELECT ${columns('r')},
         u.full_name AS requested_by_name,
         g.name AS group_name
  FROM requests r
  JOIN users u ON u.id = r.requested_by
  JOIN groups g ON g.id = r.group_id`;

// Moves a PENDING request to approved/rejected and wipes any stored password
// hash in the same statement.
const review = async (db, id, status, reviewedBy, reviewNote) => {
  const { rows } = await db.query(
    `UPDATE requests
     SET status = $2,
         reviewed_by = $3,
         reviewed_at = NOW(),
         review_note = $4,
         password_hash = NULL
     WHERE id = $1 AND status = 'pending'
     RETURNING ${columns()}`,
    [id, status, reviewedBy, reviewNote]
  );

  return rows[0] || null;
};

const Request = {
  // Create a request.
  // passwordHash is only used by new-member requests (already bcrypt-hashed).
  async create(
    { requestType, requestedBy, groupId, requestData, passwordHash = null },
    db = pool
  ) {
    const { rows } = await db.query(
      `INSERT INTO requests
         (request_type, requested_by, group_id, request_data, password_hash, status)
       VALUES ($1, $2, $3, $4::jsonb, $5, 'pending')
       RETURNING ${columns()}`,
      [
        requestType,
        requestedBy,
        groupId,
        JSON.stringify(requestData),
        passwordHash,
      ]
    );

    return rows[0];
  },

  // Find one request by ID.
  async findById(id, db = pool) {
    const { rows } = await db.query(
      `${BASE_SELECT} WHERE r.id = $1`,
      [id]
    );

    return rows[0] || null;
  },

  // Internal use only: includes password_hash.
  // Call inside a transaction.
  async findByIdForUpdate(id, db) {
    const { rows } = await db.query(
      `SELECT * FROM requests WHERE id = $1 FOR UPDATE`,
      [id]
    );

    return rows[0] || null;
  },

  // Find requests with optional filters.
  async findAll(
    { status, requestType, requestedBy, oldestFirst = false } = {},
    db = pool
  ) {
    const params = [];
    const conditions = [];

    if (status) {
      params.push(status);
      conditions.push(`r.status = $${params.length}`);
    }

    if (requestType) {
      params.push(requestType);
      conditions.push(`r.request_type = $${params.length}`);
    }

    if (requestedBy) {
      params.push(requestedBy);
      conditions.push(`r.requested_by = $${params.length}`);
    }

    const where =
      conditions.length > 0
        ? `WHERE ${conditions.join(' AND ')}`
        : '';

    const direction = oldestFirst ? 'ASC' : 'DESC';

    const { rows } = await db.query(
      `${BASE_SELECT}
       ${where}
       ORDER BY r.created_at ${direction}, r.id ${direction}`,
      params
    );

    return rows;
  },

  // Find pending requests, oldest first.
  async findPending(db = pool) {
    return Request.findAll(
      { status: 'pending', oldestFirst: true },
      db
    );
  },

  // Find requests submitted by one user.
  async findByUser(userId, filters = {}, db = pool) {
    return Request.findAll(
      { ...filters, requestedBy: userId },
      db
    );
  },

  // Approve a pending request.
  async approve(id, { reviewedBy, reviewNote = null }, db = pool) {
    return review(db, id, 'approved', reviewedBy, reviewNote);
  },

  // Reject a pending request.
  async reject(id, { reviewedBy, reviewNote = null }, db = pool) {
    return review(db, id, 'rejected', reviewedBy, reviewNote);
  },

  // Delete a request by ID.
  // Returns the deleted request, or null if the ID does not exist.
  async delete(id, db = pool) {
    const { rows } = await db.query(
      `DELETE FROM requests
       WHERE id = $1
       RETURNING ${columns()}`,
      [id]
    );

    return rows[0] || null;
  },

  // Check whether a user belongs to a group.
  async isGroupMember(userId, groupId, db = pool) {
    const { rows } = await db.query(
      `SELECT 1
       FROM user_groups
       WHERE user_id = $1 AND group_id = $2
       LIMIT 1`,
      [userId, groupId]
    );

    return rows.length > 0;
  },
};

module.exports = Request;
