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
    showToast,
  } = useApp();

  const todayStr = getTodayDateString();
  const activeDate = selectedDate || todayStr;
  const isToday = activeDate === todayStr;

  // Live timer tick for active session
  const [ticker, setTicker] = useState(Date.now());
  useEffect(() => {
    const interval = setInterval(() => setTicker(Date.now()), 1000);
    return () => clearInterval(interval);
  }, []);

  const isRunning = Boolean(activeWorkSession?.isRunning);

  // Active session duration
  let activeElapsedSeconds = 0;
  if (isRunning && activeWorkSession?.startTimestamp) {
    activeElapsedSeconds = Math.max(
      0,
      Math.floor((ticker - activeWorkSession.startTimestamp) / 1000)
    );
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
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', paddingBottom: '32px' }}>
      {/* Top Header Bar */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '14px',
          paddingBottom: '8px',
          borderBottom: '1px solid var(--border-subtle, rgba(255, 255, 255, 0.08))',
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <h1 style={{ fontSize: '1.6rem', fontWeight: 800, margin: 0, color: 'var(--text-primary)' }}>
              Today's Work Tracker & Session Logs
            </h1>
            {isRunning && (
              <span
                style={{
                  background: 'rgba(16, 185, 129, 0.15)',
                  border: '1px solid #10B981',
                  color: '#10B981',
                  padding: '3px 10px',
                  borderRadius: '999px',
                  fontSize: '0.74rem',
                  fontWeight: 800,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '5px',
                }}
              >
                <span
                  style={{
                    width: '7px',
                    height: '7px',
                    borderRadius: '50%',
                    backgroundColor: '#10B981',
                    boxShadow: '0 0 8px #10B981',
                  }}
                />
                RECORDING IN PROGRESS
              </span>
            )}
          </div>
          <p style={{ margin: '4px 0 0', fontSize: '0.86rem', color: 'var(--text-secondary)' }}>
            Track your focused work sessions in real time, record stop/pause reasons, and review productivity breakdown.
          </p>
        </div>

        {/* Date Selector & Manual Session Button */}
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
            className="btn btn-secondary btn-sm"
            onClick={handleOpenManualModal}
            style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            <Plus size={15} />
            <span>Log Past Session</span>
          </button>
        </div>
      </div>

      {/* KPI Metric Cards */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))',
          gap: '16px',
        }}
      >
        {/* Total Time */}
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
              Total Tracked Work
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
              <Clock size={18} />
            </div>
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
              <span style={{ fontSize: '1.85rem', fontWeight: 900, color: 'var(--text-primary)', lineHeight: 1 }}>
                {totalHours}h {totalMinutes}m {totalSecs}s
              </span>
            </div>
            <div style={{ fontSize: '0.76rem', color: 'var(--text-muted)', marginTop: '6px' }}>
              Across {sessionCount} {sessionCount === 1 ? 'session' : 'sessions'} on this date
            </div>
          </div>
        </div>

        {/* Total Sessions */}
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
              Completed Sessions
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
              <Timer size={18} />
            </div>
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
              <span style={{ fontSize: '2.1rem', fontWeight: 900, color: 'var(--text-primary)', lineHeight: 1 }}>
                {sessionCount}
              </span>
              <span style={{ fontSize: '0.92rem', fontWeight: 700, color: 'var(--text-secondary)' }}>
                {sessionCount === 1 ? 'Session' : 'Sessions'}
              </span>
            </div>
            <div style={{ fontSize: '0.76rem', color: 'var(--text-muted)', marginTop: '6px' }}>
              {isRunning ? '1 active currently running' : 'All sessions logged'}
            </div>
          </div>
        </div>

        {/* Avg Duration */}
        <div
          style={{
            background: 'var(--card-bg, #1a2234)',
            border: '1px solid var(--border-color, rgba(255, 255, 255, 0.08))',
            borderLeft: '4px solid #8B5CF6',
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
              Average Session
            </span>
            <div
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '8px',
                background: 'rgba(139, 92, 246, 0.14)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#8B5CF6',
              }}
            >
              <TrendingUp size={18} />
            </div>
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
              <span style={{ fontSize: '2.1rem', fontWeight: 900, color: 'var(--text-primary)', lineHeight: 1 }}>
                {avgSessionMinutes}
              </span>
              <span style={{ fontSize: '0.92rem', fontWeight: 700, color: 'var(--text-secondary)' }}>
                min
              </span>
            </div>
            <div style={{ fontSize: '0.76rem', color: 'var(--text-muted)', marginTop: '6px' }}>
              Average focused duration per block
            </div>
          </div>
        </div>

        {/* Pause / Stop Count */}
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
              Stop Reasons Logged
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
              <Coffee size={18} />
            </div>
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
              <span style={{ fontSize: '2.1rem', fontWeight: 900, color: 'var(--text-primary)', lineHeight: 1 }}>
                {Object.keys(reasonBreakdown).length}
              </span>
              <span style={{ fontSize: '0.92rem', fontWeight: 700, color: 'var(--text-secondary)' }}>
                Types
              </span>
            </div>
            <div style={{ fontSize: '0.76rem', color: 'var(--text-muted)', marginTop: '6px' }}>
              Breaks, meals, meetings & interruptions
            </div>
          </div>
        </div>
      </div>

      {/* Main Interactive Work Timer Card */}
      <div
        style={{
          background: 'linear-gradient(135deg, #101B33 0%, #172445 100%)',
          borderRadius: '16px',
          border: isRunning ? '1.5px solid #10B981' : '1px solid rgba(255, 255, 255, 0.1)',
          padding: '24px',
          color: '#FFFFFF',
          boxShadow: isRunning
            ? '0 10px 30px rgba(16, 185, 129, 0.2)'
            : '0 8px 24px rgba(0, 0, 0, 0.25)',
          display: 'flex',
          flexDirection: 'column',
          gap: '18px',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div
              style={{
                width: '44px',
                height: '44px',
                borderRadius: '12px',
                background: isRunning ? 'rgba(16, 185, 129, 0.2)' : 'rgba(59, 130, 246, 0.18)',
                border: isRunning ? '1px solid #10B981' : '1px solid rgba(59, 130, 246, 0.4)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: isRunning ? '#10B981' : '#3B82F6',
              }}
            >
              <Timer size={24} />
            </div>
            <div>
              <div style={{ fontSize: '1.15rem', fontWeight: 800 }}>
                {isRunning ? 'Active Work Session in Progress' : 'Start a New Work Session'}
              </div>
              <div style={{ fontSize: '0.8rem', color: '#94A3B8' }}>
                {isRunning
                  ? `Started at ${activeWorkSession.startTime}. When you stop, you'll be prompted for a reason (Break, Meeting, Lunch, etc.)`
                  : 'Start tracking your time. Every time you stop, we record your progress and the exact reason.'}
              </div>
            </div>
          </div>

          {/* Action Button: Start or Stop */}
          <div>
            {!isRunning ? (
              <button
                type="button"
                onClick={handleStartSession}
                id="btn-tracker-start-session"
                style={{
                  background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
                  color: '#FFFFFF',
                  border: 'none',
                  padding: '12px 26px',
                  borderRadius: '10px',
                  fontSize: '1rem',
                  fontWeight: 800,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  transition: 'all 0.15s ease',
                }}
              >
                <Play size={18} fill="#FFFFFF" />
                <span>Start Tracking Work</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={requestStopWorkSession}
                id="btn-tracker-stop-session"
                style={{
                  background: 'linear-gradient(135deg, #EF4444 0%, #DC2626 100%)',
                  color: '#FFFFFF',
                  border: 'none',
                  padding: '12px 26px',
                  borderRadius: '10px',
                  fontSize: '1rem',
                  fontWeight: 800,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  transition: 'all 0.15s ease',
                }}
              >
                <Square size={16} fill="#FFFFFF" />
                <span>Stop Work & Enter Remarks</span>
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
            gap: '16px',
            background: 'rgba(0, 0, 0, 0.25)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            borderRadius: '12px',
            padding: '16px 22px',
          }}
        >
          {/* LED Readout */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div
              style={{
                fontFamily: 'monospace, "Courier New", Courier',
                fontSize: '2.5rem',
                fontWeight: 900,
                color: isRunning ? '#34D399' : '#EF4444',
                letterSpacing: '2px',
                lineHeight: 1,
                textShadow: isRunning ? '0 0 16px rgba(52, 211, 153, 0.6)' : '0 0 12px rgba(239, 68, 68, 0.4)',
              }}
            >
              {isRunning ? activeTimerDisplay : '00:00:00'}
            </div>
            <div style={{ fontSize: '0.78rem', color: '#94A3B8', fontWeight: 600 }}>
              {isRunning ? (
                <div>
                  <div style={{ color: '#34D399', fontWeight: 800 }}>LIVE SESSION TIME</div>
                  <div>Tracking continuously until stopped</div>
                </div>
              ) : (
                <div>
                  <div style={{ color: '#E2E8F0', fontWeight: 700 }}>TIMER IDLE</div>
                  <div>Press "Start Tracking Work" above</div>
                </div>
              )}
            </div>
          </div>

          {/* Associate Task Dropdown */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '0.82rem', fontWeight: 700, color: '#94A3B8' }}>
              Focus Task:
            </span>
            {isRunning ? (
              <span
                style={{
                  background: 'rgba(59, 130, 246, 0.2)',
                  border: '1px solid #3B82F6',
                  color: '#93C5FD',
                  padding: '6px 12px',
                  borderRadius: '8px',
                  fontSize: '0.86rem',
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
                  background: '#1A2744',
                  border: '1px solid rgba(255, 255, 255, 0.16)',
                  color: '#FFFFFF',
                  padding: '7px 12px',
                  borderRadius: '8px',
                  fontSize: '0.85rem',
                  minWidth: '220px',
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

      {/* Two Column Layout: Sessions List / Timeline & Stop Reasons Breakdown */}
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 340px', gap: '20px' }}>
        {/* Left Column: Sessions List */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h2 style={{ fontSize: '1.15rem', fontWeight: 800, margin: 0, color: 'var(--text-primary)' }}>
              Work Sessions Timeline ({dateSessions.length})
            </h2>
            <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
              Ordered most recent first
            </span>
          </div>

          {dateSessions.length === 0 && !isRunning ? (
            <div
              style={{
                background: 'var(--card-bg)',
                border: '1px dashed var(--border-color)',
                borderRadius: '14px',
                padding: '48px 24px',
                textAlign: 'center',
                color: 'var(--text-muted)',
              }}
            >
              <Timer size={44} style={{ margin: '0 auto 12px', opacity: 0.4 }} />
              <div style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                No work sessions recorded yet for {isToday ? 'today' : formattedDateTitle}
              </div>
              <p style={{ fontSize: '0.85rem', maxWidth: '420px', margin: '6px auto 16px' }}>
                Click <strong>"Start Tracking Work"</strong> to begin a timer, or manually log a past work session.
              </p>
              <button
                type="button"
                className="btn btn-primary btn-sm"
                onClick={handleStartSession}
                style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
              >
                <Play size={14} fill="currentColor" /> Start First Session
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {/* Active Running Session Card if any */}
              {isRunning && activeWorkSession?.date === activeDate && (
                <div
                  style={{
                    background: 'rgba(16, 185, 129, 0.08)',
                    border: '1.5px solid #10B981',
                    borderRadius: '12px',
                    padding: '16px 20px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    flexWrap: 'wrap',
                    gap: '12px',
                    animation: 'pulse 2s infinite',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div
                      style={{
                        width: '38px',
                        height: '38px',
                        borderRadius: '10px',
                        background: '#10B981',
                        color: '#FFFFFF',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <Timer size={20} />
                    </div>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontSize: '0.96rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                          {activeWorkSession.taskTitle || 'General Work Session'}
                        </span>
                        <span
                          style={{
                            background: '#10B981',
                            color: '#FFFFFF',
                            fontSize: '0.68rem',
                            fontWeight: 800,
                            padding: '2px 7px',
                            borderRadius: '999px',
                          }}
                        >
                          RECORDING
                        </span>
                      </div>
                      <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
                        Started at: {activeWorkSession.startTime} · Currently tracking
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <span
                      style={{
                        fontFamily: 'monospace',
                        fontSize: '1.35rem',
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
                        fontSize: '0.8rem',
                        fontWeight: 700,
                        padding: '6px 14px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '5px',
                      }}
                    >
                      <Square size={12} fill="#FFFFFF" /> Stop & Enter Remarks
                    </button>
                  </div>
                </div>
              )}

              {/* Logged Past Sessions */}
              {dateSessions.map((session) => {
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
                      borderRadius: '12px',
                      padding: '14px 18px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      flexWrap: 'wrap',
                      gap: '12px',
                      transition: 'border-color 0.15s',
                    }}
                  >
                    {/* Left: Time & Task info */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                      <div
                        style={{
                          width: '40px',
                          height: '40px',
                          borderRadius: '10px',
                          background: 'rgba(59, 130, 246, 0.1)',
                          border: '1px solid rgba(59, 130, 246, 0.25)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '1.25rem',
                          flexShrink: 0,
                        }}
                      >
                        {icon}
                      </div>

                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                          <span style={{ fontSize: '0.94rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                            {session.taskTitle || 'General Focus Session'}
                          </span>

                          {/* Stop Reason Pill */}
                          <span
                            style={{
                              background: 'rgba(239, 68, 68, 0.12)',
                              border: '1px solid rgba(239, 68, 68, 0.3)',
                              color: '#EF4444',
                              fontSize: '0.74rem',
                              fontWeight: 700,
                              padding: '2px 8px',
                              borderRadius: '6px',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px',
                            }}
                          >
                            <span>Remarks:</span>
                            <strong>{session.stopReason || 'Finished Work'}</strong>
                          </span>
                        </div>

                        <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
                          <span>{session.startTime}</span>
                          <span style={{ margin: '0 5px' }}>→</span>
                          <span>{session.endTime || 'Completed'}</span>
                          {session.notes && (
                            <span style={{ marginLeft: '10px', color: 'var(--text-muted)', fontStyle: 'italic' }}>
                              "{session.notes}"
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Right: Duration pill & Action buttons */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <div
                        style={{
                          background: 'var(--page-bg)',
                          border: '1px solid var(--border-color)',
                          padding: '4px 10px',
                          borderRadius: '8px',
                          fontSize: '0.84rem',
                          fontWeight: 800,
                          color: 'var(--text-primary)',
                        }}
                      >
                        {durStr}
                      </div>

                      {/* Edit Button */}
                      <button
                        type="button"
                        className="btn-icon"
                        onClick={() => setEditingSession(session)}
                        title="Edit Stop Reason / Notes"
                        style={{ color: 'var(--text-secondary)' }}
                      >
                        <Edit2 size={15} />
                      </button>

                      {/* Delete Button */}
                      <button
                        type="button"
                        className="btn-icon"
                        onClick={() => deleteWorkSession(session.id)}
                        title="Delete this work log"
                        style={{ color: 'var(--danger, #EF4444)' }}
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Right Column: Stop Reasons Summary & Productivity Insights */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div
            style={{
              background: 'var(--card-bg)',
              border: '1px solid var(--border-color)',
              borderRadius: '14px',
              padding: '18px 20px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
              <Coffee size={18} color="#F59E0B" />
              <h3 style={{ fontSize: '0.98rem', fontWeight: 800, margin: 0, color: 'var(--text-primary)' }}>
                Stop Reasons Breakdown
              </h3>
            </div>

            {Object.keys(reasonBreakdown).length === 0 ? (
              <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', textAlign: 'center', padding: '16px 0' }}>
                No stop reasons recorded yet for this date.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {Object.entries(reasonBreakdown).map(([reason, secs]) => {
                  const m = Math.floor(secs / 60);
                  const h = Math.floor(m / 60);
                  const remM = m % 60;
                  const timeLabel = h > 0 ? `${h}h ${remM}m` : `${m}m`;
                  const pct = totalSecondsLogged > 0 ? Math.round((secs / totalSecondsLogged) * 100) : 0;
                  const icon = REASON_ICONS[reason] || '🛑';

                  return (
                    <div key={reason} style={{ fontSize: '0.82rem' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                        <span style={{ fontWeight: 600, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '5px' }}>
                          <span>{icon}</span> {reason}
                        </span>
                        <span style={{ fontWeight: 700, color: 'var(--text-secondary)' }}>
                          {timeLabel} ({pct}%)
                        </span>
                      </div>
                      <div
                        style={{
                          height: '6px',
                          background: 'var(--page-bg)',
                          borderRadius: '999px',
                          overflow: 'hidden',
                        }}
                      >
                        <div
                          style={{
                            height: '100%',
                            width: `${pct}%`,
                            background: '#F59E0B',
                            borderRadius: '999px',
                          }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Productivity Tip Box */}
          <div
            style={{
              background: 'rgba(59, 130, 246, 0.08)',
              border: '1px solid rgba(59, 130, 246, 0.25)',
              borderRadius: '14px',
              padding: '16px 18px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
              <Award size={18} color="#3B82F6" />
              <div style={{ fontSize: '0.92rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                Session Habit Tip
              </div>
            </div>
            <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
              Logging why you pause or stop (lunch, tea, meetings, interruptions) helps you discover where your workday time actually goes and build deeper daily focus streaks!
            </p>
          </div>
        </div>
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
              maxWidth: '500px',
              background: 'var(--card-bg)',
              border: '1px solid var(--border-color)',
              borderRadius: '16px',
              boxShadow: 'var(--shadow-xl)',
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                padding: '18px 22px',
                borderBottom: '1px solid var(--border-color)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <h3 style={{ fontSize: '1.1rem', fontWeight: 800, margin: 0, color: 'var(--text-primary)' }}>
                Log Past Work Session
              </h3>
              <button
                type="button"
                className="btn-icon"
                onClick={() => setIsManualModalOpen(false)}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveManualSession} style={{ padding: '20px 22px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
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
              maxWidth: '480px',
              background: 'var(--card-bg)',
              border: '1px solid var(--border-color)',
              borderRadius: '16px',
              boxShadow: 'var(--shadow-xl)',
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                padding: '18px 22px',
                borderBottom: '1px solid var(--border-color)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <h3 style={{ fontSize: '1.1rem', fontWeight: 800, margin: 0, color: 'var(--text-primary)' }}>
                Edit Work Session Details
              </h3>
              <button
                type="button"
                className="btn-icon"
                onClick={() => setEditingSession(null)}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveEditSession} style={{ padding: '20px 22px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
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
