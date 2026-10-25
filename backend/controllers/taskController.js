const { Task, Category, Goal } = require('../models');
const { Op } = require('sequelize');

exports.getAllTasks = async (req, res, next) => {
  try {
    const { date, startDate, endDate, categoryId, goalId, status, priority } = req.query;
    const where = {};

    if (date) {
      where.date = date;
    } else if (startDate && endDate) {
      where.date = { [Op.between]: [startDate, endDate] };
    }

    if (categoryId && categoryId !== 'all') {
      where.categoryId = categoryId;
    }

    if (goalId && goalId !== 'all') {
      where.goalId = goalId;
    }

    if (status && status !== 'all') {
      where.status = status;
    }

    if (priority && priority !== 'all') {
      where.priority = priority;
    }

    const tasks = await Task.findAll({
      where,
      include: [
        { model: Category, as: 'category' },
        { model: Goal, as: 'goal' },
      ],
      order: [
        ['date', 'ASC'],
        ['startTime', 'ASC'],
      ],
    });

    res.json({ success: true, count: tasks.length, data: tasks });
  } catch (error) {
    next(error);
  }
};

exports.getTaskById = async (req, res, next) => {
  try {
    const task = await Task.findByPk(req.params.id, {
      include: [
        { model: Category, as: 'category' },
        { model: Goal, as: 'goal' },
      ],
    });
    if (!task) {
      return res.status(404).json({ success: false, message: 'Task not found' });
    }
    res.json({ success: true, data: task });
  } catch (error) {
    next(error);
  }
};

exports.createTask = async (req, res, next) => {
  try {
    const { id, title, description, date, startTime, endTime, categoryId, priority, goalId, status } =
      req.body;

    if (!title || !title.trim()) {
      return res.status(400).json({ success: false, message: 'Task title is required' });
    }
    if (!date) {
      return res.status(400).json({ success: false, message: 'Task date is required' });
    }

    const task = await Task.create({
      id: id || undefined,
      title: title.trim(),
      description: description ? description.trim() : null,
      date,
      startTime: startTime || null,
      endTime: endTime || null,
      categoryId: categoryId || null,
      priority: priority || 'Medium',
      goalId: goalId || null,
      status: status || 'pending',
      userId: req.userId || req.body.userId || null,
    });

    // Reload with associations
    const createdTask = await Task.findByPk(task.id, {
      include: [
        { model: Category, as: 'category' },
        { model: Goal, as: 'goal' },
      ],
    });

    res.status(201).json({ success: true, data: createdTask });
  } catch (error) {
    next(error);
  }
};

exports.updateTask = async (req, res, next) => {
  try {
    const task = await Task.findByPk(req.params.id);
    if (!task) {
      return res.status(404).json({ success: false, message: 'Task not found' });
    }

    const { title, description, date, startTime, endTime, categoryId, priority, goalId, status } =
      req.body;

    await task.update({
      title: title !== undefined ? title.trim() : task.title,
      description: description !== undefined ? (description ? description.trim() : null) : task.description,
      date: date !== undefined ? date : task.date,
      startTime: startTime !== undefined ? startTime : task.startTime,
      endTime: endTime !== undefined ? endTime : task.endTime,
      categoryId: categoryId !== undefined ? categoryId : task.categoryId,
      priority: priority !== undefined ? priority : task.priority,
      goalId: goalId !== undefined ? goalId : task.goalId,
      status: status !== undefined ? status : task.status,
    });

    const updatedTask = await Task.findByPk(task.id, {
      include: [
        { model: Category, as: 'category' },
        { model: Goal, as: 'goal' },
      ],
    });

    res.json({ success: true, data: updatedTask });
  } catch (error) {
    next(error);
  }
};

exports.toggleTaskComplete = async (req, res, next) => {
  try {
    const task = await Task.findByPk(req.params.id);
    if (!task) {
      return res.status(404).json({ success: false, message: 'Task not found' });
    }

    const newStatus = task.status === 'completed' ? 'pending' : 'completed';
    await task.update({ status: newStatus });

    const updatedTask = await Task.findByPk(task.id, {
      include: [
        { model: Category, as: 'category' },
        { model: Goal, as: 'goal' },
      ],
    });

    res.json({ success: true, data: updatedTask });
  } catch (error) {
    next(error);
  }
};

exports.deleteTask = async (req, res, next) => {
  try {
    const task = await Task.findByPk(req.params.id);
    if (!task) {
      return res.status(404).json({ success: false, message: 'Task not found' });
    }

    await task.destroy();
    res.json({ success: true, message: 'Task deleted successfully' });
  } catch (error) {
    next(error);
  }
};
