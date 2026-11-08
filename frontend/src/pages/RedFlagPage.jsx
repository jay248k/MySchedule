import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Flag,
  AlertTriangle,
  Clock,
  Target,
  Tags,
  CheckCircle2,
  Play,
  RotateCcw,
  Sparkles,
  Calendar,
  FileSpreadsheet,
  FileText,
  Printer,
  TrendingUp,
  Activity,
  Layers,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { getTodayDateString, formatDate } from '../utils/dateUtils';
import { analyzeRedFlags } from '../utils/redFlagEngine';
import { ExcelReportTable } from '../components/reports/ExcelReportTable';
import { ProgressBar } from '../components/common/ProgressRing';
import '../styles/pages/redflags.css';

export function RedFlagPage() {
  const navigate = useNavigate();
  const {
    tasks = [],
    categories = [],
    goals = [],
    workSessions = [],
    activeWorkSession,
    startWorkSession,
    toggleTaskComplete,
    openModal,
    selectedDate,
    setSelectedDate,
    showToast,
  } = useApp();

  const todayStr = getTodayDateString();
  const activeDate = selectedDate || todayStr;
  const isToday = activeDate === todayStr;

  const [activeTab, setActiveTab] = useState('active'); // 'active', 'recovered', 'report'

  // Run real-time lag detection engine
  const analysis = analyzeRedFlags({
    tasks,
    categories,
    goals,
    workSessions,
    activeWorkSession,
    targetDate: activeDate,
  });

  const {
    activeFlags,
    recoveredFlags,
    allFlags,
    healthScore,
    criticalCount,
    highCount,
  } = analysis;

  // Handle Recovery Actions
  const handleStartCatchUp = (flag) => {
    if (flag.taskId) {
      startWorkSession({
        taskId: flag.taskId,
        taskTitle: flag.taskTitle,
        categoryId: flag.categoryId,
        categoryName: flag.categoryName,
      });
      showToast({
        type: 'info',
        title: 'Work Session Started',
        message: `Tracking recovery work for: ${flag.taskTitle}`,
      });
      navigate('/work-tracker');
    } else {
      navigate('/work-tracker');
    }
  };

  const handleResolveTask = (flag) => {
    if (flag.taskId) {
      toggleTaskComplete(flag.taskId);
      showToast({
        type: 'success',
        title: 'Task Marked Completed',
        message: `Lag resolved! ${flag.taskTitle} reached 100% recovery.`,
      });
    }
  };

  // Excel-style columns for Red Flag Report
  const redFlagColumns = [
    {
      key: 'typeLabel',
      label: 'Lag Type',
      width: '140px',
      render: (val, row) => (
        <span
          className="inline-flex items-center gap-1 text-xs font-extrabold py-0.5 px-2 rounded"
          style={{
            background:
              row.type === 'time_slot'
                ? 'rgba(239, 68, 68, 0.14)'
                : row.type === 'category'
                ? 'rgba(245, 158, 11, 0.14)'
                : 'rgba(59, 130, 246, 0.14)',
            color:
              row.type === 'time_slot'
                ? '#EF4444'
                : row.type === 'category'
                ? '#F59E0B'
                : '#3B82F6',
          }}
        >
          {row.type === 'time_slot' ? <Clock size={11} /> : row.type === 'category' ? <Tags size={11} /> : <Target size={11} />}
          {val}
        </span>
      ),
    },
    {
      key: 'title',
      label: 'Flag Title & Area',
      render: (val, row) => (
        <div>
          <div className="font-bold text-primary">{val}</div>
          <div className="text-xs text-muted mt-0.5">
            {row.area}
          </div>
        </div>
      ),
    },
    {
      key: 'reason',
      label: 'Detected Lag Reason',
      wrap: true,
      maxWidth: '380px',
      render: (val) => (
        <span className="text-xs text-secondary">
          {val}
        </span>
      ),
    },
    {
      key: 'severity',
      label: 'Severity',
      width: '100px',
      render: (val) => {
        const isCritical = val === 'critical';
        return (
          <span
            className="py-0.5 px-2 rounded-full text-xs font-extrabold uppercase"
            style={{
              background: isCritical ? 'rgba(239, 68, 68, 0.2)' : 'rgba(245, 158, 11, 0.2)',
              color: isCritical ? '#EF4444' : '#F59E0B',
              border: isCritical ? '1px solid rgba(239, 68, 68, 0.4)' : '1px solid rgba(245, 158, 11, 0.4)',
            }}
          >
            {val}
          </span>
        );
      },
    },
    {
      key: 'recoveryProgress',
      label: 'Recovery Progress',
      width: '180px',
      render: (val, row) => (
        <div className="flex flex-col gap-1 min-w-[140px]">
          <div className="flex justify-between text-xs">
            <span style={{ fontWeight: 700, color: val >= 100 ? '#10B981' : val > 0 ? '#38BDF8' : '#EF4444' }}>
              {val}% {row.isRecovered ? 'Recovered' : val > 0 ? 'In Progress' : 'Unaddressed'}
            </span>
          </div>
          <ProgressBar progress={val} color={val >= 100 ? '#10B981' : val > 0 ? '#38BDF8' : '#EF4444'} />
        </div>
      ),
    },
    {
      key: 'actionRequired',
      label: 'Recommended Action',
      render: (val) => (
        <span className="text-xs text-secondary">
          {val}
        </span>
      ),
    },
  ];

  return (
    <div className="redflag-page-container">
      {/* 1. Module Header */}
      <div className="redflag-header-card card">
        <div>
          <div className="flex items-center gap-2">
            <span className="redflag-title-tag">
              <Flag size={11} fill="#FFFFFF" />
              Red Flag Diagnostic Hub
            </span>
            <span className="text-xs text-muted">
              Lag Detection · Recovery Management
            </span>
          </div>
          <h1 className="redflag-header-title">
            Red Flag & Schedule Lag Analytics
          </h1>
          <p className="redflag-header-sub">
            Detect inactive time slots, stalled categories, and lagging goals. Track recovery progress in real time.
          </p>
        </div>

        {/* View Switcher Tabs */}
        <div className="redflag-tabs-wrap">
          <button
            type="button"
            className={`btn btn-sm ${activeTab === 'active' ? 'btn-primary' : 'btn-ghost'}`}
            onClick={() => setActiveTab('active')}
            style={{ display: 'flex', alignItems: 'center', gap: '5px', fontWeight: 700, fontSize: '0.78rem', height: '28px', padding: '0 10px' }}
          >
            <AlertTriangle size={13} color="#EF4444" />
            Active ({activeFlags.length})
          </button>

          <button
            type="button"
            className={`btn btn-sm ${activeTab === 'recovered' ? 'btn-primary' : 'btn-ghost'}`}
            onClick={() => setActiveTab('recovered')}
            style={{ display: 'flex', alignItems: 'center', gap: '5px', fontWeight: 700, fontSize: '0.78rem', height: '28px', padding: '0 10px' }}
          >
            <CheckCircle2 size={13} color="#10B981" />
            Recovered ({recoveredFlags.length})
          </button>

          <button
            type="button"
            className={`btn btn-sm ${activeTab === 'report' ? 'btn-primary' : 'btn-ghost'}`}
            onClick={() => setActiveTab('report')}
            style={{ display: 'flex', alignItems: 'center', gap: '5px', fontWeight: 700, fontSize: '0.78rem', height: '28px', padding: '0 10px' }}
          >
            <FileSpreadsheet size={13} />
            Lag Report
          </button>
        </div>
      </div>

      {/* 2. Real-Time Lag Diagnostics Health Ribbon */}
      <div className="redflag-kpi-grid">
        <div className="card redflag-kpi-card kpi-red">
          <div className="redflag-kpi-label">
            ACTIVE RED FLAGS
          </div>
          <div
            className="redflag-kpi-val"
            style={{ color: activeFlags.length > 0 ? '#EF4444' : '#10B981' }}
          >
            {activeFlags.length}
          </div>
          <div className="redflag-kpi-sub">
            {criticalCount} critical · {highCount} high
          </div>
        </div>

        <div className="card redflag-kpi-card kpi-green">
          <div className="redflag-kpi-label">
            RECOVERED / RESOLVED
          </div>
          <div className="redflag-kpi-val text-emerald-500">
            {recoveredFlags.length}
          </div>
          <div className="redflag-kpi-sub">
            Safely cleared from lag status
          </div>
        </div>

        <div className="card redflag-kpi-card kpi-blue">
          <div className="redflag-kpi-label">
            SCHEDULE HEALTH SCORE
          </div>
          <div
            className="redflag-kpi-val"
            style={{ color: healthScore >= 80 ? '#10B981' : healthScore >= 50 ? '#F59E0B' : '#EF4444' }}
          >
            {healthScore}%
          </div>
          <div className="redflag-kpi-sub">
            {healthScore >= 80 ? 'Robust momentum' : 'Lag interventions needed'}
          </div>
        </div>

        <div className="card redflag-kpi-card kpi-purple">
          <div className="redflag-kpi-label">
            DATE CONTEXT
          </div>
          <div className="text-base font-extrabold mt-0.5 text-primary">
            {isToday ? 'Today' : formatDate(activeDate, { month: 'short', day: 'numeric' })}
          </div>
          <div className="redflag-kpi-sub">
            {formatDate(activeDate, { weekday: 'long' })}
          </div>
        </div>
      </div>

      {/* 3. TAB CONTENT */}

      {/* TAB A: ACTIVE RED FLAGS (COMPACT GRID CARDS) */}
      {activeTab === 'active' && (
        <div
          className="redflag-active-grid"
          style={{
            gridTemplateColumns: activeFlags.length === 0 ? '1fr' : 'repeat(auto-fill, minmax(420px, 1fr))',
          }}
        >
          {activeFlags.length === 0 ? (
            <div className="card p-9 text-center rounded-lg border border-dashed border-emerald-500/30 bg-emerald-500/5">
              <CheckCircle2 size={36} color="#10B981" className="mx-auto mb-2.5" />
              <h3 className="text-base font-extrabold text-primary m-0">
                Zero Active Red Flags!
              </h3>
              <p className="text-xs text-secondary mt-1">
                All scheduled time slots, categories, and goals are on track. No schedule lags detected.
              </p>
            </div>
          ) : (
            activeFlags.map((flag) => (
              <div key={flag.id} className="card redflag-card-item">
                <div className="flex items-start justify-between flex-wrap gap-3">
                  <div className="flex items-center gap-2.5">
                    <div className="redflag-avatar-icon">
                      <Flag size={18} fill="#EF4444" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="text-base font-extrabold text-primary m-0">
                          {flag.title}
                        </h4>
                        <span
                          className="text-xs font-extrabold py-0.5 px-2 rounded-full uppercase"
                          style={{
                            background: flag.severity === 'critical' ? 'rgba(239, 68, 68, 0.2)' : 'rgba(245, 158, 11, 0.2)',
                            color: flag.severity === 'critical' ? '#EF4444' : '#F59E0B',
                          }}
                        >
                          {flag.severity}
                        </span>
                      </div>
                      <div className="text-xs text-muted mt-0.5">
                        {flag.typeLabel} · {flag.area}
                      </div>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-2 items-center">
                    {flag.taskId && (
                      <button
                        type="button"
                        className="btn btn-sm btn-ghost flex items-center gap-1.5 text-xs font-bold text-emerald-500 border border-emerald-500/30"
                        onClick={() => handleResolveTask(flag)}
                      >
                        <CheckCircle2 size={14} /> Mark Completed
                      </button>
                    )}

                    <button
                      type="button"
                      className="btn btn-sm btn-primary flex items-center gap-1.5 text-xs font-extrabold bg-red-500 border-red-500"
                      onClick={() => handleStartCatchUp(flag)}
                    >
                      <Play size={13} fill="#FFFFFF" /> Start Recovery Session
                    </button>
                  </div>
                </div>

                {/* Lag Reason Description */}
                <div className="redflag-reason-box">
                  <strong className="text-red-500">Lag Reason:</strong> {flag.reason}
                </div>

                {/* Recovery Progress Bar */}
                <div className="flex flex-col gap-1.5">
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-bold text-secondary">
                      Recovery Progress
                    </span>
                    <span
                      className="font-extrabold"
                      style={{
                        color: flag.recoveryProgress > 0 ? '#38BDF8' : '#EF4444',
                      }}
                    >
                      {flag.recoveryProgress}% · {flag.recoveryStatus}
                    </span>
                  </div>
                  <ProgressBar
                    progress={flag.recoveryProgress}
                    color={flag.recoveryProgress >= 100 ? '#10B981' : flag.recoveryProgress > 0 ? '#38BDF8' : '#EF4444'}
                  />
                  <div className="text-xs text-muted">
                    💡 <em>Once this work reaches 100% completion or consistent velocity, it will automatically clear from Red Flags.</em>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* TAB B: RECOVERED & RESOLVED FLAGS */}
      {activeTab === 'recovered' && (
        <div
          className="grid gap-3"
          style={{
            gridTemplateColumns: recoveredFlags.length === 0 ? '1fr' : 'repeat(auto-fill, minmax(380px, 1fr))',
          }}
        >
          {recoveredFlags.length === 0 ? (
            <div className="card p-9 text-center text-muted rounded-lg">
              No recovered lags yet. Work on active red flags to achieve 100% recovery!
            </div>
          ) : (
            recoveredFlags.map((flag) => (
              <div key={flag.id} className="card redflag-recovered-card">
                <div className="flex items-center gap-3">
                  <div className="w-8.5 h-8.5 rounded-lg bg-emerald-500/15 text-emerald-500 flex items-center justify-center">
                    <CheckCircle2 size={18} />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <strong className="text-sm text-primary">
                        {flag.title}
                      </strong>
                      <span className="text-xs font-extrabold py-0.5 px-2 rounded-full bg-emerald-500/20 text-emerald-500">
                        100% RECOVERED
                      </span>
                    </div>
                    <div className="text-xs text-muted mt-0.5">
                      {flag.typeLabel} · {flag.area} · Successfully resolved
                    </div>
                  </div>
                </div>

                <div className="min-w-[150px]">
                  <ProgressBar progress={100} color="#10B981" />
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* TAB C: EXCEL-STYLE SPREADSHEET LAG REPORT */}
      {activeTab === 'report' && (
        <ExcelReportTable
          title={`Red Flag Lag Diagnostic Report - ${formatDate(activeDate)}`}
          summaryCards={[
            { label: 'Total Lag Events', value: allFlags.length, color: '#3B82F6' },
            { label: 'Active Red Flags', value: activeFlags.length, color: '#EF4444' },
            { label: 'Recovered Lags', value: recoveredFlags.length, color: '#10B981' },
            { label: 'Schedule Health', value: `${healthScore}%`, color: healthScore >= 80 ? '#10B981' : '#F59E0B' },
          ]}
          columns={redFlagColumns}
          data={allFlags}
          exportFileName={`Red_Flag_Lag_Report_${activeDate}`}
          sheetName="RedFlags"
        />
      )}
    </div>
  );
}
