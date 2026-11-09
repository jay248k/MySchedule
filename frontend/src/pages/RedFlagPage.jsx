import React, { useState, useMemo } from 'react';
import {
  Clock,
  Target,
  Tags,
  CheckCircle2,
  AlertTriangle,
  EyeOff,
  Check,
  Sparkles,
  ShieldAlert,
  Calendar,
  Layers,
  TrendingUp,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { getTodayDateString, formatDate } from '../utils/dateUtils';
import { analyzeRedFlags } from '../utils/redFlagEngine';
import { cookieUtils } from '../utils/cookieUtils';
import '../styles/pages/redflags.css';

const AVOIDED_STORAGE_KEY = 'myschedule_avoided_redflags';

export function RedFlagPage() {
  const {
    tasks = [],
    categories = [],
    goals = [],
    workSessions = [],
    selectedDate,
    showToast,
  } = useApp();

  const todayStr = getTodayDateString();
  const activeDate = selectedDate || todayStr;

  // Active filter tab: 'all' | 'slots' | 'categories' | 'goals' | 'avoided'
  const [activeTab, setActiveTab] = useState('all');

  // Avoided IDs stored exclusively in Cookies (NO localStorage)
  const [avoidedIds, setAvoidedIds] = useState(() => {
    try {
      const saved = cookieUtils.getJSON(AVOIDED_STORAGE_KEY);
      return new Set(Array.isArray(saved) ? saved : []);
    } catch {
      return new Set();
    }
  });

  // Toggle Avoid button handler
  const handleToggleAvoid = (flagId) => {
    setAvoidedIds((prev) => {
      const next = new Set(prev);
      const isCurrentlyAvoided = next.has(flagId);

      if (isCurrentlyAvoided) {
        next.delete(flagId);
        showToast({
          type: 'info',
          title: 'Avoidance Removed',
          message: 'This pattern is no longer marked as avoided.',
        });
      } else {
        next.add(flagId);
        showToast({
          type: 'warning',
          title: 'Marked as Avoided',
          message: 'Flag marked as an acknowledged/deliberate avoidance pattern.',
        });
      }

      // Persist strictly to cookies
      cookieUtils.setJSON(AVOIDED_STORAGE_KEY, Array.from(next), 365);
      return next;
    });
  };

  // Run behavioral lag analysis engine
  const analysis = useMemo(() => {
    return analyzeRedFlags({
      tasks,
      categories,
      goals,
      workSessions,
      avoidedIds,
      targetDate: activeDate,
    });
  }, [tasks, categories, goals, workSessions, avoidedIds, activeDate]);

  const {
    allFlags,
    slotFlags,
    categoryFlags,
    goalFlags,
    avoidedList,
    totalCount,
    avgRecovery,
    avoidedCount,
  } = analysis;

  // Filter flags based on active tab
  const displayedFlags = useMemo(() => {
    switch (activeTab) {
      case 'slots':
        return slotFlags;
      case 'categories':
        return categoryFlags;
      case 'goals':
        return goalFlags;
      case 'avoided':
        return avoidedList;
      case 'all':
      default:
        return allFlags;
    }
  }, [activeTab, allFlags, slotFlags, categoryFlags, goalFlags, avoidedList]);

  // Find most repeatedly missed slot
  const topMissedSlot = slotFlags.length > 0 ? slotFlags[0] : null;

  return (
    <div className="redflag-page-container">
      {/* 1. Header Card */}
      <div className="redflag-header-card card">
        <div>
          <div className="flex items-center gap-2">
            <span className="redflag-title-tag">
              <ShieldAlert size={12} />
              Behavioral Avoidance Hub
            </span>
            <span className="text-xs text-muted">
              Schedule Lag & Repeated Misses
            </span>
          </div>
          <h1 className="redflag-header-title">
            Red Flag & Schedule Lag Analytics
          </h1>
          <p className="redflag-header-sub">
            Shows repeatedly missed time slots, stalled categories, and avoided goals.
            Recovery marks calculate <strong>100% automatically from your completed tasks</strong> in those slots — without manual buttons.
          </p>
        </div>

        {/* Filter Tabs */}
        <div className="redflag-tabs-wrap">
          <button
            type="button"
            className={`redflag-tab-btn ${activeTab === 'all' ? 'is-active' : ''}`}
            onClick={() => setActiveTab('all')}
          >
            All Patterns ({allFlags.length})
          </button>
          <button
            type="button"
            className={`redflag-tab-btn ${activeTab === 'slots' ? 'is-active' : ''}`}
            onClick={() => setActiveTab('slots')}
          >
            <Clock size={13} />
            Missed Time Slots ({slotFlags.length})
          </button>
          <button
            type="button"
            className={`redflag-tab-btn ${activeTab === 'categories' ? 'is-active' : ''}`}
            onClick={() => setActiveTab('categories')}
          >
            <Tags size={13} />
            Avoided Categories ({categoryFlags.length})
          </button>
          <button
            type="button"
            className={`redflag-tab-btn ${activeTab === 'goals' ? 'is-active' : ''}`}
            onClick={() => setActiveTab('goals')}
          >
            <Target size={13} />
            Avoided Goals ({goalFlags.length})
          </button>
          <button
            type="button"
            className={`redflag-tab-btn ${activeTab === 'avoided' ? 'is-active' : ''}`}
            onClick={() => setActiveTab('avoided')}
          >
            <EyeOff size={13} />
            Marked as Avoided ({avoidedCount})
          </button>
        </div>
      </div>

      {/* 2. Executive KPI Metrics Ribbon */}
      <div className="redflag-kpi-grid">
        <div className="card redflag-kpi-card kpi-slots">
          <div className="redflag-kpi-label">Repeatedly Missed Slots</div>
          <div className="redflag-kpi-val" style={{ color: slotFlags.length > 0 ? '#EF4444' : '#10B981' }}>
            {slotFlags.length}
          </div>
          <div className="redflag-kpi-sub">
            {topMissedSlot ? `Top slot: ${topMissedSlot.slotKey} (${topMissedSlot.missedDates.length} days missed)` : 'Zero recurring slot misses'}
          </div>
        </div>

        <div className="card redflag-kpi-card kpi-domains">
          <div className="redflag-kpi-label">Avoided Categories & Goals</div>
          <div className="redflag-kpi-val" style={{ color: categoryFlags.length + goalFlags.length > 0 ? '#F59E0B' : '#10B981' }}>
            {categoryFlags.length + goalFlags.length}
          </div>
          <div className="redflag-kpi-sub">
            {categoryFlags.length} categories · {goalFlags.length} goals stalled
          </div>
        </div>

        <div className="card redflag-kpi-card kpi-recovery">
          <div className="redflag-kpi-label">Automated Recovery Score</div>
          <div
            className="redflag-kpi-val"
            style={{
              color: avgRecovery >= 80 ? '#10B981' : avgRecovery >= 50 ? '#38BDF8' : '#EF4444',
            }}
          >
            {avgRecovery}%
          </div>
          <div className="redflag-kpi-sub">
            Calculated strictly from completed tasks
          </div>
        </div>

        <div className="card redflag-kpi-card kpi-avoided">
          <div className="redflag-kpi-label">Marked As Avoided</div>
          <div className="redflag-kpi-val text-purple-400">
            {avoidedCount}
          </div>
          <div className="redflag-kpi-sub">
            User acknowledged avoidance patterns
          </div>
        </div>
      </div>

      {/* 3. Cards Grid */}
      {displayedFlags.length === 0 ? (
        <div className="redflag-empty-state card">
          <CheckCircle2 size={42} color="#10B981" className="mx-auto mb-3" />
          <h3 className="text-base font-extrabold text-primary m-0">
            {activeTab === 'avoided'
              ? 'No Avoided Patterns'
              : 'Zero Avoidance Patterns Detected!'}
          </h3>
          <p className="text-xs text-secondary mt-1 max-w-md mx-auto">
            {activeTab === 'avoided'
              ? 'You have not marked any time slots or categories as avoided. Click the "Avoid" button on any card to tag it.'
              : 'You have no recurring missed time slots or stalled categories. All scheduled work is completed on pace.'}
          </p>
        </div>
      ) : (
        <div className="redflag-cards-grid">
          {displayedFlags.map((flag) => {
            const isSlot = flag.type === 'time_slot';
            const isCategory = flag.type === 'category';
            const isGoal = flag.type === 'goal';
            const isAvoided = Boolean(flag.isAvoided);

            // Dynamic progress bar color
            const barColor =
              flag.recoveryProgress >= 100
                ? '#10B981'
                : flag.recoveryProgress >= 40
                ? '#38BDF8'
                : '#EF4444';

            return (
              <div
                key={flag.id}
                className={`redflag-item-card ${flag.isRecovered ? 'is-recovered' : ''} ${
                  isAvoided ? 'is-avoided-card' : ''
                }`}
              >
                {/* Card Header */}
                <div className="redflag-card-header">
                  <div className="redflag-card-icon-title">
                    <div className={`redflag-card-icon-box ${flag.type}`}>
                      {isSlot ? (
                        <Clock size={20} />
                      ) : isCategory ? (
                        <Tags size={20} />
                      ) : (
                        <Target size={20} />
                      )}
                    </div>
                    <div>
                      <h3 className="redflag-card-title">{flag.title}</h3>
                      <div className="redflag-card-meta">
                        <span>{flag.typeLabel}</span>
                        <span>•</span>
                        <span
                          className="font-extrabold uppercase px-1.5 py-0.2 rounded"
                          style={{
                            background:
                              flag.severity === 'critical'
                                ? 'rgba(239, 68, 68, 0.18)'
                                : 'rgba(245, 158, 11, 0.18)',
                            color: flag.severity === 'critical' ? '#EF4444' : '#F59E0B',
                            fontSize: '0.68rem',
                          }}
                        >
                          {flag.severity}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* ONLY ONE ACTION BUTTON: AVOID BUTTON */}
                  <button
                    type="button"
                    onClick={() => handleToggleAvoid(flag.id)}
                    className={`btn-avoid-toggle ${isAvoided ? 'is-avoided' : ''}`}
                    title={
                      isAvoided
                        ? 'Click to remove avoided status'
                        : 'Mark this pattern as deliberately avoided'
                    }
                  >
                    {isAvoided ? <Check size={13} /> : <EyeOff size={13} />}
                    {isAvoided ? 'Avoided' : 'Avoid'}
                  </button>
                </div>

                {/* Avoidance Details Box */}
                <div className="redflag-detail-box">
                  <div className="redflag-detail-label">
                    {isSlot
                      ? 'Missed Dates History'
                      : isCategory
                      ? 'Avoided Category Details'
                      : 'Milestone Status'}
                  </div>

                  {/* Missed Dates Chip List */}
                  {flag.missedDates && flag.missedDates.length > 0 && (
                    <div className="redflag-chips-list">
                      {flag.missedDates.slice(0, 8).map((dStr, idx) => (
                        <span key={idx} className="redflag-date-chip">
                          {dStr}
                        </span>
                      ))}
                      {flag.missedDates.length > 8 && (
                        <span className="text-xs text-muted font-bold self-center">
                          +{flag.missedDates.length - 8} more
                        </span>
                      )}
                    </div>
                  )}

                  <div className="text-xs text-secondary mt-0.5">
                    {flag.explanation}
                  </div>

                  {/* Associated Task Titles (if time slot) */}
                  {flag.taskTitles && flag.taskTitles.length > 0 && (
                    <div className="mt-1 flex flex-col gap-1">
                      <span className="text-[11px] font-bold text-muted">
                        Associated Tasks Avoided in this Slot:
                      </span>
                      {flag.taskTitles.map((tTitle, idx) => (
                        <div key={idx} className="redflag-task-item">
                          <span className="text-red-400">•</span>
                          <span className="truncate">{tTitle}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Automated Recovery Progress (Strictly measures real completed work) */}
                <div className="redflag-recovery-section">
                  <div className="redflag-recovery-head">
                    <span className="redflag-recovery-title">
                      <Sparkles size={13} color={barColor} />
                      Automated Recovery Progress
                    </span>
                    <span className="redflag-recovery-percent" style={{ color: barColor }}>
                      {flag.recoveryProgress}% {flag.isRecovered ? '• FULL MARKS' : ''}
                    </span>
                  </div>

                  {/* Visual Progress Bar */}
                  <div className="redflag-progress-track">
                    <div
                      className="redflag-progress-fill"
                      style={{
                        width: `${flag.recoveryProgress}%`,
                        background:
                          flag.recoveryProgress >= 100
                            ? 'linear-gradient(90deg, #10B981 0%, #059669 100%)'
                            : flag.recoveryProgress >= 40
                            ? 'linear-gradient(90deg, #38BDF8 0%, #0284C7 100%)'
                            : 'linear-gradient(90deg, #EF4444 0%, #DC2626 100%)',
                      }}
                    />
                  </div>

                  <div className="redflag-recovery-caption">
                    {isSlot ? (
                      flag.isRecovered ? (
                        <span className="text-emerald-400 font-bold">
                          ✓ Full marks achieved: completed tasks across {flag.completedDaysCount} days in this slot.
                        </span>
                      ) : (
                        <span>
                          {flag.completedDaysCount} of {flag.requiredRecoveryDays} recovery days completed.
                          Work {flag.requiredRecoveryDays - flag.completedDaysCount} more days in this {flag.slotKey} slot to earn 100% full recovery marks.
                        </span>
                      )
                    ) : isCategory ? (
                      flag.isRecovered ? (
                        <span className="text-emerald-400 font-bold">
                          ✓ Category fully recovered: healthy velocity achieved.
                        </span>
                      ) : (
                        <span>
                          {flag.completedCount} of {flag.totalTasks} tasks completed in {flag.categoryName}.
                          Complete remaining tasks to advance recovery.
                        </span>
                      )
                    ) : (
                      <span>
                        Milestone progress is at {flag.progress}%. Complete milestone tasks to clear flag.
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default RedFlagPage;
