const { ScheduleDeviation, Task, Category } = require('../models');
const { Op } = require('sequelize');

exports.getAllDeviations = async (req, res, next) => {
  try {
    const where = {};
    const { date } = req.query;

    if (date) {
      where.date = date;
    }
    if (req.userId) {
      where[Op.or] = [{ userId: req.userId }, { userId: null }];
    }

    const deviations = await ScheduleDeviation.findAll({
      where,
      order: [['startTime', 'ASC']],
      include: Task ? [{
        model: Task,
        as: 'task',
        attributes: ['id', 'title', 'categoryId', 'priority'],
        include: Category ? [{ model: Category, as: 'category', attributes: ['id', 'name', 'color'] }] : [],
      }] : [],
    });

    res.json({
      success: true,
      count: deviations.length,
      data: deviations,
    });
  } catch (error) {
    next(error);
  }
};

exports.getDeviationById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const deviation = await ScheduleDeviation.findByPk(id, {
      include: Task ? [{
        model: Task,
        as: 'task',
        attributes: ['id', 'title', 'categoryId', 'priority'],
        include: Category ? [{ model: Category, as: 'category', attributes: ['id', 'name', 'color'] }] : [],
      }] : [],
    });

    if (!deviation) {
      return res.status(404).json({ success: false, message: 'Deviation log not found' });
    }

    res.json({ success: true, data: deviation });
  } catch (error) {
    next(error);
  }
};

exports.createDeviation = async (req, res, next) => {
  try {
    const {
      id,
      date,
      startTime,
      endTime,
      durationMinutes,
      plannedAction,
      actualAction,
      reasonCategory,
      rootCause,
      lessonLearned,
      deviationType,
      taskId,
    } = req.body;

    if (!date || !startTime || !endTime || !plannedAction || !actualAction) {
      return res.status(400).json({
        success: false,
        message: 'Date, timeslot (startTime, endTime), plannedAction, and actualAction are required',
      });
    }

    if (startTime >= endTime) {
      return res.status(400).json({
        success: false,
        message: 'Deviation end time must be after start time',
      });
    }

    // Auto-calculate duration in minutes if not provided
    let calculatedDuration = Number(durationMinutes) || 0;
    if (!calculatedDuration && startTime && endTime) {
      const [sh, sm] = startTime.split(':').map(Number);
      const [eh, em] = endTime.split(':').map(Number);
      const diff = (eh * 60 + em) - (sh * 60 + sm);
      calculatedDuration = diff > 0 ? diff : 60;
    }

    const deviationId = id || `dev-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const userId = req.userId || req.body.userId || null;
    let resolvedTaskId = null;
    if (taskId && String(taskId).trim() !== '' && taskId !== 'none') {
      resolvedTaskId = String(taskId).trim();
    }

    const newDeviation = await ScheduleDeviation.create({
      id: deviationId,
      date,
      startTime,
      endTime,
      durationMinutes: calculatedDuration,
      plannedAction,
      actualAction,
      reasonCategory: reasonCategory || 'Distraction',
      rootCause: rootCause || '',
      lessonLearned: lessonLearned || '',
      deviationType: deviationType || 'unproductive',
      taskId: resolvedTaskId,
      userId,
    });

    res.status(201).json({
      success: true,
      message: 'Deviation log created successfully',
      data: newDeviation,
    });
  } catch (error) {
    next(error);
  }
};

exports.updateDeviation = async (req, res, next) => {
  try {
    const { id } = req.params;
    const where = { id };
    if (req.userId) {
      where[Op.or] = [{ userId: req.userId }, { userId: null }];
    }
    const deviation = await ScheduleDeviation.findOne({ where });

    if (!deviation) {
      return res.status(404).json({ success: false, message: 'Deviation log not found' });
    }

    const {
      date,
      startTime,
      endTime,
      durationMinutes,
      plannedAction,
      actualAction,
      reasonCategory,
      rootCause,
      lessonLearned,
      deviationType,
      taskId,
    } = req.body;

    let resolvedTaskId = deviation.taskId;
    if (taskId !== undefined) {
      resolvedTaskId = (taskId && String(taskId).trim() !== '' && taskId !== 'none') ? String(taskId).trim() : null;
    }

    await deviation.update({
      ...(date !== undefined && { date }),
      ...(startTime !== undefined && { startTime }),
      ...(endTime !== undefined && { endTime }),
      ...(durationMinutes !== undefined && { durationMinutes: Number(durationMinutes) }),
      ...(plannedAction !== undefined && { plannedAction }),
      ...(actualAction !== undefined && { actualAction }),
      ...(reasonCategory !== undefined && { reasonCategory }),
      ...(rootCause !== undefined && { rootCause }),
      ...(lessonLearned !== undefined && { lessonLearned }),
      ...(deviationType !== undefined && { deviationType }),
      ...(taskId !== undefined && { taskId: resolvedTaskId }),
      ...(deviation.userId === null && req.userId ? { userId: req.userId } : {}),
    });

    res.json({
      success: true,
      message: 'Deviation log updated successfully',
      data: deviation,
    });
  } catch (error) {
    next(error);
  }
};

exports.deleteDeviation = async (req, res, next) => {
  try {
    const { id } = req.params;
    const where = { id };
    if (req.userId) {
      where[Op.or] = [{ userId: req.userId }, { userId: null }];
    }
    const deviation = await ScheduleDeviation.findOne({ where });

    if (!deviation) {
      return res.status(404).json({ success: false, message: 'Deviation log not found' });
    }

    await deviation.destroy();

    res.json({
      success: true,
      message: 'Deviation log deleted successfully',
      id,
    });
  } catch (error) {
    next(error);
  }
};
