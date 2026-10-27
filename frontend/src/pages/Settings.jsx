import React, { useState, useMemo } from 'react';
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
  BookOpen,
  Sparkles,
  Headphones,
  Calendar,
  Clock,
  Laptop,
  Volume2,
  Download,
  Upload,
  Shield,
  Layers,
  Zap,
  Activity,
  HardDrive,
  RefreshCw,
  Eye,
  Layout,
  Cpu,
  Info,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { COLOR_COMBINATIONS } from '../utils/themeUtils';

const ACCENT_COLORS = [
  { name: 'Electric Sapphire', hex: '#1769FF' },
  { name: 'Cyber Indigo', hex: '#6366F1' },
  { name: 'Emerald Matrix', hex: '#10B981' },
  { name: 'Royal Amethyst', hex: '#8B5CF6' },
  { name: 'Sunset Coral', hex: '#F97316' },
  { name: 'Crimson Ruby', hex: '#F43F5E' },
  { name: 'Nordic Cyan', hex: '#06B6D4' },
  { name: 'Golden Amber', hex: '#F59E0B' },
  { name: 'Stealth Slate', hex: '#475569' },
];

export function Settings() {
  const {
    settings,
    setSettings,
    resetDemoData,
    clearAllData,
    showToast,
    tasks,
    goals,
    categories,
    dailyReports,
    bulkImportTasks,
  } = useApp();

  // Active category tab for navigation
  const [activeTab, setActiveTab] = useState('appearance');

  const handleUpdate = (key, value) => {
    const updated = {
      ...settings,
      [key]: value,
    };
    if (key === 'accentColor') {
      const matched = COLOR_COMBINATIONS.find(
        (c) => c.primary.toLowerCase() === (value || '').toLowerCase()
      );
      if (matched) {
        updated.colorCombinationId = matched.id;
      }
    }
    setSettings(updated);
    showToast({
      type: 'success',
      title: 'Preferences Updated',
      message: 'System setting has been saved successfully.',
    });
  };

  // Full System Backup Export
  const handleExportSystemBackup = () => {
    const backupPayload = {
      version: '2.4.0',
      exportedAt: new Date().toISOString(),
      workspace: settings.workspaceName || 'My Schedule Workspace',
      settings,
      tasks,
      goals,
      categories,
      dailyReports,
    };

    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(backupPayload, null, 2));
    const dlAnchor = document.createElement('a');
    dlAnchor.setAttribute('href', dataStr);
    dlAnchor.setAttribute('download', `my_schedule_backup_${new Date().toISOString().split('T')[0]}.json`);
    document.body.appendChild(dlAnchor);
    dlAnchor.click();
    dlAnchor.remove();

    showToast({
      type: 'success',
      title: 'Backup Exported! 💾',
      message: 'Complete workspace JSON archive downloaded to your device.',
    });
  };

  // Calculate local storage size
  const storageMetrics = useMemo(() => {
    let totalBytes = 0;
    for (let x in localStorage) {
      if (localStorage.hasOwnProperty(x)) {
        totalBytes += (localStorage[x].length + x.length) * 2;
      }
    }
    const kbUsed = (totalBytes / 1024).toFixed(1);
    const percent = Math.min(100, Math.round((totalBytes / (5 * 1024 * 1024)) * 100)); // 5MB standard quota
    return { kbUsed, percent };
  }, [tasks, goals, categories, dailyReports]);

  // Tab definitions
  const TABS = [
    { id: 'appearance', label: 'Appearance & Themes', icon: Palette, desc: 'Color palettes, OLED, and styles' },
    { id: 'scheduling', label: 'Scheduling & Calendar', icon: Sliders, desc: 'Work hours, calendar views, format' },
    { id: 'focus', label: 'Focus Mode & Audio', icon: Headphones, desc: 'Pomodoro timer and soundscapes' },
    { id: 'notifications', label: 'Notifications & Alerts', icon: Bell, desc: 'Reminders, standup notifications' },
    { id: 'workspace', label: 'Workspace & General', icon: Laptop, desc: 'System defaults, density, auto-save' },
    { id: 'data', label: 'Backup & System Health', icon: Database, desc: 'JSON backup, storage diagnostics' },
  ];

  // Helper toggle switch component
  const ToggleSwitch = ({ checked, onChange, id }) => (
    <button
      type="button"
      id={id}
      onClick={() => onChange(!checked)}
      style={{
        width: '46px',
        height: '24px',
        borderRadius: '999px',
        background: checked ? 'var(--primary-color)' : 'var(--border-color)',
        position: 'relative',
        border: 'none',
        cursor: 'pointer',
        transition: 'background 0.2s ease',
        flexShrink: 0,
      }}
    >
      <div
        style={{
          width: '18px',
          height: '18px',
          borderRadius: '50%',
          background: '#FFFFFF',
          position: 'absolute',
          top: '3px',
          left: checked ? '24px' : '4px',
          transition: 'left 0.2s ease',
          boxShadow: '0 1px 3px rgba(0,0,0,0.3)',
        }}
      />
    </button>
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '22px', width: '100%' }}>
      {/* ========================================================================= */}
      {/* 1. TOP HEADER BANNER                                                      */}
      {/* ========================================================================= */}
      <div
        className="card"
        style={{
          padding: '24px 28px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '16px',
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <h1 style={{ fontSize: '1.65rem', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
              System Preferences & Control Center
            </h1>
            <span
              className="badge badge-primary"
              style={{ fontSize: '0.74rem', padding: '3px 9px', borderRadius: '999px' }}
            >
              v2.4.0 Live
            </span>
          </div>
          <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', marginTop: '4px', margin: 0 }}>
            Fine-tune appearance, scheduling engines, focus soundscapes, notifications, and client-side data.
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={handleExportSystemBackup}
            style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 600 }}
          >
            <Download size={15} /> Export Backup
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 2. MAIN 2-COLUMN SETTINGS WORKSPACE (NO BLANK VOID)                       */}
      {/* ========================================================================= */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'minmax(250px, 300px) minmax(0, 1fr)',
          gap: '20px',
          alignItems: 'start',
        }}
      >
        {/* Left Column: Vertical Category Navigation */}
        <div
          className="card"
          style={{
            padding: '12px',
            display: 'flex',
            flexDirection: 'column',
            gap: '4px',
            position: 'sticky',
            top: '84px',
          }}
        >
          {TABS.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '12px 14px',
                  borderRadius: 'var(--radius-md)',
                  background: isActive ? 'rgba(var(--primary-rgb, 16, 185, 129), 0.12)' : 'transparent',
                  border: `1.5px solid ${isActive ? 'var(--primary-color)' : 'transparent'}`,
                  color: isActive ? 'var(--primary-color)' : 'var(--text-primary)',
                  textAlign: 'left',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                  width: '100%',
                }}
              >
                <div
                  style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '8px',
                    background: isActive ? 'var(--primary-color)' : 'var(--page-bg)',
                    color: isActive ? '#FFFFFF' : 'var(--text-secondary)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                    transition: 'all 0.15s ease',
                  }}
                >
                  <Icon size={16} />
                </div>
                <div>
                  <div style={{ fontSize: '0.88rem', fontWeight: isActive ? 800 : 600 }}>
                    {tab.label}
                  </div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '1px' }}>
                    {tab.desc}
                  </div>
                </div>
              </button>
            );
          })}

          {/* Quick System Telemetry Widget */}
          <div
            style={{
              marginTop: '16px',
              padding: '12px',
              borderRadius: 'var(--radius-md)',
              background: 'var(--page-bg)',
              border: '1px solid var(--border-color)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.74rem', color: 'var(--text-secondary)', fontWeight: 700 }}>
              <Activity size={13} color="var(--primary-color)" /> System Storage Usage
            </div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '6px' }}>
              <span style={{ fontSize: '0.78rem', fontWeight: 800 }}>{storageMetrics.kbUsed} KB Used</span>
              <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{storageMetrics.percent}% capacity</span>
            </div>
            <div
              style={{
                width: '100%',
                height: '6px',
                borderRadius: '999px',
                background: 'var(--border-color)',
                marginTop: '6px',
                overflow: 'hidden',
              }}
            >
              <div
                style={{
                  width: `${Math.max(5, storageMetrics.percent)}%`,
                  height: '100%',
                  background: 'var(--primary-color)',
                  borderRadius: '999px',
                }}
              />
            </div>
          </div>
        </div>

        {/* Right Column: Tab Panels filling the entire screen */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', minWidth: 0 }}>
          {/* ========================================================================= */}
          {/* TAB 1: APPEARANCE & THEMES                                                */}
          {/* ========================================================================= */}
          {activeTab === 'appearance' && (
            <>
              {/* Theme Modes */}
              <div className="card" style={{ padding: '24px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
                  <Palette size={20} color="var(--primary-color)" />
                  <div>
                    <h2 style={{ fontSize: '1.15rem', fontWeight: 800, margin: 0 }}>Theme Presentation Mode</h2>
                    <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                      Choose between light, slate navy, true OLED black, or warm paper aesthetics.
                    </span>
                  </div>
                </div>

                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))',
                    gap: '14px',
                  }}
                >
                  {[
                    {
                      id: 'light',
                      name: 'Airy Light',
                      desc: 'Clean & high-contrast daylight',
                      icon: Sun,
                      previewBg: '#F3F8FF',
                      border: '#DFEAFE',
                    },
                    {
                      id: 'dark',
                      name: 'Deep Navy (Dark)',
                      desc: 'Subtle slate midnight contrast',
                      icon: Moon,
                      previewBg: '#0A1124',
                      border: '#1A2D56',
                    },
                    {
                      id: 'oled',
                      name: 'Very Dark (OLED)',
                      desc: 'Pitch black & deep obsidian',
                      icon: Sparkles,
                      previewBg: '#05070B',
                      border: '#1A2332',
                    },
                    {
                      id: 'warm',
                      name: 'Warm Paper',
                      desc: 'Soft cream sepia aesthetic',
                      icon: BookOpen,
                      previewBg: '#FAF7F2',
                      border: '#E7E5E4',
                    },
                  ].map((m) => {
                    const isSelected = (settings.theme || 'light') === m.id;
                    const IconComp = m.icon;
                    return (
                      <button
                        key={m.id}
                        type="button"
                        onClick={() => handleUpdate('theme', m.id)}
                        style={{
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'flex-start',
                          padding: '16px',
                          borderRadius: 'var(--radius-lg)',
                          border: `2px solid ${isSelected ? 'var(--primary-color)' : 'var(--border-color)'}`,
                          backgroundColor: isSelected ? 'rgba(var(--primary-rgb, 16, 185, 129), 0.08)' : 'var(--page-bg)',
                          cursor: 'pointer',
                          textAlign: 'left',
                          transition: 'all 0.15s ease',
                          position: 'relative',
                        }}
                      >
                        <div
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            width: '100%',
                            marginBottom: '10px',
                          }}
                        >
                          <div
                            style={{
                              width: '34px',
                              height: '34px',
                              borderRadius: '8px',
                              backgroundColor: m.previewBg,
                              border: `1px solid ${m.border}`,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                            }}
                          >
                            <IconComp
                              size={17}
                              color={isSelected ? 'var(--primary-color)' : 'var(--text-secondary)'}
                            />
                          </div>
                          {isSelected && (
                            <span
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '3px',
                                fontSize: '0.74rem',
                                color: 'var(--primary-color)',
                                fontWeight: 800,
                              }}
                            >
                              <Check size={14} /> Active
                            </span>
                          )}
                        </div>
                        <span style={{ fontSize: '0.95rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                          {m.name}
                        </span>
                        <span style={{ fontSize: '0.76rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
                          {m.desc}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Accent Color Palette */}
              <div className="card" style={{ padding: '24px' }}>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginBottom: '14px',
                  }}
                >
                  <div>
                    <h3 style={{ fontSize: '1.05rem', fontWeight: 800, margin: 0 }}>Brand Accent Color</h3>
                    <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                      Affects buttons, checkmarks, progress bars, and high-priority tags across the application.
                    </span>
                  </div>
                  <span style={{ fontSize: '0.84rem', color: 'var(--text-secondary)' }}>
                    Current: <strong style={{ color: 'var(--primary-color)' }}>{settings.accentColor || '#1769FF'}</strong>
                  </span>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: '10px' }}>
                  {ACCENT_COLORS.map((accent) => {
                    const isSelected = (settings.accentColor || '').toLowerCase() === accent.hex.toLowerCase();
                    return (
                      <button
                        key={accent.hex}
                        type="button"
                        onClick={() => handleUpdate('accentColor', accent.hex)}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '10px',
                          padding: '10px 14px',
                          borderRadius: 'var(--radius-md)',
                          border: `1.5px solid ${isSelected ? accent.hex : 'var(--border-color)'}`,
                          backgroundColor: isSelected ? 'rgba(var(--primary-rgb, 16, 185, 129), 0.1)' : 'var(--page-bg)',
                          cursor: 'pointer',
                          transition: 'all 0.15s ease',
                        }}
                      >
                        <span
                          style={{
                            width: '18px',
                            height: '18px',
                            borderRadius: '50%',
                            backgroundColor: accent.hex,
                            boxShadow: isSelected ? `0 0 10px ${accent.hex}` : 'none',
                            flexShrink: 0,
                          }}
                        />
                        <span style={{ fontSize: '0.84rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                          {accent.name}
                        </span>
                        {isSelected && <Check size={14} color={accent.hex} style={{ marginLeft: 'auto' }} />}
                      </button>
                    );
                  })}

                  {/* Custom Hex Color Picker */}
                  <label
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px',
                      padding: '10px 14px',
                      borderRadius: 'var(--radius-md)',
                      border: '1.5px dashed var(--border-color)',
                      backgroundColor: 'var(--page-bg)',
                      cursor: 'pointer',
                      fontSize: '0.84rem',
                      fontWeight: 700,
                      color: 'var(--text-secondary)',
                    }}
                  >
                    <input
                      type="color"
                      value={settings.accentColor || '#1769FF'}
                      onChange={(e) => handleUpdate('accentColor', e.target.value)}
                      style={{
                        width: '22px',
                        height: '22px',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        background: 'none',
                        padding: 0,
                      }}
                    />
                    <span>Custom Hex Color</span>
                  </label>
                </div>
              </div>
            </>
          )}

          {/* ========================================================================= */}
          {/* TAB 2: SCHEDULING & CALENDAR ENGINE                                       */}
          {/* ========================================================================= */}
          {activeTab === 'scheduling' && (
            <div className="card" style={{ padding: '24px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
                <Sliders size={20} color="var(--primary-color)" />
                <div>
                  <h2 style={{ fontSize: '1.15rem', fontWeight: 800, margin: 0 }}>Calendar & Schedule Engine</h2>
                  <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                    Configure start of week, working hours bounds, time format, and smart auto-balancing.
                  </span>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '20px' }}>
                <div className="form-group">
                  <label className="form-label" style={{ fontWeight: 700, fontSize: '0.84rem' }}>
                    First Day of the Week
                  </label>
                  <select
                    className="select"
                    value={settings.weekStartsOnSunday ? 'sunday' : 'monday'}
                    onChange={(e) => handleUpdate('weekStartsOnSunday', e.target.value === 'sunday')}
                  >
                    <option value="sunday">Sunday (Western standard)</option>
                    <option value="monday">Monday (ISO 8601 standard)</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label" style={{ fontWeight: 700, fontSize: '0.84rem' }}>
                    Default Calendar View
                  </label>
                  <select
                    className="select"
                    value={settings.defaultCalendarView || 'month'}
                    onChange={(e) => handleUpdate('defaultCalendarView', e.target.value)}
                  >
                    <option value="month">Month Grid View</option>
                    <option value="week">Weekly View</option>
                    <option value="day">Day Google Calendar View</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label" style={{ fontWeight: 700, fontSize: '0.84rem' }}>
                    Time Clock Format
                  </label>
                  <select
                    className="select"
                    value={settings.timeFormat || '12h'}
                    onChange={(e) => handleUpdate('timeFormat', e.target.value)}
                  >
                    <option value="12h">12-Hour Format (02:30 PM)</option>
                    <option value="24h">24-Hour Military Format (14:30)</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label" style={{ fontWeight: 700, fontSize: '0.84rem' }}>
                    Default Task Duration
                  </label>
                  <select
                    className="select"
                    value={settings.defaultDuration || '45'}
                    onChange={(e) => handleUpdate('defaultDuration', e.target.value)}
                  >
                    <option value="15">15 Minutes (Micro sprint)</option>
                    <option value="30">30 Minutes (Standard slot)</option>
                    <option value="45">45 Minutes (Recommended)</option>
                    <option value="60">60 Minutes (Full hour block)</option>
                    <option value="90">90 Minutes (Deep focus block)</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label" style={{ fontWeight: 700, fontSize: '0.84rem' }}>
                    Working Hours: Start Time
                  </label>
                  <input
                    type="time"
                    className="input"
                    value={settings.workHourStart || '09:00'}
                    onChange={(e) => handleUpdate('workHourStart', e.target.value)}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label" style={{ fontWeight: 700, fontSize: '0.84rem' }}>
                    Working Hours: End Time
                  </label>
                  <input
                    type="time"
                    className="input"
                    value={settings.workHourEnd || '18:30'}
                    onChange={(e) => handleUpdate('workHourEnd', e.target.value)}
                  />
                </div>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* TAB 3: FOCUS MODE & AUDIO SETTINGS                                        */}
          {/* ========================================================================= */}
          {activeTab === 'focus' && (
            <div className="card" style={{ padding: '24px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
                <Headphones size={20} color="var(--primary-color)" />
                <div>
                  <h2 style={{ fontSize: '1.15rem', fontWeight: 800, margin: 0 }}>Focus Mode & Synthesizer Settings</h2>
                  <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                    Customize Pomodoro intervals, default background ambient soundscapes, and auto-transition triggers.
                  </span>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '20px' }}>
                <div className="form-group">
                  <label className="form-label" style={{ fontWeight: 700, fontSize: '0.84rem' }}>
                    Default Focus Timer Duration
                  </label>
                  <select
                    className="select"
                    value={settings.defaultFocusMins || '25'}
                    onChange={(e) => handleUpdate('defaultFocusMins', e.target.value)}
                  >
                    <option value="15">15 Minutes (Short Sprint)</option>
                    <option value="25">25 Minutes (Standard Pomodoro)</option>
                    <option value="45">45 Minutes (Ultradian Rhythm)</option>
                    <option value="50">50 Minutes (Deep Work Session)</option>
                    <option value="60">60 Minutes (1-Hour Marathon)</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label" style={{ fontWeight: 700, fontSize: '0.84rem' }}>
                    Default Break Duration
                  </label>
                  <select
                    className="select"
                    value={settings.defaultBreakMins || '5'}
                    onChange={(e) => handleUpdate('defaultBreakMins', e.target.value)}
                  >
                    <option value="5">5 Minutes (Short Break)</option>
                    <option value="10">10 Minutes (Standard Break)</option>
                    <option value="15">15 Minutes (Extended Re-energize)</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label" style={{ fontWeight: 700, fontSize: '0.84rem' }}>
                    Default Ambient Soundscape
                  </label>
                  <select
                    className="select"
                    value={settings.defaultAmbientSound || 'none'}
                    onChange={(e) => handleUpdate('defaultAmbientSound', e.target.value)}
                  >
                    <option value="none">No Sound (Silence)</option>
                    <option value="rain">🌧️ Rainfall & Thunder</option>
                    <option value="lofi">🎧 Warm Lofi Chords</option>
                    <option value="cafe">☕ Quiet Cafe Murmur</option>
                    <option value="whitenoise">🌊 Deep White Noise</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label" style={{ fontWeight: 700, fontSize: '0.84rem' }}>
                    Default Ambient Audio Volume
                  </label>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <Volume2 size={16} color="var(--primary-color)" />
                    <input
                      type="range"
                      min="0.1"
                      max="1.0"
                      step="0.05"
                      value={settings.defaultAmbientVolume || 0.5}
                      onChange={(e) => handleUpdate('defaultAmbientVolume', parseFloat(e.target.value))}
                      style={{ width: '100%', accentColor: 'var(--primary-color)' }}
                    />
                    <span style={{ fontSize: '0.82rem', fontWeight: 800, minWidth: '40px' }}>
                      {Math.round((settings.defaultAmbientVolume || 0.5) * 100)}%
                    </span>
                  </div>
                </div>
              </div>

              {/* Toggles */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginTop: '20px', paddingTop: '16px', borderTop: '1px solid var(--border-color)' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px' }}>
                  <div>
                    <div style={{ fontSize: '0.92rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                      Auto-Transition to Next Schedule Task
                    </div>
                    <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                      When you click "Done & Next Task" in Focus Mode, automatically pick the next pending task.
                    </div>
                  </div>
                  <ToggleSwitch
                    checked={settings.autoAdvanceFocus !== false}
                    onChange={(val) => handleUpdate('autoAdvanceFocus', val)}
                    id="toggle-auto-advance"
                  />
                </div>

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px' }}>
                  <div>
                    <div style={{ fontSize: '0.92rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                      Breathing Guide Calming Visual Pulse
                    </div>
                    <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                      Display gentle 4s inhale / 4s exhale breathing circle behind timer to maintain mindfulness.
                    </div>
                  </div>
                  <ToggleSwitch
                    checked={settings.enableBreathingGuide !== false}
                    onChange={(val) => handleUpdate('enableBreathingGuide', val)}
                    id="toggle-breathing"
                  />
                </div>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* TAB 4: NOTIFICATIONS & REMINDERS                                          */}
          {/* ========================================================================= */}
          {activeTab === 'notifications' && (
            <div className="card" style={{ padding: '24px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
                <Bell size={20} color="var(--primary-color)" />
                <div>
                  <h2 style={{ fontSize: '1.15rem', fontWeight: 800, margin: 0 }}>Notification Rules & Alerts</h2>
                  <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                    Control badges, standup reminders, celebration sound effects, and overdue warnings.
                  </span>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px' }}>
                  <div>
                    <div style={{ fontSize: '0.92rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                      In-App Badge Counters
                    </div>
                    <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                      Show real-time red badge indicators in the top header and sidebar for pending tasks.
                    </div>
                  </div>
                  <ToggleSwitch
                    checked={settings.enableInAppNotifications !== false}
                    onChange={(val) => handleUpdate('enableInAppNotifications', val)}
                    id="toggle-in-app-notif"
                  />
                </div>

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px' }}>
                  <div>
                    <div style={{ fontSize: '0.92rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                      Daily Work Standup Evening Reminder
                    </div>
                    <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                      Notify to submit your daily accomplishment log and standup report before logging off.
                    </div>
                  </div>
                  <ToggleSwitch
                    checked={settings.enableStandupReminder !== false}
                    onChange={(val) => handleUpdate('enableStandupReminder', val)}
                    id="toggle-standup-remind"
                  />
                </div>

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px' }}>
                  <div>
                    <div style={{ fontSize: '0.92rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                      Task Completion Celebration Feedback
                    </div>
                    <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                      Trigger a celebration toast and sensory feedback when finishing tasks or milestones.
                    </div>
                  </div>
                  <ToggleSwitch
                    checked={settings.enableCelebrationEffects !== false}
                    onChange={(val) => handleUpdate('enableCelebrationEffects', val)}
                    id="toggle-celebration"
                  />
                </div>

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px' }}>
                  <div>
                    <div style={{ fontSize: '0.92rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                      Overdue Schedule Alert Banners
                    </div>
                    <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                      Display intelligent auto-balance suggestion banners when overdue tasks pile up from previous days.
                    </div>
                  </div>
                  <ToggleSwitch
                    checked={settings.enableOverdueAlerts !== false}
                    onChange={(val) => handleUpdate('enableOverdueAlerts', val)}
                    id="toggle-overdue-alert"
                  />
                </div>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* TAB 5: WORKSPACE & GENERAL SYSTEM                                         */}
          {/* ========================================================================= */}
          {activeTab === 'workspace' && (
            <div className="card" style={{ padding: '24px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
                <Laptop size={20} color="var(--primary-color)" />
                <div>
                  <h2 style={{ fontSize: '1.15rem', fontWeight: 800, margin: 0 }}>Workspace Environment</h2>
                  <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                    Default landing page, workspace organization title, layout comfort, and sync.
                  </span>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '20px' }}>
                <div className="form-group">
                  <label className="form-label" style={{ fontWeight: 700, fontSize: '0.84rem' }}>
                    Workspace Organization Name
                  </label>
                  <input
                    type="text"
                    className="input"
                    value={settings.workspaceName || 'My Schedule Workspace'}
                    onChange={(e) => handleUpdate('workspaceName', e.target.value)}
                    placeholder="Enter workspace name"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label" style={{ fontWeight: 700, fontSize: '0.84rem' }}>
                    Default Landing Page upon Startup
                  </label>
                  <select
                    className="select"
                    value={settings.defaultLandingPage || '/'}
                    onChange={(e) => handleUpdate('defaultLandingPage', e.target.value)}
                  >
                    <option value="/">Dashboard Overview</option>
                    <option value="/today">Today's Schedule & Tasks</option>
                    <option value="/calendar">Monthly Calendar</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label" style={{ fontWeight: 700, fontSize: '0.84rem' }}>
                    Interface Grid Density
                  </label>
                  <select
                    className="select"
                    value={settings.layoutComfort || 'comfortable'}
                    onChange={(e) => handleUpdate('layoutComfort', e.target.value)}
                  >
                    <option value="comfortable">Comfortable Spacing (Balanced)</option>
                    <option value="compact">Compact Density (High information density)</option>
                    <option value="spacious">Spacious (Relaxed padding)</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label" style={{ fontWeight: 700, fontSize: '0.84rem' }}>
                    UI Animation Dynamics
                  </label>
                  <select
                    className="select"
                    value={settings.animationMode || 'smooth'}
                    onChange={(e) => handleUpdate('animationMode', e.target.value)}
                  >
                    <option value="smooth">Full Fluid Micro-Animations</option>
                    <option value="reduced">Reduced Motion (Fast snappy cuts)</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* TAB 6: BACKUP & SYSTEM HEALTH DIAGNOSTICS                                 */}
          {/* ========================================================================= */}
          {activeTab === 'data' && (
            <>
              {/* Backup & Restore Card */}
              <div className="card" style={{ padding: '24px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
                  <HardDrive size={20} color="var(--primary-color)" />
                  <div>
                    <h2 style={{ fontSize: '1.15rem', fontWeight: 800, margin: 0 }}>System Backup & Data Migration</h2>
                    <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                      Download or restore your complete schedule, goals, habits, and daily standup history.
                    </span>
                  </div>
                </div>

                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
                    gap: '16px',
                  }}
                >
                  <div
                    style={{
                      padding: '18px',
                      borderRadius: 'var(--radius-lg)',
                      background: 'var(--page-bg)',
                      border: '1px solid var(--border-color)',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between',
                      gap: '12px',
                    }}
                  >
                    <div>
                      <div style={{ fontSize: '0.94rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                        Export Complete JSON Archive
                      </div>
                      <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
                        Includes {tasks.length} tasks, {goals.length} goals, {categories.length} categories, and {dailyReports.length} submitted daily reports.
                      </div>
                    </div>
                    <button
                      type="button"
                      className="btn btn-primary"
                      onClick={handleExportSystemBackup}
                      style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
                    >
                      <Download size={16} /> Download Backup JSON
                    </button>
                  </div>

                  <div
                    style={{
                      padding: '18px',
                      borderRadius: 'var(--radius-lg)',
                      background: 'var(--page-bg)',
                      border: '1px solid var(--border-color)',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between',
                      gap: '12px',
                    }}
                  >
                    <div>
                      <div style={{ fontSize: '0.94rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                        Restore from JSON File
                      </div>
                      <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
                        Upload a previously generated backup JSON file to restore your entire workspace.
                      </div>
                    </div>
                    <label
                      className="btn btn-secondary"
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '8px',
                        cursor: 'pointer',
                        margin: 0,
                      }}
                    >
                      <Upload size={16} /> Select Backup File
                      <input
                        type="file"
                        accept=".json"
                        style={{ display: 'none' }}
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (!file) return;
                          const reader = new FileReader();
                          reader.onload = (event) => {
                            try {
                              const parsed = JSON.parse(event.target.result);
                              if (parsed.tasks && Array.isArray(parsed.tasks)) {
                                bulkImportTasks(parsed.tasks);
                              }
                              if (parsed.settings) {
                                setSettings({ ...settings, ...parsed.settings });
                              }
                              showToast({
                                type: 'success',
                                title: 'Backup Restored! ✨',
                                message: `Successfully restored workspace items from ${file.name}.`,
                              });
                            } catch (err) {
                              showToast({
                                type: 'danger',
                                title: 'Invalid Backup File',
                                message: 'Could not parse the selected JSON file.',
                              });
                            }
                          };
                          reader.readAsText(file);
                        }}
                      />
                    </label>
                  </div>
                </div>
              </div>

              {/* Data Storage & Reset Card */}
              <div className="card" style={{ padding: '24px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px' }}>
                  <Database size={20} color="var(--danger)" />
                  <div>
                    <h2 style={{ fontSize: '1.15rem', fontWeight: 800, margin: 0 }}>Data Storage & Reset Controls</h2>
                    <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                      Manage sample demo data or perform a clean system wipe.
                    </span>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={resetDemoData}
                    id="btn-reset-demo-data"
                    style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
                  >
                    <RotateCcw size={15} /> Reset to Sample Demo Data
                  </button>

                  <button
                    type="button"
                    className="btn btn-danger"
                    onClick={clearAllData}
                    id="btn-clear-all-data"
                    style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
                  >
                    <Trash2 size={15} /> Clear All Stored Data
                  </button>
                </div>
              </div>

              {/* System Diagnostics */}
              <div className="card" style={{ padding: '24px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
                  <Cpu size={20} color="var(--primary-color)" />
                  <div>
                    <h2 style={{ fontSize: '1.15rem', fontWeight: 800, margin: 0 }}>System Telemetry & Health</h2>
                    <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                      Local client diagnostic state and runtime status.
                    </span>
                  </div>
                </div>

                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                    gap: '12px',
                    fontSize: '0.84rem',
                  }}
                >
                  <div style={{ padding: '12px', borderRadius: 'var(--radius-md)', background: 'var(--page-bg)', border: '1px solid var(--border-color)' }}>
                    <div style={{ color: 'var(--text-muted)', fontSize: '0.72rem' }}>APP VERSION</div>
                    <div style={{ fontWeight: 800, marginTop: '2px' }}>v2.4.0 Production Build</div>
                  </div>
                  <div style={{ padding: '12px', borderRadius: 'var(--radius-md)', background: 'var(--page-bg)', border: '1px solid var(--border-color)' }}>
                    <div style={{ color: 'var(--text-muted)', fontSize: '0.72rem' }}>RUNTIME CLIENT</div>
                    <div style={{ fontWeight: 800, marginTop: '2px' }}>Vite 8 · React 18 · Redux Toolkit</div>
                  </div>
                  <div style={{ padding: '12px', borderRadius: 'var(--radius-md)', background: 'var(--page-bg)', border: '1px solid var(--border-color)' }}>
                    <div style={{ color: 'var(--text-muted)', fontSize: '0.72rem' }}>DATABASE ENGINE</div>
                    <div style={{ fontWeight: 800, marginTop: '2px' }}>Indexed LocalStorage + REST Sync</div>
                  </div>
                  <div style={{ padding: '12px', borderRadius: 'var(--radius-md)', background: 'var(--page-bg)', border: '1px solid var(--border-color)' }}>
                    <div style={{ color: 'var(--text-muted)', fontSize: '0.72rem' }}>CLIENT NETWORK</div>
                    <div style={{ fontWeight: 800, color: '#10B981', marginTop: '2px' }}>● Online & Synchronized</div>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default Settings;
