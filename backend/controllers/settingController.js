const { Setting } = require('../models');

exports.getSettings = async (req, res, next) => {
  try {
    let [setting] = await Setting.findOrCreate({
      where: { id: 1 },
      defaults: {
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
    let [setting] = await Setting.findOrCreate({
      where: { id: 1 },
      defaults: {},
    });

    await setting.update(req.body);
    res.json({ success: true, data: setting });
  } catch (error) {
    next(error);
  }
};
