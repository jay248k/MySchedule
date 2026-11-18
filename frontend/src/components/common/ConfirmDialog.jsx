import React from 'react';
import { AlertTriangle, CheckCircle2, Info, XCircle, X } from 'lucide-react';
import { useApp } from '../../context/AppContext';

export function ConfirmDialog() {
  const { confirmDialog } = useApp();

  if (!confirmDialog) return null;

  const { title, message, confirmText, isDanger, onConfirm, onCancel } = confirmDialog;

  return (
    <div className="modal-backdrop" onClick={onCancel}>
      <div
        className="modal-card"
        style={{ maxWidth: '440px' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '50%',
                background: isDanger ? 'var(--danger-bg)' : 'var(--primary-light)',
                color: isDanger ? 'var(--danger)' : 'var(--primary-color)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <AlertTriangle size={20} />
            </div>
            <h3 className="modal-title" style={{ fontSize: '1.1rem' }}>
              {title}
            </h3>
          </div>
          <button type="button" className="btn-icon" onClick={onCancel}>
            <X size={18} />
          </button>
        </div>

        <div className="modal-body">
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.92rem', lineHeight: '1.5' }}>
            {message}
          </p>
        </div>

        <div className="modal-footer">
          <button type="button" className="btn btn-secondary" onClick={onCancel}>
            Cancel
          </button>
          <button
            type="button"
            className={`btn ${isDanger ? 'btn-danger' : 'btn-primary'}`}
            onClick={onConfirm}
          >
            {confirmText || 'Confirm'}
          </button>
        </div>
      </div>
    </div>
  );
}

export function ToastContainer() {
  const { toasts, removeToast } = useApp();

  if (!toasts.length) return null;

  const icons = {
    success: <CheckCircle2 size={16} color="var(--success)" />,
    danger: <XCircle size={16} color="var(--danger)" />,
    error: <XCircle size={16} color="var(--danger)" />,
    warning: <AlertTriangle size={16} color="var(--warning)" />,
    info: <Info size={16} color="var(--primary-color)" />,
  };

  return (
    <div className="toast-container">
      {toasts.map((toast) => (
        <div key={toast.id} className={`toast-item toast-${toast.type || 'info'}`}>
          <div className="toast-icon-wrap">
            {icons[toast.type] || icons.info}
          </div>
          <div className="toast-content-wrap">
            {toast.title && <span className="toast-title">{toast.title}</span>}
            {toast.title && toast.message && <span className="toast-dot-sep">·</span>}
            {toast.message && <span className="toast-message">{toast.message}</span>}
          </div>
          <button
            type="button"
            className="toast-close-btn"
            onClick={() => removeToast(toast.id)}
            title="Dismiss"
          >
            <X size={12} />
          </button>
        </div>
      ))}
    </div>
  );
}
