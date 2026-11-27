const { Op } = require('sequelize');
const { DailyScreenTime, ScreenTimeLog, ScreenTimeLimit } = require('../models');
const cacheManager = require('../utils/cacheManager');

function buildUserWhere(req, base = {}) {
  if (req.userId && process.env.ISOLATE_USER_KNOWLEDGE === 'true') {
    return { ...base, [Op.or]: [{ userId: req.userId }, { userId: null }] };
  }
  return base;
}

function formatDailyEntry(entry) {
  const plain = typeof entry.toJSON === 'function' ? entry.toJSON() : entry;
  const apps = Array.isArray(plain.apps) ? plain.apps : [];
  const allocatedMinutes = apps.reduce((sum, a) => sum + (Number(a.spentMinutes) || 0), 0);
  const totalMinutes = Number(plain.totalMinutes) || 0;
  const unallocatedMinutes = Math.max(0, totalMinutes - allocatedMinutes);
  const targetLimit = plain.targetLimitMinutes !== null && plain.targetLimitMinutes !== undefined
    ? Number(plain.targetLimitMinutes)
    : null;
  const isOverLimit = targetLimit !== null && totalMinutes > targetLimit;
  const exceededMinutes = isOverLimit ? totalMinutes - targetLimit : 0;

  return {
    ...plain,
    totalMinutes,
    allocatedMinutes,
    unallocatedMinutes,
    isOverAllocated: allocatedMinutes > totalMinutes,
    isOverLimit,
    exceededMinutes,
    apps: apps.sort((a, b) => (b.spentMinutes || 0) - (a.spentMinutes || 0)),
  };
}

/**
 * GET /api/screen-time
 * List all Daily Total Screen Time records with nested app breakdowns.
 */
exports.getDailyScreenTimes = async (req, res, next) => {
  try {
    const where = buildUserWhere(req, {});
    const rows = await DailyScreenTime.findAll({
      where,
      include: [
        {
          model: ScreenTimeLog,
          as: 'apps',
          required: false,
        },
      ],
      order: [['date', 'DESC'], ['createdAt', 'DESC']],
    });

    const data = rows.map(formatDailyEntry);
    res.json({ success: true, count: data.length, data });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/screen-time/:date
 * Get a specific date's Total Screen Time + app breakdown.
 */
exports.getDailyScreenTimeByDate = async (req, res, next) => {
  try {
    const { date } = req.params;
    const where = buildUserWhere(req, { date });
    const row = await DailyScreenTime.findOne({
      where,
      include: [
        {
          model: ScreenTimeLog,
          as: 'apps',
          required: false,
        },
      ],
    });

    res.json({
      success: true,
      data: row ? formatDailyEntry(row) : null,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/screen-time/total
 * Add or update Total Screen Time for a date.
 */
exports.upsertDailyScreenTime = async (req, res, next) => {
  try {
    const userId = req.userId || null;
    const { date, totalMinutes, targetLimitMinutes, notes } = req.body || {};

    if (!date || totalMinutes === undefined || totalMinutes === null) {
      return res.status(400).json({
        success: false,
        message: 'date and totalMinutes are required.',
      });
    }

    const cleanTotal = Math.max(0, parseInt(totalMinutes, 10) || 0);
    const cleanLimit =
      targetLimitMinutes !== undefined && targetLimitMinutes !== null && targetLimitMinutes !== ''
        ? Math.max(0, parseInt(targetLimitMinutes, 10) || 0)
        : null;

    let row = await DailyScreenTime.findOne({
      where: { userId: userId || null, date },
    });

    if (row) {
      await row.update({
        totalMinutes: cleanTotal,
        targetLimitMinutes: cleanLimit,
        notes: notes !== undefined ? notes : row.notes,
      });
    } else {
      row = await DailyScreenTime.create({
        id: `dst-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        date,
        totalMinutes: cleanTotal,
        targetLimitMinutes: cleanLimit,
        notes: notes || '',
        userId: userId || null,
      });
    }

    // Link any existing orphan app logs for the same date/user to this daily total
    await ScreenTimeLog.update(
      { dailyScreenTimeId: row.id },
      { where: { userId: userId || null, date, dailyScreenTimeId: null } }
    );

    const refreshed = await DailyScreenTime.findByPk(row.id, {
      include: [{ model: ScreenTimeLog, as: 'apps', required: false }],
    });

    cacheManager.delPattern('charts_');

    res.json({
      success: true,
      message: 'Total screen time saved successfully.',
      data: formatDailyEntry(refreshed),
    });
  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/screen-time/app
 * Add or update an app's screen time UNDER a Total Screen Time record.
 */
exports.addAppUnderDailyScreenTime = async (req, res, next) => {
  try {
    const userId = req.userId || null;
    const { dailyScreenTimeId, date, appName, spentMinutes, notes } = req.body || {};

    if (!appName || spentMinutes === undefined || (!dailyScreenTimeId && !date)) {
      return res.status(400).json({
        success: false,
        message: 'dailyScreenTimeId (or date), appName, and spentMinutes are required.',
      });
    }

    let parentTotal = null;
    if (dailyScreenTimeId) {
      parentTotal = await DailyScreenTime.findByPk(dailyScreenTimeId);
    }
    if (!parentTotal && date) {
      parentTotal = await DailyScreenTime.findOne({
        where: { userId: userId || null, date },
      });
    }

    if (!parentTotal) {
      return res.status(400).json({
        success: false,
        message: 'Please add Total Screen Time for this date first before adding app breakdown.',
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
    // Auto-register newly typed app dynamically so it appears in future Quick Select
    if (!limitRow) {
      limitRow = await ScreenTimeLimit.create({
        id: `stl-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        appName: cleanAppName,
        category: 'General',
        dailyLimitMinutes: 60,
        color: '#EC4899',
        isActive: true,
        userId: userId || null,
      });
    }

    const targetLimit = limitRow ? limitRow.dailyLimitMinutes : null;
    const isExceeded = targetLimit !== null && minutes > targetLimit;
    const exceededMinutes = isExceeded ? minutes - targetLimit : 0;

    let appRow = await ScreenTimeLog.findOne({
      where: { userId: userId || null, date: parentTotal.date, appName: cleanAppName },
    });

    const payload = {
      userId: userId || null,
      date: parentTotal.date,
      dailyScreenTimeId: parentTotal.id,
      appName: cleanAppName,
      spentMinutes: minutes,
      screenTimeLimitId: limitRow ? limitRow.id : null,
      targetLimitMinutes: targetLimit,
      isExceeded,
      exceededMinutes,
      notes: notes !== undefined ? notes : (appRow ? appRow.notes : ''),
    };

    if (appRow) {
      await appRow.update(payload);
    } else {
      payload.id = `st-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
      appRow = await ScreenTimeLog.create(payload);
    }

    cacheManager.delPattern('charts_');

    const refreshed = await DailyScreenTime.findByPk(parentTotal.id, {
      include: [{ model: ScreenTimeLog, as: 'apps', required: false }],
    });

    res.json({
      success: true,
      message: `${cleanAppName} time added under ${parentTotal.date} Total Screen Time.`,
      data: formatDailyEntry(refreshed),
    });
  } catch (err) {
    next(err);
  }
};

/**
 * DELETE /api/screen-time/app/:id
 * Delete an app breakdown entry.
 */
exports.deleteAppScreenTime = async (req, res, next) => {
  try {
    const { id } = req.params;
    const row = await ScreenTimeLog.findByPk(id);
    if (!row) {
      return res.status(404).json({ success: false, message: 'App screen time record not found.' });
    }
    await row.destroy();
    cacheManager.delPattern('charts_');
    res.json({ success: true, message: 'App screen time deleted.' });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/screen-time/apps
 * Fetch dynamic list of user's configured apps (from ScreenTimeLimit).
 */
exports.getDynamicApps = async (req, res, next) => {
  try {
    const userId = req.userId || null;
    const where = userId ? { [Op.or]: [{ userId }, { userId: null }] } : {};
    const apps = await ScreenTimeLimit.findAll({
      where: { ...where, isActive: true },
      order: [['appName', 'ASC']],
    });
    res.json({ success: true, data: apps });
  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/screen-time/apps
 * Dynamically create or update an app in the user's Quick Select list.
 */
exports.upsertDynamicApp = async (req, res, next) => {
  try {
    const userId = req.userId || null;
    const { appName, color, dailyLimitMinutes, category } = req.body || {};
    if (!appName || !String(appName).trim()) {
      return res.status(400).json({ success: false, message: 'appName is required.' });
    }

    const cleanName = String(appName).trim();
    let row = await ScreenTimeLimit.findOne({
      where: { appName: { [Op.iLike]: cleanName }, ...(userId ? { userId } : {}) },
    });

    const payload = {
      appName: cleanName,
      color: color || '#EC4899',
      dailyLimitMinutes: dailyLimitMinutes !== undefined && dailyLimitMinutes !== '' && dailyLimitMinutes !== null
        ? Math.max(1, parseInt(dailyLimitMinutes, 10) || 30)
        : 60,
      category: category || 'General',
      isActive: true,
      userId: userId || null,
    };

    if (row) {
      await row.update(payload);
    } else {
      payload.id = `stl-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
      row = await ScreenTimeLimit.create(payload);
    }

    res.json({ success: true, message: `${cleanName} saved to your apps.`, data: row });
  } catch (err) {
    next(err);
  }
};

/**
 * DELETE /api/screen-time/apps/:id
 * Remove an app from the user's dynamic Quick Select list.
 */
exports.deleteDynamicApp = async (req, res, next) => {
  try {
    const { id } = req.params;
    const row = await ScreenTimeLimit.findByPk(id);
    if (!row) {
      return res.status(404).json({ success: false, message: 'App not found.' });
    }
    await row.destroy();
    res.json({ success: true, message: 'App removed from quick list.' });
  } catch (err) {
    next(err);
  }
};

/**
 * DELETE /api/screen-time/total/:id
 * Delete a Daily Total Screen Time entry (cascades its app entries).
 */
exports.deleteDailyScreenTime = async (req, res, next) => {
  try {
    const { id } = req.params;
    const row = await DailyScreenTime.findByPk(id);
    if (!row) {
      return res.status(404).json({ success: false, message: 'Daily screen time record not found.' });
    }
    await ScreenTimeLog.destroy({ where: { dailyScreenTimeId: id } });
    await row.destroy();
    cacheManager.delPattern('charts_');
    res.json({ success: true, message: 'Daily total screen time deleted.' });
  } catch (err) {
    next(err);
  }
};
