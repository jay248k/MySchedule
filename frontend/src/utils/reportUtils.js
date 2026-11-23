/**
 * reportUtils.js
 * Comprehensive Daily Work Report & Standup generator.
 * Produces structured, informative, professional reports with completed deliverables,
 * active pending pipeline, work timers, category breakdown, deviations, and next actions.
 */

export function formatComprehensiveDailyReport({
  targetDate,
  tasks = [],
  categories = [],
  workSessions = [],
  activeWorkSession = null,
  deviations = [],
  formattedDateStr = '',
}) {
  const dayTasks = (tasks || []).filter((t) => t.date === targetDate);
  const doneTasks = dayTasks.filter((t) => t.status === 'completed' || t.completed);
  const inProgressTasks = dayTasks.filter((t) => t.status === 'in_progress');
  const pendingTasks = dayTasks.filter((t) => t.status !== 'completed' && !t.completed);

  // 1. Work Timer Sessions
  const daySessions = (workSessions || []).filter(
    (s) => s.date === targetDate || s.startTime?.startsWith(targetDate)
  );

  let totalSessionMins = 0;
  const sessionLines = [];
  if (daySessions.length > 0) {
    daySessions.forEach((s, idx) => {
      const start = s.startTime
        ? (s.startTime.includes('T') ? s.startTime.split('T')[1].substring(0, 5) : s.startTime)
        : 'Start';
      const end = s.endTime
        ? (s.endTime.includes('T') ? s.endTime.split('T')[1].substring(0, 5) : s.endTime)
        : 'Now';
      const durationMins = s.durationMinutes || (s.durationSeconds ? Math.round(s.durationSeconds / 60) : 60);
      totalSessionMins += durationMins;

      const taskTitle = s.taskTitle || (s.taskId ? (tasks.find((t) => t.id === s.taskId)?.title) : null);
      const taskSuffix = taskTitle ? ` — Focus: ${taskTitle}` : '';
      sessionLines.push(`• Timer #${idx + 1}: ${start} – ${end} (${Math.floor(durationMins / 60)}h ${durationMins % 60}m)${taskSuffix}`);
    });
  }

  if (activeWorkSession?.isRunning) {
    const start = activeWorkSession.startTime || 'Active';
    sessionLines.push(`• Live Focus Session: Running since ${start}`);
  }

  // 2. Realistic Hours Calculation
  let calculatedHours = 0;
  if (totalSessionMins > 0) {
    calculatedHours = Number((totalSessionMins / 60).toFixed(1));
  } else if (doneTasks.length > 0) {
    const est = doneTasks.reduce((acc, t) => {
      if (!t.startTime || !t.endTime) return acc + 1.0;
      const [sh, sm] = t.startTime.split(':').map(Number);
      const [eh, em] = t.endTime.split(':').map(Number);
      const diff = eh * 60 + em - (sh * 60 + sm);
      return acc + (diff > 0 ? diff / 60 : 1.0);
    }, 0);
    calculatedHours = Number(Math.max(1, est).toFixed(1));
  } else if (dayTasks.length > 0) {
    const est = dayTasks.reduce((acc, t) => {
      if (!t.startTime || !t.endTime) return acc + 0.8;
      const [sh, sm] = t.startTime.split(':').map(Number);
      const [eh, em] = t.endTime.split(':').map(Number);
      const diff = eh * 60 + em - (sh * 60 + sm);
      return acc + (diff > 0 ? diff / 60 : 0.8);
    }, 0);
    calculatedHours = Number(Math.min(8.0, Math.max(1.0, est)).toFixed(1));
  } else {
    calculatedHours = 7.0;
  }

  // 3. Category Distribution
  const catMap = {};
  dayTasks.forEach((t) => {
    const cat = categories.find((c) => c.id === t.categoryId)?.name || 'General';
    catMap[cat] = (catMap[cat] || 0) + 1;
  });
  const categoryLines = Object.entries(catMap).map(
    ([name, count]) => `• ${name}: ${count} work${count > 1 ? 's' : ''} (${Math.round((count / (dayTasks.length || 1)) * 100)}% of agenda)`
  );

  // 4. Schedule Deviations / Mistakes
  const dayDeviations = (deviations || []).filter((d) => d.date === targetDate);
  const deviationLines = dayDeviations.map((d) => {
    const time = d.startTime ? ` [${d.startTime}${d.endTime ? ` – ${d.endTime}` : ''}]` : '';
    const mins = d.divertedMinutes ? ` (${d.divertedMinutes}m diverted)` : '';
    const cause = d.rootCause ? ` (${d.rootCause})` : '';
    const rule = d.preventionRule ? ` | Prevention Rule: ${d.preventionRule}` : '';
    return `• Incident${time}${mins}: Diverted from "${d.plannedCommitment || 'Scheduled focus'}" to "${d.actualActivity || 'Distraction'}". Reason: ${d.reasonCategory || 'Deviation'}${cause}${rule}`;
  });

  const completionRate = dayTasks.length > 0 ? Math.round((doneTasks.length / dayTasks.length) * 100) : (doneTasks.length > 0 ? 100 : 0);
  const dateHeader = formattedDateStr || targetDate;

  // 5. Accomplished Deliverables Bullets
  const completedBullets = doneTasks.length > 0
    ? doneTasks.map((t) => {
        const time = t.startTime ? ` (${t.startTime}${t.endTime ? ` – ${t.endTime}` : ''})` : '';
        const cat = categories.find((c) => c.id === t.categoryId)?.name || 'General';
        const prio = t.priority ? ` [Priority: ${t.priority.toUpperCase()}]` : '';
        return `• ${t.title}${time} — ${cat}${prio}`;
      }).join('\n')
    : (dayTasks.length > 0
        ? `• No scheduled tasks marked completed yet for this date. (${pendingTasks.length} works queued in active agenda).`
        : '• Logged routine development deliverables.');

  // 6. Active Pipeline & Pending Priorities Bullets
  const pendingBullets = pendingTasks.length > 0
    ? pendingTasks.map((t) => {
        const time = t.startTime ? ` (${t.startTime}${t.endTime ? ` – ${t.endTime}` : ''})` : '';
        const cat = categories.find((c) => c.id === t.categoryId)?.name || 'General';
        const st = t.status === 'in_progress' ? ' [IN PROGRESS]' : ' [PENDING]';
        const prio = t.priority ? ` [Priority: ${t.priority.toUpperCase()}]` : '';
        return `• ${t.title}${time} — ${cat}${st}${prio}`;
      }).join('\n')
    : (dayTasks.length > 0
        ? '• All scheduled works for this date have been completed successfully on schedule.'
        : '• No additional pending tasks scheduled.');

  // 7. Impediments & Blockers text
  const impedimentsText = deviationLines.length > 0
    ? `Identified Schedule Divergences & Incidents (${deviationLines.length}):\n${deviationLines.join('\n')}`
    : 'None reported. Execution tracking steadily with no critical blockers.';

  // 8. Construct Comprehensive Standup Report Body
  const sections = [
    `📊 DAILY WORK REPORT & STANDUP SUMMARY — ${dateHeader}`,
    `Execution Velocity: ${doneTasks.length}/${dayTasks.length} works finished (${completionRate}% velocity) | ${pendingTasks.length} pending in queue | Total Focus: ${calculatedHours} hrs.`,
    `--------------------------------------------------------------------------------`,
    `\n🚀 1. ACCOMPLISHED DELIVERABLES (${doneTasks.length}):\n${completedBullets}`,
    `\n⏳ 2. ACTIVE PIPELINE & SCHEDULED PRIORITIES (${pendingTasks.length}):\n${pendingBullets}`,
    `\n⏱️ 3. WORK TIMERS & FOCUS SESSIONS:\n${
      sessionLines.length > 0
        ? `${sessionLines.join('\n')}\n• Total Tracked: ${calculatedHours} hrs across ${daySessions.length} session(s).`
        : `• Planned Focus Duration: ${calculatedHours} hrs based on scheduled agenda commitments.`
    }`,
    categoryLines.length > 0 ? `\n💼 4. WORKLOAD DISTRIBUTION BY CATEGORY:\n${categoryLines.join('\n')}` : null,
    `\n⚠️ 5. IMPEDIMENTS, DEVIATIONS & BLOCKERS:\n${impedimentsText}`,
    `\n🎯 6. NEXT ACTIONS & UPCOMING FOCUS:\n• Progress remaining scheduled commitments and deliver milestones according to priority.`,
  ];

  const autoReportText = sections.filter(Boolean).join('\n');

  return {
    autoReportText,
    calculatedHours,
    completedBullets,
    doneCount: doneTasks.length,
    totalCount: dayTasks.length,
    pendingCount: pendingTasks.length,
    completionRate,
    highlights: doneTasks.length > 0
      ? `Delivered ${doneTasks.length}/${dayTasks.length} works (${completionRate}% velocity).`
      : `Agenda in progress (${pendingTasks.length} works queued).`,
    blockers: deviationLines.length > 0 ? `Identified ${deviationLines.length} schedule divergence(s).` : 'None. Steady progress without major impediments.',
    mood: doneTasks.length >= Math.ceil(dayTasks.length * 0.7) && dayTasks.length > 0 ? 'fire' : 'rocket',
  };
}
