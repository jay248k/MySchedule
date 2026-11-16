import React, { useState, useEffect, useMemo } from 'react';
import {
  Flame,
  Plus,
  Calendar,
  ChevronLeft,
  ChevronRight,
  Check,
  X as CloseIcon,
  Edit2,
  Trash2,
  Clock,
  Sparkles,
  Trophy,
  Target,
  Sun,
  Zap,
  Activity,
  CheckCircle2,
  BookOpen,
  Heart,
  Search,
  Filter,
} from 'lucide-react';
import { api } from '../services/api';
import { useApp } from '../context/AppContext';
import '../styles/pages/habits.css';

const HABIT_COLORS = [
  { name: 'Emerald', hex: '#10B981' },
  { name: 'Sapphire', hex: '#3B82F6' },
  { name: 'Amber', hex: '#F59E0B' },
  { name: 'Rose', hex: '#EF4444' },
  { name: 'Purple', hex: '#8B5CF6' },
  { name: 'Cyan', hex: '#06B6D4' },
];

const HABIT_ICONS = [
  { id: 'flame', label: 'Flame', component: Flame },
  { id: 'sun', label: 'Sun', component: Sun },
  { id: 'zap', label: 'Energy', component: Zap },
  { id: 'activity', label: 'Activity', component: Activity },
  { id: 'check', label: 'Check', component: CheckCircle2 },
  { id: 'target', label: 'Target', component: Target },
  { id: 'book', label: 'Book', component: BookOpen },
  { id: 'heart', label: 'Health', component: Heart },
];

const CATEGORIES = [
  'Discipline',
  'Health & Fitness',
  'Productivity',
  'Mindset',
  'Wisdom',
];

export function HabitsPage() {
  const { showToast } = useApp();
  const [habits, setHabits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');

  // Per-habit calendar month state { [habitId]: { year, month } }
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth(); // 0-indexed
  const todayDateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;

  const [calendarMonths, setCalendarMonths] = useState({});

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingHabit, setEditingHabit] = useState(null);
  const [formName, setFormName] = useState('');
  const [formDesc, setFormDesc] = useState('');
  const [formTime, setFormTime] = useState('05:00');
  const [formCat, setFormCat] = useState('Discipline');
  const [formColor, setFormColor] = useState('#10B981');
  const [formIcon, setFormIcon] = useState('flame');
  const [submitting, setSubmitting] = useState(false);

  // Fetch habits from API
  const fetchHabits = async () => {
    try {
      setLoading(true);
      const res = await api.getHabits();
      const list = Array.isArray(res?.data) ? res.data : [];
      setHabits(list);
    } catch (err) {
      console.warn('Failed to load habits:', err);
      showToast({ type: 'danger', title: 'Error', message: 'Could not load habits.' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHabits();
  }, []);

  // Filtered habits list
  const filteredHabits = useMemo(() => {
    return habits.filter((h) => {
      if (selectedCategory !== 'All' && h.category !== selectedCategory) {
        return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return h.name?.toLowerCase().includes(q) || h.description?.toLowerCase().includes(q);
      }
      return true;
    });
  }, [habits, selectedCategory, searchQuery]);

  // Overall Stats
  const overallStats = useMemo(() => {
    const totalHabits = habits.length;
    let maxCurrentStreak = 0;
    let maxBestStreak = 0;
    let totalCheckinsThisMonth = 0;
    let totalCheckinsAll = 0;

    habits.forEach((h) => {
      if ((h.currentStreak || 0) > maxCurrentStreak) maxCurrentStreak = h.currentStreak;
      if ((h.longestStreak || 0) > maxBestStreak) maxBestStreak = h.longestStreak;
      totalCheckinsThisMonth += (h.thisMonthCompleted || 0);
      totalCheckinsAll += (h.totalCompleted || 0);
    });

    const daysPassed = now.getDate();
    const possible = totalHabits * daysPassed;
    const monthlyCompliance = possible > 0
      ? Math.min(100, Math.round((totalCheckinsThisMonth / possible) * 100))
      : 0;

    return {
      totalHabits,
      maxCurrentStreak,
      maxBestStreak,
      totalCheckinsThisMonth,
      totalCheckinsAll,
      monthlyCompliance,
    };
  }, [habits]);

  // Calendar Month navigation helpers
  const getHabitMonth = (habitId) => {
    return calendarMonths[habitId] || { year: currentYear, month: currentMonth };
  };

  const changeHabitMonth = (habitId, delta) => {
    setCalendarMonths((prev) => {
      const cur = prev[habitId] || { year: currentYear, month: currentMonth };
      let newM = cur.month + delta;
      let newY = cur.year;
      if (newM < 0) {
        newM = 11;
        newY -= 1;
      } else if (newM > 11) {
        newM = 0;
        newY += 1;
      }
      return {
        ...prev,
        [habitId]: { year: newY, month: newM },
      };
    });
  };

  const resetHabitMonthToToday = (habitId) => {
    setCalendarMonths((prev) => ({
      ...prev,
      [habitId]: { year: currentYear, month: currentMonth },
    }));
  };

  // Toggle single date for a habit
  const handleToggleDate = async (habitId, dateStr) => {
    // Optimistic UI update
    setHabits((prev) =>
      prev.map((h) => {
        if (h.id !== habitId) return h;
        const logs = h.logs || [];
        const existingLog = logs.find((l) => l.date === dateStr);
        let newLogs;
        if (existingLog) {
          newLogs = logs.map((l) =>
            l.date === dateStr ? { ...l, completed: !l.completed } : l
          );
        } else {
          newLogs = [...logs, { id: `temp-${Date.now()}`, date: dateStr, completed: true }];
        }
        return {
          ...h,
          logs: newLogs,
        };
      })
    );

    try {
      const res = await api.toggleHabitDate(habitId, { date: dateStr });
      if (res?.data) {
        // Sync with exact backend recalculated streaks
        setHabits((prev) =>
          prev.map((h) => (h.id === habitId ? res.data : h))
        );
      }
    } catch (err) {
      showToast({ type: 'danger', title: 'Error', message: 'Failed to update habit date.' });
      fetchHabits(); // Rollback
    }
  };

  // Open Add Modal
  const handleOpenAdd = () => {
    setEditingHabit(null);
    setFormName('');
    setFormDesc('');
    setFormTime('05:00');
    setFormCat('Discipline');
    setFormColor('#10B981');
    setFormIcon('flame');
    setIsModalOpen(true);
  };

  // Open Edit Modal
  const handleOpenEdit = (habit) => {
    setEditingHabit(habit);
    setFormName(habit.name || '');
    setFormDesc(habit.description || '');
    setFormTime(habit.targetTime || '05:00');
    setFormCat(habit.category || 'Discipline');
    setFormColor(habit.color || '#10B981');
    setFormIcon(habit.icon || 'flame');
    setIsModalOpen(true);
  };

  // Submit Habit (Create / Update)
  const handleSubmitHabit = async (e) => {
    e.preventDefault();
    if (!formName.trim()) {
      showToast({ type: 'warning', title: 'Validation', message: 'Please enter a habit name.' });
      return;
    }

    try {
      setSubmitting(true);
      const payload = {
        name: formName.trim(),
        description: formDesc.trim() || null,
        targetTime: formTime || null,
        category: formCat,
        color: formColor,
        icon: formIcon,
      };

      if (editingHabit) {
        const res = await api.updateHabit(editingHabit.id, payload);
        if (res?.data) {
          setHabits((prev) => prev.map((h) => (h.id === editingHabit.id ? res.data : h)));
          showToast({ type: 'success', title: 'Updated', message: `Habit "${res.data.name}" updated successfully.` });
        }
      } else {
        const res = await api.createHabit(payload);
        if (res?.data) {
          setHabits((prev) => [res.data, ...prev]);
          showToast({ type: 'success', title: 'Habit Created', message: `New habit "${res.data.name}" created!` });
        }
      }
      setIsModalOpen(false);
    } catch (err) {
      showToast({ type: 'danger', title: 'Error', message: err.message || 'Failed to save habit.' });
    } finally {
      setSubmitting(false);
    }
  };

  // Delete Habit
  const handleDeleteHabit = async (habitId, habitName) => {
    if (!window.confirm(`Are you sure you want to delete the habit "${habitName}" and its calendar history?`)) {
      return;
    }

    try {
      await api.deleteHabit(habitId);
      setHabits((prev) => prev.filter((h) => h.id !== habitId));
      showToast({ type: 'info', title: 'Deleted', message: `Habit "${habitName}" removed.` });
    } catch (err) {
      showToast({ type: 'danger', title: 'Error', message: 'Could not delete habit.' });
    }
  };

  // Render Days Grid for a Habit's Calendar
  const renderHabitCalendarGrid = (habit) => {
    const { year, month } = getHabitMonth(habit.id);
    const monthFirstDay = new Date(year, month, 1);
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const startingDayOfWeek = monthFirstDay.getDay(); // 0 = Sunday

    // Map logs for instant lookup
    const completedMap = new Map();
    (habit.logs || []).forEach((l) => {
      if (l.completed) {
        completedMap.set(l.date, true);
      }
    });

    const cells = [];

    // Empty offset cells for days before the 1st
    for (let i = 0; i < startingDayOfWeek; i++) {
      cells.push(<div key={`empty-${i}`} className="habit-cal-day-cell is-empty" />);
    }

    // Days 1..daysInMonth
    for (let day = 1; day <= daysInMonth; day++) {
      const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      const isCompleted = completedMap.has(dateStr);
      const isToday = dateStr === todayDateStr;

      cells.push(
        <div
          key={dateStr}
          onClick={() => handleToggleDate(habit.id, dateStr)}
          className={`habit-cal-day-cell ${isToday ? 'is-today' : ''}`}
          title={
            isCompleted
              ? `Completed on ${dateStr} (Click to toggle)`
              : `Click to mark completed for ${dateStr}`
          }
        >
          <span className="habit-cal-day-num">{day}</span>
          {isCompleted ? (
            <div
              className="habit-cal-mark"
              style={{ backgroundColor: habit.color || '#10B981' }}
            >
              ✓
            </div>
          ) : (
            <div className="habit-cal-unmarked-dot" />
          )}
        </div>
      );
    }

    const monthLabel = monthFirstDay.toLocaleDateString('en-US', {
      month: 'long',
      year: 'numeric',
    });

    return (
      <div>
        {/* Month Navigation */}
        <div className="habit-cal-nav">
          <div className="habit-cal-month-title">
            <Calendar size={16} color="var(--primary-color)" />
            <span>{monthLabel}</span>
          </div>

          <div className="habit-cal-nav-btns">
            <button
              type="button"
              onClick={() => changeHabitMonth(habit.id, -1)}
              className="habit-cal-nav-btn"
              title="Previous Month"
            >
              <ChevronLeft size={16} />
            </button>

            {(year !== currentYear || month !== currentMonth) && (
              <button
                type="button"
                onClick={() => resetHabitMonthToToday(habit.id)}
                className="habit-cal-today-btn"
              >
                Today
              </button>
            )}

            <button
              type="button"
              onClick={() => changeHabitMonth(habit.id, 1)}
              className="habit-cal-nav-btn"
              title="Next Month"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>

        {/* Days of Week Header */}
        <div className="habit-calendar-grid" style={{ marginBottom: '6px' }}>
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d) => (
            <div key={d} className="habit-cal-weekday-header">
              {d}
            </div>
          ))}
        </div>

        {/* Calendar Grid Cells */}
        <div className="habit-calendar-grid">{cells}</div>
      </div>
    );
  };

  const getIconComponent = (iconId) => {
    const found = HABIT_ICONS.find((i) => i.id === iconId);
    return found ? found.component : Flame;
  };

  return (
    <div className="habits-page-container">
      {/* 1. Header Banner */}
      <div className="habits-banner-card card">
        <div>
          <span className="habits-banner-tag">
            <Flame size={13} /> Habit Mastery Engine
          </span>
          <h1 className="habits-banner-title">
            <Sparkles size={24} color="#10B981" /> Habits & Daily Disciplines
          </h1>
          <p className="habits-banner-sub">
            Build unshakeable momentum with individual calendars, daily streak tracking, and instant completion check-ins.
          </p>
        </div>

        <button onClick={handleOpenAdd} className="habits-btn-add">
          <Plus size={16} /> New Habit
        </button>
      </div>

      {/* 2. Overview Performance Stats */}
      <div className="habits-stats-grid">
        <div className="habits-stat-card card">
          <div
            className="habits-stat-icon-wrap"
            style={{ background: 'rgba(16, 185, 129, 0.15)', color: '#10B981' }}
          >
            <Flame size={22} />
          </div>
          <div>
            <div className="habits-stat-val" style={{ color: '#10B981' }}>
              {overallStats.maxCurrentStreak} {overallStats.maxCurrentStreak === 1 ? 'Day' : 'Days'}
            </div>
            <div className="habits-stat-lbl">Longest Active Streak</div>
          </div>
        </div>

        <div className="habits-stat-card card">
          <div
            className="habits-stat-icon-wrap"
            style={{ background: 'rgba(245, 158, 11, 0.15)', color: '#F59E0B' }}
          >
            <Trophy size={22} />
          </div>
          <div>
            <div className="habits-stat-val" style={{ color: '#F59E0B' }}>
              {overallStats.maxBestStreak} {overallStats.maxBestStreak === 1 ? 'Day' : 'Days'}
            </div>
            <div className="habits-stat-lbl">All-Time Best Streak</div>
          </div>
        </div>

        <div className="habits-stat-card card">
          <div
            className="habits-stat-icon-wrap"
            style={{ background: 'rgba(59, 130, 246, 0.15)', color: '#3B82F6' }}
          >
            <Target size={22} />
          </div>
          <div>
            <div className="habits-stat-val" style={{ color: '#3B82F6' }}>
              {overallStats.monthlyCompliance}%
            </div>
            <div className="habits-stat-lbl">This Month Compliance</div>
          </div>
        </div>

        <div className="habits-stat-card card">
          <div
            className="habits-stat-icon-wrap"
            style={{ background: 'rgba(139, 92, 246, 0.15)', color: '#8B5CF6' }}
          >
            <CheckCircle2 size={22} />
          </div>
          <div>
            <div className="habits-stat-val">
              {overallStats.totalCheckinsThisMonth}
            </div>
            <div className="habits-stat-lbl">Total Check-Ins This Month</div>
          </div>
        </div>
      </div>

      {/* 3. Today's Quick Check-In Bar */}
      {habits.length > 0 && (
        <div className="habits-quick-card card">
          <div className="habits-quick-heading">
            <div className="habits-quick-title">
              <CheckCircle2 size={18} color="#10B981" /> Today's Check-In ({todayDateStr})
            </div>
            <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
              1-Click Mark Today Done
            </span>
          </div>

          <div className="habits-quick-row">
            {habits.map((habit) => {
              const isDone = (habit.logs || []).some(
                (l) => l.date === todayDateStr && l.completed
              );
              const IconComp = getIconComponent(habit.icon);

              return (
                <div
                  key={habit.id}
                  className={`habits-quick-item ${isDone ? 'is-done' : ''}`}
                >
                  <div className="flex items-center gap-2.5 overflow-hidden">
                    <div
                      style={{
                        color: habit.color || '#10B981',
                        display: 'flex',
                        alignItems: 'center',
                      }}
                    >
                      <IconComp size={18} />
                    </div>
                    <div className="overflow-hidden">
                      <div
                        style={{
                          fontSize: '0.85rem',
                          fontWeight: 700,
                          color: 'var(--text-primary)',
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                        }}
                      >
                        {habit.name}
                      </div>
                      {habit.targetTime && (
                        <div
                          style={{
                            fontSize: '0.72rem',
                            color: 'var(--text-muted)',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '3px',
                          }}
                        >
                          <Clock size={11} /> {habit.targetTime}
                        </div>
                      )}
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleToggleDate(habit.id, todayDateStr)}
                    className={`habits-quick-check-btn ${isDone ? 'checked' : ''}`}
                    title={isDone ? 'Completed today! Click to uncheck' : 'Click to complete for today'}
                  >
                    {isDone ? <Check size={16} strokeWidth={3} /> : null}
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 4. Filter & Search Bar */}
      <div className="habits-filter-bar card">
        <div className="flex flex-wrap gap-1 items-center">
          <button
            type="button"
            onClick={() => setSelectedCategory('All')}
            className={`habits-cat-pill ${selectedCategory === 'All' ? 'active' : ''}`}
          >
            All Habits ({habits.length})
          </button>
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setSelectedCategory(cat)}
              className={`habits-cat-pill ${selectedCategory === cat ? 'active' : ''}`}
            >
              {cat}
            </button>
          ))}
        </div>

        <div style={{ position: 'relative', width: '220px' }}>
          <Search
            size={14}
            color="var(--text-muted)"
            style={{ position: 'absolute', left: '10px', top: '10px' }}
          />
          <input
            type="text"
            placeholder="Search habits..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="form-input"
            style={{ paddingLeft: '32px', fontSize: '0.82rem' }}
          />
        </div>
      </div>

      {/* 5. Individual Habit Calendar Cards */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--text-muted)' }}>
          <Sparkles size={28} color="#10B981" className="mx-auto mb-2 animate-spin" />
          <div>Loading individual habit calendars and streaks...</div>
        </div>
      ) : filteredHabits.length === 0 ? (
        <div
          className="card"
          style={{ textAlign: 'center', padding: '50px 20px', borderRadius: '16px' }}
        >
          <Flame size={48} color="#10B981" style={{ opacity: 0.5, margin: '0 auto 12px' }} />
          <h3 style={{ fontSize: '1.15rem', fontWeight: 800, margin: 0 }}>
            No habits found
          </h3>
          <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
            Start building your daily streaks. Create a habit like "Wake up at 5:00 AM".
          </p>
          <button onClick={handleOpenAdd} className="habits-btn-add mx-auto mt-4">
            <Plus size={16} /> Create First Habit
          </button>
        </div>
      ) : (
        <div className="habits-cards-list">
          {filteredHabits.map((habit) => {
            const IconComp = getIconComponent(habit.icon);
            const currentStreak = habit.currentStreak || 0;
            const bestStreak = habit.longestStreak || 0;
            const thisMonthCount = habit.thisMonthCompleted || 0;
            const totalCount = habit.totalCompleted || 0;

            return (
              <div
                key={habit.id}
                className="habit-calendar-card card"
                style={{
                  borderLeftColor: habit.color || '#10B981',
                  borderLeftWidth: '5px',
                }}
              >
                {/* Header */}
                <div className="habit-card-header">
                  <div className="habit-card-header-left">
                    <div
                      className="habit-icon-badge"
                      style={{
                        backgroundColor: `${habit.color || '#10B981'}1A`,
                        color: habit.color || '#10B981',
                        border: `1px solid ${habit.color || '#10B981'}33`,
                      }}
                    >
                      <IconComp size={22} />
                    </div>

                    <div>
                      <h3 className="habit-title">
                        {habit.name}
                      </h3>

                      <div className="habit-meta-row">
                        <span
                          className="habit-cat-tag"
                          style={{
                            backgroundColor: `${habit.color || '#10B981'}1A`,
                            color: habit.color || '#10B981',
                          }}
                        >
                          {habit.category || 'Discipline'}
                        </span>

                        {habit.targetTime && (
                          <span className="habit-time-tag">
                            <Clock size={12} /> Target: {habit.targetTime}
                          </span>
                        )}

                        {habit.description && (
                          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                            • {habit.description}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => handleOpenEdit(habit)}
                      className="btn-icon p-1.5 text-secondary hover:text-primary"
                      title="Edit Habit"
                    >
                      <Edit2 size={15} />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteHabit(habit.id, habit.name)}
                      className="btn-icon p-1.5 text-red-500 hover:text-red-600"
                      title="Delete Habit"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>

                {/* Streak & Performance Header (Directly above the calendar) */}
                <div className="habit-streak-strip">
                  <div className="habit-streak-col">
                    <div className="habit-streak-val" style={{ color: '#10B981' }}>
                      <Flame size={18} /> {currentStreak} {currentStreak === 1 ? 'Day' : 'Days'}
                    </div>
                    <div className="habit-streak-lbl">Current Streak</div>
                  </div>

                  <div className="habit-streak-col">
                    <div className="habit-streak-val" style={{ color: '#F59E0B' }}>
                      <Trophy size={18} /> {bestStreak} {bestStreak === 1 ? 'Day' : 'Days'}
                    </div>
                    <div className="habit-streak-lbl">Best Streak</div>
                  </div>

                  <div className="habit-streak-col">
                    <div className="habit-streak-val" style={{ color: '#3B82F6' }}>
                      <Target size={18} /> {thisMonthCount} Days
                    </div>
                    <div className="habit-streak-lbl">This Month Completed</div>
                  </div>

                  <div className="habit-streak-col">
                    <div className="habit-streak-val" style={{ color: 'var(--text-primary)' }}>
                      <CheckCircle2 size={18} color="var(--primary-color)" /> {totalCount} Days
                    </div>
                    <div className="habit-streak-lbl">All-Time Check-Ins</div>
                  </div>
                </div>

                {/* Individual Full Calendar */}
                {renderHabitCalendarGrid(habit)}
              </div>
            );
          })}
        </div>
      )}

      {/* 6. Create / Edit Habit Modal */}
      {isModalOpen && (
        <div className="habit-modal-overlay" onClick={() => setIsModalOpen(false)}>
          <div className="habit-modal-card card" onClick={(e) => e.stopPropagation()}>
            <div className="habit-modal-header">
              <div className="flex items-center gap-2.5">
                <div
                  style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: '10px',
                    backgroundColor: 'rgba(16, 185, 129, 0.15)',
                    color: '#10B981',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Flame size={18} />
                </div>
                <div>
                  <h2 className="habit-modal-title">
                    {editingHabit ? 'Edit Habit' : 'Create New Habit'}
                  </h2>
                </div>
              </div>

              <button
                type="button"
                className="btn-icon"
                onClick={() => setIsModalOpen(false)}
              >
                <CloseIcon size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmitHabit} className="flex flex-col gap-3.5">
              {/* Habit Name */}
              <div className="form-group mb-0">
                <label className="form-label">
                  Habit Name *
                </label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. Wake up at 5:00 AM, Morning Workout, Read 20 Pages"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  required
                />
              </div>

              {/* Target Time & Category */}
              <div className="grid grid-cols-2 gap-3">
                <div className="form-group mb-0">
                  <label className="form-label">
                    Target Time (Optional)
                  </label>
                  <input
                    type="time"
                    className="form-input"
                    value={formTime}
                    onChange={(e) => setFormTime(e.target.value)}
                  />
                </div>

                <div className="form-group mb-0">
                  <label className="form-label">
                    Category
                  </label>
                  <select
                    className="form-select"
                    value={formCat}
                    onChange={(e) => setFormCat(e.target.value)}
                  >
                    {CATEGORIES.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Theme Color Picker */}
              <div className="form-group mb-0">
                <label className="form-label">
                  Theme Color
                </label>
                <div className="habit-color-swatches">
                  {HABIT_COLORS.map((col) => (
                    <button
                      key={col.hex}
                      type="button"
                      onClick={() => setFormColor(col.hex)}
                      className={`habit-color-btn ${formColor === col.hex ? 'active' : ''}`}
                      style={{ backgroundColor: col.hex }}
                      title={col.name}
                    />
                  ))}
                </div>
              </div>

              {/* Icon Selector */}
              <div className="form-group mb-0">
                <label className="form-label">
                  Habit Icon
                </label>
                <div className="flex gap-2 flex-wrap">
                  {HABIT_ICONS.map((ic) => {
                    const Comp = ic.component;
                    const isSelected = formIcon === ic.id;
                    return (
                      <button
                        key={ic.id}
                        type="button"
                        onClick={() => setFormIcon(ic.id)}
                        className="btn-icon p-2 rounded-lg border transition-all"
                        style={{
                          borderColor: isSelected ? formColor : 'var(--border-color)',
                          backgroundColor: isSelected ? `${formColor}22` : 'var(--page-bg)',
                          color: isSelected ? formColor : 'var(--text-secondary)',
                        }}
                        title={ic.label}
                      >
                        <Comp size={18} />
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Motivation / Description */}
              <div className="form-group mb-0">
                <label className="form-label">
                  Notes / Motivation Principle (Optional)
                </label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. 5:00 AM wake up unlocks deep focus before the world wakes up"
                  value={formDesc}
                  onChange={(e) => setFormDesc(e.target.value)}
                />
              </div>

              {/* Footer */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'flex-end',
                  gap: '10px',
                  marginTop: '10px',
                  paddingTop: '14px',
                  borderTop: '1px solid var(--border-color)',
                }}
              >
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setIsModalOpen(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  style={{ backgroundColor: formColor, borderColor: formColor }}
                  disabled={submitting}
                >
                  {submitting ? 'Saving...' : editingHabit ? 'Save Changes' : 'Create Habit'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
export default HabitsPage;
