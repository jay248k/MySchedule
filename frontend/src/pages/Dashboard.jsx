import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';
import {
  CheckCheck,
  Clock,
  AlertTriangle,
  ListTodo,
  CalendarDays,
  ArrowRight,
  TrendingUp,
  Sparkles,
  Zap,
  PieChart as PieChartIcon,
  Wand2,
  Headphones,
  Flame,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { getTodayDateString, formatDate } from '../utils/dateUtils';
import {
  calculateTaskStats,
  calculateMonthlyStats,
  getProductivityTrend,
  getWeeklyProductivityTrend,
  getCategoryDistribution,
} from '../utils/statistics';
import { ProgressRing, ProgressBar } from '../components/common/ProgressRing';
import { DailyScheduleTimeline } from '../components/tasks/DailyScheduleTimeline';
import { WorkHoursClock } from '../components/dashboard/WorkHoursClock';
import { SmartRescheduleModal } from '../components/tasks/SmartRescheduleModal';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08,
      delayChildren: 0.03,
    },
  },
};

const cardVariants = {
  hidden: { opacity: 0, y: 16 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.4,
      ease: [0.16, 1, 0.3, 1],
    },
  },
};

// Custom High-Contrast Tooltip for Area Chart
function CustomTrendTooltip({ active, payload, label }) {
  if (active && payload && payload.length) {
    const item = payload[0]?.payload;
    const title = item?.fullDate || label;
    return (
      <div
        style={{
          background: '#0F172A',
          border: '1px solid #334155',
          borderRadius: '8px',
          padding: '10px 14px',
          color: '#FFFFFF',
          fontSize: '0.82rem',
          boxShadow: '0 8px 20px rgba(0,0,0,0.4)',
          minWidth: '160px',
        }}
      >
        <div style={{ fontWeight: 800, marginBottom: '6px', color: '#94A3B8' }}>{title}</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
          {payload.map((entry, idx) => (
            <div key={idx} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '7px' }}>
                <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: entry.color }} />
                <span style={{ color: '#E2E8F0', fontSize: '0.78rem' }}>{entry.name}:</span>
              </div>
              <strong style={{ color: entry.color, fontSize: '0.84rem' }}>{entry.value || 0}</strong>
            </div>
          ))}
        </div>
      </div>
    );
  }
  return null;
}

export function Dashboard() {
  const navigate = useNavigate();
  const { tasks, categories, user, selectedDate } = useApp();

  const todayStr = getTodayDateString();
  const activeDate = selectedDate || todayStr;
  const isToday = activeDate === todayStr;
  const formattedActiveDate = formatDate(activeDate, { month: 'short', day: 'numeric' });

  const todayTasks = useMemo(() => tasks.filter((t) => t.date === activeDate), [tasks, activeDate]);
  const todayStats = useMemo(() => calculateTaskStats(todayTasks), [todayTasks]);

  const now = new Date();
  const currentMonthStats = useMemo(
    () => calculateMonthlyStats(tasks, now.getFullYear(), now.getMonth()),
    [tasks, now]
  );

  // Recharts Data
  const [trendRange, setTrendRange] = useState('week'); // 'week' | 'month' | 'year'
  const [selectedTrendCategory, setSelectedTrendCategory] = useState('all');
  const trendData = useMemo(
    () => getProductivityTrend(tasks, trendRange, selectedTrendCategory, categories),
    [tasks, trendRange, selectedTrendCategory, categories]
  );

  const activeCategories = useMemo(() => {
    return categories.filter((c) =>
      tasks.some(
        (t) =>
          t.categoryId === c.id ||
          (typeof t.category === 'string' && t.category.toLowerCase().trim() === c.name.toLowerCase().trim())
      )
    );
  }, [categories, tasks]);

  const currentCategory = useMemo(() => {
    if (selectedTrendCategory === 'all') return null;
    return categories.find((c) => String(c.id) === String(selectedTrendCategory) || c.name === selectedTrendCategory);
  }, [categories, selectedTrendCategory]);

  const categoryData = useMemo(() => {
    const dist = getCategoryDistribution(tasks, categories);
    return dist.filter((c) => c.value > 0);
  }, [tasks, categories]);

  const [isRescheduleOpen, setIsRescheduleOpen] = useState(false);
  const overdueTasksCount = useMemo(() => {
    return tasks.filter((t) => t.date < todayStr && t.status !== 'completed').length;
  }, [tasks, todayStr]);

  // 365-Day Activity Contribution Graph (Past 52 weeks = 364 days)
  const heatmapDays = useMemo(() => {
    const days = [];
    const today = new Date();
    const currentDayOfWeek = today.getDay(); // 0 is Sun, 1 is Mon...
    const daysFromMonday = (currentDayOfWeek + 6) % 7;

    const totalDays = 52 * 7;
    const startDate = new Date(today);
    startDate.setDate(today.getDate() - (totalDays - 1 - (6 - daysFromMonday)));

    for (let i = 0; i < totalDays; i++) {
      const d = new Date(startDate);
      d.setDate(startDate.getDate() + i);
      const dateStr = d.toISOString().split('T')[0];
      days.push({
        date: d,
        dateStr,
        dayOfWeek: d.getDay(),
        month: d.getMonth(),
        isFuture: d > today,
      });
    }
    return days;
  }, []);

  // Map completed tasks count per date
  const completedTaskCountsByDate = useMemo(() => {
    const counts = {};
    tasks.forEach((t) => {
      if (t.date && (t.status === 'completed' || t.completedAt)) {
        counts[t.date] = (counts[t.date] || 0) + 1;
      }
    });
    return counts;
  }, [tasks]);

  // Overall heatmap streak and totals
  const heatmapStats = useMemo(() => {
    let totalCompletedYear = 0;
    heatmapDays.forEach((day) => {
      if (completedTaskCountsByDate[day.dateStr]) {
        totalCompletedYear += completedTaskCountsByDate[day.dateStr];
      }
    });

    let currentStreak = 0;
    let checkDate = new Date();
    const todayFormatted = checkDate.toISOString().split('T')[0];
    if (completedTaskCountsByDate[todayFormatted]) {
      currentStreak++;
      checkDate.setDate(checkDate.getDate() - 1);
    } else {
      checkDate.setDate(checkDate.getDate() - 1);
      const yStr = checkDate.toISOString().split('T')[0];
      if (completedTaskCountsByDate[yStr]) {
        currentStreak++;
        checkDate.setDate(checkDate.getDate() - 1);
      }
    }
    if (currentStreak > 0) {
      while (true) {
        const dStr = checkDate.toISOString().split('T')[0];
        if (completedTaskCountsByDate[dStr]) {
          currentStreak++;
          checkDate.setDate(checkDate.getDate() - 1);
        } else {
          break;
        }
      }
    }

    return { totalCompletedYear, currentStreak };
  }, [heatmapDays, completedTaskCountsByDate]);

  // Month column labels for heatmap
  const monthLabels = useMemo(() => {
    const labels = [];
    let lastMonth = -1;
    for (let col = 0; col < 52; col++) {
      const day = heatmapDays[col * 7];
      if (day && day.month !== lastMonth) {
        lastMonth = day.month;
        labels.push({
          col,
          label: day.date.toLocaleDateString('en-US', { month: 'short' }),
        });
      }
    }
    return labels;
  }, [heatmapDays]);

  const [heatmapTooltip, setHeatmapTooltip] = useState(null);

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}
    >
      {/* Smart Reschedule Overdue Alert Banner */}
      {overdueTasksCount > 0 && (
        <motion.div
          variants={cardVariants}
          style={{
            padding: '14px 20px',
            borderRadius: 'var(--radius-lg)',
            background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.12) 0%, rgba(245, 158, 11, 0.05) 100%)',
            border: '1.5px solid rgba(245, 158, 11, 0.35)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '12px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '8px',
                background: 'rgba(245, 158, 11, 0.2)',
                color: '#F59E0B',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Wand2 size={18} />
            </div>
            <div>
              <div style={{ fontSize: '0.92rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                {overdueTasksCount} Overdue Task{overdueTasksCount === 1 ? '' : 's'} Detected
              </div>
              <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                You have unfinished tasks from previous days. Auto-balance them into open calendar slots with zero manual drag-and-drop.
              </div>
            </div>
          </div>

          <button
            type="button"
            className="btn btn-sm"
            onClick={() => setIsRescheduleOpen(true)}
            style={{
              background: '#F59E0B',
              color: '#FFFFFF',
              border: 'none',
              fontWeight: 800,
              padding: '7px 16px',
              borderRadius: 'var(--radius-md)',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <Sparkles size={14} /> Smart Auto-Balance Schedule
          </button>
        </motion.div>
      )}

      {/* 2. Work Hours Live Clock Widget Card (Digital LED + Analog Clock) */}
      <motion.section variants={cardVariants}>
        <WorkHoursClock tasks={tasks} selectedDate={activeDate} />
      </motion.section>

      {/* 3. Metric Summary Cards */}
      <motion.section
        variants={cardVariants}
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '12px',
        }}
      >
        {/* Total Tasks */}
        <div className="dash-stat-card total" onClick={() => navigate('/today')}>
          <div
            className="dash-stat-icon-wrapper"
            style={{ background: '#EFF6FF', color: '#2563EB', borderColor: '#BFDBFE' }}
          >
            <ListTodo size={20} strokeWidth={2.2} />
          </div>
          <div>
            <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', fontWeight: 600 }}>
              Total Tasks ({isToday ? 'Today' : formattedActiveDate})
            </div>
            <div style={{ fontSize: '1.45rem', fontWeight: 800, color: 'var(--text-primary)', lineHeight: 1.15 }}>
              {todayStats.total}
            </div>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '1px' }}>
              Scheduled for {isToday ? 'today' : formattedActiveDate}
            </div>
          </div>
        </div>

        {/* Completed */}
        <div className="dash-stat-card completed" onClick={() => navigate('/today')}>
          <div
            className="dash-stat-icon-wrapper"
            style={{ background: '#ECFDF5', color: '#059669', borderColor: '#A7F3D0' }}
          >
            <CheckCheck size={22} strokeWidth={2.4} />
          </div>
          <div>
            <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', fontWeight: 600 }}>
              Completed
            </div>
            <div style={{ fontSize: '1.45rem', fontWeight: 800, color: '#059669', lineHeight: 1.15 }}>
              {todayStats.completed}
            </div>
            <div style={{ fontSize: '0.72rem', color: '#059669', fontWeight: 600, marginTop: '1px' }}>
              {todayStats.percentage}% completion rate
            </div>
          </div>
        </div>

        {/* Pending */}
        <div className="dash-stat-card pending" onClick={() => navigate('/today')}>
          <div
            className="dash-stat-icon-wrapper"
            style={{ background: '#FFFBEB', color: '#D97706', borderColor: '#FDE68A' }}
          >
            <Clock size={20} strokeWidth={2.2} />
          </div>
          <div>
            <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', fontWeight: 600 }}>
              Pending
            </div>
            <div style={{ fontSize: '1.45rem', fontWeight: 800, color: '#D97706', lineHeight: 1.15 }}>
              {todayStats.pending}
            </div>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '1px' }}>
              Awaiting completion
            </div>
          </div>
        </div>

        {/* Overdue */}
        <div className="dash-stat-card overdue" onClick={() => navigate('/today')}>
          <div
            className="dash-stat-icon-wrapper"
            style={{ background: '#FEF2F2', color: '#DC2626', borderColor: '#FECACA' }}
          >
            <AlertTriangle size={20} strokeWidth={2.2} />
          </div>
          <div>
            <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', fontWeight: 600 }}>
              Overdue
            </div>
            <div style={{ fontSize: '1.45rem', fontWeight: 800, color: '#DC2626', lineHeight: 1.15 }}>
              {todayStats.overdue}
            </div>
            <div
              style={{
                fontSize: '0.72rem',
                color: todayStats.overdue > 0 ? '#DC2626' : 'var(--text-muted)',
                fontWeight: todayStats.overdue > 0 ? 700 : 400,
                marginTop: '1px',
              }}
            >
              {todayStats.overdue > 0 ? 'Requires attention' : 'All clear! No overdue tasks'}
            </div>
          </div>
        </div>
      </motion.section>

      {/* 4. Production Analytics Charts Row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(12, 1fr)', gap: '14px' }}>
        {/* Weekly Productivity Trend Area Chart (8 Columns) */}
        <motion.div
          variants={cardVariants}
          className="card"
          style={{ gridColumn: 'span 8', padding: '10px 16px', display: 'flex', flexDirection: 'column', gap: '6px' }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
            <div>
              <h2 className="card-title" style={{ margin: 0, fontSize: '0.92rem' }}>
                <TrendingUp size={16} color="var(--primary-color)" />
                {trendRange === 'week' ? 'Weekly' : trendRange === 'month' ? 'Monthly' : 'Yearly'} Productivity Trend
              </h2>
              <span className="card-subtitle" style={{ fontSize: '0.72rem' }}>
                {selectedTrendCategory === 'all'
                  ? `Completed vs scheduled tasks across all categories over the last ${
                      trendRange === 'week' ? '7 days' : trendRange === 'month' ? '30 days' : '12 months'
                    }`
                  : `Showing tasks for "${currentCategory?.name || 'Category'}" over the last ${
                      trendRange === 'week' ? '7 days' : trendRange === 'month' ? '30 days' : '12 months'
                    }`}
              </span>
            </div>

            {/* Filter Controls: Category Selector + Week/Month/Year Pills */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
              {/* Category Dropdown Filter */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <select
                  className="form-select"
                  value={selectedTrendCategory}
                  onChange={(e) => setSelectedTrendCategory(e.target.value)}
                  style={{
                    fontSize: '0.74rem',
                    padding: '2px 24px 2px 8px',
                    height: '26px',
                    fontWeight: 600,
                    borderRadius: '6px',
                    border: '1px solid var(--border-color)',
                    background: 'var(--page-bg)',
                    color: 'var(--text-primary)',
                    cursor: 'pointer',
                  }}
                  title="Filter by Category"
                >
                  <option value="all">📁 All Categories (All Lines)</option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Week / Month / Year Filter Toggle */}
              <div
                style={{
                  display: 'inline-flex',
                  background: 'var(--page-bg)',
                  padding: '2px',
                  borderRadius: '6px',
                  border: '1px solid var(--border-color)',
                  gap: '2px',
                }}
              >
                {[
                  { key: 'week', label: 'Week' },
                  { key: 'month', label: 'Month' },
                  { key: 'year', label: 'Year' },
                ].map((item) => {
                  const isActive = trendRange === item.key;
                  return (
                    <button
                      key={item.key}
                      type="button"
                      onClick={() => setTrendRange(item.key)}
                      style={{
                        border: 'none',
                        background: isActive ? 'var(--primary-color)' : 'transparent',
                        color: isActive ? '#FFFFFF' : 'var(--text-secondary)',
                        padding: '2px 9px',
                        borderRadius: '5px',
                        fontSize: '0.72rem',
                        fontWeight: isActive ? 700 : 600,
                        cursor: 'pointer',
                        transition: 'all 0.15s ease',
                        boxShadow: isActive ? '0 1px 3px rgba(0,0,0,0.15)' : 'none',
                      }}
                    >
                      {item.label}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          <div style={{ width: '100%', height: '130px', marginTop: '2px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trendData} margin={{ top: 4, right: 8, left: -24, bottom: 0 }}>
                <defs>
                  <linearGradient id="completedGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={currentCategory?.color || '#10B981'} stopOpacity={0.4} />
                    <stop offset="95%" stopColor={currentCategory?.color || '#10B981'} stopOpacity={0.0} />
                  </linearGradient>
                  <linearGradient id="totalGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#3B82F6" stopOpacity={0.0} />
                  </linearGradient>
                  {/* Category gradients for All Categories multi-line view */}
                  {activeCategories.map((cat) => (
                    <linearGradient key={`grad-${cat.id}`} id={`grad_${cat.id}`} x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={cat.color || '#3B82F6'} stopOpacity={0.35} />
                      <stop offset="95%" stopColor={cat.color || '#3B82F6'} stopOpacity={0.0} />
                    </linearGradient>
                  ))}
                </defs>
                <XAxis dataKey="day" stroke="#94A3B8" fontSize={10} tickLine={false} />
                <YAxis stroke="#94A3B8" fontSize={10} tickLine={false} allowDecimals={false} />
                <Tooltip content={<CustomTrendTooltip />} />
                {selectedTrendCategory === 'all' && activeCategories.length > 0 && (
                  <Legend
                    wrapperStyle={{ fontSize: '0.68rem', paddingTop: '2px' }}
                    height={20}
                    iconType="circle"
                  />
                )}

                {selectedTrendCategory === 'all' ? (
                  activeCategories.length > 0 ? (
                    <>
                      {activeCategories.map((cat) => (
                        <Area
                          key={cat.id}
                          type="monotone"
                          dataKey={`cat_${cat.id}`}
                          name={cat.name}
                          stroke={cat.color || '#3B82F6'}
                          strokeWidth={2}
                          fillOpacity={1}
                          fill={`url(#grad_${cat.id})`}
                        />
                      ))}
                      <Area
                        type="monotone"
                        dataKey="total"
                        name="Total All Tasks"
                        stroke="#94A3B8"
                        strokeWidth={1.2}
                        strokeDasharray="4 4"
                        fillOpacity={1}
                        fill="url(#totalGrad)"
                      />
                    </>
                  ) : (
                    <>
                      <Area
                        type="monotone"
                        dataKey="completed"
                        name="Completed Tasks"
                        stroke="#10B981"
                        strokeWidth={2}
                        fillOpacity={1}
                        fill="url(#completedGrad)"
                      />
                      <Area
                        type="monotone"
                        dataKey="total"
                        name="Total Tasks"
                        stroke="#3B82F6"
                        strokeWidth={1.5}
                        strokeDasharray="4 4"
                        fillOpacity={1}
                        fill="url(#totalGrad)"
                      />
                    </>
                  )
                ) : (
                  <>
                    <Area
                      type="monotone"
                      dataKey="completed"
                      name={`${currentCategory?.name || 'Category'} Completed`}
                      stroke={currentCategory?.color || '#10B981'}
                      strokeWidth={2}
                      fillOpacity={1}
                      fill="url(#completedGrad)"
                    />
                    <Area
                      type="monotone"
                      dataKey="total"
                      name={`${currentCategory?.name || 'Category'} Total`}
                      stroke={currentCategory?.color || '#3B82F6'}
                      strokeWidth={1.5}
                      strokeDasharray="4 4"
                      fillOpacity={1}
                      fill="url(#totalGrad)"
                    />
                  </>
                )}
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* Category Workload Distribution Donut Chart (4 Columns) */}
        <motion.div
          variants={cardVariants}
          className="card"
          style={{ gridColumn: 'span 4', padding: '10px 16px', display: 'flex', flexDirection: 'column', gap: '6px' }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h2 className="card-title" style={{ margin: 0, fontSize: '0.92rem' }}>
                <PieChartIcon size={16} color="var(--primary-color)" />
                Workload by Category
              </h2>
              <span className="card-subtitle" style={{ fontSize: '0.72rem' }}>Distribution across active tasks</span>
            </div>
          </div>

          <div style={{ width: '100%', height: '130px', position: 'relative' }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={categoryData}
                  cx="50%"
                  cy="50%"
                  innerRadius={28}
                  outerRadius={48}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {categoryData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color || '#1769FF'} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value, name) => [`${value} tasks`, name]}
                  contentStyle={{
                    background: '#0F172A',
                    borderRadius: '8px',
                    border: '1px solid #334155',
                    color: '#FFFFFF',
                    fontSize: '0.75rem',
                  }}
                />
                <Legend
                  verticalAlign="bottom"
                  height={22}
                  iconType="circle"
                  formatter={(value) => (
                    <span style={{ fontSize: '0.68rem', color: 'var(--text-secondary)', fontWeight: 600 }}>
                      {value}
                    </span>
                  )}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </motion.div>
      </div>

      {/* 5. Progress Overview (Full-Width Top Summary) */}
      <motion.div variants={cardVariants} className="card" style={{ padding: '14px 22px', width: '100%' }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '16px',
          }}
        >
          {/* Left: Icon, Title & Performance Badge */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '10px',
                background: 'rgba(var(--primary-rgb, 23, 105, 255), 0.15)',
                border: '1px solid rgba(var(--primary-rgb, 23, 105, 255), 0.3)',
                color: 'var(--primary-color)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <TrendingUp size={19} strokeWidth={2.2} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <h2 className="card-title" style={{ margin: 0, fontSize: '1.02rem', fontWeight: 700 }}>
                  Progress Overview
                </h2>
                <span
                  style={{
                    background: todayStats.percentage === 100 ? '#ECFDF5' : '#EFF6FF',
                    color: todayStats.percentage === 100 ? '#059669' : '#1D4ED8',
                    border: `1px solid ${todayStats.percentage === 100 ? '#A7F3D0' : '#BFDBFE'}`,
                    padding: '2px 8px',
                    borderRadius: '999px',
                    fontSize: '0.72rem',
                    fontWeight: 700,
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                  }}
                >
                  {todayStats.percentage === 100 ? (
                    <>
                      <Sparkles size={11} /> Perfect Day
                    </>
                  ) : (
                    <>
                      <Zap size={11} /> {todayStats.completed}/{todayStats.total} Done
                    </>
                  )}
                </span>
              </div>
              <span style={{ fontSize: '0.76rem', color: 'var(--text-secondary)' }}>
                Real-time daily & monthly completion velocity
              </span>
            </div>
          </div>

          {/* Center: Dual Animated Circular Rings */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '28px' }}>
            <ProgressRing
              radius={34}
              stroke={5.5}
              progress={todayStats.percentage}
              color="var(--primary-color)"
              label="Today"
              animateOnMount={true}
            />
            <ProgressRing
              radius={34}
              stroke={5.5}
              progress={currentMonthStats.percentage}
              color="var(--success)"
              label="This Month"
              animateOnMount={true}
            />
          </div>

          {/* Right: Dual Progress Bars */}
          <div style={{ minWidth: '240px', flex: '1 1 260px', maxWidth: '380px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.76rem', marginBottom: '3px' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Today's Tasks Done</span>
                <strong>{todayStats.completed} / {todayStats.total}</strong>
              </div>
              <ProgressBar progress={todayStats.percentage} color="var(--primary-color)" animateOnMount={true} />
            </div>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.76rem', marginBottom: '3px' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Monthly Target</span>
                <strong>{currentMonthStats.completed} / {currentMonthStats.total}</strong>
              </div>
              <ProgressBar progress={currentMonthStats.percentage} color="var(--success)" animateOnMount={true} />
            </div>
          </div>
        </div>
      </motion.div>

      {/* 6. Today's Schedule Sequence (Full Screen Width) */}
      <motion.div variants={cardVariants} className="card" style={{ padding: '16px 20px', width: '100%' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', flexWrap: 'wrap', gap: '10px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div
              style={{
                width: '38px',
                height: '38px',
                borderRadius: '10px',
                background: '#0284C7',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 2px 8px rgba(2, 132, 199, 0.35)',
                color: '#ffffff',
                flexShrink: 0,
              }}
            >
              <CalendarDays size={20} strokeWidth={2.2} />
            </div>
            <div>
              <h2 className="card-title" style={{ margin: 0, fontSize: '1.08rem', fontWeight: 700 }}>
                Today's Schedule Sequence
              </h2>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                Stay on track with your planned tasks
              </span>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', fontWeight: 600 }}>
              {formatDate(todayStr, { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })}
            </span>
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '3px 10px',
                borderRadius: '9999px',
                background: 'rgba(16, 185, 129, 0.15)',
                border: '1px solid rgba(16, 185, 129, 0.4)',
                color: '#10B981',
                fontSize: '0.72rem',
                fontWeight: 700,
              }}
            >
              <span className="live-pulse-dot" style={{ width: '6px', height: '6px' }} />
              Live
            </span>
            <button
              type="button"
              className="btn btn-ghost btn-sm"
              onClick={() => navigate('/calendar')}
              style={{ color: 'var(--primary-color)', fontWeight: 700, gap: '4px', fontSize: '0.78rem', padding: '4px 8px' }}
            >
              Calendar View <ArrowRight size={13} />
            </button>
          </div>
        </div>

        {/* Daily Schedule Timeline with Sequential Cascade Animation */}
        <DailyScheduleTimeline
          date={todayStr}
          compact={true}
          showHeader={false}
          showActions={true}
          readOnly={false}
          animatedCascade={true}
          includeEvents={true}
          maxItems={10}
        />
      </motion.div>

      {/* 365-Day Task Contribution Graph (Heatmap) */}
      <motion.div
        variants={cardVariants}
        className="card"
        style={{
          padding: '20px 24px',
          width: '100%',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Heatmap Card Header */}
        <div
          style={{
            display: 'flex',
            alignItems: 'flex-start',
            justifyContent: 'space-between',
            marginBottom: '16px',
            flexWrap: 'wrap',
            gap: '12px',
          }}
        >
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <h2
                style={{
                  fontSize: '1.12rem',
                  fontWeight: 800,
                  color: 'var(--text-primary)',
                  margin: 0,
                  letterSpacing: '-0.01em',
                }}
              >
                365-Day Task Contribution Graph
              </h2>
              {heatmapStats.currentStreak > 0 && (
                <span
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                    fontSize: '0.74rem',
                    fontWeight: 700,
                    padding: '3px 10px',
                    borderRadius: '9999px',
                    background: 'rgba(245, 158, 11, 0.15)',
                    color: '#F59E0B',
                    border: '1px solid rgba(245, 158, 11, 0.35)',
                  }}
                  title="Consecutive daily task completion streak"
                >
                  <Flame size={12} /> {heatmapStats.currentStreak}d Streak
                </span>
              )}
            </div>
            <p
              style={{
                fontSize: '0.82rem',
                color: 'var(--text-secondary)',
                margin: '4px 0 0 0',
              }}
            >
              Overall consistency across all completed tasks over the past 52 weeks
            </p>
          </div>

          {/* Legend */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '0.74rem',
              color: 'var(--text-muted)',
              userSelect: 'none',
            }}
          >
            <span>Less</span>
            <span
              style={{
                width: '11px',
                height: '11px',
                borderRadius: '3px',
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                display: 'inline-block',
              }}
              title="0 tasks"
            />
            <span
              style={{
                width: '11px',
                height: '11px',
                borderRadius: '3px',
                background: 'rgba(16, 185, 129, 0.35)',
                display: 'inline-block',
              }}
              title="1 task"
            />
            <span
              style={{
                width: '11px',
                height: '11px',
                borderRadius: '3px',
                background: 'rgba(16, 185, 129, 0.65)',
                display: 'inline-block',
              }}
              title="2 tasks"
            />
            <span
              style={{
                width: '11px',
                height: '11px',
                borderRadius: '3px',
                background: '#10B981',
                display: 'inline-block',
              }}
              title="3 tasks"
            />
            <span
              style={{
                width: '11px',
                height: '11px',
                borderRadius: '3px',
                background: '#34D399',
                boxShadow: '0 0 6px rgba(52, 211, 153, 0.5)',
                display: 'inline-block',
              }}
              title="4+ tasks"
            />
            <span>More</span>
          </div>
        </div>

        {/* Heatmap Grid */}
        <div style={{ overflowX: 'auto', paddingBottom: '8px' }}>
          <div style={{ minWidth: '760px' }}>
            {/* Months row */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '28px repeat(52, 1fr)',
                gap: '3px',
                marginBottom: '6px',
                fontSize: '0.72rem',
                color: 'var(--text-muted)',
                fontWeight: 600,
              }}
            >
              <div />
              {monthLabels.map((m, idx) => (
                <div
                  key={idx}
                  style={{
                    gridColumnStart: m.col + 2,
                    textAlign: 'left',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {m.label}
                </div>
              ))}
            </div>

            {/* 7-Row Grid with Mon, Wed, Fri labels */}
            <div style={{ display: 'flex', gap: '6px' }}>
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  height: '95px',
                  fontSize: '0.68rem',
                  color: 'var(--text-muted)',
                  fontWeight: 600,
                  paddingRight: '6px',
                  width: '28px',
                  flexShrink: 0,
                  userSelect: 'none',
                }}
              >
                <span>Mon</span>
                <span>Wed</span>
                <span>Fri</span>
              </div>

              {/* 52 Columns */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(52, 1fr)',
                  gap: '3px',
                  flex: 1,
                }}
              >
                {Array.from({ length: 52 }).map((_, colIdx) => {
                  const weekDays = heatmapDays.slice(colIdx * 7, colIdx * 7 + 7);
                  return (
                    <div
                      key={colIdx}
                      style={{
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '3px',
                      }}
                    >
                      {weekDays.map((day) => {
                        const count = completedTaskCountsByDate[day.dateStr] || 0;
                        const isTodayDate = day.dateStr === todayStr;

                        let bg = 'rgba(255, 255, 255, 0.04)';
                        let border = '1px solid rgba(255, 255, 255, 0.07)';

                        if (day.isFuture) {
                          bg = 'transparent';
                          border = '1px dashed rgba(255, 255, 255, 0.05)';
                        } else if (count >= 4) {
                          bg = '#34D399';
                          border = '1px solid #10B981';
                        } else if (count === 3) {
                          bg = '#10B981';
                          border = '1px solid #059669';
                        } else if (count === 2) {
                          bg = 'rgba(16, 185, 129, 0.65)';
                          border = '1px solid rgba(16, 185, 129, 0.8)';
                        } else if (count === 1) {
                          bg = 'rgba(16, 185, 129, 0.35)';
                          border = '1px solid rgba(16, 185, 129, 0.5)';
                        }

                        if (isTodayDate) {
                          border = '1.5px solid var(--primary-color)';
                        }

                        return (
                          <div
                            key={day.dateStr}
                            style={{
                              width: '100%',
                              aspectRatio: '1 / 1',
                              minWidth: '10px',
                              minHeight: '10px',
                              borderRadius: '3px',
                              background: bg,
                              border,
                              cursor: day.isFuture ? 'default' : 'pointer',
                              transition: 'transform 0.15s ease, filter 0.15s ease',
                              boxShadow: count >= 3 ? '0 0 5px rgba(16, 185, 129, 0.4)' : 'none',
                            }}
                            onMouseEnter={(e) => {
                              if (day.isFuture) return;
                              const rect = e.currentTarget.getBoundingClientRect();
                              setHeatmapTooltip({
                                x: rect.left + rect.width / 2,
                                y: rect.top - 8,
                                dateStr: day.dateStr,
                                count,
                              });
                            }}
                            onMouseLeave={() => setHeatmapTooltip(null)}
                          />
                        );
                      })}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Floating Tooltip */}
        {heatmapTooltip && (
          <div
            style={{
              position: 'fixed',
              left: `${heatmapTooltip.x}px`,
              top: `${heatmapTooltip.y}px`,
              transform: 'translate(-50%, -100%)',
              background: '#0F172A',
              color: '#FFFFFF',
              border: '1px solid #334155',
              padding: '6px 12px',
              borderRadius: '6px',
              fontSize: '0.75rem',
              fontWeight: 600,
              pointerEvents: 'none',
              zIndex: 9999,
              boxShadow: '0 8px 16px rgba(0, 0, 0, 0.4)',
              whiteSpace: 'nowrap',
            }}
          >
            <div style={{ color: heatmapTooltip.count > 0 ? '#34D399' : 'var(--text-muted)' }}>
              {heatmapTooltip.count} task{heatmapTooltip.count === 1 ? '' : 's'} completed
            </div>
            <div style={{ fontSize: '0.68rem', color: '#94A3B8' }}>
              {formatDate(heatmapTooltip.dateStr, { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}
            </div>
          </div>
        )}
      </motion.div>

      {/* Smart Schedule Auto-Balancing Modal */}
      <SmartRescheduleModal
        isOpen={isRescheduleOpen}
        onClose={() => setIsRescheduleOpen(false)}
      />
    </motion.div>
  );
}
