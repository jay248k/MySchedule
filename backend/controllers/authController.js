const jwt = require('jsonwebtoken');
const { User, UserSession, Category } = require('../models');
const { JWT_SECRET } = require('../middleware/auth');

const AVATAR_COLORS = [
  '#1769FF', // Electric Royal
  '#8B5CF6', // Vivid Purple
  '#10B981', // Emerald
  '#F59E0B', // Amber
  '#EC4899', // Pink
  '#06B6D4', // Cyan
  '#6366F1', // Indigo
];

function getRandomAvatarColor() {
  return AVATAR_COLORS[Math.floor(Math.random() * AVATAR_COLORS.length)];
}

function getInitials(name) {
  if (!name) return 'ME';
  const parts = name.trim().split(/\s+/);
  if (parts.length > 1) {
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }
  return parts[0].slice(0, 2).toUpperCase();
}

/**
 * Register a new user with UserSession
 * POST /api/auth/signup
 */
exports.signup = async (req, res, next) => {
  try {
    const { name, email, password, title } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ success: false, message: 'Please provide your full name' });
    }
    if (!email || !email.trim()) {
      return res.status(400).json({ success: false, message: 'Please provide your email address' });
    }
    if (!password || password.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 6 characters long',
      });
    }

    const normalizedEmail = email.toLowerCase().trim();

    // Check if user already exists
    const existingUser = await User.findOne({ where: { email: normalizedEmail } });
    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: 'An account with this email address already exists. Please sign in instead.',
      });
    }

    // Create new user
    const newUser = await User.create({
      name: name.trim(),
      email: normalizedEmail,
      password,
      title: title && title.trim() ? title.trim() : null,
      avatarInitials: getInitials(name),
      avatarBg: getRandomAvatarColor(),
      status: 'Active',
    });

    // Create UserSession
    const session = await UserSession.create({
      userId: newUser.id,
      ip: req.ip || req.connection?.remoteAddress || null,
      userAgent: req.headers['user-agent'] || null,
      activeDate: new Date(),
    });

    // Create starter categories
    const defaultCategories = [
      { name: 'Deep Work', color: '#1769FF', icon: 'Code', description: 'Focused coding and development' },
      { name: 'Meetings', color: '#8B5CF6', icon: 'Users', description: 'Team syncs & discussions' },
      { name: 'Health & Wellness', color: '#10B981', icon: 'Heart', description: 'Exercise, hydration, meals' },
      { name: 'Learning', color: '#F59E0B', icon: 'BookOpen', description: 'Reading, courses, and skills' },
      { name: 'Personal', color: '#EC4899', icon: 'Smile', description: 'Errands and life goals' },
    ];

    try {
      await Category.bulkCreate(
        defaultCategories.map((c) => ({
          ...c,
          userId: newUser.id,
        }))
      );
    } catch (catErr) {
      console.warn('Could not auto-seed categories for new user:', catErr.message);
    }

    // Generate JWT containing sessionId
    const token = jwt.sign(
      {
        id: newUser.id,
        email: newUser.email,
        name: newUser.name,
        sessionId: session.id,
      },
      JWT_SECRET,
      { expiresIn: '30d' }
    );

    const safeUser = newUser.toSafeJSON();

    return res.status(201).json({
      success: true,
      message: 'Account created successfully! Welcome to MySchedule.',
      token,
      accessToken: token,
      user: safeUser,
      data: {
        token,
        accessToken: token,
        user: safeUser,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Log in an existing user with UserSession creation
 * POST /api/auth/login
 */
exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide both email and password',
      });
    }

    const normalizedEmail = email.toLowerCase().trim();
    const user = await User.findOne({
      where: { email: normalizedEmail },
    });

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password. Please try again.',
      });
    }

    if (user.status === 'Inactive') {
      return res.status(401).json({
        success: false,
        message: 'Your account is currently inactive. Please contact an administrator.',
      });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password. Please try again.',
      });
    }

    // Create UserSession
    const session = await UserSession.create({
      userId: user.id,
      ip: req.ip || req.connection?.remoteAddress || null,
      userAgent: req.headers['user-agent'] || null,
      activeDate: new Date(),
    });

    // Sign JWT with sessionId
    const token = jwt.sign(
      {
        id: user.id,
        email: user.email,
        name: user.name,
        sessionId: session.id,
      },
      JWT_SECRET,
      { expiresIn: '30d' }
    );

    const safeUser = user.toSafeJSON();

    return res.json({
      success: true,
      message: `Welcome back, ${user.name}!`,
      token,
      accessToken: token,
      user: safeUser,
      data: {
        token,
        accessToken: token,
        user: safeUser,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Quick 1-Click Demo Login
 * POST /api/auth/demo
 */
exports.demoLogin = async (req, res, next) => {
  try {
    const demoEmail = req.body?.email || 'admin@myschedule.app';

    let demoUser = await User.findOne({
      where: { email: demoEmail },
    });

    if (!demoUser) {
      demoUser = await User.create({
        name: 'Alex Morgan',
        email: demoEmail,
        password: 'demouser123',
        title: 'Lead Product Engineer',
        avatarInitials: 'AM',
        avatarBg: '#6366F1',
        status: 'Active',
      });
    }

    // Create UserSession
    const session = await UserSession.create({
      userId: demoUser.id,
      ip: req.ip || req.connection?.remoteAddress || null,
      userAgent: req.headers['user-agent'] || null,
      activeDate: new Date(),
    });

    const token = jwt.sign(
      {
        id: demoUser.id,
        email: demoUser.email,
        name: demoUser.name,
        sessionId: session.id,
      },
      JWT_SECRET,
      { expiresIn: '30d' }
    );

    const safeUser = demoUser.toSafeJSON();

    return res.json({
      success: true,
      message: 'Signed in as Demo User: Alex Morgan',
      token,
      accessToken: token,
      user: safeUser,
      data: {
        token,
        accessToken: token,
        user: safeUser,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Logout and invalidate UserSession in database
 * POST /api/auth/logout
 */
exports.logout = async (req, res, next) => {
  try {
    if (req.session) {
      req.session.deletedAt = new Date();
      await req.session.save();
    }
    return res.json({
      success: true,
      message: 'Logged out successfully.',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get current authenticated user profile
 * GET /api/auth/me
 */
exports.getMe = async (req, res, next) => {
  try {
    const user = await User.findByPk(req.userId);

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const safeUser = user.toSafeJSON();

    return res.json({
      success: true,
      user: safeUser,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update authenticated user profile
 * PUT /api/auth/profile
 */
exports.updateProfile = async (req, res, next) => {
  try {
    const user = await User.findByPk(req.userId);

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const { name, title, avatarBg, avatarInitials } = req.body;
    if (name) user.name = name.trim();
    if (title) user.title = title.trim();
    if (avatarBg) user.avatarBg = avatarBg;
    if (avatarInitials) user.avatarInitials = avatarInitials.toUpperCase();

    await user.save();

    const safeUser = user.toSafeJSON();

    return res.json({
      success: true,
      message: 'Profile updated successfully',
      user: safeUser,
    });
  } catch (error) {
    next(error);
  }
};
