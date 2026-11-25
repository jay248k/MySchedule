const { Op } = require('sequelize');
const {
  Event,
  KnowledgeItem,
  Thought,
  DailyReport,
  ScheduleDeviation,
  WorkRequest,
} = require('../models');

/**
 * Build optional user filter matching existing controller conventions.
 */
function buildUserWhere(req, base = {}) {
  if (req.userId && process.env.ISOLATE_USER_KNOWLEDGE === 'true') {
    return {
      ...base,
      [Op.or]: [{ userId: req.userId }, { userId: null }],
    };
  }
  return base;
}

/**
 * GET /api/dashboard/summary?date=YYYY-MM-DD
 * Aggregated website-wide summary for the Executive Bento Dashboard.
 */
exports.getDashboardSummary = async (req, res, next) => {
  try {
    const now = new Date();
    const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(
      now.getDate()
    ).padStart(2, '0')}`;
    const activeDate = req.query.date || todayStr;

    const sevenDaysAgo = new Date(now);
    sevenDaysAgo.setDate(now.getDate() - 7);
    const sevenDaysAgoStr = `${sevenDaysAgo.getFullYear()}-${String(
      sevenDaysAgo.getMonth() + 1
    ).padStart(2, '0')}-${String(sevenDaysAgo.getDate()).padStart(2, '0')}`;

    const [
      upcomingEvents,
      todayEventsCount,
      folderCount,
      lessonCount,
      recentLessons,
      latestThoughts,
      totalThoughts,
      todayReport,
      totalReports,
      recentDeviationsCount,
      todayDeviationsCount,
      allRequests,
    ] = await Promise.all([
      Event.findAll({
        where: buildUserWhere(req, { date: { [Op.gte]: activeDate } }),
        order: [['date', 'ASC']],
        limit: 4,
      }).catch(() => []),
      Event.count({
        where: buildUserWhere(req, { date: activeDate }),
      }).catch(() => 0),
      KnowledgeItem.count({
        where: buildUserWhere(req, { type: 'folder' }),
      }).catch(() => 0),
      KnowledgeItem.count({
        where: buildUserWhere(req, { type: 'lesson' }),
      }).catch(() => 0),
      KnowledgeItem.findAll({
        where: buildUserWhere(req, { type: 'lesson' }),
        order: [['updatedAt', 'DESC']],
        limit: 3,
        attributes: ['id', 'title', 'updatedAt'],
      }).catch(() => []),
      Thought.findAll({
        where: buildUserWhere(req),
        order: [['createdAt', 'DESC']],
        limit: 5,
      }).catch(() => []),
      Thought.count({
        where: buildUserWhere(req),
      }).catch(() => 0),
      DailyReport.findOne({
        where: buildUserWhere(req, { date: activeDate }),
      }).catch(() => null),
      DailyReport.count({
        where: buildUserWhere(req),
      }).catch(() => 0),
      ScheduleDeviation.count({
        where: buildUserWhere(req, { date: { [Op.gte]: sevenDaysAgoStr } }),
      }).catch(() => 0),
      ScheduleDeviation.count({
        where: buildUserWhere(req, { date: activeDate }),
      }).catch(() => 0),
      WorkRequest.findAll({
        where: buildUserWhere(req),
        order: [['createdAt', 'DESC']],
        limit: 20,
        attributes: ['id', 'title', 'status', 'date'],
      }).catch(() => []),
    ]);

    // Pick a deterministic thought of the day based on date
    let featuredThought = null;
    if (latestThoughts.length > 0) {
      const dayNum = parseInt(activeDate.replace(/-/g, ''), 10) || 0;
      featuredThought = latestThoughts[dayNum % latestThoughts.length];
    }

    const requestStats = {
      total: allRequests.length,
      pending: allRequests.filter((r) => r.status === 'pending').length,
      rescheduled: allRequests.filter((r) => r.status === 'rescheduled').length,
      completed: allRequests.filter((r) => r.status === 'completed').length,
    };

    res.json({
      success: true,
      data: {
        date: activeDate,
        events: {
          todayCount: todayEventsCount,
          upcoming: upcomingEvents,
        },
        knowledge: {
          folders: folderCount,
          lessons: lessonCount,
          recentLessons,
        },
        thoughts: {
          total: totalThoughts,
          featured: featuredThought,
        },
        dailyReport: {
          submittedToday: Boolean(todayReport),
          totalSubmitted: totalReports,
          report: todayReport
            ? { id: todayReport.id, title: todayReport.title, hoursLogged: todayReport.hoursLogged }
            : null,
        },
        deviations: {
          today: todayDeviationsCount,
          last7Days: recentDeviationsCount,
        },
        requests: requestStats,
      },
    });
  } catch (err) {
    next(err);
  }
};

