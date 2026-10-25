const { UserProfile, User } = require('../models');

/**
 * Get user profile without hardcoded default values
 * GET /api/user
 */
exports.getUserProfile = async (req, res, next) => {
  try {
    // If authenticated via JWT, return the actual user profile
    if (req.userId) {
      const user = await User.findByPk(req.userId);
      if (user) {
        return res.json({ success: true, data: user.toSafeJSON() });
      }
    }

    // Otherwise, check for existing stored profile in database
    const profile = await UserProfile.findOne({
      order: [['id', 'ASC']],
    });

    // Return the profile as-is without injecting default values
    return res.json({ success: true, data: profile || null });
  } catch (error) {
    next(error);
  }
};

/**
 * Update user profile without using default values
 * PUT /api/user
 */
exports.updateUserProfile = async (req, res, next) => {
  try {
    const { name, title, email, avatarBg, avatarInitials } = req.body;

    // If authenticated via JWT, update the User account directly
    if (req.userId) {
      const user = await User.findByPk(req.userId);
      if (user) {
        if (name !== undefined) user.name = name;
        if (title !== undefined) user.title = title;
        if (email !== undefined) user.email = email;
        if (avatarBg !== undefined) user.avatarBg = avatarBg;
        if (avatarInitials !== undefined) user.avatarInitials = avatarInitials;

        await user.save();
        return res.json({ success: true, data: user.toSafeJSON() });
      }
    }

    // Unauthenticated / guest profile update without hardcoded defaults
    let profile = await UserProfile.findOne({
      order: [['id', 'ASC']],
    });

    if (profile) {
      await profile.update(req.body);
    } else {
      // Create only with the fields provided in req.body, no default values
      profile = await UserProfile.create(req.body);
    }

    return res.json({ success: true, data: profile });
  } catch (error) {
    next(error);
  }
};
