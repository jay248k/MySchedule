import React, { useState } from 'react';
import {
  X,
  Calendar as CalendarIcon,
  Plus,
  Clock,
  List as ListIcon,
  Check,
  Edit2,
  Trash2,
  MapPin,
  Target,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { formatDate, formatTime } from '../../utils/dateUtils';
import { getEffectiveStatus } from '../../utils/taskUtils';
import { DailyScheduleTimeline } from '../tasks/DailyScheduleTimeline';

export function DayDetailModal({ date, onClose }) {
  const {
    tasks,
    events,
    categories,
    goals,
    openModal,
    deleteEvent,
    deleteTask,
    toggleTaskComplete,
    settings,
  } = useApp();

  const [activeTab, setActiveTab] = useState('timeline'); // 'timeline' or 'list'
  const is12Hour = settings?.timeFormat !== '24h';

  if (!date) return null;

  // Filter tasks & events for this date
  const dayTasks = tasks.filter((t) => t.date === date);
  const dayEvents = events.filter((e) => e.date === date);
  const totalEntries = dayTasks.length + dayEvents.length;

  // Combined sorted list for List tab
  const allItems = [
    ...dayEvents.map((e) => ({ ...e, isEvent: true })),
    ...dayTasks.map((t) => ({ ...t, isEvent: false })),
  ].sort((a, b) => (a.startTime || '99:99').localeCompare(b.startTime || '99:99'));

  return (
    <div
      className="modal-backdrop"
      onClick={onClose}
      style={{
        zIndex: 1050,
        backgroundColor: 'rgba(15, 23, 42, 0.65)',
        backdropFilter: 'blur(3px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
      }}
    >
      <div
        className="modal-card"
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '100%',
          maxWidth: '640px',
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
          borderRadius: 'var(--radius-lg)',
          boxShadow: '0 20px 40px -8px rgba(0, 0, 0, 0.25)',
          overflow: 'hidden',
          background: 'var(--card-bg)',
          border: '1px solid var(--border-color)',
        }}
      >
        {/* Modal Header */}
        <div
          style={{
            padding: '20px 24px',
            borderBottom: '1px solid var(--border-color)',
            background: 'var(--card-bg)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '14px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px', minWidth: 0, flex: 1 }}>
            <div
              style={{
                width: '44px',
                height: '44px',
                borderRadius: '12px',
                background: '#EFF6FF',
                border: '1.5px solid #BFDBFE',
                color: '#1D4ED8',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <CalendarIcon size={22} strokeWidth={2.3} />
            </div>
            <div style={{ minWidth: 0 }}>
              <h2
                style={{
                  fontSize: '1.25rem',
                  fontWeight: 800,
                  color: 'var(--text-primary)',
                  margin: 0,
                  lineHeight: 1.25,
                }}
              >
                {formatDate(date, { month: 'short', day: 'numeric', year: 'numeric' })} Schedule
              </h2>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px', flexWrap: 'wrap' }}>
                <span
                  style={{
                    background: 'var(--card-hover)',
                    color: 'var(--text-secondary)',
                    border: '1px solid var(--border-color)',
                    fontSize: '0.74rem',
                    fontWeight: 700,
                    padding: '2px 8px',
                    borderRadius: '4px',
                  }}
                >
                  {totalEntries} {totalEntries === 1 ? 'entry' : 'entries'} planned
                </span>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 600 }}>
                  • {formatDate(date, { weekday: 'long' })}
                </span>
              </div>
            </div>
          </div>

          {/* Close button (X) */}
          <button
            type="button"
            className="btn-icon"
            onClick={onClose}
            aria-label="Close modal"
            style={{
              width: '36px',
              height: '36px',
              borderRadius: '50%',
              background: 'var(--card-hover)',
              border: '1px solid var(--border-color)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              color: 'var(--text-primary)',
              transition: 'all 0.15s ease',
              flexShrink: 0,
            }}
            title="Close"
          >
            <X size={20} strokeWidth={2.5} />
          </button>
        </div>

        {/* Action Toolbar strip */}
        <div
          style={{
            padding: '10px 24px',
            background: '#F8FAFC',
            borderBottom: '1px solid var(--border-color)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '10px',
          }}
        >
          {/* Segmented Switcher */}
          <div
            style={{
              display: 'inline-flex',
              background: '#E2E8F0',
              borderRadius: '6px',
              padding: '2px',
              gap: '2px',
            }}
          >
            <button
              type="button"
              onClick={() => setActiveTab('timeline')}
              style={{
                padding: '5px 14px',
                fontSize: '0.78rem',
                fontWeight: activeTab === 'timeline' ? 700 : 600,
                borderRadius: '4px',
                border: 'none',
                cursor: 'pointer',
                background: activeTab === 'timeline' ? '#1769FF' : 'transparent',
                color: activeTab === 'timeline' ? '#FFFFFF' : '#475569',
                display: 'flex',
                alignItems: 'center',
                gap: '5px',
                transition: 'all 0.15s ease',
              }}
            >
              <Clock size={13} />
              Timeline
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('list')}
              style={{
                padding: '5px 14px',
                fontSize: '0.78rem',
                fontWeight: activeTab === 'list' ? 700 : 600,
                borderRadius: '4px',
                border: 'none',
                cursor: 'pointer',
                background: activeTab === 'list' ? '#1769FF' : 'transparent',
                color: activeTab === 'list' ? '#FFFFFF' : '#475569',
                display: 'flex',
                alignItems: 'center',
                gap: '5px',
                transition: 'all 0.15s ease',
              }}
            >
              <ListIcon size={13} />
              List
            </button>
          </div>

          {/* Quick Add Buttons */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button
              type="button"
              className="btn btn-primary btn-sm"
              style={{
                padding: '6px 12px',
                fontSize: '0.8rem',
                fontWeight: 700,
                borderRadius: '6px',
                gap: '5px',
              }}
              onClick={() => {
                onClose();
                openModal('task', { date });
              }}
            >
              <Plus size={14} strokeWidth={2.5} /> Task
            </button>
            <button
              type="button"
              className="btn btn-sm"
              style={{
                padding: '6px 12px',
                fontSize: '0.8rem',
                fontWeight: 700,
                borderRadius: '6px',
                background: '#F5F3FF',
                color: '#6D28D9',
                border: '1px solid #DDD6FE',
                gap: '5px',
              }}
              onClick={() => {
                onClose();
                openModal('event', { date });
              }}
            >
              <Plus size={14} strokeWidth={2.5} /> Event
            </button>
          </div>
        </div>

        {/* Modal Scrollable Body */}
        <div
          style={{
            padding: '20px 24px',
            overflowY: 'auto',
            maxHeight: '520px',
            flex: 1,
          }}
        >
          {activeTab === 'timeline' ? (
            <DailyScheduleTimeline
              date={date}
              compact={false}
              showHeader={false}
              includeEvents={true}
              onAddTask={() => {
                onClose();
                openModal('task', { date });
              }}
              onAddEvent={() => {
                onClose();
                openModal('event', { date });
              }}
              emptyMessage={`No tasks or events scheduled for ${formatDate(date, { month: 'short', day: 'numeric' })}.`}
            />
          ) : allItems.length === 0 ? (
            <div
              style={{
                textAlign: 'center',
                padding: '48px 16px',
                color: 'var(--text-muted)',
                fontSize: '0.92rem',
              }}
            >
              No scheduled items for this date.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {allItems.map((item) => {
                const isEvent = !!item.isEvent;
                const cat = categories.find((c) => c.id === item.categoryId) || {
                  color: isEvent ? '#8B5CF6' : '#1769FF',
                  name: isEvent ? 'Event' : 'General',
                };
                const effectiveStatus = isEvent ? 'scheduled' : getEffectiveStatus(item);
                const isCompleted = !isEvent && effectiveStatus === 'completed';

                const linkedGoal = goals.find(
                  (g) => g.id === item.goalId || g.relatedTaskIds?.includes(item.id)
                );

                return (
                  <div
                    key={item.id}
                    style={{
                      padding: '14px 16px',
                      borderRadius: 'var(--radius-md)',
                      background: 'var(--page-bg)',
                      border: '1px solid var(--border-color)',
                      borderLeft: `4px solid ${isEvent ? '#8B5CF6' : cat.color || '#1769FF'}`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: '12px',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', minWidth: 0, flex: 1 }}>
                      {!isEvent && (
                        <div
                          className={`custom-checkbox ${isCompleted ? 'checked' : ''}`}
                          style={{ width: '18px', height: '18px', marginTop: '2px', flexShrink: 0 }}
                          onClick={() => toggleTaskComplete(item.id)}
                          title={isCompleted ? 'Mark incomplete' : 'Mark complete'}
                        >
                          {isCompleted && <Check size={12} strokeWidth={3} />}
                        </div>
                      )}

                      <div style={{ minWidth: 0, flex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                          <span
                            className={`badge ${isEvent ? 'badge-primary' : 'badge-neutral'}`}
                            style={{ fontSize: '0.72rem', padding: '1px 6px' }}
                          >
                            {isEvent ? 'Event' : 'Task'}
                          </span>
                          <strong
                            style={{
                              fontSize: '0.95rem',
                              color: 'var(--text-primary)',
                              textDecoration: isCompleted ? 'line-through' : 'none',
                              opacity: isCompleted ? 0.7 : 1,
                            }}
                          >
                            {item.title}
                          </strong>
                          {item.priority && (
                            <span
                              style={{
                                padding: '1px 6px',
                                borderRadius: '4px',
                                fontSize: '0.7rem',
                                fontWeight: 700,
                                background: item.priority === 'High' ? '#FEE2E2' : '#FEF3C7',
                                color: item.priority === 'High' ? '#991B1B' : '#92400E',
                              }}
                            >
                              {item.priority}
                            </span>
                          )}
                        </div>

                        {item.description && (
                          <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', margin: '4px 0 0 0' }}>
                            {item.description}
                          </p>
                        )}

                        <div
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '12px',
                            fontSize: '0.76rem',
                            color: 'var(--text-muted)',
                            marginTop: '6px',
                            flexWrap: 'wrap',
                          }}
                        >
                          <span>
                            <Clock size={12} style={{ display: 'inline', marginRight: '4px' }} />
                            {item.startTime
                              ? `${formatTime(item.startTime, is12Hour)} - ${formatTime(item.endTime, is12Hour)}`
                              : 'All day'}
                          </span>
                          {item.location && (
                            <span>
                              <MapPin size={12} style={{ display: 'inline', marginRight: '4px' }} />
                              {item.location}
                            </span>
                          )}
                          {linkedGoal && (
                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
                              <Target size={11} color="var(--primary-color)" />
                              {linkedGoal.title}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Actions: Edit & Delete */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
                      <button
                        type="button"
                        className="btn-icon"
                        style={{ width: '32px', height: '32px' }}
                        onClick={() => {
                          onClose();
                          if (isEvent) openModal('event', item);
                          else openModal('task', item);
                        }}
                        title="Edit"
                      >
                        <Edit2 size={15} />
                      </button>
                      <button
                        type="button"
                        className="btn-icon"
                        style={{ width: '32px', height: '32px', color: 'var(--danger)' }}
                        onClick={() => {
                          if (isEvent) deleteEvent(item.id);
                          else deleteTask(item.id);
                        }}
                        title="Delete"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div
          style={{
            padding: '12px 24px',
            borderTop: '1px solid var(--border-color)',
            background: 'var(--page-bg)',
            display: 'flex',
            justifyContent: 'flex-end',
            gap: '10px',
          }}
        >
          <button
            type="button"
            className="btn btn-secondary"
            onClick={onClose}
            style={{ padding: '8px 20px', fontWeight: 700 }}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
