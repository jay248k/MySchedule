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
import '../styles/pages/goals.css';

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
    <div className="goals-page-container">
      {/* Header */}
      <div className="goals-header-card card">
        <div>
          <h1 className="goals-header-title">
            Goals & Milestones
          </h1>
          <p className="goals-header-sub">
            Track progress towards your key academic, career, and personal achievements with real-time auto progress.
          </p>
        </div>

        <div className="goals-header-actions">
          <button
            type="button"
            className="btn btn-secondary inline-flex items-center gap-1.5"
            onClick={() => openModal('bulk-import', { type: 'goals' })}
            id="btn-bulk-import-goals"
          >
            <UploadCloud size={16} />
            <span>Bulk Import</span>
          </button>
          <button
            type="button"
            className="btn btn-primary inline-flex items-center gap-1.5"
            onClick={() => openModal('goal')}
            id="btn-add-goal"
          >
            <Plus size={16} />
            <span>Create Goal</span>
          </button>
        </div>
      </div>

      {/* Summary Filter Bar */}
      <div className="goals-filter-bar card">
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
            className="btn btn-sm btn-secondary goals-toggle-all-btn"
            onClick={toggleAllTasks}
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
        <div className="goals-cards-grid">
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
                className="goal-compact-card card"
                style={{
                  borderTop: `3px solid ${isCompleted ? '#10B981' : 'var(--primary-color)'}`,
                  boxShadow: isExpanded ? 'var(--shadow-md)' : 'var(--shadow-sm)',
                }}
              >
                {/* Header */}
                <div className="goal-card-header">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className={`badge ${isCompleted ? 'badge-success' : 'badge-primary'} text-xs px-1.5 py-0.5`}>
                        {isCompleted ? 'Completed' : 'In Progress'}
                      </span>
                      {goal.category && (
                        <span className="badge badge-neutral text-xs px-1.5 py-0.5">{goal.category}</span>
                      )}
                      <span className="badge badge-neutral text-xs px-1.5 py-0.5 inline-flex items-center gap-1 border border-color">
                        <Target size={11} color="var(--primary-color)" />
                        <span>{relatedTasks.length} linked</span>
                      </span>
                    </div>
                    <h3 className="goal-card-title" title={goal.title}>
                      {goal.title}
                    </h3>
                  </div>

                  <div className="flex gap-0.5 shrink-0">
                    <button
                      type="button"
                      className="btn-icon w-7 h-7"
                      onClick={() => openModal('goal', goal)}
                      title="Edit Goal"
                    >
                      <Edit2 size={13} />
                    </button>
                    <button
                      type="button"
                      className="btn-icon w-7 h-7 text-danger"
                      onClick={() => deleteGoal(goal.id)}
                      title="Delete Goal"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>

                {goal.description ? (
                  <p
                    className="goal-card-desc"
                    style={{
                      WebkitLineClamp: isExpanded ? 'unset' : 1,
                      overflow: isExpanded ? 'visible' : 'hidden',
                    }}
                    title={!isExpanded ? goal.description : undefined}
                  >
                    {goal.description}
                  </p>
                ) : null}

                {/* Compact Progress Line & Bar */}
                <div className="goal-progress-wrap">
                  <div className="flex justify-between items-center text-xs mb-1">
                    <span className="font-semibold text-secondary">
                      {hasLinkedTasks ? `Auto-track: ${completedLinkedCount}/${relatedTasks.length} done` : 'Manual progress'}
                    </span>
                    <strong
                      className="text-xs"
                      style={{ color: isCompleted ? '#10B981' : 'var(--primary-color)' }}
                    >
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
                <div className="goal-tasks-section">
                  {/* Small card task bar with arrow */}
                  <div
                    className="goal-tasks-bar-toggle"
                    style={{
                      background: isExpanded ? 'var(--page-bg)' : 'transparent',
                    }}
                    onClick={() => toggleExpand(goal.id)}
                    title={isExpanded ? 'Click to collapse tasks' : 'Click to view tasks'}
                  >
                    <span className="text-sm font-bold text-primary flex items-center gap-1.5">
                      <CheckCircle2 size={15} color="var(--primary-color)" />
                      Goal Tasks ({completedLinkedCount}/{relatedTasks.length})
                    </span>

                    <div
                      className="flex items-center gap-1.5"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <button
                        type="button"
                        className="btn btn-primary btn-sm h-6 px-2 text-xs"
                        onClick={() => openModal('task', { goalId: goal.id })}
                        title="Add task to this goal"
                      >
                        <Plus size={12} /> Add Task
                      </button>

                      <button
                        type="button"
                        className="btn-icon w-6 h-6 rounded-full border border-color flex items-center justify-center cursor-pointer"
                        style={{
                          background: isExpanded ? 'rgba(59, 130, 246, 0.12)' : 'var(--page-bg)',
                          color: isExpanded ? 'var(--primary-color)' : 'var(--text-secondary)',
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
                    <div className="flex flex-col gap-1.5 mt-1">
                      {relatedTasks.length === 0 ? (
                        <div className="p-3 bg-page border border-dashed border-color rounded-md text-center flex flex-col items-center gap-1.5">
                          <p className="text-xs text-secondary m-0">
                            This goal has no tasks linked to it yet. Add tasks to automatically calculate progress!
                          </p>
                          <div className="flex gap-2 mt-1 flex-wrap justify-center">
                            <button
                              type="button"
                              className="btn btn-primary btn-sm px-2 py-0.5 text-xs"
                              onClick={() => openModal('task', { goalId: goal.id })}
                            >
                              <Plus size={12} /> Add First Task
                            </button>
                            {unlinkedTasks.length > 0 && (
                              <select
                                className="form-select text-xs py-0.5 px-2 h-6.5 w-auto"
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
                        <div className="goal-tasks-list-box">
                          {relatedTasks.map((task) => {
                            const isTaskDone = task.status === 'completed';
                            return (
                              <div
                                key={task.id}
                                className="goal-task-row"
                                style={{
                                  background: isTaskDone ? 'rgba(16, 185, 129, 0.08)' : 'var(--page-bg)',
                                  border: `1px solid ${isTaskDone ? 'rgba(16, 185, 129, 0.25)' : 'var(--border-color)'}`,
                                }}
                              >
                                <div className="flex items-center gap-2 min-w-0 flex-1">
                                  {/* Clickable Checkbox */}
                                  <div
                                    className={`custom-checkbox ${isTaskDone ? 'checked' : ''} w-4 h-4 shrink-0 cursor-pointer`}
                                    onClick={() => toggleTaskComplete(task.id)}
                                    title={isTaskDone ? 'Mark as incomplete' : 'Mark as completed'}
                                  >
                                    {isTaskDone && <Check size={11} strokeWidth={3} />}
                                  </div>

                                  <span
                                    className="text-xs font-semibold truncate cursor-pointer"
                                    style={{
                                      color: isTaskDone ? 'var(--text-muted)' : 'var(--text-primary)',
                                      textDecoration: isTaskDone ? 'line-through' : 'none',
                                    }}
                                    onClick={() => toggleTaskComplete(task.id)}
                                    title={`Click to toggle: ${task.title}`}
                                  >
                                    {task.title}
                                  </span>
                                </div>

                                <div className="flex items-center gap-1.5 shrink-0">
                                  {task.date && (
                                    <span className="text-xs text-muted whitespace-nowrap">
                                      {task.date}
                                    </span>
                                  )}
                                  <button
                                    type="button"
                                    className="btn-icon w-5.5 h-5.5 text-muted"
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
                            <div className="flex justify-end mt-1">
                              <select
                                className="form-select text-xs py-0.5 px-2 h-6.5 w-auto"
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
                <div className="goal-card-footer">
                  <span className="flex items-center gap-1.5">
                    <Calendar size={14} />
                    Target: {formatDate(goal.targetDate)}
                  </span>
                  <span className="text-xs text-secondary">
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
