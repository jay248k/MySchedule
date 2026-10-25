import React, { useState, useEffect } from 'react';

export function ProgressRing({
  radius = 50,
  stroke = 8,
  progress = 0,
  color = '#1769FF',
  trackColor = '#DFEAFE',
  label = '',
  animateOnMount = true,
}) {
  const [currentProgress, setCurrentProgress] = useState(animateOnMount ? 0 : progress);

  useEffect(() => {
    let startTimestamp = null;
    const duration = 1200; // 1.2s smooth count-up from 0 to N
    const target = Math.min(100, Math.max(0, progress));
    let animationFrameId;

    const step = (timestamp) => {
      if (!startTimestamp) startTimestamp = timestamp;
      const elapsed = timestamp - startTimestamp;
      const progressRatio = Math.min(elapsed / duration, 1);
      // easeOutCubic curve for smooth decelerating count-up
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

  const normalizedRadius = radius - stroke * 2;
  const circumference = normalizedRadius * 2 * Math.PI;
  const strokeDashoffset = circumference - (currentProgress / 100) * circumference;

  return (
    <div style={{ display: 'inline-flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
      <div style={{ position: 'relative', width: radius * 2, height: radius * 2 }}>
        <svg height={radius * 2} width={radius * 2} style={{ transform: 'rotate(-90deg)' }}>
          <circle
            stroke={trackColor}
            fill="transparent"
            strokeWidth={stroke}
            r={normalizedRadius}
            cx={radius}
            cy={radius}
          />
          <circle
            stroke={color}
            fill="transparent"
            strokeWidth={stroke}
            strokeDasharray={`${circumference} ${circumference}`}
            style={{
              strokeDashoffset,
              transition: 'stroke-dashoffset 0.1s linear',
            }}
            strokeLinecap="round"
            r={normalizedRadius}
            cx={radius}
            cy={radius}
          />
        </svg>
        <div
          style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <span style={{ fontSize: `${radius * 0.38}px`, fontWeight: 800, color: 'var(--text-primary)' }}>
            {Math.round(currentProgress)}%
          </span>
        </div>
      </div>
      {label && (
        <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
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
