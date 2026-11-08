import React, { useState } from 'react';
import {
  Target,
  Plus,
  Calendar,
  Edit2,
  Trash2,
  CheckCircle2,
  Check,
  X,
  Sparkles,
  UploadCloud,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { formatDate } from '../utils/dateUtils';
import { ProgressBar } from '../components/common/ProgressRing';
import { EmptyState } from '../components/common/EmptyState';

export function Goals() {
  const {
    goals,
    tasks,
    openModal,
    deleteGoal,
    toggleTaskComplete,
    linkTaskToGoal,
    unlinkTaskFromGoal,
  } = useApp();
  const [filter, setFilter] = useState('all'); // 'all', 'in-progress', 'completed'
  const [expandedGoalIds, setExpandedGoalIds] = useState({});

  const toggleExpand = (goalId) => {
    setExpandedGoalIds((prev) => ({
      ...prev,
      [goalId]: !prev[goalId],
    }));
  };

  // Tasks that are not linked to any goal yet
  const unlinkedTasks = tasks.filter(
    (t) => !t.goalId && !goals.some((g) => g.relatedTaskIds?.includes(t.id))
  );

  const filteredGoals = goals.filter((g) => {
    const relatedTasks = tasks.filter((t) => t.goalId === g.id || g.relatedTaskIds?.includes(t.id));
    const completedLinkedCount = relatedTasks.filter((t) => t.status === 'completed').length;
    const effectiveProgress = relatedTasks.length > 0
      ? Math.round((completedLinkedCount / relatedTasks.length) * 100)
      : 0;
    const isCompleted = relatedTasks.length > 0 && effectiveProgress >= 100;

    if (filter === 'all') return true;
    if (filter === 'completed') return isCompleted;
    return !isCompleted;
  });

  const areAllExpanded = filteredGoals.length > 0 && filteredGoals.every((g) => expandedGoalIds[g.id]);

  const toggleAllTasks = () => {
    if (areAllExpanded) {
      setExpandedGoalIds({});
    } else {
      const next = {};
      filteredGoals.forEach((g) => {
        next[g.id] = true;
      });
      setExpandedGoalIds(next);
    }
  };

  const inProgressCount = goals.filter((g) => {
    const relatedTasks = tasks.filter((t) => t.goalId === g.id || g.relatedTaskIds?.includes(t.id));
    const completedLinkedCount = relatedTasks.filter((t) => t.status === 'completed').length;
    const progress = relatedTasks.length > 0
      ? Math.round((completedLinkedCount / relatedTasks.length) * 100)
      : 0;
    return progress < 100 || relatedTasks.length === 0;
  }).length;

  const completedCount = goals.filter((g) => {
    const relatedTasks = tasks.filter((t) => t.goalId === g.id || g.relatedTaskIds?.includes(t.id));
    const completedLinkedCount = relatedTasks.filter((t) => t.status === 'completed').length;
    const progress = relatedTasks.length > 0
      ? Math.round((completedLinkedCount / relatedTasks.length) * 100)
      : 0;
    return progress >= 100 && relatedTasks.length > 0;
  }).length;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Header */}
      <div
        className="card"
        style={{
          padding: '24px 28px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '16px',
        }}
      >
        <div>
          <h1 style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--text-primary)' }}>
            Goals & Milestones
          </h1>
          <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
            Track progress towards your key academic, career, and personal achievements with real-time auto progress.
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => openModal('bulk-import', { type: 'goals' })}
            id="btn-bulk-import-goals"
            style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            <UploadCloud size={16} />
            <span>Bulk Import</span>
          </button>
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => openModal('goal')}
            id="btn-add-goal"
            style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            <Plus size={16} />
            <span>Create Goal</span>
          </button>
        </div>
      </div>

      {/* Summary Filter Bar */}
      <div
        className="card"
        style={{
          padding: '14px 20px',
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          flexWrap: 'wrap',
        }}
      >
        <button
          type="button"
          className={`btn btn-sm ${filter === 'all' ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => setFilter('all')}
        >
          All Goals ({goals.length})
        </button>
        <button
          type="button"
          className={`btn btn-sm ${filter === 'in-progress' ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => setFilter('in-progress')}
        >
          In Progress ({inProgressCount})
        </button>
        <button
          type="button"
          className={`btn btn-sm ${filter === 'completed' ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => setFilter('completed')}
        >
          Completed ({completedCount})
        </button>

        {filteredGoals.length > 0 && (
          <button
            type="button"
            className="btn btn-sm btn-secondary"
            onClick={toggleAllTasks}
            style={{
              marginLeft: 'auto',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '0.78rem',
            }}
            title={areAllExpanded ? 'Collapse tasks on all cards' : 'Expand tasks on all cards'}
          >
            {areAllExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            <span>{areAllExpanded ? 'Collapse All Cards' : 'Expand All Cards'}</span>
          </button>
        )}
      </div>

      {/* Goals Cards Grid */}
      {filteredGoals.length === 0 ? (
        <EmptyState
          icon={Target}
          title="No goals found"
          description="You don't have any goals matching this filter. Start by creating a new goal!"
          actionLabel="Add Goal"
          onAction={() => openModal('goal')}
        />
      ) : (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))',
            gap: '20px',
            alignItems: 'stretch',
          }}
        >
          {filteredGoals.map((goal) => {
            const relatedTasks = tasks.filter((t) => t.goalId === goal.id || goal.relatedTaskIds?.includes(t.id));
            const completedLinkedCount = relatedTasks.filter((t) => t.status === 'completed').length;
            const hasLinkedTasks = relatedTasks.length > 0;
            const effectiveProgress = hasLinkedTasks
              ? Math.round((completedLinkedCount / relatedTasks.length) * 100)
              : 0;
            const isCompleted = hasLinkedTasks && effectiveProgress >= 100;
            const isExpanded = !!expandedGoalIds[goal.id];

            return (
              <div
                key={goal.id}
                className="card"
                style={{
                  padding: '12px 14px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '6px',
                  position: 'relative',
                  borderTop: `3px solid ${isCompleted ? '#10B981' : 'var(--primary-color)'}`,
                  transition: 'all 0.15s ease',
                  boxShadow: isExpanded ? 'var(--shadow-md)' : 'var(--shadow-sm)',
                }}
              >
                {/* Header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px' }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                      <span className={`badge ${isCompleted ? 'badge-success' : 'badge-primary'}`} style={{ fontSize: '0.68rem', padding: '1px 6px' }}>
                        {isCompleted ? 'Completed' : 'In Progress'}
                      </span>
                      {goal.category && (
                        <span className="badge badge-neutral" style={{ fontSize: '0.68rem', padding: '1px 6px' }}>{goal.category}</span>
                      )}
                      <span
                        className="badge badge-neutral"
                        style={{
                          fontSize: '0.68rem',
                          padding: '1px 6px',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px',
                          border: '1px solid var(--border-color)',
                        }}
                      >
                        <Target size={11} color="var(--primary-color)" />
                        <span>{relatedTasks.length} linked</span>
                      </span>
                    </div>
                    <h3
                      style={{
                        fontSize: '1rem',
                        fontWeight: 700,
                        marginTop: '4px',
                        marginBottom: '0px',
                        color: 'var(--text-primary)',
                        lineHeight: '1.25',
                        display: '-webkit-box',
                        WebkitLineClamp: 1,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden',
                      }}
                      title={goal.title}
                    >
                      {goal.title}
                    </h3>
                  </div>

                  <div style={{ display: 'flex', gap: '2px', flexShrink: 0 }}>
                    <button
                      type="button"
                      className="btn-icon"
                      style={{ width: '28px', height: '28px' }}
                      onClick={() => openModal('goal', goal)}
                      title="Edit Goal"
                    >
                      <Edit2 size={13} />
                    </button>
                    <button
                      type="button"
                      className="btn-icon"
                      style={{ width: '28px', height: '28px', color: 'var(--danger)' }}
                      onClick={() => deleteGoal(goal.id)}
                      title="Delete Goal"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>

                {goal.description ? (
                  <p
                    style={{
                      fontSize: '0.8rem',
                      color: 'var(--text-secondary)',
                      lineHeight: '1.35',
                      margin: '2px 0 0',
                      display: '-webkit-box',
                      WebkitLineClamp: isExpanded ? 'unset' : 1,
                      WebkitBoxOrient: 'vertical',
                      overflow: isExpanded ? 'visible' : 'hidden',
                    }}
                    title={!isExpanded ? goal.description : undefined}
                  >
                    {goal.description}
                  </p>
                ) : null}

                {/* Compact Progress Line & Bar */}
                <div style={{ marginTop: '2px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.78rem', marginBottom: '4px' }}>
                    <span style={{ fontWeight: 600, color: 'var(--text-secondary)' }}>
                      {hasLinkedTasks ? `Auto-track: ${completedLinkedCount}/${relatedTasks.length} done` : 'Manual progress'}
                    </span>
                    <strong style={{ color: isCompleted ? '#10B981' : 'var(--primary-color)', fontSize: '0.84rem' }}>
                      {effectiveProgress}%
                    </strong>
                  </div>

                  <ProgressBar
                    progress={effectiveProgress}
                    color={isCompleted ? '#10B981' : 'var(--primary-color)'}
                    height={6}
                  />
                </div>

                {/* Collapsible Linked Tasks Checklist Section */}
                <div
                  style={{
                    borderTop: '1px solid var(--border-color)',
                    paddingTop: '6px',
                    marginTop: '2px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '4px',
                  }}
                >
                  {/* Small card task bar with arrow */}
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '6px 8px',
                      borderRadius: 'var(--radius-sm)',
                      background: isExpanded ? 'var(--page-bg)' : 'transparent',
                      cursor: 'pointer',
                      userSelect: 'none',
                      transition: 'background var(--transition-fast)',
                    }}
                    onClick={() => toggleExpand(goal.id)}
                    title={isExpanded ? 'Click to collapse tasks' : 'Click to view tasks'}
                  >
                    <span
                      style={{
                        fontSize: '0.85rem',
                        fontWeight: 700,
                        color: 'var(--text-primary)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                      }}
                    >
                      <CheckCircle2 size={15} color="var(--primary-color)" />
                      Goal Tasks ({completedLinkedCount}/{relatedTasks.length})
                    </span>

                    <div
                      style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
                      onClick={(e) => e.stopPropagation()}
                    >
                      <button
                        type="button"
                        className="btn btn-primary btn-sm"
                        style={{ padding: '2px 8px', fontSize: '0.74rem', height: '24px' }}
                        onClick={() => openModal('task', { goalId: goal.id })}
                        title="Add task to this goal"
                      >
                        <Plus size={12} /> Add Task
                      </button>

                      {/* Small card arrow button */}
                      <button
                        type="button"
                        className="btn-icon"
                        style={{
                          width: '26px',
                          height: '26px',
                          borderRadius: '50%',
                          background: isExpanded ? 'rgba(59, 130, 246, 0.12)' : 'var(--page-bg)',
                          color: isExpanded ? 'var(--primary-color)' : 'var(--text-secondary)',
                          border: '1px solid var(--border-color)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          cursor: 'pointer',
                          transition: 'all 0.2s ease',
                        }}
                        onClick={() => toggleExpand(goal.id)}
                        title={isExpanded ? 'Collapse card' : 'Expand card'}
                        aria-label={isExpanded ? 'Collapse card' : 'Expand card'}
                      >
                        {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                      </button>
                    </div>
                  </div>

                  {/* Tasks List - Only visible when expanded */}
                  {isExpanded && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginTop: '4px' }}>
                      {relatedTasks.length === 0 ? (
                        <div
                          style={{
                            padding: '12px 14px',
                            background: 'var(--page-bg)',
                            border: '1px dashed var(--border-color)',
                            borderRadius: 'var(--radius-md)',
                            textAlign: 'center',
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            gap: '6px',
                          }}
                        >
                          <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', margin: 0 }}>
                            This goal has no tasks linked to it yet. Add tasks to automatically calculate progress!
                          </p>
                          <div style={{ display: 'flex', gap: '8px', marginTop: '4px', flexWrap: 'wrap', justifyContent: 'center' }}>
                            <button
                              type="button"
                              className="btn btn-primary btn-sm"
                              style={{ padding: '3px 8px', fontSize: '0.74rem' }}
                              onClick={() => openModal('task', { goalId: goal.id })}
                            >
                              <Plus size={12} /> Add First Task
                            </button>
                            {unlinkedTasks.length > 0 && (
                              <select
                                className="form-select"
                                style={{ width: 'auto', fontSize: '0.72rem', padding: '2px 8px', height: '26px' }}
                                onChange={(e) => {
                                  if (e.target.value) {
                                    linkTaskToGoal(e.target.value, goal.id);
                                    e.target.value = '';
                                  }
                                }}
                                defaultValue=""
                              >
                                <option value="" disabled>+ Link existing task...</option>
                                {unlinkedTasks.map((t) => (
                                  <option key={t.id} value={t.id}>
                                    {t.title} ({t.date})
                                  </option>
                                ))}
                              </select>
                            )}
                          </div>
                        </div>
                      ) : (
                        <div
                          style={{
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '6px',
                            maxHeight: '320px',
                            overflowY: 'auto',
                            paddingRight: '2px',
                          }}
                        >
                          {relatedTasks.map((task) => {
                            const isTaskDone = task.status === 'completed';
                            return (
                              <div
                                key={task.id}
                                style={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'space-between',
                                  padding: '7px 9px',
                                  background: isTaskDone ? 'rgba(16, 185, 129, 0.08)' : 'var(--page-bg)',
                                  border: `1px solid ${isTaskDone ? 'rgba(16, 185, 129, 0.25)' : 'var(--border-color)'}`,
                                  borderRadius: 'var(--radius-sm)',
                                  gap: '8px',
                                  transition: 'all var(--transition-fast)',
                                }}
                              >
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0, flex: 1 }}>
                                  {/* Clickable Checkbox */}
                                  <div
                                    className={`custom-checkbox ${isTaskDone ? 'checked' : ''}`}
                                    style={{ width: '17px', height: '17px', flexShrink: 0, cursor: 'pointer' }}
                                    onClick={() => toggleTaskComplete(task.id)}
                                    title={isTaskDone ? 'Mark as incomplete' : 'Mark as completed'}
                                  >
                                    {isTaskDone && <Check size={11} strokeWidth={3} />}
                                  </div>

                                  <span
                                    style={{
                                      fontSize: '0.82rem',
                                      fontWeight: 600,
                                      color: isTaskDone ? 'var(--text-muted)' : 'var(--text-primary)',
                                      textDecoration: isTaskDone ? 'line-through' : 'none',
                                      overflow: 'hidden',
                                      textOverflow: 'ellipsis',
                                      whiteSpace: 'nowrap',
                                      cursor: 'pointer',
                                    }}
                                    onClick={() => toggleTaskComplete(task.id)}
                                    title={`Click to toggle: ${task.title}`}
                                  >
                                    {task.title}
                                  </span>
                                </div>

                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
                                  {task.date && (
                                    <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                                      {task.date}
                                    </span>
                                  )}
                                  <button
                                    type="button"
                                    className="btn-icon"
                                    style={{ width: '22px', height: '22px', color: 'var(--text-muted)' }}
                                    onClick={() => unlinkTaskFromGoal(task.id, goal.id)}
                                    title="Unlink from goal"
                                  >
                                    <X size={12} />
                                  </button>
                                </div>
                              </div>
                            );
                          })}

                          {/* Option to link another existing task */}
                          {unlinkedTasks.length > 0 && (
                            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '4px' }}>
                              <select
                                className="form-select"
                                style={{ width: 'auto', fontSize: '0.72rem', padding: '2px 8px', height: '26px' }}
                                onChange={(e) => {
                                  if (e.target.value) {
                                    linkTaskToGoal(e.target.value, goal.id);
                                    e.target.value = '';
                                  }
                                }}
                                defaultValue=""
                              >
                                <option value="" disabled>+ Link another task...</option>
                                {unlinkedTasks.map((t) => (
                                  <option key={t.id} value={t.id}>
                                    {t.title} ({t.date})
                                  </option>
                                ))}
                              </select>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Target Date Footer */}
                <div
                  style={{
                    marginTop: 'auto',
                    borderTop: '1px solid var(--border-subtle)',
                    paddingTop: '12px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    fontSize: '0.82rem',
                    color: 'var(--text-muted)',
                  }}
                >
                  <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Calendar size={14} />
                    Target: {formatDate(goal.targetDate)}
                  </span>
                  <span style={{ fontSize: '0.76rem', color: 'var(--text-secondary)' }}>
                    {isCompleted ? 'Status: 100% Completed' : `${effectiveProgress}% Complete`}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
