
require('dotenv').config();

const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');

// ============================================================
// ROUTE IMPORTS
// ============================================================

const authRoutes = require('./route/authRoute');
const permissionRoutes = require('./route/permissionRoute');
const userPermissionRoutes = require('./route/userPermissionRoute');
const groupsRoutes = require('./route/groupsRoute');
const userGroupRoutes = require('./route/userGroupRoute');
const eventRoutes = require('./route/eventRoute');
const meetingRoutes = require('./route/meetingRoute');
const requestRoutes = require('./route/requestRoute');
const superAdminRoutes = require('./route/superAdminRoute');

// Attendance routes
const attendanceRoutes = require('./route/attendanceSessionRoute');

// ============================================================
// EXPRESS APPLICATION
// ============================================================

const app = express();

// ============================================================
// MIDDLEWARE
// ============================================================

// CORS configuration
app.use(
  cors({
    origin: process.env.CLIENT_URL || 'http://localhost:5173',
    credentials: true,
  })
);

// Parse cookies
app.use(cookieParser());

// Parse JSON request bodies
app.use(express.json());

// Parse URL-encoded request bodies
app.use(express.urlencoded({ extended: true }));

// ============================================================
// API ROUTES
// ============================================================

app.use('/api/auth', authRoutes);

app.use('/api/permissions', permissionRoutes);

app.use('/api/user-permissions', userPermissionRoutes);

app.use('/api/groups', groupsRoutes);

app.use('/api/user-groups', userGroupRoutes);

app.use('/api/events', eventRoutes);

app.use('/api/meetings', meetingRoutes);

app.use('/api/requests', requestRoutes);

app.use('/api/super-admin', superAdminRoutes);

// Attendance management
app.use('/api/attendance', attendanceRoutes);

// ============================================================
// HEALTH CHECK
// ============================================================

app.get('/', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'HGBMI Church Administration API is running',
  });
});

// ============================================================
// 404 HANDLER
// ============================================================

app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found',
    path: req.originalUrl,
  });
});

// ============================================================
// GLOBAL ERROR HANDLER
// ============================================================

app.use((err, req, res, next) => {
  console.error('Server error:', err);

  if (res.headersSent) {
    return next(err);
  }

  res.status(err.status || 500).json({
    success: false,
    message:
      process.env.NODE_ENV === 'production'
        ? 'Something went wrong'
        : err.message || 'Something went wrong',
  });
});

// ============================================================
// START SERVER
// ============================================================

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`HGBMI Church Administration API running on port ${PORT}`);
});

