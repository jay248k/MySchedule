import React, { createContext, useContext, useState, useCallback, useMemo, useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '../redux/hooks';
import {
  openModal as openModalAction,
  closeModal as closeModalAction,
  setMobileSidebarOpen as setMobileSidebarOpenAction,
  setGlobalSearchQuery as setGlobalSearchQueryAction,
  addToast,
  removeToast,
  markNotificationRead as markNotificationReadAction,
  clearNotifications as clearNotificationsAction,
  updateSettings as updateSettingsAction,
} from '../redux/slices/uiSlice';

const UIContext = createContext(null);

// Toast system - can be used outside React components
let toastDispatch = null;
export function setToastDispatch(dispatch) {
  toastDispatch = dispatch;
}

export function showToast({ type = 'info', title = '', message = '' }) {
  if (toastDispatch) {
    const id = Date.now().toString() + Math.random().toString(36).substring(2, 6);
    const newToast = { id, type, title, message };
    toastDispatch(addToast(newToast));
    setTimeout(() => {
      toastDispatch(removeToast(id));
    }, 4000);
  }
}

export function UIProvider({ children }) {
  const dispatch = useAppDispatch();

  // Set toast dispatch for global access
  React.useEffect(() => {
    setToastDispatch(dispatch);
    return () => { setToastDispatch(null); };
  }, [dispatch]);

  // Redux Selectors for UI state
  const settings = useAppSelector((state) => state.ui.settings);
  const notifications = useAppSelector((state) => state.ui.notifications);
  const activeModal = useAppSelector((state) => state.ui.activeModal);
  const mobileSidebarOpen = useAppSelector((state) => state.ui.mobileSidebarOpen);
  const globalSearchQuery = useAppSelector((state) => state.ui.globalSearchQuery);
  const toasts = useAppSelector((state) => state.ui.toasts);

  const openModal = useCallback((type, data = null) => {
    dispatch(openModalAction({ type, data }));
  }, [dispatch]);

  const closeModal = useCallback(() => {
    dispatch(closeModalAction());
  }, [dispatch]);

  const setMobileSidebarOpen = useCallback((isOpen) => {
    dispatch(setMobileSidebarOpenAction(isOpen));
  }, [dispatch]);

  const setGlobalSearchQuery = useCallback((query) => {
    dispatch(setGlobalSearchQueryAction(query));
  }, [dispatch]);

  const handleRemoveToast = useCallback((id) => {
    dispatch(removeToast(id));
  }, [dispatch]);

  const markNotificationRead = useCallback((notifId) => {
    dispatch(markNotificationReadAction(notifId));
  }, [dispatch]);

  const clearNotifications = useCallback(() => {
    dispatch(clearNotificationsAction());
    showToast({ type: 'info', title: 'Notifications Cleared', message: 'All notifications removed.' });
  }, [dispatch]);

  const updateSettings = useCallback((newSettingsOrUpdater) => {
    const nextSettings = typeof newSettingsOrUpdater === 'function'
      ? newSettingsOrUpdater(settings)
      : { ...settings, ...newSettingsOrUpdater };
    dispatch(updateSettingsAction(nextSettings));
  }, [dispatch, settings]);

  // Local UI state
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [confirmDialog, setConfirmDialog] = useState(null);

  const requestConfirm = useCallback(({ title, message, confirmText = 'Confirm', isDanger = true, onConfirm }) => {
    setConfirmDialog({ title, message, confirmText, isDanger, onConfirm: () => { onConfirm(); setConfirmDialog(null); }, onCancel: () => setConfirmDialog(null) });
  }, []);

  const value = useMemo(() => ({
    settings,
    setSettings: updateSettings,
    notifications,
    activeModal,
    openModal,
    closeModal,
    mobileSidebarOpen,
    setMobileSidebarOpen,
    globalSearchQuery,
    setGlobalSearchQuery,
    sidebarCollapsed,
    setSidebarCollapsed,
    confirmDialog,
    requestConfirm,
    toasts,
    showToast,
    removeToast: handleRemoveToast,
    markNotificationRead,
    clearNotifications,
  }), [
    settings,
    updateSettings,
    notifications,
    activeModal,
    openModal,
    closeModal,
    mobileSidebarOpen,
    setMobileSidebarOpen,
    globalSearchQuery,
    setGlobalSearchQuery,
    sidebarCollapsed,
    setSidebarCollapsed,
    confirmDialog,
    requestConfirm,
    toasts,
    handleRemoveToast,
    markNotificationRead,
    clearNotifications,
  ]);

  return (
    <UIContext.Provider value={value}>
      {children}
    </UIContext.Provider>
  );
}

export function useUI() {
  const context = useContext(UIContext);
  if (!context) {
    throw new Error('useUI must be used within a UIProvider');
  }
  return context;
}

