const pool = require('../Config/db');
const bcrypt = require('bcryptjs');

const User = {
  async create({
    fullName,
    email,
    password,
    role = 'user'
  }) {
    const hashed = await bcrypt.hash(password, 10);

    const { rows } = await pool.query(
      `INSERT INTO users (full_name, email, password, role)
       VALUES ($1, $2, $3, $4)
       RETURNING id, full_name, email, role, created_at`,
      [fullName, email, hashed, role]
    );

    return rows[0];
  },

  async findByEmail(email) {
    const { rows } = await pool.query(
      `SELECT * FROM users WHERE email = $1`,
      [email]
    );

    return rows[0];
  },

  async findSuperAdmin() {
    const { rows } = await pool.query(
      `SELECT id, full_name, email, role, created_at
       FROM users
       WHERE role = 'super_admin'
       LIMIT 1`
    );

    return rows[0] || null;
  },

  async findById(id) {
    const { rows } = await pool.query(
      `SELECT id, full_name, email, role, created_at
       FROM users
       WHERE id = $1`,
      [id]
    );

    return rows[0];
  },

  async comparePassword(candidate, hash) {
    return bcrypt.compare(candidate, hash);
  },
};

module.exports = User;