import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Home, AlertCircle } from 'lucide-react';

export function NotFound() {
  const navigate = useNavigate();

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '60px 20px',
        textAlign: 'center',
        gap: '16px',
      }}
    >
      <div
        style={{
          width: '64px',
          height: '64px',
          borderRadius: '50%',
          background: 'var(--primary-light)',
          color: 'var(--primary-color)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <AlertCircle size={32} />
      </div>
      <h1 style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--text-primary)' }}>
        Page Not Found
      </h1>
      <p style={{ color: 'var(--text-secondary)', maxWidth: '420px', fontSize: '0.95rem' }}>
        The page you are looking for doesn't exist or has been moved. Use the navigation menu or return to your Dashboard.
      </p>
      <button
        type="button"
        className="btn btn-primary"
        onClick={() => navigate('/')}
        style={{ marginTop: '8px' }}
      >
        <Home size={16} /> Back to Dashboard
      </button>
    </div>
  );
}
