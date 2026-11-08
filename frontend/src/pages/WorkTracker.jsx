import React, { useState, useEffect } from 'react';
import {
  Timer,
  Play,
  Square,
  Clock,
  Plus,
  Trash2,
  Edit2,
  Calendar,
  ChevronLeft,
  ChevronRight,
  RotateCcw,
  Coffee,
  CheckCircle2,
  FileText,
  AlertCircle,
  BarChart2,
  PieChart,
  Tag,
  ArrowRight,
  TrendingUp,
  Award,
Link2,
  Briefcase
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { formatDate, getTodayDateString } from '../utils/dateUtils';

const REASON_ICONS = {
  'Coffee / Tea Break': '☕',
  'Lunch / Dinner Break': '🍱',
  'Phone Call / Discussion': '📞',
  'Team Meeting': '👥',
  'Stepped Away / Personal': '🚶',
  'Task Completed': '🎯',
  'Switching Tasks': '🔀',
  'Urgent Interruption': '⚠️',
  'Finished for Today': '🛑',
  'Finished Work': '✅',
};

export function WorkTracker() {
  const {
    tasks = [],
    selectedDate,
    setSelectedDate,
    workSessions = [],
    activeWorkSession,
    startWorkSession,
    requestStopWorkSession,
    addManualWorkSession,
    deleteWorkSession,
    updateWorkSession,
    workChains = {},
    finishDayWorkSession,
    showToast,
    currentLiveWorkSeconds = 0,
  } = useApp();

  const todayStr = getTodayDateString();
  const activeDate = selectedDate || todayStr;
  const isToday = activeDate === todayStr;

  const todayChain = workChains?.[activeDate] || {
    status: 'idle',
    accumulatedWorkSeconds: 0,
    chain: [],
  };

  const isRunning = Boolean(activeWorkSession?.isRunning);
  const isPaused = isToday && todayChain?.status === 'paused' && !isRunning;
  const isFinished = isToday && todayChain?.status === 'finished' && !isRunning;

  // Active session or accumulated duration (derived from shared AppContext master ticker)
  let activeElapsedSeconds = 0;
  if (isRunning) {
    activeElapsedSeconds = currentLiveWorkSeconds;
  } else if (isPaused) {
    activeElapsedSeconds = todayChain.accumulatedWorkSeconds || 0;
  }

  const activeHrs = Math.floor(activeElapsedSeconds / 3600);
  const activeMins = Math.floor((activeElapsedSeconds % 3600) / 60);
  const activeSecs = activeElapsedSeconds % 60;
  const activeTimerDisplay = `${String(activeHrs).padStart(2, '0')}:${String(activeMins).padStart(2, '0')}:${String(activeSecs).padStart(2, '0')}`;

  // Filter sessions for currently active date
  const dateSessions = workSessions.filter((s) => s.date === activeDate);

  // Today's tasks for association
  const dateTasks = tasks.filter((t) => t.date === activeDate);

  // Quick task selection for new session
  const [selectedTaskId, setSelectedTaskId] = useState('');

  // Manual Session Modal State
  const [isManualModalOpen, setIsManualModalOpen] = useState(false);
  const [manualForm, setManualForm] = useState({
    date: activeDate,
    startTime: '09:00:00',
    endTime: '10:30:00',
    durationMinutes: 90,
    stopReason: 'Coffee / Tea Break',
    notes: '',
    taskId: '',
  });

  // Edit Session Modal State
  const [editingSession, setEditingSession] = useState(null);

  // Metrics
  const totalSecondsLogged = dateSessions.reduce(
    (acc, s) => acc + (Number(s.durationSeconds) || 0),
    0
  ) + (isRunning && activeWorkSession?.date === activeDate ? activeElapsedSeconds : 0);

  const totalHours = Math.floor(totalSecondsLogged / 3600);
  const totalMinutes = Math.floor((totalSecondsLogged % 3600) / 60);
  const totalSecs = totalSecondsLogged % 60;

  const sessionCount = dateSessions.length + (isRunning ? 1 : 0);
  const avgSessionMinutes =
    sessionCount > 0 ? Math.round(totalSecondsLogged / 60 / sessionCount) : 0;

  // Breakdown of stop reasons
  const reasonBreakdown = {};
  dateSessions.forEach((s) => {
    const r = s.stopReason || 'Finished Work';
    reasonBreakdown[r] = (reasonBreakdown[r] || 0) + (Number(s.durationSeconds) || 0);
  });

  const handleStartSession = () => {
    const taskObj = dateTasks.find((t) => t.id === selectedTaskId);
    startWorkSession(taskObj || null);
  };

  const handleOpenManualModal = () => {
    setManualForm({
      date: activeDate,
      startTime: '09:00:00',
      endTime: '10:00:00',
      durationMinutes: 60,
      stopReason: 'Lunch / Dinner Break',
      notes: '',
      taskId: dateTasks[0]?.id || '',
    });
    setIsManualModalOpen(true);
  };

  const handleSaveManualSession = (e) => {
    e.preventDefault();
    const taskObj = dateTasks.find((t) => t.id === manualForm.taskId);
    addManualWorkSession({
      date: manualForm.date,
      startTime: manualForm.startTime,
      endTime: manualForm.endTime,
      durationSeconds: (Number(manualForm.durationMinutes) || 60) * 60,
      stopReason: manualForm.stopReason,
      notes: manualForm.notes,
      taskId: manualForm.taskId || null,
      taskTitle: taskObj ? taskObj.title : '',
    });
    setIsManualModalOpen(false);
  };

  const handleSaveEditSession = (e) => {
    e.preventDefault();
    if (!editingSession) return;
    updateWorkSession(editingSession.id, {
      stopReason: editingSession.stopReason,
      notes: editingSession.notes,
      taskId: editingSession.taskId,
      taskTitle: editingSession.taskTitle,
    });
    setEditingSession(null);
  };

  const formattedDateTitle = formatDate(activeDate, {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', paddingBottom: '24px' }}>
      {/* Top Header Bar */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '10px',
          paddingBottom: '8px',
          borderBottom: '1px solid var(--border-subtle, rgba(255, 255, 255, 0.08))',
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <h1 style={{ fontSize: '1.25rem', fontWeight: 800, margin: 0, color: 'var(--text-primary)' }}>
              Today's Work Tracker & Session Logs
            </h1>
            {isRunning && (
              <span
                style={{
                  background: 'rgba(16, 185, 129, 0.15)',
                  border: '1px solid #10B981',
                  color: '#10B981',
                  padding: '2px 8px',
                  borderRadius: '999px',
                  fontSize: '0.68rem',
                  fontWeight: 800,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px',
                }}
              >
                <span
                  style={{
                    width: '6px',
                    height: '6px',
                    borderRadius: '50%',
                    backgroundColor: '#10B981',
                    boxShadow: '0 0 6px #10B981',
                  }}
                />
                RECORDING
              </span>
            )}
          </div>
          <p style={{ margin: '2px 0 0', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
            Track your focused work sessions in real time, record stop/pause reasons, and review productivity breakdown.
          </p>
        </div>

        {/* Date Selector & Manual Session Button */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          {/* Day Stepper */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              background: 'var(--card-bg)',
              border: '1px solid var(--border-color)',
              borderRadius: 'var(--radius-md)',
              padding: '2px 5px',
            }}
          >
            <button
              type="button"
              className="btn-icon"
              style={{ width: '26px', height: '26px' }}
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
            <span style={{ fontSize: '0.78rem', fontWeight: 700, padding: '0 6px', color: 'var(--text-primary)' }}>
              {isToday ? `Today (${formatDate(activeDate, { month: 'short', day: 'numeric' })})` : formattedDateTitle}
            </span>
            <button
              type="button"
              className="btn-icon"
              style={{ width: '26px', height: '26px' }}
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
                className="btn btn-ghost btn-xs"
                onClick={() => setSelectedDate(todayStr)}
                style={{ marginLeft: '4px', fontSize: '0.7rem', padding: '2px 5px', color: 'var(--primary-color)' }}
              >
                Today
              </button>
            )}
          </div>

          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={handleOpenManualModal}
            style={{ display: 'flex', alignItems: 'center', gap: '5px', height: '30px', fontSize: '0.78rem', padding: '0 10px' }}
          >
            <Plus size={14} />
            <span>Log Past Session</span>
          </button>
        </div>
      </div>

      {/* KPI Metric Cards */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
          gap: '10px',
        }}
      >
        {/* Total Time */}
        <div
          style={{
            background: 'var(--card-bg, #1a2234)',
            border: '1px solid var(--border-color, rgba(255, 255, 255, 0.08))',
            borderLeft: '3px solid #10B981',
            borderRadius: '10px',
            padding: '10px 14px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            gap: '8px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '0.72rem', fontWeight: 800, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.4px' }}>
              Total Tracked Work
            </span>
            <div
              style={{
                width: '26px',
                height: '26px',
                borderRadius: '6px',
                background: 'rgba(16, 185, 129, 0.14)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#10B981',
              }}
            >
              <Clock size={15} />
            </div>
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px' }}>
              <span style={{ fontSize: '1.4rem', fontWeight: 900, color: 'var(--text-primary)', lineHeight: 1 }}>
                {totalHours}h {totalMinutes}m {totalSecs}s
              </span>
            </div>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '2px' }}>
              Across {sessionCount} {sessionCount === 1 ? 'session' : 'sessions'}
            </div>
          </div>
        </div>

        {/* Total Sessions */}
        <div
          style={{
            background: 'var(--card-bg, #1a2234)',
            border: '1px solid var(--border-color, rgba(255, 255, 255, 0.08))',
            borderLeft: '3px solid #3B82F6',
            borderRadius: '10px',
            padding: '10px 14px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            gap: '8px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '0.72rem', fontWeight: 800, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.4px' }}>
              Completed Sessions
            </span>
            <div
              style={{
                width: '26px',
                height: '26px',
                borderRadius: '6px',
                background: 'rgba(59, 130, 246, 0.14)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#3B82F6',
              }}
            >
              <Timer size={15} />
            </div>
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px' }}>
              <span style={{ fontSize: '1.4rem', fontWeight: 900, color: 'var(--text-primary)', lineHeight: 1 }}>
                {sessionCount}
              </span>
              <span style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-secondary)' }}>
                {sessionCount === 1 ? 'Session' : 'Sessions'}
              </span>
            </div>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '2px' }}>
              {isRunning ? '1 active running' : 'All sessions logged'}
            </div>
          </div>
        </div>

        {/* Avg Duration */}
        <div
          style={{
            background: 'var(--card-bg, #1a2234)',
            border: '1px solid var(--border-color, rgba(255, 255, 255, 0.08))',
            borderLeft: '3px solid #8B5CF6',
            borderRadius: '10px',
            padding: '10px 14px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            gap: '8px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '0.72rem', fontWeight: 800, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.4px' }}>
              Average Session
            </span>
            <div
              style={{
                width: '26px',
                height: '26px',
                borderRadius: '6px',
                background: 'rgba(139, 92, 246, 0.14)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#8B5CF6',
              }}
            >
              <TrendingUp size={15} />
            </div>
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px' }}>
              <span style={{ fontSize: '1.4rem', fontWeight: 900, color: 'var(--text-primary)', lineHeight: 1 }}>
                {avgSessionMinutes}
              </span>
              <span style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-secondary)' }}>
                min
              </span>
            </div>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '2px' }}>
              Average focused duration per block
            </div>
          </div>
        </div>

        {/* Pause / Stop Count */}
        <div
          style={{
            background: 'var(--card-bg, #1a2234)',
            border: '1px solid var(--border-color, rgba(255, 255, 255, 0.08))',
            borderLeft: '3px solid #F59E0B',
            borderRadius: '10px',
            padding: '10px 14px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            gap: '8px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '0.72rem', fontWeight: 800, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.4px' }}>
              Stop Reasons Logged
            </span>
            <div
              style={{
                width: '26px',
                height: '26px',
                borderRadius: '6px',
                background: 'rgba(245, 158, 11, 0.14)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#F59E0B',
              }}
            >
              <Coffee size={15} />
            </div>
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px' }}>
              <span style={{ fontSize: '1.4rem', fontWeight: 900, color: 'var(--text-primary)', lineHeight: 1 }}>
                {Object.keys(reasonBreakdown).length}
              </span>
              <span style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-secondary)' }}>
                Types
              </span>
            </div>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '2px' }}>
              Breaks, meals, meetings & interruptions
            </div>
          </div>
        </div>
      </div>

      {/* Persistent Work Paused Banner */}
      {isPaused && (
        <div
          style={{
            background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.16) 0%, rgba(217, 119, 6, 0.08) 100%)',
            border: '1.5px solid rgba(245, 158, 11, 0.45)',
            borderRadius: '10px',
            padding: '10px 14px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '10px',
            boxShadow: '0 4px 14px rgba(245, 158, 11, 0.12)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '8px',
                background: 'rgba(245, 158, 11, 0.25)',
                border: '1px solid #F59E0B',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '1.1rem',
                flexShrink: 0,
              }}
            >
              ☕
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ fontSize: '0.88rem', fontWeight: 800, color: '#FDE68A' }}>
                  Work Paused: {todayChain.lastPauseReason || 'Break'}
                </span>
                <span
                  style={{
                    background: '#F59E0B',
                    color: '#000000',
                    fontSize: '0.62rem',
                    fontWeight: 900,
                    padding: '1px 6px',
                    borderRadius: '999px',
                    textTransform: 'uppercase',
                  }}
                >
                  PAUSED
                </span>
              </div>
              <div style={{ fontSize: '0.74rem', color: '#CBD5E1', marginTop: '1px' }}>
                Stopped at: <strong>{todayChain.lastPausedTimeStr}</strong>{' '}
                {todayChain.lastPauseRemarks && todayChain.lastPauseRemarks !== todayChain.lastPauseReason && (
                  <span>· "{todayChain.lastPauseRemarks}" </span>
                )}
                · Focus so far: <strong style={{ color: '#34D399' }}>{activeTimerDisplay}</strong>
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button
              type="button"
              onClick={handleStartSession}
              id="btn-tracker-resume-session"
              style={{
                background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
                color: '#FFFFFF',
                border: 'none',
                padding: '6px 14px',
                borderRadius: '6px',
                fontSize: '0.8rem',
                fontWeight: 800,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '5px',
                boxShadow: '0 2px 10px rgba(16, 185, 129, 0.3)',
              }}
            >
              <Play size={14} fill="#FFFFFF" />
              <span>Resume Work</span>
            </button>
            <button
              type="button"
              onClick={() => finishDayWorkSession(activeDate)}
              id="btn-tracker-finish-day"
              style={{
                background: 'rgba(239, 68, 68, 0.16)',
                border: '1px solid rgba(239, 68, 68, 0.45)',
                color: '#FCA5A5',
                padding: '6px 12px',
                borderRadius: '6px',
                fontSize: '0.76rem',
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              🛑 Finish Day
            </button>
          </div>
        </div>
      )}

      {/* Main Interactive Work Timer Card */}
      <div
        className="card"
        style={{
          background: isRunning
            ? 'linear-gradient(135deg, rgba(16, 185, 129, 0.08) 0%, var(--card-bg) 100%)'
            : isPaused
            ? 'linear-gradient(135deg, rgba(245, 158, 11, 0.08) 0%, var(--card-bg) 100%)'
            : 'var(--card-bg)',
          borderRadius: '10px',
          border: isRunning
            ? '1.5px solid #10B981'
            : isPaused
            ? '1.5px solid #F59E0B'
            : '1px solid var(--border-color)',
          padding: '10px 14px',
          color: 'var(--text-primary)',
          boxShadow: isRunning
            ? '0 4px 14px rgba(16, 185, 129, 0.12)'
            : isPaused
            ? '0 4px 14px rgba(245, 158, 11, 0.12)'
            : 'var(--shadow-sm)',
          display: 'flex',
          flexDirection: 'column',
          gap: '10px',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div
              style={{
                width: '30px',
                height: '30px',
                borderRadius: '7px',
                background: isRunning
                  ? 'rgba(16, 185, 129, 0.18)'
                  : isPaused
                  ? 'rgba(245, 158, 11, 0.18)'
                  : 'rgba(23, 105, 255, 0.14)',
                border: isRunning
                  ? '1px solid #10B981'
                  : isPaused
                  ? '1px solid #F59E0B'
                  : '1px solid rgba(23, 105, 255, 0.3)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: isRunning ? '#10B981' : isPaused ? '#F59E0B' : '#1769FF',
                flexShrink: 0,
              }}
            >
              <Timer size={16} />
            </div>
            <div>
              <div style={{ fontSize: '0.9rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                {isRunning
                  ? 'Active Work Session in Progress'
                  : isPaused
                  ? `Work Paused · Stopped at ${todayChain.lastPausedTimeStr}`
                  : isFinished
                  ? 'Workday Completed'
                  : 'Start a New Work Session'}
              </div>
              <div style={{ fontSize: '0.74rem', color: 'var(--text-secondary)' }}>
                {isRunning
                  ? `Started at ${activeWorkSession.startTime}. Stop whenever you need a pause or break.`
                  : isPaused
                  ? `Paused for "${todayChain.lastPauseReason}". Timer freezes and resumes on click.`
                  : isFinished
                  ? 'Daily session chain closed. Start fresh anytime!'
                  : 'Start tracking focused time. Every pause creates a chained timeline.'}
              </div>
            </div>
          </div>

          {/* Action Button: Start, Stop, or Resume */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            {isRunning ? (
              <button
                type="button"
                onClick={requestStopWorkSession}
                id="btn-tracker-stop-session"
                style={{
                  background: 'linear-gradient(135deg, #EF4444 0%, #DC2626 100%)',
                  color: '#FFFFFF',
                  border: 'none',
                  padding: '6px 14px',
                  borderRadius: '6px',
                  fontSize: '0.8rem',
                  fontWeight: 800,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '5px',
                  transition: 'all 0.15s ease',
                  boxShadow: '0 2px 10px rgba(239, 68, 68, 0.3)',
                }}
              >
                <Square size={13} fill="#FFFFFF" />
                <span>Stop Work & Enter Remarks</span>
              </button>
            ) : isPaused ? (
              <>
                <button
                  type="button"
                  onClick={handleStartSession}
                  id="btn-tracker-start-session"
                  style={{
                    background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
                    color: '#FFFFFF',
                    border: 'none',
                    padding: '6px 16px',
                    borderRadius: '7px',
                    fontSize: '0.82rem',
                    fontWeight: 800,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    transition: 'all 0.15s ease',
                    boxShadow: '0 2px 10px rgba(16, 185, 129, 0.3)',
                  }}
                >
                  <Play size={15} fill="#FFFFFF" />
                  <span>Resume Work ({activeTimerDisplay})</span>
                </button>
                <button
                  type="button"
                  onClick={() => finishDayWorkSession(activeDate)}
                  style={{
                    background: 'rgba(239, 68, 68, 0.15)',
                    border: '1px solid rgba(239, 68, 68, 0.4)',
                    color: '#EF4444',
                    padding: '6px 12px',
                    borderRadius: '7px',
                    fontSize: '0.78rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                  }}
                >
                  🛑 Finish Day
                </button>
              </>
            ) : (
              <button
                type="button"
                onClick={handleStartSession}
                id="btn-tracker-start-session"
                style={{
                  background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
                  color: '#FFFFFF',
                  border: 'none',
                  padding: '6px 16px',
                  borderRadius: '7px',
                  fontSize: '0.82rem',
                  fontWeight: 800,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  transition: 'all 0.15s ease',
                }}
              >
                <Play size={15} fill="#FFFFFF" />
                <span>Start Tracking Work</span>
              </button>
            )}
          </div>
        </div>

        {/* Center: Large LED Timer Readout & Task Selector */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '12px',
            background: 'var(--page-bg)',
            border: '1px solid var(--border-color)',
            borderRadius: '8px',
            padding: '10px 14px',
          }}
        >
          {/* LED Readout */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div
              style={{
                fontFamily: 'monospace, "Courier New", Courier',
                fontSize: '1.75rem',
                fontWeight: 900,
                color: isRunning ? '#10B981' : isPaused ? '#F59E0B' : 'var(--text-primary)',
                letterSpacing: '1.5px',
                lineHeight: 1,
              }}
            >
              {isRunning || isPaused ? activeTimerDisplay : '00:00:00'}
            </div>
            <div style={{ fontSize: '0.74rem', color: 'var(--text-secondary)', fontWeight: 600 }}>
              {isRunning ? (
                <div>
                  <div style={{ color: '#34D399', fontWeight: 800, fontSize: '0.72rem' }}>LIVE SESSION TRACKING</div>
                  <div style={{ fontSize: '0.7rem' }}>Timer ticking forward continuously</div>
                </div>
              ) : isPaused ? (
                <div>
                  <div style={{ color: '#F59E0B', fontWeight: 800, fontSize: '0.72rem' }}>WORK PAUSED AT {todayChain.lastPausedTimeStr}</div>
                  <div style={{ fontSize: '0.7rem' }}>Frozen at {activeTimerDisplay} · Resumes upon click</div>
                </div>
              ) : (
                <div>
                  <div style={{ color: 'var(--text-muted)', fontWeight: 700, fontSize: '0.72rem' }}>TIMER IDLE</div>
                  <div style={{ fontSize: '0.7rem' }}>Press "Start Tracking Work" to begin</div>
                </div>
              )}
            </div>
          </div>

          {/* Associate Task Dropdown */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-secondary)' }}>
              Focus Task:
            </span>
            {isRunning ? (
              <span
                style={{
                  background: 'rgba(59, 130, 246, 0.15)',
                  border: '1px solid #3B82F6',
                  color: '#93C5FD',
                  padding: '4px 10px',
                  borderRadius: '6px',
                  fontSize: '0.8rem',
                  fontWeight: 700,
                }}
              >
                {activeWorkSession.taskTitle || 'General Focus'}
              </span>
            ) : (
              <select
                value={selectedTaskId}
                onChange={(e) => setSelectedTaskId(e.target.value)}
                style={{
                  background: 'var(--card-bg)',
                  border: '1px solid var(--border-color)',
                  color: 'var(--text-primary)',
                  padding: '5px 10px',
                  borderRadius: '6px',
                  fontSize: '0.8rem',
                  minWidth: '200px',
                  height: '30px',
                }}
              >
                <option value="">General Work (No specific task)</option>
                {dateTasks.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.title} [{t.startTime || 'Scheduled'}]
                  </option>
                ))}
              </select>
            )}
          </div>
        </div>
      </div>

      {/* Sessions List / Timeline & Chain */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h2 style={{ fontSize: '0.98rem', fontWeight: 800, margin: 0, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Link2 size={18} color="var(--primary-color)" /> Work & Remarks Session Chain
              {(todayChain?.chain?.length > 0 || dateSessions.length > 0) && (
                <span style={{ fontSize: '0.68rem', background: 'rgba(59, 130, 246, 0.2)', color: '#60A5FA', padding: '1px 6px', borderRadius: '999px', fontWeight: 700 }}>
                  {(todayChain?.chain?.length || dateSessions.length)} nodes
                </span>
              )}
            </h2>
            <span style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>
              Auto-computes break gaps upon resuming
            </span>
          </div>

          {(todayChain?.chain?.length === 0 && dateSessions.length === 0 && !isRunning && !isPaused) ? (
            <div
              style={{
                background: 'var(--card-bg)',
                border: '1px dashed var(--border-color)',
                borderRadius: '10px',
                padding: '28px 16px',
                textAlign: 'center',
                color: 'var(--text-muted)',
              }}
            >
              <Timer size={32} style={{ margin: '0 auto 8px', opacity: 0.4 }} />
              <div style={{ fontSize: '0.92rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                No work sessions recorded yet for {isToday ? 'today' : formattedDateTitle}
              </div>
              <p style={{ fontSize: '0.78rem', maxWidth: '380px', margin: '4px auto 12px' }}>
                Click <strong>"Start Tracking Work"</strong> to begin. When you stop for a break or call, your remarks create a continuous chain.
              </p>
              <button
                type="button"
                className="btn btn-primary btn-sm"
                onClick={handleStartSession}
                style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', height: '28px', fontSize: '0.78rem', padding: '0 12px' }}
              >
                <Play size={12} fill="currentColor" /> Start Tracking Work
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {/* If Chain nodes exist, render the chronological chain */}
              {todayChain?.chain?.length > 0 ? (
                todayChain.chain.map((node, index) => {
                  const isWork = node.type === 'work';
                  const durMinutes = Math.floor((node.durationSeconds || 0) / 60);
                  const durHours = Math.floor(durMinutes / 60);
                  const remainMinutes = durMinutes % 60;
                  const durLabel = durHours > 0 ? `${durHours}h ${remainMinutes}m` : `${durMinutes}m`;

                  return (
                    <div
                      key={node.id || index}
                      style={{
                        background: isWork ? 'rgba(16, 185, 129, 0.06)' : 'rgba(245, 158, 11, 0.08)',
                        border: isWork ? '1px solid rgba(16, 185, 129, 0.3)' : '1px solid rgba(245, 158, 11, 0.35)',
                        borderLeft: isWork ? '4px solid #10B981' : '4px solid #F59E0B',
                        borderRadius: '8px',
                        padding: '8px 12px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        flexWrap: 'wrap',
                        gap: '8px',
                        position: 'relative',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div
                          style={{
                            width: '28px',
                            height: '28px',
                            borderRadius: '6px',
                            background: isWork ? 'rgba(16, 185, 129, 0.2)' : 'rgba(245, 158, 11, 0.2)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '1rem',
                            flexShrink: 0,
                          }}
                        >
                          {isWork ? <Briefcase size={14} color="#10B981" /> : <Coffee size={14} color="#F59E0B" />}
                        </div>
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <span style={{ fontSize: '0.84rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                              {isWork ? (node.taskTitle || 'Focus Work Session') : `Break / Interruption: ${node.reason}`}
                            </span>
                            <span
                              style={{
                                background: isWork ? '#10B981' : '#F59E0B',
                                color: isWork ? '#FFFFFF' : '#000000',
                                fontSize: '0.6rem',
                                fontWeight: 800,
                                padding: '1px 5px',
                                borderRadius: '999px',
                                textTransform: 'uppercase',
                              }}
                            >
                              {isWork ? 'Work' : 'Gap'}
                            </span>
                          </div>
                          <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', marginTop: '1px' }}>
                            {node.startTime} – {node.endTime}
                            {!isWork && node.remarks && node.remarks !== node.reason && (
                              <span style={{ color: '#FDE68A', fontStyle: 'italic' }}> · "{node.remarks}"</span>
                            )}
                          </div>
                        </div>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span
                          style={{
                            fontSize: '0.78rem',
                            fontWeight: 800,
                            color: isWork ? '#10B981' : '#F59E0B',
                            background: 'var(--card-bg)',
                            padding: '2px 8px',
                            borderRadius: '6px',
                            border: '1px solid var(--border-color)',
                          }}
                        >
                          {isWork ? durLabel : `⚡ ${node.durationLabel || durLabel}`}
                        </span>
                      </div>
                    </div>
                  );
                })
              ) : (
                /* Fallback to dateSessions if chain not yet stored */
                dateSessions.map((session) => {
                  const durMin = Math.floor((session.durationSeconds || 0) / 60);
                  const durSec = (session.durationSeconds || 0) % 60;
                  const durHours = Math.floor(durMin / 60);
                  const remainMin = durMin % 60;
                  const durStr = durHours > 0 ? `${durHours}h ${remainMin}m` : `${durMin}m ${durSec}s`;
                  const icon = REASON_ICONS[session.stopReason] || '🛑';

                  return (
                    <div
                      key={session.id}
                      style={{
                        background: 'var(--card-bg)',
                        border: '1px solid var(--border-color)',
                        borderRadius: '8px',
                        padding: '8px 12px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        flexWrap: 'wrap',
                        gap: '8px',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div
                          style={{
                            width: '28px',
                            height: '28px',
                            borderRadius: '6px',
                            background: 'rgba(59, 130, 246, 0.1)',
                            border: '1px solid rgba(59, 130, 246, 0.25)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '1rem',
                            flexShrink: 0,
                          }}
                        >
                          {icon}
                        </div>
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <span style={{ fontSize: '0.84rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                              {session.taskTitle || 'General Work Session'}
                            </span>
                            <span
                              style={{
                                background: 'rgba(255, 255, 255, 0.08)',
                                color: 'var(--text-secondary)',
                                fontSize: '0.62rem',
                                fontWeight: 700,
                                padding: '1px 5px',
                                borderRadius: '4px',
                              }}
                            >
                              {session.stopReason || 'Finished Work'}
                            </span>
                          </div>
                          <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', marginTop: '1px' }}>
                            {session.startTime} – {session.endTime}
                            {session.notes && <span style={{ fontStyle: 'italic' }}> · "{session.notes}"</span>}
                          </div>
                        </div>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span style={{ fontSize: '0.8rem', fontWeight: 800, color: '#3B82F6' }}>
                          {durStr}
                        </span>
                        <button
                          type="button"
                          className="btn-icon"
                          onClick={() => setEditingSession(session)}
                          title="Edit remarks"
                          style={{ width: '24px', height: '24px' }}
                        >
                          <Edit2 size={12} />
                        </button>
                        <button
                          type="button"
                          className="btn-icon"
                          onClick={() => deleteWorkSession(session.id)}
                          title="Delete session"
                          style={{ color: '#EF4444', width: '24px', height: '24px' }}
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    </div>
                  );
                })
              )}

              {/* Active Running Session Segment in the Chain */}
              {isRunning && activeWorkSession?.date === activeDate && (
                <div
                  style={{
                    background: 'rgba(16, 185, 129, 0.08)',
                    border: '1.5px solid #10B981',
                    borderRadius: '8px',
                    padding: '8px 12px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    flexWrap: 'wrap',
                    gap: '8px',
                    animation: 'pulse 2s infinite',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div
                      style={{
                        width: '28px',
                        height: '28px',
                        borderRadius: '6px',
                        background: '#10B981',
                        color: '#FFFFFF',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <Timer size={15} />
                    </div>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span style={{ fontSize: '0.86rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                          {activeWorkSession.taskTitle || 'Live Work Segment'}
                        </span>
                        <span
                          style={{
                            background: '#10B981',
                            color: '#FFFFFF',
                            fontSize: '0.62rem',
                            fontWeight: 800,
                            padding: '1px 6px',
                            borderRadius: '999px',
                          }}
                        >
                          RECORDING
                        </span>
                      </div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', marginTop: '1px' }}>
                        Started at: {activeWorkSession.startTime} · Currently tracking
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span
                      style={{
                        fontFamily: 'monospace',
                        fontSize: '1.1rem',
                        fontWeight: 900,
                        color: '#10B981',
                      }}
                    >
                      {activeTimerDisplay}
                    </span>
                    <button
                      type="button"
                      className="btn btn-sm"
                      onClick={requestStopWorkSession}
                      style={{
                        background: '#EF4444',
                        color: '#FFFFFF',
                        border: 'none',
                        fontSize: '0.76rem',
                        fontWeight: 700,
                        padding: '4px 10px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                        cursor: 'pointer',
                        borderRadius: '6px',
                      }}
                    >
                      <Square size={11} fill="#FFFFFF" /> Stop & Remarks
                    </button>
                  </div>
                </div>
              )}

              {/* If currently paused, render the active pause node in the chain */}
              {isPaused && (
                <div
                  style={{
                    background: 'rgba(245, 158, 11, 0.1)',
                    border: '1.5px dashed #F59E0B',
                    borderRadius: '8px',
                    padding: '8px 12px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    flexWrap: 'wrap',
                    gap: '8px',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span style={{ fontSize: '1.1rem' }}>⏳</span>
                    <div>
                      <div style={{ fontSize: '0.84rem', fontWeight: 800, color: '#FDE68A' }}>
                        Current Gap: {todayChain.lastPauseReason || 'Pause'}
                      </div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>
                        Paused since {todayChain.lastPausedTimeStr}. Gap calculates upon resuming.
                      </div>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={handleStartSession}
                    style={{
                      background: '#10B981',
                      color: '#FFFFFF',
                      border: 'none',
                      padding: '5px 12px',
                      borderRadius: '6px',
                      fontSize: '0.78rem',
                      fontWeight: 800,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                    }}
                  >
                    <Play size={12} fill="#FFFFFF" /> Resume Work
                  </button>
                </div>
              )}
            </div>
          )}
      </div>

      {/* Manual Past Session Modal */}
      {isManualModalOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 1000,
            backgroundColor: 'rgba(0,0,0,0.7)',
            backdropFilter: 'blur(6px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '16px',
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget) setIsManualModalOpen(false);
          }}
        >
          <div
            style={{
              width: '100%',
              maxWidth: '460px',
              background: 'var(--card-bg)',
              border: '1px solid var(--border-color)',
              borderRadius: '12px',
              boxShadow: 'var(--shadow-xl)',
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                padding: '12px 18px',
                borderBottom: '1px solid var(--border-color)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <h3 style={{ fontSize: '0.98rem', fontWeight: 800, margin: 0, color: 'var(--text-primary)' }}>
                Log Past Work Session
              </h3>
              <button
                type="button"
                className="btn-icon"
                onClick={() => setIsManualModalOpen(false)}
                style={{ width: '26px', height: '26px' }}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveManualSession} style={{ padding: '14px 18px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div>
                <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '5px' }}>
                  Date:
                </label>
                <input
                  type="date"
                  className="form-input"
                  value={manualForm.date}
                  onChange={(e) => setManualForm({ ...manualForm, date: e.target.value })}
                  required
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div>
                  <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '5px' }}>
                    Start Time:
                  </label>
                  <input
                    type="time"
                    className="form-input"
                    value={manualForm.startTime}
                    onChange={(e) => setManualForm({ ...manualForm, startTime: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '5px' }}>
                    End Time:
                  </label>
                  <input
                    type="time"
                    className="form-input"
                    value={manualForm.endTime}
                    onChange={(e) => setManualForm({ ...manualForm, endTime: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div>
                <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '5px' }}>
                  Duration (Minutes):
                </label>
                <input
                  type="number"
                  min="1"
                  max="1440"
                  className="form-input"
                  value={manualForm.durationMinutes}
                  onChange={(e) => setManualForm({ ...manualForm, durationMinutes: e.target.value })}
                  required
                />
              </div>

              <div>
                <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '5px' }}>
                  Reason for Stopping / Pause:
                </label>
                <select
                  className="form-input"
                  value={manualForm.stopReason}
                  onChange={(e) => setManualForm({ ...manualForm, stopReason: e.target.value })}
                >
                  <option value="Coffee / Tea Break">☕ Coffee / Tea Break</option>
                  <option value="Lunch / Dinner Break">🍱 Lunch / Dinner Break</option>
                  <option value="Phone Call / Discussion">📞 Phone Call / Discussion</option>
                  <option value="Team Meeting">👥 Team Meeting</option>
                  <option value="Stepped Away / Personal">🚶 Stepped Away / Personal</option>
                  <option value="Task Completed">🎯 Task Completed</option>
                  <option value="Switching Tasks">🔀 Switching Tasks</option>
                  <option value="Urgent Interruption">⚠️ Urgent Interruption</option>
                  <option value="Finished for Today">🛑 Finished for Today</option>
                  <option value="Finished Work">✅ Finished Work</option>
                </select>
              </div>

              <div>
                <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '5px' }}>
                  Linked Task (Optional):
                </label>
                <select
                  className="form-input"
                  value={manualForm.taskId}
                  onChange={(e) => setManualForm({ ...manualForm, taskId: e.target.value })}
                >
                  <option value="">General Focus / No Task</option>
                  {dateTasks.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.title}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '5px' }}>
                  Notes / Progress:
                </label>
                <textarea
                  rows={2}
                  className="form-input"
                  placeholder="What was completed during this block..."
                  value={manualForm.notes}
                  onChange={(e) => setManualForm({ ...manualForm, notes: e.target.value })}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', paddingTop: '10px' }}>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setIsManualModalOpen(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Save Session Log
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Session Modal */}
      {editingSession && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 1000,
            backgroundColor: 'rgba(0,0,0,0.7)',
            backdropFilter: 'blur(6px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '16px',
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget) setEditingSession(null);
          }}
        >
          <div
            style={{
              width: '100%',
              maxWidth: '440px',
              background: 'var(--card-bg)',
              border: '1px solid var(--border-color)',
              borderRadius: '12px',
              boxShadow: 'var(--shadow-xl)',
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                padding: '12px 18px',
                borderBottom: '1px solid var(--border-color)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <h3 style={{ fontSize: '0.98rem', fontWeight: 800, margin: 0, color: 'var(--text-primary)' }}>
                Edit Work Session Details
              </h3>
              <button
                type="button"
                className="btn-icon"
                onClick={() => setEditingSession(null)}
                style={{ width: '26px', height: '26px' }}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveEditSession} style={{ padding: '14px 18px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div>
                <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '5px' }}>
                  Stop Reason:
                </label>
                <input
                  type="text"
                  className="form-input"
                  value={editingSession.stopReason}
                  onChange={(e) => setEditingSession({ ...editingSession, stopReason: e.target.value })}
                  required
                />
              </div>

              <div>
                <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '5px' }}>
                  Notes / What did you accomplish?
                </label>
                <textarea
                  rows={3}
                  className="form-input"
                  value={editingSession.notes || ''}
                  onChange={(e) => setEditingSession({ ...editingSession, notes: e.target.value })}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', paddingTop: '10px' }}>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setEditingSession(null)}
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Update Session
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
