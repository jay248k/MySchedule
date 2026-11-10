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
  Search,
  LayoutGrid,
  List,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { getTodayDateString } from '../utils/dateUtils';
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

  // View state: 'cards' | 'dense'
  const [viewMode, setViewMode] = useState('cards');

  // Filter tab: 'all' | 'slots' | 'categories' | 'goals' | 'avoided'
  const [activeTab, setActiveTab] = useState('all');

  // Search filter
  const [searchQuery, setSearchQuery] = useState('');

  // Avoided IDs stored exclusively in Cookies (NO localStorage)
  const [avoidedIds, setAvoidedIds] = useState(() => {
    try {
      const saved = cookieUtils.getJSON(AVOIDED_STORAGE_KEY);
      return new Set(Array.isArray(saved) ? saved : []);
    } catch {
      return new Set();
    }
  });

  // Toggle Avoid button handler (The only button allowed on this page)
  const handleToggleAvoid = (flagId) => {
    setAvoidedIds((prev) => {
      const next = new Set(prev);
      const isCurrentlyAvoided = next.has(flagId);

      if (isCurrentlyAvoided) {
        next.delete(flagId);
        showToast({
          type: 'info',
          title: 'Avoidance Cleared',
          message: 'Flag removed from avoided patterns.',
        });
      } else {
        next.add(flagId);
        showToast({
          type: 'warning',
          title: 'Marked as Avoided',
          message: 'Flag acknowledged as intentional avoidance.',
        });
      }

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
    avgRecovery,
    avoidedCount,
  } = analysis;

  // Filter flags based on active tab and search query
  const displayedFlags = useMemo(() => {
    let list = allFlags;
    if (activeTab === 'slots') list = slotFlags;
    else if (activeTab === 'categories') list = categoryFlags;
    else if (activeTab === 'goals') list = goalFlags;
    else if (activeTab === 'avoided') list = avoidedList;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter(
        (f) =>
          (f.title || '').toLowerCase().includes(q) ||
          (f.slotKey || '').toLowerCase().includes(q) ||
          (f.categoryName || '').toLowerCase().includes(q) ||
          (f.taskTitles && f.taskTitles.some((t) => t.toLowerCase().includes(q)))
      );
    }

    return list;
  }, [activeTab, searchQuery, allFlags, slotFlags, categoryFlags, goalFlags, avoidedList]);

  const topMissedSlot = slotFlags.length > 0 ? slotFlags[0] : null;

  return (
    <div className="redflag-page-container">
      {/* 1. Compact Header */}
      <div className="redflag-header-card card">
        <div>
          <div className="redflag-title-wrap">
            <span className="redflag-title-tag">
              <ShieldAlert size={11} />
              Behavioral Avoidance Hub
            </span>
            <h1 className="redflag-header-title">
              Red Flag & Schedule Lag Analytics
            </h1>
          </div>
          <p className="redflag-header-sub">
            Shows repeatedly missed time slots, stalled categories, and avoided goals. Recovery marks calculate <strong>100% automatically from your completed tasks</strong> in those slots.
          </p>
        </div>
      </div>

      {/* 2. Controls & Filter Bar */}
      <div className="redflag-controls-bar">
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
            <Clock size={12} />
            Missed Slots ({slotFlags.length})
          </button>
          <button
            type="button"
            className={`redflag-tab-btn ${activeTab === 'categories' ? 'is-active' : ''}`}
            onClick={() => setActiveTab('categories')}
          >
            <Tags size={12} />
            Categories ({categoryFlags.length})
          </button>
          <button
            type="button"
            className={`redflag-tab-btn ${activeTab === 'goals' ? 'is-active' : ''}`}
            onClick={() => setActiveTab('goals')}
          >
            <Target size={12} />
            Goals ({goalFlags.length})
          </button>
          <button
            type="button"
            className={`redflag-tab-btn ${activeTab === 'avoided' ? 'is-active' : ''}`}
            onClick={() => setActiveTab('avoided')}
          >
            <EyeOff size={12} />
            Avoided ({avoidedCount})
          </button>
        </div>

        {/* Search & View Switcher */}
        <div className="redflag-right-tools">
          <div className="redflag-search-box">
            <Search size={12} color="var(--text-muted)" />
            <input
              type="text"
              placeholder="Search patterns..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <div className="redflag-view-toggle">
            <button
              type="button"
              className={`redflag-view-btn ${viewMode === 'cards' ? 'is-active' : ''}`}
              onClick={() => setViewMode('cards')}
              title="Compact Cards View"
            >
              <LayoutGrid size={13} />
            </button>
            <button
              type="button"
              className={`redflag-view-btn ${viewMode === 'dense' ? 'is-active' : ''}`}
              onClick={() => setViewMode('dense')}
              title="Dense List View"
            >
              <List size={13} />
            </button>
          </div>
        </div>
      </div>

      {/* 3. Compact KPI Ribbon */}
      <div className="redflag-kpi-grid">
        <div className="card redflag-kpi-card kpi-slots">
          <div className="redflag-kpi-label">Repeatedly Missed Slots</div>
          <div className="redflag-kpi-val" style={{ color: slotFlags.length > 0 ? '#EF4444' : '#10B981' }}>
            {slotFlags.length}
          </div>
          <div className="redflag-kpi-sub">
            {topMissedSlot ? `Top: ${topMissedSlot.slotKey} (${topMissedSlot.missedDates.length}d missed)` : 'Zero recurring slot misses'}
          </div>
        </div>

        <div className="card redflag-kpi-card kpi-domains">
          <div className="redflag-kpi-label">Avoided Categories & Goals</div>
          <div className="redflag-kpi-val" style={{ color: categoryFlags.length + goalFlags.length > 0 ? '#F59E0B' : '#10B981' }}>
            {categoryFlags.length + goalFlags.length}
          </div>
          <div className="redflag-kpi-sub">
            {categoryFlags.length} categories · {goalFlags.length} goals
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
            Strictly measures completed tasks
          </div>
        </div>

        <div className="card redflag-kpi-card kpi-avoided">
          <div className="redflag-kpi-label">Marked as Avoided</div>
          <div className="redflag-kpi-val text-purple-400">
            {avoidedCount}
          </div>
          <div className="redflag-kpi-sub">
            User acknowledged patterns
          </div>
        </div>
      </div>

      {/* 4. Content Area: Cards or Dense List */}
      {displayedFlags.length === 0 ? (
        <div className="redflag-empty-state card">
          <CheckCircle2 size={32} color="#10B981" className="mx-auto mb-2" />
          <h3 className="text-sm font-extrabold text-primary m-0">
            {activeTab === 'avoided'
              ? 'No Avoided Patterns'
              : 'Zero Avoidance Patterns Detected!'}
          </h3>
          <p className="text-xs text-secondary mt-1 max-w-sm mx-auto">
            {activeTab === 'avoided'
              ? 'You have not marked any time slots or categories as avoided.'
              : 'No recurring missed time slots or stalled categories detected. All scheduled work is completed on pace.'}
          </p>
        </div>
      ) : viewMode === 'dense' ? (
        /* ========================================================================= */
        /* VIEW A: DENSE SINGLE-LINE LIST VIEW (Maximum Space-Efficiency)            */
        /* ========================================================================= */
        <div className="redflag-dense-list">
          {displayedFlags.map((flag) => {
            const isSlot = flag.type === 'time_slot';
            const isCategory = flag.type === 'category';
            const isAvoided = Boolean(flag.isAvoided);
            const barColor =
              flag.recoveryProgress >= 100
                ? '#10B981'
                : flag.recoveryProgress >= 40
                ? '#38BDF8'
                : '#EF4444';

            return (
              <div
                key={flag.id}
                className={`redflag-dense-row ${flag.isRecovered ? 'is-recovered' : ''}`}
              >
                <div className="redflag-dense-left">
                  <div className={`redflag-mini-icon ${flag.type}`}>
                    {isSlot ? <Clock size={14} /> : isCategory ? <Tags size={14} /> : <Target size={14} />}
                  </div>
                  <span className="redflag-dense-title">{flag.title}</span>
                  {flag.missedDates && (
                    <span className="redflag-chip-missed">
                      {flag.missedDates.length}d missed
                    </span>
                  )}
                </div>

                <div className="redflag-dense-mid">
                  {flag.shortDates && flag.shortDates.length > 0 && (
                    <span className="text-xs text-muted truncate max-w-[200px]">
                      Missed: {flag.shortDates.slice(0, 3).join(', ')}
                      {flag.shortDates.length > 3 && ` +${flag.shortDates.length - 3}`}
                    </span>
                  )}
                  {flag.taskTitles && flag.taskTitles[0] && (
                    <span className="redflag-task-inline">
                      • {flag.taskTitles[0]}
                    </span>
                  )}
                </div>

                <div className="redflag-dense-right">
                  <div className="redflag-dense-bar-wrap">
                    <div className="redflag-slim-track">
                      <div
                        className="redflag-slim-fill"
                        style={{ width: `${flag.recoveryProgress}%`, background: barColor }}
                      />
                    </div>
                    <span
                      style={{
                        color: barColor,
                        fontSize: '0.72rem',
                        fontWeight: 800,
                        width: '32px',
                        textAlign: 'right',
                      }}
                    >
                      {flag.recoveryProgress}%
                    </span>
                  </div>

                  {/* ONLY ACTION BUTTON: AVOID BUTTON */}
                  <button
                    type="button"
                    onClick={() => handleToggleAvoid(flag.id)}
                    className={`btn-avoid-compact ${isAvoided ? 'is-avoided' : ''}`}
                    title={isAvoided ? 'Remove avoided status' : 'Mark as avoided'}
                  >
                    {isAvoided ? <Check size={11} /> : <EyeOff size={11} />}
                    {isAvoided ? 'Avoided' : 'Avoid'}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* ========================================================================= */
        /* VIEW B: COMPACT STREAMLINED CARDS (Sleek ~110px Cards)                   */
        /* ========================================================================= */
        <div className="redflag-cards-grid">
          {displayedFlags.map((flag) => {
            const isSlot = flag.type === 'time_slot';
            const isCategory = flag.type === 'category';
            const isAvoided = Boolean(flag.isAvoided);

            const barColor =
              flag.recoveryProgress >= 100
                ? '#10B981'
                : flag.recoveryProgress >= 40
                ? '#38BDF8'
                : '#EF4444';

            return (
              <div
                key={flag.id}
                className={`redflag-compact-card ${flag.isRecovered ? 'is-recovered' : ''} ${
                  isAvoided ? 'is-avoided-card' : ''
                }`}
              >
                {/* Row 1: Header + Avoid Button */}
                <div className="redflag-row-header">
                  <div className="redflag-row-title-area">
                    <div className={`redflag-mini-icon ${flag.type}`}>
                      {isSlot ? <Clock size={14} /> : isCategory ? <Tags size={14} /> : <Target size={14} />}
                    </div>
                    <span className="redflag-title-text" title={flag.title}>
                      {flag.title}
                    </span>
                    {flag.missedDates && (
                      <span className="redflag-chip-missed">
                        {flag.missedDates.length}d missed
                      </span>
                    )}
                  </div>

                  <div className="redflag-row-actions">
                    <span className="redflag-recovery-badge" style={{ color: barColor }}>
                      {flag.recoveryProgress}% {flag.isRecovered ? 'Marks' : ''}
                    </span>

                    {/* ONLY ONE ACTION BUTTON: AVOID BUTTON */}
                    <button
                      type="button"
                      onClick={() => handleToggleAvoid(flag.id)}
                      className={`btn-avoid-compact ${isAvoided ? 'is-avoided' : ''}`}
                      title={isAvoided ? 'Remove avoided status' : 'Mark as avoided'}
                    >
                      {isAvoided ? <Check size={11} /> : <EyeOff size={11} />}
                      {isAvoided ? 'Avoided' : 'Avoid'}
                    </button>
                  </div>
                </div>

                {/* Row 2: Missed Dates Streak & Task Context */}
                <div className="redflag-row-details">
                  <span className="redflag-streak-label">Dates:</span>
                  {flag.shortDates && flag.shortDates.slice(0, 4).map((dStr, idx) => (
                    <span key={idx} className="redflag-mini-chip">
                      {dStr}
                    </span>
                  ))}
                  {flag.shortDates && flag.shortDates.length > 4 && (
                    <span className="text-[11px] text-muted font-bold">
                      +{flag.shortDates.length - 4} more
                    </span>
                  )}
                  {flag.taskTitles && flag.taskTitles[0] && (
                    <span className="redflag-task-inline" title={flag.taskTitles.join(', ')}>
                      • {flag.taskTitles[0]}
                    </span>
                  )}
                </div>

                {/* Row 3: Slim Recovery Track & Micro-status */}
                <div className="redflag-row-recovery">
                  <div className="redflag-slim-track">
                    <div
                      className="redflag-slim-fill"
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

                  <div className="redflag-status-line">
                    <span>
                      {isSlot ? (
                        flag.isRecovered ? (
                          <span className="text-emerald-400 font-bold">✓ 100% full recovery marks</span>
                        ) : (
                          `${flag.completedDaysCount}/${flag.requiredRecoveryDays} recovery days completed`
                        )
                      ) : (
                        flag.recoveryStatus
                      )}
                    </span>
                    <span>⚡ Auto-calculated from completed tasks</span>
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
