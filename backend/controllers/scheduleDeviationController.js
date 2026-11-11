const { ScheduleDeviation, Task, Category } = require('../models');
const { Op } = require('sequelize');

const cleanReasonCategory = (rc) => {
  if (!rc) return 'Distraction';
  if (typeof rc === 'object') {
    return rc.name || rc.label || rc.id || 'Distraction';
  }
  return String(rc);
};

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
    console.error('[getAllDeviations Error]:', error);
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
    let resolvedUserId = req.userId || req.body.userId || null;
    if (resolvedUserId && typeof resolvedUserId === 'string') {
      const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(resolvedUserId);
      if (!isUUID) resolvedUserId = null;
    } else if (typeof resolvedUserId !== 'string') {
      resolvedUserId = null;
    }

    let resolvedTaskId = null;
    if (taskId && typeof taskId === 'string' && taskId.trim() !== '' && taskId !== 'none' && taskId !== 'null' && taskId !== 'undefined') {
      resolvedTaskId = taskId.trim();
    }

    const resolvedReason = cleanReasonCategory(reasonCategory);
    const resolvedRootCause = typeof rootCause === 'object' && rootCause !== null ? JSON.stringify(rootCause) : (rootCause || '');
    const resolvedLessonLearned = typeof lessonLearned === 'object' && lessonLearned !== null ? JSON.stringify(lessonLearned) : (lessonLearned || '');

    const newDeviation = await ScheduleDeviation.create({
      id: deviationId,
      date,
      startTime,
      endTime,
      durationMinutes: calculatedDuration,
      plannedAction: String(plannedAction),
      actualAction: String(actualAction),
      reasonCategory: resolvedReason,
      rootCause: resolvedRootCause,
      lessonLearned: resolvedLessonLearned,
      deviationType: typeof deviationType === 'string' ? deviationType : 'unproductive',
      taskId: resolvedTaskId,
      userId: resolvedUserId,
    });

    res.status(201).json({
      success: true,
      message: 'Deviation log created successfully',
      data: newDeviation,
    });
  } catch (error) {
    console.error('[createDeviation Error]:', error);
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
      resolvedTaskId = (taskId && typeof taskId === 'string' && taskId.trim() !== '' && taskId !== 'none' && taskId !== 'null') ? taskId.trim() : null;
    }

    await deviation.update({
      ...(date !== undefined && { date }),
      ...(startTime !== undefined && { startTime }),
      ...(endTime !== undefined && { endTime }),
      ...(durationMinutes !== undefined && { durationMinutes: Number(durationMinutes) }),
      ...(plannedAction !== undefined && { plannedAction: String(plannedAction) }),
      ...(actualAction !== undefined && { actualAction: String(actualAction) }),
      ...(reasonCategory !== undefined && { reasonCategory: cleanReasonCategory(reasonCategory) }),
      ...(rootCause !== undefined && { rootCause: typeof rootCause === 'object' && rootCause !== null ? JSON.stringify(rootCause) : String(rootCause || '') }),
      ...(lessonLearned !== undefined && { lessonLearned: typeof lessonLearned === 'object' && lessonLearned !== null ? JSON.stringify(lessonLearned) : String(lessonLearned || '') }),
      ...(deviationType !== undefined && { deviationType: typeof deviationType === 'string' ? deviationType : 'unproductive' }),
      taskId: resolvedTaskId,
      ...(deviation.userId === null && req.userId ? { userId: req.userId } : {}),
    });

    res.json({
      success: true,
      message: 'Deviation log updated successfully',
      data: deviation,
    });
  } catch (error) {
    console.error('[updateDeviation Error]:', error);
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
