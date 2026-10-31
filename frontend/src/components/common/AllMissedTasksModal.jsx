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
  const [activeFilter, setActiveFilter] = useState('all'); // 'all', 'tasks', 'requests'
  const [cancellingItem, setCancellingItem] = useState(null);
  const [reschedulingItem, setReschedulingItem] = useState(null);

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
            background: 'linear-gradient(135deg, rgba(20, 27, 45, 0.98) 0%, rgba(11, 17, 32, 0.99) 100%)',
            border: '1px solid rgba(239, 68, 68, 0.35)',
            borderRadius: '20px',
            width: '100%',
            maxWidth: '680px',
            maxHeight: '88vh',
            display: 'flex',
            flexDirection: 'column',
            boxShadow: '0 28px 60px -12px rgba(0, 0, 0, 0.75), 0 0 0 1px rgba(239, 68, 68, 0.25)',
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
              background: 'radial-gradient(circle, rgba(239, 68, 68, 0.22) 0%, transparent 70%)',
              pointerEvents: 'none',
            }}
          />

          {/* Modal Header */}
          <div
            style={{
              padding: '18px 24px',
              borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              background: 'rgba(239, 68, 68, 0.06)',
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
                  background: 'rgba(239, 68, 68, 0.16)',
                  border: '1px solid rgba(239, 68, 68, 0.35)',
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
                  <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800, color: '#FFFFFF', letterSpacing: '-0.01em' }}>
                    All Overdue Notifications
                  </h3>
                  <span
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      padding: '2px 8px',
                      borderRadius: '9999px',
                      background: 'rgba(239, 68, 68, 0.2)',
                      border: '1px solid rgba(239, 68, 68, 0.4)',
                      color: '#FCA5A5',
                      fontSize: '0.7rem',
                      fontWeight: 800,
                    }}
                  >
                    {missedTasks.length} Pending
                  </span>
                </div>
                <p style={{ margin: '3px 0 0 0', fontSize: '0.8rem', color: 'rgba(255, 255, 255, 0.6)' }}>
                  All items arranged in chronological order. Mark completed, reschedule, or cancel each:
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              title="Close modal"
              style={{
                background: 'rgba(255, 255, 255, 0.06)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                color: 'rgba(255, 255, 255, 0.7)',
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
                borderBottom: '1px solid rgba(255, 255, 255, 0.06)',
                display: 'flex',
                gap: '8px',
                background: 'rgba(0, 0, 0, 0.2)',
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
                      border: isActive ? '1px solid #38BDF8' : '1px solid rgba(255, 255, 255, 0.08)',
                      background: isActive ? 'rgba(56, 189, 248, 0.18)' : 'rgba(255, 255, 255, 0.04)',
                      color: isActive ? '#38BDF8' : 'rgba(255, 255, 255, 0.6)',
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
                    background: 'rgba(16, 185, 129, 0.15)',
                    border: '1px solid rgba(16, 185, 129, 0.3)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#10B981',
                    marginBottom: '14px',
                  }}
                >
                  <CheckCircle2 size={28} />
                </div>
                <h4 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800, color: '#FFFFFF' }}>
                  All Caught Up!
                </h4>
                <p style={{ margin: '6px 0 16px 0', fontSize: '0.82rem', color: 'rgba(255, 255, 255, 0.6)', maxWidth: '340px' }}>
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
                      background: 'rgba(15, 23, 42, 0.85)',
                      border: '1px solid rgba(255, 255, 255, 0.08)',
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
                            background: isReq ? 'rgba(245, 158, 11, 0.15)' : 'rgba(239, 68, 68, 0.16)',
                            border: isReq ? '1px solid rgba(245, 158, 11, 0.35)' : '1px solid rgba(239, 68, 68, 0.35)',
                            color: isReq ? '#FBBF24' : '#F87171',
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
                            color: 'rgba(255, 255, 255, 0.45)',
                            fontWeight: 700,
                          }}
                        >
                          #{idx + 1}
                        </span>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.74rem', color: 'rgba(255, 255, 255, 0.65)' }}>
                        {timeString ? (
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                            <Clock size={12} color="#38BDF8" /> {timeString}
                          </span>
                        ) : null}
                        {item.date && (
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                            <Calendar size={12} color="#A78BFA" /> {item.date}
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
                          color: '#FFFFFF',
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
                            background: 'rgba(245, 158, 11, 0.1)',
                            borderLeft: '3px solid #F59E0B',
                            fontSize: '0.76rem',
                            color: '#FDE68A',
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
                        borderTop: '1px solid rgba(255, 255, 255, 0.06)',
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
                          border: '1px solid rgba(239, 68, 68, 0.35)',
                          background: 'rgba(239, 68, 68, 0.12)',
                          color: '#FCA5A5',
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
