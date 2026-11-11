import React, { useState } from 'react';
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
  Coffee,
  CheckCircle2,
  FileText,
  AlertCircle,
  TrendingUp,
  Link2,
  Briefcase,
  Utensils,
  PhoneCall,
  Users,
  PauseCircle,
  Flag,
  Zap,
  Activity,
  Target,
  Sparkles,
  Layers,
  Code,
  Check,
  Flame,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { formatDate, getTodayDateString } from '../utils/dateUtils';
import '../styles/pages/worktracker.css';

function getReasonMeta(reason, isWork = false) {
  if (isWork) {
    return {
      icon: <Briefcase size={16} color="#10B981" />,
      bg: 'rgba(16, 185, 129, 0.16)',
      borderColor: 'rgba(16, 185, 129, 0.35)',
      color: '#10B981',
      label: 'Focus Work Session',
    };
  }
  const r = (reason || '').toLowerCase();
  if (r.includes('coffee') || r.includes('tea')) {
    return {
      icon: <Coffee size={16} color="#F59E0B" />,
      bg: 'rgba(245, 158, 11, 0.16)',
      borderColor: 'rgba(245, 158, 11, 0.35)',
      color: '#F59E0B',
      label: reason || 'Coffee Break',
    };
  }
  if (r.includes('lunch') || r.includes('dinner') || r.includes('meal') || r.includes('food')) {
    return {
      icon: <Utensils size={16} color="#F97316" />,
      bg: 'rgba(249, 115, 22, 0.16)',
      borderColor: 'rgba(249, 115, 22, 0.35)',
      color: '#F97316',
      label: reason || 'Meal Intermission',
    };
  }
  if (r.includes('phone') || r.includes('call') || r.includes('discussion')) {
    return {
      icon: <PhoneCall size={16} color="#3B82F6" />,
      bg: 'rgba(59, 130, 246, 0.16)',
      borderColor: 'rgba(59, 130, 246, 0.35)',
      color: '#3B82F6',
      label: reason || 'Phone Call',
    };
  }
  if (r.includes('meeting') || r.includes('team') || r.includes('sync')) {
    return {
      icon: <Users size={16} color="#A855F7" />,
      bg: 'rgba(168, 85, 247, 0.16)',
      borderColor: 'rgba(168, 85, 247, 0.35)',
      color: '#A855F7',
      label: reason || 'Team Meeting',
    };
  }
  if (r.includes('personal') || r.includes('stepped') || r.includes('break') || r.includes('nap')) {
    return {
      icon: <PauseCircle size={16} color="#EC4899" />,
      bg: 'rgba(236, 72, 153, 0.16)',
      borderColor: 'rgba(236, 72, 153, 0.35)',
      color: '#EC4899',
      label: reason || 'Personal Break',
    };
  }
  if (r.includes('completed') || r.includes('finished work')) {
    return {
      icon: <CheckCircle2 size={16} color="#10B981" />,
      bg: 'rgba(16, 185, 129, 0.16)',
      borderColor: 'rgba(16, 185, 129, 0.35)',
      color: '#10B981',
      label: reason || 'Task Completed',
    };
  }
  if (r.includes('today') || r.includes('finish')) {
    return {
      icon: <Flag size={16} color="#6366F1" />,
      bg: 'rgba(99, 102, 241, 0.16)',
      borderColor: 'rgba(99, 102, 241, 0.35)',
      color: '#6366F1',
      label: reason || 'Finished for Today',
    };
  }
  return {
    icon: <Clock size={16} color="#06B6D4" />,
    bg: 'rgba(6, 182, 212, 0.16)',
    borderColor: 'rgba(6, 182, 212, 0.35)',
    color: '#06B6D4',
    label: reason || 'Intermission',
  };
}

function parseTimeToSeconds(timeStr) {
  if (!timeStr) return null;
  if (timeStr.includes('T')) {
    const d = new Date(timeStr);
    if (!isNaN(d.getTime())) return d.getHours() * 3600 + d.getMinutes() * 60 + d.getSeconds();
  }
  const isPM = /pm/i.test(timeStr);
  const isAM = /am/i.test(timeStr);
  const cleanStr = timeStr.replace(/\s*(am|pm)/i, '').trim();
  const parts = cleanStr.split(':').map((p) => parseInt(p, 10));
  if (parts.length >= 2 && !isNaN(parts[0]) && !isNaN(parts[1])) {
    let hours = parts[0];
    const mins = parts[1];
    const secs = parts[2] || 0;
    if (isPM && hours < 12) hours += 12;
    if (isAM && hours === 12) hours = 0;
    return hours * 3600 + mins * 60 + secs;
  }
  return null;
}

function calculateTimeDiff(startStr, endStr) {
  const startSec = parseTimeToSeconds(startStr);
  const endSec = parseTimeToSeconds(endStr);
  if (startSec !== null && endSec !== null) {
    if (endSec >= startSec) {
      return endSec - startSec;
    } else {
      // Crossed midnight or wrap-around
      return (86400 - startSec) + endSec;
    }
  }
  return 0;
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

  // Metrics (Clean inline calculations)
  const totalSecondsLogged =
    isRunning && activeWorkSession?.date === activeDate
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

  // Chronological Session Stream Builder
  // Alternating sequence: [Work 1: Start -> Stop] -> [Break 1: Stop -> Resume (Reason & Remarks)] -> [Work 2: Resume -> Stop/Live] -> ...
  const chronologicalStream = useMemo(() => {
    // 1. Sort all recorded sessions for this date chronologically
    const sorted = [...dateSessions].sort((a, b) => {
      const aSec = parseTimeToSeconds(a.startTime) ?? 0;
      const bSec = parseTimeToSeconds(b.startTime) ?? 0;
      return aSec - bSec;
    });

    const stream = [];

    for (let i = 0; i < sorted.length; i++) {
      const sess = sorted[i];
      const durSeconds = sess.durationSeconds || 0;
      const durMin = Math.floor(durSeconds / 60);
      const durSec = durSeconds % 60;
      const durHours = Math.floor(durMin / 60);
      const remainMin = durMin % 60;
      const durStr = durHours > 0 ? `${durHours}h ${remainMin}m` : `${durMin}m ${durSec}s`;

      // 1. Work Session Card (Start to Stop)
      stream.push({
        id: sess.id || `work-${i}`,
        type: 'work',
        sessionId: sess.id,
        taskId: sess.taskId,
        taskTitle: sess.taskTitle || 'General Focus Session',
        startTime: sess.startTime || 'Started',
        endTime: sess.endTime || 'Completed',
        durationSeconds: durSeconds,
        durationStr: durStr,
        rawSession: sess,
      });

      // 2. Break / Intermission Card (from stop time of this session to start time of next session or activeWorkSession)
      const nextSession = sorted[i + 1];
      const nextStartTime = nextSession?.startTime || (isRunning && isToday ? activeWorkSession?.startTime : null);

      if (sess.endTime && nextStartTime) {
        const gapSeconds = calculateTimeDiff(sess.endTime, nextStartTime);
        const gapMin = Math.floor(gapSeconds / 60);
        const gapSec = gapSeconds % 60;
        const gapHours = Math.floor(gapMin / 60);
        const gapRemainMin = gapMin % 60;
        const gapDurStr = gapHours > 0 ? `${gapHours}h ${gapRemainMin}m` : `${gapMin}m ${gapSec}s`;

        stream.push({
          id: `break-${sess.id || i}`,
          type: 'gap',
          startTime: sess.endTime,
          endTime: nextStartTime,
          durationSeconds: gapSeconds,
          durationStr: gapDurStr,
          reason: sess.stopReason || 'Intermission',
          notes: sess.notes || '',
          sessionId: sess.id,
          rawSession: sess,
        });
      } else if (sess.endTime && i === sorted.length - 1 && isPaused && isToday) {
        // Tracker is currently paused / taking a break right now!
        stream.push({
          id: `break-ongoing-${sess.id}`,
          type: 'gap',
          isOngoing: true,
          startTime: sess.endTime,
          endTime: 'Ongoing Break',
          reason: sess.stopReason || todayChain?.lastPauseReason || 'Personal Break',
          notes: sess.notes || todayChain?.lastPauseRemarks || '',
          sessionId: sess.id,
          rawSession: sess,
        });
      }
    }

    // 3. If currently running, add the Live Work Segment card at the end
    if (isRunning && isToday && activeWorkSession) {
      stream.push({
        id: 'active-live-work',
        type: 'work',
        isLive: true,
        taskId: activeWorkSession.taskId,
        taskTitle: activeWorkSession.taskTitle || 'Live Work Segment',
        startTime: activeWorkSession.startTime || 'Now',
        endTime: 'Tracking Live',
        durationSeconds: currentLiveWorkSeconds,
        durationStr: activeTimerDisplay,
      });
    }

    return stream;
  }, [dateSessions, activeWorkSession, isRunning, isPaused, isToday, currentLiveWorkSeconds, activeTimerDisplay, todayChain]);

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
      {/* ==========================================================================
          MISSION CONTROL FOCUS COCKPIT DECK (COMPACT INTEGRATED HEADER)
         ========================================================================== */}
      <div
        className={`focus-cockpit-deck ${
          isRunning ? 'is-running' : isPaused ? 'is-paused' : isFinished ? 'is-finished' : 'is-idle'
        }`}
      >
        {/* Cockpit Status Bar, Day Stepper & Inline Micro-Stats */}
        <div className="cockpit-top-bar">
          <div className="cockpit-top-left">
            {isRunning ? (
              <div className="cockpit-mode-pill is-running">
                <Activity size={14} className="animate-pulse" />
                <span>Live Work Session In Progress</span>
              </div>
            ) : isPaused ? (
              <div className="cockpit-mode-pill is-paused">
                <Coffee size={14} />
                <span>Work Paused · Stopped at {todayChain.lastPausedTimeStr}</span>
              </div>
            ) : isFinished ? (
              <div className="cockpit-mode-pill is-finished">
                <Flag size={14} />
                <span>Workday Completed</span>
              </div>
            ) : (
              <div className="cockpit-mode-pill is-idle">
                <Target size={14} />
                <span>Ready for Deep Focus</span>
              </div>
            )}

            {/* Integrated Day Navigator */}
            <div className="cockpit-day-stepper">
              <button
                type="button"
                className="btn-stepper-nav"
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
              <span className="cockpit-date-label">
                <Calendar size={13} className="text-secondary" />
                {isToday ? `Today (${formatDate(activeDate, { month: 'short', day: 'numeric' })})` : formattedDateTitle}
              </span>
              <button
                type="button"
                className="btn-stepper-nav"
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
                  className="btn-jump-today"
                  onClick={() => setSelectedDate(todayStr)}
                  title="Return to Today"
                >
                  Today
                </button>
              )}
            </div>
          </div>

          {/* Integrated Micro-Stats Badges & Quick Action */}
          <div className="cockpit-top-right">
            <div className="cockpit-micro-stats">
              <div className="micro-stat-badge" title="Total focus logged today">
                <Zap size={13} className="text-emerald-400" />
                <span>Total:</span>
                <strong>{totalHours}h {totalMinutes}m {totalSecs}s</strong>
              </div>

              <div className="micro-stat-badge" title="Completed work sessions today">
                <Layers size={13} className="text-blue-400" />
                <span>Blocks:</span>
                <strong>{sessionCount}</strong>
              </div>

              <div className="micro-stat-badge" title="Average duration per block">
                <TrendingUp size={13} className="text-purple-400" />
                <span>Avg:</span>
                <strong>{avgSessionMinutes}m</strong>
              </div>

              {Object.keys(reasonBreakdown).length > 0 && (
                <div className="micro-stat-badge" title="Distinct break / intermission reasons recorded">
                  <Coffee size={13} className="text-amber-400" />
                  <span>Breaks:</span>
                  <strong>{Object.keys(reasonBreakdown).length}</strong>
                </div>
              )}
            </div>

            <button
              type="button"
              className="btn-log-session-compact"
              onClick={handleOpenManualModal}
              title="Log past focus block or intermission"
            >
              <Plus size={13} />
              <span>Log Past Session</span>
            </button>
          </div>
        </div>

        {/* Center Stage: Sculpted 3D Digital Chronometer Pods */}
        <div className="cockpit-chronometer-stage">
          <div className="chronometer-pods-row">
            {/* Hours Pod */}
            <div className="chronometer-pod">
              <span className="chronometer-pod-val">{String(activeHrs).padStart(2, '0')}</span>
              <span className="chronometer-pod-label">HOURS</span>
            </div>

            <span className="chronometer-separator">:</span>

            {/* Minutes Pod */}
            <div className="chronometer-pod">
              <span className="chronometer-pod-val">{String(activeMins).padStart(2, '0')}</span>
              <span className="chronometer-pod-label">MINUTES</span>
            </div>

            <span className="chronometer-separator">:</span>

            {/* Seconds Pod */}
            <div className="chronometer-pod">
              <span className="chronometer-pod-val">{String(activeSecs).padStart(2, '0')}</span>
              <span className="chronometer-pod-label">SECONDS</span>
            </div>
          </div>

          {/* Subtitle Status Indicator */}
          <div className="chronometer-sub-status">
            {isRunning ? (
              <>
                <Sparkles size={13} className="text-emerald-400" />
                <span>Focus timer ticking forward continuously · Started at {activeWorkSession.startTime}</span>
              </>
            ) : isPaused ? (
              <>
                <Coffee size={13} className="text-amber-400" />
                <span>Timer holds steady at {activeTimerDisplay} · Resumes instantly on click</span>
              </>
            ) : totalRecordedForDate > 0 ? (
              <>
                <Clock size={13} className="text-blue-400" />
                <span>Total accumulated focus holds at {activeTimerDisplay} · Launches next block on click</span>
              </>
            ) : (
              <>
                <Target size={13} className="text-blue-400" />
                <span>Select a focus target below and click Launch to start tracking</span>
              </>
            )}
          </div>
        </div>

        {/* Task Focus Target Selector & Quick Chips */}
        <div className="cockpit-target-section">
          <div className="cockpit-target-row">
            <div className="cockpit-target-label">
              <Target size={15} className="text-blue-400" />
              <span>Current Focus Target:</span>
            </div>

            {isRunning ? (
              <div className="cockpit-task-locked-pill">
                <span className="worktracker-recording-dot" />
                <span>{activeWorkSession.taskTitle || 'General Focus Session'}</span>
              </div>
            ) : (
              <select
                value={selectedTaskId}
                onChange={(e) => setSelectedTaskId(e.target.value)}
                className="cockpit-task-select"
              >
                <option value="">🎯 General Focus (No linked task)</option>
                {dateTasks.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.title} [{t.startTime || 'Scheduled'}]
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* Quick Task Chips for Scheduled Tasks */}
          {!isRunning && dateTasks.length > 0 && (
            <div className="cockpit-quick-chips">
              <span className="quick-chips-label">Quick select scheduled task:</span>
              {dateTasks.slice(0, 7).map((t) => {
                const isSel = selectedTaskId === t.id;
                return (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setSelectedTaskId(isSel ? '' : t.id)}
                    className={`quick-chip-btn ${isSel ? 'is-selected' : ''}`}
                  >
                    {isSel && <Check size={11} />}
                    <span>{t.title}</span>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Persistent "Work Paused" Alert Banner */}
        {isPaused && (
          <div className="cockpit-paused-banner">
            <div className="paused-banner-left">
              <div className="paused-coffee-badge">
                <Coffee size={20} />
              </div>
              <div>
                <div className="paused-banner-title">
                  Work Paused: {todayChain.lastPauseReason || 'Break'}
                </div>
                <div className="paused-banner-sub">
                  Stopped at <strong>{todayChain.lastPausedTimeStr}</strong>
                  {todayChain.lastPauseRemarks && todayChain.lastPauseRemarks !== todayChain.lastPauseReason && (
                    <span> · "{todayChain.lastPauseRemarks}"</span>
                  )}
                  {' '}· Focus timer holds steady at <strong className="text-emerald-400">{activeTimerDisplay}</strong>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleStartSession}
                id="btn-tracker-resume-session"
                className="btn-resume-focus"
              >
                <Play size={15} fill="currentColor" />
                <span>Resume Work</span>
              </button>
              <button
                type="button"
                onClick={() => finishDayWorkSession(activeDate)}
                id="btn-tracker-finish-day"
                className="btn-finish-day"
              >
                <Flag size={14} />
                <span>Finish Day</span>
              </button>
            </div>
          </div>
        )}

        {/* Primary Interactive Action Bar */}
        <div className="cockpit-actions-bar">
          {isRunning ? (
            <button
              type="button"
              onClick={requestStopWorkSession}
              id="btn-tracker-stop-session"
              className="btn-stop-focus"
            >
              <Square size={16} fill="currentColor" />
              <span>Stop Work & Enter Remarks</span>
            </button>
          ) : isPaused ? (
            <>
              <button
                type="button"
                onClick={handleStartSession}
                id="btn-tracker-start-session"
                className="btn-resume-focus"
              >
                <Play size={16} fill="currentColor" />
                <span>Resume Focus ({activeTimerDisplay})</span>
              </button>
              <button
                type="button"
                onClick={() => finishDayWorkSession(activeDate)}
                className="btn-finish-day"
              >
                <Flag size={14} />
                <span>Finish Day</span>
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                onClick={handleStartSession}
                id="btn-tracker-start-session"
                className="btn-launch-focus"
              >
                <Play size={18} fill="currentColor" />
                <span>Launch Focus Session</span>
              </button>
              {totalRecordedForDate > 0 && !isFinished && (
                <button
                  type="button"
                  onClick={() => finishDayWorkSession(activeDate)}
                  className="btn-finish-day"
                  title="Conclude workday tracking"
                >
                  <Flag size={14} />
                  <span>Finish Day</span>
                </button>
              )}
            </>
          )}
        </div>
      </div>

      {/* ==========================================================================
          CHRONOLOGICAL FOCUS STREAM (TIMELINE SPINE)
         ========================================================================== */}
      <div className="focus-stream-section">
        <div className="focus-stream-header">
          <div className="flex items-center gap-2">
            <h2 className="focus-stream-title">
              <Link2 size={19} className="text-blue-400" />
              Work & Remarks Session Chain
            </h2>
            {chronologicalStream.length > 0 && (
              <span className="focus-stream-counter">
                {chronologicalStream.length} blocks logged
              </span>
            )}
          </div>
          <span className="focus-stream-subhint">
            <Sparkles size={13} className="text-emerald-400" />
            Chronological work & break intermission stream
          </span>
        </div>

        {chronologicalStream.length === 0 ? (
          <div className="focus-stream-empty-deck">
            <div className="empty-sparkle-box">
              <Sparkles size={28} />
            </div>
            <div className="empty-stream-title">
              No focus sessions recorded yet for {isToday ? 'today' : formattedDateTitle}
            </div>
            <p className="empty-stream-desc">
              Launch your first focus session above. When you stop for breaks, calls, or lunch, your remarks create an auto-calculated, continuous chronological chain.
            </p>
            <button
              type="button"
              className="btn-launch-focus"
              onClick={handleStartSession}
              style={{ padding: '10px 22px', fontSize: '0.85rem' }}
            >
              <Play size={15} fill="currentColor" /> Launch First Session
            </button>
          </div>
        ) : (
          <div className="focus-timeline-container">
            {chronologicalStream.map((item, index) => {
              const isWork = item.type === 'work';
              const isLive = item.isLive;
              const isOngoing = item.isOngoing;
              const reasonMeta = getReasonMeta(item.reason, isWork);
              const linkedTask = item.taskId ? tasks.find((t) => t.id === item.taskId) : null;

              if (isLive) {
                return (
                  <div key={item.id} className="stream-node-wrapper">
                    <div className="stream-node-pin is-active">
                      <div style={{ width: 7, height: 7, borderRadius: '50%', background: '#FFFFFF' }} />
                    </div>

                    <div className="stream-node-card is-active animate-pulse">
                      <div className="stream-node-left">
                        <div
                          className="stream-node-icon-box"
                          style={{ background: '#10B981', color: '#FFFFFF', boxShadow: '0 0 14px rgba(16, 185, 129, 0.4)' }}
                        >
                          <Timer size={18} />
                        </div>

                        <div className="stream-node-details">
                          <div className="stream-node-title-row">
                            <span className="stream-node-title">
                              {item.taskTitle}
                            </span>
                            <span className="stream-badge-work is-live">
                              <Activity size={11} className="animate-pulse" /> Recording
                            </span>
                          </div>

                          <div className="stream-node-meta">
                            <span className="stream-time-badge">
                              <Clock size={12} className="text-emerald-400" />
                              Started at {item.startTime}
                            </span>
                            <span className="meta-bullet">•</span>
                            <span className="meta-context text-emerald-400">
                              Real-time continuous focus tracking
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="stream-node-right">
                        <div className="stream-node-duration is-live" style={{ color: '#34D399' }}>
                          <Timer size={13} />
                          <span>{item.durationStr}</span>
                        </div>
                        <button
                          type="button"
                          className="btn-stop-focus"
                          onClick={requestStopWorkSession}
                          style={{ padding: '6px 14px', fontSize: '0.78rem' }}
                        >
                          <Square size={12} fill="currentColor" /> Stop & Remarks
                        </button>
                      </div>
                    </div>
                  </div>
                );
              }

              if (isWork) {
                return (
                  <div key={item.id || index} className="stream-node-wrapper">
                    <div className="stream-node-pin">
                      <div
                        style={{
                          width: 7,
                          height: 7,
                          borderRadius: '50%',
                          background: '#10B981',
                          boxShadow: '0 0 6px #10B981',
                        }}
                      />
                    </div>

                    <div className="stream-node-card is-work">
                      <div className="stream-node-left">
                        <div
                          className="stream-node-icon-box"
                          style={{
                            background: 'rgba(16, 185, 129, 0.16)',
                            border: '1px solid rgba(16, 185, 129, 0.35)',
                          }}
                        >
                          <Zap size={18} color="#10B981" />
                        </div>

                        <div className="stream-node-details">
                          <div className="stream-node-title-row">
                            <span className="stream-node-title">{item.taskTitle}</span>

                            <span className="stream-badge-work">
                              <span className="stream-pulse-dot" /> Focus Segment
                            </span>

                            {linkedTask?.category && (
                              <span className="stream-task-category-pill">
                                <span
                                  className="category-color-dot"
                                  style={{ background: linkedTask.categoryColor || '#3B82F6' }}
                                />
                                <span>{linkedTask.category}</span>
                              </span>
                            )}
                          </div>

                          <div className="stream-node-meta">
                            <span className="stream-time-badge">
                              <Clock size={12} className="text-emerald-400" />
                              {item.startTime} → {item.endTime}
                            </span>
                            <span className="meta-bullet">•</span>
                            <span className="meta-context">
                              {item.durationStr} focused session
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="stream-node-right">
                        <div className="stream-node-duration">
                          <Timer size={13} />
                          <span>{item.durationStr}</span>
                        </div>

                        <div className="stream-node-actions">
                          <button
                            type="button"
                            className="stream-action-btn"
                            onClick={() => setEditingSession(item.rawSession)}
                            title="Edit session details"
                          >
                            <Edit2 size={13} />
                          </button>
                          <button
                            type="button"
                            className="stream-action-btn btn-delete"
                            onClick={() => {
                              if (window.confirm('Are you sure you want to delete this session log?')) {
                                deleteWorkSession(item.sessionId);
                              }
                            }}
                            title="Delete session log"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              }

              // Intermission / Break Node (from Stop to Restart with reason & remarks)
              return (
                <div key={item.id || index} className="stream-node-wrapper">
                  <div className="stream-node-pin is-gap">
                    <div
                      style={{
                        width: 7,
                        height: 7,
                        borderRadius: '50%',
                        background: '#F59E0B',
                        boxShadow: '0 0 6px #F59E0B',
                      }}
                    />
                  </div>

                  <div className={`stream-node-card is-gap ${isOngoing ? 'is-ongoing-gap' : ''}`}>
                    <div className="stream-node-left">
                      <div
                        className="stream-node-icon-box"
                        style={{
                          background: reasonMeta.bg,
                          border: `1px solid ${reasonMeta.borderColor}`,
                        }}
                      >
                        {reasonMeta.icon}
                      </div>

                      <div className="stream-node-details">
                        <div className="stream-node-title-row">
                          <span className="stream-node-title">
                            {isOngoing ? `Current Gap: ${item.reason}` : `Break: ${item.reason}`}
                          </span>

                          <span
                            className="stream-reason-pill"
                            style={{
                              background: reasonMeta.bg,
                              borderColor: reasonMeta.borderColor,
                              color: reasonMeta.color,
                            }}
                          >
                            {reasonMeta.icon}
                            <span>{item.reason}</span>
                          </span>

                          {isOngoing && (
                            <span className="stream-node-badge badge-amber">
                              Paused
                            </span>
                          )}
                        </div>

                        <div className="stream-node-meta">
                          <span className="stream-time-badge">
                            <Clock size={12} className="text-amber-400" />
                            {item.startTime} → {item.endTime}
                          </span>
                          <span className="meta-bullet">•</span>
                          <span className="meta-context">
                            {isOngoing
                              ? `Paused since ${item.startTime} · Resumes automatically on click`
                              : `${item.durationStr} break intermission`}
                          </span>
                        </div>

                        {item.notes && item.notes.trim() !== '' && (
                          <div className="stream-node-remarks-banner">
                            <FileText size={13} className="text-amber-400" />
                            <span className="remarks-tag">Stop Remarks:</span>
                            <span className="remarks-text">"{item.notes}"</span>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="stream-node-right">
                      {isOngoing ? (
                        <button
                          type="button"
                          onClick={handleStartSession}
                          className="btn-resume-focus"
                          style={{ padding: '7px 16px', fontSize: '0.78rem' }}
                        >
                          <Play size={13} fill="currentColor" /> Resume Work
                        </button>
                      ) : (
                        <>
                          <div className="stream-node-duration is-gap">
                            <Timer size={13} />
                            <span>⚡ {item.durationStr}</span>
                          </div>
                          {item.rawSession && (
                            <div className="stream-node-actions">
                              <button
                                type="button"
                                className="stream-action-btn"
                                onClick={() => setEditingSession(item.rawSession)}
                                title="Edit break reason & remarks"
                              >
                                <Edit2 size={13} />
                              </button>
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
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
          <div className="card w-full max-w-md rounded-2xl shadow-2xl overflow-hidden border border-color">
            <div className="p-4 border-b border-color flex justify-between items-center">
              <h3 className="text-sm font-extrabold m-0 text-primary flex items-center gap-2">
                <Plus size={16} className="text-blue-400" />
                Log Past Work Session
              </h3>
              <button
                type="button"
                className="btn-icon w-7 h-7"
                onClick={() => setIsManualModalOpen(false)}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveManualSession} className="p-4 flex flex-col gap-3">
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

              <div className="grid grid-cols-2 gap-3">
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
                  <option value="">🎯 General Focus / No Task</option>
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

              <div className="flex justify-end gap-2.5 pt-2">
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
          <div className="card w-full max-w-sm rounded-2xl shadow-2xl overflow-hidden border border-color">
            <div className="p-4 border-b border-color flex justify-between items-center">
              <h3 className="text-sm font-extrabold m-0 text-primary flex items-center gap-2">
                <Edit2 size={15} className="text-blue-400" />
                Edit Work Session Details
              </h3>
              <button
                type="button"
                className="btn-icon w-7 h-7"
                onClick={() => setEditingSession(null)}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveEditSession} className="p-4 flex flex-col gap-3">
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
                  Notes / Accomplishments:
                </label>
                <textarea
                  rows={3}
                  className="form-input"
                  value={editingSession.notes || ''}
                  onChange={(e) => setEditingSession({ ...editingSession, notes: e.target.value })}
                />
              </div>

              <div className="flex justify-end gap-2.5 pt-2">
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
