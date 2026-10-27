import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Clock,
  Check,
  AlertCircle,
  Plus,
  Calendar as CalendarIcon,
  MapPin,
  Target,
  Edit2,
  Trash2,
  MoreHorizontal,
  Radio,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { formatDate, getTodayDateString } from '../../utils/dateUtils';
import { getEffectiveStatus } from '../../utils/taskUtils';

function formatPaddedTime(timeStr, is12Hour = true) {
  if (!timeStr) return '';
  const [hStr, mStr] = timeStr.split(':');
  let h = parseInt(hStr, 10);
  const m = mStr || '00';
  if (!is12Hour) {
    return `${String(h).padStart(2, '0')}:${m}`;
  }
  const ampm = h >= 12 ? 'PM' : 'AM';
  h = h % 12;
  h = h ? h : 12;
  return `${String(h).padStart(2, '0')}:${m} ${ampm}`;
}

function getEffectiveEndTime(startTime, endTime) {
  if (endTime) return endTime;
  if (!startTime) return '';
  const [sH, sM] = startTime.split(':').map(Number);
  const eH = (sH + 1) % 24;
  return `${String(eH).padStart(2, '0')}:${String(sM || 0).padStart(2, '0')}`;
}

function getDurationString(startTime, endTime) {
  if (!startTime) return 'Flexible';
  const [sH, sM] = startTime.split(':').map(Number);
  let endH, endM;
  if (endTime) {
    [endH, endM] = endTime.split(':').map(Number);
  } else {
    endH = sH + 1;
    endM = sM || 0;
  }
  let sTotal = sH * 60 + (sM || 0);
  let eTotal = endH * 60 + (endM || 0);
  if (eTotal < sTotal) eTotal += 24 * 60;
  const diff = Math.max(15, eTotal - sTotal);
  const hours = Math.floor(diff / 60);
  const minutes = diff % 60;
  if (hours > 0 && minutes > 0) return `${hours}h ${String(minutes).padStart(2, '0')}m`;
  if (hours > 0) return `${hours}h 00m`;
  return `${minutes}m`;
}

export function DailyScheduleTimeline({
  date = getTodayDateString(),
  items: propItems = null,
  includeEvents = true,
  compact = false,
  showHeader = true,
  title = null,
  subtitle = null,
  onAddTask = null,
  onAddEvent = null,
  emptyMessage = 'No schedule entries for this date.',
  maxItems = null,
  animatedCascade = false,
  readOnly = false,
  showActions = true,
}) {
  const {
    tasks = [],
    events = [],
    categories = [],
    goals = [],
    settings = {},
    toggleTaskComplete,
    openModal,
    deleteEvent,
    deleteTask,
  } = useApp();

  const [openMenuId, setOpenMenuId] = useState(null);

  // Close menu on outside click or Escape key
  useEffect(() => {
    if (!openMenuId) return;
    const handleOutsideClick = (e) => {
      if (e.target.closest && e.target.closest('.timeline-action-menu-wrap')) {
        return;
      }
      setOpenMenuId(null);
    };
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setOpenMenuId(null);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    document.addEventListener('touchstart', handleOutsideClick);
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
      document.removeEventListener('touchstart', handleOutsideClick);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [openMenuId]);

  const is12Hour = settings.timeFormat !== '24h';
  const todayStr = getTodayDateString();
  const isToday = date === todayStr;

  const now = new Date();
  const nowMinutes = now.getHours() * 60 + now.getMinutes();

  // Derive schedule items for date if propItems not provided
  const scheduleItems = React.useMemo(() => {
    if (propItems) return propItems;

    let list = [];
    const dayTasks = tasks
      .filter((t) => t.date === date)
      .map((t) => ({ ...t, isEvent: false }));
    list = [...list, ...dayTasks];

    if (includeEvents && events) {
      const dayEvents = events
        .filter((e) => e.date === date)
        .map((e) => ({ ...e, isEvent: true }));
      list = [...list, ...dayEvents];
    }

    list.sort((a, b) => {
      const timeA = a.startTime || '99:99';
      const timeB = b.startTime || '99:99';
      return timeA.localeCompare(timeB);
    });

    if (maxItems && maxItems > 0) {
      return list.slice(0, maxItems);
    }
    return list;
  }, [propItems, tasks, events, date, includeEvents, maxItems]);

  const totalCount = scheduleItems.length;
  const completedCount = scheduleItems.filter(
    (item) => !item.isEvent && getEffectiveStatus(item) === 'completed'
  ).length;

  return (
    <div className={`daily-timeline-container ${compact ? 'compact' : ''}`}>
      {/* Optional Header */}
      {showHeader && (
        <div className="daily-timeline-header">
          <div>
            <h3 className="daily-timeline-title">
              <Clock size={compact ? 16 : 18} color="var(--primary-color)" />
              {title || `${formatDate(date, { month: 'short', day: 'numeric' })} Schedule Timeline`}
            </h3>
            <span className="daily-timeline-subtitle">
              {subtitle ||
                (totalCount > 0
                  ? `${totalCount} ${totalCount === 1 ? 'item' : 'items'} • ${completedCount} completed`
                  : isToday
                  ? 'Chronological sequence for today'
                  : 'Planned timeline sequence')}
            </span>
          </div>

          {showActions && !readOnly && (
            <div className="daily-timeline-header-actions">
              {onAddTask ? (
                <button
                  type="button"
                  className="btn btn-primary btn-sm"
                  onClick={onAddTask}
                >
                  <Plus size={13} /> Add
                </button>
              ) : (
                <button
                  type="button"
                  className="btn btn-primary btn-sm"
                  onClick={() => openModal('task', { date })}
                >
                  <Plus size={13} /> Add
                </button>
              )}
              {includeEvents && (
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={onAddEvent ? onAddEvent : () => openModal('event', { date })}
                >
                  <CalendarIcon size={13} /> Event
                </button>
              )}
            </div>
          )}
        </div>
      )}

      {/* Timeline List Body */}
      {totalCount === 0 ? (
        <div className="daily-timeline-empty">
          <CalendarIcon size={32} strokeWidth={1.5} color="var(--text-muted)" style={{ opacity: 0.7 }} />
          <p>{emptyMessage}</p>
          {!readOnly && (
            <div style={{ display: 'flex', gap: '8px', marginTop: '10px' }}>
              <button
                type="button"
                className="btn btn-primary btn-sm"
                onClick={() => openModal('task', { date })}
              >
                <Plus size={13} /> Schedule Task
              </button>
              {includeEvents && (
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={() => openModal('event', { date })}
                >
                  <CalendarIcon size={13} /> Add Event
                </button>
              )}
            </div>
          )}
        </div>
      ) : (
        <div className="daily-timeline-list">
          {scheduleItems.map((item, idx, arr) => {
            const isEvent = !!item.isEvent;
            const category = categories.find((c) => c.id === item.categoryId) || {
              color: isEvent ? '#8B5CF6' : '#1769FF',
              name: isEvent ? 'Event' : 'General',
            };

            const effectiveStatus = isEvent ? 'scheduled' : getEffectiveStatus(item);
            const isCompleted = !isEvent && effectiveStatus === 'completed';

            // Determine itemState: 'completed', 'in_progress', 'upcoming', 'overdue', 'event'
            let itemState = 'upcoming';
            if (isEvent) {
              itemState = 'event';
            } else if (isCompleted) {
              itemState = 'completed';
            } else if (item.startTime) {
              const [sH, sM] = item.startTime.split(':').map(Number);
              const startM = sH * 60 + (sM || 0);
              let endM = startM + 60;
              if (item.endTime) {
                const [eH, eM] = item.endTime.split(':').map(Number);
                endM = eH * (eM !== undefined ? 60 : 0) + (eM || 0);
                if (endM < startM) endM += 24 * 60;
              }

              if (isToday) {
                if (nowMinutes >= startM && nowMinutes < endM) {
                  itemState = 'in_progress';
                } else if (nowMinutes >= endM) {
                  itemState = 'overdue';
                } else {
                  itemState = 'upcoming';
                }
              } else if (effectiveStatus === 'overdue') {
                itemState = 'overdue';
              }
            }

            const isFirst = idx === 0;
            const isLast = idx === arr.length - 1;

            const prevItem = !isFirst ? arr[idx - 1] : null;
            const prevEffectiveStatus = prevItem ? (!prevItem.isEvent ? getEffectiveStatus(prevItem) : 'scheduled') : null;
            const prevIsCompleted = prevEffectiveStatus === 'completed';
            const prevIsOverdue = prevEffectiveStatus === 'overdue';

            const nextItem = !isLast ? arr[idx + 1] : null;
            const nextEffectiveStatus = nextItem ? (!nextItem.isEvent ? getEffectiveStatus(nextItem) : 'scheduled') : null;
            const nextIsCompleted = nextEffectiveStatus === 'completed';
            const nextIsOverdue = nextEffectiveStatus === 'overdue';

            // Segment styles
            let topSegmentClass = 'segment-pending';
            if (prevIsCompleted && isCompleted) {
              topSegmentClass = 'segment-done';
            } else if (itemState === 'overdue') {
              topSegmentClass = 'segment-overdue';
            } else if (isCompleted) {
              topSegmentClass = 'segment-done';
            } else if (prevIsOverdue) {
              topSegmentClass = 'segment-overdue';
            } else if (prevIsCompleted) {
              topSegmentClass = 'segment-done';
            }

            let bottomSegmentClass = 'segment-pending';
            if (isCompleted) {
              if (nextIsCompleted) {
                bottomSegmentClass = 'segment-done';
              } else if (nextIsOverdue) {
                bottomSegmentClass = 'segment-transition-done-to-overdue';
              } else {
                bottomSegmentClass = 'segment-transition';
              }
            } else if (itemState === 'overdue') {
              if (nextIsOverdue) {
                bottomSegmentClass = 'segment-overdue';
              } else if (nextIsCompleted) {
                bottomSegmentClass = 'segment-transition-overdue-to-done';
              } else {
                bottomSegmentClass = 'segment-transition-overdue-to-pending';
              }
            } else {
              bottomSegmentClass = 'segment-pending';
            }

            const linkedGoal = goals.find(
              (g) => g.id === item.goalId || g.relatedTaskIds?.includes(item.id)
            );

            // Time strings
            const startTimeFormatted = formatPaddedTime(item.startTime, is12Hour);
            const effectiveEndTime = getEffectiveEndTime(item.startTime, item.endTime);
            const endTimeFormatted = formatPaddedTime(effectiveEndTime, is12Hour);
            const durationStr = getDurationString(item.startTime, item.endTime);

            const itemContent = (
              <>
                {/* Continuous Seamless Timeline Rail */}
                <div className="timeline-rail" style={{ width: '28px' }}>
                  {/* Top connector segment */}
                  {!isFirst && (
                    <div
                      className={`timeline-line-segment top ${topSegmentClass}`}
                      style={{ top: 0, height: '22px' }}
                    />
                  )}

                  {/* Circular Node */}
                  <div
                    className={`timeline-node node-${itemState}`}
                    style={{
                      width: '20px',
                      height: '20px',
                      borderRadius: '50%',
                      border: '2px solid',
                      backgroundColor:
                        itemState === 'completed'
                          ? '#10B981'
                          : itemState === 'in_progress'
                          ? '#0284C7'
                          : itemState === 'overdue'
                          ? '#EF4444'
                          : itemState === 'event'
                          ? '#8B5CF6'
                          : 'var(--card-bg)',
                      borderColor:
                        itemState === 'completed'
                          ? '#10B981'
                          : itemState === 'in_progress'
                          ? '#38BDF8'
                          : itemState === 'overdue'
                          ? '#EF4444'
                          : itemState === 'event'
                          ? '#8B5CF6'
                          : '#475569',
                      boxShadow:
                        itemState === 'in_progress'
                          ? '0 0 12px rgba(56, 189, 248, 0.7)'
                          : 'none',
                      cursor: readOnly ? 'default' : 'pointer',
                      marginTop: '20px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      zIndex: 3,
                    }}
                    onClick={() => {
                      if (!readOnly) {
                        if (!isEvent) toggleTaskComplete(item.id);
                        else openModal('event', item);
                      }
                    }}
                    title={
                      isEvent
                        ? `Event: ${item.title}`
                        : isCompleted
                        ? 'Completed'
                        : itemState === 'in_progress'
                        ? 'In Progress (Active)'
                        : itemState === 'overdue'
                        ? 'Overdue'
                        : 'Scheduled'
                    }
                  >
                    {itemState === 'completed' ? (
                      <Check size={11} strokeWidth={3} color="#ffffff" />
                    ) : itemState === 'in_progress' ? (
                      <span
                        style={{
                          width: '6px',
                          height: '6px',
                          borderRadius: '50%',
                          backgroundColor: '#ffffff',
                        }}
                      />
                    ) : itemState === 'overdue' ? (
                      <AlertCircle size={11} strokeWidth={2.5} color="#ffffff" />
                    ) : (
                      <span
                        className="timeline-node-dot"
                        style={{ backgroundColor: '#64748B', width: '5px', height: '5px' }}
                      />
                    )}
                  </div>

                  {/* Bottom connector segment */}
                  {!isLast && (
                    <div
                      className={`timeline-line-segment bottom ${bottomSegmentClass}`}
                      style={{ top: '40px', bottom: 0 }}
                    />
                  )}
                </div>

                {/* Horizontal Modern Schedule Sequence Card */}
                <div
                  className={`timeline-seq-card status-${itemState}`}
                  style={{
                    flex: 1,
                    minWidth: 0,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '12px 18px',
                    borderRadius: '12px',
                    background:
                      itemState === 'in_progress'
                        ? 'rgba(23, 105, 255, 0.08)'
                        : itemState === 'completed'
                        ? 'rgba(16, 185, 129, 0.04)'
                        : itemState === 'overdue'
                        ? 'rgba(239, 68, 68, 0.04)'
                        : 'var(--card-bg)',
                    border:
                      itemState === 'in_progress'
                        ? '1.5px solid #0284C7'
                        : itemState === 'completed'
                        ? '1px solid rgba(16, 185, 129, 0.3)'
                        : itemState === 'overdue'
                        ? '1px solid rgba(239, 68, 68, 0.3)'
                        : '1px solid var(--border-color)',
                    boxShadow:
                      itemState === 'in_progress'
                        ? '0 0 16px rgba(56, 189, 248, 0.22)'
                        : 'var(--shadow-sm)',
                    transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
                    cursor: readOnly ? 'default' : 'pointer',
                    position: 'relative',
                    zIndex: openMenuId === item.id ? 100 : 'auto',
                    gap: '14px',
                    marginBottom: '10px',
                  }}
                  onClick={() => {
                    if (!readOnly) {
                      if (isEvent) openModal('event', item);
                      else openModal('task', item);
                    }
                  }}
                >
                  {/* Column 1: Time Column (Start / End Stack) */}
                  <div
                    style={{
                      width: '74px',
                      flexShrink: 0,
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'center',
                      gap: '2px',
                    }}
                  >
                    <span
                      style={{
                        fontSize: '0.82rem',
                        fontWeight: 700,
                        color: itemState === 'in_progress' ? '#38BDF8' : 'var(--text-primary)',
                        letterSpacing: '0.01em',
                        lineHeight: 1.2,
                      }}
                    >
                      {startTimeFormatted || 'All Day'}
                    </span>
                    <span
                      style={{
                        fontSize: '0.74rem',
                        fontWeight: 600,
                        color: 'var(--text-muted)',
                        lineHeight: 1.2,
                      }}
                    >
                      {endTimeFormatted || 'Flexible'}
                    </span>
                  </div>

                  {/* Column 2: Colored Vertical Accent Divider */}
                  <div
                    style={{
                      width: '2.5px',
                      height: '36px',
                      borderRadius: '2px',
                      backgroundColor: category.color || '#1769FF',
                      flexShrink: 0,
                    }}
                  />

                  {/* Column 3: Title & Description */}
                  <div
                    style={{
                      flex: 1,
                      minWidth: 0,
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'center',
                      gap: '3px',
                    }}
                  >
                    <h4
                      style={{
                        margin: 0,
                        fontSize: '0.92rem',
                        fontWeight: 600,
                        color: isCompleted ? 'var(--text-muted)' : 'var(--text-primary)',
                        textDecoration: isCompleted ? 'line-through' : 'none',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                      }}
                      title={item.title}
                    >
                      {item.title}
                    </h4>
                    <p
                      style={{
                        margin: 0,
                        fontSize: '0.78rem',
                        color: 'var(--text-secondary)',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                      }}
                      title={item.description}
                    >
                      {item.description || 'No description provided'}
                    </p>
                  </div>

                  {/* Column 4: Badges (Category + Priority + Goal) */}
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      flexShrink: 0,
                    }}
                  >
                    {/* Category Capsule */}
                    <span
                      style={{
                        fontSize: '0.72rem',
                        fontWeight: 600,
                        padding: '3px 10px',
                        borderRadius: '9999px',
                        backgroundColor: `${category.color}18`,
                        color: category.color,
                        border: `1px solid ${category.color}40`,
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {category.name}
                    </span>

                    {/* Priority Capsule */}
                    {!isEvent && item.priority && (
                      <span
                        style={{
                          fontSize: '0.72rem',
                          fontWeight: 700,
                          padding: '3px 10px',
                          borderRadius: '9999px',
                          backgroundColor:
                            item.priority.toLowerCase() === 'high'
                              ? 'rgba(239, 68, 68, 0.16)'
                              : item.priority.toLowerCase() === 'low'
                              ? 'rgba(16, 185, 129, 0.16)'
                              : 'rgba(245, 158, 11, 0.16)',
                          color:
                            item.priority.toLowerCase() === 'high'
                              ? '#EF4444'
                              : item.priority.toLowerCase() === 'low'
                              ? '#10B981'
                              : '#F59E0B',
                          border: `1px solid ${
                            item.priority.toLowerCase() === 'high'
                              ? 'rgba(239, 68, 68, 0.35)'
                              : item.priority.toLowerCase() === 'low'
                              ? 'rgba(16, 185, 129, 0.35)'
                              : 'rgba(245, 158, 11, 0.35)'
                          }`,
                          whiteSpace: 'nowrap',
                          textTransform: 'capitalize',
                        }}
                      >
                        {item.priority}
                      </span>
                    )}

                    {/* Goal Capsule */}
                    {linkedGoal && (
                      <span
                        style={{
                          fontSize: '0.7rem',
                          fontWeight: 600,
                          padding: '3px 8px',
                          borderRadius: '9999px',
                          backgroundColor: 'rgba(var(--primary-rgb, 23, 105, 255), 0.12)',
                          color: 'var(--primary-color)',
                          border: '1px solid rgba(var(--primary-rgb, 23, 105, 255), 0.25)',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px',
                          maxWidth: '120px',
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                        }}
                        title={`Goal: ${linkedGoal.title}`}
                      >
                        <Target size={10} />
                        {linkedGoal.title}
                      </span>
                    )}
                  </div>

                  {/* Column 5: Status Badge & Duration */}
                  <div
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'flex-end',
                      justifyContent: 'center',
                      gap: '3px',
                      flexShrink: 0,
                      minWidth: '105px',
                    }}
                  >
                    {itemState === 'completed' && (
                      <div
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '5px',
                          padding: '4px 12px',
                          borderRadius: '9999px',
                          backgroundColor: 'rgba(16, 185, 129, 0.16)',
                          border: '1px solid rgba(16, 185, 129, 0.4)',
                          color: '#10B981',
                          fontSize: '0.74rem',
                          fontWeight: 700,
                        }}
                        onClick={(e) => {
                          if (!readOnly && !isEvent) {
                            e.stopPropagation();
                            toggleTaskComplete(item.id);
                          }
                        }}
                        title={readOnly ? '' : 'Click to mark as pending'}
                      >
                        <Check size={12} strokeWidth={3} />
                        Completed
                      </div>
                    )}

                    {itemState === 'in_progress' && (
                      <div
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '5px',
                          padding: '4px 12px',
                          borderRadius: '9999px',
                          backgroundColor: 'rgba(23, 105, 255, 0.22)',
                          border: '1px solid rgba(56, 189, 248, 0.55)',
                          color: '#38BDF8',
                          fontSize: '0.74rem',
                          fontWeight: 700,
                        }}
                        onClick={(e) => {
                          if (!readOnly && !isEvent) {
                            e.stopPropagation();
                            toggleTaskComplete(item.id);
                          }
                        }}
                        title={readOnly ? '' : 'Click to mark as complete'}
                      >
                        <Radio size={12} className="pulse-glow" />
                        In Progress
                      </div>
                    )}

                    {itemState === 'upcoming' && (
                      <div
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '5px',
                          padding: '4px 12px',
                          borderRadius: '9999px',
                          backgroundColor: 'rgba(148, 163, 184, 0.1)',
                          border: '1px solid var(--border-subtle)',
                          color: 'var(--text-secondary)',
                          fontSize: '0.74rem',
                          fontWeight: 600,
                        }}
                        onClick={(e) => {
                          if (!readOnly && !isEvent) {
                            e.stopPropagation();
                            toggleTaskComplete(item.id);
                          }
                        }}
                        title={readOnly ? '' : 'Click to mark as complete'}
                      >
                        <Clock size={11} />
                        Upcoming
                      </div>
                    )}

                    {itemState === 'overdue' && (
                      <div
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '5px',
                          padding: '4px 12px',
                          borderRadius: '9999px',
                          backgroundColor: 'rgba(239, 68, 68, 0.16)',
                          border: '1px solid rgba(239, 68, 68, 0.4)',
                          color: '#EF4444',
                          fontSize: '0.74rem',
                          fontWeight: 700,
                        }}
                        onClick={(e) => {
                          if (!readOnly && !isEvent) {
                            e.stopPropagation();
                            toggleTaskComplete(item.id);
                          }
                        }}
                        title={readOnly ? '' : 'Click to mark as complete'}
                      >
                        <AlertCircle size={12} strokeWidth={2.5} />
                        Overdue
                      </div>
                    )}

                    {itemState === 'event' && (
                      <div
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '5px',
                          padding: '4px 12px',
                          borderRadius: '9999px',
                          backgroundColor: 'rgba(139, 92, 246, 0.18)',
                          border: '1px solid rgba(139, 92, 246, 0.4)',
                          color: '#A78BFA',
                          fontSize: '0.74rem',
                          fontWeight: 700,
                        }}
                      >
                        <CalendarIcon size={11} />
                        Event
                      </div>
                    )}

                    <span
                      style={{
                        fontSize: '0.72rem',
                        color: 'var(--text-muted)',
                        fontWeight: 500,
                      }}
                    >
                      {durationStr}
                    </span>
                  </div>

                  {/* Column 6: Actions Menu (...) */}
                  <div
                    className="timeline-action-menu-wrap"
                    style={{ position: 'relative', zIndex: openMenuId === item.id ? 100 : 'auto' }}
                    onClick={(e) => e.stopPropagation()}
                  >
                    <button
                      type="button"
                      className="btn-icon"
                      style={{
                        width: '28px',
                        height: '28px',
                        color: 'var(--text-muted)',
                        padding: 0,
                        borderRadius: '6px',
                      }}
                      onClick={() => setOpenMenuId(openMenuId === item.id ? null : item.id)}
                      aria-label="Actions"
                    >
                      <MoreHorizontal size={17} />
                    </button>

                    {openMenuId === item.id && (
                      <>
                        <div
                          style={{ position: 'fixed', inset: 0, zIndex: 99 }}
                          onClick={() => setOpenMenuId(null)}
                        />
                        <div
                          style={{
                            position: 'absolute',
                            right: 0,
                            top: 'calc(100% + 4px)',
                            background: 'var(--card-bg)',
                            border: '1px solid var(--border-color)',
                            borderRadius: 'var(--radius-md)',
                            boxShadow: 'var(--shadow-lg), 0 10px 25px -5px rgba(0, 0, 0, 0.45)',
                            padding: '6px',
                            zIndex: 100,
                            minWidth: '140px',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '2px',
                          }}
                        >
                          {!isEvent && (
                            <button
                              type="button"
                              className="btn btn-ghost btn-sm"
                              style={{ justifyContent: 'flex-start', width: '100%', gap: '8px' }}
                              onClick={() => {
                                setOpenMenuId(null);
                                toggleTaskComplete(item.id);
                              }}
                            >
                              <Check size={13} />
                              {isCompleted ? 'Mark Pending' : 'Mark Completed'}
                            </button>
                          )}
                          <button
                            type="button"
                            className="btn btn-ghost btn-sm"
                            style={{ justifyContent: 'flex-start', width: '100%', gap: '8px' }}
                            onClick={() => {
                              setOpenMenuId(null);
                              if (isEvent) openModal('event', item);
                              else openModal('task', item);
                            }}
                          >
                            <Edit2 size={13} />
                            Edit
                          </button>
                          <button
                            type="button"
                            className="btn btn-ghost btn-sm"
                            style={{ justifyContent: 'flex-start', width: '100%', gap: '8px', color: 'var(--danger)' }}
                            onClick={() => {
                              setOpenMenuId(null);
                              if (isEvent) deleteEvent(item.id);
                              else deleteTask(item.id);
                            }}
                          >
                            <Trash2 size={13} />
                            Delete
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </>
            );

            if (animatedCascade) {
              return (
                <motion.div
                  key={item.id || `timeline-item-${idx}`}
                  initial={{ opacity: 0, x: -24, y: 12 }}
                  animate={{ opacity: 1, x: 0, y: 0 }}
                  transition={{
                    duration: 0.42,
                    delay: idx * 0.12,
                    ease: [0.16, 1, 0.3, 1],
                  }}
                  className={`timeline-item-wrapper ${isCompleted ? 'is-completed' : ''} ${
                    itemState === 'overdue' ? 'is-overdue' : ''
                  }`}
                  style={{
                    position: 'relative',
                    zIndex: openMenuId === item.id ? 100 : (scheduleItems.length - idx),
                  }}
                >
                  {itemContent}
                </motion.div>
              );
            }

            return (
              <div
                key={item.id || `timeline-item-${idx}`}
                className={`timeline-item-wrapper ${isCompleted ? 'is-completed' : ''} ${
                  itemState === 'overdue' ? 'is-overdue' : ''
                }`}
                style={{
                  position: 'relative',
                  zIndex: openMenuId === item.id ? 100 : (scheduleItems.length - idx),
                }}
              >
                {itemContent}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
