const { Category, Task, Event } = require('../models');
const { Op } = require('sequelize');
const cacheManager = require('../utils/cacheManager');

exports.getAllCategories = async (req, res, next) => {
  try {
    const cacheKey = `categories_${req.userId || 'public'}`;
    const cached = cacheManager.get(cacheKey);
    if (cached) {
      return res.json({ success: true, data: cached, fromCache: true });
    }

    const where = req.userId
      ? { [Op.or]: [{ userId: null }, { userId: req.userId }] }
      : {};

    const categories = await Category.findAll({
      where,
      order: [['createdAt', 'ASC']],
    });

    cacheManager.set(cacheKey, categories, 120); // 2-min cache with instant invalidation
    res.json({ success: true, data: categories });
  } catch (error) {
    next(error);
  }
};

exports.getCategoryById = async (req, res, next) => {
  try {
    const category = await Category.findByPk(req.params.id, {
      include: [
        { model: Task, as: 'tasks', attributes: ['id', 'title', 'status', 'date'] },
        { model: Event, as: 'events', attributes: ['id', 'title', 'date'] },
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

    const trimmedName = name.trim();
    if (trimmedName.length > 50) {
      return res.status(400).json({ success: false, message: 'Category name cannot exceed 50 characters' });
    }

    // Check for duplicate category name for this user
    const duplicate = await Category.findOne({
      where: {
        name: trimmedName,
        ...(req.userId ? { userId: req.userId } : {}),
      },
    });
    if (duplicate) {
      return res.status(409).json({ success: false, message: `Category "${trimmedName}" already exists` });
    }

    const category = await Category.create({
      id: id || undefined,
      name: trimmedName,
      color: color || '#1769FF',
      icon: icon || 'Tag',
      description: description ? description.trim() : null,
      userId: req.userId || req.body.userId || null,
    });

    cacheManager.invalidateCategories(req.userId);
    res.status(201).json({ success: true, data: category });
  } catch (error) {
    next(error);
  }
};

exports.bulkCreateCategories = async (req, res, next) => {
  try {
    const rawCategories = Array.isArray(req.body)
      ? req.body
      : req.body.categories || [];

    if (!Array.isArray(rawCategories) || rawCategories.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No categories provided for bulk import',
      });
    }

    const validCategories = [];
    for (const item of rawCategories) {
      if (!item || !item.name || !item.name.trim()) continue;
      validCategories.push({
        id: item.id || undefined,
        name: item.name.trim(),
        color: item.color || '#1769FF',
        icon: item.icon || 'Tag',
        description: item.description ? item.description.trim() : null,
        userId: req.userId || item.userId || null,
      });
    }

    if (validCategories.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No valid category records found (name is required for each category)',
      });
    }

    const created = await Category.bulkCreate(validCategories, {
      returning: true,
    });

    cacheManager.invalidateCategories(req.userId);
    res.status(201).json({
      success: true,
      count: created.length,
      data: created,
    });
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
    let finalName = category.name;

    if (name !== undefined) {
      const trimmed = name.trim();
      if (!trimmed) {
        return res.status(400).json({ success: false, message: 'Category name cannot be empty' });
      }
      if (trimmed.length > 50) {
        return res.status(400).json({ success: false, message: 'Category name cannot exceed 50 characters' });
      }

      // Check for duplicate category name
      const duplicate = await Category.findOne({
        where: {
          name: trimmed,
          id: { [Op.ne]: category.id },
          ...(req.userId ? { userId: req.userId } : {}),
        },
      });
      if (duplicate) {
        return res.status(409).json({ success: false, message: `Category "${trimmed}" already exists` });
      }
      finalName = trimmed;
    }

    await category.update({
      name: finalName,
      color: color !== undefined ? color : category.color,
      icon: icon !== undefined ? icon : category.icon,
      description: description !== undefined ? description : category.description,
    });

    cacheManager.invalidateCategories(req.userId);
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
    cacheManager.invalidateCategories(req.userId);
    res.json({ success: true, message: 'Category deleted successfully' });
  } catch (error) {
    next(error);
  }
};
