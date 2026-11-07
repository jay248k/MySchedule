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
} from 'lucide-react';
import { api } from '../services/api';
import { useApp } from '../context/AppContext';

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
      if (res?.data && Array.isArray(res.data)) {
        setThoughts(res.data);
      }
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
    return thoughts.filter((t) => {
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
  }, [thoughts, selectedCategory, searchQuery]);

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
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '24px 16px' }}>
      {/* Header Banner */}
      <div
        className="card"
        style={{
          background: 'linear-gradient(135deg, rgba(37, 99, 235, 0.12) 0%, rgba(139, 92, 246, 0.08) 100%)',
          border: '1.5px solid rgba(37, 99, 235, 0.25)',
          borderRadius: '16px',
          padding: '24px 28px',
          marginBottom: '24px',
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
                background: 'rgba(37, 99, 235, 0.2)',
                color: 'var(--primary-color)',
                padding: '3px 8px',
                borderRadius: '6px',
                fontSize: '0.72rem',
                fontWeight: 800,
                textTransform: 'uppercase',
              }}
            >
              Mindset & Inspiration
            </span>
          </div>
          <h1 style={{ margin: 0, fontSize: '1.65rem', fontWeight: 800, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Lightbulb size={24} color="#F59E0B" /> Thoughts & Motivation Hub
          </h1>
          <p style={{ margin: '6px 0 0', fontSize: '0.88rem', color: 'var(--text-secondary)' }}>
            Store, curate, and reflect on wisdom, quotes, and motivational notes synchronized across web and mobile.
          </p>
        </div>

        <button
          onClick={() => setIsAddModalOpen(true)}
          className="btn btn-primary"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '10px 18px',
            fontSize: '0.9rem',
            fontWeight: 800,
            borderRadius: '10px',
          }}
        >
          <Plus size={16} /> Add Thought
        </button>
      </div>

      {/* Filter & Search Bar */}
      <div
        className="card"
        style={{
          background: 'var(--card-bg)',
          border: '1px solid var(--border-color)',
          borderRadius: '12px',
          padding: '14px 18px',
          marginBottom: '20px',
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '12px',
        }}
      >
        {/* Categories */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
          <button
            onClick={() => setSelectedCategory('all')}
            style={{
              padding: '6px 12px',
              borderRadius: '8px',
              border: 'none',
              background: selectedCategory === 'all' ? 'var(--primary-color)' : 'var(--page-bg)',
              color: selectedCategory === 'all' ? '#FFFFFF' : 'var(--text-secondary)',
              fontSize: '0.8rem',
              fontWeight: 700,
              cursor: 'pointer',
              transition: 'all 0.15s ease',
            }}
          >
            All ({thoughts.length})
          </button>
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              style={{
                padding: '6px 12px',
                borderRadius: '8px',
                border: 'none',
                background: selectedCategory === cat ? 'var(--primary-color)' : 'var(--page-bg)',
                color: selectedCategory === cat ? '#FFFFFF' : 'var(--text-secondary)',
                fontSize: '0.8rem',
                fontWeight: 700,
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Search */}
        <div style={{ position: 'relative', width: '260px' }}>
          <Search size={14} color="var(--text-muted)" style={{ position: 'absolute', left: '10px', top: '10px' }} />
          <input
            type="text"
            placeholder="Search thoughts, quotes, tags..."
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

      {/* Grid of Thoughts */}
      {loading ? (
        <div style={{ padding: '60px 0', textAlign: 'center', color: 'var(--text-secondary)' }}>
          <Sparkles size={28} color="var(--primary-color)" style={{ margin: '0 auto 10px', animation: 'spin 2s linear infinite' }} />
          <div>Loading saved thoughts from database...</div>
        </div>
      ) : filteredThoughts.length === 0 ? (
        <div
          className="card"
          style={{
            background: 'var(--card-bg)',
            border: '1px dashed var(--border-color)',
            borderRadius: '14px',
            padding: '50px 20px',
            textAlign: 'center',
          }}
        >
          <Quote size={40} color="var(--primary-color)" style={{ margin: '0 auto 12px', opacity: 0.5 }} />
          <h3 style={{ margin: '0 0 6px', color: 'var(--text-primary)' }}>No thoughts found</h3>
          <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
            Paste good thoughts, motivational quotes, or key reflections to save them to your database.
          </p>
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="btn btn-primary btn-sm"
            style={{ marginTop: '16px' }}
          >
            <Plus size={14} /> Add First Thought
          </button>
        </div>
      ) : (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
            gap: '16px',
          }}
        >
          {filteredThoughts.map((item) => (
            <div
              key={item.id}
              className="card"
              style={{
                background: 'var(--card-bg)',
                border: '1px solid var(--border-color)',
                borderRadius: '14px',
                padding: '16px 20px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                gap: '14px',
                boxShadow: 'var(--shadow-sm)',
                position: 'relative',
                overflow: 'hidden',
              }}
            >
              <div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
                  <span
                    style={{
                      fontSize: '0.72rem',
                      fontWeight: 800,
                      textTransform: 'uppercase',
                      padding: '2px 8px',
                      borderRadius: '5px',
                      background: 'rgba(37, 99, 235, 0.12)',
                      color: 'var(--primary-color)',
                      border: '1px solid rgba(37, 99, 235, 0.25)',
                    }}
                  >
                    {item.category || 'General'}
                  </span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <button
                      onClick={() => handleCopy(`"${item.text}" — ${item.author}`, item.id)}
                      title="Copy quote"
                      style={{
                        background: 'transparent',
                        border: 'none',
                        cursor: 'pointer',
                        color: copiedId === item.id ? '#10B981' : 'var(--text-muted)',
                        padding: '4px',
                      }}
                    >
                      {copiedId === item.id ? <Check size={14} /> : <Copy size={14} />}
                    </button>
                    <button
                      onClick={() => handleDeleteThought(item.id)}
                      title="Delete thought"
                      style={{
                        background: 'transparent',
                        border: 'none',
                        cursor: 'pointer',
                        color: '#EF4444',
                        padding: '4px',
                        opacity: 0.6,
                      }}
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>

                <div
                  style={{
                    fontSize: '0.98rem',
                    color: 'var(--text-primary)',
                    lineHeight: '1.55',
                    fontStyle: 'italic',
                    position: 'relative',
                  }}
                >
                  "{item.text}"
                </div>

                <div
                  style={{
                    marginTop: '10px',
                    fontSize: '0.84rem',
                    fontWeight: 700,
                    color: 'var(--text-secondary)',
                    textAlign: 'right',
                  }}
                >
                  — {item.author || 'Anonymous'}
                </div>
              </div>

              {item.tags && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', borderTop: '1px solid var(--border-subtle)', paddingTop: '10px' }}>
                  {item.tags.split(',').map((tag, i) => (
                    <span
                      key={i}
                      style={{
                        fontSize: '0.68rem',
                        color: 'var(--text-muted)',
                        background: 'var(--page-bg)',
                        padding: '2px 6px',
                        borderRadius: '4px',
                        border: '1px solid var(--border-color)',
                      }}
                    >
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
          onClick={() => setIsAddModalOpen(false)}
        >
          <div
            className="card"
            style={{
              background: 'var(--card-bg)',
              border: '1px solid var(--border-color)',
              borderRadius: '16px',
              padding: '24px',
              width: '100%',
              maxWidth: '520px',
              boxShadow: 'var(--shadow-lg)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h2 style={{ margin: '0 0 16px', fontSize: '1.25rem', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Lightbulb size={20} color="#F59E0B" /> Save Thought or Motivation
            </h2>

            <form onSubmit={handleCreateThought} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '6px' }}>
                  Thought / Quote / Wisdom Text *
                </label>
                <textarea
                  rows={4}
                  required
                  placeholder="Paste or write inspirational thought, lesson, or reminder..."
                  value={thoughtText}
                  onChange={(e) => setThoughtText(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px',
                    borderRadius: '8px',
                    border: '1px solid var(--border-color)',
                    background: 'var(--page-bg)',
                    color: 'var(--text-primary)',
                    fontSize: '0.9rem',
                    outline: 'none',
                    resize: 'vertical',
                    boxSizing: 'border-box',
                  }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '6px' }}>
                    Author / Source
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Marcus Aurelius, Steve Jobs"
                    value={author}
                    onChange={(e) => setAuthor(e.target.value)}
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

                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '6px' }}>
                    Category
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
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
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '6px' }}>
                  Tags (comma separated)
                </label>
                <input
                  type="text"
                  placeholder="focus, habits, daily"
                  value={tags}
                  onChange={(e) => setTags(e.target.value)}
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

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '10px' }}>
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

