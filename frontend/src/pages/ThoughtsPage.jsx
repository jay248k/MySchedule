import React, { useState, useEffect, useMemo } from 'react';
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
} from 'lucide-react';
import { api } from '../services/api';
import { useApp } from '../context/AppContext';
import '../styles/pages/thoughts.css';

export function ThoughtsPage() {
  const { showToast } = useApp();
  const [thoughts, setThoughts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [copiedId, setCopiedId] = useState(null);

  // Form State
  const [thoughtText, setThoughtText] = useState('');
  const [author, setAuthor] = useState('');
  const [category, setCategory] = useState('Motivation');
  const [tags, setTags] = useState('');
  const [submitting, setSubmitting] = useState(false);

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

  const categories = useMemo(() => {
    const set = new Set(['Motivation', 'Discipline', 'Mindset', 'Productivity', 'Wisdom']);
    thoughts.forEach((t) => {
      if (t.category) set.add(t.category);
    });
    return Array.from(set);
  }, [thoughts]);

  const filteredThoughts = useMemo(() => {
    const list = thoughts.filter((t) => {
      if (selectedCategory !== 'all' && t.category !== selectedCategory) {
        return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchText = (t.text || '').toLowerCase().includes(q);
        const matchAuthor = (t.author || '').toLowerCase().includes(q);
        const matchTags = (t.tags || '').toLowerCase().includes(q);
        if (!matchText && !matchAuthor && !matchTags) return false;
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
        message: nextPin ? 'Pinned to top.' : 'Unpinned from top.',
      });
    } catch (e) {
      showToast({ type: 'danger', title: 'Error', message: 'Could not update pin.' });
    }
  };

  const handleCreateThought = async (e) => {
    e.preventDefault();
    if (!thoughtText.trim()) return;
    try {
      setSubmitting(true);
      const res = await api.createThought({
        text: thoughtText.trim(),
        author: author.trim() || 'Anonymous',
        category: category || 'Motivation',
        tags: tags.trim() || null,
      });
      if (res?.data) {
        setThoughts((prev) => [res.data, ...prev]);
        showToast({
          type: 'success',
          title: 'Thought Saved',
          message: 'Motivational thought stored in database successfully!',
        });
        setThoughtText('');
        setAuthor('');
        setTags('');
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
      message: 'Thought copied ready to share!',
    });
    setTimeout(() => setCopiedId(null), 2000);
  };

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

      {/* Filter & Search Bar */}
      <div className="thoughts-filter-bar card">
        {/* Categories */}
        <div className="flex flex-wrap gap-1">
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

        {/* Search */}
        <div className="thoughts-search-wrap">
          <Search size={14} color="var(--text-muted)" className="thoughts-search-icon" />
          <input
            type="text"
            placeholder="Search thoughts, quotes, tags..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="thoughts-search-input"
          />
        </div>
      </div>

      {/* Grid of Thoughts */}
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
        <div className="thoughts-grid">
          {filteredThoughts.map((item) => (
            <div
              key={item.id}
              className={`thought-card card ${item.isPinned ? 'is-pinned' : ''}`}
            >
              <div>
                <div className="thought-card-header">
                  <span className="thought-category-badge">
                    {item.category || 'General'}
                  </span>
                  <div className="thought-card-actions">
                    <button
                      onClick={() => handleTogglePin(item)}
                      title={item.isPinned ? 'Unpin' : 'Pin to top'}
                      className={`thought-action-btn thought-btn-pin ${item.isPinned ? 'pinned' : ''}`}
                    >
                      <Pin size={14} fill={item.isPinned ? '#F59E0B' : 'none'} />
                    </button>
                    <button
                      onClick={() => handleCopy(`"${item.text}" — ${item.author}`, item.id)}
                      title="Copy quote"
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

                <div className="thought-body-quote">
                  "{item.text}"
                </div>

                <div className="thought-author-row">
                  — {item.author || 'Anonymous'}
                </div>
              </div>

              {item.tags && (
                <div className="thought-tags-wrap">
                  {item.tags.split(',').map((tag, i) => (
                    <span key={i} className="thought-tag-pill">
                      #{tag.trim()}
                    </span>
                  ))}
                </div>
              )}
            </div>
          ))}
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
            <h2 className="thought-modal-title">
              <Lightbulb size={20} color="#F59E0B" /> Save Thought or Motivation
            </h2>

            <form onSubmit={handleCreateThought} className="flex flex-col gap-3">
              <div>
                <label className="block text-xs font-bold text-secondary mb-1">
                  Thought / Quote / Wisdom Text *
                </label>
                <textarea
                  rows={4}
                  required
                  placeholder="Paste or write inspirational thought, lesson, or reminder..."
                  value={thoughtText}
                  onChange={(e) => setThoughtText(e.target.value)}
                  className="thought-form-textarea"
                />
              </div>

              <div className="thought-modal-grid-2col">
                <div>
                  <label className="block text-xs font-bold text-secondary mb-1">
                    Author / Source
                  </label>
                  <input
                    type="text"
                    placeholder="Enter author or source..."
                    value={author}
                    onChange={(e) => setAuthor(e.target.value)}
                    className="form-input"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-secondary mb-1">
                    Category
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="form-input"
                  >
                    <option value="Motivation">Motivation</option>
                    <option value="Discipline">Discipline</option>
                    <option value="Mindset">Mindset</option>
                    <option value="Productivity">Productivity</option>
                    <option value="Wisdom">Wisdom</option>
                    <option value="Tech">Tech & Engineering</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-secondary mb-1">
                  Tags (comma separated)
                </label>
                <input
                  type="text"
                  placeholder="focus, habits, daily"
                  value={tags}
                  onChange={(e) => setTags(e.target.value)}
                  className="form-input"
                />
              </div>

              <div className="flex justify-end gap-2 mt-2">
                <button
                  type="button"
                  className="btn btn-ghost"
                  onClick={() => setIsAddModalOpen(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={submitting || !thoughtText.trim()}
                >
                  {submitting ? 'Saving...' : 'Save to DB'}
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
