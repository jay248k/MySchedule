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
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '5px',
            fontSize: '0.74rem',
            fontWeight: 800,
            padding: '3px 8px',
            borderRadius: '6px',
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
          <div style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{val}</div>
          <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)', marginTop: '2px' }}>
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
        <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
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
            style={{
              padding: '2px 8px',
              borderRadius: '999px',
              fontSize: '0.72rem',
              fontWeight: 800,
              textTransform: 'uppercase',
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
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', minWidth: '140px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.74rem' }}>
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
        <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
          {val}
        </span>
      ),
    },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
      {/* 1. Module Header */}
      <div
        className="card"
        style={{
          padding: '12px 18px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '10px',
          borderRadius: 'var(--radius-md)',
          background: 'var(--card-bg)',
          border: '1px solid var(--border-color)',
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
                padding: '2px 8px',
                borderRadius: '5px',
                background: '#EF4444',
                color: '#FFFFFF',
                fontSize: '0.68rem',
                fontWeight: 800,
                textTransform: 'uppercase',
                letterSpacing: '0.04em',
              }}
            >
              <Flag size={11} fill="#FFFFFF" />
              Red Flag Diagnostic Hub
            </span>
            <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>
              Lag Detection · Recovery Management
            </span>
          </div>
          <h1 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-primary)', marginTop: '4px', margin: 0 }}>
            Red Flag & Schedule Lag Analytics
          </h1>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '2px', margin: 0 }}>
            Detect inactive time slots, stalled categories, and lagging goals. Track recovery progress in real time.
          </p>
        </div>

        {/* View Switcher Tabs */}
        <div
          style={{
            display: 'flex',
            background: 'var(--page-bg)',
            border: '1px solid var(--border-color)',
            borderRadius: 'var(--radius-md)',
            padding: '2px',
            gap: '2px',
          }}
        >
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
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
          gap: '10px',
        }}
      >
        <div className="card" style={{ padding: '10px 14px', borderLeft: '3px solid #EF4444' }}>
          <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 700 }}>
            ACTIVE RED FLAGS
          </div>
          <div style={{ fontSize: '1.35rem', fontWeight: 900, color: activeFlags.length > 0 ? '#EF4444' : '#10B981', marginTop: '2px' }}>
            {activeFlags.length}
          </div>
          <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
            {criticalCount} critical · {highCount} high
          </div>
        </div>

        <div className="card" style={{ padding: '10px 14px', borderLeft: '3px solid #10B981' }}>
          <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 700 }}>
            RECOVERED / RESOLVED
          </div>
          <div style={{ fontSize: '1.35rem', fontWeight: 900, color: '#10B981', marginTop: '2px' }}>
            {recoveredFlags.length}
          </div>
          <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
            Safely cleared from lag status
          </div>
        </div>

        <div className="card" style={{ padding: '10px 14px', borderLeft: '3px solid #3B82F6' }}>
          <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 700 }}>
            SCHEDULE HEALTH SCORE
          </div>
          <div style={{ fontSize: '1.35rem', fontWeight: 900, color: healthScore >= 80 ? '#10B981' : healthScore >= 50 ? '#F59E0B' : '#EF4444', marginTop: '2px' }}>
            {healthScore}%
          </div>
          <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
            {healthScore >= 80 ? 'Robust momentum' : 'Lag interventions needed'}
          </div>
        </div>

        <div className="card" style={{ padding: '10px 14px', borderLeft: '3px solid #8B5CF6' }}>
          <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 700 }}>
            DATE CONTEXT
          </div>
          <div style={{ fontSize: '1rem', fontWeight: 800, marginTop: '2px', color: 'var(--text-primary)' }}>
            {isToday ? 'Today' : formatDate(activeDate, { month: 'short', day: 'numeric' })}
          </div>
          <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
            {formatDate(activeDate, { weekday: 'long' })}
          </div>
        </div>
      </div>

      {/* 3. TAB CONTENT */}

      {/* TAB A: ACTIVE RED FLAGS (COMPACT GRID CARDS) */}
      {activeTab === 'active' && (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: activeFlags.length === 0 ? '1fr' : 'repeat(auto-fill, minmax(420px, 1fr))',
            gap: '12px',
          }}
        >
          {activeFlags.length === 0 ? (
            <div
              className="card"
              style={{
                padding: '36px 20px',
                textAlign: 'center',
                background: 'rgba(16, 185, 129, 0.05)',
                border: '1.5px dashed rgba(16, 185, 129, 0.3)',
                borderRadius: 'var(--radius-lg)',
              }}
            >
              <CheckCircle2 size={36} color="#10B981" style={{ margin: '0 auto 10px' }} />
              <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
                Zero Active Red Flags!
              </h3>
              <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
                All scheduled time slots, categories, and goals are on track. No schedule lags detected.
              </p>
            </div>
          ) : (
            activeFlags.map((flag) => (
              <div
                key={flag.id}
                className="card"
                style={{
                  padding: '12px 16px',
                  borderRadius: '12px',
                  border: '1px solid rgba(239, 68, 68, 0.35)',
                  borderLeft: '4px solid #EF4444',
                  background: 'var(--card-bg)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '8px',
                  boxShadow: '0 2px 8px rgba(239, 68, 68, 0.05)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div
                      style={{
                        width: '36px',
                        height: '36px',
                        borderRadius: '10px',
                        background: 'rgba(239, 68, 68, 0.15)',
                        color: '#EF4444',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                      }}
                    >
                      <Flag size={18} fill="#EF4444" />
                    </div>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <h4 style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
                          {flag.title}
                        </h4>
                        <span
                          style={{
                            fontSize: '0.68rem',
                            fontWeight: 800,
                            padding: '2px 8px',
                            borderRadius: '999px',
                            background: flag.severity === 'critical' ? 'rgba(239, 68, 68, 0.2)' : 'rgba(245, 158, 11, 0.2)',
                            color: flag.severity === 'critical' ? '#EF4444' : '#F59E0B',
                            textTransform: 'uppercase',
                          }}
                        >
                          {flag.severity}
                        </span>
                      </div>
                      <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                        {flag.typeLabel} · {flag.area}
                      </div>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    {flag.taskId && (
                      <button
                        type="button"
                        className="btn btn-sm btn-ghost"
                        onClick={() => handleResolveTask(flag)}
                        style={{
                          fontSize: '0.8rem',
                          fontWeight: 700,
                          color: '#10B981',
                          border: '1px solid rgba(16, 185, 129, 0.3)',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                        }}
                      >
                        <CheckCircle2 size={14} /> Mark Completed
                      </button>
                    )}

                    <button
                      type="button"
                      className="btn btn-sm btn-primary"
                      onClick={() => handleStartCatchUp(flag)}
                      style={{
                        fontSize: '0.8rem',
                        fontWeight: 800,
                        background: '#EF4444',
                        borderColor: '#EF4444',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                      }}
                    >
                      <Play size={13} fill="#FFFFFF" /> Start Recovery Session
                    </button>
                  </div>
                </div>

                {/* Lag Reason Description */}
                <div
                  style={{
                    padding: '10px 14px',
                    borderRadius: '8px',
                    background: 'var(--page-bg)',
                    border: '1px solid var(--border-color)',
                    fontSize: '0.84rem',
                    color: 'var(--text-secondary)',
                    lineHeight: '1.5',
                  }}
                >
                  <strong style={{ color: '#EF4444' }}>Lag Reason:</strong> {flag.reason}
                </div>

                {/* Recovery Progress Bar */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-secondary)' }}>
                      Recovery Progress
                    </span>
                    <span
                      style={{
                        fontSize: '0.78rem',
                        fontWeight: 800,
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
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
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
          style={{
            display: 'grid',
            gridTemplateColumns: recoveredFlags.length === 0 ? '1fr' : 'repeat(auto-fill, minmax(380px, 1fr))',
            gap: '12px',
          }}
        >
          {recoveredFlags.length === 0 ? (
            <div
              className="card"
              style={{
                padding: '36px 20px',
                textAlign: 'center',
                color: 'var(--text-muted)',
                borderRadius: 'var(--radius-lg)',
              }}
            >
              No recovered lags yet. Work on active red flags to achieve 100% recovery!
            </div>
          ) : (
            recoveredFlags.map((flag) => (
              <div
                key={flag.id}
                className="card"
                style={{
                  padding: '10px 14px',
                  borderRadius: '12px',
                  border: '1px solid rgba(16, 185, 129, 0.35)',
                  borderLeft: '4px solid #10B981',
                  background: 'var(--card-bg)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  flexWrap: 'wrap',
                  gap: '8px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div
                    style={{
                      width: '34px',
                      height: '34px',
                      borderRadius: '8px',
                      background: 'rgba(16, 185, 129, 0.15)',
                      color: '#10B981',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <CheckCircle2 size={18} />
                  </div>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <strong style={{ fontSize: '0.96rem', color: 'var(--text-primary)' }}>
                        {flag.title}
                      </strong>
                      <span
                        style={{
                          fontSize: '0.7rem',
                          fontWeight: 800,
                          padding: '2px 8px',
                          borderRadius: '999px',
                          background: 'rgba(16, 185, 129, 0.18)',
                          color: '#10B981',
                        }}
                      >
                        100% RECOVERED
                      </span>
                    </div>
                    <div style={{ fontSize: '0.76rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                      {flag.typeLabel} · {flag.area} · Successfully resolved
                    </div>
                  </div>
                </div>

                <div style={{ minWidth: '150px' }}>
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
