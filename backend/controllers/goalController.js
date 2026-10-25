const { Goal, Task } = require('../models');

exports.getAllGoals = async (req, res, next) => {
  try {
    const where = {};
    if (req.userId) {
      where.userId = req.userId;
    }

    const goals = await Goal.findAll({
      where,
      include: [{ model: Task, as: 'tasks' }],
      order: [['targetDate', 'ASC']],
    });
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
      include: [{ model: Task, as: 'tasks' }],
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

    res.status(201).json({ success: true, data: goal });
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
      include: [{ model: Task, as: 'tasks' }],
    });

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
    res.json({ success: true, message: 'Goal deleted successfully' });
  } catch (error) {
    next(error);
  }
};
