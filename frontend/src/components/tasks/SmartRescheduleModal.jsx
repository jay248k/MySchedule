import React, { useState, useMemo } from 'react';
import {
  Wand2,
  Calendar,
  Clock,
  ArrowRight,
  Check,
  AlertCircle,
  Sparkles,
  X,
  CheckCircle2,
  Filter,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { getTodayDateString, formatDate, formatTime } from '../../utils/dateUtils';
import { getEffectiveStatus } from '../../utils/taskUtils';

// Helper to convert "HH:MM" to minutes from midnight
function timeToMinutes(tStr) {
  if (!tStr) return 0;
  const [h, m] = tStr.split(':').map(Number);
  return h * 60 + (m || 0);
}

// Helper to convert minutes from midnight to "HH:MM"
function minutesToTime(mins) {
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

export function SmartRescheduleModal({ isOpen, onClose }) {
  const { tasks, updateTask, showToast } = useApp();
  const todayStr = getTodayDateString();

  // Find overdue / unfinished tasks
  const overdueTasks = useMemo(() => {
    return tasks
      .filter((t) => {
        const isNotDone = getEffectiveStatus(t) !== 'completed';
        const isPastDate = t.date < todayStr;
        return isNotDone && isPastDate;
      })
      .sort((a, b) => {
        // High priority first
        const pMap = { high: 3, medium: 2, low: 1 };
        const pa = pMap[a.priority?.toLowerCase()] || 1;
        const pb = pMap[b.priority?.toLowerCase()] || 1;
        if (pb !== pa) return pb - pa;
        // Oldest date first
        return (a.date || '').localeCompare(b.date || '');
      });
  }, [tasks, todayStr]);

  // Compute smart rescheduling plan
  const proposedPlan = useMemo(() => {
    if (overdueTasks.length === 0) return [];

    // Target horizon: Next 4 days (Today, Tomorrow, Day+2, Day+3)
    const targetDates = [];
    const baseDate = new Date();
    for (let i = 0; i < 4; i++) {
      const d = new Date(baseDate);
      d.setDate(baseDate.getDate() + i);
      targetDates.push(d.toISOString().split('T')[0]);
    }

    // Map booked slots per target day
    const dayBookedSlots = {};
    targetDates.forEach((dateStr) => {
      const existing = tasks.filter((t) => t.date === dateStr && t.startTime && t.endTime);
      dayBookedSlots[dateStr] = existing.map((t) => ({
        start: timeToMinutes(t.startTime),
        end: timeToMinutes(t.endTime),
      }));
    });

    const now = new Date();
    const currentMins = now.getHours() * 60 + now.getMinutes();

    const plan = [];

    overdueTasks.forEach((task) => {
      // Determine duration
      let durationMins = 60;
      if (task.startTime && task.endTime) {
        const diff = timeToMinutes(task.endTime) - timeToMinutes(task.startTime);
        if (diff > 0 && diff <= 240) durationMins = diff;
      }

      let assignedDate = null;
      let assignedStart = null;
      let assignedEnd = null;

      // Find first available gap in working hours 09:00 (540m) to 18:30 (1110m)
      for (const dStr of targetDates) {
        const isToday = dStr === todayStr;
        // If today, only search after current time + 15 mins buffer
        const dayEarliest = isToday ? Math.max(540, currentMins + 15) : 540;
        const dayLatest = 1110;

        if (dayEarliest + durationMins > dayLatest) {
          // No more working hours today, advance to next day
          continue;
        }

        // Get booked intervals sorted
        const booked = (dayBookedSlots[dStr] || []).slice().sort((a, b) => a.start - b.start);

        let candidateStart = dayEarliest;

        for (const slot of booked) {
          if (slot.end <= candidateStart) continue;

          // Check if gap before slot is large enough
          if (slot.start - candidateStart >= durationMins) {
            // Gap found!
            break;
          } else {
            // Move candidate start to end of current slot + 10m buffer
            candidateStart = Math.max(candidateStart, slot.end + 10);
          }
        }

        if (candidateStart + durationMins <= dayLatest) {
          assignedDate = dStr;
          assignedStart = candidateStart;
          assignedEnd = candidateStart + durationMins;

          // Book this slot in simulation so subsequent tasks don't overlap
          dayBookedSlots[dStr].push({ start: assignedStart, end: assignedEnd });
          break;
        }
      }

      // Fallback: Day + 1 at 10:00 AM
      if (!assignedDate) {
        assignedDate = targetDates[1] || todayStr;
        assignedStart = 600;
        assignedEnd = 600 + durationMins;
      }

      plan.push({
        task,
        originalDate: task.date,
        originalStartTime: task.startTime,
        originalEndTime: task.endTime,
        proposedDate: assignedDate,
        proposedStartTime: minutesToTime(assignedStart),
        proposedEndTime: minutesToTime(assignedEnd),
        selected: true,
      });
    });

    return plan;
  }, [overdueTasks, tasks, todayStr]);

  // Selected state
  const [selectedMap, setSelectedMap] = useState({});

  // Reset or initialize selection
  const isSelected = (taskId) => {
    return selectedMap[taskId] !== undefined ? selectedMap[taskId] : true;
  };

  const toggleSelect = (taskId) => {
    setSelectedMap((prev) => ({
      ...prev,
      [taskId]: !isSelected(taskId),
    }));
  };

  const handleApplyReschedule = async () => {
    const toApply = proposedPlan.filter((item) => isSelected(item.task.id));
    if (toApply.length === 0) {
      showToast({ type: 'warning', title: 'No Tasks Selected', message: 'Select at least one task to reschedule.' });
      return;
    }

    // Apply updates
    let updatedCount = 0;
    for (const item of toApply) {
      updateTask(item.task.id, {
        date: item.proposedDate,
        startTime: item.proposedStartTime,
        endTime: item.proposedEndTime,
        status: 'pending',
      });
      updatedCount++;
    }

    showToast({
      type: 'success',
      title: 'Auto-Balancing Complete! 🤖✨',
      message: `Successfully rescheduled ${updatedCount} overdue task${updatedCount === 1 ? '' : 's'} into open calendar slots!`,
    });

    onClose();
  };

  if (!isOpen) return null;

  return (
    <>
      <div
        style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.65)',
          backdropFilter: 'blur(4px)',
          zIndex: 1000,
        }}
        onClick={onClose}
      />
      <div
        style={{
          position: 'fixed',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: '92%',
          maxWidth: '680px',
          maxHeight: '90vh',
          backgroundColor: 'var(--card-bg)',
          borderRadius: 'var(--radius-lg)',
          boxShadow: 'var(--shadow-xl)',
          border: '1.5px solid var(--border-color)',
          display: 'flex',
          flexDirection: 'column',
          zIndex: 1001,
          overflow: 'hidden',
        }}
      >
        {/* Modal Header */}
        <div
          style={{
            padding: '20px 24px',
            borderBottom: '1px solid var(--border-color)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div
              style={{
                width: '38px',
                height: '38px',
                borderRadius: '10px',
                background: 'rgba(var(--primary-rgb, 16, 185, 129), 0.15)',
                color: 'var(--primary-color)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Wand2 size={20} />
            </div>
            <div>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
                Smart Schedule Auto-Balancing
              </h3>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                Intelligently redistribute overdue & unfinished tasks into open calendar gaps
              </span>
            </div>
          </div>

          <button type="button" className="btn-icon" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        {/* Modal Body */}
        <div style={{ padding: '20px 24px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {overdueTasks.length === 0 ? (
            <div
              style={{
                padding: '40px 20px',
                textAlign: 'center',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '12px',
              }}
            >
              <div
                style={{
                  width: '54px',
                  height: '54px',
                  borderRadius: '50%',
                  background: 'rgba(var(--primary-rgb, 16, 185, 129), 0.15)',
                  color: 'var(--primary-color)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <CheckCircle2 size={28} />
              </div>
              <h4 style={{ fontSize: '1.15rem', fontWeight: 800, margin: 0 }}>All Caught Up!</h4>
              <p style={{ fontSize: '0.86rem', color: 'var(--text-secondary)', maxWidth: '400px', margin: 0 }}>
                No overdue or missed tasks were found from previous days. Your schedule is completely balanced and on track.
              </p>
            </div>
          ) : (
            <>
              {/* Strategy Banner */}
              <div
                style={{
                  padding: '12px 16px',
                  borderRadius: 'var(--radius-md)',
                  background: 'rgba(var(--primary-rgb, 16, 185, 129), 0.08)',
                  border: '1px solid rgba(var(--primary-rgb, 16, 185, 129), 0.25)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  fontSize: '0.82rem',
                  color: 'var(--text-primary)',
                }}
              >
                <Sparkles size={18} color="var(--primary-color)" style={{ flexShrink: 0 }} />
                <span>
                  Found <strong>{overdueTasks.length} overdue task{overdueTasks.length === 1 ? '' : 's'}</strong>. The auto-balancer analyzed upcoming calendar gaps and prioritized high-urgency items into non-conflicting time slots.
                </span>
              </div>

              {/* Tasks Redistribution Preview List */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {proposedPlan.map((item) => {
                  const selected = isSelected(item.task.id);
                  const isHigh = item.task.priority?.toLowerCase() === 'high';

                  return (
                    <div
                      key={item.task.id}
                      onClick={() => toggleSelect(item.task.id)}
                      style={{
                        padding: '12px 16px',
                        borderRadius: 'var(--radius-md)',
                        background: selected ? 'var(--card-bg)' : 'var(--page-bg)',
                        border: `1.5px solid ${selected ? 'var(--primary-color)' : 'var(--border-color)'}`,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: '14px',
                        transition: 'all 0.15s ease',
                        opacity: selected ? 1 : 0.6,
                      }}
                    >
                      {/* Left: Checkbox + Title */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1 }}>
                        <input
                          type="checkbox"
                          checked={selected}
                          onChange={() => toggleSelect(item.task.id)}
                          onClick={(e) => e.stopPropagation()}
                          style={{ width: '16px', height: '16px', accentColor: 'var(--primary-color)', cursor: 'pointer' }}
                        />

                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span style={{ fontSize: '0.92rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                              {item.task.title}
                            </span>
                            {isHigh && (
                              <span
                                className="badge"
                                style={{
                                  background: 'rgba(239, 68, 68, 0.15)',
                                  color: 'var(--danger)',
                                  fontSize: '0.66rem',
                                  padding: '1px 6px',
                                }}
                              >
                                High Priority
                              </span>
                            )}
                          </div>

                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.74rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                            <span>Originally: {formatDate(item.originalDate, { month: 'short', day: 'numeric' })}</span>
                            {item.originalStartTime && (
                              <span>({formatTime(item.originalStartTime)})</span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Right: Proposed Slot Arrow */}
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '10px',
                          background: 'var(--page-bg)',
                          padding: '6px 12px',
                          borderRadius: 'var(--radius-md)',
                          border: '1px solid var(--border-color)',
                          flexShrink: 0,
                        }}
                      >
                        <ArrowRight size={14} color="var(--primary-color)" />
                        <div style={{ textAlign: 'right' }}>
                          <div style={{ fontSize: '0.82rem', fontWeight: 800, color: 'var(--primary-color)' }}>
                            {item.proposedDate === todayStr ? 'Today' : formatDate(item.proposedDate, { weekday: 'short', month: 'short', day: 'numeric' })}
                          </div>
                          <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>
                            {formatTime(item.proposedStartTime)} - {formatTime(item.proposedEndTime)}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>

        {/* Modal Footer */}
        <div
          style={{
            padding: '16px 24px',
            borderTop: '1px solid var(--border-color)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: 'var(--page-bg)',
          }}
        >
          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            {overdueTasks.length > 0 && (
              <>
                {proposedPlan.filter((p) => isSelected(p.task.id)).length} of {proposedPlan.length} tasks ready to reschedule
              </>
            )}
          </span>

          <div style={{ display: 'flex', gap: '10px' }}>
            <button type="button" className="btn btn-ghost btn-sm" onClick={onClose}>
              Cancel
            </button>
            {overdueTasks.length > 0 && (
              <button
                type="button"
                className="btn btn-primary btn-sm"
                onClick={handleApplyReschedule}
                style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 700 }}
              >
                <Sparkles size={14} /> Apply Smart Reschedule
              </button>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

export default SmartRescheduleModal;
