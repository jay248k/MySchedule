const { Op } = require('sequelize');
const { Section, Subsection, Topic, Subtopic, KnowledgeItem, Plan } = require('../models');

exports.getSectionsByPlan = async (req, res, next) => {
  try {
    const { planId } = req.params;

    const where = { planId };
    if (req.userId) {
      where.userId = req.userId;
    }

    const sections = await Section.findAll({
      where,
      include: [{
        model: Subsection,
        as: 'subsections',
        order: [['orderIndex', 'ASC']],
      }],
      order: [['orderIndex', 'ASC']],
    });

    res.json({ success: true, count: sections.length, data: sections });
  } catch (error) {
    next(error);
  }
};

exports.getSectionById = async (req, res, next) => {
  try {
    const where = { id: req.params.id };
    if (req.userId) {
      where.userId = req.userId;
    }

    const section = await Section.findOne({
      where,
      include: [{
        model: Subsection,
        as: 'subsections',
        include: [{
          model: Topic,
          as: 'topics',
          include: [{
            model: Subtopic,
            as: 'subtopics',
          }],
        }],
      }],
    });

    if (!section) {
      return res.status(404).json({ success: false, message: 'Section not found' });
    }
    res.json({ success: true, data: section });
  } catch (error) {
    next(error);
  }
};

exports.createSection = async (req, res, next) => {
  try {
    const { id, title, description, planId, orderIndex } = req.body;

    if (!title || !title.trim()) {
      return res.status(400).json({ success: false, message: 'Section title is required' });
    }
    if (!planId) {
      return res.status(400).json({ success: false, message: 'Plan ID is required' });
    }

    // Verify plan exists and user has access
    const planWhere = { id: planId };
    if (req.userId) {
      planWhere[Op.or] = [{ userId: req.userId }, { userId: null }];
    }
    const plan = await Plan.findOne({ where: planWhere });
    if (!plan) {
      return res.status(404).json({ success: false, message: 'Plan not found' });
    }

    // Check for duplicate
    const duplicate = await Section.findOne({
      where: {
        title: title.trim(),
        planId,
        userId: req.userId,
      },
    });
    if (duplicate) {
      return res.status(409).json({ success: false, message: `Section "${title.trim()}" already exists in this plan` });
    }

    // Auto-assign orderIndex if not provided
    let finalOrderIndex = orderIndex;
    if (finalOrderIndex === undefined || finalOrderIndex === null) {
      const maxOrder = await Section.max('orderIndex', { where: { planId } });
      finalOrderIndex = (maxOrder || 0) + 1;
    }

    const section = await Section.create({
      id: id || undefined,
      title: title.trim(),
      description: description?.trim() || null,
      planId,
      orderIndex: Number(finalOrderIndex) || 0,
      userId: req.userId || null,
    });

    res.status(201).json({ success: true, data: section });
  } catch (error) {
    next(error);
  }
};

exports.updateSection = async (req, res, next) => {
  try {
    const where = { id: req.params.id };
    if (req.userId) {
      where.userId = req.userId;
    }

    const section = await Section.findOne({ where });
    if (!section) {
      return res.status(404).json({ success: false, message: 'Section not found' });
    }

    const { title, description, orderIndex, planId } = req.body;

    let finalTitle = section.title;
    if (title !== undefined) {
      const trimmed = title.trim();
      if (!trimmed) {
        return res.status(400).json({ success: false, message: 'Section title cannot be empty' });
      }

      const duplicate = await Section.findOne({
        where: {
          title: trimmed,
          planId: planId || section.planId,
          userId: req.userId,
          id: { [Op.ne]: section.id },
        },
      });
      if (duplicate) {
        return res.status(409).json({ success: false, message: `Section "${trimmed}" already exists` });
      }
      finalTitle = trimmed;
    }

    await section.update({
      title: finalTitle,
      description: description !== undefined ? (description?.trim() || null) : section.description,
      orderIndex: orderIndex !== undefined ? Number(orderIndex) : section.orderIndex,
      planId: planId !== undefined ? planId : section.planId,
    });

    const updatedSection = await Section.findByPk(section.id, {
      include: [{ model: Subsection, as: 'subsections' }],
    });

    res.json({ success: true, data: updatedSection });
  } catch (error) {
    next(error);
  }
};

exports.deleteSection = async (req, res, next) => {
  try {
    const where = { id: req.params.id };
    if (req.userId) {
      where.userId = req.userId;
    }

    const section = await Section.findOne({ where });
    if (!section) {
      return res.status(404).json({ success: false, message: 'Section not found' });
    }

    await section.destroy();
    res.json({ success: true, message: 'Section deleted successfully' });
  } catch (error) {
    next(error);
  }
};

exports.reorderSections = async (req, res, next) => {
  try {
    const { planId, sectionOrders } = req.body; // sectionOrders: [{ id, orderIndex }]

    if (!planId || !Array.isArray(sectionOrders)) {
      return res.status(400).json({ success: false, message: 'planId and sectionOrders array required' });
    }

    // Verify plan access
    const planWhere = { id: planId };
    if (req.userId) {
      planWhere[Op.or] = [{ userId: req.userId }, { userId: null }];
    }
    const plan = await Plan.findOne({ where: planWhere });
    if (!plan) {
      return res.status(404).json({ success: false, message: 'Plan not found' });
    }

    const transaction = await Plan.sequelize.transaction();
    try {
      for (const item of sectionOrders) {
        await Section.update(
          { orderIndex: item.orderIndex },
          { where: { id: item.id, planId }, transaction }
        );
      }
      await transaction.commit();

      const sections = await Section.findAll({
        where: { planId },
        order: [['orderIndex', 'ASC']],
      });

      res.json({ success: true, data: sections });
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  } catch (error) {
    next(error);
  }
};