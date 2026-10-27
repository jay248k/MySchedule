import React, { useState } from 'react';
import {
  Plus,
  Tag,
  Edit2,
  Trash2,
  CheckCircle2,
  ListTodo,
  TrendingUp,
  BarChart3,
  PieChart as PieIcon,
  LayoutGrid,
  BarChart2,
  Layers,
  Award,
  Sparkles,
  UploadCloud,
} from 'lucide-react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
} from 'recharts';
import { useApp } from '../context/AppContext';
import { ProgressBar } from '../components/common/ProgressRing';
import { CustomSelect } from '../components/common/CustomSelect';

export function Categories() {
  const { categories, tasks, openModal, deleteCategory } = useApp();
  const [viewMode, setViewMode] = useState('both'); // 'both', 'charts', 'cards'
  const [selectedChartCat, setSelectedChartCat] = useState('all');

  // Compute category stats
  const categoryStatsData = categories.map((cat) => {
    const catTasks = tasks.filter((t) => t.categoryId === cat.id);
    const completed = catTasks.filter((t) => t.status === 'completed').length;
    const total = catTasks.length;
    const pending = Math.max(0, total - completed);
    const rate = total > 0 ? Math.round((completed / total) * 100) : 0;
    return {
      id: cat.id,
      name: cat.name,
      color: cat.color,
      total,
      completed,
      pending,
      rate,
    };
  });

  // Filter non-zero items for Pie Chart
  const pieData = categoryStatsData.filter((c) => c.total > 0);

  // Weekly trend for category
  const getWeeklyTrendForCategory = (catId) => {
    const today = new Date();
    const days = [];

    for (let i = 6; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      const dateStr = `${year}-${month}-${day}`;
      const dayName = d.toLocaleDateString('en-US', { weekday: 'short' });

      let dayTasks = tasks.filter((t) => t.date === dateStr);
      if (catId !== 'all') {
        dayTasks = dayTasks.filter((t) => t.categoryId === catId);
      }
      const completed = dayTasks.filter((t) => t.status === 'completed').length;
      const total = dayTasks.length;

      days.push({
        day: dayName,
        date: dateStr,
        total,
        completed,
        pending: Math.max(0, total - completed),
      });
    }

    return days;
  };

  const trendData = getWeeklyTrendForCategory(selectedChartCat);

  // Top category with highest volume
  const topVolumeCat = categoryStatsData
    .slice()
    .sort((a, b) => b.total - a.total)[0] || { name: 'N/A', total: 0 };

  // Best completion rate category
  const bestRateCat = categoryStatsData
    .filter((c) => c.total > 0)
    .sort((a, b) => b.rate - a.rate)[0] || { name: 'N/A', rate: 0 };

  const totalTasksCount = tasks.length;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* 1. Page Header with View Switcher */}
      <div
        className="card"
        style={{
          padding: '22px 28px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '16px',
        }}
      >
        <div>
          <h1 style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--text-primary)' }}>
            Category Management & Analytics
          </h1>
          <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
            Organize, color-code, and track trajectory trends across all life and work domains.
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
          {/* View Mode Toggle */}
          <div
            style={{
              display: 'flex',
              background: 'var(--page-bg)',
              border: '1px solid var(--border-color)',
              borderRadius: 'var(--radius-md)',
              padding: '3px',
              gap: '2px',
            }}
          >
            <button
              type="button"
              className={`btn btn-sm ${viewMode === 'both' ? 'btn-primary' : 'btn-ghost'}`}
              style={{ fontSize: '0.82rem', padding: '6px 12px' }}
              onClick={() => setViewMode('both')}
            >
              <Layers size={14} /> Both Views
            </button>
            <button
              type="button"
              className={`btn btn-sm ${viewMode === 'charts' ? 'btn-primary' : 'btn-ghost'}`}
              style={{ fontSize: '0.82rem', padding: '6px 12px' }}
              onClick={() => setViewMode('charts')}
            >
              <BarChart2 size={14} /> Chart View
            </button>
            <button
              type="button"
              className={`btn btn-sm ${viewMode === 'cards' ? 'btn-primary' : 'btn-ghost'}`}
              style={{ fontSize: '0.82rem', padding: '6px 12px' }}
              onClick={() => setViewMode('cards')}
            >
              <LayoutGrid size={14} /> Cards View
            </button>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => openModal('bulk-import', { type: 'categories' })}
              id="btn-bulk-import-categories"
              style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
            >
              <UploadCloud size={16} />
              <span>Bulk Import</span>
            </button>
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => openModal('category')}
              id="btn-add-category"
              style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
            >
              <Plus size={16} />
              <span>Create Category</span>
            </button>
          </div>
        </div>
      </div>

      {/* 2. Category Summary KPI Cards */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: '16px',
        }}
      >
        {/* Total Categories */}
        <div className="card" style={{ padding: '18px 20px', display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div
            style={{
              width: '46px',
              height: '46px',
              borderRadius: 'var(--radius-md)',
              background: 'var(--primary-light)',
              color: 'var(--primary-color)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <Tag size={22} />
          </div>
          <div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Total Categories</div>
            <div style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--text-primary)' }}>{categories.length}</div>
          </div>
        </div>

        {/* Total Categorized Tasks */}
        <div className="card" style={{ padding: '18px 20px', display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div
            style={{
              width: '46px',
              height: '46px',
              borderRadius: 'var(--radius-md)',
              background: 'rgba(16, 185, 129, 0.12)',
              color: 'var(--success)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <ListTodo size={22} />
          </div>
          <div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Logged Tasks</div>
            <div style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--success)' }}>{totalTasksCount}</div>
          </div>
        </div>

        {/* Most Active Category */}
        <div className="card" style={{ padding: '18px 20px', display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div
            style={{
              width: '46px',
              height: '46px',
              borderRadius: 'var(--radius-md)',
              background: 'rgba(139, 92, 246, 0.12)',
              color: '#8B5CF6',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <Award size={22} />
          </div>
          <div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Most Active Domain</div>
            <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-primary)' }}>
              {topVolumeCat.name} ({topVolumeCat.total})
            </div>
          </div>
        </div>

        {/* Highest Completion Rate */}
        <div className="card" style={{ padding: '18px 20px', display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div
            style={{
              width: '46px',
              height: '46px',
              borderRadius: 'var(--radius-md)',
              background: 'rgba(245, 158, 11, 0.12)',
              color: '#F59E0B',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <Sparkles size={22} />
          </div>
          <div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Top Completion Rate</div>
            <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#F59E0B' }}>
              {bestRateCat.name} ({bestRateCat.rate}%)
            </div>
          </div>
        </div>
      </div>

      {/* 3. Dedicated Charts Section */}
      {(viewMode === 'both' || viewMode === 'charts') && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Main 2-Column Chart Row */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(12, 1fr)', gap: '20px' }}>
            {/* Chart 1: Weekly Trajectory Trend (Exactly matching user requested design) */}
            <div style={{ gridColumn: 'span 7' }} className="dash-col-left">
              <div className="card" style={{ padding: '24px' }}>
                <div className="card-header-flex">
                  <div>
                    <h3 className="card-title">
                      <TrendingUp size={20} color="var(--primary-color)" />
                      Weekly Trajectory Trend
                    </h3>
                    <span className="card-subtitle">
                      Daily completed vs pending tasks{' '}
                      {selectedChartCat !== 'all'
                        ? `for ${categories.find((c) => c.id === selectedChartCat)?.name}`
                        : 'across all categories'}
                    </span>
                  </div>

                  {/* Themed Custom Filter selector */}
                  <CustomSelect
                    value={selectedChartCat}
                    onChange={(val) => setSelectedChartCat(val)}
                    size="sm"
                    options={[
                      { value: 'all', label: 'All Categories' },
                      ...categories.map((c) => ({
                        value: c.id,
                        label: c.name,
                        color: c.color,
                      })),
                    ]}
                  />
                </div>

                <div style={{ width: '100%', height: 270, marginTop: '16px' }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={trendData}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(226, 232, 240, 0.6)" />
                      <XAxis dataKey="day" stroke="var(--text-muted)" fontSize={12} tickLine={false} />
                      <YAxis stroke="var(--text-muted)" fontSize={12} tickLine={false} allowDecimals={false} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: 'var(--card-bg)',
                          borderColor: 'var(--border-color)',
                          borderRadius: '8px',
                          boxShadow: 'var(--shadow-md)',
                        }}
                      />
                      <Legend
                        wrapperStyle={{ paddingTop: '10px' }}
                        formatter={(value) => (
                          <span style={{ color: 'var(--text-primary)', fontSize: '0.82rem', fontWeight: 600 }}>
                            {value}
                          </span>
                        )}
                      />
                      <Line
                        type="monotone"
                        dataKey="completed"
                        stroke="#10B981"
                        strokeWidth={3}
                        dot={{ r: 4, fill: '#10B981' }}
                        activeDot={{ r: 6 }}
                        name="Completed"
                      />
                      <Line
                        type="monotone"
                        dataKey="pending"
                        stroke="#F59E0B"
                        strokeWidth={2}
                        strokeDasharray="4 4"
                        dot={{ r: 4, fill: '#F59E0B' }}
                        activeDot={{ r: 6 }}
                        name="Pending"
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            {/* Chart 2: Category Workload Share (Donut Chart) */}
            <div style={{ gridColumn: 'span 5' }} className="dash-col-right">
              <div className="card" style={{ padding: '24px' }}>
                <div className="card-header-flex">
                  <div>
                    <h3 className="card-title">
                      <PieIcon size={20} color="var(--primary-color)" />
                      Workload Distribution
                    </h3>
                    <span className="card-subtitle">Share of total tasks by category</span>
                  </div>
                </div>

                <div style={{ width: '100%', height: 270, marginTop: '16px' }}>
                  {pieData.length === 0 ? (
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--text-muted)' }}>
                      No tasks assigned to categories yet.
                    </div>
                  ) : (
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={pieData}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={95}
                          paddingAngle={3}
                          dataKey="total"
                        >
                          {pieData.map((entry) => (
                            <Cell key={`cell-${entry.id}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip
                          formatter={(value, name, props) => [
                            `${value} tasks (${Math.round((value / totalTasksCount) * 100)}%)`,
                            props.payload.name,
                          ]}
                          contentStyle={{
                            backgroundColor: 'var(--card-bg)',
                            borderColor: 'var(--border-color)',
                            borderRadius: '8px',
                          }}
                        />
                        <Legend
                          formatter={(value, entry) => (
                            <span style={{ color: 'var(--text-primary)', fontSize: '0.8rem', fontWeight: 600 }}>
                              {entry.payload.name}
                            </span>
                          )}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Chart 3: Category Completion & Volume Comparison Bar Chart */}
          <div className="card" style={{ padding: '24px' }}>
            <div className="card-header-flex">
              <div>
                <h3 className="card-title">
                  <BarChart3 size={20} color="var(--primary-color)" />
                  Category Task Volume & Completion Status
                </h3>
                <span className="card-subtitle">Completed tasks vs pending tasks per category</span>
              </div>
            </div>

            <div style={{ width: '100%', height: 280, marginTop: '16px' }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={categoryStatsData} margin={{ top: 10, right: 20, left: -10, bottom: 0 }}>
                  <defs>
                    <linearGradient id="barCompletedGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#10B981" stopOpacity={0.95} />
                      <stop offset="100%" stopColor="#059669" stopOpacity={0.8} />
                    </linearGradient>
                    <linearGradient id="barPendingGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#F59E0B" stopOpacity={0.95} />
                      <stop offset="100%" stopColor="#D97706" stopOpacity={0.8} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(226, 232, 240, 0.15)" />
                  <XAxis dataKey="name" stroke="var(--text-muted)" fontSize={12} tickLine={false} />
                  <YAxis stroke="var(--text-muted)" fontSize={12} tickLine={false} allowDecimals={false} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'var(--card-bg)',
                      borderColor: 'var(--border-color)',
                      borderRadius: '8px',
                      boxShadow: 'var(--shadow-md)',
                      fontSize: '0.82rem',
                    }}
                  />
                  <Legend
                    wrapperStyle={{ paddingTop: '12px' }}
                    content={({ payload }) => (
                      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '24px', paddingTop: '8px' }}>
                        {payload && payload.map((entry, index) => {
                          const color = entry.dataKey === 'completed' ? '#10B981' : '#F59E0B';
                          return (
                            <div key={`legend-item-${index}`} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <span style={{ width: 12, height: 12, borderRadius: 3, backgroundColor: color, display: 'inline-block' }} />
                              <span style={{ color: 'var(--text-primary)', fontSize: '0.82rem', fontWeight: 600 }}>
                                {entry.value}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  />
                  <Bar dataKey="completed" name="Completed Tasks" fill="url(#barCompletedGrad)" radius={[5, 5, 0, 0]} />
                  <Bar dataKey="pending" name="Pending Tasks" fill="url(#barPendingGrad)" radius={[5, 5, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {/* 4. Categories Cards Grid */}
      {(viewMode === 'both' || viewMode === 'cards') && (
        <div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
            <h2 style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--text-primary)' }}>
              Configured Categories ({categories.length})
            </h2>
            <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
              Click any category card to focus trajectory trends
            </span>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
              gap: '20px',
            }}
          >
            {categories.map((cat) => {
              const catTasks = tasks.filter((t) => t.categoryId === cat.id);
              const completedCount = catTasks.filter((t) => t.status === 'completed').length;
              const totalCount = catTasks.length;
              const percentage = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;
              const isChartSelected = selectedChartCat === cat.id;

              return (
                <div
                  key={cat.id}
                  className="card"
                  style={{
                    padding: '22px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '16px',
                    position: 'relative',
                    overflow: 'hidden',
                    cursor: 'pointer',
                    boxShadow: isChartSelected ? '0 0 0 2px var(--primary-color), var(--shadow-md)' : undefined,
                  }}
                  onClick={() => {
                    setSelectedChartCat(cat.id);
                    if (viewMode === 'cards') setViewMode('both');
                  }}
                  title="Click to view weekly trend for this category"
                >
                  {/* Category Color Accent Header Bar */}
                  <div
                    style={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      right: 0,
                      height: '4px',
                      backgroundColor: cat.color,
                    }}
                  />

                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div
                        style={{
                          width: '42px',
                          height: '42px',
                          borderRadius: 'var(--radius-md)',
                          backgroundColor: `${cat.color}18`,
                          color: cat.color,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        <Tag size={20} />
                      </div>
                      <div>
                        <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                          {cat.name}
                        </h3>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <span
                            style={{
                              width: '8px',
                              height: '8px',
                              borderRadius: '50%',
                              backgroundColor: cat.color,
                            }}
                          />
                          <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                            {cat.color}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Edit & Delete Action Buttons */}
                    <div style={{ display: 'flex', gap: '6px' }} onClick={(e) => e.stopPropagation()}>
                      <button
                        type="button"
                        className="btn-icon"
                        style={{ width: '32px', height: '32px' }}
                        onClick={() => openModal('category', cat)}
                        title="Edit Category"
                      >
                        <Edit2 size={15} />
                      </button>
                      {cat.id !== 'cat-other' && (
                        <button
                          type="button"
                          className="btn-icon"
                          style={{ width: '32px', height: '32px', color: 'var(--danger)' }}
                          onClick={() => deleteCategory(cat.id)}
                          title="Delete Category"
                        >
                          <Trash2 size={15} />
                        </button>
                      )}
                    </div>
                  </div>

                  {cat.description && (
                    <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: '1.4' }}>
                      {cat.description}
                    </p>
                  )}

                  {/* Metrics & Progress */}
                  <div
                    style={{
                      background: 'var(--page-bg)',
                      padding: '14px 16px',
                      borderRadius: 'var(--radius-md)',
                      border: '1px solid var(--border-color)',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '10px',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.85rem' }}>
                      <span style={{ color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <ListTodo size={14} /> Total Tasks
                      </span>
                      <strong>{totalCount}</strong>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.85rem' }}>
                      <span style={{ color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <CheckCircle2 size={14} color="var(--success)" /> Completed
                      </span>
                      <strong style={{ color: 'var(--success)' }}>{completedCount}</strong>
                    </div>

                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', marginBottom: '4px' }}>
                        <span style={{ color: 'var(--text-muted)' }}>Completion Rate</span>
                        <strong>{percentage}%</strong>
                      </div>
                      <ProgressBar progress={percentage} color={cat.color} />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
