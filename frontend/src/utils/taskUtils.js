import { isTaskOverdue, getDayPeriod } from './dateUtils';

export function getEffectiveStatus(task) {
  if (task.status === 'completed') return 'completed';
  if (task.status === 'overdue' || isTaskOverdue(task)) return 'overdue';
  return 'pending';
}

export function groupTasksByPeriod(tasks) {
  const grouped = {
    morning: [],
    afternoon: [],
    evening: [],
  };

  tasks.forEach((task) => {
    const period = getDayPeriod(task.startTime);
    grouped[period].push(task);
  });

  // Sort each group by start time
  const timeSort = (a, b) => (a.startTime || '').localeCompare(b.startTime || '');
  grouped.morning.sort(timeSort);
  grouped.afternoon.sort(timeSort);
  grouped.evening.sort(timeSort);

  return grouped;
}

export function filterAndSortTasks(
  tasks,
  {
    statusFilter = 'all', // all, pending, completed, overdue
    searchQuery = '',
    categoryId = 'all',
    priority = 'all',
    sortBy = 'time', // time, priority, created
  } = {}
) {
  let result = tasks.map((task) => ({
    ...task,
    effectiveStatus: getEffectiveStatus(task),
  }));

  // Status Filter
  if (statusFilter !== 'all') {
    result = result.filter((task) => task.effectiveStatus === statusFilter);
  }

  // Category Filter
  if (categoryId !== 'all') {
    result = result.filter((task) => task.categoryId === categoryId);
  }

  // Priority Filter
  if (priority !== 'all') {
    result = result.filter((task) => task.priority.toLowerCase() === priority.toLowerCase());
  }

  // Search Filter
  if (searchQuery.trim()) {
    const q = searchQuery.toLowerCase().trim();
    result = result.filter(
      (task) =>
        task.title.toLowerCase().includes(q) ||
        (task.description && task.description.toLowerCase().includes(q))
    );
  }

  // Sorting
  const priorityWeight = { high: 3, medium: 2, low: 1 };

  result.sort((a, b) => {
    if (sortBy === 'priority') {
      const wa = priorityWeight[a.priority.toLowerCase()] || 0;
      const wb = priorityWeight[b.priority.toLowerCase()] || 0;
      return wb - wa;
    }
    if (sortBy === 'created') {
      return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
    }
    // Default: Sort by scheduled time
    return (a.startTime || '').localeCompare(b.startTime || '');
  });

  return result;
}

/**
 * Convert "HH:MM" or "HH:MM:SS" string into total minutes from midnight
 */
export function timeToMinutes(tStr) {
  if (!tStr) return 0;
  const parts = String(tStr).split(':');
  const h = parseInt(parts[0], 10) || 0;
  const m = parseInt(parts[1], 10) || 0;
  return h * 60 + m;
}

/**
 * Checks if two time intervals [startA, endA] and [startB, endB] overlap
 */
export function doTimesOverlap(startA, endA, startB, endB) {
  const sA = timeToMinutes(startA);
  const eA = timeToMinutes(endA);
  const sB = timeToMinutes(startB);
  const eB = timeToMinutes(endB);

  if (eA <= sA || eB <= sB) return false;
  return sA < eB && eA > sB;
}

/**
 * Finds any conflicting task on the specified date that overlaps with [startTime, endTime]
 * @param {Object} params
 * @param {string} params.date - Date in YYYY-MM-DD
 * @param {string} params.startTime - Time in HH:MM
 * @param {string} params.endTime - Time in HH:MM
 * @param {Array} params.tasks - Array of tasks
 * @param {string|null} params.excludeTaskId - Task ID to exclude (e.g. when editing/rescheduling)
 * @returns {Object|null} The conflicting task or null if slot is available
 */
export function findScheduleConflict({ date, startTime, endTime, tasks = [], excludeTaskId = null }) {
  if (!date || !startTime || !endTime || !Array.isArray(tasks)) return null;

  const s = timeToMinutes(startTime);
  const e = timeToMinutes(endTime);
  if (e <= s) return null;

  return (
    tasks.find((t) => {
      if (!t) return false;
      if (excludeTaskId && String(t.id) === String(excludeTaskId)) return false;
      if (t.date !== date) return false;
      if (!t.startTime || !t.endTime) return false;

      const tStart = timeToMinutes(t.startTime);
      const tEnd = timeToMinutes(t.endTime);
      if (tEnd <= tStart) return false;

      // Overlap condition: start < otherEnd && end > otherStart
      return s < tEnd && e > tStart;
    }) || null
  );
}

