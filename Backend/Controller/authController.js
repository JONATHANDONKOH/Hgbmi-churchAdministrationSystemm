
const jwt = require('jsonwebtoken');

const User = require('../models/usersModel');
const GroupsModel = require('../models/groupsModel');

// ============================================================
// JWT
// ============================================================

const signToken = (id, role, expiresIn) =>
  jwt.sign(
    { id, role },
    process.env.JWT_SECRET,
    { expiresIn }
  );

// ============================================================
// COOKIE OPTIONS
// ============================================================

const cookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'strict',
  maxAge: 24 * 60 * 60 * 1000,
};

const userCookieOptions = {
  ...cookieOptions,
  httpOnly: false,
};

// ============================================================
// AUTH COOKIES
// ============================================================

const setAuthCookies = (res, user, rememberMe = false) => {
  const expiresIn = rememberMe ? '30d' : '1d';

  const maxAge = rememberMe
    ? 30 * 24 * 60 * 60 * 1000
    : 24 * 60 * 60 * 1000;

  const token = signToken(
    user.id,
    user.role,
    expiresIn
  );

  res.cookie('token', token, {
    ...cookieOptions,
    maxAge,
  });

  // This cookie is only for frontend display.
  // The server must trust the verified JWT, not this cookie.
  res.cookie(
    'user',
    JSON.stringify({
      id: user.id,
      role: user.role,
    }),
    {
      ...userCookieOptions,
      maxAge,
    }
  );
};

// ============================================================
// GROUP INFORMATION
// ============================================================

const getUserWithGroups = async (user) => {
  const groups = await GroupsModel.findGroupsByUserId(
    user.id
  );

  return {
    id: user.id,
    full_name: user.full_name,
    email: user.email,
    role: user.role,
    created_at: user.created_at,
    groups,
  };
};

// ============================================================
// CHECK EXISTING SESSION
// ============================================================

const hasValidSession = async (req) => {
  try {
    const token = req.cookies?.token;

    if (!token) {
      return false;
    }

    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET
    );

    return Boolean(await User.findById(decoded.id));
  } catch (err) {
    return false;
  }
};

// ============================================================
// REGISTER
// POST /api/auth/register
// ============================================================

exports.register = async (req, res) => {
  try {
    const {
      fullName,
      email,
      password,
      confirmPassword,
    } = req.body;

    if (
      !fullName ||
      !email ||
      !password ||
      !confirmPassword
    ) {
      return res.status(400).json({
        message: 'All fields are required',
      });
    }

    const normalizedEmail = email.trim().toLowerCase();

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailRegex.test(normalizedEmail)) {
      return res.status(400).json({
        message: 'Invalid email address',
      });
    }

    if (password !== confirmPassword) {
      return res.status(400).json({
        message: 'Passwords do not match',
      });
    }

    if (password.length < 8) {
      return res.status(400).json({
        message: 'Password must be at least 8 characters',
      });
    }

    // Public registration must not allow users to
    // assign themselves privileged roles.
    const role = 'user';

    const existingUser = await User.findByEmail(
      normalizedEmail
    );

    if (existingUser) {
      return res.status(409).json({
        message: 'Email already in use',
      });
    }

    const loggedInAlready = await hasValidSession(req);

    const user = await User.create({
      fullName: fullName.trim(),
      email: normalizedEmail,
      password,
      role,
    });

    if (!loggedInAlready) {
      setAuthCookies(res, user);
    }

    const userWithGroups = await getUserWithGroups(user);

    return res.status(201).json({
      message: 'Account created successfully',
      user: userWithGroups,
    });
  } catch (err) {
    console.error('Register error:', err);

    return res.status(500).json({
      message: 'Server error',
    });
  }
};

// ============================================================
// REGISTER SUPER ADMIN
// POST /api/auth/register-super-admin
// ============================================================

exports.createSuperAdmin = async (req, res) => {
  try {
    const {
      fullName,
      email,
      password,
      confirmPassword,
    } = req.body;

    if (
      !fullName ||
      !email ||
      !password ||
      !confirmPassword
    ) {
      return res.status(400).json({
        message: 'All fields are required',
      });
    }

    if (password !== confirmPassword) {
      return res.status(400).json({
        message: 'Passwords do not match',
      });
    }

    if (password.length < 8) {
      return res.status(400).json({
        message: 'Password must be at least 8 characters',
      });
    }

    const normalizedEmail = email.trim().toLowerCase();

    const existingSuperAdmin = await User.findSuperAdmin();

    if (existingSuperAdmin) {
      return res.status(403).json({
        message: 'Super Admin has already been registered',
      });
    }

    const existingUser = await User.findByEmail(
      normalizedEmail
    );

    if (existingUser) {
      return res.status(409).json({
        message: 'Email already in use',
      });
    }

    const superAdmin = await User.create({
      fullName: fullName.trim(),
      email: normalizedEmail,
      password,
      role: 'super_admin',
    });

    setAuthCookies(res, superAdmin);

    const userWithGroups = await getUserWithGroups(
      superAdmin
    );

    return res.status(201).json({
      message: 'Super Admin created successfully',
      user: userWithGroups,
    });
  } catch (err) {
    console.error('Create super admin error:', err);

    return res.status(500).json({
      message: 'Server error',
    });
  }
};

// ============================================================
// LOGIN
// POST /api/auth/login
// ============================================================

exports.login = async (req, res) => {
  try {
    const {
      email,
      password,
      rememberMe,
    } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        message: 'Email and password are required',
      });
    }

    const user = await User.findByEmail(
      email.trim().toLowerCase()
    );

    const valid =
      user &&
      await User.comparePassword(
        password,
        user.password
      );

    if (!valid) {
      return res.status(401).json({
        message: 'Invalid email or password',
      });
    }

    // Create the authentication cookies.
    setAuthCookies(
      res,
      user,
      rememberMe === true
    );

    // Fetch group membership after authentication succeeds.
    const userWithGroups = await getUserWithGroups(user);

    return res.status(200).json({
      message: 'Logged in successfully',
      user: userWithGroups,
    });
  } catch (err) {
    console.error('Login error:', err);

    return res.status(500).json({
      message: 'Server error',
    });
  }
};

// ============================================================
// LOGOUT
// POST /api/auth/logout
// ============================================================

exports.logout = (req, res) => {
  const clearOptions = {
    secure: cookieOptions.secure,
    sameSite: cookieOptions.sameSite,
  };

  res.clearCookie('token', {
    ...clearOptions,
    httpOnly: true,
  });

  res.clearCookie('user', {
    ...clearOptions,
    httpOnly: false,
  });

  return res.status(200).json({
    message: 'Logged out successfully',
  });
};

// ============================================================
// GET CURRENT USER
// GET /api/auth/me
// ============================================================

exports.getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({
        message: 'User not found',
      });
    }

    // Restore the user's group information on page refresh.
    const userWithGroups = await getUserWithGroups(user);

    return res.status(200).json({
      user: userWithGroups,
    });
  } catch (err) {
    console.error('Get current user error:', err);

    return res.status(500).json({
      message: 'Server error',
    });
  }
};
