import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search,
  X,
  CheckSquare,
  Target,
  Folder,
  Calendar,
  FileText,
  Eye,
  Clock,
  ArrowRight,
  AlertCircle,
  Sparkles,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { formatDate } from '../../utils/dateUtils';

const RECENT_SEARCHES_KEY = 'myschedule_recent_searches';
const RECENTLY_VIEWED_KEY = 'myschedule_recently_viewed';

const INITIAL_RECENT_SEARCHES = ['dashboard', 'react project', 'workout', 'client sync', 'lab report'];

// Highlight matching query text with distinct color & pill background
function highlightMatch(text, query) {
  if (!text || !query || !query.trim()) return text;
  const q = query.trim();
  const escaped = q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const regex = new RegExp(`(${escaped})`, 'gi');
  const parts = String(text).split(regex);

  if (parts.length === 1) return text;

  return parts.map((part, i) =>
    part.toLowerCase() === q.toLowerCase() ? (
      <span
        key={i}
        style={{
          color: 'var(--primary-color)',
          background: 'rgba(var(--primary-rgb, 16, 185, 129), 0.22)',
          fontWeight: 800,
          borderRadius: '3px',
          padding: '0 2px',
        }}
      >
        {part}
      </span>
    ) : (
      part
    )
  );
}

export function GlobalSearchModal({ isOpen, onClose }) {
  const navigate = useNavigate();
  const {
    tasks = [],
    categories = [],
    events = [],
    goals = [],
    dailyReports = [],
    openModal,
  } = useApp();

  const [query, setQuery] = useState('');
  const [activeTab, setActiveTab] = useState('all'); // 'all', 'tasks', 'goals', 'categories', 'events', 'reports'
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [recentSearches, setRecentSearches] = useState(() => {
    try {
      const saved = localStorage.getItem(RECENT_SEARCHES_KEY);
      return saved ? JSON.parse(saved) : INITIAL_RECENT_SEARCHES;
    } catch {
      return INITIAL_RECENT_SEARCHES;
    }
  });

  const [recentlyViewed, setRecentlyViewed] = useState(() => {
    try {
      const saved = localStorage.getItem(RECENTLY_VIEWED_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const inputRef = useRef(null);
  const resultsListRef = useRef(null);

  // Focus input when modal opens
  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setSelectedIndex(0);
      setTimeout(() => {
        if (inputRef.current) inputRef.current.focus();
      }, 50);
    }
  }, [isOpen]);

  // Persist recent searches
  const addRecentSearch = (text) => {
    const trimmed = text.trim();
    if (!trimmed) return;
    setRecentSearches((prev) => {
      const filtered = prev.filter((item) => item.toLowerCase() !== trimmed.toLowerCase());
      const updated = [trimmed, ...filtered].slice(0, 6);
      try {
        localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(updated));
      } catch (err) {
        console.error(err);
      }
      return updated;
    });
  };

  const removeRecentSearch = (e, text) => {
    e.stopPropagation();
    setRecentSearches((prev) => {
      const updated = prev.filter((item) => item !== text);
      try {
        localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(updated));
      } catch (err) {
        console.error(err);
      }
      return updated;
    });
  };

  const clearAllRecentSearches = () => {
    setRecentSearches([]);
    try {
      localStorage.removeItem(RECENT_SEARCHES_KEY);
    } catch (err) {
      console.error(err);
    }
  };

  // Persist recently viewed items
  const addRecentlyViewed = (item) => {
    setRecentlyViewed((prev) => {
      const filtered = prev.filter((i) => !(i.id === item.id && i.type === item.type));
      const updated = [item, ...filtered].slice(0, 5);
      try {
        localStorage.setItem(RECENTLY_VIEWED_KEY, JSON.stringify(updated));
      } catch (err) {
        console.error(err);
      }
      return updated;
    });
  };

  // Calculate search matches across entities
  const q = query.trim().toLowerCase();

  const matchingTasks = useMemo(() => {
    if (!q) return tasks.slice(0, 6);
    return tasks.filter((t) => {
      const titleMatch = t.title?.toLowerCase().includes(q);
      const descMatch = t.description?.toLowerCase().includes(q);
      const cat = categories.find((c) => c.id === t.categoryId);
      const catMatch = cat?.name?.toLowerCase().includes(q);
      return titleMatch || descMatch || catMatch;
    });
  }, [tasks, categories, q]);

  const matchingGoals = useMemo(() => {
    if (!q) return goals.slice(0, 4);
    return goals.filter((g) => {
      const titleMatch = g.title?.toLowerCase().includes(q);
      const descMatch = g.description?.toLowerCase().includes(q);
      const catMatch = g.category?.toLowerCase().includes(q);
      return titleMatch || descMatch || catMatch;
    });
  }, [goals, q]);

  const matchingCategories = useMemo(() => {
    if (!q) return categories.slice(0, 4);
    return categories.filter((c) => {
      const nameMatch = c.name?.toLowerCase().includes(q);
      const descMatch = c.description?.toLowerCase().includes(q);
      return nameMatch || descMatch;
    });
  }, [categories, q]);

  const matchingEvents = useMemo(() => {
    if (!q) return events.slice(0, 4);
    return events.filter((e) => {
      const titleMatch = e.title?.toLowerCase().includes(q);
      const descMatch = e.description?.toLowerCase().includes(q);
      return titleMatch || descMatch;
    });
  }, [events, q]);

  const matchingReports = useMemo(() => {
    if (!q) return dailyReports.slice(0, 4);
    return dailyReports.filter((r) => {
      const dateMatch = r.date?.toLowerCase().includes(q);
      const accMatch = r.accomplishments?.toLowerCase().includes(q);
      const hlMatch = r.highlights?.toLowerCase().includes(q);
      const blMatch = r.blockers?.toLowerCase().includes(q);
      return dateMatch || accMatch || hlMatch || blMatch;
    });
  }, [dailyReports, q]);

  // Unified items list based on active tab
  const displayedItems = useMemo(() => {
    const list = [];

    if (activeTab === 'all' || activeTab === 'tasks') {
      matchingTasks.forEach((t) => {
        const cat = categories.find((c) => c.id === t.categoryId);
        list.push({
          id: t.id,
          type: 'task',
          raw: t,
          title: t.title,
          subtitle: `${t.date || 'Today'} ${t.startTime ? `• ${t.startTime} - ${t.endTime}` : ''} ${cat ? `• ${cat.name}` : ''}`,
          badgeText: t.status === 'completed' ? 'Completed' : t.status === 'pending' ? 'Pending' : t.status,
          badgeColor: t.status === 'completed' ? '#10B981' : t.status === 'pending' ? '#F59E0B' : 'var(--text-muted)',
          badgeBg: t.status === 'completed' ? 'rgba(16, 185, 129, 0.12)' : t.status === 'pending' ? 'rgba(245, 158, 11, 0.12)' : 'var(--card-hover)',
          icon: CheckSquare,
          iconColor: '#10B981',
          iconBg: 'rgba(16, 185, 129, 0.14)',
        });
      });
    }

    if (activeTab === 'all' || activeTab === 'goals') {
      matchingGoals.forEach((g) => {
        list.push({
          id: g.id,
          type: 'goal',
          raw: g,
          title: g.title,
          subtitle: `${g.category || 'General'} • Target: ${g.targetDate || 'Ongoing'}`,
          badgeText: `${g.progress || 0}%`,
          badgeColor: '#3B82F6',
          badgeBg: 'rgba(59, 130, 246, 0.12)',
          icon: Target,
          iconColor: '#3B82F6',
          iconBg: 'rgba(59, 130, 246, 0.14)',
        });
      });
    }

    if (activeTab === 'all' || activeTab === 'categories') {
      matchingCategories.forEach((c) => {
        list.push({
          id: c.id,
          type: 'category',
          raw: c,
          title: c.name,
          subtitle: c.description || 'Category workspace',
          badgeText: 'Category',
          badgeColor: c.color || 'var(--primary-color)',
          badgeBg: `${c.color || 'var(--primary-color)'}22`,
          icon: Folder,
          iconColor: c.color || 'var(--primary-color)',
          iconBg: `${c.color || 'var(--primary-color)'}22`,
        });
      });
    }

    if (activeTab === 'all' || activeTab === 'events') {
      matchingEvents.forEach((e) => {
        list.push({
          id: e.id,
          type: 'event',
          raw: e,
          title: e.title,
          subtitle: `${e.date || ''} ${e.startTime ? `• ${e.startTime}` : ''}`,
          badgeText: 'Event',
          badgeColor: '#8B5CF6',
          badgeBg: 'rgba(139, 92, 246, 0.12)',
          icon: Calendar,
          iconColor: '#8B5CF6',
          iconBg: 'rgba(139, 92, 246, 0.14)',
        });
      });
    }

    if (activeTab === 'all' || activeTab === 'reports') {
      matchingReports.forEach((r) => {
        list.push({
          id: r.id || r.date,
          type: 'report',
          raw: r,
          title: `Daily Work Report (${formatDate(r.date, { month: 'short', day: 'numeric', year: 'numeric' })})`,
          subtitle: `${r.hoursLogged || '7.0'} hrs logged • ${r.mood || 'productive'}`,
          badgeText: `${r.hoursLogged || '7.0'} hrs`,
          badgeColor: '#F59E0B',
          badgeBg: 'rgba(245, 158, 11, 0.12)',
          icon: FileText,
          iconColor: '#F59E0B',
          iconBg: 'rgba(245, 158, 11, 0.14)',
        });
      });
    }

    return list;
  }, [activeTab, matchingTasks, matchingGoals, matchingCategories, matchingEvents, matchingReports, categories]);

  // Handle Item Execution (Open/Navigate)
  const handleSelectItem = (item) => {
    if (query.trim()) {
      addRecentSearch(query.trim());
    }

    addRecentlyViewed({
      id: item.id,
      type: item.type,
      title: item.title,
      badgeText: item.badgeText,
      badgeColor: item.badgeColor,
      badgeBg: item.badgeBg,
      raw: item.raw,
    });

    onClose();

    // Route or open modal
    if (item.type === 'task') {
      openModal('task', item.raw);
    } else if (item.type === 'goal') {
      navigate('/goals');
      openModal('goal', item.raw);
    } else if (item.type === 'category') {
      navigate('/categories');
    } else if (item.type === 'event') {
      openModal('event', item.raw);
    } else if (item.type === 'report') {
      navigate('/reports');
    }
  };

  // Keyboard navigation
  const tabsList = ['all', 'tasks', 'goals', 'categories', 'events', 'reports'];

  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
        return;
      }

      // Shift + ArrowLeft/Right to switch tab
      if (e.shiftKey && (e.key === 'ArrowRight' || e.key === 'ArrowLeft')) {
        e.preventDefault();
        const currentIdx = tabsList.indexOf(activeTab);
        let nextIdx = e.key === 'ArrowRight' ? currentIdx + 1 : currentIdx - 1;
        if (nextIdx >= tabsList.length) nextIdx = 0;
        if (nextIdx < 0) nextIdx = tabsList.length - 1;
        setActiveTab(tabsList[nextIdx]);
        setSelectedIndex(0);
        return;
      }

      // Arrow navigation inside results list
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex((prev) => (prev < displayedItems.length - 1 ? prev + 1 : 0));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex((prev) => (prev > 0 ? prev - 1 : displayedItems.length - 1));
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (displayedItems[selectedIndex]) {
          handleSelectItem(displayedItems[selectedIndex]);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, displayedItems, selectedIndex, activeTab, tabsList]);

  // Keep selected item in view
  useEffect(() => {
    if (resultsListRef.current) {
      const activeEl = resultsListRef.current.querySelector('.global-search-item.active');
      if (activeEl) {
        activeEl.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
      }
    }
  }, [selectedIndex]);

  if (!isOpen) return null;

  const totalResults =
    matchingTasks.length +
    matchingGoals.length +
    matchingCategories.length +
    matchingEvents.length +
    matchingReports.length;

  return (
    <div className="modal-backdrop" onClick={onClose} style={{ zIndex: 9999, padding: '24px 16px' }}>
      <div
        className="global-search-modal"
        onClick={(e) => e.stopPropagation()}
        style={{
          background: 'var(--card-bg)',
          borderRadius: '16px',
          border: '1.5px solid var(--border-color)',
          boxShadow: '0 25px 60px -15px rgba(0, 0, 0, 0.45), 0 0 0 1px var(--border-color)',
          width: '100%',
          maxWidth: '780px',
          maxHeight: '85vh',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          animation: 'fadeInUp 0.18s ease-out',
        }}
      >
        {/* Top Search Input Bar */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            padding: '16px 20px',
            borderBottom: '1px solid var(--border-color)',
            gap: '12px',
            background: 'var(--card-bg)',
          }}
        >
          <Search size={20} color="var(--primary-color)" style={{ flexShrink: 0 }} />
          <input
            ref={inputRef}
            type="text"
            placeholder="Search tasks, goals, categories, reports, meetings..."
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelectedIndex(0);
            }}
            style={{
              width: '100%',
              background: 'transparent',
              border: 'none',
              outline: 'none',
              fontSize: '1.05rem',
              color: 'var(--text-primary)',
              fontWeight: 500,
            }}
          />
          {query && (
            <button
              type="button"
              onClick={() => {
                setQuery('');
                if (inputRef.current) inputRef.current.focus();
              }}
              style={{
                background: 'var(--card-hover)',
                border: 'none',
                borderRadius: '50%',
                width: '24px',
                height: '24px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--text-muted)',
                cursor: 'pointer',
                flexShrink: 0,
              }}
              title="Clear search"
            >
              <X size={14} />
            </button>
          )}
          <button
            type="button"
            onClick={onClose}
            className="btn-icon"
            style={{ width: '32px', height: '32px', color: 'var(--text-muted)' }}
            title="Close (Esc)"
          >
            <X size={18} />
          </button>
        </div>

        {/* Filter Category Tabs (All, Tasks, Goals, Categories, Events, Reports) */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            padding: '10px 20px',
            borderBottom: '1px solid var(--border-color)',
            background: 'var(--page-bg)',
            overflowX: 'auto',
          }}
        >
          {[
            { id: 'all', label: `All (${totalResults})` },
            { id: 'tasks', label: `Tasks (${matchingTasks.length})` },
            { id: 'goals', label: `Goals (${matchingGoals.length})` },
            { id: 'categories', label: `Categories (${matchingCategories.length})` },
            { id: 'events', label: `Events (${matchingEvents.length})` },
            { id: 'reports', label: `Reports (${matchingReports.length})` },
          ].map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => {
                  setActiveTab(tab.id);
                  setSelectedIndex(0);
                }}
                style={{
                  background: isActive ? 'var(--card-bg)' : 'transparent',
                  color: isActive ? 'var(--primary-color)' : 'var(--text-secondary)',
                  border: isActive ? '1.5px solid var(--primary-color)' : '1px solid transparent',
                  borderRadius: 'var(--radius-full)',
                  padding: '4px 12px',
                  fontSize: '0.78rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                  boxShadow: isActive ? '0 1px 4px rgba(0,0,0,0.08)' : 'none',
                  transition: 'all 0.15s ease',
                }}
              >
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* 2-Column Content Body */}
        <div style={{ display: 'grid', gridTemplateColumns: '1.45fr 1fr', flex: 1, minHeight: '360px', maxHeight: '460px' }}>
          {/* Left Column: Matching Search Results */}
          <div
            ref={resultsListRef}
            style={{
              padding: '14px 16px',
              overflowY: 'auto',
              borderRight: '1px solid var(--border-color)',
              display: 'flex',
              flexDirection: 'column',
              gap: '6px',
            }}
          >
            {/* Group Header */}
            <div style={{ fontSize: '0.74rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em', padding: '4px 8px 6px' }}>
              {activeTab === 'all' ? `All Results (${displayedItems.length})` : `${activeTab.toUpperCase()} (${displayedItems.length})`}
            </div>

            {displayedItems.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px 16px', color: 'var(--text-muted)' }}>
                <Search size={28} style={{ opacity: 0.35, marginBottom: '8px' }} />
                <div style={{ fontSize: '0.9rem', fontWeight: 600 }}>No results found</div>
                <div style={{ fontSize: '0.78rem', marginTop: '4px' }}>
                  No matching {activeTab === 'all' ? 'items' : activeTab} for "{query}"
                </div>
              </div>
            ) : (
              displayedItems.map((item, idx) => {
                const isSelected = selectedIndex === idx;
                const IconComp = item.icon;

                return (
                  <div
                    key={`${item.type}-${item.id}`}
                    className={`global-search-item ${isSelected ? 'active' : ''}`}
                    onClick={() => handleSelectItem(item)}
                    onMouseEnter={() => setSelectedIndex(idx)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '8px 12px',
                      borderRadius: 'var(--radius-md)',
                      background: isSelected ? 'var(--card-hover)' : 'transparent',
                      border: isSelected ? '1px solid var(--border-color)' : '1px solid transparent',
                      cursor: 'pointer',
                      transition: 'all 0.12s ease',
                      gap: '12px',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0, flex: 1 }}>
                      {/* Icon */}
                      <div
                        style={{
                          width: '32px',
                          height: '32px',
                          borderRadius: '8px',
                          background: item.iconBg,
                          color: item.iconColor,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          flexShrink: 0,
                        }}
                      >
                        <IconComp size={16} />
                      </div>

                      {/* Title & Subtitle */}
                      <div style={{ minWidth: 0, flex: 1 }}>
                        <div
                          style={{
                            fontSize: '0.86rem',
                            fontWeight: 700,
                            color: 'var(--text-primary)',
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                          }}
                        >
                          {highlightMatch(item.title, query)}
                        </div>
                        <div
                          style={{
                            fontSize: '0.74rem',
                            color: 'var(--text-secondary)',
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            marginTop: '1px',
                          }}
                        >
                          {highlightMatch(item.subtitle, query)}
                        </div>
                      </div>
                    </div>

                    {/* Status Badge */}
                    <span
                      style={{
                        fontSize: '0.7rem',
                        fontWeight: 700,
                        padding: '3px 8px',
                        borderRadius: 'var(--radius-full)',
                        background: item.badgeBg,
                        color: item.badgeColor,
                        flexShrink: 0,
                        textTransform: 'capitalize',
                      }}
                    >
                      {item.badgeText}
                    </span>
                  </div>
                );
              })
            )}
          </div>

          {/* Right Column: Recent Searches & Recently Viewed */}
          <div
            style={{
              padding: '16px 18px',
              overflowY: 'auto',
              background: 'var(--page-bg)',
              display: 'flex',
              flexDirection: 'column',
              gap: '20px',
            }}
          >
            {/* Recent Searches */}
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span style={{ fontSize: '0.82rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                  Recent Searches
                </span>
                {recentSearches.length > 0 && (
                  <button
                    type="button"
                    onClick={clearAllRecentSearches}
                    style={{
                      background: 'transparent',
                      border: 'none',
                      color: 'var(--primary-color)',
                      fontSize: '0.74rem',
                      fontWeight: 600,
                      cursor: 'pointer',
                      padding: 0,
                    }}
                  >
                    Clear all
                  </button>
                )}
              </div>

              {recentSearches.length === 0 ? (
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>No recent searches.</div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  {recentSearches.map((item, idx) => (
                    <div
                      key={idx}
                      onClick={() => {
                        setQuery(item);
                        if (inputRef.current) inputRef.current.focus();
                      }}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '6px 10px',
                        borderRadius: 'var(--radius-sm)',
                        cursor: 'pointer',
                        color: 'var(--text-primary)',
                        fontSize: '0.82rem',
                        transition: 'background 0.12s ease',
                      }}
                      className="global-search-subitem"
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', overflow: 'hidden' }}>
                        <Search size={13} color="var(--text-muted)" style={{ flexShrink: 0 }} />
                        <span style={{ textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                          {item}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={(e) => removeRecentSearch(e, item)}
                        style={{
                          background: 'transparent',
                          border: 'none',
                          color: 'var(--text-muted)',
                          cursor: 'pointer',
                          padding: '2px',
                        }}
                      >
                        <X size={12} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Recently Viewed */}
            <div>
              <div style={{ fontSize: '0.82rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '8px' }}>
                Recently Viewed
              </div>

              {recentlyViewed.length === 0 ? (
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  Items you inspect or open will appear here for fast access.
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  {recentlyViewed.map((item, idx) => (
                    <div
                      key={idx}
                      onClick={() => handleSelectItem(item)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '6px 10px',
                        borderRadius: 'var(--radius-sm)',
                        cursor: 'pointer',
                        color: 'var(--text-primary)',
                        fontSize: '0.82rem',
                        transition: 'background 0.12s ease',
                        gap: '8px',
                      }}
                      className="global-search-subitem"
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0, flex: 1 }}>
                        <Eye size={13} color="var(--text-muted)" style={{ flexShrink: 0 }} />
                        <span
                          style={{
                            textOverflow: 'ellipsis',
                            overflow: 'hidden',
                            whiteSpace: 'nowrap',
                            fontSize: '0.8rem',
                            fontWeight: 600,
                          }}
                        >
                          {item.title}
                        </span>
                      </div>
                      <span
                        style={{
                          fontSize: '0.68rem',
                          padding: '2px 6px',
                          borderRadius: 'var(--radius-sm)',
                          background: item.badgeBg || 'var(--card-hover)',
                          color: item.badgeColor || 'var(--text-secondary)',
                          flexShrink: 0,
                          textTransform: 'capitalize',
                        }}
                      >
                        {item.type}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Bottom Tip / Keyboard Shortcuts Footer */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '10px 20px',
            background: 'var(--card-bg)',
            borderTop: '1px solid var(--border-color)',
            fontSize: '0.76rem',
            color: 'var(--text-muted)',
            flexWrap: 'wrap',
            gap: '8px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flexWrap: 'wrap' }}>
            <span>
              <strong style={{ color: 'var(--text-primary)' }}>Tip:</strong>
            </span>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
              <kbd className="kbd-shortcut">↑</kbd> <kbd className="kbd-shortcut">↓</kbd> navigate
            </span>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
              <kbd className="kbd-shortcut">Shift</kbd> + <kbd className="kbd-shortcut">←</kbd> <kbd className="kbd-shortcut">→</kbd> switch tab
            </span>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
              <kbd className="kbd-shortcut">Enter</kbd> select
            </span>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
              <kbd className="kbd-shortcut">Esc</kbd> close
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Sparkles size={12} color="var(--primary-color)" />
            <span>Instant workspace search</span>
          </div>
        </div>
      </div>
    </div>
  );
}
