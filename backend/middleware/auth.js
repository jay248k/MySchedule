const jwt = require('jsonwebtoken');
const { User, UserSession } = require('../models');

const JWT_SECRET = process.env.JWT_SECRET || 'myschedule_neon_super_secret_jwt_key_2026';

/**
 * Strict token & session authentication middleware (authenticateUser)
 *
 * 1. Extracts Bearer <token> from Authorization header.
 * 2. Verifies token with jwt.verify().
 * 3. Validates session existence in UserSession table (where deletedAt IS NULL) if sessionId is present.
 * 4. Updates session activeDate timestamp (heartbeat).
 * 5. Loads User from database.
 * 6. Checks if user is Inactive -> rejects with 401.
 * 7. Attaches req.user, req.userId, req.session to request.
 */
const authenticateUser = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required. Please provide a valid Bearer token.',
      });
    }

    const token = authHeader.split(' ')[1];
    let decoded;
    try {
      decoded = jwt.verify(token, JWT_SECRET);
    } catch (err) {
      return res.status(401).json({
        success: false,
        message: 'Invalid or expired token. Please log in again.',
      });
    }

    // Check active session if sessionId is present in token payload
    let session = null;
    if (decoded.sessionId) {
      session = await UserSession.findOne({
        where: { id: decoded.sessionId, deletedAt: null },
      });

      if (!session) {
        return res.status(401).json({
          success: false,
          message: 'Session has been invalidated or expired. Please sign in again.',
        });
      }

      // Update session heartbeat
      session.activeDate = new Date();
      await session.save().catch(() => {});
    }

    // Load user
    const user = await User.findByPk(decoded.id);

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'User account not found or has been removed.',
      });
    }

    if (user.status === 'Inactive') {
      return res.status(401).json({
        success: false,
        message: 'Your account has been deactivated. Please contact an administrator.',
      });
    }

    req.user = user;
    req.userId = user.id;
    req.session = session;

    next();
  } catch (error) {
    next(error);
  }
};

/**
 * Optional authentication middleware: attaches req.user if token is present,
 * but allows unauthenticated requests to proceed.
 */
const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1];
      try {
        const decoded = jwt.verify(token, JWT_SECRET);
        const user = await User.findByPk(decoded.id);
        if (user && user.status !== 'Inactive') {
          req.user = user;
          req.userId = user.id;
        }
      } catch (err) {
        // Token invalid, ignore for optional auth
      }
    }
    next();
  } catch (error) {
    next(error);
  }
};

module.exports = {
  authenticateUser,
  authRequired: authenticateUser, // Backward compatibility alias
  optionalAuth,
  JWT_SECRET,
};
