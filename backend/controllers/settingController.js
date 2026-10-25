const { Setting } = require('../models');

exports.getSettings = async (req, res, next) => {
  try {
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
    res.json({ success: true, data: setting });
  } catch (error) {
    next(error);
  }
};

exports.updateSettings = async (req, res, next) => {
  try {
    const where = req.userId ? { userId: req.userId } : { id: 1 };
    let [setting] = await Setting.findOrCreate({
      where,
      defaults: {
        userId: req.userId || null,
      },
    });

    await setting.update(req.body);
    res.json({ success: true, data: setting });
  } catch (error) {
    next(error);
  }
};
