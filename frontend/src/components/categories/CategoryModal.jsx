import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { useApp } from '../../context/AppContext';

const PRESET_COLORS = [
  '#1769FF', // Primary Blue
  '#8B5CF6', // Violet
  '#06B6D4', // Cyan
  '#10B981', // Emerald
  '#F59E0B', // Amber
  '#EC4899', // Pink
  '#F43F5E', // Rose
  '#64748B', // Slate
  '#6366F1', // Indigo
  '#14B8A6', // Teal
];

export function CategoryModal() {
  const { activeModal, closeModal, addCategory, updateCategory } = useApp();

  const isEditing = activeModal?.type === 'category' && activeModal?.data?.id;
  const initialData = activeModal?.data || {};

  const [name, setName] = useState('');
  const [color, setColor] = useState('#1769FF');
  const [description, setDescription] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (activeModal?.type === 'category') {
      setName(initialData.name || '');
      setColor(initialData.color || '#1769FF');
      setDescription(initialData.description || '');
      setError('');
    }
  }, [activeModal]);

  if (activeModal?.type !== 'category') return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Please provide a category name.');
      return;
    }

    const payload = {
      name: name.trim(),
      color,
      icon: 'Tag',
      description: description.trim(),
    };

    if (isEditing) {
      updateCategory(initialData.id, payload);
    } else {
      addCategory(payload);
    }

    closeModal();
  };

  return (
    <div className="modal-backdrop" onClick={closeModal}>
      <div className="modal-card" style={{ maxWidth: '480px' }} onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3 className="modal-title">{isEditing ? 'Edit Category' : 'New Category'}</h3>
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
              <label className="form-label">Category Name *</label>
              <input
                type="text"
                className="form-input"
                placeholder="e.g., Fitness, Engineering, Research"
                value={name}
                onChange={(e) => setName(e.target.value)}
                autoFocus
              />
            </div>

            <div className="form-group">
              <label className="form-label">Color Theme</label>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '6px' }}>
                {PRESET_COLORS.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setColor(c)}
                    style={{
                      width: '32px',
                      height: '32px',
                      borderRadius: '50%',
                      backgroundColor: c,
                      border: color === c ? '3px solid #ffffff' : '2px solid transparent',
                      boxShadow: color === c ? '0 0 0 2px var(--primary-color)' : 'none',
                      cursor: 'pointer',
                      transition: 'transform 0.15s ease',
                      transform: color === c ? 'scale(1.15)' : 'scale(1)',
                    }}
                  />
                ))}
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Description</label>
              <textarea
                className="form-textarea"
                rows={2}
                placeholder="Brief summary of tasks in this category..."
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
              {isEditing ? 'Save Changes' : 'Create Category'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
