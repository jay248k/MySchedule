const { Event, Category } = require('../models');
const { Op } = require('sequelize');

exports.getAllEvents = async (req, res, next) => {
  try {
    const { date, startDate, endDate, categoryId } = req.query;
    const where = {};

    if (date) {
      where.date = date;
    } else if (startDate && endDate) {
      where.date = { [Op.between]: [startDate, endDate] };
    }

    if (categoryId && categoryId !== 'all' && categoryId !== 'none') {
      where.categoryId = categoryId;
    }

    if (req.userId) {
      where[Op.or] = [{ userId: req.userId }, { userId: null }];
    }

    const events = await Event.findAll({
      where,
      include: [{ model: Category, as: 'category', attributes: ['id', 'name', 'color', 'icon'] }],
      order: [
        ['date', 'ASC'],
        ['startTime', 'ASC'],
      ],
    });

    res.json({ success: true, count: events.length, data: events });
  } catch (error) {
    next(error);
  }
};

exports.getEventById = async (req, res, next) => {
  try {
    const where = { id: req.params.id };
    if (req.userId) {
      where[Op.or] = [{ userId: req.userId }, { userId: null }];
    }

    const event = await Event.findOne({
      where,
      include: [{ model: Category, as: 'category', attributes: ['id', 'name', 'color', 'icon'] }],
    });
    if (!event) {
      return res.status(404).json({ success: false, message: 'Event not found' });
    }
    res.json({ success: true, data: event });
  } catch (error) {
    next(error);
  }
};

exports.createEvent = async (req, res, next) => {
  try {
    const { id, title, description, date, startTime, endTime, categoryId, location } = req.body;

    if (!title || !title.trim()) {
      return res.status(400).json({ success: false, message: 'Event title is required' });
    }
    if (!date) {
      return res.status(400).json({ success: false, message: 'Event date is required' });
    }
    if (startTime && endTime && endTime <= startTime) {
      return res.status(400).json({ success: false, message: 'Event end time must be after start time' });
    }

    let resolvedCategoryId = null;
    if (categoryId && String(categoryId).trim() !== '' && categoryId !== 'none' && categoryId !== 'all') {
      resolvedCategoryId = String(categoryId).trim();
    }

    const event = await Event.create({
      id: id || undefined,
      title: title.trim(),
      description: description ? description.trim() : null,
      date,
      startTime: startTime || null,
      endTime: endTime || null,
      categoryId: resolvedCategoryId,
      location: location ? location.trim() : null,
      userId: req.userId || req.body.userId || null,
    });

    const createdEvent = await Event.findByPk(event.id, {
      include: [{ model: Category, as: 'category' }],
    });

    res.status(201).json({ success: true, data: createdEvent });
  } catch (error) {
    next(error);
  }
};

exports.updateEvent = async (req, res, next) => {
  try {
    const where = { id: req.params.id };
    if (req.userId) {
      where[Op.or] = [{ userId: req.userId }, { userId: null }];
    }
    const event = await Event.findOne({ where });
    if (!event) {
      return res.status(404).json({ success: false, message: 'Event not found' });
    }

    const { title, description, date, startTime, endTime, categoryId, location } = req.body;

    if (title !== undefined && !title.trim()) {
      return res.status(400).json({ success: false, message: 'Event title cannot be empty' });
    }

    const targetStart = startTime !== undefined ? startTime : event.startTime;
    const targetEnd = endTime !== undefined ? endTime : event.endTime;
    if (targetStart && targetEnd && targetEnd <= targetStart) {
      return res.status(400).json({ success: false, message: 'Event end time must be after start time' });
    }

    let resolvedCategoryId = event.categoryId;
    if (categoryId !== undefined) {
      resolvedCategoryId =
        categoryId && String(categoryId).trim() !== '' && categoryId !== 'none' && categoryId !== 'all'
          ? String(categoryId).trim()
          : null;
    }

    await event.update({
      title: title !== undefined ? title.trim() : event.title,
      description: description !== undefined ? (description ? description.trim() : null) : event.description,
      date: date !== undefined ? date : event.date,
      startTime: startTime !== undefined ? startTime : event.startTime,
      endTime: endTime !== undefined ? endTime : event.endTime,
      categoryId: resolvedCategoryId,
      location: location !== undefined ? (location ? location.trim() : null) : event.location,
      ...(event.userId === null && req.userId ? { userId: req.userId } : {}),
    });

    const updatedEvent = await Event.findByPk(event.id, {
      include: [{ model: Category, as: 'category' }],
    });

    res.json({ success: true, data: updatedEvent });
  } catch (error) {
    next(error);
  }
};

exports.deleteEvent = async (req, res, next) => {
  try {
    const where = { id: req.params.id };
    if (req.userId) {
      where[Op.or] = [{ userId: req.userId }, { userId: null }];
    }
    const event = await Event.findOne({ where });
    if (!event) {
      return res.status(404).json({ success: false, message: 'Event not found' });
    }

    await event.destroy();
    res.json({ success: true, message: 'Event deleted successfully' });
  } catch (error) {
    next(error);
  }
};
