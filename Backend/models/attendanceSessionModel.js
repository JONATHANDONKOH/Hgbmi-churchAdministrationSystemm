// queries/attendanceSessions.js
const pool = require('../Config/db');

// Create an attendance session
async function createAttendanceSession(
  { groupId, sessionName, attendanceDate, recordedBy },
  db = pool
) {
  const { rows } = await db.query(
    `INSERT INTO attendance_sessions
       (group_id, session_name, attendance_date, recorded_by)
     VALUES ($1, $2, $3, $4)
     RETURNING *`,
    [groupId, sessionName, attendanceDate, recordedBy]
  );

  return rows[0];
}

// Get one attendance session
async function getAttendanceSessionById(id, db = pool) {
  const { rows } = await db.query(
    `SELECT *
     FROM attendance_sessions
     WHERE id = $1`,
    [id]
  );

  return rows[0] || null;
}

// Get sessions for a group, optionally filtered by date
async function getSessionsByGroup(
  groupId,
  { from, to } = {},
  db = pool
) {
  const params = [groupId];

  let sql = `
    SELECT *
    FROM attendance_sessions
    WHERE group_id = $1
  `;

  if (from) {
    params.push(from);
    sql += ` AND attendance_date >= $${params.length}`;
  }

  if (to) {
    params.push(to);
    sql += ` AND attendance_date <= $${params.length}`;
  }

  sql += ` ORDER BY attendance_date DESC, id DESC`;

  const { rows } = await db.query(sql, params);

  return rows;
}

// Update an attendance session
async function updateAttendanceSession(
  id,
  { sessionName, attendanceDate } = {},
  db = pool
) {
  if (sessionName == null && attendanceDate == null) {
    const err = new Error(
      "Provide at least one of sessionName or attendanceDate"
    );
    err.statusCode = 400;
    throw err;
  }

  const { rows } = await db.query(
    `UPDATE attendance_sessions
     SET session_name = COALESCE($2, session_name),
         attendance_date = COALESCE($3, attendance_date)
     WHERE id = $1
     RETURNING *`,
    [id, sessionName ?? null, attendanceDate ?? null]
  );

  return rows[0] || null;
}

// Delete an attendance session
async function deleteAttendanceSession(id, db = pool) {
  const { rowCount } = await db.query(
    `DELETE FROM attendance_sessions
     WHERE id = $1`,
    [id]
  );

  return rowCount > 0;
}

module.exports = { createAttendanceSession, getAttendanceSessionById, getSessionsByGroup, updateAttendanceSession, deleteAttendanceSession };
