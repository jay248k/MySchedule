const { KnowledgeItem } = require('../models');
const { Op } = require('sequelize');
const LessonChainService = require('../services/lessonChainService');

const getModels = () => require('../models');

exports.getKnowledgeItems = async (req, res, next) => {
  try {
    const where = {};
    if (req.userId && process.env.ISOLATE_USER_KNOWLEDGE === 'true') {
      where[Op.or] = [{ userId: req.userId }, { userId: null }];
    }

    const { parentId, type, search, subtopicId } = req.query;

    if (parentId !== undefined) {
      where.parentId = parentId === 'root' || parentId === '' ? null : parentId;
    }
    if (type) {
      where.type = type;
    }
    if (subtopicId) {
      where.subtopicId = subtopicId;
    }
    if (search && search.trim()) {
      where[Op.or] = [
        { title: { [Op.iLike]: `%${search.trim()}%` } },
        { content: { [Op.iLike]: `%${search.trim()}%` } },
        { tags: { [Op.iLike]: `%${search.trim()}%` } },
      ];
    }

    const items = await KnowledgeItem.findAll({
      where,
      order: [
        ['isPinned', 'DESC'],
        ['lessonOrder', 'ASC'],
        ['orderIndex', 'ASC'],
        ['createdAt', 'ASC'],
      ],
    });

    res.json({
      success: true,
      count: items.length,
      data: items,
    });
  } catch (error) {
    next(error);
  }
};

exports.getKnowledgeItemById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const models = getModels();
    const item = await KnowledgeItem.findByPk(id, {
      include: [{ model: models.Subtopic, as: 'subtopic' }],
    });
    if (!item) {
      return res.status(404).json({ success: false, message: 'Item not found' });
    }
    res.json({ success: true, data: item });
  } catch (error) {
    next(error);
  }
};

exports.createKnowledgeItem = async (req, res, next) => {
  try {
    const models = getModels();
    const chainService = new LessonChainService(models);

    const { title, type, parentId, content, orderIndex, tags, icon, color, isPinned, nextLessonId, linkedLessonIds, subtopicId, lessonOrder, appendFromId } = req.body;
    if (!title || !title.trim()) {
      return res.status(400).json({ success: false, message: 'Title is required' });
    }

    const validTypes = ['folder', 'lesson', 'table'];
    const itemType = validTypes.includes(type) ? type : 'lesson';

    // If it's a plan-managed lesson (has subtopicId), auto-assign lessonOrder if not provided
    let finalLessonOrder = lessonOrder;
    if (itemType === 'lesson' && subtopicId && (!finalLessonOrder || finalLessonOrder < 1)) {
      const maxOrder = await KnowledgeItem.max('lessonOrder', {
        where: { subtopicId, type: 'lesson', [Op.or]: [{ userId: req.userId }, { userId: null }] },
      });
      finalLessonOrder = (maxOrder || 0) + 1;
    }

    const transaction = await models.sequelize.transaction();
    try {
      const newItem = await KnowledgeItem.create({
        id: `know-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        title: title.trim(),
        type: itemType,
        parentId: parentId || null,
        content: typeof content === 'object' ? JSON.stringify(content) : (content || ''),
        orderIndex: Number(orderIndex) || 0,
        tags: tags || null,
        icon: icon || (itemType === 'folder' ? 'Folder' : itemType === 'table' ? 'Table' : 'FileText'),
        color: color || (itemType === 'folder' ? '#F59E0B' : itemType === 'table' ? '#10B981' : '#3B82F6'),
        isPinned: Boolean(isPinned),
        nextLessonId: (itemType === 'lesson' && subtopicId) ? null : (nextLessonId || null),
        linkedLessonIds: typeof linkedLessonIds === 'object' ? JSON.stringify(linkedLessonIds) : (linkedLessonIds || null),
        subtopicId: subtopicId || null,
        lessonOrder: finalLessonOrder || 0,
        userId: req.userId || null,
      }, { transaction });

      // If plan-managed lesson, rebuild chain
      if (itemType === 'lesson' && subtopicId) {
        await chainService.onLessonCreated(newItem, transaction);
      }

      // If created via "+ Attach Next Step", atomically link previous step -> newItem.id in DB
      if (appendFromId) {
        const parentStep = await KnowledgeItem.findByPk(appendFromId, { transaction });
        if (parentStep) {
          await parentStep.update({ nextLessonId: newItem.id }, { transaction });
        }
      }

      await transaction.commit();

      res.status(201).json({
        success: true,
        message: `${itemType.charAt(0).toUpperCase() + itemType.slice(1)} created successfully`,
        data: newItem,
      });
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  } catch (error) {
    next(error);
  }
};

exports.reorderKnowledgeChain = async (req, res, next) => {
  try {
    const { items } = req.body;
    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ success: false, message: 'Items array is required' });
    }

    const transaction = await KnowledgeItem.sequelize.transaction();
    try {
      for (const entry of items) {
        if (!entry.id) continue;
        await KnowledgeItem.update(
          {
            orderIndex: Number(entry.orderIndex) || 0,
            nextLessonId: entry.nextLessonId || null,
          },
          { where: { id: entry.id }, transaction }
        );
      }
      await transaction.commit();
      res.json({ success: true, message: 'Chain order updated in database' });
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  } catch (error) {
    next(error);
  }
};

exports.updateKnowledgeItem = async (req, res, next) => {
  try {
    const models = getModels();
    const chainService = new LessonChainService(models);

    const { id } = req.params;
    const item = await KnowledgeItem.findByPk(id);
    if (!item) {
      return res.status(404).json({ success: false, message: 'Item not found' });
    }

    const { title, parentId, content, orderIndex, tags, icon, color, isPinned, nextLessonId, linkedLessonIds, subtopicId, lessonOrder } = req.body;

    const oldSubtopicId = item.subtopicId;
    const oldLessonOrder = item.lessonOrder;
    const wasPlanManaged = item.type === 'lesson' && oldSubtopicId;

    const transaction = await models.sequelize.transaction();
    try {
      await item.update({
        ...(title !== undefined && { title: title.trim() }),
        ...(parentId !== undefined && { parentId: parentId || null }),
        ...(content !== undefined && { content: typeof content === 'object' ? JSON.stringify(content) : content }),
        ...(orderIndex !== undefined && { orderIndex: Number(orderIndex) }),
        ...(tags !== undefined && { tags }),
        ...(icon !== undefined && { icon }),
        ...(color !== undefined && { color }),
        ...(isPinned !== undefined && { isPinned: Boolean(isPinned) }),
        // For plan-managed lessons, nextLessonId is managed automatically
        ...(!(item.type === 'lesson' && subtopicId !== undefined && subtopicId) && nextLessonId !== undefined && { nextLessonId: nextLessonId || null }),
        ...(linkedLessonIds !== undefined && {
          linkedLessonIds: typeof linkedLessonIds === 'object' ? JSON.stringify(linkedLessonIds) : linkedLessonIds,
        }),
        ...(subtopicId !== undefined && { subtopicId: subtopicId || null }),
        ...(lessonOrder !== undefined && { lessonOrder: Number(lessonOrder) }),
      }, { transaction });

      // Handle chain rebuilding for plan-managed lessons
      if (item.type === 'lesson') {
        const newSubtopicId = item.subtopicId;
        const newLessonOrder = item.lessonOrder;

        if (oldSubtopicId && newSubtopicId && oldSubtopicId !== newSubtopicId) {
          // Lesson moved between subtopics
          await chainService.onLessonMoved(item, oldSubtopicId, transaction);
        } else if (newSubtopicId && oldLessonOrder !== newLessonOrder) {
          // Lesson order changed within same subtopic
          await chainService.onLessonOrderChanged(item, transaction);
        } else if (!oldSubtopicId && newSubtopicId) {
          // Standalone lesson added to a plan
          await chainService.onLessonCreated(item, transaction);
        } else if (oldSubtopicId && !newSubtopicId) {
          // Plan-managed lesson made standalone
          await chainService.onLessonDeleted(id, { subtopicId: oldSubtopicId, userId: item.userId }, transaction);
        }
      }

      await transaction.commit();

      res.json({
        success: true,
        message: 'Item updated successfully',
        data: item,
      });
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  } catch (error) {
    next(error);
  }
};

// Recursive delete helper for folders
const deleteItemAndChildren = async (itemId, transaction = null) => {
  const children = await KnowledgeItem.findAll({ where: { parentId: itemId }, transaction });
  for (const child of children) {
    await deleteItemAndChildren(child.id, transaction);
  }
  await KnowledgeItem.destroy({ where: { id: itemId }, transaction });
};

exports.deleteKnowledgeItem = async (req, res, next) => {
  try {
    const models = getModels();
    const chainService = new LessonChainService(models);

    const { id } = req.params;
    const item = await KnowledgeItem.findByPk(id);
    if (!item) {
      return res.status(404).json({ success: false, message: 'Item not found' });
    }

    const wasPlanManagedLesson = item.type === 'lesson' && item.subtopicId;
    const subtopicId = item.subtopicId;
    const userId = item.userId;

    const transaction = await models.sequelize.transaction();
    try {
      await deleteItemAndChildren(id, transaction);

      // Rebuild chain if it was a plan-managed lesson
      if (wasPlanManagedLesson) {
        await chainService.onLessonDeleted(id, { subtopicId, userId }, transaction);
      }

      await transaction.commit();

      res.json({
        success: true,
        message: 'Item and its contents deleted successfully',
        id,
      });
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  } catch (error) {
    next(error);
  }
};

/**
 * Get lesson chain for a subtopic
 */
exports.getLessonChain = async (req, res, next) => {
  try {
    const models = getModels();
    const chainService = new LessonChainService(models);

    const { subtopicId } = req.params;
    const userId = req.userId;

    const chain = await chainService.getFullChain({ subtopicId, userId });
    const validation = await chainService.validateChain({ subtopicId, userId });

    res.json({
      success: true,
      data: {
        chain,
        validation,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Rebuild lesson chain for a subtopic
 */
exports.rebuildLessonChain = async (req, res, next) => {
  try {
    const models = getModels();
    const chainService = new LessonChainService(models);

    const { subtopicId } = req.params;
    const userId = req.userId;

    const result = await chainService.rebuildChain({ subtopicId, userId });

    res.json({
      success: true,
      message: 'Chain rebuilt successfully',
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

