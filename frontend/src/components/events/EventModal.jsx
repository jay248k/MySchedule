import React, { useState, useEffect } from 'react';
import { X, Calendar, Clock, Tag } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { getTodayDateString } from '../../utils/dateUtils';

export function EventModal() {
  const { activeModal, closeModal, addEvent, updateEvent, categories, selectedDate } = useApp();

  const isEditing = activeModal?.type === 'event' && activeModal?.data?.id;
  const initialData = activeModal?.data || {};

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState(selectedDate || getTodayDateString());
  const [startTime, setStartTime] = useState('10:00');
  const [endTime, setEndTime] = useState('11:00');
  const [categoryId, setCategoryId] = useState('');
  const [location, setLocation] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (activeModal?.type === 'event') {
      setTitle(initialData.title || '');
      setDescription(initialData.description || '');
      setDate(initialData.date || selectedDate || getTodayDateString());
      setStartTime(initialData.startTime || '10:00');
      setEndTime(initialData.endTime || '11:00');
      setCategoryId(initialData.categoryId || categories[0]?.id || 'cat-work');
      setLocation(initialData.location || '');
      setError('');
    }
  }, [activeModal, categories]);

  if (activeModal?.type !== 'event') return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!title.trim()) {
      setError('Please provide an event title.');
      return;
    }

    const payload = {
      title: title.trim(),
      description: description.trim(),
      date,
      startTime,
      endTime,
      categoryId,
      location: location.trim(),
    };

    if (isEditing) {
      updateEvent(initialData.id, payload);
    } else {
      addEvent(payload);
    }

    closeModal();
  };

  return (
    <div className="modal-backdrop" onClick={closeModal}>
      <div className="modal-card" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3 className="modal-title">{isEditing ? 'Edit Calendar Event' : 'New Calendar Event'}</h3>
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
              <label className="form-label">Event Title *</label>
              <input
                type="text"
                className="form-input"
                placeholder="e.g., Team Sprint Review"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                autoFocus
              />
            </div>

            <div className="form-group">
              <label className="form-label">Location / Link</label>
              <div style={{ position: 'relative' }}>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g., Zoom Meeting, Room 402, Downtown Hub"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                />
              </div>
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

            <div className="form-group">
              <label className="form-label">Description</label>
              <textarea
                className="form-textarea"
                rows={2}
                placeholder="Details, agendas, attendees..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={closeModal}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary">
              {isEditing ? 'Save Changes' : 'Create Event'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
