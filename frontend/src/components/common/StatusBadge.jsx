import React from 'react';
import { CheckCircle2, Clock, AlertCircle } from 'lucide-react';

export function StatusBadge({ status }) {
  const s = (status || '').toLowerCase();

  if (s === 'completed') {
    return (
      <span className="badge badge-success">
        <CheckCircle2 size={12} />
        Completed
      </span>
    );
  }

  if (s === 'overdue') {
    return (
      <span className="badge badge-danger">
        <AlertCircle size={12} />
        Overdue
      </span>
    );
  }

  return (
    <span className="badge badge-warning">
      <Clock size={12} />
      Pending
    </span>
  );
}

export function PriorityBadge({ priority }) {
  const p = (priority || 'medium').toLowerCase();

  let className = 'badge priority-medium';
  if (p === 'high') className = 'badge priority-high';
  if (p === 'low') className = 'badge priority-low';

  return <span className={className}>{priority || 'Medium'}</span>;
}
