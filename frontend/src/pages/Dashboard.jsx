import React, { useMemo, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import '../styles/pages/dashboard.css';
import api from '../services/api';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Legend,
} from 'recharts';
import {
  CheckCheck,
  Clock,
  AlertTriangle,
  ListTodo,
  CalendarCheck2,
  CircleCheckBig,
  Timer,
  CircleAlert,
  CalendarDays,
  Calendar,
  ArrowRight,
  TrendingUp,
  Zap,
  Flame,
  Sparkles,
  Target,
  Plus,
  FileText,
  CheckCircle2,
  Layers,
  RefreshCw,
  BookOpen,
  Quote,
  ShieldAlert,
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
import { CustomSelect } from '../components/common/CustomSelect';

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

// Custom High-Contrast Tooltip for Area Chart (100% Solid Opaque, No Transparency, Stacking Fix)
function CustomTrendTooltip({ active, payload, label }) {
  if (active && payload && payload.length) {
    const item = payload[0]?.payload;
    const title = item?.fullDate || label;

    // Deduplicate payload entries by name to prevent repeated categories
    const seenNames = new Set();
    const uniquePayload = [];
    payload.forEach((entry) => {
      if (entry && entry.name && !seenNames.has(entry.name)) {
        seenNames.add(entry.name);
        uniquePayload.push(entry);
      }
    });

    // Sort descending by value so active items are cleanly displayed at top
    uniquePayload.sort((a, b) => (Number(b.value) || 0) - (Number(a.value) || 0));

    return (
      <div
        style={{
          backgroundColor: 'var(--card-bg)',
          background: 'var(--card-bg)',
          border: '1.5px solid var(--border-color)',
          borderRadius: '10px',
          padding: '10px 14px',
          color: 'var(--text-primary)',
          fontSize: '0.82rem',
          boxShadow: 'var(--shadow-lg)',
          minWidth: '185px',
          maxWidth: '280px',
          zIndex: 999999,
          pointerEvents: 'none',
          position: 'relative',
          opacity: 1,
        }}
      >
        <div
          style={{
            fontWeight: 800,
            marginBottom: '8px',
            color: 'var(--text-primary)',
            fontSize: '0.84rem',
            borderBottom: '1px solid var(--border-color)',
            paddingBottom: '5px',
          }}
        >
          {title}
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          {uniquePayload.map((entry, idx) => (
            <div key={idx} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '14px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0, flex: 1 }}>
                <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: entry.color, flexShrink: 0 }} />
                <span style={{ color: 'var(--text-secondary)', fontSize: '0.78rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {entry.name}:
                </span>
              </div>
              <strong style={{ color: entry.color || 'var(--primary-color)', fontSize: '0.84rem', flexShrink: 0 }}>
                {entry.value || 0}
              </strong>
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
  const {
    tasks = [],
    categories = [],
    goals = [],
    workSessions = [],
    activeWorkSession,
    currentLiveWorkSeconds = 0,
    requests = [],
    user,
    selectedDate,
  } = useApp();

  const todayStr = getTodayDateString();
  const activeDate = selectedDate || todayStr;
  const isToday = activeDate === todayStr;
  const formattedActiveDate = formatDate(activeDate, { month: 'short', day: 'numeric' });

  const [habits, setHabits] = useState([]);
  const [dashSummary, setDashSummary] = useState(null);
  useEffect(() => {
    let mounted = true;
    api
      .getHabits()
      .then((res) => {
        if (!mounted) return;
        const list = Array.isArray(res?.data) ? res.data : Array.isArray(res) ? res : [];
        setHabits(list);
      })
      .catch(() => {});
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    let mounted = true;
    api
      .getDashboardSummary(activeDate)
      .then((res) => {
        if (!mounted) return;
        if (res?.data) setDashSummary(res.data);
      })
      .catch(() => {});
    return () => {
      mounted = false;
    };
  }, [activeDate]);

  const todayTasks = useMemo(() => tasks.filter((t) => t.date === activeDate), [tasks, activeDate]);
  const todayStats = useMemo(() => calculateTaskStats(todayTasks), [todayTasks]);

  // Website-related Bento Summaries (Work Tracker, Habits, Goals, Categories, Requests)
  const focusSummary = useMemo(() => {
    const daySessions = (workSessions || []).filter((s) => s.date === activeDate);
    const recordedSecs = daySessions.reduce((acc, s) => acc + (Number(s.durationSeconds) || 0), 0);
    const isRunningToday = Boolean(activeWorkSession?.isRunning && (activeWorkSession.date || todayStr) === activeDate);
    const totalSecs = isRunningToday ? Math.max(recordedSecs, currentLiveWorkSeconds || 0) : recordedSecs;
    const hrs = Math.floor(totalSecs / 3600);
    const mins = Math.floor((totalSecs % 3600) / 60);
    return {
      totalSecs,
      label: hrs > 0 ? `${hrs}h ${mins}m` : `${mins}m`,
      blocks: daySessions.length,
      isRunningToday,
    };
  }, [workSessions, activeWorkSession, currentLiveWorkSeconds, activeDate, todayStr]);

  const habitsSummary = useMemo(() => {
    const items = (habits || []).map((h) => {
      const logs = Array.isArray(h.logs) ? h.logs : [];
      const doneToday = logs.some((l) => l.date === activeDate && l.completed);
      const streak = h.currentStreak ?? h.streak ?? logs.filter((l) => l.completed).length;
      return { ...h, doneToday, streak };
    });
    const doneCount = items.filter((h) => h.doneToday).length;
    const bestStreak = items.reduce((max, h) => Math.max(max, h.streak || 0), 0);
    return { total: items.length, doneCount, bestStreak, top: items.slice(0, 4) };
  }, [habits, activeDate]);

  const goalsSummary = useMemo(() => {
    const list = (goals || []).map((g) => {
      const linked = tasks.filter((t) => t.goalId === g.id);
      const done = linked.filter((t) => t.status === 'completed' || t.completed).length;
      const pct = linked.length > 0 ? Math.round((done / linked.length) * 100) : Number(g.progress) || 0;
      return { ...g, linkedCount: linked.length, doneCount: done, pct };
    });
    const completedCount = list.filter((g) => g.status === 'completed' || g.pct >= 100).length;
    return { total: list.length, completedCount, top: list.slice(0, 4) };
  }, [goals, tasks]);

  const categoryDist = useMemo(() => {
    const base = todayTasks.length > 0 ? todayTasks : tasks;
    return getCategoryDistribution(base, categories).slice(0, 4);
  }, [todayTasks, tasks, categories]);

  const requestsSummary = useMemo(() => {
    const rescheduled = (requests || []).filter((r) => r.status === 'rescheduled').length;
    const pending = (requests || []).filter((r) => r.status === 'pending').length;
    return { rescheduled, pending, total: (requests || []).length };
  }, [requests]);

  const greetingText = useMemo(() => {
    const h = new Date().getHours();
    const prefix = h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening';
    const firstName = user?.name ? user.name.split(' ')[0] : '';
    return firstName ? `${prefix}, ${firstName}` : prefix;
  }, [user]);

  const now = new Date();
  const currentMonthStats = useMemo(
    () => calculateMonthlyStats(tasks, now.getFullYear(), now.getMonth()),
    [tasks, now]
  );

  // Recharts Data
  const [trendRange, setTrendRange] = useState('month'); // default to 'month' per user request
  const [selectedTrendCategory, setSelectedTrendCategory] = useState('all');

  // Clean, unique categories deduplicated by name
  const activeCategories = useMemo(() => {
    const seenNames = new Set();
    const unique = [];
    categories.forEach((c) => {
      if (!c || !c.name) return;
      const normalized = c.name.trim().toLowerCase();
      if (seenNames.has(normalized)) return;

      const hasTasks = tasks.some(
        (t) =>
          t.categoryId === c.id ||
          (typeof t.category === 'string' && t.category.toLowerCase().trim() === normalized) ||
          (t.category && typeof t.category === 'object' && t.category.name && t.category.name.toLowerCase().trim() === normalized)
      );

      if (hasTasks) {
        seenNames.add(normalized);
        unique.push(c);
      }
    });
    return unique;
  }, [categories, tasks]);

  // All distinct categories for the dropdown filter
  const allUniqueCategories = useMemo(() => {
    const seenNames = new Set();
    const unique = [];
    categories.forEach((c) => {
      if (!c || !c.name) return;
      const normalized = c.name.trim().toLowerCase();
      if (!seenNames.has(normalized)) {
        seenNames.add(normalized);
        unique.push(c);
      }
    });
    return unique;
  }, [categories]);

  const trendData = useMemo(
    () => getProductivityTrend(tasks, trendRange, selectedTrendCategory, activeCategories),
    [tasks, trendRange, selectedTrendCategory, activeCategories]
  );

  const currentCategory = useMemo(() => {
    if (selectedTrendCategory === 'all') return null;
    return categories.find((c) => String(c.id) === String(selectedTrendCategory) || c.name === selectedTrendCategory);
  }, [categories, selectedTrendCategory]);

  // Aggregate Total and Missed/Pending tasks per category over the selected trend window
  const categoryTrendTotals = useMemo(() => {
    const result = {};
    activeCategories.forEach((cat) => {
      let catTotal = 0;
      let catCompleted = 0;
      trendData.forEach((dp) => {
        catTotal += dp[`cat_${cat.id}_total`] || 0;
        catCompleted += dp[`cat_${cat.id}`] || 0;
      });
      result[cat.id] = {
        total: catTotal,
        completed: catCompleted,
        missed: Math.max(0, catTotal - catCompleted),
      };
    });
    return result;
  }, [activeCategories, trendData]);

  const categoryData = useMemo(() => {
    const dist = getCategoryDistribution(tasks, categories);
    return dist.filter((c) => c.value > 0);
  }, [tasks, categories]);

  // Goal filter for 365-Day Contribution Graph
  const [selectedHeatmapGoal, setSelectedHeatmapGoal] = useState('all');

  const filteredHeatmapTasks = useMemo(() => {
    if (!selectedHeatmapGoal || selectedHeatmapGoal === 'all') return tasks;
    return tasks.filter((t) => {
      if (t.goalId === selectedHeatmapGoal) return true;
      const g = goals.find((item) => item.id === selectedHeatmapGoal);
      if (g?.relatedTaskIds?.includes(t.id)) return true;
      return false;
    });
  }, [tasks, selectedHeatmapGoal, goals]);

  // 365-Day Activity Contribution Graph (Past 52 weeks = 364 days)
  const heatmapDays = useMemo(() => {
    const days = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const currentDayOfWeek = today.getDay(); // 0 is Sun, 1 is Mon...
    const daysFromMonday = (currentDayOfWeek + 6) % 7; // Mon=0, Tue=1, Wed=2, Thu=3, Fri=4, Sat=5, Sun=6

    // Monday of the current week
    const currentWeekMonday = new Date(today);
    currentWeekMonday.setDate(today.getDate() - daysFromMonday);

    // Starting Monday 51 weeks before this week
    const startDate = new Date(currentWeekMonday);
    startDate.setDate(currentWeekMonday.getDate() - 51 * 7);

    for (let i = 0; i < 52 * 7; i++) {
      const d = new Date(startDate);
      d.setDate(startDate.getDate() + i);

      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const dayNum = String(d.getDate()).padStart(2, '0');
      const dateStr = `${year}-${month}-${dayNum}`;

      days.push({
        date: d,
        dateStr,
        dayOfWeek: (d.getDay() + 6) % 7, // 0 is Mon, 6 is Sun
        month: d.getMonth(),
        year: d.getFullYear(),
        dayNumber: d.getDate(),
        isFuture: d > today,
      });
    }
    return days;
  }, []);

  // Map completed tasks count per date (using filteredHeatmapTasks with normalized date)
  const completedTaskCountsByDate = useMemo(() => {
    const counts = {};
    filteredHeatmapTasks.forEach((t) => {
      if (t.date && (t.status === 'completed' || t.completedAt)) {
        const dStr = typeof t.date === 'string' ? t.date.split('T')[0] : '';
        if (dStr) {
          counts[dStr] = (counts[dStr] || 0) + 1;
        }
      }
    });
    return counts;
  }, [filteredHeatmapTasks]);

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
    const todayFormatted = `${checkDate.getFullYear()}-${String(checkDate.getMonth() + 1).padStart(2, '0')}-${String(checkDate.getDate()).padStart(2, '0')}`;

    if (completedTaskCountsByDate[todayFormatted]) {
      currentStreak++;
      checkDate.setDate(checkDate.getDate() - 1);
    } else {
      checkDate.setDate(checkDate.getDate() - 1);
      const yStr = `${checkDate.getFullYear()}-${String(checkDate.getMonth() + 1).padStart(2, '0')}-${String(checkDate.getDate()).padStart(2, '0')}`;
      if (completedTaskCountsByDate[yStr]) {
        currentStreak++;
        checkDate.setDate(checkDate.getDate() - 1);
      }
    }
    if (currentStreak > 0) {
      while (true) {
        const dStr = `${checkDate.getFullYear()}-${String(checkDate.getMonth() + 1).padStart(2, '0')}-${String(checkDate.getDate()).padStart(2, '0')}`;
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

  // Month column labels accurately positioned above starting columns with year indicator
  const monthLabels = useMemo(() => {
    const labels = [];
    let lastMonth = -1;
    let lastCol = -10;

    for (let col = 0; col < 52; col++) {
      const weekDays = heatmapDays.slice(col * 7, col * 7 + 7);
      const firstDay = weekDays[0];
      const monthStartDay = weekDays.find((d) => d.dayNumber <= 7) || firstDay;

      if (monthStartDay && monthStartDay.month !== lastMonth) {
        if (col - lastCol >= 3) {
          const isYearTransition = labels.length === 0 || monthStartDay.year !== labels[labels.length - 1].year;
          lastMonth = monthStartDay.month;
          lastCol = col;
          labels.push({
            col,
            monthIndex: monthStartDay.month,
            year: monthStartDay.year,
            shortLabel: monthStartDay.date.toLocaleDateString('en-US', { month: 'short' }),
            label: isYearTransition
              ? `${monthStartDay.date.toLocaleDateString('en-US', { month: 'short' })} '${String(monthStartDay.year).slice(-2)}`
              : monthStartDay.date.toLocaleDateString('en-US', { month: 'short' }),
            fullLabel: monthStartDay.date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),
            isYearTransition,
          });
        }
      }
    }
    return labels;
  }, [heatmapDays]);

  const [heatmapTooltip, setHeatmapTooltip] = useState(null);
  const [hoveredDay, setHoveredDay] = useState(null);
  const [selectedHeatmapDay, setSelectedHeatmapDay] = useState(null);
  const [selectedHeatmapMonth, setSelectedHeatmapMonth] = useState(null);

  // Active day details for the date inspector bar (hovered > clicked > today)
  const activeInspectionDay = useMemo(() => {
    if (hoveredDay) return hoveredDay;
    if (selectedHeatmapDay) {
      const found = heatmapDays.find((d) => d.dateStr === selectedHeatmapDay);
      if (found) {
        return {
          ...found,
          count: completedTaskCountsByDate[found.dateStr] || 0,
          dayName: found.date.toLocaleDateString('en-US', { weekday: 'long' }),
          formattedDate: found.date.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }),
          isSelected: true,
        };
      }
    }
    const todayMatch = heatmapDays.find((d) => d.dateStr === todayStr);
    if (todayMatch) {
      return {
        ...todayMatch,
        count: completedTaskCountsByDate[todayMatch.dateStr] || 0,
        dayName: todayMatch.date.toLocaleDateString('en-US', { weekday: 'long' }),
        formattedDate: todayMatch.date.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }),
        isToday: true,
      };
    }
    return null;
  }, [hoveredDay, selectedHeatmapDay, heatmapDays, completedTaskCountsByDate, todayStr]);

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}
    >
      {/* 0. Executive Command Hero Strip */}
      <motion.section variants={cardVariants} className="dash-hero">
        <div className="dash-hero-left">
          <div className="dash-hero-title-row">
            <h1 className="dash-hero-greeting">{greetingText}</h1>
            <div className="dash-hero-badges">
              <span className="dash-pill">
                <Calendar size={12} />
                {isToday ? `Today · ${formattedActiveDate}` : formattedActiveDate}
              </span>
              {heatmapStats.currentStreak > 0 && (
                <span className="dash-pill is-streak">
                  <Flame size={12} />
                  {heatmapStats.currentStreak}d Streak
                </span>
              )}
              <span className={`dash-pill ${focusSummary.isRunningToday ? 'is-live' : ''}`}>
                <Timer size={12} />
                {focusSummary.isRunningToday ? `Live Focus · ${focusSummary.label}` : `Focus Today · ${focusSummary.label}`}
              </span>
            </div>
          </div>
        </div>

        <div className="dash-hero-actions">
          <button type="button" className="dash-quick-btn is-primary" onClick={() => navigate('/today')}>
            <Plus size={14} />
            <span>Today&apos;s Tasks</span>
          </button>
          <button type="button" className="dash-quick-btn" onClick={() => navigate('/work-tracker')}>
            <Timer size={14} />
            <span>Work Tracker</span>
          </button>
          <button type="button" className="dash-quick-btn" onClick={() => navigate('/habits')}>
            <CheckCircle2 size={14} />
            <span>Habits</span>
          </button>
          <button type="button" className="dash-quick-btn" onClick={() => navigate('/reports')}>
            <FileText size={14} />
            <span>Reports</span>
          </button>
        </div>
      </motion.section>

      {/* 1. Work Hours Live Clock Widget Card */}
      <motion.section variants={cardVariants}>
        <WorkHoursClock tasks={tasks} selectedDate={activeDate} />
      </motion.section>

      {/* 2. 5-Card Bento KPI Strip (Website-Wide Real Metrics) */}
      <motion.section variants={cardVariants} className="dash-kpi-strip">
        <div className="dash-bento-kpi" onClick={() => navigate('/today')}>
          <div className="dash-bento-kpi-icon" style={{ background: 'rgba(37, 99, 235, 0.12)', color: '#3B82F6', border: '1px solid rgba(59, 130, 246, 0.28)' }}>
            <CalendarCheck2 size={18} />
          </div>
          <div>
            <div className="dash-bento-kpi-label">Today&apos;s Tasks</div>
            <div className="dash-bento-kpi-val">{todayStats.completed}/{todayStats.total}</div>
            <div className="dash-bento-kpi-sub">{todayStats.completionRate}% completed</div>
          </div>
        </div>

        <div className="dash-bento-kpi" onClick={() => navigate('/work-tracker')}>
          <div className="dash-bento-kpi-icon" style={{ background: 'rgba(16, 185, 129, 0.12)', color: '#10B981', border: '1px solid rgba(16, 185, 129, 0.28)' }}>
            <Timer size={18} />
          </div>
          <div>
            <div className="dash-bento-kpi-label">Focus Time</div>
            <div className="dash-bento-kpi-val">{focusSummary.label}</div>
            <div className="dash-bento-kpi-sub">{focusSummary.blocks} focus {focusSummary.blocks === 1 ? 'block' : 'blocks'}</div>
          </div>
        </div>

        <div className="dash-bento-kpi" onClick={() => navigate('/habits')}>
          <div className="dash-bento-kpi-icon" style={{ background: 'rgba(139, 92, 246, 0.12)', color: '#8B5CF6', border: '1px solid rgba(139, 92, 246, 0.28)' }}>
            <Flame size={18} />
          </div>
          <div>
            <div className="dash-bento-kpi-label">Habits Today</div>
            <div className="dash-bento-kpi-val">{habitsSummary.doneCount}/{habitsSummary.total}</div>
            <div className="dash-bento-kpi-sub">Best streak: {habitsSummary.bestStreak}d</div>
          </div>
        </div>

        <div className="dash-bento-kpi" onClick={() => navigate('/goals')}>
          <div className="dash-bento-kpi-icon" style={{ background: 'rgba(245, 158, 11, 0.12)', color: '#F59E0B', border: '1px solid rgba(245, 158, 11, 0.28)' }}>
            <Target size={18} />
          </div>
          <div>
            <div className="dash-bento-kpi-label">Active Goals</div>
            <div className="dash-bento-kpi-val">{goalsSummary.total}</div>
            <div className="dash-bento-kpi-sub">{goalsSummary.completedCount} achieved</div>
          </div>
        </div>

        <div className="dash-bento-kpi" onClick={() => navigate('/reports/pending')}>
          <div className="dash-bento-kpi-icon" style={{ background: 'rgba(239, 68, 68, 0.12)', color: '#EF4444', border: '1px solid rgba(239, 68, 68, 0.28)' }}>
            <CircleAlert size={18} />
          </div>
          <div>
            <div className="dash-bento-kpi-label">Pending &amp; Overdue</div>
            <div className="dash-bento-kpi-val" style={{ color: todayStats.overdue > 0 ? '#EF4444' : 'var(--text-primary)' }}>
              {todayStats.pending + todayStats.overdue}
            </div>
            <div className="dash-bento-kpi-sub">{todayStats.overdue} overdue · {todayStats.pending} pending</div>
          </div>
        </div>
      </motion.section>

      {/* 4. Production Analytics Charts Row: Productivity Trend (8 cols) + Progress Overview (4 cols) */}
      <div className="dash-analytics-grid">
        {/* Productivity Trend Area Chart (8 Columns) - Production Level Design */}
        <motion.div
          variants={cardVariants}
          className="card"
          style={{
            gridColumn: 'span 8',
            padding: '12px 18px',
            display: 'flex',
            flexDirection: 'column',
            gap: '10px',
            borderRadius: '16px',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div
                  style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '8px',
                    background: 'rgba(23, 105, 255, 0.14)',
                    color: 'var(--primary-color)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    border: '1px solid rgba(23, 105, 255, 0.28)',
                  }}
                >
                  <TrendingUp size={17} strokeWidth={2.4} />
                </div>
                <div>
                  <h2 className="card-title" style={{ margin: 0, fontSize: '1rem', fontWeight: 800 }}>
                    {trendRange === 'week' ? 'Weekly' : trendRange === 'month' ? 'Monthly' : 'Yearly'} Productivity Trend
                  </h2>
                  <span className="card-subtitle" style={{ fontSize: '0.74rem', color: 'var(--text-secondary)' }}>
                    {selectedTrendCategory === 'all'
                      ? `Total scheduled vs pending/missed tasks over the last ${
                          trendRange === 'week' ? '7 days' : trendRange === 'month' ? '30 days' : '12 months'
                        }`
                      : `Total and missed tasks for "${currentCategory?.name || 'Category'}" over the last ${
                          trendRange === 'week' ? '7 days' : trendRange === 'month' ? '30 days' : '12 months'
                        }`}
                  </span>
                </div>
              </div>
            </div>

            {/* Filter Controls: CustomSelect Category Filter + Week/Month/Year Toggle */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
              <div style={{ width: '170px' }}>
                <CustomSelect
                  value={selectedTrendCategory}
                  onChange={(val) => setSelectedTrendCategory(val)}
                  options={[
                    { value: 'all', label: 'All Tasks', color: '#38BDF8' },
                    ...allUniqueCategories.map((cat) => ({
                      value: cat.id,
                      label: cat.name,
                      color: cat.color,
                    })),
                  ]}
                  placeholder="Select category"
                  searchPlaceholder="Filter category..."
                  showSearch={allUniqueCategories.length > 4}
                  style={{ minWidth: '160px' }}
                />
              </div>

              {/* Time Range Filter Pill Buttons */}
              <div
                style={{
                  display: 'inline-flex',
                  background: 'var(--page-bg)',
                  padding: '2px',
                  borderRadius: '8px',
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
                        padding: '3px 10px',
                        borderRadius: '6px',
                        fontSize: '0.74rem',
                        fontWeight: isActive ? 700 : 600,
                        cursor: 'pointer',
                        transition: 'background 0.15s ease',
                      }}
                    >
                      {item.label}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Productivity Trend Chart: Total Tasks, Pending / Missed Tasks, and Completed Tasks */}
          <div style={{ width: '100%', height: '180px', marginTop: '2px', position: 'relative' }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trendData} margin={{ top: 12, right: 12, left: -20, bottom: 4 }}>
                <defs>
                  <linearGradient id="totalTrendGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#38BDF8" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#38BDF8" stopOpacity={0.0} />
                  </linearGradient>
                  <linearGradient id="pendingTrendGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#EF4444" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#EF4444" stopOpacity={0.0} />
                  </linearGradient>
                  <linearGradient id="completedGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10B981" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#10B981" stopOpacity={0.0} />
                  </linearGradient>
                  <linearGradient id="catTotalGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={currentCategory?.color || '#38BDF8'} stopOpacity={0.28} />
                    <stop offset="95%" stopColor={currentCategory?.color || '#38BDF8'} stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.05)" vertical={false} />
                <XAxis
                  dataKey="day"
                  stroke="#94A3B8"
                  fontSize={11}
                  tickLine={false}
                  dy={6}
                  interval={trendRange === 'month' ? 4 : trendRange === 'year' ? 0 : 0}
                />
                <YAxis stroke="#94A3B8" fontSize={11} tickLine={false} allowDecimals={false} />
                <Tooltip
                  wrapperStyle={{ zIndex: 999999, pointerEvents: 'none' }}
                  content={<CustomTrendTooltip />}
                />

                {selectedTrendCategory === 'all' ? (
                  <>
                    {/* Total Scheduled Tasks Line */}
                    <Area
                      type="monotone"
                      dataKey="total"
                      name="Total Scheduled Tasks"
                      stroke="#38BDF8"
                      strokeWidth={2.4}
                      fillOpacity={1}
                      fill="url(#totalTrendGrad)"
                      activeDot={{ r: 5, strokeWidth: 2, stroke: '#FFFFFF' }}
                    />
                    {/* Pending / Missed Tasks Line */}
                    <Area
                      type="monotone"
                      dataKey="pending"
                      name="Pending Tasks"
                      stroke="#EF4444"
                      strokeWidth={2.4}
                      fillOpacity={1}
                      fill="url(#pendingTrendGrad)"
                      activeDot={{ r: 5, strokeWidth: 2, stroke: '#FFFFFF' }}
                    />
                    {/* Completed Tasks (Dashed line) */}
                    <Area
                      type="monotone"
                      dataKey="completed"
                      name="Completed Tasks"
                      stroke="#10B981"
                      strokeWidth={2}
                      strokeDasharray="4 4"
                      fillOpacity={1}
                      fill="url(#completedGrad)"
                      activeDot={{ r: 4, strokeWidth: 2, stroke: '#FFFFFF' }}
                    />
                  </>
                ) : (
                  <>
                    {/* Category Total Line */}
                    <Area
                      type="monotone"
                      dataKey="total"
                      name={`${currentCategory?.name || 'Category'} Total`}
                      stroke={currentCategory?.color || '#38BDF8'}
                      strokeWidth={2.4}
                      fillOpacity={1}
                      fill="url(#catTotalGrad)"
                      activeDot={{ r: 5, strokeWidth: 2, stroke: '#FFFFFF' }}
                    />
                    {/* Category Missed / Pending Line */}
                    <Area
                      type="monotone"
                      dataKey="pending"
                      name={`${currentCategory?.name || 'Category'} Missed`}
                      stroke="#EF4444"
                      strokeWidth={2.4}
                      fillOpacity={1}
                      fill="url(#pendingTrendGrad)"
                      activeDot={{ r: 5, strokeWidth: 2, stroke: '#FFFFFF' }}
                    />
                    {/* Category Completed Line */}
                    <Area
                      type="monotone"
                      dataKey="completed"
                      name={`${currentCategory?.name || 'Category'} Completed`}
                      stroke="#10B981"
                      strokeWidth={2}
                      strokeDasharray="4 4"
                      fillOpacity={1}
                      fill="url(#completedGrad)"
                      activeDot={{ r: 4, strokeWidth: 2, stroke: '#FFFFFF' }}
                    />
                  </>
                )}
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* Chart Line Legends */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexWrap: 'wrap',
              gap: '12px 20px',
              paddingTop: '8px',
              marginTop: '2px',
              borderTop: '1px solid var(--border-color)',
              fontSize: '0.74rem',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span
                style={{
                  width: '10px',
                  height: '10px',
                  borderRadius: '50%',
                  backgroundColor: selectedTrendCategory === 'all' ? '#38BDF8' : currentCategory?.color || '#38BDF8',
                  display: 'inline-block',
                }}
              />
              <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>
                {selectedTrendCategory === 'all' ? 'Total Scheduled Tasks' : `${currentCategory?.name || 'Category'} Total`}
              </span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span
                style={{
                  width: '10px',
                  height: '10px',
                  borderRadius: '50%',
                  backgroundColor: '#EF4444',
                  display: 'inline-block',
                }}
              />
              <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>
                {selectedTrendCategory === 'all' ? 'Pending Tasks' : `${currentCategory?.name || 'Category'} Missed`}
              </span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span
                style={{
                  width: '14px',
                  height: '2px',
                  borderTop: '2px dashed #10B981',
                  display: 'inline-block',
                }}
              />
              <span style={{ fontWeight: 600, color: 'var(--text-muted)' }}>Completed Tasks</span>
            </div>
          </div>

        </motion.div>

        {/* Progress Overview (4 Columns) - Compact, High-End Aesthetic */}
        <motion.div
          variants={cardVariants}
          className="card"
          style={{
            gridColumn: 'span 4',
            padding: '12px 18px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            gap: '8px',
            borderRadius: '16px',
          }}
        >
          {/* Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '8px',
                  background: 'rgba(16, 185, 129, 0.14)',
                  color: '#10B981',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  border: '1px solid rgba(16, 185, 129, 0.28)',
                }}
              >
                <Zap size={17} strokeWidth={2.4} />
              </div>
              <div>
                <h2 className="card-title" style={{ margin: 0, fontSize: '0.98rem', fontWeight: 800 }}>
                  Progress Overview
                </h2>
                <span className="card-subtitle" style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>
                  Daily & monthly velocity
                </span>
              </div>
            </div>

            <span
              style={{
                background: todayStats.percentage === 100 ? 'rgba(16, 185, 129, 0.14)' : 'rgba(56, 189, 248, 0.14)',
                color: todayStats.percentage === 100 ? '#10B981' : 'var(--primary-color)',
                border: `1px solid ${todayStats.percentage === 100 ? 'rgba(16, 185, 129, 0.4)' : 'rgba(56, 189, 248, 0.35)'}`,
                padding: '2px 8px',
                borderRadius: '999px',
                fontSize: '0.68rem',
                fontWeight: 800,
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

          {/* Dual Circular Rings - Compact & Centered */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-around', padding: '2px 0' }}>
            <ProgressRing
              radius={52}
              stroke={8}
              progress={todayStats.percentage}
              color="#38BDF8"
              gradientColors={todayStats.percentage === 100 ? ['#10B981', '#059669'] : ['#38BDF8', '#1D4ED8']}
              trackColor="var(--border-color, rgba(255, 255, 255, 0.08))"
              label="Today"
              subtitle={`${todayStats.completed}/${todayStats.total}`}
              animateOnMount={true}
              showPercentageInCenter={true}
            />
            <ProgressRing
              radius={52}
              stroke={8}
              progress={currentMonthStats.percentage}
              color="#10B981"
              gradientColors={['#34D399', '#059669']}
              trackColor="var(--border-color, rgba(255, 255, 255, 0.08))"
              label="This Month"
              subtitle={`${currentMonthStats.completed}/${currentMonthStats.total}`}
              animateOnMount={true}
              showPercentageInCenter={true}
            />
          </div>

          {/* Progress Bars (Compact Micro-Bars) */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.74rem', marginBottom: '3px' }}>
                <span style={{ color: 'var(--text-secondary)', fontWeight: 600 }}>Today's Tasks Done</span>
                <strong style={{ color: 'var(--text-primary)' }}>
                  {todayStats.completed} / {todayStats.total} ({todayStats.percentage}%)
                </strong>
              </div>
              <ProgressBar progress={todayStats.percentage} height={5} color={todayStats.percentage === 100 ? '#10B981' : '#38BDF8'} animateOnMount={true} />
            </div>

            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.74rem', marginBottom: '3px' }}>
                <span style={{ color: 'var(--text-secondary)', fontWeight: 600 }}>Monthly Target</span>
                <strong style={{ color: 'var(--text-primary)' }}>
                  {currentMonthStats.completed} / {currentMonthStats.total} ({currentMonthStats.percentage}%)
                </strong>
              </div>
              <ProgressBar progress={currentMonthStats.percentage} height={5} color="#10B981" animateOnMount={true} />
            </div>
          </div>
        </motion.div>
      </div>

      {/* 5. Website Modules Bento Row: Habits, Goals, Category Workload & Requests */}
      <motion.section variants={cardVariants} className="dash-modules-grid">
        {/* Card A: Today's Habits Pulse */}
        <div className="dash-module-card">
          <div className="dash-module-head">
            <div className="dash-module-title-wrap">
              <Flame size={17} color="#8B5CF6" />
              <h3 className="dash-module-title">Today&apos;s Habits</h3>
            </div>
            <button type="button" className="dash-module-link" onClick={() => navigate('/habits')}>
              <span>Manage</span>
              <ArrowRight size={13} />
            </button>
          </div>
          {habitsSummary.top.length === 0 ? (
            <div className="dash-empty-mini">No habits tracked yet. Add your daily habits to build streaks.</div>
          ) : (
            <div className="dash-list-stack">
              {habitsSummary.top.map((h) => (
                <div key={h.id} className="dash-item-row">
                  <div className="dash-item-left">
                    <span
                      style={{
                        width: 9,
                        height: 9,
                        borderRadius: '50%',
                        background: h.doneToday ? '#10B981' : 'var(--text-muted)',
                        flexShrink: 0,
                      }}
                    />
                    <span className="dash-item-name">{h.name || h.title}</span>
                  </div>
                  <span
                    className="dash-item-badge"
                    style={{
                      background: h.doneToday ? 'rgba(16, 185, 129, 0.14)' : 'rgba(245, 158, 11, 0.14)',
                      color: h.doneToday ? '#10B981' : '#F59E0B',
                    }}
                  >
                    {h.doneToday ? 'Done' : 'Pending'} · {h.streak}d
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Card B: Active Goals Progress */}
        <div className="dash-module-card">
          <div className="dash-module-head">
            <div className="dash-module-title-wrap">
              <Target size={17} color="#F59E0B" />
              <h3 className="dash-module-title">Active Goals</h3>
            </div>
            <button type="button" className="dash-module-link" onClick={() => navigate('/goals')}>
              <span>All Goals</span>
              <ArrowRight size={13} />
            </button>
          </div>
          {goalsSummary.top.length === 0 ? (
            <div className="dash-empty-mini">No goals created yet. Link tasks to goals to track progress.</div>
          ) : (
            <div className="dash-list-stack">
              {goalsSummary.top.map((g) => (
                <div key={g.id} className="dash-item-row" style={{ flexDirection: 'column', alignItems: 'stretch', gap: '6px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '8px' }}>
                    <span className="dash-item-name">{g.title}</span>
                    <strong style={{ fontSize: '0.75rem', color: '#3B82F6', flexShrink: 0 }}>{g.pct}%</strong>
                  </div>
                  <ProgressBar progress={g.pct} height={5} color="#3B82F6" animateOnMount={true} />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Card C: Category Workload & Requests */}
        <div className="dash-module-card">
          <div className="dash-module-head">
            <div className="dash-module-title-wrap">
              <Layers size={17} color="#3B82F6" />
              <h3 className="dash-module-title">Category Workload</h3>
            </div>
            <button type="button" className="dash-module-link" onClick={() => navigate('/requests')}>
              <RefreshCw size={12} />
              <span>{requestsSummary.rescheduled} Rescheduled</span>
            </button>
          </div>
          {categoryDist.length === 0 ? (
            <div className="dash-empty-mini">No categorized tasks found yet.</div>
          ) : (
            <div className="dash-list-stack">
              {categoryDist.map((cat) => (
                <div key={cat.name} className="dash-item-row">
                  <div className="dash-item-left">
                    <span style={{ width: 9, height: 9, borderRadius: '50%', background: cat.color || '#3B82F6', flexShrink: 0 }} />
                    <span className="dash-item-name">{cat.name}</span>
                  </div>
                  <span className="dash-item-badge" style={{ background: 'rgba(59, 130, 246, 0.12)', color: '#3B82F6' }}>
                    {cat.count} {cat.count === 1 ? 'task' : 'tasks'}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </motion.section>

      {/* 5B. Second Website Modules Bento Row: Events, Knowledge Base, Standup & Motivation */}
      <motion.section variants={cardVariants} className="dash-modules-grid">
        {/* Card D: Upcoming Events */}
        <div className="dash-module-card">
          <div className="dash-module-head">
            <div className="dash-module-title-wrap">
              <CalendarDays size={17} color="#06B6D4" />
              <h3 className="dash-module-title">Upcoming Events</h3>
            </div>
            <button type="button" className="dash-module-link" onClick={() => navigate('/calendar')}>
              <span>Calendar</span>
              <ArrowRight size={13} />
            </button>
          </div>
          {!dashSummary?.events?.upcoming?.length ? (
            <div className="dash-empty-mini">No upcoming events scheduled.</div>
          ) : (
            <div className="dash-list-stack">
              {dashSummary.events.upcoming.slice(0, 4).map((ev) => (
                <div key={ev.id} className="dash-item-row">
                  <div className="dash-item-left">
                    <span style={{ width: 9, height: 9, borderRadius: '50%', background: '#06B6D4', flexShrink: 0 }} />
                    <span className="dash-item-name">{ev.title}</span>
                  </div>
                  <span className="dash-item-badge" style={{ background: 'rgba(6, 182, 212, 0.14)', color: '#06B6D4' }}>
                    {ev.date === activeDate ? 'Today' : formatDate(ev.date, { month: 'short', day: 'numeric' })}
                    {ev.startTime ? ` · ${ev.startTime}` : ''}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Card E: Knowledge Base & Lessons */}
        <div className="dash-module-card">
          <div className="dash-module-head">
            <div className="dash-module-title-wrap">
              <BookOpen size={17} color="#10B981" />
              <h3 className="dash-module-title">Knowledge Base</h3>
            </div>
            <button type="button" className="dash-module-link" onClick={() => navigate('/knowledge')}>
              <span>Open</span>
              <ArrowRight size={13} />
            </button>
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <div className="dash-item-row" style={{ flex: 1, justifyContent: 'center', gap: '6px' }}>
              <strong style={{ color: '#10B981', fontSize: '0.95rem' }}>{dashSummary?.knowledge?.lessons ?? 0}</strong>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Lessons</span>
            </div>
            <div className="dash-item-row" style={{ flex: 1, justifyContent: 'center', gap: '6px' }}>
              <strong style={{ color: '#3B82F6', fontSize: '0.95rem' }}>{dashSummary?.knowledge?.folders ?? 0}</strong>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Folders</span>
            </div>
          </div>
          {!dashSummary?.knowledge?.recentLessons?.length ? (
            <div className="dash-empty-mini">No lessons saved yet.</div>
          ) : (
            <div className="dash-list-stack">
              {dashSummary.knowledge.recentLessons.map((lesson) => (
                <div key={lesson.id} className="dash-item-row" style={{ cursor: 'pointer' }} onClick={() => navigate('/knowledge')}>
                  <div className="dash-item-left">
                    <Sparkles size={13} color="#10B981" style={{ flexShrink: 0 }} />
                    <span className="dash-item-name">{lesson.title}</span>
                  </div>
                  <span className="dash-item-badge" style={{ background: 'rgba(16, 185, 129, 0.12)', color: '#10B981' }}>
                    Lesson
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Card F: Daily Standup, Deviations & Thought of the Day */}
        <div className="dash-module-card">
          <div className="dash-module-head">
            <div className="dash-module-title-wrap">
              <Quote size={17} color="#EC4899" />
              <h3 className="dash-module-title">Standup &amp; Inspiration</h3>
            </div>
            <button type="button" className="dash-module-link" onClick={() => navigate('/thoughts')}>
              <span>Thoughts</span>
              <ArrowRight size={13} />
            </button>
          </div>

          <div style={{ display: 'flex', gap: '8px' }}>
            <div
              className="dash-item-row"
              style={{ flex: 1, cursor: 'pointer' }}
              onClick={() => navigate('/reports')}
            >
              <span style={{ fontSize: '0.75rem', fontWeight: 650, color: 'var(--text-secondary)' }}>Daily Report</span>
              <span
                className="dash-item-badge"
                style={{
                  background: dashSummary?.dailyReport?.submittedToday ? 'rgba(16, 185, 129, 0.14)' : 'rgba(245, 158, 11, 0.14)',
                  color: dashSummary?.dailyReport?.submittedToday ? '#10B981' : '#F59E0B',
                }}
              >
                {dashSummary?.dailyReport?.submittedToday ? 'Submitted' : 'Pending'}
              </span>
            </div>
            <div
              className="dash-item-row"
              style={{ flex: 1, cursor: 'pointer' }}
              onClick={() => navigate('/deviations')}
            >
              <span style={{ fontSize: '0.75rem', fontWeight: 650, color: 'var(--text-secondary)' }}>7d Lags</span>
              <span className="dash-item-badge" style={{ background: 'rgba(239, 68, 68, 0.12)', color: '#EF4444' }}>
                <ShieldAlert size={11} style={{ marginRight: 3, verticalAlign: 'middle' }} />
                {dashSummary?.deviations?.last7Days ?? 0}
              </span>
            </div>
          </div>

          {dashSummary?.thoughts?.featured ? (
            <div
              className="dash-item-row"
              style={{ flexDirection: 'column', alignItems: 'flex-start', gap: '4px', padding: '10px 12px', cursor: 'pointer' }}
              onClick={() => navigate('/thoughts')}
            >
              <span style={{ fontSize: '0.8rem', fontStyle: 'italic', color: 'var(--text-primary)', lineHeight: 1.4 }}>
                &ldquo;{dashSummary.thoughts.featured.text}&rdquo;
              </span>
              {dashSummary.thoughts.featured.author && (
                <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 600 }}>
                  — {dashSummary.thoughts.featured.author}
                </span>
              )}
            </div>
          ) : (
            <div className="dash-empty-mini">Add motivational quotes in Thoughts Hub to feature them here.</div>
          )}
        </div>
      </motion.section>

      {/* 6. Today's Schedule Sequence (Full Screen Width) */}
      <motion.div
        variants={cardVariants}
        className="card"
        style={{
          padding: '14px 18px',
          width: '100%',
          borderRadius: '16px',
          background: 'var(--card-bg)',
          border: '1.5px solid var(--border-color)',
          boxShadow: 'var(--shadow-sm)',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Subtle ambient lighting accent */}
        <div
          style={{
            position: 'absolute',
            top: '-80px',
            right: '-80px',
            width: '280px',
            height: '280px',
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(23, 105, 255, 0.08) 0%, transparent 70%)',
            pointerEvents: 'none',
          }}
        />

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', flexWrap: 'wrap', gap: '10px', position: 'relative', zIndex: 2 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '10px',
                background: 'linear-gradient(135deg, #1769FF 0%, #38BDF8 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 3px 10px rgba(23, 105, 255, 0.25)',
                color: '#ffffff',
                flexShrink: 0,
              }}
            >
              <CalendarDays size={18} strokeWidth={2.4} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <h2 style={{ margin: 0, fontSize: '1.02rem', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.01em' }}>
                  Today's Schedule Sequence
                </h2>
                <span
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '5px',
                    padding: '3px 9px',
                    borderRadius: '9999px',
                    background: 'rgba(16, 185, 129, 0.15)',
                    border: '1px solid rgba(16, 185, 129, 0.4)',
                    color: '#10B981',
                    fontSize: '0.72rem',
                    fontWeight: 700,
                  }}
                >
                  <span className="live-pulse-dot" style={{ width: '6px', height: '6px', background: '#10B981' }} />
                  Live Flow
                </span>
              </div>
              <span style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', fontWeight: 500, marginTop: '2px', display: 'block' }}>
                Sequential timeline progression of planned tasks
              </span>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
            {/* Progress Pill */}
            {todayStats.total > 0 && (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '5px 12px',
                  borderRadius: '10px',
                  background: 'var(--page-bg)',
                  border: '1px solid var(--border-color)',
                }}
              >
                <span style={{ fontSize: '0.76rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                  {todayStats.completed}/{todayStats.total} Done
                </span>
                <div style={{ width: '56px', height: '6px', background: 'var(--border-color)', borderRadius: '999px', overflow: 'hidden' }}>
                  <div
                    style={{
                      width: `${todayStats.percentage}%`,
                      height: '100%',
                      background: 'linear-gradient(90deg, #10B981 0%, #34D399 100%)',
                      borderRadius: '999px',
                      transition: 'width 0.4s ease',
                    }}
                  />
                </div>
                <span style={{ fontSize: '0.74rem', fontWeight: 800, color: '#10B981' }}>
                  {todayStats.percentage}%
                </span>
              </div>
            )}

            <span style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', fontWeight: 600 }}>
              {formatDate(todayStr, { weekday: 'short', day: 'numeric', month: 'short' })}
            </span>

            <button
              type="button"
              className="btn btn-sm"
              onClick={() => navigate('/calendar')}
              style={{
                background: 'rgba(23, 105, 255, 0.14)',
                border: '1px solid rgba(23, 105, 255, 0.35)',
                color: '#60A5FA',
                fontWeight: 700,
                gap: '6px',
                fontSize: '0.78rem',
                padding: '6px 14px',
                borderRadius: '8px',
                display: 'inline-flex',
                alignItems: 'center',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
            >
              <span>Calendar View</span>
              <ArrowRight size={13} />
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

          {/* Controls: Goal Filter + Legend */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '14px',
              flexWrap: 'wrap',
            }}
          >
            {/* Goal Filter */}
            <div style={{ width: '210px' }}>
              <CustomSelect
                value={selectedHeatmapGoal}
                onChange={(val) => setSelectedHeatmapGoal(val)}
                options={[
                  { value: 'all', label: '🎯 All Goals' },
                  ...goals.map((g) => ({
                    value: g.id,
                    label: g.title,
                    description: g.category || 'Goal',
                  })),
                ]}
                placeholder="Filter by goal"
                searchPlaceholder="Search goals..."
                showSearch={goals.length > 4}
              />
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
        </div>

        {/* Heatmap Grid */}
        <div style={{ overflowX: 'auto', paddingBottom: '6px' }}>
          <div style={{ minWidth: '780px' }}>
            {/* Months row */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '36px repeat(52, minmax(0, 1fr))',
                gap: '3px',
                marginBottom: '8px',
                fontSize: '0.72rem',
                color: 'var(--text-muted)',
                fontWeight: 600,
                alignItems: 'center',
              }}
            >
              <div />
              {monthLabels.map((m, idx) => {
                const isSelectedMonth = selectedHeatmapMonth === m.monthIndex;
                return (
                  <div
                    key={idx}
                    onClick={() => setSelectedHeatmapMonth(isSelectedMonth ? null : m.monthIndex)}
                    style={{
                      gridColumnStart: m.col + 2,
                      gridRowStart: 1,
                      textAlign: 'left',
                      whiteSpace: 'nowrap',
                      color: isSelectedMonth ? '#38BDF8' : m.isYearTransition ? '#93C5FD' : '#94A3B8',
                      fontWeight: m.isYearTransition || isSelectedMonth ? 700 : 600,
                      cursor: 'pointer',
                      transition: 'color 0.15s ease',
                      padding: '2px 0',
                    }}
                    title={`${m.fullLabel} - Click to filter month`}
                  >
                    {m.label}
                  </div>
                );
              })}
            </div>

            {/* Main Heatmap: 36px Day Labels Column + 52 Week Columns */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '36px repeat(52, minmax(0, 1fr))',
                gap: '3px',
                alignItems: 'stretch',
              }}
            >
              {/* Day labels column - Exactly 7 rows matching the 7 cell rows */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateRows: 'repeat(7, 1fr)',
                  gap: '3px',
                  fontSize: '0.68rem',
                  fontWeight: 600,
                  userSelect: 'none',
                  paddingRight: '6px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', color: '#CBD5E1', fontWeight: 700 }}>Mon</div>
                <div style={{ display: 'flex', alignItems: 'center', color: '#64748B', fontSize: '0.62rem' }}>Tue</div>
                <div style={{ display: 'flex', alignItems: 'center', color: '#CBD5E1', fontWeight: 700 }}>Wed</div>
                <div style={{ display: 'flex', alignItems: 'center', color: '#64748B', fontSize: '0.62rem' }}>Thu</div>
                <div style={{ display: 'flex', alignItems: 'center', color: '#CBD5E1', fontWeight: 700 }}>Fri</div>
                <div style={{ display: 'flex', alignItems: 'center', color: '#64748B', fontSize: '0.62rem' }}>Sat</div>
                <div style={{ display: 'flex', alignItems: 'center', color: '#CBD5E1', fontWeight: 700 }}>Sun</div>
              </div>

              {/* 52 Columns */}
              {Array.from({ length: 52 }).map((_, colIdx) => {
                const weekDays = heatmapDays.slice(colIdx * 7, colIdx * 7 + 7);
                return (
                  <div
                    key={colIdx}
                    style={{
                      display: 'grid',
                      gridTemplateRows: 'repeat(7, 1fr)',
                      gap: '3px',
                    }}
                  >
                    {weekDays.map((day) => {
                      const count = completedTaskCountsByDate[day.dateStr] || 0;
                      const isTodayDate = day.dateStr === todayStr;
                      const isSelected = selectedHeatmapDay === day.dateStr;
                      const isMonthMatch = selectedHeatmapMonth === null || day.month === selectedHeatmapMonth;

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

                      let opacity = isMonthMatch ? 1 : 0.22;
                      let outline = isSelected ? '2px solid #F59E0B' : 'none';
                      let boxShadow = isSelected
                        ? '0 0 10px rgba(245, 158, 11, 0.7)'
                        : isTodayDate
                          ? '0 0 8px rgba(56, 189, 248, 0.8)'
                          : count >= 3
                            ? '0 0 5px rgba(16, 185, 129, 0.4)'
                            : 'none';

                      if (isTodayDate) {
                        border = '2px solid #38BDF8';
                      }

                      return (
                        <div
                          key={day.dateStr}
                          onClick={() => {
                            if (day.isFuture) return;
                            setSelectedHeatmapDay(isSelected ? null : day.dateStr);
                          }}
                          onMouseEnter={(e) => {
                            if (day.isFuture) return;
                            const rect = e.currentTarget.getBoundingClientRect();
                            const dayName = day.date.toLocaleDateString('en-US', { weekday: 'long' });
                            const formattedDate = day.date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
                            setHeatmapTooltip({
                              x: rect.left + rect.width / 2,
                              y: rect.top - 8,
                              dateStr: day.dateStr,
                              dayName,
                              formattedDate,
                              count,
                            });
                            setHoveredDay({
                              ...day,
                              count,
                              dayName,
                              formattedDate: day.date.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }),
                            });
                          }}
                          onMouseLeave={() => {
                            setHeatmapTooltip(null);
                            setHoveredDay(null);
                          }}
                          style={{
                            width: '100%',
                            aspectRatio: '1 / 1',
                            minWidth: '10px',
                            minHeight: '10px',
                            borderRadius: '3px',
                            background: bg,
                            border,
                            outline,
                            opacity,
                            boxShadow,
                            cursor: day.isFuture ? 'default' : 'pointer',
                            position: 'relative',
                            transition: 'transform 0.15s ease, filter 0.15s ease, opacity 0.2s ease',
                          }}
                        >
                          {isTodayDate && (
                            <div
                              style={{
                                position: 'absolute',
                                top: '50%',
                                left: '50%',
                                transform: 'translate(-50%, -50%)',
                                width: '3px',
                                height: '3px',
                                borderRadius: '50%',
                                background: '#38BDF8',
                                pointerEvents: 'none',
                              }}
                            />
                          )}
                        </div>
                      );
                    })}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Live Date, Day & Month Inspector Bar */}
        <div
          style={{
            marginTop: '14px',
            padding: '12px 18px',
            borderRadius: '12px',
            background: 'var(--page-bg)',
            border: '1px solid var(--border-color)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '12px',
          }}
        >
          {/* Left: Active/Hovered Day details */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '38px',
                height: '38px',
                borderRadius: '10px',
                background: activeInspectionDay?.count > 0 ? 'rgba(16, 185, 129, 0.15)' : 'var(--card-bg)',
                color: activeInspectionDay?.count > 0 ? '#10B981' : 'var(--text-muted)',
                border: `1px solid ${activeInspectionDay?.count > 0 ? 'rgba(16, 185, 129, 0.3)' : 'var(--border-color)'}`,
                flexShrink: 0,
              }}
            >
              <CalendarDays size={18} />
            </div>

            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                <span style={{ fontSize: '0.92rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                  {activeInspectionDay?.dayName}, {activeInspectionDay?.formattedDate}
                </span>
                {activeInspectionDay?.isToday && (
                  <span
                    style={{
                      fontSize: '0.7rem',
                      fontWeight: 700,
                      padding: '2px 8px',
                      borderRadius: '9999px',
                      background: 'rgba(56, 189, 248, 0.15)',
                      color: 'var(--primary-color)',
                      border: '1px solid rgba(56, 189, 248, 0.35)',
                    }}
                  >
                    Today
                  </span>
                )}
                {selectedHeatmapDay && selectedHeatmapDay === activeInspectionDay?.dateStr && (
                  <span
                    style={{
                      fontSize: '0.7rem',
                      fontWeight: 700,
                      padding: '2px 8px',
                      borderRadius: '9999px',
                      background: 'rgba(245, 158, 11, 0.15)',
                      color: '#F59E0B',
                      border: '1px solid rgba(245, 158, 11, 0.35)',
                    }}
                  >
                    Selected
                  </span>
                )}
                {selectedHeatmapMonth !== null && (
                  <button
                    onClick={() => setSelectedHeatmapMonth(null)}
                    style={{
                      background: 'var(--card-bg)',
                      border: '1px solid var(--border-color)',
                      color: 'var(--text-secondary)',
                      fontSize: '0.68rem',
                      padding: '2px 8px',
                      borderRadius: '6px',
                      cursor: 'pointer',
                    }}
                  >
                    Reset Month Filter ✕
                  </button>
                )}
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '3px', fontSize: '0.78rem' }}>
                {activeInspectionDay?.isFuture ? (
                  <span style={{ color: 'var(--text-muted)' }}>Upcoming date (future)</span>
                ) : activeInspectionDay?.count > 0 ? (
                  <span style={{ color: '#10B981', fontWeight: 700 }}>
                    ✓ {activeInspectionDay.count} {activeInspectionDay.count === 1 ? 'task' : 'tasks'} completed on this day
                  </span>
                ) : (
                  <span style={{ color: 'var(--text-muted)' }}>No completed tasks recorded on this date</span>
                )}
              </div>
            </div>
          </div>

          {/* Right: Year Range & Total Completed */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '16px',
              fontSize: '0.78rem',
              flexWrap: 'wrap',
            }}
          >
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
              <div style={{ color: 'var(--text-muted)', fontSize: '0.72rem' }}>52-Week Range</div>
              <div style={{ color: 'var(--text-primary)', fontWeight: 700 }}>
                {heatmapDays[0]?.date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })} – {new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
              </div>
            </div>

            <div style={{ width: '1px', height: '24px', background: 'var(--border-color)' }} />

            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
              <div style={{ color: 'var(--text-muted)', fontSize: '0.72rem' }}>Total Year Activity</div>
              <div style={{ color: '#10B981', fontWeight: 800 }}>
                {heatmapStats.totalCompletedYear} completed tasks
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
              background: 'var(--card-bg)',
              color: 'var(--text-primary)',
              border: '1px solid var(--border-color)',
              padding: '8px 14px',
              borderRadius: '8px',
              fontSize: '0.76rem',
              fontWeight: 600,
              pointerEvents: 'none',
              zIndex: 9999,
              boxShadow: 'var(--shadow-lg)',
              whiteSpace: 'nowrap',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '2px' }}>
              <span style={{ fontWeight: 800, color: 'var(--text-primary)' }}>
                {heatmapTooltip.dayName}, {heatmapTooltip.formattedDate}
              </span>
              {heatmapTooltip.dateStr === todayStr && (
                <span
                  style={{
                    fontSize: '0.65rem',
                    padding: '1px 5px',
                    borderRadius: '4px',
                    background: 'rgba(56, 189, 248, 0.15)',
                    color: 'var(--primary-color)',
                    border: '1px solid rgba(56, 189, 248, 0.35)',
                  }}
                >
                  Today
                </span>
              )}
            </div>
            <div style={{ color: heatmapTooltip.count > 0 ? '#10B981' : 'var(--text-muted)', fontSize: '0.74rem' }}>
              {heatmapTooltip.count > 0
                ? `✓ ${heatmapTooltip.count} ${heatmapTooltip.count === 1 ? 'task' : 'tasks'} completed`
                : '0 tasks completed'}
            </div>
          </div>
        )}
      </motion.div>
    </motion.div>
  );
}
