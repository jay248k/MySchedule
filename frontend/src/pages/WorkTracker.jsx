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
  Briefcase,
  Utensils,
  PhoneCall,
  Users,
  PauseCircle,
  Flag
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { formatDate, getTodayDateString } from '../utils/dateUtils';
import '../styles/pages/worktracker.css';

function getReasonMeta(reason, isWork = false) {
  if (isWork) {
    return {
      icon: <Briefcase size={15} color="#10B981" />,
      bg: 'rgba(16, 185, 129, 0.14)',
      color: '#10B981',
      label: 'Focus Work Session'
    };
  }
  const r = (reason || '').toLowerCase();
  if (r.includes('coffee') || r.includes('tea')) {
    return { icon: <Coffee size={15} color="#F59E0B" />, bg: 'rgba(245, 158, 11, 0.14)', color: '#F59E0B', label: reason || 'Coffee Break' };
  }
  if (r.includes('lunch') || r.includes('dinner') || r.includes('meal')) {
    return { icon: <Utensils size={15} color="#F97316" />, bg: 'rgba(249, 115, 22, 0.14)', color: '#F97316', label: reason || 'Meal Break' };
  }
  if (r.includes('phone') || r.includes('call') || r.includes('discussion')) {
    return { icon: <PhoneCall size={15} color="#3B82F6" />, bg: 'rgba(59, 130, 246, 0.14)', color: '#3B82F6', label: reason || 'Phone Call' };
  }
  if (r.includes('meeting') || r.includes('team')) {
    return { icon: <Users size={15} color="#8B5CF6" />, bg: 'rgba(139, 92, 246, 0.14)', color: '#8B5CF6', label: reason || 'Meeting' };
  }
  if (r.includes('personal') || r.includes('stepped') || r.includes('break')) {
    return { icon: <PauseCircle size={15} color="#EC4899" />, bg: 'rgba(236, 72, 153, 0.14)', color: '#EC4899', label: reason || 'Personal Break' };
  }
  if (r.includes('completed') || r.includes('finished work')) {
    return { icon: <CheckCircle2 size={15} color="#10B981" />, bg: 'rgba(16, 185, 129, 0.14)', color: '#10B981', label: reason || 'Task Completed' };
  }
  if (r.includes('today') || r.includes('finish')) {
    return { icon: <Flag size={15} color="#6366F1" />, bg: 'rgba(99, 102, 241, 0.14)', color: '#6366F1', label: reason || 'Finished for Today' };
  }
  return { icon: <Clock size={15} color="#06B6D4" />, bg: 'rgba(6, 182, 212, 0.14)', color: '#06B6D4', label: reason || 'Intermission' };
}

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

  // Filter sessions for currently active date
  const dateSessions = workSessions.filter((s) => s.date === activeDate);
  const totalRecordedForDate = dateSessions.reduce(
    (acc, s) => acc + (Number(s.durationSeconds) || 0),
    0
  );

  // Active session or accumulated duration (derived from shared AppContext master ticker)
  let activeElapsedSeconds = 0;
  if (isRunning) {
    activeElapsedSeconds = Math.max(totalRecordedForDate, currentLiveWorkSeconds);
  } else if (isPaused) {
    activeElapsedSeconds = Math.max(totalRecordedForDate, todayChain?.accumulatedWorkSeconds || 0);
  } else {
    activeElapsedSeconds = totalRecordedForDate;
  }

  const activeHrs = Math.floor(activeElapsedSeconds / 3600);
  const activeMins = Math.floor((activeElapsedSeconds % 3600) / 60);
  const activeSecs = activeElapsedSeconds % 60;
  const activeTimerDisplay = `${String(activeHrs).padStart(2, '0')}:${String(activeMins).padStart(2, '0')}:${String(activeSecs).padStart(2, '0')}`;

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
  const totalSecondsLogged = isRunning && activeWorkSession?.date === activeDate
    ? Math.max(totalRecordedForDate, currentLiveWorkSeconds)
    : totalRecordedForDate;

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
    <div className="worktracker-container">
      {/* Top Header Bar */}
      <div className="worktracker-header">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="worktracker-title">
              Today's Work Tracker & Session Logs
            </h1>
            {isRunning && (
              <span className="worktracker-recording-pill">
                <span className="worktracker-recording-dot" />
                RECORDING
              </span>
            )}
          </div>
          <p className="worktracker-sub">
            Track your focused work sessions in real time, record stop/pause reasons, and review productivity breakdown.
          </p>
        </div>

        {/* Date Selector & Manual Session Button */}
        <div className="worktracker-header-actions">
          {/* Day Stepper */}
          <div className="flex items-center bg-card border border-color rounded-md py-0.5 px-1.5">
            <button
              type="button"
              className="btn-icon w-6.5 h-6.5"
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
            <span className="text-xs font-bold px-1.5 text-primary">
              {isToday ? `Today (${formatDate(activeDate, { month: 'short', day: 'numeric' })})` : formattedDateTitle}
            </span>
            <button
              type="button"
              className="btn-icon w-6.5 h-6.5"
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
                className="btn btn-ghost btn-xs ml-1 text-xs py-0.5 px-1.5 text-primary"
                onClick={() => setSelectedDate(todayStr)}
              >
                Today
              </button>
            )}
          </div>

          <button
            type="button"
            className="btn btn-secondary btn-sm flex items-center gap-1.5 h-7.5 text-xs px-2.5"
            onClick={handleOpenManualModal}
          >
            <Plus size={14} />
            <span>Log Past Session</span>
          </button>
        </div>
      </div>

      {/* KPI Metric Cards */}
      <div className="worktracker-kpi-grid">
        {/* Total Time */}
        <div className="worktracker-kpi-card kpi-green">
          <div className="worktracker-kpi-header">
            <span className="worktracker-kpi-title">
              Total Tracked Work
            </span>
            <div className="worktracker-kpi-icon-box bg-emerald-500/15 text-emerald-500">
              <Clock size={15} />
            </div>
          </div>
          <div>
            <div className="flex items-baseline gap-1.5">
              <span className="worktracker-kpi-val">
                {totalHours}h {totalMinutes}m {totalSecs}s
              </span>
            </div>
            <div className="worktracker-kpi-sub">
              Across {sessionCount} {sessionCount === 1 ? 'session' : 'sessions'}
            </div>
          </div>
        </div>

        {/* Total Sessions */}
        <div className="worktracker-kpi-card kpi-blue">
          <div className="worktracker-kpi-header">
            <span className="worktracker-kpi-title">
              Completed Sessions
            </span>
            <div className="worktracker-kpi-icon-box bg-blue-500/15 text-blue-500">
              <Timer size={15} />
            </div>
          </div>
          <div>
            <div className="flex items-baseline gap-1">
              <span className="worktracker-kpi-val">
                {sessionCount}
              </span>
              <span className="text-xs font-bold text-secondary">
                {sessionCount === 1 ? 'Session' : 'Sessions'}
              </span>
            </div>
            <div className="worktracker-kpi-sub">
              {isRunning ? '1 active running' : 'All sessions logged'}
            </div>
          </div>
        </div>

        {/* Avg Duration */}
        <div className="worktracker-kpi-card kpi-purple">
          <div className="worktracker-kpi-header">
            <span className="worktracker-kpi-title">
              Average Session
            </span>
            <div className="worktracker-kpi-icon-box bg-purple-500/15 text-purple-500">
              <TrendingUp size={15} />
            </div>
          </div>
          <div>
            <div className="flex items-baseline gap-1">
              <span className="worktracker-kpi-val">
                {avgSessionMinutes}
              </span>
              <span className="text-xs font-bold text-secondary">
                min
              </span>
            </div>
            <div className="worktracker-kpi-sub">
              Average focused duration per block
            </div>
          </div>
        </div>

        {/* Pause / Stop Count */}
        <div className="worktracker-kpi-card kpi-amber">
          <div className="worktracker-kpi-header">
            <span className="worktracker-kpi-title">
              Stop Reasons Logged
            </span>
            <div className="worktracker-kpi-icon-box bg-amber-500/15 text-amber-500">
              <Coffee size={15} />
            </div>
          </div>
          <div>
            <div className="flex items-baseline gap-1">
              <span className="worktracker-kpi-val">
                {Object.keys(reasonBreakdown).length}
              </span>
              <span className="text-xs font-bold text-secondary">
                Types
              </span>
            </div>
            <div className="worktracker-kpi-sub">
              Breaks, meals, meetings & interruptions
            </div>
          </div>
        </div>
      </div>

      {/* Persistent Work Paused Banner */}
      {isPaused && (
        <div className="worktracker-paused-banner">
          <div className="flex items-center gap-2.5">
            <div className="worktracker-paused-icon">
              ☕
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-sm font-extrabold text-amber-200">
                  Work Paused: {todayChain.lastPauseReason || 'Break'}
                </span>
                <span className="bg-amber-500 text-black text-xs font-black px-1.5 rounded-full uppercase">
                  PAUSED
                </span>
              </div>
              <div className="text-xs text-slate-300 mt-0.5">
                Stopped at: <strong>{todayChain.lastPausedTimeStr}</strong>{' '}
                {todayChain.lastPauseRemarks && todayChain.lastPauseRemarks !== todayChain.lastPauseReason && (
                  <span>· "{todayChain.lastPauseRemarks}" </span>
                )}
                · Focus so far: <strong className="text-emerald-400">{activeTimerDisplay}</strong>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleStartSession}
              id="btn-tracker-resume-session"
              className="btn btn-primary text-xs py-1.5 px-3.5 font-extrabold inline-flex items-center gap-1.5"
            >
              <Play size={14} fill="#FFFFFF" />
              <span>Resume Work</span>
            </button>
            <button
              type="button"
              onClick={() => finishDayWorkSession(activeDate)}
              id="btn-tracker-finish-day"
              className="btn text-xs py-1.5 px-3 font-bold bg-red-500/15 border border-red-500/45 text-red-300"
            >
              <Square size={12} fill="currentColor" style={{ marginRight: 4 }} /> Finish Day
            </button>
          </div>
        </div>
      )}

      {/* Main Interactive Work Timer Card */}
      <div
        className={`card worktracker-live-card ${
          isRunning ? 'is-running' : isPaused ? 'is-paused' : 'is-idle'
        }`}
      >
        <div className="flex justify-between items-center flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <div
              className="w-7.5 h-7.5 rounded-md flex items-center justify-center shrink-0"
              style={{
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
                color: isRunning ? '#10B981' : isPaused ? '#F59E0B' : '#1769FF',
              }}
            >
              <Timer size={16} />
            </div>
            <div>
              <div className="text-sm font-extrabold text-primary">
                {isRunning
                  ? 'Active Work Session in Progress'
                  : isPaused
                  ? `Work Paused · Stopped at ${todayChain.lastPausedTimeStr}`
                  : isFinished
                  ? 'Workday Completed'
                  : 'Start a New Work Session'}
              </div>
              <div className="text-xs text-secondary">
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
          <div className="flex items-center gap-1.5">
            {isRunning ? (
              <button
                type="button"
                onClick={requestStopWorkSession}
                id="btn-tracker-stop-session"
                className="worktracker-btn-stop"
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
                  className="worktracker-btn-start"
                >
                  <Play size={15} fill="#FFFFFF" />
                  <span>Resume Work ({activeTimerDisplay})</span>
                </button>
                <button
                  type="button"
                  onClick={() => finishDayWorkSession(activeDate)}
                  className="btn text-xs py-1.5 px-3 font-bold bg-red-500/15 border border-red-500/40 text-red-500 rounded-md"
                >
                  <Square size={12} fill="currentColor" style={{ marginRight: 4 }} /> Finish Day
                </button>
              </>
            ) : (
              <button
                type="button"
                onClick={handleStartSession}
                id="btn-tracker-start-session"
                className="worktracker-btn-start"
              >
                <Play size={15} fill="#FFFFFF" />
                <span>Start Tracking Work</span>
              </button>
            )}
          </div>
        </div>

        {/* Center: Large LED Timer Readout & Task Selector */}
        <div className="worktracker-led-readout">
          {/* LED Readout */}
          <div className="flex items-center gap-3">
            <div
              className="worktracker-led-digits"
              style={{
                color: isRunning ? '#10B981' : isPaused ? '#F59E0B' : 'var(--text-primary)',
              }}
            >
              {activeTimerDisplay}
            </div>
            <div className="text-xs text-secondary font-semibold">
              {isRunning ? (
                <div>
                  <div className="text-emerald-400 font-extrabold text-xs">LIVE SESSION TRACKING</div>
                  <div className="text-xs">Timer ticking forward continuously</div>
                </div>
              ) : isPaused ? (
                <div>
                  <div className="text-amber-500 font-extrabold text-xs">WORK PAUSED AT {todayChain.lastPausedTimeStr}</div>
                  <div className="text-xs">Frozen at {activeTimerDisplay} · Resumes upon click</div>
                </div>
              ) : totalRecordedForDate > 0 ? (
                <div>
                  <div className="text-blue-400 font-extrabold text-xs">TOTAL ACCUMULATED TODAY</div>
                  <div className="text-xs">Holds at {activeTimerDisplay} · Starts from this time on click</div>
                </div>
              ) : (
                <div>
                  <div className="text-muted font-bold text-xs">TIMER IDLE</div>
                  <div className="text-xs">Press "Start Tracking Work" to begin</div>
                </div>
              )}
            </div>
          </div>

          {/* Associate Task Dropdown */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-secondary">
              Focus Task:
            </span>
            {isRunning ? (
              <span className="bg-blue-500/15 border border-blue-500 text-blue-300 py-1 px-2.5 rounded text-xs font-bold">
                {activeWorkSession.taskTitle || 'General Focus'}
              </span>
            ) : (
              <select
                value={selectedTaskId}
                onChange={(e) => setSelectedTaskId(e.target.value)}
                className="worktracker-task-select"
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
      <div className="flex flex-col gap-2.5">
          <div className="flex justify-between items-center">
            <h2 className="text-sm font-extrabold m-0 text-primary flex items-center gap-1.5">
              <Link2 size={18} color="var(--primary-color)" /> Work & Remarks Session Chain
              {(todayChain?.chain?.length > 0 || dateSessions.length > 0) && (
                <span className="text-xs bg-blue-500/20 text-blue-400 py-0.5 px-1.5 rounded-full font-bold">
                  {(todayChain?.chain?.length || dateSessions.length)} nodes
                </span>
              )}
            </h2>
            <span className="text-xs text-secondary">
              Auto-computes break gaps upon resuming
            </span>
          </div>

          {(todayChain?.chain?.length === 0 && dateSessions.length === 0 && !isRunning && !isPaused) ? (
            <div className="card p-7 text-center text-muted border border-dashed border-color rounded-md">
              <Timer size={32} className="mx-auto mb-2 opacity-40" />
              <div className="text-sm font-bold text-primary">
                No work sessions recorded yet for {isToday ? 'today' : formattedDateTitle}
              </div>
              <p className="text-xs max-w-sm mx-auto my-2">
                Click <strong>"Start Tracking Work"</strong> to begin. When you stop for a break or call, your remarks create a continuous chain.
              </p>
              <button
                type="button"
                className="btn btn-primary btn-sm inline-flex items-center gap-1.5 h-7 text-xs px-3"
                onClick={handleStartSession}
              >
                <Play size={12} fill="currentColor" /> Start Tracking Work
              </button>
            </div>
          ) : (
            <div className="worktracker-sessions-list">
              {/* If Chain nodes exist, render the chronological chain */}
              {todayChain?.chain?.length > 0 ? (
                todayChain.chain.map((node, index) => {
                  const isWork = node.type === 'work';
                  const durMinutes = Math.floor((node.durationSeconds || 0) / 60);
                  const durHours = Math.floor(durMinutes / 60);
                  const remainMinutes = durMinutes % 60;
                  const durLabel = durHours > 0 ? `${durHours}h ${remainMinutes}m` : `${durMinutes}m`;
                  const meta = getReasonMeta(node.reason, isWork);

                  return (
                    <div
                      key={node.id || index}
                      className={`worktracker-session-card ${!isWork ? 'is-gap' : ''}`}
                    >
                      <div className="worktracker-session-left">
                        <div className="worktracker-session-icon" style={{ background: meta.bg }}>
                          {meta.icon}
                        </div>
                        <div className="worktracker-session-details">
                          <div className="worktracker-session-title-row">
                            <span className="worktracker-session-title">
                              {isWork ? (node.taskTitle || 'Focus Work Session') : `Break / Interruption: ${node.reason || 'Pause'}`}
                            </span>
                            <span className={`worktracker-session-badge ${isWork ? 'badge-green' : 'badge-amber'}`}>
                              {isWork ? 'Work Segment' : 'Intermission'}
                            </span>
                          </div>
                          <div className="worktracker-session-meta">
                            <span>{node.startTime} – {node.endTime}</span>
                            {!isWork && node.remarks && node.remarks !== node.reason && (
                              <span className="worktracker-session-notes">"{node.remarks}"</span>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="worktracker-session-right">
                        <span className={`worktracker-session-duration ${!isWork ? 'is-gap' : ''}`}>
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
                  const meta = getReasonMeta(session.stopReason, false);

                  return (
                    <div
                      key={session.id}
                      className="worktracker-session-card"
                    >
                      <div className="worktracker-session-left">
                        <div className="worktracker-session-icon" style={{ background: meta.bg }}>
                          {meta.icon}
                        </div>
                        <div className="worktracker-session-details">
                          <div className="worktracker-session-title-row">
                            <span className="worktracker-session-title">
                              {session.taskTitle || 'General Focus Session'}
                            </span>
                            <span className="worktracker-session-badge badge-green">
                              {session.stopReason || 'Finished Work'}
                            </span>
                          </div>
                          <div className="worktracker-session-meta">
                            <span>{session.startTime} – {session.endTime || 'Completed'}</span>
                            {session.notes && <span className="worktracker-session-notes"> · "{session.notes}"</span>}
                          </div>
                        </div>
                      </div>

                      <div className="worktracker-session-right">
                        <span className="worktracker-session-duration">
                          {durStr}
                        </span>
                        <button
                          type="button"
                          className="btn-icon"
                          onClick={() => setEditingSession(session)}
                          title="Edit remarks"
                          style={{ padding: '4px' }}
                        >
                          <Edit2 size={13} />
                        </button>
                        <button
                          type="button"
                          className="btn-icon text-red-500"
                          onClick={() => deleteWorkSession(session.id)}
                          title="Delete session"
                          style={{ padding: '4px' }}
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </div>
                  );
                })
              )}

              {/* Active Running Session Segment in the Chain */}
              {isRunning && activeWorkSession?.date === activeDate && (
                <div className="worktracker-session-card is-active animate-pulse">
                  <div className="worktracker-session-left">
                    <div className="worktracker-session-icon" style={{ background: '#10B981', color: '#FFFFFF' }}>
                      <Timer size={16} />
                    </div>
                    <div className="worktracker-session-details">
                      <div className="worktracker-session-title-row">
                        <span className="worktracker-session-title">
                          {activeWorkSession?.taskTitle || 'Live Work Segment'}
                        </span>
                        <span className="worktracker-session-badge badge-green">
                          Recording
                        </span>
                      </div>
                      <div className="worktracker-session-meta">
                        <span>Started at {activeWorkSession?.startTime || 'now'}</span>
                        <span>· Real-time focus tracking</span>
                      </div>
                    </div>
                  </div>

                  <div className="worktracker-session-right">
                    <span className="worktracker-session-duration" style={{ fontSize: '0.9rem', color: '#10B981' }}>
                      {activeHrs > 0 ? `${activeHrs}h ` : ''}{activeMins}m {activeSecs}s
                    </span>
                    <button
                      type="button"
                      className="worktracker-btn-stop"
                      onClick={requestStopWorkSession}
                      style={{ padding: '4px 10px', fontSize: '0.74rem' }}
                    >
                      <Square size={11} fill="#FFFFFF" /> Stop & Remarks
                    </button>
                  </div>
                </div>
              )}

              {/* If currently paused, render the active pause node in the chain */}
              {isPaused && (
                <div className="worktracker-session-card is-gap" style={{ borderStyle: 'dashed' }}>
                  <div className="worktracker-session-left">
                    <div className="worktracker-session-icon is-gap">
                      <span>⏳</span>
                    </div>
                    <div className="worktracker-session-details">
                      <div className="worktracker-session-title-row">
                        <span className="worktracker-session-title" style={{ color: '#FDE68A' }}>
                          Current Gap: {todayChain.lastPauseReason || 'Pause'}
                        </span>
                        <span className="worktracker-session-badge badge-amber">
                          Paused
                        </span>
                      </div>
                      <div className="worktracker-session-meta">
                        <span>Paused since {todayChain.lastPausedTimeStr}</span>
                        <span>· Auto-calculates upon resuming</span>
                      </div>
                    </div>
                  </div>
                  <div className="worktracker-session-right">
                    <button
                      type="button"
                      onClick={handleStartSession}
                      className="worktracker-btn-start"
                      style={{ padding: '5px 12px', fontSize: '0.74rem' }}
                    >
                      <Play size={12} fill="#FFFFFF" /> Resume Work
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
      </div>

      {/* Manual Past Session Modal */}
      {isManualModalOpen && (
        <div
          className="modal-overlay"
          onClick={(e) => {
            if (e.target === e.currentTarget) setIsManualModalOpen(false);
          }}
        >
          <div className="card w-full max-w-md rounded-xl shadow-xl overflow-hidden">
            <div className="p-3 px-4.5 border-b border-color flex justify-between items-center">
              <h3 className="text-sm font-extrabold m-0 text-primary">
                Log Past Work Session
              </h3>
              <button
                type="button"
                className="btn-icon w-6.5 h-6.5"
                onClick={() => setIsManualModalOpen(false)}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveManualSession} className="p-3.5 px-4.5 flex flex-col gap-2.5">
              <div>
                <label className="text-xs font-semibold text-secondary block mb-1">
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

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="text-xs font-semibold text-secondary block mb-1">
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
                  <label className="text-xs font-semibold text-secondary block mb-1">
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
                <label className="text-xs font-semibold text-secondary block mb-1">
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
                <label className="text-xs font-semibold text-secondary block mb-1">
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
                  <option value="Finished for Today">Finished for Today</option>
                  <option value="Finished Work">✅ Finished Work</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-secondary block mb-1">
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
                <label className="text-xs font-semibold text-secondary block mb-1">
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

              <div className="flex justify-end gap-2.5 pt-2.5">
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
          className="modal-overlay"
          onClick={(e) => {
            if (e.target === e.currentTarget) setEditingSession(null);
          }}
        >
          <div className="card w-full max-w-sm rounded-xl shadow-xl overflow-hidden">
            <div className="p-3 px-4.5 border-b border-color flex justify-between items-center">
              <h3 className="text-sm font-extrabold m-0 text-primary">
                Edit Work Session Details
              </h3>
              <button
                type="button"
                className="btn-icon w-6.5 h-6.5"
                onClick={() => setEditingSession(null)}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveEditSession} className="p-3.5 px-4.5 flex flex-col gap-2.5">
              <div>
                <label className="text-xs font-semibold text-secondary block mb-1">
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
                <label className="text-xs font-semibold text-secondary block mb-1">
                  Notes / What did you accomplish?
                </label>
                <textarea
                  rows={3}
                  className="form-input"
                  value={editingSession.notes || ''}
                  onChange={(e) => setEditingSession({ ...editingSession, notes: e.target.value })}
                />
              </div>

              <div className="flex justify-end gap-2.5 pt-2.5">
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
