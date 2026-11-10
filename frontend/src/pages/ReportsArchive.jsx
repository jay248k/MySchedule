import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Archive,
  ArrowLeft,
  ArrowRight,
  Calendar,
  Clock,
  Search,
  CheckCircle2,
  Trash2,
  LayoutGrid,
  List,
  CalendarDays,
  FileText,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  Download,
  Flame,
  TrendingUp,
  Sparkles,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { formatDate, getTodayDateString } from '../utils/dateUtils';
import '../styles/pages/reports-archive.css';

const MOOD_METADATA = {
  fire: { label: 'High Velocity', emoji: '🔥', color: '#F59E0B', bg: 'rgba(245, 158, 11, 0.12)', border: 'rgba(245, 158, 11, 0.28)' },
  productive: { label: 'High Velocity', emoji: '🔥', color: '#F59E0B', bg: 'rgba(245, 158, 11, 0.12)', border: 'rgba(245, 158, 11, 0.28)' },
  rocket: { label: 'On Track', emoji: '🚀', color: '#10B981', bg: 'rgba(16, 185, 129, 0.12)', border: 'rgba(16, 185, 129, 0.28)' },
  ontrack: { label: 'On Track', emoji: '🚀', color: '#10B981', bg: 'rgba(16, 185, 129, 0.12)', border: 'rgba(16, 185, 129, 0.28)' },
  coffee: { label: 'Steady Pace', emoji: '☕', color: '#3B82F6', bg: 'rgba(59, 130, 246, 0.12)', border: 'rgba(59, 130, 246, 0.28)' },
  steady: { label: 'Steady Pace', emoji: '☕', color: '#3B82F6', bg: 'rgba(59, 130, 246, 0.12)', border: 'rgba(59, 130, 246, 0.28)' },
  blocked: { label: 'Blocked', emoji: '⚠️', color: '#EF4444', bg: 'rgba(239, 68, 68, 0.12)', border: 'rgba(239, 68, 68, 0.28)' },
};

function parseBulletPoints(text) {
  if (!text) return [];
  return text
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.length > 0)
    .map((line) => line.replace(/^[•\-\*\d\.\)]\s*/, ''));
}

export function ReportsArchive() {
  const navigate = useNavigate();
  const {
    dailyReports = [],
    saveDailyReport,
    deleteDailyReport,
    tasks = [],
    categories = [],
    workSessions = [],
    activeWorkSession,
    showToast,
  } = useApp();
  const todayStr = getTodayDateString();

  const handleAutoCreateTodayReport = () => {
    const dayTasks = tasks.filter((t) => t.date === todayStr);
    const doneTasks = dayTasks.filter((t) => t.status === 'completed' || t.completed);

    const daySessions = (workSessions || []).filter(
      (s) => s.date === todayStr || s.startTime?.startsWith(todayStr)
    );

    let sessionSummary = '';
    let totalSessionMins = 0;
    if (daySessions.length > 0) {
      const parts = daySessions.map((s, idx) => {
        const start = s.startTime ? (s.startTime.includes('T') ? s.startTime.split('T')[1].substring(0, 5) : s.startTime) : 'Start';
        const end = s.endTime ? (s.endTime.includes('T') ? s.endTime.split('T')[1].substring(0, 5) : s.endTime) : 'Now';
        const durationMins = s.durationMinutes || (s.durationSeconds ? Math.round(s.durationSeconds / 60) : 60);
        totalSessionMins += durationMins;
        return `Timer #${idx + 1}: ${start} – ${end} (${Math.floor(durationMins / 60)}h ${durationMins % 60}m)`;
      });
      sessionSummary = parts.join('; ');
    } else if (activeWorkSession?.isRunning) {
      const start = activeWorkSession.startTime || 'Active';
      sessionSummary = `Active session running from ${start}`;
    }

    const calculatedHours = totalSessionMins > 0
      ? Number((totalSessionMins / 60).toFixed(1))
      : (doneTasks.length > 0 ? Number((doneTasks.length * 0.9).toFixed(1)) : 7.0);

    const completedBullets = doneTasks.length > 0
      ? doneTasks.map((t) => {
          const time = t.startTime ? ` (${t.startTime}${t.endTime ? ` - ${t.endTime}` : ''})` : '';
          const cat = categories.find((c) => c.id === t.categoryId)?.name || 'General';
          return `• ${t.title}${time} [${cat}]`;
        }).join('\n')
      : '• Completed scheduled sprint deliverables.';

    const nowTimeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    const autoReportText = [
      `Completed today's scheduled tasks: ${doneTasks.length}/${dayTasks.length} works finished (${dayTasks.length > 0 ? Math.round((doneTasks.length / dayTasks.length) * 100) : 100}% velocity).`,
      sessionSummary ? `Work Timer Sessions: ${sessionSummary} | Total Logged: ${calculatedHours} hrs.` : `Total Logged Hours: ${calculatedHours} hrs.`,
      `Accomplished Deliverables:\n${completedBullets}`,
      `Impediments & Blockers: None. Steady progress without major impediments.`,
    ].join('\n\n');

    saveDailyReport({
      date: todayStr,
      reportingTime: nowTimeStr,
      dailyReportText: autoReportText,
      title: `Daily Work Report - ${formatDate(todayStr)}`,
      accomplishments: autoReportText,
      highlights: `Delivered ${doneTasks.length}/${dayTasks.length} works on schedule.`,
      blockers: 'None. Steady progress without major impediments.',
      tomorrowPlan: 'Continue development on scheduled milestones.',
      hoursLogged: calculatedHours,
      mood: doneTasks.length >= Math.ceil(dayTasks.length * 0.7) ? 'fire' : 'rocket',
      tasksCompletedCount: doneTasks.length,
      tasksTotalCount: dayTasks.length,
    });

    showToast({
      type: 'success',
      title: 'Report Auto-Generated & Submitted! 🚀',
      message: `Submitted report for ${formatDate(todayStr)} with ${doneTasks.length} completed work(s) and timer logs.`,
    });
  };

  const [archiveView, setArchiveView] = useState('cards'); // 'cards', 'table', 'timeline'
  const [archiveSearch, setArchiveSearch] = useState('');
  const [archiveMoodFilter, setArchiveMoodFilter] = useState('all');
  const [expandedReportIds, setExpandedReportIds] = useState(new Set());
  const [showKPIs, setShowKPIs] = useState(true);

  const toggleExpandReport = (id) => {
    setExpandedReportIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  // Compute stats across all archived reports
  const totalReportsCount = dailyReports.length;
  const totalLoggedHours = dailyReports.reduce(
    (acc, r) => acc + (parseFloat(r.hoursLogged) || 0),
    0
  );
  const avgHoursPerReport =
    totalReportsCount > 0 ? (totalLoggedHours / totalReportsCount).toFixed(1) : '0.0';
  const highVelocityCount = dailyReports.filter(
    (r) => r.mood === 'fire' || r.mood === 'productive'
  ).length;

  // Filter reports
  const filteredReports = dailyReports.filter((report) => {
    const matchesMood =
      archiveMoodFilter === 'all' ||
      report.mood === archiveMoodFilter ||
      (archiveMoodFilter === 'fire' && report.mood === 'productive') ||
      (archiveMoodFilter === 'rocket' && report.mood === 'ontrack') ||
      (archiveMoodFilter === 'coffee' && report.mood === 'steady');

    if (!matchesMood) return false;

    if (!archiveSearch.trim()) return true;
    const q = archiveSearch.toLowerCase();
    const dateStr = (report.date || '').toLowerCase();
    const acc = (report.accomplishments || '').toLowerCase();
    const hl = (report.highlights || '').toLowerCase();
    const tomorrow = (report.tomorrowPlan || '').toLowerCase();
    return dateStr.includes(q) || acc.includes(q) || hl.includes(q) || tomorrow.includes(q);
  });

  // Export JSON handler
  const handleExportJSON = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(dailyReports, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `myschedule_reports_archive_${todayStr}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    showToast?.({
      type: 'success',
      title: 'Archive Exported',
      message: `Exported ${dailyReports.length} daily reports as JSON file.`,
    });
  };

  return (
    <div className="page-container archive-container">
      {/* Page Header */}
      <div className="archive-header">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="archive-header-icon-box">
              <Archive size={20} />
            </div>
            <div>
              <h1 className="archive-header-title">
                Work Reports Archive
              </h1>
              <p className="archive-header-sub">
                Historical log of submitted daily standup notes, logged hours, and task accomplishments
              </p>
            </div>
          </div>
        </div>

        {/* Header Action Buttons */}
        <div className="archive-header-actions">
          <button
            type="button"
            className="btn btn-primary btn-sm btn-no-print"
            style={{
              background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
              borderColor: '#059669',
              fontWeight: 800,
              fontSize: '0.78rem',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              boxShadow: '0 4px 14px rgba(16, 185, 129, 0.35)',
            }}
            onClick={handleAutoCreateTodayReport}
            title="Auto-generates report with today's timer start-stops & completed works, and submits it immediately"
          >
            <Sparkles size={14} /> ⚡ Auto-Create Today's Report
          </button>

          <button
            type="button"
            className="btn btn-ghost btn-sm"
            onClick={() => setShowKPIs(!showKPIs)}
            title={showKPIs ? 'Hide summary statistics' : 'Show summary statistics'}
          >
            <TrendingUp size={14} /> {showKPIs ? 'Hide Stats' : 'Show Stats'}
          </button>

          <button
            type="button"
            className="btn btn-ghost btn-sm"
            onClick={handleExportJSON}
            title="Download full archive as JSON"
          >
            <Download size={14} /> Export JSON
          </button>

          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={() => navigate('/reports')}
            title="Return to today's report editor"
          >
            <FileText size={14} /> Daily Report Editor
          </button>
        </div>
      </div>

      {/* KPI Stats Bar (Collapsible & Compact) */}
      {showKPIs && (
        <div className="archive-kpi-grid">
          <div className="card archive-kpi-card">
            <div className="archive-kpi-icon-wrap" style={{ background: 'rgba(59, 130, 246, 0.12)', color: '#3B82F6' }}>
              <FileText size={15} />
            </div>
            <div>
              <div className="archive-kpi-label">
                Total Reports
              </div>
              <div className="archive-kpi-val">
                {totalReportsCount}
              </div>
            </div>
          </div>

          <div className="card archive-kpi-card">
            <div className="archive-kpi-icon-wrap" style={{ background: 'rgba(16, 185, 129, 0.12)', color: '#10B981' }}>
              <Clock size={15} />
            </div>
            <div>
              <div className="archive-kpi-label">
                Logged Work Hours
              </div>
              <div className="archive-kpi-val">
                {totalLoggedHours.toFixed(1)} hrs
              </div>
            </div>
          </div>

          <div className="card archive-kpi-card">
            <div className="archive-kpi-icon-wrap" style={{ background: 'rgba(245, 158, 11, 0.12)', color: '#F59E0B' }}>
              <Flame size={15} />
            </div>
            <div>
              <div className="archive-kpi-label">
                High Velocity Days
              </div>
              <div className="archive-kpi-val">
                {highVelocityCount} days
              </div>
            </div>
          </div>

          <div className="card archive-kpi-card">
            <div className="archive-kpi-icon-wrap" style={{ background: 'rgba(139, 92, 246, 0.12)', color: '#8B5CF6' }}>
              <TrendingUp size={15} />
            </div>
            <div>
              <div className="archive-kpi-label">
                Avg Daily Hours
              </div>
              <div className="archive-kpi-val">
                {avgHoursPerReport} hrs/day
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Archive Explorer Card */}
      <div className="card archive-explorer-card">
        {/* Top Controls: Search, View Switcher, Filter */}
        <div className="archive-controls-bar">
          {/* Search Input */}
          <div className="archive-search-box">
            <Search size={14} color="var(--text-muted)" />
            <input
              type="text"
              placeholder="Search accomplishments, dates, or keywords..."
              value={archiveSearch}
              onChange={(e) => setArchiveSearch(e.target.value)}
              className="archive-search-input"
            />
            {archiveSearch && (
              <button
                type="button"
                onClick={() => setArchiveSearch('')}
                className="btn-icon text-xs text-muted p-0"
              >
                ✕
              </button>
            )}
          </div>

          {/* Velocity Mood Filter Pills */}
          <div className="archive-velocity-pills">
            <span className="text-xs text-muted font-semibold mr-1">
              Velocity:
            </span>
            {[
              { id: 'all', label: 'All' },
              { id: 'fire', label: '🔥 High Velocity' },
              { id: 'rocket', label: '🚀 On Track' },
              { id: 'coffee', label: '☕ Steady' },
              { id: 'blocked', label: '⚠️ Blocked' },
            ].map((f) => (
              <button
                key={f.id}
                type="button"
                onClick={() => setArchiveMoodFilter(f.id)}
                className="badge text-xs px-2.5 py-1 cursor-pointer transition-all"
                style={{
                  background: archiveMoodFilter === f.id ? 'var(--primary-color)' : 'var(--card-hover)',
                  color: archiveMoodFilter === f.id ? '#ffffff' : 'var(--text-secondary)',
                  border: archiveMoodFilter === f.id ? '1px solid var(--primary-color)' : '1px solid var(--border-color)',
                }}
              >
                {f.label}
              </button>
            ))}
          </div>

          {/* View Mode Switcher (Cards | Table | Timeline) */}
          <div className="archive-view-switcher">
            <button
              type="button"
              className={`archive-view-btn ${archiveView === 'cards' ? 'active' : ''}`}
              onClick={() => setArchiveView('cards')}
              title="Cards Grid"
            >
              <LayoutGrid size={14} /> Cards
            </button>
            <button
              type="button"
              className={`archive-view-btn ${archiveView === 'table' ? 'active' : ''}`}
              onClick={() => setArchiveView('table')}
              title="High-Density Table"
            >
              <List size={14} /> Table
            </button>
            <button
              type="button"
              className={`archive-view-btn ${archiveView === 'timeline' ? 'active' : ''}`}
              onClick={() => setArchiveView('timeline')}
              title="Chronological Timeline"
            >
              <CalendarDays size={14} /> Timeline
            </button>
          </div>
        </div>

        {/* Empty State */}
        {dailyReports.length === 0 ? (
          <div className="text-center py-14 px-5 text-muted bg-page rounded-md border border-dashed border-color">
            <Archive size={36} className="opacity-35 mx-auto mb-3" />
            <div className="text-base font-bold text-primary mb-1">
              No daily work reports saved yet
            </div>
            <div>Submit and save your first daily work report in the editor to build your archive.</div>
            <div className="mt-4">
              <button
                type="button"
                className="btn btn-primary btn-sm"
                onClick={() => navigate('/reports')}
              >
                <FileText size={14} /> Open Daily Report Editor
              </button>
            </div>
          </div>
        ) : filteredReports.length === 0 ? (
          <div className="text-center py-10 px-5 text-muted bg-page rounded-md border border-dashed border-color text-sm">
            No reports match the current search filter "{archiveSearch || archiveMoodFilter}".
            <div className="mt-3">
              <button
                type="button"
                className="btn btn-ghost btn-sm"
                onClick={() => {
                  setArchiveSearch('');
                  setArchiveMoodFilter('all');
                }}
              >
                Reset Filters
              </button>
            </div>
          </div>
        ) : (
          <>
            {/* VIEW 1: CARDS VIEW (COMPACT) */}
            {archiveView === 'cards' && (
              <div className="archive-cards-grid">
                {filteredReports.map((report) => {
                  const formattedDate = formatDate(report.date, {
                    weekday: 'short',
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                  });

                  const moodMeta = MOOD_METADATA[report.mood] || MOOD_METADATA.productive;
                  const bullets = parseBulletPoints(report.accomplishments);
                  const isExpanded = expandedReportIds.has(report.id || report.date);
                  const displayedBullets = isExpanded ? bullets : bullets.slice(0, 3);
                  const hasMore = bullets.length > 3;

                  return (
                    <div
                      key={report.id || report.date}
                      className="archive-history-card"
                    >
                      {/* Header */}
                      <div className="archive-card-header">
                        <div>
                          <div className="flex items-center gap-1.5">
                            <Calendar size={13} color="var(--primary-color)" />
                            <strong className="text-sm text-primary">
                              {formattedDate}
                            </strong>
                          </div>
                          {report.date === todayStr && (
                            <span className="badge badge-success text-xs px-1.5 py-0.5 mt-0.5">
                              Today
                            </span>
                          )}
                        </div>

                        <span
                          className="badge text-xs px-1.5 py-0.5 shrink-0"
                          style={{
                            background: moodMeta.bg,
                            color: moodMeta.color,
                            border: `1px solid ${moodMeta.border}`,
                          }}
                        >
                          {moodMeta.emoji} {moodMeta.label}
                        </span>
                      </div>

                      {/* Stats */}
                      <div className="archive-card-stats">
                        <span className="inline-flex items-center gap-1">
                          <Clock size={11} color="var(--primary-color)" />
                          <strong>Logged:</strong> {report.hoursLogged || '7.0'} hrs
                        </span>

                        {bullets.length > 0 && (
                          <span className="inline-flex items-center gap-1">
                            <CheckCircle2 size={11} color="#10B981" />
                            {bullets.length} done
                          </span>
                        )}
                      </div>

                      {/* Accomplishments Clean List */}
                      {bullets.length > 0 && (
                        <div className="archive-card-bullets">
                          {displayedBullets.map((bullet, idx) => (
                            <div key={idx} className="archive-bullet-item">
                              <span className="text-emerald-500 shrink-0">•</span>
                              <span>{bullet}</span>
                            </div>
                          ))}

                          {hasMore && (
                            <button
                              type="button"
                              onClick={() => toggleExpandReport(report.id || report.date)}
                              className="text-xs text-primary font-bold cursor-pointer pt-0.5 text-left bg-transparent border-none"
                            >
                              {isExpanded ? '▲ Show Less' : `▼ +${bullets.length - 3} more accomplishments`}
                            </button>
                          )}
                        </div>
                      )}

                      {/* Blockers alert tag if present */}
                      {report.blockers && report.blockers !== 'None.' && report.blockers !== 'None' && (
                        <div className="flex items-center gap-1.5 text-xs text-red-500 bg-red-500/10 p-1.5 rounded border border-red-500/20">
                          <AlertTriangle size={12} color="#EF4444" className="shrink-0" />
                          <span className="truncate">
                            {report.blockers}
                          </span>
                        </div>
                      )}

                      {/* Footer Actions */}
                      <div className="archive-card-footer">
                        <button
                          type="button"
                          className="btn btn-ghost btn-sm text-xs py-1 px-2.5"
                          onClick={() => navigate(`/reports?date=${report.date}`)}
                        >
                          <ArrowRight size={13} /> Inspect / Edit Day
                        </button>

                        <button
                          type="button"
                          className="btn-icon text-muted"
                          title="Delete report"
                          onClick={() => deleteDailyReport(report.id)}
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* VIEW 2: TABLE VIEW */}
            {archiveView === 'table' && (
              <div className="archive-table-wrapper">
                <table className="archive-table">
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Velocity Status</th>
                      <th>Hours</th>
                      <th>Key Accomplishments</th>
                      <th>Blockers & Plan</th>
                      <th className="text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredReports.map((report) => {
                      const formattedDate = formatDate(report.date, {
                        weekday: 'short',
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      });

                      const moodMeta = MOOD_METADATA[report.mood] || MOOD_METADATA.productive;
                      const bullets = parseBulletPoints(report.accomplishments);
                      const hasBlocker = report.blockers && report.blockers !== 'None.' && report.blockers !== 'None';

                      return (
                        <tr key={report.id || report.date}>
                          <td className="whitespace-nowrap">
                            <div className="flex items-center gap-1.5">
                              <strong className="text-sm">{formattedDate}</strong>
                              {report.date === todayStr && (
                                <span className="badge badge-success text-xs px-1.5 py-0.5">
                                  Today
                                </span>
                              )}
                            </div>
                          </td>

                          <td className="whitespace-nowrap">
                            <span
                              className="badge text-xs py-0.5 px-2"
                              style={{
                                background: moodMeta.bg,
                                color: moodMeta.color,
                                border: `1px solid ${moodMeta.border}`,
                              }}
                            >
                              {moodMeta.emoji} {moodMeta.label}
                            </span>
                          </td>

                          <td className="whitespace-nowrap">
                            <span className="badge badge-neutral text-xs gap-1 border border-color">
                              <Clock size={11} color="var(--primary-color)" />
                              {report.hoursLogged || '7.0'} hrs
                            </span>
                          </td>

                          <td style={{ maxWidth: '420px' }}>
                            <div className="flex flex-col gap-0.5">
                              {bullets.slice(0, 2).map((b, i) => (
                                <div key={i} className="text-xs text-primary truncate">
                                  <span className="text-emerald-500">•</span> {b}
                                </div>
                              ))}
                              {bullets.length > 2 && (
                                <span className="text-xs text-muted">
                                  +{bullets.length - 2} more...
                                </span>
                              )}
                            </div>
                          </td>

                          <td className="whitespace-nowrap">
                            {hasBlocker ? (
                              <span className="badge text-xs bg-red-500/10 text-red-500 border border-red-500/25">
                                ⚠️ Blocker
                              </span>
                            ) : (
                              <span className="text-xs text-muted">
                                ✓ Clear
                              </span>
                            )}
                          </td>

                          <td className="text-right whitespace-nowrap">
                            <div className="inline-flex items-center gap-1.5">
                              <button
                                type="button"
                                className="btn btn-ghost btn-sm text-xs py-1 px-2"
                                onClick={() => navigate(`/reports?date=${report.date}`)}
                              >
                                <ArrowRight size={12} /> Inspect
                              </button>
                              <button
                                type="button"
                                className="btn-icon w-7 h-7 text-muted"
                                onClick={() => deleteDailyReport(report.id)}
                                title="Delete Report"
                              >
                                <Trash2 size={13} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}

            {/* VIEW 3: TIMELINE VIEW */}
            {archiveView === 'timeline' && (
              <div className="archive-timeline">
                {filteredReports.map((report) => {
                  const formattedDate = formatDate(report.date, {
                    weekday: 'long',
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                  });

                  const moodMeta = MOOD_METADATA[report.mood] || MOOD_METADATA.productive;
                  const bullets = parseBulletPoints(report.accomplishments);

                  return (
                    <div key={report.id || report.date} className="archive-timeline-item">
                      <div
                        className="archive-timeline-node"
                        style={{
                          borderColor: moodMeta.color,
                          color: moodMeta.color,
                        }}
                      >
                        {moodMeta.emoji}
                      </div>

                      <div
                        className="archive-history-card"
                        style={{
                          borderLeft: "2px solid var(--primary-color)",
                        }}
                      >
                        <div className="flex items-center justify-between flex-wrap gap-2">
                          <div className="flex items-center gap-2">
                            <strong className="text-sm text-primary">
                              {formattedDate}
                            </strong>
                            {report.date === todayStr && (
                              <span className="badge badge-success text-xs px-1.5 py-0.5">
                                Today
                              </span>
                            )}
                          </div>

                          <div className="flex items-center gap-2">
                            <span className="badge badge-neutral text-xs border border-color">
                              <Clock size={11} color="var(--primary-color)" /> {report.hoursLogged || '7.0'} hrs
                            </span>
                            <span
                              className="badge text-xs"
                              style={{
                                background: moodMeta.bg,
                                color: moodMeta.color,
                                border: `1px solid ${moodMeta.border}`,
                              }}
                            >
                              {moodMeta.emoji} {moodMeta.label}
                            </span>
                          </div>
                        </div>

                        {bullets.length > 0 && (
                          <div className="flex flex-col gap-1.5 bg-page p-2.5 rounded-md border border-color">
                            {bullets.map((b, i) => (
                              <div key={i} className="flex items-start gap-1.5 text-xs text-primary">
                                <span className="text-emerald-500 mt-0.5">•</span>
                                <span>{b}</span>
                              </div>
                            ))}
                          </div>
                        )}

                        {report.tomorrowPlan && (
                          <div className="text-xs text-secondary">
                            <strong>Next Priorities:</strong> {report.tomorrowPlan.replace(/\n/g, ' ')}
                          </div>
                        )}

                        <div className="flex items-center justify-between pt-1">
                          <button
                            type="button"
                            className="btn btn-ghost btn-sm text-xs py-1 px-2.5"
                            onClick={() => navigate(`/reports?date=${report.date}`)}
                          >
                            <ArrowRight size={12} /> Inspect in Daily Editor
                          </button>

                          <button
                            type="button"
                            className="btn-icon text-muted"
                            onClick={() => deleteDailyReport(report.id)}
                            title="Delete Report"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
export default ReportsArchive;
