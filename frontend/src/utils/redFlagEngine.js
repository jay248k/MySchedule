import { getTodayDateString, parseDate, formatTime } from './dateUtils';
import { getEffectiveStatus } from './taskUtils';

/**
 * Red Flag & Behavioral Lag Analytics Engine
 *
 * Core Principles:
 * 1. Identifies repeated time slots missed across multiple dates (e.g. 10:00 - 11:00 missed across days).
 * 2. Identifies categories and goals tasks repeatedly avoided/stalled.
 * 3. Recovery marks are calculated 100% AUTOMATICALLY from tasks completed in those slots/categories
 *    (e.g., missed 5 days -> requires 10 days of active completions in that slot to reach 100% full marks).
 * 4. Zero manual resolution buttons — recovery strictly measures actual completed work.
 * 5. Users can explicitly click "Avoid" to acknowledge or mark an avoidance pattern.
 */
export function analyzeRedFlags({
  tasks = [],
  categories = [],
  goals = [],
  workSessions = [],
  avoidedIds = new Set(),
  targetDate = null,
}) {
  const todayStr = getTodayDateString();
  const evalDate = targetDate || todayStr;

  const slotFlags = [];
  const categoryFlags = [];
  const goalFlags = [];

  // =========================================================================
  // 1. REPEATEDLY MISSED TIME SLOTS
  // =========================================================================
  const slotGroups = new Map();

  tasks.forEach((task) => {
    if (!task.startTime || !task.endTime) return;
    const slotKey = `${task.startTime} - ${task.endTime}`;
    if (!slotGroups.has(slotKey)) {
      slotGroups.set(slotKey, []);
    }
    slotGroups.get(slotKey).push(task);
  });

  slotGroups.forEach((slotTasks, slotKey) => {
    // Group by date
    const dateMap = new Map();
    slotTasks.forEach((t) => {
      const d = t.date || evalDate;
      if (!dateMap.has(d)) dateMap.set(d, []);
      dateMap.get(d).push(t);
    });

    const missedDates = [];
    const completedDates = [];

    dateMap.forEach((dayTasksInSlot, dateStr) => {
      const hasCompleted = dayTasksInSlot.some(
        (t) => getEffectiveStatus(t) === 'completed'
      );
      if (hasCompleted) {
        completedDates.push(dateStr);
      } else {
        // Check if any work session took place for this slot
        const hasSession = workSessions.some(
          (s) => s.date === dateStr && s.startTime === dayTasksInSlot[0]?.startTime
        );
        if (hasSession) {
          completedDates.push(dateStr);
        } else {
          missedDates.push(dateStr);
        }
      }
    });

    // Detect if this time slot is missed repeatedly (at least 1 missed date, prioritized if >= 2)
    if (missedDates.length > 0) {
      // Sort missed dates chronologically
      missedDates.sort();
      completedDates.sort();

      // Calculation Rule:
      // If missed N days (e.g. 5 days from 11th to 15th),
      // requires N * 2 days (minimum 5, e.g. 10 days) of completed work in that slot to reach 100% full marks.
      const requiredRecoveryDays = Math.max(5, missedDates.length * 2);
      const completedDaysCount = completedDates.length;
      const recoveryProgress = Math.min(
        100,
        Math.round((completedDaysCount / requiredRecoveryDays) * 100)
      );
      const isRecovered = recoveryProgress >= 100;

      const flagId = `slot-${slotKey.replace(/\s+/g, '')}`;
      const isAvoided = avoidedIds.has(flagId);

      // Date range label
      let dateRangeLabel = `${missedDates.length} date(s)`;
      if (missedDates.length === 1) {
        dateRangeLabel = missedDates[0];
      } else if (missedDates.length <= 3) {
        dateRangeLabel = missedDates.join(', ');
      } else {
        dateRangeLabel = `${missedDates[0]} to ${missedDates[missedDates.length - 1]} (${missedDates.length} dates)`;
      }

      slotFlags.push({
        id: flagId,
        type: 'time_slot',
        typeLabel: 'Repeatedly Missed Time Slot',
        title: `Slot ${slotKey} Missed Repeatedly`,
        slotKey,
        area: `Time Slot: ${slotKey}`,
        missedDates,
        dateRangeLabel,
        completedDates,
        requiredRecoveryDays,
        completedDaysCount,
        avoidedTasksCount: slotTasks.filter((t) => getEffectiveStatus(t) !== 'completed').length,
        taskTitles: [...new Set(slotTasks.map((t) => t.title))].slice(0, 4),
        severity: missedDates.length >= 3 ? 'critical' : 'high',
        recoveryProgress,
        recoveryStatus: isRecovered
          ? '100% Full Marks (Recovered)'
          : completedDaysCount > 0
          ? `${recoveryProgress}% Recovering (${completedDaysCount}/${requiredRecoveryDays} days completed)`
          : `0% Unrecovered (${completedDaysCount}/${requiredRecoveryDays} recovery days completed)`,
        isRecovered,
        isAvoided,
        explanation: `Scheduled in ${slotKey} but missed across ${missedDates.length} date(s). Complete tasks in this slot to earn automatic recovery marks.`,
      });
    }
  });

  // Sort slots: unrecovered first, then by missed dates count descending
  slotFlags.sort((a, b) => {
    if (a.isRecovered !== b.isRecovered) return a.isRecovered ? 1 : -1;
    return b.missedDates.length - a.missedDates.length;
  });

  // =========================================================================
  // 2. REPEATEDLY AVOIDED CATEGORIES
  // =========================================================================
  categories.forEach((cat) => {
    const catTasks = tasks.filter((t) => t.categoryId === cat.id);
    if (catTasks.length === 0) return;

    const overdueTasks = catTasks.filter((t) => getEffectiveStatus(t) === 'overdue');
    const completedTasks = catTasks.filter((t) => getEffectiveStatus(t) === 'completed');
    const incompleteTasks = catTasks.filter((t) => getEffectiveStatus(t) !== 'completed');

    // Dates with missed/uncompleted tasks in this category
    const missedDates = [...new Set(incompleteTasks.map((t) => t.date).filter(Boolean))].sort();

    // Trigger avoidance flag if overdue tasks exist or multiple missed dates
    if (overdueTasks.length >= 1 || (incompleteTasks.length >= 2 && missedDates.length >= 2)) {
      const requiredRecoveryDays = Math.max(5, missedDates.length * 2);
      const completedDays = [...new Set(completedTasks.map((t) => t.date).filter(Boolean))];
      const completionRatio = completedTasks.length / (catTasks.length || 1);
      const recoveryProgress = Math.min(
        100,
        Math.round(
          (completedDays.length / (requiredRecoveryDays || 1)) * 50 + completionRatio * 50
        )
      );
      const isRecovered = recoveryProgress >= 100;

      const flagId = `cat-${cat.id}`;
      const isAvoided = avoidedIds.has(flagId);

      let dateRangeLabel = `${missedDates.length} dates with pending tasks`;
      if (missedDates.length > 0 && missedDates.length <= 3) {
        dateRangeLabel = missedDates.join(', ');
      } else if (missedDates.length > 3) {
        dateRangeLabel = `${missedDates[0]} to ${missedDates[missedDates.length - 1]} (${missedDates.length} dates)`;
      }

      categoryFlags.push({
        id: flagId,
        type: 'category',
        typeLabel: 'Repeatedly Avoided Category',
        title: `Category '${cat.name}' Repeatedly Avoided`,
        area: `Category: ${cat.name}`,
        categoryId: cat.id,
        categoryName: cat.name,
        categoryColor: cat.color || '#F59E0B',
        missedDates,
        dateRangeLabel,
        overdueCount: overdueTasks.length,
        incompleteCount: incompleteTasks.length,
        completedCount: completedTasks.length,
        totalTasks: catTasks.length,
        requiredRecoveryDays,
        completedDaysCount: completedDays.length,
        severity: overdueTasks.length >= 3 ? 'critical' : 'high',
        recoveryProgress,
        recoveryStatus: isRecovered
          ? '100% Fully Recovered'
          : `${recoveryProgress}% Recovering (${completedTasks.length}/${catTasks.length} tasks completed)`,
        isRecovered,
        isAvoided,
        explanation: `${incompleteTasks.length} task(s) avoided across ${missedDates.length} dates. Completing tasks in ${cat.name} automatically increases recovery marks.`,
      });
    }
  });

  categoryFlags.sort((a, b) => {
    if (a.isRecovered !== b.isRecovered) return a.isRecovered ? 1 : -1;
    return b.overdueCount - a.overdueCount;
  });

  // =========================================================================
  // 3. REPEATEDLY AVOIDED GOALS
  // =========================================================================
  goals.forEach((goal) => {
    if (goal.status === 'completed') return;

    const progress = Number(goal.progress) || 0;
    const targetDateObj = goal.targetDate ? parseDate(goal.targetDate) : null;
    let daysRemaining = null;
    let isStalled = false;

    if (targetDateObj) {
      const diffMs = targetDateObj - new Date();
      daysRemaining = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
      if (daysRemaining <= 10 && progress < 50) isStalled = true;
      if (daysRemaining < 0 && progress < 100) isStalled = true;
    } else if (progress === 0) {
      isStalled = true;
    }

    if (isStalled) {
      const isRecovered = progress >= 100;
      const recoveryProgress = Math.min(100, Math.round(progress));

      const flagId = `goal-${goal.id}`;
      const isAvoided = avoidedIds.has(flagId);

      goalFlags.push({
        id: flagId,
        type: 'goal',
        typeLabel: 'Repeatedly Avoided Goal',
        title: `Goal '${goal.title}' Stalled & Avoided`,
        area: `Goal: ${goal.title}`,
        goalId: goal.id,
        goalTitle: goal.title,
        progress,
        daysRemaining,
        severity: daysRemaining !== null && daysRemaining < 0 ? 'critical' : 'high',
        recoveryProgress,
        recoveryStatus: isRecovered
          ? '100% Goal Completed'
          : `${recoveryProgress}% Milestone Progress`,
        isRecovered,
        isAvoided,
        explanation:
          daysRemaining !== null && daysRemaining < 0
            ? `Past target deadline by ${Math.abs(daysRemaining)} days with progress frozen at ${progress}%.`
            : daysRemaining !== null
            ? `Only ${daysRemaining} days left with progress stalled at ${progress}%.`
            : `Goal has 0% progress recorded.`,
      });
    }
  });

  goalFlags.sort((a, b) => a.recoveryProgress - b.recoveryProgress);

  // Consolidated Flags
  const allFlags = [...slotFlags, ...categoryFlags, ...goalFlags];
  const activeFlags = allFlags.filter((f) => !f.isRecovered);
  const recoveredFlags = allFlags.filter((f) => f.isRecovered);
  const avoidedList = allFlags.filter((f) => f.isAvoided);

  // Behavioral Schedule Health Score (0 - 100)
  const totalCount = allFlags.length;
  const avgRecovery =
    totalCount > 0
      ? Math.round(allFlags.reduce((sum, f) => sum + f.recoveryProgress, 0) / totalCount)
      : 100;

  return {
    allFlags,
    slotFlags,
    categoryFlags,
    goalFlags,
    activeFlags,
    recoveredFlags,
    avoidedList,
    totalCount,
    avgRecovery,
    activeCount: activeFlags.length,
    recoveredCount: recoveredFlags.length,
    avoidedCount: avoidedList.length,
    criticalCount: activeFlags.filter((f) => f.severity === 'critical').length,
    highCount: activeFlags.filter((f) => f.severity === 'high').length,
  };
}
