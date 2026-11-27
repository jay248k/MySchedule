import {
  LayoutDashboard,
  CheckSquare,
  Calendar,
  CalendarDays,
  Tags,
  Target,
  BarChart3,
  Settings,
  Archive,
  Clock,
  CheckCircle2,
  AlertTriangle,
  FileText,
  Flag,
  Timer,
  AlertCircle,
  Lightbulb,
  BookOpen,
  Flame,
  RefreshCw,
  GitBranch,
  Smartphone,
} from 'lucide-react';

/**
 * Single source of truth for Reports submenu items.
 * Consumed by both Sidebar.jsx and Settings.jsx so any new sub-report
 * automatically appears in Settings -> Sidebar Menu Customization.
 */
export const REPORTS_SUB_ITEMS = [
  { path: '/reports/pending', key: 'pending', name: 'Pending Tasks', label: 'Pending Tasks Report', color: '#F59E0B', icon: Clock },
  { path: '/reports/completed', key: 'completed', name: 'Completed Tasks', label: 'Completed Tasks Report', color: '#10B981', icon: CheckCircle2 },
  { path: '/reports/missed', key: 'missed', name: 'Missed & Overdue', label: 'Missed & Overdue Report', color: '#EF4444', icon: AlertTriangle },
  { path: '/reports/rescheduled', key: 'rescheduled', name: 'Rescheduled Tasks', label: 'Rescheduled Tasks Report', color: '#3B82F6', icon: RefreshCw },
  { path: '/reports/habits', key: 'habits', name: 'Habits', label: 'Habits Mastery Report', color: '#10B981', icon: Flame },
  { path: '/reports/goals', key: 'goals', name: 'Goal Progression', label: 'Goal Progression & Milestones', color: '#A855F7', icon: Target },
  { path: '/reports/red-flags', key: 'red-flags', name: 'Red Flag Report', label: 'Red Flag Diagnostic Report', color: '#DC2626', icon: Flag },
  { path: '/reports/tracker-logs', key: 'tracker-logs', name: 'Tracker & Gap Logs', label: 'Tracker & Gap Logs', color: '#06B6D4', icon: Timer },
  { path: '/reports', key: 'today-report', name: 'Daily Standup', label: 'Daily Standup & Work Report', color: '#38BDF8', icon: FileText },
];

/**
 * Single source of truth for all Sidebar modules.
 * Adding a module here automatically makes it appear in both the Sidebar
 * and Settings -> Sidebar Navigation Order customization.
 */
export const SIDEBAR_NAV_ITEMS = [
  { name: 'Dashboard', path: '/', icon: LayoutDashboard, iconColor: '#3B82F6' },
  {
    name: "Today's Tasks",
    getDynamicName: (isSelectedToday) => (isSelectedToday ? "Today's Tasks" : "Day's Tasks"),
    path: '/today',
    icon: CheckSquare,
    iconColor: '#10B981',
  },
  { name: 'Work Tracker', path: '/work-tracker', icon: Timer, iconColor: '#06B6D4' },
  { name: 'Screen Time', settingsLabel: 'Mobile Screen Time', path: '/screen-time', icon: Smartphone, iconColor: '#EC4899' },
  { name: 'Charts & Analytics', path: '/analytics', icon: BarChart3, iconColor: '#EC4899' },
  { name: 'Knowledge Base', settingsLabel: 'Knowledge Base & Lessons', path: '/knowledge', icon: BookOpen, iconColor: '#F59E0B' },
  { name: 'Curriculum Manager', path: '/curriculum', icon: GitBranch, iconColor: '#10B981' },
  { name: 'Thoughts & Motivation', path: '/thoughts', icon: Lightbulb, iconColor: '#EC4899' },
  { name: 'Red Flags', path: '/red-flags', icon: Flag, iconColor: '#EF4444' },
  { name: 'Mistakes & Deviations', path: '/deviations', icon: AlertCircle, iconColor: '#F97316' },
  { name: 'Work Requests', path: '/requests', icon: FileText, iconColor: '#8B5CF6' },
  { name: 'Monthly Schedule', path: '/monthly', icon: CalendarDays, iconColor: '#6366F1' },
  { name: 'Calendar', path: '/calendar', icon: Calendar, iconColor: '#3B82F6' },
  { name: 'Categories', path: '/categories', icon: Tags, iconColor: '#10B981' },
  { name: 'Goals', path: '/goals', icon: Target, iconColor: '#EC4899' },
  { name: 'Habits', path: '/habits', icon: Flame, iconColor: '#10B981' },
  {
    name: 'Reports',
    path: '/reports',
    icon: BarChart3,
    iconColor: '#06B6D4',
    hasSubmenu: true,
    subItemsKey: 'reportsOrder',
    subItems: REPORTS_SUB_ITEMS,
  },
  { name: 'Reports Archive', path: '/archive', icon: Archive, iconColor: '#64748B' },
  { name: 'Settings', path: '/settings', icon: Settings, iconColor: '#94A3B8' },
];

export const DEFAULT_NAVIGATION_ORDER = SIDEBAR_NAV_ITEMS.map((item) => item.path);
