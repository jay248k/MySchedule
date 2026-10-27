import React, { useState, useEffect } from 'react';
import {
  X,
  Square,
  Clock,
  Play,
  Coffee,
  Utensils,
  PhoneCall,
  Users,
  CheckCircle2,
  AlertTriangle,
  LogOut,
  Sparkles,
  ArrowRight,
  Bookmark,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';

const PRESET_REASONS = [
  { label: 'Coffee / Tea Break', icon: '☕', category: 'break' },
  { label: 'Lunch / Dinner Break', icon: '🍱', category: 'meal' },
  { label: 'Phone Call / Discussion', icon: '📞', category: 'call' },
  { label: 'Team Meeting', icon: '👥', category: 'meeting' },
  { label: 'Stepped Away / Personal', icon: '🚶', category: 'personal' },
  { label: 'Task Completed', icon: '🎯', category: 'complete' },
  { label: 'Switching Tasks', icon: '🔀', category: 'switch' },
  { label: 'Urgent Interruption', icon: '⚠️', category: 'urgent' },
  { label: 'Finished for Today', icon: '🛑', category: 'end' },
];

export function StopReasonModal() {
  const {
    isStopModalOpen,
    cancelStopModal,
    completeStopWorkSession,
    activeWorkSession,
    tasks = [],
    selectedDate,
  } = useApp();

  const [stopReason, setStopReason] = useState('Lunch / Dinner Break');
  const [customReason, setCustomReason] = useState('');
  const [notes, setNotes] = useState('');
  const [selectedTaskId, setSelectedTaskId] = useState('');
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  // Sync state when modal opens
  useEffect(() => {
    if (isStopModalOpen && activeWorkSession) {
      const now = Date.now();
      const elapsed = Math.max(1, Math.round((now - activeWorkSession.startTimestamp) / 1000));
      setElapsedSeconds(elapsed);
      setSelectedTaskId(activeWorkSession.taskId || '');
      setStopReason('Lunch / Dinner Break');
      setCustomReason('');
      setNotes('');
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

  const activeDate = selectedDate || new Date().toISOString().split('T')[0];
  const todayTasks = tasks.filter((t) => t.date === activeDate);

  const handleSelectPreset = (reasonLabel) => {
    setStopReason(reasonLabel);
    setCustomReason('');
  };

  const handleSave = (e) => {
    e.preventDefault();
    const finalReason = customReason.trim() || stopReason;
    const taskObj = todayTasks.find((t) => t.id === selectedTaskId);

    completeStopWorkSession({
      stopReason: finalReason,
      notes: notes.trim(),
      taskId: selectedTaskId || null,
      taskTitle: taskObj ? taskObj.title : (activeWorkSession.taskTitle || ''),
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
          maxWidth: '560px',
          background: 'var(--card-bg, #10192C)',
          border: '1px solid rgba(239, 68, 68, 0.35)',
          borderRadius: '18px',
          boxShadow: '0 20px 48px -12px rgba(0, 0, 0, 0.5), 0 0 24px rgba(239, 68, 68, 0.15)',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          maxHeight: '92vh',
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: '18px 24px',
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
                width: '38px',
                height: '38px',
                borderRadius: '10px',
                background: 'rgba(239, 68, 68, 0.15)',
                border: '1px solid rgba(239, 68, 68, 0.4)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#EF4444',
              }}
            >
              <Square size={18} fill="#EF4444" />
            </div>
            <div>
              <h2 style={{ fontSize: '1.15rem', fontWeight: 800, margin: 0, color: 'var(--text-primary, #FFFFFF)' }}>
                Stop / Pause Work Session
              </h2>
              <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary, #94A3B8)' }}>
                Please specify why you are pausing or stopping your work timer
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
            <X size={20} />
          </button>
        </div>

        {/* Content Body */}
        <form onSubmit={handleSave} style={{ overflowY: 'auto', padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: '18px' }}>
          {/* Duration Summary Pill Card */}
          <div
            style={{
              background: 'rgba(239, 68, 68, 0.06)',
              border: '1px solid rgba(239, 68, 68, 0.22)',
              borderRadius: '12px',
              padding: '14px 18px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '12px',
              flexWrap: 'wrap',
            }}
          >
            <div>
              <div style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-muted, #94A3B8)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Session Elapsed Time
              </div>
              <div
                style={{
                  fontFamily: 'monospace, "Courier New", Courier',
                  fontSize: '1.75rem',
                  fontWeight: 900,
                  color: '#EF4444',
                  letterSpacing: '1px',
                  textShadow: '0 0 10px rgba(239, 68, 68, 0.35)',
                }}
              >
                {formattedDuration}
              </div>
            </div>

            <div style={{ textAlign: 'right', fontSize: '0.78rem', color: 'var(--text-secondary, #CBD5E1)', lineHeight: 1.5 }}>
              <div>Started: <strong style={{ color: 'var(--text-primary, #FFFFFF)' }}>{activeWorkSession.startTime}</strong></div>
              <div>Stopping: <strong style={{ color: 'var(--text-primary, #FFFFFF)' }}>{nowTime}</strong></div>
            </div>
          </div>

          {/* Quick Preset Badges */}
          <div>
            <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-primary, #FFFFFF)', marginBottom: '8px' }}>
              Select Stop Reason:
            </label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
              {PRESET_REASONS.map((preset) => {
                const isSelected = stopReason === preset.label && !customReason;
                return (
                  <button
                    key={preset.label}
                    type="button"
                    onClick={() => handleSelectPreset(preset.label)}
                    style={{
                      background: isSelected ? 'rgba(239, 68, 68, 0.2)' : 'var(--page-bg, rgba(255, 255, 255, 0.04))',
                      border: isSelected ? '1.5px solid #EF4444' : '1px solid var(--border-color, rgba(255, 255, 255, 0.1))',
                      color: isSelected ? '#EF4444' : 'var(--text-primary, #E2E8F0)',
                      padding: '7px 12px',
                      borderRadius: '8px',
                      fontSize: '0.82rem',
                      fontWeight: isSelected ? 700 : 500,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    <span>{preset.icon}</span>
                    <span>{preset.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Custom Stop Reason Input */}
          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary, #94A3B8)', marginBottom: '5px' }}>
              Or Type Custom Reason:
            </label>
            <input
              type="text"
              placeholder="e.g. Urgent client Slack message, Quick grocery run..."
              value={customReason}
              onChange={(e) => setCustomReason(e.target.value)}
              className="form-input"
              style={{
                width: '100%',
                padding: '10px 14px',
                borderRadius: '8px',
                background: 'var(--input-bg, rgba(255, 255, 255, 0.04))',
                border: '1px solid var(--border-color, rgba(255, 255, 255, 0.12))',
                color: 'var(--text-primary, #FFFFFF)',
                fontSize: '0.88rem',
              }}
            />
          </div>

          {/* Associated Task (Optional) */}
          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary, #94A3B8)', marginBottom: '5px' }}>
              Assign to Task (Optional):
            </label>
            <select
              value={selectedTaskId}
              onChange={(e) => setSelectedTaskId(e.target.value)}
              className="form-input"
              style={{
                width: '100%',
                padding: '10px 14px',
                borderRadius: '8px',
                background: 'var(--input-bg, rgba(255, 255, 255, 0.04))',
                border: '1px solid var(--border-color, rgba(255, 255, 255, 0.12))',
                color: 'var(--text-primary, #FFFFFF)',
                fontSize: '0.88rem',
              }}
            >
              <option value="">General Work / No specific task</option>
              {todayTasks.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.title} {t.category ? `(${t.category})` : ''} [{t.startTime || 'No time'}]
                </option>
              ))}
            </select>
          </div>

          {/* Session Notes / Accomplishments (Optional) */}
          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary, #94A3B8)', marginBottom: '5px' }}>
              Notes / What did you accomplish? (Optional):
            </label>
            <textarea
              rows={2}
              placeholder="Summary of progress, milestones hit, or reason for pausing..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="form-input"
              style={{
                width: '100%',
                padding: '10px 14px',
                borderRadius: '8px',
                background: 'var(--input-bg, rgba(255, 255, 255, 0.04))',
                border: '1px solid var(--border-color, rgba(255, 255, 255, 0.12))',
                color: 'var(--text-primary, #FFFFFF)',
                fontSize: '0.85rem',
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
              gap: '12px',
              paddingTop: '10px',
              borderTop: '1px solid var(--border-subtle, rgba(255, 255, 255, 0.08))',
            }}
          >
            <button
              type="button"
              className="btn btn-secondary"
              onClick={cancelStopModal}
              style={{ fontSize: '0.86rem', display: 'flex', alignItems: 'center', gap: '6px' }}
            >
              <Play size={14} fill="currentColor" /> Keep Working
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              style={{
                background: '#EF4444',
                borderColor: '#DC2626',
                color: '#FFFFFF',
                fontWeight: 700,
                fontSize: '0.88rem',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                boxShadow: '0 4px 14px rgba(239, 68, 68, 0.35)',
              }}
            >
              <Square size={14} fill="#FFFFFF" />
              Save & Stop Work Session
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
