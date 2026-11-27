import React, { useState, useEffect } from 'react';
import {
  TrendingUp,
  Target,
  CheckCircle2,
  AlertTriangle,
  Smartphone,
  Plus,
  X,
  Timer,
  Layers,
  Sparkles,
  Activity,
} from 'lucide-react';
import {
  ResponsiveContainer,
  XAxis,
  YAxis,
  Tooltip,
  LineChart,
  Line,
  CartesianGrid,
} from 'recharts';
import { useApp } from '../context/AppContext';
import { api } from '../services/api';
import { getTodayDateString } from '../utils/dateUtils';
import { CustomSelect } from '../components/common/CustomSelect';
import '../styles/pages/dashboard.css';

const formatAxisDate = (dateStr) => {
  if (!dateStr || typeof dateStr !== 'string') return dateStr;
  if (/^\d{4}$/.test(dateStr)) return dateStr;
  if (!dateStr.includes('-')) return dateStr;
  const dt = new Date(`${dateStr}T00:00:00`);
  if (Number.isNaN(dt.getTime())) return dateStr;
  return dt.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
};

const CustomLineTooltip = ({ active, payload, label, unit = '' }) => {
  if (!active || !payload || !payload.length) return null;
  const entry = payload[0];
  const row = entry?.payload;
  const displayLabel = row?.isYear
    ? `Year ${row.date}`
    : row?.date
    ? new Date(`${row.date}T00:00:00`).toLocaleDateString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      })
    : label;
  return (
    <div
      style={{
        background: 'var(--card-bg)',
        border: '1px solid var(--border-color)',
        borderRadius: '12px',
        padding: '10px 14px',
        boxShadow: '0 10px 28px rgba(0, 0, 0, 0.28)',
        backdropFilter: 'blur(8px)',
        minWidth: '140px',
      }}
    >
      <div
        style={{
          fontSize: '0.75rem',
          fontWeight: 700,
          color: 'var(--text-secondary)',
          marginBottom: '4px',
        }}
      >
        {displayLabel}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <span
          style={{
            width: '9px',
            height: '9px',
            borderRadius: '50%',
            backgroundColor: entry.color || '#3B82F6',
            boxShadow: `0 0 8px ${entry.color || '#3B82F6'}`,
            flexShrink: 0,
          }}
        />
        <span style={{ fontSize: '0.92rem', fontWeight: 800, color: 'var(--text-primary)' }}>
          {entry.value}
          {unit}
        </span>
      </div>
    </div>
  );
};

export function AnalyticsChartsPage() {
  const { showToast } = useApp();
  const todayStr = getTodayDateString();

  const [analyticsData, setAnalyticsData] = useState(null);
  const [screenTimeReport, setScreenTimeReport] = useState(null);
  const [dynamicApps, setDynamicApps] = useState([]);
  const [showNewAppInline, setShowNewAppInline] = useState(false);
  const [newAppInlineName, setNewAppInlineName] = useState('');
  const [loading, setLoading] = useState(true);
  const [workRange, setWorkRange] = useState('month'); // 'week' | 'month' | 'year'

  // Screen Time Entry Modal & Form
  const [isScreenTimeModalOpen, setIsScreenTimeModalOpen] = useState(false);
  const [screenTimeForm, setScreenTimeForm] = useState({
    date: todayStr,
    appName: '',
    spentMinutes: '15',
    notes: '',
  });

  const fetchAnalytics = async (targetWorkRange = workRange) => {
    setLoading(true);
    try {
      const [chartsRes, stRes, appsRes] = await Promise.all([
        api.getAnalyticsCharts({ workRange: targetWorkRange }).catch(() => ({ data: null })),
        api.getScreenTimeReport(todayStr).catch(() => ({ data: null })),
        api.getScreenTimeApps().catch(() => ({ data: [] })),
      ]);
      if (chartsRes?.success && chartsRes.data) {
        setAnalyticsData(chartsRes.data);
      }
      if (stRes?.success && stRes.data) {
        setScreenTimeReport(stRes.data);
      }
      if (appsRes?.success && Array.isArray(appsRes.data)) {
        setDynamicApps(appsRes.data);
        setScreenTimeForm((prev) => ({
          ...prev,
          appName: prev.appName || appsRes.data[0]?.appName || '',
        }));
      }
    } catch (err) {
      console.warn('Failed to load analytics charts:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddInlineApp = async () => {
    if (!newAppInlineName.trim()) return;
    try {
      const res = await api.saveScreenTimeApp({ appName: newAppInlineName.trim() });
      if (res?.success && res.data) {
        setScreenTimeForm((prev) => ({ ...prev, appName: res.data.appName }));
        setNewAppInlineName('');
        setShowNewAppInline(false);
        const appsRes = await api.getScreenTimeApps().catch(() => null);
        if (appsRes?.success && Array.isArray(appsRes.data)) {
          setDynamicApps(appsRes.data);
        }
      }
    } catch (err) {
      showToast({ type: 'error', title: 'Add App Failed', message: err.message || 'Could not add app.' });
    }
  };

  useEffect(() => {
    fetchAnalytics(workRange);
  }, [workRange]);

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

  const chartCardStyle = {
    padding: '22px 24px',
    borderRadius: '16px',
    background: 'var(--card-bg)',
    border: '1px solid var(--border-color)',
    boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)',
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
  };

  const renderChartHeader = (icon, title, subtitle, badgeText, badgeColor, badgeBg) => (
    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '12px', flexWrap: 'wrap' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <div
          style={{
            width: '38px',
            height: '38px',
            borderRadius: '10px',
            background: badgeBg,
            border: `1px solid ${badgeColor}33`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: badgeColor,
            flexShrink: 0,
          }}
        >
          {icon}
        </div>
        <div>
          <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 800, color: 'var(--text-primary)' }}>
            {title}
          </h3>
          <p style={{ margin: '2px 0 0 0', fontSize: '0.76rem', color: 'var(--text-secondary)' }}>
            {subtitle}
          </p>
        </div>
      </div>
      <span
        style={{
          fontSize: '0.76rem',
          fontWeight: 800,
          padding: '5px 11px',
          borderRadius: '8px',
          background: badgeBg,
          color: badgeColor,
          border: `1px solid ${badgeColor}33`,
          whiteSpace: 'nowrap',
        }}
      >
        {badgeText}
      </span>
    </div>
  );

  const renderEmptyChart = (message) => (
    <div
      style={{
        height: '260px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        color: 'var(--text-muted)',
        border: '1px dashed var(--border-color)',
        borderRadius: '12px',
        fontSize: '0.84rem',
      }}
    >
      <Activity size={28} style={{ opacity: 0.4, marginBottom: '8px' }} />
      <span>{message}</span>
    </div>
  );

  const goalsList = analyticsData?.goals?.list || [];
  const categoryList = analyticsData?.taskSummary?.byCategory || [];
  const tasksByDay = analyticsData?.tasksByDay || [];
  const workByDay = analyticsData?.workSessions?.byDay || [];
  const screenTimeByDay = analyticsData?.screenTimeByDay || [];

  return (
    <div className="dashboard-container" style={{ padding: '24px', maxWidth: '1400px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Header Banner */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '16px',
          padding: '20px 24px',
          borderRadius: '16px',
          background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.12) 0%, rgba(16, 185, 129, 0.08) 100%)',
          border: '1px solid rgba(59, 130, 246, 0.25)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div
            style={{
              width: '48px',
              height: '48px',
              borderRadius: '13px',
              background: 'rgba(59, 130, 246, 0.18)',
              border: '1px solid rgba(59, 130, 246, 0.3)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#3B82F6',
              flexShrink: 0,
            }}
          >
            <TrendingUp size={24} />
          </div>
          <div>
            <span
              style={{
                display: 'inline-block',
                fontSize: '0.68rem',
                fontWeight: 800,
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                color: '#3B82F6',
                background: 'rgba(59, 130, 246, 0.15)',
                padding: '2px 8px',
                borderRadius: '5px',
                marginBottom: '4px',
              }}
            >
              LINE TREND ANALYTICS
            </span>
            <h1 style={{ margin: 0, fontSize: '1.35rem', fontWeight: 800, color: 'var(--text-primary)' }}>
              Analytics &amp; Comprehensive Charts Hub
            </h1>
            <p style={{ margin: '2px 0 0 0', fontSize: '0.84rem', color: 'var(--text-secondary)' }}>
              Clean line-chart trends for Goals, Categories, Task completion, Work hours &amp; Mobile screen time.
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
            fontSize: '0.86rem',
            border: 'none',
            cursor: 'pointer',
            boxShadow: '0 4px 14px rgba(16, 185, 129, 0.3)',
          }}
        >
          <Smartphone size={16} />
          <span>Enter Mobile Screen Time</span>
        </button>
      </div>

      {/* KPI Summary Strip */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '14px' }}>
        {[
          {
            label: 'Avg Goal Progress',
            value: `${analyticsData?.goals?.averageProgress || 0}%`,
            sub: `${goalsList.length} Active Goals`,
            color: '#8B5CF6',
            icon: <Target size={18} />,
          },
          {
            label: 'Tasks Completed (30d)',
            value: analyticsData?.taskSummary?.byStatus?.completed || 0,
            sub: `${categoryList.length} Categories Tracked`,
            color: '#10B981',
            icon: <CheckCircle2 size={18} />,
          },
          {
            label: 'Work Hours Logged',
            value: `${analyticsData?.workSessions?.totalHours || 0}h`,
            sub: '30-Day Deep Work Output',
            color: '#06B6D4',
            icon: <Timer size={18} />,
          },
          {
            label: 'Exceeded Screen Time',
            value: `${screenTimeReport?.totalExceededMinutes || 0}m`,
            sub: `${screenTimeReport?.apps?.length || 0} Apps Monitored Today`,
            color: '#EC4899',
            icon: <Smartphone size={18} />,
          },
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
              <div style={{ fontSize: '0.74rem', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.03em' }}>
                {kpi.label}
              </div>
              <div style={{ fontSize: '1.35rem', fontWeight: 900, color: 'var(--text-primary)', lineHeight: 1.2 }}>
                {kpi.value}
              </div>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{kpi.sub}</div>
            </div>
          </div>
        ))}
      </div>

      {loading && !analyticsData ? (
        <div style={{ textAlign: 'center', padding: '60px', color: 'var(--text-muted)' }}>
          <Sparkles size={36} style={{ animation: 'pulse 1.5s infinite', margin: '0 auto 12px' }} />
          <p style={{ fontWeight: 600 }}>Loading analytics line charts...</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(520px, 1fr))', gap: '20px' }}>
          {/* 1. Goals Progress Line Chart */}
          <div className="card" style={chartCardStyle}>
            {renderChartHeader(
              <Target size={19} />,
              'Goals Progression Trend',
              'Completion percentage curve across all tracked goals',
              `Avg: ${analyticsData?.goals?.averageProgress || 0}%`,
              '#8B5CF6',
              'rgba(139, 92, 246, 0.14)'
            )}
            {goalsList.length === 0 ? (
              renderEmptyChart('No goals tracked yet.')
            ) : (
              <div style={{ height: '270px', width: '100%' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={goalsList} margin={{ top: 10, right: 16, left: -12, bottom: 8 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" opacity={0.5} vertical={false} />
                    <XAxis
                      dataKey="title"
                      stroke="#94A3B8"
                      fontSize={11}
                      tickLine={false}
                      axisLine={false}
                      tickFormatter={(v) => (v && v.length > 14 ? `${v.slice(0, 14)}…` : v)}
                    />
                    <YAxis domain={[0, 100]} stroke="#94A3B8" fontSize={11} tickLine={false} axisLine={false} unit="%" />
                    <Tooltip content={<CustomLineTooltip unit="%" />} />
                    <Line
                      type="monotone"
                      dataKey="progress"
                      stroke="#8B5CF6"
                      strokeWidth={3}
                      dot={false}
                      activeDot={{ r: 5, fill: '#8B5CF6', stroke: '#FFFFFF', strokeWidth: 2 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>

          {/* 2. Categories Task Distribution Line Chart */}
          <div className="card" style={chartCardStyle}>
            {renderChartHeader(
              <Layers size={19} />,
              'Categories Task Distribution',
              'Task volume profile across each category',
              `${categoryList.length} Categories`,
              '#3B82F6',
              'rgba(59, 130, 246, 0.14)'
            )}
            {categoryList.length === 0 ? (
              renderEmptyChart('No category task data available.')
            ) : (
              <div style={{ height: '270px', width: '100%' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={categoryList} margin={{ top: 10, right: 16, left: -12, bottom: 8 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" opacity={0.5} vertical={false} />
                    <XAxis
                      dataKey="category"
                      stroke="#94A3B8"
                      fontSize={11}
                      tickLine={false}
                      axisLine={false}
                      tickFormatter={(v) => (v && v.length > 12 ? `${v.slice(0, 12)}…` : v)}
                    />
                    <YAxis stroke="#94A3B8" fontSize={11} tickLine={false} axisLine={false} allowDecimals={false} />
                    <Tooltip content={<CustomLineTooltip unit=" tasks" />} />
                    <Line
                      type="monotone"
                      dataKey="taskCount"
                      stroke="#3B82F6"
                      strokeWidth={3}
                      dot={false}
                      activeDot={{ r: 5, fill: '#3B82F6', stroke: '#FFFFFF', strokeWidth: 2 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>

          {/* 3. Task Completion Rate Line Chart */}
          <div className="card" style={chartCardStyle}>
            {renderChartHeader(
              <CheckCircle2 size={19} />,
              'Task Completion Rate (Last 30 Days)',
              'Daily completed task velocity over the past month',
              `${analyticsData?.taskSummary?.byStatus?.completed || 0} Completed`,
              '#10B981',
              'rgba(16, 185, 129, 0.14)'
            )}
            {tasksByDay.length === 0 ? (
              renderEmptyChart('No daily task completion records yet.')
            ) : (
              <div style={{ height: '270px', width: '100%' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={tasksByDay} margin={{ top: 10, right: 16, left: -12, bottom: 8 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" opacity={0.5} vertical={false} />
                    <XAxis dataKey="date" tickFormatter={formatAxisDate} stroke="#94A3B8" fontSize={11} tickLine={false} axisLine={false} interval={4} />
                    <YAxis stroke="#94A3B8" fontSize={11} tickLine={false} axisLine={false} allowDecimals={false} />
                    <Tooltip content={<CustomLineTooltip unit=" completed" />} />
                    <Line
                      type="monotone"
                      dataKey="count"
                      stroke="#10B981"
                      strokeWidth={3}
                      dot={false}
                      activeDot={{ r: 5, fill: '#10B981', stroke: '#FFFFFF', strokeWidth: 2 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>

          {/* 4. Work Tracker Hours Line Chart (Week / Month / 7-Year Dropdown) */}
          <div className="card" style={chartCardStyle}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', flexWrap: 'nowrap' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1, minWidth: 0 }}>
                <div
                  style={{
                    width: '38px',
                    height: '38px',
                    borderRadius: '10px',
                    background: 'rgba(6, 182, 212, 0.14)',
                    border: '1px solid rgba(6, 182, 212, 0.25)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#06B6D4',
                    flexShrink: 0,
                  }}
                >
                  <Timer size={19} />
                </div>
                <div style={{ minWidth: 0 }}>
                  <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 800, color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    Work Tracker Time ({workRange === 'week' ? 'Last 7 Days' : workRange === 'year' ? 'Last 7 Years' : 'Last 30 Days'})
                  </h3>
                  <p style={{ margin: '2px 0 0 0', fontSize: '0.76rem', color: 'var(--text-secondary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {workRange === 'week'
                      ? 'Daily deep work hours for the last 7 days'
                      : workRange === 'year'
                      ? 'Yearly deep work hours across the last 7 years'
                      : 'Daily deep work hours for the last 30 days'}
                  </p>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
                <CustomSelect
                  value={workRange}
                  onChange={(val) => setWorkRange(val)}
                  options={[
                    { value: 'week', label: 'Week (7 Days)' },
                    { value: 'month', label: 'Month (30 Days)' },
                    { value: 'year', label: 'Year (7 Years)' },
                  ]}
                  showSearch={false}
                  ariaLabel="Work Tracker Time Range"
                  style={{ width: '165px', flexShrink: 0 }}
                />
                <span
                  style={{
                    fontSize: '0.76rem',
                    fontWeight: 800,
                    padding: '6px 11px',
                    borderRadius: '8px',
                    background: 'rgba(6, 182, 212, 0.14)',
                    color: '#06B6D4',
                    border: '1px solid rgba(6, 182, 212, 0.25)',
                    whiteSpace: 'nowrap',
                    flexShrink: 0,
                  }}
                >
                  {analyticsData?.workSessions?.totalHours || 0} Total Hours
                </span>
              </div>
            </div>
            {workByDay.length === 0 ? (
              renderEmptyChart('No work sessions logged yet.')
            ) : (
              <div style={{ height: '270px', width: '100%' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={workByDay} margin={{ top: 10, right: 16, left: -12, bottom: 8 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" opacity={0.5} vertical={false} />
                    <XAxis
                      dataKey="date"
                      tickFormatter={formatAxisDate}
                      stroke="#94A3B8"
                      fontSize={11}
                      tickLine={false}
                      axisLine={false}
                      interval={workRange === 'month' ? 4 : 0}
                    />
                    <YAxis
                      domain={workRange === 'year' ? [0, 'auto'] : [0, (dataMax) => Math.min(24, Math.max(4, Math.ceil(dataMax)))]}
                      stroke="#94A3B8"
                      fontSize={11}
                      tickLine={false}
                      axisLine={false}
                      allowDecimals={false}
                      unit="h"
                    />
                    <Tooltip content={<CustomLineTooltip unit=" hrs" />} />
                    <Line
                      type="monotone"
                      dataKey="hours"
                      stroke="#06B6D4"
                      strokeWidth={3}
                      dot={false}
                      activeDot={{ r: 5, fill: '#06B6D4', stroke: '#FFFFFF', strokeWidth: 2 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>

          {/* 5. Mobile Screen Time Line Chart & Report */}
          <div className="card" style={{ ...chartCardStyle, gridColumn: '1 / -1' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div
                  style={{
                    width: '38px',
                    height: '38px',
                    borderRadius: '10px',
                    background: 'rgba(236, 72, 153, 0.14)',
                    border: '1px solid rgba(236, 72, 153, 0.3)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#EC4899',
                    flexShrink: 0,
                  }}
                >
                  <Smartphone size={19} />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                    Mobile Screen Time Trend &amp; Exceeded Limits
                  </h3>
                  <p style={{ margin: '2px 0 0 0', fontSize: '0.76rem', color: 'var(--text-secondary)' }}>
                    Daily screen time curve against target app limits (exceeded minutes are automatically flagged).
                  </p>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span
                  style={{
                    fontSize: '0.76rem',
                    fontWeight: 800,
                    padding: '5px 11px',
                    borderRadius: '8px',
                    background: 'rgba(239, 68, 68, 0.14)',
                    color: '#EF4444',
                    border: '1px solid rgba(239, 68, 68, 0.3)',
                  }}
                >
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

            {/* Screen time line chart */}
            {screenTimeByDay.length === 0 ? (
              renderEmptyChart('No mobile screen time history available yet.')
            ) : (
              <div style={{ height: '240px', width: '100%' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={screenTimeByDay} margin={{ top: 10, right: 16, left: -12, bottom: 8 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" opacity={0.5} vertical={false} />
                    <XAxis dataKey="date" tickFormatter={formatAxisDate} stroke="#94A3B8" fontSize={11} tickLine={false} axisLine={false} interval={4} />
                    <YAxis domain={[0, (dataMax) => Math.min(24, Math.max(2, Math.ceil(dataMax)))]} stroke="#94A3B8" fontSize={11} tickLine={false} axisLine={false} allowDecimals={false} unit="h" />
                    <Tooltip content={<CustomLineTooltip unit=" hrs" />} />
                    <Line
                      type="monotone"
                      dataKey="hours"
                      stroke="#EC4899"
                      strokeWidth={3}
                      dot={false}
                      activeDot={{ r: 5, fill: '#EC4899', stroke: '#FFFFFF', strokeWidth: 2 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}

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
              <div style={{ textAlign: 'center', padding: '24px', color: 'var(--text-muted)' }}>
                <Smartphone size={26} style={{ opacity: 0.4, margin: '0 auto 8px' }} />
                <p style={{ fontSize: '0.84rem', margin: 0 }}>
                  No mobile screen time records for today. Click &quot;Enter Mobile Screen Time&quot; to log apps like Instagram, YouTube, etc.
                </p>
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
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                  <label style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                    Select App:
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowNewAppInline((v) => !v)}
                    style={{
                      background: 'rgba(16, 185, 129, 0.12)',
                      border: '1px solid rgba(16, 185, 129, 0.3)',
                      color: '#10B981',
                      borderRadius: '6px',
                      padding: '2px 8px',
                      fontSize: '0.72rem',
                      fontWeight: 700,
                      cursor: 'pointer',
                    }}
                  >
                    {showNewAppInline ? 'Close' : '+ Add New App'}
                  </button>
                </div>

                {showNewAppInline && (
                  <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
                    <input
                      type="text"
                      placeholder="New app name..."
                      value={newAppInlineName}
                      onChange={(e) => setNewAppInlineName(e.target.value)}
                      style={{ flex: 1, padding: '8px 10px', borderRadius: '8px', background: 'var(--surface-bg)', border: '1px solid var(--border-color)', color: 'var(--text-primary)', fontSize: '0.82rem' }}
                    />
                    <button
                      type="button"
                      onClick={handleAddInlineApp}
                      style={{ padding: '8px 12px', borderRadius: '8px', background: '#10B981', color: '#fff', fontWeight: 700, fontSize: '0.78rem', border: 'none', cursor: 'pointer' }}
                    >
                      Save
                    </button>
                  </div>
                )}

                <CustomSelect
                  value={screenTimeForm.appName}
                  onChange={(val) => setScreenTimeForm({ ...screenTimeForm, appName: val })}
                  options={dynamicApps.map((appObj) => ({
                    value: appObj.appName,
                    label: appObj.appName,
                    color: appObj.color || '#EC4899',
                  }))}
                  placeholder="-- Select an App --"
                  searchPlaceholder="Search saved apps..."
                  showSearch={dynamicApps.length > 4}
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
