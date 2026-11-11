import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Lightbulb,
  Plus,
  Trash2,
  Copy,
  Check,
  Search,
  Sparkles,
  Tag,
  Quote,
  Share2,
  BookOpen,
  Pin,
  Underline,
  Bold,
  Italic,
  Rows3,
  LayoutGrid,
  Edit2,
  X,
  Clock,
} from 'lucide-react';
import { api } from '../services/api';
import { useApp } from '../context/AppContext';
import '../styles/pages/thoughts.css';

const CATEGORY_COLORS = {
  Motivation: { color: '#3B82F6', bg: 'rgba(59, 130, 246, 0.12)', border: 'rgba(59, 130, 246, 0.3)' },
  Discipline: { color: '#8B5CF6', bg: 'rgba(139, 92, 246, 0.12)', border: 'rgba(139, 92, 246, 0.3)' },
  Mindset: { color: '#F59E0B', bg: 'rgba(245, 158, 11, 0.12)', border: 'rgba(245, 158, 11, 0.3)' },
  Productivity: { color: '#10B981', bg: 'rgba(16, 185, 129, 0.12)', border: 'rgba(16, 185, 129, 0.3)' },
  Wisdom: { color: '#EC4899', bg: 'rgba(236, 72, 153, 0.12)', border: 'rgba(236, 72, 153, 0.3)' },
  Tech: { color: '#06B6D4', bg: 'rgba(6, 182, 212, 0.12)', border: 'rgba(6, 182, 212, 0.3)' },
};

/**
 * Normalizes legacy markup (<red>, <green>, <yellow>, ==, <mark>, **, *)
 * and rich HTML into clean inline styled spans with FONT COLOR ONLY.
 * Strips all backgrounds, badge boxes, and borders.
 */
export function normalizeThoughtHtml(rawText) {
  if (!rawText) return '';
  let html = String(rawText);

  // Normalize legacy and markdown tags to clean font-color spans
  html = html.replace(/<red>([\s\S]*?)<\/red>/gi, '<span style="color: #EF4444; font-weight: 700;">$1</span>');
  html = html.replace(/\[red\]([\s\S]*?)\[\/red\]/gi, '<span style="color: #EF4444; font-weight: 700;">$1</span>');

  html = html.replace(/<green>([\s\S]*?)<\/green>/gi, '<span style="color: #10B981; font-weight: 700;">$1</span>');
  html = html.replace(/\[green\]([\s\S]*?)\[\/green\]/gi, '<span style="color: #10B981; font-weight: 700;">$1</span>');

  html = html.replace(/<yellow>([\s\S]*?)<\/yellow>/gi, '<span style="color: #F59E0B; font-weight: 700;">$1</span>');
  html = html.replace(/\[yellow\]([\s\S]*?)\[\/yellow\]/gi, '<span style="color: #F59E0B; font-weight: 700;">$1</span>');
  html = html.replace(/==([\s\S]*?)==/gi, '<span style="color: #F59E0B; font-weight: 700;">$1</span>');
  html = html.replace(/<mark>([\s\S]*?)<\/mark>/gi, '<span style="color: #F59E0B; font-weight: 700;">$1</span>');

  // Markdown bold & italic if present
  html = html.replace(/\*\*([^*]+?)\*\*/g, '<strong>$1</strong>');
  html = html.replace(/(?<!\*)\*([^*]+?)\*(?!\*)/g, '<em>$1</em>');

  // Convert plain newlines to <br /> if no block or break tags exist
  if (!/<(p|br|div)[\s>]/i.test(html)) {
    html = html.replace(/\n/g, '<br />');
  }

  return html;
}

export function parseFormattedText(text) {
  return normalizeThoughtHtml(text);
}

export function ThoughtsPage() {
  const { showToast } = useApp();
  const [searchParams] = useSearchParams();
  const [thoughts, setThoughts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [viewMode, setViewMode] = useState('full'); // 'full' or 'grid'
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [copiedId, setCopiedId] = useState(null);

  // Add Form State
  const [category, setCategory] = useState('Motivation');
  const [submitting, setSubmitting] = useState(false);
  const [addCharCount, setAddCharCount] = useState(0);
  const addEditorRef = useRef(null);

  // Edit Form State
  const [editingThought, setEditingThought] = useState(null);
  const [editCategory, setEditCategory] = useState('Motivation');
  const [editSubmitting, setEditSubmitting] = useState(false);
  const [editCharCount, setEditCharCount] = useState(0);
  const editEditorRef = useRef(null);

  const setEditEditorRef = (node) => {
    editEditorRef.current = node;
    if (node && editingThought) {
      node.innerHTML = normalizeThoughtHtml(editingThought.text || '');
      setEditCharCount(node.innerText.replace(/\n$/, '').length);
    }
  };

  const setAddEditorRef = (node) => {
    addEditorRef.current = node;
    if (node) {
      node.innerHTML = '';
      setAddCharCount(0);
    }
  };

  const fetchThoughts = async () => {
    try {
      setLoading(true);
      const res = await api.getThoughts();
      const thoughtsList = Array.isArray(res) ? res : Array.isArray(res?.data) ? res.data : [];
      setThoughts(thoughtsList);
    } catch (err) {
      console.warn('Failed to load thoughts:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchThoughts();
  }, []);

  // Handle deep-link from Global Search (?thought=<id>)
  useEffect(() => {
    if (!thoughts || thoughts.length === 0) return;
    const targetId = searchParams.get('thought');
    if (!targetId) return;

    const found = thoughts.find((t) => String(t.id) === String(targetId));
    if (found) {
      setSelectedCategory('all');
      setSearchQuery('');
      setTimeout(() => {
        const el = document.getElementById(`thought-card-${found.id}`);
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'center' });
          el.classList.add('thought-highlight-pulse');
          setTimeout(() => {
            el.classList.remove('thought-highlight-pulse');
          }, 2400);
        }
      }, 180);
    }
  }, [thoughts, searchParams]);

  const categories = useMemo(() => {
    const set = new Set(['Motivation', 'Discipline', 'Mindset', 'Productivity', 'Wisdom']);
    thoughts.forEach((t) => {
      const catName = typeof t.category === 'object' ? t.category?.name : t.category;
      if (catName) set.add(catName);
    });
    return Array.from(set);
  }, [thoughts]);

  const filteredThoughts = useMemo(() => {
    const list = thoughts.filter((t) => {
      const catName = typeof t.category === 'object' ? t.category?.name : t.category;
      if (selectedCategory !== 'all' && catName !== selectedCategory) {
        return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchText = (t.text || '').toLowerCase().includes(q);
        const matchCategory = (catName || '').toLowerCase().includes(q);
        if (!matchText && !matchCategory) return false;
      }
      return true;
    });

    return list.sort((a, b) => {
      if (a.isPinned && !b.isPinned) return -1;
      if (!a.isPinned && b.isPinned) return 1;
      return 0;
    });
  }, [thoughts, selectedCategory, searchQuery]);

  const handleTogglePin = async (thought) => {
    try {
      const nextPin = !thought.isPinned;
      await api.updateThought(thought.id, { isPinned: nextPin });
      setThoughts((prev) =>
        prev.map((t) => (t.id === thought.id ? { ...t, isPinned: nextPin } : t))
      );
      showToast({
        type: 'success',
        title: nextPin ? 'Thought Pinned' : 'Thought Unpinned',
        message: nextPin ? 'Pinned to top of list.' : 'Unpinned from top.',
      });
    } catch (e) {
      showToast({ type: 'danger', title: 'Error', message: 'Could not update pin.' });
    }
  };

  /**
   * Applies font color directly to selected text in the rich editor.
   * Zero tags are displayed to the user - text changes color visually in real time!
   */
  const applyTextColor = (colorHex, isEdit = false) => {
    const editor = isEdit ? editEditorRef.current : addEditorRef.current;
    if (!editor) return;
    editor.focus();

    document.execCommand('styleWithCSS', false, true);
    document.execCommand('foreColor', false, colorHex);

    if (isEdit) {
      setEditCharCount(editor.innerText.replace(/\n$/, '').length);
    } else {
      setAddCharCount(editor.innerText.replace(/\n$/, '').length);
    }
  };

  /**
   * Resets font color back to default text color.
   */
  const clearTextColor = (isEdit = false) => {
    const editor = isEdit ? editEditorRef.current : addEditorRef.current;
    if (!editor) return;
    editor.focus();

    document.execCommand('styleWithCSS', false, true);
    document.execCommand('foreColor', false, 'inherit');
    document.execCommand('removeFormat', false, null);

    if (isEdit) {
      setEditCharCount(editor.innerText.replace(/\n$/, '').length);
    } else {
      setAddCharCount(editor.innerText.replace(/\n$/, '').length);
    }
  };

  /**
   * Applies inline formatting (underline, bold, italic).
   */
  const applyFormat = (command, isEdit = false) => {
    const editor = isEdit ? editEditorRef.current : addEditorRef.current;
    if (!editor) return;
    editor.focus();
    document.execCommand(command, false, null);

    if (isEdit) {
      setEditCharCount(editor.innerText.replace(/\n$/, '').length);
    } else {
      setAddCharCount(editor.innerText.replace(/\n$/, '').length);
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const text = (e.clipboardData || window.clipboardData).getData('text/plain');
    document.execCommand('insertText', false, text);
  };

  const handleCreateThought = async (e) => {
    e.preventDefault();
    if (!addEditorRef.current) return;
    const innerHtml = addEditorRef.current.innerHTML.trim();
    const plainText = addEditorRef.current.innerText.trim();
    if (!plainText) {
      showToast({ type: 'warning', title: 'Validation', message: 'Please enter thought text.' });
      return;
    }
    try {
      setSubmitting(true);
      const res = await api.createThought({
        text: innerHtml,
        category: category || 'Motivation',
      });
      if (res?.data) {
        setThoughts((prev) => [res.data, ...prev]);
        showToast({
          type: 'success',
          title: 'Thought Saved',
          message: 'Motivational thought stored in database successfully!',
        });
        setIsAddModalOpen(false);
      }
    } catch (err) {
      showToast({
        type: 'danger',
        title: 'Error',
        message: err.message || 'Failed to save thought.',
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleStartEdit = (thought) => {
    setEditingThought(thought);
    setEditCategory(typeof thought.category === 'object' ? thought.category?.name : (thought.category || 'Motivation'));
  };

  const handleSaveEdit = async (e) => {
    e.preventDefault();
    if (!editingThought || !editEditorRef.current) return;
    const innerHtml = editEditorRef.current.innerHTML.trim();
    const plainText = editEditorRef.current.innerText.trim();
    if (!plainText) {
      showToast({ type: 'warning', title: 'Validation', message: 'Thought text cannot be empty.' });
      return;
    }
    try {
      setEditSubmitting(true);
      const res = await api.updateThought(editingThought.id, {
        text: innerHtml,
        category: editCategory,
      });
      if (res?.data) {
        setThoughts((prev) =>
          prev.map((t) => (t.id === editingThought.id ? res.data : t))
        );
        showToast({
          type: 'success',
          title: 'Thought Updated',
          message: 'Changes saved with color formatting successfully!',
        });
        setEditingThought(null);
      }
    } catch (err) {
      showToast({
        type: 'danger',
        title: 'Error',
        message: err.message || 'Failed to update thought.',
      });
    } finally {
      setEditSubmitting(false);
    }
  };

  const handleDeleteThought = async (id) => {
    try {
      await api.deleteThought(id);
      setThoughts((prev) => prev.filter((t) => t.id !== id));
      showToast({
        type: 'info',
        title: 'Thought Deleted',
        message: 'Thought removed from database.',
      });
    } catch (err) {
      showToast({
        type: 'danger',
        title: 'Error',
        message: 'Could not delete thought.',
      });
    }
  };

  const handleCopy = (text, id) => {
    const cleanText = (text || '').replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
    navigator.clipboard.writeText(cleanText || text);
    setCopiedId(id);
    showToast({
      type: 'success',
      title: 'Copied to Clipboard',
      message: 'Thought text copied ready to share!',
    });
    setTimeout(() => setCopiedId(null), 2000);
  };

  const renderFormattingToolbar = (isEdit = false) => (
    <div className="thought-format-toolbar">
      <div className="thought-format-actions">
        {/* Red Font Color */}
        <button
          type="button"
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => applyTextColor('#EF4444', isEdit)}
          className="thought-format-btn thought-format-btn-red"
          title="Change font color of selected word to Red"
        >
          <span className="thought-swatch swatch-red" />
          <span>Red</span>
        </button>

        {/* Green Font Color */}
        <button
          type="button"
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => applyTextColor('#10B981', isEdit)}
          className="thought-format-btn thought-format-btn-green"
          title="Change font color of selected word to Green"
        >
          <span className="thought-swatch swatch-green" />
          <span>Green</span>
        </button>

        {/* Yellow Font Color */}
        <button
          type="button"
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => applyTextColor('#F59E0B', isEdit)}
          className="thought-format-btn thought-format-btn-yellow"
          title="Change font color of selected word to Yellow"
        >
          <span className="thought-swatch swatch-yellow" />
          <span>Yellow</span>
        </button>

        {/* Default Color */}
        <button
          type="button"
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => clearTextColor(isEdit)}
          className="thought-format-btn thought-format-btn-reset"
          title="Reset to default plain text color"
        >
          <span className="thought-swatch swatch-default" />
          <span>Default</span>
        </button>

        <span className="thought-toolbar-divider" />

        {/* Underline */}
        <button
          type="button"
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => applyFormat('underline', isEdit)}
          className="thought-format-btn thought-format-btn-underline"
          title="Underline text"
        >
          <Underline size={13} />
          <span>Underline</span>
        </button>

        {/* Bold */}
        <button
          type="button"
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => applyFormat('bold', isEdit)}
          className="thought-format-btn"
          title="Bold text"
        >
          <Bold size={13} />
          <span>Bold</span>
        </button>

        {/* Italic */}
        <button
          type="button"
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => applyFormat('italic', isEdit)}
          className="thought-format-btn"
          title="Italic text"
        >
          <Italic size={13} />
          <span>Italic</span>
        </button>
      </div>

      <div className="thought-format-hint">
        Select word to change font color
      </div>
    </div>
  );

  return (
    <div className="thoughts-page-container">
      {/* Header Banner */}
      <div className="thoughts-banner-card card">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="thoughts-banner-tag">
              Mindset & Inspiration
            </span>
          </div>
          <h1 className="thoughts-banner-title">
            <Lightbulb size={24} color="#F59E0B" /> Thoughts & Motivation Hub
          </h1>
          <p className="thoughts-banner-sub">
            Store, curate, and reflect on wisdom, quotes, and motivational notes synchronized across web and mobile.
          </p>
        </div>

        <button
          onClick={() => setIsAddModalOpen(true)}
          className="btn btn-primary thoughts-btn-add"
        >
          <Plus size={16} /> Add Thought
        </button>
      </div>

      {/* Filter & View Switcher Bar */}
      <div className="thoughts-filter-bar card">
        {/* Categories */}
        <div className="flex flex-wrap gap-1 items-center">
          <button
            onClick={() => setSelectedCategory('all')}
            className={`thoughts-category-btn ${selectedCategory === 'all' ? 'active' : ''}`}
          >
            All ({thoughts.length})
          </button>
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`thoughts-category-btn ${selectedCategory === cat ? 'active' : ''}`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Search & View Mode Controls */}
        <div className="flex items-center gap-3 flex-wrap">
          {/* View Mode Toggle: Full Width (List) vs Grid */}
          <div className="thoughts-view-toggle">
            <button
              type="button"
              onClick={() => setViewMode('full')}
              className={`thoughts-view-btn ${viewMode === 'full' ? 'active' : ''}`}
              title="Full-Width Card Layout"
            >
              <Rows3 size={15} />
              <span>Full Width</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode('grid')}
              className={`thoughts-view-btn ${viewMode === 'grid' ? 'active' : ''}`}
              title="Multi-Column Grid Layout"
            >
              <LayoutGrid size={15} />
              <span>Grid</span>
            </button>
          </div>

          {/* Search Input */}
          <div className="thoughts-search-wrap">
            <Search size={14} color="var(--text-muted)" className="thoughts-search-icon" />
            <input
              type="text"
              placeholder="Search thoughts..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="thoughts-search-input"
            />
          </div>
        </div>
      </div>

      {/* Cards List / Grid */}
      {loading ? (
        <div className="thoughts-loading">
          <Sparkles size={28} color="var(--primary-color)" className="mx-auto mb-2 animate-spin" />
          <div>Loading saved thoughts from database...</div>
        </div>
      ) : filteredThoughts.length === 0 ? (
        <div className="thoughts-empty-card card">
          <Quote size={40} color="var(--primary-color)" className="thoughts-empty-icon" />
          <h3 className="thoughts-empty-title">No thoughts found</h3>
          <p className="thoughts-empty-desc">
            Paste good thoughts, motivational quotes, or key reflections to save them to your database.
          </p>
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="btn btn-primary btn-sm mt-4"
          >
            <Plus size={14} /> Add First Thought
          </button>
        </div>
      ) : (
        <div className={viewMode === 'full' ? 'thoughts-full-width-list' : 'thoughts-grid'}>
          {filteredThoughts.map((item) => {
            const catName = typeof item.category === 'object' ? item.category?.name : (item.category || 'Motivation');
            const catMeta = CATEGORY_COLORS[catName] || CATEGORY_COLORS.Motivation;
            const wordCount = (item.text || '').replace(/<[^>]*>/g, ' ').trim().split(/\s+/).filter(Boolean).length;
            const cardDate = item.createdAt
              ? new Date(item.createdAt).toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                })
              : null;

            return (
              <div
                key={item.id}
                id={`thought-card-${item.id}`}
                className={`thought-card card ${item.isPinned ? 'is-pinned' : ''} ${viewMode === 'full' ? 'is-full-width' : ''}`}
                style={{
                  borderLeftColor: catMeta.color,
                  borderLeftWidth: '4px',
                }}
              >
                {/* Card Header */}
                <div className="thought-card-header">
                  <div className="thought-card-header-left">
                    <span
                      className="thought-category-badge"
                      style={{
                        background: catMeta.bg,
                        color: catMeta.color,
                        borderColor: catMeta.border,
                      }}
                    >
                      <span
                        style={{
                          width: '6px',
                          height: '6px',
                          borderRadius: '50%',
                          background: catMeta.color,
                          display: 'inline-block',
                        }}
                      />
                      {catName}
                    </span>

                    {cardDate && (
                      <span className="thought-card-date">
                        <Clock size={11} /> {cardDate}
                      </span>
                    )}

                    {item.isPinned && (
                      <span className="thought-pinned-chip">
                        <Pin size={11} fill="#F59E0B" /> PINNED
                      </span>
                    )}
                  </div>

                  <div className="thought-card-actions">
                    <button
                      onClick={() => handleTogglePin(item)}
                      title={item.isPinned ? 'Unpin' : 'Pin to top'}
                      className={`thought-action-btn thought-btn-pin ${item.isPinned ? 'pinned' : ''}`}
                    >
                      <Pin size={14} fill={item.isPinned ? '#F59E0B' : 'none'} />
                    </button>
                    <button
                      onClick={() => handleStartEdit(item)}
                      title="Edit thought and formatting"
                      className="thought-action-btn thought-btn-edit"
                    >
                      <Edit2 size={14} />
                    </button>
                    <button
                      onClick={() => handleCopy(item.text, item.id)}
                      title="Copy text"
                      className={`thought-action-btn thought-btn-copy ${copiedId === item.id ? 'copied' : ''}`}
                    >
                      {copiedId === item.id ? <Check size={14} /> : <Copy size={14} />}
                    </button>
                    <button
                      onClick={() => handleDeleteThought(item.id)}
                      title="Delete thought"
                      className="thought-action-btn thought-btn-delete"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>

                {/* Card Content with Formatted Font Colors (No Backgrounds) */}
                <div className="thought-body-quote">
                  <div
                    className="thought-quote-content"
                    dangerouslySetInnerHTML={{
                      __html: normalizeThoughtHtml(item.text),
                    }}
                  />
                </div>

                {/* Card Footer */}
                <div className="thought-card-footer">
                  <span className="thought-meta-count">
                    {wordCount} {wordCount === 1 ? 'word' : 'words'}
                  </span>
                  {item.isPinned && (
                    <span className="thought-footer-featured">Featured Motivation</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add Thought Modal */}
      {isAddModalOpen && (
        <div
          className="thought-modal-overlay"
          onClick={() => setIsAddModalOpen(false)}
        >
          <div
            className="thought-modal-card card"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="thought-modal-header">
              <div className="flex items-center gap-2.5">
                <div className="thought-modal-icon-badge add">
                  <Lightbulb size={18} />
                </div>
                <div>
                  <h2 className="thought-modal-title">Add Thought or Wisdom</h2>
                  <p className="thought-modal-subtitle">Save a quote, mindset reminder, or principle</p>
                </div>
              </div>
              <button
                type="button"
                className="btn-icon"
                onClick={() => setIsAddModalOpen(false)}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreateThought} className="flex flex-col gap-3">
              {/* Category selector */}
              <div>
                <label className="block text-xs font-bold text-secondary mb-1">
                  Category
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="form-input thought-category-select"
                >
                  <option value="Motivation">Motivation</option>
                  <option value="Discipline">Discipline</option>
                  <option value="Mindset">Mindset</option>
                  <option value="Productivity">Productivity</option>
                  <option value="Wisdom">Wisdom</option>
                  <option value="Tech">Tech & Engineering</option>
                </select>
              </div>

              {/* Text Input with Rich WYSIWYG Editor */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-bold text-secondary">
                    Thought / Quote Text *
                  </label>
                  <span className="text-xs text-muted font-mono">
                    {addCharCount} chars
                  </span>
                </div>

                {/* Formatting Toolbar */}
                {renderFormattingToolbar(false)}

                <div
                  ref={setAddEditorRef}
                  contentEditable
                  className="thought-rich-editor"
                  data-placeholder="Type thought text here... Select any word and click Red, Green, or Yellow to color it."
                  onInput={() => {
                    if (addEditorRef.current) {
                      setAddCharCount(addEditorRef.current.innerText.replace(/\n$/, '').length);
                    }
                  }}
                  onPaste={handlePaste}
                />
              </div>

              <div className="thought-modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setIsAddModalOpen(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={submitting}
                >
                  {submitting ? 'Saving...' : 'Save Thought'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Thought Modal */}
      {editingThought && (
        <div
          className="thought-modal-overlay"
          onClick={() => setEditingThought(null)}
        >
          <div
            className="thought-modal-card card"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="thought-modal-header">
              <div className="flex items-center gap-2.5">
                <div className="thought-modal-icon-badge edit">
                  <Edit2 size={18} />
                </div>
                <div>
                  <h2 className="thought-modal-title">Edit Thought</h2>
                  <p className="thought-modal-subtitle">Update thought text and color word markings</p>
                </div>
              </div>
              <button
                type="button"
                className="btn-icon"
                onClick={() => setEditingThought(null)}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="flex flex-col gap-3">
              <div>
                <label className="block text-xs font-bold text-secondary mb-1">
                  Category
                </label>
                <select
                  value={editCategory}
                  onChange={(e) => setEditCategory(e.target.value)}
                  className="form-input thought-category-select"
                >
                  <option value="Motivation">Motivation</option>
                  <option value="Discipline">Discipline</option>
                  <option value="Mindset">Mindset</option>
                  <option value="Productivity">Productivity</option>
                  <option value="Wisdom">Wisdom</option>
                  <option value="Tech">Tech & Engineering</option>
                </select>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-bold text-secondary">
                    Thought / Quote Text *
                  </label>
                  <span className="text-xs text-muted font-mono">
                    {editCharCount} chars
                  </span>
                </div>

                {/* Formatting Toolbar */}
                {renderFormattingToolbar(true)}

                <div
                  ref={setEditEditorRef}
                  contentEditable
                  className="thought-rich-editor"
                  data-placeholder="Type thought text here... Select any word and click Red, Green, or Yellow to color it."
                  onInput={() => {
                    if (editEditorRef.current) {
                      setEditCharCount(editEditorRef.current.innerText.replace(/\n$/, '').length);
                    }
                  }}
                  onPaste={handlePaste}
                />
              </div>

              <div className="thought-modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setEditingThought(null)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={editSubmitting}
                >
                  {editSubmitting ? 'Updating...' : 'Update Thought'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
export default ThoughtsPage;
