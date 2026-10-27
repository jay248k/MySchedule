import React, { useState, useEffect, useMemo } from 'react';
import { X, Calendar, Clock, Tag, Flag, Target, AlertTriangle } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { getTodayDateString } from '../../utils/dateUtils';
import { findScheduleConflict, timeToMinutes } from '../../utils/taskUtils';

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
      setPriority(initialData.priority || 'Medium');
      setGoalId(initialData.goalId || '');
      setError('');
    }
  }, [activeModal, categories]);

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
      <div className="modal-card" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3 className="modal-title">{isEditing ? 'Edit Task' : 'Create New Task'}</h3>
          <button type="button" className="btn-icon" onClick={closeModal} aria-label="Close modal">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            {error && (
              <div
                style={{
                  background: 'var(--danger-bg)',
                  color: 'var(--danger)',
                  padding: '10px 14px',
                  borderRadius: 'var(--radius-sm)',
                  fontSize: '0.85rem',
                  fontWeight: 600,
                  marginBottom: '16px',
                }}
              >
                {error}
              </div>
            )}

            <div className="form-group">
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

            <div className="form-group">
              <label className="form-label">Description</label>
              <textarea
                className="form-textarea"
                rows={3}
                placeholder="Add context, subtasks, or deliverables..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>

            <div className="form-row">
              <div className="form-group">
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

              <div className="form-group">
                <label className="form-label">
                  <Tag size={14} style={{ display: 'inline', marginRight: '6px' }} />
                  Category
                </label>
                <select
                  className="form-select"
                  value={categoryId}
                  onChange={(e) => setCategoryId(e.target.value)}
                >
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
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

              <div className="form-group">
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
                  marginBottom: '16px',
                }}
              >
                <AlertTriangle size={16} style={{ flexShrink: 0 }} />
                <span>
                  <strong>Time Conflict:</strong> "{liveConflict.title}" is already scheduled from{' '}
                  {liveConflict.startTime} to {liveConflict.endTime}. Other tasks cannot overlap this time slot.
                </span>
              </div>
            )}

            <div className="form-row">
              <div className="form-group">
                <label className="form-label">
                  <Flag size={14} style={{ display: 'inline', marginRight: '6px' }} />
                  Priority
                </label>
                <select
                  className="form-select"
                  value={priority}
                  onChange={(e) => setPriority(e.target.value)}
                >
                  <option value="High">High Priority</option>
                  <option value="Medium">Medium Priority</option>
                  <option value="Low">Low Priority</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">
                  <Target size={14} style={{ display: 'inline', marginRight: '6px', color: 'var(--primary-color)' }} />
                  Associated Goal (Optional)
                </label>
                <select
                  className="form-select"
                  value={goalId}
                  onChange={(e) => setGoalId(e.target.value)}
                >
                  <option value="">None (No Goal)</option>
                  {goals.map((g) => (
                    <option key={g.id} value={g.id}>
                      {g.title} ({g.category || 'General'})
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          <div className="modal-footer">
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
