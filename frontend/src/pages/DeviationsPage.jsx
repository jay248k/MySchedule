import React, { useState, useMemo } from 'react';
import {
  AlertCircle,
  Clock,
  Plus,
  Trash2,
  Edit2,
  Calendar,
  ChevronLeft,
  ChevronRight,
  ArrowRight,
  Sparkles,
  HelpCircle,
  Lightbulb,
  X,
  Target,
  CheckCircle2,
  AlertTriangle,
  Flame,
  TrendingDown,
  Layers,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { formatDate, getTodayDateString } from '../utils/dateUtils';
import { CustomSelect } from '../components/common/CustomSelect';
import '../styles/pages/deviations.css';

const REASON_CATEGORIES = [
  { id: 'Social Media / Browsing', label: '📱 Social Media / Browsing', color: '#EF4444' },
  { id: 'Procrastination', label: '⏳ Procrastination / Delaying', color: '#F59E0B' },
  { id: 'Fatigue / Burnout', label: '🥱 Fatigue / Low Energy', color: '#8B5CF6' },
  { id: 'Unexpected Interruption', label: '🚨 Unexpected Interruption', color: '#EC4899' },
  { id: 'Phone Call / Chat', label: '💬 Phone Call / Chatting', color: '#06B6D4' },
  { id: 'Over-engineering / Rabbit Hole', label: '⚙️ Over-engineering / Rabbit Hole', color: '#3B82F6' },
  { id: 'Productive Divergence', label: '🌟 Productive Alternative Work', color: '#10B981' },
  { id: 'Other', label: '❓ Other Reason', color: '#64748B' },
];

const cleanRootCause = (rc) => {
  if (!rc) return '';
  const parts = rc.split(';').map((s) => s.trim()).filter(Boolean);
  return Array.from(new Set(parts)).join('; ');
};

export function DeviationsPage() {
  const {
    tasks = [],
    selectedDate,
    setSelectedDate,
    deviations = [],
    addDeviation,
    updateDeviation,
    deleteDeviation,
  } = useApp();

  const todayStr = getTodayDateString();
  const activeDate = selectedDate || todayStr;
  const isToday = activeDate === todayStr;

  // Filter deviations for active date
  const dateDeviations = useMemo(
    () => deviations.filter((d) => d.date === activeDate),
    [deviations, activeDate]
  );

  // Today's scheduled tasks for picking
  const dateTasks = useMemo(
    () => tasks.filter((t) => t.date === activeDate),
    [tasks, activeDate]
  );

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);

  // Form State
  const [form, setForm] = useState({
    date: activeDate,
    startTime: '10:00',
    endTime: '11:00',
    plannedAction: '',
    actualAction: '',
    reasonCategory: 'Deviation',
    rootCause: '',
    lessonLearned: '',
    deviationType: 'unproductive',
    taskId: '',
  });

  // Scheduled tasks for quick picking (active date first, or all tasks)
  const selectableTasks = useMemo(() => {
    const forDate = tasks.filter((t) => t.date === activeDate);
    return forDate.length > 0 ? forDate : tasks;
  }, [tasks, activeDate]);

  // Calculate duration in minutes
  const formDurationMinutes = useMemo(() => {
    if (!form.startTime || !form.endTime) return 60;
    const [sh, sm] = form.startTime.split(':').map(Number);
    const [eh, em] = form.endTime.split(':').map(Number);
    const diff = (eh * 60 + em) - (sh * 60 + sm);
    return diff > 0 ? diff : 60;
  }, [form.startTime, form.endTime]);

  // Statistics
  const totalMinutesLost = useMemo(() => {
    return dateDeviations.reduce((acc, d) => acc + (Number(d.durationMinutes) || 0), 0);
  }, [dateDeviations]);
  const hoursLost = Math.floor(totalMinutesLost / 60);
  const minsLost = totalMinutesLost % 60;

  const handleOpenAddModal = (task = null) => {
    setEditingId(null);
    setForm({
      date: task?.date || activeDate,
      startTime: task?.startTime || '10:00',
      endTime: task?.endTime || '11:00',
      plannedAction: task?.title || '',
      actualAction: '',
      reasonCategory: task?.category || 'Deviation',
      rootCause: '',
      lessonLearned: '',
      deviationType: 'unproductive',
      taskId: task?.id || '',
    });
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (dev) => {
    setEditingId(dev.id);
    setForm({
      date: dev.date,
      startTime: dev.startTime,
      endTime: dev.endTime,
      plannedAction: dev.plannedAction,
      actualAction: dev.actualAction,
      reasonCategory: dev.reasonCategory || 'Deviation',
      rootCause: dev.rootCause || '',
      lessonLearned: dev.lessonLearned || '',
      deviationType: dev.deviationType || 'unproductive',
      taskId: dev.taskId || '',
    });
    setIsModalOpen(true);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const payload = {
      ...form,
      durationMinutes: formDurationMinutes,
    };

    if (editingId) {
      updateDeviation(editingId, payload);
    } else {
      addDeviation(payload);
    }
    setIsModalOpen(false);
  };

  const formattedDateTitle = formatDate(activeDate, {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  return (
    <div className="deviations-container">
      {/* Top Header Bar */}
      <div className="deviations-header">
        <div>
          <div className="deviations-title-wrap">
            <h1 className="deviations-title">
              Schedule Deviations & Mistakes Log
            </h1>
            <span className="deviations-badge-planned">
              PLANNED VS ACTUAL
            </span>
          </div>
          <p className="deviations-subtitle">
            Record specific timeslots where you were supposed to do one task, but ended up doing something else instead.
          </p>
        </div>

        {/* Date Selector & Add Button */}
        <div className="deviations-header-actions">
          {/* Day Stepper */}
          <div className="deviations-day-stepper">
            <button
              type="button"
              className="btn-icon"
              onClick={() => {
                const d = new Date(activeDate + 'T00:00:00');
                d.setDate(d.getDate() - 1);
                const y = d.getFullYear();
                const m = String(d.getMonth() + 1).padStart(2, '0');
                const day = String(d.getDate()).padStart(2, '0');
                setSelectedDate(`${y}-${m}-${day}`);
              }}
              title="Previous Day"
            >
              <ChevronLeft size={14} />
            </button>
            <span className="deviations-stepper-label">
              {isToday ? `Today (${formatDate(activeDate, { month: 'short', day: 'numeric' })})` : formattedDateTitle}
            </span>
            <button
              type="button"
              className="btn-icon"
              onClick={() => {
                const d = new Date(activeDate + 'T00:00:00');
                d.setDate(d.getDate() + 1);
                const y = d.getFullYear();
                const m = String(d.getMonth() + 1).padStart(2, '0');
                const day = String(d.getDate()).padStart(2, '0');
                setSelectedDate(`${y}-${m}-${day}`);
              }}
              title="Next Day"
            >
              <ChevronRight size={14} />
            </button>
            {!isToday && (
              <button
                type="button"
                className="btn btn-ghost btn-xs deviations-today-btn"
                onClick={() => setSelectedDate(todayStr)}
              >
                Today
              </button>
            )}
          </div>

          <button
            type="button"
            className="btn btn-primary btn-sm deviations-add-btn"
            onClick={() => handleOpenAddModal()}
          >
            <Plus size={14} />
            <span>Log Deviation</span>
          </button>
        </div>
      </div>

      {/* KPI Cards Strip */}
      <div className="deviations-kpi-grid">
        {/* Card 1: Mistakes / Deviations */}
        <div className="deviations-kpi-card kpi-red">
          <div className="deviations-kpi-header">
            <span className="deviations-kpi-label">
              Mistakes / Deviations
            </span>
            <div className="deviations-kpi-icon-wrap icon-red">
              <AlertCircle size={13} />
            </div>
          </div>
          <div>
            <div className="deviations-kpi-value-row">
              <span className="deviations-kpi-val">
                {dateDeviations.length}
              </span>
              <span className="deviations-kpi-unit">
                {dateDeviations.length === 1 ? 'Event' : 'Events'}
              </span>
            </div>
            <div className="deviations-kpi-sub">
              Logged for {isToday ? 'today' : formattedDateTitle}
            </div>
          </div>
        </div>

        {/* Card 2: Total Diverted Time */}
        <div className="deviations-kpi-card kpi-amber">
          <div className="deviations-kpi-header">
            <span className="deviations-kpi-label">
              Total Diverted Time
            </span>
            <div className="deviations-kpi-icon-wrap icon-amber">
              <Clock size={13} />
            </div>
          </div>
          <div>
            <div className="deviations-kpi-value-row">
              <span className="deviations-kpi-val">
                {hoursLost > 0 ? `${hoursLost}h ${minsLost}m` : `${minsLost}`}
              </span>
              {hoursLost === 0 && (
                <span className="deviations-kpi-unit">
                  mins
                </span>
              )}
            </div>
            <div className="deviations-kpi-sub">
              Time spent away from plan
            </div>
          </div>
        </div>

        {/* Card 3: Scheduled Tasks Today */}
        <div className="deviations-kpi-card kpi-blue">
          <div className="deviations-kpi-header">
            <span className="deviations-kpi-label">
              Scheduled Tasks
            </span>
            <div className="deviations-kpi-icon-wrap icon-blue">
              <Target size={13} />
            </div>
          </div>
          <div>
            <div className="deviations-kpi-value-row">
              <span className="deviations-kpi-val">
                {dateTasks.length}
              </span>
              <span className="deviations-kpi-unit">
                Planned
              </span>
            </div>
            <div className="deviations-kpi-sub">
              Tasks available on schedule
            </div>
          </div>
        </div>

        {/* Card 4: Lessons Recorded */}
        <div className="deviations-kpi-card kpi-green">
          <div className="deviations-kpi-header">
            <span className="deviations-kpi-label">
              Lessons Recorded
            </span>
            <div className="deviations-kpi-icon-wrap icon-green">
              <Sparkles size={13} />
            </div>
          </div>
          <div>
            <div className="deviations-kpi-value-row">
              <span className="deviations-kpi-val">
                {dateDeviations.filter((d) => Boolean(d.lessonLearned)).length}
              </span>
              <span className="deviations-kpi-unit">
                Lessons
              </span>
            </div>
            <div className="deviations-kpi-sub">
              Insights to prevent repeats
            </div>
          </div>
        </div>
      </div>

      {/* Main List of Deviations */}
      <div className="deviations-list-section">
        <div className="flex justify-between items-center">
          <h2 className="deviations-list-title">
            Logged Deviations for {isToday ? 'Today' : formattedDateTitle} ({dateDeviations.length})
          </h2>
        </div>

        {dateDeviations.length === 0 ? (
          <div className="deviations-empty-card">
            <div className="deviations-empty-icon">
              <CheckCircle2 size={18} />
            </div>
            <div className="deviations-empty-heading">
              No Schedule Deviations Logged for This Day!
            </div>
            <p className="deviations-empty-text">
              If you had a timeslot where you were supposed to work on something, but did something else instead, record it here to track habits and lessons learned.
            </p>
            <button
              type="button"
              className="btn btn-primary btn-sm deviations-add-btn"
              onClick={() => handleOpenAddModal()}
            >
              <Plus size={13} /> Log First Deviation
            </button>
          </div>
        ) : (
          <div className="deviations-cards-grid">
            {dateDeviations.map((dev, idx) => {
              const durM = Number(dev.durationMinutes) || 60;
              const h = Math.floor(durM / 60);
              const m = durM % 60;
              const durationLabel = h > 0 ? `${h}h ${m}m` : `${m}m`;
              const categoryMatch = REASON_CATEGORIES.find((c) => c.id === dev.reasonCategory) || {
                label: dev.reasonCategory || 'Deviation Event',
                color: '#EF4444',
              };
              const rootCauseClean = cleanRootCause(dev.rootCause);

              return (
                <div key={dev.id} className="deviation-card">
                  {/* Top Bar: Incident Badge, Date/Time, Category & Action Icons */}
                  <div className="deviation-top-bar">
                    <div className="deviation-tags-wrap">
                      {/* Incident Tag */}
                      <span className="deviation-incident-tag">
                        <span className="deviation-incident-dot" />
                        INCIDENT #{idx + 1}
                      </span>

                      {/* Date Tag */}
                      <span className="deviation-date-tag">
                        <Calendar size={11} color="var(--primary-color)" />
                        <span>{dev.date}</span>
                      </span>

                      {/* Time & Duration Pill */}
                      <span className="deviation-time-tag">
                        <Clock size={11} />
                        <span>{dev.startTime} — {dev.endTime}</span>
                        <span style={{ opacity: 0.75 }}>• {durationLabel}</span>
                      </span>

                      {/* Category Chip */}
                      <span
                        className="deviation-category-chip"
                        style={{
                          background: `${categoryMatch.color}15`,
                          border: `1px solid ${categoryMatch.color}35`,
                          color: categoryMatch.color,
                        }}
                      >
                        {categoryMatch.label}
                      </span>
                    </div>

                    {/* Action Buttons */}
                    <div className="deviation-actions">
                      <button
                        type="button"
                        onClick={() => handleOpenEditModal(dev)}
                        title="Edit deviation details"
                        className="deviation-btn-edit"
                      >
                        <Edit2 size={13} />
                      </button>
                      <button
                        type="button"
                        onClick={() => deleteDeviation(dev.id)}
                        title="Delete log"
                        className="deviation-btn-delete"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>

                  {/* Modern Divergence Flow: Planned Schedule ➔ Actual Deviation */}
                  <div className="deviation-flow-grid">
                    {/* Planned Box */}
                    <div className="deviation-planned-box">
                      <div className="deviation-box-label-blue">
                        <Target size={12} color="#38BDF8" />
                        <span>Planned Commitment</span>
                      </div>
                      <div className="deviation-planned-text">
                        {dev.plannedAction}
                      </div>
                    </div>

                    {/* Actual Deviation Box */}
                    <div className="deviation-actual-box">
                      <div className="deviation-box-label-amber">
                        <AlertTriangle size={12} color="#F59E0B" />
                        <span>Actual Activity (Mistake)</span>
                      </div>
                      <div className="deviation-actual-text">
                        {dev.actualAction}
                      </div>
                    </div>
                  </div>

                  {/* Root Cause & Next-Time Prevention Rule */}
                  {(rootCauseClean || dev.lessonLearned) && (
                    <div
                      className="deviation-insights-box"
                      style={{
                        gridTemplateColumns: rootCauseClean && dev.lessonLearned ? 'repeat(auto-fit, minmax(210px, 1fr))' : '1fr',
                      }}
                    >
                      {rootCauseClean && (
                        <div className="deviation-insight-col">
                          <div className="deviation-insight-label-gray">
                            <HelpCircle size={12} color="#94A3B8" />
                            <span>Root Cause Trigger</span>
                          </div>
                          <span className="deviation-insight-val-gray">
                            {rootCauseClean}
                          </span>
                        </div>
                      )}

                      {dev.lessonLearned && (
                        <div className="deviation-insight-col">
                          <div className="deviation-insight-label-green">
                            <Lightbulb size={12} color="#10B981" />
                            <span>Next-Time Prevention Rule</span>
                          </div>
                          <span className="deviation-insight-val-green">
                            {dev.lessonLearned}
                          </span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Modal: Add or Edit Deviation */}
      {isModalOpen && (
        <div
          className="deviation-modal-overlay"
          onClick={(e) => {
            if (e.target === e.currentTarget) setIsModalOpen(false);
          }}
        >
          <div className="deviation-modal-dialog">
            {/* Header */}
            <div className="deviation-modal-header">
              <div className="deviation-modal-title-wrap">
                <div className="deviation-modal-icon-badge">
                  <AlertTriangle size={20} />
                </div>
                <div>
                  <h3 className="deviation-modal-title">
                    {editingId ? 'Edit Deviation Log' : 'Log Schedule Mistake / Deviation'}
                  </h3>
                  <div className="deviation-modal-subtitle">
                    Write what you had to do vs what you actually did in this timeslot
                  </div>
                </div>
              </div>

              <button
                type="button"
                className="btn-icon"
                onClick={() => setIsModalOpen(false)}
              >
                <X size={20} />
              </button>
            </div>

            {/* Modal Body Form */}
            <form onSubmit={handleSubmit} className="deviation-modal-form">
              {/* Task Selection (Only task selection option) */}
              <div className="deviation-form-section">
                <label className="deviation-label-with-icon">
                  <Target size={14} color="var(--primary-color)" />
                  <span>Select Scheduled Task</span>
                </label>
                <CustomSelect
                  value={form.taskId || ''}
                  onChange={(selectedId) => {
                    if (!selectedId) {
                      setForm((prev) => ({ ...prev, taskId: '', plannedAction: '', reasonCategory: 'Deviation' }));
                      return;
                    }
                    const t = selectableTasks.find((item) => item.id === selectedId);
                    if (t) {
                      setForm((prev) => ({
                        ...prev,
                        plannedAction: t.title,
                        taskId: t.id,
                        reasonCategory: t.category || 'Deviation',
                        ...(t.startTime && { startTime: t.startTime }),
                        ...(t.endTime && { endTime: t.endTime }),
                        ...(t.date && { date: t.date }),
                      }));
                    }
                  }}
                  placeholder="-- Choose a scheduled task --"
                  searchPlaceholder="Search scheduled tasks..."
                  isClearable={true}
                  options={[
                    { value: '', label: '-- Choose a scheduled task or write manually --' },
                    ...selectableTasks.map((t) => ({
                      value: t.id,
                      label: t.title,
                      description: `${t.startTime || 'No time'}${t.endTime ? ` - ${t.endTime}` : ''} • ${t.category || 'Task'}`,
                      color: t.color || '#3B82F6',
                    })),
                  ]}
                />
              </div>

              {/* Date & Time Slot Grid with Dynamic Duration */}
              <div className="deviation-form-section">
                <div className="deviation-time-grid">
                  <div>
                    <label className="deviation-label-with-icon">
                      <Calendar size={13} color="var(--primary-color)" />
                      Date
                    </label>
                    <input
                      type="date"
                      className="form-input"
                      value={form.date}
                      onChange={(e) => setForm({ ...form, date: e.target.value })}
                      required
                    />
                  </div>

                  <div>
                    <label className="deviation-label-with-icon">
                      <Clock size={13} color="var(--primary-color)" />
                      Start Time
                    </label>
                    <input
                      type="time"
                      className="form-input"
                      value={form.startTime}
                      onChange={(e) => setForm({ ...form, startTime: e.target.value })}
                      required
                    />
                  </div>

                  <div>
                    <label className="deviation-label-with-icon">
                      <Clock size={13} color="var(--primary-color)" />
                      End Time
                    </label>
                    <input
                      type="time"
                      className="form-input"
                      value={form.endTime}
                      onChange={(e) => setForm({ ...form, endTime: e.target.value })}
                      required
                    />
                  </div>
                </div>

                {/* Duration indicator pill */}
                <div className="deviation-duration-pill">
                  <span className="deviation-duration-label">
                    <AlertCircle size={14} /> Total Diverted Timeslot:
                  </span>
                  <span className="deviation-duration-val">
                    {Math.floor(formDurationMinutes / 60) > 0 ? `${Math.floor(formDurationMinutes / 60)}h ` : ''}{formDurationMinutes % 60}m ({formDurationMinutes} mins)
                  </span>
                </div>
              </div>

              {/* Comparative Section: Planned vs Actual Mistake */}
              <div className="deviation-compare-grid">
                {/* 1. Planned Task Card */}
                <div className="deviation-compare-planned">
                  <label className="flex items-center gap-2 text-xs font-extrabold text-blue-400">
                    <Target size={15} />
                    <span>What I Was Supposed To Do (Planned):</span>
                  </label>
                  <input
                    type="text"
                    placeholder="Enter planned task commitment..."
                    className="form-input"
                    value={form.plannedAction}
                    onChange={(e) => setForm({ ...form, plannedAction: e.target.value })}
                    required
                  />
                  <span className="text-xs text-muted">
                    Original planned schedule commitment
                  </span>
                </div>

                {/* 2. What I Actually Did (The Mistake) */}
                <div className="deviation-compare-actual">
                  <label className="flex items-center gap-2 text-xs font-extrabold text-amber-500">
                    <AlertTriangle size={15} />
                    <span>What I Actually Did Instead (The Mistake):</span>
                  </label>
                  <input
                    type="text"
                    placeholder="Enter what was done instead..."
                    className="form-input"
                    value={form.actualAction}
                    onChange={(e) => setForm({ ...form, actualAction: e.target.value })}
                    required
                  />
                  <span className="text-xs text-muted">
                    What actually diverted your focus
                  </span>
                </div>
              </div>

              {/* Root Cause Section (Clean input, no unwanted preset chips) */}
              <div className="deviation-rootcause-section">
                <label className="deviation-label-with-icon">
                  <HelpCircle size={14} color="var(--primary-color)" />
                  <span>Why Did This Happen? (Root Cause):</span>
                </label>
                <textarea
                  rows={2}
                  className="form-textarea"
                  placeholder="Detail the root friction or trigger (e.g. felt tired, task felt unclear, got interrupted)..."
                  value={form.rootCause}
                  onChange={(e) => setForm({ ...form, rootCause: e.target.value })}
                />
              </div>

              {/* Actionable Lesson Learned */}
              <div className="deviation-lesson-section">
                <label className="flex items-center gap-2 text-xs font-extrabold text-emerald-500">
                  <Lightbulb size={16} />
                  <span>How Will I Avoid This Next Time? (Actionable Lesson):</span>
                </label>
                <textarea
                  rows={2}
                  className="form-textarea"
                  placeholder="Enter preventive rule or corrective step to stay on track next time..."
                  value={form.lessonLearned}
                  onChange={(e) => setForm({ ...form, lessonLearned: e.target.value })}
                />
              </div>

              {/* Footer Actions */}
              <div className="deviation-modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setIsModalOpen(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary deviation-submit-btn"
                >
                  {editingId ? 'Update Deviation Log' : 'Save Deviation Log'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
