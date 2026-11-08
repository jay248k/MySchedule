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
    } else {
      const target = breadcrumbs[index];
      setCurrentFolder(target);
      setBreadcrumbs((prev) => prev.slice(0, index + 1));
    }
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
      showToast({
        type: 'success',
        title: nextPin ? 'Pinned to Top' : 'Unpinned',
        message: nextPin ? `"${item.title}" is now pinned.` : `"${item.title}" unpinned.`,
      });
    } catch (err) {
      showToast({ type: 'danger', title: 'Error', message: 'Could not update pin status.' });
    }
  };

  const handleSetNextLesson = async (currentLessonId, nextId) => {
    try {
      await api.updateKnowledgeItem(currentLessonId, { nextLessonId: nextId || null });
      setItems((prev) =>
        prev.map((it) => (it.id === currentLessonId ? { ...it, nextLessonId: nextId || null } : it))
      );
      showToast({
        type: 'success',
        title: 'Lesson Chain Updated',
        message: 'Chain link saved in database.',
      });
    } catch (err) {
      showToast({ type: 'danger', title: 'Error', message: 'Could not update chain link.' });
    }
  };

  const handleCreateItem = async (e) => {
    e.preventDefault();
    if (!createTitle.trim()) return;

    try {
      setSubmitting(true);
      let contentToSave = createContent;
      if (modalMode === 'table') {
        contentToSave = JSON.stringify(tableData);
      }

      const payload = {
        title: createTitle.trim(),
        type: modalMode,
        parentId: currentFolder ? currentFolder.id : null,
        content: contentToSave,
        tags: createTags.trim() || null,
        isPinned: createIsPinned,
        nextLessonId: modalMode === 'lesson' && createNextLessonId ? createNextLessonId : null,
        icon: modalMode === 'folder' ? 'Folder' : modalMode === 'table' ? 'Table' : 'FileText',
      };

      const res = await api.createKnowledgeItem(payload);
      if (res?.data) {
        setItems((prev) => [...prev, res.data]);
        showToast({
          type: 'success',
          title: 'Created Successfully',
          message: `${modalMode.toUpperCase()} saved to knowledge base.`,
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
        title: 'Error',
        message: err.message || 'Failed to create item.',
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteItem = async (id, e) => {
    if (e) e.stopPropagation();
    try {
      await api.deleteKnowledgeItem(id);
      setItems((prev) => prev.filter((it) => it.id !== id && it.parentId !== id));
      if (activeItem?.id === id) setActiveItem(null);
      showToast({
        type: 'info',
        title: 'Deleted',
        message: 'Item removed from database.',
      });
    } catch (err) {
      showToast({
        type: 'danger',
        title: 'Error',
        message: 'Could not delete item.',
      });
    }
  };

  // Excel/CSV Table upload parser
  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result;
      if (typeof text === 'string') {
        const lines = text.split(/\r?\n/).filter((l) => l.trim().length > 0);
        if (lines.length > 0) {
          const headers = lines[0].split(',').map((h) => h.replace(/^["']|["']$/g, '').trim());
          const rows = lines.slice(1).map((line) => {
            return line.split(',').map((cell) => cell.replace(/^["']|["']$/g, '').trim());
          });
          setTableData({ headers, rows });
          if (!createTitle) {
            setCreateTitle(file.name.replace(/\.[^/.]+$/, ''));
          }
        }
      }
    };
    reader.readAsText(file);
  };

  // Render Table Viewer
  const renderTableContent = (tData) => {
    try {
      const parsed = typeof tData === 'string' ? JSON.parse(tData) : tData;
      const headers = parsed.headers || [];
      const rows = parsed.rows || [];

      return (
        <div style={{ overflowX: 'auto', borderRadius: '10px', border: '1px solid var(--border-color)' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.84rem' }}>
            <thead>
              <tr style={{ background: 'var(--page-bg)', borderBottom: '2px solid var(--border-color)' }}>
                <th style={{ padding: '10px 14px', width: '50px', fontWeight: 800, color: 'var(--text-muted)' }}>#</th>
                {headers.map((h, i) => (
                  <th key={i} style={{ padding: '10px 14px', fontWeight: 800, color: 'var(--text-primary)' }}>
                    {h}
                  </th>
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
                  <td style={{ padding: '10px 14px', color: 'var(--text-muted)', fontWeight: 700 }}>
                    {rIdx + 1}
                  </td>
                  {row.map((cell, cIdx) => (
                    <td key={cIdx} style={{ padding: '10px 14px', color: 'var(--text-primary)' }}>
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
    <div style={{ maxWidth: '1240px', margin: '0 auto', padding: '20px 16px' }}>
      {/* Banner */}
      <div
        className="card"
        style={{
          background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.12) 0%, rgba(37, 99, 235, 0.08) 100%)',
          border: '1.5px solid rgba(16, 185, 129, 0.25)',
          borderRadius: '16px',
          padding: '20px 24px',
          marginBottom: '16px',
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '16px',
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
            <span
              style={{
                background: 'rgba(16, 185, 129, 0.2)',
                color: '#10B981',
                padding: '2px 8px',
                borderRadius: '6px',
                fontSize: '0.72rem',
                fontWeight: 800,
                textTransform: 'uppercase',
              }}
            >
              Lessons & Knowledge Management
            </span>
          </div>
          <h1 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <BookOpen size={22} color="#10B981" /> Knowledge Base & Lessons
          </h1>
          <p style={{ margin: '4px 0 0', fontSize: '0.86rem', color: 'var(--text-secondary)' }}>
            Explorer folder view, sequential lesson chaining, text notes, and Excel tables.
          </p>
        </div>

        {/* Action Buttons */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
          <button
            onClick={() => {
              setModalMode('folder');
              setCreateTitle('');
              setCreateContent('');
              setCreateTags('');
              setCreateIsPinned(false);
            }}
            className="btn btn-ghost"
            style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'var(--card-bg)', border: '1px solid var(--border-color)', fontSize: '0.82rem' }}
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
            className="btn btn-ghost"
            style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'var(--card-bg)', border: '1px solid var(--border-color)', fontSize: '0.82rem' }}
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
            className="btn btn-primary"
            style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.82rem' }}
          >
            <TableIcon size={15} /> New Table / Excel
          </button>
        </div>
      </div>

      {/* Navigation Breadcrumbs, View Switcher & Search Bar */}
      <div
        className="card"
        style={{
          background: 'var(--card-bg)',
          border: '1px solid var(--border-color)',
          borderRadius: '12px',
          padding: '10px 16px',
          marginBottom: '16px',
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '12px',
        }}
      >
        {/* Breadcrumb Path */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
          <button
            onClick={() => handleNavigateBreadcrumb(-1)}
            style={{
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              color: breadcrumbs.length === 0 ? 'var(--primary-color)' : 'var(--text-secondary)',
              fontWeight: 800,
              fontSize: '0.86rem',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
            }}
          >
            <Layers size={14} /> Root Base
          </button>
          {breadcrumbs.map((b, idx) => (
            <React.Fragment key={b.id}>
              <ChevronRight size={14} color="var(--text-muted)" />
              <button
                onClick={() => handleNavigateBreadcrumb(idx)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                  color: idx === breadcrumbs.length - 1 ? 'var(--primary-color)' : 'var(--text-secondary)',
                  fontWeight: 800,
                  fontSize: '0.86rem',
                }}
              >
                {b.title}
              </button>
            </React.Fragment>
          ))}
        </div>

        {/* View Mode Switcher: PC Grid / Detailed Cards / Chain View */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', background: 'var(--page-bg)', borderRadius: '8px', padding: '3px', border: '1px solid var(--border-color)' }}>
            <button
              onClick={() => setViewMode('pc-grid')}
              title="PC Desktop & Folder Explorer View"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '5px',
                padding: '4px 10px',
                borderRadius: '6px',
                border: 'none',
                background: viewMode === 'pc-grid' ? 'var(--primary-color)' : 'transparent',
                color: viewMode === 'pc-grid' ? '#FFFFFF' : 'var(--text-secondary)',
                fontSize: '0.78rem',
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              <LayoutGrid size={13} /> PC Explorer
            </button>
            <button
              onClick={() => setViewMode('cards')}
              title="Detailed Card List View"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '5px',
                padding: '4px 10px',
                borderRadius: '6px',
                border: 'none',
                background: viewMode === 'cards' ? 'var(--primary-color)' : 'transparent',
                color: viewMode === 'cards' ? '#FFFFFF' : 'var(--text-secondary)',
                fontSize: '0.78rem',
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              <List size={13} /> Cards
            </button>
            <button
              onClick={() => setViewMode('chain')}
              title="Sequential Lesson Chain View"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '5px',
                padding: '4px 10px',
                borderRadius: '6px',
                border: 'none',
                background: viewMode === 'chain' ? 'var(--primary-color)' : 'transparent',
                color: viewMode === 'chain' ? '#FFFFFF' : 'var(--text-secondary)',
                fontSize: '0.78rem',
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              <GitBranch size={13} /> Chain View
            </button>
          </div>

          {/* Search Box */}
          <div style={{ position: 'relative', width: '220px' }}>
            <Search size={14} color="var(--text-muted)" style={{ position: 'absolute', left: '10px', top: '9px' }} />
            <input
              type="text"
              placeholder="Search knowledge..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                width: '100%',
                padding: '6px 10px 6px 30px',
                borderRadius: '8px',
                border: '1px solid var(--border-color)',
                background: 'var(--page-bg)',
                color: 'var(--text-primary)',
                fontSize: '0.82rem',
                outline: 'none',
                boxSizing: 'border-box',
              }}
            />
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div style={{ display: 'grid', gridTemplateColumns: activeItem ? '1fr 1.3fr' : '1fr', gap: '16px' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {currentFolder && (
            <button
              onClick={() => handleNavigateBreadcrumb(breadcrumbs.length - 2)}
              className="btn btn-ghost btn-sm"
              style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', alignSelf: 'flex-start', fontSize: '0.8rem' }}
            >
              <ArrowLeft size={14} /> Back
            </button>
          )}

          {/* Empty State */}
          {currentItems.length === 0 ? (
            <div
              className="card"
              style={{
                background: 'var(--card-bg)',
                border: '1px dashed var(--border-color)',
                borderRadius: '14px',
                padding: '40px 20px',
                textAlign: 'center',
              }}
            >
              <Folder size={36} color="var(--primary-color)" style={{ margin: '0 auto 10px', opacity: 0.4 }} />
              <h3 style={{ margin: '0 0 6px', color: 'var(--text-primary)', fontSize: '1rem' }}>
                Folder is empty
              </h3>
              <p style={{ margin: '0 0 16px', fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                Get started by creating a folder, lesson, or structured table.
              </p>
              <div style={{ display: 'inline-flex', flexWrap: 'wrap', gap: '8px', justifyContent: 'center' }}>
                <button
                  type="button"
                  className="btn-primary"
                  onClick={() => setModalMode('folder')}
                  style={{
                    padding: '8px 14px',
                    fontSize: '0.8rem',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    borderRadius: '8px',
                  }}
                >
                  <Plus size={14} /> New Folder
                </button>
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => setModalMode('lesson')}
                  style={{
                    padding: '8px 14px',
                    fontSize: '0.8rem',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    borderRadius: '8px',
                  }}
                >
                  <BookOpen size={14} /> New Lesson
                </button>
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => setModalMode('table')}
                  style={{
                    padding: '8px 14px',
                    fontSize: '0.8rem',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    borderRadius: '8px',
                  }}
                >
                  <TableIcon size={14} /> New Table
                </button>
              </div>
            </div>
          ) : viewMode === 'pc-grid' ? (
            /* ========================================================================= */
            /* VIEW 1: PC EXPLORER TILES (Short icon with filename underneath)           */
            /* ========================================================================= */
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(110px, 1fr))',
                gap: '12px',
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
                    style={{
                      background: isSelected
                        ? 'rgba(37, 99, 235, 0.15)'
                        : 'var(--card-bg)',
                      border: isSelected
                        ? '1.5px solid var(--primary-color)'
                        : item.isPinned
                        ? '1.5px solid rgba(245, 158, 11, 0.5)'
                        : '1px solid var(--border-color)',
                      borderRadius: '12px',
                      padding: '12px 8px 10px',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      textAlign: 'center',
                      cursor: 'pointer',
                      position: 'relative',
                      transition: 'all 0.15s ease',
                      boxShadow: 'var(--shadow-sm)',
                    }}
                  >
                    {/* Pin Badge / Button */}
                    <button
                      onClick={(e) => handleTogglePin(item, e)}
                      title={item.isPinned ? 'Pinned to top' : 'Click to pin'}
                      style={{
                        position: 'absolute',
                        top: '5px',
                        right: '5px',
                        background: 'transparent',
                        border: 'none',
                        cursor: 'pointer',
                        padding: '2px',
                        color: item.isPinned ? '#F59E0B' : 'var(--text-muted)',
                        opacity: item.isPinned ? 1 : 0.4,
                      }}
                    >
                      <Pin size={12} fill={item.isPinned ? '#F59E0B' : 'none'} />
                    </button>

                    {/* Icon Container (Folder, Document, Spreadsheet) */}
                    <div
                      style={{
                        width: '46px',
                        height: '46px',
                        borderRadius: '12px',
                        background: isFolder
                          ? 'linear-gradient(135deg, rgba(245, 158, 11, 0.22) 0%, rgba(217, 119, 6, 0.12) 100%)'
                          : isTable
                          ? 'linear-gradient(135deg, rgba(16, 185, 129, 0.22) 0%, rgba(5, 150, 105, 0.12) 100%)'
                          : 'linear-gradient(135deg, rgba(59, 130, 246, 0.22) 0%, rgba(37, 99, 235, 0.12) 100%)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        marginBottom: '8px',
                      }}
                    >
                      {isFolder ? (
                        <Folder size={26} color="#F59E0B" fill="#F59E0B" fillOpacity={0.25} />
                      ) : isTable ? (
                        <TableIcon size={24} color="#10B981" />
                      ) : (
                        <FileText size={24} color="#3B82F6" />
                      )}
                    </div>

                    {/* File / Folder Name Underneath */}
                    <div
                      title={item.title}
                      style={{
                        fontSize: '0.8rem',
                        fontWeight: 700,
                        color: 'var(--text-primary)',
                        lineHeight: '1.2',
                        maxHeight: '2.4em',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                        wordBreak: 'break-word',
                      }}
                    >
                      {item.title}
                    </div>

                    {/* Mini Type Tag */}
                    <span style={{ fontSize: '0.68rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
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
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 600 }}>
                🔗 Sequential Chain View: lessons linked together in ordered curriculum flow.
              </div>

              {chainSequence.map((chain, chainIdx) => (
                <div
                  key={chainIdx}
                  style={{
                    background: 'var(--card-bg)',
                    border: '1px solid var(--border-color)',
                    borderRadius: '12px',
                    padding: '16px',
                  }}
                >
                  <div style={{ fontSize: '0.74rem', fontWeight: 800, color: 'var(--primary-color)', textTransform: 'uppercase', marginBottom: '10px' }}>
                    Chain Sequence #{chainIdx + 1} ({chain.length} linked {chain.length === 1 ? 'lesson' : 'lessons'})
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                    {chain.map((lesson, idx) => (
                      <React.Fragment key={lesson.id}>
                        <div
                          onClick={() => setActiveItem(lesson)}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            background: activeItem?.id === lesson.id ? 'rgba(37, 99, 235, 0.2)' : 'var(--page-bg)',
                            border: activeItem?.id === lesson.id ? '1.5px solid var(--primary-color)' : '1px solid var(--border-color)',
                            borderRadius: '8px',
                            padding: '8px 12px',
                            cursor: 'pointer',
                          }}
                        >
                          <FileText size={15} color="#3B82F6" />
                          <span style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                            {lesson.title}
                          </span>
                        </div>

                        {idx < chain.length - 1 && (
                          <div style={{ display: 'flex', alignItems: 'center', color: '#10B981' }}>
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
              style={{
                display: 'grid',
                gridTemplateColumns: activeItem ? '1fr' : 'repeat(auto-fill, minmax(280px, 1fr))',
                gap: '12px',
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
                    className="card"
                    style={{
                      background: isSelected ? 'rgba(37, 99, 235, 0.08)' : 'var(--card-bg)',
                      border: isSelected
                        ? '1.5px solid var(--primary-color)'
                        : item.isPinned
                        ? '1.5px solid rgba(245, 158, 11, 0.5)'
                        : '1px solid var(--border-color)',
                      borderRadius: '12px',
                      padding: '12px 14px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: '10px',
                      boxShadow: 'var(--shadow-sm)',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0 }}>
                      <div
                        style={{
                          width: '36px',
                          height: '36px',
                          borderRadius: '8px',
                          background: isFolder
                            ? 'rgba(245, 158, 11, 0.15)'
                            : isTable
                            ? 'rgba(16, 185, 129, 0.15)'
                            : 'rgba(59, 130, 246, 0.15)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          flexShrink: 0,
                        }}
                      >
                        {isFolder ? <Folder size={18} color="#F59E0B" /> : isTable ? <TableIcon size={18} color="#10B981" /> : <FileText size={18} color="#3B82F6" />}
                      </div>
                      <div style={{ minWidth: 0 }}>
                        <div style={{ fontSize: '0.88rem', fontWeight: 800, color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {item.title}
                        </div>
                        <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
                          {isFolder ? 'Folder' : isTable ? 'Data Table' : 'Text Lesson'}
                          {item.tags && ` • ${item.tags}`}
                        </div>
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <button
                        onClick={(e) => handleTogglePin(item, e)}
                        title={item.isPinned ? 'Unpin' : 'Pin to top'}
                        style={{
                          background: 'transparent',
                          border: 'none',
                          cursor: 'pointer',
                          color: item.isPinned ? '#F59E0B' : 'var(--text-muted)',
                          padding: '4px',
                        }}
                      >
                        <Pin size={13} fill={item.isPinned ? '#F59E0B' : 'none'} />
                      </button>
                      <button
                        onClick={(e) => handleDeleteItem(item.id, e)}
                        title="Delete item"
                        style={{
                          background: 'transparent',
                          border: 'none',
                          cursor: 'pointer',
                          color: '#EF4444',
                          opacity: 0.6,
                          padding: '4px',
                        }}
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
          <div
            className="card"
            style={{
              background: 'var(--card-bg)',
              border: '1.5px solid var(--border-color)',
              borderRadius: '14px',
              padding: '20px',
              boxShadow: 'var(--shadow-md)',
              display: 'flex',
              flexDirection: 'column',
              gap: '14px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--border-color)', paddingBottom: '12px' }}>
              <div>
                <span
                  style={{
                    fontSize: '0.7rem',
                    fontWeight: 800,
                    textTransform: 'uppercase',
                    color: activeItem.type === 'table' ? '#10B981' : '#3B82F6',
                  }}
                >
                  {activeItem.type === 'table' ? 'Structured Data Table' : 'Knowledge Lesson'}
                </span>
                <h2 style={{ margin: '4px 0 0', fontSize: '1.15rem', color: 'var(--text-primary)' }}>
                  {activeItem.title}
                </h2>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
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
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  background: 'var(--page-bg)',
                  padding: '8px 12px',
                  borderRadius: '8px',
                  border: '1px solid var(--border-color)',
                  flexWrap: 'wrap',
                }}
              >
                <LinkIcon size={14} color="#10B981" />
                <span style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-secondary)' }}>
                  Chain to next lesson:
                </span>
                <select
                  value={activeItem.nextLessonId || ''}
                  onChange={(e) => handleSetNextLesson(activeItem.id, e.target.value)}
                  style={{
                    padding: '4px 8px',
                    borderRadius: '6px',
                    border: '1px solid var(--border-color)',
                    background: 'var(--card-bg)',
                    color: 'var(--text-primary)',
                    fontSize: '0.8rem',
                    outline: 'none',
                  }}
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
              <div
                style={{
                  fontSize: '0.9rem',
                  lineHeight: '1.65',
                  color: 'var(--text-primary)',
                  whiteSpace: 'pre-wrap',
                  background: 'var(--page-bg)',
                  padding: '16px',
                  borderRadius: '10px',
                  border: '1px solid var(--border-color)',
                  maxHeight: '450px',
                  overflowY: 'auto',
                }}
              >
                {activeItem.content || 'No content notes written for this lesson.'}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Creation Modal */}
      {modalMode && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.65)',
            zIndex: 1000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '16px',
          }}
          onClick={() => setModalMode(null)}
        >
          <div
            className="card"
            style={{
              background: 'var(--card-bg)',
              border: '1px solid var(--border-color)',
              borderRadius: '16px',
              padding: '24px',
              width: '100%',
              maxWidth: modalMode === 'table' ? '650px' : '520px',
              boxShadow: 'var(--shadow-lg)',
              maxHeight: '90vh',
              overflowY: 'auto',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h2 style={{ margin: '0 0 16px', fontSize: '1.25rem', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
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

            <form onSubmit={handleCreateItem} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '6px' }}>
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
                  style={{
                    width: '100%',
                    padding: '8px 10px',
                    borderRadius: '8px',
                    border: '1px solid var(--border-color)',
                    background: 'var(--page-bg)',
                    color: 'var(--text-primary)',
                    fontSize: '0.88rem',
                    outline: 'none',
                    boxSizing: 'border-box',
                  }}
                />
              </div>

              {modalMode === 'lesson' && (
                <>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '6px' }}>
                      Lesson Content / Notes *
                    </label>
                    <textarea
                      rows={6}
                      required
                      placeholder="Lesson content"
                      value={createContent}
                      onChange={(e) => setCreateContent(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '10px',
                        borderRadius: '8px',
                        border: '1px solid var(--border-color)',
                        background: 'var(--page-bg)',
                        color: 'var(--text-primary)',
                        fontSize: '0.88rem',
                        outline: 'none',
                        resize: 'vertical',
                        boxSizing: 'border-box',
                      }}
                    />
                  </div>

                  {/* Optional Lesson Chaining */}
                  {lessonsInFolder.length > 0 && (
                    <div>
                      <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '6px' }}>
                        Chain to Next Lesson (Optional)
                      </label>
                      <select
                        value={createNextLessonId}
                        onChange={(e) => setCreateNextLessonId(e.target.value)}
                        style={{
                          width: '100%',
                          padding: '8px 10px',
                          borderRadius: '8px',
                          border: '1px solid var(--border-color)',
                          background: 'var(--page-bg)',
                          color: 'var(--text-primary)',
                          fontSize: '0.85rem',
                          outline: 'none',
                          boxSizing: 'border-box',
                        }}
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
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <label style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-secondary)' }}>
                      Table Preview & Columns
                    </label>
                    <label
                      className="btn btn-ghost btn-sm"
                      style={{ cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '5px' }}
                    >
                      <Upload size={13} /> Import CSV/Excel
                      <input type="file" accept=".csv,.txt" onChange={handleFileUpload} style={{ display: 'none' }} />
                    </label>
                  </div>
                  {renderTableContent(tableData)}
                </div>
              )}

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '6px' }}>
                  Tags
                </label>
                <input
                  type="text"
                  placeholder="Tags (comma-separated)"
                  value={createTags}
                  onChange={(e) => setCreateTags(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '8px 10px',
                    borderRadius: '8px',
                    border: '1px solid var(--border-color)',
                    background: 'var(--page-bg)',
                    color: 'var(--text-primary)',
                    fontSize: '0.85rem',
                    outline: 'none',
                    boxSizing: 'border-box',
                  }}
                />
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px' }}>
                <input
                  type="checkbox"
                  id="pinCheckbox"
                  checked={createIsPinned}
                  onChange={(e) => setCreateIsPinned(e.target.checked)}
                />
                <label htmlFor="pinCheckbox" style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-primary)', cursor: 'pointer' }}>
                  Pin this item to top of folder
                </label>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '12px' }}>
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
