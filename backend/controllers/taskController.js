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

    if (req.userId) {
      where.userId = req.userId;
    }

    const tasks = await Task.findAll({
      where,
      include: [
        { model: Category, as: 'category', attributes: ['id', 'name', 'color', 'icon'] },
        { model: Goal, as: 'goal', attributes: ['id', 'title', 'category'] },
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

const normalizePriority = (p) => {
  if (!p) return 'Medium';
  const lower = String(p).toLowerCase();
  if (lower === 'high') return 'High';
  if (lower === 'low') return 'Low';
  return 'Medium';
};

const timeToMinutes = (tStr) => {
  if (!tStr) return 0;
  const parts = String(tStr).split(':');
  const h = parseInt(parts[0], 10) || 0;
  const m = parseInt(parts[1], 10) || 0;
  return h * 60 + m;
};

const checkTaskConflict = async ({ date, startTime, endTime, excludeTaskId, userId }) => {
  if (!date || !startTime || !endTime) return null;
  const s = timeToMinutes(startTime);
  const e = timeToMinutes(endTime);
  if (e <= s) return null;

  const where = {
    date,
    startTime: { [Op.ne]: null },
    endTime: { [Op.ne]: null },
  };
  if (excludeTaskId) {
    where.id = { [Op.ne]: excludeTaskId };
  }
  if (userId) {
    where.userId = userId;
  }

  const existingTasks = await Task.findAll({
    where,
    attributes: ['id', 'title', 'startTime', 'endTime'],
  });
  for (const existing of existingTasks) {
    const exS = timeToMinutes(existing.startTime);
    const exE = timeToMinutes(existing.endTime);
    if (exE > exS) {
      if (s < exE && e > exS) {
        return existing;
      }
    }
  }
  return null;
};

exports.createTask = async (req, res, next) => {
  try {
    const { id, title, description, date, startTime, endTime, categoryId, category, priority, goalId, status, color } =
      req.body;

    if (!title || !title.trim()) {
      return res.status(400).json({ success: false, message: 'Task title is required' });
    }
    if (!date) {
      return res.status(400).json({ success: false, message: 'Task date is required' });
    }

    if (startTime && endTime) {
      if (timeToMinutes(endTime) <= timeToMinutes(startTime)) {
        return res.status(400).json({ success: false, message: 'End time must be after start time' });
      }

      const conflict = await checkTaskConflict({
        date,
        startTime,
        endTime,
        excludeTaskId: id || null,
        userId: req.userId || req.body.userId || null,
      });

      if (conflict) {
        return res.status(409).json({
          success: false,
          message: `Time slot conflict: "${conflict.title}" is already scheduled between ${conflict.startTime} and ${conflict.endTime}. Other tasks cannot be scheduled in this slot.`,
          conflict: {
            id: conflict.id,
            title: conflict.title,
            startTime: conflict.startTime,
            endTime: conflict.endTime,
          },
        });
      }
    }

    let resolvedCategoryId = categoryId || null;
    if (!resolvedCategoryId && category) {
      const foundCat = await Category.findOne({
        where: { name: typeof category === 'string' ? category : category.name },
      });
      if (foundCat) resolvedCategoryId = foundCat.id;
    }

    const task = await Task.create({
      id: id || undefined,
      title: title.trim(),
      description: description ? description.trim() : null,
      date,
      startTime: startTime || null,
      endTime: endTime || null,
      categoryId: resolvedCategoryId,
      color: color || null,
      priority: normalizePriority(priority),
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

exports.bulkCreateTasks = async (req, res, next) => {
  try {
    const rawTasks = Array.isArray(req.body) ? req.body : req.body.tasks || [];

    if (!Array.isArray(rawTasks) || rawTasks.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No tasks provided for bulk import',
      });
    }

    // Pre-fetch categories and goals for fast mapping by name
    const categories = await Category.findAll({
      attributes: ['id', 'name'],
    });
    const categoryMap = new Map();
    categories.forEach((cat) => {
      categoryMap.set(cat.name.toLowerCase().trim(), cat.id);
      categoryMap.set(cat.id, cat.id);
    });

    const goals = await Goal.findAll({
      attributes: ['id', 'title'],
    });
    const goalMap = new Map();
    goals.forEach((g) => {
      goalMap.set(g.title.toLowerCase().trim(), g.id);
      goalMap.set(g.id, g.id);
    });

    const today = new Date().toISOString().split('T')[0];
    const validTasks = [];

    for (const item of rawTasks) {
      if (!item || !item.title || !item.title.trim()) continue;

      let resolvedCategoryId = item.categoryId || null;
      if (!resolvedCategoryId && item.category) {
        const catKey = typeof item.category === 'string'
          ? item.category.toLowerCase().trim()
          : item.category?.name?.toLowerCase()?.trim();
        if (catKey && categoryMap.has(catKey)) {
          resolvedCategoryId = categoryMap.get(catKey);
        }
      }

      let resolvedGoalId = item.goalId || null;
      if (!resolvedGoalId && item.goal) {
        const goalKey = typeof item.goal === 'string'
          ? item.goal.toLowerCase().trim()
          : item.goal?.title?.toLowerCase()?.trim();
        if (goalKey && goalMap.has(goalKey)) {
          resolvedGoalId = goalMap.get(goalKey);
        }
      }

      let status = item.status ? String(item.status).toLowerCase().trim() : 'pending';
      if (!['pending', 'in-progress', 'completed', 'overdue'].includes(status)) {
        status = 'pending';
      }

      validTasks.push({
        id: item.id || undefined,
        title: item.title.trim(),
        description: item.description ? item.description.trim() : null,
        date: item.date || today,
        startTime: item.startTime || null,
        endTime: item.endTime || null,
        categoryId: resolvedCategoryId,
        priority: normalizePriority(item.priority),
        goalId: resolvedGoalId,
        status: status,
        userId: req.userId || item.userId || null,
      });
    }

    if (validTasks.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No valid task records found (title is required for each task)',
      });
    }

    const created = await Task.bulkCreate(validTasks, { returning: true });

    // Fetch created tasks with associations included
    const createdIds = created.map((t) => t.id);
    const populated = await Task.findAll({
      where: { id: createdIds },
      include: [
        { model: Category, as: 'category' },
        { model: Goal, as: 'goal' },
      ],
      order: [
        ['date', 'ASC'],
        ['startTime', 'ASC'],
      ],
    });

    res.status(201).json({
      success: true,
      count: populated.length,
      data: populated,
    });
  } catch (error) {
    next(error);
  }
};

exports.updateTask = async (req, res, next) => {
  try {
    const where = { id: req.params.id };
    if (req.userId) where.userId = req.userId;
    const task = await Task.findOne({ where });
    if (!task) {
      return res.status(404).json({ success: false, message: 'Task not found' });
    }

    const { title, description, date, startTime, endTime, categoryId, category, priority, goalId, status, color } =
      req.body;

    let resolvedCategoryId = categoryId !== undefined ? categoryId : task.categoryId;
    if (categoryId === undefined && category) {
      const foundCat = await Category.findOne({
        where: { name: typeof category === 'string' ? category : category.name },
      });
      if (foundCat) resolvedCategoryId = foundCat.id;
    }

    const targetDate = date !== undefined ? date : task.date;
    const targetStartTime = startTime !== undefined ? startTime : task.startTime;
    const targetEndTime = endTime !== undefined ? endTime : task.endTime;

    const isTimeRescheduled =
      (date !== undefined && date !== task.date) ||
      (startTime !== undefined && startTime !== task.startTime) ||
      (endTime !== undefined && endTime !== task.endTime);

    if (isTimeRescheduled && targetStartTime && targetEndTime) {
      if (timeToMinutes(targetEndTime) <= timeToMinutes(targetStartTime)) {
        return res.status(400).json({ success: false, message: 'End time must be after start time' });
      }

      const conflict = await checkTaskConflict({
        date: targetDate,
        startTime: targetStartTime,
        endTime: targetEndTime,
        excludeTaskId: task.id,
        userId: req.userId || task.userId || null,
      });

      if (conflict) {
        return res.status(409).json({
          success: false,
          message: `Time slot conflict: Cannot schedule between ${targetStartTime} and ${targetEndTime}. "${conflict.title}" is already scheduled from ${conflict.startTime} to ${conflict.endTime}.`,
          conflict: {
            id: conflict.id,
            title: conflict.title,
            startTime: conflict.startTime,
            endTime: conflict.endTime,
          },
        });
      }
    }

    await task.update({
      title: title !== undefined ? title.trim() : task.title,
      description: description !== undefined ? (description ? description.trim() : null) : task.description,
      date: date !== undefined ? date : task.date,
      startTime: startTime !== undefined ? startTime : task.startTime,
      endTime: endTime !== undefined ? endTime : task.endTime,
      categoryId: resolvedCategoryId,
      color: color !== undefined ? color : task.color,
      priority: priority !== undefined ? normalizePriority(priority) : task.priority,
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
    const where = { id: req.params.id };
    if (req.userId) where.userId = req.userId;
    const task = await Task.findOne({ where });
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
    const where = { id: req.params.id };
    if (req.userId) where.userId = req.userId;
    const task = await Task.findOne({ where });
    if (!task) {
      return res.status(404).json({ success: false, message: 'Task not found' });
    }

    await task.destroy();
    res.json({ success: true, message: 'Task deleted successfully' });
  } catch (error) {
    next(error);
  }
};
