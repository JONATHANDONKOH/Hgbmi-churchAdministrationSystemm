require('dotenv').config();

const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');

const authRoutes = require('./route/authRoute');
const permissionRoutes = require('./route/permissionRoute');
const userPermissionRoutes = require('./route/userPermissionRoute');
const groupsRoutes = require('./route/groupsRoute');
const userGroupRoutes = require('./route/userGroupRoute');
const eventRoutes = require('./route/eventRoute');
const meetingRoutes = require('./route/meetingRoute');
const requestRoutes = require('./route/requestRoute');
const superAdminRoutes = require('./route/superAdminRoute');

const app = express();

// Middleware
app.use(
  cors({
    origin: process.env.CLIENT_URL || 'http://localhost:5173',
    credentials: true,
  })
);
app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/permissions', permissionRoutes);
app.use('/api/user-permissions', userPermissionRoutes);
app.use('/api/groups', groupsRoutes);
app.use('/api/user-groups', userGroupRoutes);
app.use('/api/events', eventRoutes);
app.use('/api/meetings', meetingRoutes);
app.use('/api/requests', requestRoutes);
app.use('/api/super-admin', superAdminRoutes);

// Health check
app.get('/', (req, res) => {
  res.status(200).json({ message: 'API is running' });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ message: 'Route not found' });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ message: 'Something went wrong' });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});