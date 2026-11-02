import React, { useState, useMemo, useRef, useEffect } from 'react';
import {
  Search,
  Filter,
  Download,
  FileSpreadsheet,
  FileText,
  Printer,
  ChevronDown,
  ChevronUp,
  ArrowUpDown,
  RefreshCw,
  Sparkles,
  ArrowLeft,
  ArrowRight,
  ArrowUp,
  ArrowDown,
  Move,
  RotateCcw,
} from 'lucide-react';
import { exportToExcel, exportToWord, exportToPdf } from '../../utils/reportExporter';

/**
 * Excel-Style Production Data Grid Component
 * Features:
 *  - Excel-style grid aesthetics (crisp cell borders, sticky headers, alternate shading)
 *  - Full multi-format downloads (Excel .xlsx, Word .doc, Printable PDF)
 *  - Instant search & filter
 *  - Sortable columns
 *  - Custom cell renderers (progress bars, status pills, category tags)
 */
export function ExcelReportTable({
  title = 'Report Table',
  subtitle = '',
  summaryCards = [],
  columns = [], // Array of { key, label, width, sortable, render: (val, row) => JSX }
  data = [],
  defaultSortKey = null,
  exportFileName = 'MySchedule_Report',
  sheetName = 'ReportData',
  onRowClick = null,
}) {
  const [searchQuery, setSearchQuery] = useState('');
  const [sortKey, setSortKey] = useState(defaultSortKey || (columns[0]?.key || ''));
  const [sortAsc, setSortAsc] = useState(true);

  // Scrollable container ref & mouse pan state
  const tableContainerRef = useRef(null);
  const [isPanning, setIsPanning] = useState(false);
  const [panOrigin, setPanOrigin] = useState({ x: 0, y: 0, scrollLeft: 0, scrollTop: 0 });

  const handleMouseDown = (e) => {
    if (e.button !== 0) return; // Only primary mouse button
    const interactive = e.target.closest('button, input, select, textarea, a, [role="button"]');
    if (interactive) return;

    if (!tableContainerRef.current) return;
    setIsPanning(true);
    setPanOrigin({
      x: e.clientX,
      y: e.clientY,
      scrollLeft: tableContainerRef.current.scrollLeft,
      scrollTop: tableContainerRef.current.scrollTop,
    });
  };

  const handleMouseMove = (e) => {
    if (!isPanning || !tableContainerRef.current) return;
    e.preventDefault();
    const deltaX = e.clientX - panOrigin.x;
    const deltaY = e.clientY - panOrigin.y;
    tableContainerRef.current.scrollLeft = panOrigin.scrollLeft - deltaX;
    tableContainerRef.current.scrollTop = panOrigin.scrollTop - deltaY;
  };

  const handleMouseUp = () => {
    if (isPanning) {
      setIsPanning(false);
    }
  };

  // Window-level mouseup listener to catch releases outside the container
  useEffect(() => {
    const handleGlobalMouseUp = () => {
      setIsPanning(false);
    };
    window.addEventListener('mouseup', handleGlobalMouseUp);
    return () => window.removeEventListener('mouseup', handleGlobalMouseUp);
  }, []);

  // Arrow scroll functions (horizontal and vertical)
  const scrollTable = (dx, dy) => {
    if (!tableContainerRef.current) return;
    tableContainerRef.current.scrollBy({
      left: dx,
      top: dy,
      behavior: 'smooth',
    });
  };

  const resetTableScroll = () => {
    if (!tableContainerRef.current) return;
    tableContainerRef.current.scrollTo({
      left: 0,
      top: 0,
      behavior: 'smooth',
    });
  };

  // Sorting Handler
  const handleSort = (key) => {
    if (sortKey === key) {
      setSortAsc(!sortAsc);
    } else {
      setSortKey(key);
      setSortAsc(true);
    }
  };

  // Filtered & Sorted rows
  const processedData = useMemo(() => {
    let result = [...data];

    // Search filter across all string values
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter((row) =>
        Object.values(row).some((val) =>
          val !== null && val !== undefined && String(val).toLowerCase().includes(q)
        )
      );
    }

    // Sort
    if (sortKey) {
      result.sort((a, b) => {
        let valA = a[sortKey];
        let valB = b[sortKey];

        if (valA === undefined || valA === null) valA = '';
        if (valB === undefined || valB === null) valB = '';

        if (typeof valA === 'number' && typeof valB === 'number') {
          return sortAsc ? valA - valB : valB - valA;
        }

        return sortAsc
          ? String(valA).localeCompare(String(valB))
          : String(valB).localeCompare(String(valA));
      });
    }

    return result;
  }, [data, searchQuery, sortKey, sortAsc]);

  // Export handlers
  const handleExportExcel = () => {
    const exportRows = processedData.map((row) => {
      const obj = {};
      columns.forEach((col) => {
        const val = row[col.key];
        obj[col.label] = val !== undefined && val !== null ? val : '';
      });
      return obj;
    });
    exportToExcel(exportRows, `${exportFileName}.xlsx`, sheetName);
  };

  const handleExportWord = () => {
    const colLabels = columns.map((c) => c.label);
    const rowMatrix = processedData.map((row) =>
      columns.map((c) => (row[c.key] !== undefined && row[c.key] !== null ? String(row[c.key]) : ''))
    );
    exportToWord({
      title,
      summaryStats: summaryCards,
      columns: colLabels,
      rows: rowMatrix,
      filename: `${exportFileName}.doc`,
    });
  };

  const handleExportPdf = () => {
    const colLabels = columns.map((c) => c.label);
    const rowMatrix = processedData.map((row) =>
      columns.map((c) => (row[c.key] !== undefined && row[c.key] !== null ? String(row[c.key]) : ''))
    );
    exportToPdf({
      title,
      summaryStats: summaryCards,
      columns: colLabels,
      rows: rowMatrix,
    });
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {/* 1. Summary Cards Ribbon */}
      {summaryCards && summaryCards.length > 0 && (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: `repeat(auto-fit, minmax(180px, 1fr))`,
            gap: '12px',
          }}
        >
          {summaryCards.map((c, i) => (
            <div
              key={i}
              className="card"
              style={{
                padding: '14px 18px',
                borderLeft: `4px solid ${c.color || 'var(--primary-color)'}`,
                display: 'flex',
                flexDirection: 'column',
                gap: '4px',
              }}
            >
              <span style={{ fontSize: '0.76rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase' }}>
                {c.label}
              </span>
              <span style={{ fontSize: '1.6rem', fontWeight: 900, color: c.color || 'var(--text-primary)' }}>
                {c.value}
              </span>
              {c.subtext && (
                <span style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>
                  {c.subtext}
                </span>
              )}
            </div>
          ))}
        </div>
      )}

      {/* 2. Top Action Bar: Search & Export Buttons */}
      <div
        className="card"
        style={{
          padding: '14px 18px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '12px',
          background: 'var(--card-bg)',
          borderRadius: 'var(--radius-lg)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: 1, minWidth: '240px' }}>
          <div
            style={{
              position: 'relative',
              width: '100%',
              maxWidth: '360px',
            }}
          >
            <Search
              size={15}
              style={{
                position: 'absolute',
                left: '12px',
                top: '50%',
                transform: 'translateY(-50%)',
                color: 'var(--text-muted)',
              }}
            />
            <input
              type="text"
              placeholder="Search spreadsheet records..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                width: '100%',
                padding: '8px 12px 8px 34px',
                borderRadius: '8px',
                border: '1px solid var(--border-color)',
                background: 'var(--page-bg)',
                color: 'var(--text-primary)',
                fontSize: '0.84rem',
                outline: 'none',
              }}
            />
          </div>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            Showing <strong>{processedData.length}</strong> of {data.length} records
          </span>
        </div>

        {/* Export Buttons */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          <button
            type="button"
            className="btn btn-sm btn-ghost"
            onClick={handleExportExcel}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '0.82rem',
              fontWeight: 700,
              color: '#10B981',
              border: '1px solid rgba(16, 185, 129, 0.3)',
              background: 'rgba(16, 185, 129, 0.08)',
              padding: '6px 14px',
            }}
            title="Download formatted Excel Spreadsheet (.xlsx)"
          >
            <FileSpreadsheet size={15} />
            Excel (.xlsx)
          </button>

          <button
            type="button"
            className="btn btn-sm btn-ghost"
            onClick={handleExportWord}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '0.82rem',
              fontWeight: 700,
              color: '#2563EB',
              border: '1px solid rgba(37, 99, 235, 0.3)',
              background: 'rgba(37, 99, 235, 0.08)',
              padding: '6px 14px',
            }}
            title="Download formatted Word Document (.doc)"
          >
            <FileText size={15} />
            Word (.doc)
          </button>

          <button
            type="button"
            className="btn btn-sm btn-ghost"
            onClick={handleExportPdf}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '0.82rem',
              fontWeight: 700,
              color: '#EF4444',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              background: 'rgba(239, 68, 68, 0.08)',
              padding: '6px 14px',
            }}
            title="Print or Save as PDF"
          >
            <Printer size={15} />
            PDF / Print
          </button>
        </div>
      </div>

      {/* 3. Excel Spreadsheet Data Table with Arrow & Drag-to-Pan Navigation */}
      <div
        className="card"
        style={{
          padding: 0,
          overflow: 'hidden',
          borderRadius: 'var(--radius-lg)',
          border: '1.5px solid var(--border-color)',
          background: 'var(--card-bg)',
          boxShadow: 'var(--shadow-md)',
        }}
      >
        {/* Navigation Toolbar: Pan Tip + Arrow Navigation Controls */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '10px',
            padding: '8px 16px',
            background: 'var(--page-bg)',
            borderBottom: '1px solid var(--border-color)',
            fontSize: '0.78rem',
            color: 'var(--text-secondary)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Move size={14} color="var(--primary-color)" />
            <span>
              <strong>Pan & Scroll:</strong> Hold left-click & drag anywhere to scroll, or use the arrow controls:
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            {/* Left */}
            <button
              type="button"
              className="btn btn-sm btn-ghost"
              onClick={() => scrollTable(-240, 0)}
              title="Scroll Left"
              style={{ padding: '4px 8px', height: '28px', border: '1px solid var(--border-color)', borderRadius: '6px' }}
            >
              <ArrowLeft size={13} />
              <span style={{ fontSize: '0.72rem', marginLeft: '4px' }}>Left</span>
            </button>

            {/* Right */}
            <button
              type="button"
              className="btn btn-sm btn-ghost"
              onClick={() => scrollTable(240, 0)}
              title="Scroll Right"
              style={{ padding: '4px 8px', height: '28px', border: '1px solid var(--border-color)', borderRadius: '6px' }}
            >
              <span style={{ fontSize: '0.72rem', marginRight: '4px' }}>Right</span>
              <ArrowRight size={13} />
            </button>

            {/* Up */}
            <button
              type="button"
              className="btn btn-sm btn-ghost"
              onClick={() => scrollTable(0, -180)}
              title="Scroll Up"
              style={{ padding: '4px 8px', height: '28px', border: '1px solid var(--border-color)', borderRadius: '6px' }}
            >
              <ArrowUp size={13} />
              <span style={{ fontSize: '0.72rem', marginLeft: '4px' }}>Up</span>
            </button>

            {/* Down */}
            <button
              type="button"
              className="btn btn-sm btn-ghost"
              onClick={() => scrollTable(0, 180)}
              title="Scroll Down"
              style={{ padding: '4px 8px', height: '28px', border: '1px solid var(--border-color)', borderRadius: '6px' }}
            >
              <ArrowDown size={13} />
              <span style={{ fontSize: '0.72rem', marginLeft: '4px' }}>Down</span>
            </button>

            {/* Reset */}
            <button
              type="button"
              className="btn btn-sm btn-ghost"
              onClick={resetTableScroll}
              title="Reset to Top-Left"
              style={{ padding: '4px 8px', height: '28px', border: '1px solid var(--border-color)', borderRadius: '6px' }}
            >
              <RotateCcw size={12} />
              <span style={{ fontSize: '0.72rem', marginLeft: '4px' }}>Reset</span>
            </button>
          </div>
        </div>

        <div
          ref={tableContainerRef}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          style={{
            overflowX: 'auto',
            overflowY: 'auto',
            maxHeight: '680px',
            cursor: isPanning ? 'grabbing' : 'grab',
            userSelect: isPanning ? 'none' : 'auto',
          }}
        >
          <table
            style={{
              width: '100%',
              borderCollapse: 'collapse',
              fontSize: '0.82rem',
              textAlign: 'left',
              fontVariantNumeric: 'tabular-nums',
            }}
          >
            <thead>
              <tr
                style={{
                  background: 'var(--table-header-bg, #0F172A)',
                  color: '#FFFFFF',
                  position: 'sticky',
                  top: 0,
                  zIndex: 10,
                  borderBottom: '2px solid rgba(255, 255, 255, 0.1)',
                }}
              >
                <th style={{ width: '40px', padding: '10px 12px', textAlign: 'center', color: '#94A3B8' }}>
                  #
                </th>
                {columns.map((col) => (
                  <th
                    key={col.key}
                    style={{
                      padding: '11px 14px',
                      fontWeight: 800,
                      letterSpacing: '0.04em',
                      textTransform: 'uppercase',
                      fontSize: '0.74rem',
                      cursor: col.sortable !== false ? 'pointer' : 'default',
                      userSelect: 'none',
                      whiteSpace: 'nowrap',
                      width: col.width,
                    }}
                    onClick={() => col.sortable !== false && handleSort(col.key)}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span>{col.label}</span>
                      {col.sortable !== false && (
                        <span style={{ color: sortKey === col.key ? '#38BDF8' : '#64748B' }}>
                          {sortKey === col.key ? (
                            sortAsc ? <ChevronUp size={13} /> : <ChevronDown size={13} />
                          ) : (
                            <ArrowUpDown size={11} />
                          )}
                        </span>
                      )}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {processedData.length === 0 ? (
                <tr>
                  <td
                    colSpan={columns.length + 1}
                    style={{
                      padding: '48px 16px',
                      textAlign: 'center',
                      color: 'var(--text-muted)',
                      fontSize: '0.9rem',
                    }}
                  >
                    No matching records found.
                  </td>
                </tr>
              ) : (
                processedData.map((row, idx) => (
                  <tr
                    key={row.id || idx}
                    onClick={() => onRowClick && onRowClick(row)}
                    style={{
                      borderBottom: '1px solid var(--border-color)',
                      background:
                        idx % 2 === 0
                          ? 'transparent'
                          : 'var(--table-zebra-bg, rgba(255, 255, 255, 0.02))',
                      cursor: onRowClick ? 'pointer' : 'default',
                      transition: 'background 0.15s ease',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = 'var(--hover-bg, rgba(23, 105, 255, 0.06))';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor =
                        idx % 2 === 0
                          ? 'transparent'
                          : 'var(--table-zebra-bg, rgba(255, 255, 255, 0.02))';
                    }}
                  >
                    <td
                      style={{
                        padding: '10px 12px',
                        textAlign: 'center',
                        color: 'var(--text-muted)',
                        fontSize: '0.74rem',
                        borderRight: '1px solid var(--border-color)',
                        background: 'rgba(0, 0, 0, 0.05)',
                      }}
                    >
                      {idx + 1}
                    </td>
                    {columns.map((col) => {
                      const val = row[col.key];
                      return (
                        <td
                          key={col.key}
                          style={{
                            padding: '10px 14px',
                            borderRight: '1px solid var(--border-color)',
                            color: 'var(--text-primary)',
                            whiteSpace: col.wrap ? 'normal' : 'nowrap',
                            maxWidth: col.maxWidth || 'auto',
                          }}
                        >
                          {col.render ? col.render(val, row) : val !== undefined && val !== null ? String(val) : '-'}
                        </td>
                      );
                    })}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
