const { Notification } = require('../models');

exports.getAllNotifications = async (req, res, next) => {
  try {
    const where = {};
    if (req.userId) where.userId = req.userId;

    const notifications = await Notification.findAll({
      where,
      order: [['createdAt', 'DESC']],
    });
    res.json({ success: true, count: notifications.length, data: notifications });
  } catch (error) {
    next(error);
  }
};

exports.markAsRead = async (req, res, next) => {
  try {
    const where = { id: req.params.id };
    if (req.userId) where.userId = req.userId;

    const notification = await Notification.findOne({ where });
    if (!notification) {
      return res.status(404).json({ success: false, message: 'Notification not found' });
    }
    await notification.update({ read: true });
    res.json({ success: true, data: notification });
  } catch (error) {
    next(error);
  }
};

exports.markAllAsRead = async (req, res, next) => {
  try {
    const where = { read: false };
    if (req.userId) where.userId = req.userId;

    await Notification.update({ read: true }, { where });
    const notifications = await Notification.findAll({
      where: req.userId ? { userId: req.userId } : {},
      order: [['createdAt', 'DESC']],
    });
    res.json({ success: true, data: notifications });
  } catch (error) {
    next(error);
  }
};

exports.clearAllNotifications = async (req, res, next) => {
  try {
    const where = {};
    if (req.userId) where.userId = req.userId;

    await Notification.destroy({ where });
    res.json({ success: true, message: 'All notifications cleared' });
  } catch (error) {
    next(error);
  }
};
