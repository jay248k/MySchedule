import React, { useState, useEffect } from 'react';
import { Clock } from 'lucide-react';

export function WorkHoursClock({ tasks = [] }) {
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

  // Calculate today's completed/scheduled work time from tasks
  const todayStr = time.toISOString().split('T')[0];
  const todayTasks = tasks.filter((t) => t.date === todayStr);

  let totalMinutes = 0;
  todayTasks.forEach((t) => {
    if (t.startTime && t.endTime) {
      const [sh, sm] = t.startTime.split(':').map(Number);
      const [eh, em] = t.endTime.split(':').map(Number);
      let diff = (eh * 60 + em) - (sh * 60 + sm);
      if (diff > 0) totalMinutes += diff;
    } else {
      totalMinutes += 60; // default 1h if unassigned
    }
  });

  // If no tasks scheduled today, show focus elapsed from start of morning, or standard 00
  const workHours = Math.floor(totalMinutes / 60);
  const workMins = totalMinutes % 60;

  const hrsStr = String(workHours).padStart(2, '0');
  const minsStr = String(workMins).padStart(2, '0');
  const secsStr = String(seconds).padStart(2, '0');

  // Format 12-hour digital time string (e.g., 10:22 PM)
  const period = hours >= 12 ? 'PM' : 'AM';
  const displayHours = hours % 12 || 12;
  const digitalTimeStr = `${displayHours}:${String(minutes).padStart(2, '0')} ${period}`;

  return (
    <div
      style={{
        background: '#131E35',
        borderRadius: 'var(--radius-xl)',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        padding: '24px 28px',
        color: '#FFFFFF',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '24px',
        boxShadow: '0 8px 24px rgba(0, 0, 0, 0.25)',
      }}
    >
      {/* Left Column: Title & 7-Segment Digital LED Timer */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
        {/* Title */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div
            style={{
              width: '28px',
              height: '28px',
              borderRadius: '50%',
              background: 'rgba(59, 130, 246, 0.15)',
              border: '1px solid #3B82F6',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Clock size={16} color="#3B82F6" />
          </div>
          <span style={{ fontSize: '1.05rem', fontWeight: 800, color: '#FFFFFF' }}>
            Today's Work Hours
          </span>
        </div>

        {/* Digital LED Display */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {/* Hours Box */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px' }}>
            <div
              style={{
                background: '#1A2744',
                border: '1px solid rgba(239, 68, 68, 0.25)',
                borderRadius: '8px',
                padding: '8px 14px',
                minWidth: '66px',
                textAlign: 'center',
                boxShadow: 'inset 0 2px 6px rgba(0, 0, 0, 0.4)',
              }}
            >
              <span
                style={{
                  fontFamily: 'monospace, "Courier New", Courier',
                  fontSize: '2.1rem',
                  fontWeight: 900,
                  color: '#EF4444',
                  letterSpacing: '2px',
                  lineHeight: 1,
                  textShadow: '0 0 10px rgba(239, 68, 68, 0.45)',
                }}
              >
                {hrsStr}
              </span>
            </div>
            <span style={{ fontSize: '0.72rem', fontWeight: 800, color: '#64748B', letterSpacing: '0.08em' }}>
              HRS
            </span>
          </div>

          {/* Colon */}
          <div
            style={{
              fontSize: '1.8rem',
              fontWeight: 900,
              color: '#EF4444',
              marginBottom: '18px',
              textShadow: '0 0 8px rgba(239, 68, 68, 0.4)',
            }}
          >
            :
          </div>

          {/* Minutes Box */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px' }}>
            <div
              style={{
                background: '#1A2744',
                border: '1px solid rgba(239, 68, 68, 0.25)',
                borderRadius: '8px',
                padding: '8px 14px',
                minWidth: '66px',
                textAlign: 'center',
                boxShadow: 'inset 0 2px 6px rgba(0, 0, 0, 0.4)',
              }}
            >
              <span
                style={{
                  fontFamily: 'monospace, "Courier New", Courier',
                  fontSize: '2.1rem',
                  fontWeight: 900,
                  color: '#EF4444',
                  letterSpacing: '2px',
                  lineHeight: 1,
                  textShadow: '0 0 10px rgba(239, 68, 68, 0.45)',
                }}
              >
                {minsStr}
              </span>
            </div>
            <span style={{ fontSize: '0.72rem', fontWeight: 800, color: '#64748B', letterSpacing: '0.08em' }}>
              MINS
            </span>
          </div>

          {/* Colon */}
          <div
            style={{
              fontSize: '1.8rem',
              fontWeight: 900,
              color: '#EF4444',
              marginBottom: '18px',
              textShadow: '0 0 8px rgba(239, 68, 68, 0.4)',
            }}
          >
            :
          </div>

          {/* Seconds Box (Live Ticking) */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px' }}>
            <div
              style={{
                background: '#1A2744',
                border: '1px solid rgba(239, 68, 68, 0.25)',
                borderRadius: '8px',
                padding: '8px 14px',
                minWidth: '66px',
                textAlign: 'center',
                boxShadow: 'inset 0 2px 6px rgba(0, 0, 0, 0.4)',
              }}
            >
              <span
                style={{
                  fontFamily: 'monospace, "Courier New", Courier',
                  fontSize: '2.1rem',
                  fontWeight: 900,
                  color: '#EF4444',
                  letterSpacing: '2px',
                  lineHeight: 1,
                  textShadow: '0 0 10px rgba(239, 68, 68, 0.45)',
                }}
              >
                {secsStr}
              </span>
            </div>
            <span style={{ fontSize: '0.72rem', fontWeight: 800, color: '#64748B', letterSpacing: '0.08em' }}>
              SECS
            </span>
          </div>
        </div>
      </div>

      {/* Right Column: Live Analog Clock Face & Digital Time Pill */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px' }}>
        {/* Analog Clock Dial */}
        <div
          style={{
            width: '88px',
            height: '88px',
            borderRadius: '50%',
            background: '#1E293B',
            border: '2px solid rgba(255, 255, 255, 0.16)',
            position: 'relative',
            boxShadow: '0 4px 14px rgba(0, 0, 0, 0.35)',
          }}
        >
          {/* 12 Hour Tick Marks */}
          {[...Array(12)].map((_, i) => {
            const rot = i * 30;
            const isMain = i % 3 === 0;
            return (
              <div
                key={i}
                style={{
                  position: 'absolute',
                  top: '4px',
                  left: '43px',
                  width: isMain ? '2px' : '1.5px',
                  height: isMain ? '6px' : '4px',
                  background: isMain ? '#94A3B8' : '#475569',
                  transformOrigin: '1px 40px',
                  transform: `rotate(${rot}deg)`,
                }}
              />
            );
          })}

          {/* Hour Hand */}
          <div
            style={{
              position: 'absolute',
              top: '22px',
              left: '42.5px',
              width: '3px',
              height: '22px',
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
              top: '14px',
              left: '43px',
              width: '2px',
              height: '30px',
              background: '#60A5FA',
              borderRadius: '2px',
              transformOrigin: 'bottom center',
              transform: `rotate(${minuteDeg}deg)`,
            }}
          />

          {/* Second Hand (Red, Live Ticking) */}
          <div
            style={{
              position: 'absolute',
              top: '10px',
              left: '43.25px',
              width: '1.5px',
              height: '36px',
              background: '#EF4444',
              borderRadius: '1px',
              transformOrigin: 'bottom center',
              transform: `rotate(${secondDeg}deg)`,
            }}
          />

          {/* Center Pivot Pin */}
          <div
            style={{
              position: 'absolute',
              top: '41px',
              left: '41px',
              width: '6px',
              height: '6px',
              borderRadius: '50%',
              background: '#FFFFFF',
              boxShadow: '0 0 4px rgba(0, 0, 0, 0.6)',
            }}
          />
        </div>

        {/* Current Time Digital Pill */}
        <div
          style={{
            background: 'rgba(255, 255, 255, 0.08)',
            border: '1px solid rgba(255, 255, 255, 0.12)',
            borderRadius: '999px',
            padding: '4px 12px',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            fontSize: '0.78rem',
            fontWeight: 700,
            color: '#E2E8F0',
          }}
        >
          <Clock size={12} color="#38BDF8" />
          <span>{digitalTimeStr}</span>
        </div>
      </div>
    </div>
  );
}
