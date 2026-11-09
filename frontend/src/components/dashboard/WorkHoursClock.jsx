import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Clock, Play, Square, ExternalLink, Timer, Sparkles } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { getTodayDateString } from '../../utils/dateUtils';

export function WorkHoursClock({ tasks = [], selectedDate }) {
  const navigate = useNavigate();
  const {
    activeWorkSession,
    startWorkSession,
    requestStopWorkSession,
    workSessions = [],
    currentLiveWorkSeconds = 0,
  } = useApp();

  const todayStr = getTodayDateString();
  const targetDate = selectedDate || todayStr;

  // Calculate total tracked seconds from recorded sessions for this date
  const todaySessions = workSessions.filter((s) => s.date === targetDate);
  const totalRecordedSeconds = todaySessions.reduce(
    (acc, s) => acc + (Number(s.durationSeconds) || 0),
    0
  );

  // If session is active right now, use single source of truth from AppContext
  const isRunning = Boolean(activeWorkSession?.isRunning);

  // Display mode: Strictly show actual tracked working time in 00:00:00 format
  // When active: shows live tracked session duration (synchronized lock-step across web & mobile)
  // When stopped: shows total recorded work time for today (or 00:00:00 if no work tracked yet)
  const displayTotalSeconds = isRunning
    ? Math.max(totalRecordedSeconds, currentLiveWorkSeconds)
    : totalRecordedSeconds;

  const displayHours = Math.floor(displayTotalSeconds / 3600);
  const displayMins = Math.floor((displayTotalSeconds % 3600) / 60);
  const displaySecs = displayTotalSeconds % 60;

  const hrsStr = String(displayHours).padStart(2, '0');
  const minsStr = String(displayMins).padStart(2, '0');
  const secsStr = String(displaySecs).padStart(2, '0');

  return (
    <div
      className="card"
      style={{
        background: isRunning
          ? 'linear-gradient(135deg, rgba(16, 185, 129, 0.08) 0%, var(--card-bg) 100%)'
          : 'var(--card-bg)',
        borderRadius: 'var(--radius-lg, 12px)',
        border: isRunning
          ? '1px solid rgba(16, 185, 129, 0.5)'
          : '1px solid var(--border-color)',
        padding: '10px 16px',
        color: 'var(--text-primary)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '12px',
        boxShadow: isRunning
          ? '0 4px 16px rgba(16, 185, 129, 0.15)'
          : 'var(--shadow-sm)',
        transition: 'border-color 0.25s, box-shadow 0.25s, background-color 0.25s',
      }}
    >
      {/* Left: Title, Status & Navigation Button */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <div
          style={{
            width: '34px',
            height: '34px',
            borderRadius: '8px',
            background: isRunning ? 'rgba(16, 185, 129, 0.14)' : 'rgba(23, 105, 255, 0.1)',
            border: isRunning
              ? '1px solid rgba(16, 185, 129, 0.45)'
              : '1px solid rgba(23, 105, 255, 0.3)',
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
            <Clock size={18} color="var(--primary-color, #1769FF)" />
          )}
        </div>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '0.92rem', fontWeight: 800, color: 'var(--text-primary)', lineHeight: 1.2 }}>
              Today's Work Tracker
            </span>
            {/* Live Indicator Pill */}
            {isRunning ? (
              <span
                style={{
                  background: 'rgba(16, 185, 129, 0.15)',
                  border: '1px solid #10B981',
                  color: '#10B981',
                  fontSize: '0.64rem',
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
                  background: 'var(--border-subtle, rgba(0, 0, 0, 0.04))',
                  color: 'var(--text-secondary)',
                  fontSize: '0.64rem',
                  fontWeight: 700,
                  padding: '2px 7px',
                  borderRadius: '999px',
                  border: '1px solid var(--border-color)',
                }}
              >
                {todaySessions.length > 0 ? `${todaySessions.length} SESSIONS LOGGED` : 'STANDBY'}
              </span>
            )}
          </div>
          <div style={{ fontSize: '0.74rem', color: 'var(--text-secondary)', fontWeight: 500, marginTop: '2px' }}>
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

      {/* Center: Digital LED Timer (Adapts to Light, Dark & OLED themes) */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        {/* Hours */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px' }}>
          <div
            style={{
              background: 'var(--bg-primary, #0A1124)',
              border: isRunning
                ? '1px solid rgba(16, 185, 129, 0.45)'
                : '1px solid var(--border-color)',
              borderRadius: '7px',
              padding: '4px 10px',
              minWidth: '46px',
              textAlign: 'center',
              boxShadow: 'inset 0 1px 3px rgba(0, 0, 0, 0.15)',
            }}
          >
            <span
              style={{
                fontFamily: 'monospace, "Courier New", Courier',
                fontSize: '1.35rem',
                fontWeight: 900,
                color: isRunning ? '#10B981' : '#EF4444',
                letterSpacing: '1px',
                lineHeight: 1,
                textShadow: isRunning
                  ? '0 0 8px rgba(16, 185, 129, 0.35)'
                  : '0 0 6px rgba(239, 68, 68, 0.35)',
              }}
            >
              {hrsStr}
            </span>
          </div>
          <span style={{ fontSize: '0.62rem', fontWeight: 800, color: 'var(--text-muted)', letterSpacing: '0.06em' }}>
            HRS
          </span>
        </div>

        {/* Colon */}
        <div
          style={{
            fontSize: '1.25rem',
            fontWeight: 900,
            color: isRunning ? '#10B981' : '#EF4444',
            marginBottom: '10px',
            textShadow: isRunning ? '0 0 6px #10B981' : '0 0 6px #EF4444',
          }}
        >
          :
        </div>

        {/* Minutes */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px' }}>
          <div
            style={{
              background: 'var(--bg-primary, #0A1124)',
              border: isRunning
                ? '1px solid rgba(16, 185, 129, 0.45)'
                : '1px solid var(--border-color)',
              borderRadius: '7px',
              padding: '4px 10px',
              minWidth: '46px',
              textAlign: 'center',
              boxShadow: 'inset 0 1px 3px rgba(0, 0, 0, 0.15)',
            }}
          >
            <span
              style={{
                fontFamily: 'monospace, "Courier New", Courier',
                fontSize: '1.35rem',
                fontWeight: 900,
                color: isRunning ? '#10B981' : '#EF4444',
                letterSpacing: '1px',
                lineHeight: 1,
                textShadow: isRunning
                  ? '0 0 8px rgba(16, 185, 129, 0.35)'
                  : '0 0 6px rgba(239, 68, 68, 0.35)',
              }}
            >
              {minsStr}
            </span>
          </div>
          <span style={{ fontSize: '0.62rem', fontWeight: 800, color: 'var(--text-muted)', letterSpacing: '0.06em' }}>
            MINS
          </span>
        </div>

        {/* Colon */}
        <div
          style={{
            fontSize: '1.25rem',
            fontWeight: 900,
            color: isRunning ? '#10B981' : '#EF4444',
            marginBottom: '10px',
            textShadow: isRunning ? '0 0 6px #10B981' : '0 0 6px #EF4444',
          }}
        >
          :
        </div>

        {/* Seconds */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px' }}>
          <div
            style={{
              background: 'var(--bg-primary, #0A1124)',
              border: isRunning
                ? '1px solid rgba(16, 185, 129, 0.45)'
                : '1px solid var(--border-color)',
              borderRadius: '7px',
              padding: '4px 10px',
              minWidth: '46px',
              textAlign: 'center',
              boxShadow: 'inset 0 1px 3px rgba(0, 0, 0, 0.15)',
            }}
          >
            <span
              style={{
                fontFamily: 'monospace, "Courier New", Courier',
                fontSize: '1.35rem',
                fontWeight: 900,
                color: isRunning ? '#10B981' : '#EF4444',
                letterSpacing: '1px',
                lineHeight: 1,
                textShadow: isRunning
                  ? '0 0 8px rgba(16, 185, 129, 0.35)'
                  : '0 0 6px rgba(239, 68, 68, 0.35)',
              }}
            >
              {secsStr}
            </span>
          </div>
          <span style={{ fontSize: '0.62rem', fontWeight: 800, color: 'var(--text-muted)', letterSpacing: '0.06em' }}>
            SECS
          </span>
        </div>
      </div>

      {/* Right Controls: Start/Stop Buttons + Module Link + Analog Dial */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
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
              padding: '6px 14px',
              borderRadius: '7px',
              fontSize: '0.82rem',
              fontWeight: 800,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              boxShadow: '0 2px 8px rgba(16, 185, 129, 0.25)',
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
              padding: '6px 14px',
              borderRadius: '7px',
              fontSize: '0.82rem',
              fontWeight: 800,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              boxShadow: '0 2px 8px rgba(239, 68, 68, 0.25)',
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
            background: 'var(--card-hover, rgba(0, 0, 0, 0.04))',
            border: '1px solid var(--border-color)',
            color: 'var(--text-primary)',
            padding: '6px 11px',
            borderRadius: '7px',
            fontSize: '0.8rem',
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
      </div>
    </div>
  );
}
