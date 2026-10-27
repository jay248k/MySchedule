import React, { useState } from 'react';
import { Check, Clock, MoreVertical, Edit2, Trash2, Calendar, Target } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { StatusBadge, PriorityBadge } from '../common/StatusBadge';
import { formatTime } from '../../utils/dateUtils';
import { getEffectiveStatus } from '../../utils/taskUtils';

export function TaskItem({ task, showDate = false, compact = false, asCard = false }) {
  const { toggleTaskComplete, openModal, deleteTask, categories, goals, settings } = useApp();
  const [menuOpen, setMenuOpen] = useState(false);

  const effectiveStatus = getEffectiveStatus(task);
  const isCompleted = effectiveStatus === 'completed';
  const isOverdue = effectiveStatus === 'overdue';

  const category = categories.find((c) => c.id === task.categoryId) || {
    name: 'General',
    color: '#64748B',
  };

  const linkedGoal = goals.find((g) => g.id === task.goalId || g.relatedTaskIds?.includes(task.id));

  const is12Hour = settings.timeFormat !== '24h';

  // ----------------------------------------------------
  // CARD VIEW LAYOUT (True Grid Card)
  // ----------------------------------------------------
  if (asCard) {
    return (
      <div
        className={`task-card-box ${isCompleted ? 'is-completed' : ''}`}
        style={{
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          padding: '14px 16px',
          background: 'var(--card-bg)',
          border: '1px solid var(--border-color)',
          borderLeft: `4px solid ${category.color}`,
          borderRadius: 'var(--radius-md)',
          boxShadow: isCompleted ? 'none' : 'var(--shadow-sm)',
          position: 'relative',
          zIndex: menuOpen ? 30 : 'auto',
          transition: 'all var(--transition-fast)',
          opacity: isCompleted ? 0.72 : 1,
          minHeight: '138px',
          gap: '10px',
        }}
      >
        {/* Card Header: Category Tag, Priority Badge & Action Menu */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '8px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
            <span
              style={{
                fontSize: '0.72rem',
                fontWeight: 600,
                padding: '2px 8px',
                borderRadius: '9999px',
                backgroundColor: `${category.color}18`,
                color: 'var(--text-primary)',
                border: `1px solid ${category.color}38`,
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px',
                whiteSpace: 'nowrap',
              }}
            >
              <span
                style={{
                  width: '6px',
                  height: '6px',
                  borderRadius: '50%',
                  backgroundColor: category.color,
                  flexShrink: 0,
                }}
              />
              {category.name}
            </span>
            <PriorityBadge priority={task.priority} />
          </div>

          {/* Action Menu */}
          <div style={{ position: 'relative' }}>
            <button
              type="button"
              className="btn-icon"
              style={{ width: '28px', height: '28px', padding: 0 }}
              onClick={(e) => {
                e.stopPropagation();
                setMenuOpen(!menuOpen);
              }}
              aria-label="Task actions"
            >
              <MoreVertical size={15} />
            </button>

            {menuOpen && (
              <>
                <div
                  style={{ position: 'fixed', inset: 0, zIndex: 20 }}
                  onClick={(e) => {
                    e.stopPropagation();
                    setMenuOpen(false);
                  }}
                />
                <div
                  style={{
                    position: 'absolute',
                    right: 0,
                    top: '100%',
                    background: 'var(--card-bg)',
                    border: '1px solid var(--border-color)',
                    borderRadius: 'var(--radius-md)',
                    boxShadow: 'var(--shadow-lg)',
                    padding: '6px',
                    zIndex: 25,
                    minWidth: '140px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '2px',
                  }}
                >
                  <button
                    type="button"
                    className="btn btn-ghost btn-sm"
                    style={{ justifyContent: 'flex-start', width: '100%', gap: '8px' }}
                    onClick={(e) => {
                      e.stopPropagation();
                      setMenuOpen(false);
                      openModal('task', task);
                    }}
                  >
                    <Edit2 size={13} />
                    Edit Task
                  </button>
                  <button
                    type="button"
                    className="btn btn-ghost btn-sm"
                    style={{ justifyContent: 'flex-start', width: '100%', gap: '8px', color: 'var(--danger)' }}
                    onClick={(e) => {
                      e.stopPropagation();
                      setMenuOpen(false);
                      deleteTask(task.id);
                    }}
                  >
                    <Trash2 size={13} />
                    Delete
                  </button>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Card Body: Checkbox, Title & Description */}
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', flex: 1 }}>
          <div
            className={`custom-checkbox ${isCompleted ? 'checked' : ''}`}
            style={{ marginTop: '2px', flexShrink: 0 }}
            onClick={(e) => {
              e.stopPropagation();
              toggleTaskComplete(task.id);
            }}
            role="checkbox"
            aria-checked={isCompleted}
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === ' ' || e.key === 'Enter') {
                e.preventDefault();
                toggleTaskComplete(task.id);
              }
            }}
            title={isCompleted ? 'Mark as incomplete' : 'Mark as completed'}
          >
            {isCompleted && <Check size={14} strokeWidth={3} />}
          </div>

          <div style={{ minWidth: 0, flex: 1 }}>
            <span
              style={{
                fontSize: '0.94rem',
                fontWeight: 600,
                color: isCompleted ? 'var(--text-muted)' : 'var(--text-primary)',
                textDecoration: isCompleted ? 'line-through' : 'none',
                wordBreak: 'break-word',
                display: 'block',
                lineHeight: 1.35,
                cursor: 'pointer',
              }}
              onClick={() => openModal('task', task)}
              title="Click to edit task"
            >
              {task.title}
            </span>
            {task.description && (
              <p
                style={{
                  fontSize: '0.78rem',
                  color: 'var(--text-secondary)',
                  marginTop: '4px',
                  lineHeight: 1.4,
                  display: '-webkit-box',
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: 'vertical',
                  overflow: 'hidden',
                }}
              >
                {task.description}
              </p>
            )}
          </div>
        </div>

        {/* Card Footer: Goal, Time & Status */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '8px',
            paddingTop: '8px',
            borderTop: '1px solid var(--border-subtle)',
            flexWrap: 'wrap',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
            {task.startTime && (
              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px',
                  whiteSpace: 'nowrap',
                  fontSize: '0.72rem',
                  fontWeight: 600,
                  color: isOverdue ? 'var(--danger)' : 'var(--text-secondary)',
                  backgroundColor: isOverdue ? 'rgba(239, 68, 68, 0.12)' : 'var(--card-hover)',
                  border: `1px solid ${isOverdue ? 'rgba(239, 68, 68, 0.28)' : 'var(--border-subtle)'}`,
                  padding: '2px 7px',
                  borderRadius: 'var(--radius-full)',
                }}
                title={`Scheduled: ${formatTime(task.startTime, is12Hour)} - ${formatTime(task.endTime, is12Hour)}`}
              >
                <Clock size={11} />
                {formatTime(task.startTime, is12Hour)}
              </span>
            )}
            {linkedGoal && (
              <span
                style={{
                  fontSize: '0.7rem',
                  fontWeight: 600,
                  padding: '2px 7px',
                  borderRadius: '9999px',
                  backgroundColor: 'rgba(var(--primary-rgb, 23, 105, 255), 0.12)',
                  color: 'var(--primary-color)',
                  border: '1px solid rgba(var(--primary-rgb, 23, 105, 255), 0.25)',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px',
                  whiteSpace: 'nowrap',
                  maxWidth: '150px',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }}
                title={`Associated with Goal: ${linkedGoal.title}`}
              >
                <Target size={11} />
                {linkedGoal.title}
              </span>
            )}
          </div>

          <StatusBadge status={effectiveStatus} />
        </div>
      </div>
    );
  }

  // ----------------------------------------------------
  // ROW / LIST VIEW LAYOUT (Compact & Standard)
  // ----------------------------------------------------
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'flex-start',
        gap: compact ? '10px' : '14px',
        padding: compact ? '10px 14px' : '14px 18px',
        background: 'var(--card-bg)',
        border: '1px solid var(--border-color)',
        borderRadius: 'var(--radius-md)',
        transition: 'all var(--transition-fast)',
        position: 'relative',
        zIndex: menuOpen ? 30 : 'auto',
        boxShadow: isCompleted ? 'none' : 'var(--shadow-sm)',
        opacity: isCompleted ? 0.72 : 1,
        overflow: menuOpen ? 'visible' : 'hidden',
      }}
      className={`task-row-item ${compact ? 'compact' : ''}`}
    >
      {/* Category indicator line flush with card edge */}
      <div
        style={{
          position: 'absolute',
          left: 0,
          top: 0,
          bottom: 0,
          width: '4px',
          borderRadius: 'var(--radius-md) 0 0 var(--radius-md)',
          backgroundColor: category.color,
        }}
      />

      {/* Custom Checkbox aligned with first line */}
      <div
        className={`custom-checkbox ${isCompleted ? 'checked' : ''}`}
        style={{ marginTop: '2px', flexShrink: 0 }}
        onClick={() => toggleTaskComplete(task.id)}
        role="checkbox"
        aria-checked={isCompleted}
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === ' ' || e.key === 'Enter') {
            e.preventDefault();
            toggleTaskComplete(task.id);
          }
        }}
        title={isCompleted ? 'Mark as incomplete' : 'Mark as completed'}
      >
        {isCompleted && <Check size={14} strokeWidth={3} />}
      </div>

      {/* Task Content */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          <span
            style={{
              fontSize: compact ? '0.9rem' : '0.96rem',
              fontWeight: 600,
              color: isCompleted ? 'var(--text-muted)' : 'var(--text-primary)',
              textDecoration: isCompleted ? 'line-through' : 'none',
              wordBreak: 'break-word',
            }}
          >
            {task.title}
          </span>
          <span
            style={{
              fontSize: '0.72rem',
              fontWeight: 600,
              padding: '2px 8px',
              borderRadius: '9999px',
              backgroundColor: `${category.color}18`,
              color: 'var(--text-primary)',
              border: `1px solid ${category.color}38`,
              display: 'inline-flex',
              alignItems: 'center',
              gap: '5px',
              whiteSpace: 'nowrap',
            }}
          >
            <span
              style={{
                width: '6px',
                height: '6px',
                borderRadius: '50%',
                backgroundColor: category.color,
                flexShrink: 0,
              }}
            />
            {category.name}
          </span>
          <PriorityBadge priority={task.priority} />
          {linkedGoal && (
            <span
              style={{
                fontSize: '0.7rem',
                fontWeight: 600,
                padding: '2px 8px',
                borderRadius: '9999px',
                backgroundColor: 'rgba(var(--primary-rgb, 23, 105, 255), 0.12)',
                color: 'var(--primary-color)',
                border: '1px solid rgba(var(--primary-rgb, 23, 105, 255), 0.25)',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
                whiteSpace: 'nowrap',
              }}
              title={`Associated with Goal: ${linkedGoal.title}`}
            >
              <Target size={11} />
              {linkedGoal.title}
            </span>
          )}
        </div>

        {task.description && (
          <p
            style={{
              fontSize: '0.8rem',
              color: 'var(--text-secondary)',
              marginTop: '4px',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
          >
            {task.description}
          </p>
        )}

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            marginTop: '8px',
            flexWrap: 'wrap',
          }}
        >
          {showDate && task.date && (
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
                fontSize: '0.75rem',
                color: 'var(--text-muted)',
                whiteSpace: 'nowrap',
              }}
            >
              <Calendar size={12} />
              {task.date}
            </span>
          )}
          {task.startTime && (
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px',
                whiteSpace: 'nowrap',
                fontSize: '0.75rem',
                fontWeight: 600,
                color: isOverdue ? 'var(--danger)' : 'var(--text-secondary)',
                backgroundColor: isOverdue ? 'rgba(239, 68, 68, 0.12)' : 'var(--card-hover)',
                border: `1px solid ${isOverdue ? 'rgba(239, 68, 68, 0.28)' : 'var(--border-subtle)'}`,
                padding: '2px 8px',
                borderRadius: 'var(--radius-full)',
                flexShrink: 0,
              }}
              title={`Scheduled: ${formatTime(task.startTime, is12Hour)} - ${formatTime(task.endTime, is12Hour)}`}
            >
              <Clock size={11} />
              {formatTime(task.startTime, is12Hour)} – {formatTime(task.endTime, is12Hour)}
            </span>
          )}
        </div>
      </div>

      {/* Status Badge */}
      <div style={{ flexShrink: 0, marginTop: '2px' }}>
        <StatusBadge status={effectiveStatus} />
      </div>

      {/* Actions menu */}
      <div style={{ position: 'relative' }}>
        <button
          type="button"
          className="btn-icon"
          style={{ width: '32px', height: '32px' }}
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label="Task actions"
        >
          <MoreVertical size={16} />
        </button>

        {menuOpen && (
          <>
            <div
              style={{ position: 'fixed', inset: 0, zIndex: 20 }}
              onClick={() => setMenuOpen(false)}
            />
            <div
              style={{
                position: 'absolute',
                right: 0,
                top: '100%',
                background: 'var(--card-bg)',
                border: '1px solid var(--border-color)',
                borderRadius: 'var(--radius-md)',
                boxShadow: 'var(--shadow-lg)',
                padding: '6px',
                zIndex: 25,
                minWidth: '140px',
                display: 'flex',
                flexDirection: 'column',
                gap: '2px',
              }}
            >
              <button
                type="button"
                className="btn btn-ghost btn-sm"
                style={{ justifyContent: 'flex-start', width: '100%', gap: '8px' }}
                onClick={() => {
                  setMenuOpen(false);
                  openModal('task', task);
                }}
              >
                <Edit2 size={13} />
                Edit Task
              </button>
              <button
                type="button"
                className="btn btn-ghost btn-sm"
                style={{ justifyContent: 'flex-start', width: '100%', gap: '8px', color: 'var(--danger)' }}
                onClick={() => {
                  setMenuOpen(false);
                  deleteTask(task.id);
                }}
              >
                <Trash2 size={13} />
                Delete
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
