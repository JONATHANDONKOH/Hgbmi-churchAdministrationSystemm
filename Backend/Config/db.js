const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL, // Neon connection string
  ssl: { rejectUnauthorized: false },
});

module.exports = pool;