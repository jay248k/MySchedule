const { WorkSession, ActiveWorkSession, Task, Category } = require('../models');
const { Op } = require('sequelize');

// GET /api/work-sessions/active
exports.getActiveWorkSession = async (req, res, next) => {
  try {
    const userId = req.userId || null;
    let active = null;

    if (userId) {
      active = await ActiveWorkSession.findOne({ where: { userId } });
    }
    if (!active) {
      active = await ActiveWorkSession.findByPk('default') || await ActiveWorkSession.findOne({ where: { isRunning: true } });
    }

    res.json({
      success: true,
      data: active ? active.toJSON() : null,
    });
  } catch (error) {
    next(error);
  }
};

// POST /api/work-sessions/active
exports.setActiveWorkSession = async (req, res, next) => {
  try {
    const userId = req.userId || null;
    const sessionKey = userId ? String(userId) : 'default';

    const {
      isRunning,
      startTimestamp,
      startTime,
      date,
      taskId,
      taskTitle,
      baseAccumulatedSeconds,
      status,
      lastPausedTimestamp,
      lastPauseReason,
      lastPauseRemarks,
    } = req.body || {};

    let active = null;
    if (userId) {
      active = await ActiveWorkSession.findOne({ where: { userId } });
    }
    if (!active) {
      active = await ActiveWorkSession.findByPk(sessionKey) || await ActiveWorkSession.findByPk('default');
    }

    const payload = {
      id: sessionKey,
      userId,
      isRunning: Boolean(isRunning),
      startTimestamp: startTimestamp ? Number(startTimestamp) : null,
      startTime: startTime || null,
      date: date || null,
      taskId: taskId || null,
      taskTitle: taskTitle || null,
      baseAccumulatedSeconds: Number(baseAccumulatedSeconds) || 0,
      status: status || (isRunning ? 'running' : 'idle'),
      lastPausedTimestamp: lastPausedTimestamp ? Number(lastPausedTimestamp) : null,
      lastPauseReason: lastPauseReason || null,
      lastPauseRemarks: lastPauseRemarks || null,
    };

    if (active) {
      await active.update(payload);
    } else {
      active = await ActiveWorkSession.create(payload);
    }

    res.json({
      success: true,
      message: 'Active work session synchronized',
      data: active.toJSON(),
    });
  } catch (error) {
    next(error);
  }
};

// DELETE /api/work-sessions/active
exports.clearActiveWorkSession = async (req, res, next) => {
  try {
    const userId = req.userId || null;
    const clearPayload = {
      isRunning: false,
      status: 'idle',
      startTimestamp: null,
      startTime: null,
      baseAccumulatedSeconds: 0,
      lastPausedTimestamp: null,
    };

    if (userId) {
      await ActiveWorkSession.update(clearPayload, { where: { userId } });
    }
    await ActiveWorkSession.update(clearPayload, { where: { id: 'default' } });

    res.json({
      success: true,
      message: 'Active work session cleared',
      data: null,
    });
  } catch (error) {
    next(error);
  }
};

exports.getAllWorkSessions = async (req, res, next) => {
  try {
    const where = {};
    const { date } = req.query;

    if (date) {
      where.date = date;
    }
    if (req.userId) {
      where[Op.or] = [{ userId: req.userId }, { userId: null }];
    }

    const limit = req.query.limit || req.query.take ? parseInt(req.query.limit || req.query.take, 10) : undefined;
    const offset = req.query.offset || req.query.skip ? parseInt(req.query.offset || req.query.skip, 10) : undefined;

    const findOptions = {
      where,
      order: [['createdAt', 'DESC']],
      include: Task ? [{
        model: Task,
        as: 'task',
        attributes: ['id', 'title', 'categoryId', 'priority'],
        include: Category ? [{ model: Category, as: 'category', attributes: ['id', 'name', 'color'] }] : [],
      }] : [],
      ...(limit !== undefined && !isNaN(limit) && { limit }),
      ...(offset !== undefined && !isNaN(offset) && { offset }),
    };

    const sessions = await WorkSession.findAll(findOptions);
    const total = (limit !== undefined || offset !== undefined) ? await WorkSession.count({ where }) : sessions.length;

    res.json({
      success: true,
      count: sessions.length,
      total,
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
      include: Task ? [{
        model: Task,
        as: 'task',
        attributes: ['id', 'title', 'categoryId', 'priority'],
        include: Category ? [{ model: Category, as: 'category', attributes: ['id', 'name', 'color'] }] : [],
      }] : [],
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

    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid date format. Expected YYYY-MM-DD.',
      });
    }

    if (durationSeconds !== undefined && (isNaN(durationSeconds) || Number(durationSeconds) < 0)) {
      return res.status(400).json({
        success: false,
        message: 'durationSeconds must be a non-negative number',
      });
    }

    const sessionId = id || `session-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const userId = req.userId || req.body.userId || null;
    let resolvedTaskId = null;
    if (taskId && String(taskId).trim() !== '' && taskId !== 'none') {
      resolvedTaskId = String(taskId).trim();
    }

    const newSession = await WorkSession.create({
      id: sessionId,
      date,
      startTime,
      endTime: endTime || null,
      durationSeconds: Number(durationSeconds) || 0,
      stopReason: stopReason || 'Finished Work',
      notes: notes || '',
      taskId: resolvedTaskId,
      taskTitle: taskTitle || null,
      userId,
    });

    // Auto-clear active session when a work session is logged/completed
    try {
      const clearPayload = {
        isRunning: false,
        status: 'idle',
        startTimestamp: null,
        startTime: null,
        baseAccumulatedSeconds: 0,
        lastPausedTimestamp: null,
      };
      if (userId) {
        await ActiveWorkSession.update(clearPayload, { where: { userId } });
      }
      await ActiveWorkSession.update(clearPayload, { where: { id: 'default' } });
    } catch (clearErr) {
      // non-blocking
    }

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
    const where = { id };
    if (req.userId) {
      where[Op.or] = [{ userId: req.userId }, { userId: null }];
    }
    const session = await WorkSession.findOne({ where });

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

    let resolvedTaskId = session.taskId;
    if (taskId !== undefined) {
      resolvedTaskId = (taskId && String(taskId).trim() !== '' && taskId !== 'none') ? String(taskId).trim() : null;
    }

    await session.update({
      ...(date !== undefined && { date }),
      ...(startTime !== undefined && { startTime }),
      ...(endTime !== undefined && { endTime }),
      ...(durationSeconds !== undefined && { durationSeconds: Number(durationSeconds) }),
      ...(stopReason !== undefined && { stopReason }),
      ...(notes !== undefined && { notes }),
      ...(taskId !== undefined && { taskId: resolvedTaskId }),
      ...(taskTitle !== undefined && { taskTitle }),
      ...(session.userId === null && req.userId ? { userId: req.userId } : {}),
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
    const where = { id };
    if (req.userId) {
      where[Op.or] = [{ userId: req.userId }, { userId: null }];
    }
    const session = await WorkSession.findOne({ where });

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
