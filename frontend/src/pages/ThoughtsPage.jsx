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
 * Parses markup for Red, Green, Yellow word marking, plus Underline, Bold, Italic.
 * Supported tags:
 *   <red>text</red> or [red]text[/red]
 *   <green>text</green> or [green]text[/green]
 *   <yellow>text</yellow> or [yellow]text[/yellow] (and legacy ==text== / <mark>text</mark>)
 *   <u>underline</u>
 *   **bold**
 *   *italic*
 */
export function parseFormattedText(text) {
  if (!text) return null;

  const tokenRegex = /(<red>[\s\S]+?<\/red>|\[red\][\s\S]+?\[\/red\]|<green>[\s\S]+?<\/green>|\[green\][\s\S]+?\[\/green\]|<yellow>[\s\S]+?<\/yellow>|\[yellow\][\s\S]+?\[\/yellow\]|==[\s\S]+?==|<mark>[\s\S]+?<\/mark>|<u>[\s\S]+?<\/u>|\*\*[\s\S]+?\*\*|\*[\s\S]+?\*)/g;
  const parts = text.split(tokenRegex);

  return parts.map((part, index) => {
    if (!part) return null;

    // RED
    if (
      (part.startsWith('<red>') && part.endsWith('</red>') && part.length >= 11) ||
      (part.startsWith('[red]') && part.endsWith('[/red]') && part.length >= 11)
    ) {
      const inner = part.startsWith('<red>') ? part.slice(5, -6) : part.slice(5, -6);
      return (
        <span key={index} className="thought-mark-red">
          {parseFormattedText(inner)}
        </span>
      );
    }

    // GREEN
    if (
      (part.startsWith('<green>') && part.endsWith('</green>') && part.length >= 15) ||
      (part.startsWith('[green]') && part.endsWith('[/green]') && part.length >= 15)
    ) {
      const inner = part.startsWith('<green>') ? part.slice(7, -8) : part.slice(7, -8);
      return (
        <span key={index} className="thought-mark-green">
          {parseFormattedText(inner)}
        </span>
      );
    }

    // YELLOW (and legacy == or <mark>)
    if (
      (part.startsWith('<yellow>') && part.endsWith('</yellow>') && part.length >= 17) ||
      (part.startsWith('[yellow]') && part.endsWith('[/yellow]') && part.length >= 17)
    ) {
      const inner = part.startsWith('<yellow>') ? part.slice(8, -9) : part.slice(8, -9);
      return (
        <span key={index} className="thought-mark-yellow">
          {parseFormattedText(inner)}
        </span>
      );
    }

    if (part.startsWith('==') && part.endsWith('==') && part.length >= 4) {
      const inner = part.slice(2, -2);
      return (
        <span key={index} className="thought-mark-yellow">
          {parseFormattedText(inner)}
        </span>
      );
    }

    if (part.startsWith('<mark>') && part.endsWith('</mark>') && part.length >= 13) {
      const inner = part.slice(6, -7);
      return (
        <span key={index} className="thought-mark-yellow">
          {parseFormattedText(inner)}
        </span>
      );
    }

    // UNDERLINE
    if (part.startsWith('<u>') && part.endsWith('</u>') && part.length >= 7) {
      const inner = part.slice(3, -4);
      return (
        <u key={index} className="thought-underline-text">
          {parseFormattedText(inner)}
        </u>
      );
    }

    // BOLD
    if (part.startsWith('**') && part.endsWith('**') && part.length >= 4) {
      const inner = part.slice(2, -2);
      return (
        <strong key={index} className="thought-bold-text">
          {parseFormattedText(inner)}
        </strong>
      );
    }

    // ITALIC
    if (part.startsWith('*') && part.endsWith('*') && part.length >= 2) {
      const inner = part.slice(1, -1);
      return (
        <em key={index} className="thought-italic-text">
          {parseFormattedText(inner)}
        </em>
      );
    }

    return part;
  });
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
  const [thoughtText, setThoughtText] = useState('');
  const [category, setCategory] = useState('Motivation');
  const [submitting, setSubmitting] = useState(false);
  const addTextareaRef = useRef(null);

  // Edit Form State
  const [editingThought, setEditingThought] = useState(null);
  const [editThoughtText, setEditThoughtText] = useState('');
  const [editCategory, setEditCategory] = useState('Motivation');
  const [editSubmitting, setEditSubmitting] = useState(false);
  const editTextareaRef = useRef(null);

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
   * Inserts formatting tags (<red>, <green>, <yellow>, <u>, etc.)
   * around selected text or as a placeholder.
   */
  const insertFormatting = (prefix, suffix, isEdit = false) => {
    const textarea = isEdit ? editTextareaRef.current : addTextareaRef.current;
    if (!textarea) return;

    const currentText = isEdit ? editThoughtText : thoughtText;
    const start = textarea.selectionStart ?? 0;
    const end = textarea.selectionEnd ?? 0;
    const selectedText = currentText.substring(start, end);

    let newText;
    let newCursorPos;

    if (selectedText.length > 0) {
      const before = currentText.substring(0, start);
      const after = currentText.substring(end);
      newText = before + prefix + selectedText + suffix + after;
      newCursorPos = start + prefix.length + selectedText.length + suffix.length;
    } else {
      let placeholder = 'word';
      if (prefix === '<red>') placeholder = 'marked text';
      else if (prefix === '<green>') placeholder = 'marked text';
      else if (prefix === '<yellow>') placeholder = 'marked text';
      else if (prefix === '<u>') placeholder = 'underlined text';
      else if (prefix === '**') placeholder = 'bold text';
      else if (prefix === '*') placeholder = 'italic text';

      const before = currentText.substring(0, start);
      const after = currentText.substring(end);
      newText = before + prefix + placeholder + suffix + after;
      newCursorPos = start + prefix.length + placeholder.length;
    }

    if (isEdit) {
      setEditThoughtText(newText);
    } else {
      setThoughtText(newText);
    }

    setTimeout(() => {
      textarea.focus();
      if (selectedText.length === 0) {
        textarea.setSelectionRange(start + prefix.length, newCursorPos);
      } else {
        textarea.setSelectionRange(newCursorPos, newCursorPos);
      }
    }, 10);
  };

  const handleCreateThought = async (e) => {
    e.preventDefault();
    if (!thoughtText.trim()) return;
    try {
      setSubmitting(true);
      const res = await api.createThought({
        text: thoughtText.trim(),
        category: category || 'Motivation',
      });
      if (res?.data) {
        setThoughts((prev) => [res.data, ...prev]);
        showToast({
          type: 'success',
          title: 'Thought Saved',
          message: 'Motivational thought stored in database successfully!',
        });
        setThoughtText('');
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
    setEditThoughtText(thought.text || '');
    setEditCategory(typeof thought.category === 'object' ? thought.category?.name : (thought.category || 'Motivation'));
  };

  const handleSaveEdit = async (e) => {
    e.preventDefault();
    if (!editingThought || !editThoughtText.trim()) return;
    try {
      setEditSubmitting(true);
      const res = await api.updateThought(editingThought.id, {
        text: editThoughtText.trim(),
        category: editCategory,
      });
      if (res?.data) {
        setThoughts((prev) =>
          prev.map((t) => (t.id === editingThought.id ? res.data : t))
        );
        showToast({
          type: 'success',
          title: 'Thought Updated',
          message: 'Changes saved with color markings successfully!',
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
    navigator.clipboard.writeText(text);
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
        {/* Red color marker */}
        <button
          type="button"
          onClick={() => insertFormatting('<red>', '</red>', isEdit)}
          className="thought-format-btn thought-format-btn-red"
          title="Mark selected words in Red (<red>word</red>)"
        >
          <span className="thought-swatch swatch-red" />
          <span>Red</span>
        </button>

        {/* Green color marker */}
        <button
          type="button"
          onClick={() => insertFormatting('<green>', '</green>', isEdit)}
          className="thought-format-btn thought-format-btn-green"
          title="Mark selected words in Green (<green>word</green>)"
        >
          <span className="thought-swatch swatch-green" />
          <span>Green</span>
        </button>

        {/* Yellow color marker */}
        <button
          type="button"
          onClick={() => insertFormatting('<yellow>', '</yellow>', isEdit)}
          className="thought-format-btn thought-format-btn-yellow"
          title="Mark selected words in Yellow (<yellow>word</yellow>)"
        >
          <span className="thought-swatch swatch-yellow" />
          <span>Yellow</span>
        </button>

        <span className="thought-toolbar-divider" />

        {/* Underline */}
        <button
          type="button"
          onClick={() => insertFormatting('<u>', '</u>', isEdit)}
          className="thought-format-btn thought-format-btn-underline"
          title="Underline selected words (<u>text</u>)"
        >
          <Underline size={13} />
          <span>Underline</span>
        </button>

        {/* Bold */}
        <button
          type="button"
          onClick={() => insertFormatting('**', '**', isEdit)}
          className="thought-format-btn"
          title="Bold text (**text**)"
        >
          <Bold size={13} />
          <span>Bold</span>
        </button>

        {/* Italic */}
        <button
          type="button"
          onClick={() => insertFormatting('*', '*', isEdit)}
          className="thought-format-btn"
          title="Italic text (*text*)"
        >
          <Italic size={13} />
          <span>Italic</span>
        </button>
      </div>

      <div className="thought-format-hint">
        Select words to mark with color
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
            const wordCount = (item.text || '').trim().split(/\s+/).filter(Boolean).length;
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

                {/* Card Content with Formatted Highlight & Underline */}
                <div className="thought-body-quote">
                  <div className="thought-quote-content">
                    {parseFormattedText(item.text)}
                  </div>
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

              {/* Text Input with Formatting Toolbar */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-bold text-secondary">
                    Thought / Quote Text *
                  </label>
                  <span className="text-xs text-muted font-mono">
                    {thoughtText.length} chars
                  </span>
                </div>

                {/* Formatting Toolbar */}
                {renderFormattingToolbar(false)}

                <textarea
                  ref={addTextareaRef}
                  rows={5}
                  required
                  placeholder="Enter thought text... Select any word and click Red, Green, or Yellow to mark it."
                  value={thoughtText}
                  onChange={(e) => setThoughtText(e.target.value)}
                  className="thought-form-textarea"
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
                  disabled={submitting || !thoughtText.trim()}
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
                    {editThoughtText.length} chars
                  </span>
                </div>

                {/* Formatting Toolbar */}
                {renderFormattingToolbar(true)}

                <textarea
                  ref={editTextareaRef}
                  rows={5}
                  required
                  placeholder="Enter thought text... Select any word and click Red, Green, or Yellow to mark it."
                  value={editThoughtText}
                  onChange={(e) => setEditThoughtText(e.target.value)}
                  className="thought-form-textarea"
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
                  disabled={editSubmitting || !editThoughtText.trim()}
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
