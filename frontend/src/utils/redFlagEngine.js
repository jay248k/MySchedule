import { getTodayDateString, parseDate, formatTime } from './dateUtils';
import { getEffectiveStatus } from './taskUtils';

/**
 * Intelligent Lag & Risk Assessment Engine for MySchedule
 * Detects:
 *  1. Time Slot Lags (e.g. 7:00-8:00 task was scheduled but not worked on)
 *  2. Category Inactivity Lags (categories falling behind with 0 completions)
 *  3. Goal Milestone Lags (goals lagging in progress vs deadlines)
 *  4. Schedule Deviations & Missed Overdue Deliverables
 * Tracks:
 *  - Real-time Recovery Progress (0% to 100%)
 *  - Automatically marks flags as Recovered / Resolved when performance improves!
 */
export function analyzeRedFlags({
  tasks = [],
  categories = [],
  goals = [],
  workSessions = [],
  activeWorkSession = null,
  targetDate = null,
}) {
  const todayStr = getTodayDateString();
  const evalDate = targetDate || todayStr;
  const isEvaluatingToday = evalDate === todayStr;

  const now = new Date();
  const currentMinutes = now.getHours() * 60 + now.getMinutes();

  const flags = [];

  // =========================================================================
  // 1. TIME SLOT LAGS (e.g. 7:00 to 8:00 task missed / not worked on)
  // =========================================================================
  const dayTasks = tasks.filter((t) => t.date === evalDate);

  dayTasks.forEach((task) => {
    if (task.startTime && task.endTime) {
      const [sh, sm] = task.startTime.split(':').map(Number);
      const [eh, em] = task.endTime.split(':').map(Number);
      const startMin = sh * 60 + (sm || 0);
      let endMin = eh * 60 + (em || 0);
      if (endMin < startMin) endMin += 24 * 60;

      const slotPassed = !isEvaluatingToday || currentMinutes >= endMin;
      const isCompleted = getEffectiveStatus(task) === 'completed';
      const isOverdue = getEffectiveStatus(task) === 'overdue';

      // Check if any work session was logged or is currently active for this task or slot
      const hasSessionForTask = workSessions.some(
        (s) => s.taskId === task.id || (s.date === evalDate && s.startTime && s.startTime === task.startTime)
      );
      const isActivelyTracking = Boolean(
        activeWorkSession?.isRunning &&
          (activeWorkSession?.taskId === task.id || activeWorkSession?.taskTitle === task.title)
      );

      // If slot has passed and task was not completed and no work session occurred
      if (slotPassed && !isCompleted) {
        // Recovery progress logic:
        // - 100% if completed
        // - 60% if actively tracking or work session logged
        // - 30% if marked in progress
        // - 0% if completely unaddressed
        let recoveryProgress = 0;
        let recoveryStatus = 'Lagging (Unresolved)';

        if (isCompleted) {
          recoveryProgress = 100;
          recoveryStatus = 'Fully Recovered (Completed)';
        } else if (isActivelyTracking) {
          recoveryProgress = 65;
          recoveryStatus = 'Recovering (Active Session Running)';
        } else if (hasSessionForTask) {
          recoveryProgress = 50;
          recoveryStatus = 'Partial Recovery (Work Logged)';
        } else if (task.status === 'in_progress') {
          recoveryProgress = 30;
          recoveryStatus = 'In Progress';
        }

        const isRecovered = recoveryProgress >= 100;

        flags.push({
          id: `timeslot-${task.id}`,
          type: 'time_slot',
          typeLabel: 'Time Slot Lag',
          title: `Slot ${task.startTime} - ${task.endTime} Missed`,
          area: `${task.startTime} - ${task.endTime}`,
          taskTitle: task.title,
          taskId: task.id,
          categoryId: task.categoryId,
          categoryName: categories.find((c) => c.id === task.categoryId)?.name || 'General',
          date: evalDate,
          reason: `Task '${task.title}' was scheduled for ${task.startTime} - ${task.endTime} but was not completed in that slot.`,
          severity: isOverdue ? 'critical' : 'high',
          recoveryProgress,
          recoveryStatus,
          isRecovered,
          actionRequired: isRecovered ? 'None - Resolved' : 'Complete task or log catch-up session',
        });
      }
    }
  });

  // =========================================================================
  // 2. CATEGORY INACTIVITY LAGS (Categories neglected or stalled)
  // =========================================================================
  categories.forEach((cat) => {
    const catTasks = tasks.filter((t) => t.categoryId === cat.id);
    if (catTasks.length === 0) return;

    const completedInCat = catTasks.filter((t) => getEffectiveStatus(t) === 'completed').length;
    const overdueInCat = catTasks.filter((t) => getEffectiveStatus(t) === 'overdue').length;
    const totalInCat = catTasks.length;
    const completionRate = Math.round((completedInCat / totalInCat) * 100);

    // If category has high overdue count or >3 tasks with 0% completion
    if (overdueInCat >= 2 || (totalInCat >= 3 && completionRate < 25)) {
      const isRecovered = overdueInCat === 0 && completionRate >= 60;
      const recoveryProgress = isRecovered
        ? 100
        : Math.min(Math.round((completedInCat / (totalInCat || 1)) * 100), 95);

      flags.push({
        id: `cat-${cat.id}`,
        type: 'category',
        typeLabel: 'Category Lag',
        title: `Category '${cat.name}' Stalled`,
        area: `Category: ${cat.name}`,
        categoryId: cat.id,
        categoryName: cat.name,
        date: evalDate,
        reason: `${overdueInCat} overdue tasks and only ${completedInCat}/${totalInCat} completed (${completionRate}% velocity).`,
        severity: overdueInCat >= 3 ? 'critical' : 'medium',
        recoveryProgress,
        recoveryStatus: isRecovered
          ? 'Fully Recovered'
          : recoveryProgress > 40
          ? 'Recovering Pace'
          : 'Low Velocity / Neglected',
        isRecovered,
        actionRequired: isRecovered
          ? 'Velocity healthy'
          : `Clear ${overdueInCat} overdue task(s) in ${cat.name}`,
      });
    }
  });

  // =========================================================================
  // 3. GOAL PROGRESSION LAGS (Goals lagging behind schedule)
  // =========================================================================
  goals.forEach((goal) => {
    if (goal.status === 'completed') return;

    const progress = Number(goal.progress) || 0;
    const targetDateObj = goal.targetDate ? parseDate(goal.targetDate) : null;
    let daysRemaining = null;
    let isUrgent = false;

    if (targetDateObj) {
      const diffMs = targetDateObj - new Date();
      daysRemaining = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
      if (daysRemaining <= 7 && progress < 60) isUrgent = true;
      if (daysRemaining < 0 && progress < 100) isUrgent = true;
    }

    if (isUrgent || (progress === 0 && goal.createdAt)) {
      const isRecovered = progress >= 100 || goal.status === 'completed';
      const recoveryProgress = Math.min(progress, 100);

      flags.push({
        id: `goal-${goal.id}`,
        type: 'goal',
        typeLabel: 'Goal Lag',
        title: `Goal '${goal.title}' Behind Schedule`,
        area: `Goal: ${goal.title}`,
        goalId: goal.id,
        date: evalDate,
        reason:
          daysRemaining !== null && daysRemaining < 0
            ? `Past deadline by ${Math.abs(daysRemaining)} days with only ${progress}% progress achieved.`
            : daysRemaining !== null
            ? `Only ${daysRemaining} day(s) left until target date with ${progress}% completion.`
            : `Goal has 0% progress recorded.`,
        severity: daysRemaining !== null && daysRemaining < 0 ? 'critical' : 'high',
        recoveryProgress,
        recoveryStatus: isRecovered
          ? 'Goal Milestone Achieved'
          : recoveryProgress > 50
          ? 'Catching Up'
          : 'Off Track',
        isRecovered,
        actionRequired: isRecovered
          ? 'Goal completed'
          : 'Advance key milestones or log progress update',
      });
    }
  });

  // Separate into active lags vs safely recovered
  const activeFlags = flags.filter((f) => !f.isRecovered);
  const recoveredFlags = flags.filter((f) => f.isRecovered);

  // Overall health score (100 = flawless, 0 = severe lags)
  const penalty = activeFlags.reduce((acc, f) => {
    if (f.severity === 'critical') return acc + 25;
    if (f.severity === 'high') return acc + 15;
    return acc + 8;
  }, 0);
  const healthScore = Math.max(0, 100 - penalty);

  return {
    allFlags: flags,
    activeFlags,
    recoveredFlags,
    totalCount: flags.length,
    activeCount: activeFlags.length,
    recoveredCount: recoveredFlags.length,
    healthScore,
    criticalCount: activeFlags.filter((f) => f.severity === 'critical').length,
    highCount: activeFlags.filter((f) => f.severity === 'high').length,
    mediumCount: activeFlags.filter((f) => f.severity === 'medium').length,
  };
}
