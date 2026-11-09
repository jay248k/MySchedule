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
import { cookieUtils, purgeLegacyLocalStorage } from '../utils/cookieUtils';

// Immediately purge any legacy static data from browser localStorage on load
purgeLegacyLocalStorage();

/**
 * In-memory fallback store
 * Application data (tasks, categories, reports, goals) is stored in Neon PostgreSQL
 * and held in active Redux/Context state during runtime - NOT dumped into browser localStorage.
 */
const inMemoryStore = {
  tasks: [],
  categories: [],
  events: [],
  goals: [],
  settings: initialSettings,
  notifications: [],
  dailyReports: [],
  workSessions: [],
  activeWorkSession: null,
  deviations: [],
  requests: [],
  importHistory: [],
  workChains: {},
};

export const storageService = {
  getTasks() {
    return inMemoryStore.tasks || [];
  },

  saveTasks(tasks) {
    inMemoryStore.tasks = tasks || [];
  },

  getCategories() {
    return inMemoryStore.categories || [];
  },

  saveCategories(categories) {
    inMemoryStore.categories = categories || [];
  },

  getEvents() {
    return inMemoryStore.events || [];
  },

  saveEvents(events) {
    inMemoryStore.events = events || [];
  },

  getGoals() {
    return inMemoryStore.goals || [];
  },

  saveGoals(goals) {
    inMemoryStore.goals = goals || [];
  },

  getTheme() {
    try {
      const cookieTheme = cookieUtils.get('myschedule_theme');
      if (cookieTheme) return cookieTheme;
      const cookieSettings = cookieUtils.getJSON('myschedule_user_settings');
      if (cookieSettings && cookieSettings.theme) return cookieSettings.theme;
    } catch {
      // Fallback
    }
    return null;
  },

  getSettings() {
    try {
      const themeOverride = this.getTheme();
      const cookieSettings = cookieUtils.getJSON('myschedule_user_settings');
      if (cookieSettings && typeof cookieSettings === 'object') {
        const res = { ...initialSettings, ...cookieSettings };
        if (themeOverride) res.theme = themeOverride;
        return res;
      }
    } catch {
      // Fallback
    }
    const fallback = inMemoryStore.settings || initialSettings;
    const themeOverride = this.getTheme();
    return themeOverride ? { ...fallback, theme: themeOverride } : fallback;
  },

  saveSettings(settings) {
    const updated = { ...initialSettings, ...(settings || {}) };
    inMemoryStore.settings = updated;
    try {
      purgeLegacyLocalStorage();
      cookieUtils.setJSON('myschedule_user_settings', updated, 365);
      if (updated.theme) {
        cookieUtils.set('myschedule_theme', updated.theme, 365);
      }
    } catch {
      // Storage fallback
    }
  },

  getNotifications() {
    return inMemoryStore.notifications || [];
  },

  saveNotifications(notifications) {
    inMemoryStore.notifications = notifications || [];
  },

  getUser() {
    // User profile is stored in Cookies
    return cookieUtils.getJSON('myschedule_auth_user') || null;
  },

  saveUser(user) {
    if (user) {
      cookieUtils.setJSON('myschedule_auth_user', user, 30);
    } else {
      cookieUtils.remove('myschedule_auth_user');
    }
  },

  getDailyReports() {
    return inMemoryStore.dailyReports || [];
  },

  saveDailyReports(reports) {
    inMemoryStore.dailyReports = reports || [];
  },

  getWorkSessions() {
    return inMemoryStore.workSessions || [];
  },

  saveWorkSessions(sessions) {
    inMemoryStore.workSessions = sessions || [];
  },

  getActiveWorkSession() {
    return inMemoryStore.activeWorkSession || null;
  },

  saveActiveWorkSession(active) {
    inMemoryStore.activeWorkSession = active || null;
  },

  getDeviations() {
    return inMemoryStore.deviations || [];
  },

  saveDeviations(deviations) {
    inMemoryStore.deviations = deviations || [];
  },

  getRequests() {
    return inMemoryStore.requests || [];
  },

  saveRequests(requests) {
    inMemoryStore.requests = requests || [];
  },

  getImportHistory() {
    return inMemoryStore.importHistory || [];
  },

  saveImportHistory(history) {
    inMemoryStore.importHistory = history || [];
  },

  getWorkChains() {
    return inMemoryStore.workChains || {};
  },

  saveWorkChains(chains) {
    inMemoryStore.workChains = chains || {};
  },

  resetAllToSampleData() {
    inMemoryStore.tasks = getInitialTasks();
    inMemoryStore.categories = initialCategories;
    inMemoryStore.events = getInitialEvents();
    inMemoryStore.goals = getInitialGoals();
    inMemoryStore.settings = initialSettings;
    inMemoryStore.notifications = initialNotifications;
    inMemoryStore.dailyReports = getInitialDailyReports();

    return {
      tasks: inMemoryStore.tasks,
      categories: inMemoryStore.categories,
      events: inMemoryStore.events,
      goals: inMemoryStore.goals,
      settings: inMemoryStore.settings,
      notifications: inMemoryStore.notifications,
      user: this.getUser(),
      dailyReports: inMemoryStore.dailyReports,
    };
  },

  clearAllData() {
    inMemoryStore.tasks = [];
    inMemoryStore.categories = [];
    inMemoryStore.events = [];
    inMemoryStore.goals = [];
    inMemoryStore.notifications = [];
    inMemoryStore.dailyReports = [];
    inMemoryStore.workSessions = [];
    inMemoryStore.activeWorkSession = null;
    inMemoryStore.deviations = [];
    inMemoryStore.requests = [];
    inMemoryStore.importHistory = [];
    inMemoryStore.workChains = {};
    purgeLegacyLocalStorage();
  },
};
