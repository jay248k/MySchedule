import React, { useState, useEffect, useMemo } from 'react';
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
  Moon,
  Sun,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  RotateCcw,
  Check,
  FileText,
  Clock,
  X as XIcon,
  AlertTriangle,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';
import { formatDate, getTodayDateString, isTaskOverdue } from '../../utils/dateUtils';
import { GlobalSearchModal } from '../common/GlobalSearchModal';
import CancelRemarksModal from '../requests/CancelRemarksModal';
import RescheduleRequestModal from '../requests/RescheduleRequestModal';

export function Header() {
  const navigate = useNavigate();
  const {
    tasks,
    events,
    selectedDate,
    setSelectedDate,
    user: appUser,
    notifications,
    markNotificationRead,
    clearNotifications,
    openModal,
    setMobileSidebarOpen,
    globalSearchQuery,
    setGlobalSearchQuery,
    settings,
    setSettings,
    showToast,
    requests,
    completeWorkRequest,
    rescheduleWorkRequest,
    cancelWorkRequest,
    updateTask,
    toggleTaskComplete,
  } = useApp();

  const {
    user: authUser,
    isAuthenticated,
    openLoginModal,
    openSignupModal,
    logout,
  } = useAuth();

  const user = authUser || appUser;

  const [isGlobalSearchOpen, setIsGlobalSearchOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);
  const [cancellingRequest, setCancellingRequest] = useState(null);
  const [reschedulingRequest, setReschedulingRequest] = useState(null);

  // Global keyboard shortcut: Ctrl+K or Cmd+K
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsGlobalSearchOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const todayStr = getTodayDateString();
  const activeDate = selectedDate || todayStr;
  const isSelectedToday = activeDate === todayStr;
  const formattedSelectedDate = formatDate(activeDate, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });

  const autoMissedTasks = useMemo(() => {
    if (!tasks || !Array.isArray(tasks)) return [];
    return tasks.filter((t) => {
      if (t.status === 'completed' || t.status === 'cancelled') return false;
      return isTaskOverdue(t);
    });
  }, [tasks]);

  const pendingRequests = (requests || []).filter((r) => r.status === 'pending');
  const unreadCount = notifications.filter((n) => !n.read).length;
  const totalAlertCount = unreadCount + autoMissedTasks.length + pendingRequests.length;

  const handleMarkRequestComplete = (reqId) => {
    completeWorkRequest(reqId);
  };

  const handleMarkTaskComplete = (task) => {
    toggleTaskComplete(task.id);
    showToast({
      type: 'success',
      title: 'Task Completed',
      message: `"${task.title}" has been marked as completed.`,
    });
  };

  const handleConfirmCancelItem = (remarks) => {
    if (cancellingRequest) {
      if (cancellingRequest.isTask) {
        updateTask(cancellingRequest.id, {
          status: 'cancelled',
          cancelRemarks: remarks.trim(),
          updatedAt: new Date().toISOString(),
        });
        showToast({
          type: 'warning',
          title: 'Task Cancelled',
          message: `"${cancellingRequest.title}" cancelled with remarks: "${remarks.trim()}".`,
        });
      } else {
        cancelWorkRequest(cancellingRequest.id, remarks);
      }
      setCancellingRequest(null);
    }
  };

  const handleConfirmRescheduleItem = ({ date, startTime, endTime, remarks }) => {
    if (reschedulingRequest) {
      if (reschedulingRequest.isTask) {
        updateTask(reschedulingRequest.id, {
          date,
          startTime,
          endTime,
          timeSlot: `${startTime} - ${endTime}`,
          status: 'pending',
          rescheduleNotes: remarks || '',
          updatedAt: new Date().toISOString(),
        });
        showToast({
          type: 'info',
          title: 'Task Rescheduled',
          message: `"${reschedulingRequest.title}" moved to ${date} (${startTime} - ${endTime}).`,
        });
      } else {
        rescheduleWorkRequest(reschedulingRequest.id, { date, startTime, endTime, remarks });
      }
      setReschedulingRequest(null);
    }
  };

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

        {/* Global Search Bar (Opens Command Palette Modal) */}
        <div
          className="header-search"
          onClick={() => setIsGlobalSearchOpen(true)}
          role="button"
          tabIndex={0}
          title="Search anything across workspace (Ctrl+K)"
        >
          <Search size={18} className="search-icon" />
          <input
            type="text"
            className="search-input"
            placeholder="Search tasks, meetings, priorities..."
            readOnly
            onClick={() => setIsGlobalSearchOpen(true)}
          />
          <div className="search-shortcut-badge">
            <kbd style={{ fontFamily: 'inherit' }}>Ctrl</kbd>
            <span>K</span>
          </div>
        </div>
      </div>

      {/* Header Actions */}
      <div className="header-right">
        {/* Global Date Selector Badge & Popover */}
        <div className="header-date-picker-wrap" style={{ position: 'relative' }}>
          <button
            type="button"
            className={`header-date-badge ${!isSelectedToday ? 'is-custom-date' : ''}`}
            onClick={() => setIsDatePickerOpen((prev) => !prev)}
            title={`Active workspace date: ${formattedSelectedDate} (${isSelectedToday ? 'Today' : 'Custom date'}). Click to change date globally.`}
            style={{
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              background: isSelectedToday ? 'var(--page-bg)' : 'rgba(var(--primary-rgb, 23, 105, 255), 0.12)',
              border: isSelectedToday ? '1px solid var(--border-color)' : '1.5px solid var(--primary-color)',
              color: isSelectedToday ? 'var(--text-secondary)' : 'var(--primary-color)',
              padding: '6px 14px',
              borderRadius: 'var(--radius-full)',
              fontSize: '0.85rem',
              fontWeight: 700,
              transition: 'all 0.2s ease',
            }}
          >
            <Calendar size={15} color="var(--primary-color)" />
            <span>{formattedSelectedDate}</span>
            {!isSelectedToday && (
              <span
                style={{
                  width: '7px',
                  height: '7px',
                  borderRadius: '50%',
                  backgroundColor: 'var(--primary-color)',
                  boxShadow: '0 0 6px var(--primary-color)',
                }}
              />
            )}
            <ChevronDown size={13} style={{ opacity: 0.7 }} />
          </button>

          {isDatePickerOpen && (
            <>
              <div
                style={{ position: 'fixed', inset: 0, zIndex: 998 }}
                onClick={() => setIsDatePickerOpen(false)}
              />
              <div
                style={{
                  position: 'absolute',
                  top: 'calc(100% + 8px)',
                  left: 0,
                  background: 'var(--card-bg)',
                  border: '1px solid var(--border-color)',
                  borderRadius: 'var(--radius-lg)',
                  boxShadow: '0 12px 30px rgba(0, 0, 0, 0.45), 0 4px 10px rgba(0, 0, 0, 0.25)',
                  padding: '16px',
                  zIndex: 999,
                  width: '290px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '12px',
                }}
                onClick={(e) => e.stopPropagation()}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <span style={{ fontSize: '0.85rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                      Global System Date
                    </span>
                    <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>
                      Changes data across all pages
                    </span>
                  </div>
                  {!isSelectedToday && (
                    <button
                      type="button"
                      className="btn btn-ghost btn-xs"
                      onClick={() => {
                        setSelectedDate(todayStr);
                        setIsDatePickerOpen(false);
                      }}
                      title="Reset back to Today"
                      style={{
                        fontSize: '0.72rem',
                        fontWeight: 700,
                        color: 'var(--primary-color)',
                        padding: '3px 8px',
                        borderRadius: 'var(--radius-full)',
                        background: 'rgba(var(--primary-rgb, 23, 105, 255), 0.1)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                      }}
                    >
                      <RotateCcw size={11} /> Today
                    </button>
                  )}
                </div>

                {/* Date Input */}
                <div>
                  <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '5px', display: 'block' }}>
                    Pick Specific Date
                  </label>
                  <input
                    type="date"
                    className="form-input"
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      fontSize: '0.88rem',
                      fontWeight: 600,
                      borderRadius: 'var(--radius-md)',
                      border: '1px solid var(--border-color)',
                      background: 'var(--input-bg, var(--page-bg))',
                      color: 'var(--text-primary)',
                    }}
                    value={activeDate}
                    onChange={(e) => {
                      if (e.target.value) {
                        setSelectedDate(e.target.value);
                        setIsDatePickerOpen(false);
                      }
                    }}
                  />
                </div>

                {/* Quick Presets */}
                <div style={{ display: 'flex', gap: '6px' }}>
                  <button
                    type="button"
                    className="btn btn-secondary btn-sm"
                    style={{ flex: 1, fontSize: '0.74rem', padding: '6px 8px', justifyContent: 'center' }}
                    onClick={() => {
                      const d = new Date(todayStr + 'T00:00:00');
                      d.setDate(d.getDate() - 1);
                      const y = d.getFullYear();
                      const m = String(d.getMonth() + 1).padStart(2, '0');
                      const day = String(d.getDate()).padStart(2, '0');
                      setSelectedDate(`${y}-${m}-${day}`);
                      setIsDatePickerOpen(false);
                    }}
                  >
                    Yesterday
                  </button>
                  <button
                    type="button"
                    className={`btn btn-sm ${isSelectedToday ? 'btn-primary' : 'btn-secondary'}`}
                    style={{ flex: 1, fontSize: '0.74rem', padding: '6px 8px', justifyContent: 'center' }}
                    onClick={() => {
                      setSelectedDate(todayStr);
                      setIsDatePickerOpen(false);
                    }}
                  >
                    Today
                  </button>
                  <button
                    type="button"
                    className="btn btn-secondary btn-sm"
                    style={{ flex: 1, fontSize: '0.74rem', padding: '6px 8px', justifyContent: 'center' }}
                    onClick={() => {
                      const d = new Date(todayStr + 'T00:00:00');
                      d.setDate(d.getDate() + 1);
                      const y = d.getFullYear();
                      const m = String(d.getMonth() + 1).padStart(2, '0');
                      const day = String(d.getDate()).padStart(2, '0');
                      setSelectedDate(`${y}-${m}-${day}`);
                      setIsDatePickerOpen(false);
                    }}
                  >
                    Tomorrow
                  </button>
                </div>

                {/* Prev / Next Day Steppers */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    paddingTop: '8px',
                    borderTop: '1px solid var(--border-subtle)',
                  }}
                >
                  <button
                    type="button"
                    className="btn btn-ghost btn-sm"
                    style={{ fontSize: '0.76rem', gap: '4px', padding: '4px 8px' }}
                    onClick={() => {
                      const d = new Date(activeDate + 'T00:00:00');
                      d.setDate(d.getDate() - 1);
                      const y = d.getFullYear();
                      const m = String(d.getMonth() + 1).padStart(2, '0');
                      const day = String(d.getDate()).padStart(2, '0');
                      setSelectedDate(`${y}-${m}-${day}`);
                    }}
                  >
                    <ChevronLeft size={13} /> Previous Day
                  </button>
                  <button
                    type="button"
                    className="btn btn-ghost btn-sm"
                    style={{ fontSize: '0.76rem', gap: '4px', padding: '4px 8px' }}
                    onClick={() => {
                      const d = new Date(activeDate + 'T00:00:00');
                      d.setDate(d.getDate() + 1);
                      const y = d.getFullYear();
                      const m = String(d.getMonth() + 1).padStart(2, '0');
                      const day = String(d.getDate()).padStart(2, '0');
                      setSelectedDate(`${y}-${m}-${day}`);
                    }}
                  >
                    Next Day <ChevronRight size={13} />
                  </button>
                </div>
              </div>
            </>
          )}
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

        {/* Quick Theme Toggle */}
        <button
          type="button"
          className="btn-icon"
          onClick={() => {
            const nextTheme =
              settings?.theme === 'light'
                ? 'dark'
                : settings?.theme === 'dark'
                ? 'oled'
                : 'light';
            setSettings({ ...settings, theme: nextTheme });
            const titleMap = {
              light: 'Light Mode',
              dark: 'Dark Navy Mode',
              oled: 'Pure Very Dark (OLED)',
            };
            showToast({
              type: 'info',
              title: titleMap[nextTheme] || 'Theme Updated',
              message: `Switched to ${titleMap[nextTheme] || nextTheme} appearance.`,
            });
          }}
          aria-label="Toggle theme appearance"
          title={`Current theme: ${settings?.theme || 'light'}. Click to cycle.`}
          id="btn-header-theme-toggle"
        >
          {settings?.theme === 'light' ? (
            <Moon size={19} />
          ) : settings?.theme === 'oled' ? (
            <Sun size={19} color="#FBBF24" />
          ) : (
            <Moon size={19} color="var(--primary-color)" />
          )}
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
            {totalAlertCount > 0 && (
              <span
                style={{
                  position: 'absolute',
                  top: '6px',
                  right: '6px',
                  minWidth: '16px',
                  height: '16px',
                  borderRadius: '10px',
                  backgroundColor: pendingRequests.length > 0 ? '#F59E0B' : 'var(--danger)',
                  color: '#FFFFFF',
                  fontSize: '0.62rem',
                  fontWeight: 800,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: '0 3px',
                }}
              >
                {totalAlertCount}
              </span>
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
                  width: '360px',
                  background: 'var(--card-bg)',
                  border: '1px solid var(--border-color)',
                  borderRadius: 'var(--radius-lg)',
                  boxShadow: 'none',
                  zIndex: 50,
                  overflow: 'hidden',
                }}
              >
                <div
                  style={{
                    padding: '12px 16px',
                    borderBottom: '1px solid var(--border-color)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    background: 'rgba(0,0,0,0.15)',
                  }}
                >
                  <span style={{ fontWeight: 800, fontSize: '0.92rem' }}>Notifications & Requests</span>
                  {notifications.length > 0 && (
                    <button
                      type="button"
                      className="btn btn-ghost btn-sm"
                      style={{ padding: '2px 6px', fontSize: '0.74rem' }}
                      onClick={clearNotifications}
                    >
                      Clear all
                    </button>
                  )}
                </div>

                <div style={{ maxHeight: '380px', overflowY: 'auto' }}>
                  {/* Automatically Detected Missed Tasks Section */}
                  {autoMissedTasks.length > 0 && (
                    <div style={{ borderBottom: '1px solid var(--border-color)', background: 'rgba(239, 68, 68, 0.05)' }}>
                      <div
                        style={{
                          padding: '8px 14px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          background: 'rgba(239, 68, 68, 0.12)',
                          borderBottom: '1px solid rgba(239, 68, 68, 0.25)',
                        }}
                      >
                        <span style={{ fontSize: '0.76rem', fontWeight: 800, color: '#EF4444', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                          Unmarked Tasks ({autoMissedTasks.length})
                        </span>
                        <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>Time Passed</span>
                      </div>

                      {autoMissedTasks.map((t) => (
                        <div
                          key={t.id}
                          style={{
                            padding: '12px 14px',
                            borderBottom: '1px solid rgba(255,255,255,0.06)',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '6px',
                          }}
                        >
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                            <span style={{ fontSize: '0.86rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                              {t.title}
                            </span>
                            <span style={{ fontSize: '0.7rem', color: '#EF4444', fontWeight: 700 }}>
                              {t.date}
                            </span>
                          </div>

                          <div style={{ fontSize: '0.76rem', color: 'var(--text-secondary)' }}>
                            Scheduled: {t.startTime || ''} {t.endTime ? `- ${t.endTime}` : ''} (Not marked)
                          </div>

                          {/* The 3 Action Buttons */}
                          <div
                            style={{
                              display: 'grid',
                              gridTemplateColumns: '1fr 1fr 1fr',
                              gap: '6px',
                              marginTop: '4px',
                            }}
                          >
                            <button
                              type="button"
                              onClick={() => handleMarkTaskComplete(t)}
                              style={{
                                padding: '5px 4px',
                                borderRadius: '6px',
                                border: 'none',
                                background: '#10B981',
                                color: '#FFFFFF',
                                fontSize: '0.72rem',
                                fontWeight: 800,
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '3px',
                              }}
                            >
                              <Check size={12} /> Complete
                            </button>

                            <button
                              type="button"
                              onClick={() => setReschedulingRequest({ ...t, isTask: true })}
                              style={{
                                padding: '5px 4px',
                                borderRadius: '6px',
                                border: 'none',
                                background: '#3B82F6',
                                color: '#FFFFFF',
                                fontSize: '0.72rem',
                                fontWeight: 800,
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '3px',
                              }}
                            >
                              <Calendar size={12} /> Reschedule
                            </button>

                            <button
                              type="button"
                              onClick={() => setCancellingRequest({ ...t, isTask: true })}
                              style={{
                                padding: '5px 4px',
                                borderRadius: '6px',
                                border: 'none',
                                background: '#EF4444',
                                color: '#FFFFFF',
                                fontSize: '0.72rem',
                                fontWeight: 800,
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '3px',
                              }}
                            >
                              <XIcon size={12} /> Cancel
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Pending Missed Work Requests Section */}
                  {pendingRequests.length > 0 && (
                    <div style={{ borderBottom: '1px solid var(--border-color)', background: 'rgba(245, 158, 11, 0.04)' }}>
                      <div
                        style={{
                          padding: '8px 14px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          background: 'rgba(245, 158, 11, 0.1)',
                          borderBottom: '1px solid rgba(245, 158, 11, 0.2)',
                        }}
                      >
                        <span style={{ fontSize: '0.76rem', fontWeight: 800, color: '#F59E0B', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                          Missed Work Requests ({pendingRequests.length})
                        </span>
                        <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>Action Required</span>
                      </div>

                      {pendingRequests.map((req) => (
                        <div
                          key={req.id}
                          style={{
                            padding: '12px 14px',
                            borderBottom: '1px solid rgba(255,255,255,0.06)',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '6px',
                          }}
                        >
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                            <span style={{ fontSize: '0.86rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                              {req.title}
                            </span>
                            <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>
                              {req.date}
                            </span>
                          </div>

                          {/* Reason */}
                          <div
                            style={{
                              fontSize: '0.78rem',
                              color: 'var(--text-secondary)',
                              background: 'rgba(0,0,0,0.2)',
                              padding: '5px 8px',
                              borderRadius: '6px',
                              borderLeft: '2px solid #F59E0B',
                            }}
                          >
                            <strong style={{ color: 'var(--text-primary)' }}>Reason:</strong> {req.reason}
                          </div>

                          {/* The 3 Action Buttons */}
                          <div
                            style={{
                              display: 'grid',
                              gridTemplateColumns: '1fr 1fr 1fr',
                              gap: '6px',
                              marginTop: '4px',
                            }}
                          >
                            <button
                              type="button"
                              onClick={() => handleMarkRequestComplete(req.id)}
                              style={{
                                padding: '5px 4px',
                                borderRadius: '6px',
                                border: 'none',
                                background: '#10B981',
                                color: '#FFFFFF',
                                fontSize: '0.72rem',
                                fontWeight: 800,
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '3px',
                              }}
                            >
                              <Check size={12} /> Complete
                            </button>

                            <button
                              type="button"
                              onClick={() => setReschedulingRequest(req)}
                              style={{
                                padding: '5px 4px',
                                borderRadius: '6px',
                                border: 'none',
                                background: '#3B82F6',
                                color: '#FFFFFF',
                                fontSize: '0.72rem',
                                fontWeight: 800,
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '3px',
                              }}
                            >
                              <Calendar size={12} /> Reschedule
                            </button>

                            <button
                              type="button"
                              onClick={() => setCancellingRequest(req)}
                              style={{
                                padding: '5px 4px',
                                borderRadius: '6px',
                                border: 'none',
                                background: '#EF4444',
                                color: '#FFFFFF',
                                fontSize: '0.72rem',
                                fontWeight: 800,
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '3px',
                              }}
                            >
                              <XIcon size={12} /> Cancel
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Standard Notifications */}
                  {notifications.length === 0 && pendingRequests.length === 0 && autoMissedTasks.length === 0 ? (
                    <div style={{ padding: '24px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                      No notifications or pending requests.
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

      {/* Global Search Command Palette Modal */}
      <GlobalSearchModal
        isOpen={isGlobalSearchOpen}
        onClose={() => setIsGlobalSearchOpen(false)}
      />

      {/* Mandatory Cancel Remarks Modal */}
      <CancelRemarksModal
        isOpen={!!cancellingRequest}
        requestTitle={cancellingRequest?.title || ''}
        onClose={() => setCancellingRequest(null)}
        onConfirm={handleConfirmCancelItem}
      />

      {/* Reschedule Request Modal */}
      <RescheduleRequestModal
        isOpen={!!reschedulingRequest}
        request={reschedulingRequest}
        onClose={() => setReschedulingRequest(null)}
        onConfirm={handleConfirmRescheduleItem}
      />
    </header>
  );
}
