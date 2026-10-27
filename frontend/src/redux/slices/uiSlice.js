import { createSlice } from '@reduxjs/toolkit';
import { storageService } from '../../services/storageService';

const initialNotifications = storageService.getNotifications();
const initialSettings = storageService.getSettings();

const uiSlice = createSlice({
  name: 'ui',
  initialState: {
    activeModal: null, // { type: 'task' | 'category' | 'goal' | 'event', data: null }
    mobileSidebarOpen: false,
    globalSearchQuery: '',
    toasts: [],
    notifications: initialNotifications,
    settings: initialSettings,
  },
  reducers: {
    openModal: (state, action) => {
      const { type, data = null } = action.payload;
      state.activeModal = { type, data };
    },
    closeModal: (state) => {
      state.activeModal = null;
    },
    setMobileSidebarOpen: (state, action) => {
      state.mobileSidebarOpen = action.payload;
    },
    setGlobalSearchQuery: (state, action) => {
      state.globalSearchQuery = action.payload;
    },
    addToast: (state, action) => {
      state.toasts.push(action.payload);
    },
    removeToast: (state, action) => {
      state.toasts = state.toasts.filter((t) => t.id !== action.payload);
    },
    addNotification: (state, action) => {
      const newNotif = {
        id: `notif-${Date.now()}`,
        read: false,
        time: 'Just now',
        ...action.payload,
      };
      state.notifications.unshift(newNotif);
      storageService.saveNotifications(state.notifications);
    },
    markNotificationRead: (state, action) => {
      const notif = state.notifications.find((n) => n.id === action.payload);
      if (notif) {
        notif.read = true;
        storageService.saveNotifications(state.notifications);
      }
    },
    clearNotifications: (state) => {
      state.notifications = [];
      storageService.saveNotifications([]);
    },
    updateSettings: (state, action) => {
      const payload = typeof action.payload === 'function' ? action.payload(state.settings) : action.payload;
      state.settings = { ...state.settings, ...payload };
      storageService.saveSettings(state.settings);
    },
  },
});

export const {
  openModal,
  closeModal,
  setMobileSidebarOpen,
  setGlobalSearchQuery,
  addToast,
  removeToast,
  addNotification,
  markNotificationRead,
  clearNotifications,
  updateSettings,
} = uiSlice.actions;

export default uiSlice.reducer;
