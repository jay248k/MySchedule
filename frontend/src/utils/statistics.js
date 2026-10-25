import { getTodayDateString, parseDate } from './dateUtils';
import { getEffectiveStatus } from './taskUtils';

export function calculateTaskStats(tasks, filterDateStr = null) {
  let targetTasks = tasks;
  if (filterDateStr) {
    targetTasks = tasks.filter((t) => t.date === filterDateStr);
  }

  const total = targetTasks.length;
  let completed = 0;
  let pending = 0;
  let overdue = 0;

  targetTasks.forEach((task) => {
    const status = getEffectiveStatus(task);
    if (status === 'completed') completed++;
    else if (status === 'overdue') overdue++;
    else pending++;
  });

  const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;
  const remaining = total - completed;

  return {
    total,
    completed,
    pending,
    overdue,
    percentage,
    remaining,
  };
}

export function calculateMonthlyStats(tasks, year, month) {
  const m = String(month + 1).padStart(2, '0');
  const prefix = `${year}-${m}`;

  const monthTasks = tasks.filter((t) => t.date && t.date.startsWith(prefix));
  return calculateTaskStats(monthTasks);
}

export function getCategoryDistribution(tasks, categories) {
  const catMap = {};
  categories.forEach((c) => {
    catMap[c.id] = {
      name: c.name,
      color: c.color,
      total: 0,
      completed: 0,
    };
  });

  tasks.forEach((t) => {
    if (catMap[t.categoryId]) {
      catMap[t.categoryId].total += 1;
      if (t.status === 'completed') {
        catMap[t.categoryId].completed += 1;
      }
    }
  });

  return Object.values(catMap).map((item) => ({
    ...item,
    value: item.total,
    rate: item.total > 0 ? Math.round((item.completed / item.total) * 100) : 0,
  }));
}

export function getPriorityDistribution(tasks) {
  const priorities = {
    High: { name: 'High', color: '#F43F5E', count: 0 },
    Medium: { name: 'Medium', color: '#F59E0B', count: 0 },
    Low: { name: 'Low', color: '#10B981', count: 0 },
  };

  tasks.forEach((t) => {
    const p = t.priority || 'Medium';
    if (priorities[p]) {
      priorities[p].count += 1;
    }
  });

  return Object.values(priorities);
}

export function getWeeklyProductivityTrend(tasks) {
  const today = new Date();
  const days = [];

  for (let i = 6; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    const dateStr = `${year}-${month}-${day}`;
    const dayName = d.toLocaleDateString('en-US', { weekday: 'short' });

    const dayTasks = tasks.filter((t) => t.date === dateStr);
    const completed = dayTasks.filter((t) => t.status === 'completed').length;
    const total = dayTasks.length;

    days.push({
      day: dayName,
      date: dateStr,
      total,
      completed,
      pending: total - completed,
    });
  }

  return days;
}

export function getDaysReportingData(tasks, rangeMode = '14days') {
  const today = new Date();
  const days = [];
  let daysCount = 14;

  if (rangeMode === '7days') daysCount = 7;
  else if (rangeMode === '30days') daysCount = 30;
  else if (rangeMode === 'month') {
    // Current month days from 1 to today (or end of month)
    const year = today.getFullYear();
    const month = today.getMonth();
    const lastDayOfMonth = new Date(year, month + 1, 0).getDate();
    daysCount = lastDayOfMonth;
  }

  const todayStr = getTodayDateString();

  for (let i = 0; i < daysCount; i++) {
    const d = new Date(today);
    if (rangeMode === 'month') {
      d.setDate(daysCount - i);
    } else {
      d.setDate(today.getDate() - i);
    }
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    const dateStr = `${year}-${month}-${day}`;
    const dayName = d.toLocaleDateString('en-US', { weekday: 'short' });
    const fullDate = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

    const dayTasks = tasks.filter((t) => t.date === dateStr);
    const dayStats = calculateTaskStats(dayTasks);

    let grade = 'No Tasks';
    let gradeColor = 'var(--text-muted)';
    if (dayStats.total > 0) {
      if (dayStats.percentage >= 80) {
        grade = 'High Focus';
        gradeColor = 'var(--success)';
      } else if (dayStats.percentage >= 50) {
        grade = 'Moderate';
        gradeColor = 'var(--primary-color)';
      } else {
        grade = 'Needs Action';
        gradeColor = 'var(--danger)';
      }
    }

    days.push({
      dateStr,
      dayName,
      fullDate,
      isToday: dateStr === todayStr,
      total: dayStats.total,
      completed: dayStats.completed,
      pending: dayStats.pending,
      overdue: dayStats.overdue,
      percentage: dayStats.percentage,
      tasks: dayTasks,
      grade,
      gradeColor,
    });
  }

  // Calculate aggregates
  const daysWithTasks = days.filter((d) => d.total > 0);
  const totalCompleted = days.reduce((sum, d) => sum + d.completed, 0);
  const avgCompleted = daysWithTasks.length > 0 ? (totalCompleted / daysWithTasks.length).toFixed(1) : '0';

  let bestDay = { dayName: 'None', count: 0, dateStr: '' };
  days.forEach((d) => {
    if (d.completed > bestDay.count) {
      bestDay = { dayName: d.dayName, count: d.completed, dateStr: d.dateStr };
    }
  });

  return {
    days,
    daysWithTasksCount: daysWithTasks.length,
    totalCompleted,
    avgCompletedPerDay: avgCompleted,
    bestDay,
  };
}
