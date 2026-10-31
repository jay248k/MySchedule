import {
  initialCategories,
  getInitialTasks,
  getInitialEvents,
  getInitialGoals,
  initialSettings,
  initialNotifications,
  initialUserProfile,
  getInitialDailyReports,
} from '../data/demoData';

const KEYS = {
  TASKS: 'my_schedule_tasks',
  CATEGORIES: 'my_schedule_categories',
  EVENTS: 'my_schedule_events',
  GOALS: 'my_schedule_goals',
  SETTINGS: 'my_schedule_settings',
  NOTIFICATIONS: 'my_schedule_notifications',
  USER: 'my_schedule_user',
  DAILY_REPORTS: 'my_schedule_daily_reports',
  WORK_SESSIONS: 'my_schedule_work_sessions',
  ACTIVE_WORK_SESSION: 'my_schedule_active_work_session',
  DEVIATIONS: 'my_schedule_deviations',
  REQUESTS: 'my_schedule_work_requests',
  IMPORT_HISTORY: 'my_schedule_import_history',
  WORK_CHAIN: 'my_schedule_work_chain',
};

export const storageService = {
  getTasks() {
    try {
      const data = localStorage.getItem(KEYS.TASKS);
      if (!data) {
        const initial = getInitialTasks();
        this.saveTasks(initial);
        return initial;
      }
      return JSON.parse(data);
    } catch {
      return getInitialTasks();
    }
  },

  saveTasks(tasks) {
    try {
      localStorage.setItem(KEYS.TASKS, JSON.stringify(tasks));
    } catch (e) {
      console.error('Failed to save tasks to localStorage', e);
    }
  },

  getCategories() {
    try {
      const data = localStorage.getItem(KEYS.CATEGORIES);
      if (!data) {
        this.saveCategories(initialCategories);
        return initialCategories;
      }
      return JSON.parse(data);
    } catch {
      return initialCategories;
    }
  },

  saveCategories(categories) {
    try {
      localStorage.setItem(KEYS.CATEGORIES, JSON.stringify(categories));
    } catch (e) {
      console.error('Failed to save categories', e);
    }
  },

  getEvents() {
    try {
      const data = localStorage.getItem(KEYS.EVENTS);
      if (!data) {
        const initial = getInitialEvents();
        this.saveEvents(initial);
        return initial;
      }
      return JSON.parse(data);
    } catch {
      return getInitialEvents();
    }
  },

  saveEvents(events) {
    try {
      localStorage.setItem(KEYS.EVENTS, JSON.stringify(events));
    } catch (e) {
      console.error('Failed to save events', e);
    }
  },

  getGoals() {
    try {
      const data = localStorage.getItem(KEYS.GOALS);
      if (!data) {
        const initial = getInitialGoals();
        this.saveGoals(initial);
        return initial;
      }
      return JSON.parse(data);
    } catch {
      return getInitialGoals();
    }
  },

  saveGoals(goals) {
    try {
      localStorage.setItem(KEYS.GOALS, JSON.stringify(goals));
    } catch (e) {
      console.error('Failed to save goals', e);
    }
  },

  getSettings() {
    try {
      const data = localStorage.getItem(KEYS.SETTINGS);
      if (!data) {
        this.saveSettings(initialSettings);
        return initialSettings;
      }
      return { ...initialSettings, ...JSON.parse(data) };
    } catch {
      return initialSettings;
    }
  },

  saveSettings(settings) {
    try {
      localStorage.setItem(KEYS.SETTINGS, JSON.stringify(settings));
    } catch (e) {
      console.error('Failed to save settings', e);
    }
  },

  getNotifications() {
    try {
      const data = localStorage.getItem(KEYS.NOTIFICATIONS);
      if (!data) {
        this.saveNotifications(initialNotifications);
        return initialNotifications;
      }
      return JSON.parse(data);
    } catch {
      return initialNotifications;
    }
  },

  saveNotifications(notifications) {
    try {
      localStorage.setItem(KEYS.NOTIFICATIONS, JSON.stringify(notifications));
    } catch (e) {
      console.error('Failed to save notifications', e);
    }
  },

  getUser() {
    try {
      const data = localStorage.getItem(KEYS.USER);
      if (!data) {
        this.saveUser(initialUserProfile);
        return initialUserProfile;
      }
      return JSON.parse(data);
    } catch {
      return initialUserProfile;
    }
  },

  saveUser(user) {
    try {
      localStorage.setItem(KEYS.USER, JSON.stringify(user));
    } catch (e) {
      console.error('Failed to save user profile', e);
    }
  },

  getDailyReports() {
    try {
      const data = localStorage.getItem(KEYS.DAILY_REPORTS);
      if (!data) {
        const initial = getInitialDailyReports();
        this.saveDailyReports(initial);
        return initial;
      }
      return JSON.parse(data);
    } catch {
      return getInitialDailyReports();
    }
  },

  saveDailyReports(reports) {
    try {
      localStorage.setItem(KEYS.DAILY_REPORTS, JSON.stringify(reports));
    } catch (e) {
      console.error('Failed to save daily reports to localStorage', e);
    }
  },

  getWorkSessions() {
    try {
      const data = localStorage.getItem(KEYS.WORK_SESSIONS);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  },

  saveWorkSessions(sessions) {
    try {
      localStorage.setItem(KEYS.WORK_SESSIONS, JSON.stringify(sessions));
    } catch (e) {
      console.error('Failed to save work sessions', e);
    }
  },

  getActiveWorkSession() {
    try {
      const data = localStorage.getItem(KEYS.ACTIVE_WORK_SESSION);
      return data ? JSON.parse(data) : null;
    } catch {
      return null;
    }
  },

  saveActiveWorkSession(active) {
    try {
      if (active) {
        localStorage.setItem(KEYS.ACTIVE_WORK_SESSION, JSON.stringify(active));
      } else {
        localStorage.removeItem(KEYS.ACTIVE_WORK_SESSION);
      }
    } catch (e) {
      console.error('Failed to save active work session', e);
    }
  },

  getDeviations() {
    try {
      const data = localStorage.getItem(KEYS.DEVIATIONS);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  },

  saveDeviations(deviations) {
    try {
      localStorage.setItem(KEYS.DEVIATIONS, JSON.stringify(deviations));
    } catch (e) {
      console.error('Failed to save deviations to localStorage', e);
    }
  },

  getRequests() {
    try {
      const data = localStorage.getItem(KEYS.REQUESTS);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  },

  saveRequests(requests) {
    try {
      localStorage.setItem(KEYS.REQUESTS, JSON.stringify(requests));
    } catch (e) {
      console.error('Failed to save requests to localStorage', e);
    }
  },

  resetAllToSampleData() {
    const tasks = getInitialTasks();
    const categories = initialCategories;
    const events = getInitialEvents();
    const goals = getInitialGoals();
    const settings = initialSettings;
    const notifications = initialNotifications;
    const user = initialUserProfile;
    const dailyReports = getInitialDailyReports();

    this.saveTasks(tasks);
    this.saveCategories(categories);
    this.saveEvents(events);
    this.saveGoals(goals);
    this.saveSettings(settings);
    this.saveNotifications(notifications);
    this.saveUser(user);
    this.saveDailyReports(dailyReports);

    return { tasks, categories, events, goals, settings, notifications, user, dailyReports };
  },

  getImportHistory() {
    try {
      const data = localStorage.getItem(KEYS.IMPORT_HISTORY);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  },

  saveImportHistory(history) {
    try {
      localStorage.setItem(KEYS.IMPORT_HISTORY, JSON.stringify(history));
    } catch (e) {
      console.error('Failed to save import history to localStorage', e);
    }
  },

  getWorkChains() {
    try {
      const data = localStorage.getItem(KEYS.WORK_CHAIN);
      return data ? JSON.parse(data) : {};
    } catch {
      return {};
    }
  },

  saveWorkChains(chains) {
    try {
      localStorage.setItem(KEYS.WORK_CHAIN, JSON.stringify(chains));
    } catch (e) {
      console.error('Failed to save work chains to localStorage', e);
    }
  },

  clearAllData() {
    Object.values(KEYS).forEach((k) => localStorage.removeItem(k));
  },
};
