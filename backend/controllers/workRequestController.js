const { WorkRequest, Task } = require('../models');

exports.getAllRequests = async (req, res, next) => {
  try {
    const where = {};
    const { status, date } = req.query;

    if (status) {
      where.status = status;
    }
    if (date) {
      where.date = date;
    }
    if (req.userId) {
      where.userId = req.userId;
    }

    const requests = await WorkRequest.findAll({
      where,
      order: [['createdAt', 'DESC']],
      include: Task ? [{ model: Task, as: 'task', attributes: ['id', 'title', 'category', 'status'] }] : [],
    });

    res.json({
      success: true,
      count: requests.length,
      data: requests,
    });
  } catch (error) {
    next(error);
  }
};

exports.getRequestById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const request = await WorkRequest.findByPk(id, {
      include: Task ? [{ model: Task, as: 'task' }] : [],
    });

    if (!request) {
      return res.status(404).json({ success: false, message: 'Work request not found' });
    }

    res.json({ success: true, data: request });
  } catch (error) {
    next(error);
  }
};

exports.createRequest = async (req, res, next) => {
  try {
    const {
      id,
      title,
      date,
      startTime,
      endTime,
      reason,
      taskId,
    } = req.body;

    if (!title || !date || !reason) {
      return res.status(400).json({
        success: false,
        message: 'Title, date, and reason are required to submit a request',
      });
    }

    const requestId = id || `req-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const userId = req.userId || req.body.userId || null;

    const newRequest = await WorkRequest.create({
      id: requestId,
      title,
      date,
      startTime: startTime || null,
      endTime: endTime || null,
      reason,
      status: 'pending',
      taskId: taskId || null,
      userId,
    });

    res.status(201).json({
      success: true,
      message: 'Work request submitted successfully',
      data: newRequest,
    });
  } catch (error) {
    next(error);
  }
};

exports.completeRequest = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { actionRemarks } = req.body;

    const request = await WorkRequest.findByPk(id);
    if (!request) {
      return res.status(404).json({ success: false, message: 'Work request not found' });
    }

    await request.update({
      status: 'completed',
      actionRemarks: actionRemarks || 'Marked completed by user',
    });

    // If linked to a task, mark task as completed
    if (request.taskId && Task) {
      await Task.update({ status: 'completed' }, { where: { id: request.taskId } }).catch(() => {});
    }

    res.json({
      success: true,
      message: 'Request marked as completed',
      data: request,
    });
  } catch (error) {
    next(error);
  }
};

exports.rescheduleRequest = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { rescheduledDate, rescheduledStartTime, rescheduledEndTime, actionRemarks } = req.body;

    if (!rescheduledDate) {
      return res.status(400).json({ success: false, message: 'Rescheduled date is required' });
    }

    const request = await WorkRequest.findByPk(id);
    if (!request) {
      return res.status(404).json({ success: false, message: 'Work request not found' });
    }

    await request.update({
      status: 'rescheduled',
      rescheduledDate,
      rescheduledStartTime: rescheduledStartTime || null,
      rescheduledEndTime: rescheduledEndTime || null,
      actionRemarks: actionRemarks || `Rescheduled to ${rescheduledDate}`,
    });

    // If linked to a task, update task's date and timeslot
    if (request.taskId && Task) {
      await Task.update(
        {
          date: rescheduledDate,
          ...(rescheduledStartTime && { startTime: rescheduledStartTime }),
          ...(rescheduledEndTime && { endTime: rescheduledEndTime }),
          status: 'pending',
        },
        { where: { id: request.taskId } }
      ).catch(() => {});
    }

    res.json({
      success: true,
      message: 'Request rescheduled successfully',
      data: request,
    });
  } catch (error) {
    next(error);
  }
};

exports.cancelRequest = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { actionRemarks } = req.body;

    if (!actionRemarks || !actionRemarks.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Cancellation remarks are mandatory when canceling a request',
      });
    }

    const request = await WorkRequest.findByPk(id);
    if (!request) {
      return res.status(404).json({ success: false, message: 'Work request not found' });
    }

    await request.update({
      status: 'cancelled',
      actionRemarks: actionRemarks.trim(),
    });

    // If linked to a task, update task status or description
    if (request.taskId && Task) {
      await Task.update(
        { status: 'cancelled' },
        { where: { id: request.taskId } }
      ).catch(() => {});
    }

    res.json({
      success: true,
      message: 'Request cancelled with remarks recorded',
      data: request,
    });
  } catch (error) {
    next(error);
  }
};

exports.deleteRequest = async (req, res, next) => {
  try {
    const { id } = req.params;
    const request = await WorkRequest.findByPk(id);

    if (!request) {
      return res.status(404).json({ success: false, message: 'Work request not found' });
    }

    await request.destroy();

    res.json({
      success: true,
      message: 'Work request deleted successfully',
      id,
    });
  } catch (error) {
    next(error);
  }
};
