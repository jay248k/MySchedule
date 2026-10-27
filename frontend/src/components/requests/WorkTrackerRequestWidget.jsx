import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Check, Calendar, X, AlertCircle, Clock, FileText, ArrowRight, PlusCircle, Layers } from 'lucide-react';
import CancelRemarksModal from './CancelRemarksModal';
import RescheduleRequestModal from './RescheduleRequestModal';
import AllRequestsModal from './AllRequestsModal';
import SubmitRequestModal from './SubmitRequestModal';

export default function WorkTrackerRequestWidget() {
  const { requests, completeWorkRequest, rescheduleWorkRequest, cancelWorkRequest } = useApp();

  const [isSubmitModalOpen, setIsSubmitModalOpen] = useState(false);
  const [isAllModalOpen, setIsAllModalOpen] = useState(false);
  const [cancellingRequest, setCancellingRequest] = useState(null);
  const [reschedulingRequest, setReschedulingRequest] = useState(null);

  const pendingRequests = (requests || []).filter((r) => r.status === 'pending');
  const singleRequest = pendingRequests.length === 1 ? pendingRequests[0] : null;

  const handleMarkComplete = (id) => {
    completeWorkRequest(id);
  };

  const handleConfirmCancel = (remarks) => {
    if (cancellingRequest) {
      cancelWorkRequest(cancellingRequest.id, remarks);
      setCancellingRequest(null);
    }
  };

  const handleConfirmReschedule = ({ date, startTime, endTime, remarks }) => {
    if (reschedulingRequest) {
      rescheduleWorkRequest(reschedulingRequest.id, { date, startTime, endTime, remarks });
      setReschedulingRequest(null);
    }
  };

  return (
    <>
      <div
        style={{
          background: 'var(--bg-secondary, #1a2234)',
          border: pendingRequests.length > 0 ? '1px solid rgba(23, 105, 255, 0.4)' : '1px solid var(--border-color, rgba(255,255,255,0.08))',
          borderRadius: '14px',
          padding: '16px 18px',
          display: 'flex',
          flexDirection: 'column',
          gap: '12px',
        }}
      >
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div
              style={{
                width: '28px',
                height: '28px',
                borderRadius: '8px',
                background: 'rgba(23, 105, 255, 0.15)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--accent-primary, #1769FF)',
              }}
            >
              <FileText size={16} />
            </div>
            <div>
              <div style={{ fontSize: '0.92rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                Missed Work Requests
              </div>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>
                {pendingRequests.length === 0
                  ? 'No pending requests'
                  : pendingRequests.length === 1
                  ? '1 pending request requires action'
                  : `${pendingRequests.length} pending requests`}
              </div>
            </div>
          </div>

          <button
            onClick={() => setIsSubmitModalOpen(true)}
            title="Submit Missed Work Request"
            style={{
              background: 'transparent',
              border: '1px solid var(--border-color, rgba(255,255,255,0.15))',
              borderRadius: '6px',
              padding: '4px 8px',
              color: 'var(--text-primary)',
              fontSize: '0.74rem',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
            }}
          >
            <PlusCircle size={13} color="var(--accent-primary, #1769FF)" /> + Submit
          </button>
        </div>

        {/* Case 1: Exactly 1 Pending Request -> Show the request with the 3 options directly */}
        {pendingRequests.length === 1 && singleRequest && (
          <div
            style={{
              background: 'var(--bg-primary, #0f172a)',
              borderRadius: '10px',
              padding: '12px 14px',
              border: '1px solid rgba(23, 105, 255, 0.25)',
              display: 'flex',
              flexDirection: 'column',
              gap: '8px',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px' }}>
              <div style={{ fontSize: '0.88rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                {singleRequest.title}
              </div>
              <span
                style={{
                  fontSize: '0.68rem',
                  fontWeight: 800,
                  padding: '2px 6px',
                  borderRadius: '4px',
                  background: 'rgba(245, 158, 11, 0.15)',
                  color: '#F59E0B',
                  textTransform: 'uppercase',
                }}
              >
                Pending
              </span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.74rem', color: 'var(--text-secondary)' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
                <Calendar size={12} /> {singleRequest.date}
              </span>
              {(singleRequest.startTime || singleRequest.endTime) && (
                <span style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
                  <Clock size={12} /> {singleRequest.startTime} - {singleRequest.endTime}
                </span>
              )}
            </div>

            {/* Mandatory Reason */}
            <div
              style={{
                fontSize: '0.78rem',
                color: 'var(--text-primary)',
                background: 'rgba(255,255,255,0.03)',
                padding: '6px 8px',
                borderRadius: '6px',
                borderLeft: '2px solid var(--accent-primary, #1769FF)',
              }}
            >
              <strong style={{ color: 'var(--text-secondary)' }}>Reason:</strong> {singleRequest.reason}
            </div>

            {/* The 3 Action Buttons */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr 1fr',
                gap: '6px',
                marginTop: '4px',
              }}
            >
              <button
                onClick={() => handleMarkComplete(singleRequest.id)}
                title="Mark this missed work as completed"
                style={{
                  padding: '6px 4px',
                  borderRadius: '6px',
                  border: 'none',
                  background: '#10B981',
                  color: '#FFFFFF',
                  fontSize: '0.72rem',
                  fontWeight: 800,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '4px',
                }}
              >
                <Check size={12} /> Completed
              </button>

              <button
                onClick={() => setReschedulingRequest(singleRequest)}
                title="Reschedule to another time"
                style={{
                  padding: '6px 4px',
                  borderRadius: '6px',
                  border: 'none',
                  background: '#3B82F6',
                  color: '#FFFFFF',
                  fontSize: '0.72rem',
                  fontWeight: 800,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '4px',
                }}
              >
                <Calendar size={12} /> Reschedule
              </button>

              <button
                onClick={() => setCancellingRequest(singleRequest)}
                title="Cancel with mandatory remarks"
                style={{
                  padding: '6px 4px',
                  borderRadius: '6px',
                  border: 'none',
                  background: '#EF4444',
                  color: '#FFFFFF',
                  fontSize: '0.72rem',
                  fontWeight: 800,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '4px',
                }}
              >
                <X size={12} /> Canceled
              </button>
            </div>
          </div>
        )}

        {/* Case 2: More Than 1 Pending Request -> Show button to open modal with all requests */}
        {pendingRequests.length > 1 && (
          <div
            style={{
              background: 'var(--bg-primary, #0f172a)',
              borderRadius: '10px',
              padding: '14px',
              border: '1px solid rgba(245, 158, 11, 0.3)',
              display: 'flex',
              flexDirection: 'column',
              gap: '10px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div
                style={{
                  width: '24px',
                  height: '24px',
                  borderRadius: '50%',
                  background: 'rgba(245, 158, 11, 0.2)',
                  color: '#F59E0B',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '0.8rem',
                  fontWeight: 800,
                }}
              >
                {pendingRequests.length}
              </div>
              <div style={{ fontSize: '0.84rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                {pendingRequests.length} Pending Requests To Review
              </div>
            </div>

            <p style={{ margin: 0, fontSize: '0.78rem', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
              Multiple missed work entries require review. Open the request manager to mark complete, reschedule, or cancel with remarks.
            </p>

            <button
              onClick={() => setIsAllModalOpen(true)}
              style={{
                width: '100%',
                padding: '8px 12px',
                borderRadius: '8px',
                border: 'none',
                background: 'var(--accent-primary, #1769FF)',
                color: '#FFFFFF',
                fontSize: '0.82rem',
                fontWeight: 800,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
              }}
            >
              <Layers size={14} /> Review All ({pendingRequests.length}) Requests <ArrowRight size={14} />
            </button>
          </div>
        )}

        {/* Case 3: 0 Pending Requests */}
        {pendingRequests.length === 0 && (
          <div
            style={{
              background: 'var(--bg-primary, #0f172a)',
              borderRadius: '10px',
              padding: '14px',
              border: '1px solid var(--border-color, rgba(255,255,255,0.06))',
              display: 'flex',
              flexDirection: 'column',
              gap: '8px',
            }}
          >
            <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: 1.45 }}>
              All missed work items are up-to-date. If you missed marking any past work, submit a request with reason below.
            </p>
            <button
              onClick={() => setIsSubmitModalOpen(true)}
              style={{
                padding: '7px 12px',
                borderRadius: '8px',
                border: '1px dashed var(--accent-primary, #1769FF)',
                background: 'rgba(23, 105, 255, 0.08)',
                color: 'var(--accent-primary, #1769FF)',
                fontSize: '0.78rem',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '5px',
              }}
            >
              <PlusCircle size={14} /> + Submit Missed Work Request
            </button>
          </div>
        )}
      </div>

      {/* Submit Modal */}
      <SubmitRequestModal
        isOpen={isSubmitModalOpen}
        onClose={() => setIsSubmitModalOpen(false)}
      />

      {/* All Requests Modal */}
      <AllRequestsModal
        isOpen={isAllModalOpen}
        onClose={() => setIsAllModalOpen(false)}
        onOpenSubmitModal={() => setIsSubmitModalOpen(true)}
      />

      {/* Mandatory Remarks Modal when Canceled */}
      <CancelRemarksModal
        isOpen={!!cancellingRequest}
        requestTitle={cancellingRequest?.title || ''}
        onClose={() => setCancellingRequest(null)}
        onConfirm={handleConfirmCancel}
      />

      {/* Reschedule Modal */}
      <RescheduleRequestModal
        isOpen={!!reschedulingRequest}
        request={reschedulingRequest}
        onClose={() => setReschedulingRequest(null)}
        onConfirm={handleConfirmReschedule}
      />
    </>
  );
}
