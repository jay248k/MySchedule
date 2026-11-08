import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  BarChart3,
  TrendingUp,
  PieChart as PieIcon,
  Calendar,
  Clock,
  ArrowRight,
  Check,
  FileText,
  Copy,
  Save,
  Printer,
  ChevronLeft,
  ChevronRight,
  Trash2,
  Plus,
  RefreshCw,
  Target,
  LayoutGrid,
  List,
  CalendarDays,
  Search,
  ChevronDown,
  ChevronUp,
  CheckCircle2,
  AlertTriangle,
  Sparkles,
  Archive,
  Flag,
  FileSpreadsheet,
  Download,
  ShieldAlert,
  Timer,
  Coffee,
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
} from 'recharts';
import { useApp } from '../context/AppContext';
import { getTodayDateString, formatDate, parseDate, formatTime } from '../utils/dateUtils';
import {
  calculateTaskStats,
  getCategoryDistribution,
  getPriorityDistribution,
  getWeeklyProductivityTrend,
  getDaysReportingData,
} from '../utils/statistics';
import { ProgressBar } from '../components/common/ProgressRing';
import { TaskItem } from '../components/tasks/TaskItem';
import { ExcelReportTable } from '../components/reports/ExcelReportTable';
import { analyzeRedFlags } from '../utils/redFlagEngine';
import { getEffectiveStatus } from '../utils/taskUtils';

export function Reports() {
  const navigate = useNavigate();
  const { reportType } = useParams();
  const {
    tasks = [],
    categories = [],
    goals = [],
    workSessions = [],
    activeWorkSession,
    user,
    openModal,
    toggleTaskComplete,
    dailyReports = [],
    saveDailyReport,
    deleteDailyReport,
    showToast,
    selectedDate,
    setSelectedDate,
    workChains = {},
  } = useApp();

  // Active view: sync with route param if present ('pending', 'completed', 'missed', 'goals', 'red-flags', 'tracker-logs', 'today-report', 'analytics')
  const [activeTab, setActiveTab] = useState(() => {
    if (reportType && ['pending', 'completed', 'missed', 'goals', 'red-flags', 'tracker-logs', 'today-report', 'analytics'].includes(reportType)) {
      return reportType;
    }
    return 'today-report';
  });

  useEffect(() => {
    if (reportType && ['pending', 'completed', 'missed', 'goals', 'red-flags', 'tracker-logs', 'today-report', 'analytics'].includes(reportType)) {
      setActiveTab(reportType);
    } else if (!reportType) {
      setActiveTab('today-report');
    }
  }, [reportType]);

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    if (tab === 'today-report') {
      navigate('/reports');
    } else {
      navigate(`/reports/${tab}`);
    }
  };

  // Selected date for Daily Work Reporting
  const todayStr = getTodayDateString();
  const [selectedReportDate, setSelectedReportDate] = useState(() => selectedDate || todayStr);

  useEffect(() => {
    if (selectedDate) {
      setSelectedReportDate(selectedDate);
    }
  }, [selectedDate]);

  // Filter for tasks checklist on selected date: 'all', 'completed', 'pending'
  const [taskFilter, setTaskFilter] = useState('all');

  // Time range and mode for analytics tab
  const [timeRange, setTimeRange] = useState('week'); // 'today', 'week', 'month', 'all'
  const [daysRangeMode, setDaysRangeMode] = useState('14days'); // '7days', '14days', 'month'
  const [selectedAnalyticsDate, setSelectedAnalyticsDate] = useState(todayStr);

  // Daily Report Form State (Single Paragraph & Reporting Time)
  const [dailyReportText, setDailyReportText] = useState('');
  const [reportingTime, setReportingTime] = useState(() => {
    return new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  });
  const [accomplishments, setAccomplishments] = useState('');
  const [highlights, setHighlights] = useState('');
  const [blockers, setBlockers] = useState('');
  const [tomorrowPlan, setTomorrowPlan] = useState('');
  const [hoursLogged, setHoursLogged] = useState('7.0');
  const [mood, setMood] = useState('fire'); // 'fire', 'rocket', 'coffee', 'blocked'

  // Archive Multi-View, Search & Filter states
  const [archiveView, setArchiveView] = useState('cards'); // 'cards', 'table', 'timeline'
  const [archiveSearch, setArchiveSearch] = useState('');
  const [archiveMoodFilter, setArchiveMoodFilter] = useState('all');
  const [expandedReportIds, setExpandedReportIds] = useState(new Set());

  const toggleExpandReport = (id) => {
    setExpandedReportIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const parseBulletPoints = (text) => {
    if (!text) return [];
    return text
      .split('\n')
      .map((line) => line.trim())
      .filter((line) => line.length > 0)
      .map((line) => line.replace(/^[•\-\*\d\.\)]\s*/, ''));
  };

  const MOOD_METADATA = {
    fire: { label: 'High Velocity', emoji: '🔥', color: '#F59E0B', bg: 'rgba(245, 158, 11, 0.12)', border: 'rgba(245, 158, 11, 0.28)' },
    productive: { label: 'High Velocity', emoji: '🔥', color: '#F59E0B', bg: 'rgba(245, 158, 11, 0.12)', border: 'rgba(245, 158, 11, 0.28)' },
    rocket: { label: 'On Track', emoji: '🚀', color: '#10B981', bg: 'rgba(16, 185, 129, 0.12)', border: 'rgba(16, 185, 129, 0.28)' },
    ontrack: { label: 'On Track', emoji: '🚀', color: '#10B981', bg: 'rgba(16, 185, 129, 0.12)', border: 'rgba(16, 185, 129, 0.28)' },
    coffee: { label: 'Steady Pace', emoji: '☕', color: '#3B82F6', bg: 'rgba(59, 130, 246, 0.12)', border: 'rgba(59, 130, 246, 0.28)' },
    steady: { label: 'Steady Pace', emoji: '☕', color: '#3B82F6', bg: 'rgba(59, 130, 246, 0.12)', border: 'rgba(59, 130, 246, 0.28)' },
    blocked: { label: 'Blocked', emoji: '⚠️', color: '#EF4444', bg: 'rgba(239, 68, 68, 0.12)', border: 'rgba(239, 68, 68, 0.28)' },
  };

  // Helper to calculate hours between time strings
  const calculateTaskHours = (task) => {
    if (!task.startTime || !task.endTime) return 1;
    const [sh, sm] = task.startTime.split(':').map(Number);
    const [eh, em] = task.endTime.split(':').map(Number);
    const diff = eh * 60 + em - (sh * 60 + sm);
    return diff > 0 ? Number((diff / 60).toFixed(1)) : 1;
  };

  // Function to auto-populate draft fields from scheduled tasks
  const autoGenerateDraftFromTasks = useCallback(
    (targetDate) => {
      const dayTasks = tasks.filter((t) => t.date === targetDate);
      const doneTasks = dayTasks.filter((t) => t.status === 'completed');

      // Generate accomplishments
      if (doneTasks.length > 0) {
        const bulletPoints = doneTasks
          .map((t) => {
            const cat = categories.find((c) => c.id === t.categoryId)?.name || 'General';
            const time = t.startTime ? ` (${t.startTime} - ${t.endTime})` : '';
            return `• ${t.title}${time} [${cat}]`;
          })
          .join('\n');
        setAccomplishments(bulletPoints);
      } else {
        setAccomplishments(
          dayTasks.length > 0
            ? '• Working on scheduled tasks for the day.'
            : '• No tasks were previously scheduled; logged custom work.'
        );
      }

      // Default highlights
      setHighlights(
        doneTasks.length > 0
          ? `Delivered ${doneTasks.length} task${doneTasks.length > 1 ? 's' : ''} on schedule.`
          : 'Work in progress.'
      );

      // Default blockers
      setBlockers('None. Steady progress without major impediments.');

      // Auto-generate tomorrow's plan from next day's tasks
      const nextDayObj = parseDate(targetDate);
      nextDayObj.setDate(nextDayObj.getDate() + 1);
      const y = nextDayObj.getFullYear();
      const m = String(nextDayObj.getMonth() + 1).padStart(2, '0');
      const d = String(nextDayObj.getDate()).padStart(2, '0');
      const nextDayStr = `${y}-${m}-${d}`;

      const tomorrowTasks = tasks.filter((t) => t.date === nextDayStr);
      if (tomorrowTasks.length > 0) {
        const planBullets = tomorrowTasks
          .map((t) => {
            const time = t.startTime ? ` (${t.startTime} - ${t.endTime})` : '';
            return `• ${t.title}${time}`;
          })
          .join('\n');
        setTomorrowPlan(planBullets);
      } else {
        setTomorrowPlan('• Continue development and review scheduled milestones.');
      }

      // Estimate hours
      const totalEstHours = dayTasks.reduce((acc, t) => {
        if (!t.startTime || !t.endTime) return acc + 1;
        const [sh, sm] = t.startTime.split(':').map(Number);
        const [eh, em] = t.endTime.split(':').map(Number);
        const diff = eh * 60 + em - (sh * 60 + sm);
        return acc + (diff > 0 ? Number((diff / 60).toFixed(1)) : 1);
      }, 0);
      setHoursLogged(totalEstHours > 0 ? String(totalEstHours.toFixed(1)) : '7.0');
      setMood(doneTasks.length >= 2 ? 'fire' : 'rocket');
    },
    [tasks, categories]
  );

  // Find saved report for selected date
  const savedReportForSelectedDate = dailyReports.find((r) => r.date === selectedReportDate);

  // Load report data when selectedReportDate or saved reports change
  useEffect(() => {
    if (savedReportForSelectedDate) {
      setDailyReportText(savedReportForSelectedDate.dailyReportText || savedReportForSelectedDate.accomplishments || '');
      setReportingTime(savedReportForSelectedDate.reportingTime || new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
      setAccomplishments(savedReportForSelectedDate.accomplishments || '');
      setHighlights(savedReportForSelectedDate.highlights || '');
      setBlockers(savedReportForSelectedDate.blockers || '');
      setTomorrowPlan(savedReportForSelectedDate.tomorrowPlan || '');
      setHoursLogged(String(savedReportForSelectedDate.hoursLogged || '7.0'));
      setMood(savedReportForSelectedDate.mood || 'fire');
    } else {
      // Auto-generate fresh draft from tasks on selectedReportDate
      autoGenerateDraftFromTasks(selectedReportDate);
      const dayTasks = tasks.filter((t) => t.date === selectedReportDate);
      const doneTasks = dayTasks.filter((t) => t.status === 'completed');
      if (doneTasks.length > 0) {
        const bulletPoints = doneTasks.map((t) => t.title).join(', ');
        setDailyReportText(`Completed today's scheduled tasks: ${bulletPoints}. All deliverables on track with steady momentum.`);
      } else {
        setDailyReportText('');
      }
      setReportingTime(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
    }
  }, [selectedReportDate, savedReportForSelectedDate, autoGenerateDraftFromTasks, tasks]);

  // Quick helper to refresh accomplishments from currently completed tasks
  const handleRefreshAccomplishments = () => {
    const dayTasks = tasks.filter((t) => t.date === selectedReportDate);
    const doneTasks = dayTasks.filter((t) => t.status === 'completed');
    if (doneTasks.length > 0) {
      const bulletPoints = doneTasks
        .map((t) => {
          const cat = categories.find((c) => c.id === t.categoryId)?.name || 'General';
          const time = t.startTime ? ` (${t.startTime} - ${t.endTime})` : '';
          return `• ${t.title}${time} [${cat}]`;
        })
        .join('\n');
      setAccomplishments(bulletPoints);
      setDailyReportText(`Completed today's scheduled deliverables: ${doneTasks.map((t) => t.title).join(', ')}. Everything executed on schedule.`);
      showToast({
        type: 'info',
        title: 'Report Synced with Tasks',
        message: `Updated with ${doneTasks.length} completed task(s).`,
      });
    } else {
      showToast({
        type: 'warning',
        title: 'No Completed Tasks',
        message: 'Mark tasks as completed in the checklist to auto-populate.',
      });
    }
  };

  // Quick helper to refresh tomorrow's plan
  const handleRefreshTomorrowPlan = () => {
    const nextDayObj = parseDate(selectedReportDate);
    nextDayObj.setDate(nextDayObj.getDate() + 1);
    const y = nextDayObj.getFullYear();
    const m = String(nextDayObj.getMonth() + 1).padStart(2, '0');
    const d = String(nextDayObj.getDate()).padStart(2, '0');
    const nextDayStr = `${y}-${m}-${d}`;

    const tomorrowTasks = tasks.filter((t) => t.date === nextDayStr);
    if (tomorrowTasks.length > 0) {
      const planBullets = tomorrowTasks
        .map((t) => {
          const time = t.startTime ? ` (${t.startTime} - ${t.endTime})` : '';
          return `• ${t.title}${time}`;
        })
        .join('\n');
      setTomorrowPlan(planBullets);
      showToast({
        type: 'info',
        title: "Tomorrow's Schedule Synced",
        message: `Loaded ${tomorrowTasks.length} scheduled item(s).`,
      });
    } else {
      showToast({
        type: 'info',
        title: 'No Tomorrow Tasks',
        message: 'No tasks are currently scheduled for the next day.',
      });
    }
  };

  // Date Navigator Controls
  const handleOffsetDay = (offset) => {
    const d = parseDate(selectedReportDate);
    d.setDate(d.getDate() + offset);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    setSelectedReportDate(`${y}-${m}-${day}`);
  };

  // Day calculations for the active report date
  const selectedDayTasks = tasks.filter((t) => t.date === selectedReportDate);
  const selectedDayStats = calculateTaskStats(selectedDayTasks);
  const plannedHours = selectedDayTasks
    .reduce((acc, t) => acc + calculateTaskHours(t), 0)
    .toFixed(1);
  const completedHours = selectedDayTasks
    .filter((t) => t.status === 'completed')
    .reduce((acc, t) => acc + calculateTaskHours(t), 0)
    .toFixed(1);

  // Formatted date string
  const formattedSelectedDay = formatDate(selectedReportDate, {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
  const isSelectedToday = selectedReportDate === todayStr;

  // Save Daily Report Handler
  const handleSaveReport = () => {
    const finalReportText = dailyReportText.trim() || accomplishments || 'Today completed routine scheduled deliverables and sprint tasks.';
    saveDailyReport({
      date: selectedReportDate,
      reportingTime: reportingTime || new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      dailyReportText: finalReportText,
      title: `Daily Work Report - ${formattedSelectedDay}`,
      accomplishments: finalReportText,
      highlights: highlights || 'Routine daily development',
      blockers: blockers || 'None',
      tomorrowPlan: tomorrowPlan || 'Continue scheduled deliverables',
      hoursLogged: parseFloat(hoursLogged) || 8.0,
      mood: mood || 'fire',
      tasksCompletedCount: selectedDayStats.completed,
      tasksTotalCount: selectedDayStats.total,
    });
    showToast({
      type: 'success',
      title: 'Daily Report Saved',
      message: `Report for ${formattedSelectedDay} saved successfully!`,
    });
  };

  // Copy Standup to Clipboard (Markdown formatted)
  const handleCopyStandup = () => {
    const finalReportText = dailyReportText.trim() || accomplishments || '• No specific items listed.';
    const standupMarkdown = [
      `# 📅 Daily Work Report: ${formattedSelectedDay}`,
      `**Reporting Time:** ${reportingTime || new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} | **Reporter:** ${user?.name || 'User'}`,
      `**Tasks Completed:** ${selectedDayStats.completed}/${selectedDayStats.total} (${selectedDayStats.percentage}%)`,
      '',
      `### 📝 Work Report Summary:`,
      finalReportText,
    ].join('\n');

    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(standupMarkdown).then(() => {
        showToast({
          type: 'success',
          title: 'Standup Copied to Clipboard',
          message: 'Formatted report ready to paste into Slack or Teams.',
        });
      });
    } else {
      showToast({
        type: 'info',
        title: 'Clipboard Unavailable',
        message: 'Could not access clipboard directly.',
      });
    }
  };

  // Filter tasks list on the left column
  const filteredDayTasks = selectedDayTasks.filter((t) => {
    if (taskFilter === 'completed') return t.status === 'completed';
    if (taskFilter === 'pending') return t.status !== 'completed';
    return true;
  });

  // Analytics tab calculations
  const getFilteredTasksForAnalytics = () => {
    if (timeRange === 'today') {
      return tasks.filter((t) => t.date === todayStr);
    }
    if (timeRange === 'week') {
      const now = new Date();
      const sevenDaysAgo = new Date(now);
      sevenDaysAgo.setDate(now.getDate() - 7);
      const minDate = sevenDaysAgo.toISOString().split('T')[0];
      return tasks.filter((t) => t.date >= minDate && t.date <= todayStr);
    }
    if (timeRange === 'month') {
      const now = new Date();
      const currentMonthPrefix = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
      return tasks.filter((t) => t.date && t.date.startsWith(currentMonthPrefix));
    }
    return tasks;
  };

  const analyticsTasks = getFilteredTasksForAnalytics();
  const analyticsStats = calculateTaskStats(analyticsTasks);
  const categoryData = getCategoryDistribution(analyticsTasks, categories).filter((c) => c.value > 0);
  const priorityData = getPriorityDistribution(analyticsTasks);
  const weeklyTrendData = getWeeklyProductivityTrend(tasks);
  const daysReport = getDaysReportingData(tasks, daysRangeMode);
  const selectedDayAnalyticsData =
    daysReport.days.find((d) => d.dateStr === selectedAnalyticsDate) || daysReport.days[0];

  // =========================================================================
  // SUB-REPORTS DATA & CONFIGURATIONS (Excel-Style Reports)
  // =========================================================================

  // Range presets: Today, Month, Last 6 Months, Year (default)
  const currentYear = new Date().getFullYear();
  const [reportDatePreset, setReportDatePreset] = useState('year');
  const [reportFromDate, setReportFromDate] = useState(currentYear + '-01-01');
  const [reportToDate, setReportToDate] = useState(currentYear + '-12-31');

  const handleApplyPreset = (presetId) => {
    setReportDatePreset(presetId);
    const now = new Date();
    const today = now.toISOString().split('T')[0];
    if (presetId === 'today') {
      setReportFromDate(today);
      setReportToDate(today);
    } else if (presetId === 'month') {
      const monthStart = now.getFullYear() + '-' + String(now.getMonth() + 1).padStart(2, '0') + '-01';
      setReportFromDate(monthStart);
      setReportToDate(today);
    } else if (presetId === '6months') {
      const sixAgo = new Date(now);
      sixAgo.setMonth(now.getMonth() - 6);
      setReportFromDate(sixAgo.toISOString().split('T')[0]);
      setReportToDate(today);
    } else if (presetId === 'year') {
      setReportFromDate(now.getFullYear() + '-01-01');
      setReportToDate(now.getFullYear() + '-12-31');
    }
  };

  // Filter tasks within selected date range
  const dateRangeTasks = useMemo(() => {
    return (tasks || []).filter((t) => {
      if (!t.date) return false;
      if (reportFromDate && t.date < reportFromDate) return false;
      if (reportToDate && t.date > reportToDate) return false;
      return true;
    });
  }, [tasks, reportFromDate, reportToDate]);

  // 1. Pending Tasks Report Data
  const pendingTasks = useMemo(() => {
    return dateRangeTasks.filter((t) => {
      const eff = getEffectiveStatus(t);
      return eff === 'pending' || (!t.completed && eff !== 'overdue');
    });
  }, [dateRangeTasks]);

  const pendingTableData = useMemo(() => {
    return pendingTasks.map((t) => {
      const cat = categories.find((c) => c.id === t.categoryId);
      const goal = goals.find((g) => g.id === t.goalId);
      return {
        id: t.id,
        title: t.title,
        category: cat?.name || 'General',
        date: t.date || '-',
        timeSlot: t.startTime && t.endTime ? `${t.startTime} - ${t.endTime}` : (t.startTime || 'Flexible'),
        priority: (t.priority || 'medium').toUpperCase(),
        goal: goal?.title || 'None',
        status: 'Pending',
        estimatedHours: t.estimatedHours || 1,
      };
    });
  }, [pendingTasks, categories, goals]);

  const pendingSummary = useMemo(() => {
    const highPri = pendingTasks.filter((t) => t.priority === 'high').length;
    const todayPending = pendingTasks.filter((t) => t.date === todayStr).length;
    const totalHours = pendingTasks.reduce((acc, t) => acc + (Number(t.estimatedHours) || 1), 0);
    return [
      { label: 'Pending Tasks', value: pendingTasks.length, badge: 'In Queue', color: 'var(--warning)' },
      { label: 'High Priority', value: highPri, badge: 'Urgent', color: 'var(--danger)' },
      { label: 'Due Today', value: todayPending, badge: 'Scheduled', color: 'var(--primary-color)' },
      { label: 'Est. Hours Remaining', value: `${totalHours} hrs`, badge: 'Effort', color: '#8B5CF6' },
    ];
  }, [pendingTasks, todayStr]);

  const pendingColumns = useMemo(() => [
    {
      key: 'title',
      label: 'Task Title',
      sortable: true,
      width: '280px',
      render: (val, row) => (
        <div>
          <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{val}</div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>ID: {row.id?.slice?.(0, 8) || row.id}</div>
        </div>
      ),
    },
    {
      key: 'category',
      label: 'Category',
      sortable: true,
      width: '140px',
      render: (val) => <span className="badge badge-secondary" style={{ fontSize: '0.78rem' }}>{val}</span>,
    },
    { key: 'date', label: 'Scheduled Date', sortable: true, width: '130px' },
    { key: 'timeSlot', label: 'Time Slot', sortable: true, width: '130px' },
    {
      key: 'priority',
      label: 'Priority',
      sortable: true,
      width: '110px',
      render: (val) => (
        <span
          className={`badge ${
            val === 'HIGH' ? 'badge-danger' : val === 'MEDIUM' ? 'badge-warning' : 'badge-primary'
          }`}
          style={{ fontSize: '0.75rem' }}
        >
          {val}
        </span>
      ),
    },
    { key: 'goal', label: 'Linked Goal', sortable: true, width: '160px' },
    {
      key: 'estimatedHours',
      label: 'Est. Hours',
      sortable: true,
      width: '100px',
      render: (val) => `${val}h`,
    },
    {
      key: 'status',
      label: 'Status',
      sortable: true,
      width: '110px',
      render: () => <span className="badge badge-warning" style={{ fontSize: '0.75rem' }}>Pending</span>,
    },
  ], []);

  // 2. Completed Tasks Report Data
  const completedTasks = useMemo(() => {
    return dateRangeTasks.filter((t) => t.completed || getEffectiveStatus(t) === 'completed');
  }, [dateRangeTasks]);

  const completedTableData = useMemo(() => {
    return completedTasks.map((t) => {
      const cat = categories.find((c) => c.id === t.categoryId);
      const goal = goals.find((g) => g.id === t.goalId);
      return {
        id: t.id,
        title: t.title,
        category: cat?.name || 'General',
        date: t.date || '-',
        completedAt: t.completedAt ? formatDate(t.completedAt) : (t.date || '-'),
        timeSlot: t.startTime && t.endTime ? `${t.startTime} - ${t.endTime}` : (t.startTime || '-'),
        priority: (t.priority || 'medium').toUpperCase(),
        goal: goal?.title || 'None',
        status: 'Completed',
        hoursLogged: t.actualHours || t.estimatedHours || 1,
      };
    });
  }, [completedTasks, categories, goals]);

  const completedSummary = useMemo(() => {
    const todayCompleted = completedTasks.filter((t) => t.date === todayStr || (t.completedAt && t.completedAt.startsWith(todayStr))).length;
    const highPri = completedTasks.filter((t) => t.priority === 'high').length;
    const totalHours = completedTasks.reduce((acc, t) => acc + (Number(t.actualHours) || Number(t.estimatedHours) || 1), 0);
    return [
      { label: 'Completed Tasks', value: completedTasks.length, badge: 'Finished', color: 'var(--success)' },
      { label: 'Completed Today', value: todayCompleted, badge: 'Today', color: 'var(--primary-color)' },
      { label: 'High Priority Accomplished', value: highPri, badge: 'High Impact', color: '#10B981' },
      { label: 'Total Hours Delivered', value: `${totalHours} hrs`, badge: 'Productive', color: '#6366F1' },
    ];
  }, [completedTasks, todayStr]);

  const completedColumns = useMemo(() => [
    {
      key: 'title',
      label: 'Task Title',
      sortable: true,
      width: '280px',
      render: (val) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <CheckCircle2 size={16} color="var(--success)" />
          <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{val}</span>
        </div>
      ),
    },
    {
      key: 'category',
      label: 'Category',
      sortable: true,
      width: '140px',
      render: (val) => <span className="badge badge-secondary" style={{ fontSize: '0.78rem' }}>{val}</span>,
    },
    { key: 'date', label: 'Scheduled Date', sortable: true, width: '130px' },
    { key: 'completedAt', label: 'Completed Date', sortable: true, width: '130px' },
    {
      key: 'priority',
      label: 'Priority',
      sortable: true,
      width: '110px',
      render: (val) => (
        <span
          className={`badge ${val === 'HIGH' ? 'badge-danger' : 'badge-primary'}`}
          style={{ fontSize: '0.75rem' }}
        >
          {val}
        </span>
      ),
    },
    { key: 'goal', label: 'Linked Goal', sortable: true, width: '160px' },
    {
      key: 'hoursLogged',
      label: 'Hours',
      sortable: true,
      width: '90px',
      render: (val) => `${val}h`,
    },
    {
      key: 'status',
      label: 'Status',
      sortable: true,
      width: '110px',
      render: () => <span className="badge badge-success" style={{ fontSize: '0.75rem' }}>Completed</span>,
    },
  ], []);

  // 3. Missed / Overdue Tasks Report Data
  const missedTasks = useMemo(() => {
    return tasks.filter((t) => {
      const eff = getEffectiveStatus(t);
      return eff === 'overdue' || (!t.completed && t.date && t.date < todayStr);
    });
  }, [tasks, todayStr]);

  const missedTableData = useMemo(() => {
    return missedTasks.map((t) => {
      const cat = categories.find((c) => c.id === t.categoryId);
      const goal = goals.find((g) => g.id === t.goalId);
      const daysDelayed = t.date ? Math.max(1, Math.floor((new Date(todayStr) - new Date(t.date)) / (1000 * 60 * 60 * 24))) : 1;
      return {
        id: t.id,
        title: t.title,
        category: cat?.name || 'General',
        date: t.date || '-',
        timeSlot: t.startTime && t.endTime ? `${t.startTime} - ${t.endTime}` : (t.startTime || 'Scheduled'),
        daysDelayed,
        priority: (t.priority || 'medium').toUpperCase(),
        goal: goal?.title || 'None',
        riskLevel: t.priority === 'high' || daysDelayed > 3 ? 'CRITICAL' : 'MODERATE',
        status: 'Missed / Overdue',
      };
    });
  }, [missedTasks, categories, goals, todayStr]);

  const missedSummary = useMemo(() => {
    const critical = missedTasks.filter((t) => t.priority === 'high').length;
    const maxDelay = missedTasks.reduce((max, t) => {
      if (!t.date) return max;
      const d = Math.max(0, Math.floor((new Date(todayStr) - new Date(t.date)) / (1000 * 60 * 60 * 24)));
      return d > max ? d : max;
    }, 0);
    return [
      { label: 'Missed / Overdue', value: missedTasks.length, badge: 'Action Required', color: 'var(--danger)' },
      { label: 'Critical / High Priority', value: critical, badge: 'Urgent', color: '#EF4444' },
      { label: 'Max Days Delayed', value: `+${maxDelay} days`, badge: 'Lag', color: '#F59E0B' },
      { label: 'Overdue Ratio', value: tasks.length ? `${Math.round((missedTasks.length / tasks.length) * 100)}%` : '0%', badge: 'Overall', color: '#EC4899' },
    ];
  }, [missedTasks, tasks.length, todayStr]);

  const missedColumns = useMemo(() => [
    {
      key: 'title',
      label: 'Missed Task',
      sortable: true,
      width: '280px',
      render: (val) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <AlertTriangle size={16} color="var(--danger)" />
          <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{val}</span>
        </div>
      ),
    },
    {
      key: 'category',
      label: 'Category',
      sortable: true,
      width: '140px',
      render: (val) => <span className="badge badge-secondary" style={{ fontSize: '0.78rem' }}>{val}</span>,
    },
    { key: 'date', label: 'Due Date', sortable: true, width: '120px' },
    { key: 'timeSlot', label: 'Time Slot', sortable: true, width: '120px' },
    {
      key: 'daysDelayed',
      label: 'Days Delayed',
      sortable: true,
      width: '110px',
      render: (val) => <span style={{ color: 'var(--danger)', fontWeight: 700 }}>+{val} day{val > 1 ? 's' : ''}</span>,
    },
    {
      key: 'priority',
      label: 'Priority',
      sortable: true,
      width: '100px',
      render: (val) => (
        <span
          className={`badge ${val === 'HIGH' ? 'badge-danger' : 'badge-warning'}`}
          style={{ fontSize: '0.75rem' }}
        >
          {val}
        </span>
      ),
    },
    {
      key: 'riskLevel',
      label: 'Risk Level',
      sortable: true,
      width: '110px',
      render: (val) => (
        <span
          className={`badge ${val === 'CRITICAL' ? 'badge-danger' : 'badge-warning'}`}
          style={{ fontSize: '0.75rem' }}
        >
          {val}
        </span>
      ),
    },
    {
      key: 'status',
      label: 'Status',
      sortable: true,
      width: '130px',
      render: () => <span className="badge badge-danger" style={{ fontSize: '0.75rem' }}>Overdue</span>,
    },
  ], []);

  // 4. Goal Progression Report Data
  const goalsTableData = useMemo(() => {
    return goals.map((goal) => {
      const cat = categories.find((c) => c.id === goal.categoryId);
      const linkedTasks = tasks.filter((t) => t.goalId === goal.id);
      const completedLinked = linkedTasks.filter((t) => t.completed || getEffectiveStatus(t) === 'completed');
      const pendingLinked = linkedTasks.filter((t) => !t.completed && getEffectiveStatus(t) !== 'completed');
      const progress = Math.min(100, Math.round(goal.progress ?? (linkedTasks.length ? (completedLinked.length / linkedTasks.length) * 100 : 0)));
      return {
        id: goal.id,
        title: goal.title,
        category: cat?.name || 'General',
        targetDate: goal.targetDate || goal.deadline || 'Ongoing',
        progress,
        totalTasks: linkedTasks.length,
        completedTasks: completedLinked.length,
        pendingTasks: pendingLinked.length,
        status: progress >= 100 ? 'Completed' : progress < 30 ? 'Needs Attention' : 'On Track',
      };
    });
  }, [goals, categories, tasks]);

  const goalsSummary = useMemo(() => {
    const completedGoals = goalsTableData.filter((g) => g.progress >= 100).length;
    const attentionGoals = goalsTableData.filter((g) => g.progress < 30).length;
    const avgProg = goalsTableData.length ? Math.round(goalsTableData.reduce((acc, g) => acc + g.progress, 0) / goalsTableData.length) : 0;
    return [
      { label: 'Total Tracked Goals', value: goalsTableData.length, badge: 'Targets', color: 'var(--primary-color)' },
      { label: 'Average Progression', value: `${avgProg}%`, badge: 'Velocity', color: '#8B5CF6' },
      { label: 'Completed Milestones', value: completedGoals, badge: 'Achieved', color: 'var(--success)' },
      { label: 'Needs Attention', value: attentionGoals, badge: 'Behind Target', color: 'var(--danger)' },
    ];
  }, [goalsTableData]);

  const goalsColumns = useMemo(() => [
    {
      key: 'title',
      label: 'Goal Title',
      sortable: true,
      width: '260px',
      render: (val) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Target size={16} color="var(--primary-color)" />
          <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{val}</span>
        </div>
      ),
    },
    {
      key: 'category',
      label: 'Category',
      sortable: true,
      width: '140px',
      render: (val) => <span className="badge badge-secondary" style={{ fontSize: '0.78rem' }}>{val}</span>,
    },
    { key: 'targetDate', label: 'Target Date', sortable: true, width: '130px' },
    {
      key: 'progress',
      label: 'Progression',
      sortable: true,
      width: '190px',
      render: (val) => (
        <div style={{ width: '100%' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', fontWeight: 700, marginBottom: '3px' }}>
            <span>Progress</span>
            <span>{val}%</span>
          </div>
          <div style={{ width: '100%', height: '7px', background: 'var(--border-color)', borderRadius: '4px', overflow: 'hidden' }}>
            <div style={{ width: `${val}%`, height: '100%', background: val >= 100 ? 'var(--success)' : 'var(--primary-color)', borderRadius: '4px' }} />
          </div>
        </div>
      ),
    },
    { key: 'totalTasks', label: 'Tasks', sortable: true, width: '80px' },
    {
      key: 'completedTasks',
      label: 'Done',
      sortable: true,
      width: '80px',
      render: (val) => <span style={{ color: 'var(--success)', fontWeight: 600 }}>{val}</span>,
    },
    {
      key: 'pendingTasks',
      label: 'Pending',
      sortable: true,
      width: '80px',
      render: (val) => <span style={{ color: 'var(--warning)', fontWeight: 600 }}>{val}</span>,
    },
    {
      key: 'status',
      label: 'Status',
      sortable: true,
      width: '140px',
      render: (val) => (
        <span
          className={`badge ${val === 'Completed' ? 'badge-success' : val === 'On Track' ? 'badge-primary' : 'badge-danger'}`}
          style={{ fontSize: '0.75rem' }}
        >
          {val}
        </span>
      ),
    },
  ], []);

  // 5. Red Flag Analysis Report Data
  const redFlagAnalysis = useMemo(() => {
    return analyzeRedFlags({
      tasks,
      categories,
      goals,
      workSessions,
      activeWorkSession,
      targetDate: selectedReportDate || todayStr,
    });
  }, [tasks, categories, goals, workSessions, activeWorkSession, selectedReportDate, todayStr]);

  const redFlagsTableData = useMemo(() => {
    return redFlagAnalysis.allFlags.map((flag) => ({
      id: flag.id,
      title: flag.title,
      type: flag.typeLabel,
      timeSlot: flag.timeSlot || 'N/A',
      reason: flag.reason,
      severity: flag.severity.toUpperCase(),
      recoveryProgress: flag.recoveryProgress ?? 0,
      status: flag.status === 'resolved' ? 'Recovered (Well Position)' : 'Active Red Flag',
    }));
  }, [redFlagAnalysis]);

  const redFlagsSummary = useMemo(() => {
    return [
      { label: 'Active Red Flags', value: redFlagAnalysis.activeFlags.length, badge: 'Current Lags', color: 'var(--danger)' },
      { label: 'Critical Lags', value: redFlagAnalysis.criticalCount, badge: 'Immediate Focus', color: '#DC2626' },
      { label: 'Recovered (Well Position)', value: redFlagAnalysis.recoveredFlags.length, badge: 'Resolved', color: 'var(--success)' },
      { label: 'Avg Recovery Velocity', value: `${redFlagAnalysis.activeFlags.length ? Math.round(redFlagAnalysis.activeFlags.reduce((a, f) => a + (f.recoveryProgress || 0), 0) / redFlagAnalysis.activeFlags.length) : 100}%`, badge: 'Catch-up', color: '#3B82F6' },
    ];
  }, [redFlagAnalysis]);

  const redFlagsColumns = useMemo(() => [
    {
      key: 'title',
      label: 'Lag Area / Task',
      sortable: true,
      width: '250px',
      render: (val, row) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Flag
            size={16}
            color={row.status.includes('Recovered') ? 'var(--success)' : 'var(--danger)'}
            fill={row.status.includes('Recovered') ? 'var(--success)' : 'var(--danger)'}
          />
          <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{val}</span>
        </div>
      ),
    },
    {
      key: 'type',
      label: 'Lag Type',
      sortable: true,
      width: '130px',
      render: (val) => <span className="badge badge-secondary" style={{ fontSize: '0.75rem' }}>{val}</span>,
    },
    { key: 'timeSlot', label: 'Time Slot', sortable: true, width: '120px' },
    {
      key: 'reason',
      label: 'Lag Diagnostic Reason',
      sortable: true,
      width: '280px',
      render: (val) => <span style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>{val}</span>,
    },
    {
      key: 'severity',
      label: 'Severity',
      sortable: true,
      width: '100px',
      render: (val) => (
        <span
          className={`badge ${val === 'CRITICAL' ? 'badge-danger' : val === 'HIGH' ? 'badge-danger' : 'badge-warning'}`}
          style={{ fontSize: '0.75rem' }}
        >
          {val}
        </span>
      ),
    },
    {
      key: 'recoveryProgress',
      label: 'Recovery Progress',
      sortable: true,
      width: '180px',
      render: (val) => (
        <div style={{ width: '100%' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', fontWeight: 700, marginBottom: '3px' }}>
            <span>Catch-up</span>
            <span style={{ color: val >= 100 ? 'var(--success)' : 'var(--primary-color)' }}>{val}%</span>
          </div>
          <div style={{ width: '100%', height: '7px', background: 'var(--border-color)', borderRadius: '4px', overflow: 'hidden' }}>
            <div
              style={{
                width: `${val}%`,
                height: '100%',
                background: val >= 100 ? 'var(--success)' : 'var(--primary-color)',
                borderRadius: '4px',
                transition: 'width 0.4s ease',
              }}
            />
          </div>
        </div>
      ),
    },
    {
      key: 'status',
      label: 'Status',
      sortable: true,
      width: '160px',
      render: (val) => (
        <span
          className={`badge ${val.includes('Recovered') ? 'badge-success' : 'badge-danger'}`}
          style={{ fontSize: '0.75rem' }}
        >
          {val}
        </span>
      ),
    },
  ], []);

  // 6. Tracker & Session Gap Logs Report Data
  const trackerLogsData = useMemo(() => {
    const targetDate = selectedReportDate || todayStr;
    const dateSessions = workSessions.filter((s) => s.date === targetDate);
    const dateChain = workChains?.[targetDate]?.chain || [];

    if (dateChain && dateChain.length > 0) {
      return dateChain.map((node, idx) => {
        const isWork = node.type === 'work';
        const taskObj = tasks.find((t) => t.id === node.taskId);
        return {
          id: node.id || `node-${idx}`,
          index: idx + 1,
          type: isWork ? 'Work Session' : 'Gap / Break',
          title: node.taskTitle || (taskObj ? taskObj.title : (isWork ? 'Focused Work Session' : (node.reason || 'Gap Interval'))),
          startTime: node.startTime || '-',
          endTime: node.endTime || '-',
          durationSeconds: node.durationSeconds || 0,
          durationFormatted: node.durationLabel || `${Math.floor((node.durationSeconds || 0) / 60)}m ${(node.durationSeconds || 0) % 60}s`,
          reason: isWork ? (node.stopReason || 'Active Work') : (node.reason || 'Break / Inactive Gap'),
          notes: node.notes || '-',
          taskAssociated: node.taskTitle || taskObj?.title || 'None',
          status: isWork ? 'Completed Work' : 'Break Logged',
        };
      });
    }

    const sorted = [...dateSessions].sort((a, b) => (a.startTime || '').localeCompare(b.startTime || ''));
    const rows = [];

    for (let i = 0; i < sorted.length; i++) {
      const sess = sorted[i];
      const durSec = sess.durationSeconds || 0;
      const durMin = Math.floor(durSec / 60);
      const durHr = Math.floor(durMin / 60);
      const remMin = durMin % 60;
      const durStr = durHr > 0 ? `${durHr}h ${remMin}m` : `${durMin}m ${durSec % 60}s`;

      if (i > 0 && sorted[i - 1].endTime && sess.startTime) {
        const prevEnd = sorted[i - 1].endTime;
        const curStart = sess.startTime;
        if (prevEnd < curStart) {
          rows.push({
            id: `gap-${i}`,
            index: rows.length + 1,
            type: 'Gap / Break',
            title: `Break / Idle Gap`,
            startTime: prevEnd,
            endTime: curStart,
            durationSeconds: 0,
            durationFormatted: `Interval`,
            reason: sorted[i - 1].stopReason || 'Paused Work / Intermission',
            notes: sorted[i - 1].notes || 'Interval between sessions',
            taskAssociated: '-',
            status: 'Break Interval',
          });
        }
      }

      rows.push({
        id: sess.id || `sess-${i}`,
        index: rows.length + 1,
        type: 'Work Session',
        title: sess.taskTitle || 'Focused Work Session',
        startTime: sess.startTime || '-',
        endTime: sess.endTime || '-',
        durationSeconds: durSec,
        durationFormatted: durStr,
        reason: sess.stopReason || 'Regular Work Interval',
        notes: sess.notes || '-',
        taskAssociated: sess.taskTitle || '-',
        status: 'Logged Work',
      });
    }

    return rows;
  }, [selectedReportDate, todayStr, workSessions, workChains, tasks]);

  const trackerLogsSummary = useMemo(() => {
    const workItems = trackerLogsData.filter((r) => r.type === 'Work Session');
    const gapItems = trackerLogsData.filter((r) => r.type === 'Gap / Break');
    const totalWorkSeconds = workItems.reduce((acc, r) => acc + (r.durationSeconds || 0), 0);
    const workHours = (totalWorkSeconds / 3600).toFixed(1);

    return [
      { label: 'Total Focused Work', value: `${workHours} hrs`, badge: 'Deep Focus', color: '#10B981' },
      { label: 'Work Sessions Logged', value: workItems.length, badge: 'Blocks', color: 'var(--primary-color)' },
      { label: 'Recorded Breaks & Gaps', value: gapItems.length, badge: 'Intermissions', color: '#F59E0B' },
      { label: 'Avg Session Duration', value: workItems.length ? `${Math.round((totalWorkSeconds / workItems.length) / 60)} min` : '0 min', badge: 'Efficiency', color: '#8B5CF6' },
    ];
  }, [trackerLogsData]);

  const trackerLogsColumns = useMemo(() => [
    {
      key: 'title',
      label: 'Session / Task Title',
      sortable: true,
      width: '260px',
      render: (val, row) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {row.type === 'Work Session' ? (
            <Timer size={16} color="#10B981" />
          ) : (
            <Coffee size={16} color="#F59E0B" />
          )}
          <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{val}</span>
        </div>
      ),
    },
    {
      key: 'type',
      label: 'Segment Type',
      sortable: true,
      width: '140px',
      render: (val) => (
        <span
          className={`badge ${val === 'Work Session' ? 'badge-success' : 'badge-warning'}`}
          style={{ fontSize: '0.74rem' }}
        >
          {val}
        </span>
      ),
    },
    { key: 'startTime', label: 'Start Time', sortable: true, width: '120px' },
    { key: 'endTime', label: 'End Time', sortable: true, width: '120px' },
    {
      key: 'durationFormatted',
      label: 'Duration',
      sortable: true,
      width: '110px',
      render: (val, row) => (
        <span style={{ fontWeight: 700, color: row.type === 'Work Session' ? '#10B981' : '#F59E0B' }}>
          {val}
        </span>
      ),
    },
    {
      key: 'reason',
      label: 'Stop / Gap Reason',
      sortable: true,
      width: '200px',
      render: (val) => <span className="badge badge-secondary" style={{ fontSize: '0.75rem' }}>{val}</span>,
    },
    {
      key: 'notes',
      label: 'Remarks / Notes',
      sortable: true,
      width: '240px',
      render: (val) => <span style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>{val}</span>,
    },
    {
      key: 'status',
      label: 'Status',
      sortable: true,
      width: '130px',
      render: (val, row) => (
        <span
          className={`badge ${row.type === 'Work Session' ? 'badge-primary' : 'badge-secondary'}`}
          style={{ fontSize: '0.74rem' }}
        >
          {val}
        </span>
      ),
    },
  ], []);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '26px' }}>
      {/* 1. Header with Mode Tabs */}
      <div
        className="card"
        style={{
          padding: '24px 28px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '18px',
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span className="badge badge-primary" style={{ padding: '4px 10px' }}>
              <FileSpreadsheet size={13} />
              Reporting & Diagnostics
            </span>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              Excel-Style Reports, Document Downloads & Red Flag Diagnostics
            </span>
          </div>
          <h1 style={{ fontSize: '1.65rem', fontWeight: 800, color: 'var(--text-primary)', marginTop: '6px' }}>
            Work Reporting & Export Hub
          </h1>
          <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
            Generate spreadsheet-style reports with instant Excel (.xlsx), Word (.doc), and PDF downloads.
          </p>
        </div>

        {/* Date Range Selector & Presets */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: 'var(--card-bg)',
            border: '1px solid var(--border-color)',
            borderRadius: '12px',
            padding: '10px 16px',
            marginBottom: '16px',
            flexWrap: 'wrap',
            gap: '12px',
            width: '100%',
          }}
        >
          {/* Quick Presets */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '0.78rem', fontWeight: 800, color: 'var(--text-secondary)', marginRight: '4px' }}>
              DATE FILTER:
            </span>
            {[
              { id: 'today', label: 'Today' },
              { id: 'month', label: 'This Month' },
              { id: '6months', label: 'Last 6 Months' },
              { id: 'year', label: 'Year (' + currentYear + ')' },
            ].map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => handleApplyPreset(p.id)}
                style={{
                  padding: '5px 12px',
                  borderRadius: '6px',
                  border: 'none',
                  fontSize: '0.78rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  background: reportDatePreset === p.id ? 'var(--primary-color)' : 'var(--page-bg)',
                  color: reportDatePreset === p.id ? '#FFFFFF' : 'var(--text-secondary)',
                }}
              >
                {p.label}
              </button>
            ))}
          </div>

          {/* From - To Date Pickers */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ fontSize: '0.76rem', color: 'var(--text-secondary)', fontWeight: 600 }}>From:</span>
              <input
                type="date"
                value={reportFromDate}
                onChange={(e) => {
                  setReportFromDate(e.target.value);
                  setReportDatePreset('custom');
                }}
                style={{
                  padding: '5px 8px',
                  borderRadius: '6px',
                  border: '1px solid var(--border-color)',
                  background: 'var(--page-bg)',
                  color: 'var(--text-primary)',
                  fontSize: '0.8rem',
                  outline: 'none',
                }}
              />
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ fontSize: '0.76rem', color: 'var(--text-secondary)', fontWeight: 600 }}>To:</span>
              <input
                type="date"
                value={reportToDate}
                onChange={(e) => {
                  setReportToDate(e.target.value);
                  setReportDatePreset('custom');
                }}
                style={{
                  padding: '5px 8px',
                  borderRadius: '6px',
                  border: '1px solid var(--border-color)',
                  background: 'var(--page-bg)',
                  color: 'var(--text-primary)',
                  fontSize: '0.8rem',
                  outline: 'none',
                }}
              />
            </div>

            <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#10B981', marginLeft: '6px' }}>
              ({dateRangeTasks.length} in range)
            </span>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* VIEW: PENDING TASKS EXCEL REPORT                                          */}
      {/* ========================================================================= */}
      {activeTab === 'pending' && (
        <ExcelReportTable
          title="Pending Tasks Report"
          subtitle="All queued, scheduled, and in-progress tasks awaiting completion"
          summaryCards={pendingSummary}
          columns={pendingColumns}
          data={pendingTableData}
          defaultSortKey="date"
          exportFileName="MySchedule_Pending_Tasks"
          sheetName="PendingTasks"
        />
      )}

      {/* ========================================================================= */}
      {/* VIEW: COMPLETED TASKS EXCEL REPORT                                        */}
      {/* ========================================================================= */}
      {activeTab === 'completed' && (
        <ExcelReportTable
          title="Completed Tasks Report"
          subtitle="All accomplished tasks, milestones, and productive work output"
          summaryCards={completedSummary}
          columns={completedColumns}
          data={completedTableData}
          defaultSortKey="completedAt"
          exportFileName="MySchedule_Completed_Tasks"
          sheetName="CompletedTasks"
        />
      )}

      {/* ========================================================================= */}
      {/* VIEW: MISSED / OVERDUE TASKS EXCEL REPORT                                  */}
      {/* ========================================================================= */}
      {activeTab === 'missed' && (
        <ExcelReportTable
          title="Missed & Overdue Tasks Report"
          subtitle="Tasks that missed their scheduled deadlines or time slots requiring catch-up"
          summaryCards={missedSummary}
          columns={missedColumns}
          data={missedTableData}
          defaultSortKey="daysDelayed"
          exportFileName="MySchedule_Missed_Tasks"
          sheetName="MissedTasks"
        />
      )}

      {/* ========================================================================= */}
      {/* VIEW: GOAL PROGRESSION EXCEL REPORT                                       */}
      {/* ========================================================================= */}
      {activeTab === 'goals' && (
        <ExcelReportTable
          title="Goal Progression & Milestones Report"
          subtitle="Comprehensive tracking of strategic goals, completion velocity, and deliverables"
          summaryCards={goalsSummary}
          columns={goalsColumns}
          data={goalsTableData}
          defaultSortKey="progress"
          exportFileName="MySchedule_Goal_Progression"
          sheetName="GoalProgression"
        />
      )}

      {/* ========================================================================= */}
      {/* VIEW: RED FLAG LAG & RECOVERY EXCEL REPORT                                */}
      {/* ========================================================================= */}
      {activeTab === 'red-flags' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div
            style={{
              padding: '16px 20px',
              borderRadius: 'var(--radius-lg)',
              background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.08) 0%, rgba(245, 158, 11, 0.05) 100%)',
              border: '1.5px solid rgba(239, 68, 68, 0.25)',
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
                  width: '40px',
                  height: '40px',
                  borderRadius: '10px',
                  background: 'rgba(239, 68, 68, 0.15)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'var(--danger)',
                }}
              >
                <Flag size={20} />
              </div>
              <div>
                <h4 style={{ margin: 0, fontWeight: 700, color: 'var(--text-primary)' }}>
                  Intelligent Red Flag & Lag Assessment
                </h4>
                <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                  Identifies missed time slots, inactive categories, and lagging goals with real-time recovery tracking.
                </p>
              </div>
            </div>
            {/* Internal navigation removed - navigate via sidebar */}
          </div>

          <ExcelReportTable
            title="Red Flag Diagnostic & Recovery Report"
            subtitle="Detailed analysis of lag areas with real-time recovery progression and auto-clearing"
            summaryCards={redFlagsSummary}
            columns={redFlagsColumns}
            data={redFlagsTableData}
            defaultSortKey="recoveryProgress"
            exportFileName="MySchedule_Red_Flags_Report"
            sheetName="RedFlagReport"
          />
        </div>
      )}

      {/* ========================================================================= */}
      {/* VIEW: WORK TRACKER & SESSION GAP LOGS EXCEL REPORT                        */}
      {/* ========================================================================= */}
      {activeTab === 'tracker-logs' && (
        <ExcelReportTable
          title="Today's Work Tracker & Session Logs (Gaps & Reasons)"
          subtitle={`Chronological timeline of focused work sessions, pauses, gap reasons and remarks for ${selectedReportDate || todayStr}`}
          summaryCards={trackerLogsSummary}
          columns={trackerLogsColumns}
          data={trackerLogsData}
          defaultSortKey="startTime"
          exportFileName={`MySchedule_Work_Tracker_Gaps_${selectedReportDate || todayStr}`}
          sheetName="WorkTrackerLogs"
        />
      )}

      {/* ========================================================================= */}
      {/* VIEW: TODAY'S WORK REPORT (DAILY WORK REPORTING & STANDUP LOG)             */}
      {/* ========================================================================= */}
      {activeTab === 'today-report' && (
        <>
          {/* Day Selector & Action Ribbon */}
          <div className="daily-report-header">
            {/* Left: Date Navigator */}
            <div className="daily-date-nav">
              <button
                type="button"
                className="btn btn-ghost btn-sm"
                onClick={() => handleOffsetDay(-1)}
                title="Previous Day"
              >
                <ChevronLeft size={16} /> Prev Day
              </button>

              <button
                type="button"
                className={`btn btn-sm ${isSelectedToday ? 'btn-primary' : 'btn-ghost'}`}
                onClick={() => setSelectedReportDate(todayStr)}
              >
                <Calendar size={14} /> Today
              </button>

              <button
                type="button"
                className="btn btn-ghost btn-sm"
                onClick={() => handleOffsetDay(1)}
                title="Next Day"
              >
                Next Day <ChevronRight size={16} />
              </button>

              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginLeft: '6px' }}>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Jump to:</span>
                <input
                  type="date"
                  className="date-input-picker"
                  value={selectedReportDate}
                  onChange={(e) => e.target.value && setSelectedReportDate(e.target.value)}
                />
              </div>
            </div>

            {/* Middle: Day Header Display */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{ textAlign: 'right' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', justifyContent: 'flex-end' }}>
                  <strong style={{ fontSize: '1.05rem', color: 'var(--text-primary)' }}>
                    {formattedSelectedDay}
                  </strong>
                  {isSelectedToday && (
                    <span className="badge badge-success" style={{ fontSize: '0.7rem', padding: '2px 8px' }}>
                      Today
                    </span>
                  )}
                </div>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                  {savedReportForSelectedDate ? (
                    <span style={{ color: 'var(--success)', fontWeight: 600 }}>
                      ✓ Submitted & Saved in History
                    </span>
                  ) : (
                    <span style={{ color: 'var(--warning)', fontWeight: 600 }}>
                      📝 Draft (Unsaved)
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Right: Primary Action Buttons */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <button
                type="button"
                className="btn btn-ghost btn-sm btn-no-print"
                onClick={handleCopyStandup}
                title="Copy formatted standup markdown for Slack / Teams"
              >
                <Copy size={15} /> Copy Standup
              </button>

              <button
                type="button"
                className="btn btn-ghost btn-sm btn-no-print"
                onClick={() => window.print()}
                title="Print daily report"
              >
                <Printer size={15} /> Print
              </button>

              <button
                type="button"
                className="btn btn-primary btn-sm btn-no-print"
                onClick={handleSaveReport}
              >
                <Save size={15} /> Save Daily Report
              </button>
            </div>
          </div>

          {/* Quick Real-Time Metrics for Selected Day */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
              gap: '16px',
            }}
          >
            <div className="card" style={{ padding: '16px 20px' }}>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 600 }}>
                Scheduled Tasks
              </div>
              <div style={{ fontSize: '1.65rem', fontWeight: 800, marginTop: '4px' }}>
                {selectedDayStats.total}
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                Planned for this date
              </div>
            </div>

            <div className="card" style={{ padding: '16px 20px' }}>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 600 }}>
                Tasks Completed
              </div>
              <div style={{ fontSize: '1.65rem', fontWeight: 800, color: 'var(--success)', marginTop: '4px' }}>
                {selectedDayStats.completed}
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                {selectedDayStats.pending} pending / {selectedDayStats.overdue} overdue
              </div>
            </div>

            <div className="card" style={{ padding: '16px 20px' }}>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 600 }}>
                Day Completion Rate
              </div>
              <div
                style={{
                  fontSize: '1.65rem',
                  fontWeight: 800,
                  color: 'var(--primary-color)',
                  marginTop: '4px',
                }}
              >
                {selectedDayStats.percentage}%
              </div>
              <div style={{ marginTop: '6px' }}>
                <ProgressBar progress={selectedDayStats.percentage} color="var(--primary-color)" />
              </div>
            </div>

            <div className="card" style={{ padding: '16px 20px' }}>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 600 }}>
                Work Hours Logged
              </div>
              <div
                style={{
                  fontSize: '1.65rem',
                  fontWeight: 800,
                  color: 'var(--text-primary)',
                  marginTop: '4px',
                }}
              >
                {hoursLogged} hrs
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                {completedHours} hrs completed of {plannedHours} planned
              </div>
            </div>

            <div className="card" style={{ padding: '16px 20px' }}>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 600 }}>
                Productivity Velocity
              </div>
              <div style={{ fontSize: '1.35rem', fontWeight: 800, marginTop: '6px' }}>
                {mood === 'fire' && <span style={{ color: '#F97316' }}>🔥 High Velocity</span>}
                {mood === 'rocket' && <span style={{ color: '#1769FF' }}>🚀 On Track</span>}
                {mood === 'coffee' && <span style={{ color: '#F59E0B' }}>☕ Steady Pace</span>}
                {mood === 'blocked' && <span style={{ color: '#EF4444' }}>⚠️ Blocked</span>}
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                Self-assessed momentum
              </div>
            </div>
          </div>

          {/* 2-Column Main Workspace */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(12, 1fr)', gap: '22px' }}>
            {/* Left Column: Day Tasks & Real-Time Schedule Checklist (5 Cols) */}
            <div style={{ gridColumn: 'span 5' }} className="report-chart-col">
              <div
                className="card"
                style={{
                  padding: '22px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '16px',
                  height: '100%',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div>
                    <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                      Tasks for this Day
                    </h3>
                    <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                      Click checkbox to mark work as done
                    </span>
                  </div>
                  <button
                    type="button"
                    className="btn btn-primary btn-sm btn-no-print"
                    onClick={() => openModal('task', { date: selectedReportDate })}
                  >
                    <Plus size={14} /> Add Task
                  </button>
                </div>

                {/* Filter Tabs */}
                <div
                  style={{
                    display: 'flex',
                    gap: '4px',
                    padding: '3px',
                    background: 'var(--page-bg)',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--border-color)',
                  }}
                >
                  {[
                    { id: 'all', label: `All (${selectedDayTasks.length})` },
                    { id: 'completed', label: `Done (${selectedDayStats.completed})` },
                    { id: 'pending', label: `Pending (${selectedDayStats.pending})` },
                  ].map((f) => (
                    <button
                      key={f.id}
                      type="button"
                      className={`btn btn-sm ${taskFilter === f.id ? 'btn-primary' : 'btn-ghost'}`}
                      style={{ flex: 1, fontSize: '0.76rem', padding: '4px 6px' }}
                      onClick={() => setTaskFilter(f.id)}
                    >
                      {f.label}
                    </button>
                  ))}
                </div>

                {/* Task Checklist Items */}
                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '8px',
                    flex: 1,
                    minHeight: 0,
                    overflowY: 'auto',
                    paddingRight: '4px',
                  }}
                >
                  {filteredDayTasks.length === 0 ? (
                    <div
                      style={{
                        padding: '32px 16px',
                        textAlign: 'center',
                        color: 'var(--text-muted)',
                        background: 'var(--page-bg)',
                        borderRadius: 'var(--radius-md)',
                        border: '1px dashed var(--border-color)',
                        fontSize: '0.88rem',
                      }}
                    >
                      No tasks found for this day under the selected filter.
                      <div style={{ marginTop: '10px' }}>
                        <button
                          type="button"
                          className="btn btn-ghost btn-sm"
                          onClick={() => openModal('task', { date: selectedReportDate })}
                        >
                          + Schedule a Task
                        </button>
                      </div>
                    </div>
                  ) : (
                    filteredDayTasks.map((task) => {
                      const isCompleted = task.status === 'completed';
                      const cat = categories.find((c) => c.id === task.categoryId);
                      const linkedGoal = goals.find((g) => g.id === task.goalId);

                      return (
                        <div
                          key={task.id}
                          className={`report-task-row ${isCompleted ? 'completed' : ''}`}
                        >
                          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', flex: 1 }}>
                            <button
                              type="button"
                              className={`report-task-checkbox ${isCompleted ? 'checked' : ''}`}
                              onClick={() => toggleTaskComplete(task.id)}
                              title={isCompleted ? 'Mark Pending' : 'Mark Completed'}
                            >
                              {isCompleted && <Check size={14} />}
                            </button>

                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div
                                style={{
                                  fontSize: '0.9rem',
                                  fontWeight: 600,
                                  color: isCompleted ? 'var(--text-muted)' : 'var(--text-primary)',
                                  textDecoration: isCompleted ? 'line-through' : 'none',
                                  wordBreak: 'break-word',
                                }}
                              >
                                {task.title}
                              </div>

                              <div
                                style={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '8px',
                                  flexWrap: 'wrap',
                                  fontSize: '0.75rem',
                                  color: 'var(--text-secondary)',
                                  marginTop: '4px',
                                }}
                              >
                                {task.startTime && (
                                  <span style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
                                    <Clock size={12} />
                                    {formatTime(task.startTime)} - {formatTime(task.endTime)}
                                  </span>
                                )}

                                {cat && (
                                  <span
                                    style={{
                                      display: 'inline-flex',
                                      alignItems: 'center',
                                      gap: '4px',
                                      padding: '1px 6px',
                                      borderRadius: '4px',
                                      backgroundColor: 'var(--card-bg)',
                                      border: '1px solid var(--border-color)',
                                      fontSize: '0.7rem',
                                    }}
                                  >
                                    <span
                                      style={{
                                        width: '6px',
                                        height: '6px',
                                        borderRadius: '50%',
                                        backgroundColor: cat.color,
                                      }}
                                    />
                                    {cat.name}
                                  </span>
                                )}

                                {linkedGoal && (
                                  <span
                                    style={{
                                      display: 'inline-flex',
                                      alignItems: 'center',
                                      gap: '3px',
                                      fontSize: '0.7rem',
                                      color: 'var(--primary-color)',
                                    }}
                                    title={`Linked to: ${linkedGoal.title}`}
                                  >
                                    <Target size={11} /> {linkedGoal.title.substring(0, 16)}...
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>

                {/* Quick Helper to Push Completed Tasks into Accomplishments */}
                <div style={{ marginTop: 'auto', paddingTop: '10px', borderTop: '1px solid var(--border-color)' }}>
                  <button
                    type="button"
                    className="btn btn-ghost btn-sm btn-no-print"
                    style={{ width: '100%', justifyContent: 'center', color: 'var(--primary-color)' }}
                    onClick={handleRefreshAccomplishments}
                  >
                    <RefreshCw size={14} /> Sync Completed Tasks into Report
                  </button>
                </div>
              </div>
            </div>

            {/* Right Column: Single-Paragraph Daily Work Report & Reporting Time */}
            <div style={{ gridColumn: 'span 7', minWidth: 0 }} className="report-chart-col">
              <div
                className="card"
                style={{
                  padding: '24px 22px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '18px',
                  background: 'var(--card-bg)',
                  border: '1.5px solid var(--border-color)',
                  boxShadow: 'var(--shadow-md)',
                  borderRadius: 'var(--radius-lg)',
                }}
              >
                {/* 1. Header with Status & Top Quick Actions */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    borderBottom: '1px solid var(--border-color)',
                    paddingBottom: '16px',
                    flexWrap: 'wrap',
                    gap: '12px',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div
                      style={{
                        width: '38px',
                        height: '38px',
                        borderRadius: '10px',
                        background: 'rgba(23, 105, 255, 0.12)',
                        color: 'var(--primary-color)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        border: '1px solid rgba(23, 105, 255, 0.25)',
                      }}
                    >
                      <FileText size={18} />
                    </div>
                    <div>
                      <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
                        Daily Work Report & Standup
                      </h3>
                      <div style={{ fontSize: '0.76rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
                        Enter your daily work summary note and reporting details
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    {savedReportForSelectedDate ? (
                      <span
                        style={{
                          fontSize: '0.72rem',
                          fontWeight: 700,
                          padding: '4px 10px',
                          borderRadius: '999px',
                          background: 'rgba(16, 185, 129, 0.12)',
                          color: '#10B981',
                          border: '1px solid rgba(16, 185, 129, 0.3)',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px',
                        }}
                      >
                        <CheckCircle2 size={12} /> Saved in Archive
                      </span>
                    ) : (
                      <span
                        style={{
                          fontSize: '0.72rem',
                          fontWeight: 700,
                          padding: '4px 10px',
                          borderRadius: '999px',
                          background: 'rgba(245, 158, 11, 0.12)',
                          color: '#F59E0B',
                          border: '1px solid rgba(245, 158, 11, 0.3)',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px',
                        }}
                      >
                        ● Ready to Submit
                      </span>
                    )}

                    <button
                      type="button"
                      className="btn btn-primary btn-sm btn-no-print"
                      onClick={handleSaveReport}
                      style={{
                        padding: '7px 18px',
                        fontSize: '0.84rem',
                        fontWeight: 800,
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                      }}
                    >
                      <Save size={15} /> Save Report
                    </button>
                  </div>
                </div>

                {/* 2. Metadata Bar: Default Selected Date + Reporting Time */}
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                    gap: '12px',
                    padding: '12px 16px',
                    background: 'var(--page-bg)',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--border-color)',
                  }}
                >
                  {/* Selected Date */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.72rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.03em' }}>
                      <Calendar size={13} color="var(--primary-color)" />
                      Selected Date
                    </div>
                    <input
                      type="date"
                      value={selectedReportDate}
                      onChange={(e) => e.target.value && setSelectedReportDate(e.target.value)}
                      style={{
                        padding: '7px 10px',
                        borderRadius: '6px',
                        border: '1px solid var(--border-color)',
                        background: 'var(--card-bg)',
                        color: 'var(--text-primary)',
                        fontSize: '0.86rem',
                        fontWeight: 700,
                        outline: 'none',
                      }}
                    />
                  </div>

                  {/* Reporting Time */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.72rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.03em' }}>
                      <Clock size={13} color="#10B981" />
                      Reporting Time
                    </div>
                    <input
                      type="text"
                      value={reportingTime}
                      onChange={(e) => setReportingTime(e.target.value)}
                      placeholder="Enter time (HH:MM AM/PM)"
                      style={{
                        padding: '7px 10px',
                        borderRadius: '6px',
                        border: '1px solid var(--border-color)',
                        background: 'var(--card-bg)',
                        color: 'var(--text-primary)',
                        fontSize: '0.86rem',
                        fontWeight: 700,
                        outline: 'none',
                      }}
                    />
                  </div>
                </div>

                {/* 3. The One Single Paragraph Box */}
                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '10px',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
                    <div>
                      <div style={{ fontSize: '0.92rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                        Today's Work Report (Single Paragraph)
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                        Write your complete daily work summary for {formattedSelectedDay} below
                      </div>
                    </div>

                    <button
                      type="button"
                      className="btn btn-ghost btn-sm btn-no-print"
                      onClick={() => {
                        const dayTasks = tasks.filter((t) => t.date === selectedReportDate);
                        const doneTasks = dayTasks.filter((t) => t.status === 'completed');
                        if (doneTasks.length > 0) {
                          const taskSummary = doneTasks.map((t) => t.title).join(', ');
                          setDailyReportText(`Completed today's scheduled tasks: ${taskSummary}. Work delivered on time with steady progress.`);
                          showToast({
                            type: 'info',
                            title: 'Synced from Tasks',
                            message: `Auto-populated summary with ${doneTasks.length} completed task(s).`,
                          });
                        } else {
                          showToast({
                            type: 'info',
                            title: 'No Completed Tasks',
                            message: 'Mark tasks as completed in the left column to auto-populate.',
                          });
                        }
                      }}
                      style={{
                        fontSize: '0.76rem',
                        padding: '5px 12px',
                        color: 'var(--primary-color)',
                        background: 'var(--page-bg)',
                        border: '1px solid var(--border-color)',
                        borderRadius: 'var(--radius-md)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        fontWeight: 600,
                      }}
                      title="Auto-populate paragraph from completed tasks"
                    >
                      <Sparkles size={13} /> Auto-fill from Today's Tasks
                    </button>
                  </div>

                  <textarea
                    rows={9}
                    className="daily-report-textarea"
                    placeholder="Write your daily work report here... (e.g., Completed scheduled sprint deliverables, resolved pending API integration tasks, reviewed repository PRs, and verified readiness for tomorrow.)"
                    value={dailyReportText}
                    onChange={(e) => setDailyReportText(e.target.value)}
                    style={{
                      width: '100%',
                      borderRadius: 'var(--radius-md)',
                      background: 'var(--page-bg)',
                      border: '1.5px solid var(--border-color)',
                      fontSize: '0.92rem',
                      lineHeight: '1.7',
                      padding: '14px 16px',
                      color: 'var(--text-primary)',
                      outline: 'none',
                      resize: 'vertical',
                      minHeight: '200px',
                    }}
                  />
                </div>

                {/* 4. Bottom Actions & Confirmation Footer */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    paddingTop: '16px',
                    borderTop: '1px solid var(--border-color)',
                    flexWrap: 'wrap',
                    gap: '12px',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                    <span>📅 <strong>{formattedSelectedDay}</strong></span>
                    <span>·</span>
                    <span>🕒 <strong>{reportingTime}</strong></span>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <button
                      type="button"
                      className="btn btn-ghost btn-sm btn-no-print"
                      onClick={handleCopyStandup}
                      style={{ padding: '8px 14px', fontSize: '0.84rem', fontWeight: 600 }}
                    >
                      <Copy size={14} /> Copy Standup
                    </button>
                    <button
                      type="button"
                      className="btn btn-primary btn-sm btn-no-print"
                      onClick={handleSaveReport}
                      style={{
                        padding: '8px 22px',
                        fontSize: '0.86rem',
                        fontWeight: 800,
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                      }}
                    >
                      <Save size={15} /> Save Daily Report
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* ========================================================================= */}
          {/* 3. SUBMITTED DAILY REPORTS ARCHIVE CTA & QUICK STRIP                      */}
          {/* ========================================================================= */}
          <div className="card" style={{ padding: '22px 26px', marginTop: '16px' }}>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: '14px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div
                  style={{
                    width: '42px',
                    height: '42px',
                    borderRadius: '10px',
                    background: 'rgba(var(--primary-rgb, 16, 185, 129), 0.12)',
                    color: 'var(--primary-color)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}
                >
                  <Archive size={20} />
                </div>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
                      Submitted Daily Work Reports Archive
                    </h3>
                    <span className="badge badge-primary" style={{ fontSize: '0.72rem' }}>
                      {dailyReports.length} {dailyReports.length === 1 ? 'Report' : 'Reports'}
                    </span>
                  </div>
                  <span style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                    All past daily standup logs, velocity statuses, and accomplishments are organized on a dedicated page with Cards, Table, and Timeline views.
                  </span>
                </div>
              </div>

              {/* Internal navigation removed - navigate via sidebar */}
            </div>

            {/* Recent Reports Quick Strip */}
            {dailyReports.length > 0 && (
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
                  gap: '12px',
                  marginTop: '16px',
                  paddingTop: '16px',
                  borderTop: '1px solid var(--border-color)',
                }}
              >
                {dailyReports.slice(0, 3).map((r) => {
                  const moodMeta = MOOD_METADATA[r.mood] || MOOD_METADATA.productive;
                  const formattedDate = formatDate(r.date, {
                    weekday: 'short',
                    month: 'short',
                    day: 'numeric',
                  });

                  return (
                    <div
                      key={r.id || r.date}
                      onClick={() => navigate('/archive')}
                      style={{
                        padding: '10px 14px',
                        borderRadius: 'var(--radius-md)',
                        background: 'var(--page-bg)',
                        border: '1px solid var(--border-color)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        cursor: 'pointer',
                        transition: 'all 0.15s ease',
                      }}
                      className="history-report-card"
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Calendar size={13} color="var(--primary-color)" />
                        <span style={{ fontSize: '0.84rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                          {formattedDate}
                        </span>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>
                          {r.hoursLogged || '7.0'}h
                        </span>
                        <span
                          className="badge"
                          style={{
                            background: moodMeta.bg,
                            color: moodMeta.color,
                            fontSize: '0.68rem',
                            padding: '1px 6px',
                          }}
                        >
                          {moodMeta.emoji} {moodMeta.label}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </>
      )}

      {/* ========================================================================= */}
      {/* VIEW 2: SCHEDULE ANALYTICS & TRENDS                                        */}
      {/* ========================================================================= */}
      {activeTab === 'analytics' && (
        <>
          {/* Global Time Range Selector */}
          <div
            className="card"
            style={{
              padding: '16px 24px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '12px',
            }}
          >
            <div>
              <h2 style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                Comprehensive Metrics & Distribution
              </h2>
              <span style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                Select aggregate time range for macro analysis
              </span>
            </div>

            <div
              style={{
                display: 'flex',
                background: 'var(--page-bg)',
                border: '1px solid var(--border-color)',
                borderRadius: 'var(--radius-md)',
                padding: '3px',
                gap: '2px',
              }}
            >
              {[
                { id: 'today', label: 'Today' },
                { id: 'week', label: 'This Week' },
                { id: 'month', label: 'This Month' },
                { id: 'all', label: 'All Time' },
              ].map((t) => (
                <button
                  key={t.id}
                  type="button"
                  className={`btn btn-sm ${timeRange === t.id ? 'btn-primary' : 'btn-ghost'}`}
                  onClick={() => setTimeRange(t.id)}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          {/* KPI Summary Cards */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))',
              gap: '16px',
            }}
          >
            <div className="card" style={{ padding: '18px 22px' }}>
              <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', fontWeight: 600 }}>
                Total Tasks
              </div>
              <div style={{ fontSize: '1.8rem', fontWeight: 800, marginTop: '4px' }}>
                {analyticsStats.total}
              </div>
            </div>

            <div className="card" style={{ padding: '18px 22px' }}>
              <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', fontWeight: 600 }}>
                Completion Rate
              </div>
              <div
                style={{
                  fontSize: '1.8rem',
                  fontWeight: 800,
                  color: 'var(--primary-color)',
                  marginTop: '4px',
                }}
              >
                {analyticsStats.percentage}%
              </div>
            </div>

            <div className="card" style={{ padding: '18px 22px' }}>
              <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', fontWeight: 600 }}>
                Completed Tasks
              </div>
              <div style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--success)', marginTop: '4px' }}>
                {analyticsStats.completed}
              </div>
            </div>

            <div className="card" style={{ padding: '18px 22px' }}>
              <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', fontWeight: 600 }}>
                Pending Tasks
              </div>
              <div style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--warning)', marginTop: '4px' }}>
                {analyticsStats.pending}
              </div>
            </div>

            <div className="card" style={{ padding: '18px 22px' }}>
              <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', fontWeight: 600 }}>
                Overdue Tasks
              </div>
              <div style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--danger)', marginTop: '4px' }}>
                {analyticsStats.overdue}
              </div>
            </div>
          </div>

          {/* DEDICATED MODULE: DAYS REPORTING (DAY-BY-DAY BREAKDOWN) */}
          <section
            className="card"
            style={{
              padding: '28px',
              background: 'var(--card-bg)',
              border: '1.5px solid var(--border-color)',
              boxShadow: 'var(--shadow-md)',
              display: 'flex',
              flexDirection: 'column',
              gap: '24px',
            }}
            id="days-reporting-module"
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: '16px',
                borderBottom: '1px solid var(--border-color)',
                paddingBottom: '20px',
              }}
            >
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span className="badge badge-primary" style={{ padding: '4px 10px' }}>
                    <Calendar size={13} />
                    Days Reporting Breakdown
                  </span>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                    Granular Daily Performance
                  </span>
                </div>
                <h2 style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--text-primary)', marginTop: '6px' }}>
                  Day-by-Day Detailed Productivity
                </h2>
              </div>

              {/* Days Reporting Range Toggle */}
              <div
                style={{
                  display: 'flex',
                  background: 'var(--page-bg)',
                  border: '1px solid var(--border-color)',
                  borderRadius: 'var(--radius-md)',
                  padding: '3px',
                  gap: '2px',
                }}
              >
                {[
                  { id: '7days', label: 'Last 7 Days' },
                  { id: '14days', label: 'Last 14 Days' },
                  { id: 'month', label: 'Month Days' },
                ].map((mode) => (
                  <button
                    key={mode.id}
                    type="button"
                    className={`btn btn-sm ${daysRangeMode === mode.id ? 'btn-primary' : 'btn-ghost'}`}
                    onClick={() => setDaysRangeMode(mode.id)}
                  >
                    {mode.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Days Module Quick Metrics */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                gap: '14px',
              }}
            >
              <div
                style={{
                  padding: '14px 18px',
                  borderRadius: 'var(--radius-md)',
                  background: 'var(--page-bg)',
                  border: '1px solid var(--border-color)',
                }}
              >
                <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>Avg. Completed / Day</div>
                <div style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--primary-color)', marginTop: '2px' }}>
                  {daysReport.avgCompletedPerDay} tasks
                </div>
              </div>

              <div
                style={{
                  padding: '14px 18px',
                  borderRadius: 'var(--radius-md)',
                  background: 'var(--page-bg)',
                  border: '1px solid var(--border-color)',
                }}
              >
                <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>Most Productive Day</div>
                <div style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--success)', marginTop: '2px' }}>
                  {daysReport.bestDay.dayName} ({daysReport.bestDay.count} done)
                </div>
              </div>

              <div
                style={{
                  padding: '14px 18px',
                  borderRadius: 'var(--radius-md)',
                  background: 'var(--page-bg)',
                  border: '1px solid var(--border-color)',
                }}
              >
                <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>Active Logged Days</div>
                <div style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--text-primary)', marginTop: '2px' }}>
                  {daysReport.daysWithTasksCount} of {daysReport.days.length} days
                </div>
              </div>

              <div
                style={{
                  padding: '14px 18px',
                  borderRadius: 'var(--radius-md)',
                  background: 'var(--page-bg)',
                  border: '1px solid var(--border-color)',
                }}
              >
                <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>Selected Day Focus</div>
                <div style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--primary-color)', marginTop: '2px' }}>
                  {selectedDayAnalyticsData?.fullDate || 'Select a day'}
                </div>
              </div>
            </div>

            {/* Days Interactive Chart */}
            <div>
              <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '12px' }}>
                Daily Tasks Breakdown (Click any bar to inspect day details)
              </h3>
              <div style={{ width: '100%', height: 260 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={daysReport.days.slice().reverse()}
                    onClick={(e) => {
                      if (e && e.activePayload && e.activePayload[0]) {
                        setSelectedAnalyticsDate(e.activePayload[0].payload.dateStr);
                      }
                    }}
                  >
                    <XAxis dataKey="dayName" stroke="var(--text-muted)" fontSize={12} />
                    <YAxis stroke="var(--text-muted)" fontSize={12} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'var(--card-bg)',
                        borderColor: 'var(--border-color)',
                        borderRadius: '8px',
                      }}
                    />
                    <Legend />
                    <Bar dataKey="completed" name="Completed" stackId="a" fill="var(--success)" radius={[0, 0, 0, 0]} />
                    <Bar dataKey="pending" name="Pending" stackId="a" fill="var(--warning)" radius={[0, 0, 0, 0]} />
                    <Bar dataKey="overdue" name="Overdue" stackId="a" fill="var(--danger)" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Day-by-Day Table & Day Inspector (2-Column Grid) */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(12, 1fr)', gap: '20px' }}>
              {/* Left Column: Days List / Table (7 cols) */}
              <div style={{ gridColumn: 'span 7' }} className="report-chart-col">
                <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '12px' }}>
                  Days Performance Log ({daysReport.days.length} Days)
                </h3>
                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '8px',
                    maxHeight: '440px',
                    overflowY: 'auto',
                    paddingRight: '6px',
                  }}
                >
                  {daysReport.days.map((day) => {
                    const isSelected = selectedAnalyticsDate === day.dateStr;
                    return (
                      <div
                        key={day.dateStr}
                        onClick={() => setSelectedAnalyticsDate(day.dateStr)}
                        style={{
                          padding: '12px 16px',
                          borderRadius: 'var(--radius-md)',
                          background: isSelected ? 'var(--primary-light)' : 'var(--page-bg)',
                          border: `1.5px solid ${isSelected ? 'var(--primary-color)' : 'var(--border-color)'}`,
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          gap: '12px',
                          transition: 'all 0.15s ease',
                        }}
                        className="day-report-row"
                      >
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <strong
                              style={{
                                fontSize: '0.92rem',
                                color: isSelected ? 'var(--primary-color)' : 'var(--text-primary)',
                              }}
                            >
                              {day.dayName}, {day.fullDate}
                            </strong>
                            {day.isToday && (
                              <span className="badge badge-success" style={{ fontSize: '0.68rem', padding: '1px 6px' }}>
                                Today
                              </span>
                            )}
                          </div>
                          <div
                            style={{
                              display: 'flex',
                              gap: '10px',
                              fontSize: '0.78rem',
                              color: 'var(--text-muted)',
                              marginTop: '4px',
                            }}
                          >
                            <span>Total: {day.total}</span>
                            <span style={{ color: 'var(--success)' }}>✓ {day.completed}</span>
                            <span style={{ color: 'var(--primary-color)' }}>⏳ {day.pending}</span>
                            {day.overdue > 0 && <span style={{ color: 'var(--danger)' }}>⚠️ {day.overdue}</span>}
                          </div>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexShrink: 0 }}>
                          <div style={{ textAlign: 'right', minWidth: '60px' }}>
                            <div style={{ fontSize: '0.92rem', fontWeight: 800, color: day.gradeColor }}>
                              {day.percentage}%
                            </div>
                            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{day.grade}</div>
                          </div>
                          <button
                            type="button"
                            className="btn btn-ghost btn-sm"
                            style={{ padding: '4px 8px', fontSize: '0.75rem' }}
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedAnalyticsDate(day.dateStr);
                            }}
                          >
                            Inspect <ArrowRight size={12} />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Right Column: Day Detail Inspector (5 cols) */}
              <div style={{ gridColumn: 'span 5' }} className="report-chart-col">
                <div
                  style={{
                    padding: '20px',
                    borderRadius: 'var(--radius-lg)',
                    background: 'var(--page-bg)',
                    border: '1.5px solid var(--border-color)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '14px',
                    height: '100%',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <div
                        style={{
                          fontSize: '0.75rem',
                          fontWeight: 700,
                          color: 'var(--text-muted)',
                          textTransform: 'uppercase',
                        }}
                      >
                        Day Inspector
                      </div>
                      <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                        {selectedDayAnalyticsData?.fullDate || 'Selected Day'}
                      </h3>
                    </div>
                    <button
                      type="button"
                      className="btn btn-primary btn-sm"
                      onClick={() => openModal('task', { date: selectedAnalyticsDate })}
                    >
                      + Add Task
                    </button>
                  </div>

                  {/* Day Progress Summary */}
                  {selectedDayAnalyticsData && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem' }}>
                        <span>Day Completion</span>
                        <strong style={{ color: selectedDayAnalyticsData.gradeColor }}>
                          {selectedDayAnalyticsData.completed} of {selectedDayAnalyticsData.total} (
                          {selectedDayAnalyticsData.percentage}%)
                        </strong>
                      </div>
                      <ProgressBar
                        progress={selectedDayAnalyticsData.percentage}
                        color="var(--primary-color)"
                      />
                    </div>
                  )}

                  {/* Day Tasks List */}
                  <div
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '8px',
                      maxHeight: '380px',
                      overflowY: 'auto',
                      paddingRight: '4px',
                    }}
                  >
                    {!selectedDayAnalyticsData || selectedDayAnalyticsData.tasks.length === 0 ? (
                      <div
                        style={{
                          textAlign: 'center',
                          padding: '36px 16px',
                          color: 'var(--text-muted)',
                          fontSize: '0.88rem',
                        }}
                      >
                        No tasks were scheduled for {selectedDayAnalyticsData?.fullDate || 'this day'}.
                      </div>
                    ) : (
                      selectedDayAnalyticsData.tasks.map((task) => (
                        <TaskItem key={task.id} task={task} compact={true} />
                      ))
                    )}
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Charts Section: 7-Day Trend & Priority Breakdown */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(12, 1fr)', gap: '24px' }}>
            {/* Daily Completion Trend (Line Chart - 8 cols) */}
            <div style={{ gridColumn: 'span 8' }} className="report-chart-col">
              <div className="card" style={{ padding: '20px 24px', borderRadius: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div
                    style={{
                      width: '38px',
                      height: '38px',
                      borderRadius: '10px',
                      background: 'rgba(23, 105, 255, 0.12)',
                      color: 'var(--primary-color)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      border: '1px solid rgba(23, 105, 255, 0.25)',
                      flexShrink: 0,
                    }}
                  >
                    <TrendingUp size={18} strokeWidth={2.4} />
                  </div>
                  <div>
                    <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 800, color: 'var(--text-primary)', whiteSpace: 'nowrap' }}>
                      Weekly Trajectory Trend
                    </h3>
                    <p style={{ margin: '3px 0 0', fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                      Daily completed vs pending tasks
                    </p>
                  </div>
                </div>

                <div style={{ width: '100%', height: 260, marginTop: '16px' }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={weeklyTrendData}>
                      <XAxis dataKey="day" stroke="var(--text-muted)" fontSize={12} />
                      <YAxis stroke="var(--text-muted)" fontSize={12} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: 'var(--card-bg)',
                          borderColor: 'var(--border-color)',
                          borderRadius: '8px',
                        }}
                      />
                      <Legend />
                      <Line
                        type="monotone"
                        dataKey="completed"
                        stroke="var(--success)"
                        strokeWidth={3}
                        dot={{ r: 4 }}
                        name="Completed"
                      />
                      <Line
                        type="monotone"
                        dataKey="pending"
                        stroke="var(--warning)"
                        strokeWidth={2}
                        strokeDasharray="4 4"
                        dot={{ r: 3 }}
                        name="Pending"
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            {/* Priority-wise Distribution (Bar Chart - 4 cols) */}
            <div style={{ gridColumn: 'span 4' }} className="report-chart-col">
              <div className="card" style={{ padding: '24px' }}>
                <div className="card-header-flex">
                  <div>
                    <h3 className="card-title">
                      <BarChart3 size={20} color="var(--primary-color)" />
                      Tasks by Priority
                    </h3>
                    <span className="card-subtitle">Volume breakdown</span>
                  </div>
                </div>

                <div style={{ width: '100%', height: 260, marginTop: '16px' }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={priorityData}>
                      <XAxis dataKey="name" stroke="var(--text-muted)" fontSize={12} />
                      <YAxis stroke="var(--text-muted)" fontSize={12} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: 'var(--card-bg)',
                          borderColor: 'var(--border-color)',
                          borderRadius: '8px',
                        }}
                      />
                      <Bar dataKey="count" radius={[6, 6, 0, 0]} name="Count">
                        {priorityData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            {/* Category-wise Task Distribution (Pie Chart - 12 cols) */}
            <div style={{ gridColumn: 'span 12' }}>
              <div className="card" style={{ padding: '24px' }}>
                <div className="card-header-flex">
                  <div>
                    <h3 className="card-title">
                      <PieIcon size={20} color="var(--primary-color)" />
                      Category-Wise Task Distribution
                    </h3>
                    <span className="card-subtitle">Effort distribution across categories</span>
                  </div>
                </div>

                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
                    gap: '20px',
                    alignItems: 'center',
                  }}
                >
                  <div style={{ width: '100%', height: 260 }}>
                    {categoryData.length === 0 ? (
                      <div style={{ textAlign: 'center', paddingTop: '100px', color: 'var(--text-muted)' }}>
                        No tasks with categories in this range.
                      </div>
                    ) : (
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={categoryData}
                            dataKey="value"
                            nameKey="name"
                            cx="50%"
                            cy="50%"
                            outerRadius={90}
                            innerRadius={50}
                            paddingAngle={4}
                          >
                            {categoryData.map((entry, index) => (
                              <Cell key={`cat-cell-${index}`} fill={entry.color} />
                            ))}
                          </Pie>
                          <Tooltip
                            contentStyle={{
                              backgroundColor: 'var(--card-bg)',
                              borderColor: 'var(--border-color)',
                              borderRadius: '8px',
                            }}
                          />
                        </PieChart>
                      </ResponsiveContainer>
                    )}
                  </div>

                  {/* Category Legend & Completion stats */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {categoryData.map((c) => (
                      <div
                        key={c.name}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          padding: '8px 12px',
                          background: 'var(--page-bg)',
                          borderRadius: 'var(--radius-sm)',
                          border: '1px solid var(--border-subtle)',
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span
                            style={{
                              width: '10px',
                              height: '10px',
                              borderRadius: '50%',
                              backgroundColor: c.color,
                            }}
                          />
                          <span style={{ fontSize: '0.88rem', fontWeight: 600 }}>{c.name}</span>
                        </div>
                        <div style={{ display: 'flex', gap: '14px', fontSize: '0.82rem' }}>
                          <span style={{ color: 'var(--text-secondary)' }}>{c.value} tasks</span>
                          <strong style={{ color: 'var(--success)' }}>{c.rate}% completed</strong>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
