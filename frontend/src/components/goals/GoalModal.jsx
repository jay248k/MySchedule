import React, { useState, useEffect } from 'react';
import { X, Calendar } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { getTodayDateString } from '../../utils/dateUtils';

export function GoalModal() {
  const { activeModal, closeModal, addGoal, updateGoal, tasks } = useApp();

  const isEditing = activeModal?.type === 'goal' && activeModal?.data?.id;
  const initialData = activeModal?.data || {};

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [targetDate, setTargetDate] = useState(getTodayDateString(14));
  const [progress, setProgress] = useState(0);
  const [category, setCategory] = useState('General');
  const [selectedTaskIds, setSelectedTaskIds] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => {
    if (activeModal?.type === 'goal') {
      setTitle(initialData.title || '');
      setDescription(initialData.description || '');
      setTargetDate(initialData.targetDate || getTodayDateString(14));
      setProgress(initialData.progress !== undefined ? initialData.progress : 0);
      setCategory(initialData.category || 'General');
      setSelectedTaskIds(initialData.relatedTaskIds || []);
      setError('');
    }
  }, [activeModal]);

  if (activeModal?.type !== 'goal') return null;

  const handleToggleTask = (taskId) => {
    setSelectedTaskIds((prev) =>
      prev.includes(taskId) ? prev.filter((id) => id !== taskId) : [...prev, taskId]
    );
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!title.trim()) {
      setError('Please provide a goal title.');
      return;
    }

    const payload = {
      title: title.trim(),
      description: description.trim(),
      targetDate,
      progress: Number(progress),
      category,
      relatedTaskIds: selectedTaskIds,
    };

    if (isEditing) {
      updateGoal(initialData.id, payload);
    } else {
      addGoal(payload);
    }

    closeModal();
  };

  return (
    <div className="modal-backdrop" onClick={closeModal}>
      <div className="modal-card" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3 className="modal-title">{isEditing ? 'Edit Goal' : 'Create New Goal'}</h3>
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
              <label className="form-label">Goal Title *</label>
              <input
                type="text"
                className="form-input"
                placeholder="Enter goal title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                autoFocus
              />
            </div>

            <div className="form-group">
              <label className="form-label">Description & Target Outcomes</label>
              <textarea
                className="form-textarea"
                rows={3}
                placeholder="What will success look like?"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label className="form-label">
                  <Calendar size={14} style={{ display: 'inline', marginRight: '6px' }} />
                  Target Date
                </label>
                <input
                  type="date"
                  className="form-input"
                  value={targetDate}
                  onChange={(e) => setTargetDate(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Category</label>
                <select
                  className="form-select"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                >
                  <option value="Study">Study</option>
                  <option value="Work">Work</option>
                  <option value="Health">Health</option>
                  <option value="Learning">Learning</option>
                  <option value="Development">Development</option>
                  <option value="Personal">Personal</option>
                  <option value="General">General</option>
                </select>
              </div>
            </div>

            <div className="form-group">
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <label className="form-label">Progress: {progress}%</label>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                  {progress === 100 ? 'Completed' : 'In Progress'}
                </span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                step="5"
                value={progress}
                onChange={(e) => setProgress(e.target.value)}
                style={{ width: '100%', accentColor: 'var(--primary-color)' }}
              />
            </div>

            {/* Related Tasks */}
            <div className="form-group">
              <label className="form-label">Link Related Tasks ({selectedTaskIds.length} selected)</label>
              <div
                style={{
                  maxHeight: '140px',
                  overflowY: 'auto',
                  border: '1px solid var(--border-color)',
                  borderRadius: 'var(--radius-md)',
                  padding: '8px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '6px',
                }}
              >
                {tasks.slice(0, 10).map((t) => (
                  <label
                    key={t.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      fontSize: '0.85rem',
                      cursor: 'pointer',
                      padding: '4px 6px',
                      borderRadius: 'var(--radius-sm)',
                      background: selectedTaskIds.includes(t.id) ? 'var(--primary-light)' : 'transparent',
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={selectedTaskIds.includes(t.id)}
                      onChange={() => handleToggleTask(t.id)}
                    />
                    <span style={{ flex: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {t.title}
                    </span>
                  </label>
                ))}
              </div>
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={closeModal}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary">
              {isEditing ? 'Save Changes' : 'Create Goal'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
