import React, { useState, useMemo } from 'react';
import {
  Check,
  Calendar,
  X,
  AlertTriangle,
  Clock,
  Layers,
  Sparkles,
  CheckCircle2,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import CancelRemarksModal from '../requests/CancelRemarksModal';
import RescheduleRequestModal from '../requests/RescheduleRequestModal';

export default function AllMissedTasksModal({
  isOpen,
  onClose,
  missedTasks = [],
  onComplete,
  onReschedule,
  onCancel,
}) {
  const { settings } = useApp();
  const [activeFilter, setActiveFilter] = useState('all'); // 'all', 'tasks', 'requests'
  const [cancellingItem, setCancellingItem] = useState(null);
  const [reschedulingItem, setReschedulingItem] = useState(null);

  const isDark = useMemo(() => {
    if (typeof document !== 'undefined') {
      const dataTheme = document.documentElement.getAttribute('data-theme');
      if (dataTheme === 'dark' || dataTheme === 'oled') return true;
      if (dataTheme === 'light' || dataTheme === 'paper') return false;
      if (document.documentElement.classList.contains('dark-mode')) return true;
    }
    return settings?.theme === 'dark' || settings?.theme === 'oled';
  }, [settings?.theme]);

  const filteredItems = useMemo(() => {
    if (activeFilter === 'tasks') {
      return missedTasks.filter((item) => item.isTask || !item.isRequest);
    }
    if (activeFilter === 'requests') {
      return missedTasks.filter((item) => item.isRequest);
    }
    return missedTasks;
  }, [missedTasks, activeFilter]);

  if (!isOpen) return null;

  const handleConfirmCancel = (remarks) => {
    if (cancellingItem) {
      onCancel(cancellingItem, remarks);
      setCancellingItem(null);
    }
  };

  const handleConfirmReschedule = ({ date, startTime, endTime, remarks }) => {
    if (reschedulingItem) {
      onReschedule(reschedulingItem, { date, startTime, endTime, remarks });
      setReschedulingItem(null);
    }
  };

  const taskCount = missedTasks.filter((t) => t.isTask || !t.isRequest).length;
  const requestCount = missedTasks.filter((t) => t.isRequest).length;

  return (
    <>
      <div
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: 10000,
          backgroundColor: 'rgba(5, 10, 20, 0.78)',
          backdropFilter: 'blur(10px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '16px',
        }}
        onClick={(e) => {
          if (e.target === e.currentTarget) onClose();
        }}
      >
        <div
          style={{
            background: isDark
              ? 'linear-gradient(135deg, rgba(20, 27, 45, 0.98) 0%, rgba(11, 17, 32, 0.99) 100%)'
              : '#FFFFFF',
            border: isDark ? '1px solid rgba(239, 68, 68, 0.35)' : '1px solid #E2E8F0',
            borderRadius: '20px',
            width: '100%',
            maxWidth: '680px',
            maxHeight: '88vh',
            display: 'flex',
            flexDirection: 'column',
            boxShadow: isDark
              ? '0 28px 60px -12px rgba(0, 0, 0, 0.75), 0 0 0 1px rgba(239, 68, 68, 0.25)'
              : '0 24px 60px -10px rgba(15, 23, 42, 0.18), 0 0 0 1px rgba(239, 68, 68, 0.2)',
            overflow: 'hidden',
            animation: 'fadeIn 0.2s ease-out',
            position: 'relative',
          }}
        >
          {/* Subtle Ambient Red Glow Accent */}
          <div
            style={{
              position: 'absolute',
              top: '-60px',
              left: '50%',
              transform: 'translateX(-50%)',
              width: '260px',
              height: '140px',
              borderRadius: '50%',
              background: isDark
                ? 'radial-gradient(circle, rgba(239, 68, 68, 0.22) 0%, transparent 70%)'
                : 'radial-gradient(circle, rgba(239, 68, 68, 0.08) 0%, transparent 70%)',
              pointerEvents: 'none',
            }}
          />

          {/* Modal Header */}
          <div
            style={{
              padding: '18px 24px',
              borderBottom: isDark ? '1px solid rgba(255, 255, 255, 0.08)' : '1px solid #E2E8F0',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              background: isDark ? 'rgba(239, 68, 68, 0.06)' : '#FEF2F2',
              position: 'relative',
              zIndex: 2,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div
                style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '12px',
                  background: isDark ? 'rgba(239, 68, 68, 0.16)' : '#FEE2E2',
                  border: isDark ? '1px solid rgba(239, 68, 68, 0.35)' : '1px solid #FCA5A5',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#EF4444',
                }}
              >
                <AlertTriangle size={20} strokeWidth={2.4} />
              </div>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800, color: isDark ? '#FFFFFF' : '#0F172A', letterSpacing: '-0.01em' }}>
                    All Overdue Notifications
                  </h3>
                  <span
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      padding: '2px 8px',
                      borderRadius: '9999px',
                      background: isDark ? 'rgba(239, 68, 68, 0.2)' : '#FEE2E2',
                      border: isDark ? '1px solid rgba(239, 68, 68, 0.4)' : '1px solid #FCA5A5',
                      color: isDark ? '#FCA5A5' : '#DC2626',
                      fontSize: '0.7rem',
                      fontWeight: 800,
                    }}
                  >
                    {missedTasks.length} Pending
                  </span>
                </div>
                <p style={{ margin: '3px 0 0 0', fontSize: '0.8rem', color: isDark ? 'rgba(255, 255, 255, 0.6)' : '#475569' }}>
                  All items arranged in chronological order. Mark completed, reschedule, or cancel each:
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              title="Close modal"
              style={{
                background: isDark ? 'rgba(255, 255, 255, 0.06)' : '#F1F5F9',
                border: isDark ? '1px solid rgba(255, 255, 255, 0.1)' : '1px solid #E2E8F0',
                color: isDark ? 'rgba(255, 255, 255, 0.7)' : '#475569',
                cursor: 'pointer',
                width: '32px',
                height: '32px',
                borderRadius: '9px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'all 0.15s ease',
              }}
            >
              <X size={18} strokeWidth={2.2} />
            </button>
          </div>

          {/* Filter Pills Bar */}
          {missedTasks.length > 0 && (
            <div
              style={{
                padding: '10px 24px',
                borderBottom: isDark ? '1px solid rgba(255, 255, 255, 0.06)' : '1px solid #E2E8F0',
                display: 'flex',
                gap: '8px',
                background: isDark ? 'rgba(0, 0, 0, 0.2)' : '#F8FAFC',
              }}
            >
              {[
                { id: 'all', label: `All (${missedTasks.length})` },
                { id: 'tasks', label: `Overdue Tasks (${taskCount})` },
                { id: 'requests', label: `Pending Requests (${requestCount})` },
              ].map((tab) => {
                const isActive = activeFilter === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveFilter(tab.id)}
                    style={{
                      padding: '5px 12px',
                      borderRadius: '9999px',
                      border: isActive
                        ? '1px solid #38BDF8'
                        : isDark
                        ? '1px solid rgba(255, 255, 255, 0.08)'
                        : '1px solid #E2E8F0',
                      background: isActive
                        ? (isDark ? 'rgba(56, 189, 248, 0.18)' : '#E0F2FE')
                        : (isDark ? 'rgba(255, 255, 255, 0.04)' : '#FFFFFF'),
                      color: isActive ? '#0284C7' : (isDark ? 'rgba(255, 255, 255, 0.6)' : '#64748B'),
                      fontSize: '0.74rem',
                      fontWeight: 700,
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    {tab.label}
                  </button>
                );
              })}
            </div>
          )}

          {/* List of Notification Cards */}
          <div
            style={{
              padding: '18px 24px',
              overflowY: 'auto',
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              gap: '12px',
            }}
          >
            {filteredItems.length === 0 ? (
              <div
                style={{
                  padding: '48px 20px',
                  textAlign: 'center',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <div
                  style={{
                    width: '54px',
                    height: '54px',
                    borderRadius: '50%',
                    background: isDark ? 'rgba(16, 185, 129, 0.15)' : '#DCFCE7',
                    border: isDark ? '1px solid rgba(16, 185, 129, 0.3)' : '1px solid #86EFAC',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#10B981',
                    marginBottom: '14px',
                  }}
                >
                  <CheckCircle2 size={28} />
                </div>
                <h4 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800, color: isDark ? '#FFFFFF' : '#0F172A' }}>
                  All Caught Up!
                </h4>
                <p style={{ margin: '6px 0 16px 0', fontSize: '0.82rem', color: isDark ? 'rgba(255, 255, 255, 0.6)' : '#64748B', maxWidth: '340px' }}>
                  There are no overdue tasks or pending requests remaining right now.
                </p>
                <button
                  onClick={onClose}
                  style={{
                    padding: '8px 20px',
                    borderRadius: '10px',
                    background: '#1D4ED8',
                    border: 'none',
                    color: '#FFFFFF',
                    fontSize: '0.8rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                  }}
                >
                  Close Window
                </button>
              </div>
            ) : (
              filteredItems.map((item, idx) => {
                const isReq = item.isRequest;
                const timeString = item.timeSlot || `${item.startTime || ''}${item.endTime ? ` - ${item.endTime}` : ''}`.trim();

                return (
                  <div
                    key={item.id || idx}
                    style={{
                      background: isDark ? 'rgba(15, 23, 42, 0.85)' : '#F8FAFC',
                      border: isDark ? '1px solid rgba(255, 255, 255, 0.08)' : '1px solid #E2E8F0',
                      borderRadius: '14px',
                      padding: '14px 16px',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '10px',
                      transition: 'border-color 0.15s ease',
                    }}
                  >
                    {/* Top Row: Type Pill + Sequence Index + Time & Date Tags */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                            padding: '2px 8px',
                            borderRadius: '9999px',
                            background: isReq
                              ? (isDark ? 'rgba(245, 158, 11, 0.15)' : '#FEF3C7')
                              : (isDark ? 'rgba(239, 68, 68, 0.16)' : '#FEE2E2'),
                            border: isReq
                              ? (isDark ? '1px solid rgba(245, 158, 11, 0.35)' : '1px solid #FCD34D')
                              : (isDark ? '1px solid rgba(239, 68, 68, 0.35)' : '1px solid #FCA5A5'),
                            color: isReq
                              ? (isDark ? '#FBBF24' : '#B45309')
                              : (isDark ? '#F87171' : '#DC2626'),
                            fontSize: '0.66rem',
                            fontWeight: 800,
                            letterSpacing: '0.03em',
                            textTransform: 'uppercase',
                          }}
                        >
                          <AlertTriangle size={10} strokeWidth={2.6} />
                          {isReq ? 'Pending Request' : 'Overdue Task'}
                        </span>

                        <span
                          style={{
                            fontSize: '0.68rem',
                            color: isDark ? 'rgba(255, 255, 255, 0.45)' : '#64748B',
                            fontWeight: 700,
                          }}
                        >
                          #{idx + 1}
                        </span>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.74rem', color: isDark ? 'rgba(255, 255, 255, 0.65)' : '#475569' }}>
                        {timeString ? (
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                            <Clock size={12} color="#0284C7" /> {timeString}
                          </span>
                        ) : null}
                        {item.date && (
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                            <Calendar size={12} color="#7C3AED" /> {item.date}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Middle: Title & Reason/Notes */}
                    <div>
                      <h4
                        style={{
                          margin: 0,
                          fontSize: '0.96rem',
                          fontWeight: 800,
                          color: isDark ? '#FFFFFF' : '#0F172A',
                          lineHeight: 1.35,
                        }}
                      >
                        {item.title}
                      </h4>
                      {item.reason && (
                        <div
                          style={{
                            marginTop: '6px',
                            padding: '6px 10px',
                            borderRadius: '8px',
                            background: isDark ? 'rgba(245, 158, 11, 0.1)' : '#FEF3C7',
                            borderLeft: '3px solid #F59E0B',
                            fontSize: '0.76rem',
                            color: isDark ? '#FDE68A' : '#92400E',
                            lineHeight: 1.4,
                          }}
                        >
                          <strong style={{ color: '#F59E0B' }}>Reason: </strong>
                          {item.reason}
                        </div>
                      )}
                    </div>

                    {/* Bottom: 3 Actions Grid */}
                    <div
                      style={{
                        display: 'grid',
                        gridTemplateColumns: '1.2fr 1.25fr 0.95fr',
                        gap: '8px',
                        paddingTop: '8px',
                        borderTop: isDark ? '1px solid rgba(255, 255, 255, 0.06)' : '1px solid #E2E8F0',
                      }}
                    >
                      <button
                        onClick={() => onComplete(item)}
                        style={{
                          padding: '7px 10px',
                          borderRadius: '8px',
                          border: 'none',
                          background: 'linear-gradient(135deg, #059669 0%, #10B981 100%)',
                          color: '#FFFFFF',
                          fontSize: '0.76rem',
                          fontWeight: 700,
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '5px',
                          boxShadow: '0 2px 6px rgba(16, 185, 129, 0.3)',
                          transition: 'opacity 0.15s ease',
                        }}
                      >
                        <Check size={13} strokeWidth={2.6} />
                        <span>Completed</span>
                      </button>

                      <button
                        onClick={() => setReschedulingItem(item)}
                        style={{
                          padding: '7px 10px',
                          borderRadius: '8px',
                          border: 'none',
                          background: 'linear-gradient(135deg, #1D4ED8 0%, #3B82F6 100%)',
                          color: '#FFFFFF',
                          fontSize: '0.76rem',
                          fontWeight: 700,
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '5px',
                          boxShadow: '0 2px 6px rgba(59, 130, 246, 0.3)',
                          transition: 'opacity 0.15s ease',
                        }}
                      >
                        <Calendar size={13} strokeWidth={2.4} />
                        <span>Reschedule</span>
                      </button>

                      <button
                        onClick={() => setCancellingItem(item)}
                        style={{
                          padding: '7px 8px',
                          borderRadius: '8px',
                          border: isDark ? '1px solid rgba(239, 68, 68, 0.35)' : '1px solid #FECACA',
                          background: isDark ? 'rgba(239, 68, 68, 0.12)' : '#FEF2F2',
                          color: isDark ? '#FCA5A5' : '#DC2626',
                          fontSize: '0.76rem',
                          fontWeight: 700,
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '4px',
                          transition: 'all 0.15s ease',
                        }}
                      >
                        <X size={12} strokeWidth={2.6} />
                        <span>Canceled</span>
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* Mandatory Cancel Remarks Modal */}
      <CancelRemarksModal
        isOpen={!!cancellingItem}
        requestTitle={cancellingItem?.title || ''}
        onClose={() => setCancellingItem(null)}
        onConfirm={handleConfirmCancel}
      />

      {/* Reschedule Modal */}
      <RescheduleRequestModal
        isOpen={!!reschedulingItem}
        request={reschedulingItem}
        onClose={() => setReschedulingItem(null)}
        onConfirm={handleConfirmReschedule}
      />
    </>
  );
}
