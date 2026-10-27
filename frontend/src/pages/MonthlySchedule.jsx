import React, { useState, useEffect } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  Calendar as CalendarIcon,
  Target,
  Sparkles,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import {
  getTodayDateString,
  formatDate,
  formatMonthYear,
  getMonthCalendarGrid,
  getWeekDaysGrid,
} from '../utils/dateUtils';
import { calculateMonthlyStats, calculateTaskStats } from '../utils/statistics';
import { ProgressBar } from '../components/common/ProgressRing';
import { TaskItem } from '../components/tasks/TaskItem';
import { DailyScheduleTimeline } from '../components/tasks/DailyScheduleTimeline';

export function MonthlySchedule() {
  const { tasks, categories, goals, openModal, settings, selectedDate, setSelectedDate } = useApp();

  const now = new Date();
  const [currentYear, setCurrentYear] = useState(now.getFullYear());
  const [currentMonth, setCurrentMonth] = useState(now.getMonth());
  const [viewMode, setViewMode] = useState('month'); // 'month', 'week', 'day'
  const [selectedCategories, setSelectedCategories] = useState(['all']);
  const [dateScheduleView, setDateScheduleView] = useState('timeline'); // 'timeline', 'cards'

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

  // Month navigation
  const prevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear((y) => y - 1);
    } else {
      setCurrentMonth((m) => m - 1);
    }
  };

  const nextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear((y) => y + 1);
    } else {
      setCurrentMonth((m) => m + 1);
    }
  };

  const jumpToTodayMonth = () => {
    const today = new Date();
    setCurrentYear(today.getFullYear());
    setCurrentMonth(today.getMonth());
    setSelectedDate(getTodayDateString());
  };

  // Toggle category multi-filter
  const toggleCategoryFilter = (catId) => {
    if (catId === 'all') {
      setSelectedCategories(['all']);
      return;
    }
    let updated = selectedCategories.filter((id) => id !== 'all');
    if (updated.includes(catId)) {
      updated = updated.filter((id) => id !== catId);
      if (updated.length === 0) updated = ['all'];
    } else {
      updated.push(catId);
    }
    setSelectedCategories(updated);
  };

  // Monthly stats
  const monthStats = calculateMonthlyStats(tasks, currentYear, currentMonth);

  // Selected date tasks
  const selectedDateTasks = tasks.filter((t) => t.date === selectedDate);
  const selectedDateStats = calculateTaskStats(selectedDateTasks);

  // Filter tasks by selected category filters
  const filterByCat = (taskList) => {
    if (selectedCategories.includes('all')) return taskList;
    return taskList.filter((t) => selectedCategories.includes(t.categoryId));
  };

  // Calendar Grids
  const calendarGrid = getMonthCalendarGrid(currentYear, currentMonth, settings.weekStartsOnSunday);
  const weekGrid = getWeekDaysGrid(selectedDate, settings.weekStartsOnSunday);

  const daysHeader = settings.weekStartsOnSunday
    ? ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
    : ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* 1. Header with Month Navigator & View Toggles */}
      <div
        className="card"
        style={{
          padding: '20px 28px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '16px',
        }}
      >
        <div>
          <h1 style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--text-primary)' }}>
            Monthly Schedule
          </h1>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '4px' }}>
            <span style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--primary-color)' }}>
              {formatMonthYear(currentYear, currentMonth)}
            </span>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
              <button
                type="button"
                className="btn-icon"
                style={{ width: '28px', height: '28px' }}
                onClick={prevMonth}
                title="Previous Month"
              >
                <ChevronLeft size={16} />
              </button>
              <button
                type="button"
                className="btn btn-ghost btn-sm"
                onClick={jumpToTodayMonth}
                style={{ padding: '2px 8px', fontSize: '0.75rem' }}
              >
                Today
              </button>
              <button
                type="button"
                className="btn-icon"
                style={{ width: '28px', height: '28px' }}
                onClick={nextMonth}
                title="Next Month"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        </div>

        {/* View Options (Month, Week, Day) & Add Task */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
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
                style={{ textTransform: 'capitalize', padding: '6px 14px' }}
                onClick={() => setViewMode(v)}
              >
                {v} View
              </button>
            ))}
          </div>

          <button
            type="button"
            className="btn btn-primary"
            onClick={() => openModal('task', { date: selectedDate })}
          >
            <Plus size={16} />
            Add Task
          </button>
        </div>
      </div>

      {/* 2. Monthly Summary Metrics */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
          gap: '16px',
        }}
      >
        <div className="card" style={{ padding: '16px 20px' }}>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Total Month Tasks</div>
          <div style={{ fontSize: '1.6rem', fontWeight: 800, marginTop: '2px' }}>{monthStats.total}</div>
        </div>

        <div className="card" style={{ padding: '16px 20px' }}>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Completed</div>
          <div style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--success)', marginTop: '2px' }}>
            {monthStats.completed}
          </div>
        </div>

        <div className="card" style={{ padding: '16px 20px' }}>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Pending</div>
          <div style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--warning)', marginTop: '2px' }}>
            {monthStats.pending}
          </div>
        </div>

        <div className="card" style={{ padding: '16px 20px' }}>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Overdue</div>
          <div style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--danger)', marginTop: '2px' }}>
            {monthStats.overdue}
          </div>
        </div>

        <div className="card" style={{ padding: '16px 20px' }}>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Monthly Progress</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '6px' }}>
            <ProgressBar progress={monthStats.percentage} color="var(--primary-color)" />
            <strong style={{ fontSize: '0.95rem' }}>{monthStats.percentage}%</strong>
          </div>
        </div>
      </div>

      {/* 3. Category Filter Pills */}
      <div
        className="card"
        style={{
          padding: '12px 20px',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          flexWrap: 'wrap',
        }}
      >
        <span style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-secondary)', marginRight: '6px' }}>
          Categories:
        </span>
        <button
          type="button"
          className={`btn btn-sm ${selectedCategories.includes('all') ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => toggleCategoryFilter('all')}
        >
          All
        </button>
        {categories.map((c) => {
          const isSelected = selectedCategories.includes(c.id);
          return (
            <button
              key={c.id}
              type="button"
              className="btn btn-sm"
              onClick={() => toggleCategoryFilter(c.id)}
              style={{
                backgroundColor: isSelected ? c.color : 'transparent',
                color: isSelected ? '#ffffff' : 'var(--text-primary)',
                border: `1px solid ${isSelected ? c.color : 'var(--border-color)'}`,
              }}
            >
              <span
                style={{
                  width: '8px',
                  height: '8px',
                  borderRadius: '50%',
                  backgroundColor: isSelected ? '#ffffff' : c.color,
                }}
              />
              {c.name}
            </button>
          );
        })}
      </div>

      {/* 4. Main Calendar + Side Widgets Grid */}
      <div className="calendar-page-layout">
        {/* Calendar Board Area */}
        <div className="calendar-board">
          {/* MONTH VIEW */}
          {viewMode === 'month' && (
            <div>
              {/* Days Header Row (Sun to Sat) */}
              <div className="calendar-days-header-row">
                {daysHeader.map((d) => (
                  <div key={d} className="calendar-day-header-cell">
                    {d}
                  </div>
                ))}
              </div>

              {/* Calendar Days Grid */}
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

                  const dayTasks = filterByCat(tasks.filter((t) => t.date === cell.dateStr));
                  const isSelected = selectedDate === cell.dateStr;

                  return (
                    <div
                      key={cell.dateStr || idx}
                      onClick={() => setSelectedDate(cell.dateStr)}
                      className={`cal-cell ${isSelected ? 'selected' : ''} ${cell.isToday ? 'today' : ''}`}
                    >
                      {/* Day Number Header */}
                      <div className="cal-cell-header">
                        <span className={`cal-day-num ${cell.isToday ? 'is-today' : ''}`}>
                          {cell.dayNumber}
                        </span>
                        {dayTasks.length > 0 && (
                          <span className="cal-day-count-badge">
                            {dayTasks.length}
                          </span>
                        )}
                      </div>

                      {/* Task Pills */}
                      <div className="cal-items-wrapper">
                        {dayTasks.slice(0, 2).map((t) => {
                          const cat = categories.find((c) => c.id === t.categoryId) || { color: '#1769FF' };
                          return (
                            <div
                              key={t.id}
                              className="cal-event-pill"
                              style={{
                                backgroundColor: `${cat.color}16`,
                                color: 'var(--text-primary)',
                                borderLeft: `3px solid ${cat.color}`,
                              }}
                              onClick={(e) => {
                                e.stopPropagation();
                                openModal('task', t);
                              }}
                              title={`${t.title} (${t.startTime || 'All day'})`}
                            >
                              <span className="cal-event-dot" style={{ backgroundColor: cat.color }} />
                              <span className="cal-pill-text">{t.title}</span>
                            </div>
                          );
                        })}
                        {dayTasks.length > 2 && (
                          <span className="cal-more-badge">+{dayTasks.length - 2} more</span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* WEEK VIEW */}
          {viewMode === 'week' && (
            <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '8px' }}>
                {weekGrid.map((day) => {
                  const dayTasks = filterByCat(tasks.filter((t) => t.date === day.dateStr));
                  const isSelected = selectedDate === day.dateStr;

                  return (
                    <div
                      key={day.dateStr}
                      onClick={() => setSelectedDate(day.dateStr)}
                      style={{
                        padding: '12px',
                        borderRadius: 'var(--radius-md)',
                        border: `1.5px solid ${isSelected ? 'var(--primary-color)' : 'var(--border-color)'}`,
                        backgroundColor: isSelected ? 'var(--primary-light)' : 'var(--card-bg)',
                        cursor: 'pointer',
                        textAlign: 'center',
                        transition: 'all 0.15s ease',
                      }}
                    >
                      <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', fontWeight: 600 }}>
                        {day.dayName}
                      </div>
                      <div style={{ fontSize: '1.25rem', fontWeight: 800, margin: '4px 0' }}>{day.dayNumber}</div>
                      <span className="badge badge-neutral" style={{ fontSize: '0.7rem' }}>
                        {dayTasks.length} tasks
                      </span>
                    </div>
                  );
                })}
              </div>

              {/* Selected Day's Schedule in Week View */}
              <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '16px' }}>
                <h3 style={{ fontSize: '1.05rem', fontWeight: 700, marginBottom: '14px' }}>
                  Schedule for {formatDate(selectedDate)}
                </h3>
                {selectedDateTasks.length === 0 ? (
                  <div style={{ padding: '28px', textAlign: 'center', color: 'var(--text-muted)' }}>
                    No tasks scheduled for this day.
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {selectedDateTasks.map((t) => (
                      <TaskItem key={t.id} task={t} />
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* DAY VIEW */}
          {viewMode === 'day' && (
            <div style={{ padding: '24px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
                <div>
                  <h3 style={{ fontSize: '1.2rem', fontWeight: 800 }}>
                    {formatDate(selectedDate, { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
                  </h3>
                  <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                    {selectedDateTasks.length} tasks planned
                  </span>
                </div>
                <button
                  type="button"
                  className="btn btn-primary btn-sm"
                  onClick={() => openModal('task', { date: selectedDate })}
                >
                  <Plus size={14} /> Add to this day
                </button>
              </div>

              {selectedDateTasks.length === 0 ? (
                <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
                  No tasks for this day.
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {selectedDateTasks.map((t) => (
                    <TaskItem key={t.id} task={t} />
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right Side Widgets Column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', width: '100%', minWidth: 0 }}>
          {/* Widget 1: Selected Date Schedule Timeline & Tasks */}
          <div className="calendar-side-panel">
            <div className="calendar-side-panel-header">
              <div>
                <h3 style={{ fontSize: '1.05rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <CalendarIcon size={18} color="var(--primary-color)" />
                  {formatDate(selectedDate, { month: 'short', day: 'numeric' })} Tasks
                </h3>
                <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                  {selectedDateStats.total} {selectedDateStats.total === 1 ? 'task' : 'tasks'} total
                </span>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                {/* View toggle */}
                <div
                  style={{
                    display: 'flex',
                    background: 'var(--page-bg)',
                    border: '1px solid var(--border-color)',
                    borderRadius: 'var(--radius-md)',
                    padding: '2px',
                    gap: '2px',
                  }}
                >
                  <button
                    type="button"
                    className={`btn btn-sm ${dateScheduleView === 'timeline' ? 'btn-primary' : 'btn-ghost'}`}
                    style={{ padding: '3px 8px', fontSize: '0.72rem', height: '26px' }}
                    onClick={() => setDateScheduleView('timeline')}
                    title="Daily Schedule Timeline"
                  >
                    Timeline
                  </button>
                  <button
                    type="button"
                    className={`btn btn-sm ${dateScheduleView === 'cards' ? 'btn-primary' : 'btn-ghost'}`}
                    style={{ padding: '3px 8px', fontSize: '0.72rem', height: '26px' }}
                    onClick={() => setDateScheduleView('cards')}
                    title="Grid of Cards"
                  >
                    Cards
                  </button>
                  <button
                    type="button"
                    className={`btn btn-sm ${dateScheduleView === 'list' ? 'btn-primary' : 'btn-ghost'}`}
                    style={{ padding: '3px 8px', fontSize: '0.72rem', height: '26px' }}
                    onClick={() => setDateScheduleView('list')}
                    title="Compact Row List"
                  >
                    List
                  </button>
                </div>

                <button
                  type="button"
                  className="btn btn-primary btn-sm"
                  style={{ padding: '4px 10px', fontSize: '0.75rem', height: '28px' }}
                  onClick={() => openModal('task', { date: selectedDate })}
                >
                  <Plus size={13} /> Add
                </button>
              </div>
            </div>

            <div className="calendar-side-panel-body" style={{ maxHeight: '520px', overflowY: 'auto' }}>
              {dateScheduleView === 'timeline' ? (
                <DailyScheduleTimeline
                  date={selectedDate}
                  compact={true}
                  showHeader={false}
                  includeEvents={false}
                  onAddTask={() => openModal('task', { date: selectedDate })}
                  emptyMessage={`No tasks scheduled for ${formatDate(selectedDate, { month: 'short', day: 'numeric' })}.`}
                />
              ) : selectedDateTasks.length === 0 ? (
                <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', textAlign: 'center', padding: '28px 12px' }}>
                  No tasks on this date.
                </div>
              ) : dateScheduleView === 'cards' ? (
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
                    gap: '12px',
                    padding: '2px 0',
                  }}
                >
                  {selectedDateTasks.map((t) => (
                    <TaskItem key={t.id} task={t} asCard={true} />
                  ))}
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {selectedDateTasks.map((t) => (
                    <TaskItem key={t.id} task={t} compact={true} />
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Widget 2: Monthly Goals */}
          <div className="card" style={{ padding: '20px' }}>
            <h3 className="card-title" style={{ fontSize: '1.05rem', marginBottom: '14px' }}>
              <Target size={18} color="var(--primary-color)" />
              Monthly Goals
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {goals.slice(0, 3).map((g) => (
                <div key={g.id}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', marginBottom: '4px' }}>
                    <span style={{ fontWeight: 600 }}>{g.title}</span>
                    <span style={{ color: 'var(--text-secondary)' }}>{g.progress}%</span>
                  </div>
                  <ProgressBar progress={g.progress} color="var(--primary-color)" />
                </div>
              ))}
            </div>
          </div>

          {/* Widget 3: Monthly Highlights & Tips */}
          <div
            className="card"
            style={{
              padding: '20px',
              background: 'linear-gradient(135deg, #0B2454 0%, #17387B 100%)',
              color: '#ffffff',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
              <Sparkles size={16} color="#38BDF8" />
              <h4 style={{ fontSize: '0.92rem', fontWeight: 700, color: '#ffffff' }}>Schedule Insights</h4>
            </div>
            <p style={{ fontSize: '0.8rem', color: '#CBD5E1', lineHeight: '1.4' }}>
              You have completed {monthStats.completed} tasks this month! Keep scheduling daily focus sessions to achieve your VLSI and reading milestones.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
