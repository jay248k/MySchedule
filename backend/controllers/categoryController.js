const { Category, Task, Event } = require('../models');
const { Op } = require('sequelize');

exports.getAllCategories = async (req, res, next) => {
  try {
    const where = req.userId
      ? { [Op.or]: [{ userId: null }, { userId: req.userId }] }
      : {};

    const categories = await Category.findAll({
      where,
      order: [['createdAt', 'ASC']],
    });
    res.json({ success: true, data: categories });
  } catch (error) {
    next(error);
  }
};

exports.getCategoryById = async (req, res, next) => {
  try {
    const category = await Category.findByPk(req.params.id, {
      include: [
        { model: Task, as: 'tasks' },
        { model: Event, as: 'events' },
      ],
    });
    if (!category) {
      return res.status(404).json({ success: false, message: 'Category not found' });
    }
    res.json({ success: true, data: category });
  } catch (error) {
    next(error);
  }
};

exports.createCategory = async (req, res, next) => {
  try {
    const { id, name, color, icon, description } = req.body;
    if (!name || !name.trim()) {
      return res.status(400).json({ success: false, message: 'Category name is required' });
    }

    const category = await Category.create({
      id: id || undefined,
      name: name.trim(),
      color: color || '#1769FF',
      icon: icon || 'Tag',
      description: description ? description.trim() : null,
      userId: req.userId || req.body.userId || null,
    });

    res.status(201).json({ success: true, data: category });
  } catch (error) {
    next(error);
  }
};

exports.updateCategory = async (req, res, next) => {
  try {
    const where = { id: req.params.id };
    if (req.userId) where.userId = req.userId;
    const category = await Category.findOne({ where });
    if (!category) {
      return res.status(404).json({ success: false, message: 'Category not found or unauthorized' });
    }

    const { name, color, icon, description } = req.body;
    await category.update({
      name: name !== undefined ? name.trim() : category.name,
      color: color !== undefined ? color : category.color,
      icon: icon !== undefined ? icon : category.icon,
      description: description !== undefined ? description : category.description,
    });

    res.json({ success: true, data: category });
  } catch (error) {
    next(error);
  }
};

exports.deleteCategory = async (req, res, next) => {
  try {
    const where = { id: req.params.id };
    if (req.userId) {
      where[Op.or] = [{ userId: req.userId }, { userId: null }];
    }
    const category = await Category.findOne({ where });
    if (!category) {
      return res.status(404).json({ success: false, message: 'Category not found or unauthorized' });
    }

    // Unlink any tasks and events linked to this category
    await Task.update({ categoryId: null }, { where: { categoryId: category.id } });
    await Event.update({ categoryId: null }, { where: { categoryId: category.id } });

    await category.destroy();
    res.json({ success: true, message: 'Category deleted successfully' });
  } catch (error) {
    next(error);
  }
};
