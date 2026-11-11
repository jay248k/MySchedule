const { Thought } = require('../models');
const { Op } = require('sequelize');

exports.getThoughts = async (req, res, next) => {
  try {
    const where = {};
    if (req.userId && process.env.ISOLATE_USER_KNOWLEDGE === 'true') {
      where[Op.or] = [{ userId: req.userId }, { userId: null }];
    }
    const { category, search } = req.query;
    if (category && category !== 'All') {
      where.category = category;
    }

    const thoughts = await Thought.findAll({
      where,
      order: [
        ['isPinned', 'DESC'],
        ['createdAt', 'DESC'],
      ],
    });

    res.json({
      success: true,
      count: thoughts.length,
      data: thoughts,
    });
  } catch (error) {
    next(error);
  }
};

exports.getThoughtById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const thought = await Thought.findByPk(id);
    if (!thought) {
      return res.status(404).json({ success: false, message: 'Thought not found' });
    }
    res.json({ success: true, data: thought });
  } catch (error) {
    next(error);
  }
};

exports.createThought = async (req, res, next) => {
  try {
    const { text, category, isFavorite, isPinned } = req.body;
    if (!text || !text.trim()) {
      return res.status(400).json({ success: false, message: 'Thought text is required' });
    }

    const newThought = await Thought.create({
      id: `thought-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      text: text.trim(),
      category: category || 'Motivation',
      isFavorite: Boolean(isFavorite),
      isPinned: Boolean(isPinned),
      userId: req.userId || null,
    });

    res.status(201).json({
      success: true,
      message: 'Thought saved successfully',
      data: newThought,
    });
  } catch (error) {
    next(error);
  }
};

exports.updateThought = async (req, res, next) => {
  try {
    const { id } = req.params;
    const thought = await Thought.findByPk(id);
    if (!thought) {
      return res.status(404).json({ success: false, message: 'Thought not found' });
    }

    const { text, category, isFavorite, isPinned } = req.body;
    await thought.update({
      ...(text !== undefined && { text: text.trim() }),
      ...(category !== undefined && { category }),
      ...(isFavorite !== undefined && { isFavorite: Boolean(isFavorite) }),
      ...(isPinned !== undefined && { isPinned: Boolean(isPinned) }),
    });

    res.json({
      success: true,
      message: 'Thought updated successfully',
      data: thought,
    });
  } catch (error) {
    next(error);
  }
};

exports.deleteThought = async (req, res, next) => {
  try {
    const { id } = req.params;
    const thought = await Thought.findByPk(id);
    if (!thought) {
      return res.status(404).json({ success: false, message: 'Thought not found' });
    }

    await thought.destroy();
    res.json({
      success: true,
      message: 'Thought deleted successfully',
      id,
    });
  } catch (error) {
    next(error);
  }
};

