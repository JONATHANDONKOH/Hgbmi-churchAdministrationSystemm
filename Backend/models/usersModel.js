
const pool = require('../Config/db');
const bcrypt = require('bcryptjs');

const User = {
  async create({
    fullName,
    email,
    password,
    role = 'user',
    phoneNumber = null,
  }, db = pool) {
    const hashed = await bcrypt.hash(password, 10);

    const { rows } = await db.query(
      `INSERT INTO users (
        full_name, email, password, role, phone_number
      )
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, full_name, email, role, phone_number, created_at`,
      [fullName, email, hashed, role, phoneNumber]
    );

    return rows[0];
  },

  // Creates a user using an existing bcrypt hash.
  // Used when approving a membership request.
  async createFromHash({
    fullName,
    email,
    passwordHash,
    role = 'user',
    phoneNumber = null,
  }, db = pool) {
    const { rows } = await db.query(
      `INSERT INTO users (
        full_name, email, password, role, phone_number
      )
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, full_name, email, role, phone_number, created_at`,
      [fullName, email, passwordHash, role, phoneNumber]
    );

    return rows[0];
  },

  async findByEmail(email, db = pool) {
    const { rows } = await db.query(
      `SELECT *
       FROM users
       WHERE email = $1`,
      [email]
    );

    return rows[0] || null;
  },

  async findSuperAdmin(db = pool) {
    const { rows } = await db.query(
      `SELECT id, full_name, email, role, created_at
       FROM users
       WHERE role = 'super_admin'
       LIMIT 1`
    );

    return rows[0] || null;
  },

  async findById(id, db = pool) {
    const { rows } = await db.query(
      `SELECT
         id,
         full_name,
         email,
         role,
         phone_number,
         created_at
       FROM users
       WHERE id = $1`,
      [id]
    );

    return rows[0] || null;
  },

  // Updates an existing user's global role.
  // Pass a transaction client when used during request approval.
  async updateRole(userId, role, db = pool) {
    const { rows } = await db.query(
      `UPDATE users
       SET role = $1
       WHERE id = $2
       RETURNING
         id,
         full_name,
         email,
         role,
         phone_number,
         created_at`,
      [role, userId]
    );

    return rows[0] || null;
  },

  async comparePassword(candidate, hash) {
    return bcrypt.compare(candidate, hash);
  },

  // Gets all administrators with their request-review statistics.
  async findAllAdmins(db = pool) {
    const { rows } = await db.query(
      `SELECT
         u.id,
         u.full_name,
         u.email,
         u.role,
         u.phone_number,
         u.created_at,

         COUNT(r.id) FILTER (
           WHERE r.status IN ('approved', 'rejected')
         )::INTEGER AS total_reviewed,

         COUNT(r.id) FILTER (
           WHERE r.status = 'approved'
         )::INTEGER AS approved_requests,

         COUNT(r.id) FILTER (
           WHERE r.status = 'rejected'
         )::INTEGER AS rejected_requests,

         MAX(r.reviewed_at) AS last_reviewed_at

       FROM users u

       LEFT JOIN requests r
         ON r.reviewed_by = u.id

       WHERE u.role = 'admin'

       GROUP BY
         u.id,
         u.full_name,
         u.email,
         u.role,
         u.phone_number,
         u.created_at

       ORDER BY u.created_at DESC`
    );

    return rows;
  },
};

module.exports = User;
