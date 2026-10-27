import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  UploadCloud,
  FileText,
  CheckCircle2,
  AlertTriangle,
  Download,
  FileType,
  Sparkles,
  Layers,
  Target,
  ListTodo,
  RefreshCw,
  Info,
  XCircle,
  ArrowRight,
  RotateCcw,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import {
  parseImportText,
  downloadTemplate,
  validateAndPrepareImport,
  TEMPLATES,
} from '../../utils/csvImporter';

const COLUMN_GUIDE = {
  tasks: [
    { name: 'title', required: true, desc: 'Task title or summary', example: 'Code Review & Planning' },
    { name: 'date', required: false, desc: 'Date formatted YYYY-MM-DD', example: '2026-10-27 (default: Today)' },
    { name: 'startTime', required: false, desc: 'Start time formatted HH:mm', example: '09:00' },
    { name: 'endTime', required: false, desc: 'End time formatted HH:mm', example: '10:30' },
    { name: 'category', required: false, desc: 'Category name or ID', example: 'Deep Work' },
    { name: 'goal', required: false, desc: 'Goal milestone title or ID', example: 'Launch Full-Stack Web App' },
    { name: 'priority', required: false, desc: 'High, Medium, or Low', example: 'High' },
    { name: 'status', required: false, desc: 'pending, in-progress, completed', example: 'pending' },
    { name: 'description', required: false, desc: 'Task notes and details', example: 'Review PRs and schemas' },
  ],
  goals: [
    { name: 'title', required: true, desc: 'Goal milestone title', example: 'Launch Web Platform' },
    { name: 'targetDate', required: false, desc: 'Deadline YYYY-MM-DD', example: '2026-11-30 (+30d default)' },
    { name: 'progress', required: false, desc: 'Progress 0 to 100', example: '45' },
    { name: 'status', required: false, desc: 'in-progress, completed, behind', example: 'in-progress' },
    { name: 'category', required: false, desc: 'Category name', example: 'Deep Work' },
    { name: 'description', required: false, desc: 'Objectives and scope', example: 'Deliver v1 release' },
  ],
  categories: [
    { name: 'name', required: true, desc: 'Category name', example: 'Deep Work' },
    { name: 'color', required: false, desc: 'Hex color (#RRGGBB)', example: '#1769FF' },
    { name: 'icon', required: false, desc: 'Lucide icon name', example: 'Code, Heart, BookOpen, Tag' },
    { name: 'description', required: false, desc: 'Category purpose and tags', example: 'Focused programming' },
  ],
};

export function BulkImportModal() {
  const {
    activeModal,
    closeModal,
    categories,
    goals,
    bulkImportCategories,
    bulkImportGoals,
    bulkImportTasks,
  } = useApp();

  const navigate = useNavigate();
  const isOpen = activeModal?.type === 'bulk-import';

  const [importType, setImportType] = useState('tasks');
  const [inputMode, setInputMode] = useState('file'); // 'file' or 'paste'
  const [rawText, setRawText] = useState('');
  const [fileName, setFileName] = useState('');
  const [fileSize, setFileSize] = useState('');
  const [parsedData, setParsedData] = useState(null); // { validItems, invalidItems, total, validCount, invalidCount }
  const [isDragging, setIsDragging] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [parseError, setParseError] = useState('');
  const [importResult, setImportResult] = useState(null); // { type, total, successCount, failedCount, insertedItems, failedItems }
  const [importProgress, setImportProgress] = useState({
    active: false,
    current: 0,
    total: 0,
    percent: 0,
    batchNum: 0,
    totalBatches: 0,
    statusText: '',
  });
  const fileInputRef = useRef(null);

  // Synchronize initial type when modal opens
  useEffect(() => {
    if (isOpen) {
      const type = activeModal?.data?.type || 'tasks';
      setImportType(type);
      setInputMode('file');
      setRawText('');
      setFileName('');
      setFileSize('');
      setParsedData(null);
      setParseError('');
      setImportResult(null);
      setIsSubmitting(false);
      setImportProgress({
        active: false,
        current: 0,
        total: 0,
        percent: 0,
        batchNum: 0,
        totalBatches: 0,
        statusText: '',
      });
    }
  }, [isOpen, activeModal]);

  // Re-run validation if importType changes while data is present
  useEffect(() => {
    if (rawText.trim()) {
      handleParseContent(rawText, importType);
    } else {
      setParsedData(null);
      setParseError('');
    }
  }, [importType]);

  if (!isOpen) return null;

  const handleParseContent = (text, typeToUse = importType) => {
    setParseError('');
    try {
      const rows = parseImportText(text);
      if (!rows || rows.length === 0) {
        setParseError('No records could be parsed. Please check your CSV/JSON formatting.');
        setParsedData(null);
        return;
      }

      const validated = validateAndPrepareImport(typeToUse, rows, {
        categories,
        goals,
      });

      setParsedData(validated);
    } catch (err) {
      setParseError(err.message || 'Error parsing imported content.');
      setParsedData(null);
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    processFile(file);
  };

  const processFile = (file) => {
    setFileName(file.name);
    setFileSize((file.size / 1024).toFixed(1) + ' KB');

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result;
      if (typeof content === 'string') {
        setRawText(content);
        handleParseContent(content);
      }
    };
    reader.onerror = () => {
      setParseError('Failed to read file.');
    };
    reader.readAsText(file);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  const handleReset = () => {
    setRawText('');
    setFileName('');
    setFileSize('');
    setParsedData(null);
    setParseError('');
    setImportResult(null);
    setImportProgress({
      active: false,
      current: 0,
      total: 0,
      percent: 0,
      batchNum: 0,
      totalBatches: 0,
      statusText: '',
    });
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleExecuteImport = async () => {
    if (!parsedData || parsedData.validCount === 0 || isSubmitting) return;

    setIsSubmitting(true);
    setParseError('');

    const itemsToImport = parsedData.validItems;
    const totalItems = itemsToImport.length;
    // Chunk large files in batches of 50 for tasks, 30 for goals/categories to prevent database timeouts
    const BATCH_SIZE = importType === 'tasks' ? 50 : 30;
    const totalBatches = Math.ceil(totalItems / BATCH_SIZE);

    setImportProgress({
      active: true,
      current: 0,
      total: totalItems,
      percent: 0,
      batchNum: 1,
      totalBatches,
      statusText: `Preparing to import ${totalItems} records in ${totalBatches} batch${totalBatches > 1 ? 'es' : ''}...`,
    });

    try {
      let insertedAccumulator = [];

      for (let b = 0; b < totalBatches; b++) {
        const start = b * BATCH_SIZE;
        const end = Math.min(start + BATCH_SIZE, totalItems);
        const chunk = itemsToImport.slice(start, end);

        const currentPct = Math.round((start / totalItems) * 100);
        setImportProgress({
          active: true,
          current: start,
          total: totalItems,
          percent: currentPct,
          batchNum: b + 1,
          totalBatches,
          statusText: `Inserting batch ${b + 1} of ${totalBatches} (${start + 1}–${end} of ${totalItems} records)...`,
        });

        let res;
        if (importType === 'categories') {
          res = await bulkImportCategories(chunk, { silent: true });
        } else if (importType === 'goals') {
          res = await bulkImportGoals(chunk, { silent: true });
        } else if (importType === 'tasks') {
          res = await bulkImportTasks(chunk, { silent: true });
        }

        if (res?.data) {
          insertedAccumulator = insertedAccumulator.concat(res.data);
        }

        const endPct = Math.round((end / totalItems) * 100);
        setImportProgress({
          active: true,
          current: end,
          total: totalItems,
          percent: endPct,
          batchNum: b + 1,
          totalBatches,
          statusText: end === totalItems
            ? `Finalizing ${totalItems} imported records...`
            : `Completed ${end} of ${totalItems} records (${endPct}%)...`,
        });

        // Small yield so the browser can paint the progress line animation smoothly
        await new Promise((resolve) => setTimeout(resolve, 60));
      }

      const successCount = insertedAccumulator.length || totalItems;
      const failedItems = (parsedData.invalidItems || []).map((inv) => ({
        rowNum: inv.rowNum,
        name: inv.raw?.name || inv.raw?.title || `Row ${inv.rowNum}`,
        reason: inv.errors?.join('; ') || 'Missing or invalid required fields',
        raw: inv.raw,
      }));

      setImportResult({
        type: importType,
        total: parsedData.total,
        successCount,
        failedCount: failedItems.length,
        insertedItems: insertedAccumulator.length ? insertedAccumulator : itemsToImport,
        failedItems,
      });
    } catch (err) {
      setParseError(err.message || 'Import failed. Please try again.');
    } finally {
      setIsSubmitting(false);
      setImportProgress((prev) => ({ ...prev, active: false }));
    }
  };

  return (
    <div className="modal-backdrop" onClick={closeModal} style={{ zIndex: 1100 }}>
      <div
        className="modal-card"
        style={{
          maxWidth: '840px',
          width: '95%',
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
          padding: 0,
          overflow: 'hidden',
          borderRadius: '16px',
          position: 'relative',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Progress Line across the entire modal width */}
        {importProgress.active && (
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              height: '4px',
              background: 'rgba(23, 105, 255, 0.2)',
              zIndex: 99,
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                height: '100%',
                width: `${importProgress.percent}%`,
                background: 'linear-gradient(90deg, #1769FF 0%, #06B6D4 50%, #10B981 100%)',
                transition: 'width 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                boxShadow: '0 0 10px rgba(6, 182, 212, 0.8)',
              }}
            />
          </div>
        )}
        {/* Modal Header */}
        <div
          style={{
            padding: '20px 24px',
            borderBottom: '1px solid var(--border-color)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: 'var(--card-bg)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div
              style={{
                width: '42px',
                height: '42px',
                borderRadius: '10px',
                background: importResult
                  ? importResult.failedCount > 0
                    ? 'linear-gradient(135deg, #10B981 0%, #F59E0B 100%)'
                    : 'linear-gradient(135deg, #10B981 0%, #059669 100%)'
                  : 'linear-gradient(135deg, #1769FF 0%, #6366F1 100%)',
                color: '#fff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 4px 12px rgba(23, 105, 255, 0.25)',
              }}
            >
              {importResult ? <CheckCircle2 size={24} /> : <UploadCloud size={22} />}
            </div>
            <div>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
                {importResult ? 'Import Results & Audit Report' : 'Bulk Data Import'}
              </h3>
              <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', margin: '2px 0 0 0' }}>
                {importResult
                  ? `Detailed breakdown of successfully inserted records and failure reasons for ${importResult.type}.`
                  : 'Quickly upload or paste multiple Categories, Goals, or Tasks in CSV or JSON format.'}
              </p>
            </div>
          </div>
          <button
            type="button"
            className="btn-icon"
            onClick={closeModal}
            aria-label="Close modal"
            style={{ width: '34px', height: '34px' }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div style={{ padding: '20px 24px', overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: '18px' }}>
          {/* ===================== POST-IMPORT RESULTS VIEW ===================== */}
          {importResult ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
              {/* Summary Metric KPI Cards */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                  gap: '14px',
                }}
              >
                {/* Total Processed */}
                <div
                  style={{
                    padding: '16px',
                    borderRadius: '12px',
                    background: 'var(--page-bg)',
                    border: '1px solid var(--border-color)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                  }}
                >
                  <div
                    style={{
                      width: '40px',
                      height: '40px',
                      borderRadius: '8px',
                      background: 'rgba(99, 102, 241, 0.12)',
                      color: '#6366F1',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                    }}
                  >
                    <Layers size={20} />
                  </div>
                  <div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Total Processed</div>
                    <div style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--text-primary)' }}>{importResult.total}</div>
                  </div>
                </div>

                {/* Successful Records */}
                <div
                  style={{
                    padding: '16px',
                    borderRadius: '12px',
                    background: 'rgba(16, 185, 129, 0.08)',
                    border: '1px solid rgba(16, 185, 129, 0.25)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                  }}
                >
                  <div
                    style={{
                      width: '40px',
                      height: '40px',
                      borderRadius: '8px',
                      background: 'rgba(16, 185, 129, 0.15)',
                      color: '#10B981',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                    }}
                  >
                    <CheckCircle2 size={20} />
                  </div>
                  <div>
                    <div style={{ fontSize: '0.75rem', color: '#059669', fontWeight: 700 }}>Inserted Successfully</div>
                    <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#10B981' }}>{importResult.successCount}</div>
                  </div>
                </div>

                {/* Failed / Skipped Records */}
                <div
                  style={{
                    padding: '16px',
                    borderRadius: '12px',
                    background: importResult.failedCount > 0 ? 'rgba(239, 68, 68, 0.08)' : 'var(--page-bg)',
                    border: `1px solid ${importResult.failedCount > 0 ? 'rgba(239, 68, 68, 0.25)' : 'var(--border-color)'}`,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                  }}
                >
                  <div
                    style={{
                      width: '40px',
                      height: '40px',
                      borderRadius: '8px',
                      background: importResult.failedCount > 0 ? 'rgba(239, 68, 68, 0.15)' : 'var(--page-bg)',
                      color: importResult.failedCount > 0 ? '#EF4444' : 'var(--text-secondary)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                    }}
                  >
                    {importResult.failedCount > 0 ? <XCircle size={20} /> : <CheckCircle2 size={20} />}
                  </div>
                  <div>
                    <div style={{ fontSize: '0.75rem', color: importResult.failedCount > 0 ? '#DC2626' : 'var(--text-secondary)', fontWeight: 700 }}>
                      Failed / Skipped
                    </div>
                    <div style={{ fontSize: '1.4rem', fontWeight: 800, color: importResult.failedCount > 0 ? '#EF4444' : 'var(--text-secondary)' }}>
                      {importResult.failedCount}
                    </div>
                  </div>
                </div>
              </div>

              {/* SECTION: FAILED RECORDS & WHY THEY FAILED */}
              {importResult.failedCount > 0 && (
                <div
                  style={{
                    background: 'rgba(239, 68, 68, 0.04)',
                    border: '1px solid rgba(239, 68, 68, 0.25)',
                    borderRadius: '12px',
                    padding: '16px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '12px',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <AlertTriangle size={18} color="#EF4444" />
                    <h4 style={{ margin: 0, fontSize: '0.92rem', fontWeight: 700, color: '#B91C1C' }}>
                      Why {importResult.failedCount} record(s) failed or were skipped:
                    </h4>
                  </div>

                  <div
                    style={{
                      maxHeight: '200px',
                      overflowY: 'auto',
                      border: '1px solid rgba(239, 68, 68, 0.2)',
                      borderRadius: '8px',
                      background: 'var(--card-bg)',
                    }}
                  >
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem', textAlign: 'left' }}>
                      <thead>
                        <tr style={{ background: 'rgba(239, 68, 68, 0.08)', borderBottom: '1px solid rgba(239, 68, 68, 0.15)', color: '#991B1B' }}>
                          <th style={{ padding: '8px 12px', width: '70px', fontWeight: 700 }}>Line / Row</th>
                          <th style={{ padding: '8px 12px', fontWeight: 700 }}>Item Content / Identifier</th>
                          <th style={{ padding: '8px 12px', fontWeight: 700 }}>Exact Failure Reason</th>
                        </tr>
                      </thead>
                      <tbody>
                        {importResult.failedItems.map((fail, idx) => (
                          <tr key={`fail-${idx}`} style={{ borderBottom: '1px solid var(--border-color)' }}>
                            <td style={{ padding: '8px 12px', fontWeight: 700, color: '#EF4444' }}>
                              Row {fail.rowNum}
                            </td>
                            <td style={{ padding: '8px 12px', color: 'var(--text-primary)', fontFamily: 'monospace' }}>
                              {fail.name || JSON.stringify(fail.raw) || 'Empty entry'}
                            </td>
                            <td style={{ padding: '8px 12px' }}>
                              <span
                                style={{
                                  background: 'rgba(239, 68, 68, 0.12)',
                                  color: '#DC2626',
                                  padding: '3px 8px',
                                  borderRadius: '6px',
                                  fontWeight: 600,
                                  fontSize: '0.74rem',
                                  display: 'inline-block',
                                }}
                              >
                                {fail.reason}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* SECTION: SUCCESSFULLY INSERTED RECORDS */}
              {importResult.successCount > 0 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <CheckCircle2 size={16} color="#10B981" />
                      <h4 style={{ margin: 0, fontSize: '0.92rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                        Successfully Inserted {importResult.type.charAt(0).toUpperCase() + importResult.type.slice(1)} ({importResult.successCount}):
                      </h4>
                    </div>
                    <span style={{ fontSize: '0.76rem', color: 'var(--text-secondary)' }}>
                      Available immediately in your app
                    </span>
                  </div>

                  <div
                    style={{
                      maxHeight: '200px',
                      overflowY: 'auto',
                      border: '1px solid var(--border-color)',
                      borderRadius: '8px',
                      background: 'var(--card-bg)',
                    }}
                  >
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem', textAlign: 'left' }}>
                      <thead>
                        <tr style={{ background: 'var(--page-bg)', borderBottom: '1px solid var(--border-color)', color: 'var(--text-secondary)' }}>
                          <th style={{ padding: '8px 12px', width: '40px', fontWeight: 600 }}>#</th>
                          <th style={{ padding: '8px 12px', fontWeight: 600 }}>Name / Title</th>
                          {importResult.type === 'categories' && (
                            <>
                              <th style={{ padding: '8px 12px', fontWeight: 600 }}>Color</th>
                              <th style={{ padding: '8px 12px', fontWeight: 600 }}>Description</th>
                            </>
                          )}
                          {importResult.type === 'goals' && (
                            <>
                              <th style={{ padding: '8px 12px', fontWeight: 600 }}>Target Date</th>
                              <th style={{ padding: '8px 12px', fontWeight: 600 }}>Progress</th>
                            </>
                          )}
                          {importResult.type === 'tasks' && (
                            <>
                              <th style={{ padding: '8px 12px', fontWeight: 600 }}>Date</th>
                              <th style={{ padding: '8px 12px', fontWeight: 600 }}>Priority</th>
                            </>
                          )}
                          <th style={{ padding: '8px 12px', textAlign: 'right', fontWeight: 600 }}>Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {importResult.insertedItems.map((item, idx) => (
                          <tr key={`ins-${idx}`} style={{ borderBottom: '1px solid var(--border-color)' }}>
                            <td style={{ padding: '8px 12px', color: 'var(--text-secondary)' }}>{idx + 1}</td>
                            <td style={{ padding: '8px 12px', fontWeight: 700, color: 'var(--text-primary)' }}>
                              {item.title || item.name}
                            </td>
                            {importResult.type === 'categories' && (
                              <>
                                <td style={{ padding: '8px 12px' }}>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                    <div style={{ width: '12px', height: '12px', borderRadius: '3px', background: item.color }} />
                                    <span>{item.color}</span>
                                  </div>
                                </td>
                                <td style={{ padding: '8px 12px', color: 'var(--text-secondary)' }}>{item.description || '—'}</td>
                              </>
                            )}
                            {importResult.type === 'goals' && (
                              <>
                                <td style={{ padding: '8px 12px', color: 'var(--text-secondary)' }}>{item.targetDate}</td>
                                <td style={{ padding: '8px 12px', color: 'var(--text-primary)' }}>{item.progress}%</td>
                              </>
                            )}
                            {importResult.type === 'tasks' && (
                              <>
                                <td style={{ padding: '8px 12px', color: 'var(--text-secondary)' }}>{item.date}</td>
                                <td style={{ padding: '8px 12px' }}>
                                  <span className="badge badge-primary" style={{ fontSize: '0.7rem' }}>
                                    {item.priority}
                                  </span>
                                </td>
                              </>
                            )}
                            <td style={{ padding: '8px 12px', textAlign: 'right' }}>
                              <span className="badge badge-success" style={{ fontSize: '0.72rem' }}>
                                Inserted
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          ) : (
            /* ===================== STANDARD IMPORT INPUT FORM ===================== */
            <>
              {/* 1. Target Entity Type Selection */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
                <div style={{ display: 'flex', background: 'var(--page-bg)', padding: '4px', borderRadius: '10px', border: '1px solid var(--border-color)', gap: '4px' }}>
                  <button
                    type="button"
                    className={`btn btn-sm ${importType === 'tasks' ? 'btn-primary' : 'btn-ghost'}`}
                    style={{ fontSize: '0.82rem', padding: '6px 14px', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}
                    onClick={() => setImportType('tasks')}
                  >
                    <ListTodo size={15} />
                    <span>Tasks</span>
                  </button>
                  <button
                    type="button"
                    className={`btn btn-sm ${importType === 'goals' ? 'btn-primary' : 'btn-ghost'}`}
                    style={{ fontSize: '0.82rem', padding: '6px 14px', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}
                    onClick={() => setImportType('goals')}
                  >
                    <Target size={15} />
                    <span>Goals</span>
                  </button>
                  <button
                    type="button"
                    className={`btn btn-sm ${importType === 'categories' ? 'btn-primary' : 'btn-ghost'}`}
                    style={{ fontSize: '0.82rem', padding: '6px 14px', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}
                    onClick={() => setImportType('categories')}
                  >
                    <Layers size={15} />
                    <span>Categories</span>
                  </button>
                </div>

                {/* Template Download Shortcuts */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <button
                    type="button"
                    className="btn btn-sm btn-secondary"
                    style={{ fontSize: '0.78rem', padding: '6px 10px', display: 'flex', alignItems: 'center', gap: '5px' }}
                    onClick={() => downloadTemplate(importType, 'csv')}
                    title="Download CSV format template"
                  >
                    <Download size={13} />
                    <span>CSV Template</span>
                  </button>
                  <button
                    type="button"
                    className="btn btn-sm btn-secondary"
                    style={{ fontSize: '0.78rem', padding: '6px 10px', display: 'flex', alignItems: 'center', gap: '5px' }}
                    onClick={() => downloadTemplate(importType, 'json')}
                    title="Download JSON format template"
                  >
                    <FileType size={13} />
                    <span>JSON Template</span>
                  </button>
                </div>
              </div>

              {/* Column Names Reference Banner */}
              <div
                style={{
                  background: 'rgba(23, 105, 255, 0.04)',
                  border: '1px solid rgba(23, 105, 255, 0.15)',
                  borderRadius: '10px',
                  padding: '12px 14px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '8px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.82rem', fontWeight: 700, color: 'var(--primary-color)' }}>
                    <Info size={15} />
                    <span>Supported Column Headers for {importType.toUpperCase()}:</span>
                  </div>
                  <span style={{ fontSize: '0.74rem', color: 'var(--text-secondary)' }}>
                    * = Required Column
                  </span>
                </div>

                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                  {COLUMN_GUIDE[importType].map((col) => (
                    <div
                      key={col.name}
                      title={`${col.desc} (e.g. ${col.example})`}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px',
                        padding: '3px 8px',
                        background: col.required ? 'var(--primary-color)' : 'var(--card-bg)',
                        color: col.required ? '#ffffff' : 'var(--text-primary)',
                        border: `1px solid ${col.required ? 'var(--primary-color)' : 'var(--border-color)'}`,
                        borderRadius: '6px',
                        fontSize: '0.74rem',
                        fontFamily: 'monospace',
                        fontWeight: 600,
                      }}
                    >
                      <span>{col.name}</span>
                      {col.required && <span style={{ color: '#FDE047' }}>*</span>}
                      <span style={{ fontSize: '0.68rem', opacity: col.required ? 0.9 : 0.65, fontWeight: 400, fontFamily: 'inherit' }}>
                        ({col.required ? 'required' : 'optional'})
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* 2. Input Mode Toggle: File Upload vs Direct Paste */}
              <div style={{ display: 'flex', borderBottom: '1px solid var(--border-color)', gap: '16px' }}>
                <button
                  type="button"
                  style={{
                    background: 'none',
                    border: 'none',
                    borderBottom: inputMode === 'file' ? '2px solid var(--primary-color)' : '2px solid transparent',
                    padding: '8px 4px',
                    fontSize: '0.88rem',
                    fontWeight: inputMode === 'file' ? 700 : 500,
                    color: inputMode === 'file' ? 'var(--primary-color)' : 'var(--text-secondary)',
                    cursor: 'pointer',
                  }}
                  onClick={() => setInputMode('file')}
                >
                  Upload File (.csv, .json)
                </button>
                <button
                  type="button"
                  style={{
                    background: 'none',
                    border: 'none',
                    borderBottom: inputMode === 'paste' ? '2px solid var(--primary-color)' : '2px solid transparent',
                    padding: '8px 4px',
                    fontSize: '0.88rem',
                    fontWeight: inputMode === 'paste' ? 700 : 500,
                    color: inputMode === 'paste' ? 'var(--primary-color)' : 'var(--text-secondary)',
                    cursor: 'pointer',
                  }}
                  onClick={() => setInputMode('paste')}
                >
                  Paste Raw Data
                </button>
              </div>

              {/* 3. Input Areas */}
              {inputMode === 'file' ? (
                <div>
                  <input
                    type="file"
                    ref={fileInputRef}
                    accept=".csv, application/json, text/csv, text/plain"
                    style={{ display: 'none' }}
                    onChange={handleFileChange}
                  />
                  <div
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    onClick={() => fileInputRef.current?.click()}
                    style={{
                      border: `2px dashed ${isDragging ? 'var(--primary-color)' : 'var(--border-color)'}`,
                      background: isDragging ? 'rgba(23, 105, 255, 0.05)' : 'var(--page-bg)',
                      borderRadius: '12px',
                      padding: '30px 20px',
                      textAlign: 'center',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: '10px',
                    }}
                  >
                    <div
                      style={{
                        width: '48px',
                        height: '48px',
                        borderRadius: '50%',
                        background: 'var(--primary-light)',
                        color: 'var(--primary-color)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <UploadCloud size={24} />
                    </div>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--text-primary)' }}>
                        {fileName ? fileName : 'Choose a CSV or JSON file, or drag & drop here'}
                      </div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '3px' }}>
                        {fileSize ? `File size: ${fileSize}` : 'Supports standard .csv and .json exports'}
                      </div>
                    </div>
                    {fileName && (
                      <button
                        type="button"
                        className="btn btn-sm btn-ghost"
                        style={{ fontSize: '0.75rem', marginTop: '4px' }}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleReset();
                        }}
                      >
                        Remove File
                      </button>
                    )}
                  </div>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <textarea
                    className="form-input"
                    style={{
                      minHeight: '140px',
                      fontFamily: 'monospace',
                      fontSize: '0.82rem',
                      padding: '12px',
                      lineHeight: 1.4,
                      resize: 'vertical',
                    }}
                    placeholder={`Paste your CSV lines or JSON array here...\nExample for ${importType}:\n${TEMPLATES[importType]?.csv}`}
                    value={rawText}
                    onChange={(e) => {
                      setRawText(e.target.value);
                      handleParseContent(e.target.value);
                    }}
                  />
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                      Tip: Copy directly from Microsoft Excel or Google Sheets.
                    </span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <button
                        type="button"
                        className="btn btn-sm btn-secondary"
                        style={{ fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '5px' }}
                        onClick={() => {
                          const sample = TEMPLATES[importType]?.csv || '';
                          setRawText(sample);
                          handleParseContent(sample);
                        }}
                      >
                        <Sparkles size={13} />
                        <span>Load Sample {importType.charAt(0).toUpperCase() + importType.slice(1)} Data</span>
                      </button>
                      {rawText && (
                        <button
                          type="button"
                          className="btn btn-sm btn-ghost"
                          style={{ fontSize: '0.75rem' }}
                          onClick={handleReset}
                        >
                          Clear Text
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* 4. Parse Error Alert */}
              {parseError && (
                <div
                  style={{
                    padding: '12px 16px',
                    borderRadius: '8px',
                    background: 'rgba(239, 68, 68, 0.1)',
                    border: '1px solid rgba(239, 68, 68, 0.25)',
                    color: '#EF4444',
                    fontSize: '0.85rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                  }}
                >
                  <AlertTriangle size={18} style={{ flexShrink: 0 }} />
                  <div>{parseError}</div>
                </div>
              )}

              {/* 5. Live Preview & Validation Results */}
              {parsedData && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {/* Validation Summary Bar */}
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '10px 14px',
                      background: 'var(--page-bg)',
                      borderRadius: '8px',
                      border: '1px solid var(--border-color)',
                      flexWrap: 'wrap',
                      gap: '10px',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <span style={{ fontSize: '0.84rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                        Parsed Records: {parsedData.total}
                      </span>
                      <span
                        className="badge badge-success"
                        style={{ fontSize: '0.75rem', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                      >
                        <CheckCircle2 size={12} /> {parsedData.validCount} Valid
                      </span>
                      {parsedData.invalidCount > 0 && (
                        <span
                          className="badge badge-danger"
                          style={{ fontSize: '0.75rem', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                        >
                          <AlertTriangle size={12} /> {parsedData.invalidCount} Invalid
                        </span>
                      )}
                    </div>
                    <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                      Ready to import into {importType}
                    </span>
                  </div>

                  {/* Table Preview */}
                  <div
                    style={{
                      maxHeight: '220px',
                      overflowY: 'auto',
                      border: '1px solid var(--border-color)',
                      borderRadius: '8px',
                    }}
                  >
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem', textAlign: 'left' }}>
                      <thead>
                        <tr style={{ background: 'var(--page-bg)', borderBottom: '1px solid var(--border-color)', color: 'var(--text-secondary)' }}>
                          <th style={{ padding: '8px 12px', fontWeight: 600, width: '40px' }}>#</th>
                          <th style={{ padding: '8px 12px', fontWeight: 600 }}>Title / Name</th>
                          {importType === 'tasks' && (
                            <>
                              <th style={{ padding: '8px 12px', fontWeight: 600 }}>Date</th>
                              <th style={{ padding: '8px 12px', fontWeight: 600 }}>Time</th>
                              <th style={{ padding: '8px 12px', fontWeight: 600 }}>Goal</th>
                              <th style={{ padding: '8px 12px', fontWeight: 600 }}>Priority</th>
                            </>
                          )}
                          {importType === 'goals' && (
                            <>
                              <th style={{ padding: '8px 12px', fontWeight: 600 }}>Target Date</th>
                              <th style={{ padding: '8px 12px', fontWeight: 600 }}>Progress</th>
                              <th style={{ padding: '8px 12px', fontWeight: 600 }}>Category</th>
                            </>
                          )}
                          {importType === 'categories' && (
                            <>
                              <th style={{ padding: '8px 12px', fontWeight: 600 }}>Color</th>
                              <th style={{ padding: '8px 12px', fontWeight: 600 }}>Description</th>
                            </>
                          )}
                          <th style={{ padding: '8px 12px', fontWeight: 600, textAlign: 'right' }}>Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {/* Render Valid Items */}
                        {parsedData.validItems.map((item, idx) => (
                          <tr key={`valid-${idx}`} style={{ borderBottom: '1px solid var(--border-color)' }}>
                            <td style={{ padding: '8px 12px', color: 'var(--text-secondary)' }}>{idx + 1}</td>
                            <td style={{ padding: '8px 12px', fontWeight: 600, color: 'var(--text-primary)' }}>
                              {item.title || item.name}
                            </td>
                            {importType === 'tasks' && (
                              <>
                                <td style={{ padding: '8px 12px', color: 'var(--text-secondary)' }}>{item.date}</td>
                                <td style={{ padding: '8px 12px', color: 'var(--text-secondary)' }}>
                                  {item.startTime ? `${item.startTime} - ${item.endTime || ''}` : 'Anytime'}
                                </td>
                                <td style={{ padding: '8px 12px', color: 'var(--text-secondary)' }}>
                                  {item.goalId
                                    ? goals.find((g) => g.id === item.goalId)?.title || 'Linked'
                                    : '—'}
                                </td>
                                <td style={{ padding: '8px 12px' }}>
                                  <span
                                    className={`badge ${
                                      item.priority === 'High'
                                        ? 'badge-danger'
                                        : item.priority === 'Medium'
                                        ? 'badge-warning'
                                        : 'badge-secondary'
                                    }`}
                                    style={{ fontSize: '0.72rem' }}
                                  >
                                    {item.priority}
                                  </span>
                                </td>
                              </>
                            )}
                            {importType === 'goals' && (
                              <>
                                <td style={{ padding: '8px 12px', color: 'var(--text-secondary)' }}>{item.targetDate}</td>
                                <td style={{ padding: '8px 12px', color: 'var(--text-primary)' }}>{item.progress}%</td>
                                <td style={{ padding: '8px 12px', color: 'var(--text-secondary)' }}>{item.category || 'General'}</td>
                              </>
                            )}
                            {importType === 'categories' && (
                              <>
                                <td style={{ padding: '8px 12px' }}>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                    <div style={{ width: '12px', height: '12px', borderRadius: '3px', background: item.color }} />
                                    <span>{item.color}</span>
                                  </div>
                                </td>
                                <td style={{ padding: '8px 12px', color: 'var(--text-secondary)' }}>{item.description || '—'}</td>
                              </>
                            )}
                            <td style={{ padding: '8px 12px', textAlign: 'right' }}>
                              <span className="badge badge-success" style={{ fontSize: '0.72rem' }}>
                                Valid
                              </span>
                            </td>
                          </tr>
                        ))}

                        {/* Render Invalid Items */}
                        {parsedData.invalidItems.map((inv, idx) => (
                          <tr key={`inv-${idx}`} style={{ borderBottom: '1px solid var(--border-color)', background: 'rgba(239, 68, 68, 0.04)' }}>
                            <td style={{ padding: '8px 12px', color: '#EF4444' }}>{inv.rowNum}</td>
                            <td colSpan={importType === 'tasks' ? 5 : importType === 'goals' ? 3 : 2} style={{ padding: '8px 12px', color: '#EF4444' }}>
                              {inv.errors.join('; ')}
                            </td>
                            <td style={{ padding: '8px 12px', textAlign: 'right' }}>
                              <span className="badge badge-danger" style={{ fontSize: '0.72rem' }}>
                                Skipped
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Real-Time Bulk Import Progress Line Banner */}
        {importProgress.active && (
          <div
            style={{
              padding: '16px 24px',
              background: 'linear-gradient(180deg, #F0F9FF 0%, #E0F2FE 100%)',
              borderTop: '1px solid #BAE6FD',
              display: 'flex',
              flexDirection: 'column',
              gap: '10px',
              animation: 'fadeIn 0.2s ease',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div
                  style={{
                    width: '28px',
                    height: '28px',
                    borderRadius: '50%',
                    background: '#DBEAFE',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <RefreshCw size={15} className="spin" color="#0284C7" />
                </div>
                <div>
                  <span style={{ fontSize: '0.88rem', fontWeight: 700, color: '#0369A1' }}>
                    {importProgress.statusText}
                  </span>
                  <p style={{ fontSize: '0.74rem', color: '#0284C7', margin: 0, marginTop: '2px' }}>
                    Safely inserting in optimized cloud database batches...
                  </p>
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <span style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0284C7' }}>
                  {importProgress.percent}%
                </span>
              </div>
            </div>

            {/* Glowing Animated Progress Line */}
            <div
              style={{
                width: '100%',
                height: '10px',
                background: '#E0F2FE',
                borderRadius: '999px',
                overflow: 'hidden',
                border: '1px solid #BAE6FD',
                boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.06)',
              }}
            >
              <div
                style={{
                  width: `${importProgress.percent}%`,
                  height: '100%',
                  background: 'linear-gradient(90deg, #2563EB 0%, #06B6D4 60%, #10B981 100%)',
                  borderRadius: '999px',
                  transition: 'width 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                  boxShadow: '0 0 12px rgba(6, 182, 212, 0.6)',
                }}
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', color: '#0369A1' }}>
              <span>
                Inserted: <strong>{importProgress.current}</strong> of <strong>{importProgress.total}</strong> records
              </span>
              <span>
                Batch <strong>{importProgress.batchNum}</strong> of <strong>{importProgress.totalBatches}</strong>
              </span>
            </div>
          </div>
        )}

        {/* Modal Footer */}
        <div
          style={{
            padding: '16px 24px',
            borderTop: '1px solid var(--border-color)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: 'var(--card-bg)',
          }}
        >
          {importResult ? (
            <>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={handleReset}
                style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
              >
                <RotateCcw size={15} />
                <span>Import Another Batch</span>
              </button>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={closeModal}
                  style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
                >
                  <CheckCircle2 size={16} />
                  <span>Done & Close</span>
                </button>
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={() => {
                    closeModal();
                    if (importResult.type === 'categories') navigate('/categories');
                    else if (importResult.type === 'goals') navigate('/goals');
                    else if (importResult.type === 'tasks') navigate('/today');
                  }}
                  style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
                >
                  <ArrowRight size={16} />
                  <span>
                    View{' '}
                    {importResult.type === 'tasks'
                      ? "Today's Tasks"
                      : importResult.type.charAt(0).toUpperCase() + importResult.type.slice(1)}
                  </span>
                </button>
              </div>
            </>
          ) : (
            <>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                {parsedData && (
                  <button
                    type="button"
                    className="btn btn-ghost"
                    onClick={handleReset}
                    disabled={isSubmitting}
                    style={{ fontSize: '0.84rem' }}
                  >
                    Reset
                  </button>
                )}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={closeModal}
                  disabled={isSubmitting}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="btn btn-primary"
                  disabled={!parsedData || parsedData.validCount === 0 || isSubmitting}
                  onClick={handleExecuteImport}
                  style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
                >
                  {isSubmitting ? (
                    <>
                      <RefreshCw size={15} className="spin" />
                      <span>
                        Importing {importProgress.percent > 0 ? `(${importProgress.percent}%)` : '...'}
                      </span>
                    </>
                  ) : (
                    <>
                      <UploadCloud size={15} />
                      <span>
                        Import {parsedData ? `${parsedData.validCount} ` : ''}
                        {importType.charAt(0).toUpperCase() + importType.slice(1)}
                      </span>
                    </>
                  )}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
export default BulkImportModal;
