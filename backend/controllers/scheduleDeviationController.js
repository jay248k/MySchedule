const { ScheduleDeviation, Task } = require('../models');

exports.getAllDeviations = async (req, res, next) => {
  try {
    const where = {};
    const { date } = req.query;

    if (date) {
      where.date = date;
    }
    if (req.userId) {
      where.userId = req.userId;
    }

    const deviations = await ScheduleDeviation.findAll({
      where,
      order: [['startTime', 'ASC']],
      include: Task ? [{ model: Task, as: 'task', attributes: ['id', 'title', 'category', 'priority'] }] : [],
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
      include: Task ? [{ model: Task, as: 'task', attributes: ['id', 'title', 'category'] }] : [],
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
      taskId: taskId || null,
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
    const deviation = await ScheduleDeviation.findByPk(id);

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
      ...(taskId !== undefined && { taskId }),
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
    const deviation = await ScheduleDeviation.findByPk(id);

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
