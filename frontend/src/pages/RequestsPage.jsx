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
import '../styles/pages/requests.css';

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
    <div className="requests-page-container">
      {/* Header */}
      <div className="requests-header">
        <div>
          <div className="flex items-center gap-2">
            <div className="requests-header-icon-box">
              <FileText size={22} />
            </div>
            <div>
              <h1 className="requests-header-title">
                Work & Missed Work Requests
              </h1>
              <p className="requests-header-sub">
                Complete records of all past and current requests with mandatory reasons and action audit logs
              </p>
            </div>
          </div>
        </div>

        <button
          onClick={() => setIsSubmitModalOpen(true)}
          className="requests-btn-submit"
        >
          <PlusCircle size={18} /> Submit Missed Work Request
        </button>
      </div>

      {/* KPI Cards (All 5 in One Line & Compact Design) */}
      <div className="requests-kpi-grid">
        {/* Total */}
        <div
          onClick={() => setActiveTab('all')}
          className={`requests-kpi-card card ${activeTab === 'all' ? 'is-active-all' : ''}`}
        >
          <div className="requests-kpi-title-row">
            <span className="requests-kpi-label text-secondary">
              Total Requests
            </span>
            <FileText size={13} color="var(--accent-primary, #1769FF)" className="shrink-0" />
          </div>
          <div className="requests-kpi-value text-primary">
            {allRequests.length}
          </div>
        </div>

        {/* Pending */}
        <div
          onClick={() => setActiveTab('pending')}
          className={`requests-kpi-card card ${activeTab === 'pending' ? 'is-active-pending' : ''}`}
        >
          <div className="requests-kpi-title-row">
            <span className="requests-kpi-label text-amber-500">
              Pending Action
            </span>
            <Clock size={13} color="#F59E0B" className="shrink-0" />
          </div>
          <div className="requests-kpi-value text-amber-500">
            {pendingCount}
          </div>
        </div>

        {/* Completed */}
        <div
          onClick={() => setActiveTab('completed')}
          className={`requests-kpi-card card ${activeTab === 'completed' ? 'is-active-completed' : ''}`}
        >
          <div className="requests-kpi-title-row">
            <span className="requests-kpi-label text-emerald-500">
              Completed
            </span>
            <CheckCircle2 size={13} color="#10B981" className="shrink-0" />
          </div>
          <div className="requests-kpi-value text-emerald-500">
            {completedCount}
          </div>
        </div>

        {/* Rescheduled */}
        <div
          onClick={() => setActiveTab('rescheduled')}
          className={`requests-kpi-card card ${activeTab === 'rescheduled' ? 'is-active-rescheduled' : ''}`}
        >
          <div className="requests-kpi-title-row">
            <span className="requests-kpi-label text-blue-500">
              Rescheduled
            </span>
            <RotateCcw size={13} color="#3B82F6" className="shrink-0" />
          </div>
          <div className="requests-kpi-value text-blue-500">
            {rescheduledCount}
          </div>
        </div>

        {/* Cancelled */}
        <div
          onClick={() => setActiveTab('cancelled')}
          className={`requests-kpi-card card ${activeTab === 'cancelled' ? 'is-active-cancelled' : ''}`}
        >
          <div className="requests-kpi-title-row">
            <span className="requests-kpi-label text-red-500">
              Cancelled
            </span>
            <AlertCircle size={13} color="#EF4444" className="shrink-0" />
          </div>
          <div className="requests-kpi-value text-red-500">
            {cancelledCount}
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="requests-filter-bar card">
        {/* Status Tabs */}
        <div className="flex flex-wrap gap-2">
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
              className={`requests-filter-tab-btn ${activeTab === tab.id ? 'active' : ''}`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="requests-search-box">
          <Search size={15} color="var(--text-secondary)" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by title, reason, remarks, date..."
            className="requests-search-input"
          />
        </div>
      </div>

      {/* Requests Grid: Compact multi-column grid, no full-width stretching or empty dead spaces */}
      <div
        className="requests-grid"
        style={{
          gridTemplateColumns: filteredRequests.length === 0 ? '1fr' : 'repeat(auto-fill, minmax(360px, 1fr))',
        }}
      >
        {filteredRequests.length === 0 ? (
          <div className="card p-8 text-center shadow-sm">
            <CheckCircle2 size={40} color="#10B981" className="mx-auto mb-3" />
            <h3 className="m-0 mb-1 text-base text-primary font-extrabold">
              No requests matching your criteria
            </h3>
            <p className="m-0 text-sm text-secondary">
              {activeTab === 'pending'
                ? 'All work requests have been resolved!'
                : 'No missed work request records found.'}
            </p>
            <button
              onClick={() => setIsSubmitModalOpen(true)}
              className="btn btn-primary btn-sm mt-3 inline-flex items-center gap-1"
            >
              <PlusCircle size={14} /> Submit New Request
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
                className={`requests-card-item card ${
                  isPending ? 'status-pending' : isCompleted ? 'status-completed' : isCancelled ? 'status-cancelled' : 'status-rescheduled'
                }`}
              >
                {/* Header: Title & Status Badge & Actions */}
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5 min-w-0 flex-1">
                    <h3 className="m-0 text-sm font-extrabold text-primary truncate" title={req.title}>
                      {req.title}
                    </h3>
                    <span
                      className="text-xs font-extrabold px-1.5 py-0.5 rounded uppercase shrink-0"
                      style={{
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

                  {!isPending && (
                    <button
                      onClick={() => deleteWorkRequest(req.id)}
                      title="Delete request"
                      className="btn-icon p-1 text-secondary opacity-60 hover:opacity-100"
                    >
                      <Trash2 size={13} />
                    </button>
                  )}
                </div>

                {/* Inline Metadata (Date & Time) */}
                <div className="flex items-center gap-2 text-xs text-secondary">
                  <span className="inline-flex items-center gap-1">
                    <Calendar size={12} color="var(--primary-color)" />
                    <strong>{req.date}</strong>
                  </span>
                  {(req.startTime || req.endTime) && (
                    <span className="inline-flex items-center gap-1">
                      <Clock size={12} color="#38BDF8" />
                      <span>{req.startTime}{req.endTime ? ` - ${req.endTime}` : ''}</span>
                    </span>
                  )}
                </div>

                {/* Compact Reason Snippet */}
                {req.reason && (
                  <div className="requests-card-reason">
                    <span className="font-bold text-secondary text-xs">Reason: </span>
                    {req.reason}
                  </div>
                )}

                {/* Audit remarks if any */}
                {req.actionRemarks && (
                  <div
                    className="requests-card-audit"
                    style={{
                      color: isCancelled ? '#EF4444' : isCompleted ? '#10B981' : '#3B82F6',
                    }}
                  >
                    Audit: {req.actionRemarks}
                    {req.rescheduledDate && (
                      <span className="text-secondary ml-1">
                        (Rescheduled: {req.rescheduledDate})
                      </span>
                    )}
                  </div>
                )}

                {/* Action Buttons for Pending Requests */}
                {isPending && (
                  <div className="requests-action-btn-row">
                    <button
                      onClick={() => handleMarkComplete(req.id)}
                      title="Complete"
                      className="requests-btn-complete"
                    >
                      <Check size={12} strokeWidth={2.5} /> Completed
                    </button>
                    <button
                      onClick={() => setReschedulingRequest(req)}
                      title="Reschedule"
                      className="requests-btn-resched"
                    >
                      <Calendar size={12} /> Reschedule
                    </button>
                    <button
                      onClick={() => setCancellingRequest(req)}
                      title="Cancel"
                      className="requests-btn-cancel"
                    >
                      <X size={12} strokeWidth={2.5} /> Cancel
                    </button>
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
