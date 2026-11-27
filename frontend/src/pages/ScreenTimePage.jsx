import React, { useState, useEffect, useMemo } from 'react';
import {
  Smartphone,
  Plus,
  Clock,
  Trash2,
  Edit2,
  X,
  Calendar,
  AlertTriangle,
  CheckCircle2,
  Layers,
  Sparkles,
} from 'lucide-react';
import { api } from '../services/api';
import { useApp } from '../context/AppContext';
import { getTodayDateString } from '../utils/dateUtils';
import { CustomSelect } from '../components/common/CustomSelect';
import '../styles/pages/dashboard.css';

const APP_COLOR_PALETTE = ['#EC4899', '#3B82F6', '#10B981', '#F59E0B', '#8B5CF6', '#EF4444', '#06B6D4', '#6366F1'];

function formatDuration(totalMins) {
  const m = Math.max(0, Number(totalMins) || 0);
  const hrs = Math.floor(m / 60);
  const mins = m % 60;
  if (hrs === 0) return `${mins}m`;
  if (mins === 0) return `${hrs}h`;
  return `${hrs}h ${mins}m`;
}

export function ScreenTimePage() {
  const { showToast } = useApp();
  const todayStr = getTodayDateString();

  const [dailyEntries, setDailyEntries] = useState([]);
  const [dynamicApps, setDynamicApps] = useState([]);
  const [loading, setLoading] = useState(true);

  // Inline New App Creator inside modal
  const [showNewAppCreator, setShowNewAppCreator] = useState(false);
  const [newAppNameInput, setNewAppNameInput] = useState('');
  const [newAppColorInput, setNewAppColorInput] = useState('#EC4899');
  const [savingNewApp, setSavingNewApp] = useState(false);

  // Modal 0: Manage User's Apps in DB
  const [isManageAppsModalOpen, setIsManageAppsModalOpen] = useState(false);

  // Modal 1: Add/Edit Total Screen Time
  const [isTotalModalOpen, setIsTotalModalOpen] = useState(false);
  const [totalForm, setTotalForm] = useState({
    date: todayStr,
    hours: '2',
    minutes: '30',
    targetLimitMinutes: '180',
    notes: '',
  });
  const [savingTotal, setSavingTotal] = useState(false);

  // Modal 2: Add App Time Under a Total Screen Time Entry
  const [appModalTarget, setAppModalTarget] = useState(null); // DailyScreenTime object
  const [appForm, setAppForm] = useState({
    appName: '',
    spentMinutes: '30',
    notes: '',
  });
  const [savingApp, setSavingApp] = useState(false);

  const fetchEntries = async () => {
    setLoading(true);
    try {
      const [entriesRes, appsRes] = await Promise.all([
        api.getDailyScreenTimes(),
        api.getScreenTimeApps().catch(() => ({ data: [] })),
      ]);
      if (entriesRes?.success && Array.isArray(entriesRes.data)) {
        setDailyEntries(entriesRes.data);
      }
      if (appsRes?.success && Array.isArray(appsRes.data)) {
        setDynamicApps(appsRes.data);
      }
    } catch (err) {
      showToast({
        type: 'error',
        title: 'Load Failed',
        message: err.message || 'Could not load screen time records.',
      });
    } finally {
      setLoading(false);
    }
  };

  const appColorMap = useMemo(() => {
    const map = {};
    dynamicApps.forEach((a) => {
      if (a.appName) map[a.appName.toLowerCase()] = a.color || '#EC4899';
    });
    return map;
  }, [dynamicApps]);

  useEffect(() => {
    fetchEntries();
  }, []);

  const openNewTotalModal = () => {
    setTotalForm({
      date: todayStr,
      hours: '2',
      minutes: '0',
      targetLimitMinutes: '180',
      notes: '',
    });
    setIsTotalModalOpen(true);
  };

  const openEditTotalModal = (entry) => {
    const hrs = Math.floor((entry.totalMinutes || 0) / 60);
    const mins = (entry.totalMinutes || 0) % 60;
    setTotalForm({
      date: entry.date,
      hours: String(hrs),
      minutes: String(mins),
      targetLimitMinutes: entry.targetLimitMinutes ? String(entry.targetLimitMinutes) : '',
      notes: entry.notes || '',
    });
    setIsTotalModalOpen(true);
  };

  const handleSaveTotal = async (e) => {
    e.preventDefault();
    const totalMinutes = (parseInt(totalForm.hours, 10) || 0) * 60 + (parseInt(totalForm.minutes, 10) || 0);
    if (totalMinutes <= 0) {
      showToast({ type: 'warning', title: 'Invalid Time', message: 'Please enter a total screen time greater than 0 minutes.' });
      return;
    }

    setSavingTotal(true);
    try {
      const res = await api.saveDailyScreenTimeTotal({
        date: totalForm.date,
        totalMinutes,
        targetLimitMinutes: totalForm.targetLimitMinutes ? parseInt(totalForm.targetLimitMinutes, 10) : null,
        notes: totalForm.notes,
      });
      if (res?.success) {
        showToast({
          type: 'success',
          title: 'Total Screen Time Saved',
          message: `Logged ${formatDuration(totalMinutes)} total screen time for ${totalForm.date}. Now you can add apps under it!`,
        });
        setIsTotalModalOpen(false);
        fetchEntries();
      }
    } catch (err) {
      showToast({ type: 'error', title: 'Save Failed', message: err.message || 'Could not save total screen time.' });
    } finally {
      setSavingTotal(false);
    }
  };

  const openAddAppModal = (dailyEntry) => {
    setAppModalTarget(dailyEntry);
    setShowNewAppCreator(false);
    setNewAppNameInput('');
    const suggested = dailyEntry.unallocatedMinutes > 0 ? Math.min(30, dailyEntry.unallocatedMinutes) : 15;
    setAppForm({
      appName: dynamicApps[0]?.appName || '',
      spentMinutes: String(suggested),
      notes: '',
    });
  };

  const handleCreateDynamicApp = async () => {
    if (!newAppNameInput.trim()) return;
    setSavingNewApp(true);
    try {
      const res = await api.saveScreenTimeApp({
        appName: newAppNameInput.trim(),
        color: newAppColorInput,
      });
      if (res?.success && res.data) {
        setAppForm((prev) => ({ ...prev, appName: res.data.appName }));
        setNewAppNameInput('');
        setShowNewAppCreator(false);
        const appsRes = await api.getScreenTimeApps().catch(() => null);
        if (appsRes?.success && Array.isArray(appsRes.data)) {
          setDynamicApps(appsRes.data);
        }
        showToast({ type: 'success', title: 'App Added', message: `${res.data.appName} added to your dynamic apps.` });
      }
    } catch (err) {
      showToast({ type: 'error', title: 'Failed', message: err.message || 'Could not save app.' });
    } finally {
      setSavingNewApp(false);
    }
  };

  const handleDeleteDynamicApp = async (appId, e) => {
    e.stopPropagation();
    try {
      await api.deleteScreenTimeApp(appId);
      setDynamicApps((prev) => prev.filter((a) => a.id !== appId));
    } catch (err) {
      showToast({ type: 'error', title: 'Delete Failed', message: err.message || 'Could not remove app.' });
    }
  };

  const handleSaveApp = async (e) => {
    e.preventDefault();
    if (!appModalTarget) return;
    if (!appForm.appName.trim()) {
      showToast({ type: 'warning', title: 'App Name Required', message: 'Please enter an app name.' });
      return;
    }

    setSavingApp(true);
    try {
      const res = await api.addAppUnderDailyScreenTime({
        dailyScreenTimeId: appModalTarget.id,
        date: appModalTarget.date,
        appName: appForm.appName.trim(),
        spentMinutes: parseInt(appForm.spentMinutes, 10) || 0,
        notes: appForm.notes,
      });
      if (res?.success) {
        showToast({
          type: 'success',
          title: 'App Time Added',
          message: `Added ${appForm.appName} (${appForm.spentMinutes}m) under ${appModalTarget.date}.`,
        });
        setAppModalTarget(null);
        fetchEntries();
      }
    } catch (err) {
      showToast({ type: 'error', title: 'Save Failed', message: err.message || 'Could not add app screen time.' });
    } finally {
      setSavingApp(false);
    }
  };

  const handleDeleteApp = async (appId) => {
    try {
      const res = await api.deleteAppScreenTime(appId);
      if (res?.success) {
        showToast({ type: 'info', title: 'App Removed', message: 'App breakdown entry deleted.' });
        fetchEntries();
      }
    } catch (err) {
      showToast({ type: 'error', title: 'Delete Failed', message: err.message || 'Could not delete app.' });
    }
  };

  const handleDeleteTotal = async (totalId) => {
    try {
      const res = await api.deleteDailyScreenTime(totalId);
      if (res?.success) {
        showToast({ type: 'info', title: 'Day Deleted', message: 'Daily screen time record removed.' });
        fetchEntries();
      }
    } catch (err) {
      showToast({ type: 'error', title: 'Delete Failed', message: err.message || 'Could not delete record.' });
    }
  };

  const stats = useMemo(() => {
    const todayEntry = dailyEntries.find((e) => e.date === todayStr);
    const totalDays = dailyEntries.length;
    const totalMinsAll = dailyEntries.reduce((sum, e) => sum + (e.totalMinutes || 0), 0);
    const avgMins = totalDays > 0 ? Math.round(totalMinsAll / totalDays) : 0;
    const totalAppsCount = dailyEntries.reduce((sum, e) => sum + (e.apps?.length || 0), 0);

    return {
      todayTotal: todayEntry ? formatDuration(todayEntry.totalMinutes) : '0m',
      todayApps: todayEntry?.apps?.length || 0,
      avgDaily: formatDuration(avgMins),
      totalDays,
      totalAppsCount,
    };
  }, [dailyEntries, todayStr]);

  return (
    <div style={{ padding: '24px', maxWidth: '1320px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Theme-Matched Header Banner */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '16px',
          padding: '18px 24px',
          borderRadius: '16px',
          background: 'linear-gradient(135deg, rgba(236, 72, 153, 0.12) 0%, rgba(139, 92, 246, 0.08) 100%)',
          border: '1px solid rgba(236, 72, 153, 0.25)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div
            style={{
              width: '46px',
              height: '46px',
              borderRadius: '12px',
              background: 'rgba(236, 72, 153, 0.18)',
              border: '1px solid rgba(236, 72, 153, 0.3)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#EC4899',
              flexShrink: 0,
            }}
          >
            <Smartphone size={22} />
          </div>
          <div>
            <span
              style={{
                display: 'inline-block',
                fontSize: '0.68rem',
                fontWeight: 800,
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                color: '#EC4899',
                background: 'rgba(236, 72, 153, 0.16)',
                padding: '2px 8px',
                borderRadius: '5px',
                marginBottom: '4px',
              }}
            >
              MOBILE SCREEN TIME
            </span>
            <h1 style={{ margin: 0, fontSize: '1.35rem', fontWeight: 800, color: 'var(--text-primary)' }}>
              Mobile Screen Time Manager
            </h1>
            <p style={{ margin: '2px 0 0 0', fontSize: '0.84rem', color: 'var(--text-secondary)' }}>
              Step 1: Log your daily Total Screen Time • Step 2: Add individual app breakdowns under that total.
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          <button
            type="button"
            onClick={() => setIsManageAppsModalOpen(true)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '7px',
              padding: '10px 16px',
              borderRadius: '10px',
              background: 'var(--card-bg)',
              color: 'var(--text-primary)',
              fontWeight: 700,
              fontSize: '0.84rem',
              border: '1px solid var(--border-color)',
              cursor: 'pointer',
            }}
          >
            <Layers size={15} />
            <span>Manage Apps ({dynamicApps.length})</span>
          </button>

          <button
            type="button"
            onClick={openNewTotalModal}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '10px 18px',
              borderRadius: '10px',
              background: '#EC4899',
              color: '#FFFFFF',
              fontWeight: 700,
              fontSize: '0.86rem',
              border: 'none',
              cursor: 'pointer',
              boxShadow: '0 4px 14px rgba(236, 72, 153, 0.3)',
            }}
          >
            <Plus size={16} />
            <span>Add Total Screen Time</span>
          </button>
        </div>
      </div>

      {/* KPI Strip */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '14px' }}>
        {[
          { label: "Today's Total Screen Time", value: stats.todayTotal, sub: `${stats.todayApps} apps added today`, color: '#EC4899', icon: <Smartphone size={18} /> },
          { label: 'Average Daily Screen Time', value: stats.avgDaily, sub: `Across ${stats.totalDays} logged days`, color: '#8B5CF6', icon: <Clock size={18} /> },
          { label: 'Total App Breakdowns', value: stats.totalAppsCount, sub: 'Apps linked under daily totals', color: '#3B82F6', icon: <Layers size={18} /> },
        ].map((kpi) => (
          <div
            key={kpi.label}
            style={{
              padding: '16px 18px',
              borderRadius: '14px',
              background: 'var(--card-bg)',
              border: '1px solid var(--border-color)',
              display: 'flex',
              alignItems: 'center',
              gap: '14px',
            }}
          >
            <div
              style={{
                width: '40px',
                height: '40px',
                borderRadius: '10px',
                background: `${kpi.color}18`,
                color: kpi.color,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              {kpi.icon}
            </div>
            <div>
              <div style={{ fontSize: '0.73rem', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>{kpi.label}</div>
              <div style={{ fontSize: '1.35rem', fontWeight: 900, color: 'var(--text-primary)', lineHeight: 1.2 }}>{kpi.value}</div>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{kpi.sub}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Daily Total Screen Time Cards */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '50px', color: 'var(--text-muted)' }}>
          <Sparkles size={32} style={{ animation: 'pulse 1.5s infinite', margin: '0 auto 10px' }} />
          <p>Loading screen time records...</p>
        </div>
      ) : dailyEntries.length === 0 ? (
        <div
          className="card"
          style={{
            padding: '48px 24px',
            textAlign: 'center',
            borderRadius: '16px',
            background: 'var(--card-bg)',
            border: '1px dashed var(--border-color)',
          }}
        >
          <Smartphone size={40} color="#EC4899" style={{ opacity: 0.6, margin: '0 auto 12px' }} />
          <h3 style={{ margin: '0 0 6px', fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-primary)' }}>
            No Total Screen Time Logged Yet
          </h3>
          <p style={{ margin: '0 0 18px', fontSize: '0.86rem', color: 'var(--text-secondary)' }}>
            Start by adding your total mobile screen time for today, then add individual app times underneath it.
          </p>
          <button
            type="button"
            onClick={openNewTotalModal}
            style={{
              padding: '10px 20px',
              borderRadius: '10px',
              background: '#EC4899',
              color: '#FFFFFF',
              fontWeight: 700,
              border: 'none',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
            }}
          >
            <Plus size={16} /> Add Total Screen Time
          </button>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {dailyEntries.map((entry) => {
            const pctAllocated = entry.totalMinutes > 0 ? Math.min(100, Math.round((entry.allocatedMinutes / entry.totalMinutes) * 100)) : 0;
            return (
              <div
                key={entry.id}
                className="card"
                style={{
                  padding: '20px 24px',
                  borderRadius: '16px',
                  background: 'var(--card-bg)',
                  border: `1px solid ${entry.isOverLimit ? 'rgba(239, 68, 68, 0.35)' : 'var(--border-color)'}`,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '16px',
                }}
              >
                {/* Card Header: Date, Total Screen Time & Actions */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div
                      style={{
                        padding: '8px 12px',
                        borderRadius: '10px',
                        background: 'rgba(236, 72, 153, 0.12)',
                        color: '#EC4899',
                        fontWeight: 800,
                        fontSize: '0.84rem',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                      }}
                    >
                      <Calendar size={15} />
                      <span>{entry.date}</span>
                    </div>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                        <span style={{ fontSize: '1.25rem', fontWeight: 900, color: 'var(--text-primary)' }}>
                          Total: {formatDuration(entry.totalMinutes)}
                        </span>
                        <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 600 }}>
                          ({entry.totalMinutes} mins)
                        </span>
                        {entry.targetLimitMinutes && (
                          <span
                            style={{
                              fontSize: '0.74rem',
                              fontWeight: 800,
                              padding: '3px 9px',
                              borderRadius: '6px',
                              background: entry.isOverLimit ? 'rgba(239, 68, 68, 0.14)' : 'rgba(16, 185, 129, 0.14)',
                              color: entry.isOverLimit ? '#EF4444' : '#10B981',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px',
                            }}
                          >
                            {entry.isOverLimit ? <AlertTriangle size={12} /> : <CheckCircle2 size={12} />}
                            {entry.isOverLimit
                              ? `Exceeded ${formatDuration(entry.targetLimitMinutes)} limit by +${entry.exceededMinutes}m`
                              : `Within ${formatDuration(entry.targetLimitMinutes)} limit`}
                          </span>
                        )}
                      </div>
                      {entry.notes && (
                        <p style={{ margin: '3px 0 0', fontSize: '0.78rem', color: 'var(--text-secondary)' }}>{entry.notes}</p>
                      )}
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                    <button
                      type="button"
                      onClick={() => openAddAppModal(entry)}
                      style={{
                        padding: '7px 14px',
                        borderRadius: '8px',
                        background: 'rgba(16, 185, 129, 0.15)',
                        border: '1px solid rgba(16, 185, 129, 0.35)',
                        color: '#10B981',
                        fontSize: '0.8rem',
                        fontWeight: 700,
                        cursor: 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px',
                      }}
                    >
                      <Plus size={14} /> Add App Time
                    </button>
                    <button
                      type="button"
                      onClick={() => openEditTotalModal(entry)}
                      title="Edit Total Screen Time"
                      style={{
                        padding: '7px 10px',
                        borderRadius: '8px',
                        background: 'var(--surface-bg)',
                        border: '1px solid var(--border-color)',
                        color: 'var(--text-secondary)',
                        cursor: 'pointer',
                      }}
                    >
                      <Edit2 size={14} />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteTotal(entry.id)}
                      title="Delete Daily Record"
                      style={{
                        padding: '7px 10px',
                        borderRadius: '8px',
                        background: 'rgba(239, 68, 68, 0.1)',
                        border: '1px solid rgba(239, 68, 68, 0.25)',
                        color: '#EF4444',
                        cursor: 'pointer',
                      }}
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>

                {/* Allocation Progress Bar */}
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.76rem', fontWeight: 700, marginBottom: '6px' }}>
                    <span style={{ color: '#3B82F6' }}>
                      Apps Added: {formatDuration(entry.allocatedMinutes)} ({pctAllocated}%)
                    </span>
                    <span style={{ color: entry.isOverAllocated ? '#EF4444' : 'var(--text-muted)' }}>
                      {entry.isOverAllocated
                        ? `Apps exceed total by +${entry.allocatedMinutes - entry.totalMinutes}m`
                        : `Unallocated / Other: ${formatDuration(entry.unallocatedMinutes)}`}
                    </span>
                  </div>
                  <div style={{ height: '8px', borderRadius: '999px', background: 'var(--surface-bg)', overflow: 'hidden', border: '1px solid var(--border-color)' }}>
                    <div
                      style={{
                        height: '100%',
                        width: `${pctAllocated}%`,
                        background: entry.isOverAllocated ? '#EF4444' : 'linear-gradient(90deg, #EC4899, #8B5CF6)',
                        borderRadius: '999px',
                        transition: 'width 0.3s ease',
                      }}
                    />
                  </div>
                </div>

                {/* Nested Apps Breakdown Under This Total */}
                {entry.apps && entry.apps.length > 0 ? (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '10px' }}>
                    {entry.apps.map((app) => {
                      const appColor = appColorMap[(app.appName || '').toLowerCase()] || '#EC4899';
                      const sharePct = entry.totalMinutes > 0 ? Math.round(((app.spentMinutes || 0) / entry.totalMinutes) * 100) : 0;
                      return (
                        <div
                          key={app.id}
                          style={{
                            padding: '12px 14px',
                            borderRadius: '10px',
                            background: 'var(--surface-bg)',
                            border: '1px solid var(--border-color)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            gap: '10px',
                          }}
                        >
                          <div style={{ minWidth: 0 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <span style={{ width: '9px', height: '9px', borderRadius: '50%', background: appColor, flexShrink: 0 }} />
                              <span style={{ fontWeight: 800, fontSize: '0.9rem', color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                {app.appName}
                              </span>
                            </div>
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '3px' }}>
                              <strong style={{ color: appColor }}>{formatDuration(app.spentMinutes)}</strong> ({sharePct}% of total)
                            </div>
                            {app.notes && (
                              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '2px' }}>{app.notes}</div>
                            )}
                          </div>
                          <button
                            type="button"
                            onClick={() => handleDeleteApp(app.id)}
                            title="Remove App"
                            style={{
                              background: 'transparent',
                              border: 'none',
                              color: 'var(--text-muted)',
                              cursor: 'pointer',
                              padding: '4px',
                            }}
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>
                    No apps added under this total yet. Click &quot;+ Add App Time&quot; above to break down which apps used this time.
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Modal 0: Manage User's Apps in DB */}
      {isManageAppsModalOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 1000,
            backgroundColor: 'rgba(0, 0, 0, 0.72)',
            backdropFilter: 'blur(6px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '16px',
          }}
          onClick={(e) => { if (e.target === e.currentTarget) setIsManageAppsModalOpen(false); }}
        >
          <div
            className="card"
            style={{
              width: '100%',
              maxWidth: '480px',
              background: 'var(--card-bg)',
              border: '1px solid var(--border-color)',
              borderRadius: '18px',
              padding: '24px',
              display: 'flex',
              flexDirection: 'column',
              gap: '16px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 800, color: 'var(--text-primary)' }}>Manage Your Apps</h3>
                <p style={{ margin: '2px 0 0', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                  Apps added here will appear in the dropdown across all screen time forms.
                </p>
              </div>
              <button type="button" onClick={() => setIsManageAppsModalOpen(false)} style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
                <X size={20} />
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', padding: '12px', borderRadius: '12px', background: 'var(--surface-bg)', border: '1px solid var(--border-color)' }}>
              <div style={{ display: 'flex', gap: '8px' }}>
                <input
                  type="text"
                  placeholder="App name (e.g. Instagram, YouTube, BGMI)"
                  value={newAppNameInput}
                  onChange={(e) => setNewAppNameInput(e.target.value)}
                  style={{ flex: 1, padding: '9px 12px', borderRadius: '8px', background: 'var(--card-bg)', border: '1px solid var(--border-color)', color: 'var(--text-primary)', fontSize: '0.85rem' }}
                />
                <button
                  type="button"
                  onClick={handleCreateDynamicApp}
                  disabled={savingNewApp || !newAppNameInput.trim()}
                  style={{ padding: '9px 16px', borderRadius: '8px', background: '#10B981', color: '#FFFFFF', fontWeight: 700, fontSize: '0.82rem', border: 'none', cursor: 'pointer' }}
                >
                  {savingNewApp ? 'Adding...' : '+ Add App'}
                </button>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '260px', overflowY: 'auto' }}>
              {dynamicApps.length === 0 ? (
                <p style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.82rem', margin: '12px 0' }}>
                  No apps added yet. Add your first app above!
                </p>
              ) : (
                dynamicApps.map((appObj) => (
                  <div
                    key={appObj.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '10px 12px',
                      borderRadius: '10px',
                      background: 'var(--surface-bg)',
                      border: '1px solid var(--border-color)',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: appObj.color || '#EC4899' }} />
                      <span style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--text-primary)' }}>{appObj.appName}</span>
                    </div>
                    <button
                      type="button"
                      onClick={(e) => handleDeleteDynamicApp(appObj.id, e)}
                      style={{ background: 'transparent', border: 'none', color: '#EF4444', cursor: 'pointer', padding: '4px' }}
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* Modal 1: Add / Edit Total Screen Time */}
      {isTotalModalOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 1000,
            backgroundColor: 'rgba(0, 0, 0, 0.72)',
            backdropFilter: 'blur(6px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '16px',
          }}
          onClick={(e) => { if (e.target === e.currentTarget) setIsTotalModalOpen(false); }}
        >
          <div
            className="card"
            style={{
              width: '100%',
              maxWidth: '460px',
              background: 'var(--card-bg)',
              border: '1px solid var(--border-color)',
              borderRadius: '18px',
              padding: '24px',
              display: 'flex',
              flexDirection: 'column',
              gap: '16px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'rgba(236, 72, 153, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#EC4899' }}>
                  <Smartphone size={18} />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 800, color: 'var(--text-primary)' }}>Log Total Screen Time</h3>
                  <p style={{ margin: '2px 0 0', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Step 1: Set total daily phone usage</p>
                </div>
              </div>
              <button type="button" onClick={() => setIsTotalModalOpen(false)} style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSaveTotal} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-primary)', display: 'block', marginBottom: '6px' }}>
                  Date <span className="required-star">*</span>
                </label>
                <input
                  type="date"
                  required
                  value={totalForm.date}
                  onChange={(e) => setTotalForm({ ...totalForm, date: e.target.value })}
                  style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', background: 'var(--surface-bg)', border: '1px solid var(--border-color)', color: 'var(--text-primary)' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-primary)', display: 'block', marginBottom: '6px' }}>
                    Hours <span className="required-star">*</span>
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="24"
                    required
                    value={totalForm.hours}
                    onChange={(e) => setTotalForm({ ...totalForm, hours: e.target.value })}
                    style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', background: 'var(--surface-bg)', border: '1px solid var(--border-color)', color: 'var(--text-primary)' }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-primary)', display: 'block', marginBottom: '6px' }}>
                    Minutes <span className="required-star">*</span>
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="59"
                    required
                    value={totalForm.minutes}
                    onChange={(e) => setTotalForm({ ...totalForm, minutes: e.target.value })}
                    style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', background: 'var(--surface-bg)', border: '1px solid var(--border-color)', color: 'var(--text-primary)' }}
                  />
                </div>
              </div>

              <div>
                <label style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-primary)', display: 'block', marginBottom: '6px' }}>
                  Daily Target Limit (Minutes, Optional)
                </label>
                <input
                  type="number"
                  min="0"
                  placeholder="e.g. 180 (3 hours)"
                  value={totalForm.targetLimitMinutes}
                  onChange={(e) => setTotalForm({ ...totalForm, targetLimitMinutes: e.target.value })}
                  style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', background: 'var(--surface-bg)', border: '1px solid var(--border-color)', color: 'var(--text-primary)' }}
                />
              </div>

              <div>
                <label style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-primary)', display: 'block', marginBottom: '6px' }}>Notes (Optional)</label>
                <textarea
                  rows={2}
                  placeholder="Any remarks about today's mobile usage..."
                  value={totalForm.notes}
                  onChange={(e) => setTotalForm({ ...totalForm, notes: e.target.value })}
                  style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', background: 'var(--surface-bg)', border: '1px solid var(--border-color)', color: 'var(--text-primary)', resize: 'vertical' }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', paddingTop: '6px' }}>
                <button type="button" onClick={() => setIsTotalModalOpen(false)} className="btn btn-secondary" style={{ padding: '8px 16px', borderRadius: '8px' }}>
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingTotal}
                  style={{ padding: '8px 20px', borderRadius: '8px', background: '#EC4899', color: '#FFFFFF', fontWeight: 700, border: 'none', cursor: 'pointer' }}
                >
                  {savingTotal ? 'Saving...' : 'Save Total Screen Time'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal 2: Add App Time Under Total Screen Time */}
      {appModalTarget && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 1000,
            backgroundColor: 'rgba(0, 0, 0, 0.72)',
            backdropFilter: 'blur(6px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '16px',
          }}
          onClick={(e) => { if (e.target === e.currentTarget) setAppModalTarget(null); }}
        >
          <div
            className="card"
            style={{
              width: '100%',
              maxWidth: '460px',
              background: 'var(--card-bg)',
              border: '1px solid var(--border-color)',
              borderRadius: '18px',
              padding: '24px',
              display: 'flex',
              flexDirection: 'column',
              gap: '16px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                  Add App Under {appModalTarget.date}
                </h3>
                <p style={{ margin: '2px 0 0', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                  Total: {formatDuration(appModalTarget.totalMinutes)} • Unallocated: {formatDuration(appModalTarget.unallocatedMinutes)}
                </p>
              </div>
              <button type="button" onClick={() => setAppModalTarget(null)} style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSaveApp} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                  <label style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                    Select App <span className="required-star">*</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowNewAppCreator((v) => !v)}
                    style={{
                      background: 'rgba(16, 185, 129, 0.12)',
                      border: '1px solid rgba(16, 185, 129, 0.3)',
                      color: '#10B981',
                      borderRadius: '6px',
                      padding: '3px 9px',
                      fontSize: '0.72rem',
                      fontWeight: 700,
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px',
                    }}
                  >
                    <Plus size={12} /> {showNewAppCreator ? 'Close' : 'Add New App'}
                  </button>
                </div>

                {showNewAppCreator && (
                  <div
                    style={{
                      padding: '10px',
                      borderRadius: '10px',
                      background: 'var(--surface-bg)',
                      border: '1px solid var(--border-color)',
                      marginBottom: '10px',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '8px',
                    }}
                  >
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <input
                        type="text"
                        placeholder="Enter app name (e.g. Instagram, YouTube)"
                        value={newAppNameInput}
                        onChange={(e) => setNewAppNameInput(e.target.value)}
                        style={{
                          flex: 1,
                          padding: '7px 10px',
                          borderRadius: '7px',
                          background: 'var(--card-bg)',
                          border: '1px solid var(--border-color)',
                          color: 'var(--text-primary)',
                          fontSize: '0.8rem',
                        }}
                      />
                      <button
                        type="button"
                        onClick={handleCreateDynamicApp}
                        disabled={savingNewApp || !newAppNameInput.trim()}
                        style={{
                          padding: '7px 12px',
                          borderRadius: '7px',
                          background: '#10B981',
                          color: '#FFFFFF',
                          fontWeight: 700,
                          fontSize: '0.76rem',
                          border: 'none',
                          cursor: 'pointer',
                        }}
                      >
                        {savingNewApp ? 'Saving...' : 'Save App'}
                      </button>
                    </div>
                  </div>
                )}

                <CustomSelect
                  value={appForm.appName}
                  onChange={(val) => setAppForm({ ...appForm, appName: val })}
                  options={dynamicApps.map((appObj) => ({
                    value: appObj.appName,
                    label: appObj.appName,
                    color: appObj.color || '#EC4899',
                  }))}
                  placeholder="-- Select an App --"
                  searchPlaceholder="Search saved apps..."
                  showSearch={dynamicApps.length > 4}
                />
                {dynamicApps.length === 0 && (
                  <p style={{ fontSize: '0.74rem', color: '#F59E0B', margin: '6px 0 0' }}>
                    No apps saved yet. Click &quot;+ Add New App&quot; above to add your apps first.
                  </p>
                )}
              </div>

              <div>
                <label style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-primary)', display: 'block', marginBottom: '6px' }}>
                  Time Spent (Minutes) <span className="required-star">*</span>
                </label>
                <input
                  type="number"
                  min="1"
                  max="1440"
                  required
                  value={appForm.spentMinutes}
                  onChange={(e) => setAppForm({ ...appForm, spentMinutes: e.target.value })}
                  style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', background: 'var(--surface-bg)', border: '1px solid var(--border-color)', color: 'var(--text-primary)' }}
                />
              </div>

              <div>
                <label style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-primary)', display: 'block', marginBottom: '6px' }}>Notes (Optional)</label>
                <input
                  type="text"
                  placeholder="e.g. Reels, study videos, etc."
                  value={appForm.notes}
                  onChange={(e) => setAppForm({ ...appForm, notes: e.target.value })}
                  style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', background: 'var(--surface-bg)', border: '1px solid var(--border-color)', color: 'var(--text-primary)' }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', paddingTop: '6px' }}>
                <button type="button" onClick={() => setAppModalTarget(null)} className="btn btn-secondary" style={{ padding: '8px 16px', borderRadius: '8px' }}>
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingApp}
                  style={{ padding: '8px 20px', borderRadius: '8px', background: '#10B981', color: '#FFFFFF', fontWeight: 700, border: 'none', cursor: 'pointer' }}
                >
                  {savingApp ? 'Saving...' : 'Add App Time'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default ScreenTimePage;
