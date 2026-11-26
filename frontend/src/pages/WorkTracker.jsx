import React, { useState, useMemo, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Timer,
  Play,
  Square,
  Clock,
  Plus,
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

  const [logFilter, setLogFilter] = useState('all'); // 'all' | 'work' | 'gap'
  const tabTotals = useMemo(() => {
    const workItems = chronologicalStream.filter((x) => x.type === 'work' || x.isLive);
    const breakItems = chronologicalStream.filter((x) => x.type !== 'work' && !x.isLive);
    const workSecs = workItems.reduce((acc, x) => acc + (Number(x.durationSeconds) || 0), 0);
    const breakSecs = breakItems.reduce((acc, x) => acc + (Number(x.durationSeconds) || 0), 0);
    const fmtDur = (sec) => {
      const h = Math.floor(sec / 3600);
      const m = Math.floor((sec % 3600) / 60);
      const s = sec % 60;
      if (h > 0) return `${h}h ${m}m`;
      if (m > 0) return `${m}m ${s}s`;
      return `${s}s`;
    };
    return {
      workCount: workItems.length,
      breakCount: breakItems.length,
      workLabel: fmtDur(workSecs),
      breakLabel: fmtDur(breakSecs),
    };
  }, [chronologicalStream]);

  const filteredStream = useMemo(() => {
    if (logFilter === 'work') return chronologicalStream.filter((x) => x.type === 'work' || x.isLive);
    if (logFilter === 'gap') return chronologicalStream.filter((x) => x.type !== 'work' && !x.isLive);
    return chronologicalStream;
  }, [chronologicalStream, logFilter]);

  return (
    <div className="worktracker-container">
      {/* 1. TOP COMMAND BAR: Date Stepper + Inline KPI Pills + Log Past Session */}
      <div className="wt-v3-topbar">
        <div className="cockpit-top-left">
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

          <div className="wt-v3-stats-inline">
            <span className="wt-v3-stat-pill">
              <Zap size={13} color="#10B981" />
              <strong>{totalHours}h {totalMinutes}m {totalSecs}s</strong> Focused
            </span>
            <span className="wt-v3-stat-pill">
              <Layers size={13} color="#3B82F6" />
              <strong>{sessionCount}</strong> Blocks
            </span>
            <span className="wt-v3-stat-pill">
              <TrendingUp size={13} color="#8B5CF6" />
              <strong>{avgSessionMinutes}m</strong> Avg
            </span>
            <span className="wt-v3-stat-pill">
              <Coffee size={13} color="#F59E0B" />
              <strong>{Object.keys(reasonBreakdown).length}</strong> Breaks
            </span>
          </div>
        </div>

        <button
          type="button"
          className="btn-log-session-compact"
          onClick={handleOpenManualModal}
          title="Log past focus block or intermission"
        >
          <Plus size={14} />
          <span>Log Past Session</span>
        </button>
      </div>

      {/* 2. SLEEK TOGGL-STYLE LIVE TIMER & TASK BAR */}
      <div className={`wt-v3-timer-bar ${isRunning ? 'is-running' : isPaused ? 'is-paused' : ''}`}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flexShrink: 0 }}>
          <span
            style={{
              width: 10,
              height: 10,
              borderRadius: '50%',
              background: isRunning ? '#10B981' : isPaused ? '#F59E0B' : '#3B82F6',
              boxShadow: isRunning ? '0 0 10px #10B981' : 'none',
            }}
          />
          <div
            className="wt-v3-clock"
            style={{ color: isRunning ? '#10B981' : isPaused ? '#F59E0B' : 'var(--text-primary)' }}
          >
            {String(activeHrs).padStart(2, '0')}:{String(activeMins).padStart(2, '0')}:{String(activeSecs).padStart(2, '0')}
          </div>
        </div>

        <div style={{ flex: 1, minWidth: '240px' }}>
          {isPaused ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Coffee size={16} color="#F59E0B" />
              <span style={{ fontWeight: 700, fontSize: '0.88rem', color: 'var(--text-primary)' }}>
                Paused: {(todayChain.lastPauseReason || 'Break').replace(/["'“”]/g, '')}
              </span>
              <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                at {todayChain.lastPausedTimeStr}
              </span>
            </div>
          ) : isRunning ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
              <span style={{ fontSize: '0.68rem', fontWeight: 800, color: '#10B981', letterSpacing: '0.05em' }}>
                TRACKING LIVE · STARTED {activeWorkSession.startTime}
              </span>
              <span style={{ fontSize: '0.94rem', fontWeight: 750, color: 'var(--text-primary)' }}>
                {activeWorkSession.taskTitle || 'General Focus Session'}
              </span>
            </div>
          ) : (
            <select
              value={selectedTaskId}
              onChange={(e) => setSelectedTaskId(e.target.value)}
              className="cockpit-task-select"
              style={{ width: '100%' }}
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

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
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
            <>
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
            </>
          ) : (
            <>
              <button
                type="button"
                onClick={handleStartSession}
                id="btn-tracker-start-session"
                className="btn-launch-focus"
              >
                <Play size={15} fill="currentColor" />
                <span>Start Focus</span>
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
            </>
          )}
        </div>
      </div>

      {/* 3. CLEAN SESSION LEDGER TABLE (ONLY TABLE BODY SCROLLS) */}
      <div className="wt-v3-table-card">
        <div className="wt-v3-table-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
            <h2 style={{ margin: 0, fontSize: '0.98rem', fontWeight: 800, color: 'var(--text-primary)' }}>
              Session Log
            </h2>
            <span className="focus-stream-counter">{filteredStream.length} entries</span>
            <span className="stream-badge-work" style={{ fontSize: '0.72rem', padding: '2px 9px' }}>
              <Zap size={10} /> Focus: {tabTotals.workLabel}
            </span>
            <span className="stream-badge-break" style={{ fontSize: '0.72rem', padding: '2px 9px' }}>
              <Coffee size={10} /> Breaks: {tabTotals.breakLabel}
            </span>
          </div>

          <div className="wt-v3-filter-tabs">
            {[
              { key: 'all', label: `All (${chronologicalStream.length})` },
              { key: 'work', label: `Focus (${tabTotals.workCount} · ${tabTotals.workLabel})` },
              { key: 'gap', label: `Breaks (${tabTotals.breakCount} · ${tabTotals.breakLabel})` },
            ].map((tab) => (
              <button
                key={tab.key}
                type="button"
                onClick={() => setLogFilter(tab.key)}
                className={`wt-v3-filter-tab ${logFilter === tab.key ? 'is-active' : ''}`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {filteredStream.length === 0 ? (
          <div style={{ padding: '44px 20px', textAlign: 'center', color: 'var(--text-muted)' }}>
            <Timer size={32} style={{ margin: '0 auto 10px', opacity: 0.5 }} />
            <div style={{ fontWeight: 700, color: 'var(--text-primary)', marginBottom: '4px' }}>
              No sessions recorded yet
            </div>
            <div style={{ fontSize: '0.8rem' }}>
              Click <strong>Start Focus</strong> above to begin tracking your work.
            </div>
          </div>
        ) : (
          <div className="wt-v3-table-scroll">
            <table className="wt-v3-table">
              <thead>
                <tr>
                  <th style={{ width: '120px' }}>Type</th>
                  <th>Session / Break Reason</th>
                  <th style={{ width: '230px' }}>Time Range</th>
                  <th style={{ width: '120px' }}>Duration</th>
                  <th style={{ width: '100px', textAlign: 'right' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredStream.map((item, idx) => {
                  const isWork = item.type === 'work';
                  const isLive = item.isLive;
                  const isOngoing = item.isOngoing;
                  const linkedTask = item.taskId ? tasks.find((t) => t.id === item.taskId) : null;
                  const catName = typeof linkedTask?.category === 'object' ? linkedTask.category?.name : linkedTask?.category;

                  return (
                    <tr key={item.id || idx}>
                      <td>
                        {isLive ? (
                          <span className="stream-badge-work is-live">
                            <Activity size={10} className="animate-pulse" /> Live
                          </span>
                        ) : isWork ? (
                          <span className="stream-badge-work">
                            <Zap size={10} /> Focus
                          </span>
                        ) : (
                          <span className="stream-badge-break">
                            <Coffee size={10} /> {isOngoing ? 'Paused' : 'Break'}
                          </span>
                        )}
                      </td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span style={{ fontWeight: 700 }}>
                            {isWork ? (item.taskTitle || 'Focus Session') : (item.reason || 'Break').replace(/["'“”]/g, '')}
                          </span>
                          {catName && (
                            <span className="stream-task-category-pill">{catName}</span>
                          )}
                        </div>
                      </td>
                      <td style={{ fontFamily: 'monospace', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                        {isLive ? `Started ${item.startTime}` : `${item.startTime} → ${item.endTime}`}
                      </td>
                      <td style={{ fontFamily: 'monospace', fontWeight: 800, color: isWork || isLive ? '#10B981' : '#F59E0B' }}>
                        {item.durationStr}
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        {isLive ? (
                          <button
                            type="button"
                            className="btn-stop-focus"
                            onClick={requestStopWorkSession}
                            style={{ padding: '4px 10px', fontSize: '0.72rem' }}
                          >
                            Stop
                          </button>
                        ) : isOngoing ? (
                          <button
                            type="button"
                            className="btn-resume-focus"
                            onClick={handleStartSession}
                            style={{ padding: '4px 10px', fontSize: '0.72rem' }}
                          >
                            Resume
                          </button>
                        ) : item.rawSession ? (
                          <button
                            type="button"
                            className="stream-action-btn"
                            onClick={() => setEditingSession(item.rawSession)}
                            title="Edit details"
                          >
                            <Edit2 size={12} />
                          </button>
                        ) : null}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
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
                                  background: 'var(--card-bg)',
                                  border: '1px solid var(--border-color)',
                                  borderRadius: '16px',
                                  boxShadow: 'var(--shadow-xl)',
                                  overflow: 'hidden',
                                  display: 'flex',
                                  flexDirection: 'column',
                                }}
                              >
                                <div
                                  style={{
                                    padding: '16px 20px',
                                    borderBottom: '1px solid var(--border-color)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'space-between',
                                    background: 'linear-gradient(180deg, rgba(var(--primary-rgb, 23, 105, 255), 0.08) 0%, transparent 100%)',
                                  }}
                                >
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                    <div
                                      style={{
                                        width: '34px',
                                        height: '34px',
                                        borderRadius: '9px',
                                        background: 'rgba(var(--primary-rgb, 23, 105, 255), 0.12)',
                                        border: '1px solid rgba(var(--primary-rgb, 23, 105, 255), 0.3)',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        color: 'var(--primary-color)',
                                      }}
                                    >
                                      <Plus size={16} />
                                    </div>
                                    <div>
                                      <h3 style={{ fontSize: '1.05rem', fontWeight: 800, margin: 0, color: 'var(--text-primary)' }}>
                                        Log Past Work Session
                                      </h3>
                                      <div style={{ fontSize: '0.74rem', color: 'var(--text-secondary)' }}>
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
                                      color: 'var(--text-muted)',
                                      cursor: 'pointer',
                                    }}
                                  >
                                    <X size={16} />
                                  </button>
                                </div>

                                <form onSubmit={handleSaveManualSession} style={{ padding: '18px 20px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
                                  <div>
                                    <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '6px' }}>
                                      <Calendar size={13} style={{ color: 'var(--primary-color)' }} />
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
                                        background: 'var(--card-bg)',
                                        border: '1px solid var(--border-color)',
                                        color: 'var(--text-primary)',
                                        fontSize: '0.86rem',
                                      }}
                                    />
                                  </div>

                                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                                    <div>
                                      <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '6px' }}>
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
                                          background: 'var(--card-bg)',
                                          border: '1px solid var(--border-color)',
                                          color: 'var(--text-primary)',
                                          fontSize: '0.86rem',
                                        }}
                                      />
                                    </div>
                                    <div>
                                      <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '6px' }}>
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
                                          background: 'var(--card-bg)',
                                          border: '1px solid var(--border-color)',
                                          color: 'var(--text-primary)',
                                          fontSize: '0.86rem',
                                        }}
                                      />
                                    </div>
                                  </div>

                                  <div>
                                    <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '6px' }}>
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
                                        background: 'var(--card-bg)',
                                        border: '1px solid var(--border-color)',
                                        color: 'var(--text-primary)',
                                        fontSize: '0.86rem',
                                      }}
                                    />
                                  </div>

                                  <div>
                                    <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '6px' }}>
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
                                        background: 'var(--card-bg)',
                                        border: '1px solid var(--border-color)',
                                        color: 'var(--text-primary)',
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
                                    <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '6px' }}>
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
                                        background: 'var(--card-bg)',
                                        border: '1px solid var(--border-color)',
                                        color: 'var(--text-primary)',
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
                                    <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '6px' }}>
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
                                        background: 'var(--card-bg)',
                                        border: '1px solid var(--border-color)',
                                        color: 'var(--text-primary)',
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
                                      borderTop: '1px solid var(--border-color)',
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
                                  background: 'var(--card-bg)',
                                  border: '1px solid var(--border-color)',
                                  borderRadius: '16px',
                                  boxShadow: 'var(--shadow-xl)',
                                  overflow: 'hidden',
                                  display: 'flex',
                                  flexDirection: 'column',
                                }}
                              >
                                {/* Modal Header */}
                                <div
                                  style={{
                                    padding: '16px 20px',
                                    borderBottom: '1px solid var(--border-color)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'space-between',
                                    background: 'linear-gradient(180deg, rgba(var(--primary-rgb, 23, 105, 255), 0.08) 0%, transparent 100%)',
                                  }}
                                >
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                    <div
                                      style={{
                                        width: '34px',
                                        height: '34px',
                                        borderRadius: '9px',
                                        background: 'rgba(var(--primary-rgb, 23, 105, 255), 0.12)',
                                        border: '1px solid rgba(var(--primary-rgb, 23, 105, 255), 0.3)',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        color: 'var(--primary-color)',
                                      }}
                                    >
                                      <Edit2 size={16} />
                                    </div>
                                    <div>
                                      <h3 style={{ fontSize: '1.05rem', fontWeight: 800, margin: 0, color: 'var(--text-primary)' }}>
                                        Edit Work Session Details
                                      </h3>
                                      <div style={{ fontSize: '0.74rem', color: 'var(--text-secondary)' }}>
                                        Update stop reason or linked task
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
                                      color: 'var(--text-muted)',
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
                                        background: 'rgba(var(--primary-rgb, 23, 105, 255), 0.08)',
                                        border: '1px solid rgba(var(--primary-rgb, 23, 105, 255), 0.2)',
                                      }}
                                    >
                                      <div style={{ display: 'flex', alignItems: 'center', gap: '7px' }}>
                                        <Clock size={13} style={{ color: 'var(--primary-color)' }} />
                                        <span style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-primary)' }}>
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
                                    <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '6px' }}>
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
                                                : '1px solid var(--border-color)',
                                              background: isSelected
                                                ? 'rgba(var(--primary-rgb, 23, 105, 255), 0.14)'
                                                : 'var(--card-hover)',
                                              color: isSelected
                                                ? 'var(--primary-color, #1769FF)'
                                                : 'var(--text-secondary)',
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
                                        background: 'var(--card-bg)',
                                        border: '1px solid var(--border-color)',
                                        color: 'var(--text-primary)',
                                        fontSize: '0.86rem',
                                      }}
                                    />
                                  </div>

                                  {/* Linked Task Field */}
                                  <div>
                                    <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '6px' }}>
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
                                        background: 'var(--card-bg)',
                                        border: '1px solid var(--border-color)',
                                        color: 'var(--text-primary)',
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

                                  {/* Modal Footer Actions */}
                                  <div
                                    style={{
                                      display: 'flex',
                                      alignItems: 'center',
                                      justifyContent: 'flex-end',
                                      gap: '10px',
                                      paddingTop: '8px',
                                      borderTop: '1px solid var(--border-color)',
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
