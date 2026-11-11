const { Setting } = require('../models');
const cacheManager = require('../utils/cacheManager');

exports.getSettings = async (req, res, next) => {
  try {
    const userId = req.userId || null;
    const cacheKey = `settings_${userId || 'default'}`;
    const cached = cacheManager.get(cacheKey);
    if (cached) {
      return res.json({ success: true, data: cached, fromCache: true });
    }

    let setting = null;
    if (userId) {
      setting = await Setting.findOne({ where: { userId } });
      if (!setting) {
        // Create user-specific setting record in database
        setting = await Setting.create({
          userId,
          theme: 'dark',
          accentColor: '#1769FF',
          weekStartsOnSunday: true,
          defaultCalendarView: 'week',
          timeFormat: '12h',
          layoutComfort: 'comfortable',
          enableInAppNotifications: true,
          soundEffects: false,
        });
      }
    } else {
      setting = await Setting.findOne({ where: { userId: null } });
      if (!setting) {
        setting = await Setting.findOne();
      }
      if (!setting) {
        setting = await Setting.create({
          userId: null,
          theme: 'dark',
          accentColor: '#1769FF',
          weekStartsOnSunday: true,
          defaultCalendarView: 'week',
          timeFormat: '12h',
          layoutComfort: 'comfortable',
          enableInAppNotifications: true,
          soundEffects: false,
        });
      }
    }

    cacheManager.set(cacheKey, setting, 300); // 5-minute cache with instant update invalidation
    res.json({ success: true, data: setting });
  } catch (error) {
    next(error);
  }
};

exports.updateSettings = async (req, res, next) => {
  try {
    const userId = req.userId || null;
    let { theme, timeFormat, layoutComfort, notificationSettings, navigationOrder, accentColor } = req.body;

    if (theme === 'white') theme = 'light';
    const validThemes = ['light', 'dark', 'oled', 'warm', 'system', 'white'];
    if (theme && !validThemes.includes(theme)) {
      return res.status(400).json({ success: false, message: `Invalid theme. Allowed values: ${validThemes.join(', ')}` });
    }

    if (timeFormat && !['12h', '24h'].includes(timeFormat)) {
      return res.status(400).json({ success: false, message: 'Invalid timeFormat. Allowed values: 12h, 24h' });
    }

    if (layoutComfort && !['comfortable', 'compact', 'spacious'].includes(layoutComfort)) {
      return res.status(400).json({ success: false, message: 'Invalid layoutComfort. Allowed values: comfortable, compact, spacious' });
    }

    let setting = null;
    if (userId) {
      setting = await Setting.findOne({ where: { userId } });
      if (!setting) {
        setting = await Setting.create({ userId, theme: theme || 'dark' });
      }
    } else {
      setting = await Setting.findOne({ where: { userId: null } }) || await Setting.findOne();
      if (!setting) {
        setting = await Setting.create({ userId: null, theme: theme || 'dark' });
      }
    }

    const updatePayload = {
      ...req.body,
      ...(theme && { theme }),
      ...(notificationSettings !== undefined && {
        notificationSettings: typeof notificationSettings === 'object' ? JSON.stringify(notificationSettings) : notificationSettings,
      }),
      ...(navigationOrder !== undefined && {
        navigationOrder: typeof navigationOrder === 'object' ? JSON.stringify(navigationOrder) : navigationOrder,
      }),
      ...(req.body.hiddenNavigationItems !== undefined && {
        hiddenNavigationItems: typeof req.body.hiddenNavigationItems === 'object' ? JSON.stringify(req.body.hiddenNavigationItems) : req.body.hiddenNavigationItems,
      }),
    };

    await setting.update(updatePayload);
    cacheManager.invalidateSettings(userId);
    res.json({ success: true, data: setting });
  } catch (error) {
    next(error);
  }
};
