import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Flame,
  Trophy,
  Target,
  CheckCircle2,
  Calendar,
  Sparkles,
  ArrowRight,
  Clock,
  Activity,
  Layers,
} from 'lucide-react';
import { api } from '../../services/api';
import { ExcelReportTable } from './ExcelReportTable';

export function HabitsReportTab() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [reportData, setReportData] = useState(null);

  const fetchReport = async () => {
    try {
      setLoading(true);
      const res = await api.getHabitsReport();
      if (res?.data) {
        setReportData(res.data);
      }
    } catch (err) {
      console.warn('Failed to load habits report:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReport();
  }, []);

  const summary = reportData?.summary || {};
  const habitsList = reportData?.habits || [];
  const categoriesList = reportData?.categories || [];

  const summaryCards = [
    {
      title: 'Active Habits',
      value: summary.totalHabits || 0,
      icon: Target,
      color: '#3B82F6',
      subtitle: 'Configured routines',
    },
    {
      title: 'Current Max Streak',
      value: `${summary.maxCurrentStreak || 0}d`,
      icon: Flame,
      color: '#10B981',
      subtitle: 'Unbroken daily streak',
    },
    {
      title: 'All-Time Best Streak',
      value: `${summary.maxBestStreak || 0}d`,
      icon: Trophy,
      color: '#F59E0B',
      subtitle: 'Personal record',
    },
    {
      title: 'Monthly Compliance',
      value: `${summary.overallMonthlyCompliance || 0}%`,
      icon: Activity,
      color: '#8B5CF6',
      subtitle: 'All habits adherence rate',
    },
    {
      title: 'Month Check-Ins',
      value: summary.totalCheckinsThisMonth || 0,
      icon: CheckCircle2,
      color: '#06B6D4',
      subtitle: 'Total completed days',
    },
  ];

  const columns = [
    {
      key: 'name',
      label: 'Habit Name',
      sortable: true,
      render: (val, row) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div
            style={{
              width: '10px',
              height: '10px',
              borderRadius: '50%',
              backgroundColor: row.color || '#10B981',
              flexShrink: 0,
            }}
          />
          <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{val}</span>
        </div>
      ),
    },
    {
      key: 'category',
      label: 'Category',
      sortable: true,
      render: (val, row) => (
        <span
          style={{
            padding: '3px 8px',
            borderRadius: '6px',
            fontSize: '0.74rem',
            fontWeight: 700,
            backgroundColor: `${row.color || '#10B981'}1A`,
            color: row.color || '#10B981',
          }}
        >
          {val || 'Discipline'}
        </span>
      ),
    },
    {
      key: 'targetTime',
      label: 'Target Time',
      sortable: true,
      render: (val) => (
        val ? (
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
            <Clock size={12} /> {val}
          </span>
        ) : (
          <span style={{ color: 'var(--text-muted)' }}>Anytime</span>
        )
      ),
    },
    {
      key: 'currentStreak',
      label: 'Current Streak',
      sortable: true,
      render: (val) => (
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontWeight: 800, color: '#10B981' }}>
          <Flame size={14} /> {val} {val === 1 ? 'day' : 'days'}
        </span>
      ),
    },
    {
      key: 'longestStreak',
      label: 'Best Streak',
      sortable: true,
      render: (val) => (
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontWeight: 800, color: '#F59E0B' }}>
          <Trophy size={14} /> {val} {val === 1 ? 'day' : 'days'}
        </span>
      ),
    },
    {
      key: 'thisMonthCompleted',
      label: 'Month Check-Ins',
      sortable: true,
      render: (val) => (
        <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>
          {val} days
        </span>
      ),
    },
    {
      key: 'monthlyRate',
      label: 'Monthly Compliance %',
      sortable: true,
      render: (val, row) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: '120px' }}>
          <div
            style={{
              flex: 1,
              height: '6px',
              borderRadius: '999px',
              backgroundColor: 'var(--border-color)',
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                width: `${Math.min(100, val || 0)}%`,
                height: '100%',
                backgroundColor: row.color || '#10B981',
                borderRadius: '999px',
              }}
            />
          </div>
          <span style={{ fontSize: '0.78rem', fontWeight: 800, color: 'var(--text-primary)', minWidth: '34px' }}>
            {val || 0}%
          </span>
        </div>
      ),
    },
    {
      key: 'isCompletedToday',
      label: 'Status Today',
      sortable: true,
      render: (val) => (
        val ? (
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
              padding: '3px 8px',
              borderRadius: '6px',
              fontSize: '0.72rem',
              fontWeight: 800,
              backgroundColor: 'rgba(16, 185, 129, 0.15)',
              color: '#10B981',
            }}
          >
            ✓ Done Today
          </span>
        ) : (
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
              padding: '3px 8px',
              borderRadius: '6px',
              fontSize: '0.72rem',
              fontWeight: 700,
              backgroundColor: 'rgba(245, 158, 11, 0.15)',
              color: '#F59E0B',
            }}
          >
            Pending
          </span>
        )
      ),
    },
  ];

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--text-muted)' }}>
        <Sparkles size={28} color="#10B981" className="mx-auto mb-2 animate-spin" />
        <div>Computing habits performance metrics and compliance history...</div>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Category Performance Cards */}
      {categoriesList.length > 0 && (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '12px',
          }}
        >
          {categoriesList.map((cat) => (
            <div
              key={cat.category}
              className="card"
              style={{
                padding: '14px 16px',
                borderRadius: '12px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <div>
                <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)', fontWeight: 600 }}>
                  Category
                </span>
                <div style={{ fontSize: '0.96rem', fontWeight: 800, color: 'var(--text-primary)', marginTop: '2px' }}>
                  {cat.category}
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--primary-color)' }}>
                  {cat.totalCheckins}
                </div>
                <span style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>
                  {cat.totalHabits} {cat.totalHabits === 1 ? 'habit' : 'habits'}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Main Excel Data Grid */}
      <ExcelReportTable
        title="Habits & Daily Disciplines Report"
        subtitle="Full compliance audit, active streak analytics, and daily adherence records"
        summaryCards={summaryCards}
        columns={columns}
        data={habitsList}
        defaultSortKey="currentStreak"
        exportFileName="MySchedule_Habits_Report"
        sheetName="HabitsReport"
      />

      {/* Action banner to view individual calendars */}
      <div
        className="card"
        style={{
          padding: '16px 20px',
          borderRadius: '12px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '12px',
          background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.1) 0%, rgba(59, 130, 246, 0.08) 100%)',
          borderColor: 'rgba(16, 185, 129, 0.3)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Flame size={20} color="#10B981" />
          <div>
            <div style={{ fontWeight: 800, fontSize: '0.92rem', color: 'var(--text-primary)' }}>
              Looking for individual habit calendars and check-in grids?
            </div>
            <div style={{ fontSize: '0.76rem', color: 'var(--text-secondary)' }}>
              View and toggle individual month calendars for each habit directly on the Habits Dashboard.
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={() => navigate('/habits')}
          className="btn btn-primary btn-sm"
          style={{ backgroundColor: '#10B981', borderColor: '#10B981' }}
        >
          Open Habits Dashboard <ArrowRight size={14} />
        </button>
      </div>
    </div>
  );
}
export default HabitsReportTab;

