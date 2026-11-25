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
import '../../styles/components/excel-report-table.css';

/**
 * Excel-Style Production Data Grid Component with Full-Page Flow, Pagination & Date/Month Filters
 * 100% Theme-Adaptive - Zero Inline CSS - All Design Managed via excel-report-table.css
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
    <div className="excel-report-container">
      {/* 1. Summary Cards Ribbon (Ultra-Compact & Collapsible) */}
      {showSummary && summaryCards && summaryCards.length > 0 && (
        <div className="excel-summary-grid">
          {summaryCards.map((c, i) => (
            <div
              key={i}
              className="excel-summary-card"
              style={{ '--summary-accent': c.color || 'var(--primary-color)' }}
            >
              <span className="excel-summary-label">
                {c.label}
              </span>
              <span className="excel-summary-val">
                {c.value}
              </span>
              {c.subtext && (
                <span className="excel-summary-sub">
                  {c.subtext}
                </span>
              )}
            </div>
          ))}
        </div>
      )}

      {/* 2. Top Action Bar: Search, Filter Toggle Button, Summary Toggle & Export */}
      <div className="excel-action-bar">
        <div className="excel-action-left">
          {/* Toggle Summary Cards Button */}
          {summaryCards && summaryCards.length > 0 && (
            <button
              type="button"
              onClick={() => setShowSummary(!showSummary)}
              className={`btn btn-sm ${showSummary ? 'btn-ghost' : 'btn-secondary'} excel-btn-stats`}
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
            className={`btn btn-sm ${showFilters ? 'btn-primary' : 'btn-secondary'} excel-btn-filter`}
          >
            <Filter size={12} />
            <span>{showFilters ? 'Hide Filters' : 'Filters'}</span>
            {(monthFilter !== 'all' || skipDate) && (
              <span
                className={`excel-filter-dot ${showFilters ? 'is-active' : ''}`}
              />
            )}
          </button>

          {/* Active Filter Pill when collapsed */}
          {!showFilters && (monthFilter !== 'all' || skipDate) && (
            <span className="excel-active-filter-pill">
              <Calendar size={12} color="var(--primary-color)" />
              {skipDate ? `Date: ${skipDate}` : `Month: ${monthFilter}`}
            </span>
          )}

          {/* Search Input */}
          <div className="excel-search-wrap">
            <Search size={13} className="excel-search-icon" />
            <input
              type="text"
              placeholder="Search records"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="excel-search-input"
            />
          </div>
        </div>

        {/* Export Buttons */}
        <div className="excel-export-group">
          <button
            type="button"
            className="excel-btn-export btn-export-excel"
            onClick={handleExportExcel}
            title="Export as Microsoft Excel (.xlsx)"
          >
            <FileSpreadsheet size={13} />
            Excel
          </button>

          <button
            type="button"
            className="excel-btn-export btn-export-word"
            onClick={handleExportWord}
            title="Export as Microsoft Word (.doc)"
          >
            <FileText size={13} />
            Word
          </button>

          <button
            type="button"
            className="excel-btn-export btn-export-pdf"
            onClick={handleExportPdf}
            title="Export as PDF"
          >
            <Printer size={13} />
            PDF
          </button>
        </div>
      </div>

      {/* 2b. Collapsible Filter Tray (Month Filter & Skip Date) */}
      {showFilters && (
        <div className="excel-filter-tray">
          {/* Default Month Filter */}
          <div className="excel-filter-group">
            <Calendar size={14} color="var(--primary-color)" />
            <span className="excel-filter-label">Month:</span>
            <select
              value={monthFilter}
              onChange={(e) => {
                setMonthFilter(e.target.value);
                setSkipDate('');
              }}
              className="excel-filter-select"
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
          <div className="excel-filter-group">
            <CalendarDays size={14} color="#10B981" />
            <span className="excel-filter-label">Skip Date:</span>
            <div className="excel-date-input-wrap">
              <input
                type="date"
                value={skipDate}
                onChange={(e) => setSkipDate(e.target.value)}
                title="Skip to specific date"
                placeholder="Enter date to skip to"
                className="excel-date-input"
              />
              {skipDate && (
                <button
                  type="button"
                  onClick={() => setSkipDate('')}
                  title="Clear date filter"
                  className="excel-date-clear-btn"
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
              className="excel-filter-reset-btn"
            >
              Reset to Current Month
            </button>
          )}
        </div>
      )}

      {/* 3. Full-Page Data Grid (No Fixed-Box Scroll) */}
      <div className="excel-grid-card">
        {/* Navigation Toolbar: Pan Tip + Horizontal Scroll Controls */}
        <div className="excel-table-nav-bar">
          <div className="excel-table-nav-left">
            <Move size={14} color="#38BDF8" />
            <span>
              <strong>Table Navigation:</strong> Drag to pan horizontally, or use column scroll controls:
            </span>
          </div>

          <div className="excel-table-nav-right">
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
          className={`excel-table-scroll-container ${isPanning ? 'is-panning' : ''}`}
        >
          <table className="excel-grid-table">
            <thead>
              <tr className="excel-table-header-row">
                <th className="excel-th-idx">
                  #
                </th>
                {columns.map((col) => (
                  <th
                    key={col.key}
                    className={`excel-th-cell ${col.sortable !== false ? 'is-sortable' : ''}`}
                    style={col.width ? { width: col.width } : undefined}
                    onClick={() => col.sortable !== false && handleSort(col.key)}
                  >
                    <div className="excel-th-content">
                      <span>{col.label}</span>
                      {col.sortable !== false && (
                        <span className={`excel-th-sort-icon ${sortKey === col.key ? 'is-active' : ''}`}>
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
                    className="excel-table-empty-cell"
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
                      className={`excel-table-row ${onRowClick ? 'is-clickable' : ''}`}
                      onClick={() => onRowClick && onRowClick(row)}
                    >
                      <td className="excel-td-idx">
                        {rowNum}
                      </td>
                      {columns.map((col) => {
                        const val = row[col.key];
                        return (
                          <td
                            key={col.key}
                            className={`excel-td-cell ${col.wrap ? 'is-wrap' : ''}`}
                            style={col.maxWidth ? { maxWidth: col.maxWidth } : undefined}
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
        <div className="excel-pagination-bar">
          {/* Left: Summary + Rows per page */}
          <div className="excel-pagination-left">
            <span className="excel-pagination-info">
              Showing <strong>{startIndex}</strong> to <strong>{endIndex}</strong> of <strong>{totalRecords}</strong> records
            </span>

            <div className="excel-page-size-group">
              <span className="excel-page-size-label">Per page:</span>
              <select
                value={pageSize}
                onChange={(e) => setPageSize(e.target.value === 'all' ? 'all' : Number(e.target.value))}
                className="excel-page-size-select"
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
            <div className="excel-pagination-right">
              {/* First Page */}
              <button
                type="button"
                className="btn-icon excel-page-nav-btn"
                disabled={safePage <= 1}
                onClick={() => setCurrentPage(1)}
                title="First Page"
              >
                <ChevronsLeft size={14} />
              </button>

              {/* Previous Page */}
              <button
                type="button"
                className="btn-icon excel-page-nav-btn"
                disabled={safePage <= 1}
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                title="Previous Page"
              >
                <ChevronLeft size={14} />
              </button>

              {/* Page Number Chips */}
              <div className="excel-page-nums">
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
                      className={`excel-page-num-btn ${isActive ? 'is-active' : ''}`}
                    >
                      {pNum}
                    </button>
                  );
                })}
              </div>

              {/* Next Page */}
              <button
                type="button"
                className="btn-icon excel-page-nav-btn"
                disabled={safePage >= totalPages}
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                title="Next Page"
              >
                <ChevronRight size={14} />
              </button>

              {/* Last Page */}
              <button
                type="button"
                className="btn-icon excel-page-nav-btn"
                disabled={safePage >= totalPages}
                onClick={() => setCurrentPage(totalPages)}
                title="Last Page"
              >
                <ChevronsRight size={14} />
              </button>

              {/* Jump to page form */}
              <form onSubmit={handleJumpToPage} className="excel-jump-form">
                <span className="excel-jump-label">Page:</span>
                <input
                  type="number"
                  min={1}
                  max={totalPages}
                  placeholder="Enter page number"
                  value={jumpPageInput}
                  onChange={(e) => setJumpPageInput(e.target.value)}
                  className="excel-jump-input"
                />
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
