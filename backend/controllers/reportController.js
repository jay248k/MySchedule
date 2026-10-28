const { DailyReport } = require('../models');
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
      where.userId = req.userId;
    }

    const reports = await DailyReport.findAll({
      where,
      order: [['date', 'DESC']],
    });

    cacheManager.set(cacheKey, reports, 60);
    res.json({ success: true, count: reports.length, data: reports });
  } catch (error) {
    next(error);
  }
};

exports.getReportByDate = async (req, res, next) => {
  try {
    const { date } = req.params;
    const where = { date };
    if (req.userId) where.userId = req.userId;

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
