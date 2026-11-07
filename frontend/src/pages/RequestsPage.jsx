import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import {
  FileText,
  PlusCircle,
  Check,
  Calendar,
  X,
  Search,
  Filter,
  Clock,
  AlertCircle,
  AlertTriangle,
  RotateCcw,
  CheckCircle2,
  Trash2,
  HelpCircle,
} from 'lucide-react';
import SubmitRequestModal from '../components/requests/SubmitRequestModal';
import CancelRemarksModal from '../components/requests/CancelRemarksModal';
import RescheduleRequestModal from '../components/requests/RescheduleRequestModal';

export default function RequestsPage() {
  const { requests, completeWorkRequest, rescheduleWorkRequest, cancelWorkRequest, deleteWorkRequest } = useApp();

  const [activeTab, setActiveTab] = useState('all'); // 'all' | 'pending' | 'completed' | 'rescheduled' | 'cancelled'
  const [searchQuery, setSearchQuery] = useState('');
  const [isSubmitModalOpen, setIsSubmitModalOpen] = useState(false);
  const [cancellingRequest, setCancellingRequest] = useState(null);
  const [reschedulingRequest, setReschedulingRequest] = useState(null);

  const allRequests = requests || [];

  // KPIs
  const pendingCount = allRequests.filter((r) => r.status === 'pending').length;
  const completedCount = allRequests.filter((r) => r.status === 'completed').length;
  const rescheduledCount = allRequests.filter((r) => r.status === 'rescheduled').length;
  const cancelledCount = allRequests.filter((r) => r.status === 'cancelled').length;

  // Filter & Search
  const filteredRequests = allRequests.filter((req) => {
    if (activeTab !== 'all' && req.status !== activeTab) {
      return false;
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchTitle = (req.title || '').toLowerCase().includes(q);
      const matchReason = (req.reason || '').toLowerCase().includes(q);
      const matchRemarks = (req.actionRemarks || '').toLowerCase().includes(q);
      const matchDate = (req.date || '').toLowerCase().includes(q);
      return matchTitle || matchReason || matchRemarks || matchDate;
    }
    return true;
  });

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
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', width: '100%' }}>
      {/* Header */}
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '16px',
          marginBottom: '24px',
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div
              style={{
                width: '38px',
                height: '38px',
                borderRadius: '12px',
                background: 'rgba(23, 105, 255, 0.15)',
                color: 'var(--accent-primary, #1769FF)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <FileText size={22} />
            </div>
            <div>
              <h1 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                Work & Missed Work Requests
              </h1>
              <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                Complete records of all past and current requests with mandatory reasons and action audit logs
              </p>
            </div>
          </div>
        </div>

        <button
          onClick={() => setIsSubmitModalOpen(true)}
          style={{
            padding: '10px 20px',
            borderRadius: '10px',
            border: 'none',
            background: 'var(--accent-primary, #1769FF)',
            color: '#FFFFFF',
            fontSize: '0.88rem',
            fontWeight: 800,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          <PlusCircle size={18} /> Submit Missed Work Request
        </button>
      </div>

      {/* KPI Cards */}
      {/* KPI Cards (All 5 in One Line & Compact Design) */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(5, minmax(0, 1fr))',
          gap: '10px',
          marginBottom: '18px',
        }}
      >
        {/* Total */}
        <div
          onClick={() => setActiveTab('all')}
          className="card"
          style={{
            background: 'var(--card-bg)',
            border: activeTab === 'all' ? '1.5px solid var(--accent-primary, #1769FF)' : '1px solid var(--border-color)',
            borderTop: activeTab === 'all' ? '3px solid var(--accent-primary, #1769FF)' : '3px solid transparent',
            borderRadius: '12px',
            padding: '10px 14px',
            cursor: 'pointer',
            transition: 'all 0.15s ease',
            boxShadow: activeTab === 'all' ? '0 4px 12px rgba(23, 105, 255, 0.12)' : 'var(--shadow-sm)',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '6px' }}>
            <span style={{ fontSize: '0.68rem', fontWeight: 800, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.02em', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              Total Requests
            </span>
            <FileText size={13} color="var(--accent-primary, #1769FF)" style={{ flexShrink: 0 }} />
          </div>
          <div style={{ fontSize: '1.45rem', fontWeight: 800, color: 'var(--text-primary)', marginTop: '2px', lineHeight: 1.15 }}>
            {allRequests.length}
          </div>
        </div>

        {/* Pending */}
        <div
          onClick={() => setActiveTab('pending')}
          className="card"
          style={{
            background: 'var(--card-bg)',
            border: activeTab === 'pending' ? '1.5px solid #F59E0B' : '1px solid var(--border-color)',
            borderTop: activeTab === 'pending' ? '3px solid #F59E0B' : '3px solid transparent',
            borderRadius: '12px',
            padding: '10px 14px',
            cursor: 'pointer',
            transition: 'all 0.15s ease',
            boxShadow: activeTab === 'pending' ? '0 4px 12px rgba(245, 158, 11, 0.12)' : 'var(--shadow-sm)',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '6px' }}>
            <span style={{ fontSize: '0.68rem', fontWeight: 800, color: '#F59E0B', textTransform: 'uppercase', letterSpacing: '0.02em', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              Pending Action
            </span>
            <Clock size={13} color="#F59E0B" style={{ flexShrink: 0 }} />
          </div>
          <div style={{ fontSize: '1.45rem', fontWeight: 800, color: '#F59E0B', marginTop: '2px', lineHeight: 1.15 }}>
            {pendingCount}
          </div>
        </div>

        {/* Completed */}
        <div
          onClick={() => setActiveTab('completed')}
          className="card"
          style={{
            background: 'var(--card-bg)',
            border: activeTab === 'completed' ? '1.5px solid #10B981' : '1px solid var(--border-color)',
            borderTop: activeTab === 'completed' ? '3px solid #10B981' : '3px solid transparent',
            borderRadius: '12px',
            padding: '10px 14px',
            cursor: 'pointer',
            transition: 'all 0.15s ease',
            boxShadow: activeTab === 'completed' ? '0 4px 12px rgba(16, 185, 129, 0.12)' : 'var(--shadow-sm)',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '6px' }}>
            <span style={{ fontSize: '0.68rem', fontWeight: 800, color: '#10B981', textTransform: 'uppercase', letterSpacing: '0.02em', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              Completed
            </span>
            <CheckCircle2 size={13} color="#10B981" style={{ flexShrink: 0 }} />
          </div>
          <div style={{ fontSize: '1.45rem', fontWeight: 800, color: '#10B981', marginTop: '2px', lineHeight: 1.15 }}>
            {completedCount}
          </div>
        </div>

        {/* Rescheduled */}
        <div
          onClick={() => setActiveTab('rescheduled')}
          className="card"
          style={{
            background: 'var(--card-bg)',
            border: activeTab === 'rescheduled' ? '1.5px solid #3B82F6' : '1px solid var(--border-color)',
            borderTop: activeTab === 'rescheduled' ? '3px solid #3B82F6' : '3px solid transparent',
            borderRadius: '12px',
            padding: '10px 14px',
            cursor: 'pointer',
            transition: 'all 0.15s ease',
            boxShadow: activeTab === 'rescheduled' ? '0 4px 12px rgba(59, 130, 246, 0.12)' : 'var(--shadow-sm)',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '6px' }}>
            <span style={{ fontSize: '0.68rem', fontWeight: 800, color: '#3B82F6', textTransform: 'uppercase', letterSpacing: '0.02em', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              Rescheduled
            </span>
            <RotateCcw size={13} color="#3B82F6" style={{ flexShrink: 0 }} />
          </div>
          <div style={{ fontSize: '1.45rem', fontWeight: 800, color: '#3B82F6', marginTop: '2px', lineHeight: 1.15 }}>
            {rescheduledCount}
          </div>
        </div>

        {/* Cancelled */}
        <div
          onClick={() => setActiveTab('cancelled')}
          className="card"
          style={{
            background: 'var(--card-bg)',
            border: activeTab === 'cancelled' ? '1.5px solid #EF4444' : '1px solid var(--border-color)',
            borderTop: activeTab === 'cancelled' ? '3px solid #EF4444' : '3px solid transparent',
            borderRadius: '12px',
            padding: '10px 14px',
            cursor: 'pointer',
            transition: 'all 0.15s ease',
            boxShadow: activeTab === 'cancelled' ? '0 4px 12px rgba(239, 68, 68, 0.12)' : 'var(--shadow-sm)',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '6px' }}>
            <span style={{ fontSize: '0.68rem', fontWeight: 800, color: '#EF4444', textTransform: 'uppercase', letterSpacing: '0.02em', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              Cancelled
            </span>
            <AlertCircle size={13} color="#EF4444" style={{ flexShrink: 0 }} />
          </div>
          <div style={{ fontSize: '1.45rem', fontWeight: 800, color: '#EF4444', marginTop: '2px', lineHeight: 1.15 }}>
            {cancelledCount}
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div
        className="card"
        style={{
          background: 'var(--card-bg)',
          border: '1px solid var(--border-color)',
          borderRadius: '14px',
          padding: '14px 18px',
          marginBottom: '20px',
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '14px',
          boxShadow: 'var(--shadow-sm)',
        }}
      >
        {/* Status Tabs */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
          {[
            { id: 'all', label: `All (${allRequests.length})` },
            { id: 'pending', label: `Pending (${pendingCount})` },
            { id: 'completed', label: `Completed (${completedCount})` },
            { id: 'rescheduled', label: `Rescheduled (${rescheduledCount})` },
            { id: 'cancelled', label: `Cancelled (${cancelledCount})` },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                padding: '7px 14px',
                borderRadius: '8px',
                border: 'none',
                background: activeTab === tab.id ? 'var(--accent-primary, #1769FF)' : 'var(--page-bg)',
                color: activeTab === tab.id ? '#FFFFFF' : 'var(--text-secondary)',
                fontSize: '0.82rem',
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Search */}
        <div style={{ position: 'relative', minWidth: '260px' }}>
          <Search size={15} color="var(--text-secondary)" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by title, reason, remarks, date..."
            style={{
              width: '100%',
              padding: '8px 12px 8px 34px',
              borderRadius: '8px',
              background: 'var(--page-bg)',
              border: '1px solid var(--border-color)',
              color: 'var(--text-primary)',
              fontSize: '0.84rem',
              outline: 'none',
              boxSizing: 'border-box',
            }}
          />
        </div>
      </div>

      {/* Requests List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
        {filteredRequests.length === 0 ? (
          <div
            className="card"
            style={{
              background: 'var(--card-bg)',
              border: '1px solid var(--border-color)',
              borderRadius: '14px',
              padding: '60px 20px',
              textAlign: 'center',
              boxShadow: 'var(--shadow-sm)',
            }}
          >
            <CheckCircle2 size={48} color="#10B981" style={{ margin: '0 auto 16px auto' }} />
            <h3 style={{ margin: '0 0 8px 0', fontSize: '1.15rem', color: 'var(--text-primary)' }}>
              No requests matching your criteria
            </h3>
            <p style={{ margin: 0, fontSize: '0.88rem', color: 'var(--text-secondary)' }}>
              {activeTab === 'pending'
                ? 'All work requests have been resolved!'
                : 'No missed work request records found.'}
            </p>
            <button
              onClick={() => setIsSubmitModalOpen(true)}
              style={{
                marginTop: '18px',
                padding: '9px 18px',
                borderRadius: '8px',
                border: 'none',
                background: 'var(--accent-primary, #1769FF)',
                color: '#FFFFFF',
                fontSize: '0.84rem',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
              }}
            >
              <PlusCircle size={15} /> Submit New Request
            </button>
          </div>
        ) : (
          filteredRequests.map((req) => {
            const isPending = req.status === 'pending';
            const isCompleted = req.status === 'completed';
            const isCancelled = req.status === 'cancelled';
            const isRescheduled = req.status === 'rescheduled';

            return (
              <div
                key={req.id}
                className="card"
                style={{
                  background: 'var(--card-bg)',
                  border: isPending
                    ? '1.5px solid rgba(245, 158, 11, 0.4)'
                    : '1px solid var(--border-color)',
                  borderRadius: '14px',
                  padding: '12px 18px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '14px',
                  boxShadow: 'var(--shadow-sm)',
                }}
              >
                {/* Top Row: Title, Date, Status */}
                <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'flex-start', justifyContent: 'space-between', gap: '12px' }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <h3 style={{ margin: 0, fontSize: '1.08rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                        {req.title}
                      </h3>
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

                    <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginTop: '6px', fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                        <Calendar size={14} /> Date: <strong>{req.date}</strong>
                      </span>
                      {(req.startTime || req.endTime) && (
                        <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                          <Clock size={14} /> Time: <strong>{req.startTime} - {req.endTime}</strong>
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Actions for Pending Requests */}
                  {isPending ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <button
                        onClick={() => handleMarkComplete(req.id)}
                        title="Mark this request as completed"
                        style={{
                          padding: '6px 12px',
                          borderRadius: '8px',
                          border: 'none',
                          background: '#10B981',
                          color: '#FFFFFF',
                          fontSize: '0.82rem',
                          fontWeight: 800,
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                        }}
                      >
                        <Check size={15} /> Mark Completed
                      </button>

                      <button
                        onClick={() => setReschedulingRequest(req)}
                        title="Reschedule to another date/time"
                        style={{
                          padding: '8px 14px',
                          borderRadius: '8px',
                          border: 'none',
                          background: '#3B82F6',
                          color: '#FFFFFF',
                          fontSize: '0.82rem',
                          fontWeight: 800,
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                        }}
                      >
                        <Calendar size={15} /> Reschedule
                      </button>

                      <button
                        onClick={() => setCancellingRequest(req)}
                        title="Cancel with mandatory remarks"
                        style={{
                          padding: '8px 14px',
                          borderRadius: '8px',
                          border: 'none',
                          background: '#EF4444',
                          color: '#FFFFFF',
                          fontSize: '0.82rem',
                          fontWeight: 800,
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                        }}
                      >
                        <X size={15} /> Canceled
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => deleteWorkRequest(req.id)}
                      title="Delete this request record"
                      style={{
                        padding: '6px',
                        borderRadius: '6px',
                        border: 'none',
                        background: 'transparent',
                        color: 'var(--text-secondary)',
                        cursor: 'pointer',
                        opacity: 0.7,
                      }}
                    >
                      <Trash2 size={16} />
                    </button>
                  )}
                </div>

                {/* Mandatory Reason Box */}
                <div
                  style={{
                    background: 'var(--page-bg)',
                    border: '1px solid var(--border-color)',
                    borderRadius: '10px',
                    padding: '8px 12px',
                  }}
                >
                  <div style={{ fontSize: '0.74rem', fontWeight: 800, color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: '4px' }}>
                    Reason For Missing / Request:
                  </div>
                  <div style={{ fontSize: '0.9rem', color: 'var(--text-primary)', lineHeight: 1.5 }}>
                    {req.reason}
                  </div>
                </div>

                {/* Action Remarks (Audit Trail) */}
                {req.actionRemarks && (
                  <div
                    style={{
                      background: isCancelled
                        ? 'rgba(239, 68, 68, 0.08)'
                        : isRescheduled
                        ? 'rgba(59, 130, 246, 0.08)'
                        : 'rgba(16, 185, 129, 0.08)',
                      borderLeft: isCancelled
                        ? '4px solid #EF4444'
                        : isRescheduled
                        ? '4px solid #3B82F6'
                        : '4px solid #10B981',
                      borderRadius: '6px',
                      padding: '10px 14px',
                      fontSize: '0.84rem',
                      color: 'var(--text-primary)',
                    }}
                  >
                    <strong>{isCancelled ? 'Cancellation Remarks (Mandatory):' : 'Action Audit:'}</strong>{' '}
                    {req.actionRemarks}
                    {req.rescheduledDate && (
                      <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
                        Rescheduled to: <strong>{req.rescheduledDate}</strong> ({req.rescheduledStartTime || '09:00'} - {req.rescheduledEndTime || '10:00'})
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Submit Modal */}
      <SubmitRequestModal
        isOpen={isSubmitModalOpen}
        onClose={() => setIsSubmitModalOpen(false)}
      />

      {/* Mandatory Cancel Remarks Modal */}
      <CancelRemarksModal
        isOpen={!!cancellingRequest}
        requestTitle={cancellingRequest?.title || ''}
        onClose={() => setCancellingRequest(null)}
        onConfirm={handleConfirmCancel}
      />

      {/* Reschedule Request Modal */}
      <RescheduleRequestModal
        isOpen={!!reschedulingRequest}
        request={reschedulingRequest}
        onClose={() => setReschedulingRequest(null)}
        onConfirm={handleConfirmReschedule}
      />
    </div>
  );
}
