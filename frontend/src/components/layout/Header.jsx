import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search,
  Bell,
  Menu,
  Plus,
  Calendar,
  LogIn,
  LogOut,
  UserPlus,
  ShieldCheck,
  UploadCloud,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';
import { formatDate, getTodayDateString } from '../../utils/dateUtils';

export function Header() {
  const navigate = useNavigate();
  const {
    tasks,
    events,
    user: appUser,
    notifications,
    markNotificationRead,
    clearNotifications,
    openModal,
    setMobileSidebarOpen,
    globalSearchQuery,
    setGlobalSearchQuery,
    showToast,
  } = useApp();

  const {
    user: authUser,
    isAuthenticated,
    openLoginModal,
    openSignupModal,
    logout,
  } = useAuth();

  const user = authUser || appUser;

  const [searchFocused, setSearchFocused] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);

  const todayStr = getTodayDateString();
  const formattedToday = formatDate(todayStr, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });

  const unreadCount = notifications.filter((n) => !n.read).length;

  // Filter tasks & events matching search query
  const matchingTasks = globalSearchQuery.trim()
    ? tasks.filter(
        (t) =>
          t.title.toLowerCase().includes(globalSearchQuery.toLowerCase()) ||
          (t.description && t.description.toLowerCase().includes(globalSearchQuery.toLowerCase()))
      ).slice(0, 5)
    : [];

  const matchingEvents = globalSearchQuery.trim()
    ? events.filter(
        (e) =>
          e.title.toLowerCase().includes(globalSearchQuery.toLowerCase()) ||
          (e.description && e.description.toLowerCase().includes(globalSearchQuery.toLowerCase()))
      ).slice(0, 3)
    : [];

  return (
    <header className="top-header">
      {/* Mobile Menu Button & Search */}
      <div className="header-left">
        <button
          type="button"
          className="btn-icon mobile-menu-btn"
          onClick={() => setMobileSidebarOpen(true)}
          id="btn-mobile-sidebar-toggle"
          aria-label="Open mobile navigation"
        >
          <Menu size={22} />
        </button>

        {/* Global Search */}
        <div className="header-search">
          <Search size={18} className="search-icon" />
          <input
            type="text"
            className="search-input"
            placeholder="Search tasks, meetings, priorities..."
            value={globalSearchQuery}
            onChange={(e) => setGlobalSearchQuery(e.target.value)}
            onFocus={() => setSearchFocused(true)}
            onBlur={() => setTimeout(() => setSearchFocused(false), 250)}
          />

          {/* Search Dropdown Results */}
          {searchFocused && globalSearchQuery.trim() && (
            <div
              style={{
                position: 'absolute',
                top: '110%',
                left: 0,
                right: 0,
                background: 'var(--card-bg)',
                border: '1px solid var(--border-color)',
                borderRadius: 'var(--radius-lg)',
                boxShadow: 'var(--shadow-xl)',
                padding: '12px',
                zIndex: 60,
                maxHeight: '380px',
                overflowY: 'auto',
              }}
            >
              <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '8px' }}>
                SEARCH RESULTS
              </div>

              {matchingTasks.length === 0 && matchingEvents.length === 0 ? (
                <div style={{ padding: '16px', textAlign: 'center', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                  No matching tasks or events found.
                </div>
              ) : (
                <>
                  {matchingTasks.length > 0 && (
                    <div style={{ marginBottom: '10px' }}>
                      <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--primary-color)', marginBottom: '6px' }}>
                        Tasks ({matchingTasks.length})
                      </div>
                      {matchingTasks.map((task) => (
                        <div
                          key={task.id}
                          onClick={() => {
                            openModal('task', task);
                            setGlobalSearchQuery('');
                          }}
                          style={{
                            padding: '8px 10px',
                            borderRadius: 'var(--radius-sm)',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            gap: '8px',
                          }}
                          className="search-result-item"
                        >
                          <span style={{ fontSize: '0.88rem', fontWeight: 600 }}>{task.title}</span>
                          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{task.date}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {matchingEvents.length > 0 && (
                    <div>
                      <div style={{ fontSize: '0.75rem', fontWeight: 600, color: '#8B5CF6', marginBottom: '6px' }}>
                        Events ({matchingEvents.length})
                      </div>
                      {matchingEvents.map((evt) => (
                        <div
                          key={evt.id}
                          onClick={() => {
                            openModal('event', evt);
                            setGlobalSearchQuery('');
                          }}
                          style={{
                            padding: '8px 10px',
                            borderRadius: 'var(--radius-sm)',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            gap: '8px',
                          }}
                          className="search-result-item"
                        >
                          <span style={{ fontSize: '0.88rem', fontWeight: 600 }}>{evt.title}</span>
                          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{evt.date}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Header Actions */}
      <div className="header-right">
        {/* Date Display */}
        <div className="header-date-badge">
          <Calendar size={15} color="var(--primary-color)" />
          <span>{formattedToday}</span>
        </div>

        {/* Quick Bulk Import Button */}
        <button
          type="button"
          className="btn btn-secondary btn-sm"
          onClick={() => openModal('bulk-import', { type: 'tasks' })}
          id="btn-header-bulk-import"
          title="Bulk Import Tasks, Goals, or Categories"
          style={{ display: 'flex', alignItems: 'center', gap: '5px' }}
        >
          <UploadCloud size={15} />
          <span>Import</span>
        </button>

        {/* Quick Add Button */}
        <button
          type="button"
          className="btn btn-primary btn-sm"
          onClick={() => openModal('task')}
          id="btn-header-add-task"
        >
          <Plus size={16} />
          <span>Add Task</span>
        </button>

        {/* Notifications Popover */}
        <div style={{ position: 'relative' }}>
          <button
            type="button"
            className="btn-icon"
            onClick={() => setNotifOpen(!notifOpen)}
            aria-label="Notifications"
            id="btn-notifications"
          >
            <Bell size={19} />
            {unreadCount > 0 && (
              <span
                style={{
                  position: 'absolute',
                  top: '6px',
                  right: '6px',
                  width: '8px',
                  height: '8px',
                  borderRadius: '50%',
                  backgroundColor: 'var(--danger)',
                  boxShadow: '0 0 6px var(--danger)',
                }}
              />
            )}
          </button>

          {notifOpen && (
            <>
              <div
                style={{ position: 'fixed', inset: 0, zIndex: 45 }}
                onClick={() => setNotifOpen(false)}
              />
              <div
                style={{
                  position: 'absolute',
                  right: 0,
                  top: '110%',
                  width: '320px',
                  background: 'var(--card-bg)',
                  border: '1px solid var(--border-color)',
                  borderRadius: 'var(--radius-lg)',
                  boxShadow: 'var(--shadow-xl)',
                  zIndex: 50,
                  overflow: 'hidden',
                }}
              >
                <div
                  style={{
                    padding: '14px 18px',
                    borderBottom: '1px solid var(--border-color)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                  }}
                >
                  <span style={{ fontWeight: 700, fontSize: '0.95rem' }}>Notifications</span>
                  {notifications.length > 0 && (
                    <button
                      type="button"
                      className="btn btn-ghost btn-sm"
                      style={{ padding: '2px 6px', fontSize: '0.75rem' }}
                      onClick={clearNotifications}
                    >
                      Clear all
                    </button>
                  )}
                </div>

                <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
                  {notifications.length === 0 ? (
                    <div style={{ padding: '24px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                      No notifications at this time.
                    </div>
                  ) : (
                    notifications.map((item) => (
                      <div
                        key={item.id}
                        onClick={() => markNotificationRead(item.id)}
                        style={{
                          padding: '12px 16px',
                          borderBottom: '1px solid var(--border-subtle)',
                          background: item.read ? 'transparent' : 'var(--primary-light)',
                          cursor: 'pointer',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '4px',
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                            {item.title}
                          </span>
                          <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{item.time}</span>
                        </div>
                        <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{item.message}</p>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </>
          )}
        </div>

        {/* Sign In button if not authenticated */}
        {!isAuthenticated && (
          <button
            type="button"
            className="btn btn-primary btn-sm"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '7px 14px',
              borderRadius: '10px',
              fontSize: '0.84rem',
              fontWeight: 600,
            }}
            onClick={openLoginModal}
            id="btn-header-signin"
          >
            <LogIn size={15} />
            <span>Sign In</span>
          </button>
        )}

        {/* User Profile */}
        <div style={{ position: 'relative' }}>
          <div
            className="user-profile-btn"
            onClick={() => setProfileOpen(!profileOpen)}
            id="user-profile-menu-trigger"
            style={{ cursor: 'pointer' }}
          >
            <div className="user-avatar" style={{ backgroundColor: user.avatarBg || '#1769FF' }}>
              {user.avatarInitials || 'AM'}
            </div>
            <div className="user-info">
              <span className="user-name">{user.name || 'User'}</span>
              <span className="user-role" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                {isAuthenticated ? (
                  <>
                    <span
                      style={{
                        width: '6px',
                        height: '6px',
                        borderRadius: '50%',
                        background: '#10B981',
                      }}
                    />
                    <span>{user.title || 'Active Member'}</span>
                  </>
                ) : (
                  <span>Guest Mode</span>
                )}
              </span>
            </div>
          </div>

          {profileOpen && (
            <>
              <div
                style={{ position: 'fixed', inset: 0, zIndex: 45 }}
                onClick={() => setProfileOpen(false)}
              />
              <div
                style={{
                  position: 'absolute',
                  right: 0,
                  top: '110%',
                  width: '240px',
                  background: 'var(--card-bg, #1e293b)',
                  border: '1px solid var(--border-color, rgba(255, 255, 255, 0.1))',
                  borderRadius: 'var(--radius-lg, 14px)',
                  boxShadow: 'var(--shadow-xl, 0 20px 25px -5px rgba(0, 0, 0, 0.5))',
                  padding: '8px',
                  zIndex: 50,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '4px',
                }}
              >
                <div style={{ padding: '10px 12px', borderBottom: '1px solid var(--border-subtle, rgba(255, 255, 255, 0.08))', marginBottom: '4px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
                    <div style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-primary)' }}>{user.name}</div>
                    {isAuthenticated ? (
                      <span style={{ fontSize: '0.68rem', fontWeight: 600, color: '#10B981', background: 'rgba(16, 185, 129, 0.15)', padding: '2px 6px', borderRadius: '4px' }}>
                        Connected
                      </span>
                    ) : (
                      <span style={{ fontSize: '0.68rem', fontWeight: 600, color: '#f59e0b', background: 'rgba(245, 158, 11, 0.15)', padding: '2px 6px', borderRadius: '4px' }}>
                        Guest
                      </span>
                    )}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{user.email || 'Not logged in'}</div>
                </div>

                {!isAuthenticated ? (
                  <>
                    <button
                      type="button"
                      className="btn btn-primary btn-sm"
                      style={{ justifyContent: 'center', margin: '4px 0' }}
                      onClick={() => {
                        setProfileOpen(false);
                        openLoginModal();
                      }}
                    >
                      <LogIn size={15} />
                      Sign In / Sign Up
                    </button>
                    <button
                      type="button"
                      className="btn btn-ghost btn-sm"
                      style={{ justifyContent: 'flex-start', color: '#38BDF8' }}
                      onClick={() => {
                        setProfileOpen(false);
                        openSignupModal();
                      }}
                    >
                      <UserPlus size={15} />
                      Create New Account
                    </button>
                  </>
                ) : null}


                <button
                  type="button"
                  className="btn btn-ghost btn-sm"
                  style={{ justifyContent: 'flex-start' }}
                  onClick={() => {
                    setProfileOpen(false);
                    navigate('/settings');
                  }}
                >
                  Account Settings
                </button>
                <button
                  type="button"
                  className="btn btn-ghost btn-sm"
                  style={{ justifyContent: 'flex-start' }}
                  onClick={() => {
                    setProfileOpen(false);
                    navigate('/reports');
                  }}
                >
                  My Productivity
                </button>

                {isAuthenticated && (
                  <button
                    type="button"
                    className="btn btn-ghost btn-sm"
                    style={{
                      justifyContent: 'flex-start',
                      color: '#ef4444',
                      borderTop: '1px solid var(--border-subtle, rgba(255, 255, 255, 0.08))',
                      marginTop: '4px',
                      paddingTop: '8px',
                    }}
                    onClick={() => {
                      setProfileOpen(false);
                      logout();
                      showToast({
                        type: 'info',
                        title: 'Signed Out',
                        message: 'You have been signed out of your account.',
                      });
                    }}
                  >
                    <LogOut size={15} />
                    Sign Out
                  </button>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
