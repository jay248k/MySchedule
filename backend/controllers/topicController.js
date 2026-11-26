const { Op } = require('sequelize');
const { Section, Subsection, Topic, Subtopic, KnowledgeItem, Plan } = require('../models');

exports.getSubsectionsBySection = async (req, res, next) => {
  try {
    const { sectionId } = req.params;

    const where = { sectionId };
    if (req.userId) {
      where.userId = req.userId;
    }

    const subsections = await Subsection.findAll({
      where,
      include: [{
        model: Topic,
        as: 'topics',
        order: [['orderIndex', 'ASC']],
      }],
      order: [['orderIndex', 'ASC']],
    });

    res.json({ success: true, count: subsections.length, data: subsections });
  } catch (error) {
    next(error);
  }
};

exports.getSubsectionById = async (req, res, next) => {
  try {
    const where = { id: req.params.id };
    if (req.userId) {
      where.userId = req.userId;
    }

    const subsection = await Subsection.findOne({
      where,
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
    });

    if (!subsection) {
      return res.status(404).json({ success: false, message: 'Subsection not found' });
    }
    res.json({ success: true, data: subsection });
  } catch (error) {
    next(error);
  }
};

exports.createSubsection = async (req, res, next) => {
  try {
    const { id, title, description, sectionId, orderIndex } = req.body;

    if (!title || !title.trim()) {
      return res.status(400).json({ success: false, message: 'Subsection title is required' });
    }
    if (!sectionId) {
      return res.status(400).json({ success: false, message: 'Section ID is required' });
    }

    // Verify section exists and user has access
    const sectionWhere = { id: sectionId };
    if (req.userId) {
      sectionWhere.userId = req.userId;
    }
    const section = await Section.findOne({ where: sectionWhere });
    if (!section) {
      return res.status(404).json({ success: false, message: 'Section not found' });
    }

    const duplicate = await Subsection.findOne({
      where: {
        title: title.trim(),
        sectionId,
        userId: req.userId,
      },
    });
    if (duplicate) {
      return res.status(409).json({ success: false, message: `Subsection "${title.trim()}" already exists in this section` });
    }

    let finalOrderIndex = orderIndex;
    if (finalOrderIndex === undefined || finalOrderIndex === null) {
      const maxOrder = await Subsection.max('orderIndex', { where: { sectionId } });
      finalOrderIndex = (maxOrder || 0) + 1;
    }

    const subsection = await Subsection.create({
      id: id || undefined,
      title: title.trim(),
      description: description?.trim() || null,
      sectionId,
      orderIndex: Number(finalOrderIndex) || 0,
      userId: req.userId || null,
    });

    res.status(201).json({ success: true, data: subsection });
  } catch (error) {
    next(error);
  }
};

exports.updateSubsection = async (req, res, next) => {
  try {
    const where = { id: req.params.id };
    if (req.userId) {
      where.userId = req.userId;
    }

    const subsection = await Subsection.findOne({ where });
    if (!subsection) {
      return res.status(404).json({ success: false, message: 'Subsection not found' });
    }

    const { title, description, orderIndex, sectionId } = req.body;

    let finalTitle = subsection.title;
    if (title !== undefined) {
      const trimmed = title.trim();
      if (!trimmed) {
        return res.status(400).json({ success: false, message: 'Subsection title cannot be empty' });
      }

      const duplicate = await Subsection.findOne({
        where: {
          title: trimmed,
          sectionId: sectionId || subsection.sectionId,
          userId: req.userId,
          id: { [Op.ne]: subsection.id },
        },
      });
      if (duplicate) {
        return res.status(409).json({ success: false, message: `Subsection "${trimmed}" already exists` });
      }
      finalTitle = trimmed;
    }

    await subsection.update({
      title: finalTitle,
      description: description !== undefined ? (description?.trim() || null) : subsection.description,
      orderIndex: orderIndex !== undefined ? Number(orderIndex) : subsection.orderIndex,
      sectionId: sectionId !== undefined ? sectionId : subsection.sectionId,
    });

    const updated = await Subsection.findByPk(subsection.id, {
      include: [{ model: Topic, as: 'topics' }],
    });

    res.json({ success: true, data: updated });
  } catch (error) {
    next(error);
  }
};

exports.deleteSubsection = async (req, res, next) => {
  try {
    const where = { id: req.params.id };
    if (req.userId) {
      where.userId = req.userId;
    }

    const subsection = await Subsection.findOne({ where });
    if (!subsection) {
      return res.status(404).json({ success: false, message: 'Subsection not found' });
    }

    await subsection.destroy();
    res.json({ success: true, message: 'Subsection deleted successfully' });
  } catch (error) {
    next(error);
  }
};

exports.getTopicsBySubsection = async (req, res, next) => {
  try {
    const { subsectionId } = req.params;

    const where = { subsectionId };
    if (req.userId) {
      where.userId = req.userId;
    }

    const topics = await Topic.findAll({
      where,
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
      order: [['orderIndex', 'ASC']],
    });

    res.json({ success: true, count: topics.length, data: topics });
  } catch (error) {
    next(error);
  }
};

exports.getTopicById = async (req, res, next) => {
  try {
    const where = { id: req.params.id };
    if (req.userId) {
      where.userId = req.userId;
    }

    const topic = await Topic.findOne({
      where,
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
    });

    if (!topic) {
      return res.status(404).json({ success: false, message: 'Topic not found' });
    }
    res.json({ success: true, data: topic });
  } catch (error) {
    next(error);
  }
};

exports.createTopic = async (req, res, next) => {
  try {
    const { id, title, description, subsectionId, orderIndex } = req.body;

    if (!title || !title.trim()) {
      return res.status(400).json({ success: false, message: 'Topic title is required' });
    }
    if (!subsectionId) {
      return res.status(400).json({ success: false, message: 'Subsection ID is required' });
    }

    const subsectionWhere = { id: subsectionId };
    if (req.userId) {
      subsectionWhere.userId = req.userId;
    }
    const subsection = await Subsection.findOne({ where: subsectionWhere });
    if (!subsection) {
      return res.status(404).json({ success: false, message: 'Subsection not found' });
    }

    const duplicate = await Topic.findOne({
      where: {
        title: title.trim(),
        subsectionId,
        userId: req.userId,
      },
    });
    if (duplicate) {
      return res.status(409).json({ success: false, message: `Topic "${title.trim()}" already exists in this subsection` });
    }

    let finalOrderIndex = orderIndex;
    if (finalOrderIndex === undefined || finalOrderIndex === null) {
      const maxOrder = await Topic.max('orderIndex', { where: { subsectionId } });
      finalOrderIndex = (maxOrder || 0) + 1;
    }

    const topic = await Topic.create({
      id: id || undefined,
      title: title.trim(),
      description: description?.trim() || null,
      subsectionId,
      orderIndex: Number(finalOrderIndex) || 0,
      userId: req.userId || null,
    });

    res.status(201).json({ success: true, data: topic });
  } catch (error) {
    next(error);
  }
};

exports.updateTopic = async (req, res, next) => {
  try {
    const where = { id: req.params.id };
    if (req.userId) {
      where.userId = req.userId;
    }

    const topic = await Topic.findOne({ where });
    if (!topic) {
      return res.status(404).json({ success: false, message: 'Topic not found' });
    }

    const { title, description, orderIndex, subsectionId } = req.body;

    let finalTitle = topic.title;
    if (title !== undefined) {
      const trimmed = title.trim();
      if (!trimmed) {
        return res.status(400).json({ success: false, message: 'Topic title cannot be empty' });
      }

      const duplicate = await Topic.findOne({
        where: {
          title: trimmed,
          subsectionId: subsectionId || topic.subsectionId,
          userId: req.userId,
          id: { [Op.ne]: topic.id },
        },
      });
      if (duplicate) {
        return res.status(409).json({ success: false, message: `Topic "${trimmed}" already exists` });
      }
      finalTitle = trimmed;
    }

    await topic.update({
      title: finalTitle,
      description: description !== undefined ? (description?.trim() || null) : topic.description,
      orderIndex: orderIndex !== undefined ? Number(orderIndex) : topic.orderIndex,
      subsectionId: subsectionId !== undefined ? subsectionId : topic.subsectionId,
    });

    const updated = await Topic.findByPk(topic.id, {
      include: [{ model: Subtopic, as: 'subtopics' }],
    });

    res.json({ success: true, data: updated });
  } catch (error) {
    next(error);
  }
};

exports.deleteTopic = async (req, res, next) => {
  try {
    const where = { id: req.params.id };
    if (req.userId) {
      where.userId = req.userId;
    }

    const topic = await Topic.findOne({ where });
    if (!topic) {
      return res.status(404).json({ success: false, message: 'Topic not found' });
    }

    await topic.destroy();
    res.json({ success: true, message: 'Topic deleted successfully' });
  } catch (error) {
    next(error);
  }
};

exports.getSubtopicsByTopic = async (req, res, next) => {
  try {
    const { topicId } = req.params;

    const where = { topicId };
    if (req.userId) {
      where.userId = req.userId;
    }

    const subtopics = await Subtopic.findAll({
      where,
      include: [{
        model: KnowledgeItem,
        as: 'lessons',
        where: { type: 'lesson' },
        required: false,
        order: [['lessonOrder', 'ASC']],
      }],
      order: [['orderIndex', 'ASC']],
    });

    res.json({ success: true, count: subtopics.length, data: subtopics });
  } catch (error) {
    next(error);
  }
};

exports.getSubtopicById = async (req, res, next) => {
  try {
    const where = { id: req.params.id };
    if (req.userId) {
      where.userId = req.userId;
    }

    const subtopic = await Subtopic.findOne({
      where,
      include: [{
        model: KnowledgeItem,
        as: 'lessons',
        where: { type: 'lesson' },
        required: false,
        order: [['lessonOrder', 'ASC']],
      }],
    });

    if (!subtopic) {
      return res.status(404).json({ success: false, message: 'Subtopic not found' });
    }
    res.json({ success: true, data: subtopic });
  } catch (error) {
    next(error);
  }
};

exports.createSubtopic = async (req, res, next) => {
  try {
    const { id, title, description, topicId, orderIndex } = req.body;

    if (!title || !title.trim()) {
      return res.status(400).json({ success: false, message: 'Subtopic title is required' });
    }
    if (!topicId) {
      return res.status(400).json({ success: false, message: 'Topic ID is required' });
    }

    const topicWhere = { id: topicId };
    if (req.userId) {
      topicWhere.userId = req.userId;
    }
    const topic = await Topic.findOne({ where: topicWhere });
    if (!topic) {
      return res.status(404).json({ success: false, message: 'Topic not found' });
    }

    const duplicate = await Subtopic.findOne({
      where: {
        title: title.trim(),
        topicId,
        userId: req.userId,
      },
    });
    if (duplicate) {
      return res.status(409).json({ success: false, message: `Subtopic "${title.trim()}" already exists in this topic` });
    }

    let finalOrderIndex = orderIndex;
    if (finalOrderIndex === undefined || finalOrderIndex === null) {
      const maxOrder = await Subtopic.max('orderIndex', { where: { topicId } });
      finalOrderIndex = (maxOrder || 0) + 1;
    }

    const subtopic = await Subtopic.create({
      id: id || undefined,
      title: title.trim(),
      description: description?.trim() || null,
      topicId,
      orderIndex: Number(finalOrderIndex) || 0,
      userId: req.userId || null,
    });

    res.status(201).json({ success: true, data: subtopic });
  } catch (error) {
    next(error);
  }
};

exports.updateSubtopic = async (req, res, next) => {
  try {
    const where = { id: req.params.id };
    if (req.userId) {
      where.userId = req.userId;
    }

    const subtopic = await Subtopic.findOne({ where });
    if (!subtopic) {
      return res.status(404).json({ success: false, message: 'Subtopic not found' });
    }

    const { title, description, orderIndex, topicId } = req.body;

    let finalTitle = subtopic.title;
    if (title !== undefined) {
      const trimmed = title.trim();
      if (!trimmed) {
        return res.status(400).json({ success: false, message: 'Subtopic title cannot be empty' });
      }

      const duplicate = await Subtopic.findOne({
        where: {
          title: trimmed,
          topicId: topicId || subtopic.topicId,
          userId: req.userId,
          id: { [Op.ne]: subtopic.id },
        },
      });
      if (duplicate) {
        return res.status(409).json({ success: false, message: `Subtopic "${trimmed}" already exists` });
      }
      finalTitle = trimmed;
    }

    await subtopic.update({
      title: finalTitle,
      description: description !== undefined ? (description?.trim() || null) : subtopic.description,
      orderIndex: orderIndex !== undefined ? Number(orderIndex) : subtopic.orderIndex,
      topicId: topicId !== undefined ? topicId : subtopic.topicId,
    });

    const updated = await Subtopic.findByPk(subtopic.id, {
      include: [{
        model: KnowledgeItem,
        as: 'lessons',
        where: { type: 'lesson' },
        required: false,
        order: [['lessonOrder', 'ASC']],
      }],
    });

    res.json({ success: true, data: updated });
  } catch (error) {
    next(error);
  }
};

exports.deleteSubtopic = async (req, res, next) => {
  try {
    const where = { id: req.params.id };
    if (req.userId) {
      where.userId = req.userId;
    }

    const subtopic = await Subtopic.findOne({ where });
    if (!subtopic) {
      return res.status(404).json({ success: false, message: 'Subtopic not found' });
    }

    await subtopic.destroy();
    res.json({ success: true, message: 'Subtopic deleted successfully' });
  } catch (error) {
    next(error);
  }
};