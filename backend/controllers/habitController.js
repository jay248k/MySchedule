const { Habit, HabitLog } = require('../models');
const { Op } = require('sequelize');

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

// 1. GET ALL HABITS (with individual calendar logs & calculated streaks)
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

    const habits = await Habit.findAll({
      where,
      include: [
        {
          model: HabitLog,
          as: 'logs',
          attributes: ['id', 'date', 'completed', 'completedAt', 'notes'],
        },
      ],
      order: [
        ['createdAt', 'ASC'],
        [{ model: HabitLog, as: 'logs' }, 'date', 'ASC'],
      ],
    });

    const enrichedHabits = habits.map((habit) => {
      const plain = habit.toJSON();
      const logs = plain.logs || [];
      const stats = calculateHabitStreaks(logs, todayStr);
      return {
        ...plain,
        ...stats,
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

// 2. GET SINGLE HABIT BY ID
exports.getHabitById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const habit = await Habit.findByPk(id, {
      include: [{ model: HabitLog, as: 'logs' }],
    });

    if (!habit) {
      return res.status(404).json({ success: false, message: 'Habit not found' });
    }

    const plain = habit.toJSON();
    const stats = calculateHabitStreaks(plain.logs || []);

    res.json({
      success: true,
      data: {
        ...plain,
        ...stats,
      },
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

    // Return the updated habit with recalculated streaks
    const refreshedHabit = await Habit.findByPk(id, {
      include: [{ model: HabitLog, as: 'logs' }],
    });
    const plain = refreshedHabit.toJSON();
    const stats = calculateHabitStreaks(plain.logs || []);

    res.json({
      success: true,
      data: { ...plain, ...stats },
      message: `Habit ${log.completed ? 'completed' : 'unmarked'} for ${date}`,
    });
  } catch (error) {
    next(error);
  }
};

// 7. HABITS COMPREHENSIVE REPORT ANALYTICS
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

    const habits = await Habit.findAll({
      where,
      include: [{ model: HabitLog, as: 'logs' }],
      order: [['createdAt', 'ASC']],
    });

    let totalCheckinsAllTime = 0;
    let totalCheckinsThisMonth = 0;
    let maxCurrentStreak = 0;
    let maxBestStreak = 0;

    const categoryBreakdown = {};

    const habitSummaries = habits.map((habit) => {
      const plain = habit.toJSON();
      const logs = plain.logs || [];
      const stats = calculateHabitStreaks(logs, todayStr);

      totalCheckinsAllTime += stats.totalCompleted;
      totalCheckinsThisMonth += stats.thisMonthCompleted;
      if (stats.currentStreak > maxCurrentStreak) maxCurrentStreak = stats.currentStreak;
      if (stats.longestStreak > maxBestStreak) maxBestStreak = stats.longestStreak;

      const cat = plain.category || 'Discipline';
      if (!categoryBreakdown[cat]) {
        categoryBreakdown[cat] = { category: cat, totalHabits: 0, totalCheckins: 0 };
      }
      categoryBreakdown[cat].totalHabits++;
      categoryBreakdown[cat].totalCheckins += stats.totalCompleted;

      // Calculate monthly compliance rate %
      const monthlyRate = daysSoFarThisMonth > 0
        ? Math.min(100, Math.round((stats.thisMonthCompleted / daysSoFarThisMonth) * 100))
        : 0;

      return {
        id: plain.id,
        name: plain.name,
        category: plain.category,
        color: plain.color,
        icon: plain.icon,
        targetTime: plain.targetTime,
        currentStreak: stats.currentStreak,
        longestStreak: stats.longestStreak,
        totalCompleted: stats.totalCompleted,
        thisMonthCompleted: stats.thisMonthCompleted,
        monthlyRate,
        isCompletedToday: stats.isCompletedToday,
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
