import React, { useState, useEffect } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Plus,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import {
  getTodayDateString,
  formatDate,
  formatMonthYear,
  getMonthCalendarGrid,
  getWeekDaysGrid,
} from '../utils/dateUtils';
import { GoogleWeekGrid } from '../components/calendar/GoogleWeekGrid';
import { DayGoogleCalendar } from '../components/tasks/DayGoogleCalendar';
import { DayDetailModal } from '../components/calendar/DayDetailModal';
import { CustomSelect } from '../components/common/CustomSelect';

// Helper to shift a date by N days
const shiftDate = (dateStr, days) => {
  const d = new Date(dateStr + 'T00:00:00');
  d.setDate(d.getDate() + days);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return {
    dateStr: `${year}-${month}-${day}`,
    year: d.getFullYear(),
    month: d.getMonth(),
  };
};

export function CalendarPage() {
  const {
    tasks,
    events,
    categories,
    openModal,
    settings,
    selectedDate,
    setSelectedDate,
  } = useApp();

  const [currentYear, setCurrentYear] = useState(() => new Date().getFullYear());
  const [currentMonth, setCurrentMonth] = useState(() => new Date().getMonth());
  const [viewMode, setViewMode] = useState('week'); // Default to 'week' (Google Calendar view)
  const [itemTypeFilter, setItemTypeFilter] = useState('all'); // 'all', 'events', 'tasks'
  const [selectedCategoryId, setSelectedCategoryId] = useState('all');

  // Synchronize month and year view with global selectedDate
  useEffect(() => {
    if (selectedDate) {
      const parts = selectedDate.split('-').map(Number);
      if (parts.length >= 2 && !isNaN(parts[0]) && !isNaN(parts[1])) {
        setCurrentYear(parts[0]);
        setCurrentMonth(parts[1] - 1);
      }
    }
  }, [selectedDate]);

  // Activate full-page edge-to-edge mode (removes page-container padding and card wrapper)
  useEffect(() => {
    document.body.classList.add('calendar-fullpage-active');
    return () => {
      document.body.classList.remove('calendar-fullpage-active');
    };
  }, []);

  // Modal state when a user clicks on a day in Month or Week view
  const [dayDetailModalDate, setDayDetailModalDate] = useState(null);

  // Smart previous navigation
  const handlePrev = () => {
    if (viewMode === 'month') {
      if (currentMonth === 0) {
        setCurrentMonth(11);
        setCurrentYear((y) => y - 1);
      } else {
        setCurrentMonth((m) => m - 1);
      }
    } else if (viewMode === 'week') {
      const shifted = shiftDate(selectedDate, -7);
      setSelectedDate(shifted.dateStr);
      setCurrentYear(shifted.year);
      setCurrentMonth(shifted.month);
    } else {
      const shifted = shiftDate(selectedDate, -1);
      setSelectedDate(shifted.dateStr);
      setCurrentYear(shifted.year);
      setCurrentMonth(shifted.month);
    }
  };

  // Smart next navigation
  const handleNext = () => {
    if (viewMode === 'month') {
      if (currentMonth === 11) {
        setCurrentMonth(0);
        setCurrentYear((y) => y + 1);
      } else {
        setCurrentMonth((m) => m + 1);
      }
    } else if (viewMode === 'week') {
      const shifted = shiftDate(selectedDate, 7);
      setSelectedDate(shifted.dateStr);
      setCurrentYear(shifted.year);
      setCurrentMonth(shifted.month);
    } else {
      const shifted = shiftDate(selectedDate, 1);
      setSelectedDate(shifted.dateStr);
      setCurrentYear(shifted.year);
      setCurrentMonth(shifted.month);
    }
  };

  const jumpToToday = () => {
    const t = new Date();
    setCurrentYear(t.getFullYear());
    setCurrentMonth(t.getMonth());
    setSelectedDate(getTodayDateString());
  };

  // Filter items for a given date (for month view pills)
  const getItemsForDate = (dateStr) => {
    let list = [];
    if (itemTypeFilter === 'all' || itemTypeFilter === 'events') {
      const dayEvents = events.filter((e) => e.date === dateStr).map((e) => ({ ...e, isEvent: true }));
      list = [...list, ...dayEvents];
    }
    if (itemTypeFilter === 'all' || itemTypeFilter === 'tasks') {
      const dayTasks = tasks.filter((t) => t.date === dateStr).map((t) => ({ ...t, isEvent: false }));
      list = [...list, ...dayTasks];
    }
    if (selectedCategoryId !== 'all') {
      list = list.filter((item) => item.categoryId === selectedCategoryId);
    }
    list.sort((a, b) => (a.startTime || '').localeCompare(b.startTime || ''));
    return list;
  };

  const calendarGrid = getMonthCalendarGrid(currentYear, currentMonth, settings.weekStartsOnSunday);
  const weekGrid = getWeekDaysGrid(selectedDate, settings.weekStartsOnSunday);

  const daysHeader = settings.weekStartsOnSunday
    ? ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
    : ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  // Dynamic header date label
  const getHeaderDateLabel = () => {
    if (viewMode === 'month') {
      return formatMonthYear(currentYear, currentMonth);
    }
    if (viewMode === 'week' && weekGrid.length > 0) {
      const start = weekGrid[0];
      const end = weekGrid[6];
      return `${formatDate(start.dateStr, { month: 'short', day: 'numeric' })} – ${formatDate(
        end.dateStr,
        { month: 'short', day: 'numeric', year: 'numeric' }
      )}`;
    }
    return formatDate(selectedDate, {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  return (
    <div className="calendar-fullpage-root">
      {/* 1. Full-Page Top Toolbar (Clean, Borderless, Not a Card) */}
      <div className="calendar-fullpage-header">
        <div>
          <h1 style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
            Calendar & Events
          </h1>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '6px' }}>
            <span style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--primary-color)' }}>
              {getHeaderDateLabel()}
            </span>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
              <button
                type="button"
                className="btn-icon"
                style={{ width: '28px', height: '28px' }}
                onClick={handlePrev}
                title="Previous"
              >
                <ChevronLeft size={16} />
              </button>
              <button
                type="button"
                className="btn btn-ghost btn-sm"
                style={{ padding: '2px 10px', fontSize: '0.78rem', fontWeight: 700 }}
                onClick={jumpToToday}
              >
                Today
              </button>
              <button
                type="button"
                className="btn-icon"
                style={{ width: '28px', height: '28px' }}
                onClick={handleNext}
                title="Next"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        </div>

        {/* View Mode Toggle, Filters, and Add Buttons */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          {/* Item Type filter */}
          <div style={{ width: '180px' }}>
            <CustomSelect
              value={itemTypeFilter}
              onChange={(val) => setItemTypeFilter(val)}
              options={[
                { value: 'all', label: 'All (Events & Tasks)' },
                { value: 'events', label: 'Events Only' },
                { value: 'tasks', label: 'Tasks Only' },
              ]}
              placeholder="Item Type"
              showSearch={false}
            />
          </div>

          {/* Category Filter */}
          <div style={{ width: '180px' }}>
            <CustomSelect
              value={selectedCategoryId}
              onChange={(val) => setSelectedCategoryId(val)}
              options={[
                { value: 'all', label: 'All Categories' },
                ...categories.map((c) => ({
                  value: c.id,
                  label: c.name,
                  color: c.color,
                })),
              ]}
              placeholder="All Categories"
              searchPlaceholder="Search categories..."
              showSearch={categories.length > 5}
            />
          </div>

          {/* View Mode Switcher (Month, Week, Day) */}
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
            {['month', 'week', 'day'].map((v) => (
              <button
                key={v}
                type="button"
                className={`btn btn-sm ${viewMode === v ? 'btn-primary' : 'btn-ghost'}`}
                style={{ textTransform: 'capitalize', padding: '6px 14px', fontWeight: 700 }}
                onClick={() => setViewMode(v)}
              >
                {v}
              </button>
            ))}
          </div>

          {/* Add Event Button */}
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => openModal('event', { date: selectedDate })}
            style={{ fontWeight: 700 }}
          >
            <Plus size={16} />
            Add Event
          </button>
        </div>
      </div>

      {/* 2. Full-Page Calendar Canvas (Edge-to-Edge, Not on Card) */}
      <div className="calendar-fullpage-body">
          {/* MONTH VIEW */}
          {viewMode === 'month' && (
            <div>
              {/* Day of Week Header Row (Sun to Sat) */}
              <div className="calendar-days-header-row">
                {daysHeader.map((d) => (
                  <div key={d} className="calendar-day-header-cell">
                    {d}
                  </div>
                ))}
              </div>

              {/* Month Grid Cells: Clicking any day opens the Day Detail modal */}
              <div className="calendar-grid-cells">
                {calendarGrid.map((cell, idx) => {
                  if (cell.isEmpty) {
                    return (
                      <div
                        key={`empty-${idx}`}
                        className="cal-cell empty"
                      />
                    );
                  }

                  const dayItems = getItemsForDate(cell.dateStr);
                  const isSelected = selectedDate === cell.dateStr;

                  return (
                    <div
                      key={cell.dateStr || idx}
                      onClick={() => {
                        setSelectedDate(cell.dateStr);
                        setDayDetailModalDate(cell.dateStr);
                      }}
                      className={`cal-cell ${isSelected ? 'selected' : ''} ${cell.isToday ? 'today' : ''}`}
                      title={`Click to view schedule for ${cell.dateStr}`}
                    >
                      <div className="cal-cell-header">
                        <span className={`cal-day-num ${cell.isToday ? 'is-today' : ''}`}>
                          {cell.dayNumber}
                        </span>
                        {dayItems.length > 0 && (
                          <span className="cal-day-count-badge">
                            {dayItems.length}
                          </span>
                        )}
                      </div>

                      <div className="cal-items-wrapper">
                        {dayItems.slice(0, 3).map((item) => {
                          const cat = categories.find((c) => c.id === item.categoryId) || {
                            color: '#1769FF',
                          };
                          const chipColor = item.isEvent ? '#8B5CF6' : cat.color;
                          return (
                            <div
                              key={item.id}
                              className="cal-event-pill"
                              style={{
                                backgroundColor: `${chipColor}16`,
                                color: 'var(--text-primary)',
                                borderLeft: `3px solid ${chipColor}`,
                              }}
                              onClick={(e) => {
                                e.stopPropagation();
                                if (item.isEvent) openModal('event', item);
                                else openModal('task', item);
                              }}
                              title={`${item.title} (${item.startTime || 'All day'})`}
                            >
                              <span className="cal-event-dot" style={{ backgroundColor: chipColor }} />
                              <span className="cal-pill-text">{item.title}</span>
                            </div>
                          );
                        })}
                        {dayItems.length > 3 && (
                          <span className="cal-more-badge">+{dayItems.length - 3} more</span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* WEEK VIEW: GOOGLE CALENDAR STYLE 7-DAY MULTI-COLUMN TIME GRID */}
          {viewMode === 'week' && (
            <GoogleWeekGrid
              weekDays={weekGrid}
              selectedDate={selectedDate}
              onSelectDate={setSelectedDate}
              onOpenDayDetail={(dateStr) => setDayDetailModalDate(dateStr)}
            />
          )}

          {/* DAY VIEW: GOOGLE CALENDAR STYLE 24-HOUR SINGLE DAY GRID */}
          {viewMode === 'day' && (
            <DayGoogleCalendar
              selectedDate={selectedDate}
              tasks={tasks}
              categories={categories}
              events={events}
            />
          )}
      </div>

      {/* 3. Day Detail Modal: Opens when user clicks on any day */}
      {dayDetailModalDate && (
        <DayDetailModal
          date={dayDetailModalDate}
          onClose={() => setDayDetailModalDate(null)}
        />
      )}
    </div>
  );
}
