const { NotificationLog } = require('../models');

exports.createNotification = async (req, res, next) => {
  try {
    const { title, message, scheduledTime } = req.body;
    const userId = req.userId;

    if (!title || !message || !scheduledTime) {
      return res.status(400).json({ success: false, message: 'Missing required fields' });
    }

    const notification = await NotificationLog.create({
      userId,
      title,
      message,
      scheduledTime,
      isSent: false
    });

    res.status(201).json({ success: true, data: notification });
  } catch (error) {
    next(error);
  }
};

exports.getScheduledNotifications = async (req, res, next) => {
  try {
    const notifications = await NotificationLog.findAll({
      where: { userId: req.userId, isSent: false },
      order: [['scheduledTime', 'ASC']]
    });
    res.json({ success: true, data: notifications });
  } catch (error) {
    next(error);
  }
};
