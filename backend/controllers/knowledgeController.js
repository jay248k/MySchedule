const { KnowledgeItem } = require('../models');
const { Op } = require('sequelize');

exports.getKnowledgeItems = async (req, res, next) => {
  try {
    const where = {};
    if (req.userId) {
      where.userId = req.userId;
    }

    const { parentId, type, search } = req.query;

    if (parentId !== undefined) {
      where.parentId = parentId === 'root' || parentId === '' ? null : parentId;
    }
    if (type) {
      where.type = type;
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
    const item = await KnowledgeItem.findByPk(id);
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
    const { title, type, parentId, content, orderIndex, tags, icon, color } = req.body;
    if (!title || !title.trim()) {
      return res.status(400).json({ success: false, message: 'Title is required' });
    }

    const validTypes = ['folder', 'lesson', 'table'];
    const itemType = validTypes.includes(type) ? type : 'lesson';

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
      userId: req.userId || null,
    });

    res.status(201).json({
      success: true,
      message: `${itemType.charAt(0).toUpperCase() + itemType.slice(1)} created successfully`,
      data: newItem,
    });
  } catch (error) {
    next(error);
  }
};

exports.updateKnowledgeItem = async (req, res, next) => {
  try {
    const { id } = req.params;
    const item = await KnowledgeItem.findByPk(id);
    if (!item) {
      return res.status(404).json({ success: false, message: 'Item not found' });
    }

    const { title, parentId, content, orderIndex, tags, icon, color } = req.body;
    await item.update({
      ...(title !== undefined && { title: title.trim() }),
      ...(parentId !== undefined && { parentId: parentId || null }),
      ...(content !== undefined && { content: typeof content === 'object' ? JSON.stringify(content) : content }),
      ...(orderIndex !== undefined && { orderIndex: Number(orderIndex) }),
      ...(tags !== undefined && { tags }),
      ...(icon !== undefined && { icon }),
      ...(color !== undefined && { color }),
    });

    res.json({
      success: true,
      message: 'Item updated successfully',
      data: item,
    });
  } catch (error) {
    next(error);
  }
};

// Recursive delete helper for folders
const deleteItemAndChildren = async (itemId) => {
  const children = await KnowledgeItem.findAll({ where: { parentId: itemId } });
  for (const child of children) {
    await deleteItemAndChildren(child.id);
  }
  await KnowledgeItem.destroy({ where: { id: itemId } });
};

exports.deleteKnowledgeItem = async (req, res, next) => {
  try {
    const { id } = req.params;
    const item = await KnowledgeItem.findByPk(id);
    if (!item) {
      return res.status(404).json({ success: false, message: 'Item not found' });
    }

    await deleteItemAndChildren(id);

    res.json({
      success: true,
      message: 'Item and its contents deleted successfully',
      id,
    });
  } catch (error) {
    next(error);
  }
};

