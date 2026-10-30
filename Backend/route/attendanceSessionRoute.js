const express = require('express');
const router = express.Router();

const AttendanceSessionController = require('../Controller/attendanceSessionController');
const { protect } = require('../middleware/authMiddleware');

// Create an attendance session
router.post('/sessions', protect, AttendanceSessionController.createSession);

// Get attendance sessions for a group
router.get('/sessions/:groupId', protect, AttendanceSessionController.getGroupSessions);

// Get members and their attendance records for a session
router.get('/sessions/:sessionId/members', protect, AttendanceSessionController.getSessionMembers);

// Save attendance records (late/excused records need a note)
router.post('/sessions/:sessionId/records', protect, AttendanceSessionController.saveRecords);

// Delete one member's attendance record for a session
router.delete('/sessions/:sessionId/records/:userId', protect, AttendanceSessionController.deleteRecord);

// Delete a session and all of its records
router.delete('/sessions/:sessionId', protect, AttendanceSessionController.deleteSession);

// QR-code check-in
router.post('/check-in', protect, AttendanceSessionController.qrCheckIn);

module.exports = router;