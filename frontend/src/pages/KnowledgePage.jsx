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

  // Creation Modals
  const [modalMode, setModalMode] = useState(null); // 'folder' | 'lesson' | 'table'
  const [createTitle, setCreateTitle] = useState('');
  const [createContent, setCreateContent] = useState('');
  const [createTags, setCreateTags] = useState('');
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

  // Filter items in the current folder
  const currentItems = useMemo(() => {
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return items.filter(
        (it) =>
          (it.title || '').toLowerCase().includes(q) ||
          (it.content || '').toLowerCase().includes(q) ||
          (it.tags || '').toLowerCase().includes(q)
      );
    }

    const parentId = currentFolder ? currentFolder.id : null;
    return items.filter((it) => (it.parentId || null) === parentId);
  }, [items, currentFolder, searchQuery]);

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
        icon: modalMode === 'folder' ? 'Folder' : modalMode === 'table' ? 'Table' : 'FileText',
      };

      const res = await api.createKnowledgeItem(payload);
      if (res?.data) {
        setItems((prev) => [...prev, res.data]);
        showToast({
          type: 'success',
          title: 'Created Successfully',
          message: `${modalMode.toUpperCase()} added to knowledge base.`,
        });
        setModalMode(null);
        setCreateTitle('');
        setCreateContent('');
        setCreateTags('');
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
  const renderTableContent = (contentStr) => {
    try {
      const parsed = typeof contentStr === 'string' ? JSON.parse(contentStr) : contentStr;
      const headers = parsed.headers || [];
      const rows = parsed.rows || [];

      return (
        <div style={{ overflowX: 'auto', borderRadius: '10px', border: '1px solid var(--border-color)' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
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
      return <pre style={{ whiteSpace: 'pre-wrap', color: 'var(--text-primary)' }}>{contentStr}</pre>;
    }
  };

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '24px 16px' }}>
      {/* Banner */}
      <div
        className="card"
        style={{
          background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.12) 0%, rgba(37, 99, 235, 0.08) 100%)',
          border: '1.5px solid rgba(16, 185, 129, 0.25)',
          borderRadius: '16px',
          padding: '24px 28px',
          marginBottom: '20px',
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '16px',
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
            <span
              style={{
                background: 'rgba(16, 185, 129, 0.2)',
                color: '#10B981',
                padding: '3px 8px',
                borderRadius: '6px',
                fontSize: '0.72rem',
                fontWeight: 800,
                textTransform: 'uppercase',
              }}
            >
              Lessons & Reference Architecture
            </span>
          </div>
          <h1 style={{ margin: 0, fontSize: '1.65rem', fontWeight: 800, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <BookOpen size={24} color="#10B981" /> Knowledge Base & Lessons
          </h1>
          <p style={{ margin: '6px 0 0', fontSize: '0.88rem', color: 'var(--text-secondary)' }}>
            Organize nested folders, text lessons, and structured excel tables with full global search integration.
          </p>
        </div>

        {/* Action Buttons */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
          <button
            onClick={() => {
              setModalMode('folder');
              setCreateTitle('');
              setCreateContent('');
            }}
            className="btn btn-ghost"
            style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'var(--card-bg)', border: '1px solid var(--border-color)' }}
          >
            <Folder size={15} color="#F59E0B" /> New Folder
          </button>
          <button
            onClick={() => {
              setModalMode('lesson');
              setCreateTitle('');
              setCreateContent('');
            }}
            className="btn btn-ghost"
            style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'var(--card-bg)', border: '1px solid var(--border-color)' }}
          >
            <FileText size={15} color="#3B82F6" /> New Lesson
          </button>
          <button
            onClick={() => {
              setModalMode('table');
              setCreateTitle('');
              setCreateContent('');
            }}
            className="btn btn-primary"
            style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            <TableIcon size={15} /> Create Table / Import Excel
          </button>
        </div>
      </div>

      {/* Navigation Breadcrumbs & Search */}
      <div
        className="card"
        style={{
          background: 'var(--card-bg)',
          border: '1px solid var(--border-color)',
          borderRadius: '12px',
          padding: '12px 18px',
          marginBottom: '20px',
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '12px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
          <button
            onClick={() => handleNavigateBreadcrumb(-1)}
            style={{
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              color: breadcrumbs.length === 0 ? 'var(--primary-color)' : 'var(--text-secondary)',
              fontWeight: 800,
              fontSize: '0.88rem',
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
                  fontSize: '0.88rem',
                }}
              >
                {b.title}
              </button>
            </React.Fragment>
          ))}
        </div>

        <div style={{ position: 'relative', width: '260px' }}>
          <Search size={14} color="var(--text-muted)" style={{ position: 'absolute', left: '10px', top: '10px' }} />
          <input
            type="text"
            placeholder="Search all lessons & tables..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              width: '100%',
              padding: '7px 10px 7px 32px',
              borderRadius: '8px',
              border: '1px solid var(--border-color)',
              background: 'var(--page-bg)',
              color: 'var(--text-primary)',
              fontSize: '0.84rem',
              outline: 'none',
            }}
          />
        </div>
      </div>

      {/* Main Content Area: Split View if activeItem is selected */}
      <div style={{ display: 'grid', gridTemplateColumns: activeItem ? '1fr 1.4fr' : '1fr', gap: '20px' }}>
        {/* Left: Folders & Items Grid */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {currentFolder && (
            <button
              onClick={() => handleNavigateBreadcrumb(breadcrumbs.length - 2)}
              className="btn btn-ghost btn-sm"
              style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', alignSelf: 'flex-start' }}
            >
              <ArrowLeft size={14} /> Back to previous folder
            </button>
          )}

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
              <h3 style={{ margin: '0 0 6px', color: 'var(--text-primary)', fontSize: '1.05rem' }}>
                Folder is empty
              </h3>
              <p style={{ margin: 0, fontSize: '0.84rem', color: 'var(--text-secondary)' }}>
                Add nested subfolders, write lessons, or upload excel tables into this section.
              </p>
            </div>
          ) : (
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
                      border: isSelected ? '1.5px solid var(--primary-color)' : '1px solid var(--border-color)',
                      borderRadius: '12px',
                      padding: '14px 16px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: '10px',
                      transition: 'all 0.15s ease',
                      boxShadow: 'var(--shadow-sm)',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', minWidth: 0 }}>
                      <div
                        style={{
                          width: '38px',
                          height: '38px',
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
                        {isFolder ? (
                          <Folder size={18} color="#F59E0B" />
                        ) : isTable ? (
                          <TableIcon size={18} color="#10B981" />
                        ) : (
                          <FileText size={18} color="#3B82F6" />
                        )}
                      </div>
                      <div style={{ minWidth: 0 }}>
                        <div
                          style={{
                            fontSize: '0.92rem',
                            fontWeight: 800,
                            color: 'var(--text-primary)',
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                          }}
                        >
                          {item.title}
                        </div>
                        <div style={{ fontSize: '0.74rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
                          {isFolder ? 'Folder' : isTable ? 'Data Table' : 'Text Lesson'}
                          {item.tags && ` • ${item.tags}`}
                        </div>
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
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
                        <Trash2 size={14} />
                      </button>
                      <ChevronRight size={16} color="var(--text-muted)" />
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
              padding: '24px',
              boxShadow: 'var(--shadow-md)',
              display: 'flex',
              flexDirection: 'column',
              gap: '16px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--border-color)', paddingBottom: '14px' }}>
              <div>
                <span
                  style={{
                    fontSize: '0.72rem',
                    fontWeight: 800,
                    textTransform: 'uppercase',
                    color: activeItem.type === 'table' ? '#10B981' : '#3B82F6',
                  }}
                >
                  {activeItem.type === 'table' ? 'Structured Table View' : 'Lesson Content'}
                </span>
                <h2 style={{ margin: '4px 0 0', fontSize: '1.35rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                  {activeItem.title}
                </h2>
              </div>
              <button
                onClick={() => setActiveItem(null)}
                className="btn btn-ghost btn-sm"
              >
                Close Viewer
              </button>
            </div>

            {activeItem.type === 'table' ? (
              renderTableContent(activeItem.content)
            ) : (
              <div
                style={{
                  fontSize: '0.94rem',
                  color: 'var(--text-primary)',
                  lineHeight: '1.7',
                  whiteSpace: 'pre-wrap',
                  background: 'var(--page-bg)',
                  padding: '16px',
                  borderRadius: '10px',
                  border: '1px solid var(--border-color)',
                }}
              >
                {activeItem.content || 'No text content in this lesson.'}
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
                      ? 'e.g. React Architecture, Database Design'
                      : modalMode === 'table'
                      ? 'e.g. Roadmap Milestones, API Endpoints'
                      : 'e.g. useEffect Lifecycle Deep-Dive'
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
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '6px' }}>
                    Lesson Content / Notes *
                  </label>
                  <textarea
                    rows={8}
                    required
                    placeholder="Write detailed lesson text, concepts, examples..."
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
                  placeholder="e.g. react, hooks, advanced"
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

