const jwt = require('jsonwebtoken');
const User = require('../models/usersModel');

const signToken = (id, role) =>
  jwt.sign(
    { id, role },
    process.env.JWT_SECRET,
    {
      expiresIn: process.env.JWT_EXPIRES_IN || '1d',
    }
  );

const cookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'strict',
  maxAge: 24 * 60 * 60 * 1000,
};

// Readable by frontend JS – UI use only, never trusted by the server
const userCookieOptions = {
  ...cookieOptions,
  httpOnly: false,
};

const setAuthCookies = (res, user) => {
  const token = signToken(user.id, user.role);

  res.cookie('token', token, cookieOptions);
  res.cookie(
    'user',
    JSON.stringify({ id: user.id, role: user.role }),
    userCookieOptions
  );
};

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// POST /api/auth/register-super-admin
exports.createSuperAdmin = async (req, res) => {
  try {
    const {
      fullName,
      email,
      password,
      confirmPassword,
    } = req.body;

    if (!fullName || !email || !password || !confirmPassword) {
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

    const existingSuperAdmin = await User.findSuperAdmin();

    if (existingSuperAdmin) {
      return res.status(403).json({
        message: 'Super Admin has already been registered',
      });
    }

    const existingUser = await User.findByEmail(email);

    if (existingUser) {
      return res.status(409).json({
        message: 'Email already in use',
      });
    }

    const superAdmin = await User.create({
      fullName,
      email,
      password,
      role: 'super_admin',
    });

    setAuthCookies(res, superAdmin);

    return res.status(201).json({
      message: 'Super Admin created successfully',
      user: superAdmin,
    });

  } catch (err) {
    console.error(err);

    return res.status(500).json({
      message: 'Server error',
    });
  }
};

// POST /api/auth/register  (regular users only)
exports.register = async (req, res) => {
  try {
    const {
      fullName,
      email,
      password,
      confirmPassword,
    } = req.body;

    if (!fullName || !email || !password || !confirmPassword) {
      return res.status(400).json({
        message: 'All fields are required',
      });
    }

    if (!emailRegex.test(email)) {
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

    const normalizedEmail = email.trim().toLowerCase();

    const existingUser = await User.findByEmail(normalizedEmail);

    if (existingUser) {
      return res.status(409).json({
        message: 'Email already in use',
      });
    }

    // Role is always forced to 'user' – never read from req.body
    const user = await User.create({
      fullName: fullName.trim(),
      email: normalizedEmail,
      password,
      role: 'user',
    });

    setAuthCookies(res, user);

    return res.status(201).json({
      message: 'Account created successfully',
      user,
    });

  } catch (err) {
    console.error(err);

    return res.status(500).json({
      message: 'Server error',
    });
  }
};

// POST /api/auth/login  (works for every role)
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        message: 'Email and password are required',
      });
    }

    const user = await User.findByEmail(
      email.trim().toLowerCase()
    );

    const valid =
      user && (await User.comparePassword(password, user.password));

    if (!valid) {
      return res.status(401).json({
        message: 'Invalid email or password',
      });
    }

    setAuthCookies(res, user);

    return res.status(200).json({
      message: 'Logged in successfully',
      user: {
        id: user.id,
        full_name: user.full_name,
        email: user.email,
        role: user.role,
        created_at: user.created_at,
      },
    });

  } catch (err) {
    console.error(err);

    return res.status(500).json({
      message: 'Server error',
    });
  }
};

// POST /api/auth/logout
exports.logout = (req, res) => {
  const clearOptions = {
    secure: cookieOptions.secure,
    sameSite: cookieOptions.sameSite,
  };

  res.clearCookie('token', { ...clearOptions, httpOnly: true });
  res.clearCookie('user', { ...clearOptions, httpOnly: false });

  return res.status(200).json({
    message: 'Logged out successfully',
  });
};

// GET /api/auth/me
exports.getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({
        message: 'User not found',
      });
    }

    return res.status(200).json({ user });

  } catch (err) {
    console.error(err);

    return res.status(500).json({
      message: 'Server error',
    });
  }
};