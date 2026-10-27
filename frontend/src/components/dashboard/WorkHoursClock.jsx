import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Clock, Play, Square, ExternalLink, Timer, Sparkles } from 'lucide-react';
import { useApp } from '../../context/AppContext';

export function WorkHoursClock({ tasks = [], selectedDate }) {
  const navigate = useNavigate();
  const {
    activeWorkSession,
    startWorkSession,
    requestStopWorkSession,
    workSessions = [],
  } = useApp();

  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const hours = time.getHours();
  const minutes = time.getMinutes();
  const seconds = time.getSeconds();

  // Clock hand rotations (in degrees)
  const secondDeg = seconds * 6; // 360 / 60
  const minuteDeg = minutes * 6 + seconds * 0.1;
  const hourDeg = (hours % 12) * 30 + minutes * 0.5;

  const targetDate = selectedDate || time.toISOString().split('T')[0];

  // Calculate total tracked seconds from recorded sessions for this date
  const todaySessions = workSessions.filter((s) => s.date === targetDate);
  const totalRecordedSeconds = todaySessions.reduce(
    (acc, s) => acc + (Number(s.durationSeconds) || 0),
    0
  );

  // If session is active right now, calculate current session elapsed seconds
  const isRunning = Boolean(activeWorkSession?.isRunning);
  let liveSessionElapsedSeconds = 0;
  if (isRunning && activeWorkSession?.startTimestamp) {
    liveSessionElapsedSeconds = Math.max(
      0,
      Math.floor((Date.now() - activeWorkSession.startTimestamp) / 1000)
    );
  }

  // Display mode: If running, show live active session counter. If stopped, show today's accumulated work
  const displayTotalSeconds = isRunning
    ? liveSessionElapsedSeconds
    : totalRecordedSeconds > 0
    ? totalRecordedSeconds
    : 0;

  // If no recorded sessions and idle, calculate scheduled task duration as helpful fallback baseline
  let displayHours = 0;
  let displayMins = 0;
  let displaySecs = 0;

  if (isRunning) {
    displayHours = Math.floor(displayTotalSeconds / 3600);
    displayMins = Math.floor((displayTotalSeconds % 3600) / 60);
    displaySecs = displayTotalSeconds % 60;
  } else if (totalRecordedSeconds > 0) {
    displayHours = Math.floor(totalRecordedSeconds / 3600);
    displayMins = Math.floor((totalRecordedSeconds % 3600) / 60);
    displaySecs = totalRecordedSeconds % 60;
  } else {
    // Scheduled tasks estimate
    const todayTasks = tasks.filter((t) => t.date === targetDate);
    let schedMinutes = 0;
    todayTasks.forEach((t) => {
      if (t.startTime && t.endTime) {
        const [sh, sm] = t.startTime.split(':').map(Number);
        const [eh, em] = t.endTime.split(':').map(Number);
        const diff = (eh * 60 + em) - (sh * 60 + sm);
        if (diff > 0) schedMinutes += diff;
      }
    });
    displayHours = Math.floor(schedMinutes / 60);
    displayMins = schedMinutes % 60;
    displaySecs = seconds;
  }

  const hrsStr = String(displayHours).padStart(2, '0');
  const minsStr = String(displayMins).padStart(2, '0');
  const secsStr = String(displaySecs).padStart(2, '0');

  // Format 12-hour digital current time string
  const period = hours >= 12 ? 'PM' : 'AM';
  const civilHours = hours % 12 || 12;
  const digitalTimeStr = `${civilHours}:${String(minutes).padStart(2, '0')} ${period}`;

  return (
    <div
      style={{
        background: '#131E35',
        borderRadius: 'var(--radius-lg)',
        border: isRunning
          ? '1px solid rgba(16, 185, 129, 0.4)'
          : '1px solid rgba(255, 255, 255, 0.1)',
        padding: '12px 20px',
        color: '#FFFFFF',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '16px',
        boxShadow: isRunning
          ? '0 6px 20px rgba(16, 185, 129, 0.15)'
          : '0 4px 16px rgba(0, 0, 0, 0.2)',
        transition: 'border-color 0.25s, box-shadow 0.25s',
      }}
    >
      {/* Left: Title, Status & Navigation Button */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <div
          style={{
            width: '36px',
            height: '36px',
            borderRadius: '10px',
            background: isRunning ? 'rgba(16, 185, 129, 0.18)' : 'rgba(59, 130, 246, 0.16)',
            border: isRunning
              ? '1px solid rgba(16, 185, 129, 0.5)'
              : '1px solid rgba(59, 130, 246, 0.45)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
            transition: 'all 0.2s',
          }}
        >
          {isRunning ? (
            <Timer size={18} color="#10B981" className="animate-spin-slow" />
          ) : (
            <Clock size={18} color="#3B82F6" />
          )}
        </div>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '0.96rem', fontWeight: 800, color: '#FFFFFF', lineHeight: 1.2 }}>
              Today's Work Tracker
            </span>
            {/* Live Indicator Pill */}
            {isRunning ? (
              <span
                style={{
                  background: 'rgba(16, 185, 129, 0.2)',
                  border: '1px solid #10B981',
                  color: '#34D399',
                  fontSize: '0.66rem',
                  fontWeight: 800,
                  padding: '2px 8px',
                  borderRadius: '999px',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px',
                  letterSpacing: '0.04em',
                }}
              >
                <span
                  style={{
                    width: '6px',
                    height: '6px',
                    borderRadius: '50%',
                    backgroundColor: '#10B981',
                    boxShadow: '0 0 8px #10B981',
                  }}
                />
                LIVE TRACKING
              </span>
            ) : (
              <span
                style={{
                  background: 'rgba(255, 255, 255, 0.08)',
                  color: '#94A3B8',
                  fontSize: '0.66rem',
                  fontWeight: 700,
                  padding: '2px 7px',
                  borderRadius: '999px',
                }}
              >
                {todaySessions.length > 0 ? `${todaySessions.length} SESSIONS LOGGED` : 'STANDBY'}
              </span>
            )}
          </div>
          <div style={{ fontSize: '0.74rem', color: '#94A3B8', fontWeight: 500, marginTop: '2px' }}>
            {isRunning
              ? activeWorkSession?.taskTitle
                ? `Focus: ${activeWorkSession.taskTitle}`
                : `Started at ${activeWorkSession?.startTime || 'now'}`
              : totalRecordedSeconds > 0
              ? `Total logged: ${hrsStr}h ${minsStr}m today`
              : 'Click Start to track work time and log reasons'}
          </div>
        </div>
      </div>

      {/* Center: Digital LED Timer (Red/Neon Digit Style from User Screenshot) */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        {/* Hours */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px' }}>
          <div
            style={{
              background: '#1A2744',
              border: isRunning
                ? '1px solid rgba(16, 185, 129, 0.45)'
                : '1px solid rgba(239, 68, 68, 0.28)',
              borderRadius: '7px',
              padding: '5px 11px',
              minWidth: '50px',
              textAlign: 'center',
              boxShadow: 'inset 0 1px 4px rgba(0, 0, 0, 0.4)',
            }}
          >
            <span
              style={{
                fontFamily: 'monospace, "Courier New", Courier',
                fontSize: '1.45rem',
                fontWeight: 900,
                color: isRunning ? '#34D399' : '#EF4444',
                letterSpacing: '1px',
                lineHeight: 1,
                textShadow: isRunning
                  ? '0 0 10px rgba(52, 211, 153, 0.5)'
                  : '0 0 8px rgba(239, 68, 68, 0.45)',
              }}
            >
              {hrsStr}
            </span>
          </div>
          <span style={{ fontSize: '0.62rem', fontWeight: 800, color: '#64748B', letterSpacing: '0.06em' }}>
            HRS
          </span>
        </div>

        {/* Colon */}
        <div
          style={{
            fontSize: '1.35rem',
            fontWeight: 900,
            color: isRunning ? '#34D399' : '#EF4444',
            marginBottom: '10px',
            textShadow: isRunning ? '0 0 6px #34D399' : '0 0 6px #EF4444',
          }}
        >
          :
        </div>

        {/* Minutes */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px' }}>
          <div
            style={{
              background: '#1A2744',
              border: isRunning
                ? '1px solid rgba(16, 185, 129, 0.45)'
                : '1px solid rgba(239, 68, 68, 0.28)',
              borderRadius: '7px',
              padding: '5px 11px',
              minWidth: '50px',
              textAlign: 'center',
              boxShadow: 'inset 0 1px 4px rgba(0, 0, 0, 0.4)',
            }}
          >
            <span
              style={{
                fontFamily: 'monospace, "Courier New", Courier',
                fontSize: '1.45rem',
                fontWeight: 900,
                color: isRunning ? '#34D399' : '#EF4444',
                letterSpacing: '1px',
                lineHeight: 1,
                textShadow: isRunning
                  ? '0 0 10px rgba(52, 211, 153, 0.5)'
                  : '0 0 8px rgba(239, 68, 68, 0.45)',
              }}
            >
              {minsStr}
            </span>
          </div>
          <span style={{ fontSize: '0.62rem', fontWeight: 800, color: '#64748B', letterSpacing: '0.06em' }}>
            MINS
          </span>
        </div>

        {/* Colon */}
        <div
          style={{
            fontSize: '1.35rem',
            fontWeight: 900,
            color: isRunning ? '#34D399' : '#EF4444',
            marginBottom: '10px',
            textShadow: isRunning ? '0 0 6px #34D399' : '0 0 6px #EF4444',
          }}
        >
          :
        </div>

        {/* Seconds */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px' }}>
          <div
            style={{
              background: '#1A2744',
              border: isRunning
                ? '1px solid rgba(16, 185, 129, 0.45)'
                : '1px solid rgba(239, 68, 68, 0.28)',
              borderRadius: '7px',
              padding: '5px 11px',
              minWidth: '50px',
              textAlign: 'center',
              boxShadow: 'inset 0 1px 4px rgba(0, 0, 0, 0.4)',
            }}
          >
            <span
              style={{
                fontFamily: 'monospace, "Courier New", Courier',
                fontSize: '1.45rem',
                fontWeight: 900,
                color: isRunning ? '#34D399' : '#EF4444',
                letterSpacing: '1px',
                lineHeight: 1,
                textShadow: isRunning
                  ? '0 0 10px rgba(52, 211, 153, 0.5)'
                  : '0 0 8px rgba(239, 68, 68, 0.45)',
              }}
            >
              {secsStr}
            </span>
          </div>
          <span style={{ fontSize: '0.62rem', fontWeight: 800, color: '#64748B', letterSpacing: '0.06em' }}>
            SECS
          </span>
        </div>
      </div>

      {/* Right Controls: Start/Stop Buttons + Module Link + Analog Dial */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
        {/* START or STOP BUTTON */}
        {!isRunning ? (
          <button
            type="button"
            onClick={() => startWorkSession()}
            id="btn-work-timer-start"
            style={{
              background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
              color: '#FFFFFF',
              border: 'none',
              padding: '7px 15px',
              borderRadius: '8px',
              fontSize: '0.84rem',
              fontWeight: 800,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              transition: 'transform 0.15s',
            }}
            title="Start tracking active work time"
          >
            <Play size={14} fill="#FFFFFF" />
            <span>Start Work</span>
          </button>
        ) : (
          <button
            type="button"
            onClick={requestStopWorkSession}
            id="btn-work-timer-stop"
            style={{
              background: 'linear-gradient(135deg, #EF4444 0%, #DC2626 100%)',
              color: '#FFFFFF',
              border: 'none',
              padding: '7px 15px',
              borderRadius: '8px',
              fontSize: '0.84rem',
              fontWeight: 800,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              transition: 'transform 0.15s',
            }}
            title="Stop timer and record remarks"
          >
            <Square size={13} fill="#FFFFFF" />
            <span>Stop Work</span>
          </button>
        )}

        {/* View Module Button */}
        <button
          type="button"
          onClick={() => navigate('/work-tracker')}
          style={{
            background: 'rgba(255, 255, 255, 0.08)',
            border: '1px solid rgba(255, 255, 255, 0.14)',
            color: '#E2E8F0',
            padding: '7px 12px',
            borderRadius: '8px',
            fontSize: '0.82rem',
            fontWeight: 600,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '5px',
            transition: 'background 0.15s',
          }}
          title="Open Today's Work Tracker & Sessions Log"
        >
          <span>Work Logs</span>
          <ExternalLink size={13} />
        </button>

        {/* Compact Analog Clock Dial */}
        <div
          style={{
            width: '42px',
            height: '42px',
            borderRadius: '50%',
            background: '#1E293B',
            border: '2px solid rgba(255, 255, 255, 0.16)',
            position: 'relative',
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.3)',
            flexShrink: 0,
          }}
          title={`Current Clock Time: ${digitalTimeStr}`}
        >
          {/* Tick marks */}
          {[...Array(12)].map((_, i) => {
            const rot = i * 30;
            const isMain = i % 3 === 0;
            return (
              <div
                key={i}
                style={{
                  position: 'absolute',
                  top: '2px',
                  left: '20px',
                  width: isMain ? '1.5px' : '1px',
                  height: isMain ? '3px' : '2px',
                  background: isMain ? '#94A3B8' : '#475569',
                  transformOrigin: '1px 19px',
                  transform: `rotate(${rot}deg)`,
                }}
              />
            );
          })}

          {/* Hour Hand */}
          <div
            style={{
              position: 'absolute',
              top: '9px',
              left: '19.75px',
              width: '2.5px',
              height: '12px',
              background: '#3B82F6',
              borderRadius: '2px',
              transformOrigin: 'bottom center',
              transform: `rotate(${hourDeg}deg)`,
            }}
          />

          {/* Minute Hand */}
          <div
            style={{
              position: 'absolute',
              top: '5px',
              left: '20.1px',
              width: '1.8px',
              height: '16px',
              background: '#60A5FA',
              borderRadius: '2px',
              transformOrigin: 'bottom center',
              transform: `rotate(${minuteDeg}deg)`,
            }}
          />

          {/* Second Hand */}
          <div
            style={{
              position: 'absolute',
              top: '3px',
              left: '20.4px',
              width: '1.2px',
              height: '18px',
              background: '#EF4444',
              borderRadius: '1px',
              transformOrigin: 'bottom center',
              transform: `rotate(${secondDeg}deg)`,
            }}
          />

          {/* Center Pin */}
          <div
            style={{
              position: 'absolute',
              top: '18.5px',
              left: '18.5px',
              width: '5px',
              height: '5px',
              borderRadius: '50%',
              background: '#FFFFFF',
              boxShadow: '0 0 3px rgba(0, 0, 0, 0.6)',
            }}
          />
        </div>
      </div>
    </div>
  );
}
