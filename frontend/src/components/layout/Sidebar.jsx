import React from 'react';
import { NavLink } from 'react-router-dom';
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
  Sparkles,
  X,
  LogIn,
  LogOut,
  ShieldCheck,
  Timer,
  AlertCircle,
  FileText,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';
import { getTodayDateString } from '../../utils/dateUtils';
import { getEffectiveStatus } from '../../utils/taskUtils';

export function Sidebar() {
  const {
    tasks,
    selectedDate,
    sidebarCollapsed,
    setSidebarCollapsed,
    mobileSidebarOpen,
    setMobileSidebarOpen,
    user: appUser,
    activeWorkSession,
    requests,
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
    { name: 'Reports', path: '/reports', icon: BarChart3 },
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
            <CalendarDays size={18} />
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
                <Icon size={16} style={{ flexShrink: 0 }} />
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
            <p className="sidebar-motivation-quote">
              "Small disciplines repeated with consistency every day lead to great achievements."
            </p>
          </div>
        )}

        {/* User Account / Auth Status in Sidebar */}
        <div
          style={{
            padding: sidebarCollapsed ? '6px 6px' : '6px 12px',
            borderTop: '1px solid var(--sidebar-border, rgba(255, 255, 255, 0.08))',
            display: 'flex',
            alignItems: 'center',
            justifyContent: sidebarCollapsed ? 'center' : 'space-between',
            gap: '8px',
          }}
        >
          {sidebarCollapsed ? (
            <button
              type="button"
              className="btn-icon"
              style={{
                width: '30px',
                height: '30px',
                borderRadius: '50%',
                background: currentUser?.avatarBg || '#1769FF',
                color: '#ffffff',
                fontWeight: 700,
                fontSize: '0.78rem',
                border: 'none',
                cursor: 'pointer',
              }}
              onClick={openLoginModal}
              title={isAuthenticated ? `${currentUser?.name} (${currentUser?.email})` : 'Sign In / Register'}
            >
              {currentUser?.avatarInitials || 'AM'}
            </button>
          ) : (
            <>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', overflow: 'hidden' }}>
                <div
                  style={{
                    width: '28px',
                    height: '28px',
                    borderRadius: '50%',
                    background: currentUser?.avatarBg || '#1769FF',
                    color: '#ffffff',
                    fontWeight: 700,
                    fontSize: '0.75rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
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
            </>
          )}
        </div>

        {/* Desktop Expand / Collapse toggle */}
        <div
          style={{
            padding: '10px 14px',
            borderTop: '1px solid var(--sidebar-border, rgba(255, 255, 255, 0.08))',
            display: 'flex',
            justifyContent: sidebarCollapsed ? 'center' : 'flex-end',
          }}
        >
          <button
            type="button"
            className="btn-icon"
            style={{ color: 'var(--sidebar-muted)' }}
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            title={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {sidebarCollapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
          </button>
        </div>
      </aside>
    </>
  );
}
