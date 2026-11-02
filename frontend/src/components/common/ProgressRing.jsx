import React, { useState, useEffect } from 'react';

export function ProgressRing({
  radius = 48,
  stroke = 7,
  progress = 0,
  color = '#1769FF',
  gradientColors,
  trackColor = 'var(--border-color, rgba(255, 255, 255, 0.08))',
  label = '',
  subtitle = '',
  animateOnMount = true,
}) {
  const [currentProgress, setCurrentProgress] = useState(animateOnMount ? 0 : progress);
  const gradId = React.useId ? React.useId().replace(/:/g, '') : `ring-grad-${Math.random().toString(36).substr(2, 9)}`;

  useEffect(() => {
    let startTimestamp = null;
    const duration = 1000;
    const target = Math.min(100, Math.max(0, progress));
    let animationFrameId;

    const step = (timestamp) => {
      if (!startTimestamp) startTimestamp = timestamp;
      const elapsed = timestamp - startTimestamp;
      const progressRatio = Math.min(elapsed / duration, 1);
      const easeOut = 1 - Math.pow(1 - progressRatio, 3);
      setCurrentProgress(easeOut * target);

      if (progressRatio < 1) {
        animationFrameId = requestAnimationFrame(step);
      } else {
        setCurrentProgress(target);
      }
    };

    animationFrameId = requestAnimationFrame(step);
    return () => cancelAnimationFrame(animationFrameId);
  }, [progress]);

  // Proper radius so circle fills the SVG without clipping
  const normalizedRadius = radius - stroke / 2;
  const circumference = normalizedRadius * 2 * Math.PI;
  const strokeDashoffset = circumference - (currentProgress / 100) * circumference;

  const strokeColor = gradientColors && gradientColors.length >= 2 ? `url(#${gradId})` : color;

  return (
    <div style={{ display: 'inline-flex', flexDirection: 'column', alignItems: 'center', gap: '6px' }}>
      <div style={{ position: 'relative', width: radius * 2, height: radius * 2 }}>
        <svg height={radius * 2} width={radius * 2} style={{ transform: 'rotate(-90deg)', overflow: 'visible' }}>
          {gradientColors && gradientColors.length >= 2 && (
            <defs>
              <linearGradient id={gradId} x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor={gradientColors[0]} />
                <stop offset="100%" stopColor={gradientColors[1]} />
              </linearGradient>
            </defs>
          )}
          {/* Background Track */}
          <circle
            stroke={trackColor}
            fill="transparent"
            strokeWidth={stroke}
            r={normalizedRadius}
            cx={radius}
            cy={radius}
          />
          {/* Animated Value Arc with subtle glow */}
          <circle
            stroke={strokeColor}
            fill="transparent"
            strokeWidth={stroke}
            strokeDasharray={`${circumference} ${circumference}`}
            style={{
              strokeDashoffset,
              transition: 'stroke-dashoffset 0.1s linear',
              filter: currentProgress > 0 ? `drop-shadow(0 0 5px ${gradientColors ? gradientColors[0] : color}55)` : 'none',
            }}
            strokeLinecap="round"
            r={normalizedRadius}
            cx={radius}
            cy={radius}
          />
        </svg>

        {/* Center Readout */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            lineHeight: 1,
            gap: '3px',
          }}
        >
          <span
            style={{
              fontSize: `${Math.round(radius * 0.44)}px`,
              fontWeight: 900,
              color: 'var(--text-primary)',
              letterSpacing: '-0.025em',
            }}
          >
            {Math.round(currentProgress)}%
          </span>
          {subtitle && (
            <span
              style={{
                fontSize: `${Math.max(11, Math.round(radius * 0.22))}px`,
                fontWeight: 700,
                color: 'var(--text-muted)',
              }}
            >
              {subtitle}
            </span>
          )}
        </div>
      </div>
      {label && (
        <span
          style={{
            fontSize: '0.78rem',
            fontWeight: 800,
            color: 'var(--text-secondary)',
            background: 'var(--card-hover, rgba(255, 255, 255, 0.05))',
            border: '1px solid var(--border-color)',
            padding: '2px 10px',
            borderRadius: '999px',
            marginTop: '2px',
          }}
        >
          {label}
        </span>
      )}
    </div>
  );
}

export function ProgressBar({ progress = 0, height = 8, color = '#1769FF', showLabel = false, animateOnMount = true }) {
  const target = Math.min(100, Math.max(0, progress));
  const [currentWidth, setCurrentWidth] = useState(animateOnMount ? 0 : target);

  useEffect(() => {
    let startTimestamp = null;
    const duration = 1000;
    let animationFrameId;

    const step = (timestamp) => {
      if (!startTimestamp) startTimestamp = timestamp;
      const elapsed = timestamp - startTimestamp;
      const progressRatio = Math.min(elapsed / duration, 1);
      const easeOut = 1 - Math.pow(1 - progressRatio, 3);
      setCurrentWidth(easeOut * target);

      if (progressRatio < 1) {
        animationFrameId = requestAnimationFrame(step);
      } else {
        setCurrentWidth(target);
      }
    };

    animationFrameId = requestAnimationFrame(step);
    return () => cancelAnimationFrame(animationFrameId);
  }, [progress, target]);

  return (
    <div style={{ width: '100%' }}>
      {showLabel && (
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px', fontSize: '0.8rem', fontWeight: 600 }}>
          <span style={{ color: 'var(--text-secondary)' }}>Progress</span>
          <span style={{ color: 'var(--text-primary)' }}>{Math.round(currentWidth)}%</span>
        </div>
      )}
      <div
        style={{
          width: '100%',
          height: `${height}px`,
          backgroundColor: 'var(--border-color)',
          borderRadius: '9999px',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            width: `${currentWidth}%`,
            height: '100%',
            backgroundColor: color,
            borderRadius: '9999px',
            transition: 'width 0.05s linear',
          }}
        />
      </div>
    </div>
  );
}
