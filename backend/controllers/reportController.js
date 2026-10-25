const { DailyReport } = require('../models');

exports.getAllReports = async (req, res, next) => {
  try {
    const reports = await DailyReport.findAll({
      order: [['date', 'DESC']],
    });
    res.json({ success: true, count: reports.length, data: reports });
  } catch (error) {
    next(error);
  }
};

exports.getReportByDate = async (req, res, next) => {
  try {
    const { date } = req.params;
    const report = await DailyReport.findOne({ where: { date } });
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

    const [report] = await DailyReport.upsert({
      id: `report-${date}`,
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
      submittedAt: new Date(),
    });

    res.json({ success: true, data: report });
  } catch (error) {
    next(error);
  }
};

exports.deleteReport = async (req, res, next) => {
  try {
    const { date } = req.params;
    const report = await DailyReport.findOne({ where: { date } });
    if (!report) {
      return res.status(404).json({ success: false, message: 'Report not found' });
    }
    await report.destroy();
    res.json({ success: true, message: 'Report deleted successfully' });
  } catch (error) {
    next(error);
  }
};
