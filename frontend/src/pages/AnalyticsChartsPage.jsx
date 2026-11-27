import React, { useState, useEffect, useMemo } from 'react';
import {
  BarChart3,
  TrendingUp,
  PieChart as PieIcon,
  Calendar,
  Clock,
  Target,
  CheckCircle2,
  AlertTriangle,
  Flame,
  Smartphone,
  Plus,
  Trash2,
  Edit2,
  Check,
  X,
  Timer,
  Layers,
  Sparkles,
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  CartesianGrid,
} from 'recharts';
import { useApp } from '../context/AppContext';
import { api } from '../services/api';
import { getTodayDateString } from '../utils/dateUtils';
import '../styles/pages/dashboard.css';

export function AnalyticsChartsPage() {
  const { tasks = [], categories = [], goals = [], workSessions = [], showToast } = useApp();
  const todayStr = getTodayDateString();

  const [analyticsData, setAnalyticsData] = useState(null);
  const [screenTimeReport, setScreenTimeReport] = useState(null);
  const [loading, setLoading] = useState(true);

  // Screen Time Entry Modal & Form
  const [isScreenTimeModalOpen, setIsScreenTimeModalOpen] = useState(false);
  const [screenTimeForm, setScreenTimeForm] = useState({
    date: todayStr,
    appName: 'Instagram',
    spentMinutes: '15',
    notes: 'Checked reels and notifications',
  });

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      const [chartsRes, stRes] = await Promise.all([
        api.getAnalyticsCharts().catch(() => ({ data: null })),
        api.getScreenTimeReport(todayStr).catch(() => ({ data: null })),
      ]);
      if (chartsRes?.success && chartsRes.data) {
        setAnalyticsData(chartsRes.data);
      }
      if (stRes?.success && stRes.data) {
        setScreenTimeReport(stRes.data);
      }
    } catch (err) {
      console.warn('Failed to load analytics charts:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const handleSaveScreenTime = async (e) => {
    e.preventDefault();
    try {
      const res = await api.saveScreenTime({
        date: screenTimeForm.date,
        appName: screenTimeForm.appName.trim(),
        spentMinutes: parseInt(screenTimeForm.spentMinutes, 10) || 0,
        notes: screenTimeForm.notes,
      });
      if (res.success) {
        showToast({
          type: 'success',
          title: 'Screen Time Logged',
          message: `Saved ${screenTimeForm.appName} screen time for ${screenTimeForm.date}!`,
        });
        setIsScreenTimeModalOpen(false);
        fetchAnalytics();
      }
    } catch (err) {
      showToast({
        type: 'error',
        title: 'Save Failed',
        message: err.message || 'Could not save screen time.',
      });
    }
  };

  const chartThemeColors = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#06B6D4', '#6366F1'];

  return (
    <div className="dashboard-container" style={{ padding: '24px', maxWidth: '1400px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Header Banner */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '16px',
          padding: '24px 28px',
          borderRadius: '16px',
          background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.12) 0%, rgba(16, 185, 129, 0.08) 100%)',
          border: '1.5px solid rgba(59, 130, 246, 0.25)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div
            style={{
              width: '52px',
              height: '52px',
              borderRadius: '14px',
              background: 'rgba(59, 130, 246, 0.2)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#3B82F6',
              boxShadow: '0 4px 14px rgba(59, 130, 246, 0.3)',
            }}
          >
            <BarChart3 size={28} />
          </div>
          <div>
            <h1 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-primary)' }}>
              Analytics & Comprehensive Charts Hub
            </h1>
            <p style={{ margin: '4px 0 0 0', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
              Real-time visualization of Goals progress, Category distribution, Task completion, Work tracker time & Mobile screen time.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setIsScreenTimeModalOpen(true)}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '10px 18px',
            borderRadius: '10px',
            background: '#10B981',
            color: '#FFFFFF',
            fontWeight: 700,
            fontSize: '0.88rem',
            border: 'none',
            cursor: 'pointer',
            boxShadow: '0 4px 14px rgba(16, 185, 129, 0.35)',
          }}
        >
          <Smartphone size={16} />
          <span>Enter Mobile Screen Time</span>
        </button>
      </div>

      {loading && !analyticsData ? (
        <div style={{ textAlign: 'center', padding: '60px', color: 'var(--text-muted)' }}>
          <Sparkles size={36} style={{ animation: 'pulse 1.5s infinite', margin: '0 auto 12px' }} />
          <p style={{ fontWeight: 600 }}>Loading analytics charts...</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(560px, 1fr))', gap: '24px' }}>
          {/* 1. Goals Progress Chart */}
          <div className="card" style={{ padding: '24px', borderRadius: '16px', background: 'var(--card-bg)', border: '1px solid var(--border-color)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Target size={20} color="#8B5CF6" />
                <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                  Goals Progression Overview
                </h3>
              </div>
              <span className="badge badge-primary" style={{ fontSize: '0.78rem' }}>
                Avg: {analyticsData?.goals?.averageProgress || 0}%
              </span>
            </div>
            <div style={{ height: '280px', width: '100%' }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={analyticsData?.goals?.list || []} layout="vertical" margin={{ top: 5, right: 20, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.08)" />
                  <XAxis type="number" domain={[0, 100]} stroke="#94A3B8" />
                  <YAxis type="category" dataKey="title" width={140} stroke="#94A3B8" tick={{ fontSize: 11 }} />
                  <Tooltip contentStyle={{ background: '#18181B', border: '1px solid #27272A', borderRadius: 8, color: '#fff' }} />
                  <Bar dataKey="progress" fill="#8B5CF6" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* 2. Categories Distribution Chart */}
          <div className="card" style={{ padding: '24px', borderRadius: '16px', background: 'var(--card-bg)', border: '1px solid var(--border-color)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <PieIcon size={20} color="#3B82F6" />
                <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                  Categories Task Distribution
                </h3>
              </div>
              <span className="badge badge-secondary" style={{ fontSize: '0.78rem' }}>
                {analyticsData?.taskSummary?.byCategory?.length || 0} Categories
              </span>
            </div>
            <div style={{ height: '280px', width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={analyticsData?.taskSummary?.byCategory || []}
                    dataKey="taskCount"
                    nameKey="category"
                    cx="50%"
                    cy="50%"
                    outerRadius={95}
                    innerRadius={55}
                    paddingAngle={4}
                    label={({ category, taskCount }) => `${category}: ${taskCount}`}
                  >
                    {(analyticsData?.taskSummary?.byCategory || []).map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color || chartThemeColors[index % chartThemeColors.length]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ background: '#18181B', border: '1px solid #27272A', borderRadius: 8, color: '#fff' }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* 3. Task Completion & Status Chart */}
          <div className="card" style={{ padding: '24px', borderRadius: '16px', background: 'var(--card-bg)', border: '1px solid var(--border-color)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <CheckCircle2 size={20} color="#10B981" />
                <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                  Task Completion Rate (Last 30 Days)
                </h3>
              </div>
              <span className="badge badge-success" style={{ fontSize: '0.78rem' }}>
                {analyticsData?.taskSummary?.byStatus?.completed || 0} Completed
              </span>
            </div>
            <div style={{ height: '280px', width: '100%' }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={analyticsData?.tasksByDay || []} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.08)" />
                  <XAxis dataKey="label" stroke="#94A3B8" />
                  <YAxis stroke="#94A3B8" />
                  <Tooltip contentStyle={{ background: '#18181B', border: '1px solid #27272A', borderRadius: 8, color: '#fff' }} />
                  <Bar dataKey="count" fill="#10B981" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* 4. Work Tracker Day-by-Day Hours Chart */}
          <div className="card" style={{ padding: '24px', borderRadius: '16px', background: 'var(--card-bg)', border: '1px solid var(--border-color)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Timer size={20} color="#06B6D4" />
                <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                  Work Tracker Time (Day-by-Day Hours)
                </h3>
              </div>
              <span className="badge badge-primary" style={{ fontSize: '0.78rem' }}>
                {analyticsData?.workSessions?.totalHours || 0} Total Hours
              </span>
            </div>
            <div style={{ height: '280px', width: '100%' }}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={analyticsData?.workSessions?.byDay || []} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.08)" />
                  <XAxis dataKey="label" stroke="#94A3B8" />
                  <YAxis stroke="#94A3B8" />
                  <Tooltip contentStyle={{ background: '#18181B', border: '1px solid #27272A', borderRadius: 8, color: '#fff' }} />
                  <Line type="monotone" dataKey="hours" stroke="#06B6D4" strokeWidth={3} dot={{ fill: '#06B6D4', r: 4 }} activeDot={{ r: 7 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* 5. Mobile Screen Time Chart & Report */}
          <div className="card" style={{ padding: '24px', borderRadius: '16px', background: 'var(--card-bg)', border: '1px solid var(--border-color)', gridColumn: '1 / -1' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px', flexWrap: 'wrap', gap: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Smartphone size={20} color="#EC4899" />
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                    Mobile Screen Time Report & Exceeded Limits
                  </h3>
                  <p style={{ margin: '2px 0 0 0', fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                    Track app screen time against targeted limits (e.g., if Instagram is logged 15m instead of 10m, exceeded minutes are flagged).
                  </p>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <span className="badge badge-danger" style={{ fontSize: '0.78rem' }}>
                  {screenTimeReport?.totalExceededMinutes || 0}m Total Exceeded
                </span>
                <button
                  type="button"
                  onClick={() => setIsScreenTimeModalOpen(true)}
                  style={{
                    padding: '6px 14px',
                    borderRadius: '8px',
                    background: 'rgba(236, 72, 153, 0.15)',
                    border: '1px solid rgba(236, 72, 153, 0.4)',
                    color: '#EC4899',
                    fontSize: '0.82rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                  }}
                >
                  <Plus size={14} /> Add Screen Time
                </button>
              </div>
            </div>

            {/* Screen time chart */}
            <div style={{ height: '240px', width: '100%', marginBottom: '20px' }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={analyticsData?.screenTimeByDay || []} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.08)" />
                  <XAxis dataKey="label" stroke="#94A3B8" />
                  <YAxis stroke="#94A3B8" />
                  <Tooltip contentStyle={{ background: '#18181B', border: '1px solid #27272A', borderRadius: 8, color: '#fff' }} />
                  <Bar dataKey="hours" fill="#EC4899" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Apps breakdown list */}
            {screenTimeReport?.apps && screenTimeReport.apps.length > 0 ? (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '12px' }}>
                {screenTimeReport.apps.map((app) => (
                  <div
                    key={app.appName}
                    style={{
                      padding: '14px 16px',
                      borderRadius: '12px',
                      background: 'var(--surface-bg)',
                      border: `1px solid ${app.isOverLimit ? 'rgba(239, 68, 68, 0.4)' : 'var(--border-color)'}`,
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '8px',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: app.color || '#EC4899' }} />
                        <span style={{ fontWeight: 800, fontSize: '0.95rem', color: 'var(--text-primary)' }}>{app.appName}</span>
                      </div>
                      <span
                        style={{
                          fontSize: '0.74rem',
                          fontWeight: 800,
                          padding: '2px 8px',
                          borderRadius: '6px',
                          background: app.isOverLimit ? 'rgba(239, 68, 68, 0.15)' : 'rgba(16, 185, 129, 0.15)',
                          color: app.isOverLimit ? '#EF4444' : '#10B981',
                        }}
                      >
                        {app.totalMinutes}m spent {app.targetLimitMinutes ? `(Limit: ${app.targetLimitMinutes}m)` : ''}
                      </span>
                    </div>
                    {app.exceededMinutes > 0 && (
                      <div style={{ fontSize: '0.76rem', color: '#EF4444', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <AlertTriangle size={13} /> Exceeded target limit by +{app.exceededMinutes}m!
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: '30px', color: 'var(--text-muted)' }}>
                <Smartphone size={28} style={{ opacity: 0.4, margin: '0 auto 8px' }} />
                <p style={{ fontSize: '0.85rem' }}>No mobile screen time records for today. Click "Enter Mobile Screen Time" to log apps like Instagram, YouTube, etc.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Screen Time Entry Modal */}
      {isScreenTimeModalOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 1000,
            backgroundColor: 'rgba(0, 0, 0, 0.75)',
            backdropFilter: 'blur(6px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '16px',
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget) setIsScreenTimeModalOpen(false);
          }}
        >
          <div
            className="card"
            style={{
              width: '100%',
              maxWidth: '460px',
              background: 'var(--card-bg)',
              border: '1px solid var(--border-color)',
              borderRadius: '20px',
              padding: '24px',
              display: 'flex',
              flexDirection: 'column',
              gap: '16px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ width: '38px', height: '38px', borderRadius: '10px', background: 'rgba(236, 72, 153, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#EC4899' }}>
                  <Smartphone size={20} />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                    Enter Mobile Screen Time
                  </h3>
                  <p style={{ margin: '2px 0 0 0', fontSize: '0.76rem', color: 'var(--text-secondary)' }}>
                    Log daily usage per app (e.g. Instagram 15m)
                  </p>
                </div>
              </div>
              <button type="button" onClick={() => setIsScreenTimeModalOpen(false)} style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSaveScreenTime} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-primary)', display: 'block', marginBottom: '6px' }}>Date:</label>
                <input
                  type="date"
                  className="form-input"
                  value={screenTimeForm.date}
                  onChange={(e) => setScreenTimeForm({ ...screenTimeForm, date: e.target.value })}
                  required
                  style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', background: 'var(--surface-bg)', border: '1px solid var(--border-color)', color: 'var(--text-primary)' }}
                />
              </div>

              <div>
                <label style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-primary)', display: 'block', marginBottom: '6px' }}>App Name:</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. Instagram, YouTube, WhatsApp..."
                  value={screenTimeForm.appName}
                  onChange={(e) => setScreenTimeForm({ ...screenTimeForm, appName: e.target.value })}
                  required
                  style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', background: 'var(--surface-bg)', border: '1px solid var(--border-color)', color: 'var(--text-primary)' }}
                />
              </div>

              <div>
                <label style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-primary)', display: 'block', marginBottom: '6px' }}>Time Spent (Minutes):</label>
                <input
                  type="number"
                  min="1"
                  max="1440"
                  className="form-input"
                  placeholder="e.g. 15 (for 15 minutes)"
                  value={screenTimeForm.spentMinutes}
                  onChange={(e) => setScreenTimeForm({ ...screenTimeForm, spentMinutes: e.target.value })}
                  required
                  style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', background: 'var(--surface-bg)', border: '1px solid var(--border-color)', color: 'var(--text-primary)' }}
                />
              </div>

              <div>
                <label style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-primary)', display: 'block', marginBottom: '6px' }}>Notes / Remarks (Optional):</label>
                <textarea
                  rows={2}
                  className="form-input"
                  placeholder="e.g. Saw reels for 15m instead of 10m target..."
                  value={screenTimeForm.notes}
                  onChange={(e) => setScreenTimeForm({ ...screenTimeForm, notes: e.target.value })}
                  style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', background: 'var(--surface-bg)', border: '1px solid var(--border-color)', color: 'var(--text-primary)', resize: 'vertical' }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', paddingTop: '8px' }}>
                <button type="button" onClick={() => setIsScreenTimeModalOpen(false)} className="btn btn-secondary" style={{ padding: '8px 16px', borderRadius: '8px' }}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" style={{ padding: '8px 20px', borderRadius: '8px', background: '#EC4899', color: '#fff', fontWeight: 700, border: 'none', cursor: 'pointer' }}>
                  Save Screen Time
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default AnalyticsChartsPage;
