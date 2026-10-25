import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Check, Plus } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { formatTime, formatDate, getTodayDateString } from '../../utils/dateUtils';
import { getEffectiveStatus } from '../../utils/taskUtils';

const HOUR_HEIGHT = 68; // Height in pixels for each hour slot
const HOURS = Array.from({ length: 24 }, (_, i) => i);

export function DayGoogleCalendar({
  selectedDate = getTodayDateString(),
  tasks = [],
  categories = [],
  events = [],
}) {
  const { updateTask, updateEvent, toggleTaskComplete, openModal, showToast, settings } = useApp();
  const is12Hour = settings?.timeFormat !== '24h';
  const scrollRef = useRef(null);

  const [draggingTaskId, setDraggingTaskId] = useState(null);
  const [dragOverSlot, setDragOverSlot] = useState(null); // { hour: number, minute: number }
  const [resizingItem, setResizingItem] = useState(null); // { id, isEvent, startMins, initialDuration, currentDurationMins }
  const [currentTimeMinutes, setCurrentTimeMinutes] = useState(() => {
    const d = new Date();
    return d.getHours() * 60 + d.getMinutes();
  });

  const todayStr = getTodayDateString();
  const isToday = selectedDate === todayStr;

  // Live timer for current red line
  useEffect(() => {
    const timer = setInterval(() => {
      const d = new Date();
      setCurrentTimeMinutes(d.getHours() * 60 + d.getMinutes());
    }, 30000); // update every 30s
    return () => clearInterval(timer);
  }, []);

  // Filter items for selected day
  const dayTasks = useMemo(
    () => tasks.filter((t) => t.date === selectedDate),
    [tasks, selectedDate]
  );

  const dayEvents = useMemo(
    () => events.filter((e) => e.date === selectedDate),
    [events, selectedDate]
  );

  // Separate all-day tasks from timed tasks
  const { timedTasks, allDayTasks } = useMemo(() => {
    const timed = [];
    const allDay = [];

    dayTasks.forEach((t) => {
      if (t.startTime && t.startTime.includes(':')) {
        const [sh, sm] = t.startTime.split(':').map(Number);
        let [eh, em] = t.endTime && t.endTime.includes(':') ? t.endTime.split(':').map(Number) : [sh + 1, sm];
        let startMins = sh * 60 + sm;
        let endMins = eh * 60 + em;
        if (endMins <= startMins) endMins = startMins + 60; // minimum 1h fallback

        timed.push({
          ...t,
          isEvent: false,
          startMins,
          endMins,
          durationMins: Math.max(30, endMins - startMins),
        });
      } else {
        allDay.push({ ...t, isEvent: false });
      }
    });

    dayEvents.forEach((e) => {
      if (e.startTime && e.startTime.includes(':')) {
        const [sh, sm] = e.startTime.split(':').map(Number);
        let [eh, em] = e.endTime && e.endTime.includes(':') ? e.endTime.split(':').map(Number) : [sh + 1, sm];
        let startMins = sh * 60 + sm;
        let endMins = eh * 60 + em;
        if (endMins <= startMins) endMins = startMins + 60;

        timed.push({
          ...e,
          isEvent: true,
          startMins,
          endMins,
          durationMins: Math.max(30, endMins - startMins),
        });
      } else {
        allDay.push({ ...e, isEvent: true });
      }
    });

    // Overlapping column layout algorithm
    timed.sort((a, b) => a.startMins - b.startMins || b.durationMins - a.durationMins);

    // Compute overlapping clusters
    for (let i = 0; i < timed.length; i++) {
      const itemA = timed[i];
      let overlapGroup = [itemA];

      for (let j = 0; j < timed.length; j++) {
        if (i === j) continue;
        const itemB = timed[j];
        if (itemA.startMins < itemB.endMins && itemA.endMins > itemB.startMins) {
          overlapGroup.push(itemB);
        }
      }

      const totalCols = Math.max(1, overlapGroup.length);
      const colIndex = overlapGroup.indexOf(itemA);

      itemA.colIndex = colIndex;
      itemA.totalCols = totalCols;
    }

    return { timedTasks: timed, allDayTasks: allDay };
  }, [dayTasks, dayEvents]);

  // Auto-scroll on mount to earliest task or current time / 7:30 AM
  useEffect(() => {
    if (scrollRef.current) {
      let scrollTargetMins = 450; // default 7:30 AM (450 mins)
      if (timedTasks.length > 0) {
        scrollTargetMins = Math.max(0, timedTasks[0].startMins - 60);
      } else if (isToday) {
        scrollTargetMins = Math.max(0, currentTimeMinutes - 60);
      }
      const scrollPos = (scrollTargetMins / 60) * HOUR_HEIGHT;
      scrollRef.current.scrollTop = scrollPos;
    }
  }, [selectedDate, timedTasks.length, isToday, currentTimeMinutes]);

  // Drag and Drop Handlers
  const handleDragStart = (e, task) => {
    e.dataTransfer.setData('text/plain', task.id);
    e.dataTransfer.effectAllowed = 'move';
    setDraggingTaskId(task.id);
  };

  const handleDragEnd = () => {
    setDraggingTaskId(null);
    setDragOverSlot(null);
  };

  const handleDragOver = (e, hour, minute) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (!dragOverSlot || dragOverSlot.hour !== hour || dragOverSlot.minute !== minute) {
      setDragOverSlot({ hour, minute });
    }
  };

  const handleDrop = (e, hour, minute) => {
    e.preventDefault();
    const taskId = e.dataTransfer.getData('text/plain') || draggingTaskId;
    if (!taskId) return;

    const task = tasks.find((t) => t.id === taskId);
    if (!task) return;

    // Calculate original duration in minutes
    let origDuration = 60;
    if (task.startTime && task.endTime) {
      const [sh, sm] = task.startTime.split(':').map(Number);
      const [eh, em] = task.endTime.split(':').map(Number);
      const diff = (eh * 60 + em) - (sh * 60 + sm);
      if (diff > 0) origDuration = diff;
    }

    const newStartMins = hour * 60 + minute;
    const newEndMins = newStartMins + origDuration;

    const newStartH = String(Math.floor(newStartMins / 60) % 24).padStart(2, '0');
    const newStartM = String(newStartMins % 60).padStart(2, '0');
    const newEndH = String(Math.floor(newEndMins / 60) % 24).padStart(2, '0');
    const newEndM = String(newEndMins % 60).padStart(2, '0');

    const newStartTime = `${newStartH}:${newStartM}`;
    const newEndTime = `${newEndH}:${newEndM}`;

    updateTask(task.id, {
      startTime: newStartTime,
      endTime: newEndTime,
      date: selectedDate,
    });

    showToast({
      type: 'success',
      title: 'Task Rescheduled',
      message: `"${task.title}" rescheduled to ${formatTime(newStartTime, is12Hour)} – ${formatTime(newEndTime, is12Hour)}`,
    });

    setDraggingTaskId(null);
    setDragOverSlot(null);
  };

  // Resize duration handlers (drag to increase/decrease duration)
  const handleResizeStart = (e, item) => {
    e.preventDefault();
    e.stopPropagation();

    const startY = e.clientY;
    const initialDuration = item.durationMins || 60;

    const onMouseMove = (moveEvent) => {
      const deltaY = moveEvent.clientY - startY;
      const deltaMins = Math.round(((deltaY / HOUR_HEIGHT) * 60) / 15) * 15;
      const newDuration = Math.max(15, Math.min(1440 - item.startMins, initialDuration + deltaMins));

      setResizingItem({
        id: item.id,
        isEvent: item.isEvent,
        startMins: item.startMins,
        initialDuration,
        currentDurationMins: newDuration,
      });
    };

    const onMouseUp = (upEvent) => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);

      const deltaY = upEvent.clientY - startY;
      const deltaMins = Math.round(((deltaY / HOUR_HEIGHT) * 60) / 15) * 15;
      const finalDuration = Math.max(15, Math.min(1440 - item.startMins, initialDuration + deltaMins));

      const newEndMins = item.startMins + finalDuration;
      const newEndH = String(Math.floor(newEndMins / 60) % 24).padStart(2, '0');
      const newEndM = String(newEndMins % 60).padStart(2, '0');
      const newEndTime = `${newEndH}:${newEndM}`;

      if (item.isEvent) {
        updateEvent(item.id, { endTime: newEndTime });
      } else {
        updateTask(item.id, { endTime: newEndTime });
      }

      showToast({
        type: 'info',
        title: 'Duration Updated',
        message: `"${item.title}" duration set to ${finalDuration} min (${formatTime(
          item.startTime,
          is12Hour
        )} – ${formatTime(newEndTime, is12Hour)})`,
      });

      setResizingItem(null);
    };

    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
  };

  const nowTopPosition = (currentTimeMinutes / 60) * HOUR_HEIGHT;

  // Format time label for hour axis
  const getHourLabel = (hour) => {
    if (hour === 0) return '12 AM';
    if (hour < 12) return `${hour} AM`;
    if (hour === 12) return '12 PM';
    return `${hour - 12} PM`;
  };

  return (
    <div className="gcal-day-container">
      {/* 1. Google Calendar Header Bar (Timezone & Date Column Header) */}
      <div className="gcal-day-header-bar">
        {/* Timezone cell on left axis */}
        <div className="gcal-timezone-cell">
          GMT+05:30
        </div>

        {/* Date header with day of week & date badge */}
        <div className="gcal-date-column-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div
              style={{
                width: '46px',
                height: '46px',
                borderRadius: '50%',
                background: isToday ? '#1769FF' : '#F1F5F9',
                color: isToday ? '#FFFFFF' : '#1E293B',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: isToday ? '0 4px 10px rgba(23, 105, 255, 0.3)' : 'none',
              }}
            >
              <span style={{ fontSize: '0.66rem', fontWeight: 700, textTransform: 'uppercase', lineHeight: 1 }}>
                {formatDate(selectedDate, { weekday: 'short' })}
              </span>
              <span style={{ fontSize: '1.25rem', fontWeight: 800, lineHeight: 1, marginTop: '2px' }}>
                {selectedDate.split('-')[2]}
              </span>
            </div>

            <div>
              <h2 style={{ fontSize: '1.15rem', fontWeight: 800, margin: 0, color: 'var(--text-primary)' }}>
                {formatDate(selectedDate, { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
              </h2>
              <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                {timedTasks.length + allDayTasks.length} scheduled items • Drag tasks to reschedule time slots
              </span>
            </div>
          </div>

          <button
            type="button"
            className="btn btn-primary btn-sm"
            onClick={() => openModal('task', { date: selectedDate })}
          >
            <Plus size={15} /> Add Task
          </button>
        </div>
      </div>

      {/* 2. All-Day Row (if any all-day items exist) */}
      {allDayTasks.length > 0 && (
        <div
          style={{
            display: 'flex',
            borderBottom: '1px solid var(--border-color)',
            background: '#F8FAFC',
            padding: '8px 12px 8px 72px',
            gap: '8px',
            flexWrap: 'wrap',
          }}
        >
          <span style={{ fontSize: '0.74rem', fontWeight: 700, color: 'var(--text-muted)', alignSelf: 'center' }}>
            All-day:
          </span>
          {allDayTasks.map((item) => (
            <div
              key={item.id}
              onClick={() => (item.isEvent ? openModal('event', item) : openModal('task', item))}
              style={{
                padding: '4px 12px',
                borderRadius: '4px',
                background: item.isEvent ? '#8B5CF6' : '#10B981',
                color: '#FFFFFF',
                fontSize: '0.78rem',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
              }}
            >
              <span>{item.title}</span>
            </div>
          ))}
        </div>
      )}

      {/* 3. Main Hourly Grid Canvas */}
      <div className="gcal-day-scroll-canvas" ref={scrollRef}>
        {/* Time Axis Column */}
        <div className="gcal-time-axis">
          {HOURS.map((hour) => (
            <div key={`hour-label-${hour}`} className="gcal-time-axis-hour">
              <span>{getHourLabel(hour)}</span>
            </div>
          ))}
        </div>

        {/* Day Grid Canvas with Drop Target Slots */}
        <div className="gcal-grid-canvas">
          {/* Red Current Time Line Indicator (Google Calendar Style) */}
          {isToday && (
            <div
              className="gcal-now-line"
              style={{ top: `${nowTopPosition}px` }}
              title={`Current time: ${formatTime(
                `${String(Math.floor(currentTimeMinutes / 60)).padStart(2, '0')}:${String(
                  currentTimeMinutes % 60
                ).padStart(2, '0')}`,
                is12Hour
              )}`}
            >
              <div className="gcal-now-circle" />
            </div>
          )}

          {/* 24 Hour Rows (each has :00 and :30 drop zones) */}
          {HOURS.map((hour) => {
            const isHoveredTop = dragOverSlot?.hour === hour && dragOverSlot?.minute === 0;
            const isHoveredBottom = dragOverSlot?.hour === hour && dragOverSlot?.minute === 30;

            return (
              <div key={`hour-row-${hour}`} className="gcal-hour-row">
                {/* Half-Hour Dashed Divider */}
                <div className="gcal-half-hour-line" />

                {/* Top Slot (:00) Drop Zone */}
                <div
                  className={`gcal-slot-drop-zone ${isHoveredTop ? 'drag-over' : ''}`}
                  onDragOver={(e) => handleDragOver(e, hour, 0)}
                  onDrop={(e) => handleDrop(e, hour, 0)}
                  onClick={() =>
                    openModal('task', {
                      date: selectedDate,
                      startTime: `${String(hour).padStart(2, '0')}:00`,
                      endTime: `${String((hour + 1) % 24).padStart(2, '0')}:00`,
                    })
                  }
                  title={`Click to schedule task at ${getHourLabel(hour)}`}
                />

                {/* Bottom Slot (:30) Drop Zone */}
                <div
                  className={`gcal-slot-drop-zone ${isHoveredBottom ? 'drag-over' : ''}`}
                  onDragOver={(e) => handleDragOver(e, hour, 30)}
                  onDrop={(e) => handleDrop(e, hour, 30)}
                  onClick={() =>
                    openModal('task', {
                      date: selectedDate,
                      startTime: `${String(hour).padStart(2, '0')}:30`,
                      endTime: `${String((hour + 1) % 24).padStart(2, '0')}:30`,
                    })
                  }
                  title={`Click to schedule task at ${hour % 12 || 12}:30 ${hour >= 12 ? 'PM' : 'AM'}`}
                />
              </div>
            );
          })}

          {/* Render Timed Task & Event Blocks (Google Calendar Style) */}
          {timedTasks.map((item) => {
            const isEvent = !!item.isEvent;
            const category = categories.find((c) => c.id === item.categoryId) || {
              color: isEvent ? '#8B5CF6' : '#2563EB',
              name: isEvent ? 'Event' : 'General',
            };

            const effectiveStatus = isEvent ? 'scheduled' : getEffectiveStatus(item);
            const isCompleted = !isEvent && effectiveStatus === 'completed';
            const isOverdue = !isEvent && effectiveStatus === 'overdue';

            const isBeingResized = resizingItem?.id === item.id;
            const activeDuration = isBeingResized
              ? resizingItem.currentDurationMins
              : item.durationMins;

            const topPos = (item.startMins / 60) * HOUR_HEIGHT;
            const blockHeight = Math.max(30, (activeDuration / 60) * HOUR_HEIGHT - 3);

            // Column width & left offset for overlapping items
            const widthPct = item.totalCols > 1 ? 100 / item.totalCols - 1.2 : 98;
            const leftPct = item.totalCols > 1 ? item.colIndex * (100 / item.totalCols) + 0.6 : 1;

            const timeDisplay = `${formatTime(item.startTime, is12Hour)} – ${formatTime(
              item.endTime,
              is12Hour
            )}`;

            const isDragging = draggingTaskId === item.id;
            // Google Calendar vibrant solid color palette
            const baseColor = isCompleted
              ? '#059669' // rich emerald
              : isOverdue
              ? '#DC2626' // vibrant red
              : isEvent
              ? '#7C3AED' // vibrant purple
              : category.color || '#1A73E8'; // vibrant category or Google blue

            return (
              <div
                key={item.id}
                draggable={!isBeingResized && !isEvent}
                onDragStart={(e) => handleDragStart(e, item)}
                onDragEnd={handleDragEnd}
                onClick={() => (isEvent ? openModal('event', item) : openModal('task', item))}
                className={`gcal-task-block ${isDragging ? 'is-dragging' : ''} ${
                  isBeingResized ? 'is-resizing' : ''
                }`}
                style={{
                  top: `${topPos}px`,
                  height: `${blockHeight}px`,
                  left: `${leftPct}%`,
                  width: `${widthPct}%`,
                  backgroundColor: baseColor,
                  border: '1px solid rgba(255, 255, 255, 0.18)',
                  borderLeft: '4px solid rgba(0, 0, 0, 0.28)',
                  color: '#FFFFFF',
                  boxShadow: isCompleted
                    ? '0 1px 3px rgba(5, 150, 105, 0.3)'
                    : '0 2px 6px rgba(0, 0, 0, 0.15)',
                }}
                title={`Drag to reschedule • Drag bottom handle to resize • Click to edit "${item.title}"`}
              >
                {/* Line 1: Checkbox + Full Width Title */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '5px', minWidth: 0, width: '100%' }}>
                  {!isEvent && (
                    <button
                      type="button"
                      className={`gcal-card-check ${isCompleted ? 'checked' : ''}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleTaskComplete(item.id);
                      }}
                      title={isCompleted ? 'Mark incomplete' : 'Mark complete'}
                    >
                      {isCompleted && <Check size={10} strokeWidth={3.5} color="#FFFFFF" />}
                    </button>
                  )}

                  <span
                    style={{
                      fontWeight: 700,
                      fontSize: '0.82rem',
                      color: '#FFFFFF',
                      lineHeight: 1.25,
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      flex: 1,
                      minWidth: 0,
                      textDecoration: isCompleted ? 'line-through' : 'none',
                      opacity: isCompleted ? 0.85 : 1,
                    }}
                  >
                    {item.title}
                  </span>
                </div>

                {/* Line 2: Time Range Display */}
                <div
                  style={{
                    fontSize: '0.72rem',
                    fontWeight: 600,
                    color: 'rgba(255, 255, 255, 0.92)',
                    marginTop: '2px',
                    lineHeight: 1.2,
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                  }}
                >
                  {timeDisplay}
                </div>

                {/* Line 3: Category & Priority Badges */}
                {blockHeight >= 56 && (
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                      marginTop: '4px',
                      flexWrap: 'wrap',
                      overflow: 'hidden',
                    }}
                  >
                    {category.name && (
                      <span
                        style={{
                          fontSize: '0.66rem',
                          fontWeight: 700,
                          color: '#FFFFFF',
                          background: 'rgba(255, 255, 255, 0.24)',
                          padding: '1px 5px',
                          borderRadius: '3px',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {category.name}
                      </span>
                    )}

                    {!isEvent && item.priority && (
                      <span
                        style={{
                          fontSize: '0.66rem',
                          fontWeight: 700,
                          color: '#FFFFFF',
                          background: 'rgba(255, 255, 255, 0.2)',
                          padding: '1px 5px',
                          borderRadius: '3px',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {item.priority}
                      </span>
                    )}
                  </div>
                )}

                {/* Bottom Resize Handle: Drag to Increase/Decrease Task Duration */}
                <div
                  className="gcal-resize-handle"
                  onMouseDown={(e) => handleResizeStart(e, item)}
                  title="Drag down to increase task duration, up to shorten"
                >
                  <div className="gcal-resize-bar" />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
