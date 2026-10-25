import React, { useMemo } from 'react';
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
  CalendarCheck2,
  CalendarRange,
  ArrowRight,
  TrendingUp,
  Sparkles,
  SunMedium,
  Sun,
  MoonStar,
  Target,
  Trophy,
  BarChart3,
  ChevronRight,
  Zap,
  PieChart as PieChartIcon,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { getTodayDateString, formatDate } from '../utils/dateUtils';
import {
  calculateTaskStats,
  calculateMonthlyStats,
  getWeeklyProductivityTrend,
  getCategoryDistribution,
} from '../utils/statistics';
import { ProgressRing, ProgressBar } from '../components/common/ProgressRing';
import { DailyScheduleTimeline } from '../components/tasks/DailyScheduleTimeline';
import { WorkHoursClock } from '../components/dashboard/WorkHoursClock';

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
        }}
      >
        <div style={{ fontWeight: 800, marginBottom: '6px', color: '#94A3B8' }}>{label}</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#10B981' }} />
            <span>Completed: <strong style={{ color: '#10B981' }}>{payload[0]?.value || 0}</strong></span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#3B82F6' }} />
            <span>Total Planned: <strong style={{ color: '#38BDF8' }}>{payload[1]?.value || 0}</strong></span>
          </div>
        </div>
      </div>
    );
  }
  return null;
}

export function Dashboard() {
  const navigate = useNavigate();
  const { tasks, categories, user } = useApp();

  const todayStr = getTodayDateString();
  const todayTasks = useMemo(() => tasks.filter((t) => t.date === todayStr), [tasks, todayStr]);
  const todayStats = useMemo(() => calculateTaskStats(todayTasks), [todayTasks]);

  const now = new Date();
  const currentMonthStats = useMemo(
    () => calculateMonthlyStats(tasks, now.getFullYear(), now.getMonth()),
    [tasks, now]
  );

  // Recharts Data
  const weeklyTrendData = useMemo(() => getWeeklyProductivityTrend(tasks), [tasks]);
  const categoryData = useMemo(() => {
    const dist = getCategoryDistribution(tasks, categories);
    return dist.filter((c) => c.value > 0);
  }, [tasks, categories]);

  // Greeting & Time Context
  const hour = now.getHours();
  let greeting = 'Good Morning';
  let TimeIcon = SunMedium;
  let timeIconColor = '#FBBF24';
  let quote = 'Set your daily priorities and focus on key outcomes.';

  if (hour >= 12 && hour < 17) {
    greeting = 'Good Afternoon';
    TimeIcon = Sun;
    timeIconColor = '#F59E0B';
    quote = 'Maintain steady focus and track your afternoon deliverables.';
  } else if (hour >= 17) {
    greeting = 'Good Evening';
    TimeIcon = MoonStar;
    timeIconColor = '#A78BFA';
    quote = 'Review today’s tracking analytics, celebrate progress, and recharge.';
  }

  // Next 4 upcoming tasks for informational preview
  const upcomingTasks = useMemo(
    () =>
      tasks
        .filter((t) => t.date > todayStr)
        .sort((a, b) => a.date.localeCompare(b.date) || (a.startTime || '').localeCompare(b.startTime || ''))
        .slice(0, 4),
    [tasks, todayStr]
  );

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      style={{ display: 'flex', flexDirection: 'column', gap: '26px' }}
    >
      {/* 1. Welcome Hero Banner (Information & Tracking Header) */}
      <motion.section
        variants={cardVariants}
        className="card"
        style={{
          background: 'linear-gradient(135deg, #091E42 0%, #0F2D6B 45%, #1769FF 100%)',
          color: '#ffffff',
          padding: '28px 34px',
          position: 'relative',
          overflow: 'hidden',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '20px',
          border: '1px solid rgba(255, 255, 255, 0.16)',
        }}
      >
        <div style={{ zIndex: 2, maxWidth: '640px' }}>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              padding: '5px 14px',
              borderRadius: '9999px',
              background: 'rgba(255, 255, 255, 0.12)',
              fontSize: '0.8rem',
              fontWeight: 600,
              marginBottom: '12px',
              border: '1px solid rgba(255, 255, 255, 0.22)',
            }}
          >
            <span className="live-pulse-dot" />
            <TimeIcon size={14} color={timeIconColor} className="subtle-float" />
            <span>Productivity Analytics & Tracking Dashboard</span>
          </div>

          <h1 style={{ fontSize: 'clamp(1.6rem, 3vw, 2.2rem)', fontWeight: 800, lineHeight: 1.2, color: '#ffffff' }}>
            {greeting}, {user.name}! <span className="waving-hand">👋</span>
          </h1>

          <p style={{ color: '#E2E8F0', marginTop: '8px', fontSize: '0.96rem', lineHeight: 1.5 }}>
            "{quote}" Tracking{' '}
            <strong style={{ color: '#38BDF8', fontWeight: 700 }}>
              {todayStats.completed} of {todayStats.total} tasks completed
            </strong>{' '}
            for today.
          </p>

          <div style={{ display: 'flex', gap: '12px', marginTop: '16px', flexWrap: 'wrap' }}>
            <motion.button
              type="button"
              className="btn btn-sm"
              whileHover={{ scale: 1.03, x: 2 }}
              whileTap={{ scale: 0.97 }}
              style={{
                background: 'rgba(255, 255, 255, 0.18)',
                color: '#FFFFFF',
                border: '1px solid rgba(255, 255, 255, 0.3)',
                fontWeight: 700,
                padding: '6px 14px',
              }}
              onClick={() => navigate('/today')}
            >
              Open Full Tasks Workspace <ArrowRight size={14} />
            </motion.button>
          </div>
        </div>

        {/* Hero Right Graphic Stats Pod */}
        <motion.div
          whileHover={{ scale: 1.02 }}
          transition={{ duration: 0.2 }}
          style={{
            zIndex: 1,
            display: 'flex',
            alignItems: 'center',
            gap: '20px',
            background: 'rgba(255, 255, 255, 0.1)',
            backdropFilter: 'blur(12px)',
            padding: '18px 24px',
            borderRadius: 'var(--radius-xl)',
            border: '1px solid rgba(255, 255, 255, 0.22)',
          }}
        >
          <div style={{ textAlign: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
              <Target size={18} color="#38BDF8" />
              <span style={{ fontSize: '1.9rem', fontWeight: 800 }}>{todayStats.percentage}%</span>
            </div>
            <div style={{ fontSize: '0.78rem', color: '#CBD5E1', marginTop: '2px', fontWeight: 600 }}>
              Today's Goal
            </div>
          </div>
          <div style={{ width: '1px', height: '42px', background: 'rgba(255, 255, 255, 0.2)' }} />
          <div style={{ textAlign: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
              <Trophy size={18} color="#FBBF24" />
              <span style={{ fontSize: '1.9rem', fontWeight: 800 }}>{currentMonthStats.completed}</span>
            </div>
            <div style={{ fontSize: '0.78rem', color: '#CBD5E1', marginTop: '2px', fontWeight: 600 }}>
              Done this Month
            </div>
          </div>
        </motion.div>
      </motion.section>

      {/* 2. Today's Work Hours Live Clock Widget Card (Digital LED + Analog Clock) */}
      <motion.section variants={cardVariants}>
        <WorkHoursClock tasks={tasks} />
      </motion.section>

      {/* 3. Metric Summary Cards */}
      <motion.section
        variants={cardVariants}
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: '18px',
        }}
      >
        {/* Total Tasks */}
        <div className="dash-stat-card total" onClick={() => navigate('/today')}>
          <div
            className="dash-stat-icon-wrapper"
            style={{ background: '#EFF6FF', color: '#2563EB', borderColor: '#BFDBFE' }}
          >
            <ListTodo size={24} strokeWidth={2.2} />
          </div>
          <div>
            <div style={{ fontSize: '0.84rem', color: 'var(--text-secondary)', fontWeight: 600 }}>
              Total Tasks (Today)
            </div>
            <div style={{ fontSize: '1.85rem', fontWeight: 800, color: 'var(--text-primary)', lineHeight: 1.15 }}>
              {todayStats.total}
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '2px' }}>
              Scheduled for today
            </div>
          </div>
        </div>

        {/* Completed */}
        <div className="dash-stat-card completed" onClick={() => navigate('/today')}>
          <div
            className="dash-stat-icon-wrapper"
            style={{ background: '#ECFDF5', color: '#059669', borderColor: '#A7F3D0' }}
          >
            <CheckCheck size={26} strokeWidth={2.4} />
          </div>
          <div>
            <div style={{ fontSize: '0.84rem', color: 'var(--text-secondary)', fontWeight: 600 }}>
              Completed
            </div>
            <div style={{ fontSize: '1.85rem', fontWeight: 800, color: '#059669', lineHeight: 1.15 }}>
              {todayStats.completed}
            </div>
            <div style={{ fontSize: '0.75rem', color: '#059669', fontWeight: 600, marginTop: '2px' }}>
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
            <Clock size={24} strokeWidth={2.2} />
          </div>
          <div>
            <div style={{ fontSize: '0.84rem', color: 'var(--text-secondary)', fontWeight: 600 }}>
              Pending
            </div>
            <div style={{ fontSize: '1.85rem', fontWeight: 800, color: '#D97706', lineHeight: 1.15 }}>
              {todayStats.pending}
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '2px' }}>
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
            <AlertTriangle size={24} strokeWidth={2.2} />
          </div>
          <div>
            <div style={{ fontSize: '0.84rem', color: 'var(--text-secondary)', fontWeight: 600 }}>
              Overdue
            </div>
            <div style={{ fontSize: '1.85rem', fontWeight: 800, color: '#DC2626', lineHeight: 1.15 }}>
              {todayStats.overdue}
            </div>
            <div
              style={{
                fontSize: '0.75rem',
                color: todayStats.overdue > 0 ? '#DC2626' : 'var(--text-muted)',
                fontWeight: todayStats.overdue > 0 ? 700 : 400,
                marginTop: '2px',
              }}
            >
              {todayStats.overdue > 0 ? 'Requires attention' : 'All clear! No overdue tasks'}
            </div>
          </div>
        </div>
      </motion.section>

      {/* 4. Production Analytics Charts Row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(12, 1fr)', gap: '20px' }}>
        {/* Weekly Productivity Trend Area Chart (8 Columns) */}
        <motion.div
          variants={cardVariants}
          className="card"
          style={{ gridColumn: 'span 8', padding: '24px', display: 'flex', flexDirection: 'column', gap: '14px' }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h2 className="card-title" style={{ margin: 0, fontSize: '1.1rem' }}>
                <TrendingUp size={20} color="var(--primary-color)" />
                Weekly Productivity Trend
              </h2>
              <span className="card-subtitle">
                Completed vs scheduled tasks over the last 7 days
              </span>
            </div>
            <span
              style={{
                background: '#EFF6FF',
                color: '#1D4ED8',
                border: '1px solid #BFDBFE',
                padding: '4px 10px',
                borderRadius: '999px',
                fontSize: '0.75rem',
                fontWeight: 700,
              }}
            >
              Past 7 Days
            </span>
          </div>

          <div style={{ width: '100%', height: '240px', marginTop: '10px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={weeklyTrendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="completedGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10B981" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#10B981" stopOpacity={0.0} />
                  </linearGradient>
                  <linearGradient id="totalGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#3B82F6" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="day" stroke="#94A3B8" fontSize={12} tickLine={false} />
                <YAxis stroke="#94A3B8" fontSize={12} tickLine={false} allowDecimals={false} />
                <Tooltip content={<CustomTrendTooltip />} />
                <Area
                  type="monotone"
                  dataKey="completed"
                  name="Completed Tasks"
                  stroke="#10B981"
                  strokeWidth={2.5}
                  fillOpacity={1}
                  fill="url(#completedGrad)"
                />
                <Area
                  type="monotone"
                  dataKey="total"
                  name="Total Tasks"
                  stroke="#3B82F6"
                  strokeWidth={2}
                  strokeDasharray="4 4"
                  fillOpacity={1}
                  fill="url(#totalGrad)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* Category Workload Distribution Donut Chart (4 Columns) */}
        <motion.div
          variants={cardVariants}
          className="card"
          style={{ gridColumn: 'span 4', padding: '24px', display: 'flex', flexDirection: 'column', gap: '14px' }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h2 className="card-title" style={{ margin: 0, fontSize: '1.1rem' }}>
                <PieChartIcon size={20} color="var(--primary-color)" />
                Workload by Category
              </h2>
              <span className="card-subtitle">Distribution across active tasks</span>
            </div>
          </div>

          <div style={{ width: '100%', height: '240px', position: 'relative' }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={categoryData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={75}
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
                    fontSize: '0.8rem',
                  }}
                />
                <Legend
                  verticalAlign="bottom"
                  height={36}
                  iconType="circle"
                  formatter={(value) => (
                    <span style={{ fontSize: '0.74rem', color: 'var(--text-secondary)', fontWeight: 600 }}>
                      {value}
                    </span>
                  )}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </motion.div>
      </div>

      {/* 5. Schedule Tracking & Progress Overview Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(12, 1fr)', gap: '24px' }}>
        {/* Left Column (8 cols): Daily Schedule Timeline (Pure Tracking Feed with Sequential Cascade Motion) */}
        <div style={{ gridColumn: 'span 8', display: 'flex', flexDirection: 'column', gap: '24px' }} className="dash-col-left">
          <motion.div variants={cardVariants} className="card" style={{ padding: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <div>
                <h2 className="card-title" style={{ margin: 0 }}>
                  <Clock size={20} color="var(--primary-color)" />
                  Today's Schedule Sequence
                </h2>
                <span className="card-subtitle">
                  {formatDate(todayStr, { weekday: 'long', month: 'short', day: 'numeric' })} • Chronological tracking feed
                </span>
              </div>
              <button
                type="button"
                className="btn btn-ghost btn-sm"
                onClick={() => navigate('/calendar')}
                style={{ color: 'var(--primary-color)', fontWeight: 700, gap: '4px' }}
              >
                Calendar View <ArrowRight size={14} />
              </button>
            </div>

            {/* Daily Schedule Timeline with Sequential Cascade Animation (First 1, then 2, then 3...) */}
            <DailyScheduleTimeline
              date={todayStr}
              compact={false}
              showHeader={false}
              showActions={false}
              readOnly={true}
              animatedCascade={true}
              includeEvents={true}
              maxItems={6}
            />
          </motion.div>
        </div>

        {/* Right Column (4 cols): Progress Overview (0 to N Animation) & Upcoming Preview */}
        <div style={{ gridColumn: 'span 4', display: 'flex', flexDirection: 'column', gap: '24px' }} className="dash-col-right">
          {/* Progress Overview Card with 0 to N Counting Animation */}
          <motion.div variants={cardVariants} className="card" style={{ padding: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h2 className="card-title" style={{ margin: 0 }}>
                <TrendingUp size={20} color="var(--primary-color)" />
                Progress Overview
              </h2>

              <span
                style={{
                  background: todayStats.percentage === 100 ? '#ECFDF5' : '#EFF6FF',
                  color: todayStats.percentage === 100 ? '#059669' : '#1D4ED8',
                  border: `1px solid ${todayStats.percentage === 100 ? '#A7F3D0' : '#BFDBFE'}`,
                  padding: '3px 9px',
                  borderRadius: '999px',
                  fontSize: '0.74rem',
                  fontWeight: 700,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px',
                }}
              >
                {todayStats.percentage === 100 ? (
                  <>
                    <Sparkles size={12} /> Perfect Day
                  </>
                ) : (
                  <>
                    <Zap size={12} /> {todayStats.completed}/{todayStats.total} Done
                  </>
                )}
              </span>
            </div>

            {/* Progress Rings counting up from 0 to N */}
            <div style={{ display: 'flex', justifyContent: 'space-around', alignItems: 'center', padding: '10px 0 20px' }}>
              <ProgressRing
                radius={48}
                stroke={7}
                progress={todayStats.percentage}
                color="var(--primary-color)"
                label="Today"
                animateOnMount={true}
              />
              <ProgressRing
                radius={48}
                stroke={7}
                progress={currentMonthStats.percentage}
                color="var(--success)"
                label="This Month"
                animateOnMount={true}
              />
            </div>

            {/* Horizontal Progress Bars with 0 to N animation */}
            <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', marginBottom: '6px' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>Today's Tasks Done</span>
                  <strong>{todayStats.completed} / {todayStats.total}</strong>
                </div>
                <ProgressBar progress={todayStats.percentage} color="var(--primary-color)" animateOnMount={true} />
              </div>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', marginBottom: '6px' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>Monthly Target</span>
                  <strong>{currentMonthStats.completed} / {currentMonthStats.total}</strong>
                </div>
                <ProgressBar progress={currentMonthStats.percentage} color="var(--success)" animateOnMount={true} />
              </div>
            </div>
          </motion.div>

          {/* Upcoming Schedule Horizon */}
          <motion.div variants={cardVariants} className="card" style={{ padding: '24px' }}>
            <div className="card-header-flex">
              <h2 className="card-title">
                <CalendarDays size={20} color="var(--primary-color)" />
                Upcoming Schedule
              </h2>
              <button
                type="button"
                className="btn btn-ghost btn-sm"
                onClick={() => navigate('/monthly')}
                style={{ color: 'var(--primary-color)', fontSize: '0.78rem', fontWeight: 600 }}
              >
                Schedule
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {upcomingTasks.length === 0 ? (
                <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', textAlign: 'center', padding: '20px' }}>
                  No upcoming tasks scheduled.
                </div>
              ) : (
                upcomingTasks.map((t) => {
                  const cat = categories.find((c) => c.id === t.categoryId) || { color: '#1769FF' };
                  return (
                    <div
                      key={t.id}
                      style={{
                        padding: '10px 14px',
                        borderRadius: 'var(--radius-md)',
                        background: 'var(--page-bg)',
                        border: '1px solid var(--border-color)',
                      }}
                      className="upcoming-task-item"
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: '0.88rem', fontWeight: 600 }}>{t.title}</span>
                        <span
                          style={{
                            fontSize: '0.72rem',
                            fontWeight: 700,
                            padding: '2px 6px',
                            borderRadius: '4px',
                            background: `${cat.color}18`,
                            color: cat.color,
                          }}
                        >
                          {t.date}
                        </span>
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                        {t.startTime} - {t.endTime}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </motion.div>

          {/* Quick Navigation Cards */}
          <motion.div variants={cardVariants} className="card" style={{ padding: '22px' }}>
            <h3 style={{ fontSize: '0.96rem', fontWeight: 700, marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Zap size={16} color="var(--primary-color)" />
              Quick Navigation
            </h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {/* Tile 1: Today's Tasks */}
              <button
                type="button"
                className="quick-nav-tile"
                onClick={() => navigate('/today')}
              >
                <div
                  className="quick-nav-icon-pod"
                  style={{ background: '#EFF6FF', border: '1px solid #BFDBFE', color: '#1D4ED8' }}
                >
                  <CalendarCheck2 size={19} />
                </div>
                <div>
                  <div style={{ fontSize: '0.86rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                    Today's Tasks
                  </div>
                  <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>
                    {todayStats.remaining} remaining for today
                  </div>
                </div>
                <ChevronRight size={16} className="quick-nav-chevron" />
              </button>

              {/* Tile 2: Monthly View */}
              <button
                type="button"
                className="quick-nav-tile"
                onClick={() => navigate('/monthly')}
              >
                <div
                  className="quick-nav-icon-pod"
                  style={{ background: '#F5F3FF', border: '1px solid #DDD6FE', color: '#7C3AED' }}
                >
                  <CalendarRange size={19} />
                </div>
                <div>
                  <div style={{ fontSize: '0.86rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                    Monthly View
                  </div>
                  <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>
                    Full schedule & timeline
                  </div>
                </div>
                <ChevronRight size={16} className="quick-nav-chevron" />
              </button>

              {/* Tile 3: My Goals */}
              <button
                type="button"
                className="quick-nav-tile"
                onClick={() => navigate('/goals')}
              >
                <div
                  className="quick-nav-icon-pod"
                  style={{ background: '#ECFDF5', border: '1px solid #A7F3D0', color: '#059669' }}
                >
                  <Target size={19} />
                </div>
                <div>
                  <div style={{ fontSize: '0.86rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                    My Goals
                  </div>
                  <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>
                    Auto-progress & milestones
                  </div>
                </div>
                <ChevronRight size={16} className="quick-nav-chevron" />
              </button>

              {/* Tile 4: Analytics */}
              <button
                type="button"
                className="quick-nav-tile"
                onClick={() => navigate('/reports')}
              >
                <div
                  className="quick-nav-icon-pod"
                  style={{ background: '#FFF7ED', border: '1px solid #FED7AA', color: '#C2410C' }}
                >
                  <BarChart3 size={19} />
                </div>
                <div>
                  <div style={{ fontSize: '0.86rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                    Analytics & Reports
                  </div>
                  <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>
                    Productivity trends & logs
                  </div>
                </div>
                <ChevronRight size={16} className="quick-nav-chevron" />
              </button>
            </div>
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
}
