const { Op } = require('sequelize');
const cacheManager = require('../utils/cacheManager');
const { Plan, Category, Goal, Section, Subsection, Topic, Subtopic, KnowledgeItem } = require('../models');

exports.getAllPlans = async (req, res, next) => {
  try {
    const cacheKey = `plans_${req.userId || 'public'}`;
    const cached = cacheManager.get(cacheKey);
    if (cached) {
      return res.json({ success: true, data: cached, fromCache: true });
    }

    const where = req.userId
      ? { [Op.or]: [{ userId: req.userId }, { userId: null }] }
      : {};

    const { categoryId, goalId, status } = req.query;
    if (categoryId) where.categoryId = categoryId;
    if (goalId) where.goalId = goalId;
    if (status) where.status = status;

    const plans = await Plan.findAll({
      where,
      include: [
        { model: Category, as: 'category', attributes: ['id', 'name', 'color', 'icon'] },
        { model: Goal, as: 'goal', attributes: ['id', 'title', 'progress', 'status'] },
        { model: Section, as: 'sections', attributes: ['id', 'title', 'orderIndex'] },
      ],
      order: [
        ['createdAt', 'DESC'],
        [{ model: Section, as: 'sections' }, 'orderIndex', 'ASC'],
      ],
    });

    cacheManager.set(cacheKey, plans, 120);
    res.json({ success: true, count: plans.length, data: plans });
  } catch (error) {
    next(error);
  }
};

exports.getPlanById = async (req, res, next) => {
  try {
    const where = { id: req.params.id };
    if (req.userId) {
      where[Op.or] = [{ userId: req.userId }, { userId: null }];
    }

    const plan = await Plan.findOne({
      where,
      include: [
        { model: Category, as: 'category', attributes: ['id', 'name', 'color', 'icon'] },
        { model: Goal, as: 'goal', attributes: ['id', 'title', 'description', 'progress', 'status', 'targetDate'] },
        {
          model: Section,
          as: 'sections',
          include: [{
            model: Subsection,
            as: 'subsections',
            include: [{
              model: Topic,
              as: 'topics',
              include: [{
                model: Subtopic,
                as: 'subtopics',
                include: [{
                  model: KnowledgeItem,
                  as: 'lessons',
                  where: { type: 'lesson' },
                  required: false,
                  order: [['lessonOrder', 'ASC']],
                }],
              }],
            }],
          }],
          order: [
            ['orderIndex', 'ASC'],
            [{ model: Subsection, as: 'subsections' }, 'orderIndex', 'ASC'],
            [{ model: Subsection, as: 'subsections' }, { model: Topic, as: 'topics' }, 'orderIndex', 'ASC'],
            [{ model: Subsection, as: 'subsections' }, { model: Topic, as: 'topics' }, { model: Subtopic, as: 'subtopics' }, 'orderIndex', 'ASC'],
            [{ model: Subsection, as: 'subsections' }, { model: Topic, as: 'topics' }, { model: Subtopic, as: 'subtopics' }, { model: KnowledgeItem, as: 'lessons' }, 'lessonOrder', 'ASC'],
          ],
        },
      ],
    });

    if (!plan) {
      return res.status(404).json({ success: false, message: 'Plan not found' });
    }
    res.json({ success: true, data: plan });
  } catch (error) {
    next(error);
  }
};

exports.createPlan = async (req, res, next) => {
  try {
    const { id, title, description, categoryId, goalId, startDate, endDate, status } = req.body;

    if (!title || !title.trim()) {
      return res.status(400).json({ success: false, message: 'Plan title is required' });
    }

    const trimmedTitle = title.trim();

    // Check for duplicate
    const where = { title: trimmedTitle };
    if (goalId) where.goalId = goalId;
    else if (categoryId) where.categoryId = categoryId;
    if (req.userId) {
      where[Op.or] = [{ userId: req.userId }, { userId: null }];
    }

    const duplicate = await Plan.findOne({ where });
    if (duplicate) {
      return res.status(409).json({ success: false, message: `Plan "${trimmedTitle}" already exists` });
    }

    const plan = await Plan.create({
      id: id || undefined,
      title: trimmedTitle,
      description: description?.trim() || null,
      categoryId: categoryId || null,
      goalId: goalId || null,
      startDate: startDate || null,
      endDate: endDate || null,
      status: status || 'in-progress',
      progress: 0,
      userId: req.userId || null,
    });

    cacheManager.invalidatePlans?.(req.userId);
    res.status(201).json({ success: true, data: plan });
  } catch (error) {
    next(error);
  }
};

exports.bulkCreatePlans = async (req, res, next) => {
  try {
    const rawPlans = Array.isArray(req.body) ? req.body : req.body.plans || [];

    if (!Array.isArray(rawPlans) || rawPlans.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No plans provided for bulk import',
      });
    }

    const validPlans = [];
    for (const item of rawPlans) {
      if (!item || !item.title || !item.title.trim()) continue;
      validPlans.push({
        id: item.id || undefined,
        title: item.title.trim(),
        description: item.description?.trim() || null,
        categoryId: item.categoryId || null,
        goalId: item.goalId || null,
        startDate: item.startDate || null,
        endDate: item.endDate || null,
        status: item.status || 'in-progress',
        progress: 0,
        userId: req.userId || item.userId || null,
      });
    }

    if (validPlans.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No valid plan records found (title is required)',
      });
    }

    const created = await Plan.bulkCreate(validPlans, { returning: true });
    cacheManager.invalidatePlans?.(req.userId);

    res.status(201).json({
      success: true,
      count: created.length,
      data: created,
    });
  } catch (error) {
    next(error);
  }
};

exports.updatePlan = async (req, res, next) => {
  try {
    const where = { id: req.params.id };
    if (req.userId) {
      where[Op.or] = [{ userId: req.userId }, { userId: null }];
    }

    const plan = await Plan.findOne({ where });
    if (!plan) {
      return res.status(404).json({ success: false, message: 'Plan not found' });
    }

    const { title, description, categoryId, goalId, startDate, endDate, status, progress } = req.body;

    let finalTitle = plan.title;
    if (title !== undefined) {
      const trimmed = title.trim();
      if (!trimmed) {
        return res.status(400).json({ success: false, message: 'Plan title cannot be empty' });
      }
      if (trimmed.length > 255) {
        return res.status(400).json({ success: false, message: 'Plan title cannot exceed 255 characters' });
      }

      // Check for duplicate
      const dupWhere = { title: trimmed, id: { [Op.ne]: plan.id } };
      if (goalId || plan.goalId) dupWhere.goalId = goalId || plan.goalId;
      else if (categoryId || plan.categoryId) dupWhere.categoryId = categoryId || plan.categoryId;
      if (req.userId) {
        dupWhere[Op.or] = [{ userId: req.userId }, { userId: null }];
      }

      const duplicate = await Plan.findOne({ where: dupWhere });
      if (duplicate) {
        return res.status(409).json({ success: false, message: `Plan "${trimmed}" already exists` });
      }
      finalTitle = trimmed;
    }

    let finalProgress = plan.progress;
    if (progress !== undefined) {
      const p = Number(progress);
      if (isNaN(p) || p < 0 || p > 100) {
        return res.status(400).json({ success: false, message: 'Plan progress must be a number between 0 and 100' });
      }
      finalProgress = p;
    }

    await plan.update({
      title: finalTitle,
      description: description !== undefined ? (description?.trim() || null) : plan.description,
      categoryId: categoryId !== undefined ? categoryId : plan.categoryId,
      goalId: goalId !== undefined ? goalId : plan.goalId,
      startDate: startDate !== undefined ? startDate : plan.startDate,
      endDate: endDate !== undefined ? endDate : plan.endDate,
      status: status !== undefined ? status : (finalProgress >= 100 ? 'completed' : plan.status),
      progress: finalProgress,
      ...(plan.userId === null && req.userId ? { userId: req.userId } : {}),
    });

    const updatedPlan = await Plan.findByPk(plan.id, {
      include: [
        { model: Category, as: 'category', attributes: ['id', 'name', 'color', 'icon'] },
        { model: Goal, as: 'goal', attributes: ['id', 'title', 'progress', 'status'] },
      ],
    });

    cacheManager.invalidatePlans?.(req.userId);
    res.json({ success: true, data: updatedPlan });
  } catch (error) {
    next(error);
  }
};

exports.deletePlan = async (req, res, next) => {
  try {
    const where = { id: req.params.id };
    if (req.userId) {
      where[Op.or] = [{ userId: req.userId }, { userId: null }];
    }

    const plan = await Plan.findOne({ where });
    if (!plan) {
      return res.status(404).json({ success: false, message: 'Plan not found' });
    }

    await plan.destroy();
    cacheManager.invalidatePlans?.(req.userId);
    res.json({ success: true, message: 'Plan deleted successfully' });
  } catch (error) {
    next(error);
  }
};

exports.getPlanProgress = async (req, res, next) => {
  try {
    const where = { id: req.params.id };
    if (req.userId) {
      where[Op.or] = [{ userId: req.userId }, { userId: null }];
    }

    const plan = await Plan.findOne({
      where,
      include: [{
        model: Section,
        as: 'sections',
        include: [{
          model: Subsection,
          as: 'subsections',
          include: [{
            model: Topic,
            as: 'topics',
            include: [{
              model: Subtopic,
              as: 'subtopics',
              include: [{
                model: KnowledgeItem,
                as: 'lessons',
                where: { type: 'lesson' },
                required: false,
                attributes: ['id', 'title', 'lessonOrder'],
              }],
            }],
          }],
        }],
      }],
    });

    if (!plan) {
      return res.status(404).json({ success: false, message: 'Plan not found' });
    }

    // Calculate progress
    let totalLessons = 0;
    let completedLessons = 0;

    const countLessons = (subtopic) => {
      if (subtopic.lessons) {
        totalLessons += subtopic.lessons.length;
        // Could add completion tracking here if lessons have a completed flag
      }
    };

    plan.sections?.forEach(section => {
      section.subsections?.forEach(subsection => {
        subsection.topics?.forEach(topic => {
          topic.subtopics?.forEach(countLessons);
        });
      });
    });

    const progress = totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0;

    res.json({
      success: true,
      data: {
        planId: plan.id,
        planTitle: plan.title,
        totalLessons,
        completedLessons,
        progress,
      },
    });
  } catch (error) {
    next(error);
  }
};

// Cache invalidation helper
cacheManager.invalidatePlans = (userId) => {
  const keys = [`plans_${userId || 'public'}`];
  keys.forEach(key => cacheManager.delete(key));
};