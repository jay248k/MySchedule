import React, { useState, useEffect, useMemo } from 'react';
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
      <div
        style={{
          position: 'fixed',
          bottom: '18px',
          right: '18px',
          zIndex: 9999,
          width: '320px',
          maxWidth: 'calc(100vw - 36px)',
          background: 'var(--bg-secondary, #1a2234)',
          border: '1.5px solid rgba(239, 68, 68, 0.45)',
          borderRadius: '10px',
          padding: '8px 12px',
          boxShadow: '0 8px 24px rgba(0, 0, 0, 0.45)',
          display: 'flex',
          flexDirection: 'column',
          gap: '6px',
        }}
      >
        {/* Name Row + compact counter if multiple */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
          <span
            title={currentItem.title}
            style={{
              fontSize: '0.84rem',
              fontWeight: 700,
              color: '#FFFFFF',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              flex: 1,
            }}
          >
            {currentItem.title}
          </span>

          {items.length > 1 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '3px', flexShrink: 0 }}>
              <button
                type="button"
                onClick={() => setCurrentIndex((prev) => (prev > 0 ? prev - 1 : items.length - 1))}
                style={{
                  background: 'rgba(255, 255, 255, 0.1)',
                  border: 'none',
                  color: '#FFFFFF',
                  borderRadius: '4px',
                  width: '18px',
                  height: '18px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  fontSize: '0.75rem',
                  padding: 0,
                }}
                title="Previous"
              >
                ‹
              </button>
              <span style={{ fontSize: '0.7rem', color: 'rgba(255, 255, 255, 0.65)', fontWeight: 600 }}>
                {safeIndex + 1}/{items.length}
              </span>
              <button
                type="button"
                onClick={() => setCurrentIndex((prev) => (prev < items.length - 1 ? prev + 1 : 0))}
                style={{
                  background: 'rgba(255, 255, 255, 0.1)',
                  border: 'none',
                  color: '#FFFFFF',
                  borderRadius: '4px',
                  width: '18px',
                  height: '18px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  fontSize: '0.75rem',
                  padding: 0,
                }}
                title="Next"
              >
                ›
              </button>
            </div>
          )}

          <button
            type="button"
            onClick={() => setIsDismissed(true)}
            title="Close"
            style={{
              background: 'transparent',
              border: 'none',
              color: 'rgba(255, 255, 255, 0.5)',
              cursor: 'pointer',
              padding: '2px',
              fontSize: '0.78rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            ✕
          </button>
        </div>

        {/* The 3 Action Buttons */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '6px' }}>
          <button
            type="button"
            onClick={() => handleComplete(currentItem)}
            style={{
              padding: '5px 4px',
              borderRadius: '6px',
              border: 'none',
              background: '#10B981',
              color: '#FFFFFF',
              fontSize: '0.74rem',
              fontWeight: 700,
              cursor: 'pointer',
              textAlign: 'center',
            }}
          >
            Completed
          </button>

          <button
            type="button"
            onClick={() => setReschedulingItem(currentItem)}
            style={{
              padding: '5px 4px',
              borderRadius: '6px',
              border: 'none',
              background: '#3B82F6',
              color: '#FFFFFF',
              fontSize: '0.74rem',
              fontWeight: 700,
              cursor: 'pointer',
              textAlign: 'center',
            }}
          >
            Reschedule
          </button>

          <button
            type="button"
            onClick={() => setCancellingItem(currentItem)}
            style={{
              padding: '5px 4px',
              borderRadius: '6px',
              border: 'none',
              background: '#EF4444',
              color: '#FFFFFF',
              fontSize: '0.74rem',
              fontWeight: 700,
              cursor: 'pointer',
              textAlign: 'center',
            }}
          >
            Canceled
          </button>
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
