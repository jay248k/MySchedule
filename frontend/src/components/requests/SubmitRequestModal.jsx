import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { FileText, Calendar, Clock, AlertCircle, X, PlusCircle } from 'lucide-react';
import { getTodayDateString } from '../../utils/dateUtils';
import { CustomSelect } from '../common/CustomSelect';

export default function SubmitRequestModal({ isOpen, onClose }) {
  const { tasks, submitWorkRequest } = useApp();
  const [title, setTitle] = useState('');
  const [selectedTaskId, setSelectedTaskId] = useState('');
  const [date, setDate] = useState(() => getTodayDateString());
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('10:00');
  const [reason, setReason] = useState('');
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleTaskSelect = (taskId) => {
    setSelectedTaskId(taskId);
    if (taskId) {
      const task = tasks.find((t) => t.id === taskId);
      if (task) {
        setTitle(task.title || '');
        if (task.date) setDate(task.date);
        if (task.timeSlot) {
          const parts = task.timeSlot.split('-');
          if (parts[0]) setStartTime(parts[0].trim());
          if (parts[1]) setEndTime(parts[1].trim());
        }
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!reason.trim()) {
      setError('Please enter the reason why this work was missed or needs this request.');
      return;
    }
    if (!title.trim()) {
      setError('Please provide a title or select a task.');
      return;
    }

    const res = await submitWorkRequest({
      title: title.trim(),
      taskId: selectedTaskId || null,
      date,
      startTime,
      endTime,
      reason: reason.trim(),
    });

    if (res?.success) {
      setTitle('');
      setSelectedTaskId('');
      setReason('');
      setError('');
      onClose();
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 2000,
        backgroundColor: 'rgba(0,0,0,0.75)',
        backdropFilter: 'blur(6px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        style={{
          background: 'var(--bg-secondary, #1a2234)',
          border: '1px solid var(--border-color, rgba(255,255,255,0.12))',
          borderRadius: '16px',
          width: '100%',
          maxWidth: '520px',
          boxShadow: 'none',
          overflow: 'hidden',
          animation: 'fadeIn 0.2s ease-out',
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: '18px 22px',
            borderBottom: '1px solid var(--border-color, rgba(255,255,255,0.08))',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: 'var(--bg-tertiary, rgba(255,255,255,0.03))',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '10px',
                background: 'rgba(23, 105, 255, 0.18)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--accent-primary, #1769FF)',
              }}
            >
              <FileText size={20} />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                Submit Missed Work Request
              </h3>
              <p style={{ margin: 0, fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                Report missed work, past tasks, or request adjustments with mandatory reason
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--text-secondary)',
              cursor: 'pointer',
              padding: '6px',
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} style={{ padding: '20px 22px' }}>
          {/* Quick pick from existing tasks */}
          {tasks && tasks.length > 0 && (
            <div style={{ marginBottom: '14px' }}>
              <label
                style={{
                  display: 'block',
                  fontSize: '0.82rem',
                  fontWeight: 700,
                  color: 'var(--text-secondary)',
                  marginBottom: '6px',
                }}
              >
                Select Existing Task (Optional)
              </label>
              <CustomSelect
                value={selectedTaskId}
                onChange={(val) => handleTaskSelect(val)}
                placeholder="-- Choose task or type custom title below --"
                searchPlaceholder="Search tasks..."
                isClearable={true}
                options={[
                  { value: '', label: '-- Choose task or type custom title below --' },
                  ...tasks.map((t) => ({
                    value: t.id,
                    label: t.title,
                    description: `${t.date || 'No date'}${t.startTime ? ` • ${t.startTime} - ${t.endTime || ''}` : t.timeSlot ? ` • ${t.timeSlot}` : ''}`,
                    badge: t.priority || undefined,
                  })),
                ]}
              />
            </div>
          )}

          {/* Work Title */}
          <div style={{ marginBottom: '14px' }}>
            <label
              style={{
                display: 'block',
                fontSize: '0.82rem',
                fontWeight: 700,
                color: 'var(--text-secondary)',
                marginBottom: '6px',
              }}
            >
              Work / Task Title <span style={{ color: '#EF4444' }}>*</span>
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => {
                setTitle(e.target.value);
                if (error) setError('');
              }}
              placeholder="Enter work or task title"
              style={{
                width: '100%',
                padding: '10px 12px',
                borderRadius: '10px',
                background: 'var(--bg-primary, #0f172a)',
                border: '1px solid var(--border-color, rgba(255,255,255,0.12))',
                color: 'var(--text-primary)',
                fontSize: '0.88rem',
                outline: 'none',
                boxSizing: 'border-box',
              }}
            />
          </div>

          {/* Date & Time */}
          <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr 1fr', gap: '10px', marginBottom: '14px' }}>
            <div>
              <label
                style={{
                  display: 'block',
                  fontSize: '0.82rem',
                  fontWeight: 700,
                  color: 'var(--text-secondary)',
                  marginBottom: '6px',
                }}
              >
                Missed Date
              </label>
              <input
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                style={{
                  width: '100%',
                  padding: '9px 10px',
                  borderRadius: '10px',
                  background: 'var(--bg-primary, #0f172a)',
                  border: '1px solid var(--border-color, rgba(255,255,255,0.12))',
                  color: 'var(--text-primary)',
                  fontSize: '0.84rem',
                  outline: 'none',
                  boxSizing: 'border-box',
                }}
              />
            </div>
            <div>
              <label
                style={{
                  display: 'block',
                  fontSize: '0.82rem',
                  fontWeight: 700,
                  color: 'var(--text-secondary)',
                  marginBottom: '6px',
                }}
              >
                Start Time
              </label>
              <input
                type="time"
                required
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                style={{
                  width: '100%',
                  padding: '9px 10px',
                  borderRadius: '10px',
                  background: 'var(--bg-primary, #0f172a)',
                  border: '1px solid var(--border-color, rgba(255,255,255,0.12))',
                  color: 'var(--text-primary)',
                  fontSize: '0.84rem',
                  outline: 'none',
                  boxSizing: 'border-box',
                }}
              />
            </div>
            <div>
              <label
                style={{
                  display: 'block',
                  fontSize: '0.82rem',
                  fontWeight: 700,
                  color: 'var(--text-secondary)',
                  marginBottom: '6px',
                }}
              >
                End Time
              </label>
              <input
                type="time"
                required
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                style={{
                  width: '100%',
                  padding: '9px 10px',
                  borderRadius: '10px',
                  background: 'var(--bg-primary, #0f172a)',
                  border: '1px solid var(--border-color, rgba(255,255,255,0.12))',
                  color: 'var(--text-primary)',
                  fontSize: '0.84rem',
                  outline: 'none',
                  boxSizing: 'border-box',
                }}
              />
            </div>
          </div>

          {/* Mandatory Reason */}
          <div style={{ marginBottom: '16px' }}>
            <label
              style={{
                display: 'block',
                fontSize: '0.82rem',
                fontWeight: 700,
                color: 'var(--text-secondary)',
                marginBottom: '6px',
              }}
            >
              Reason For Missing / Request <span style={{ color: '#EF4444' }}>* (Mandatory)</span>
            </label>
            <textarea
              required
              rows={3}
              value={reason}
              onChange={(e) => {
                setReason(e.target.value);
                if (error) setError('');
              }}
              placeholder="Enter reason for request"
              style={{
                width: '100%',
                padding: '10px 12px',
                borderRadius: '10px',
                background: 'var(--bg-primary, #0f172a)',
                border: error ? '1px solid #EF4444' : '1px solid var(--border-color, rgba(255,255,255,0.12))',
                color: 'var(--text-primary)',
                fontSize: '0.88rem',
                lineHeight: 1.5,
                outline: 'none',
                resize: 'vertical',
                boxSizing: 'border-box',
              }}
            />
            {error && (
              <p style={{ margin: '6px 0 0 0', fontSize: '0.78rem', color: '#EF4444', fontWeight: 600 }}>
                {error}
              </p>
            )}
          </div>

          {/* Buttons */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                padding: '9px 18px',
                borderRadius: '9px',
                border: '1px solid var(--border-color, rgba(255,255,255,0.15))',
                background: 'transparent',
                color: 'var(--text-secondary)',
                fontSize: '0.86rem',
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              style={{
                padding: '9px 20px',
                borderRadius: '9px',
                border: 'none',
                background: 'var(--accent-primary, #1769FF)',
                color: '#FFFFFF',
                fontSize: '0.86rem',
                fontWeight: 800,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
              }}
            >
              <PlusCircle size={16} /> Submit Request
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
