const { Setting } = require('../models');
const cacheManager = require('../utils/cacheManager');

exports.getSettings = async (req, res, next) => {
  try {
    const cacheKey = `settings_${req.userId || 'default'}`;
    const cached = cacheManager.get(cacheKey);
    if (cached) {
      return res.json({ success: true, data: cached, fromCache: true });
    }

    const where = req.userId ? { userId: req.userId } : { id: 1 };
    let [setting] = await Setting.findOrCreate({
      where,
      defaults: {
        userId: req.userId || null,
        theme: 'light',
        accentColor: '#1769FF',
        weekStartsOnSunday: true,
        defaultCalendarView: 'week',
        timeFormat: '12h',
        layoutComfort: 'comfortable',
        enableInAppNotifications: true,
        soundEffects: false,
      },
    });

    cacheManager.set(cacheKey, setting, 300); // 5-minute cache with instant update invalidation
    res.json({ success: true, data: setting });
  } catch (error) {
    next(error);
  }
};

exports.updateSettings = async (req, res, next) => {
  try {
    const { theme, timeFormat, layoutComfort } = req.body;

    if (theme && !['light', 'dark', 'system'].includes(theme)) {
      return res.status(400).json({ success: false, message: 'Invalid theme. Allowed values: light, dark, system' });
    }

    if (timeFormat && !['12h', '24h'].includes(timeFormat)) {
      return res.status(400).json({ success: false, message: 'Invalid timeFormat. Allowed values: 12h, 24h' });
    }

    if (layoutComfort && !['comfortable', 'compact', 'spacious'].includes(layoutComfort)) {
      return res.status(400).json({ success: false, message: 'Invalid layoutComfort. Allowed values: comfortable, compact, spacious' });
    }

    const where = req.userId ? { userId: req.userId } : { id: 1 };
    let [setting] = await Setting.findOrCreate({
      where,
      defaults: {
        userId: req.userId || null,
      },
    });

    await setting.update(req.body);
    cacheManager.invalidateSettings(req.userId);
    res.json({ success: true, data: setting });
  } catch (error) {
    next(error);
  }
};
