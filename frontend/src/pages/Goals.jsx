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

        <button
          type="button"
          className="btn btn-primary"
          onClick={() => openModal('goal')}
          id="btn-add-goal"
        >
          <Plus size={16} />
          Create Goal
        </button>
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

            return (
              <div
                key={goal.id}
                className="card"
                style={{
                  padding: '24px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '16px',
                  position: 'relative',
                  borderTop: `4px solid ${isCompleted ? '#10B981' : 'var(--primary-color)'}`,
                }}
              >
                {/* Header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                      <span className={`badge ${isCompleted ? 'badge-success' : 'badge-primary'}`}>
                        {isCompleted ? 'Completed' : 'In Progress'}
                      </span>
                      {goal.category && (
                        <span className="badge badge-neutral">{goal.category}</span>
                      )}
                      <span
                        className="badge"
                        style={{
                          backgroundColor: '#F1F5F9',
                          color: '#334155',
                          border: '1px solid #CBD5E1',
                          fontSize: '0.72rem',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px',
                        }}
                      >
                        <Target size={11} color="var(--primary-color)" />
                        {relatedTasks.length} {relatedTasks.length === 1 ? 'task' : 'tasks'} linked
                      </span>
                    </div>
                    <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginTop: '8px', color: 'var(--text-primary)' }}>
                      {goal.title}
                    </h3>
                  </div>

                  <div style={{ display: 'flex', gap: '4px' }}>
                    <button
                      type="button"
                      className="btn-icon"
                      style={{ width: '32px', height: '32px' }}
                      onClick={() => openModal('goal', goal)}
                      title="Edit Goal"
                    >
                      <Edit2 size={15} />
                    </button>
                    <button
                      type="button"
                      className="btn-icon"
                      style={{ width: '32px', height: '32px', color: 'var(--danger)' }}
                      onClick={() => deleteGoal(goal.id)}
                      title="Delete Goal"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>

                {goal.description && (
                  <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', lineHeight: '1.5', margin: 0 }}>
                    {goal.description}
                  </p>
                )}

                {/* Progress Bar & Real-Time Auto Progress Indicator */}
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '6px' }}>
                    <span style={{ fontWeight: 700, display: 'flex', alignItems: 'center', gap: '5px' }}>
                      Progress
                      {hasLinkedTasks && (
                        <span style={{ fontSize: '0.72rem', color: 'var(--primary-color)', fontWeight: 600 }}>
                          (Auto-tracked)
                        </span>
                      )}
                    </span>
                    <strong style={{ color: isCompleted ? '#10B981' : 'var(--primary-color)', fontSize: '0.95rem' }}>
                      {effectiveProgress}%
                    </strong>
                  </div>

                  <ProgressBar
                    progress={effectiveProgress}
                    color={isCompleted ? '#10B981' : 'var(--primary-color)'}
                    height={10}
                  />

                  {/* Task Auto-Progress Stat Subtitle */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', color: 'var(--text-secondary)', marginTop: '6px' }}>
                    {hasLinkedTasks ? (
                      <span>
                        Auto progress: <strong>{completedLinkedCount} of {relatedTasks.length} tasks completed</strong>
                      </span>
                    ) : (
                      <span style={{ color: 'var(--text-muted)' }}>
                        No tasks linked yet • Add tasks below to auto-calculate progress
                      </span>
                    )}

                    {isCompleted && (
                      <span style={{ color: '#10B981', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
                        <Sparkles size={12} /> Goal Achieved!
                      </span>
                    )}
                  </div>
                </div>

                {/* Interactive Linked Tasks Checklist Section */}
                <div
                  style={{
                    borderTop: '1px solid var(--border-color)',
                    paddingTop: '14px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '8px',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <CheckCircle2 size={15} color="var(--primary-color)" />
                      Goal Tasks ({completedLinkedCount}/{relatedTasks.length})
                    </span>
                    <button
                      type="button"
                      className="btn btn-primary btn-sm"
                      style={{ padding: '3px 8px', fontSize: '0.75rem', height: '26px' }}
                      onClick={() => openModal('task', { goalId: goal.id })}
                    >
                      <Plus size={13} /> Add Task
                    </button>
                  </div>

                  {relatedTasks.length === 0 ? (
                    <div
                      style={{
                        padding: '14px 16px',
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
                        This goal has no tasks linked to it yet. Add tasks to automatically calculate progress as you complete them!
                      </p>
                      <div style={{ display: 'flex', gap: '8px', marginTop: '6px', flexWrap: 'wrap', justifyContent: 'center' }}>
                        <button
                          type="button"
                          className="btn btn-primary btn-sm"
                          style={{ padding: '4px 10px', fontSize: '0.75rem' }}
                          onClick={() => openModal('task', { goalId: goal.id })}
                        >
                          <Plus size={13} /> Add First Task
                        </button>
                        {unlinkedTasks.length > 0 && (
                          <select
                            className="form-select"
                            style={{ width: 'auto', fontSize: '0.75rem', padding: '3px 8px', height: '28px' }}
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
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      {relatedTasks.map((task) => {
                        const isTaskDone = task.status === 'completed';
                        return (
                          <div
                            key={task.id}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              padding: '8px 10px',
                              background: isTaskDone ? '#F0FDF4' : 'var(--page-bg)',
                              border: `1px solid ${isTaskDone ? '#BBF7D0' : 'var(--border-color)'}`,
                              borderRadius: 'var(--radius-sm)',
                              gap: '8px',
                              transition: 'all var(--transition-fast)',
                            }}
                          >
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0, flex: 1 }}>
                              {/* Clickable Checkbox */}
                              <div
                                className={`custom-checkbox ${isTaskDone ? 'checked' : ''}`}
                                style={{ width: '18px', height: '18px', flexShrink: 0, cursor: 'pointer' }}
                                onClick={() => toggleTaskComplete(task.id)}
                                title={isTaskDone ? 'Mark as incomplete' : 'Mark as completed'}
                              >
                                {isTaskDone && <Check size={12} strokeWidth={3} />}
                              </div>

                              <span
                                style={{
                                  fontSize: '0.84rem',
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

                {/* Target Date Footer */}
                <div
                  style={{
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
