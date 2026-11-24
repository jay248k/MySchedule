const { Habit, HabitLog } = require('../models');
const { Op } = require('sequelize');
const { sequelize } = require('../config/database');

/**
 * Calculates current streak and all-time best streak for a habit.
 * If today is completed, counts from today backwards.
 * If today is not yet checked, counts from yesterday backwards (does not break streak until the day is missed).
 * If a consecutive day is missed, streak restarts!
 */
function calculateHabitStreaks(logs = [], todayStr) {
  if (!todayStr) {
    const now = new Date();
    todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  }

  const completedDates = new Set(
    logs.filter((l) => l.completed).map((l) => l.date)
  );

  const getPrevDateStr = (dateStr) => {
    const d = new Date(dateStr + 'T00:00:00');
    d.setDate(d.getDate() - 1);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  };

  let currentStreak = 0;
  let checkDate = todayStr;

  if (completedDates.has(todayStr)) {
    currentStreak++;
    checkDate = getPrevDateStr(todayStr);
    while (completedDates.has(checkDate)) {
      currentStreak++;
      checkDate = getPrevDateStr(checkDate);
    }
  } else {
    const yesterdayStr = getPrevDateStr(todayStr);
    if (completedDates.has(yesterdayStr)) {
      checkDate = yesterdayStr;
      while (completedDates.has(checkDate)) {
        currentStreak++;
        checkDate = getPrevDateStr(checkDate);
      }
    }
  }

  // All-time longest streak
  const sortedDates = Array.from(completedDates).sort();
  let longestStreak = 0;
  let tempStreak = 0;
  let prevDate = null;

  for (const dStr of sortedDates) {
    if (!prevDate) {
      tempStreak = 1;
    } else {
      const expectedNext = new Date(prevDate + 'T00:00:00');
      expectedNext.setDate(expectedNext.getDate() + 1);
      const expectedStr = `${expectedNext.getFullYear()}-${String(expectedNext.getMonth() + 1).padStart(2, '0')}-${String(expectedNext.getDate()).padStart(2, '0')}`;
      if (dStr === expectedStr) {
        tempStreak++;
      } else {
        tempStreak = 1;
      }
    }
    if (tempStreak > longestStreak) {
      longestStreak = tempStreak;
    }
    prevDate = dStr;
  }

  // Current month stats
  const [currentYear, currentMonth] = todayStr.split('-').slice(0, 2);
  const monthPrefix = `${currentYear}-${currentMonth}`;
  const thisMonthLogs = logs.filter((l) => l.date && l.date.startsWith(monthPrefix) && l.completed);

  return {
    currentStreak,
    longestStreak: Math.max(longestStreak, currentStreak),
    totalCompleted: completedDates.size,
    isCompletedToday: completedDates.has(todayStr),
    thisMonthCompleted: thisMonthLogs.length,
  };
}

// 1. GET ALL HABITS (with cached streaks - O(1) retrieval)
exports.getHabits = async (req, res, next) => {
  try {
    const where = { isArchived: false };
    if (req.userId && process.env.ISOLATE_USER_KNOWLEDGE === 'true') {
      where[Op.or] = [{ userId: req.userId }, { userId: null }];
    }

    const { category, search, includeArchived } = req.query;
    if (category && category !== 'All') {
      where.category = category;
    }
    if (includeArchived === 'true') {
      delete where.isArchived;
    }
    if (search && search.trim()) {
      where.name = { [Op.iLike]: `%${search.trim()}%` };
    }

    const now = new Date();
    const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;

    // Lightweight query - no logs include, use cached streak fields
    const habits = await Habit.findAll({
      where,
      attributes: {
        exclude: ['createdAt', 'updatedAt'], // Exclude timestamps for lighter payload
      },
      order: [['createdAt', 'ASC']],
    });

    const enrichedHabits = habits.map((habit) => {
      const plain = habit.toJSON();
      // Use cached streaks + check if completed today
      const isCompletedToday = plain.lastCompletedDate === todayStr;
      return {
        ...plain,
        currentStreak: plain.streakCurrent,
        longestStreak: plain.streakLongest,
        isCompletedToday,
        // totalCompleted would need a separate query - compute on demand or cache
      };
    });

    res.json({
      success: true,
      count: enrichedHabits.length,
      data: enrichedHabits,
    });
  } catch (error) {
    next(error);
  }
};

// 2. GET SINGLE HABIT BY ID (with optional logs include)
exports.getHabitById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { includeLogs } = req.query;

    const habit = await Habit.findByPk(id, {
      include: includeLogs === 'true' ? [{ model: HabitLog, as: 'logs' }] : [],
    });

    if (!habit) {
      return res.status(404).json({ success: false, message: 'Habit not found' });
    }

    const plain = habit.toJSON();
    const todayStr = new Date().toISOString().split('T')[0];

    // Use cached streaks by default
    const data = {
      ...plain,
      currentStreak: plain.streakCurrent,
      longestStreak: plain.streakLongest,
      isCompletedToday: plain.lastCompletedDate === todayStr,
    };

    // If logs included, can compute totalCompleted
    if (includeLogs === 'true' && plain.logs) {
      const completedDates = new Set(plain.logs.filter(l => l.completed).map(l => l.date));
      data.totalCompleted = completedDates.size;
    }

    res.json({
      success: true,
      data,
    });
  } catch (error) {
    next(error);
  }
};

// 3. CREATE HABIT
exports.createHabit = async (req, res, next) => {
  try {
    const {
      name,
      description,
      targetTime,
      category,
      color,
      icon,
      frequency,
    } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ success: false, message: 'Habit name is required' });
    }

    const habit = await Habit.create({
      name: name.trim(),
      description: description ? description.trim() : null,
      targetTime: targetTime || null,
      category: category || 'Discipline',
      color: color || '#10B981',
      icon: icon || 'flame',
      frequency: frequency || 'daily',
      userId: req.userId || null,
    });

    const plain = habit.toJSON();
    res.status(201).json({
      success: true,
      data: {
        ...plain,
        logs: [],
        currentStreak: 0,
        longestStreak: 0,
        totalCompleted: 0,
        isCompletedToday: false,
        thisMonthCompleted: 0,
      },
      message: 'Habit created successfully',
    });
  } catch (error) {
    next(error);
  }
};

// 4. UPDATE HABIT
exports.updateHabit = async (req, res, next) => {
  try {
    const { id } = req.params;
    const habit = await Habit.findByPk(id);

    if (!habit) {
      return res.status(404).json({ success: false, message: 'Habit not found' });
    }

    const {
      name,
      description,
      targetTime,
      category,
      color,
      icon,
      frequency,
      isArchived,
    } = req.body;

    await habit.update({
      ...(name !== undefined && { name: name.trim() }),
      ...(description !== undefined && { description: description ? description.trim() : null }),
      ...(targetTime !== undefined && { targetTime }),
      ...(category !== undefined && { category }),
      ...(color !== undefined && { color }),
      ...(icon !== undefined && { icon }),
      ...(frequency !== undefined && { frequency }),
      ...(isArchived !== undefined && { isArchived }),
    });

    const updatedHabit = await Habit.findByPk(id, {
      include: [{ model: HabitLog, as: 'logs' }],
    });
    const plain = updatedHabit.toJSON();
    const stats = calculateHabitStreaks(plain.logs || []);

    res.json({
      success: true,
      data: { ...plain, ...stats },
      message: 'Habit updated successfully',
    });
  } catch (error) {
    next(error);
  }
};

// 5. DELETE HABIT
exports.deleteHabit = async (req, res, next) => {
  try {
    const { id } = req.params;
    const habit = await Habit.findByPk(id);

    if (!habit) {
      return res.status(404).json({ success: false, message: 'Habit not found' });
    }

    await habit.destroy();

    res.json({
      success: true,
      message: 'Habit and calendar history deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};

// 6. TOGGLE DATE COMPLETION ON INDIVIDUAL HABIT CALENDAR
exports.toggleHabitDate = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { date, completed, notes } = req.body;

    if (!date) {
      return res.status(400).json({ success: false, message: 'Date (YYYY-MM-DD) is required' });
    }

    const habit = await Habit.findByPk(id);
    if (!habit) {
      return res.status(404).json({ success: false, message: 'Habit not found' });
    }

    let log = await HabitLog.findOne({
      where: { habitId: id, date },
    });

    if (log) {
      const nextCompleted = completed !== undefined ? Boolean(completed) : !log.completed;
      await log.update({
        completed: nextCompleted,
        completedAt: nextCompleted ? new Date() : null,
        ...(notes !== undefined && { notes }),
      });
    } else {
      const nextCompleted = completed !== undefined ? Boolean(completed) : true;
      log = await HabitLog.create({
        habitId: id,
        date,
        completed: nextCompleted,
        completedAt: nextCompleted ? new Date() : null,
        notes: notes || null,
        userId: req.userId || null,
      });
    }

    // Incrementally update streak fields (O(1) instead of O(n))
    // Only recalculate current streak - longest streak only increases
    const todayStr = new Date().toISOString().split('T')[0];
    const completedLogs = await HabitLog.findAll({
      where: { habitId: id, completed: true },
      order: [['date', 'DESC']],
      attributes: ['date'],
      limit: 400, // Max streak length to check
    });

    const completedDates = new Set(completedLogs.map(l => l.date));
    let currentStreak = 0;
    let checkDate = todayStr;

    if (completedDates.has(todayStr)) {
      currentStreak++;
      checkDate = getPrevDateStr(todayStr);
      while (completedDates.has(checkDate)) {
        currentStreak++;
        checkDate = getPrevDateStr(checkDate);
      }
    } else {
      const yesterdayStr = getPrevDateStr(todayStr);
      if (completedDates.has(yesterdayStr)) {
        checkDate = yesterdayStr;
        while (completedDates.has(checkDate)) {
          currentStreak++;
          checkDate = getPrevDateStr(checkDate);
        }
      }
    }

    // Update only the cached streak fields
    const updates = {
      streakCurrent: currentStreak,
      streakLongest: Math.max(habit.streakLongest, currentStreak),
    };
    if (log.completed) {
      updates.lastCompletedDate = date;
    }
    await habit.update(updates);

    // Return lightweight response without full logs
    const plain = habit.toJSON();
    res.json({
      success: true,
      data: {
        ...plain,
        ...updates,
        isCompletedToday: completedDates.has(todayStr),
      },
      message: `Habit ${log.completed ? 'completed' : 'unmarked'} for ${date}`,
    });
  } catch (error) {
    next(error);
  }
};

// Helper function for streak calculation (extracted for reuse)
function getPrevDateStr(dateStr) {
  const d = new Date(dateStr + 'T00:00:00');
  d.setDate(d.getDate() - 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

// 7. HABITS COMPREHENSIVE REPORT ANALYTICS (Optimized with cached streaks + aggregated queries)
exports.getHabitsReport = async (req, res, next) => {
  try {
    const where = { isArchived: false };
    if (req.userId && process.env.ISOLATE_USER_KNOWLEDGE === 'true') {
      where[Op.or] = [{ userId: req.userId }, { userId: null }];
    }

    const now = new Date();
    const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    const [currentYear, currentMonth, currentDay] = todayStr.split('-').map(Number);
    const daysSoFarThisMonth = currentDay;
    const monthPrefix = `${currentYear}-${String(currentMonth).padStart(2, '0')}`;

    // 1. Get habits with cached streak fields (no logs include)
    const habits = await Habit.findAll({
      where,
      attributes: ['id', 'name', 'category', 'color', 'icon', 'targetTime', 'streakCurrent', 'streakLongest', 'lastCompletedDate'],
      order: [['createdAt', 'ASC']],
    });

    // 2. Aggregated queries for totals (single queries instead of N+1)
    const habitIds = habits.map(h => h.id);

    // Total completed all-time per habit
    const allTimeCounts = await HabitLog.findAll({
      where: {
        habitId: { [Op.in]: habitIds },
        completed: true,
      },
      attributes: ['habitId', [sequelize.fn('COUNT', sequelize.col('id')), 'count']],
      group: ['habitId'],
      raw: true,
    });
    const allTimeMap = Object.fromEntries(allTimeCounts.map(r => [r.habitId, parseInt(r.count)]));

    // This month completed per habit
    const monthStart = `${monthPrefix}-01`;
    const monthCounts = await HabitLog.findAll({
      where: {
        habitId: { [Op.in]: habitIds },
        completed: true,
        date: { [Op.gte]: monthStart, [Op.lte]: todayStr },
      },
      attributes: ['habitId', [sequelize.fn('COUNT', sequelize.col('id')), 'count']],
      group: ['habitId'],
      raw: true,
    });
    const monthMap = Object.fromEntries(monthCounts.map(r => [r.habitId, parseInt(r.count)]));

    // Check if completed today per habit
    const todayCounts = await HabitLog.findAll({
      where: {
        habitId: { [Op.in]: habitIds },
        completed: true,
        date: todayStr,
      },
      attributes: ['habitId'],
      raw: true,
    });
    const todaySet = new Set(todayCounts.map(r => r.habitId));

    let totalCheckinsAllTime = 0;
    let totalCheckinsThisMonth = 0;
    let maxCurrentStreak = 0;
    let maxBestStreak = 0;

    const categoryBreakdown = {};

    const habitSummaries = habits.map((habit) => {
      const plain = habit.toJSON();

      const totalCompleted = allTimeMap[plain.id] || 0;
      const thisMonthCompleted = monthMap[plain.id] || 0;
      const isCompletedToday = todaySet.has(plain.id);
      const currentStreak = plain.streakCurrent;
      const longestStreak = plain.streakLongest;

      totalCheckinsAllTime += totalCompleted;
      totalCheckinsThisMonth += thisMonthCompleted;
      if (currentStreak > maxCurrentStreak) maxCurrentStreak = currentStreak;
      if (longestStreak > maxBestStreak) maxBestStreak = longestStreak;

      const cat = plain.category || 'Discipline';
      if (!categoryBreakdown[cat]) {
        categoryBreakdown[cat] = { category: cat, totalHabits: 0, totalCheckins: 0 };
      }
      categoryBreakdown[cat].totalHabits++;
      categoryBreakdown[cat].totalCheckins += totalCompleted;

      // Calculate monthly compliance rate %
      const monthlyRate = daysSoFarThisMonth > 0
        ? Math.min(100, Math.round((thisMonthCompleted / daysSoFarThisMonth) * 100))
        : 0;

      return {
        id: plain.id,
        name: plain.name,
        category: plain.category,
        color: plain.color,
        icon: plain.icon,
        targetTime: plain.targetTime,
        currentStreak,
        longestStreak,
        totalCompleted,
        thisMonthCompleted,
        monthlyRate,
        isCompletedToday,
      };
    });

    const totalPossibleThisMonth = habits.length * daysSoFarThisMonth;
    const overallMonthlyCompliance = totalPossibleThisMonth > 0
      ? Math.min(100, Math.round((totalCheckinsThisMonth / totalPossibleThisMonth) * 100))
      : 0;

    res.json({
      success: true,
      data: {
        summary: {
          totalHabits: habits.length,
          overallMonthlyCompliance,
          maxCurrentStreak,
          maxBestStreak,
          totalCheckinsThisMonth,
          totalCheckinsAllTime,
          todayDate: todayStr,
        },
        habits: habitSummaries,
        categories: Object.values(categoryBreakdown),
      },
    });
  } catch (error) {
    next(error);
  }
};

