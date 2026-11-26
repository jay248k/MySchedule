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
  AlertTriangle,
  ShieldCheck,
  Sparkles,
  BookOpen,
  Table as TableIcon,
  Lightbulb,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { formatDate } from '../../utils/dateUtils';
import { api } from '../../services/api';
import { cookieUtils } from '../../utils/cookieUtils';

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
    workSessions = [],
    deviations = [],
    requests = [],
    settings = {},
    openModal,
  } = useApp();

  const [query, setQuery] = useState('');
  const [activeTab, setActiveTab] = useState('all'); // 'all', 'tasks', 'knowledge', 'thoughts', 'goals', 'categories', 'events', 'reports'
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [knowledgeItems, setKnowledgeItems] = useState([]);
  const [thoughtsList, setThoughtsList] = useState([]);
  const [recentSearches, setRecentSearches] = useState(() => {
    try {
      const saved = cookieUtils.getJSON(RECENT_SEARCHES_KEY);
      return saved ? saved : INITIAL_RECENT_SEARCHES;
    } catch {
      return INITIAL_RECENT_SEARCHES;
    }
  });

  const [recentlyViewed, setRecentlyViewed] = useState(() => {
    try {
      const saved = cookieUtils.getJSON(RECENTLY_VIEWED_KEY);
      return saved ? saved : [];
    } catch {
      return [];
    }
  });

  const inputRef = useRef(null);
  const resultsListRef = useRef(null);

  // Focus input and fetch knowledge & thoughts when modal opens
  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setSelectedIndex(0);
      setTimeout(() => {
        if (inputRef.current) inputRef.current.focus();
      }, 50);

      // Pre-fetch knowledge items
      api.getKnowledgeItems().then((res) => {
        const list = Array.isArray(res) ? res : Array.isArray(res?.data) ? res.data : [];
        setKnowledgeItems(list);
      }).catch((err) => {
        console.warn('Search: failed to load knowledge items', err);
      });

      // Pre-fetch thoughts
      api.getThoughts().then((res) => {
        const list = Array.isArray(res) ? res : Array.isArray(res?.data) ? res.data : [];
        setThoughtsList(list);
      }).catch((err) => {
        console.warn('Search: failed to load thoughts', err);
      });
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
        cookieUtils.setJSON(RECENT_SEARCHES_KEY, updated, 30);
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
        cookieUtils.setJSON(RECENT_SEARCHES_KEY, updated, 30);
      } catch (err) {
        console.error(err);
      }
      return updated;
    });
  };

  const clearAllRecentSearches = () => {
    setRecentSearches([]);
    try {
      cookieUtils.remove(RECENT_SEARCHES_KEY);
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
        cookieUtils.setJSON(RECENTLY_VIEWED_KEY, updated, 30);
      } catch (err) {
        console.error(err);
      }
      return updated;
    });
  };

  const [searchQuery, setSearchQuery] = useState('');
  const [dbResults, setDbResults] = useState(null);
  const [isSearchingDb, setIsSearchingDb] = useState(false);

  // Debounced API search across database
  useEffect(() => {
    const qTrim = query.trim();
    if (!qTrim || qTrim.length < 2) {
      setDbResults(null);
      return;
    }
    const timer = setTimeout(async () => {
      setIsSearchingDb(true);
      try {
        const res = await api.search(qTrim);
        if (res && res.success && res.results) {
          setDbResults(res.results);
        }
      } catch (err) {
        console.warn('DB search failed:', err);
      } finally {
        setIsSearchingDb(false);
      }
    }, 250);
    return () => clearTimeout(timer);
  }, [query]);

  // Calculate search matches across entities (combining DB results if available)
  const q = query.trim().toLowerCase();

  const matchingTasks = useMemo(() => {
    if (!q) return tasks.slice(0, 6);
    if (dbResults?.tasks) return dbResults.tasks;
    return tasks.filter((t) => {
      const titleMatch = t.title?.toLowerCase().includes(q);
      const descMatch = t.description?.toLowerCase().includes(q);
      const cat = categories.find((c) => c.id === t.categoryId);
      const catMatch = cat?.name?.toLowerCase().includes(q);
      return titleMatch || descMatch || catMatch;
    });
  }, [tasks, categories, q, dbResults]);

  const matchingWorkSessions = useMemo(() => {
    if (!q) return workSessions.slice(0, 6);
    if (dbResults?.workSessions) return dbResults.workSessions;
    return workSessions.filter((s) => {
      const titleMatch = s.taskTitle?.toLowerCase().includes(q);
      const dateMatch = s.date?.toLowerCase().includes(q);
      const startTimeMatch = s.startTime?.toLowerCase().includes(q);
      const endTimeMatch = s.endTime?.toLowerCase().includes(q);
      return titleMatch || dateMatch || startTimeMatch || endTimeMatch;
    });
  }, [workSessions, q, dbResults]);

  const matchingDeviations = useMemo(() => {
    if (!q) return deviations.slice(0, 6);
    if (dbResults?.deviations) return dbResults.deviations;
    return deviations.filter((d) => {
      const titleMatch = d.plannedAction?.toLowerCase().includes(q);
      const actualActionMatch = d.actualAction?.toLowerCase().includes(q);
      const reasonMatch = d.reasonCategory?.toLowerCase().includes(q);
      const dateMatch = d.date?.toLowerCase().includes(q);
      return titleMatch || actualActionMatch || reasonMatch || dateMatch;
    });
  }, [deviations, q, dbResults]);

  const matchingRequests = useMemo(() => {
    if (!q) return requests.slice(0, 6);
    if (dbResults?.requests) return dbResults.requests;
    return requests.filter((r) => {
      const titleMatch = r.title?.toLowerCase().includes(q);
      const reasonMatch = r.reason?.toLowerCase().includes(q);
      const dateMatch = r.date?.toLowerCase().includes(q);
      const startTimeMatch = r.startTime?.toLowerCase().includes(q);
      const endTimeMatch = r.endTime?.toLowerCase().includes(q);
      return titleMatch || reasonMatch || dateMatch || startTimeMatch || endTimeMatch;
    });
  }, [requests, q, dbResults]);

  const matchingSettings = useMemo(() => {
    if (!q) return [];
    return Object.keys(settings).filter((key) => {
      const value = settings[key];
      const keyMatch = key.toLowerCase().includes(q);
      const valueMatch = typeof value === 'string' && value.toLowerCase().includes(q);
      return keyMatch || valueMatch;
    });
  }, [settings, q]);

  const matchingKnowledge = useMemo(() => {
    if (!knowledgeItems || knowledgeItems.length === 0) return [];
    if (!q) return knowledgeItems.slice(0, 6);
    if (dbResults?.knowledge) return dbResults.knowledge;

    const isFolderKeyword = q === 'folder' || q === 'folders' || q === 'directory' || q === 'dir';
    const isLessonKeyword = q === 'lesson' || q === 'lessons' || q === 'note' || q === 'notes' || q === 'guide';
    const isTableKeyword = q === 'table' || q === 'tables' || q === 'sheet' || q === 'sheets' || q === 'csv' || q === 'excel';

    return knowledgeItems.filter((k) => {
      const titleMatch = (k.title || '').toLowerCase().includes(q);
      const contentMatch = (k.content || '').toLowerCase().includes(q);
      const tagsMatch = (k.tags || '').toLowerCase().includes(q);
      const typeMatch = (k.type || '').toLowerCase().includes(q);

      const keywordMatch =
        (isFolderKeyword && k.type === 'folder') ||
        (isLessonKeyword && k.type === 'lesson') ||
        (isTableKeyword && k.type === 'table');

      return titleMatch || contentMatch || tagsMatch || typeMatch || keywordMatch;
    });
  }, [knowledgeItems, q, dbResults]);

  const matchingThoughts = useMemo(() => {
    if (!thoughtsList || thoughtsList.length === 0) return [];
    if (!q) return thoughtsList.slice(0, 6);
    if (dbResults?.thoughts) return dbResults.thoughts;

    const isThoughtKeyword =
      q === 'thought' ||
      q === 'thoughts' ||
      q === 'quote' ||
      q === 'quotes' ||
      q === 'motivation' ||
      q === 'discipline' ||
      q === 'mindset';

    return thoughtsList.filter((t) => {
      const textMatch = (t.text || '').toLowerCase().includes(q);
      const authorMatch = (t.author || '').toLowerCase().includes(q);
      const catMatch = (t.category || '').toLowerCase().includes(q);
      const tagsMatch = (t.tags || '').toLowerCase().includes(q);

      return textMatch || authorMatch || catMatch || tagsMatch || isThoughtKeyword;
    });
  }, [thoughtsList, q, dbResults]);

  const matchingGoals = useMemo(() => {
    if (!q) return goals.slice(0, 4);
    if (dbResults?.goals) return dbResults.goals;
    return goals.filter((g) => {
      const titleMatch = g.title?.toLowerCase().includes(q);
      const descMatch = g.description?.toLowerCase().includes(q);
      const catMatch = g.category?.toLowerCase().includes(q);
      return titleMatch || descMatch || catMatch;
    });
  }, [goals, q, dbResults]);

  const matchingCategories = useMemo(() => {
    if (!q) return categories.slice(0, 4);
    if (dbResults?.categories) return dbResults.categories;
    return categories.filter((c) => {
      const nameMatch = c.name?.toLowerCase().includes(q);
      const descMatch = c.description?.toLowerCase().includes(q);
      return nameMatch || descMatch;
    });
  }, [categories, q, dbResults]);

  const matchingEvents = useMemo(() => {
    if (!q) return events.slice(0, 4);
    if (dbResults?.events) return dbResults.events;
    return events.filter((e) => {
      const titleMatch = e.title?.toLowerCase().includes(q);
      const descMatch = e.description?.toLowerCase().includes(q);
      return titleMatch || descMatch;
    });
  }, [events, q, dbResults]);

  const matchingReports = useMemo(() => {
    if (!q) return dailyReports.slice(0, 4);
    if (dbResults?.reports) return dbResults.reports;
    return dailyReports.filter((r) => {
      const dateMatch = r.date?.toLowerCase().includes(q);
      const accMatch = r.accomplishments?.toLowerCase().includes(q);
      const hlMatch = r.highlights?.toLowerCase().includes(q);
      const blMatch = r.blockers?.toLowerCase().includes(q);
      return dateMatch || accMatch || hlMatch || blMatch;
    });
  }, [dailyReports, q, dbResults]);

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

    if (activeTab === 'all' || activeTab === 'knowledge') {
      matchingKnowledge.forEach((k) => {
        const isFolder = k.type === 'folder';
        const isTable = k.type === 'table';
        const itemType = isFolder ? 'knowledge-folder' : isTable ? 'knowledge-table' : 'knowledge-lesson';
        const IconComp = isFolder ? Folder : isTable ? TableIcon : BookOpen;
        const iconColor = isFolder ? '#F59E0B' : isTable ? '#10B981' : '#3B82F6';
        const iconBg = isFolder
          ? 'rgba(245, 158, 11, 0.14)'
          : isTable
          ? 'rgba(16, 185, 129, 0.14)'
          : 'rgba(59, 130, 246, 0.14)';
        const badgeText = isFolder ? 'Folder' : isTable ? 'Table' : 'Lesson';

        list.push({
          id: `knowledge-${k.id}`,
          type: itemType,
          raw: k,
          title: k.title,
          subtitle: isFolder
            ? `Folder ${k.tags ? `• ${k.tags}` : '• Knowledge Base'}`
            : isTable
            ? `Table ${k.tags ? `• ${k.tags}` : '• Structured data'}`
            : `Lesson ${k.tags ? `• ${k.tags}` : '• Knowledge lesson'}`,
          badgeText,
          badgeColor: iconColor,
          badgeBg: iconBg,
          icon: IconComp,
          iconColor,
          iconBg,
        });
      });
    }

    if (activeTab === 'all' || activeTab === 'thoughts') {
      matchingThoughts.forEach((t) => {
        list.push({
          id: `thought-${t.id}`,
          type: 'thought',
          raw: t,
          title: t.text ? (t.text.length > 75 ? `${t.text.slice(0, 75)}...` : t.text) : 'Motivational Thought',
          subtitle: `— ${t.author || 'Anonymous'} ${t.category ? `• ${t.category}` : ''}`,
          badgeText: t.category || 'Thought',
          badgeColor: '#A855F7',
          badgeBg: 'rgba(168, 85, 247, 0.14)',
          icon: Lightbulb,
          iconColor: '#A855F7',
          iconBg: 'rgba(168, 85, 247, 0.14)',
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

    if (activeTab === 'all' || activeTab === 'workSessions') {
      matchingWorkSessions.forEach((s) => {
        list.push({
          id: s.id,
          type: 'workSession',
          raw: s,
          title: s.taskTitle || 'Work Session',
          subtitle: `${s.date} • ${s.startTime} - ${s.endTime}`,
          badgeText: `${Math.round(s.durationSeconds / 60)} mins`,
          badgeColor: '#6366F1',
          badgeBg: 'rgba(99, 102, 241, 0.12)',
          icon: Clock,
          iconColor: '#6366F1',
          iconBg: 'rgba(99, 102, 241, 0.14)',
        });
      });
    }

    if (activeTab === 'all' || activeTab === 'deviations') {
      matchingDeviations.forEach((d) => {
        list.push({
          id: d.id,
          type: 'deviation',
          raw: d,
          title: d.plannedAction || 'Deviation',
          subtitle: `${d.date} • ${d.startTime} - ${d.endTime}`,
          badgeText: d.reasonCategory,
          badgeColor: '#F59E0B',
          badgeBg: 'rgba(245, 158, 11, 0.12)',
          icon: AlertTriangle,
          iconColor: '#F59E0B',
          iconBg: 'rgba(245, 158, 11, 0.14)',
        });
      });
    }

    if (activeTab === 'all' || activeTab === 'requests') {
      matchingRequests.forEach((r) => {
        list.push({
          id: r.id,
          type: 'request',
          raw: r,
          title: r.title || 'Request',
          subtitle: `${r.date} • ${r.startTime} - ${r.endTime}`,
          badgeText: r.status,
          badgeColor: r.status === 'completed' ? '#10B981' : r.status === 'pending' ? '#F59E0B' : '#8B5CF6',
          badgeBg: r.status === 'completed' ? 'rgba(16, 185, 129, 0.12)' : r.status === 'pending' ? 'rgba(245, 158, 11, 0.12)' : 'rgba(139, 92, 246, 0.12)',
          icon: FileText,
          iconColor: r.status === 'completed' ? '#10B981' : r.status === 'pending' ? '#F59E0B' : '#8B5CF6',
          iconBg: r.status === 'completed' ? 'rgba(16, 185, 129, 0.14)' : r.status === 'pending' ? 'rgba(245, 158, 11, 0.14)' : 'rgba(139, 92, 246, 0.14)',
        });
      });
    }

    if (activeTab === 'all' || activeTab === 'settings') {
      matchingSettings.forEach((key) => {
        list.push({
          id: `setting-${key}`,
          type: 'setting',
          raw: { key, value: settings[key] },
          title: key,
          subtitle: typeof settings[key] === 'string' ? settings[key] : JSON.stringify(settings[key]),
          badgeText: 'Setting',
          badgeColor: '#6B7280',
          badgeBg: 'rgba(107, 114, 128, 0.12)',
          icon: ShieldCheck,
          iconColor: '#6B7280',
          iconBg: 'rgba(107, 114, 128, 0.14)',
        });
      });
    }

    return list;
  }, [activeTab, matchingTasks, matchingKnowledge, matchingThoughts, matchingGoals, matchingCategories, matchingEvents, matchingReports, matchingWorkSessions, matchingDeviations, matchingRequests, matchingSettings, categories]);

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
      navigate(`/goals?goal=${item.raw.id}&t=${Date.now()}`);
      openModal('goal', item.raw);
    } else if (item.type === 'category') {
      navigate(`/categories?category=${item.raw.id}&t=${Date.now()}`);
    } else if (item.type === 'event') {
      openModal('event', item.raw);
    } else if (item.type === 'report') {
      navigate('/reports');
    } else if (item.type === 'knowledge-folder') {
      navigate(`/knowledge?folder=${item.raw.id}`);
    } else if (item.type === 'knowledge-lesson' || item.type === 'knowledge-table') {
      navigate(`/knowledge?item=${item.raw.id}`);
    } else if (item.type === 'thought') {
      navigate(`/thoughts?thought=${item.raw.id}`);
    } else if (item.type === 'workSession') {
      navigate(`/work-tracker?session=${item.raw.id}`);
    } else if (item.type === 'deviation') {
      navigate(`/deviations?deviation=${item.raw.id}`);
    } else if (item.type === 'request') {
      navigate(`/requests?request=${item.raw.id}`);
    } else if (item.type === 'setting') {
      navigate(`/settings`);
    }
  };

  // Keyboard navigation
  const tabsList = ['all', 'tasks', 'knowledge', 'thoughts', 'goals', 'categories', 'events', 'reports', 'workSessions', 'deviations', 'requests', 'settings'];

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
    matchingKnowledge.length +
    matchingThoughts.length +
    matchingGoals.length +
    matchingCategories.length +
    matchingEvents.length +
    matchingReports.length +
    matchingWorkSessions.length +
    matchingDeviations.length +
    matchingRequests.length +
    matchingSettings.length;

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
            placeholder="Search tasks, lessons, folders, thoughts, goals, reports, work sessions, deviations, requests, settings..."
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

        {/* Filter Category Tabs */}
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
            { id: 'knowledge', label: `Lessons (${matchingKnowledge.length})` },
            { id: 'thoughts', label: `Thoughts (${matchingThoughts.length})` },
            { id: 'goals', label: `Goals (${matchingGoals.length})` },
            { id: 'categories', label: `Categories (${matchingCategories.length})` },
            { id: 'events', label: `Events (${matchingEvents.length})` },
            { id: 'reports', label: `Reports (${matchingReports.length})` },
            { id: 'workSessions', label: `Work Sessions (${matchingWorkSessions.length})` },
            { id: 'deviations', label: `Deviations (${matchingDeviations.length})` },
            { id: 'requests', label: `Requests (${matchingRequests.length})` },
            { id: 'settings', label: `Settings (${matchingSettings.length})` },
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
