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
  Layers,
  Play,
  RotateCcw,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { isTaskOverdue, getTodayDateString } from '../../utils/dateUtils';
import CancelRemarksModal from '../requests/CancelRemarksModal';
import RescheduleRequestModal from '../requests/RescheduleRequestModal';
import AllMissedTasksModal from './AllMissedTasksModal';

export default function MissedTaskFloatingPopup() {
  const {
    tasks,
    requests,
    updateTask,
    toggleTaskComplete,
    completeWorkRequest,
    rescheduleWorkRequest,
    cancelWorkRequest,
    workChains,
    startWorkSession,
    activeWorkSession,
    showToast,
  } = useApp();

  const [currentTime, setCurrentTime] = useState(() => Date.now());
  const [currentIndex, setCurrentIndex] = useState(0);
  const [cancellingItem, setCancellingItem] = useState(null);
  const [reschedulingItem, setReschedulingItem] = useState(null);
  const [isDismissed, setIsDismissed] = useState(false);
  const [showAllModal, setShowAllModal] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(Date.now());
    }, 30000);
    return () => clearInterval(timer);
  }, []);

  // System auto-detects overdue tasks & pending requests in timely sequence
  const items = useMemo(() => {
    const list = [];

    // Check if work session is currently paused
    const todayStr = getTodayDateString();
    const todayChain = workChains?.[todayStr];
    const isWorkPaused = todayChain?.status === 'paused' && !activeWorkSession?.isRunning;
    if (isWorkPaused) {
      list.push({
        id: 'work-paused-notification',
        isWorkPaused: true,
        title: `Work Paused: ${todayChain.lastPauseReason || 'Break'}`,
        reason: todayChain.lastPauseReason || 'Break',
        remarks: todayChain.lastPauseRemarks || '',
        stoppedAt: todayChain.lastPausedTimeStr || '',
        accumulatedSeconds: todayChain.accumulatedWorkSeconds || 0,
      });
    }

    const taskItems = [];
    if (tasks && Array.isArray(tasks)) {
      tasks.forEach((t) => {
        if (t.status !== 'completed' && t.status !== 'cancelled' && isTaskOverdue(t)) {
          taskItems.push({ ...t, isTask: true });
        }
      });
    }
    if (requests && Array.isArray(requests)) {
      requests.forEach((r) => {
        if (r.status === 'pending') {
          taskItems.push({ ...r, isRequest: true });
        }
      });
    }

    // Sort tasks strictly in timely sequence (date ascending, time ascending)
    taskItems.sort((a, b) => {
      const dateA = a.date || '9999-99-99';
      const dateB = b.date || '9999-99-99';
      if (dateA !== dateB) return dateA.localeCompare(dateB);

      const timeA = a.startTime || a.timeSlot?.split('-')[0]?.trim() || '99:99';
      const timeB = b.startTime || b.timeSlot?.split('-')[0]?.trim() || '99:99';
      return timeA.localeCompare(timeB);
    });

    return [...list, ...taskItems];
  }, [tasks, requests, currentTime, workChains, activeWorkSession]);

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

  const handleCancelItem = (targetItemOrRemarks, maybeRemarks) => {
    let item = cancellingItem;
    let remarks = '';

    if (typeof targetItemOrRemarks === 'string') {
      remarks = targetItemOrRemarks;
    } else if (targetItemOrRemarks && typeof targetItemOrRemarks === 'object') {
      item = targetItemOrRemarks;
      remarks = maybeRemarks || '';
    }

    if (item && remarks) {
      if (item.isTask) {
        updateTask(item.id, {
          status: 'cancelled',
          cancelRemarks: remarks.trim(),
          updatedAt: new Date().toISOString(),
        });
      } else {
        cancelWorkRequest(item.id, remarks.trim());
      }
      showToast({
        type: 'warning',
        title: 'Cancelled',
        message: `"${item.title}" cancelled with remarks: "${remarks.trim()}".`,
      });
      setCancellingItem(null);
    }
  };

  const handleRescheduleItem = (targetItemOrPayload, maybePayload) => {
    let item = reschedulingItem;
    let payload = null;

    if (maybePayload) {
      item = targetItemOrPayload;
      payload = maybePayload;
    } else {
      payload = targetItemOrPayload;
    }

    if (item && payload && payload.date) {
      if (item.isTask) {
        updateTask(item.id, {
          date: payload.date,
          startTime: payload.startTime,
          endTime: payload.endTime,
          timeSlot: `${payload.startTime} - ${payload.endTime}`,
          status: 'pending',
          rescheduleNotes: payload.remarks || '',
          updatedAt: new Date().toISOString(),
        });
      } else {
        rescheduleWorkRequest(item.id, {
          date: payload.date,
          rescheduledDate: payload.date,
          startTime: payload.startTime,
          rescheduledStartTime: payload.startTime,
          endTime: payload.endTime,
          rescheduledEndTime: payload.endTime,
          remarks: payload.remarks || '',
          actionRemarks: payload.remarks || '',
        });
      }
      showToast({
        type: 'info',
        title: 'Rescheduled',
        message: `"${item.title}" moved to ${payload.date} (${payload.startTime} - ${payload.endTime}).`,
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
              bottom: '20px',
              right: '20px',
              zIndex: 9999,
              width: '320px',
              maxWidth: 'calc(100vw - 32px)',
              background: 'linear-gradient(135deg, rgba(20, 27, 45, 0.97) 0%, rgba(11, 17, 32, 0.98) 100%)',
              backdropFilter: 'blur(20px)',
              border: '1px solid rgba(255, 255, 255, 0.12)',
              borderRadius: '14px',
              padding: '11px 13px',
              boxShadow: '0 20px 40px -8px rgba(0, 0, 0, 0.7), 0 0 0 1px rgba(239, 68, 68, 0.28), inset 0 1px 0 rgba(255, 255, 255, 0.1)',
              display: 'flex',
              flexDirection: 'column',
              gap: '8px',
              overflow: 'hidden',
            }}
          >
            {/* Subtle ambient lighting accent */}
            <div
              style={{
                position: 'absolute',
                top: '-45px',
                left: '-45px',
                width: '120px',
                height: '120px',
                borderRadius: '50%',
                background: 'radial-gradient(circle, rgba(239, 68, 68, 0.2) 0%, transparent 70%)',
                pointerEvents: 'none',
              }}
            />

            {/* Header: Attention Pill + Count Badge (if 2+) + Close Button */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                position: 'relative',
                zIndex: 2,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                    padding: '2px 8px',
                    borderRadius: '9999px',
                    background: currentItem.isWorkPaused
                      ? 'rgba(245, 158, 11, 0.2)'
                      : currentItem.isRequest
                      ? 'rgba(245, 158, 11, 0.16)'
                      : 'rgba(239, 68, 68, 0.16)',
                    border: currentItem.isWorkPaused
                      ? '1px solid rgba(245, 158, 11, 0.55)'
                      : currentItem.isRequest
                      ? '1px solid rgba(245, 158, 11, 0.35)'
                      : '1px solid rgba(239, 68, 68, 0.35)',
                    color: currentItem.isWorkPaused ? '#FBBF24' : currentItem.isRequest ? '#FBBF24' : '#F87171',
                    fontSize: '0.66rem',
                    fontWeight: 800,
                    letterSpacing: '0.04em',
                    textTransform: 'uppercase',
                  }}
                >
                  {currentItem.isWorkPaused ? (
                    <Clock size={11} strokeWidth={2.6} />
                  ) : (
                    <AlertTriangle size={11} strokeWidth={2.6} />
                  )}
                  {currentItem.isWorkPaused ? 'Work Paused' : currentItem.isRequest ? 'Pending Request' : 'Overdue Task'}
                </span>
              </div>

              {/* Top Right: Count Badge (if 2+) & Close Button */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
                {items.length >= 2 && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowAllModal(true);
                    }}
                    title="Click to open all notifications module"
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px',
                      padding: '3px 9px',
                      borderRadius: '9999px',
                      background: currentItem.isWorkPaused ? 'rgba(245, 158, 11, 0.25)' : 'rgba(239, 68, 68, 0.22)',
                      border: currentItem.isWorkPaused ? '1px solid rgba(245, 158, 11, 0.5)' : '1px solid rgba(239, 68, 68, 0.5)',
                      color: currentItem.isWorkPaused ? '#FDE68A' : '#FECACA',
                      fontSize: '0.68rem',
                      fontWeight: 800,
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                      boxShadow: '0 2px 6px rgba(0, 0, 0, 0.25)',
                    }}
                  >
                    <Layers size={11} strokeWidth={2.5} />
                    <span>{items.length} Notifications</span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsDismissed(true);
                  }}
                  title="Close notification"
                  style={{
                    background: 'rgba(255, 255, 255, 0.06)',
                    border: '1px solid rgba(255, 255, 255, 0.08)',
                    color: 'rgba(255, 255, 255, 0.65)',
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
            {currentItem.isWorkPaused ? (
              <div style={{ position: 'relative', zIndex: 2, padding: '2px 0' }}>
                <h3
                  style={{
                    margin: 0,
                    fontSize: '0.94rem',
                    fontWeight: 800,
                    color: '#FFFFFF',
                    lineHeight: 1.35,
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    letterSpacing: '-0.01em',
                  }}
                >
                  ⏸️ Work Paused: {currentItem.reason || 'Break'}
                </h3>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    marginTop: '3px',
                    fontSize: '0.74rem',
                    color: 'rgba(255, 255, 255, 0.75)',
                    fontWeight: 500,
                  }}
                >
                  {currentItem.stoppedAt && (
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
                      <Clock size={11} color="#FBBF24" />
                      Stopped at: {currentItem.stoppedAt}
                    </span>
                  )}
                  {currentItem.accumulatedSeconds > 0 && (
                    <span style={{ color: '#34D399', fontWeight: 700 }}>
                      · {(currentItem.accumulatedSeconds / 3600).toFixed(1)}h logged
                    </span>
                  )}
                </div>
                {currentItem.remarks && currentItem.remarks !== currentItem.reason && (
                  <div style={{ fontSize: '0.72rem', color: '#94A3B8', fontStyle: 'italic', marginTop: '2px' }}>
                    "{currentItem.remarks}"
                  </div>
                )}
              </div>
            ) : (
              <div
                style={{ position: 'relative', zIndex: 2, padding: '2px 0', cursor: 'pointer' }}
                onClick={() => setShowAllModal(true)}
                title="Click to view all notifications in module card"
              >
                <h3
                  title={currentItem.title}
                  style={{
                    margin: 0,
                    fontSize: '0.94rem',
                    fontWeight: 800,
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
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    marginTop: '3px',
                    fontSize: '0.74rem',
                    color: 'rgba(255, 255, 255, 0.6)',
                    fontWeight: 500,
                  }}
                >
                  {(currentItem.startTime || currentItem.timeSlot) && (
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
                      <Clock size={11} color="#38BDF8" />
                      {currentItem.timeSlot || `${currentItem.startTime}${currentItem.endTime ? ` - ${currentItem.endTime}` : ''}`}
                    </span>
                  )}
                  {currentItem.date && (
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
                      <Calendar size={11} color="#C084FC" />
                      {currentItem.date}
                    </span>
                  )}
                </div>
              </div>
            )}

            {/* Action Buttons: Work Paused -> Restart Work; Otherwise: Completed, Reschedule, Cancel */}
            {currentItem.isWorkPaused ? (
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '6px',
                  marginTop: '2px',
                  position: 'relative',
                  zIndex: 2,
                }}
              >
                <button
                  type="button"
                  id="btn-popup-restart-work"
                  onClick={() => {
                    startWorkSession();
                    showToast({
                      type: 'success',
                      title: 'Work Resumed',
                      message: 'Timer tracking resumed from where you stopped!',
                    });
                  }}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: '8px',
                    border: 'none',
                    background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
                    color: '#FFFFFF',
                    fontSize: '0.8rem',
                    fontWeight: 800,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px',
                    boxShadow: '0 2px 8px rgba(16, 185, 129, 0.4)',
                  }}
                >
                  <Play size={14} fill="#FFFFFF" />
                  <span>Restart Work Now</span>
                </button>

                {items.length > 1 && (
                  <button
                    type="button"
                    onClick={() => {
                      setCurrentIndex((prev) => (prev + 1) % items.length);
                    }}
                    style={{
                      background: 'transparent',
                      border: 'none',
                      color: '#93C5FD',
                      fontSize: '0.7rem',
                      fontWeight: 600,
                      cursor: 'pointer',
                      textAlign: 'center',
                      textDecoration: 'underline',
                      padding: '2px',
                    }}
                  >
                    Show Other Notifications ({items.length - 1} pending)
                  </button>
                )}
              </div>
            ) : (
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1.15fr 1.2fr 0.9fr',
                  gap: '6px',
                  marginTop: '2px',
                  position: 'relative',
                  zIndex: 2,
                }}
              >
                <button
                  type="button"
                  onClick={() => handleComplete(currentItem)}
                  style={{
                    padding: '6px 8px',
                    borderRadius: '8px',
                    border: 'none',
                    background: 'linear-gradient(135deg, #059669 0%, #10B981 100%)',
                    color: '#FFFFFF',
                    fontSize: '0.72rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '4px',
                    boxShadow: '0 2px 6px rgba(16, 185, 129, 0.35)',
                    transition: 'opacity 0.15s ease',
                  }}
                >
                  <Check size={12} strokeWidth={2.6} />
                  <span>Completed</span>
                </button>

                <button
                  type="button"
                  onClick={() => setReschedulingItem(currentItem)}
                  style={{
                    padding: '6px 8px',
                    borderRadius: '8px',
                    border: 'none',
                    background: 'linear-gradient(135deg, #1D4ED8 0%, #3B82F6 100%)',
                    color: '#FFFFFF',
                    fontSize: '0.72rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '4px',
                    boxShadow: '0 2px 6px rgba(59, 130, 246, 0.35)',
                    transition: 'opacity 0.15s ease',
                  }}
                >
                  <Calendar size={12} strokeWidth={2.4} />
                  <span>Reschedule</span>
                </button>

                <button
                  type="button"
                  onClick={() => setCancellingItem(currentItem)}
                  style={{
                    padding: '6px 6px',
                    borderRadius: '8px',
                    border: '1px solid rgba(239, 68, 68, 0.35)',
                    background: 'rgba(239, 68, 68, 0.12)',
                    color: '#FCA5A5',
                    fontSize: '0.72rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '3px',
                    transition: 'all 0.15s ease',
                  }}
                >
                  <X size={11} strokeWidth={2.6} />
                  <span>Canceled</span>
                </button>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* All Notifications Modal (Opened when clicking count or title on card) */}
      <AllMissedTasksModal
        isOpen={showAllModal}
        onClose={() => setShowAllModal(false)}
        missedTasks={items}
        onComplete={handleComplete}
        onReschedule={handleRescheduleItem}
        onCancel={handleCancelItem}
      />

      {/* Mandatory Cancel Remarks Modal */}
      <CancelRemarksModal
        isOpen={!!cancellingItem}
        requestTitle={cancellingItem?.title || ''}
        onClose={() => setCancellingItem(null)}
        onConfirm={(remarks) => handleCancelItem(cancellingItem, remarks)}
      />

      {/* Reschedule Modal */}
      <RescheduleRequestModal
        isOpen={!!reschedulingItem}
        request={reschedulingItem}
        onClose={() => setReschedulingItem(null)}
        onConfirm={(payload) => handleRescheduleItem(reschedulingItem, payload)}
      />
    </>
  );
}
