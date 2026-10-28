import React, { useState } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  Search,
  CheckCircle2,
  Clock,
  AlertCircle,
  ListTodo,
  Sun,
  Sunset,
  Moon,
  Calendar as CalendarIcon,
  List,
  UploadCloud,
  Wand2,
  Sparkles,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import {
  getTodayDateString,
  formatDate,
  parseDate,
} from '../utils/dateUtils';
import { calculateTaskStats } from '../utils/statistics';
import { groupTasksByPeriod, filterAndSortTasks } from '../utils/taskUtils';
import { SmartRescheduleModal } from '../components/tasks/SmartRescheduleModal';
import { TaskItem } from '../components/tasks/TaskItem';
import { EmptyState } from '../components/common/EmptyState';
import { DayGoogleCalendar } from '../components/tasks/DayGoogleCalendar';
import { CustomSelect } from '../components/common/CustomSelect';

export function TodaysTasks() {
  const { tasks, categories, events, openModal, selectedDate, setSelectedDate } = useApp();

  const [viewMode, setViewMode] = useState('calendar'); // 'calendar' (Google Calendar style) or 'list'
  const [statusFilter, setStatusFilter] = useState('all'); // all, pending, completed, overdue
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedPriority, setSelectedPriority] = useState('all');
  const [sortBy, setSortBy] = useState('time'); // time, priority, created
  const [isRescheduleOpen, setIsRescheduleOpen] = useState(false);

  const overdueCount = tasks.filter(
    (t) => t.date < getTodayDateString() && t.status !== 'completed'
  ).length;

  // Navigate to previous or next day
  const changeDay = (offset) => {
    const current = parseDate(selectedDate);
    current.setDate(current.getDate() + offset);
    const y = current.getFullYear();
    const m = String(current.getMonth() + 1).padStart(2, '0');
    const d = String(current.getDate()).padStart(2, '0');
    setSelectedDate(`${y}-${m}-${d}`);
  };

  const jumpToToday = () => {
    setSelectedDate(getTodayDateString());
  };

  // Day specific tasks
  const dayTasks = tasks.filter((t) => t.date === selectedDate);
  const dayStats = calculateTaskStats(dayTasks);

  // Filtered and sorted tasks for the list & calendar
  const filteredTasks = filterAndSortTasks(dayTasks, {
    statusFilter,
    searchQuery,
    categoryId: selectedCategory,
    priority: selectedPriority,
    sortBy,
  });

  // Group by periods (Morning, Afternoon, Evening) for list view
  const groupedTasks = groupTasksByPeriod(filteredTasks);

  const isToday = selectedDate === getTodayDateString();

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '22px' }}>
      {/* 1. Header with Day Controls, Google Calendar View Toggle & Add Button */}
      <div
        className="card"
        style={{
          padding: '20px 26px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '16px',
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <h1 style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--text-primary)' }}>
              {isToday ? "Today's Schedule & Tasks" : "Day's Schedule & Tasks"}
            </h1>
            {isToday && (
              <span className="badge badge-primary" style={{ fontSize: '0.75rem' }}>
                Today
              </span>
            )}
          </div>
          <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
            {formatDate(selectedDate, { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
          </span>
        </div>

        {/* Date Switcher & View Mode Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          {/* Day Navigation Buttons */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              background: 'var(--page-bg)',
              border: '1px solid var(--border-color)',
              borderRadius: 'var(--radius-md)',
              padding: '2px',
            }}
          >
            <button
              type="button"
              className="btn-icon"
              style={{ width: '32px', height: '32px' }}
              onClick={() => changeDay(-1)}
              title="Previous Day"
            >
              <ChevronLeft size={16} />
            </button>
            <button
              type="button"
              className="btn btn-ghost btn-sm"
              onClick={jumpToToday}
              style={{ padding: '4px 10px', fontSize: '0.8rem', fontWeight: 700 }}
            >
              Today
            </button>
            <button
              type="button"
              className="btn-icon"
              style={{ width: '32px', height: '32px' }}
              onClick={() => changeDay(1)}
              title="Next Day"
            >
              <ChevronRight size={16} />
            </button>
          </div>

          {/* Date Picker */}
          <input
            type="date"
            className="form-input"
            style={{ width: 'auto', padding: '5px 10px', fontSize: '0.84rem' }}
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
          />

          {/* Google Calendar vs List View Toggle */}
          <div
            style={{
              display: 'inline-flex',
              background: 'var(--card-hover)',
              border: '1px solid var(--border-color)',
              borderRadius: 'var(--radius-md)',
              padding: '2px',
              gap: '2px',
            }}
          >
            <button
              type="button"
              className={`btn btn-sm ${viewMode === 'calendar' ? 'btn-primary' : 'btn-ghost'}`}
              style={{
                padding: '5px 12px',
                fontSize: '0.78rem',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                fontWeight: viewMode === 'calendar' ? 700 : 600,
              }}
              onClick={() => setViewMode('calendar')}
              title="Google Calendar Day Grid View"
            >
              <CalendarIcon size={14} />
              <span>Day Calendar</span>
            </button>
            <button
              type="button"
              className={`btn btn-sm ${viewMode === 'list' ? 'btn-primary' : 'btn-ghost'}`}
              style={{
                padding: '5px 12px',
                fontSize: '0.78rem',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                fontWeight: viewMode === 'list' ? 700 : 600,
              }}
              onClick={() => setViewMode('list')}
              title="Grouped List View"
            >
              <List size={14} />
              <span>List View</span>
            </button>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => setIsRescheduleOpen(true)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                color: overdueCount > 0 ? '#F59E0B' : 'var(--text-primary)',
                borderColor: overdueCount > 0 ? 'rgba(245, 158, 11, 0.4)' : 'var(--border-color)',
                background: overdueCount > 0 ? 'rgba(245, 158, 11, 0.08)' : 'var(--card-bg)',
              }}
              title="Auto-balance overdue tasks from previous days into open time slots"
            >
              <Wand2 size={16} color={overdueCount > 0 ? '#F59E0B' : 'var(--primary-color)'} />
              <span>Smart Reschedule</span>
              {overdueCount > 0 && (
                <span
                  style={{
                    padding: '1px 6px',
                    borderRadius: '999px',
                    background: '#F59E0B',
                    color: '#FFFFFF',
                    fontSize: '0.68rem',
                    fontWeight: 800,
                  }}
                >
                  {overdueCount}
                </span>
              )}
            </button>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => openModal('bulk-import', { type: 'tasks' })}
              id="btn-bulk-import-tasks"
              style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
            >
              <UploadCloud size={16} />
              <span>Bulk Import</span>
            </button>
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => openModal('task', { date: selectedDate })}
              id="btn-add-today-task"
              style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
            >
              <Plus size={16} />
              <span>Add Task</span>
            </button>
          </div>
        </div>
      </div>

      {/* 2. Summary Metric Cards */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '16px',
        }}
      >
        <div className="card" style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div
            style={{
              width: '44px',
              height: '44px',
              borderRadius: 'var(--radius-md)',
              background: '#EFF6FF',
              color: '#2563EB',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <ListTodo size={22} />
          </div>
          <div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Total Tasks</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 800 }}>{dayStats.total}</div>
          </div>
        </div>

        <div className="card" style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div
            style={{
              width: '44px',
              height: '44px',
              borderRadius: 'var(--radius-md)',
              background: '#ECFDF5',
              color: '#059669',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <CheckCircle2 size={22} />
          </div>
          <div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Completed</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--success)' }}>{dayStats.completed}</div>
          </div>
        </div>

        <div className="card" style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div
            style={{
              width: '44px',
              height: '44px',
              borderRadius: 'var(--radius-md)',
              background: '#FFFBEB',
              color: '#D97706',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Clock size={22} />
          </div>
          <div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Pending</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--warning)' }}>{dayStats.pending}</div>
          </div>
        </div>

        <div className="card" style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div
            style={{
              width: '44px',
              height: '44px',
              borderRadius: 'var(--radius-md)',
              background: '#FEF2F2',
              color: '#DC2626',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <AlertCircle size={22} />
          </div>
          <div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Overdue</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--danger)' }}>{dayStats.overdue}</div>
          </div>
        </div>
      </div>

      {/* 3. Filters & Search Bar */}
      <div
        className="card"
        style={{
          padding: '16px 20px',
          display: 'flex',
          flexDirection: 'column',
          gap: '14px',
          overflow: 'visible',
          position: 'relative',
          zIndex: 20,
        }}
      >
        {/* Status Filter Tabs with Counts */}
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          {[
            { id: 'all', label: 'All Tasks', count: dayStats.total },
            { id: 'pending', label: 'Pending', count: dayStats.pending },
            { id: 'completed', label: 'Completed', count: dayStats.completed },
            { id: 'overdue', label: 'Overdue', count: dayStats.overdue },
          ].map((tab) => {
            const active = statusFilter === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                className={`btn btn-sm ${active ? 'btn-primary' : 'btn-secondary'}`}
                onClick={() => setStatusFilter(tab.id)}
              >
                <span>{tab.label}</span>
                <span
                  style={{
                    padding: '2px 6px',
                    borderRadius: '9999px',
                    background: active ? 'rgba(255,255,255,0.25)' : 'var(--border-subtle)',
                    fontSize: '0.72rem',
                    fontWeight: 700,
                  }}
                >
                  {tab.count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Filter controls row: Search, Category, Priority, Sort */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
            gap: '12px',
          }}
        >
          {/* Search Input */}
          <div style={{ position: 'relative' }}>
            <Search
              size={15}
              style={{
                position: 'absolute',
                left: '12px',
                top: '50%',
                transform: 'translateY(-50%)',
                color: 'var(--text-muted)',
              }}
            />
            <input
              type="text"
              className="form-input"
              style={{ paddingLeft: '34px', fontSize: '0.85rem' }}
              placeholder="Search tasks..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          {/* Category Filter */}
          <CustomSelect
            value={selectedCategory}
            onChange={(val) => setSelectedCategory(val)}
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

          {/* Priority Filter */}
          <CustomSelect
            value={selectedPriority}
            onChange={(val) => setSelectedPriority(val)}
            options={[
              { value: 'all', label: 'All Priorities' },
              { value: 'high', label: '🔴 High Priority' },
              { value: 'medium', label: '🟡 Medium Priority' },
              { value: 'low', label: '🟢 Low Priority' },
            ]}
            placeholder="All Priorities"
            showSearch={false}
          />

          {/* Sort By */}
          <CustomSelect
            value={sortBy}
            onChange={(val) => setSortBy(val)}
            options={[
              { value: 'time', label: '⏰ Sort: Scheduled Time' },
              { value: 'priority', label: '🚩 Sort: Priority' },
              { value: 'created', label: '📅 Sort: Creation Date' },
            ]}
            placeholder="Sort By"
            showSearch={false}
          />
        </div>
      </div>

      {/* 4. Main Body: Google Calendar Day Grid (Default) vs Grouped List View */}
      {viewMode === 'calendar' ? (
        <DayGoogleCalendar
          selectedDate={selectedDate}
          tasks={filteredTasks}
          categories={categories}
          events={events}
        />
      ) : filteredTasks.length === 0 ? (
        <EmptyState
          title="No tasks found for this day"
          description="There are no tasks matching your selected filters. Create a new task or adjust the filters above."
          actionLabel="Add Task"
          onAction={() => openModal('task', { date: selectedDate })}
        />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {/* Morning Section */}
          {groupedTasks.morning.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--warning)', fontWeight: 700, fontSize: '1rem' }}>
                <Sun size={18} />
                <span>Morning ({groupedTasks.morning.length})</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {groupedTasks.morning.map((task) => (
                  <TaskItem key={task.id} task={task} />
                ))}
              </div>
            </div>
          )}

          {/* Afternoon Section */}
          {groupedTasks.afternoon.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--primary-color)', fontWeight: 700, fontSize: '1rem' }}>
                <Sunset size={18} />
                <span>Afternoon ({groupedTasks.afternoon.length})</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {groupedTasks.afternoon.map((task) => (
                  <TaskItem key={task.id} task={task} />
                ))}
              </div>
            </div>
          )}

          {/* Evening Section */}
          {groupedTasks.evening.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#8B5CF6', fontWeight: 700, fontSize: '1rem' }}>
                <Moon size={18} />
                <span>Evening ({groupedTasks.evening.length})</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {groupedTasks.evening.map((task) => (
                  <TaskItem key={task.id} task={task} />
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Smart Schedule Auto-Balancing Modal */}
      <SmartRescheduleModal
        isOpen={isRescheduleOpen}
        onClose={() => setIsRescheduleOpen(false)}
      />
    </div>
  );
}
