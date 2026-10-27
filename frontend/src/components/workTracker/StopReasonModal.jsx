import React, { useState, useEffect } from 'react';
import { X, Square, Play, MessageSquare } from 'lucide-react';
import { useApp } from '../../context/AppContext';

export function StopReasonModal() {
  const {
    isStopModalOpen,
    cancelStopModal,
    completeStopWorkSession,
    activeWorkSession,
  } = useApp();

  const [remarks, setRemarks] = useState('');
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  // Sync state when modal opens
  useEffect(() => {
    if (isStopModalOpen && activeWorkSession) {
      const now = Date.now();
      const elapsed = Math.max(1, Math.round((now - activeWorkSession.startTimestamp) / 1000));
      setElapsedSeconds(elapsed);
      setRemarks('');
    }
  }, [isStopModalOpen, activeWorkSession]);

  if (!isStopModalOpen || !activeWorkSession) {
    return null;
  }

  const hours = Math.floor(elapsedSeconds / 3600);
  const minutes = Math.floor((elapsedSeconds % 3600) / 60);
  const seconds = elapsedSeconds % 60;
  const formattedDuration = `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;

  const nowTime = new Date().toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });

  const handleSave = (e) => {
    e.preventDefault();
    const finalRemarks = remarks.trim() || 'Work session ended';

    completeStopWorkSession({
      stopReason: finalRemarks,
      notes: finalRemarks,
      taskId: activeWorkSession.taskId || null,
      taskTitle: activeWorkSession.taskTitle || '',
    });
  };

  return (
    <div
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
        if (e.target === e.currentTarget) cancelStopModal();
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '460px',
          background: 'var(--card-bg, #10192C)',
          border: '1px solid rgba(239, 68, 68, 0.35)',
          borderRadius: '16px',
          boxShadow: '0 20px 48px -12px rgba(0, 0, 0, 0.5), 0 0 24px rgba(239, 68, 68, 0.15)',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: '16px 20px',
            borderBottom: '1px solid var(--border-color, rgba(255, 255, 255, 0.08))',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: 'linear-gradient(180deg, rgba(239, 68, 68, 0.1) 0%, transparent 100%)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div
              style={{
                width: '34px',
                height: '34px',
                borderRadius: '8px',
                background: 'rgba(239, 68, 68, 0.15)',
                border: '1px solid rgba(239, 68, 68, 0.4)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#EF4444',
              }}
            >
              <Square size={16} fill="#EF4444" />
            </div>
            <div>
              <h2 style={{ fontSize: '1.1rem', fontWeight: 800, margin: 0, color: 'var(--text-primary, #FFFFFF)' }}>
                Stop Work Session
              </h2>
              <div style={{ fontSize: '0.76rem', color: 'var(--text-secondary, #94A3B8)' }}>
                Enter remarks for stopping your timer
              </div>
            </div>
          </div>

          <button
            type="button"
            className="btn-icon"
            onClick={cancelStopModal}
            title="Resume / Keep Working"
            style={{ color: 'var(--text-muted, #64748B)' }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Content Body */}
        <form onSubmit={handleSave} style={{ padding: '18px 20px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {/* Duration Summary Strip */}
          <div
            style={{
              background: 'rgba(239, 68, 68, 0.06)',
              border: '1px solid rgba(239, 68, 68, 0.22)',
              borderRadius: '10px',
              padding: '10px 14px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <div>
              <div style={{ fontSize: '0.68rem', fontWeight: 700, color: 'var(--text-muted, #94A3B8)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Session Elapsed Time
              </div>
              <div
                style={{
                  fontFamily: 'monospace, "Courier New", Courier',
                  fontSize: '1.5rem',
                  fontWeight: 900,
                  color: '#EF4444',
                  letterSpacing: '1px',
                  lineHeight: 1.1,
                }}
              >
                {formattedDuration}
              </div>
            </div>

            <div style={{ textAlign: 'right', fontSize: '0.76rem', color: 'var(--text-secondary, #CBD5E1)', lineHeight: 1.4 }}>
              <div>Started: <strong style={{ color: 'var(--text-primary, #FFFFFF)' }}>{activeWorkSession.startTime}</strong></div>
              <div>Stopped: <strong style={{ color: 'var(--text-primary, #FFFFFF)' }}>{nowTime}</strong></div>
            </div>
          </div>

          {/* Remarks Input Only */}
          <div>
            <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.84rem', fontWeight: 700, color: 'var(--text-primary, #FFFFFF)', marginBottom: '6px' }}>
              <MessageSquare size={14} color="#EF4444" />
              <span>Remarks:</span>
            </label>
            <textarea
              rows={3}
              placeholder="Enter remarks"
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              autoFocus
              required
              className="form-input"
              style={{
                width: '100%',
                padding: '10px 14px',
                borderRadius: '8px',
                background: 'var(--input-bg, rgba(255, 255, 255, 0.04))',
                border: '1px solid var(--border-color, rgba(255, 255, 255, 0.14))',
                color: 'var(--text-primary, #FFFFFF)',
                fontSize: '0.88rem',
                resize: 'none',
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
              paddingTop: '6px',
            }}
          >
            <button
              type="button"
              className="btn btn-secondary"
              onClick={cancelStopModal}
              style={{ fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '6px' }}
            >
              <Play size={13} fill="currentColor" /> Keep Working
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              style={{
                background: '#EF4444',
                borderColor: '#DC2626',
                color: '#FFFFFF',
                fontWeight: 700,
                fontSize: '0.86rem',
                display: 'flex',
                alignItems: 'center',
                gap: '7px',
                boxShadow: '0 4px 14px rgba(239, 68, 68, 0.35)',
              }}
            >
              <Square size={13} fill="#FFFFFF" />
              Save Remarks & Stop
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
