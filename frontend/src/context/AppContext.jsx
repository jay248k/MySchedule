import { toast } from 'react-toastify';
import React, { createContext, useContext, useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useAppDispatch, useAppSelector } from '../redux/hooks';
import {
  setTasks,
  addTask as addTaskAction,
  addTasks as addTasksAction,
  updateTask as updateTaskAction,
  deleteTask as deleteTaskAction,
  toggleTaskComplete as toggleTaskCompleteAction,
  moveTaskSlot as moveTaskSlotAction,
  setSelectedDate as setSelectedDateAction,
} from '../redux/slices/tasksSlice';
import { getTodayDateString } from '../utils/dateUtils';
import { findScheduleConflict } from '../utils/taskUtils';
import {
  setEvents,
  addEvent as addEventAction,
  updateEvent as updateEventAction,
  deleteEvent as deleteEventAction,
} from '../redux/slices/eventsSlice';
import {
  setCategories,
  addCategory as addCategoryAction,
  addCategories as addCategoriesAction,
  updateCategory as updateCategoryAction,
  deleteCategory as deleteCategoryAction,
} from '../redux/slices/categoriesSlice';
import {
  setGoals,
  addGoal as addGoalAction,
  addGoals as addGoalsAction,
  updateGoal as updateGoalAction,
  deleteGoal as deleteGoalAction,
  linkTaskToGoal as linkTaskToGoalAction,
  unlinkTaskFromGoal as unlinkTaskFromGoalAction,
  syncGoalProgressWithTasks,
} from '../redux/slices/goalsSlice';
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
import { applyThemeToDocument } from '../utils/themeUtils';
import { storageService } from '../services/storageService';
import { api } from '../services/api';
import { purgeLegacyLocalStorage } from '../utils/cookieUtils';

const AppContext = createContext(null);

export function AppProvider({ children }) {
  const dispatch = useAppDispatch();

  // Redux Selectors
  const tasks = useAppSelector((state) => state.tasks.items);
  const events = useAppSelector((state) => state.events.items);
  const categories = useAppSelector((state) => state.categories.items);
  const goals = useAppSelector((state) => state.goals.items);
  const settings = useAppSelector((state) => state.ui.settings);
  const notifications = useAppSelector((state) => state.ui.notifications);
  const activeModal = useAppSelector((state) => state.ui.activeModal);
  const mobileSidebarOpen = useAppSelector((state) => state.ui.mobileSidebarOpen);
  const globalSearchQuery = useAppSelector((state) => state.ui.globalSearchQuery);
  const toasts = useAppSelector((state) => state.ui.toasts);
  const authUser = useAppSelector((state) => state.auth.user);
  const selectedDate = useAppSelector((state) => state.tasks.selectedDate || getTodayDateString());

  const setSelectedDate = useCallback(
    (newDate) => {
      dispatch(setSelectedDateAction(newDate || getTodayDateString()));
    },
    [dispatch]
  );

  // Local supplemental states
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [confirmDialog, setConfirmDialog] = useState(null);
  const [dailyReports, setDailyReports] = useState(() => storageService.getDailyReports());
  const [user, setUser] = useState(() => authUser || storageService.getUser());
  const [workSessions, setWorkSessions] = useState(() => storageService.getWorkSessions());
  const [activeWorkSession, setActiveWorkSession] = useState(() => storageService.getActiveWorkSession());
  const [isStopModalOpen, setIsStopModalOpen] = useState(false);
  const [deviations, setDeviations] = useState(() => {
    const raw = storageService.getDeviations();
    if (!Array.isArray(raw)) return [];
    return raw.map((d) => {
      let rc = d.reasonCategory;
      if (typeof rc === 'object' && rc !== null) {
        rc = rc.name || rc.label || rc.id || 'Distraction';
      }
      return { ...d, reasonCategory: rc || 'Distraction' };
    });
  });
  const [requests, setRequests] = useState(() => storageService.getRequests());
  const [importHistory, setImportHistory] = useState(() => storageService.getImportHistory());
  const [workChains, setWorkChains] = useState(() => storageService.getWorkChains());

  // Production-level session guards & single shared live ticker (No per-component drift)
  const lastStoppedWorkSessionAtRef = useRef(0);
  const isSessionTransitioningRef = useRef(false);
  const isRolloverProcessingRef = useRef(false);
  const [masterTimerTicker, setMasterTimerTicker] = useState(() => Date.now());

  useEffect(() => {
    const timer = setInterval(() => {
      setMasterTimerTicker(Date.now());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const currentLiveWorkSeconds = useMemo(() => {
    if (!activeWorkSession || !activeWorkSession.isRunning || !activeWorkSession.startTimestamp) {
      return 0;
    }
    const todayStr = getTodayDateString();
    const sessionDate = activeWorkSession.date || todayStr;
    const elapsedSinceStart = Math.max(0, Math.floor((masterTimerTicker - Number(activeWorkSession.startTimestamp)) / 1000));

    // Cap overnight runaway session
    if (sessionDate !== todayStr && elapsedSinceStart > 16 * 3600) {
      return Number(activeWorkSession.baseAccumulatedSeconds) || 0;
    }

    const todayRecorded = (workSessions || [])
      .filter((s) => s.date === sessionDate)
      .reduce((acc, s) => acc + (Number(s.durationSeconds) || 0), 0);

    const base = Math.max(Number(activeWorkSession.baseAccumulatedSeconds) || 0, todayRecorded);

    return base + elapsedSinceStart;
  }, [activeWorkSession, masterTimerTicker, workSessions]);

  // Purge any legacy static data stored in Chrome localStorage on mount
  useEffect(() => {
    purgeLegacyLocalStorage();
  }, []);

  // Keep local user state synchronized with Redux auth user and completely clear on logout
  useEffect(() => {
    if (authUser) {
      setUser(authUser);
    } else {
      setUser(null);
      purgeLegacyLocalStorage();
      dispatch(setTasks([]));
      dispatch(setCategories([]));
      dispatch(setGoals([]));
      dispatch(setEvents([]));
      setDailyReports([]);
      setWorkSessions([]);
      setActiveWorkSession(null);
      setDeviations([]);
      setRequests([]);
    }
  }, [authUser, dispatch]);

  // Apply dynamic theme mode and brand accents to document
  useEffect(() => {
    applyThemeToDocument({
      theme: settings?.theme || 'light',
      colorCombinationId: settings?.colorCombinationId || 'electric-sapphire',
      accentColor: settings?.accentColor || '#1769FF',
    });
  }, [settings?.theme, settings?.colorCombinationId, settings?.accentColor]);

  // Sync goal progress whenever tasks array updates
  useEffect(() => {
    dispatch(syncGoalProgressWithTasks(tasks));
  }, [tasks, dispatch]);

  // Standard Normal Toastify for all notifications across the application
  const showToast = useCallback((arg) => {
    let type = 'info';
    let title = '';
    let message = '';

    if (typeof arg === 'string') {
      message = arg;
    } else if (arg && typeof arg === 'object') {
      type = arg.type || 'info';
      title = arg.title || '';
      message = arg.message || '';
    }

    const text = title && message && title !== message
      ? `${title}: ${message}`
      : (message || title || '');

    if (!text) return;

    const toastType = type === 'danger' ? 'error' : (type === 'warning' ? 'warn' : type);

    if (typeof toast[toastType] === 'function') {
      toast[toastType](text);
    } else {
      toast(text);
    }
  }, []);

  const handleRemoveToast = useCallback(
    (id) => {
      dispatch(removeToast(id));
    },
    [dispatch]
  );

  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSyncedAt, setLastSyncedAt] = useState(() => Date.now());

  // Real-time backend data synchronization across Web & Mobile
  const fetchAllData = useCallback(async (options = {}) => {
    const currentUser = authUser || storageService.getUser();
    if (!currentUser) return;
    setIsSyncing(true);
    try {
      const [tasksRes, categoriesRes, goalsRes, eventsRes, workSessionsRes, deviationsRes, requestsRes, reportsRes, activeSessionRes, settingsRes] = await Promise.all([
        api.getTasks().catch(() => null),
        api.getCategories().catch(() => null),
        api.getGoals().catch(() => null),
        api.getEvents().catch(() => null),
        api.getWorkSessions().catch(() => null),
        api.getDeviations().catch(() => null),
        api.getRequests().catch(() => null),
        api.getReports().catch(() => null),
        api.getActiveWorkSession().catch(() => null),
        api.getSettings().catch(() => null),
      ]);

      if (tasksRes?.data && Array.isArray(tasksRes.data)) {
        const serverIds = new Set(tasksRes.data.map((t) => t.id));
        const localTasks = storageService.getTasks().filter((t) => !serverIds.has(t.id));
        const combinedTasks = [...tasksRes.data, ...localTasks];
        dispatch(setTasks(combinedTasks));
        storageService.saveTasks(combinedTasks);
      }
      if (categoriesRes?.data && Array.isArray(categoriesRes.data)) {
        const serverIds = new Set(categoriesRes.data.map((c) => c.id));
        const stored = storageService.getCategories();
        const localCats = (Array.isArray(stored) ? stored : []).filter((c) => !serverIds.has(c.id));
        dispatch(setCategories([...categoriesRes.data, ...localCats]));
      }
      if (goalsRes?.data && Array.isArray(goalsRes.data)) {
        const serverIds = new Set(goalsRes.data.map((g) => g.id));
        const stored = storageService.getGoals();
        const localGoals = (Array.isArray(stored) ? stored : []).filter((g) => !serverIds.has(g.id));
        dispatch(setGoals([...goalsRes.data, ...localGoals]));
      }
      if (eventsRes?.data && Array.isArray(eventsRes.data)) {
        const serverIds = new Set(eventsRes.data.map((e) => e.id));
        const stored = storageService.getEvents();
        const localEvents = (Array.isArray(stored) ? stored : []).filter((e) => !serverIds.has(e.id));
        dispatch(setEvents([...eventsRes.data, ...localEvents]));
      }
      if (workSessionsRes?.data && Array.isArray(workSessionsRes.data)) {
        const serverIds = new Set(workSessionsRes.data.map((s) => s.id));
        const stored = storageService.getWorkSessions();
        const localSessions = (Array.isArray(stored) ? stored : []).filter((s) => !serverIds.has(s.id));
        const combined = [...workSessionsRes.data, ...localSessions];
        setWorkSessions(combined);
        storageService.saveWorkSessions(combined);
      }
      if (deviationsRes?.data && Array.isArray(deviationsRes.data)) {
        const serverIds = new Set(deviationsRes.data.map((d) => d.id));
        const stored = storageService.getDeviations();
        const localDeviations = (Array.isArray(stored) ? stored : []).filter((d) => !serverIds.has(d.id));
        const combined = [...deviationsRes.data, ...localDeviations].map((d) => {
          let rc = d.reasonCategory;
          if (typeof rc === 'object' && rc !== null) {
            rc = rc.name || rc.label || rc.id || 'Distraction';
          }
          return { ...d, reasonCategory: rc || 'Distraction' };
        });
        setDeviations(combined);
        storageService.saveDeviations(combined);
      }
      if (requestsRes?.data && Array.isArray(requestsRes.data)) {
        const serverIds = new Set(requestsRes.data.map((r) => r.id));
        const stored = storageService.getRequests();
        const localRequests = (Array.isArray(stored) ? stored : []).filter((r) => !serverIds.has(r.id));
        const combined = [...requestsRes.data, ...localRequests];
        setRequests(combined);
        storageService.saveRequests(combined);
      }
      if (reportsRes?.data && Array.isArray(reportsRes.data)) {
        const serverDates = new Set(reportsRes.data.map((r) => r.date || r.id));
        const stored = storageService.getDailyReports();
        const localReports = (Array.isArray(stored) ? stored : []).filter((r) => !serverDates.has(r.date || r.id));
        const combined = [...reportsRes.data, ...localReports];
        setDailyReports(combined);
        storageService.saveDailyReports(combined);
      }
      if (settingsRes?.data) {
        const serverSettings = settingsRes.data;
        let notifParsed = {};
        if (serverSettings.notificationSettings) {
          try {
            notifParsed =
              typeof serverSettings.notificationSettings === 'string'
                ? JSON.parse(serverSettings.notificationSettings)
                : serverSettings.notificationSettings;
          } catch {}
        }
        // Preserve active local theme if user has selected one in this browser (e.g. OLED)
        const currentSavedTheme = storageService.getTheme() || settings?.theme;
        const effectiveTheme = currentSavedTheme || serverSettings.theme || 'dark';

        const mergedSettings = {
          ...serverSettings,
          ...notifParsed,
          theme: effectiveTheme,
        };
        if (!mergedSettings.notificationTimeframe) {
          mergedSettings.notificationTimeframe = 'today';
        }
        dispatch(updateSettingsAction(mergedSettings));
        storageService.saveSettings(mergedSettings);

        // Keep backend database in sync if server had a different theme
        if (serverSettings.theme !== effectiveTheme) {
          api.updateSettings({ ...mergedSettings, theme: effectiveTheme }).catch(() => {});
        }
      }

      // Synchronize Live Active Work Session with Mobile & Backend
      if (activeSessionRes && activeSessionRes.success !== false) {
        const s = activeSessionRes.data;
        if (s && s.isRunning) {
          const syncedActive = {
            isRunning: true,
            startTimestamp: Number(s.startTimestamp),
            startTime: s.startTime,
            date: s.date,
            taskId: s.taskId || null,
            taskTitle: s.taskTitle || '',
            baseAccumulatedSeconds: Number(s.baseAccumulatedSeconds) || 0,
            status: s.status || 'running',
          };
          setActiveWorkSession(syncedActive);
          storageService.saveActiveWorkSession(syncedActive);
        } else if (!s || !s.isRunning) {
          setActiveWorkSession((prev) => {
            if (prev?.isRunning) {
              storageService.saveActiveWorkSession(null);
              return null;
            }
            return prev;
          });
        }
      }

      setLastSyncedAt(Date.now());
      if (options.showToastNotification) {
        showToast({
          type: 'success',
          title: 'Live Cloud Sync',
          message: 'All APIs reloaded and synchronized with latest mobile activity.',
        });
      }
    } catch (err) {
      console.warn('Backend sync warning:', err);
    } finally {
      setTimeout(() => setIsSyncing(false), 500);
    }
  }, [dispatch, showToast, authUser]);

  useEffect(() => {
    const currentUser = authUser || storageService.getUser();
    if (!currentUser) return;
    fetchAllData();

    // Auto-poll every 12 seconds so operations made in Mobile App auto-rotate and reflect on Web!
    const syncTimer = setInterval(() => {
      fetchAllData();
    }, 12000);

    // Fast 3-second poller dedicated to active work session so Web and Mobile timers are in lock-step
    const activePollTimer = setInterval(async () => {
      try {
        const res = await api.getActiveWorkSession();
        if (res && res.success !== false) {
          const s = res.data;
          const recentlyStopped = Date.now() - lastStoppedWorkSessionAtRef.current < 6000;
          if (s && s.isRunning && !recentlyStopped) {
            setActiveWorkSession((prev) => {
              if (!prev || !prev.isRunning || Math.abs(Number(prev.startTimestamp) - Number(s.startTimestamp)) > 1000) {
                const updated = {
                  isRunning: true,
                  startTimestamp: Number(s.startTimestamp),
                  startTime: s.startTime,
                  date: s.date,
                  taskId: s.taskId || null,
                  taskTitle: s.taskTitle || '',
                  baseAccumulatedSeconds: Number(s.baseAccumulatedSeconds) || 0,
                  status: s.status || 'running',
                };
                storageService.saveActiveWorkSession(updated);
                return updated;
              }
              return prev;
            });
          } else if (!recentlyStopped) {
            setActiveWorkSession((prev) => {
              if (prev && prev.isRunning) {
                storageService.saveActiveWorkSession(null);
                // When session stopped on mobile/cloud, immediately refresh work sessions list
                api.getWorkSessions().then((sessRes) => {
                  if (sessRes?.data && Array.isArray(sessRes.data)) {
                    setWorkSessions(sessRes.data);
                    storageService.saveWorkSessions(sessRes.data);
                  }
                }).catch(() => {});
                return null;
              }
              return prev;
            });
          }
        }
      } catch (e) {
        // quiet fallback
      }
    }, 3000);

    // Automatically re-sync whenever user focuses the browser tab or returns to web
    const handleWindowFocus = () => {
      fetchAllData();
    };

    window.addEventListener('focus', handleWindowFocus);
    return () => {
      clearInterval(syncTimer);
      clearInterval(activePollTimer);
      window.removeEventListener('focus', handleWindowFocus);
    };
  }, [fetchAllData, authUser]);


  // Confirmation Modal
  const requestConfirm = useCallback(
    ({ title, message, confirmText = 'Confirm', isDanger = true, onConfirm }) => {
      setConfirmDialog({
        title,
        message,
        confirmText,
        isDanger,
        onConfirm: () => {
          onConfirm();
          setConfirmDialog(null);
        },
        onCancel: () => setConfirmDialog(null),
      });
    },
    []
  );

  // Modal Actions
  const openModal = useCallback(
    (type, data = null) => {
      dispatch(openModalAction({ type, data }));
    },
    [dispatch]
  );

  const closeModal = useCallback(() => {
    dispatch(closeModalAction());
  }, [dispatch]);

  const setMobileSidebarOpen = useCallback(
    (isOpen) => {
      dispatch(setMobileSidebarOpenAction(isOpen));
    },
    [dispatch]
  );

  const setGlobalSearchQuery = useCallback(
    (query) => {
      dispatch(setGlobalSearchQueryAction(query));
    },
    [dispatch]
  );

  // Task Actions (Connected to Cloud Backend)
  const addTask = useCallback(
    async (taskData) => {
      const payload = {
        title: taskData.title || 'Untitled Task',
        description: taskData.description || '',
        date: taskData.date,
        startTime: taskData.startTime || '09:00',
        endTime: taskData.endTime || '10:00',
        categoryId: taskData.categoryId || (categories[0]?.id || null),
        priority: taskData.priority || 'Medium',
        goalId: taskData.goalId || null,
        status: 'pending',
      };

      // Conflict validation
      const conflict = findScheduleConflict({
        date: payload.date,
        startTime: payload.startTime,
        endTime: payload.endTime,
        tasks,
      });

      if (conflict) {
        showToast({
          type: 'error',
          title: 'Schedule Conflict',
          message: `Cannot schedule: "${conflict.title}" is already scheduled from ${conflict.startTime} to ${conflict.endTime}.`,
        });
        return null;
      }

      try {
        const res = await api.createTask(payload);
        const created = res?.data || { id: `task-${Date.now()}`, ...payload };
        dispatch(addTaskAction(created));
        showToast({
          type: 'success',
          title: 'Task Created',
          message: `"${payload.title}" has been scheduled and synced.`,
        });
        return created;
      } catch (err) {
        const errorMsg = err?.response?.data?.message;
        if (err?.response?.status === 409 || (errorMsg && errorMsg.includes('conflict'))) {
          showToast({
            type: 'error',
            title: 'Schedule Conflict',
            message: errorMsg || 'A task is already scheduled in this time slot.',
          });
          return null;
        }

        const local = { id: `task-${Date.now()}`, ...payload };
        dispatch(addTaskAction(local));
        showToast({
          type: 'success',
          title: 'Task Created',
          message: `"${payload.title}" has been scheduled.`,
        });
        return local;
      }
    },
    [categories, dispatch, showToast, tasks]
  );

  const logRescheduledTask = useCallback(
    async ({
      taskId,
      taskTitle,
      originalDate,
      originalStartTime,
      originalEndTime,
      newDate,
      newStartTime,
      newEndTime,
      reason,
      remarks,
    }) => {
      const origDate = originalDate || getTodayDateString();
      const origStart = originalStartTime || '09:00';
      const origEnd = originalEndTime || '10:00';
      const targetDate = newDate || origDate;
      const targetStart = newStartTime || origStart;
      const targetEnd = newEndTime || origEnd;
      const defaultRemarks = `Rescheduled to ${targetDate} (${targetStart} – ${targetEnd})`;

      const payload = {
        id: `req-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        title: (taskTitle || 'Rescheduled Task').trim(),
        date: origDate,
        startTime: origStart,
        endTime: origEnd,
        rescheduledDate: targetDate,
        rescheduledStartTime: targetStart,
        rescheduledEndTime: targetEnd,
        reason: (reason || 'Rescheduled missed task / schedule deviation').trim(),
        status: 'rescheduled',
        actionRemarks: remarks || defaultRemarks,
        taskId: taskId ? String(taskId) : null,
        taskTitle: taskTitle || '',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      setRequests((prev) => {
        const updated = [payload, ...prev];
        storageService.saveRequests(updated);
        return updated;
      });

      try {
        const res = await api.createRequest(payload);
        if (res?.data) {
          setRequests((prev) =>
            prev.map((r) => (r.id === payload.id ? res.data : r))
          );
        }
      } catch (e) {
        console.warn('Saved rescheduled work request locally:', e);
      }

      return payload;
    },
    []
  );

  const updateTask = useCallback(
    async (taskId, updates) => {
      const existing = tasks.find((t) => t.id === taskId);
      const targetDate = updates.date !== undefined ? updates.date : existing?.date;
      const targetStart = updates.startTime !== undefined ? updates.startTime : existing?.startTime;
      const targetEnd = updates.endTime !== undefined ? updates.endTime : existing?.endTime;

      // Rescheduled tasks always remain normal tasks in all views (status: 'pending')
      const sanitizedUpdates = { ...updates };
      if (sanitizedUpdates.status === 'rescheduled') {
        sanitizedUpdates.status = 'pending';
      }

      const isTimeChange =
        (updates.date !== undefined && updates.date !== existing?.date) ||
        (updates.startTime !== undefined && updates.startTime !== existing?.startTime) ||
        (updates.endTime !== undefined && updates.endTime !== existing?.endTime);

      if (isTimeChange && targetDate && targetStart && targetEnd) {
        const conflict = findScheduleConflict({
          date: targetDate,
          startTime: targetStart,
          endTime: targetEnd,
          tasks,
          excludeTaskId: taskId,
        });

        if (conflict) {
          showToast({
            type: 'error',
            title: 'Schedule Conflict',
            message: `Cannot reschedule: "${conflict.title}" is already scheduled between ${conflict.startTime} and ${conflict.endTime}.`,
          });
          return false;
        }
      }

      if (updates.logAsRescheduled) {
        logRescheduledTask({
          taskId,
          taskTitle: existing?.title || updates.title || 'Task',
          originalDate: existing?.date || updates.originalDate,
          originalStartTime: existing?.startTime || updates.originalStartTime,
          originalEndTime: existing?.endTime || updates.originalEndTime,
          newDate: targetDate,
          newStartTime: targetStart,
          newEndTime: targetEnd,
          reason: updates.rescheduleReason || 'Rescheduled missed task / schedule deviation',
          remarks: updates.rescheduleRemarks || `Rescheduled to ${targetDate} (${targetStart} – ${targetEnd})`,
        });
      }

      dispatch(updateTaskAction({ id: taskId, ...sanitizedUpdates }));
      try {
        await api.updateTask(taskId, updates);
      } catch (err) {
        const errorMsg = err?.response?.data?.message;
        if (errorMsg) {
          showToast({
            type: 'error',
            title: 'Schedule Conflict',
            message: errorMsg,
          });
          if (existing) {
            dispatch(updateTaskAction(existing));
          }
          return false;
        }
        console.warn('Backend task update failed:', err);
      }
      showToast({
        type: 'info',
        title: 'Task Updated',
        message: 'Changes saved successfully.',
      });
      return true;
    },
    [dispatch, showToast, tasks]
  );

  const deleteTask = useCallback(
    (taskId) => {
      const target = tasks.find((t) => t.id === taskId);
      requestConfirm({
        title: 'Delete Task',
        message: `Are you sure you want to delete "${target?.title || 'this task'}"? This action cannot be undone.`,
        confirmText: 'Delete',
        isDanger: true,
        onConfirm: async () => {
          dispatch(deleteTaskAction(taskId));
          try {
            await api.deleteTask(taskId);
          } catch (err) {
            console.warn('Backend task delete failed:', err);
          }
          showToast({
            type: 'info',
            title: 'Task Deleted',
            message: `"${target?.title || 'Task'}" was removed.`,
          });
        },
      });
    },
    [tasks, requestConfirm, dispatch, showToast]
  );

  const toggleTaskComplete = useCallback(
    async (taskId) => {
      const target = tasks.find((t) => t.id === taskId);
      const isDone = target?.status === 'completed';
      const newStatus = isDone ? 'pending' : 'completed';

      dispatch(toggleTaskCompleteAction(taskId));
      try {
        await api.toggleTaskComplete(taskId);
      } catch (err) {
        console.warn('Backend task toggle failed:', err);
      }
      showToast({
        type: isDone ? 'info' : 'success',
        title: isDone ? 'Task Incomplete' : 'Task Done',
        message: `"${target?.title || 'Task'}"`,
      });
    },
    [tasks, dispatch, showToast]
  );

  const moveTaskSlot = useCallback(
    async (payload) => {
      dispatch(moveTaskSlotAction(payload));
      try {
        await api.updateTask(payload.taskId, {
          date: payload.newDate,
          startTime: payload.newStartTime,
          endTime: payload.newEndTime,
        });
      } catch (err) {
        console.warn('Backend move task failed:', err);
      }
    },
    [dispatch]
  );

  const bulkImportTasks = useCallback(
    async (items, options = {}) => {
      try {
        const res = await api.bulkCreateTasks(items);
        const created = res?.data || items.map((t, i) => ({ id: `task-${Date.now()}-${i}`, ...t }));
        dispatch(addTasksAction(created));
        if (!options.silent) {
          showToast({
            type: 'success',
            title: 'Tasks Imported',
            message: `Successfully imported ${created.length} tasks.`,
          });
        }
        return { success: true, count: created.length, data: created };
      } catch (err) {
        console.warn('Backend bulk task creation failed, trying individual creations:', err);
        const createdList = [];
        for (const task of items) {
          try {
            const indRes = await api.createTask(task);
            if (indRes?.data) createdList.push(indRes.data);
            else createdList.push({ id: `task-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`, ...task });
          } catch {
            createdList.push({ id: `task-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`, ...task });
          }
        }
        dispatch(addTasksAction(createdList));
        if (!options.silent) {
          showToast({
            type: 'success',
            title: 'Tasks Imported',
            message: `Imported ${createdList.length} tasks.`,
          });
        }
        return { success: true, count: createdList.length, data: createdList };
      }
    },
    [dispatch, showToast]
  );

  // Goal Actions (Connected to Cloud Backend)
  const addGoal = useCallback(
    async (goalData) => {
      const payload = {
        title: goalData.title || 'New Goal',
        description: goalData.description || '',
        targetDate: goalData.targetDate,
        category: goalData.category || 'General',
        relatedTaskIds: goalData.relatedTaskIds || [],
      };
      try {
        const res = await api.createGoal(payload);
        const created = res?.data || { id: `goal-${Date.now()}`, ...payload };
        dispatch(addGoalAction(created));
        showToast({
          type: 'success',
          title: 'Goal Added',
          message: `New goal "${payload.title}" created with auto-progress tracking.`,
        });
        return created;
      } catch (err) {
        const local = { id: `goal-${Date.now()}`, ...payload };
        dispatch(addGoalAction(local));
        showToast({
          type: 'success',
          title: 'Goal Added',
          message: `New goal "${payload.title}" created.`,
        });
        return local;
      }
    },
    [dispatch, showToast]
  );

  const updateGoal = useCallback(
    async (goalId, updates) => {
      dispatch(updateGoalAction({ id: goalId, ...updates }));
      try {
        await api.updateGoal(goalId, updates);
      } catch (err) {
        console.warn('Backend goal update failed:', err);
      }
      showToast({
        type: 'info',
        title: 'Goal Updated',
        message: 'Goal progress and details saved.',
      });
    },
    [dispatch, showToast]
  );

  const deleteGoal = useCallback(
    (goalId) => {
      const target = goals.find((g) => g.id === goalId);
      requestConfirm({
        title: 'Delete Goal',
        message: `Are you sure you want to delete goal "${target?.title || 'Goal'}"?`,
        confirmText: 'Delete',
        isDanger: true,
        onConfirm: async () => {
          dispatch(deleteGoalAction(goalId));
          try {
            await api.deleteGoal(goalId);
          } catch (err) {
            console.warn('Backend goal delete failed:', err);
          }
          showToast({
            type: 'info',
            title: 'Goal Deleted',
            message: 'Goal was successfully removed.',
          });
        },
      });
    },
    [goals, requestConfirm, dispatch, showToast]
  );

  const linkTaskToGoal = useCallback(
    (taskId, goalId) => {
      dispatch(updateTaskAction({ id: taskId, goalId }));
      dispatch(linkTaskToGoalAction({ taskId, goalId }));
      showToast({
        type: 'success',
        title: 'Task Linked to Goal',
        message: 'Goal progress will now auto-update when you complete this task.',
      });
    },
    [dispatch, showToast]
  );

  const unlinkTaskFromGoal = useCallback(
    (taskId, goalId) => {
      dispatch(updateTaskAction({ id: taskId, goalId: null }));
      dispatch(unlinkTaskFromGoalAction({ taskId, goalId }));
      showToast({
        type: 'info',
        title: 'Task Unlinked',
        message: 'Task removed from goal.',
      });
    },
    [dispatch, showToast]
  );

  const bulkImportGoals = useCallback(
    async (items, options = {}) => {
      try {
        const res = await api.bulkCreateGoals(items);
        const created = res?.data || items.map((g, i) => ({ id: `goal-${Date.now()}-${i}`, ...g }));
        dispatch(addGoalsAction(created));
        if (!options.silent) {
          showToast({
            type: 'success',
            title: 'Goals Imported',
            message: `Successfully imported ${created.length} goals.`,
          });
        }
        return { success: true, count: created.length, data: created };
      } catch (err) {
        console.warn('Backend bulk goal creation failed, trying individual creations:', err);
        const createdList = [];
        for (const goal of items) {
          try {
            const indRes = await api.createGoal(goal);
            if (indRes?.data) createdList.push(indRes.data);
            else createdList.push({ id: `goal-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`, ...goal });
          } catch {
            createdList.push({ id: `goal-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`, ...goal });
          }
        }
        dispatch(addGoalsAction(createdList));
        if (!options.silent) {
          showToast({
            type: 'success',
            title: 'Goals Imported',
            message: `Imported ${createdList.length} goals.`,
          });
        }
        return { success: true, count: createdList.length, data: createdList };
      }
    },
    [dispatch, showToast]
  );

  // Event Actions
  const addEvent = useCallback(
    (eventData) => {
      const payload = {
        id: `event-${Date.now()}`,
        title: eventData.title || 'Untitled Event',
        description: eventData.description || '',
        date: eventData.date,
        startTime: eventData.startTime || '10:00',
        endTime: eventData.endTime || '11:00',
        categoryId: eventData.categoryId || (categories[0]?.id || 'cat-work'),
        location: eventData.location || '',
      };
      dispatch(addEventAction(payload));
      showToast({
        type: 'success',
        title: 'Event Scheduled',
        message: `"${payload.title}" was added to calendar.`,
      });
      return payload;
    },
    [categories, dispatch, showToast]
  );

  const updateEvent = useCallback(
    (eventId, updates) => {
      dispatch(updateEventAction({ id: eventId, ...updates }));
      showToast({
        type: 'info',
        title: 'Event Updated',
        message: 'Event details updated.',
      });
    },
    [dispatch, showToast]
  );

  const deleteEvent = useCallback(
    (eventId) => {
      const target = events.find((e) => e.id === eventId);
      requestConfirm({
        title: 'Delete Event',
        message: `Are you sure you want to remove event "${target?.title || 'this event'}"?`,
        confirmText: 'Delete',
        isDanger: true,
        onConfirm: () => {
          dispatch(deleteEventAction(eventId));
          showToast({
            type: 'info',
            title: 'Event Deleted',
            message: 'Calendar event removed.',
          });
        },
      });
    },
    [events, requestConfirm, dispatch, showToast]
  );

  // Category Actions (Connected to Cloud Backend)
  const addCategory = useCallback(
    async (catData) => {
      const payload = {
        name: catData.name,
        color: catData.color || '#1769FF',
        icon: catData.icon || 'Tag',
        description: catData.description || '',
      };
      try {
        const res = await api.createCategory(payload);
        const created = res?.data || { id: `cat-${Date.now()}`, ...payload };
        dispatch(addCategoryAction(created));
        showToast({
          type: 'success',
          title: 'Category Created',
          message: `Category "${payload.name}" is now available.`,
        });
        return created;
      } catch (err) {
        const local = { id: `cat-${Date.now()}`, ...payload };
        dispatch(addCategoryAction(local));
        showToast({
          type: 'success',
          title: 'Category Created',
          message: `Category "${payload.name}" created.`,
        });
        return local;
      }
    },
    [dispatch, showToast]
  );

  const updateCategory = useCallback(
    async (catId, updates) => {
      dispatch(updateCategoryAction({ id: catId, ...updates }));
      try {
        await api.updateCategory(catId, updates);
      } catch (err) {
        console.warn('Backend category update failed:', err);
      }
      showToast({
        type: 'info',
        title: 'Category Updated',
        message: 'Category modified.',
      });
    },
    [dispatch, showToast]
  );

  const deleteCategory = useCallback(
    (catId) => {
      const target = categories.find((c) => c.id === catId);
      const affectedCount = tasks.filter((t) => t.categoryId === catId).length;

      requestConfirm({
        title: 'Delete Category',
        message: `Are you sure you want to delete "${target?.name}"? ${affectedCount} task(s) currently assigned to this category will be updated.`,
        confirmText: 'Delete Category',
        isDanger: true,
        onConfirm: async () => {
          dispatch(deleteCategoryAction(catId));
          try {
            await api.deleteCategory(catId);
          } catch (err) {
            console.warn('Backend category delete failed:', err);
          }
          showToast({
            type: 'info',
            title: 'Category Deleted',
            message: `"${target?.name || 'Category'}" was removed.`,
          });
        },
      });
    },
    [categories, tasks, requestConfirm, dispatch, showToast]
  );

  const bulkImportCategories = useCallback(
    async (items, options = {}) => {
      try {
        const res = await api.bulkCreateCategories(items);
        const created = res?.data || items.map((c, i) => ({ id: `cat-${Date.now()}-${i}`, ...c }));
        dispatch(addCategoriesAction(created));
        if (!options.silent) {
          showToast({
            type: 'success',
            title: 'Categories Imported',
            message: `Successfully imported ${created.length} categories.`,
          });
        }
        return { success: true, count: created.length, data: created };
      } catch (err) {
        console.warn('Backend bulk category creation failed, trying individual creations:', err);
        const createdList = [];
        for (const cat of items) {
          try {
            const indRes = await api.createCategory(cat);
            if (indRes?.data) createdList.push(indRes.data);
            else createdList.push({ id: `cat-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`, ...cat });
          } catch {
            createdList.push({ id: `cat-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`, ...cat });
          }
        }
        dispatch(addCategoriesAction(createdList));
        if (!options.silent) {
          showToast({
            type: 'success',
            title: 'Categories Imported',
            message: `Imported ${createdList.length} categories.`,
          });
        }
        return { success: true, count: createdList.length, data: createdList };
      }
    },
    [dispatch, showToast]
  );

  // Bulk Import History Tracking & One-Click Undo
  const addImportHistoryEntry = useCallback((entry) => {
    const newEntry = {
      id: `batch-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      fileName: entry.fileName || 'Uploaded_Batch',
      fileType: entry.fileType || 'tasks',
      count: entry.count || 0,
      itemIds: entry.itemIds || [],
      importedAt: new Date().toISOString(),
    };
    setImportHistory((prev) => {
      const updated = [newEntry, ...prev];
      storageService.saveImportHistory(updated);
      return updated;
    });
    return newEntry;
  }, []);

  const deleteImportBatch = useCallback(
    async (batchId) => {
      const batch = importHistory.find((b) => b.id === batchId);
      if (!batch) return;

      try {
        if (batch.fileType === 'tasks') {
          for (const id of batch.itemIds) {
            dispatch(deleteTaskAction(id));
            api.deleteTask(id).catch(() => { });
          }
          storageService.saveTasks(storageService.getTasks().filter((t) => !batch.itemIds.includes(t.id)));
        } else if (batch.fileType === 'goals') {
          for (const id of batch.itemIds) {
            dispatch(deleteGoalAction(id));
            api.deleteGoal(id).catch(() => { });
          }
          storageService.saveGoals(storageService.getGoals().filter((g) => !batch.itemIds.includes(g.id)));
        } else if (batch.fileType === 'categories') {
          for (const id of batch.itemIds) {
            dispatch(deleteCategoryAction(id));
            api.deleteCategory(id).catch(() => { });
          }
          storageService.saveCategories(storageService.getCategories().filter((c) => !batch.itemIds.includes(c.id)));
        }

        setImportHistory((prev) => {
          const filtered = prev.filter((b) => b.id !== batchId);
          storageService.saveImportHistory(filtered);
          return filtered;
        });

        showToast({
          type: 'success',
          title: 'Import Data Deleted',
          message: `Removed ${batch.count} ${batch.fileType} from "${batch.fileName}".`,
        });
      } catch (err) {
        console.warn('Delete import batch error:', err);
      }
    },
    [importHistory, dispatch, showToast]
  );

  // Daily Work Reporting
  const saveDailyReport = useCallback(
    async (reportData) => {
      const existingIndex = dailyReports.findIndex((r) => r.date === reportData.date);
      let updated;
      if (existingIndex >= 0) {
        updated = [...dailyReports];
        updated[existingIndex] = {
          ...updated[existingIndex],
          ...reportData,
          updatedAt: new Date().toISOString(),
        };
      } else {
        const newReport = {
          id: `report-${Date.now()}`,
          submittedAt: new Date().toISOString(),
          ...reportData,
        };
        updated = [newReport, ...dailyReports];
      }
      setDailyReports(updated);
      storageService.saveDailyReports(updated);

      // Persist to Database API
      try {
        await api.saveReport(reportData);
      } catch (err) {
        console.warn('Backend DB persist warning for report:', err);
      }

      showToast({
        type: 'success',
        title: 'Daily Report Saved',
        message: `Work report for ${reportData.date} recorded successfully in database.`,
      });
      return updated;
    },
    [dailyReports, showToast]
  );

  const deleteDailyReport = useCallback(
    (reportId) => {
      requestConfirm({
        title: 'Delete Work Report',
        message: 'Are you sure you want to delete this daily work report from your history?',
        confirmText: 'Delete Report',
        isDanger: true,
        onConfirm: async () => {
          const target = dailyReports.find((r) => r.id === reportId);
          const filtered = dailyReports.filter((r) => r.id !== reportId);
          setDailyReports(filtered);
          storageService.saveDailyReports(filtered);

          // Persist deletion to Database API
          if (target?.date) {
            try {
              await api.deleteReport(target.date);
            } catch (err) {
              console.warn('Backend DB delete warning for report:', err);
            }
          }

          showToast({
            type: 'info',
            title: 'Report Removed',
            message: 'The daily work report was removed from your history.',
          });
        },
      });
    },
    [dailyReports, requestConfirm, showToast]
  );

  // Data Reset & Clear
  const resetDemoData = useCallback(() => {
    requestConfirm({
      title: 'Reset Demo Data',
      message: 'Are you sure you want to reset all tasks, events, and goals to the default sample dataset? Any custom additions will be replaced.',
      confirmText: 'Reset to Sample Data',
      isDanger: false,
      onConfirm: () => {
        const fresh = storageService.resetAllToSampleData();
        dispatch(setTasks(fresh.tasks));
        dispatch(setCategories(fresh.categories));
        dispatch(setEvents(fresh.events));
        dispatch(setGoals(fresh.goals));
        dispatch(updateSettingsAction(fresh.settings));
        setUser(fresh.user);
        setDailyReports(fresh.dailyReports || []);
        showToast({
          type: 'success',
          title: 'Demo Data Restored',
          message: 'All sample tasks and schedules are restored.',
        });
      },
    });
  }, [requestConfirm, dispatch, showToast]);

  const clearAllData = useCallback(() => {
    requestConfirm({
      title: 'Clear All Stored Data',
      message: 'This will completely clear all tasks, events, goals, and settings from cookies and in-memory cache.',
      confirmText: 'Clear Everything',
      isDanger: true,
      onConfirm: () => {
        storageService.clearAllData();
        dispatch(setTasks([]));
        dispatch(setEvents([]));
        dispatch(setGoals([]));
        setDailyReports([]);
        showToast({
          type: 'warning',
          title: 'Data Cleared',
          message: 'All stored items have been erased.',
        });
      },
    });
  }, [requestConfirm, dispatch, showToast]);

  const markNotificationRead = useCallback(
    (notifId) => {
      dispatch(markNotificationReadAction(notifId));
    },
    [dispatch]
  );

  const clearNotifications = useCallback(() => {
    dispatch(clearNotificationsAction());
    showToast({
      type: 'info',
      title: 'Notifications Cleared',
      message: 'All notifications removed.',
    });
  }, [dispatch, showToast]);

  const updateSettings = useCallback(
    (newSettingsOrUpdater) => {
      const nextSettings =
        typeof newSettingsOrUpdater === 'function'
          ? newSettingsOrUpdater(settings)
          : { ...settings, ...newSettingsOrUpdater };
      dispatch(updateSettingsAction(nextSettings));
      storageService.saveSettings(nextSettings);
      if (nextSettings.theme) {
        applyThemeToDocument({
          theme: nextSettings.theme,
          colorCombinationId: nextSettings.colorCombinationId || 'electric-sapphire',
          accentColor: nextSettings.accentColor || '#1769FF',
        });
      }
      // Sync to backend if accessible, persisting notificationSettings
      const notifObj = {
        notificationTimeframe: nextSettings.notificationTimeframe || 'today',
        enableInAppNotifications: nextSettings.enableInAppNotifications !== false,
        enableStandupReminder: nextSettings.enableStandupReminder !== false,
        enableCelebrationEffects: nextSettings.enableCelebrationEffects !== false,
        enableOverdueAlerts: nextSettings.enableOverdueAlerts !== false,
      };
      api.updateSettings({
        ...nextSettings,
        notificationSettings: JSON.stringify(notifObj),
      }).catch(() => { });
    },
    [dispatch, settings]
  );

  // ---------------------------------------------------------------------------
  // AUTOMATIC MIDNIGHT WORK SESSION ROLLOVER
  // If a work session runs past midnight (e.g. 11:00 PM to 1:00 AM),
  // automatically cut off the previous day's session at 11:59:59 PM (12:00 AM)
  // and seamlessly start a fresh live session for the new day at 12:00:00 AM without losing time.
  // ---------------------------------------------------------------------------
  const executeMidnightSessionRollover = useCallback(
    async (session, prevDateStr, todayDateStr) => {
      if (isRolloverProcessingRef.current) return;
      isRolloverProcessingRef.current = true;

      try {
        const [y1, m1, d1] = prevDateStr.split('-').map(Number);
        const day1Date = new Date(y1, m1 - 1, d1);
        const [y2, m2, d2] = todayDateStr.split('-').map(Number);
        const day2Date = new Date(y2, m2 - 1, d2);
        const diffDays = Math.round((day2Date - day1Date) / (1000 * 60 * 60 * 24));

        const midnightToday = new Date(y2, m2 - 1, d2, 0, 0, 0, 0);
        const midnightTimestamp = midnightToday.getTime();

        const sessionStartTimestamp = Number(session.startTimestamp);
        if (!sessionStartTimestamp || isNaN(sessionStartTimestamp)) {
          return;
        }

        // Calculate duration on Day 1 (from startTimestamp until midnight)
        const day1DurationSeconds = Math.max(1, Math.round((midnightTimestamp - sessionStartTimestamp) / 1000));
        const day1EndStr = new Date(y1, m1 - 1, d1, 23, 59, 59).toLocaleTimeString([], {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
        });
        const day2StartStr = midnightToday.toLocaleTimeString([], {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
        });

        // 1. Cut off and finalize Day 1 session at 11:59:59 PM
        const day1SessionId = `session-${midnightTimestamp}-${Math.random().toString(36).substring(2, 6)}`;
        const day1SessionPayload = {
          id: day1SessionId,
          date: prevDateStr,
          startTime: session.startTime || '11:00:00 PM',
          endTime: day1EndStr,
          durationSeconds: day1DurationSeconds,
          stopReason: 'Midnight Day Rollover',
          notes: `${session.taskTitle ? `[${session.taskTitle}] ` : ''}Automatic cutoff at 12:00 AM midnight rollover`,
          taskId: session.taskId || null,
          taskTitle: session.taskTitle || '',
        };

        const day1WorkNode = {
          id: `work-${midnightTimestamp}-${Math.random().toString(36).substring(2, 6)}`,
          sessionId: day1SessionId,
          type: 'work',
          startTime: session.startTime || '11:00:00 PM',
          endTime: day1EndStr,
          durationSeconds: day1DurationSeconds,
          taskId: session.taskId || null,
          taskTitle: session.taskTitle || '',
          stopReason: 'Midnight Day Rollover',
          notes: 'Auto-closed at midnight transition',
        };

        // Update Day 1 chain
        setWorkChains((prev) => {
          const prevChain = prev[prevDateStr] || { status: 'idle', accumulatedWorkSeconds: 0, chain: [] };
          const updatedPrevChain = {
            ...prevChain,
            status: 'paused',
            accumulatedWorkSeconds: (Number(prevChain.accumulatedWorkSeconds) || 0) + day1DurationSeconds,
            lastPausedTimestamp: midnightTimestamp,
            lastPausedTimeStr: day1EndStr,
            lastPauseReason: 'Midnight Day Rollover',
            chain: [...(prevChain.chain || []), day1WorkNode],
          };
          const nextChains = { ...prev, [prevDateStr]: updatedPrevChain };
          storageService.saveWorkChains(nextChains);
          return nextChains;
        });

        // Save Day 1 completed session
        setWorkSessions((prev) => {
          const updated = [day1SessionPayload, ...prev];
          storageService.saveWorkSessions(updated);
          return updated;
        });
        api.createWorkSession(day1SessionPayload).catch((err) =>
          console.warn('Saved Day 1 midnight session locally:', err)
        );

        // 2. Start Day 2 session
        // If it was overnight into today (diffDays === 1), start a seamless new live session for today from 12:00 AM
        if (diffDays === 1) {
          const currentSessions = storageService.getWorkSessions() || [];
          const todayRecorded = currentSessions
            .filter((s) => s.date === todayDateStr)
            .reduce((acc, s) => acc + (Number(s.durationSeconds) || 0), 0);

          const newActiveDay2 = {
            isRunning: true,
            startTimestamp: midnightTimestamp,
            startTime: day2StartStr,
            date: todayDateStr,
            taskId: session.taskId || null,
            taskTitle: session.taskTitle || '',
            baseAccumulatedSeconds: todayRecorded,
            status: 'running',
          };

          setActiveWorkSession(newActiveDay2);
          storageService.saveActiveWorkSession(newActiveDay2);
          api.setActiveWorkSession(newActiveDay2).catch(() => {});

          setWorkChains((prev) => {
            const todayChain = prev[todayDateStr] || {
              status: 'idle',
              accumulatedWorkSeconds: todayRecorded,
              chain: [],
            };
            const updatedTodayChain = {
              ...todayChain,
              status: 'running',
              currentSegmentStart: midnightTimestamp,
              lastPausedTimestamp: null,
            };
            const nextChains = { ...prev, [todayDateStr]: updatedTodayChain };
            storageService.saveWorkChains(nextChains);
            return nextChains;
          });

          showToast({
            type: 'info',
            title: 'Midnight Work Rollover',
            message: `Previous day (${prevDateStr}) cut off at 12:00 AM. New session active for today (${todayDateStr}).`,
          });
        } else {
          // If diffDays > 1 (e.g. computer was asleep for days), close active session without running runaway timer
          setActiveWorkSession(null);
          storageService.saveActiveWorkSession(null);
          api.clearActiveWorkSession().catch(() => {});
        }
      } catch (err) {
        console.error('Error during midnight rollover:', err);
      } finally {
        setTimeout(() => {
          isRolloverProcessingRef.current = false;
        }, 1500);
      }
    },
    [showToast]
  );

  // Monitor running work session for crossing midnight
  useEffect(() => {
    if (!activeWorkSession || !activeWorkSession.isRunning || !activeWorkSession.startTimestamp) {
      return;
    }

    const todayStr = getTodayDateString();
    const sessionDate = activeWorkSession.date;

    if (sessionDate && sessionDate < todayStr && !isRolloverProcessingRef.current) {
      executeMidnightSessionRollover(activeWorkSession, sessionDate, todayStr);
    }
  }, [masterTimerTicker, activeWorkSession, executeMidnightSessionRollover]);

  // Work Session Handlers (Start, Stop with Reason & Auto-Gap Chaining)
  const startWorkSession = useCallback((task = null) => {
    if (isSessionTransitioningRef.current) return;
    isSessionTransitioningRef.current = true;
    setTimeout(() => { isSessionTransitioningRef.current = false; }, 800);

    const today = getTodayDateString();
    const existingChain = workChains[today] || {
      status: 'idle',
      accumulatedWorkSeconds: 0,
      chain: [],
    };

    const now = new Date();
    const nowTimestamp = Date.now();
    const nowTimeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });

    let updatedChainList = [...(existingChain.chain || [])];

    // If previously paused, auto-compute and record the gap with pause reason!
    if (existingChain.status === 'paused' && existingChain.lastPausedTimestamp) {
      const gapSeconds = Math.max(1, Math.round((nowTimestamp - existingChain.lastPausedTimestamp) / 1000));
      const gapMins = Math.floor(gapSeconds / 60);
      const gapHours = Math.floor(gapMins / 60);
      const gapLabel = gapHours > 0 ? `${gapHours}h ${gapMins % 60}m` : `${gapMins}m`;

      const gapNode = {
        id: `gap-${nowTimestamp}-${Math.random().toString(36).substring(2, 6)}`,
        type: 'gap',
        startTime: existingChain.lastPausedTimeStr || 'Earlier',
        endTime: nowTimeStr,
        durationSeconds: gapSeconds,
        durationLabel: gapLabel,
        reason: existingChain.lastPauseReason || 'Pause Break',
        remarks: existingChain.lastPauseRemarks || '',
      };
      updatedChainList.push(gapNode);
    }

    const newChainState = {
      ...existingChain,
      status: 'running',
      currentSegmentStart: nowTimestamp,
      lastPausedTimestamp: null,
      chain: updatedChainList,
    };

    setWorkChains((prev) => {
      const updated = { ...prev, [today]: newChainState };
      storageService.saveWorkChains(updated);
      return updated;
    });

    const currentSessions = (workSessions && workSessions.length > 0)
      ? workSessions
      : (storageService.getWorkSessions() || []);
    const todaySessions = currentSessions.filter((s) => s.date === today);
    const recordedTotalSeconds = todaySessions.reduce((acc, s) => acc + (Number(s.durationSeconds) || 0), 0);
    const baseSeconds = Math.max(
      recordedTotalSeconds,
      Number(existingChain.accumulatedWorkSeconds) || 0,
      Number(activeWorkSession?.baseAccumulatedSeconds) || 0
    );

    const newActive = {
      isRunning: true,
      startTimestamp: nowTimestamp,
      startTime: nowTimeStr,
      date: today,
      taskId: task?.id || null,
      taskTitle: task?.title || '',
      baseAccumulatedSeconds: baseSeconds,
      status: 'running',
    };
    setActiveWorkSession(newActive);
    storageService.saveActiveWorkSession(newActive);
    api.setActiveWorkSession(newActive).catch(() => {});

    showToast({
      type: 'success',
      title: existingChain.status === 'paused' ? 'Work Resumed' : 'Work Timer Started',
      message: task?.title ? `Focusing on: "${task.title}"` : 'Live session timer is tracking.',
    });
  }, [workChains, workSessions, activeWorkSession, showToast]);

  const requestStopWorkSession = useCallback(() => {
    setIsStopModalOpen(true);
  }, []);

  const cancelStopModal = useCallback(() => {
    setIsStopModalOpen(false);
  }, []);

  const completeStopWorkSession = useCallback(
    async ({ stopReason = 'Finished Work', notes = '', taskId = null, taskTitle = '' }) => {
      if (isSessionTransitioningRef.current) return;
      isSessionTransitioningRef.current = true;
      lastStoppedWorkSessionAtRef.current = Date.now();
      setTimeout(() => { isSessionTransitioningRef.current = false; }, 800);

      if (!activeWorkSession) {
        setIsStopModalOpen(false);
        return;
      }

      const now = new Date();
      const endTimestamp = Date.now();
      const todayStr = getTodayDateString();
      const sessionDate = activeWorkSession.date || todayStr;
      const endTime = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });

      const finalTaskId = taskId || activeWorkSession.taskId || null;
      const finalTaskTitle = taskTitle || activeWorkSession.taskTitle || '';

      // If session crossed midnight (e.g. started at 11:00 PM yesterday and stopped at 1:00 AM today):
      // Cleanly split into Day 1 (before midnight) and Day 2 (today up to now)
      if (sessionDate < todayStr) {
        const [y1, m1, d1] = sessionDate.split('-').map(Number);
        const [y2, m2, d2] = todayStr.split('-').map(Number);
        const midnightToday = new Date(y2, m2 - 1, d2, 0, 0, 0, 0);
        const midnightTimestamp = midnightToday.getTime();
        const startTs = Number(activeWorkSession.startTimestamp);

        const day1DurationSeconds = Math.max(1, Math.round((midnightTimestamp - startTs) / 1000));
        const day1EndStr = new Date(y1, m1 - 1, d1, 23, 59, 59).toLocaleTimeString([], {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
        });
        const day2StartStr = midnightToday.toLocaleTimeString([], {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
        });
        const day2DurationSeconds = Math.max(1, Math.round((endTimestamp - midnightTimestamp) / 1000));

        const day1SessionId = `session-${midnightTimestamp}-${Math.random().toString(36).substring(2, 6)}`;
        const day1SessionPayload = {
          id: day1SessionId,
          date: sessionDate,
          startTime: activeWorkSession.startTime,
          endTime: day1EndStr,
          durationSeconds: day1DurationSeconds,
          stopReason: 'Midnight Day Rollover',
          notes: `${finalTaskTitle ? `[${finalTaskTitle}] ` : ''}Cut off at midnight transition`,
          taskId: finalTaskId,
          taskTitle: finalTaskTitle,
        };

        const day2SessionId = `session-${endTimestamp}-${Math.random().toString(36).substring(2, 6)}`;
        const day2SessionPayload = {
          id: day2SessionId,
          date: todayStr,
          startTime: day2StartStr,
          endTime,
          durationSeconds: day2DurationSeconds,
          stopReason: stopReason || 'Finished Work',
          notes: notes || '',
          taskId: finalTaskId,
          taskTitle: finalTaskTitle,
        };

        // Save both completed sessions
        setWorkSessions((prev) => {
          const updated = [day2SessionPayload, day1SessionPayload, ...prev];
          storageService.saveWorkSessions(updated);
          return updated;
        });

        // Update chains for both dates
        setWorkChains((prev) => {
          const prevChain1 = prev[sessionDate] || { status: 'idle', accumulatedWorkSeconds: 0, chain: [] };
          const updatedChain1 = {
            ...prevChain1,
            status: 'paused',
            accumulatedWorkSeconds: (Number(prevChain1.accumulatedWorkSeconds) || 0) + day1DurationSeconds,
            lastPausedTimestamp: midnightTimestamp,
            lastPausedTimeStr: day1EndStr,
            chain: [
              ...(prevChain1.chain || []),
              {
                id: `work-${midnightTimestamp}-${Math.random().toString(36).substring(2, 6)}`,
                sessionId: day1SessionId,
                type: 'work',
                startTime: activeWorkSession.startTime,
                endTime: day1EndStr,
                durationSeconds: day1DurationSeconds,
                taskId: finalTaskId,
                taskTitle: finalTaskTitle,
                stopReason: 'Midnight Day Rollover',
                notes: 'Auto-closed at midnight transition',
              },
            ],
          };

          const prevChain2 = prev[todayStr] || { status: 'idle', accumulatedWorkSeconds: 0, chain: [] };
          const updatedChain2 = {
            ...prevChain2,
            status: 'paused',
            accumulatedWorkSeconds: (Number(prevChain2.accumulatedWorkSeconds) || 0) + day2DurationSeconds,
            lastPausedTimestamp: endTimestamp,
            lastPausedTimeStr: endTime,
            lastPauseReason: stopReason || 'Finished Work',
            lastPauseRemarks: notes || '',
            chain: [
              ...(prevChain2.chain || []),
              {
                id: `work-${endTimestamp}-${Math.random().toString(36).substring(2, 6)}`,
                sessionId: day2SessionId,
                type: 'work',
                startTime: day2StartStr,
                endTime,
                durationSeconds: day2DurationSeconds,
                taskId: finalTaskId,
                taskTitle: finalTaskTitle,
                stopReason: stopReason || 'Finished Work',
                notes: notes || '',
              },
            ],
          };

          const nextChains = { ...prev, [sessionDate]: updatedChain1, [todayStr]: updatedChain2 };
          storageService.saveWorkChains(nextChains);
          return nextChains;
        });

        setActiveWorkSession(null);
        storageService.saveActiveWorkSession(null);
        setIsStopModalOpen(false);
        api.clearActiveWorkSession().catch(() => {});

        api.createWorkSession(day1SessionPayload).catch(() => {});
        api.createWorkSession(day2SessionPayload).catch(() => {});

        showToast({
          type: 'info',
          title: 'Work Stopped Across Midnight',
          message: `Split: ${Math.round(day1DurationSeconds / 60)}m on ${sessionDate}, and ${Math.round(day2DurationSeconds / 60)}m on ${todayStr}.`,
        });
        return;
      }

      const segmentSeconds = Math.max(1, Math.round((endTimestamp - activeWorkSession.startTimestamp) / 1000));
      const sessionId = `session-${endTimestamp}-${Math.random().toString(36).substring(2, 6)}`;
      const workNode = {
        id: `work-${endTimestamp}-${Math.random().toString(36).substring(2, 6)}`,
        sessionId,
        type: 'work',
        startTime: activeWorkSession.startTime,
        endTime,
        durationSeconds: segmentSeconds,
        taskId: finalTaskId,
        taskTitle: finalTaskTitle,
        stopReason: stopReason || 'Finished Work',
        notes: notes || '',
      };

      const existingChain = workChains[sessionDate] || {
        status: 'idle',
        accumulatedWorkSeconds: 0,
        chain: [],
      };

      const newAccumulated = (existingChain.accumulatedWorkSeconds || 0) + segmentSeconds;
      const updatedChainState = {
        ...existingChain,
        status: 'paused',
        accumulatedWorkSeconds: newAccumulated,
        lastPausedTimestamp: endTimestamp,
        lastPausedTimeStr: endTime,
        lastPauseReason: stopReason || 'Break',
        lastPauseRemarks: notes || '',
        chain: [...(existingChain.chain || []), workNode],
      };

      setWorkChains((prev) => {
        const updated = { ...prev, [sessionDate]: updatedChainState };
        storageService.saveWorkChains(updated);
        return updated;
      });

      const sessionPayload = {
        id: sessionId,
        date: sessionDate,
        startTime: activeWorkSession.startTime,
        endTime,
        durationSeconds: segmentSeconds,
        stopReason: stopReason || 'Finished Work',
        notes: notes || '',
        taskId: finalTaskId,
        taskTitle: finalTaskTitle,
      };

      // Clear active session immediately
      setActiveWorkSession(null);
      storageService.saveActiveWorkSession(null);
      setIsStopModalOpen(false);
      api.clearActiveWorkSession().catch(() => {});

      // Save locally to historical workSessions
      setWorkSessions((prev) => {
        const updated = [sessionPayload, ...prev];
        storageService.saveWorkSessions(updated);
        return updated;
      });

      // Persist to backend
      try {
        const res = await api.createWorkSession(sessionPayload);
        const fresh = await api.getWorkSessions();
        if (fresh?.data && Array.isArray(fresh.data)) {
          setWorkSessions(fresh.data);
          storageService.saveWorkSessions(fresh.data);
        } else if (res?.data) {
          setWorkSessions((prev) =>
            prev.map((s) => (s.id === sessionPayload.id ? res.data : s))
          );
        }
      } catch (err) {
        console.warn('Saved work session locally:', err);
      }

      const durMinutes = Math.floor(segmentSeconds / 60);
      const totalHrs = (newAccumulated / 3600).toFixed(1);

      showToast({
        type: 'info',
        title: 'Work Paused · Reason Recorded',
        message: `Paused for "${stopReason}". Total logged: ${totalHrs}h. Click Resume when back.`,
      });
    },
    [activeWorkSession, workChains, showToast]
  );

  const finishDayWorkSession = useCallback((dateStr = getTodayDateString()) => {
    lastStoppedWorkSessionAtRef.current = Date.now();
    setActiveWorkSession(null);
    storageService.saveActiveWorkSession(null);
    api.clearActiveWorkSession().catch(() => {});
    setWorkChains((prev) => {
      const current = prev[dateStr] || { accumulatedWorkSeconds: 0, chain: [] };
      const updated = {
        ...prev,
        [dateStr]: {
          ...current,
          status: 'finished',
        },
      };
      storageService.saveWorkChains(updated);
      return updated;
    });
    showToast({
      type: 'success',
      title: 'Day Finalized',
      message: 'Work day completed! Timer reset for next session.',
    });
  }, [showToast]);

  const addManualWorkSession = useCallback(
    async (sessionData) => {
      // Check if session crosses midnight (e.g., 23:00 to 01:00)
      const sParts = (sessionData.startTime || '09:00:00').split(':').map(Number);
      const eParts = (sessionData.endTime || '10:00:00').split(':').map(Number);
      const sMinutes = (sParts[0] || 0) * 60 + (sParts[1] || 0);
      const eMinutes = (eParts[0] || 0) * 60 + (eParts[1] || 0);

      if (eMinutes < sMinutes) {
        const sessionDate = sessionData.date || getTodayDateString();
        const [y, m, d] = sessionDate.split('-').map(Number);
        const nextDate = new Date(y, m - 1, d + 1);
        const ny = nextDate.getFullYear();
        const nm = String(nextDate.getMonth() + 1).padStart(2, '0');
        const nd = String(nextDate.getDate()).padStart(2, '0');
        const nextDateStr = `${ny}-${nm}-${nd}`;

        const day1DurationSecs = ((24 * 60) - sMinutes) * 60;
        const day2DurationSecs = eMinutes * 60;

        const payload1 = {
          id: `session-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
          date: sessionDate,
          startTime: sessionData.startTime,
          endTime: '23:59:59',
          durationSeconds: day1DurationSecs,
          stopReason: sessionData.stopReason || 'Finished Work',
          notes: `${sessionData.notes ? sessionData.notes + ' ' : ''}[Part 1: before midnight]`,
          taskId: sessionData.taskId || null,
          taskTitle: sessionData.taskTitle || '',
        };

        const payload2 = {
          id: `session-${Date.now() + 1}-${Math.random().toString(36).substring(2, 6)}`,
          date: nextDateStr,
          startTime: '00:00:00',
          endTime: sessionData.endTime,
          durationSeconds: day2DurationSecs,
          stopReason: sessionData.stopReason || 'Finished Work',
          notes: `${sessionData.notes ? sessionData.notes + ' ' : ''}[Part 2: after midnight]`,
          taskId: sessionData.taskId || null,
          taskTitle: sessionData.taskTitle || '',
        };

        setWorkSessions((prev) => {
          const updated = [payload2, payload1, ...prev];
          storageService.saveWorkSessions(updated);
          return updated;
        });

        api.createWorkSession(payload1).catch(() => {});
        api.createWorkSession(payload2).catch(() => {});

        showToast({
          type: 'success',
          title: 'Session Split Across Midnight',
          message: `Logged ${Math.round(day1DurationSecs / 60)}m on ${sessionDate} and ${Math.round(day2DurationSecs / 60)}m on ${nextDateStr}.`,
        });
        return;
      }

      const payload = {
        id: `session-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        date: sessionData.date || getTodayDateString(),
        startTime: sessionData.startTime || '09:00:00',
        endTime: sessionData.endTime || '10:00:00',
        durationSeconds: Number(sessionData.durationSeconds) || 3600,
        stopReason: sessionData.stopReason || 'Finished Work',
        notes: sessionData.notes || '',
        taskId: sessionData.taskId || null,
        taskTitle: sessionData.taskTitle || '',
      };

      setWorkSessions((prev) => {
        const updated = [payload, ...prev];
        storageService.saveWorkSessions(updated);
        return updated;
      });

      try {
        const res = await api.createWorkSession(payload);
        if (res?.data) {
          setWorkSessions((prev) =>
            prev.map((s) => (s.id === payload.id ? res.data : s))
          );
        }
      } catch (e) {
        console.warn('Saved manual work session locally:', e);
      }

      showToast({
        type: 'success',
        title: 'Session Logged',
        message: `Manually added ${Math.round(payload.durationSeconds / 60)}m session.`,
      });
    },
    [showToast]
  );

  const deleteWorkSession = useCallback(
    async (sessionId) => {
      setWorkSessions((prev) => {
        const filtered = prev.filter((s) => s.id !== sessionId);
        storageService.saveWorkSessions(filtered);
        return filtered;
      });

      try {
        await api.deleteWorkSession(sessionId);
      } catch (e) {
        console.warn('Deleted work session locally:', e);
      }

      showToast({
        type: 'info',
        title: 'Session Removed',
        message: 'Work session deleted from log.',
      });
    },
    [showToast]
  );

  const updateWorkSession = useCallback(
    async (sessionId, updates) => {
      setWorkSessions((prev) => {
        const updated = prev.map((s) => (s.id === sessionId ? { ...s, ...updates } : s));
        storageService.saveWorkSessions(updated);
        return updated;
      });

      try {
        await api.updateWorkSession(sessionId, updates);
      } catch (e) {
        console.warn('Updated work session locally:', e);
      }

      showToast({
        type: 'success',
        title: 'Session Updated',
        message: 'Work log details updated.',
      });
    },
    [showToast]
  );

  // Schedule Deviations Handlers (Planned vs Actual / Mistakes)
  const addDeviation = useCallback(
    async (deviationData) => {
      let safeReason = deviationData.reasonCategory;
      if (typeof safeReason === 'object' && safeReason !== null) {
        safeReason = safeReason.name || safeReason.label || safeReason.id || 'Distraction';
      }
      safeReason = safeReason || 'Distraction';

      const payload = {
        id: deviationData.id || `dev-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        date: deviationData.date || getTodayDateString(),
        startTime: deviationData.startTime || '10:00',
        endTime: deviationData.endTime || '11:00',
        durationMinutes: Number(deviationData.durationMinutes) || 60,
        plannedAction: String(deviationData.plannedAction || ''),
        actualAction: String(deviationData.actualAction || ''),
        reasonCategory: String(safeReason),
        rootCause: typeof deviationData.rootCause === 'object' && deviationData.rootCause !== null ? JSON.stringify(deviationData.rootCause) : String(deviationData.rootCause || ''),
        lessonLearned: typeof deviationData.lessonLearned === 'object' && deviationData.lessonLearned !== null ? JSON.stringify(deviationData.lessonLearned) : String(deviationData.lessonLearned || ''),
        deviationType: typeof deviationData.deviationType === 'string' ? deviationData.deviationType : 'unproductive',
        taskId: deviationData.taskId || null,
      };

      setDeviations((prev) => {
        const updated = [payload, ...prev];
        storageService.saveDeviations(updated);
        return updated;
      });

      try {
        const res = await api.createDeviation(payload);
        if (res?.data) {
          const serverDev = {
            ...res.data,
            reasonCategory: typeof res.data.reasonCategory === 'object' && res.data.reasonCategory !== null
              ? (res.data.reasonCategory.name || res.data.reasonCategory.id || 'Distraction')
              : (res.data.reasonCategory || 'Distraction'),
          };
          setDeviations((prev) =>
            prev.map((d) => (d.id === payload.id ? serverDev : d))
          );
        }
      } catch (e) {
        console.warn('Saved deviation locally:', e);
      }

      showToast({
        type: 'info',
        title: 'Deviation Logged',
        message: 'Recorded what happened vs what was planned.',
      });
    },
    [showToast]
  );

  const updateDeviation = useCallback(
    async (id, updates) => {
      const safeUpdates = { ...updates };
      if (safeUpdates.reasonCategory !== undefined) {
        if (typeof safeUpdates.reasonCategory === 'object' && safeUpdates.reasonCategory !== null) {
          safeUpdates.reasonCategory = safeUpdates.reasonCategory.name || safeUpdates.reasonCategory.label || safeUpdates.reasonCategory.id || 'Distraction';
        } else {
          safeUpdates.reasonCategory = String(safeUpdates.reasonCategory || 'Distraction');
        }
      }

      setDeviations((prev) => {
        const updated = prev.map((d) => (d.id === id ? { ...d, ...safeUpdates } : d));
        storageService.saveDeviations(updated);
        return updated;
      });

      try {
        await api.updateDeviation(id, safeUpdates);
      } catch (e) {
        console.warn('Updated deviation locally:', e);
      }

      showToast({
        type: 'success',
        title: 'Log Updated',
        message: 'Deviation details updated.',
      });
    },
    [showToast]
  );

  const deleteDeviation = useCallback(
    async (id) => {
      setDeviations((prev) => {
        const filtered = prev.filter((d) => d.id !== id);
        storageService.saveDeviations(filtered);
        return filtered;
      });

      try {
        await api.deleteDeviation(id);
      } catch (e) {
        console.warn('Deleted deviation locally:', e);
      }

      showToast({
        type: 'info',
        title: 'Log Removed',
        message: 'Deviation record deleted.',
      });
    },
    [showToast]
  );

  // Work & Missed Work Requests Handlers
  const submitWorkRequest = useCallback(
    async (requestData) => {
      if (!requestData?.reason || !requestData.reason.trim()) {
        showToast({
          type: 'error',
          title: 'Reason Required',
          message: 'Please provide a reason for this missed work request.',
        });
        return { success: false, error: 'Reason is required' };
      }

      const payload = {
        id: `req-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        title: requestData.title?.trim() || 'Missed Work Entry',
        date: requestData.date || getTodayDateString(),
        startTime: requestData.startTime || '09:00',
        endTime: requestData.endTime || '10:00',
        reason: requestData.reason.trim(),
        status: 'pending',
        actionRemarks: '',
        taskId: requestData.taskId || null,
        taskTitle: requestData.taskTitle || '',
        createdAt: new Date().toISOString(),
      };

      setRequests((prev) => {
        const updated = [payload, ...prev];
        storageService.saveRequests(updated);
        return updated;
      });

      try {
        const res = await api.createRequest(payload);
        if (res?.data) {
          setRequests((prev) =>
            prev.map((r) => (r.id === payload.id ? res.data : r))
          );
        }
      } catch (e) {
        console.warn('Saved work request locally:', e);
      }

      showToast({
        type: 'success',
        title: 'Request Submitted',
        message: 'Your missed work request has been recorded.',
      });
      return { success: true, request: payload };
    },
    [showToast]
  );

  const completeWorkRequest = useCallback(
    async (requestId, remarks = '') => {
      setRequests((prev) => {
        const updated = prev.map((r) =>
          r.id === requestId
            ? { ...r, status: 'completed', actionRemarks: remarks || 'Marked completed by user', updatedAt: new Date().toISOString() }
            : r
        );
        storageService.saveRequests(updated);
        return updated;
      });

      try {
        await api.completeRequest(requestId, { remarks });
      } catch (e) {
        console.warn('Completed work request locally:', e);
      }

      showToast({
        type: 'success',
        title: 'Marked Completed',
        message: 'Work request has been marked as completed.',
      });
    },
    [showToast]
  );

  const rescheduleWorkRequest = useCallback(
    async (requestId, { date, startTime, endTime, remarks = '' }) => {
      const targetReq = requests.find((r) => r.id === requestId);
      const targetDate = date || targetReq?.date;
      const targetStart = startTime || targetReq?.startTime;
      const targetEnd = endTime || targetReq?.endTime;
      const finalRemarks = remarks || `Rescheduled to ${targetDate}${targetStart ? ` (${targetStart} - ${targetEnd})` : ''}`;

      setRequests((prev) => {
        const updated = prev.map((r) =>
          r.id === requestId
            ? {
              ...r,
              status: 'rescheduled',
              rescheduledDate: targetDate,
              rescheduledStartTime: targetStart,
              rescheduledEndTime: targetEnd,
              actionRemarks: finalRemarks,
              updatedAt: new Date().toISOString(),
            }
            : r
        );
        storageService.saveRequests(updated);
        return updated;
      });

      // If linked to a task in tasks, update the task to normal pending task
      if (targetReq?.taskId) {
        updateTask(targetReq.taskId, {
          date: targetDate,
          startTime: targetStart,
          endTime: targetEnd,
          status: 'pending',
        });
      }

      try {
        await api.rescheduleRequest(requestId, {
          date: targetDate,
          startTime: targetStart,
          endTime: targetEnd,
          remarks: finalRemarks,
          actionRemarks: finalRemarks,
        });
      } catch (e) {
        console.warn('Rescheduled work request locally:', e);
      }

      showToast({
        type: 'info',
        title: 'Work Rescheduled',
        message: `Rescheduled to ${targetDate}${targetStart ? ` at ${targetStart}` : ''}.`,
      });
    },
    [requests, showToast, updateTask]
  );

  const cancelWorkRequest = useCallback(
    async (requestId, remarks) => {
      if (!remarks || !remarks.trim()) {
        showToast({
          type: 'error',
          title: 'Remarks Required',
          message: 'You must provide a cancellation reason/remark to cancel.',
        });
        return false;
      }

      setRequests((prev) => {
        const updated = prev.map((r) =>
          r.id === requestId
            ? {
              ...r,
              status: 'cancelled',
              actionRemarks: remarks.trim(),
              updatedAt: new Date().toISOString(),
            }
            : r
        );
        storageService.saveRequests(updated);
        return updated;
      });

      try {
        await api.cancelRequest(requestId, { remarks: remarks.trim() });
      } catch (e) {
        console.warn('Cancelled work request locally:', e);
      }

      showToast({
        type: 'warning',
        title: 'Request Cancelled',
        message: `Cancelled with remarks: "${remarks.trim()}".`,
      });
      return true;
    },
    [showToast]
  );

  const deleteWorkRequest = useCallback(
    async (requestId) => {
      setRequests((prev) => {
        const filtered = prev.filter((r) => r.id !== requestId);
        storageService.saveRequests(filtered);
        return filtered;
      });

      try {
        await api.deleteRequest(requestId);
      } catch (e) {
        console.warn('Deleted work request locally:', e);
      }

      showToast({
        type: 'info',
        title: 'Request Deleted',
        message: 'Missed work request removed.',
      });
    },
    [showToast]
  );

  return (
    <AppContext.Provider
      value={{
        selectedDate,
        setSelectedDate,
        tasks,
        categories,
        events,
        goals,
        settings,
        setSettings: updateSettings,
        notifications,
        user,
        setUser,
        globalSearchQuery,
        setGlobalSearchQuery,
        sidebarCollapsed,
        setSidebarCollapsed,
        mobileSidebarOpen,
        setMobileSidebarOpen,
        activeModal,
        openModal,
        closeModal,
        confirmDialog,
        requestConfirm,
        toasts,
        showToast,
        removeToast: handleRemoveToast,
        addTask,
        bulkImportTasks,
        updateTask,
        deleteTask,
        toggleTaskComplete,
        moveTaskSlot,
        addEvent,
        updateEvent,
        deleteEvent,
        addGoal,
        bulkImportGoals,
        updateGoal,
        deleteGoal,
        linkTaskToGoal,
        unlinkTaskFromGoal,
        addCategory,
        bulkImportCategories,
        updateCategory,
        deleteCategory,
        resetDemoData,
        clearAllData,
        markNotificationRead,
        clearNotifications,
        dailyReports,
        saveDailyReport,
        deleteDailyReport,
        workSessions,
        activeWorkSession,
        isStopModalOpen,
        setIsStopModalOpen,
        startWorkSession,
        requestStopWorkSession,
        cancelStopModal,
        completeStopWorkSession,
        addManualWorkSession,
        deleteWorkSession,
        updateWorkSession,
        deviations,
        addDeviation,
        updateDeviation,
        deleteDeviation,
        requests,
        submitWorkRequest,
        logRescheduledTask,
        completeWorkRequest,
        rescheduleWorkRequest,
        cancelWorkRequest,
        deleteWorkRequest,
        fetchAllData,
        isSyncing,
        lastSyncedAt,
        importHistory,
        addImportHistoryEntry,
        deleteImportBatch,
        workChains,
        finishDayWorkSession,
        masterTimerTicker,
        currentLiveWorkSeconds,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
}
