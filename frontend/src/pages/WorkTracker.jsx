import React, { useState, useMemo } from 'react';
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
  X,
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
  const str = String(timeStr).trim();
  if (str.includes('T')) {
    const d = new Date(str);
    if (!isNaN(d.getTime())) return d.getHours() * 3600 + d.getMinutes() * 60 + d.getSeconds();
  }
  const isPM = /pm/i.test(str);
  const isAM = /am/i.test(str);
  const match = str.match(/(\d{1,2}):(\d{1,2})(?::(\d{1,2}))?/);
  if (match) {
    let hours = parseInt(match[1], 10);
    const mins = parseInt(match[2], 10);
    const secs = match[3] ? parseInt(match[3], 10) : 0;
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
      const nextStartTime = nextSession?.startTime || (isRunning && (isToday || activeWorkSession?.date === activeDate) ? activeWorkSession?.startTime : null);

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
      } else if (sess.endTime && i === sorted.length - 1 && !isRunning) {
        // Last session and not currently tracking work -> Ongoing / Paused Break!
        stream.push({
          id: `break-ongoing-${sess.id}`,
          type: 'gap',
          isOngoing: true,
          startTime: sess.endTime,
          endTime: 'Ongoing Break',
          reason: sess.stopReason || todayChain?.lastPauseReason || 'Break',
          notes: sess.notes || todayChain?.lastPauseRemarks || '',
          sessionId: sess.id,
          rawSession: sess,
        });
      }
    }

    // 3. If currently running, add the Live Work Segment card at the end
    if (isRunning && (isToday || activeWorkSession?.date === activeDate) && activeWorkSession) {
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
        className={`focus-cockpit-deck ${isRunning ? 'is-running' : isPaused ? 'is-paused' : isFinished ? 'is-finished' : 'is-idle'
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

        {/* Core Cockpit Command Row (Compact Digital Chronometer + Target Selector + Action Controls) */}
        <div className="cockpit-core-row">
          {/* Left Wing: Sculpted Compact Digital Chronometer */}
          <div className="cockpit-chronometer-stage">
            <div className="chronometer-pods-row">
              <div className="chronometer-pod">
                <span className="chronometer-pod-val">{String(activeHrs).padStart(2, '0')}</span>
                <span className="chronometer-pod-label">HRS</span>
              </div>
              <span className="chronometer-separator">:</span>
              <div className="chronometer-pod">
                <span className="chronometer-pod-val">{String(activeMins).padStart(2, '0')}</span>
                <span className="chronometer-pod-label">MIN</span>
              </div>
              <span className="chronometer-separator">:</span>
              <div className="chronometer-pod">
                <span className="chronometer-pod-val">{String(activeSecs).padStart(2, '0')}</span>
                <span className="chronometer-pod-label">SEC</span>
              </div>
            </div>

            <div className="chronometer-sub-status">
              {isRunning ? (
                <>
                  <Sparkles size={11} className="text-emerald-400" />
                  <span>Tracking · Started {activeWorkSession.startTime}</span>
                </>
              ) : isPaused ? (
                <>
                  <Coffee size={11} className="text-amber-400" />
                  <span>Holds at {activeTimerDisplay}</span>
                </>
              ) : totalRecordedForDate > 0 ? (
                <>
                  <Clock size={11} className="text-blue-400" />
                  <span>Today: {activeTimerDisplay}</span>
                </>
              ) : (
                <>
                  <Target size={11} className="text-blue-400" />
                  <span>Ready to start focus</span>
                </>
              )}
            </div>
          </div>

          {/* Center Wing: Target Selector & Quick Pick */}
          <div className="cockpit-center-wing">
            {isPaused ? (
              <div className="cockpit-paused-inline">
                <div className="paused-coffee-badge">
                  <Coffee size={16} />
                </div>
                <div className="paused-info-wrap">
                  <div className="paused-title">Work Paused: {(todayChain.lastPauseReason || 'Break').replace(/["'“”]/g, '')}</div>
                  <div className="paused-sub">
                    Stopped at <strong>{todayChain.lastPausedTimeStr}</strong>
                    {todayChain.lastPauseRemarks && (
                      <span> · {todayChain.lastPauseRemarks.replace(/["'“”]/g, '').trim()}</span>
                    )}
                  </div>
                </div>
              </div>
            ) : isRunning ? (
              <div className="cockpit-running-inline">
                <span className="worktracker-recording-dot" />
                <div className="running-info-wrap">
                  <span className="running-label">CURRENT ACTIVE SESSION</span>
                  <span className="running-task-title">{activeWorkSession.taskTitle || 'General Focus Session'}</span>
                </div>
              </div>
            ) : (
              <div className="cockpit-target-picker">
                <div className="cockpit-target-input-row">
                  <label className="cockpit-target-inline-label">
                    <Target size={13} className="text-blue-400" />
                    <span>Target:</span>
                  </label>
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
                </div>

                {!isRunning && dateTasks.length > 0 && (
                  <div className="cockpit-quick-chips">
                    <span className="quick-chips-label">Quick:</span>
                    <div className="quick-chips-scroll">
                      {dateTasks.slice(0, 6).map((t) => {
                        const isSel = selectedTaskId === t.id;
                        return (
                          <button
                            key={t.id}
                            type="button"
                            onClick={() => setSelectedTaskId(isSel ? '' : t.id)}
                            className={`quick-chip-btn ${isSel ? 'is-selected' : ''}`}
                            title={t.title}
                          >
                            {isSel && <Check size={10} />}
                            <span className="chip-text-truncate">{t.title}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Right Wing: Primary Action Controls */}
          <div className="cockpit-actions-bar">
            {isRunning ? (
              <button
                type="button"
                onClick={requestStopWorkSession}
                id="btn-tracker-stop-session"
                className="btn-stop-focus"
              >
                <Square size={14} fill="currentColor" />
                <span>Stop Work</span>
              </button>
            ) : isPaused ? (
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleStartSession}
                  id="btn-tracker-resume-session"
                  className="btn-resume-focus"
                >
                  <Play size={14} fill="currentColor" />
                  <span>Resume Work</span>
                </button>
                <button
                  type="button"
                  onClick={() => finishDayWorkSession(activeDate)}
                  id="btn-tracker-finish-day"
                  className="btn-finish-day"
                >
                  <Flag size={13} />
                  <span>Finish Day</span>
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleStartSession}
                  id="btn-tracker-start-session"
                  className="btn-launch-focus"
                >
                  <Play size={15} fill="currentColor" />
                  <span>Launch Focus</span>
                </button>
                {totalRecordedForDate > 0 && !isFinished && (
                  <button
                    type="button"
                    onClick={() => finishDayWorkSession(activeDate)}
                    className="btn-finish-day"
                    title="Conclude workday tracking"
                  >
                    <Flag size={13} />
                    <span>Finish</span>
                  </button>
                )}
              </div>
            )}
          </div>
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

              const linkedCategoryName = typeof linkedTask?.category === 'object'
                ? linkedTask.category?.name
                : linkedTask?.category;
              const linkedCategoryColor = (typeof linkedTask?.category === 'object' ? linkedTask.category?.color : null)
                || linkedTask?.categoryColor
                || linkedTask?.color
                || '#3B82F6';

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
                              <Activity size={10} className="animate-pulse" /> Live
                            </span>
                            {linkedCategoryName && (
                              <span className="stream-task-category-pill">
                                <span
                                  className="category-color-dot"
                                  style={{ background: linkedCategoryColor }}
                                />
                                <span>{linkedCategoryName}</span>
                              </span>
                            )}
                          </div>

                          <div className="stream-node-meta">
                            <span className="stream-time-badge">
                              <Clock size={11} className="text-emerald-400" />
                              Started at {item.startTime}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="stream-node-right">
                        <div className="stream-node-duration is-live" style={{ color: '#34D399' }}>
                          <Timer size={12} />
                          <span>{item.durationStr}</span>
                        </div>
                        <button
                          type="button"
                          className="btn-stop-focus"
                          onClick={requestStopWorkSession}
                          style={{ padding: '5px 12px', fontSize: '0.76rem' }}
                        >
                          <Square size={11} fill="currentColor" /> Stop
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
                          width: 6,
                          height: 6,
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
                          <Zap size={15} color="#10B981" />
                        </div>

                        <div className="stream-node-details">
                          <div className="stream-node-title-row">
                            <span className="stream-node-title">{item.taskTitle}</span>

                            <span className="stream-badge-work">
                              <span className="stream-pulse-dot" /> Focus
                            </span>

                            {linkedCategoryName && (
                              <span className="stream-task-category-pill">
                                <span
                                  className="category-color-dot"
                                  style={{ background: linkedCategoryColor }}
                                />
                                <span>{linkedCategoryName}</span>
                              </span>
                            )}
                          </div>

                          <div className="stream-node-meta">
                            <span className="stream-time-badge">
                              <Clock size={11} className="text-emerald-400" />
                              {item.startTime} → {item.endTime}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="stream-node-right">
                        <div className="stream-node-duration">
                          <Timer size={12} />
                          <span>{item.durationStr}</span>
                        </div>

                        <div className="stream-node-actions">
                          <button
                            type="button"
                            className="stream-action-btn"
                            onClick={() => setEditingSession(item.rawSession)}
                            title="Edit session details"
                          >
                            <Edit2 size={12} />
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
                            <Trash2 size={12} />
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
                        width: 6,
                        height: 6,
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
                        {(() => {
                          const cleanReason = (item.reason || '').replace(/["'“”]/g, '').trim();
                          const cleanNotes = (item.notes || '').replace(/["'“”]/g, '').trim();
                          const isGeneric = !cleanReason || cleanReason.toLowerCase() === 'break' || cleanReason.toLowerCase() === 'intermission';
                          const displayTitle = isGeneric ? (isOngoing ? 'Paused Intermission' : 'Break Intermission') : cleanReason;
                          const hasSeparateNotes = cleanNotes && cleanNotes.toLowerCase() !== cleanReason.toLowerCase();

                          return (
                            <>
                              <div className="stream-node-title-row">
                                <span className="stream-node-title">
                                  {displayTitle}
                                </span>

                                <span className="stream-badge-break">
                                  <Coffee size={10} />
                                  <span>{isOngoing ? 'Paused' : 'Intermission'}</span>
                                </span>
                              </div>

                              <div className="stream-node-meta">
                                <span className="stream-time-badge is-gap">
                                  <Clock size={11} className="text-amber-400" />
                                  {item.startTime} → {item.endTime}
                                </span>

                                {hasSeparateNotes && (
                                  <span className="stream-compact-remarks" title={cleanNotes}>
                                    <FileText size={11} className="text-amber-400" />
                                    <span className="remarks-text-clean">{cleanNotes}</span>
                                  </span>
                                )}
                              </div>
                            </>
                          );
                        })()}
                      </div>
                    </div>

                    <div className="stream-node-right">
                      {isOngoing ? (
                        <button
                          type="button"
                          onClick={handleStartSession}
                          className="btn-resume-focus"
                          style={{ padding: '5px 12px', fontSize: '0.76rem' }}
                        >
                          <Play size={12} fill="currentColor" /> Resume Work
                        </button>
                      ) : (
                        <>
                          <div className="stream-node-duration is-gap">
                            <Timer size={12} />
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
                                <Edit2 size={12} />
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
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 1000,
            backgroundColor: 'rgba(0, 0, 0, 0.72)',
            backdropFilter: 'blur(8px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '16px',
            animation: 'fadeIn 0.2s ease-out',
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget) setIsManualModalOpen(false);
          }}
        >
          <div
            className="card"
            style={{
              width: '100%',
              maxWidth: '480px',
              background: 'var(--card-bg, #10192D)',
              border: '1px solid rgba(23, 105, 255, 0.25)',
              borderRadius: '16px',
              boxShadow: '0 24px 60px -12px rgba(0, 0, 0, 0.65), 0 0 28px rgba(23, 105, 255, 0.12)',
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            <div
              style={{
                padding: '16px 20px',
                borderBottom: '1px solid var(--border-color, rgba(255, 255, 255, 0.08))',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                background: 'linear-gradient(180deg, rgba(23, 105, 255, 0.12) 0%, transparent 100%)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div
                  style={{
                    width: '34px',
                    height: '34px',
                    borderRadius: '9px',
                    background: 'rgba(23, 105, 255, 0.15)',
                    border: '1px solid rgba(23, 105, 255, 0.35)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#60A5FA',
                  }}
                >
                  <Plus size={16} />
                </div>
                <div>
                  <h3 style={{ fontSize: '1.05rem', fontWeight: 800, margin: 0, color: 'var(--text-primary, #FFFFFF)' }}>
                    Log Past Work Session
                  </h3>
                  <div style={{ fontSize: '0.74rem', color: 'var(--text-secondary, #94A3B8)' }}>
                    Manually add a completed focus interval
                  </div>
                </div>
              </div>

              <button
                type="button"
                className="btn-icon"
                onClick={() => setIsManualModalOpen(false)}
                style={{
                  width: '30px',
                  height: '30px',
                  borderRadius: '8px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'var(--text-muted, #64748B)',
                  cursor: 'pointer',
                }}
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleSaveManualSession} style={{ padding: '18px 20px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-primary, #FFFFFF)', marginBottom: '6px' }}>
                  <Calendar size={13} style={{ color: '#60A5FA' }} />
                  <span>Date:</span>
                </label>
                <input
                  type="date"
                  className="form-input"
                  value={manualForm.date}
                  onChange={(e) => setManualForm({ ...manualForm, date: e.target.value })}
                  required
                  style={{
                    width: '100%',
                    padding: '9px 12px',
                    borderRadius: '8px',
                    background: 'var(--input-bg, rgba(255, 255, 255, 0.04))',
                    border: '1px solid var(--border-color, rgba(255, 255, 255, 0.14))',
                    color: 'var(--text-primary, #FFFFFF)',
                    fontSize: '0.86rem',
                  }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-primary, #FFFFFF)', marginBottom: '6px' }}>
                    <Clock size={13} style={{ color: '#10B981' }} />
                    <span>Start Time:</span>
                  </label>
                  <input
                    type="time"
                    className="form-input"
                    value={manualForm.startTime}
                    onChange={(e) => setManualForm({ ...manualForm, startTime: e.target.value })}
                    required
                    style={{
                      width: '100%',
                      padding: '9px 12px',
                      borderRadius: '8px',
                      background: 'var(--input-bg, rgba(255, 255, 255, 0.04))',
                      border: '1px solid var(--border-color, rgba(255, 255, 255, 0.14))',
                      color: 'var(--text-primary, #FFFFFF)',
                      fontSize: '0.86rem',
                    }}
                  />
                </div>
                <div>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-primary, #FFFFFF)', marginBottom: '6px' }}>
                    <Clock size={13} style={{ color: '#F59E0B' }} />
                    <span>End Time:</span>
                  </label>
                  <input
                    type="time"
                    className="form-input"
                    value={manualForm.endTime}
                    onChange={(e) => setManualForm({ ...manualForm, endTime: e.target.value })}
                    required
                    style={{
                      width: '100%',
                      padding: '9px 12px',
                      borderRadius: '8px',
                      background: 'var(--input-bg, rgba(255, 255, 255, 0.04))',
                      border: '1px solid var(--border-color, rgba(255, 255, 255, 0.14))',
                      color: 'var(--text-primary, #FFFFFF)',
                      fontSize: '0.86rem',
                    }}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-primary, #FFFFFF)', marginBottom: '6px' }}>
                  <Timer size={13} style={{ color: '#10B981' }} />
                  <span>Duration (Minutes):</span>
                </label>
                <input
                  type="number"
                  min="1"
                  max="1440"
                  className="form-input"
                  value={manualForm.durationMinutes}
                  onChange={(e) => setManualForm({ ...manualForm, durationMinutes: e.target.value })}
                  required
                  style={{
                    width: '100%',
                    padding: '9px 12px',
                    borderRadius: '8px',
                    background: 'var(--input-bg, rgba(255, 255, 255, 0.04))',
                    border: '1px solid var(--border-color, rgba(255, 255, 255, 0.14))',
                    color: 'var(--text-primary, #FFFFFF)',
                    fontSize: '0.86rem',
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-primary, #FFFFFF)', marginBottom: '6px' }}>
                  <Coffee size={13} style={{ color: '#F59E0B' }} />
                  <span>Reason for Stopping / Pause:</span>
                </label>
                <select
                  className="form-input"
                  value={manualForm.stopReason}
                  onChange={(e) => setManualForm({ ...manualForm, stopReason: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '9px 12px',
                    borderRadius: '8px',
                    background: 'var(--input-bg, rgba(255, 255, 255, 0.04))',
                    border: '1px solid var(--border-color, rgba(255, 255, 255, 0.14))',
                    color: 'var(--text-primary, #FFFFFF)',
                    fontSize: '0.86rem',
                  }}
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
                <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-primary, #FFFFFF)', marginBottom: '6px' }}>
                  <Target size={13} style={{ color: '#8B5CF6' }} />
                  <span>Linked Task (Optional):</span>
                </label>
                <select
                  className="form-input"
                  value={manualForm.taskId}
                  onChange={(e) => setManualForm({ ...manualForm, taskId: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '9px 12px',
                    borderRadius: '8px',
                    background: 'var(--input-bg, rgba(255, 255, 255, 0.04))',
                    border: '1px solid var(--border-color, rgba(255, 255, 255, 0.14))',
                    color: 'var(--text-primary, #FFFFFF)',
                    fontSize: '0.86rem',
                  }}
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
                <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-primary, #FFFFFF)', marginBottom: '6px' }}>
                  <FileText size={13} style={{ color: '#06B6D4' }} />
                  <span>Notes / Progress:</span>
                </label>
                <textarea
                  rows={2}
                  className="form-input"
                  placeholder="What was completed during this block..."
                  value={manualForm.notes}
                  onChange={(e) => setManualForm({ ...manualForm, notes: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '9px 12px',
                    borderRadius: '8px',
                    background: 'var(--input-bg, rgba(255, 255, 255, 0.04))',
                    border: '1px solid var(--border-color, rgba(255, 255, 255, 0.14))',
                    color: 'var(--text-primary, #FFFFFF)',
                    fontSize: '0.86rem',
                    resize: 'vertical',
                  }}
                />
              </div>

              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'flex-end',
                  gap: '10px',
                  paddingTop: '8px',
                  borderTop: '1px solid var(--border-color, rgba(255, 255, 255, 0.06))',
                }}
              >
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setIsManualModalOpen(false)}
                  style={{
                    fontSize: '0.84rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '7px 14px',
                  }}
                >
                  <X size={14} /> Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  style={{
                    fontSize: '0.84rem',
                    fontWeight: 700,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '7px 18px',
                    background: 'var(--primary-color, #1769FF)',
                    boxShadow: '0 4px 14px rgba(23, 105, 255, 0.35)',
                  }}
                >
                  <Check size={14} /> Save Session Log
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
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 1000,
            backgroundColor: 'rgba(0, 0, 0, 0.72)',
            backdropFilter: 'blur(8px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '16px',
            animation: 'fadeIn 0.2s ease-out',
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget) setEditingSession(null);
          }}
        >
          <div
            className="card"
            style={{
              width: '100%',
              maxWidth: '490px',
              background: 'var(--card-bg, #10192D)',
              border: '1px solid rgba(23, 105, 255, 0.28)',
              borderRadius: '16px',
              boxShadow: '0 24px 60px -12px rgba(0, 0, 0, 0.65), 0 0 28px rgba(23, 105, 255, 0.12)',
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            {/* Modal Header */}
            <div
              style={{
                padding: '16px 20px',
                borderBottom: '1px solid var(--border-color, rgba(255, 255, 255, 0.08))',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                background: 'linear-gradient(180deg, rgba(23, 105, 255, 0.12) 0%, transparent 100%)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div
                  style={{
                    width: '34px',
                    height: '34px',
                    borderRadius: '9px',
                    background: 'rgba(23, 105, 255, 0.15)',
                    border: '1px solid rgba(23, 105, 255, 0.35)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#60A5FA',
                  }}
                >
                  <Edit2 size={16} />
                </div>
                <div>
                  <h3 style={{ fontSize: '1.05rem', fontWeight: 800, margin: 0, color: 'var(--text-primary, #FFFFFF)' }}>
                    Edit Work Session Details
                  </h3>
                  <div style={{ fontSize: '0.74rem', color: 'var(--text-secondary, #94A3B8)' }}>
                    Update stop reason, notes, or linked task
                  </div>
                </div>
              </div>

              <button
                type="button"
                className="btn-icon"
                onClick={() => setEditingSession(null)}
                style={{
                  width: '30px',
                  height: '30px',
                  borderRadius: '8px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'var(--text-muted, #64748B)',
                  cursor: 'pointer',
                }}
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleSaveEditSession} style={{ padding: '18px 20px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {/* Session Meta Strip */}
              {(editingSession.startTime || editingSession.durationSeconds) && (
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '9px 13px',
                    borderRadius: '10px',
                    background: 'rgba(23, 105, 255, 0.06)',
                    border: '1px solid rgba(23, 105, 255, 0.18)',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '7px' }}>
                    <Clock size={13} style={{ color: '#60A5FA' }} />
                    <span style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-primary, #FFFFFF)' }}>
                      {editingSession.startTime || 'Start'} → {editingSession.endTime || 'Present'}
                    </span>
                  </div>
                  {editingSession.durationSeconds ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                      <Timer size={12} style={{ color: '#10B981' }} />
                      <span style={{ fontSize: '0.76rem', fontWeight: 700, color: '#10B981', fontFamily: 'monospace' }}>
                        {Math.floor(editingSession.durationSeconds / 60)}m {editingSession.durationSeconds % 60}s
                      </span>
                    </div>
                  ) : null}
                </div>
              )}

              {/* Stop / Break Reason Field */}
              <div>
                <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-primary, #FFFFFF)', marginBottom: '6px' }}>
                  <Coffee size={13} style={{ color: '#F59E0B' }} />
                  <span>Stop Reason:</span>
                </label>

                {/* Quick Presets */}
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px', marginBottom: '8px' }}>
                  {[
                    'Coffee / Tea Break',
                    'Lunch Break',
                    'Team Meeting',
                    'Phone Call',
                    'Stepped Away',
                    'Task Completed',
                    'Switching Tasks',
                  ].map((preset) => {
                    const isSelected = editingSession.stopReason === preset;
                    return (
                      <button
                        key={preset}
                        type="button"
                        onClick={() => setEditingSession({ ...editingSession, stopReason: preset })}
                        style={{
                          fontSize: '0.72rem',
                          fontWeight: 600,
                          padding: '3px 8px',
                          borderRadius: '6px',
                          border: isSelected
                            ? '1px solid var(--primary-color, #1769FF)'
                            : '1px solid var(--border-color, rgba(255, 255, 255, 0.1))',
                          background: isSelected
                            ? 'rgba(23, 105, 255, 0.2)'
                            : 'rgba(255, 255, 255, 0.03)',
                          color: isSelected
                            ? '#60A5FA'
                            : 'var(--text-secondary, #94A3B8)',
                          cursor: 'pointer',
                          transition: 'all 0.15s ease',
                        }}
                      >
                        {preset}
                      </button>
                    );
                  })}
                </div>

                <input
                  type="text"
                  className="form-input"
                  value={editingSession.stopReason || ''}
                  onChange={(e) => setEditingSession({ ...editingSession, stopReason: e.target.value })}
                  placeholder="e.g. Lunch, Team Meeting, Call..."
                  required
                  style={{
                    width: '100%',
                    padding: '9px 12px',
                    borderRadius: '8px',
                    background: 'var(--input-bg, rgba(255, 255, 255, 0.04))',
                    border: '1px solid var(--border-color, rgba(255, 255, 255, 0.14))',
                    color: 'var(--text-primary, #FFFFFF)',
                    fontSize: '0.86rem',
                  }}
                />
              </div>

              {/* Linked Task Field */}
              <div>
                <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-primary, #FFFFFF)', marginBottom: '6px' }}>
                  <Target size={13} style={{ color: '#8B5CF6' }} />
                  <span>Linked Task:</span>
                </label>
                <select
                  className="form-input"
                  value={editingSession.taskId || ''}
                  onChange={(e) => {
                    const selectedId = e.target.value;
                    const taskObj = dateTasks.find((t) => t.id === selectedId);
                    setEditingSession({
                      ...editingSession,
                      taskId: selectedId || null,
                      taskTitle: taskObj ? taskObj.title : 'General Focus Session',
                    });
                  }}
                  style={{
                    width: '100%',
                    padding: '9px 12px',
                    borderRadius: '8px',
                    background: 'var(--input-bg, rgba(255, 255, 255, 0.04))',
                    border: '1px solid var(--border-color, rgba(255, 255, 255, 0.14))',
                    color: 'var(--text-primary, #FFFFFF)',
                    fontSize: '0.86rem',
                  }}
                >
                  <option value="">🎯 General Focus (No linked task)</option>
                  {dateTasks.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.title}
                    </option>
                  ))}
                </select>
              </div>

              {/* Notes / Accomplishments Field */}
              <div>
                <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-primary, #FFFFFF)', marginBottom: '6px' }}>
                  <FileText size={13} style={{ color: '#06B6D4' }} />
                  <span>Notes / Accomplishments:</span>
                </label>
                <textarea
                  rows={3}
                  className="form-input"
                  value={editingSession.notes || ''}
                  onChange={(e) => setEditingSession({ ...editingSession, notes: e.target.value })}
                  placeholder="Summary of work achieved or break intermission details..."
                  style={{
                    width: '100%',
                    padding: '9px 12px',
                    borderRadius: '8px',
                    background: 'var(--input-bg, rgba(255, 255, 255, 0.04))',
                    border: '1px solid var(--border-color, rgba(255, 255, 255, 0.14))',
                    color: 'var(--text-primary, #FFFFFF)',
                    fontSize: '0.86rem',
                    resize: 'vertical',
                  }}
                />
              </div>

              {/* Modal Footer Actions */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'flex-end',
                  gap: '10px',
                  paddingTop: '8px',
                  borderTop: '1px solid var(--border-color, rgba(255, 255, 255, 0.06))',
                }}
              >
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setEditingSession(null)}
                  style={{
                    fontSize: '0.84rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '7px 14px',
                  }}
                >
                  <X size={14} /> Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  style={{
                    fontSize: '0.84rem',
                    fontWeight: 700,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '7px 18px',
                    background: 'var(--primary-color, #1769FF)',
                    boxShadow: '0 4px 14px rgba(23, 105, 255, 0.35)',
                  }}
                >
                  <Check size={14} /> Update Session
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
