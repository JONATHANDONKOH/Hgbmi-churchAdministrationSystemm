
const pool = require('../Config/db');
const jwt = require('jsonwebtoken');

const MAX_INT = 2147483647;
const ALLOWED_STATUSES = ['present', 'absent', 'late', 'excused'];
const NOTE_REQUIRED_STATUSES = ['late', 'excused'];
const MAX_NOTE_LENGTH = 500;

const toId = (value) => {
  const n =
    typeof value === 'string' && /^\d+$/.test(value)
      ? Number(value)
      : value;

  return Number.isSafeInteger(n) && n > 0 && n <= MAX_INT ? n : null;
};

const qrSecret = () => {
  const secret = process.env.ATTENDANCE_QR_SECRET;

  if (!secret) {
    throw new Error('ATTENDANCE_QR_SECRET is not configured');
  }

  return secret;
};

const isValidDate = (value) => {
  if (typeof value !== 'string') return false;

  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return false;
  }

  const date = new Date(`${value}T00:00:00.000Z`);

  return (
    !Number.isNaN(date.getTime()) &&
    date.toISOString().slice(0, 10) === value
  );
};

// Administrators can manage attendance.
// Other users must be the assigned leader of the group.
async function canManageGroup(user, groupId, db = pool) {
  if (!user || !toId(user.id)) {
    return false;
  }

  if (user.role === 'super_admin' || user.role === 'admin') {
    return true;
  }

  const result = await db.query(
    `SELECT id
       FROM groups
      WHERE id = $1
        AND leader_id = $2
      LIMIT 1`,
    [groupId, user.id]
  );

  return result.rowCount > 0;
}

// Session status is based on submitted_at.
// A QR scan does not submit the whole session.
async function getSession(sessionId, db = pool) {
  const result = await db.query(
    `SELECT
       id,
       group_id,
       session_name,
       to_char(attendance_date, 'YYYY-MM-DD') AS attendance_date,
       (attendance_date < CURRENT_DATE) AS is_past,
       (submitted_at IS NOT NULL) AS is_submitted,
       submitted_at,
       recorded_by,
       created_at
     FROM attendance_sessions
     WHERE id = $1`,
    [sessionId]
  );

  return result.rows[0] || null;
}

const AttendanceController = {
  // POST /api/attendance/sessions
  async createSession(req, res) {
    try {
      const groupId = toId(req.body?.groupId);

      const sessionName =
        typeof req.body?.sessionName === 'string'
          ? req.body.sessionName.trim()
          : '';

      const attendanceDate = req.body?.attendanceDate;

      if (!groupId || !sessionName || !attendanceDate) {
        return res.status(400).json({
          error: 'groupId, sessionName and attendanceDate are required',
        });
      }

      if (!isValidDate(attendanceDate)) {
        return res.status(400).json({
          error: 'attendanceDate must be a valid YYYY-MM-DD date',
        });
      }

      const secret = qrSecret();

      if (!(await canManageGroup(req.user, groupId))) {
        return res.status(403).json({
          error: 'You are not authorized to manage attendance for this group',
        });
      }

      const dateCheck = await pool.query(
        `SELECT ($1::date < CURRENT_DATE) AS is_past`,
        [attendanceDate]
      );

      if (dateCheck.rows[0].is_past) {
        return res.status(400).json({
          error: 'Attendance sessions cannot be created for past dates',
        });
      }

      const result = await pool.query(
        `INSERT INTO attendance_sessions
           (group_id, session_name, attendance_date, recorded_by)
         VALUES ($1, $2, $3, $4)
         RETURNING
           id,
           group_id,
           session_name,
           to_char(attendance_date, 'YYYY-MM-DD') AS attendance_date,
           recorded_by,
           created_at`,
        [groupId, sessionName, attendanceDate, req.user.id]
      );

      const session = result.rows[0];

      const qrToken = jwt.sign(
        {
          purpose: 'attendance_checkin',
          sessionId: session.id,
          groupId: session.group_id,
        },
        secret,
        {
          expiresIn: '15m',
          issuer: 'hgbmi-attendance',
        }
      );

      return res.status(201).json({
        message: 'Attendance session created successfully',
        session,
        qrToken,
        qrExpiresInSeconds: 900,
      });
    } catch (err) {
      console.error('Create attendance session error:', err);

      return res.status(500).json({
        error: 'Failed to create attendance session',
      });
    }
  },

  // GET /api/attendance/sessions/:groupId
  async getGroupSessions(req, res) {
    try {
      const groupId = toId(req.params.groupId);

      if (!groupId) {
        return res.status(400).json({
          error: 'Invalid group ID',
        });
      }

      if (!(await canManageGroup(req.user, groupId))) {
        return res.status(403).json({
          error: 'You are not authorized to view this group attendance',
        });
      }

      const result = await pool.query(
        `SELECT
           s.id,
           s.group_id,
           s.session_name,
           to_char(s.attendance_date, 'YYYY-MM-DD') AS attendance_date,
           (s.attendance_date < CURRENT_DATE) AS is_past,
           (s.submitted_at IS NOT NULL) AS is_submitted,
           s.submitted_at,
           s.recorded_by,
           s.created_at,
           COUNT(r.id)::int AS total_records,
           COUNT(r.id) FILTER (
             WHERE r.status = 'present'
           )::int AS present,
           COUNT(r.id) FILTER (
             WHERE r.status = 'absent'
           )::int AS absent,
           COUNT(r.id) FILTER (
             WHERE r.status = 'late'
           )::int AS late,
           COUNT(r.id) FILTER (
             WHERE r.status = 'excused'
           )::int AS excused
         FROM attendance_sessions s
         LEFT JOIN attendance_records r
           ON r.session_id = s.id
         WHERE s.group_id = $1
         GROUP BY s.id
         ORDER BY s.attendance_date DESC, s.id DESC`,
        [groupId]
      );

      return res.json(result.rows);
    } catch (err) {
      console.error('Get attendance sessions error:', err);

      return res.status(500).json({
        error: 'Failed to fetch attendance sessions',
      });
    }
  },

  // GET /api/attendance/sessions/:sessionId/members
  async getSessionMembers(req, res) {
    try {
      const sessionId = toId(req.params.sessionId);

      if (!sessionId) {
        return res.status(400).json({
          error: 'Invalid session ID',
        });
      }

      const session = await getSession(sessionId);

      if (!session) {
        return res.status(404).json({
          error: 'Attendance session not found',
        });
      }

      if (!(await canManageGroup(req.user, session.group_id))) {
        return res.status(403).json({
          error: 'You are not authorized to view this attendance session',
        });
      }

      const result = await pool.query(
        `SELECT
           u.id AS user_id,
           u.full_name,
           u.email,
           ar.id AS attendance_record_id,
           ar.status,
           ar.note,
           ar.source,
           ar.marked_by,
           ar.created_at AS marked_at
         FROM user_groups ug
         JOIN users u
           ON u.id = ug.user_id
         LEFT JOIN attendance_records ar
           ON ar.user_id = ug.user_id
          AND ar.session_id = $2
         WHERE ug.group_id = $1
         ORDER BY u.full_name ASC`,
        [session.group_id, sessionId]
      );

      return res.json({
        session,
        members: result.rows,
      });
    } catch (err) {
      console.error('Get session members error:', err);

      return res.status(500).json({
        error: 'Failed to fetch attendance members',
      });
    }
  },

  // POST /api/attendance/sessions/:sessionId/records
  // Saves manual attendance and submits the session.
  // Existing QR records are updated instead of duplicated.
  async saveRecords(req, res) {
    const sessionId = toId(req.params.sessionId);
    const records = req.body?.records;

    if (!sessionId) {
      return res.status(400).json({
        error: 'Invalid session ID',
      });
    }

    if (!Array.isArray(records) || records.length === 0) {
      return res.status(400).json({
        error: 'records must be a non-empty array',
      });
    }

    if (records.length > 500) {
      return res.status(400).json({
        error: 'A maximum of 500 records can be saved at once',
      });
    }

    const normalized = [];
    const seen = new Set();

    for (const record of records) {
      if (!record || typeof record !== 'object') {
        return res.status(400).json({
          error: 'Each record must contain a userId and status',
        });
      }

      const userId = toId(record.userId);

      const status =
        typeof record.status === 'string'
          ? record.status.toLowerCase()
          : '';

      if (!userId || !ALLOWED_STATUSES.includes(status)) {
        return res.status(400).json({
          error: 'Each record needs a valid userId and attendance status',
        });
      }

      if (seen.has(userId)) {
        return res.status(400).json({
          error: 'Each user can appear only once in a request',
        });
      }

      const note =
        typeof record.note === 'string' ? record.note.trim() : '';

      const needsNote = NOTE_REQUIRED_STATUSES.includes(status);

      if (needsNote && !note) {
        return res.status(400).json({
          error: 'A reason is required for late and excused records',
        });
      }

      if (note.length > MAX_NOTE_LENGTH) {
        return res.status(400).json({
          error: `A reason cannot exceed ${MAX_NOTE_LENGTH} characters`,
        });
      }

      seen.add(userId);

      normalized.push({
        userId,
        status,
        note: needsNote ? note : null,
      });
    }

    const client = await pool.connect();
    let transactionStarted = false;

    try {
      await client.query('BEGIN');
      transactionStarted = true;

      const sessionResult = await client.query(
        `SELECT
           id,
           group_id,
           session_name,
           attendance_date,
           (attendance_date < CURRENT_DATE) AS is_past,
           (submitted_at IS NOT NULL) AS is_submitted
         FROM attendance_sessions
         WHERE id = $1
         FOR UPDATE`,
        [sessionId]
      );

      const session = sessionResult.rows[0];

      if (!session) {
        await client.query('ROLLBACK');
        transactionStarted = false;

        return res.status(404).json({
          error: 'Attendance session not found',
        });
      }

      if (!(await canManageGroup(req.user, session.group_id, client))) {
        await client.query('ROLLBACK');
        transactionStarted = false;

        return res.status(403).json({
          error: 'You are not authorized to record this attendance',
        });
      }

      if (session.is_past) {
        await client.query('ROLLBACK');
        transactionStarted = false;

        return res.status(409).json({
          error: 'Attendance for past sessions cannot be changed',
        });
      }

      if (session.is_submitted) {
        await client.query('ROLLBACK');
        transactionStarted = false;

        return res.status(409).json({
          error: 'Attendance has already been submitted for this session',
        });
      }

      const membership = await client.query(
        `SELECT user_id
         FROM user_groups
         WHERE group_id = $1
           AND user_id = ANY($2::int[])`,
        [session.group_id, normalized.map((record) => record.userId)]
      );

      if (membership.rowCount !== normalized.length) {
        await client.query('ROLLBACK');
        transactionStarted = false;

        return res.status(400).json({
          error: 'One or more users are not members of this group',
        });
      }

      const saved = [];

      for (const record of normalized) {
        const result = await client.query(
          `INSERT INTO attendance_records
             (session_id, user_id, status, note, marked_by, source)
           VALUES ($1, $2, $3, $4, $5, 'manual')
           ON CONFLICT (session_id, user_id)
           DO UPDATE SET
             status = EXCLUDED.status,
             note = EXCLUDED.note,
             marked_by = EXCLUDED.marked_by,
             source = 'manual'
           RETURNING
             id,
             session_id,
             user_id,
             status,
             note,
             marked_by,
             source,
             created_at`,
          [
            sessionId,
            record.userId,
            record.status,
            record.note,
            req.user.id,
          ]
        );

        saved.push(result.rows[0]);
      }

      // This is the only operation that submits the whole session.
      await client.query(
        `UPDATE attendance_sessions
         SET submitted_at = NOW()
         WHERE id = $1`,
        [sessionId]
      );

      await client.query('COMMIT');
      transactionStarted = false;

      return res.json({
        message: 'Attendance saved successfully',
        count: saved.length,
        records: saved,
      });
    } catch (err) {
      if (transactionStarted) {
        await client.query('ROLLBACK').catch(() => {});
      }

      console.error('Save attendance records error:', err);

      return res.status(500).json({
        error: 'Failed to save attendance records',
      });
    } finally {
      client.release();
    }
  },

  // DELETE /api/attendance/sessions/:sessionId
  async deleteSession(req, res) {
    const sessionId = toId(req.params.sessionId);

    if (!sessionId) {
      return res.status(400).json({
        error: 'Invalid session ID',
      });
    }

    const client = await pool.connect();
    let transactionStarted = false;

    try {
      await client.query('BEGIN');
      transactionStarted = true;

      const sessionResult = await client.query(
        `SELECT id, group_id
         FROM attendance_sessions
         WHERE id = $1
         FOR UPDATE`,
        [sessionId]
      );

      const session = sessionResult.rows[0];

      if (!session) {
        await client.query('ROLLBACK');
        transactionStarted = false;

        return res.status(404).json({
          error: 'Attendance session not found',
        });
      }

      if (!(await canManageGroup(req.user, session.group_id, client))) {
        await client.query('ROLLBACK');
        transactionStarted = false;

        return res.status(403).json({
          error: 'You are not authorized to delete this attendance session',
        });
      }

      await client.query(
        `DELETE FROM attendance_records WHERE session_id = $1`,
        [sessionId]
      );

      await client.query(
        `DELETE FROM attendance_sessions WHERE id = $1`,
        [sessionId]
      );

      await client.query('COMMIT');
      transactionStarted = false;

      return res.json({
        message: 'Attendance session deleted successfully',
      });
    } catch (err) {
      if (transactionStarted) {
        await client.query('ROLLBACK').catch(() => {});
      }

      console.error('Delete attendance session error:', err);

      return res.status(500).json({
        error: 'Failed to delete attendance session',
      });
    } finally {
      client.release();
    }
  },

  // DELETE /api/attendance/sessions/:sessionId/records/:userId
  async deleteRecord(req, res) {
    try {
      const sessionId = toId(req.params.sessionId);
      const userId = toId(req.params.userId);

      if (!sessionId || !userId) {
        return res.status(400).json({
          error: 'Invalid session ID or user ID',
        });
      }

      const session = await getSession(sessionId);

      if (!session) {
        return res.status(404).json({
          error: 'Attendance session not found',
        });
      }

      if (!(await canManageGroup(req.user, session.group_id))) {
        return res.status(403).json({
          error: 'You are not authorized to change this attendance session',
        });
      }

      if (session.is_past) {
        return res.status(409).json({
          error: 'Attendance for past sessions cannot be changed',
        });
      }

      if (session.is_submitted) {
        return res.status(409).json({
          error: 'Attendance has already been submitted for this session',
        });
      }

      const result = await pool.query(
        `DELETE FROM attendance_records
         WHERE session_id = $1
           AND user_id = $2`,
        [sessionId, userId]
      );

      if (result.rowCount === 0) {
        return res.status(404).json({
          error: 'Attendance record not found',
        });
      }

      return res.json({
        message: 'Attendance record deleted successfully',
      });
    } catch (err) {
      console.error('Delete attendance record error:', err);

      return res.status(500).json({
        error: 'Failed to delete attendance record',
      });
    }
  },

  // POST /api/attendance/check-in
  // QR check-ins are saved immediately.
  // They do not submit or lock the whole session.
  async qrCheckIn(req, res) {
    try {
      if (!req.user || !toId(req.user.id)) {
        return res.status(401).json({
          error: 'Authentication is required',
        });
      }

      const { qrToken } = req.body || {};

      if (typeof qrToken !== 'string' || !qrToken.trim()) {
        return res.status(400).json({
          error: 'qrToken is required',
        });
      }

      let payload;

      try {
        payload = jwt.verify(qrToken, qrSecret(), {
          issuer: 'hgbmi-attendance',
        });
      } catch (err) {
        return res.status(401).json({
          error: 'QR code is invalid or has expired',
        });
      }

      if (!payload || payload.purpose !== 'attendance_checkin') {
        return res.status(401).json({
          error: 'Invalid attendance QR code',
        });
      }

      const sessionId = toId(payload.sessionId);
      const groupId = toId(payload.groupId);

      if (!sessionId || !groupId) {
        return res.status(401).json({
          error: 'Invalid attendance QR code',
        });
      }

      const client = await pool.connect();
      let transactionStarted = false;

      try {
        await client.query('BEGIN');
        transactionStarted = true;

        const sessionResult = await client.query(
          `SELECT
             id,
             group_id,
             session_name,
             attendance_date,
             (attendance_date < CURRENT_DATE) AS is_past,
             (submitted_at IS NOT NULL) AS is_submitted
           FROM attendance_sessions
           WHERE id = $1
           FOR UPDATE`,
          [sessionId]
        );

        const session = sessionResult.rows[0];

        if (!session || Number(session.group_id) !== groupId) {
          await client.query('ROLLBACK');
          transactionStarted = false;

          return res.status(404).json({
            error: 'Attendance session not found',
          });
        }

        if (session.is_past || session.is_submitted) {
          await client.query('ROLLBACK');
          transactionStarted = false;

          return res.status(409).json({
            error: 'Attendance for this session is closed',
          });
        }

        const member = await client.query(
          `SELECT 1
           FROM user_groups
           WHERE user_id = $1
             AND group_id = $2
           LIMIT 1`,
          [req.user.id, groupId]
        );

        if (member.rowCount === 0) {
          await client.query('ROLLBACK');
          transactionStarted = false;

          return res.status(403).json({
            error: 'You are not a member of this group',
          });
        }

        // Save immediately when the QR code is scanned.
        // A unique (session_id, user_id) constraint prevents duplicates.
        const result = await client.query(
          `INSERT INTO attendance_records
             (session_id, user_id, status, note, marked_by, source)
           VALUES ($1, $2, 'present', NULL, $2, 'qr')
           ON CONFLICT (session_id, user_id)
           DO UPDATE SET
             status = 'present',
             note = NULL,
             marked_by = EXCLUDED.marked_by,
             source = 'qr'
           RETURNING
             id,
             session_id,
             user_id,
             status,
             note,
             marked_by,
             source,
             created_at`,
          [sessionId, req.user.id]
        );

        // Deliberately do not update attendance_sessions.submitted_at.
        await client.query('COMMIT');
        transactionStarted = false;

        return res.json({
          message: 'Attendance check-in successful',
          record: result.rows[0],
        });
      } catch (err) {
        if (transactionStarted) {
          await client.query('ROLLBACK').catch(() => {});
        }

        throw err;
      } finally {
        client.release();
      }
    } catch (err) {
      console.error('QR attendance check-in error:', err);

      return res.status(500).json({
        error: 'Failed to check in',
      });
    }
  },
};

module.exports = AttendanceController;
