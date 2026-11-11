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
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Calendar,
  CalendarDays,
  X,
  Move,
  RotateCcw,
  TrendingUp,
} from 'lucide-react';
import { exportToExcel, exportToWord, exportToPdf } from '../../utils/reportExporter';

/**
 * Excel-Style Production Data Grid Component with Full-Page Flow, Pagination & Date/Month Filters
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

  // Month & Skip Date Filters (Default: Current Month)
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonthNum = String(now.getMonth() + 1).padStart(2, '0');
  const defaultCurrentMonth = `${currentYear}-${currentMonthNum}`;

  const [monthFilter, setMonthFilter] = useState(defaultCurrentMonth);
  const [skipDate, setSkipDate] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [showSummary, setShowSummary] = useState(true);

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [jumpPageInput, setJumpPageInput] = useState('');

  // Generate dynamic list of last 12 months for selector
  const monthOptions = useMemo(() => {
    const list = [];
    const dateCursor = new Date();
    for (let i = 0; i < 12; i++) {
      const y = dateCursor.getFullYear();
      const m = String(dateCursor.getMonth() + 1).padStart(2, '0');
      const val = `${y}-${m}`;
      const label = dateCursor.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
      list.push({ val, label: i === 0 ? `Current Month (${label})` : label });
      dateCursor.setMonth(dateCursor.getMonth() - 1);
    }
    return list;
  }, []);

  // Scrollable container ref & mouse pan state (horizontal navigation for wide columns)
  const tableContainerRef = useRef(null);
  const [isPanning, setIsPanning] = useState(false);
  const [panOrigin, setPanOrigin] = useState({ x: 0, scrollLeft: 0 });

  const handleMouseDown = (e) => {
    if (e.button !== 0) return; // Only primary mouse button
    const interactive = e.target.closest('button, input, select, textarea, a, [role="button"]');
    if (interactive) return;

    if (!tableContainerRef.current) return;
    setIsPanning(true);
    setPanOrigin({
      x: e.clientX,
      scrollLeft: tableContainerRef.current.scrollLeft,
    });
  };

  const handleMouseMove = (e) => {
    if (!isPanning || !tableContainerRef.current) return;
    e.preventDefault();
    const deltaX = e.clientX - panOrigin.x;
    tableContainerRef.current.scrollLeft = panOrigin.scrollLeft - deltaX;
  };

  const handleMouseUp = () => {
    if (isPanning) {
      setIsPanning(false);
    }
  };

  useEffect(() => {
    const handleGlobalMouseUp = () => {
      setIsPanning(false);
    };
    window.addEventListener('mouseup', handleGlobalMouseUp);
    return () => window.removeEventListener('mouseup', handleGlobalMouseUp);
  }, []);

  // Horizontal scroll controls
  const scrollTable = (dx) => {
    if (!tableContainerRef.current) return;
    tableContainerRef.current.scrollBy({
      left: dx,
      behavior: 'smooth',
    });
  };

  const resetTableScroll = () => {
    if (!tableContainerRef.current) return;
    tableContainerRef.current.scrollTo({
      left: 0,
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

    // 1. Skip / Jump to Specific Date Filter
    if (skipDate) {
      result = result.filter((row) => {
        const rowDate = row.date || row.completedAt || row.scheduledDate || row.createdAt || '';
        return String(rowDate).startsWith(skipDate);
      });
    } else if (monthFilter && monthFilter !== 'all') {
      // 2. Default Month Filter
      result = result.filter((row) => {
        const rowDate = row.date || row.completedAt || row.scheduledDate || row.createdAt;
        // Keep rows with no specific date (e.g. general goals)
        if (!rowDate) return true;
        return String(rowDate).startsWith(monthFilter);
      });
    }

    // 3. Search query filter across all string values
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter((row) =>
        Object.values(row).some((val) =>
          val !== null && val !== undefined && String(val).toLowerCase().includes(q)
        )
      );
    }

    // 4. Sort
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
  }, [data, skipDate, monthFilter, searchQuery, sortKey, sortAsc]);

  // Reset pagination to page 1 whenever filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, monthFilter, skipDate, pageSize]);

  // Pagination calculations
  const totalRecords = processedData.length;
  const isAll = pageSize === 'all';
  const sizeNum = isAll ? totalRecords : Number(pageSize);
  const totalPages = isAll ? 1 : Math.max(1, Math.ceil(totalRecords / sizeNum));
  const safePage = Math.min(Math.max(1, currentPage), totalPages);

  const paginatedRows = useMemo(() => {
    if (isAll) return processedData;
    const start = (safePage - 1) * sizeNum;
    return processedData.slice(start, start + sizeNum);
  }, [processedData, safePage, sizeNum, isAll]);

  const startIndex = totalRecords === 0 ? 0 : (safePage - 1) * sizeNum + 1;
  const endIndex = isAll ? totalRecords : Math.min(safePage * sizeNum, totalRecords);

  const handleJumpToPage = (e) => {
    e.preventDefault();
    const p = parseInt(jumpPageInput, 10);
    if (!isNaN(p) && p >= 1 && p <= totalPages) {
      setCurrentPage(p);
      setJumpPageInput('');
    }
  };

  // Export handlers (exports all matching processed records)
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
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
      {/* 1. Summary Cards Ribbon (Ultra-Compact & Collapsible) */}
      {showSummary && summaryCards && summaryCards.length > 0 && (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: `repeat(auto-fit, minmax(150px, 1fr))`,
            gap: '8px',
          }}
        >
          {summaryCards.map((c, i) => (
            <div
              key={i}
              className="card"
              style={{
                padding: '6px 10px',
                borderLeft: `3px solid ${c.color || 'var(--primary-color)'}`,
                display: 'flex',
                flexDirection: 'column',
                gap: '1px',
                borderRadius: '6px',
              }}
            >
              <span style={{ fontSize: '0.66rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.02em' }}>
                {c.label}
              </span>
              <span style={{ fontSize: '1.15rem', fontWeight: 900, color: c.color || 'var(--text-primary)', lineHeight: 1.1 }}>
                {c.value}
              </span>
              {c.subtext && (
                <span style={{ fontSize: '0.66rem', color: 'var(--text-secondary)' }}>
                  {c.subtext}
                </span>
              )}
            </div>
          ))}
        </div>
      )}

      {/* 2. Top Action Bar: Search, Filter Toggle Button, Summary Toggle & Export */}
      <div
        className="card"
        style={{
          padding: '6px 10px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '8px',
          background: 'var(--card-bg)',
          borderRadius: 'var(--radius-md)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', flex: 1 }}>
          {/* Toggle Summary Cards Button */}
          {summaryCards && summaryCards.length > 0 && (
            <button
              type="button"
              onClick={() => setShowSummary(!showSummary)}
              className={`btn btn-sm ${showSummary ? 'btn-ghost' : 'btn-secondary'}`}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px',
                fontSize: '0.76rem',
                fontWeight: 700,
                padding: '4px 8px',
                borderRadius: '6px',
                border: '1px solid var(--border-color)',
              }}
              title={showSummary ? 'Hide summary KPI cards' : 'Show summary KPI cards'}
            >
              <TrendingUp size={12} />
              <span>{showSummary ? 'Hide Stats' : 'Stats'}</span>
            </button>
          )}

          {/* Toggle Filters Button */}
          <button
            type="button"
            onClick={() => setShowFilters(!showFilters)}
            className={`btn btn-sm ${showFilters ? 'btn-primary' : 'btn-secondary'}`}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '5px',
              fontSize: '0.76rem',
              fontWeight: 700,
              padding: '4px 8px',
              borderRadius: '6px',
            }}
          >
            <Filter size={12} />
            <span>{showFilters ? 'Hide Filters' : 'Filters'}</span>
            {(monthFilter !== 'all' || skipDate) && (
              <span
                style={{
                  width: '6px',
                  height: '6px',
                  borderRadius: '50%',
                  background: showFilters ? '#FFFFFF' : '#10B981',
                }}
              />
            )}
          </button>

          {/* Active Filter Pill when collapsed */}
          {!showFilters && (monthFilter !== 'all' || skipDate) && (
            <span
              style={{
                fontSize: '0.74rem',
                color: 'var(--text-secondary)',
                background: 'var(--page-bg)',
                padding: '3px 8px',
                borderRadius: '6px',
                border: '1px solid var(--border-color)',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
              }}
            >
              <Calendar size={12} color="var(--primary-color)" />
              {skipDate ? `Date: ${skipDate}` : `Month: ${monthFilter}`}
            </span>
          )}

          {/* Search Input */}
          <div
            style={{
              position: 'relative',
              width: '100%',
              maxWidth: '240px',
            }}
          >
            <Search
              size={13}
              style={{
                position: 'absolute',
                left: '9px',
                top: '50%',
                transform: 'translateY(-50%)',
                color: 'var(--text-muted)',
              }}
            />
            <input
              type="text"
              placeholder="Search records..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                width: '100%',
                padding: '5px 10px 5px 28px',
                borderRadius: '7px',
                border: '1px solid var(--border-color)',
                background: 'var(--page-bg)',
                color: 'var(--text-primary)',
                fontSize: '0.78rem',
                outline: 'none',
              }}
            />
          </div>
        </div>

        {/* Export Buttons */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
          <button
            type="button"
            className="btn btn-sm btn-ghost"
            onClick={handleExportExcel}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '5px',
              fontSize: '0.78rem',
              fontWeight: 700,
              padding: '4px 10px',
              borderRadius: '7px',
              border: '1px solid var(--border-color)',
              color: '#10B981',
            }}
          >
            <FileSpreadsheet size={13} />
            Excel
          </button>

          <button
            type="button"
            className="btn btn-sm btn-ghost"
            onClick={handleExportWord}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '5px',
              fontSize: '0.78rem',
              fontWeight: 700,
              padding: '4px 10px',
              borderRadius: '7px',
              border: '1px solid var(--border-color)',
              color: '#3B82F6',
            }}
          >
            <FileText size={13} />
            Word
          </button>

          <button
            type="button"
            className="btn btn-sm btn-ghost"
            onClick={handleExportPdf}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '5px',
              fontSize: '0.78rem',
              fontWeight: 700,
              padding: '4px 10px',
              borderRadius: '7px',
              border: '1px solid var(--border-color)',
              color: '#EF4444',
            }}
          >
            <Printer size={13} />
            PDF
          </button>
        </div>
      </div>

      {/* 2b. Collapsible Filter Tray (Month Filter & Skip Date) */}
      {showFilters && (
        <div
          className="card"
          style={{
            padding: '10px 14px',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            flexWrap: 'wrap',
            background: 'var(--page-bg)',
            border: '1px solid var(--border-color)',
            borderRadius: 'var(--radius-md)',
            animation: 'fadeIn 0.15s ease',
          }}
        >
          {/* Default Month Filter */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Calendar size={14} color="var(--primary-color)" />
            <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-secondary)' }}>Month:</span>
            <select
              value={monthFilter}
              onChange={(e) => {
                setMonthFilter(e.target.value);
                setSkipDate('');
              }}
              style={{
                padding: '5px 8px',
                borderRadius: '6px',
                border: '1px solid var(--border-color)',
                background: 'var(--card-bg)',
                color: 'var(--text-primary)',
                fontSize: '0.78rem',
                fontWeight: 600,
                outline: 'none',
                cursor: 'pointer',
              }}
            >
              {monthOptions.map((opt) => (
                <option key={opt.val} value={opt.val}>
                  {opt.label}
                </option>
              ))}
              <option value="all">All Months (Full History)</option>
            </select>
          </div>

          {/* Skip / Jump to Specific Date */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <CalendarDays size={14} color="#10B981" />
            <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-secondary)' }}>Skip Date:</span>
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
              <input
                type="date"
                value={skipDate}
                onChange={(e) => setSkipDate(e.target.value)}
                title="Skip to specific date"
                placeholder="Skip to date..."
                style={{
                  padding: '5px 24px 5px 8px',
                  borderRadius: '6px',
                  border: '1px solid var(--border-color)',
                  background: 'var(--card-bg)',
                  color: 'var(--text-primary)',
                  fontSize: '0.78rem',
                  outline: 'none',
                }}
              />
              {skipDate && (
                <button
                  type="button"
                  onClick={() => setSkipDate('')}
                  title="Clear date filter"
                  style={{
                    position: 'absolute',
                    right: '5px',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    color: 'var(--text-muted)',
                    display: 'flex',
                    alignItems: 'center',
                    padding: 0,
                  }}
                >
                  <X size={12} />
                </button>
              )}
            </div>
          </div>

          {(monthFilter !== defaultCurrentMonth || skipDate) && (
            <button
              type="button"
              onClick={() => {
                setMonthFilter(defaultCurrentMonth);
                setSkipDate('');
              }}
              style={{
                fontSize: '0.72rem',
                color: 'var(--primary-color)',
                cursor: 'pointer',
                fontWeight: 700,
                background: 'none',
                border: 'none',
                textDecoration: 'underline',
              }}
            >
              Reset to Current Month
            </button>
          )}
        </div>
      )}

      {/* 3. Full-Page Data Grid (No Fixed-Box Scroll) */}
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
        {/* Navigation Toolbar: Pan Tip + Horizontal Scroll Controls */}
        <div className="excel-table-nav-bar">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Move size={14} color="#38BDF8" />
            <span>
              <strong style={{ color: 'var(--text-primary)' }}>Table Navigation:</strong> Drag to pan horizontally, or use column scroll controls:
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            {/* Left */}
            <button
              type="button"
              className="excel-nav-btn"
              onClick={() => scrollTable(-240)}
              title="Scroll Left"
            >
              <ArrowLeft size={13} />
              <span>Left</span>
            </button>

            {/* Right */}
            <button
              type="button"
              className="excel-nav-btn"
              onClick={() => scrollTable(240)}
              title="Scroll Right"
            >
              <span>Right</span>
              <ArrowRight size={13} />
            </button>

            {/* Reset */}
            <button
              type="button"
              className="excel-nav-btn"
              onClick={resetTableScroll}
              title="Reset Table Position"
            >
              <RotateCcw size={12} />
              <span>Reset</span>
            </button>
          </div>
        </div>

        {/* FULL PAGE TABLE: overflowY is visible so rows expand naturally without inner box scroll */}
        <div
          ref={tableContainerRef}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          style={{
            overflowX: 'auto',
            overflowY: 'visible',
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
                className="excel-table-header-row"
                style={{
                  position: 'sticky',
                  top: 0,
                  zIndex: 10,
                }}
              >
                <th style={{ width: '40px', padding: '12px 14px', textAlign: 'center', color: '#94A3B8' }}>
                  #
                </th>
                {columns.map((col) => (
                  <th
                    key={col.key}
                    style={{
                      padding: '12px 16px',
                      fontWeight: 800,
                      letterSpacing: '0.05em',
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
              {paginatedRows.length === 0 ? (
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
                    No matching records found for the selected month/date.
                  </td>
                </tr>
              ) : (
                paginatedRows.map((row, idx) => {
                  const rowNum = isAll ? idx + 1 : (safePage - 1) * sizeNum + idx + 1;
                  return (
                    <tr
                      key={row.id || idx}
                      className="excel-table-row"
                      onClick={() => onRowClick && onRowClick(row)}
                      style={{
                        borderBottom: '1px solid rgba(255, 255, 255, 0.06)',
                        background:
                          idx % 2 === 0
                            ? 'transparent'
                            : 'rgba(255, 255, 255, 0.015)',
                        cursor: onRowClick ? 'pointer' : 'default',
                      }}
                    >
                      <td
                        className="excel-row-num"
                        style={{
                          padding: '11px 14px',
                          textAlign: 'center',
                          fontSize: '0.74rem',
                          borderRight: '1px solid rgba(255, 255, 255, 0.06)',
                          background: 'rgba(0, 0, 0, 0.12)',
                        }}
                      >
                        {rowNum}
                      </td>
                      {columns.map((col) => {
                        const val = row[col.key];
                        return (
                          <td
                            key={col.key}
                            style={{
                              padding: '11px 16px',
                              borderRight: '1px solid rgba(255, 255, 255, 0.06)',
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
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* 4. Full Pagination Controls Bar */}
        <div
          style={{
            padding: '12px 18px',
            background: 'var(--page-bg)',
            borderTop: '1px solid var(--border-color)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '14px',
            fontSize: '0.82rem',
          }}
        >
          {/* Left: Summary + Rows per page */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flexWrap: 'wrap' }}>
            <span style={{ color: 'var(--text-secondary)' }}>
              Showing <strong>{startIndex}</strong> to <strong>{endIndex}</strong> of <strong>{totalRecords}</strong> records
            </span>

            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ color: 'var(--text-muted)', fontSize: '0.76rem' }}>Per page:</span>
              <select
                value={pageSize}
                onChange={(e) => setPageSize(e.target.value === 'all' ? 'all' : Number(e.target.value))}
                style={{
                  padding: '4px 8px',
                  borderRadius: '6px',
                  border: '1px solid var(--border-color)',
                  background: 'var(--card-bg)',
                  color: 'var(--text-primary)',
                  fontSize: '0.78rem',
                  fontWeight: 700,
                  outline: 'none',
                  cursor: 'pointer',
                }}
              >
                <option value={10}>10</option>
                <option value={20}>20</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
                <option value="all">All</option>
              </select>
            </div>
          </div>

          {/* Right: Page Navigation & Jump */}
          {!isAll && totalPages > 1 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
              {/* First Page */}
              <button
                type="button"
                className="btn-icon"
                disabled={safePage <= 1}
                onClick={() => setCurrentPage(1)}
                title="First Page"
                style={{
                  padding: '5px',
                  opacity: safePage <= 1 ? 0.35 : 1,
                  cursor: safePage <= 1 ? 'not-allowed' : 'pointer',
                  border: '1px solid var(--border-color)',
                  borderRadius: '6px',
                }}
              >
                <ChevronsLeft size={14} />
              </button>

              {/* Previous Page */}
              <button
                type="button"
                className="btn-icon"
                disabled={safePage <= 1}
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                title="Previous Page"
                style={{
                  padding: '5px',
                  opacity: safePage <= 1 ? 0.35 : 1,
                  cursor: safePage <= 1 ? 'not-allowed' : 'pointer',
                  border: '1px solid var(--border-color)',
                  borderRadius: '6px',
                }}
              >
                <ChevronLeft size={14} />
              </button>

              {/* Page Number Chips */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  let pNum;
                  if (totalPages <= 5) {
                    pNum = i + 1;
                  } else if (safePage <= 3) {
                    pNum = i + 1;
                  } else if (safePage >= totalPages - 2) {
                    pNum = totalPages - 4 + i;
                  } else {
                    pNum = safePage - 2 + i;
                  }

                  const isActive = pNum === safePage;
                  return (
                    <button
                      key={pNum}
                      type="button"
                      onClick={() => setCurrentPage(pNum)}
                      style={{
                        minWidth: '28px',
                        height: '28px',
                        padding: '0 6px',
                        borderRadius: '6px',
                        border: isActive ? '1px solid var(--primary-color)' : '1px solid var(--border-color)',
                        background: isActive ? 'var(--primary-color)' : 'var(--card-bg)',
                        color: isActive ? '#FFFFFF' : 'var(--text-primary)',
                        fontSize: '0.78rem',
                        fontWeight: isActive ? 800 : 600,
                        cursor: 'pointer',
                        transition: 'all 0.15s ease',
                      }}
                    >
                      {pNum}
                    </button>
                  );
                })}
              </div>

              {/* Next Page */}
              <button
                type="button"
                className="btn-icon"
                disabled={safePage >= totalPages}
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                title="Next Page"
                style={{
                  padding: '5px',
                  opacity: safePage >= totalPages ? 0.35 : 1,
                  cursor: safePage >= totalPages ? 'not-allowed' : 'pointer',
                  border: '1px solid var(--border-color)',
                  borderRadius: '6px',
                }}
              >
                <ChevronRight size={14} />
              </button>

              {/* Last Page */}
              <button
                type="button"
                className="btn-icon"
                disabled={safePage >= totalPages}
                onClick={() => setCurrentPage(totalPages)}
                title="Last Page"
                style={{
                  padding: '5px',
                  opacity: safePage >= totalPages ? 0.35 : 1,
                  cursor: safePage >= totalPages ? 'not-allowed' : 'pointer',
                  border: '1px solid var(--border-color)',
                  borderRadius: '6px',
                }}
              >
                <ChevronsRight size={14} />
              </button>

              {/* Jump to page form */}
              <form onSubmit={handleJumpToPage} style={{ display: 'flex', alignItems: 'center', gap: '4px', marginLeft: '6px' }}>
                <span style={{ color: 'var(--text-muted)', fontSize: '0.74rem' }}>Page:</span>
                <input
                  type="number"
                  min={1}
                  max={totalPages}
                  placeholder={String(safePage)}
                  value={jumpPageInput}
                  onChange={(e) => setJumpPageInput(e.target.value)}
                  style={{
                    width: '44px',
                    height: '28px',
                    padding: '2px 4px',
                    textAlign: 'center',
                    borderRadius: '6px',
                    border: '1px solid var(--border-color)',
                    background: 'var(--card-bg)',
                    color: 'var(--text-primary)',
                    fontSize: '0.78rem',
                    outline: 'none',
                  }}
                />
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
