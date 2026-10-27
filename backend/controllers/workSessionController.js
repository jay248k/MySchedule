const { WorkSession, Task } = require('../models');

exports.getAllWorkSessions = async (req, res, next) => {
  try {
    const where = {};
    const { date } = req.query;

    if (date) {
      where.date = date;
    }
    if (req.userId) {
      where.userId = req.userId;
    }

    const sessions = await WorkSession.findAll({
      where,
      order: [['createdAt', 'DESC']],
      include: Task ? [{ model: Task, as: 'task', attributes: ['id', 'title', 'category', 'priority'] }] : [],
    });

    res.json({
      success: true,
      count: sessions.length,
      data: sessions,
    });
  } catch (error) {
    next(error);
  }
};

exports.getWorkSessionById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const session = await WorkSession.findByPk(id, {
      include: Task ? [{ model: Task, as: 'task', attributes: ['id', 'title', 'category'] }] : [],
    });

    if (!session) {
      return res.status(404).json({ success: false, message: 'Work session not found' });
    }

    res.json({ success: true, data: session });
  } catch (error) {
    next(error);
  }
};

exports.createWorkSession = async (req, res, next) => {
  try {
    const {
      id,
      date,
      startTime,
      endTime,
      durationSeconds,
      stopReason,
      notes,
      taskId,
      taskTitle,
    } = req.body;

    if (!date || !startTime) {
      return res.status(400).json({
        success: false,
        message: 'Date and startTime are required to log a work session',
      });
    }

    const sessionId = id || `session-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const userId = req.userId || req.body.userId || null;

    const newSession = await WorkSession.create({
      id: sessionId,
      date,
      startTime,
      endTime: endTime || null,
      durationSeconds: Number(durationSeconds) || 0,
      stopReason: stopReason || 'Finished Work',
      notes: notes || '',
      taskId: taskId || null,
      taskTitle: taskTitle || null,
      userId,
    });

    res.status(201).json({
      success: true,
      message: 'Work session recorded successfully',
      data: newSession,
    });
  } catch (error) {
    next(error);
  }
};

exports.updateWorkSession = async (req, res, next) => {
  try {
    const { id } = req.params;
    const session = await WorkSession.findByPk(id);

    if (!session) {
      return res.status(404).json({ success: false, message: 'Work session not found' });
    }

    const {
      date,
      startTime,
      endTime,
      durationSeconds,
      stopReason,
      notes,
      taskId,
      taskTitle,
    } = req.body;

    await session.update({
      ...(date !== undefined && { date }),
      ...(startTime !== undefined && { startTime }),
      ...(endTime !== undefined && { endTime }),
      ...(durationSeconds !== undefined && { durationSeconds: Number(durationSeconds) }),
      ...(stopReason !== undefined && { stopReason }),
      ...(notes !== undefined && { notes }),
      ...(taskId !== undefined && { taskId }),
      ...(taskTitle !== undefined && { taskTitle }),
    });

    res.json({
      success: true,
      message: 'Work session updated successfully',
      data: session,
    });
  } catch (error) {
    next(error);
  }
};

exports.deleteWorkSession = async (req, res, next) => {
  try {
    const { id } = req.params;
    const session = await WorkSession.findByPk(id);

    if (!session) {
      return res.status(404).json({ success: false, message: 'Work session not found' });
    }

    await session.destroy();

    res.json({
      success: true,
      message: 'Work session deleted successfully',
      id,
    });
  } catch (error) {
    next(error);
  }
};
