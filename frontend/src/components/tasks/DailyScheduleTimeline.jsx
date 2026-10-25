import React from 'react';
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
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { formatDate, formatTime, isTaskOverdue, getTodayDateString } from '../../utils/dateUtils';
import { getEffectiveStatus } from '../../utils/taskUtils';
import { PriorityBadge } from '../common/StatusBadge';

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

  const is12Hour = settings.timeFormat !== '24h';
  const todayStr = getTodayDateString();
  const isToday = date === todayStr;

  // Derive schedule items for date if propItems not provided
  const scheduleItems = React.useMemo(() => {
    if (propItems) return propItems;

    let list = [];
    // 1. Tasks for date
    const dayTasks = tasks
      .filter((t) => t.date === date)
      .map((t) => ({ ...t, isEvent: false }));
    list = [...list, ...dayTasks];

    // 2. Events for date
    if (includeEvents && events) {
      const dayEvents = events
        .filter((e) => e.date === date)
        .map((e) => ({ ...e, isEvent: true }));
      list = [...list, ...dayEvents];
    }

    // Sort chronologically by startTime, placing items without startTime at the end
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
            const isOverdue = !isEvent && effectiveStatus === 'overdue';

            const isFirst = idx === 0;
            const isLast = idx === arr.length - 1;

            const prevItem = !isFirst ? arr[idx - 1] : null;
            const prevIsCompleted = prevItem && !prevItem.isEvent && getEffectiveStatus(prevItem) === 'completed';

            const nextItem = !isLast ? arr[idx + 1] : null;
            const nextIsCompleted = nextItem && !nextItem.isEvent && getEffectiveStatus(nextItem) === 'completed';

            const linkedGoal = goals.find(
              (g) => g.id === item.goalId || g.relatedTaskIds?.includes(item.id)
            );

            // Node accent color
            const accentColor = isEvent
              ? '#8B5CF6'
              : isCompleted
              ? 'var(--success)'
              : isOverdue
              ? 'var(--danger)'
              : category.color;

            // Formatted Time String
            const timeDisplay =
              item.startTime && item.endTime
                ? `${formatTime(item.startTime, is12Hour)} – ${formatTime(item.endTime, is12Hour)}`
                : item.startTime
                ? formatTime(item.startTime, is12Hour)
                : 'All Day';

            const itemContent = (
              <>
                {/* Continuous Seamless Timeline Rail */}
                <div className="timeline-rail">
                  {/* Top connector segment */}
                  {!isFirst && (
                    <div
                      className={`timeline-line-segment top ${
                        prevIsCompleted ? 'segment-done' : 'segment-pending'
                      }`}
                    />
                  )}

                  {/* Node */}
                  <div
                    className={`timeline-node ${
                      isCompleted ? 'done' : isOverdue ? 'overdue' : isEvent ? 'event' : 'pending'
                    }`}
                    style={{
                      backgroundColor: isCompleted
                        ? '#10B981'
                        : isOverdue
                        ? '#EF4444'
                        : isEvent
                        ? '#8B5CF6'
                        : '#FFFFFF',
                      borderColor: isCompleted
                        ? '#10B981'
                        : isOverdue
                        ? '#EF4444'
                        : isEvent
                        ? '#8B5CF6'
                        : category.color || '#CBD5E1',
                      cursor: readOnly ? 'default' : 'pointer',
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
                        : isOverdue
                        ? 'Overdue'
                        : 'Scheduled'
                    }
                  >
                    {isCompleted ? (
                      <Check size={compact ? 12 : 13} strokeWidth={3} color="#ffffff" />
                    ) : isOverdue ? (
                      <AlertCircle size={compact ? 12 : 13} strokeWidth={2.5} color="#ffffff" />
                    ) : isEvent ? (
                      <CalendarIcon size={compact ? 11 : 12} color="#ffffff" />
                    ) : (
                      <span
                        className="timeline-node-dot"
                        style={{ backgroundColor: category.color || '#1769FF' }}
                      />
                    )}
                  </div>

                  {/* Bottom connector segment */}
                  {!isLast && (
                    <div
                      className={`timeline-line-segment bottom ${
                        isCompleted
                          ? nextIsCompleted
                            ? 'segment-done'
                            : 'segment-transition'
                          : 'segment-pending'
                      }`}
                    />
                  )}
                </div>

                {/* Timeline Card */}
                <div
                  className={`timeline-card ${isCompleted ? 'done' : ''} ${
                    isOverdue ? 'overdue' : ''
                  } ${isEvent ? 'event-card' : ''}`}
                  style={{
                    borderLeftColor: accentColor,
                    cursor: readOnly ? 'default' : 'pointer',
                  }}
                  onClick={() => {
                    if (!readOnly) {
                      if (isEvent) openModal('event', item);
                      else openModal('task', item);
                    }
                  }}
                >
                  {/* Card Header: Time Pill + Status Badge */}
                  <div className="timeline-card-header">
                    <div className="timeline-time-pill" title={`Time: ${timeDisplay}`}>
                      <Clock size={11} />
                      <span className="time-text">{timeDisplay}</span>
                    </div>

                    <div className="timeline-card-actions" onClick={(e) => e.stopPropagation()}>
                      {isEvent ? (
                        <span
                          className="badge badge-primary"
                          style={{
                            fontSize: '0.68rem',
                            padding: '2px 8px',
                            backgroundColor: '#8B5CF6',
                            color: '#FFFFFF',
                            fontWeight: 700,
                          }}
                        >
                          Event
                        </span>
                      ) : readOnly ? (
                        <span
                          className={`badge ${
                            isCompleted ? 'badge-success' : isOverdue ? 'badge-danger' : 'badge-neutral'
                          }`}
                          style={{
                            fontSize: '0.68rem',
                            padding: '2px 8px',
                            fontWeight: 700,
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                            backgroundColor: isCompleted ? '#10B981' : isOverdue ? '#EF4444' : '#F1F5F9',
                            color: isCompleted || isOverdue ? '#FFFFFF' : '#334155',
                          }}
                        >
                          {isCompleted && <Check size={10} strokeWidth={3} />}
                          {isOverdue && <AlertCircle size={10} strokeWidth={2.5} />}
                          <span>{isCompleted ? 'Done' : isOverdue ? 'Overdue' : 'Scheduled'}</span>
                        </span>
                      ) : (
                        <button
                          type="button"
                          className={`badge timeline-status-btn ${
                            isCompleted
                              ? 'badge-success'
                              : isOverdue
                              ? 'badge-danger'
                              : 'badge-neutral'
                          }`}
                          style={{
                            backgroundColor: isCompleted ? '#10B981' : isOverdue ? '#EF4444' : '#F1F5F9',
                            color: isCompleted || isOverdue ? '#FFFFFF' : '#334155',
                            border: isCompleted || isOverdue ? 'none' : '1px solid #CBD5E1',
                            fontWeight: 700,
                          }}
                          onClick={() => toggleTaskComplete(item.id)}
                          title={isCompleted ? 'Click to mark pending' : 'Click to complete'}
                        >
                          {isCompleted && <Check size={11} strokeWidth={3} color="#FFFFFF" />}
                          {isOverdue && <AlertCircle size={11} strokeWidth={2.5} color="#FFFFFF" />}
                          <span>{isCompleted ? 'Done' : isOverdue ? 'Overdue' : 'Scheduled'}</span>
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Card Body */}
                  <div className="timeline-card-body">
                    <h4
                      className="timeline-item-title"
                      style={{
                        textDecoration: isCompleted ? 'line-through' : 'none',
                        color: isCompleted ? 'var(--text-muted)' : 'var(--text-primary)',
                      }}
                    >
                      {item.title}
                    </h4>

                    {item.description && (
                      <p className="timeline-item-desc">{item.description}</p>
                    )}
                  </div>

                  {/* Card Footer: Metadata Chips */}
                  <div className="timeline-card-footer">
                    <div className="timeline-tags-group">
                      {/* Category Chip */}
                      <span
                        className="timeline-meta-chip category"
                        style={{
                          backgroundColor: `${category.color}15`,
                          color: category.color,
                          borderColor: `${category.color}40`,
                        }}
                      >
                        <span
                          className="chip-dot"
                          style={{ backgroundColor: category.color }}
                        />
                        {category.name}
                      </span>

                      {/* Priority Chip */}
                      {!isEvent && item.priority && (
                        <PriorityBadge priority={item.priority} size="sm" />
                      )}

                      {/* Associated Goal */}
                      {linkedGoal && (
                        <span
                          className="timeline-meta-chip goal"
                          title={`Associated Goal: ${linkedGoal.title}`}
                        >
                          <Target size={10} color="var(--primary-color)" />
                          <span className="goal-title-truncate">{linkedGoal.title}</span>
                        </span>
                      )}

                      {/* Event Location */}
                      {isEvent && item.location && (
                        <span className="timeline-meta-chip location" title={`Location: ${item.location}`}>
                          <MapPin size={10} />
                          {item.location}
                        </span>
                      )}
                    </div>

                    {!readOnly && (
                      <div className="timeline-action-buttons" onClick={(e) => e.stopPropagation()}>
                        <button
                          type="button"
                          className="btn-icon"
                          style={{ width: '22px', height: '22px' }}
                          onClick={() => (isEvent ? openModal('event', item) : openModal('task', item))}
                          title="Edit"
                        >
                          <Edit2 size={12} />
                        </button>
                        <button
                          type="button"
                          className="btn-icon"
                          style={{ width: '22px', height: '22px', color: 'var(--danger)' }}
                          onClick={() => (isEvent ? deleteEvent(item.id) : deleteTask(item.id))}
                          title="Delete"
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
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
                    delay: idx * 0.14, // 1st one, then 2nd, then 3rd in sequence!
                    ease: [0.16, 1, 0.3, 1],
                  }}
                  className={`timeline-item-wrapper ${isCompleted ? 'is-completed' : ''} ${
                    isOverdue ? 'is-overdue' : ''
                  }`}
                >
                  {itemContent}
                </motion.div>
              );
            }

            return (
              <div
                key={item.id || `timeline-item-${idx}`}
                className={`timeline-item-wrapper ${isCompleted ? 'is-completed' : ''} ${
                  isOverdue ? 'is-overdue' : ''
                }`}
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
