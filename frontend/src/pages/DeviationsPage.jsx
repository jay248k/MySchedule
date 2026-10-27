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
    reasonCategory: 'Social Media / Browsing',
    rootCause: '',
    lessonLearned: '',
    deviationType: 'unproductive',
    taskId: '',
  });

  // Calculate duration in minutes
  const formDurationMinutes = useMemo(() => {
    if (!form.startTime || !form.endTime) return 60;
    const [sh, sm] = form.startTime.split(':').map(Number);
    const [eh, em] = form.endTime.split(':').map(Number);
    const diff = (eh * 60 + em) - (sh * 60 + sm);
    return diff > 0 ? diff : 60;
  }, [form.startTime, form.endTime]);

  // Statistics
  const totalMinutesLost = useMemo(
    () => dateDeviations.reduce((acc, d) => acc + (Number(d.durationMinutes) || 0), 0),
    [dateDeviations]
  );

  const hoursLost = Math.floor(totalMinutesLost / 60);
  const minsLost = totalMinutesLost % 60;

  const handleOpenAddModal = (presetTask = null) => {
    setEditingId(null);
    setForm({
      date: activeDate,
      startTime: presetTask?.startTime || '10:00',
      endTime: presetTask?.endTime || '11:00',
      plannedAction: presetTask ? presetTask.title : '',
      actualAction: '',
      reasonCategory: 'Social Media / Browsing',
      rootCause: '',
      lessonLearned: '',
      deviationType: 'unproductive',
      taskId: presetTask?.id || '',
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
      reasonCategory: dev.reasonCategory || 'Social Media / Browsing',
      rootCause: dev.rootCause || '',
      lessonLearned: dev.lessonLearned || '',
      deviationType: dev.deviationType || 'unproductive',
      taskId: dev.taskId || '',
    });
    setIsModalOpen(true);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.plannedAction.trim() || !form.actualAction.trim()) {
      return;
    }

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
    <div style={{ display: 'flex', flexDirection: 'column', gap: '22px', paddingBottom: '36px' }}>
      {/* Top Header Bar */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '14px',
          paddingBottom: '10px',
          borderBottom: '1px solid var(--border-subtle, rgba(255, 255, 255, 0.08))',
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <h1 style={{ fontSize: '1.6rem', fontWeight: 800, margin: 0, color: 'var(--text-primary)' }}>
              Schedule Deviations & Mistakes Log
            </h1>
            <span
              style={{
                background: 'rgba(239, 68, 68, 0.12)',
                border: '1px solid rgba(239, 68, 68, 0.35)',
                color: '#EF4444',
                padding: '3px 10px',
                borderRadius: '999px',
                fontSize: '0.74rem',
                fontWeight: 800,
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px',
              }}
            >
              PLANNED VS ACTUAL
            </span>
          </div>
          <p style={{ margin: '4px 0 0', fontSize: '0.86rem', color: 'var(--text-secondary)' }}>
            Record specific timeslots where you were supposed to do one task, but ended up doing something else instead.
          </p>
        </div>

        {/* Date Selector & Add Button */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          {/* Day Stepper */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              background: 'var(--card-bg)',
              border: '1px solid var(--border-color)',
              borderRadius: 'var(--radius-md)',
              padding: '3px 6px',
            }}
          >
            <button
              type="button"
              className="btn-icon"
              style={{ width: '28px', height: '28px' }}
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
              <ChevronLeft size={16} />
            </button>
            <span style={{ fontSize: '0.84rem', fontWeight: 700, padding: '0 8px', color: 'var(--text-primary)' }}>
              {isToday ? `Today (${formatDate(activeDate, { month: 'short', day: 'numeric' })})` : formattedDateTitle}
            </span>
            <button
              type="button"
              className="btn-icon"
              style={{ width: '28px', height: '28px' }}
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
              <ChevronRight size={16} />
            </button>
            {!isToday && (
              <button
                type="button"
                className="btn btn-ghost btn-xs"
                onClick={() => setSelectedDate(todayStr)}
                style={{ marginLeft: '4px', fontSize: '0.74rem', padding: '2px 6px', color: 'var(--primary-color)' }}
              >
                Today
              </button>
            )}
          </div>

          <button
            type="button"
            className="btn btn-primary btn-sm"
            onClick={() => handleOpenAddModal()}
            style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            <Plus size={16} />
            <span>Log Deviation / Mistake</span>
          </button>
        </div>
      </div>

      {/* KPI Cards Strip */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))',
          gap: '16px',
        }}
      >
        {/* Card 1: Mistakes / Deviations */}
        <div
          style={{
            background: 'var(--card-bg, #1a2234)',
            border: '1px solid var(--border-color, rgba(255, 255, 255, 0.08))',
            borderLeft: '4px solid #EF4444',
            borderRadius: '16px',
            padding: '18px 22px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            gap: '12px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '0.78rem', fontWeight: 800, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Mistakes / Deviations
            </span>
            <div
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '8px',
                background: 'rgba(239, 68, 68, 0.14)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#EF4444',
              }}
            >
              <AlertCircle size={18} />
            </div>
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
              <span style={{ fontSize: '2.1rem', fontWeight: 900, color: 'var(--text-primary)', lineHeight: 1 }}>
                {dateDeviations.length}
              </span>
              <span style={{ fontSize: '0.92rem', fontWeight: 700, color: 'var(--text-secondary)' }}>
                {dateDeviations.length === 1 ? 'Event' : 'Events'}
              </span>
            </div>
            <div style={{ fontSize: '0.76rem', color: 'var(--text-muted)', marginTop: '6px' }}>
              Logged for {isToday ? 'today' : formattedDateTitle}
            </div>
          </div>
        </div>

        {/* Card 2: Total Diverted Time */}
        <div
          style={{
            background: 'var(--card-bg, #1a2234)',
            border: '1px solid var(--border-color, rgba(255, 255, 255, 0.08))',
            borderLeft: '4px solid #F59E0B',
            borderRadius: '16px',
            padding: '18px 22px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            gap: '12px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '0.78rem', fontWeight: 800, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Total Diverted Time
            </span>
            <div
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '8px',
                background: 'rgba(245, 158, 11, 0.14)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#F59E0B',
              }}
            >
              <Clock size={18} />
            </div>
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
              <span style={{ fontSize: '2.1rem', fontWeight: 900, color: 'var(--text-primary)', lineHeight: 1 }}>
                {hoursLost > 0 ? `${hoursLost}h ${minsLost}m` : `${minsLost}`}
              </span>
              {hoursLost === 0 && (
                <span style={{ fontSize: '0.92rem', fontWeight: 700, color: 'var(--text-secondary)' }}>
                  mins
                </span>
              )}
            </div>
            <div style={{ fontSize: '0.76rem', color: 'var(--text-muted)', marginTop: '6px' }}>
              Time spent away from planned schedule
            </div>
          </div>
        </div>

        {/* Card 3: Scheduled Tasks Today */}
        <div
          style={{
            background: 'var(--card-bg, #1a2234)',
            border: '1px solid var(--border-color, rgba(255, 255, 255, 0.08))',
            borderLeft: '4px solid #3B82F6',
            borderRadius: '16px',
            padding: '18px 22px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            gap: '12px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '0.78rem', fontWeight: 800, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Scheduled Tasks Today
            </span>
            <div
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '8px',
                background: 'rgba(59, 130, 246, 0.14)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#3B82F6',
              }}
            >
              <Target size={18} />
            </div>
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
              <span style={{ fontSize: '2.1rem', fontWeight: 900, color: 'var(--text-primary)', lineHeight: 1 }}>
                {dateTasks.length}
              </span>
              <span style={{ fontSize: '0.92rem', fontWeight: 700, color: 'var(--text-secondary)' }}>
                Planned
              </span>
            </div>
            <div style={{ fontSize: '0.76rem', color: 'var(--text-muted)', marginTop: '6px' }}>
              Tasks available on schedule
            </div>
          </div>
        </div>

        {/* Card 4: Lessons Recorded */}
        <div
          style={{
            background: 'var(--card-bg, #1a2234)',
            border: '1px solid var(--border-color, rgba(255, 255, 255, 0.08))',
            borderLeft: '4px solid #10B981',
            borderRadius: '16px',
            padding: '18px 22px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            gap: '12px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '0.78rem', fontWeight: 800, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Lessons Recorded
            </span>
            <div
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '8px',
                background: 'rgba(16, 185, 129, 0.14)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#10B981',
              }}
            >
              <Lightbulb size={18} />
            </div>
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
              <span style={{ fontSize: '2.1rem', fontWeight: 900, color: 'var(--text-primary)', lineHeight: 1 }}>
                {dateDeviations.filter((d) => Boolean(d.lessonLearned)).length}
              </span>
              <span style={{ fontSize: '0.92rem', fontWeight: 700, color: 'var(--text-secondary)' }}>
                Lessons
              </span>
            </div>
            <div style={{ fontSize: '0.76rem', color: 'var(--text-muted)', marginTop: '6px' }}>
              Insights to prevent repeat mistakes
            </div>
          </div>
        </div>
      </div>

      {/* Main List of Deviations */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2 style={{ fontSize: '1.2rem', fontWeight: 800, margin: 0, color: 'var(--text-primary)' }}>
            Logged Deviations for {isToday ? 'Today' : formattedDateTitle} ({dateDeviations.length})
          </h2>
        </div>

        {dateDeviations.length === 0 ? (
          <div
            style={{
              background: 'var(--card-bg)',
              border: '1px dashed var(--border-color)',
              borderRadius: '16px',
              padding: '48px 24px',
              textAlign: 'center',
              color: 'var(--text-muted)',
            }}
          >
            <div
              style={{
                width: '56px',
                height: '56px',
                borderRadius: '50%',
                background: 'rgba(16, 185, 129, 0.12)',
                color: '#10B981',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 16px',
              }}
            >
              <CheckCircle2 size={28} />
            </div>
            <div style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-primary)' }}>
              No Schedule Deviations Logged for This Day!
            </div>
            <p style={{ fontSize: '0.86rem', maxWidth: '440px', margin: '6px auto 18px', color: 'var(--text-secondary)' }}>
              If you had a timeslot where you were supposed to work on something, but did something else instead, record it here to track habits and lessons learned.
            </p>
            <button
              type="button"
              className="btn btn-primary btn-sm"
              onClick={() => handleOpenAddModal()}
              style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
            >
              <Plus size={15} /> Log First Deviation
            </button>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {dateDeviations.map((dev) => {
              const durM = Number(dev.durationMinutes) || 60;
              const h = Math.floor(durM / 60);
              const m = durM % 60;
              const durationLabel = h > 0 ? `${h}h ${m}m` : `${m}m`;

              return (
                <div
                  key={dev.id}
                  style={{
                    background: 'var(--card-bg)',
                    border: '1px solid var(--border-color)',
                    borderRadius: '16px',
                    padding: '20px 24px',
                    boxShadow: 'var(--shadow-sm)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '14px',
                  }}
                >
                  {/* Top Bar: Time Slot & Category Badges & Actions */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                      {/* Timeslot Pill */}
                      <span
                        style={{
                          background: 'rgba(59, 130, 246, 0.14)',
                          border: '1px solid rgba(59, 130, 246, 0.35)',
                          color: '#3B82F6',
                          fontSize: '0.82rem',
                          fontWeight: 800,
                          padding: '4px 10px',
                          borderRadius: '8px',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '6px',
                        }}
                      >
                        <Clock size={13} />
                        <span>{dev.startTime} — {dev.endTime}</span>
                        <span style={{ opacity: 0.7 }}>({durationLabel})</span>
                      </span>

                      {/* Type Badge */}
                      {dev.deviationType === 'productive' && (
                        <span
                          style={{
                            background: 'rgba(16, 185, 129, 0.12)',
                            color: '#10B981',
                            fontSize: '0.74rem',
                            fontWeight: 700,
                            padding: '3px 8px',
                            borderRadius: '6px',
                          }}
                        >
                          Productive Divergence
                        </span>
                      )}
                    </div>

                    {/* Actions */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <button
                        type="button"
                        className="btn-icon"
                        onClick={() => handleOpenEditModal(dev)}
                        title="Edit deviation details"
                      >
                        <Edit2 size={16} />
                      </button>
                      <button
                        type="button"
                        className="btn-icon"
                        onClick={() => deleteDeviation(dev.id)}
                        title="Delete log"
                        style={{ color: '#EF4444' }}
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>

                  {/* Planned vs Actual Comparison Boxes */}
                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
                      gap: '14px',
                    }}
                  >
                    {/* What I Was Supposed To Do (PLANNED) */}
                    <div
                      style={{
                        background: 'rgba(239, 68, 68, 0.05)',
                        border: '1.5px solid rgba(239, 68, 68, 0.25)',
                        borderRadius: '12px',
                        padding: '14px 18px',
                      }}
                    >
                      <div
                        style={{
                          fontSize: '0.72rem',
                          fontWeight: 800,
                          color: '#EF4444',
                          textTransform: 'uppercase',
                          letterSpacing: '0.06em',
                          marginBottom: '6px',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '5px',
                        }}
                      >
                        <span>❌ What I Had To Do (Planned):</span>
                      </div>
                      <div style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--text-primary)', lineHeight: 1.35 }}>
                        {dev.plannedAction}
                      </div>
                    </div>

                    {/* What I Actually Did Instead (ACTUAL) */}
                    <div
                      style={{
                        background: 'rgba(245, 158, 11, 0.08)',
                        border: '1.5px solid rgba(245, 158, 11, 0.35)',
                        borderRadius: '12px',
                        padding: '14px 18px',
                      }}
                    >
                      <div
                        style={{
                          fontSize: '0.72rem',
                          fontWeight: 800,
                          color: '#F59E0B',
                          textTransform: 'uppercase',
                          letterSpacing: '0.06em',
                          marginBottom: '6px',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '5px',
                        }}
                      >
                        <span>⚠️ What I Actually Did (Mistake / Deviation):</span>
                      </div>
                      <div style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--text-primary)', lineHeight: 1.35 }}>
                        {dev.actualAction}
                      </div>
                    </div>
                  </div>

                  {/* Root Cause & Lesson Learned Footer */}
                  {(dev.rootCause || dev.lessonLearned) && (
                    <div
                      style={{
                        background: 'var(--page-bg)',
                        border: '1px solid var(--border-color)',
                        borderRadius: '10px',
                        padding: '12px 16px',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '8px',
                        fontSize: '0.84rem',
                      }}
                    >
                      {dev.rootCause && (
                        <div>
                          <strong style={{ color: 'var(--text-primary)', marginRight: '6px' }}>
                            🔍 Why this happened (Root cause):
                          </strong>
                          <span style={{ color: 'var(--text-secondary)' }}>{dev.rootCause}</span>
                        </div>
                      )}
                      {dev.lessonLearned && (
                        <div>
                          <strong style={{ color: '#10B981', marginRight: '6px' }}>
                            💡 Next time fix / Lesson learned:
                          </strong>
                          <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>
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
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 1000,
            backgroundColor: 'rgba(0,0,0,0.72)',
            backdropFilter: 'blur(8px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '16px',
            animation: 'fadeIn 0.2s ease-out',
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget) setIsModalOpen(false);
          }}
        >
          <div
            style={{
              width: '100%',
              maxWidth: '580px',
              background: 'var(--card-bg)',
              border: '1px solid var(--border-color)',
              borderRadius: '18px',
              boxShadow: 'var(--shadow-xl)',
              overflow: 'hidden',
              maxHeight: '92vh',
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            {/* Header */}
            <div
              style={{
                padding: '18px 24px',
                borderBottom: '1px solid var(--border-color)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                background: 'linear-gradient(180deg, rgba(239, 68, 68, 0.08) 0%, transparent 100%)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div
                  style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: '10px',
                    background: 'rgba(239, 68, 68, 0.15)',
                    color: '#EF4444',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <AlertTriangle size={20} />
                </div>
                <div>
                  <h3 style={{ fontSize: '1.15rem', fontWeight: 800, margin: 0, color: 'var(--text-primary)' }}>
                    {editingId ? 'Edit Deviation Log' : 'Log Schedule Mistake / Deviation'}
                  </h3>
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
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
            <form onSubmit={handleSubmit} style={{ overflowY: 'auto', padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {/* Date & Time Slot Grid */}
              <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '5px' }}>
                    Date:
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
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '5px' }}>
                    Start Time:
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
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '5px' }}>
                    End Time:
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

              {/* Quick Pick From Today's Scheduled Tasks as Dropdown */}
              {dateTasks.length > 0 && !editingId && (
                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '5px' }}>
                    Select from Scheduled Tasks:
                  </label>
                  <select
                    className="form-input"
                    value={form.taskId || ''}
                    onChange={(e) => {
                      const selectedId = e.target.value;
                      if (!selectedId) {
                        setForm({ ...form, taskId: '', plannedAction: '' });
                        return;
                      }
                      const t = dateTasks.find((item) => item.id === selectedId);
                      if (t) {
                        setForm({
                          ...form,
                          plannedAction: t.title,
                          taskId: t.id,
                          ...(t.startTime && { startTime: t.startTime }),
                          ...(t.endTime && { endTime: t.endTime }),
                        });
                      }
                    }}
                    style={{ width: '100%', padding: '9px 12px' }}
                  >
                    <option value="">-- Select a scheduled task --</option>
                    {dateTasks.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.title} ({t.startTime || 'No time'}{t.endTime ? ` - ${t.endTime}` : ''})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* What I Had To Do */}
              <div>
                <label style={{ display: 'block', fontSize: '0.84rem', fontWeight: 800, color: '#EF4444', marginBottom: '6px' }}>
                  ❌ What I Was Supposed To Do (Planned Task / Goal):
                </label>
                <input
                  type="text"
                  placeholder="Enter planned task or goal"
                  className="form-input"
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    borderColor: 'rgba(239, 68, 68, 0.4)',
                    fontSize: '0.9rem',
                    fontWeight: 600,
                  }}
                  value={form.plannedAction}
                  onChange={(e) => setForm({ ...form, plannedAction: e.target.value })}
                  required
                />
              </div>

              {/* What I Actually Did Instead */}
              <div>
                <label style={{ display: 'block', fontSize: '0.84rem', fontWeight: 800, color: '#F59E0B', marginBottom: '6px' }}>
                  ⚠️ What I Actually Did Instead (The Mistake / Action Done):
                </label>
                <input
                  type="text"
                  placeholder="Enter what you actually did instead"
                  className="form-input"
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    borderColor: 'rgba(245, 158, 11, 0.4)',
                    fontSize: '0.9rem',
                    fontWeight: 600,
                  }}
                  value={form.actualAction}
                  onChange={(e) => setForm({ ...form, actualAction: e.target.value })}
                  required
                />
              </div>

              {/* Root Cause & Lesson Learned */}
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '5px' }}>
                  🔍 Why Did This Happen? (Root Cause / Friction):
                </label>
                <textarea
                  rows={2}
                  className="form-input"
                  placeholder="Enter root cause or friction"
                  value={form.rootCause}
                  onChange={(e) => setForm({ ...form, rootCause: e.target.value })}
                  style={{ width: '100%', padding: '9px 12px', fontSize: '0.85rem' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#10B981', marginBottom: '5px' }}>
                  💡 How Will I Fix / Avoid This Next Time? (Actionable Lesson):
                </label>
                <textarea
                  rows={2}
                  className="form-input"
                  placeholder="Enter actionable lesson learned"
                  value={form.lessonLearned}
                  onChange={(e) => setForm({ ...form, lessonLearned: e.target.value })}
                  style={{ width: '100%', padding: '9px 12px', fontSize: '0.85rem', borderColor: 'rgba(16, 185, 129, 0.4)' }}
                />
              </div>

              {/* Footer Actions */}
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'flex-end',
                  gap: '10px',
                  paddingTop: '10px',
                  borderTop: '1px solid var(--border-subtle, rgba(255, 255, 255, 0.08))',
                }}
              >
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setIsModalOpen(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" style={{ background: '#EF4444', borderColor: '#DC2626' }}>
                  {editingId ? 'Update Log' : 'Save Deviation Log'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
