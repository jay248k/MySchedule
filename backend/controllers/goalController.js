const { Goal, Task } = require('../models');
const cacheManager = require('../utils/cacheManager');

exports.getAllGoals = async (req, res, next) => {
  try {
    const cacheKey = `goals_${req.userId || 'public'}`;
    const cached = cacheManager.get(cacheKey);
    if (cached) {
      return res.json({ success: true, count: cached.length, data: cached, fromCache: true });
    }

    const where = {};
    if (req.userId) {
      where.userId = req.userId;
    }

    const goals = await Goal.findAll({
      where,
      include: [{ model: Task, as: 'tasks', attributes: ['id', 'title', 'status', 'priority', 'date'] }],
      order: [['targetDate', 'ASC']],
    });

    cacheManager.set(cacheKey, goals, 120);
    res.json({ success: true, count: goals.length, data: goals });
  } catch (error) {
    next(error);
  }
};

exports.getGoalById = async (req, res, next) => {
  try {
    const where = { id: req.params.id };
    if (req.userId) where.userId = req.userId;

    const goal = await Goal.findOne({
      where,
      include: [{ model: Task, as: 'tasks', attributes: ['id', 'title', 'status', 'priority', 'date'] }],
    });
    if (!goal) {
      return res.status(404).json({ success: false, message: 'Goal not found' });
    }
    res.json({ success: true, data: goal });
  } catch (error) {
    next(error);
  }
};

exports.createGoal = async (req, res, next) => {
  try {
    const { id, title, description, targetDate, progress, status, category, relatedTaskIds } = req.body;

    if (!title || !title.trim()) {
      return res.status(400).json({ success: false, message: 'Goal title is required' });
    }
    if (!targetDate) {
      return res.status(400).json({ success: false, message: 'Target date is required' });
    }

    const goal = await Goal.create({
      id: id || undefined,
      title: title.trim(),
      description: description ? description.trim() : null,
      targetDate,
      progress: progress !== undefined ? Number(progress) : 0,
      status: status || 'in-progress',
      category: category || null,
      relatedTaskIds: relatedTaskIds || [],
      userId: req.userId || req.body.userId || null,
    });

    cacheManager.invalidateGoals(req.userId);
    res.status(201).json({ success: true, data: goal });
  } catch (error) {
    next(error);
  }
};

exports.bulkCreateGoals = async (req, res, next) => {
  try {
    const rawGoals = Array.isArray(req.body) ? req.body : req.body.goals || [];

    if (!Array.isArray(rawGoals) || rawGoals.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No goals provided for bulk import',
      });
    }

    const validGoals = [];
    const today = new Date().toISOString().split('T')[0];

    for (const item of rawGoals) {
      if (!item || !item.title || !item.title.trim()) continue;

      const progressVal = item.progress !== undefined ? Number(item.progress) : 0;
      const validProgress = isNaN(progressVal) ? 0 : Math.min(100, Math.max(0, progressVal));

      let status = item.status ? String(item.status).toLowerCase().trim() : 'in-progress';
      if (!['in-progress', 'completed', 'behind'].includes(status)) {
        status = validProgress >= 100 ? 'completed' : 'in-progress';
      }

      validGoals.push({
        id: item.id || undefined,
        title: item.title.trim(),
        description: item.description ? item.description.trim() : null,
        targetDate: item.targetDate || today,
        progress: validProgress,
        status: status,
        category: item.category ? item.category.trim() : null,
        relatedTaskIds: Array.isArray(item.relatedTaskIds) ? item.relatedTaskIds : [],
        userId: req.userId || item.userId || null,
      });
    }

    if (validGoals.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No valid goal records found (title is required for each goal)',
      });
    }

    const created = await Goal.bulkCreate(validGoals, { returning: true });
    cacheManager.invalidateGoals(req.userId);

    res.status(201).json({
      success: true,
      count: created.length,
      data: created,
    });
  } catch (error) {
    next(error);
  }
};

exports.updateGoal = async (req, res, next) => {
  try {
    const where = { id: req.params.id };
    if (req.userId) where.userId = req.userId;
    const goal = await Goal.findOne({ where });
    if (!goal) {
      return res.status(404).json({ success: false, message: 'Goal not found' });
    }

    const { title, description, targetDate, progress, status, category, relatedTaskIds } = req.body;

    await goal.update({
      title: title !== undefined ? title.trim() : goal.title,
      description: description !== undefined ? (description ? description.trim() : null) : goal.description,
      targetDate: targetDate !== undefined ? targetDate : goal.targetDate,
      progress: progress !== undefined ? Number(progress) : goal.progress,
      status: status !== undefined ? status : goal.status,
      category: category !== undefined ? category : goal.category,
      relatedTaskIds: relatedTaskIds !== undefined ? relatedTaskIds : goal.relatedTaskIds,
    });

    const updatedGoal = await Goal.findByPk(goal.id, {
      include: [{ model: Task, as: 'tasks', attributes: ['id', 'title', 'status', 'priority', 'date'] }],
    });

    cacheManager.invalidateGoals(req.userId);
    res.json({ success: true, data: updatedGoal });
  } catch (error) {
    next(error);
  }
};

exports.deleteGoal = async (req, res, next) => {
  try {
    const where = { id: req.params.id };
    if (req.userId) where.userId = req.userId;
    const goal = await Goal.findOne({ where });
    if (!goal) {
      return res.status(404).json({ success: false, message: 'Goal not found' });
    }

    // Unlink any tasks linked to this goal
    await Task.update({ goalId: null }, { where: { goalId: goal.id } });

    await goal.destroy();
    cacheManager.invalidateGoals(req.userId);
    res.json({ success: true, message: 'Goal deleted successfully' });
  } catch (error) {
    next(error);
  }
};
