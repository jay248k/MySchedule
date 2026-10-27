import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Check, Calendar, X, AlertCircle, Clock, FileText, CheckCircle2, RotateCcw, AlertTriangle } from 'lucide-react';
import CancelRemarksModal from './CancelRemarksModal';
import RescheduleRequestModal from './RescheduleRequestModal';

export default function AllRequestsModal({ isOpen, onClose, onOpenSubmitModal }) {
  const { requests, completeWorkRequest, rescheduleWorkRequest, cancelWorkRequest } = useApp();

  const [filter, setFilter] = useState('pending'); // 'pending' | 'all'
  const [cancellingRequest, setCancellingRequest] = useState(null);
  const [reschedulingRequest, setReschedulingRequest] = useState(null);

  if (!isOpen) return null;

  const pendingRequests = (requests || []).filter((r) => r.status === 'pending');
  const allRequests = requests || [];
  const displayList = filter === 'pending' ? pendingRequests : allRequests;

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
          position: 'fixed',
          inset: 0,
          zIndex: 1500,
          backgroundColor: 'rgba(0,0,0,0.75)',
          backdropFilter: 'blur(6px)',
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
            background: 'var(--bg-secondary, #1a2234)',
            border: '1px solid var(--border-color, rgba(255,255,255,0.12))',
            borderRadius: '16px',
            width: '100%',
            maxWidth: '680px',
            maxHeight: '85vh',
            display: 'flex',
            flexDirection: 'column',
            boxShadow: 'none',
            overflow: 'hidden',
            animation: 'fadeIn 0.2s ease-out',
          }}
        >
          {/* Header */}
          <div
            style={{
              padding: '18px 22px',
              borderBottom: '1px solid var(--border-color, rgba(255,255,255,0.08))',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              background: 'var(--bg-tertiary, rgba(255,255,255,0.03))',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div
                style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '10px',
                  background: 'rgba(23, 105, 255, 0.18)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'var(--accent-primary, #1769FF)',
                }}
              >
                <FileText size={20} />
              </div>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                  Work Requests ({allRequests.length})
                </h3>
                <p style={{ margin: 0, fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                  {pendingRequests.length} pending action • Includes past and present requests
                </p>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              {onOpenSubmitModal && (
                <button
                  onClick={() => {
                    onClose();
                    onOpenSubmitModal();
                  }}
                  style={{
                    padding: '6px 12px',
                    borderRadius: '8px',
                    border: 'none',
                    background: 'var(--accent-primary, #1769FF)',
                    color: '#fff',
                    fontSize: '0.78rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                  }}
                >
                  + New Request
                </button>
              )}
              <button
                onClick={onClose}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: 'var(--text-secondary)',
                  cursor: 'pointer',
                  padding: '6px',
                  borderRadius: '8px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <X size={18} />
              </button>
            </div>
          </div>

          {/* Filter Bar */}
          <div
            style={{
              padding: '10px 22px',
              borderBottom: '1px solid var(--border-color, rgba(255,255,255,0.06))',
              display: 'flex',
              gap: '8px',
              background: 'rgba(0,0,0,0.15)',
            }}
          >
            <button
              onClick={() => setFilter('pending')}
              style={{
                padding: '6px 14px',
                borderRadius: '8px',
                border: 'none',
                background: filter === 'pending' ? 'var(--accent-primary, #1769FF)' : 'transparent',
                color: filter === 'pending' ? '#fff' : 'var(--text-secondary)',
                fontSize: '0.8rem',
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              Pending ({pendingRequests.length})
            </button>
            <button
              onClick={() => setFilter('all')}
              style={{
                padding: '6px 14px',
                borderRadius: '8px',
                border: 'none',
                background: filter === 'all' ? 'var(--accent-primary, #1769FF)' : 'transparent',
                color: filter === 'all' ? '#fff' : 'var(--text-secondary)',
                fontSize: '0.8rem',
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              All Requests ({allRequests.length})
            </button>
          </div>

          {/* Request List */}
          <div style={{ padding: '16px 22px', overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {displayList.length === 0 ? (
              <div
                style={{
                  textAlign: 'center',
                  padding: '40px 20px',
                  color: 'var(--text-secondary)',
                }}
              >
                <CheckCircle2 size={40} color="#10B981" style={{ margin: '0 auto 12px auto' }} />
                <h4 style={{ margin: '0 0 6px 0', fontSize: '1rem', color: 'var(--text-primary)' }}>
                  {filter === 'pending' ? 'No pending requests!' : 'No requests recorded yet'}
                </h4>
                <p style={{ margin: 0, fontSize: '0.82rem' }}>
                  All missed work items have been addressed.
                </p>
              </div>
            ) : (
              displayList.map((req) => {
                const isPending = req.status === 'pending';
                const isCompleted = req.status === 'completed';
                const isCancelled = req.status === 'cancelled';
                const isRescheduled = req.status === 'rescheduled';

                return (
                  <div
                    key={req.id}
                    style={{
                      background: 'var(--bg-primary, #0f172a)',
                      border: isPending
                        ? '1px solid rgba(23, 105, 255, 0.35)'
                        : '1px solid var(--border-color, rgba(255,255,255,0.08))',
                      borderRadius: '12px',
                      padding: '16px',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '10px', marginBottom: '8px' }}>
                      <div>
                        <h4 style={{ margin: 0, fontSize: '0.94rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                          {req.title}
                        </h4>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '4px', fontSize: '0.76rem', color: 'var(--text-secondary)' }}>
                          <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <Calendar size={13} /> {req.date}
                          </span>
                          {(req.startTime || req.endTime) && (
                            <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                              <Clock size={13} /> {req.startTime} - {req.endTime}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Status Badge */}
                      <span
                        style={{
                          fontSize: '0.72rem',
                          fontWeight: 800,
                          padding: '3px 8px',
                          borderRadius: '6px',
                          textTransform: 'uppercase',
                          background: isPending
                            ? 'rgba(245, 158, 11, 0.15)'
                            : isCompleted
                            ? 'rgba(16, 185, 129, 0.15)'
                            : isCancelled
                            ? 'rgba(239, 68, 68, 0.15)'
                            : 'rgba(59, 130, 246, 0.15)',
                          color: isPending
                            ? '#F59E0B'
                            : isCompleted
                            ? '#10B981'
                            : isCancelled
                            ? '#EF4444'
                            : '#3B82F6',
                        }}
                      >
                        {req.status}
                      </span>
                    </div>

                    {/* Reason (Mandatory) */}
                    <div
                      style={{
                        background: 'rgba(255, 255, 255, 0.03)',
                        borderRadius: '8px',
                        padding: '10px 12px',
                        marginBottom: '12px',
                        fontSize: '0.82rem',
                        lineHeight: 1.45,
                      }}
                    >
                      <div style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '3px', textTransform: 'uppercase' }}>
                        Reason for request:
                      </div>
                      <div style={{ color: 'var(--text-primary)' }}>
                        {req.reason}
                      </div>
                    </div>

                    {/* Action Remarks if cancelled/rescheduled/completed */}
                    {req.actionRemarks && (
                      <div
                        style={{
                          background: isCancelled ? 'rgba(239, 68, 68, 0.08)' : 'rgba(59, 130, 246, 0.08)',
                          borderLeft: isCancelled ? '3px solid #EF4444' : '3px solid #3B82F6',
                          borderRadius: '4px',
                          padding: '6px 10px',
                          marginBottom: '12px',
                          fontSize: '0.78rem',
                          color: 'var(--text-primary)',
                        }}
                      >
                        <strong>{isCancelled ? 'Cancellation Remarks:' : 'Remarks:'}</strong> {req.actionRemarks}
                        {req.rescheduledDate && (
                          <div style={{ fontSize: '0.74rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
                            New slot: {req.rescheduledDate} {req.rescheduledStartTime ? `(${req.rescheduledStartTime} - ${req.rescheduledEndTime})` : ''}
                          </div>
                        )}
                      </div>
                    )}

                    {/* The 3 Action Buttons if Pending */}
                    {isPending && (
                      <div
                        style={{
                          display: 'grid',
                          gridTemplateColumns: '1fr 1fr 1fr',
                          gap: '8px',
                          marginTop: '8px',
                          borderTop: '1px solid var(--border-color, rgba(255,255,255,0.06))',
                          paddingTop: '12px',
                        }}
                      >
                        <button
                          onClick={() => handleMarkComplete(req.id)}
                          style={{
                            padding: '8px 10px',
                            borderRadius: '8px',
                            border: 'none',
                            background: '#10B981',
                            color: '#FFFFFF',
                            fontSize: '0.78rem',
                            fontWeight: 800,
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '5px',
                          }}
                        >
                          <Check size={14} /> Mark Completed
                        </button>

                        <button
                          onClick={() => setReschedulingRequest(req)}
                          style={{
                            padding: '8px 10px',
                            borderRadius: '8px',
                            border: 'none',
                            background: '#3B82F6',
                            color: '#FFFFFF',
                            fontSize: '0.78rem',
                            fontWeight: 800,
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '5px',
                          }}
                        >
                          <Calendar size={14} /> Reschedule
                        </button>

                        <button
                          onClick={() => setCancellingRequest(req)}
                          style={{
                            padding: '8px 10px',
                            borderRadius: '8px',
                            border: 'none',
                            background: '#EF4444',
                            color: '#FFFFFF',
                            fontSize: '0.78rem',
                            fontWeight: 800,
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '5px',
                          }}
                        >
                          <X size={14} /> Canceled
                        </button>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

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
