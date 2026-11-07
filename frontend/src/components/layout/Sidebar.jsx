import React, { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  CheckSquare,
  CalendarDays,
  Calendar,
  Tags,
  Target,
  BarChart3,
  Archive,
  Flame,
  Settings,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  Sparkles,
  X,
  LogIn,
  LogOut,
  ShieldCheck,
  Timer,
  AlertCircle,
  FileText,
  Flag,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Lightbulb,
  BookOpen,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';
import { getTodayDateString } from '../../utils/dateUtils';
import { getEffectiveStatus } from '../../utils/taskUtils';
import { analyzeRedFlags } from '../../utils/redFlagEngine';

export function Sidebar() {
  const location = useLocation();
  const {
    tasks = [],
    categories = [],
    goals = [],
    workSessions = [],
    selectedDate,
    sidebarCollapsed,
    setSidebarCollapsed,
    mobileSidebarOpen,
    setMobileSidebarOpen,
    user: appUser,
    activeWorkSession,
    requests = [],
  } = useApp();

  const {
    user: authUser,
    isAuthenticated,
    openLoginModal,
    logout,
  } = useAuth();

  const currentUser = authUser || appUser;

  const todayStr = getTodayDateString();
  const activeDate = selectedDate || todayStr;
  const isSelectedToday = activeDate === todayStr;
  const activeTasks = tasks.filter((t) => t.date === activeDate);
  const pendingActiveCount = activeTasks.filter(
    (t) => getEffectiveStatus(t) !== 'completed'
  ).length;

  const isTrackingLive = Boolean(activeWorkSession?.isRunning);
  const pendingRequestsCount = (requests || []).filter((r) => r.status === 'pending').length;

  // Real-time Red Flag Analysis
  const redFlagAnalysis = analyzeRedFlags({
    tasks,
    categories,
    goals,
    workSessions,
    activeWorkSession,
    targetDate: activeDate,
  });
  const activeRedFlagsCount = redFlagAnalysis.activeCount;

  // Submenu toggle state (defaults open if current URL is under /reports)
  const isReportsActive = location.pathname.startsWith('/reports');
  const [reportsSubmenuOpen, setReportsSubmenuOpen] = useState(isReportsActive);

  const navItems = [
    { name: 'Dashboard', path: '/', icon: LayoutDashboard },
    {
      name: isSelectedToday ? "Today's Tasks" : "Day's Tasks",
      path: '/today',
      icon: CheckSquare,
      badge: pendingActiveCount > 0 ? pendingActiveCount : null,
    },
    {
      name: 'Work Tracker',
      path: '/work-tracker',
      icon: Timer,
      badge: isTrackingLive ? 'LIVE' : null,
      badgeColor: isTrackingLive ? '#10B981' : undefined,
    },
    {
      name: 'Red Flags',
      path: '/red-flags',
      icon: Flag,
      badge: activeRedFlagsCount > 0 ? activeRedFlagsCount : null,
      badgeColor: '#EF4444',
    },
    {
      name: 'Mistakes & Deviations',
      path: '/deviations',
      icon: AlertCircle,
    },
    {
      name: 'Work Requests',
      path: '/requests',
      icon: FileText,
      badge: pendingRequestsCount > 0 ? pendingRequestsCount : null,
      badgeColor: '#F59E0B',
    },
    { name: 'Monthly Schedule', path: '/monthly', icon: CalendarDays },
    { name: 'Calendar', path: '/calendar', icon: Calendar },
    { name: 'Categories', path: '/categories', icon: Tags },
    { name: 'Goals', path: '/goals', icon: Target },
    {
      name: 'Reports',
      path: '/reports',
      icon: BarChart3,
      hasSubmenu: true,
      subItems: [
        { name: 'Pending Tasks', path: '/reports/pending', icon: Clock },
        { name: 'Completed Tasks', path: '/reports/completed', icon: CheckCircle2 },
        { name: 'Missed & Overdue', path: '/reports/missed', icon: AlertTriangle },
        { name: 'Goal Progression', path: '/reports/goals', icon: Target },
        { name: 'Red Flag Report', path: '/reports/red-flags', icon: Flag },
        { name: 'Tracker & Gap Logs', path: '/reports/tracker-logs', icon: Timer },
        { name: 'Daily Standup', path: '/reports', icon: FileText },
      ],
    },
    { name: 'Reports Archive', path: '/archive', icon: Archive },
    { name: 'Settings', path: '/settings', icon: Settings },
  ];

  const visibleNavItems = navItems;

  return (
    <>
      {/* Mobile Backdrop */}
      {mobileSidebarOpen && (
        <div
          className="mobile-overlay"
          onClick={() => setMobileSidebarOpen(false)}
        />
      )}

      <aside
        className={`sidebar ${sidebarCollapsed ? 'collapsed' : ''} ${
          mobileSidebarOpen ? 'mobile-open' : ''
        }`}
      >
        {/* Brand Header */}
        <div className="sidebar-brand">
          <div className="sidebar-logo">
            <img src="/logo.png" alt="My Schedule" className="sidebar-logo-img" />
          </div>
          {!sidebarCollapsed && (
            <div className="sidebar-brand-text">
              <span className="sidebar-title">My Schedule</span>
              <span className="sidebar-tagline">Plan · Focus · Achieve</span>
            </div>
          )}
          {mobileSidebarOpen && (
            <button
              type="button"
              className="btn-icon"
              style={{ marginLeft: 'auto', color: 'var(--sidebar-muted)' }}
              onClick={() => setMobileSidebarOpen(false)}
            >
              <X size={20} />
            </button>
          )}
        </div>

        {/* Navigation Menu */}
        <nav className="sidebar-menu">
          {visibleNavItems.map((item) => {
            const Icon = item.icon;

            if (item.hasSubmenu) {
              const isItemActive = location.pathname.startsWith(item.path);
              const isOpen = reportsSubmenuOpen || isItemActive;

              return (
                <div key={item.path} style={{ display: 'flex', flexDirection: 'column', width: '100%', alignItems: sidebarCollapsed ? 'center' : 'stretch' }}>
                  <NavLink
                    to={item.path}
                    className={({ isActive }) =>
                      `sidebar-nav-item ${isActive || isItemActive ? 'active' : ''}`
                    }
                    onClick={() => {
                      if (!sidebarCollapsed) {
                        setReportsSubmenuOpen(!isOpen);
                      }
                    }}
                    title={sidebarCollapsed ? item.name : undefined}
                  >
                    <Icon size={sidebarCollapsed ? 19 : 17} style={{ flexShrink: 0 }} />
                    {!sidebarCollapsed && <span>{item.name}</span>}
                    {!sidebarCollapsed && (
                      <span style={{ marginLeft: 'auto', color: 'inherit', display: 'flex', alignItems: 'center' }}>
                        {isOpen ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                      </span>
                    )}
                  </NavLink>

                  {/* Expandable Submenu */}
                  {!sidebarCollapsed && isOpen && item.subItems && (
                    <div className="sidebar-submenu">
                      {item.subItems.map((sub) => {
                        const SubIcon = sub.icon;
                        return (
                          <NavLink
                            key={sub.path}
                            to={sub.path}
                            end={sub.path === '/reports'}
                            className={({ isActive }) =>
                              `sidebar-sub-item ${isActive ? 'active' : ''}`
                            }
                            onClick={() => setMobileSidebarOpen(false)}
                          >
                            <SubIcon size={13} style={{ flexShrink: 0 }} />
                            <span>{sub.name}</span>
                          </NavLink>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            }

            return (
              <NavLink
                key={item.path}
                to={item.path}
                end={item.path === '/'}
                className={({ isActive }) =>
                  `sidebar-nav-item ${isActive ? 'active' : ''}`
                }
                onClick={() => setMobileSidebarOpen(false)}
                title={sidebarCollapsed ? item.name : undefined}
              >
                <Icon size={sidebarCollapsed ? 19 : 17} style={{ flexShrink: 0 }} />
                {!sidebarCollapsed && <span>{item.name}</span>}
                {!sidebarCollapsed && item.badge && (
                  <span
                    className="sidebar-nav-badge"
                    style={
                      item.badgeColor
                        ? { background: item.badgeColor, color: '#FFFFFF', fontWeight: 800, letterSpacing: '0.04em' }
                        : undefined
                    }
                  >
                    {item.badge}
                  </span>
                )}
                {sidebarCollapsed && item.badge && (
                  <span
                    style={{
                      position: 'absolute',
                      top: '6px',
                      right: '6px',
                      width: '7px',
                      height: '7px',
                      borderRadius: '50%',
                      backgroundColor: item.badgeColor || '#38BDF8',
                      boxShadow: `0 0 6px ${item.badgeColor || '#38BDF8'}`,
                      pointerEvents: 'none',
                    }}
                  />
                )}
              </NavLink>
            );
          })}
        </nav>

        {/* Motivational Widget */}
        {!sidebarCollapsed && (
          <div className="sidebar-motivation">
            <div className="sidebar-motivation-title">
              <Sparkles size={16} color="var(--primary-color, #38BDF8)" />
              <span>Daily Focus</span>
            </div>
            
          </div>
        )}

        {/* Unified Sidebar Footer */}
        <div
          className="sidebar-footer"
          style={{
            padding: sidebarCollapsed ? '10px 0' : '8px 12px',
            borderTop: '1px solid var(--sidebar-border, rgba(255, 255, 255, 0.08))',
            display: 'flex',
            flexDirection: sidebarCollapsed ? 'column' : 'row',
            alignItems: 'center',
            justifyContent: sidebarCollapsed ? 'center' : 'space-between',
            gap: sidebarCollapsed ? '8px' : '8px',
            flexShrink: 0,
            boxSizing: 'border-box',
          }}
        >
          {sidebarCollapsed ? (
            <>
              <button
                type="button"
                style={{
                  width: '34px',
                  height: '34px',
                  borderRadius: '50%',
                  background: currentUser?.avatarBg || '#1769FF',
                  color: '#ffffff',
                  fontWeight: 700,
                  fontSize: '0.8rem',
                  border: '1.5px solid rgba(255, 255, 255, 0.2)',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 2px 6px rgba(0, 0, 0, 0.2)',
                  transition: 'all 0.15s ease',
                }}
                onClick={openLoginModal}
                title={isAuthenticated ? `${currentUser?.name} (${currentUser?.email})` : 'Sign In / Register'}
              >
                {currentUser?.avatarInitials || 'AM'}
              </button>
              <button
                type="button"
                className="btn-icon"
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '8px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'var(--sidebar-muted)',
                  background: 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                }}
                onClick={() => setSidebarCollapsed(false)}
                title="Expand sidebar"
              >
                <ChevronRight size={18} />
              </button>
            </>
          ) : (
            <>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', overflow: 'hidden', minWidth: 0 }}>
                <div
                  style={{
                    width: '30px',
                    height: '30px',
                    borderRadius: '50%',
                    background: currentUser?.avatarBg || '#1769FF',
                    color: '#ffffff',
                    fontWeight: 700,
                    fontSize: '0.75rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                    border: '1px solid rgba(255, 255, 255, 0.15)',
                  }}
                >
                  {currentUser?.avatarInitials || 'AM'}
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
                  <span
                    style={{
                      fontSize: '0.82rem',
                      fontWeight: 600,
                      color: 'var(--sidebar-text-title, #ffffff)',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                    }}
                  >
                    {currentUser?.name || 'Guest User'}
                  </span>
                  <span
                    style={{
                      fontSize: '0.7rem',
                      color: isAuthenticated ? '#10B981' : 'var(--text-muted, #94a3b8)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                    }}
                  >
                    {isAuthenticated ? (
                      <>
                        <span style={{ width: '5px', height: '5px', borderRadius: '50%', background: '#10B981' }} />
                        Cloud Synced
                      </>
                    ) : (
                      'Local Guest'
                    )}
                  </span>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '4px', flexShrink: 0 }}>
                {!isAuthenticated ? (
                  <button
                    type="button"
                    onClick={openLoginModal}
                    style={{
                      padding: '4px 8px',
                      borderRadius: '6px',
                      border: '1px solid rgba(56, 189, 248, 0.4)',
                      background: 'rgba(56, 189, 248, 0.12)',
                      color: '#38BDF8',
                      fontSize: '0.72rem',
                      fontWeight: 600,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                    }}
                    title="Sign In or Register"
                  >
                    <LogIn size={12} />
                    Sign In
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={logout}
                    className="btn-icon"
                    style={{
                      width: '28px',
                      height: '28px',
                      color: '#ef4444',
                      background: 'rgba(239, 68, 68, 0.1)',
                      borderRadius: '6px',
                      border: 'none',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                    title="Sign Out"
                  >
                    <LogOut size={13} />
                  </button>
                )}

                <button
                  type="button"
                  className="btn-icon"
                  style={{
                    width: '28px',
                    height: '28px',
                    color: 'var(--sidebar-muted)',
                    borderRadius: '6px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                  }}
                  onClick={() => setSidebarCollapsed(true)}
                  title="Collapse sidebar"
                >
                  <ChevronLeft size={16} />
                </button>
              </div>
            </>
          )}
        </div>
      </aside>
    </>
  );
}
