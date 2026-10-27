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
  const { dailyReports = [], deleteDailyReport, showToast } = useApp();
  const todayStr = getTodayDateString();

  const [archiveView, setArchiveView] = useState('cards'); // 'cards', 'table', 'timeline'
  const [archiveSearch, setArchiveSearch] = useState('');
  const [archiveMoodFilter, setArchiveMoodFilter] = useState('all');
  const [expandedReportIds, setExpandedReportIds] = useState(new Set());

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
    <div className="page-container" style={{ display: 'flex', flexDirection: 'column', gap: '22px' }}>
      {/* Page Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div
              style={{
                width: '38px',
                height: '38px',
                borderRadius: '10px',
                background: 'rgba(var(--primary-rgb, 16, 185, 129), 0.12)',
                color: 'var(--primary-color)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Archive size={20} />
            </div>
            <div>
              <h1 style={{ fontSize: '1.65rem', fontWeight: 800, margin: 0, color: 'var(--text-primary)' }}>
                Work Reports Archive
              </h1>
              <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                Historical log of submitted daily standup notes, logged hours, and task accomplishments
              </p>
            </div>
          </div>
        </div>

        {/* Header Action Buttons */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
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
            className="btn btn-primary btn-sm"
            onClick={() => navigate('/reports')}
            title="Return to today's report editor"
          >
            <FileText size={14} /> Daily Report Editor
          </button>
        </div>
      </div>

      {/* KPI Stats Bar */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: '16px' }}>
        <div className="card" style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div style={{ width: '42px', height: '42px', borderRadius: '10px', background: 'rgba(59, 130, 246, 0.12)', color: '#3B82F6', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <FileText size={20} />
          </div>
          <div>
            <div style={{ fontSize: '0.76rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>
              Total Reports
            </div>
            <div style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--text-primary)' }}>
              {totalReportsCount}
            </div>
          </div>
        </div>

        <div className="card" style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div style={{ width: '42px', height: '42px', borderRadius: '10px', background: 'rgba(16, 185, 129, 0.12)', color: '#10B981', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Clock size={20} />
          </div>
          <div>
            <div style={{ fontSize: '0.76rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>
              Logged Work Hours
            </div>
            <div style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--text-primary)' }}>
              {totalLoggedHours.toFixed(1)} hrs
            </div>
          </div>
        </div>

        <div className="card" style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div style={{ width: '42px', height: '42px', borderRadius: '10px', background: 'rgba(245, 158, 11, 0.12)', color: '#F59E0B', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Flame size={20} />
          </div>
          <div>
            <div style={{ fontSize: '0.76rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>
              High Velocity Days
            </div>
            <div style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--text-primary)' }}>
              {highVelocityCount} days
            </div>
          </div>
        </div>

        <div className="card" style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div style={{ width: '42px', height: '42px', borderRadius: '10px', background: 'rgba(139, 92, 246, 0.12)', color: '#8B5CF6', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <TrendingUp size={20} />
          </div>
          <div>
            <div style={{ fontSize: '0.76rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>
              Avg Daily Hours
            </div>
            <div style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--text-primary)' }}>
              {avgHoursPerReport} hrs/day
            </div>
          </div>
        </div>
      </div>

      {/* Main Archive Explorer Card */}
      <div className="card" style={{ padding: '24px 28px' }}>
        {/* Top Controls: Search, View Switcher, Filter */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '14px',
            marginBottom: '20px',
            paddingBottom: '16px',
            borderBottom: '1px solid var(--border-color)',
          }}
        >
          {/* Search Input */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              background: 'var(--page-bg)',
              border: '1px solid var(--border-color)',
              borderRadius: 'var(--radius-md)',
              padding: '6px 12px',
              flex: '1 1 260px',
              maxWidth: '380px',
            }}
          >
            <Search size={14} color="var(--text-muted)" />
            <input
              type="text"
              placeholder="Search accomplishments, dates, or keywords..."
              value={archiveSearch}
              onChange={(e) => setArchiveSearch(e.target.value)}
              style={{
                background: 'transparent',
                border: 'none',
                outline: 'none',
                color: 'var(--text-primary)',
                fontSize: '0.84rem',
                width: '100%',
              }}
            />
            {archiveSearch && (
              <button
                type="button"
                onClick={() => setArchiveSearch('')}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: 'var(--text-muted)',
                  cursor: 'pointer',
                  fontSize: '0.8rem',
                  padding: 0,
                }}
              >
                ✕
              </button>
            )}
          </div>

          {/* Velocity Mood Filter Pills */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '0.76rem', color: 'var(--text-muted)', fontWeight: 600, marginRight: '4px' }}>
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
                className="badge"
                style={{
                  background: archiveMoodFilter === f.id ? 'var(--primary-color)' : 'var(--card-hover)',
                  color: archiveMoodFilter === f.id ? '#ffffff' : 'var(--text-secondary)',
                  border: archiveMoodFilter === f.id ? '1px solid var(--primary-color)' : '1px solid var(--border-color)',
                  cursor: 'pointer',
                  fontSize: '0.74rem',
                  padding: '4px 10px',
                  transition: 'all 0.15s ease',
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
          <div
            style={{
              textAlign: 'center',
              padding: '60px 20px',
              color: 'var(--text-muted)',
              fontSize: '0.95rem',
              background: 'var(--page-bg)',
              borderRadius: 'var(--radius-md)',
              border: '1px dashed var(--border-color)',
            }}
          >
            <Archive size={36} style={{ opacity: 0.35, marginBottom: '12px' }} />
            <div style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '4px' }}>
              No daily work reports saved yet
            </div>
            <div>Submit and save your first daily work report in the editor to build your archive.</div>
            <div style={{ marginTop: '16px' }}>
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
          <div
            style={{
              textAlign: 'center',
              padding: '40px 20px',
              color: 'var(--text-muted)',
              fontSize: '0.9rem',
              background: 'var(--page-bg)',
              borderRadius: 'var(--radius-md)',
              border: '1px dashed var(--border-color)',
            }}
          >
            No reports match the current search filter "{archiveSearch || archiveMoodFilter}".
            <div style={{ marginTop: '12px' }}>
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
            {/* VIEW 1: CARDS VIEW */}
            {archiveView === 'cards' && (
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))',
                  gap: '18px',
                }}
              >
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
                      className="history-report-card"
                      style={{
                        borderTop: `3.5px solid ${moodMeta.color}`,
                      }}
                    >
                      {/* Header */}
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'flex-start',
                          justifyContent: 'space-between',
                          gap: '8px',
                          borderBottom: '1px solid var(--border-color)',
                          paddingBottom: '10px',
                        }}
                      >
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <Calendar size={14} color="var(--primary-color)" />
                            <strong style={{ fontSize: '0.96rem', color: 'var(--text-primary)' }}>
                              {formattedDate}
                            </strong>
                          </div>
                          {report.date === todayStr && (
                            <span
                              className="badge badge-success"
                              style={{ fontSize: '0.68rem', padding: '1px 6px', marginTop: '4px' }}
                            >
                              Today
                            </span>
                          )}
                        </div>

                        <span
                          className="badge"
                          style={{
                            background: moodMeta.bg,
                            color: moodMeta.color,
                            border: `1px solid ${moodMeta.border}`,
                            fontSize: '0.74rem',
                            padding: '2px 8px',
                            flexShrink: 0,
                          }}
                        >
                          {moodMeta.emoji} {moodMeta.label}
                        </span>
                      </div>

                      {/* Stats */}
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          fontSize: '0.78rem',
                          color: 'var(--text-secondary)',
                        }}
                      >
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
                          <Clock size={12} color="var(--primary-color)" />
                          <strong>Logged:</strong> {report.hoursLogged || '7.0'} hrs
                        </span>

                        {bullets.length > 0 && (
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                            <CheckCircle2 size={12} color="#10B981" />
                            {bullets.length} {bullets.length === 1 ? 'task' : 'tasks'} accomplished
                          </span>
                        )}
                      </div>

                      {/* Accomplishments Clean List */}
                      {bullets.length > 0 && (
                        <div
                          style={{
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '6px',
                            background: 'var(--page-bg)',
                            padding: '10px 12px',
                            borderRadius: 'var(--radius-md)',
                            border: '1px solid var(--border-color)',
                          }}
                        >
                          {displayedBullets.map((bullet, idx) => (
                            <div
                              key={idx}
                              style={{
                                display: 'flex',
                                alignItems: 'flex-start',
                                gap: '6px',
                                fontSize: '0.8rem',
                                color: 'var(--text-primary)',
                                lineHeight: '1.4',
                              }}
                            >
                              <span style={{ color: '#10B981', marginTop: '2px', flexShrink: 0 }}>•</span>
                              <span>{bullet}</span>
                            </div>
                          ))}

                          {hasMore && (
                            <button
                              type="button"
                              onClick={() => toggleExpandReport(report.id || report.date)}
                              style={{
                                background: 'transparent',
                                border: 'none',
                                color: 'var(--primary-color)',
                                fontSize: '0.74rem',
                                fontWeight: 700,
                                cursor: 'pointer',
                                padding: '4px 0 0 0',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '4px',
                                textAlign: 'left',
                              }}
                            >
                              {isExpanded ? (
                                <>
                                  <ChevronUp size={13} /> Show fewer accomplishments
                                </>
                              ) : (
                                <>
                                  <ChevronDown size={13} /> +{bullets.length - 3} more accomplishments...
                                </>
                              )}
                            </button>
                          )}
                        </div>
                      )}

                      {/* Blockers alert tag if present */}
                      {report.blockers && report.blockers !== 'None.' && report.blockers !== 'None' && (
                        <div
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px',
                            fontSize: '0.75rem',
                            color: '#EF4444',
                            background: 'rgba(239, 68, 68, 0.08)',
                            padding: '5px 10px',
                            borderRadius: 'var(--radius-sm)',
                            border: '1px solid rgba(239, 68, 68, 0.2)',
                          }}
                        >
                          <AlertTriangle size={12} color="#EF4444" style={{ flexShrink: 0 }} />
                          <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {report.blockers}
                          </span>
                        </div>
                      )}

                      {/* Footer Actions */}
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          marginTop: 'auto',
                          paddingTop: '8px',
                          borderTop: '1px solid var(--border-color)',
                        }}
                      >
                        <button
                          type="button"
                          className="btn btn-ghost btn-sm"
                          style={{ fontSize: '0.78rem', padding: '4px 10px' }}
                          onClick={() => navigate(`/reports?date=${report.date}`)}
                        >
                          <ArrowRight size={13} /> Inspect / Edit Day
                        </button>

                        <button
                          type="button"
                          className="btn-icon"
                          style={{ color: 'var(--text-muted)' }}
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
                      <th style={{ textAlign: 'right' }}>Actions</th>
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
                          <td style={{ whiteSpace: 'nowrap' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                              <strong style={{ fontSize: '0.88rem' }}>{formattedDate}</strong>
                              {report.date === todayStr && (
                                <span className="badge badge-success" style={{ fontSize: '0.65rem', padding: '1px 5px' }}>
                                  Today
                                </span>
                              )}
                            </div>
                          </td>

                          <td style={{ whiteSpace: 'nowrap' }}>
                            <span
                              className="badge"
                              style={{
                                background: moodMeta.bg,
                                color: moodMeta.color,
                                border: `1px solid ${moodMeta.border}`,
                                fontSize: '0.74rem',
                                padding: '2px 8px',
                              }}
                            >
                              {moodMeta.emoji} {moodMeta.label}
                            </span>
                          </td>

                          <td style={{ whiteSpace: 'nowrap' }}>
                            <span
                              className="badge badge-neutral"
                              style={{ fontSize: '0.76rem', gap: '4px', border: '1px solid var(--border-color)' }}
                            >
                              <Clock size={11} color="var(--primary-color)" />
                              {report.hoursLogged || '7.0'} hrs
                            </span>
                          </td>

                          <td style={{ maxWidth: '420px' }}>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                              {bullets.slice(0, 2).map((b, i) => (
                                <div
                                  key={i}
                                  style={{
                                    fontSize: '0.78rem',
                                    color: 'var(--text-primary)',
                                    whiteSpace: 'nowrap',
                                    overflow: 'hidden',
                                    textOverflow: 'ellipsis',
                                  }}
                                >
                                  <span style={{ color: '#10B981' }}>•</span> {b}
                                </div>
                              ))}
                              {bullets.length > 2 && (
                                <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                                  +{bullets.length - 2} more...
                                </span>
                              )}
                            </div>
                          </td>

                          <td style={{ whiteSpace: 'nowrap' }}>
                            {hasBlocker ? (
                              <span
                                className="badge"
                                style={{
                                  background: 'rgba(239, 68, 68, 0.1)',
                                  color: '#EF4444',
                                  border: '1px solid rgba(239, 68, 68, 0.25)',
                                  fontSize: '0.72rem',
                                }}
                              >
                                ⚠️ Blocker
                              </span>
                            ) : (
                              <span style={{ fontSize: '0.76rem', color: 'var(--text-muted)' }}>
                                ✓ Clear
                              </span>
                            )}
                          </td>

                          <td style={{ textAlign: 'right', whiteSpace: 'nowrap' }}>
                            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                              <button
                                type="button"
                                className="btn btn-ghost btn-sm"
                                style={{ fontSize: '0.75rem', padding: '4px 8px' }}
                                onClick={() => navigate(`/reports?date=${report.date}`)}
                              >
                                <ArrowRight size={12} /> Inspect
                              </button>
                              <button
                                type="button"
                                className="btn-icon"
                                style={{ width: '28px', height: '28px', color: 'var(--text-muted)' }}
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
                        className="history-report-card"
                        style={{
                          borderLeft: `4px solid ${moodMeta.color}`,
                        }}
                      >
                        <div
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            flexWrap: 'wrap',
                            gap: '8px',
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <strong style={{ fontSize: '0.96rem', color: 'var(--text-primary)' }}>
                              {formattedDate}
                            </strong>
                            {report.date === todayStr && (
                              <span className="badge badge-success" style={{ fontSize: '0.68rem', padding: '1px 6px' }}>
                                Today
                              </span>
                            )}
                          </div>

                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span
                              className="badge badge-neutral"
                              style={{ fontSize: '0.74rem', border: '1px solid var(--border-color)' }}
                            >
                              <Clock size={11} color="var(--primary-color)" /> {report.hoursLogged || '7.0'} hrs
                            </span>
                            <span
                              className="badge"
                              style={{
                                background: moodMeta.bg,
                                color: moodMeta.color,
                                border: `1px solid ${moodMeta.border}`,
                                fontSize: '0.74rem',
                              }}
                            >
                              {moodMeta.emoji} {moodMeta.label}
                            </span>
                          </div>
                        </div>

                        {bullets.length > 0 && (
                          <div
                            style={{
                              display: 'flex',
                              flexDirection: 'column',
                              gap: '6px',
                              background: 'var(--page-bg)',
                              padding: '10px 14px',
                              borderRadius: 'var(--radius-md)',
                              border: '1px solid var(--border-color)',
                            }}
                          >
                            {bullets.map((b, i) => (
                              <div
                                key={i}
                                style={{
                                  display: 'flex',
                                  alignItems: 'flex-start',
                                  gap: '6px',
                                  fontSize: '0.82rem',
                                  color: 'var(--text-primary)',
                                }}
                              >
                                <span style={{ color: '#10B981', marginTop: '2px' }}>•</span>
                                <span>{b}</span>
                              </div>
                            ))}
                          </div>
                        )}

                        {report.tomorrowPlan && (
                          <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                            <strong>Next Priorities:</strong> {report.tomorrowPlan.replace(/\n/g, ' ')}
                          </div>
                        )}

                        <div
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            paddingTop: '4px',
                          }}
                        >
                          <button
                            type="button"
                            className="btn btn-ghost btn-sm"
                            style={{ fontSize: '0.76rem', padding: '4px 10px' }}
                            onClick={() => navigate(`/reports?date=${report.date}`)}
                          >
                            <ArrowRight size={12} /> Inspect in Daily Editor
                          </button>

                          <button
                            type="button"
                            className="btn-icon"
                            style={{ color: 'var(--text-muted)' }}
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
