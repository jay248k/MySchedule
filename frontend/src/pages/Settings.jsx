import React from 'react';
import {
  Palette,
  Sliders,
  Bell,
  Database,
  Moon,
  Sun,
  RotateCcw,
  Trash2,
  Check,
} from 'lucide-react';
import { useApp } from '../context/AppContext';

const ACCENT_COLORS = [
  { name: 'Classic Blue', hex: '#1769FF' },
  { name: 'Indigo', hex: '#6366F1' },
  { name: 'Emerald', hex: '#10B981' },
  { name: 'Violet', hex: '#8B5CF6' },
  { name: 'Cyan', hex: '#06B6D4' },
];

export function Settings() {
  const { settings, setSettings, resetDemoData, clearAllData, showToast } = useApp();

  const handleUpdate = (key, value) => {
    setSettings((prev) => ({
      ...prev,
      [key]: value,
    }));
    showToast({
      type: 'success',
      title: 'Preferences Saved',
      message: 'Your setting changes have been saved to local storage.',
    });
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', maxWidth: '960px' }}>
      {/* Header */}
      <div
        className="card"
        style={{
          padding: '24px 28px',
        }}
      >
        <h1 style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--text-primary)' }}>
          Application Settings
        </h1>
        <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
          Customize your display, calendar preferences, notifications, and local demo data storage.
        </p>
      </div>

      {/* 1. Appearance Section */}
      <div className="card" style={{ padding: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
          <Palette size={20} color="var(--primary-color)" />
          <h2 style={{ fontSize: '1.15rem', fontWeight: 700 }}>Appearance & Themes</h2>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Theme Mode */}
          <div>
            <label className="form-label" style={{ marginBottom: '8px', display: 'block' }}>
              Theme Mode
            </label>
            <div style={{ display: 'flex', gap: '12px' }}>
              <button
                type="button"
                className={`btn ${settings.theme === 'light' ? 'btn-primary' : 'btn-secondary'}`}
                onClick={() => handleUpdate('theme', 'light')}
              >
                <Sun size={16} />
                Light Mode
              </button>
              <button
                type="button"
                className={`btn ${settings.theme === 'dark' ? 'btn-primary' : 'btn-secondary'}`}
                onClick={() => handleUpdate('theme', 'dark')}
              >
                <Moon size={16} />
                Dark Navy Mode
              </button>
            </div>
          </div>

          {/* Accent Color Selection */}
          <div>
            <label className="form-label" style={{ marginBottom: '8px', display: 'block' }}>
              Brand Accent Color
            </label>
            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
              {ACCENT_COLORS.map((accent) => {
                const isSelected = settings.accentColor === accent.hex;
                return (
                  <button
                    key={accent.hex}
                    type="button"
                    onClick={() => handleUpdate('accentColor', accent.hex)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      padding: '8px 14px',
                      borderRadius: 'var(--radius-md)',
                      border: `1.5px solid ${isSelected ? accent.hex : 'var(--border-color)'}`,
                      backgroundColor: isSelected ? 'var(--primary-light)' : 'var(--card-bg)',
                      cursor: 'pointer',
                    }}
                  >
                    <span
                      style={{
                        width: '12px',
                        height: '12px',
                        borderRadius: '50%',
                        backgroundColor: accent.hex,
                      }}
                    />
                    <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>{accent.name}</span>
                    {isSelected && <Check size={14} color={accent.hex} />}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* 2. Calendar & Scheduling Preferences */}
      <div className="card" style={{ padding: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
          <Sliders size={20} color="var(--primary-color)" />
          <h2 style={{ fontSize: '1.15rem', fontWeight: 700 }}>Scheduling Preferences</h2>
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
            gap: '18px',
          }}
        >
          {/* Week Start */}
          <div className="form-group">
            <label className="form-label">First Day of the Week</label>
            <select
              className="form-select"
              value={settings.weekStartsOnSunday ? 'sunday' : 'monday'}
              onChange={(e) => handleUpdate('weekStartsOnSunday', e.target.value === 'sunday')}
            >
              <option value="sunday">Sunday (Default)</option>
              <option value="monday">Monday</option>
            </select>
          </div>

          {/* Default Calendar View */}
          <div className="form-group">
            <label className="form-label">Default Calendar View</label>
            <select
              className="form-select"
              value={settings.defaultCalendarView || 'month'}
              onChange={(e) => handleUpdate('defaultCalendarView', e.target.value)}
            >
              <option value="month">Month View</option>
              <option value="week">Week View</option>
              <option value="day">Day View</option>
            </select>
          </div>

          {/* Time Format */}
          <div className="form-group">
            <label className="form-label">Time Format</label>
            <select
              className="form-select"
              value={settings.timeFormat || '12h'}
              onChange={(e) => handleUpdate('timeFormat', e.target.value)}
            >
              <option value="12h">12-Hour (e.g., 02:30 PM)</option>
              <option value="24h">24-Hour (e.g., 14:30)</option>
            </select>
          </div>

          {/* Layout Comfort */}
          <div className="form-group">
            <label className="form-label">Display Spacing</label>
            <select
              className="form-select"
              value={settings.layoutComfort || 'comfortable'}
              onChange={(e) => handleUpdate('layoutComfort', e.target.value)}
            >
              <option value="comfortable">Comfortable Spacing</option>
              <option value="compact">Compact Grid</option>
            </select>
          </div>
        </div>
      </div>

      {/* 3. Notifications */}
      <div className="card" style={{ padding: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
          <Bell size={20} color="var(--primary-color)" />
          <h2 style={{ fontSize: '1.15rem', fontWeight: 700 }}>Notification Settings</h2>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={settings.enableInAppNotifications}
              onChange={(e) => handleUpdate('enableInAppNotifications', e.target.checked)}
              style={{ width: '18px', height: '18px', accentColor: 'var(--primary-color)' }}
            />
            <div>
              <div style={{ fontSize: '0.92rem', fontWeight: 600 }}>Enable In-App Notifications</div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                Display badge counters and task overdue alert popups in header.
              </div>
            </div>
          </label>
        </div>
      </div>

      {/* 4. Data Management */}
      <div className="card" style={{ padding: '24px', borderColor: 'var(--border-color)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
          <Database size={20} color="var(--danger)" />
          <h2 style={{ fontSize: '1.15rem', fontWeight: 700 }}>Data Storage & Demo Reset</h2>
        </div>

        <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', marginBottom: '18px', lineHeight: '1.5' }}>
          All tasks, categories, and calendar events are stored entirely on the client side in your browser's LocalStorage.
          You can reset back to the original demo dataset or erase all local entries at any time.
        </p>

        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={resetDemoData}
            id="btn-reset-demo-data"
          >
            <RotateCcw size={16} />
            Reset to Sample Demo Data
          </button>

          <button
            type="button"
            className="btn btn-danger"
            onClick={clearAllData}
            id="btn-clear-all-data"
          >
            <Trash2 size={16} />
            Clear All Stored Data
          </button>
        </div>
      </div>
    </div>
  );
}
