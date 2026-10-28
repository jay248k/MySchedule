import React, { useState, useEffect, useMemo } from 'react';
import { X, Calendar, Clock, Tag, Flag, Target, AlertTriangle, Palette, Check } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { getTodayDateString } from '../../utils/dateUtils';
import { findScheduleConflict, timeToMinutes } from '../../utils/taskUtils';
import { CustomSelect } from '../common/CustomSelect';

const PRESET_COLORS = [
  { name: 'Category Default', value: '', label: 'Default' },
  { name: 'Emerald Green', value: '#10B981' },
  { name: 'Sapphire Blue', value: '#1769FF' },
  { name: 'Sky Blue', value: '#0284C7' },
  { name: 'Violet', value: '#8B5CF6' },
  { name: 'Purple', value: '#7C3AED' },
  { name: 'Rose Red', value: '#F43F5E' },
  { name: 'Crimson Red', value: '#EF4444' },
  { name: 'Amber Orange', value: '#F59E0B' },
  { name: 'Teal Cyan', value: '#0D9488' },
  { name: 'Indigo', value: '#4F46E5' },
  { name: 'Slate Gray', value: '#64748B' },
];

export function TaskModal() {
  const { activeModal, closeModal, addTask, updateTask, categories, goals, selectedDate, tasks } = useApp();

  const isEditing = activeModal?.type === 'task' && activeModal?.data?.id;
  const initialData = activeModal?.data || {};

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState(selectedDate || getTodayDateString());
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('10:00');
  const [categoryId, setCategoryId] = useState('');
  const [color, setColor] = useState('');
  const [priority, setPriority] = useState('Medium');
  const [goalId, setGoalId] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (activeModal?.type === 'task') {
      setTitle(initialData.title || '');
      setDescription(initialData.description || '');
      setDate(initialData.date || selectedDate || getTodayDateString());
      setStartTime(initialData.startTime || '09:00');
      setEndTime(initialData.endTime || '10:00');
      setCategoryId(initialData.categoryId || categories[0]?.id || 'cat-work');
      setColor(initialData.color || '');
      setPriority(initialData.priority || 'Medium');
      setGoalId(initialData.goalId || '');
      setError('');
    }
  }, [activeModal, categories, initialData.color, initialData.id]);

  // Live conflict detection
  const liveConflict = useMemo(() => {
    if (!date || !startTime || !endTime) return null;
    return findScheduleConflict({
      date,
      startTime,
      endTime,
      tasks,
      excludeTaskId: isEditing ? initialData.id : null,
    });
  }, [date, startTime, endTime, tasks, isEditing, initialData.id]);

  if (activeModal?.type !== 'task') return null;

  const currentCategory = categories.find((c) => c.id === categoryId) || categories[0];
  const effectiveColor = color || currentCategory?.color || '#1769FF';

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!title.trim()) {
      setError('Please enter a task title.');
      return;
    }

    if (!startTime || !endTime) {
      setError('Please provide both start time and end time.');
      return;
    }

    if (timeToMinutes(endTime) <= timeToMinutes(startTime)) {
      setError('End time must be after start time.');
      return;
    }

    const conflict = findScheduleConflict({
      date,
      startTime,
      endTime,
      tasks,
      excludeTaskId: isEditing ? initialData.id : null,
    });

    if (conflict) {
      setError(
        `Time slot conflict: "${conflict.title}" is already scheduled from ${conflict.startTime} to ${conflict.endTime}. Other tasks cannot be scheduled in this slot.`
      );
      return;
    }

    const taskPayload = {
      title: title.trim(),
      description: description.trim(),
      date,
      startTime,
      endTime,
      categoryId,
      color: color || null,
      priority,
      goalId: goalId || null,
    };

    if (isEditing) {
      updateTask(initialData.id, taskPayload);
    } else {
      addTask(taskPayload);
    }

    closeModal();
  };

  return (
    <div className="modal-backdrop" onClick={closeModal}>
      <div className="modal-card" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '540px' }}>
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span
              style={{
                width: '12px',
                height: '12px',
                borderRadius: '50%',
                background: effectiveColor,
                boxShadow: `0 0 10px ${effectiveColor}80`,
                display: 'inline-block',
              }}
            />
            <h3 className="modal-title">{isEditing ? 'Edit Task' : 'Create New Task'}</h3>
          </div>
          <button type="button" className="btn-icon" onClick={closeModal} aria-label="Close modal">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {error && (
              <div
                style={{
                  background: 'var(--danger-bg)',
                  color: 'var(--danger)',
                  padding: '10px 14px',
                  borderRadius: 'var(--radius-sm)',
                  fontSize: '0.85rem',
                  fontWeight: 600,
                }}
              >
                {error}
              </div>
            )}

            {/* Task Title */}
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Task Title *</label>
              <input
                type="text"
                className="form-input"
                placeholder="Enter task title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                autoFocus
              />
            </div>

            {/* Description */}
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Description</label>
              <textarea
                className="form-textarea"
                rows={2}
                placeholder="Add context, subtasks, or deliverables..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>

            {/* Date & Category Row */}
            <div className="form-row" style={{ marginBottom: 0, gap: '12px' }}>
              <div className="form-group" style={{ flex: 1, marginBottom: 0 }}>
                <label className="form-label">
                  <Calendar size={14} style={{ display: 'inline', marginRight: '6px' }} />
                  Date
                </label>
                <input
                  type="date"
                  className="form-input"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                />
              </div>

              <div className="form-group" style={{ flex: 1, marginBottom: 0 }}>
                <label className="form-label">
                  <Tag size={14} style={{ display: 'inline', marginRight: '6px' }} />
                  Category
                </label>
                <CustomSelect
                  value={categoryId}
                  onChange={(val) => setCategoryId(val)}
                  options={categories.map((c) => ({
                    value: c.id,
                    label: c.name,
                    color: c.color,
                  }))}
                  placeholder="Select Category"
                  searchPlaceholder="Search categories..."
                  showSearch={categories.length > 5}
                />
              </div>
            </div>

            {/* Color Option Selector */}
            <div
              style={{
                padding: '10px 14px',
                borderRadius: 'var(--radius-md, 10px)',
                background: 'var(--page-bg, rgba(255, 255, 255, 0.03))',
                border: '1px solid var(--border-color, rgba(255, 255, 255, 0.08))',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginBottom: '8px',
                }}
              >
                <span
                  style={{
                    fontSize: '0.82rem',
                    fontWeight: 700,
                    color: 'var(--text-primary)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                  }}
                >
                  <Palette size={14} color="var(--primary-color)" />
                  Task Color Accent
                </span>

                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span
                    style={{
                      fontSize: '0.74rem',
                      color: 'var(--text-secondary)',
                      fontWeight: 600,
                    }}
                  >
                    {color ? 'Custom Color' : `Category (${currentCategory?.name || 'Default'})`}
                  </span>
                  <div
                    style={{
                      width: '18px',
                      height: '18px',
                      borderRadius: '50%',
                      background: effectiveColor,
                      border: '2px solid rgba(255, 255, 255, 0.4)',
                    }}
                    title={`Current color: ${effectiveColor}`}
                  />
                </div>
              </div>

              {/* Swatches Grid */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '7px', flexWrap: 'wrap' }}>
                {PRESET_COLORS.map((p) => {
                  const isSelected = p.value === '' ? color === '' : color.toLowerCase() === p.value.toLowerCase();
                  const swatchBg = p.value || currentCategory?.color || '#3B82F6';

                  return (
                    <button
                      key={p.name}
                      type="button"
                      onClick={() => setColor(p.value)}
                      title={p.name}
                      style={{
                        width: '26px',
                        height: '26px',
                        borderRadius: '50%',
                        background: swatchBg,
                        border: isSelected
                          ? '2.5px solid #FFFFFF'
                          : '1.5px solid rgba(255, 255, 255, 0.18)',
                        cursor: 'pointer',
                        padding: 0,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#FFFFFF',
                        boxShadow: isSelected ? `0 0 10px ${swatchBg}` : 'none',
                        outline: isSelected ? `2px solid ${swatchBg}` : 'none',
                        outlineOffset: '2px',
                        transition: 'opacity 0.15s ease',
                      }}
                    >
                      {isSelected && <Check size={13} strokeWidth={3.5} />}
                    </button>
                  );
                })}

                {/* Custom Color Native Picker Button */}
                <label
                  title="Pick custom color"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: '26px',
                    height: '26px',
                    borderRadius: '50%',
                    background: 'conic-gradient(red, yellow, lime, aqua, blue, magenta, red)',
                    border: '1.5px solid rgba(255, 255, 255, 0.4)',
                    cursor: 'pointer',
                    position: 'relative',
                    overflow: 'hidden',
                  }}
                >
                  <input
                    type="color"
                    value={color || currentCategory?.color || '#1769FF'}
                    onChange={(e) => setColor(e.target.value)}
                    style={{
                      position: 'absolute',
                      opacity: 0,
                      width: '100%',
                      height: '100%',
                      cursor: 'pointer',
                    }}
                  />
                </label>
              </div>
            </div>

            {/* Start Time & End Time */}
            <div className="form-row" style={{ marginBottom: 0, gap: '12px' }}>
              <div className="form-group" style={{ flex: 1, marginBottom: 0 }}>
                <label className="form-label">
                  <Clock size={14} style={{ display: 'inline', marginRight: '6px' }} />
                  Start Time
                </label>
                <input
                  type="time"
                  className="form-input"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                />
              </div>

              <div className="form-group" style={{ flex: 1, marginBottom: 0 }}>
                <label className="form-label">
                  <Clock size={14} style={{ display: 'inline', marginRight: '6px' }} />
                  End Time
                </label>
                <input
                  type="time"
                  className="form-input"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                />
              </div>
            </div>

            {/* Conflict Warning */}
            {liveConflict && (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '10px 14px',
                  borderRadius: 'var(--radius-sm)',
                  background: 'rgba(239, 68, 68, 0.12)',
                  border: '1px solid rgba(239, 68, 68, 0.3)',
                  color: '#EF4444',
                  fontSize: '0.82rem',
                  fontWeight: 600,
                }}
              >
                <AlertTriangle size={16} style={{ flexShrink: 0 }} />
                <span>
                  <strong>Time Conflict:</strong> "{liveConflict.title}" is already scheduled from{' '}
                  {liveConflict.startTime} to {liveConflict.endTime}.
                </span>
              </div>
            )}

            {/* Priority & Associated Goal */}
            <div className="form-row" style={{ marginBottom: 0, gap: '12px' }}>
              <div className="form-group" style={{ flex: 1, marginBottom: 0 }}>
                <label className="form-label">
                  <Flag size={14} style={{ display: 'inline', marginRight: '6px' }} />
                  Priority
                </label>
                <CustomSelect
                  value={priority}
                  onChange={(val) => setPriority(val)}
                  options={[
                    { value: 'High', label: 'High Priority', color: '#EF4444' },
                    { value: 'Medium', label: 'Medium Priority', color: '#F59E0B' },
                    { value: 'Low', label: 'Low Priority', color: '#10B981' },
                  ]}
                  showSearch={false}
                />
              </div>

              <div className="form-group" style={{ flex: 1, marginBottom: 0 }}>
                <label className="form-label">
                  <Target size={14} style={{ display: 'inline', marginRight: '6px', color: 'var(--primary-color)' }} />
                  Associated Goal (Optional)
                </label>
                <CustomSelect
                  value={goalId}
                  onChange={(val) => setGoalId(val)}
                  options={[
                    { value: '', label: 'None (No Goal)' },
                    ...goals.map((g) => ({
                      value: g.id,
                      label: g.title,
                      description: g.category || 'General',
                    })),
                  ]}
                  placeholder="None (No Goal)"
                  searchPlaceholder="Search goals..."
                  showSearch={goals.length > 4}
                  isClearable={true}
                />
              </div>
            </div>
          </div>

          <div className="modal-footer" style={{ marginTop: '16px' }}>
            <button type="button" className="btn btn-secondary" onClick={closeModal}>
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={!!liveConflict}
              style={{
                opacity: liveConflict ? 0.6 : 1,
                cursor: liveConflict ? 'not-allowed' : 'pointer',
              }}
              title={liveConflict ? 'Time slot is already occupied' : undefined}
            >
              {isEditing ? 'Save Changes' : 'Schedule Task'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
