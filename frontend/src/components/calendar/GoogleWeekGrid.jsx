import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Check } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { formatTime, formatDate, getTodayDateString } from '../../utils/dateUtils';
import { getEffectiveStatus } from '../../utils/taskUtils';

const HOUR_HEIGHT = 68; // Height in pixels for each hour slot
const HOURS = Array.from({ length: 24 }, (_, i) => i);

// Helper to compute user's timezone formatted as GMT+XX:YY
const getTimezoneString = () => {
  try {
    const offset = -new Date().getTimezoneOffset();
    const sign = offset >= 0 ? '+' : '-';
    const hours = String(Math.floor(Math.abs(offset) / 60)).padStart(2, '0');
    const mins = String(Math.abs(offset) % 60).padStart(2, '0');
    return `GMT${sign}${hours}:${mins}`;
  } catch {
    return 'GMT+05:30';
  }
};

export function GoogleWeekGrid({
  weekDays = [],
  selectedDate,
  onSelectDate,
  onOpenDayDetail,
}) {
  const {
    tasks,
    events,
    categories,
    updateTask,
    updateEvent,
    toggleTaskComplete,
    openModal,
    showToast,
    settings,
  } = useApp();

  const is12Hour = settings?.timeFormat !== '24h';
  const scrollRef = useRef(null);
  const timezoneStr = useMemo(() => getTimezoneString(), []);
  const todayStr = getTodayDateString();

  // Drag and drop states
  const [draggingTaskId, setDraggingTaskId] = useState(null);
  const [dragOverSlot, setDragOverSlot] = useState(null); // { dateStr, hour, minute }

  // Resize duration state: { itemId, isEvent, startMins, initialDurationMins, currentDurationMins }
  const [resizingItem, setResizingItem] = useState(null);

  // Live timer for current red line
  const [currentTimeMinutes, setCurrentTimeMinutes] = useState(() => {
    const d = new Date();
    return d.getHours() * 60 + d.getMinutes();
  });

  useEffect(() => {
    const timer = setInterval(() => {
      const d = new Date();
      setCurrentTimeMinutes(d.getHours() * 60 + d.getMinutes());
    }, 30000);
    return () => clearInterval(timer);
  }, []);

  // Compute items by day for the 7 days
  const itemsByDay = useMemo(() => {
    const map = {};

    weekDays.forEach((day) => {
      const dayDate = day.dateStr;
      const dayTasks = tasks.filter((t) => t.date === dayDate);
      const dayEvents = events.filter((e) => e.date === dayDate);

      const timed = [];
      const allDay = [];

      dayTasks.forEach((t) => {
        if (t.startTime && t.startTime.includes(':')) {
          const [sh, sm] = t.startTime.split(':').map(Number);
          let [eh, em] =
            t.endTime && t.endTime.includes(':') ? t.endTime.split(':').map(Number) : [sh + 1, sm];
          let startMins = sh * 60 + sm;
          let endMins = eh * 60 + em;
          if (endMins <= startMins) endMins = startMins + 60;

          timed.push({
            ...t,
            isEvent: false,
            startMins,
            endMins,
            durationMins: Math.max(20, endMins - startMins),
          });
        } else {
          allDay.push({ ...t, isEvent: false });
        }
      });

      dayEvents.forEach((e) => {
        if (e.startTime && e.startTime.includes(':')) {
          const [sh, sm] = e.startTime.split(':').map(Number);
          let [eh, em] =
            e.endTime && e.endTime.includes(':') ? e.endTime.split(':').map(Number) : [sh + 1, sm];
          let startMins = sh * 60 + sm;
          let endMins = eh * 60 + em;
          if (endMins <= startMins) endMins = startMins + 60;

          timed.push({
            ...e,
            isEvent: true,
            startMins,
            endMins,
            durationMins: Math.max(20, endMins - startMins),
          });
        } else {
          allDay.push({ ...e, isEvent: true });
        }
      });

      // Sort timed items by start time
      timed.sort((a, b) => a.startMins - b.startMins || b.durationMins - a.durationMins);

      // Multi-column overlapping calculation
      for (let i = 0; i < timed.length; i++) {
        const itemA = timed[i];
        const overlapGroup = [itemA];

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

      map[dayDate] = { timed, allDay };
    });

    return map;
  }, [weekDays, tasks, events]);

  // Initial scroll to 7:00 AM or earliest item
  useEffect(() => {
    if (scrollRef.current) {
      let scrollTargetMins = 420; // 7:00 AM
      // Check if today has earlier items
      const todayData = itemsByDay[todayStr];
      if (todayData && todayData.timed.length > 0) {
        scrollTargetMins = Math.max(0, todayData.timed[0].startMins - 60);
      }
      scrollRef.current.scrollTop = (scrollTargetMins / 60) * HOUR_HEIGHT;
    }
  }, [todayStr]);

  // Drag and Drop handlers
  const handleDragStart = (e, item) => {
    e.dataTransfer.setData(
      'text/plain',
      JSON.stringify({ id: item.id, isEvent: item.isEvent, date: item.date })
    );
    e.dataTransfer.effectAllowed = 'move';
    setDraggingTaskId(item.id);
  };

  const handleDragEnd = () => {
    setDraggingTaskId(null);
    setDragOverSlot(null);
  };

  const handleDragOver = (e, dateStr, hour, minute) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (
      !dragOverSlot ||
      dragOverSlot.dateStr !== dateStr ||
      dragOverSlot.hour !== hour ||
      dragOverSlot.minute !== minute
    ) {
      setDragOverSlot({ dateStr, hour, minute });
    }
  };

  const handleDrop = (e, targetDateStr, hour, minute) => {
    e.preventDefault();
    let data;
    try {
      data = JSON.parse(e.dataTransfer.getData('text/plain'));
    } catch {
      data = { id: draggingTaskId, isEvent: false };
    }

    if (!data?.id) return;

    const item = data.isEvent
      ? events.find((ev) => ev.id === data.id)
      : tasks.find((t) => t.id === data.id);

    if (!item) return;

    // Calculate existing duration in minutes
    let origDuration = 60;
    if (item.startTime && item.endTime) {
      const [sh, sm] = item.startTime.split(':').map(Number);
      const [eh, em] = item.endTime.split(':').map(Number);
      const diff = eh * 60 + em - (sh * 60 + sm);
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

    if (data.isEvent) {
      updateEvent(item.id, {
        date: targetDateStr,
        startTime: newStartTime,
        endTime: newEndTime,
      });
    } else {
      updateTask(item.id, {
        date: targetDateStr,
        startTime: newStartTime,
        endTime: newEndTime,
      });
    }

    showToast({
      type: 'success',
      title: 'Rescheduled Successfully',
      message: `"${item.title}" moved to ${formatDate(targetDateStr, {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
      })} at ${formatTime(newStartTime, is12Hour)} – ${formatTime(newEndTime, is12Hour)}`,
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
      // Convert pixels to minutes, snap to 15-minute intervals
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

  const getHourLabel = (hour) => {
    if (hour === 0) return '12 AM';
    if (hour < 12) return `${hour} AM`;
    if (hour === 12) return '12 PM';
    return `${hour - 12} PM`;
  };

  const nowTopPosition = (currentTimeMinutes / 60) * HOUR_HEIGHT;

  // Check if any day has all-day items
  const hasAnyAllDay = weekDays.some((d) => (itemsByDay[d.dateStr]?.allDay.length || 0) > 0);

  return (
    <div className="gcal-week-container">
      {/* 1. Week View Header: Timezone + 7 Day Headers */}
      <div className="gcal-week-header-row">
        {/* Left top timezone cell */}
        <div className="gcal-week-tz-cell">
          <span style={{ fontSize: '0.74rem', fontWeight: 700, color: 'var(--text-secondary)' }}>
            {timezoneStr}
          </span>
        </div>

        {/* 7 Day Column Headers */}
        <div className="gcal-week-days-grid-header">
          {weekDays.map((day) => {
            const isToday = day.dateStr === todayStr;
            const isSelected = day.dateStr === selectedDate;
            const dayItems = itemsByDay[day.dateStr];
            const count = (dayItems?.timed.length || 0) + (dayItems?.allDay.length || 0);

            return (
              <div
                key={day.dateStr}
                className={`gcal-week-day-header-cell ${isToday ? 'is-today' : ''} ${
                  isSelected ? 'is-selected' : ''
                }`}
                onClick={() => {
                  onSelectDate(day.dateStr);
                  if (onOpenDayDetail) onOpenDayDetail(day.dateStr);
                }}
                title={`Click to view schedule details for ${day.dayName}, ${day.dateStr}`}
              >
                <span className="gcal-day-name-label">{day.dayName.toUpperCase()}</span>

                {/* Date Number Pill (Blue Circle if Today like Google Calendar) */}
                <div className={`gcal-day-num-circle ${isToday ? 'is-today-circle' : ''}`}>
                  {day.dayNumber}
                </div>

                {count > 0 && (
                  <span className="gcal-day-count-badge">
                    {count} {count === 1 ? 'item' : 'items'}
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* 2. All-Day Strip (if any day has all-day items) */}
      {hasAnyAllDay && (
        <div className="gcal-all-day-row">
          <div className="gcal-all-day-label-cell">All-day</div>
          <div className="gcal-all-day-grid-columns">
            {weekDays.map((day) => {
              const allDayItems = itemsByDay[day.dateStr]?.allDay || [];
              return (
                <div key={`allday-${day.dateStr}`} className="gcal-all-day-cell">
                  {allDayItems.map((item) => (
                    <div
                      key={item.id}
                      onClick={() =>
                        item.isEvent ? openModal('event', item) : openModal('task', item)
                      }
                      className="gcal-all-day-pill"
                      style={{
                        background: item.isEvent ? '#8B5CF6' : '#10B981',
                      }}
                      title={`${item.title} (All day)`}
                    >
                      <span>{item.title}</span>
                    </div>
                  ))}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 3. 24-Hour Multi-Column Time Grid Canvas */}
      <div className="gcal-week-scroll-canvas" ref={scrollRef}>
        {/* Left Time Axis */}
        <div className="gcal-time-axis">
          {HOURS.map((hour) => (
            <div key={`hour-axis-${hour}`} className="gcal-time-axis-hour">
              <span>{getHourLabel(hour)}</span>
            </div>
          ))}
        </div>

        {/* 7 Columns Grid */}
        <div className="gcal-week-grid-canvas">
          {/* Render 7 Day Columns */}
          {weekDays.map((day) => {
            const isToday = day.dateStr === todayStr;
            const dayData = itemsByDay[day.dateStr] || { timed: [], allDay: [] };

            return (
              <div key={`col-${day.dateStr}`} className={`gcal-week-day-column ${isToday ? 'is-today-column' : ''}`}>
                {/* Red Current Time Line across Today's Column */}
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

                {/* 24 Hour Rows for this column */}
                {HOURS.map((hour) => {
                  const isHoveredTop =
                    dragOverSlot?.dateStr === day.dateStr &&
                    dragOverSlot?.hour === hour &&
                    dragOverSlot?.minute === 0;

                  const isHoveredBottom =
                    dragOverSlot?.dateStr === day.dateStr &&
                    dragOverSlot?.hour === hour &&
                    dragOverSlot?.minute === 30;

                  return (
                    <div key={`hour-${day.dateStr}-${hour}`} className="gcal-hour-row">
                      {/* 30-min dashed line */}
                      <div className="gcal-half-hour-line" />

                      {/* Top slot (:00) drop zone */}
                      <div
                        className={`gcal-slot-drop-zone ${isHoveredTop ? 'drag-over' : ''}`}
                        onDragOver={(e) => handleDragOver(e, day.dateStr, hour, 0)}
                        onDrop={(e) => handleDrop(e, day.dateStr, hour, 0)}
                        onClick={() =>
                          openModal('task', {
                            date: day.dateStr,
                            startTime: `${String(hour).padStart(2, '0')}:00`,
                            endTime: `${String((hour + 1) % 24).padStart(2, '0')}:00`,
                          })
                        }
                        title={`Click to schedule task at ${day.dayName} ${getHourLabel(hour)}`}
                      />

                      {/* Bottom slot (:30) drop zone */}
                      <div
                        className={`gcal-slot-drop-zone ${isHoveredBottom ? 'drag-over' : ''}`}
                        onDragOver={(e) => handleDragOver(e, day.dateStr, hour, 30)}
                        onDrop={(e) => handleDrop(e, day.dateStr, hour, 30)}
                        onClick={() =>
                          openModal('task', {
                            date: day.dateStr,
                            startTime: `${String(hour).padStart(2, '0')}:30`,
                            endTime: `${String((hour + 1) % 24).padStart(2, '0')}:30`,
                          })
                        }
                        title={`Click to schedule task at ${day.dayName} ${hour % 12 || 12}:30 ${
                          hour >= 12 ? 'PM' : 'AM'
                        }`}
                      />
                    </div>
                  );
                })}

                {/* Render Timed Task & Event Cards in this day column (Google Calendar Solid Style) */}
                {dayData.timed.map((item) => {
                  const isEvent = !!item.isEvent;
                  const category = categories.find((c) => c.id === item.categoryId) || {
                    color: isEvent ? '#7C3AED' : '#1A73E8',
                    name: isEvent ? 'Event' : 'General',
                  };

                  const effectiveStatus = isEvent ? 'scheduled' : getEffectiveStatus(item);
                  const isCompleted = !isEvent && effectiveStatus === 'completed';
                  const isOverdue = !isEvent && effectiveStatus === 'overdue';

                  // Dynamic duration if actively resizing this item
                  const isBeingResized = resizingItem?.id === item.id;
                  const activeDuration = isBeingResized
                    ? resizingItem.currentDurationMins
                    : item.durationMins;

                  const topPos = (item.startMins / 60) * HOUR_HEIGHT;
                  const blockHeight = Math.max(26, (activeDuration / 60) * HOUR_HEIGHT - 3);

                  // Calculate column width & left offset for overlapping items
                  const widthPct = item.totalCols > 1 ? 100 / item.totalCols - 1.5 : 98;
                  const leftPct =
                    item.totalCols > 1 ? item.colIndex * (100 / item.totalCols) + 0.6 : 1;

                  const isDragging = draggingTaskId === item.id;

                  // Google Calendar vibrant solid color palette
                  const baseColor = isCompleted
                    ? '#059669' // rich emerald
                    : isOverdue
                    ? '#DC2626' // vibrant red
                    : isEvent
                    ? '#7C3AED' // vibrant purple
                    : category.color || '#1A73E8'; // vibrant category or Google blue

                  const timeDisplay = `${formatTime(item.startTime, is12Hour)} – ${formatTime(
                    item.endTime,
                    is12Hour
                  )}`;

                  return (
                    <div
                      key={item.id}
                      draggable={!isBeingResized}
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
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '5px',
                          minWidth: 0,
                          width: '100%',
                        }}
                      >
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
                            fontSize: '0.8rem',
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

                      {/* Line 2: Time Range Display (Dedicated line so title is never cut off!) */}
                      <div
                        style={{
                          fontSize: '0.71rem',
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

                      {/* Line 3: Category & Priority Badges (shown if card height >= 56px) */}
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
                                fontSize: '0.65rem',
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
                                fontSize: '0.65rem',
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
            );
          })}
        </div>
      </div>
    </div>
  );
}
