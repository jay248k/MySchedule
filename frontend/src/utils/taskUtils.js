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
