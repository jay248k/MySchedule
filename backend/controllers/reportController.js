const { DailyReport } = require('../models');
const { Op } = require('sequelize');
const cacheManager = require('../utils/cacheManager');

exports.getAllReports = async (req, res, next) => {
  try {
    const cacheKey = `reports_${req.userId || 'public'}`;
    const cached = cacheManager.get(cacheKey);
    if (cached) {
      return res.json({ success: true, count: cached.length, data: cached, fromCache: true });
    }

    const where = {};
    if (req.userId) {
      where[Op.or] = [{ userId: req.userId }, { userId: null }];
    }

    const limit = req.query.limit || req.query.take ? parseInt(req.query.limit || req.query.take, 10) : undefined;
    const offset = req.query.offset || req.query.skip ? parseInt(req.query.offset || req.query.skip, 10) : undefined;

    const findOptions = {
      where,
      order: [['date', 'DESC']],
      ...(limit !== undefined && !isNaN(limit) && { limit }),
      ...(offset !== undefined && !isNaN(offset) && { offset }),
    };

    const reports = await DailyReport.findAll(findOptions);
    const total = (limit !== undefined || offset !== undefined) ? await DailyReport.count({ where }) : reports.length;

    if (!limit && !offset) {
      cacheManager.set(cacheKey, reports, 60);
    }
    res.json({ success: true, count: reports.length, total, data: reports });
  } catch (error) {
    next(error);
  }
};

exports.getReportByDate = async (req, res, next) => {
  try {
    const { date } = req.params;
    const where = { date };
    if (req.userId) {
      where[Op.or] = [{ userId: req.userId }, { userId: null }];
    }

    const report = await DailyReport.findOne({ where });
    if (!report) {
      return res.status(404).json({ success: false, message: 'Report not found for this date' });
    }
    res.json({ success: true, data: report });
  } catch (error) {
    next(error);
  }
};

exports.saveReport = async (req, res, next) => {
  try {
    const {
      date,
      title,
      accomplishments,
      highlights,
      blockers,
      tomorrowPlan,
      hoursLogged,
      rating,
      mood,
      tasksCompletedCount,
      tasksTotalCount,
    } = req.body;

    if (!date) {
      return res.status(400).json({ success: false, message: 'Report date is required' });
    }
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return res.status(400).json({ success: false, message: 'Report date must be in YYYY-MM-DD format' });
    }
    if (hoursLogged !== undefined) {
      const h = Number(hoursLogged);
      if (isNaN(h) || h < 0 || h > 24) {
        return res.status(400).json({ success: false, message: 'Hours logged must be between 0 and 24 hours' });
      }
    }
    if (rating !== undefined) {
      const r = Number(rating);
      if (isNaN(r) || r < 1 || r > 5) {
        return res.status(400).json({ success: false, message: 'Rating must be a score between 1 and 5' });
      }
    }

    const reportTitle = title || `Daily Work Report - ${date}`;
    const userId = req.userId || req.body.userId || null;
    const reportId = userId ? `report-${userId}-${date}` : `report-${date}`;

    const [report] = await DailyReport.upsert({
      id: reportId,
      date,
      title: reportTitle,
      accomplishments: accomplishments || null,
      highlights: highlights || null,
      blockers: blockers || null,
      tomorrowPlan: tomorrowPlan || null,
      hoursLogged: hoursLogged !== undefined ? Number(hoursLogged) : 0,
      rating: rating !== undefined ? Number(rating) : 5,
      mood: mood || 'productive',
      tasksCompletedCount: tasksCompletedCount || 0,
      tasksTotalCount: tasksTotalCount || 0,
      userId,
      submittedAt: new Date(),
    });

    cacheManager.invalidateReports(userId);
    res.json({ success: true, data: report });
  } catch (error) {
    next(error);
  }
};

exports.deleteReport = async (req, res, next) => {
  try {
    const { date } = req.params;
    const where = { date };
    if (req.userId) where.userId = req.userId;

    const report = await DailyReport.findOne({ where });
    if (!report) {
      return res.status(404).json({ success: false, message: 'Report not found' });
    }
    await report.destroy();
    cacheManager.invalidateReports(req.userId);
    res.json({ success: true, message: 'Report deleted successfully' });
  } catch (error) {
    next(error);
  }
};
