import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Check,
  Calendar,
  X,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  Clock,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { isTaskOverdue } from '../../utils/dateUtils';
import CancelRemarksModal from '../requests/CancelRemarksModal';
import RescheduleRequestModal from '../requests/RescheduleRequestModal';

export default function MissedTaskFloatingPopup() {
  const {
    tasks,
    requests,
    updateTask,
    toggleTaskComplete,
    completeWorkRequest,
    rescheduleWorkRequest,
    cancelWorkRequest,
    showToast,
  } = useApp();

  const [currentTime, setCurrentTime] = useState(() => Date.now());
  const [currentIndex, setCurrentIndex] = useState(0);
  const [cancellingItem, setCancellingItem] = useState(null);
  const [reschedulingItem, setReschedulingItem] = useState(null);
  const [isDismissed, setIsDismissed] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(Date.now());
    }, 30000);
    return () => clearInterval(timer);
  }, []);

  // System auto-detects overdue tasks & pending requests
  const items = useMemo(() => {
    const list = [];
    if (tasks && Array.isArray(tasks)) {
      tasks.forEach((t) => {
        if (t.status !== 'completed' && t.status !== 'cancelled' && isTaskOverdue(t)) {
          list.push({ ...t, isTask: true });
        }
      });
    }
    if (requests && Array.isArray(requests)) {
      requests.forEach((r) => {
        if (r.status === 'pending') {
          list.push({ ...r, isRequest: true });
        }
      });
    }
    return list;
  }, [tasks, requests, currentTime]);

  if (items.length === 0 || isDismissed) {
    return null;
  }

  // Bound index safely
  const safeIndex = currentIndex >= items.length ? Math.max(0, items.length - 1) : currentIndex;
  const currentItem = items[safeIndex];

  const handleComplete = (item) => {
    if (item.isTask) {
      toggleTaskComplete(item.id);
    } else {
      completeWorkRequest(item.id);
    }
    showToast({
      type: 'success',
      title: 'Completed',
      message: `"${item.title}" marked as completed.`,
    });
  };

  const handleConfirmCancel = (remarks) => {
    if (cancellingItem) {
      if (cancellingItem.isTask) {
        updateTask(cancellingItem.id, {
          status: 'cancelled',
          cancelRemarks: remarks.trim(),
          updatedAt: new Date().toISOString(),
        });
      } else {
        cancelWorkRequest(cancellingItem.id, remarks.trim());
      }
      showToast({
        type: 'warning',
        title: 'Cancelled',
        message: `"${cancellingItem.title}" cancelled with remarks: "${remarks.trim()}".`,
      });
      setCancellingItem(null);
    }
  };

  const handleConfirmReschedule = ({ date, startTime, endTime, remarks }) => {
    if (reschedulingItem) {
      if (reschedulingItem.isTask) {
        updateTask(reschedulingItem.id, {
          date,
          startTime,
          endTime,
          timeSlot: `${startTime} - ${endTime}`,
          status: 'pending',
          rescheduleNotes: remarks || '',
          updatedAt: new Date().toISOString(),
        });
      } else {
        rescheduleWorkRequest(reschedulingItem.id, { date, startTime, endTime, remarks });
      }
      showToast({
        type: 'info',
        title: 'Rescheduled',
        message: `"${reschedulingItem.title}" moved to ${date} (${startTime} - ${endTime}).`,
      });
      setReschedulingItem(null);
    }
  };

  return (
    <>
      <AnimatePresence>
        {!isDismissed && currentItem && (
          <motion.div
            initial={{ opacity: 0, y: 24, scale: 0.94 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 24, scale: 0.94 }}
            transition={{ duration: 0.24, ease: [0.16, 1, 0.3, 1] }}
            style={{
              position: 'fixed',
              bottom: '22px',
              right: '22px',
              zIndex: 9999,
              width: '350px',
              maxWidth: 'calc(100vw - 32px)',
              background: 'linear-gradient(135deg, rgba(22, 30, 49, 0.96) 0%, rgba(13, 20, 36, 0.98) 100%)',
              backdropFilter: 'blur(20px)',
              border: '1px solid rgba(255, 255, 255, 0.12)',
              borderRadius: '16px',
              padding: '14px 16px',
              boxShadow: '0 24px 48px -10px rgba(0, 0, 0, 0.65), 0 0 0 1px rgba(239, 68, 68, 0.25), inset 0 1px 0 rgba(255, 255, 255, 0.12)',
              display: 'flex',
              flexDirection: 'column',
              gap: '10px',
              overflow: 'hidden',
            }}
          >
            {/* Subtle ambient lighting accent */}
            <div
              style={{
                position: 'absolute',
                top: '-45px',
                left: '-45px',
                width: '130px',
                height: '130px',
                borderRadius: '50%',
                background: 'radial-gradient(circle, rgba(239, 68, 68, 0.22) 0%, transparent 70%)',
                pointerEvents: 'none',
              }}
            />

            {/* Header: Attention Pill + Counter + Close Button */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                position: 'relative',
                zIndex: 2,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0 }}>
                <span
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                    padding: '2px 8px',
                    borderRadius: '9999px',
                    background: 'rgba(239, 68, 68, 0.16)',
                    border: '1px solid rgba(239, 68, 68, 0.35)',
                    color: '#F87171',
                    fontSize: '0.68rem',
                    fontWeight: 800,
                    letterSpacing: '0.04em',
                    textTransform: 'uppercase',
                  }}
                >
                  <AlertTriangle size={11} strokeWidth={2.6} />
                  {currentItem.isRequest ? 'Pending Request' : 'Overdue Task'}
                </span>

                {(currentItem.startTime || currentItem.timeSlot) && (
                  <span
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px',
                      fontSize: '0.72rem',
                      color: 'rgba(255, 255, 255, 0.6)',
                      fontWeight: 600,
                      whiteSpace: 'nowrap',
                    }}
                  >
                    <Clock size={11} />
                    {currentItem.timeSlot || `${currentItem.startTime}${currentItem.endTime ? ` - ${currentItem.endTime}` : ''}`}
                  </span>
                )}
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
                {items.length > 1 && (
                  <div
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      background: 'rgba(255, 255, 255, 0.08)',
                      padding: '2px 4px',
                      borderRadius: '8px',
                      border: '1px solid rgba(255, 255, 255, 0.08)',
                    }}
                  >
                    <button
                      type="button"
                      onClick={() => setCurrentIndex((prev) => (prev > 0 ? prev - 1 : items.length - 1))}
                      style={{
                        background: 'transparent',
                        border: 'none',
                        color: 'rgba(255, 255, 255, 0.75)',
                        cursor: 'pointer',
                        padding: '1px 3px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                      title="Previous"
                    >
                      <ChevronLeft size={13} />
                    </button>
                    <span
                      style={{
                        fontSize: '0.68rem',
                        color: 'rgba(255, 255, 255, 0.85)',
                        fontWeight: 700,
                        padding: '0 3px',
                      }}
                    >
                      {safeIndex + 1}/{items.length}
                    </span>
                    <button
                      type="button"
                      onClick={() => setCurrentIndex((prev) => (prev < items.length - 1 ? prev + 1 : 0))}
                      style={{
                        background: 'transparent',
                        border: 'none',
                        color: 'rgba(255, 255, 255, 0.75)',
                        cursor: 'pointer',
                        padding: '1px 3px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                      title="Next"
                    >
                      <ChevronRight size={13} />
                    </button>
                  </div>
                )}

                <button
                  type="button"
                  onClick={() => setIsDismissed(true)}
                  title="Dismiss alert"
                  style={{
                    background: 'rgba(255, 255, 255, 0.06)',
                    border: '1px solid rgba(255, 255, 255, 0.08)',
                    color: 'rgba(255, 255, 255, 0.55)',
                    cursor: 'pointer',
                    width: '24px',
                    height: '24px',
                    borderRadius: '7px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: 'all 0.15s ease',
                  }}
                >
                  <X size={13} strokeWidth={2.4} />
                </button>
              </div>
            </div>

            {/* Task Title & Details */}
            <div style={{ position: 'relative', zIndex: 2, padding: '2px 0' }}>
              <h3
                title={currentItem.title}
                style={{
                  margin: 0,
                  fontSize: '0.96rem',
                  fontWeight: 700,
                  color: '#FFFFFF',
                  lineHeight: 1.35,
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  letterSpacing: '-0.01em',
                }}
              >
                {currentItem.title}
              </h3>
              {currentItem.date && (
                <div
                  style={{
                    fontSize: '0.74rem',
                    color: 'rgba(255, 255, 255, 0.5)',
                    marginTop: '2px',
                    fontWeight: 500,
                  }}
                >
                  Scheduled: {currentItem.date}
                </div>
              )}
            </div>

            {/* Action Buttons: Completed, Reschedule, Cancel */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1.2fr 1.25fr 0.95fr',
                gap: '8px',
                marginTop: '4px',
                position: 'relative',
                zIndex: 2,
              }}
            >
              <button
                type="button"
                onClick={() => handleComplete(currentItem)}
                style={{
                  padding: '7px 10px',
                  borderRadius: '9px',
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
                  boxShadow: '0 2px 8px rgba(16, 185, 129, 0.35)',
                  transition: 'opacity 0.15s ease',
                }}
              >
                <Check size={13} strokeWidth={2.6} />
                <span>Completed</span>
              </button>

              <button
                type="button"
                onClick={() => setReschedulingItem(currentItem)}
                style={{
                  padding: '7px 10px',
                  borderRadius: '9px',
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
                  boxShadow: '0 2px 8px rgba(59, 130, 246, 0.35)',
                  transition: 'opacity 0.15s ease',
                }}
              >
                <Calendar size={13} strokeWidth={2.4} />
                <span>Reschedule</span>
              </button>

              <button
                type="button"
                onClick={() => setCancellingItem(currentItem)}
                style={{
                  padding: '7px 8px',
                  borderRadius: '9px',
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
          </motion.div>
        )}
      </AnimatePresence>

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
