import React, { useState, useEffect, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
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
  X,
  MoreVertical,
} from 'lucide-react';
import { api } from '../services/api';
import { useApp } from '../context/AppContext';
import '../styles/pages/knowledge.css';

export function KnowledgePage() {
  const { showToast } = useApp();
  const [searchParams] = useSearchParams();
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

  // Edit Modal State
  const [editModalItem, setEditModalItem] = useState(null); // item object being edited
  const [editTitle, setEditTitle] = useState('');
  const [editContent, setEditContent] = useState('');
  const [editTags, setEditTags] = useState('');
  const [editIsPinned, setEditIsPinned] = useState(false);
  const [editNextLessonId, setEditNextLessonId] = useState('');
  const [editTableData, setEditTableData] = useState({ headers: ['Column 1'], rows: [['']] });
  const [editSubmitting, setEditSubmitting] = useState(false);

  // 3-Dots Action Dropdown Menu State
  const [menuOpenId, setMenuOpenId] = useState(null);

  useEffect(() => {
    const handleDocClick = () => setMenuOpenId(null);
    if (menuOpenId) {
      document.addEventListener('click', handleDocClick);
      return () => document.removeEventListener('click', handleDocClick);
    }
  }, [menuOpenId]);

  const fetchItems = async () => {
    try {
      setLoading(true);
      const res = await api.getKnowledgeItems();
      const itemsList = Array.isArray(res) ? res : Array.isArray(res?.data) ? res.data : [];
      setItems(itemsList);
    } catch (err) {
      console.warn('Failed to load knowledge items:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchItems();
  }, []);

  // Deep linking from Global Search (?folder=<id> or ?item=<id> / ?lesson=<id>)
  useEffect(() => {
    if (!items || items.length === 0) return;
    const folderId = searchParams.get('folder');
    const itemId = searchParams.get('item') || searchParams.get('lesson');

    if (folderId) {
      const folder = items.find((it) => String(it.id) === String(folderId));
      if (folder) {
        // Build breadcrumb trail back to root
        const trail = [folder];
        let curr = folder;
        while (curr.parentId) {
          const parent = items.find((it) => String(it.id) === String(curr.parentId));
          if (parent) {
            trail.unshift(parent);
            curr = parent;
          } else {
            break;
          }
        }
        setCurrentFolder(folder);
        setBreadcrumbs(trail);
        setActiveItem(null);
      }
    } else if (itemId) {
      const item = items.find((it) => String(it.id) === String(itemId));
      if (item) {
        if (item.type === 'folder') {
          const trail = [item];
          let curr = item;
          while (curr.parentId) {
            const parent = items.find((it) => String(it.id) === String(curr.parentId));
            if (parent) {
              trail.unshift(parent);
              curr = parent;
            } else {
              break;
            }
          }
          setCurrentFolder(item);
          setBreadcrumbs(trail);
          setActiveItem(null);
        } else {
          // If item is inside a folder, open that folder and select active item preview
          if (item.parentId) {
            const parent = items.find((it) => String(it.id) === String(item.parentId));
            if (parent) {
              const trail = [parent];
              let curr = parent;
              while (curr.parentId) {
                const p = items.find((it) => String(it.id) === String(curr.parentId));
                if (p) {
                  trail.unshift(p);
                  curr = p;
                } else {
                  break;
                }
              }
              setCurrentFolder(parent);
              setBreadcrumbs(trail);
            }
          } else {
            setCurrentFolder(null);
            setBreadcrumbs([]);
          }
          setActiveItem(item);
        }
      }
    }
  }, [items, searchParams]);

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

    const itemTitle = createTitle.trim();
    const itemType = modalMode;
    const tempId = `temp-know-${Date.now()}`;

    // Clean table data if creating table
    let formattedContent = createContent;
    if (itemType === 'table') {
      const cleanHeaders = tableData.headers.map((h, i) => (h && h.trim()) || `Col ${i + 1}`);
      const cleanRows = tableData.rows.map((row) =>
        cleanHeaders.map((_, cI) => (row[cI] !== undefined ? String(row[cI]) : ''))
      );
      formattedContent = JSON.stringify({ headers: cleanHeaders, rows: cleanRows });
    }

    const payload = {
      title: itemTitle,
      type: itemType,
      parentId: currentFolder ? currentFolder.id : null,
      content: formattedContent,
      tags: createTags.trim() || null,
      isPinned: Boolean(createIsPinned),
      nextLessonId: itemType === 'lesson' && createNextLessonId ? createNextLessonId : null,
    };

    // ⚡ Optimistic UI: Immediately display item in view without waiting for network roundtrip
    const optimisticItem = {
      id: tempId,
      ...payload,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    setItems((prev) => [optimisticItem, ...prev]);
    setModalMode(null);
    setCreateTitle('');
    setCreateContent('');
    setCreateTags('');
    setCreateIsPinned(false);
    setCreateNextLessonId('');

    showToast({
      type: 'success',
      title: 'Created Successfully',
      message: `${itemTitle} added.`,
    });

    try {
      setSubmitting(true);
      const res = await api.createKnowledgeItem(payload);
      const serverItem = res?.data || res;
      if (serverItem && serverItem.id) {
        setItems((prev) => prev.map((it) => (it.id === tempId ? serverItem : it)));
      }
    } catch (err) {
      // Rollback on failure
      setItems((prev) => prev.filter((it) => it.id !== tempId));
      showToast({
        type: 'danger',
        title: 'Creation Failed',
        message: err.message || 'Error saving item to database.',
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleOpenEditModal = (item) => {
    if (!item) return;
    setEditModalItem(item);
    setEditTitle(item.title || '');
    setEditTags(item.tags || '');
    setEditIsPinned(Boolean(item.isPinned));

    if (item.type === 'lesson') {
      setEditContent(item.content || '');
      setEditNextLessonId(item.nextLessonId || '');
    } else if (item.type === 'table') {
      try {
        const parsed = typeof item.content === 'string' ? JSON.parse(item.content) : item.content;
        if (parsed && Array.isArray(parsed.headers) && Array.isArray(parsed.rows)) {
          setEditTableData(parsed);
        } else {
          setEditTableData({ headers: ['Column 1'], rows: [['']] });
        }
      } catch {
        setEditTableData({ headers: ['Column 1'], rows: [['']] });
      }
    }
  };

  const handleSaveEdit = async (e) => {
    e.preventDefault();
    if (!editModalItem || !editTitle.trim()) return;

    const targetId = editModalItem.id;
    const targetType = editModalItem.type;
    const updatedTitle = editTitle.trim();

    let formattedContent = editContent;
    if (targetType === 'table') {
      const cleanHeaders = editTableData.headers.map((h, i) => (h && h.trim()) || `Col ${i + 1}`);
      const cleanRows = editTableData.rows.map((row) =>
        cleanHeaders.map((_, cI) => (row[cI] !== undefined ? String(row[cI]) : ''))
      );
      formattedContent = JSON.stringify({ headers: cleanHeaders, rows: cleanRows });
    }

    const payload = {
      title: updatedTitle,
      tags: editTags.trim() || null,
      isPinned: Boolean(editIsPinned),
      ...(targetType === 'lesson' && {
        content: formattedContent,
        nextLessonId: editNextLessonId || null,
      }),
      ...(targetType === 'table' && {
        content: formattedContent,
      }),
    };

    // ⚡ Optimistic UI update
    setItems((prev) =>
      prev.map((it) => (it.id === targetId ? { ...it, ...payload } : it))
    );
    if (activeItem?.id === targetId) {
      setActiveItem((prev) => ({ ...prev, ...payload }));
    }

    setEditModalItem(null);
    showToast({
      type: 'success',
      title: 'Changes Saved',
      message: `${updatedTitle} updated successfully.`,
    });

    try {
      setEditSubmitting(true);
      await api.updateKnowledgeItem(targetId, payload);
    } catch (err) {
      showToast({
        type: 'danger',
        title: 'Update Error',
        message: err.message || 'Failed to update item.',
      });
      fetchItems();
    } finally {
      setEditSubmitting(false);
    }
  };

  const handleDeleteItem = async (id, e) => {
    if (e) e.stopPropagation();
    const itemToDelete = items.find((it) => it.id === id);
    const itemName = itemToDelete?.title || 'Item';

    // Optimistic removal
    setItems((prev) => prev.filter((it) => it.id !== id));
    if (activeItem?.id === id) setActiveItem(null);

    showToast({
      type: 'info',
      title: 'Item Deleted',
      message: `${itemName} removed.`,
    });

    try {
      await api.deleteKnowledgeItem(id);
    } catch (err) {
      // Rollback
      if (itemToDelete) {
        setItems((prev) => [itemToDelete, ...prev]);
      }
      showToast({ type: 'danger', title: 'Error', message: 'Could not delete item.' });
    }
  };

  const handleAddColumn = () => {
    const colName = `Column ${tableData.headers.length + 1}`;
    setTableData((prev) => ({
      headers: [...prev.headers, colName],
      rows: prev.rows.map((row) => [...row, '']),
    }));
  };

  const handleDeleteColumn = (colIdx) => {
    if (tableData.headers.length <= 1) return;
    setTableData((prev) => ({
      headers: prev.headers.filter((_, i) => i !== colIdx),
      rows: prev.rows.map((row) => row.filter((_, i) => i !== colIdx)),
    }));
  };

  const handleHeaderChange = (colIdx, val) => {
    setTableData((prev) => {
      const newHeaders = [...prev.headers];
      newHeaders[colIdx] = val;
      return { ...prev, headers: newHeaders };
    });
  };

  const handleAddRow = () => {
    setTableData((prev) => ({
      ...prev,
      rows: [...prev.rows, new Array(prev.headers.length).fill('')],
    }));
  };

  const handleDeleteRow = (rowIdx) => {
    if (tableData.rows.length <= 1) return;
    setTableData((prev) => ({
      ...prev,
      rows: prev.rows.filter((_, i) => i !== rowIdx),
    }));
  };

  const handleCellChange = (rowIdx, colIdx, val) => {
    setTableData((prev) => {
      const newRows = prev.rows.map((r, rI) => {
        if (rI !== rowIdx) return r;
        const newR = [...r];
        newR[colIdx] = val;
        return newR;
      });
      return { ...prev, rows: newRows };
    });
  };

  const handleResetTable = () => {
    setTableData({
      headers: ['Step', 'Topic', 'Description', 'Status'],
      rows: [
        ['1', 'Setup & Environment', 'Initialize repository and install dependencies', 'Done'],
        ['2', 'Core Architecture', 'Design models, routes, and database schema', 'In Progress'],
      ],
    });
  };

  const handleDownloadCSV = (title, tableContent) => {
    try {
      const parsed = typeof tableContent === 'string' ? JSON.parse(tableContent) : tableContent;
      const headers = parsed?.headers || [];
      const rows = parsed?.rows || [];
      const csvLines = [
        headers.map((h) => `"${String(h).replace(/"/g, '""')}"`).join(','),
        ...rows.map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(',')),
      ];
      const blob = new Blob([csvLines.join('\n')], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${title || 'table'}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      showToast({ type: 'success', title: 'Exported', message: 'Table exported to CSV file.' });
    } catch (e) {
      showToast({ type: 'danger', title: 'Export Error', message: 'Could not export table to CSV.' });
    }
  };

  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      const text = evt.target?.result;
      if (typeof text === 'string') {
        const lines = text.split(/\r?\n/).filter((l) => l.trim().length > 0);
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
    e.target.value = '';
  };

  // Edit Table Data Handlers
  const handleEditAddColumn = () => {
    const colName = `Column ${editTableData.headers.length + 1}`;
    setEditTableData((prev) => ({
      headers: [...prev.headers, colName],
      rows: prev.rows.map((row) => [...row, '']),
    }));
  };

  const handleEditDeleteColumn = (colIdx) => {
    if (editTableData.headers.length <= 1) return;
    setEditTableData((prev) => ({
      headers: prev.headers.filter((_, i) => i !== colIdx),
      rows: prev.rows.map((row) => row.filter((_, i) => i !== colIdx)),
    }));
  };

  const handleEditHeaderChange = (colIdx, val) => {
    setEditTableData((prev) => {
      const newHeaders = [...prev.headers];
      newHeaders[colIdx] = val;
      return { ...prev, headers: newHeaders };
    });
  };

  const handleEditAddRow = () => {
    setEditTableData((prev) => ({
      ...prev,
      rows: [...prev.rows, new Array(prev.headers.length).fill('')],
    }));
  };

  const handleEditDeleteRow = (rowIdx) => {
    if (editTableData.rows.length <= 1) return;
    setEditTableData((prev) => ({
      ...prev,
      rows: prev.rows.filter((_, i) => i !== rowIdx),
    }));
  };

  const handleEditCellChange = (rowIdx, colIdx, val) => {
    setEditTableData((prev) => {
      const newRows = prev.rows.map((r, rI) => {
        if (rI !== rowIdx) return r;
        const newR = [...r];
        newR[colIdx] = val;
        return newR;
      });
      return { ...prev, rows: newRows };
    });
  };

  const handleEditFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      const text = evt.target?.result;
      if (typeof text === 'string') {
        const lines = text.split(/\r?\n/).filter((l) => l.trim().length > 0);
        if (lines.length > 0) {
          const headers = lines[0].split(',').map((h) => h.trim().replace(/^"|"$/g, ''));
          const rows = lines.slice(1).map((line) =>
            line.split(',').map((cell) => cell.trim().replace(/^"|"$/g, ''))
          );
          setEditTableData({ headers, rows });
          showToast({
            type: 'success',
            title: 'CSV Loaded',
            message: `Loaded ${rows.length} rows into editor.`,
          });
        }
      }
    };
    reader.readAsText(file);
    e.target.value = '';
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
                    {/* Top-Left: Pin Indicator if pinned */}
                    {item.isPinned && (
                      <div className="knowledge-tile-pin-indicator" title="Pinned to top">
                        <Pin size={11} fill="#F59E0B" color="#F59E0B" />
                      </div>
                    )}

                    {/* Top-Right: 3-Dots Button & Options Dropdown (Pin/Unpin, Edit, Delete) */}
                    <div className="knowledge-tile-menu-wrap" onClick={(e) => e.stopPropagation()}>
                      <button
                        type="button"
                        className={`knowledge-tile-more-btn ${menuOpenId === item.id ? 'is-active' : ''}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          setMenuOpenId(menuOpenId === item.id ? null : item.id);
                        }}
                        title="More options"
                      >
                        <MoreVertical size={14} />
                      </button>

                      {menuOpenId === item.id && (
                        <div className="knowledge-tile-menu-dropdown" onClick={(e) => e.stopPropagation()}>
                          <button
                            type="button"
                            className="knowledge-menu-item"
                            onClick={(e) => {
                              e.stopPropagation();
                              setMenuOpenId(null);
                              handleTogglePin(item, e);
                            }}
                          >
                            <Pin size={13} fill={item.isPinned ? '#F59E0B' : 'none'} color={item.isPinned ? '#F59E0B' : 'currentColor'} />
                            <span>{item.isPinned ? 'Unpin' : 'Pin to top'}</span>
                          </button>

                          <button
                            type="button"
                            className="knowledge-menu-item"
                            onClick={(e) => {
                              e.stopPropagation();
                              setMenuOpenId(null);
                              handleOpenEditModal(item);
                            }}
                          >
                            <Edit2 size={13} />
                            <span>Edit</span>
                          </button>

                          <button
                            type="button"
                            className="knowledge-menu-item is-delete"
                            onClick={(e) => {
                              e.stopPropagation();
                              setMenuOpenId(null);
                              handleDeleteItem(item.id, e);
                            }}
                          >
                            <Trash2 size={13} />
                            <span>Delete</span>
                          </button>
                        </div>
                      )}
                    </div>

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
                          <div className="flex items-center gap-1 ml-2" onClick={(e) => e.stopPropagation()}>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleOpenEditModal(lesson);
                              }}
                              className="btn-icon p-0.5 text-primary opacity-60 hover:opacity-100"
                              title="Edit Lesson"
                            >
                              <Edit2 size={11} />
                            </button>
                            <button
                              type="button"
                              onClick={(e) => handleDeleteItem(lesson.id, e)}
                              className="btn-icon p-0.5 text-red-500 opacity-60 hover:opacity-100"
                              title="Delete Lesson"
                            >
                              <Trash2 size={11} />
                            </button>
                          </div>
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

                    <div className="flex items-center gap-1.5 relative">
                      {item.isPinned && (
                        <span title="Pinned to top" className="text-amber-500">
                          <Pin size={13} fill="#F59E0B" />
                        </span>
                      )}

                      <div className="relative" onClick={(e) => e.stopPropagation()}>
                        <button
                          type="button"
                          className={`btn-icon p-1 ${menuOpenId === item.id ? 'text-primary' : 'text-secondary'}`}
                          onClick={(e) => {
                            e.stopPropagation();
                            setMenuOpenId(menuOpenId === item.id ? null : item.id);
                          }}
                          title="More options"
                        >
                          <MoreVertical size={14} />
                        </button>

                        {menuOpenId === item.id && (
                          <div className="knowledge-tile-menu-dropdown" onClick={(e) => e.stopPropagation()}>
                            <button
                              type="button"
                              className="knowledge-menu-item"
                              onClick={(e) => {
                                e.stopPropagation();
                                setMenuOpenId(null);
                                handleTogglePin(item, e);
                              }}
                            >
                              <Pin size={13} fill={item.isPinned ? '#F59E0B' : 'none'} color={item.isPinned ? '#F59E0B' : 'currentColor'} />
                              <span>{item.isPinned ? 'Unpin' : 'Pin to top'}</span>
                            </button>

                            <button
                              type="button"
                              className="knowledge-menu-item"
                              onClick={(e) => {
                                e.stopPropagation();
                                setMenuOpenId(null);
                                handleOpenEditModal(item);
                              }}
                            >
                              <Edit2 size={13} />
                              <span>Edit</span>
                            </button>

                            <button
                              type="button"
                              className="knowledge-menu-item is-delete"
                              onClick={(e) => {
                                e.stopPropagation();
                                setMenuOpenId(null);
                                handleDeleteItem(item.id, e);
                              }}
                            >
                              <Trash2 size={13} />
                              <span>Delete</span>
                            </button>
                          </div>
                        )}
                      </div>
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
                {activeItem.type === 'table' && (
                  <button
                    onClick={() => handleDownloadCSV(activeItem.title, activeItem.content)}
                    className="btn btn-ghost btn-sm"
                    title="Export table as CSV file"
                  >
                    <Download size={14} /> Export CSV
                  </button>
                )}
                <button
                  onClick={() => handleTogglePin(activeItem)}
                  className="btn btn-ghost btn-sm"
                  style={{ color: activeItem.isPinned ? '#F59E0B' : 'var(--text-secondary)' }}
                  title={activeItem.isPinned ? 'Unpin' : 'Pin to top'}
                >
                  <Pin size={14} fill={activeItem.isPinned ? '#F59E0B' : 'none'} />
                </button>
                <button
                  onClick={() => handleOpenEditModal(activeItem)}
                  className="btn btn-ghost btn-sm text-primary"
                  title="Edit item"
                >
                  <Edit2 size={14} /> Edit
                </button>
                <button
                  onClick={(e) => handleDeleteItem(activeItem.id, e)}
                  className="btn btn-ghost btn-sm text-red-500 hover:text-red-400"
                  title="Delete item"
                >
                  <Trash2 size={14} /> Delete
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
          className="modal-backdrop"
          style={{ zIndex: 9999 }}
          onClick={() => setModalMode(null)}
        >
          <div
            className="modal-card"
            style={{
              maxWidth: modalMode === 'table' ? '820px' : '560px',
              width: '100%',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="modal-header">
              <div className="flex items-center gap-2.5">
                <div
                  style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: '10px',
                    background:
                      modalMode === 'folder'
                        ? 'rgba(245, 158, 11, 0.16)'
                        : modalMode === 'table'
                        ? 'rgba(16, 185, 129, 0.16)'
                        : 'rgba(59, 130, 246, 0.16)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}
                >
                  {modalMode === 'folder' ? (
                    <Folder size={20} color="#F59E0B" />
                  ) : modalMode === 'table' ? (
                    <TableIcon size={20} color="#10B981" />
                  ) : (
                    <BookOpen size={20} color="#3B82F6" />
                  )}
                </div>
                <div>
                  <h3 className="modal-title text-base font-extrabold m-0">
                    {modalMode === 'folder'
                      ? 'Create New Folder'
                      : modalMode === 'table'
                      ? 'Create Table or Import CSV'
                      : 'Create Knowledge Lesson'}
                  </h3>
                  <p className="text-xs text-secondary mt-0.5 m-0">
                    {modalMode === 'folder'
                      ? 'Group your related lessons and tables together.'
                      : modalMode === 'table'
                      ? 'Structured data grid with instant columns, rows & CSV import.'
                      : 'Document practical guides, SOPs, and learning notes.'}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setModalMode(null)}
                className="btn-icon"
                title="Close"
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleCreateItem}>
              <div className="modal-body flex flex-col gap-3.5">
                <div>
                  <label className="block text-xs font-bold text-secondary mb-1">
                    {modalMode === 'folder' ? 'Folder Name *' : modalMode === 'table' ? 'Table Name *' : 'Lesson Title *'}
                  </label>
                  <input
                    type="text"
                    required
                    placeholder={
                      modalMode === 'folder'
                        ? 'e.g. Architecture & System Design'
                        : modalMode === 'table'
                        ? 'e.g. Weekly KPI Tracker'
                        : 'e.g. PostgreSQL Indexing Guide'
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
                        rows={7}
                        required
                        placeholder="Write down comprehensive notes, key takeaways, code examples, or summary..."
                        value={createContent}
                        onChange={(e) => setCreateContent(e.target.value)}
                        className="form-textarea"
                      />
                    </div>

                    {/* Optional Lesson Chaining */}
                    {lessonsInFolder.length > 0 && (
                      <div>
                        <label className="block text-xs font-bold text-secondary mb-1">
                          Chain to Next Lesson (Optional Sequence)
                        </label>
                        <select
                          value={createNextLessonId}
                          onChange={(e) => setCreateNextLessonId(e.target.value)}
                          className="form-input"
                        >
                          <option value="">(None - Standalone Lesson)</option>
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
                  <div className="flex flex-col gap-2">
                    <div className="flex items-center justify-between flex-wrap gap-2 pb-1 border-b border-border">
                      <div className="flex items-center gap-2">
                        <label className="text-xs font-bold text-secondary uppercase tracking-wider">
                          Table Columns & Data
                        </label>
                        <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-primary/10 text-primary">
                          {tableData.rows.length} rows × {tableData.headers.length} cols
                        </span>
                      </div>

                      <div className="flex items-center gap-1.5 flex-wrap">
                        <label
                          className="btn btn-secondary btn-sm"
                          style={{
                            cursor: 'pointer',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '5px',
                            fontSize: '0.76rem',
                            padding: '4px 10px',
                          }}
                          title="Import from a CSV or Excel export"
                        >
                          <Upload size={13} /> Import CSV
                          <input
                            type="file"
                            accept=".csv,.txt"
                            onChange={handleFileUpload}
                            style={{ display: 'none' }}
                          />
                        </label>
                        <button
                          type="button"
                          onClick={handleAddColumn}
                          className="btn btn-ghost btn-sm"
                          style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '0.76rem', padding: '4px 8px' }}
                          title="Add column"
                        >
                          <Plus size={12} /> Col
                        </button>
                        <button
                          type="button"
                          onClick={handleAddRow}
                          className="btn btn-ghost btn-sm"
                          style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '0.76rem', padding: '4px 8px' }}
                          title="Add row"
                        >
                          <Plus size={12} /> Row
                        </button>
                        <button
                          type="button"
                          onClick={handleResetTable}
                          className="btn btn-ghost btn-sm text-secondary"
                          style={{ fontSize: '0.76rem', padding: '4px 8px' }}
                          title="Reset table structure"
                        >
                          Reset
                        </button>
                      </div>
                    </div>

                    {/* Interactive Table Grid */}
                    <div className="knowledge-table-editor-container">
                      <table className="knowledge-table-element">
                        <thead className="knowledge-table-head">
                          <tr>
                            <th style={{ width: '38px', textAlign: 'center', padding: '8px 6px', color: 'var(--text-muted)' }}>
                              #
                            </th>
                            {tableData.headers.map((h, cIdx) => (
                              <th key={cIdx} style={{ padding: '6px 8px', minWidth: '130px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                  <input
                                    type="text"
                                    value={h}
                                    onChange={(e) => handleHeaderChange(cIdx, e.target.value)}
                                    className="knowledge-table-header-input"
                                    placeholder={`Column ${cIdx + 1}`}
                                  />
                                  {tableData.headers.length > 1 && (
                                    <button
                                      type="button"
                                      onClick={() => handleDeleteColumn(cIdx)}
                                      className="btn-icon"
                                      title="Delete column"
                                      style={{ width: '18px', height: '18px', opacity: 0.5, color: '#EF4444' }}
                                    >
                                      <Trash2 size={11} />
                                    </button>
                                  )}
                                </div>
                              </th>
                            ))}
                            <th style={{ width: '32px', padding: '6px' }}></th>
                          </tr>
                        </thead>
                        <tbody>
                          {tableData.rows.map((row, rIdx) => (
                            <tr key={rIdx} style={{ borderBottom: '1px solid var(--border-color)' }}>
                              <td style={{ textAlign: 'center', fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 700, padding: '6px 4px' }}>
                                {rIdx + 1}
                              </td>
                              {row.map((cell, cIdx) => (
                                <td key={cIdx} style={{ padding: '4px 6px' }}>
                                  <input
                                    type="text"
                                    value={cell}
                                    onChange={(e) => handleCellChange(rIdx, cIdx, e.target.value)}
                                    className="knowledge-table-cell-input"
                                    placeholder="Enter data..."
                                  />
                                </td>
                              ))}
                              <td style={{ padding: '4px', textAlign: 'center' }}>
                                {tableData.rows.length > 1 && (
                                  <button
                                    type="button"
                                    onClick={() => handleDeleteRow(rIdx)}
                                    className="btn-icon"
                                    title="Delete row"
                                    style={{ width: '20px', height: '20px', opacity: 0.45, color: '#EF4444' }}
                                  >
                                    <Trash2 size={12} />
                                  </button>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    <button
                      type="button"
                      onClick={handleAddRow}
                      className="btn btn-ghost btn-sm"
                      style={{
                        border: '1px dashed var(--border-color)',
                        width: '100%',
                        borderRadius: '8px',
                        padding: '6px',
                        fontSize: '0.78rem',
                        color: 'var(--primary-color)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '6px',
                      }}
                    >
                      <Plus size={13} /> Add Row
                    </button>
                  </div>
                )}

                <div>
                  <label className="block text-xs font-bold text-secondary mb-1">
                    Tags
                  </label>
                  <input
                    type="text"
                    placeholder="Tags (comma-separated, e.g. dev, database, notes)"
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
              </div>

              {/* Modal Footer */}
              <div className="modal-footer">
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

      {/* Edit Modal (Folder, Lesson, or Table) */}
      {editModalItem && (
        <div
          className="modal-backdrop"
          style={{ zIndex: 9999 }}
          onClick={() => setEditModalItem(null)}
        >
          <div
            className="modal-card"
            style={{
              maxWidth: editModalItem.type === 'table' ? '820px' : '560px',
              width: '100%',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="modal-header">
              <div className="flex items-center gap-2.5">
                <div
                  style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: '10px',
                    background:
                      editModalItem.type === 'folder'
                        ? 'rgba(245, 158, 11, 0.16)'
                        : editModalItem.type === 'table'
                        ? 'rgba(16, 185, 129, 0.16)'
                        : 'rgba(59, 130, 246, 0.16)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}
                >
                  {editModalItem.type === 'folder' ? (
                    <Folder size={20} color="#F59E0B" />
                  ) : editModalItem.type === 'table' ? (
                    <TableIcon size={20} color="#10B981" />
                  ) : (
                    <BookOpen size={20} color="#3B82F6" />
                  )}
                </div>
                <div>
                  <h3 className="modal-title text-base font-extrabold m-0">
                    {editModalItem.type === 'folder'
                      ? 'Edit Folder'
                      : editModalItem.type === 'table'
                      ? 'Edit Data Table'
                      : 'Edit Knowledge Lesson'}
                  </h3>
                  <p className="text-xs text-secondary mt-0.5 m-0">
                    Update title, details, tags, or structure.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setEditModalItem(null)}
                className="btn-icon"
                title="Close"
              >
                <X size={18} />
              </button>
            </div>

            {/* Edit Form */}
            <form onSubmit={handleSaveEdit}>
              <div className="modal-body flex flex-col gap-3.5">
                <div>
                  <label className="block text-xs font-bold text-secondary mb-1">
                    {editModalItem.type === 'folder'
                      ? 'Folder Name *'
                      : editModalItem.type === 'table'
                      ? 'Table Name *'
                      : 'Lesson Title *'}
                  </label>
                  <input
                    type="text"
                    required
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    className="form-input"
                    placeholder="Enter title..."
                  />
                </div>

                {editModalItem.type === 'lesson' && (
                  <>
                    <div>
                      <label className="block text-xs font-bold text-secondary mb-1">
                        Lesson Notes & Content *
                      </label>
                      <textarea
                        rows={7}
                        value={editContent}
                        onChange={(e) => setEditContent(e.target.value)}
                        className="form-textarea"
                        placeholder="Write lesson notes, code samples, takeaways..."
                      />
                    </div>

                    {lessonsInFolder.filter((l) => l.id !== editModalItem.id).length > 0 && (
                      <div>
                        <label className="block text-xs font-bold text-secondary mb-1">
                          Chain to Next Lesson
                        </label>
                        <select
                          value={editNextLessonId}
                          onChange={(e) => setEditNextLessonId(e.target.value)}
                          className="form-input"
                        >
                          <option value="">(None - Standalone Lesson)</option>
                          {lessonsInFolder
                            .filter((l) => l.id !== editModalItem.id)
                            .map((l) => (
                              <option key={l.id} value={l.id}>
                                {l.title}
                              </option>
                            ))}
                        </select>
                      </div>
                    )}
                  </>
                )}

                {editModalItem.type === 'table' && (
                  <div className="flex flex-col gap-2">
                    <div className="flex items-center justify-between flex-wrap gap-2 pb-1 border-b border-border">
                      <div className="flex items-center gap-2">
                        <label className="text-xs font-bold text-secondary uppercase tracking-wider">
                          Table Structure & Data
                        </label>
                        <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-primary/10 text-primary">
                          {editTableData.rows.length} rows × {editTableData.headers.length} cols
                        </span>
                      </div>

                      <div className="flex items-center gap-1.5 flex-wrap">
                        <label
                          className="btn btn-secondary btn-sm"
                          style={{
                            cursor: 'pointer',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '5px',
                            fontSize: '0.76rem',
                            padding: '4px 10px',
                          }}
                          title="Import from CSV file"
                        >
                          <Upload size={13} /> Import CSV
                          <input
                            type="file"
                            accept=".csv,.txt"
                            onChange={handleEditFileUpload}
                            style={{ display: 'none' }}
                          />
                        </label>
                        <button
                          type="button"
                          onClick={handleEditAddColumn}
                          className="btn btn-ghost btn-sm"
                          style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '0.76rem', padding: '4px 8px' }}
                          title="Add column"
                        >
                          <Plus size={12} /> Col
                        </button>
                        <button
                          type="button"
                          onClick={handleEditAddRow}
                          className="btn btn-ghost btn-sm"
                          style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '0.76rem', padding: '4px 8px' }}
                          title="Add row"
                        >
                          <Plus size={12} /> Row
                        </button>
                      </div>
                    </div>

                    {/* Table Editor Grid */}
                    <div className="knowledge-table-editor-container">
                      <table className="knowledge-table-element">
                        <thead className="knowledge-table-head">
                          <tr>
                            <th style={{ width: '38px', textAlign: 'center', padding: '8px 6px', color: 'var(--text-muted)' }}>
                              #
                            </th>
                            {editTableData.headers.map((h, cIdx) => (
                              <th key={cIdx} style={{ padding: '6px 8px', minWidth: '130px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                  <input
                                    type="text"
                                    value={h}
                                    onChange={(e) => handleEditHeaderChange(cIdx, e.target.value)}
                                    className="knowledge-table-header-input"
                                    placeholder={`Column ${cIdx + 1}`}
                                  />
                                  {editTableData.headers.length > 1 && (
                                    <button
                                      type="button"
                                      onClick={() => handleEditDeleteColumn(cIdx)}
                                      className="btn-icon"
                                      title="Delete column"
                                      style={{ width: '18px', height: '18px', opacity: 0.5, color: '#EF4444' }}
                                    >
                                      <Trash2 size={11} />
                                    </button>
                                  )}
                                </div>
                              </th>
                            ))}
                            <th style={{ width: '32px', padding: '6px' }}></th>
                          </tr>
                        </thead>
                        <tbody>
                          {editTableData.rows.map((row, rIdx) => (
                            <tr key={rIdx} style={{ borderBottom: '1px solid var(--border-color)' }}>
                              <td style={{ textAlign: 'center', fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 700, padding: '6px 4px' }}>
                                {rIdx + 1}
                              </td>
                              {row.map((cell, cIdx) => (
                                <td key={cIdx} style={{ padding: '4px 6px' }}>
                                  <input
                                    type="text"
                                    value={cell}
                                    onChange={(e) => handleEditCellChange(rIdx, cIdx, e.target.value)}
                                    className="knowledge-table-cell-input"
                                    placeholder="Enter data..."
                                  />
                                </td>
                              ))}
                              <td style={{ padding: '4px', textAlign: 'center' }}>
                                {editTableData.rows.length > 1 && (
                                  <button
                                    type="button"
                                    onClick={() => handleEditDeleteRow(rIdx)}
                                    className="btn-icon"
                                    title="Delete row"
                                    style={{ width: '20px', height: '20px', opacity: 0.45, color: '#EF4444' }}
                                  >
                                    <Trash2 size={12} />
                                  </button>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    <button
                      type="button"
                      onClick={handleEditAddRow}
                      className="btn btn-ghost btn-sm"
                      style={{
                        border: '1px dashed var(--border-color)',
                        width: '100%',
                        borderRadius: '8px',
                        padding: '6px',
                        fontSize: '0.78rem',
                        color: 'var(--primary-color)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '6px',
                      }}
                    >
                      <Plus size={13} /> Add Row
                    </button>
                  </div>
                )}

                <div>
                  <label className="block text-xs font-bold text-secondary mb-1">
                    Tags
                  </label>
                  <input
                    type="text"
                    placeholder="Tags (comma-separated, e.g. dev, database, notes)"
                    value={editTags}
                    onChange={(e) => setEditTags(e.target.value)}
                    className="form-input"
                  />
                </div>

                <div className="flex items-center gap-2 mt-1">
                  <input
                    type="checkbox"
                    id="editPinCheckbox"
                    checked={editIsPinned}
                    onChange={(e) => setEditIsPinned(e.target.checked)}
                  />
                  <label htmlFor="editPinCheckbox" className="text-xs font-semibold text-primary cursor-pointer">
                    Pin this item to top of folder
                  </label>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="modal-footer">
                <button type="button" className="btn btn-ghost" onClick={() => setEditModalItem(null)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={editSubmitting || !editTitle.trim()}>
                  {editSubmitting ? 'Saving...' : 'Save Changes'}
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
