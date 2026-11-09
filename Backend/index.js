
require('dotenv').config();

const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const http = require('http');
const jwt = require('jsonwebtoken');
const { Server } = require('socket.io');

const User = require('./models/usersModel');

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

// Group duties routes
const groupDutiesRoutes = require('./route/groupDutiesRoute');

// ============================================================
// EXPRESS APPLICATION
// ============================================================

const app = express();

// ============================================================
// CORS CONFIGURATION
// ============================================================

const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:5173';

const corsOptions = {
  origin: CLIENT_URL,
  credentials: true
};

app.use(cors(corsOptions));

// ============================================================
// MIDDLEWARE
// ============================================================

app.use(cookieParser());

app.use(express.json());

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

// Group duties management
app.use('/api/group-duties', groupDutiesRoutes);

// ============================================================
// HEALTH CHECK
// ============================================================

app.get('/', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'HGBMI Church Administration API is running'
  });
});

// ============================================================
// 404 HANDLER
// ============================================================

app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found',
    path: req.originalUrl
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
        : err.message || 'Something went wrong'
  });
});

// ============================================================
// CREATE HTTP SERVER
// ============================================================

const server = http.createServer(app);

// ============================================================
// INITIALIZE SOCKET.IO
// ============================================================

const io = new Server(server, {
  cors: corsOptions
});

// Make Socket.IO available to other backend modules later.
app.set('io', io);

// ============================================================
// SOCKET.IO AUTHENTICATION
// ============================================================

io.use(async (socket, next) => {
  try {
    const cookieHeader = socket.handshake.headers.cookie || '';

    const tokenCookie = cookieHeader
      .split(';')
      .map(cookie => cookie.trim())
      .find(cookie => cookie.startsWith('token='));

    if (!tokenCookie) {
      return next(new Error('Not authenticated: token missing'));
    }

    const token = decodeURIComponent(
      tokenCookie.substring('token='.length)
    );

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const user = await User.findById(decoded.id);

    if (!user) {
      return next(new Error('Not authenticated: user not found'));
    }

    // Attach authenticated user to socket.
    socket.user = user;

    next();

  } catch (error) {
    console.error('Socket authentication error:', error.message);

    next(new Error('Not authenticated: invalid or expired token'));
  }
});

// ============================================================
// SOCKET CONNECTION
// ============================================================

io.on('connection', (socket) => {
  console.log(
    `User ${socket.user.id} connected through Socket.IO`
  );

  socket.on('disconnect', (reason) => {
    console.log(
      `User ${socket.user.id} disconnected: ${reason}`
    );
  });
});

// ============================================================
// START SERVER
// ============================================================

const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  console.log(
    `HGBMI Church Administration API running on port ${PORT}`
  );

  console.log(
    `Socket.IO server running on port ${PORT}`
  );
});
