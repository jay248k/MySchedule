const { Op, literal } = require('sequelize');
const {
  Task,
  Category,
  Goal,
  WorkSession,
  ScheduleDeviation,
  DailyReport,
  ScreenTimeLog,
  ScreenTimeLimit,
} = require('../models');
const cacheManager = require('../utils/cacheManager');

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

/**
 * Build a user-scoped where clause mirroring existing controller conventions.
 */
function buildUserWhere(req, base = {}) {
  if (req.userId && process.env.ISOLATE_USER_KNOWLEDGE === 'true') {
    return { ...base, [Op.or]: [{ userId: req.userId }, { userId: null }] };
  }
  return base;
}

function isDateStr(value) {
  return typeof value === 'string' && DATE_PATTERN.test(value);
}

/**
 * Parse date range from query. Defaults to last 30 days ending today.
 */
function resolveRange(req) {
  const now = new Date();
  const endStr = isDateStr(req.query.endDate) ? req.query.endDate : now.toISOString().split('T')[0];

  const endDate = new Date(endStr + 'T00:00:00Z');
  let startDate = new Date(endDate);
  let rangeDays = 30;
  if (isDateStr(req.query.startDate)) {
    startDate = new Date(req.query.startDate + 'T00:00:00Z');
    rangeDays = Math.max(1, Math.ceil((endDate - startDate) / 86400000) + 1);
  } else if (req.query.range === '7days') {
    startDate.setDate(endDate.getDate() - 6);
    rangeDays = 7;
  } else if (req.query.range === 'month') {
    startDate.setDate(endDate.getDate() - 29);
    rangeDays = 30;
  } else if (req.query.range === 'year') {
    startDate.setDate(endDate.getDate() - 364);
    rangeDays = 365;
  } else {
    startDate.setDate(endDate.getDate() - 29);
    rangeDays = 30;
  }

  const pad = (n) => String(n).padStart(2, '0');
  const fmt = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  return { startDate, endDate, startStr: fmt(startDate), endStr, rangeDays };
}

/**
 * GET /api/dashboard/analytics/charts
 * Single fast aggregated endpoint returning every chart series under 1 second.
 */
exports.getCharts = async (req, res, next) => {
  try {
    const userId = req.userId || null;
    const range = resolveRange(req);
    const workRange = ['week', 'month', 'year'].includes(req.query.workRange)
      ? req.query.workRange
      : 'month';
    const cacheKey = `charts_v3_${userId || 'guest'}_${range.startStr}_${range.endStr}_${workRange}`;

    const cached = cacheManager.get(cacheKey);
    if (cached) {
      return res.json({ success: true, cached: true, data: cached });
    }

    const userWhere = buildUserWhere(req, {});
    const userWhereDate = buildUserWhere(req, {
      date: { [Op.between]: [range.startStr, range.endStr] },
    });

    // Resolve Work Tracker date range (week = 7 days, month = 30 days, year = last 7 years)
    const pad2 = (n) => String(n).padStart(2, '0');
    const fmtDate = (dt) => `${dt.getFullYear()}-${pad2(dt.getMonth() + 1)}-${pad2(dt.getDate())}`;
    const endDateObj = new Date(range.endDate);
    let workStartStr = range.startStr;
    let workEndStr = range.endStr;
    if (workRange === 'week') {
      const ws = new Date(endDateObj);
      ws.setDate(endDateObj.getDate() - 6);
      workStartStr = fmtDate(ws);
    } else if (workRange === 'month') {
      const ws = new Date(endDateObj);
      ws.setDate(endDateObj.getDate() - 29);
      workStartStr = fmtDate(ws);
    } else if (workRange === 'year') {
      const currentYear = endDateObj.getFullYear();
      workStartStr = `${currentYear - 6}-01-01`;
      workEndStr = `${currentYear}-12-31`;
    }

    const userWhereWorkDate = buildUserWhere(req, {
      date: { [Op.between]: [workStartStr, workEndStr] },
    });

    const [tasksRows, goalsRows, sessionsRows, deviationsRows, screenTimeRows] =
      await Promise.all([
        Task.findAll({
          where: userWhere,
          attributes: ['id', 'categoryId', 'status', 'date'],
          raw: true,
        }).catch(() => []),

        Goal.findAll({
          where: userWhere,
          attributes: ['id', 'title', 'progress', 'status', 'targetDate'],
          raw: true,
        }).catch(() => []),

        WorkSession.findAll({
          where: userWhereWorkDate,
          attributes: ['id', 'date', 'durationSeconds'],
          raw: true,
        }).catch((err) => {
          console.error('Analytics WorkSession query failed:', err.message);
          return [];
        }),

        ScheduleDeviation.findAll({
          where: userWhereDate,
          attributes: ['id', 'date', 'deviationType', 'durationMinutes'],
          raw: true,
        }).catch(() => []),

        ScreenTimeLog.findAll({
          where: buildUserWhere(req, {
            date: { [Op.between]: [range.startStr, range.endStr] },
          }),
          attributes: ['id', 'date', 'appName', 'spentMinutes', 'isExceeded', 'exceededMinutes'],
          raw: true,
        }).catch(() => []),
      ]);

    // Category distribution for tasks (pie chart)
    const categoryMap = new Map();
    const categoryIds = new Set((tasksRows || []).map((t) => t.categoryId).filter(Boolean));
    if (categoryIds.size) {
      const categories = await Category.findAll({
        where: { id: { [Op.in]: [...categoryIds] }, ...(userId ? { userId } : {}) },
        attributes: ['id', 'name', 'color'],
        raw: true,
      }).catch(() => []);
      categories.forEach((c) => categoryMap.set(c.id, c));
    }

    const categoryDistribution = [];
    const taskCountByCategory = {};
    const taskCountByStatus = { pending: 0, inProgress: 0, completed: 0, overdue: 0 };
    const tasksPerDay = new Map();

    (tasksRows || []).forEach((t) => {
      const catId = t.categoryId || null;
      taskCountByCategory[catId] = (taskCountByCategory[catId] || 0) + 1;

      const statusKey =
        t.status === 'completed'
          ? 'completed'
          : t.status === 'pending'
            ? 'pending'
            : t.status === 'in-progress' || t.status === 'in_progress'
              ? 'inProgress'
              : 'overdue';
      taskCountByStatus[statusKey] += 1;

      if (isDateStr(t.date)) {
        tasksPerDay.set(t.date, (tasksPerDay.get(t.date) || 0) + 1);
      }

      if (catId && categoryMap.has(catId)) {
        const c = categoryMap.get(catId);
        const existing = categoryDistribution.find((item) => item.categoryId === catId);
        if (existing) existing.taskCount += 1;
        else categoryDistribution.push({ categoryId: catId, category: c.name, color: c.color, taskCount: 1 });
      } else if (catId) {
        categoryDistribution.push({ categoryId: catId, category: catId, color: '#94A3B8', taskCount: 1 });
      }
    });

    // Tasks per day series for bar chart
    const tasksByDaySeries = [];
    let d = new Date(range.startDate);
    const endDateInclusive = new Date(range.endDate);
    while (d <= endDateInclusive) {
      const ds = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      tasksByDaySeries.push({ date: ds, label: d.toLocaleDateString('en-US', { weekday: 'short' }), count: tasksPerDay.get(ds) || 0 });
      d.setDate(d.getDate() + 1);
    }

    // Goals progression
    const goalsProgress = (goalsRows || []).map((g) => ({
      id: g.id,
      title: g.title,
      progress: Number(g.progress) || 0,
      status: g.status || 'in-progress',
      targetDate: g.targetDate,
    }));
    const avgGoalProgress =
      goalsProgress.length > 0
        ? Math.round(goalsProgress.reduce((sum, g) => sum + g.progress, 0) / goalsProgress.length)
        : 0;
    const completedGoals = goalsProgress.filter((g) => g.progress >= 100 || g.status === 'completed').length;
    const pendingGoals = goalsProgress.length - completedGoals;

    // Work sessions per day/year + total time (capped at realistic 24h max per day)
    const MAX_DAY_SECONDS = 24 * 3600;
    const sessionsPerDay = new Map();
    (sessionsRows || []).forEach((s) => {
      const secs = Math.max(0, Number(s.durationSeconds) || 0);
      if (isDateStr(s.date)) {
        const prev = sessionsPerDay.get(s.date) || 0;
        sessionsPerDay.set(s.date, Math.min(MAX_DAY_SECONDS, prev + secs));
      }
    });

    let totalWorkSeconds = 0;
    for (const daySecs of sessionsPerDay.values()) {
      totalWorkSeconds += daySecs;
    }

    const workTimeSeries = [];
    if (workRange === 'year') {
      const endYear = endDateObj.getFullYear();
      const startYear = endYear - 6;
      const sessionsPerYear = new Map();
      for (const [dateKey, daySecs] of sessionsPerDay.entries()) {
        const yr = parseInt(dateKey.slice(0, 4), 10);
        if (!Number.isNaN(yr)) {
          sessionsPerYear.set(yr, (sessionsPerYear.get(yr) || 0) + daySecs);
        }
      }
      for (let yr = startYear; yr <= endYear; yr++) {
        const secs = sessionsPerYear.get(yr) || 0;
        workTimeSeries.push({
          date: String(yr),
          label: String(yr),
          isYear: true,
          seconds: secs,
          hours: Number((secs / 3600).toFixed(2)),
        });
      }
    } else {
      const wsStart = new Date(`${workStartStr}T00:00:00Z`);
      const wsEnd = new Date(`${workEndStr}T00:00:00Z`);
      d = new Date(wsStart);
      while (d <= wsEnd) {
        const ds = `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}-${String(d.getUTCDate()).padStart(2, '0')}`;
        const secs = sessionsPerDay.get(ds) || 0;
        workTimeSeries.push({
          date: ds,
          label: d.toLocaleDateString('en-US', { weekday: 'short', timeZone: 'UTC' }),
          seconds: secs,
          hours: Number((secs / 3600).toFixed(2)),
        });
        d.setUTCDate(d.getUTCDate() + 1);
      }
    }

    // Deviations per day
    const deviationsPerDay = new Map();
    let totalDeviations = 0;
    (deviationsRows || []).forEach((dev) => {
      totalDeviations += 1;
      if (isDateStr(dev.date)) {
        deviationsPerDay.set(dev.date, (deviationsPerDay.get(dev.date) || 0) + 1);
      }
    });

    const deviationsSeries = [];
    d = new Date(range.startDate);
    while (d <= endDateInclusive) {
      const ds = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      deviationsSeries.push({ date: ds, label: d.toLocaleDateString('en-US', { weekday: 'short' }), count: deviationsPerDay.get(ds) || 0 });
      d.setDate(d.getDate() + 1);
    }

    // Screen time per day + per app
    const screenTimePerDay = new Map();
    const screenTimeByApp = new Map();
    let totalScreenMinutes = 0;
    let exceededCount = 0;
    let totalExceededMinutes = 0;

    (screenTimeRows || []).forEach((log) => {
      const mins = Number(log.spentMinutes) || 0;
      totalScreenMinutes += mins;
      const exMins = Number(log.exceededMinutes) || 0;
      totalExceededMinutes += exMins;
      if (log.isExceeded) exceededCount += 1;

      if (isDateStr(log.date)) {
        screenTimePerDay.set(log.date, (screenTimePerDay.get(log.date) || 0) + mins);
      }
      const key = log.appName || 'Unknown';
      const existing = screenTimeByApp.get(key) || { appName: key, totalMinutes: 0, daysLogged: 0, exceededCount: 0, exceededMinutes: 0 };
      existing.totalMinutes += mins;
      if (log.isExceeded) {
        existing.exceededCount += 1;
        existing.exceededMinutes += exMins;
      }
      if (!existing._days) existing._days = new Set();
      existing._days.add(log.date);
      existing.daysLogged = existing._days.size;
      screenTimeByApp.set(key, existing);
    });

    // Clean up temporary _days sets
    for (const app of screenTimeByApp.values()) {
      delete app._days;
    }

    const screenTimeByDaySeries = [];
    d = new Date(range.startDate);
    while (d <= endDateInclusive) {
      const ds = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      const mins = screenTimePerDay.get(ds) || 0;
      screenTimeByDaySeries.push({ date: ds, label: d.toLocaleDateString('en-US', { weekday: 'short' }), minutes: mins, hours: Number((mins / 60).toFixed(2)) });
      d.setDate(d.getDate() + 1);
    }

    const topApps = Array.from(screenTimeByApp.values())
      .sort((a, b) => b.totalMinutes - a.totalMinutes)
      .slice(0, 10);

    const screenTimeSummary = {
      totalMinutes: totalScreenMinutes,
      totalHours: Number((totalScreenMinutes / 60).toFixed(2)),
      daysLogged: screenTimePerDay.size,
      exceededCount,
      totalExceededMinutes,
      topApps,
    };

    const data = {
      range: { startDate: range.startStr, endDate: range.endStr, rangeDays: range.rangeDays },
      taskSummary: {
        totalTasks: tasksRows ? tasksRows.length : 0,
        byStatus: taskCountByStatus,
        byCategory: categoryDistribution,
      },
      tasksByDay: tasksByDaySeries,
      goals: {
        total: goalsProgress.length,
        completed: completedGoals,
        pending: pendingGoals,
        averageProgress: avgGoalProgress,
        list: goalsProgress,
      },
      workSessions: {
        totalSeconds: totalWorkSeconds,
        totalHours: Number((totalWorkSeconds / 3600).toFixed(2)),
        sessionsCount: sessionsRows ? sessionsRows.length : 0,
        byDay: workTimeSeries,
      },
      deviations: {
        total: totalDeviations,
        byDay: deviationsSeries,
      },
      screenTime: screenTimeSummary,
      screenTimeByDay: screenTimeByDaySeries,
    };

    cacheManager.set(cacheKey, data, 45);
    res.json({ success: true, cached: false, data });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/dashboard/analytics/screen-time/:date?
 */
exports.getScreenTimeReport = async (req, res, next) => {
  try {
    const userId = req.userId || null;
    const range = resolveRange(req);
    const userWhere = buildUserWhere(req, {
      date: { [Op.between]: [range.startStr, range.endStr] },
    });

    const logs = await ScreenTimeLog.findAll({
      where: userWhere,
      include: [{ model: ScreenTimeLimit, as: 'limit', attributes: ['id', 'appName', 'category', 'color', 'dailyLimitMinutes', 'icon'] }],
      order: [['date', 'DESC'], ['spentMinutes', 'DESC']],
      raw: false,
    }).catch(() => []);

    const byApp = new Map();
    let totalMinutes = 0;
    let totalExceededMinutes = 0;
    let exceededDays = 0;

    (logs || []).forEach((log) => {
      const mins = Number(log.spentMinutes) || 0;
      const limit = log.limit;
      const targetLimit = log.targetLimitMinutes || (limit ? limit.dailyLimitMinutes : null);
      const exMins = Number(log.exceededMinutes) || 0;
      totalMinutes += mins;
      totalExceededMinutes += exMins;
      if (log.isExceeded) exceededDays += 1;

      const key = log.appName || 'Unknown';
      const existing = byApp.get(key) || {
        appName: key,
        category: limit ? limit.category : 'Other',
        color: limit ? limit.color : '#94A3B8',
        icon: limit ? limit.icon : 'smartphone',
        totalMinutes: 0,
        targetLimitMinutes: targetLimit || null,
        daysSet: new Set(),
        exceededDays: 0,
        exceededMinutes: 0,
        entries: [],
      };
      existing.totalMinutes += mins;
      existing.exceededMinutes += exMins;
      if (log.isExceeded) existing.exceededDays += 1;
      existing.daysSet.add(log.date);
      existing.entries.push({
        id: log.id,
        date: log.date,
        spentMinutes: mins,
        targetLimitMinutes: log.targetLimitMinutes,
        exceededMinutes: exMins,
        isExceeded: log.isExceeded,
        notes: log.notes,
        createdAt: log.createdAt,
      });
      byApp.set(key, existing);
    });

    const appsResult = Array.from(byApp.values()).map((a) => {
      const daysCount = a.daysSet ? a.daysSet.size : 0;
      delete a.daysSet;
      return {
        ...a,
        days: daysCount,
        averagePerDay: daysCount ? Number((a.totalMinutes / daysCount).toFixed(2)) : 0,
        isOverLimit: a.targetLimitMinutes ? a.totalMinutes > a.targetLimitMinutes : false,
      };
    });

    const report = {
      range: { startDate: range.startStr, endDate: range.endStr },
      totalMinutes,
      totalHours: Number((totalMinutes / 60).toFixed(2)),
      totalExceededMinutes,
      exceededDays,
      apps: appsResult,
    };

    res.json({ success: true, data: report });
  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/dashboard/analytics/screen-time
 * Save or update daily screen time for an app with automatic limit comparison.
 */
exports.upsertScreenTime = async (req, res, next) => {
  try {
    const userId = req.userId || null;
    const { date, appName, spentMinutes, notes } = req.body || {};

    if (!date || !appName || spentMinutes === undefined) {
      return res.status(400).json({
        success: false,
        message: 'date, appName, and spentMinutes are required.',
      });
    }

    const cleanAppName = String(appName).trim();
    const minutes = Math.max(0, parseInt(spentMinutes, 10) || 0);

    let limitRow = null;
    if (userId) {
      limitRow = await ScreenTimeLimit.findOne({
        where: { userId, appName: { [Op.iLike]: cleanAppName } },
      });
    }
    if (!limitRow) {
      limitRow = await ScreenTimeLimit.findOne({
        where: { appName: { [Op.iLike]: cleanAppName }, userId: null },
      });
    }

    const targetLimit = limitRow ? limitRow.dailyLimitMinutes : null;
    const isExceeded = targetLimit !== null && minutes > targetLimit;
    const exceededMinutes = isExceeded ? minutes - targetLimit : 0;

    let logRow = await ScreenTimeLog.findOne({
      where: { userId: userId || null, date, appName: cleanAppName },
    });

    const payload = {
      userId: userId || null,
      date,
      appName: cleanAppName,
      spentMinutes: minutes,
      screenTimeLimitId: limitRow ? limitRow.id : null,
      targetLimitMinutes: targetLimit,
      isExceeded,
      exceededMinutes,
      notes: notes !== undefined ? notes : (logRow ? logRow.notes : ''),
    };

    if (logRow) {
      await logRow.update(payload);
    } else {
      payload.id = `st-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
      logRow = await ScreenTimeLog.create(payload);
    }

    cacheManager.delPattern('charts_');

    res.json({
      success: true,
      message: 'Screen time recorded successfully',
      data: logRow.toJSON(),
    });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/dashboard/analytics/screen-time-limits
 */
exports.getScreenTimeLimits = async (req, res, next) => {
  try {
    const userId = req.userId || null;
    const where = userId ? { [Op.or]: [{ userId }, { userId: null }] } : {};
    const limits = await ScreenTimeLimit.findAll({ where, order: [['appName', 'ASC']] });
    res.json({ success: true, data: limits });
  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/dashboard/analytics/screen-time-limits
 */
exports.upsertScreenTimeLimit = async (req, res, next) => {
  try {
    const userId = req.userId || null;
    const { id, appName, category, dailyLimitMinutes, color, icon } = req.body || {};

    if (!appName || dailyLimitMinutes === undefined) {
      return res.status(400).json({ success: false, message: 'appName and dailyLimitMinutes are required.' });
    }

    const cleanName = String(appName).trim();
    const limitMins = parseInt(dailyLimitMinutes, 10) || 30;

    let row = null;
    if (id) {
      row = await ScreenTimeLimit.findByPk(id);
    }
    if (!row) {
      row = await ScreenTimeLimit.findOne({
        where: { appName: { [Op.iLike]: cleanName }, ...(userId ? { userId } : {}) },
      });
    }

    const payload = {
      appName: cleanName,
      category: category || 'Social Media',
      dailyLimitMinutes: limitMins,
      color: color || '#E1306C',
      icon: icon || 'smartphone',
      userId: userId || null,
    };

    if (row) {
      await row.update(payload);
    } else {
      payload.id = `stl-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
      row = await ScreenTimeLimit.create(payload);
    }

    cacheManager.delPattern('charts_');

    res.json({ success: true, message: 'Screen time limit saved successfully', data: row });
  } catch (err) {
    next(err);
  }
};
