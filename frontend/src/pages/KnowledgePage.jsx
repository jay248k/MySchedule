import React, { useState, useEffect, useMemo } from 'react';
import {
  Folder,
  FileText,
  Table as TableIcon,
  ChevronRight,
  Plus,
  Trash2,
  Edit2,
  Search,
  Upload,
  ArrowLeft,
  Sparkles,
  Download,
  BookOpen,
  Eye,
  Check,
  Calendar,
  Layers,
  Pin,
  Link as LinkIcon,
  ArrowRight,
  LayoutGrid,
  List,
  GitBranch,
} from 'lucide-react';
import { api } from '../services/api';
import { useApp } from '../context/AppContext';
import '../styles/pages/knowledge.css';

export function KnowledgePage() {
  const { showToast } = useApp();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentFolder, setCurrentFolder] = useState(null); // null = root
  const [breadcrumbs, setBreadcrumbs] = useState([]); // [{ id, title }]
  const [searchQuery, setSearchQuery] = useState('');
  const [activeItem, setActiveItem] = useState(null); // Previewing item (lesson or table)
  const [viewMode, setViewMode] = useState('pc-grid'); // 'pc-grid' | 'cards' | 'chain'

  // Creation Modals
  const [modalMode, setModalMode] = useState(null); // 'folder' | 'lesson' | 'table'
  const [createTitle, setCreateTitle] = useState('');
  const [createContent, setCreateContent] = useState('');
  const [createTags, setCreateTags] = useState('');
  const [createIsPinned, setCreateIsPinned] = useState(false);
  const [createNextLessonId, setCreateNextLessonId] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Table creation state
  const [tableData, setTableData] = useState({
    headers: ['Step', 'Topic', 'Description', 'Status'],
    rows: [
      ['1', 'Setup & Environment', 'Initialize repository and install dependencies', 'Done'],
      ['2', 'Core Architecture', 'Design models, routes, and database schema', 'In Progress'],
    ],
  });

  const fetchItems = async () => {
    try {
      setLoading(true);
      const res = await api.getKnowledgeItems();
      if (res?.data && Array.isArray(res.data)) {
        setItems(res.data);
      }
    } catch (err) {
      console.warn('Failed to load knowledge items:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchItems();
  }, []);

  // Filter items in the current folder, sorting pinned items first
  const currentItems = useMemo(() => {
    let list;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = items.filter(
        (it) =>
          (it.title || '').toLowerCase().includes(q) ||
          (it.content || '').toLowerCase().includes(q) ||
          (it.tags || '').toLowerCase().includes(q)
      );
    } else {
      const parentId = currentFolder ? currentFolder.id : null;
      list = items.filter((it) => (it.parentId || null) === parentId);
    }

    return [...list].sort((a, b) => {
      if (a.isPinned && !b.isPinned) return -1;
      if (!a.isPinned && b.isPinned) return 1;
      return (a.title || '').localeCompare(b.title || '');
    });
  }, [items, currentFolder, searchQuery]);

  // Lessons inside current folder available for chaining
  const lessonsInFolder = useMemo(() => {
    const parentId = currentFolder ? currentFolder.id : null;
    return items.filter((it) => (it.parentId || null) === parentId && it.type === 'lesson');
  }, [items, currentFolder]);

  // Chain Sequence Builder
  const chainSequence = useMemo(() => {
    const lessons = lessonsInFolder;
    if (lessons.length === 0) return [];

    const map = new Map(lessons.map((l) => [l.id, l]));
    const targetedIds = new Set(lessons.map((l) => l.nextLessonId).filter(Boolean));

    // Find starter lessons (not targeted by any nextLessonId)
    let starters = lessons.filter((l) => !targetedIds.has(l.id));
    if (starters.length === 0) starters = [lessons[0]];

    const chains = [];
    const visited = new Set();

    starters.forEach((start) => {
      const chain = [];
      let curr = start;
      while (curr && !visited.has(curr.id)) {
        visited.add(curr.id);
        chain.push(curr);
        curr = curr.nextLessonId ? map.get(curr.nextLessonId) : null;
      }
      if (chain.length > 0) chains.push(chain);
    });

    // Add any remaining unchained lessons
    lessons.forEach((l) => {
      if (!visited.has(l.id)) {
        chains.push([l]);
      }
    });

    return chains;
  }, [lessonsInFolder]);

  const handleOpenFolder = (folder) => {
    setCurrentFolder(folder);
    setBreadcrumbs((prev) => [...prev, folder]);
    setActiveItem(null);
  };

  const handleNavigateBreadcrumb = (index) => {
    if (index === -1) {
      setCurrentFolder(null);
      setBreadcrumbs([]);
      setActiveItem(null);
      return;
    }
    const target = breadcrumbs[index];
    setCurrentFolder(target);
    setBreadcrumbs((prev) => prev.slice(0, index + 1));
    setActiveItem(null);
  };

  const handleTogglePin = async (item, e) => {
    if (e) e.stopPropagation();
    try {
      const nextPin = !item.isPinned;
      await api.updateKnowledgeItem(item.id, { isPinned: nextPin });
      setItems((prev) =>
        prev.map((it) => (it.id === item.id ? { ...it, isPinned: nextPin } : it))
      );
      if (activeItem?.id === item.id) {
        setActiveItem((prev) => ({ ...prev, isPinned: nextPin }));
      }
      showToast({
        type: 'success',
        title: nextPin ? 'Item Pinned' : 'Item Unpinned',
        message: nextPin ? 'Pinned to top of list.' : 'Unpinned from top.',
      });
    } catch (err) {
      showToast({ type: 'danger', title: 'Error', message: 'Could not toggle pin.' });
    }
  };

  const handleSetNextLesson = async (currentLessonId, nextLessonId) => {
    try {
      await api.updateKnowledgeItem(currentLessonId, {
        nextLessonId: nextLessonId || null,
      });
      setItems((prev) =>
        prev.map((it) =>
          it.id === currentLessonId ? { ...it, nextLessonId: nextLessonId || null } : it
        )
      );
      if (activeItem?.id === currentLessonId) {
        setActiveItem((prev) => ({ ...prev, nextLessonId: nextLessonId || null }));
      }
      showToast({
        type: 'success',
        title: 'Lesson Chained',
        message: 'Sequential progression updated successfully.',
      });
    } catch (err) {
      showToast({ type: 'danger', title: 'Error', message: 'Failed to update lesson chain.' });
    }
  };

  const handleCreateItem = async (e) => {
    e.preventDefault();
    if (!createTitle.trim()) return;

    try {
      setSubmitting(true);
      const payload = {
        title: createTitle.trim(),
        type: modalMode,
        parentId: currentFolder ? currentFolder.id : null,
        tags: createTags.trim() || null,
        isPinned: createIsPinned,
      };

      if (modalMode === 'lesson') {
        payload.content = createContent;
        if (createNextLessonId) payload.nextLessonId = createNextLessonId;
      } else if (modalMode === 'table') {
        payload.content = JSON.stringify(tableData);
      }

      const res = await api.createKnowledgeItem(payload);
      if (res?.data) {
        setItems((prev) => [res.data, ...prev]);
        showToast({
          type: 'success',
          title: 'Created Successfully',
          message: `${payload.title} created in database.`,
        });
        setModalMode(null);
        setCreateTitle('');
        setCreateContent('');
        setCreateTags('');
        setCreateIsPinned(false);
        setCreateNextLessonId('');
      }
    } catch (err) {
      showToast({
        type: 'danger',
        title: 'Creation Failed',
        message: err.message || 'Error creating knowledge item.',
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteItem = async (id, e) => {
    if (e) e.stopPropagation();
    try {
      await api.deleteKnowledgeItem(id);
      setItems((prev) => prev.filter((it) => it.id !== id));
      if (activeItem?.id === id) setActiveItem(null);
      showToast({
        type: 'info',
        title: 'Item Deleted',
        message: 'Item removed from database.',
      });
    } catch (err) {
      showToast({ type: 'danger', title: 'Error', message: 'Could not delete item.' });
    }
  };

  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      const text = evt.target?.result;
      if (typeof text === 'string') {
        const lines = text.split('\n').filter((l) => l.trim().length > 0);
        if (lines.length > 0) {
          const headers = lines[0].split(',').map((h) => h.trim().replace(/^"|"$/g, ''));
          const rows = lines.slice(1).map((line) =>
            line.split(',').map((cell) => cell.trim().replace(/^"|"$/g, ''))
          );
          setTableData({ headers, rows });
          showToast({
            type: 'success',
            title: 'File Parsed',
            message: `Loaded ${rows.length} rows into structured table preview.`,
          });
        }
      }
    };
    reader.readAsText(file);
  };

  const renderTableContent = (tData) => {
    try {
      const parsed = typeof tData === 'string' ? JSON.parse(tData) : tData;
      const headers = parsed?.headers || [];
      const rows = parsed?.rows || [];

      return (
        <div className="knowledge-table-wrapper">
          <table className="knowledge-table-element">
            <thead className="knowledge-table-head">
              <tr>
                <th style={{ width: '40px', padding: '10px 14px' }}>#</th>
                {headers.map((h, i) => (
                  <th key={i}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row, rIdx) => (
                <tr
                  key={rIdx}
                  style={{
                    borderBottom: '1px solid var(--border-subtle)',
                    background: rIdx % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.02)',
                  }}
                >
                  <td className="knowledge-table-cell-idx">
                    {rIdx + 1}
                  </td>
                  {row.map((cell, cIdx) => (
                    <td key={cIdx} className="knowledge-table-cell">
                      {cell}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
    } catch {
      return <pre style={{ whiteSpace: 'pre-wrap', color: 'var(--text-primary)' }}>{String(tData)}</pre>;
    }
  };

  return (
    <div className="knowledge-container">
      {/* Banner */}
      <div className="knowledge-banner-card card">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="knowledge-badge-emerald">
              Lessons & Knowledge Management
            </span>
          </div>
          <h1 className="knowledge-banner-title">
            <BookOpen size={22} color="#10B981" /> Knowledge Base & Lessons
          </h1>
          <p className="knowledge-banner-subtitle">
            Explorer folder view, sequential lesson chaining, text notes, and Excel tables.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="knowledge-banner-actions">
          <button
            onClick={() => {
              setModalMode('folder');
              setCreateTitle('');
              setCreateContent('');
              setCreateTags('');
              setCreateIsPinned(false);
            }}
            className="btn btn-ghost knowledge-banner-btn-ghost"
          >
            <Folder size={15} color="#F59E0B" /> New Folder
          </button>
          <button
            onClick={() => {
              setModalMode('lesson');
              setCreateTitle('');
              setCreateContent('');
              setCreateTags('');
              setCreateIsPinned(false);
              setCreateNextLessonId('');
            }}
            className="btn btn-ghost knowledge-banner-btn-ghost"
          >
            <FileText size={15} color="#3B82F6" /> New Lesson
          </button>
          <button
            onClick={() => {
              setModalMode('table');
              setCreateTitle('');
              setCreateContent('');
              setCreateTags('');
              setCreateIsPinned(false);
            }}
            className="btn btn-primary knowledge-banner-btn-primary"
          >
            <TableIcon size={15} /> New Table / Excel
          </button>
        </div>
      </div>

      {/* Navigation Breadcrumbs, View Switcher & Search Bar */}
      <div className="knowledge-nav-bar card">
        {/* Breadcrumb Path */}
        <div className="knowledge-breadcrumb-path">
          <button
            onClick={() => handleNavigateBreadcrumb(-1)}
            className="knowledge-breadcrumb-root-btn"
            style={{
              color: breadcrumbs.length === 0 ? 'var(--primary-color)' : 'var(--text-secondary)',
            }}
          >
            <Layers size={14} /> Root Base
          </button>
          {breadcrumbs.map((b, idx) => (
            <React.Fragment key={b.id}>
              <ChevronRight size={14} color="var(--text-muted)" />
              <button
                onClick={() => handleNavigateBreadcrumb(idx)}
                className="knowledge-breadcrumb-btn"
                style={{
                  color: idx === breadcrumbs.length - 1 ? 'var(--primary-color)' : 'var(--text-secondary)',
                }}
              >
                {b.title}
              </button>
            </React.Fragment>
          ))}
        </div>

        {/* View Mode Switcher: PC Grid / Detailed Cards / Chain View */}
        <div className="knowledge-view-switcher">
          <div className="knowledge-view-pill-group">
            <button
              onClick={() => setViewMode('pc-grid')}
              title="PC Desktop & Folder Explorer View"
              className={`knowledge-view-btn ${viewMode === 'pc-grid' ? 'active' : ''}`}
            >
              <LayoutGrid size={13} /> PC Explorer
            </button>
            <button
              onClick={() => setViewMode('cards')}
              title="Detailed Card List View"
              className={`knowledge-view-btn ${viewMode === 'cards' ? 'active' : ''}`}
            >
              <List size={13} /> Cards
            </button>
            <button
              onClick={() => setViewMode('chain')}
              title="Sequential Lesson Chain View"
              className={`knowledge-view-btn ${viewMode === 'chain' ? 'active' : ''}`}
            >
              <GitBranch size={13} /> Chain View
            </button>
          </div>

          {/* Search Box */}
          <div className="knowledge-search-wrap">
            <Search size={14} color="var(--text-muted)" className="knowledge-search-icon" />
            <input
              type="text"
              placeholder="Search knowledge..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="knowledge-search-input"
            />
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className={`knowledge-main-grid ${activeItem ? 'with-preview' : 'no-preview'}`}>
        <div className="knowledge-left-pane">
          {currentFolder && (
            <button
              onClick={() => handleNavigateBreadcrumb(breadcrumbs.length - 2)}
              className="btn btn-ghost btn-sm knowledge-btn-back"
            >
              <ArrowLeft size={14} /> Back
            </button>
          )}

          {/* Empty State */}
          {currentItems.length === 0 ? (
            <div className="knowledge-empty-card card">
              <Folder size={36} color="var(--primary-color)" className="knowledge-empty-icon" />
              <h3 className="knowledge-empty-title">
                Folder is empty
              </h3>
              <p className="knowledge-empty-desc">
                Get started by creating a folder, lesson, or structured table.
              </p>
              <div className="flex flex-wrap gap-2 justify-center">
                <button
                  type="button"
                  className="btn btn-primary btn-sm"
                  onClick={() => setModalMode('folder')}
                >
                  <Plus size={14} /> New Folder
                </button>
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={() => setModalMode('lesson')}
                >
                  <BookOpen size={14} /> New Lesson
                </button>
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={() => setModalMode('table')}
                >
                  <TableIcon size={14} /> New Table
                </button>
              </div>
            </div>
          ) : viewMode === 'pc-grid' ? (
            /* ========================================================================= */
            /* VIEW 1: PC EXPLORER TILES (Short icon with filename underneath)           */
            /* ========================================================================= */
            <div className="knowledge-pc-grid">
              {currentItems.map((item) => {
                const isFolder = item.type === 'folder';
                const isTable = item.type === 'table';
                const isLesson = item.type === 'lesson';
                const isSelected = activeItem?.id === item.id;

                return (
                  <div
                    key={item.id}
                    onClick={() => {
                      if (isFolder) {
                        handleOpenFolder(item);
                      } else {
                        setActiveItem(item);
                      }
                    }}
                    className={`knowledge-pc-tile ${isSelected ? 'is-selected' : ''} ${item.isPinned ? 'is-pinned' : ''}`}
                  >
                    {/* Pin Badge / Button */}
                    <button
                      onClick={(e) => handleTogglePin(item, e)}
                      title={item.isPinned ? 'Pinned to top' : 'Click to pin'}
                      className="knowledge-tile-pin-btn"
                      style={{
                        color: item.isPinned ? '#F59E0B' : 'var(--text-muted)',
                        opacity: item.isPinned ? 1 : 0.4,
                      }}
                    >
                      <Pin size={12} fill={item.isPinned ? '#F59E0B' : 'none'} />
                    </button>

                    {/* Icon Container (Folder, Document, Spreadsheet) */}
                    <div className={`knowledge-tile-icon-box ${item.type}`}>
                      {isFolder ? (
                        <Folder size={26} color="#F59E0B" fill="#F59E0B" fillOpacity={0.25} />
                      ) : isTable ? (
                        <TableIcon size={24} color="#10B981" />
                      ) : (
                        <FileText size={24} color="#3B82F6" />
                      )}
                    </div>

                    {/* File / Folder Name Underneath */}
                    <div title={item.title} className="knowledge-tile-name">
                      {item.title}
                    </div>

                    {/* Mini Type Tag */}
                    <span className="knowledge-tile-type-tag">
                      {isFolder ? 'Folder' : isTable ? 'Table' : 'Lesson'}
                    </span>
                  </div>
                );
              })}
            </div>
          ) : viewMode === 'chain' ? (
            /* ========================================================================= */
            /* VIEW 2: LESSON CHAIN VIEW (Props ➔ State ➔ Hooks Flow)                    */
            /* ========================================================================= */
            <div className="knowledge-chain-container">
              <div className="text-xs text-secondary font-semibold">
                🔗 Sequential Chain View: lessons linked together in ordered curriculum flow.
              </div>

              {chainSequence.map((chain, chainIdx) => (
                <div key={chainIdx} className="knowledge-chain-card">
                  <div className="knowledge-chain-heading">
                    Chain Sequence #{chainIdx + 1} ({chain.length} linked {chain.length === 1 ? 'lesson' : 'lessons'})
                  </div>

                  <div className="knowledge-chain-nodes">
                    {chain.map((lesson, idx) => (
                      <React.Fragment key={lesson.id}>
                        <div
                          onClick={() => setActiveItem(lesson)}
                          className={`knowledge-chain-node ${activeItem?.id === lesson.id ? 'is-active' : ''}`}
                        >
                          <FileText size={15} color="#3B82F6" />
                          <span className="text-xs font-bold text-primary">
                            {lesson.title}
                          </span>
                        </div>

                        {idx < chain.length - 1 && (
                          <div className="flex items-center text-emerald-500">
                            <ArrowRight size={18} strokeWidth={2.5} />
                          </div>
                        )}
                      </React.Fragment>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            /* ========================================================================= */
            /* VIEW 3: DETAILED CARDS VIEW                                               */
            /* ========================================================================= */
            <div
              className="knowledge-cards-list"
              style={{
                gridTemplateColumns: activeItem ? '1fr' : 'repeat(auto-fill, minmax(280px, 1fr))',
              }}
            >
              {currentItems.map((item) => {
                const isFolder = item.type === 'folder';
                const isTable = item.type === 'table';
                const isLesson = item.type === 'lesson';
                const isSelected = activeItem?.id === item.id;

                return (
                  <div
                    key={item.id}
                    onClick={() => {
                      if (isFolder) {
                        handleOpenFolder(item);
                      } else {
                        setActiveItem(item);
                      }
                    }}
                    className={`knowledge-item-card card ${isSelected ? 'is-selected' : ''} ${item.isPinned ? 'is-pinned' : ''}`}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <div
                        className="knowledge-card-avatar"
                        style={{
                          background: isFolder
                            ? 'rgba(245, 158, 11, 0.15)'
                            : isTable
                            ? 'rgba(16, 185, 129, 0.15)'
                            : 'rgba(59, 130, 246, 0.15)',
                        }}
                      >
                        {isFolder ? <Folder size={18} color="#F59E0B" /> : isTable ? <TableIcon size={18} color="#10B981" /> : <FileText size={18} color="#3B82F6" />}
                      </div>
                      <div className="min-w-0">
                        <div className="text-sm font-extrabold text-primary truncate">
                          {item.title}
                        </div>
                        <div className="text-xs text-secondary mt-0.5">
                          {isFolder ? 'Folder' : isTable ? 'Data Table' : 'Text Lesson'}
                          {item.tags && ` • ${item.tags}`}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={(e) => handleTogglePin(item, e)}
                        title={item.isPinned ? 'Unpin' : 'Pin to top'}
                        className="btn-icon p-1"
                        style={{
                          color: item.isPinned ? '#F59E0B' : 'var(--text-muted)',
                        }}
                      >
                        <Pin size={13} fill={item.isPinned ? '#F59E0B' : 'none'} />
                      </button>
                      <button
                        onClick={(e) => handleDeleteItem(item.id, e)}
                        title="Delete item"
                        className="btn-icon p-1 text-red-500 opacity-60 hover:opacity-100"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Right: Active Item Viewer (Lesson or Table) */}
        {activeItem && (
          <div className="knowledge-preview-pane card">
            <div className="knowledge-preview-header">
              <div>
                <span className={`knowledge-preview-type-badge ${activeItem.type}`}>
                  {activeItem.type === 'table' ? 'Structured Data Table' : 'Knowledge Lesson'}
                </span>
                <h2 className="m-0 text-base font-extrabold text-primary mt-1">
                  {activeItem.title}
                </h2>
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => handleTogglePin(activeItem)}
                  className="btn btn-ghost btn-sm"
                  style={{ color: activeItem.isPinned ? '#F59E0B' : 'var(--text-secondary)' }}
                >
                  <Pin size={14} fill={activeItem.isPinned ? '#F59E0B' : 'none'} />
                </button>
                <button onClick={() => setActiveItem(null)} className="btn btn-ghost btn-sm">
                  Close
                </button>
              </div>
            </div>

            {/* Optional Lesson Chaining Selector */}
            {activeItem.type === 'lesson' && (
              <div className="knowledge-chain-picker">
                <LinkIcon size={14} color="#10B981" />
                <span className="text-xs font-bold text-secondary">
                  Chain to next lesson:
                </span>
                <select
                  value={activeItem.nextLessonId || ''}
                  onChange={(e) => handleSetNextLesson(activeItem.id, e.target.value)}
                  className="form-input text-xs py-1 px-2"
                >
                  <option value="">(None - End of chain)</option>
                  {lessonsInFolder
                    .filter((l) => l.id !== activeItem.id)
                    .map((l) => (
                      <option key={l.id} value={l.id}>
                        {l.title}
                      </option>
                    ))}
                </select>
              </div>
            )}

            {/* Content Display */}
            {activeItem.type === 'table' ? (
              renderTableContent(activeItem.content)
            ) : (
              <div className="knowledge-lesson-notes-content">
                {activeItem.content || 'No content notes written for this lesson.'}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Creation Modal */}
      {modalMode && (
        <div
          className="modal-overlay"
          onClick={() => setModalMode(null)}
        >
          <div
            className="card p-6 w-full max-h-[90vh] overflow-y-auto"
            style={{
              maxWidth: modalMode === 'table' ? '650px' : '520px',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="m-0 mb-4 text-lg font-extrabold text-primary flex items-center gap-2">
              {modalMode === 'folder' ? (
                <>
                  <Folder size={20} color="#F59E0B" /> Create Folder
                </>
              ) : modalMode === 'table' ? (
                <>
                  <TableIcon size={20} color="#10B981" /> Create Table or Upload CSV/Excel
                </>
              ) : (
                <>
                  <FileText size={20} color="#3B82F6" /> Create Lesson
                </>
              )}
            </h2>

            <form onSubmit={handleCreateItem} className="flex flex-col gap-3">
              <div>
                <label className="block text-xs font-bold text-secondary mb-1">
                  {modalMode === 'folder' ? 'Folder Name *' : modalMode === 'table' ? 'Table Name *' : 'Lesson Title *'}
                </label>
                <input
                  type="text"
                  required
                  placeholder={
                    modalMode === 'folder'
                      ? 'Folder Name'
                      : modalMode === 'table'
                      ? 'Table Name'
                      : 'Lesson Title'
                  }
                  value={createTitle}
                  onChange={(e) => setCreateTitle(e.target.value)}
                  className="form-input"
                />
              </div>

              {modalMode === 'lesson' && (
                <>
                  <div>
                    <label className="block text-xs font-bold text-secondary mb-1">
                      Lesson Content / Notes *
                    </label>
                    <textarea
                      rows={6}
                      required
                      placeholder="Lesson content"
                      value={createContent}
                      onChange={(e) => setCreateContent(e.target.value)}
                      className="form-textarea"
                    />
                  </div>

                  {/* Optional Lesson Chaining */}
                  {lessonsInFolder.length > 0 && (
                    <div>
                      <label className="block text-xs font-bold text-secondary mb-1">
                        Chain to Next Lesson (Optional)
                      </label>
                      <select
                        value={createNextLessonId}
                        onChange={(e) => setCreateNextLessonId(e.target.value)}
                        className="form-input"
                      >
                        <option value="">(None - Not chained)</option>
                        {lessonsInFolder.map((l) => (
                          <option key={l.id} value={l.id}>
                            {l.title}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}
                </>
              )}

              {modalMode === 'table' && (
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-xs font-bold text-secondary">
                      Table Preview & Columns
                    </label>
                    <label className="btn btn-ghost btn-sm cursor-pointer inline-flex items-center gap-1">
                      <Upload size={13} /> Import CSV/Excel
                      <input type="file" accept=".csv,.txt" onChange={handleFileUpload} className="hidden" />
                    </label>
                  </div>
                  {renderTableContent(tableData)}
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-secondary mb-1">
                  Tags
                </label>
                <input
                  type="text"
                  placeholder="Tags (comma-separated)"
                  value={createTags}
                  onChange={(e) => setCreateTags(e.target.value)}
                  className="form-input"
                />
              </div>

              <div className="flex items-center gap-2 mt-1">
                <input
                  type="checkbox"
                  id="pinCheckbox"
                  checked={createIsPinned}
                  onChange={(e) => setCreateIsPinned(e.target.checked)}
                />
                <label htmlFor="pinCheckbox" className="text-xs font-semibold text-primary cursor-pointer">
                  Pin this item to top of folder
                </label>
              </div>

              <div className="flex justify-end gap-2 mt-3">
                <button type="button" className="btn btn-ghost" onClick={() => setModalMode(null)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={submitting || !createTitle.trim()}>
                  {submitting ? 'Creating...' : 'Create in DB'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
export default KnowledgePage;
