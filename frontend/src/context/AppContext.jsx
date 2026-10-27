import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
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

  // Keep local user state synchronized with Redux auth user
  useEffect(() => {
    if (authUser) {
      setUser(authUser);
    }
  }, [authUser]);

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

  // Real-time backend data synchronization across Web & Mobile
  const fetchAllData = useCallback(async () => {
    try {
      const [tasksRes, categoriesRes, goalsRes, eventsRes, workSessionsRes] = await Promise.all([
        api.getTasks().catch(() => null),
        api.getCategories().catch(() => null),
        api.getGoals().catch(() => null),
        api.getEvents().catch(() => null),
        api.getWorkSessions().catch(() => null),
      ]);

      if (tasksRes?.data && Array.isArray(tasksRes.data)) {
        const serverIds = new Set(tasksRes.data.map((t) => t.id));
        const localTasks = storageService.getTasks().filter((t) => !serverIds.has(t.id));
        dispatch(setTasks([...tasksRes.data, ...localTasks]));
      }
      if (categoriesRes?.data && Array.isArray(categoriesRes.data)) {
        const serverIds = new Set(categoriesRes.data.map((c) => c.id));
        const localCats = storageService.getCategories().filter((c) => !serverIds.has(c.id));
        dispatch(setCategories([...categoriesRes.data, ...localCats]));
      }
      if (goalsRes?.data && Array.isArray(goalsRes.data)) {
        const serverIds = new Set(goalsRes.data.map((g) => g.id));
        const localGoals = storageService.getGoals().filter((g) => !serverIds.has(g.id));
        dispatch(setGoals([...goalsRes.data, ...localGoals]));
      }
      if (eventsRes?.data && Array.isArray(eventsRes.data)) {
        const serverIds = new Set(eventsRes.data.map((e) => e.id));
        const localEvents = storageService.getEvents().filter((e) => !serverIds.has(e.id));
        dispatch(setEvents([...eventsRes.data, ...localEvents]));
      }
      if (workSessionsRes?.data && Array.isArray(workSessionsRes.data)) {
        const serverIds = new Set(workSessionsRes.data.map((s) => s.id));
        const localSessions = storageService.getWorkSessions().filter((s) => !serverIds.has(s.id));
        const combined = [...workSessionsRes.data, ...localSessions];
        setWorkSessions(combined);
        storageService.saveWorkSessions(combined);
      }
    } catch (err) {
      console.warn('Backend sync warning:', err);
    }
  }, [dispatch]);

  useEffect(() => {
    fetchAllData();

    // Automatically re-sync whenever user focuses the browser tab or returns to web
    const handleWindowFocus = () => {
      fetchAllData();
    };

    window.addEventListener('focus', handleWindowFocus);
    return () => {
      window.removeEventListener('focus', handleWindowFocus);
    };
  }, [fetchAllData, authUser]);

  // Toast System
  const showToast = useCallback(
    ({ type = 'info', title = '', message = '' }) => {
      const id = Date.now().toString() + Math.random().toString(36).substring(2, 6);
      const newToast = { id, type, title, message };
      dispatch(addToast(newToast));
      setTimeout(() => {
        dispatch(removeToast(id));
      }, 4000);
    },
    [dispatch]
  );

  const handleRemoveToast = useCallback(
    (id) => {
      dispatch(removeToast(id));
    },
    [dispatch]
  );

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

  const updateTask = useCallback(
    async (taskId, updates) => {
      const existing = tasks.find((t) => t.id === taskId);
      const targetDate = updates.date !== undefined ? updates.date : existing?.date;
      const targetStart = updates.startTime !== undefined ? updates.startTime : existing?.startTime;
      const targetEnd = updates.endTime !== undefined ? updates.endTime : existing?.endTime;

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

      dispatch(updateTaskAction({ id: taskId, ...updates }));
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
        title: isDone ? 'Task Incomplete' : 'Task Completed',
        message: `"${target?.title || 'Task'}" is now marked as ${newStatus}.`,
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

  // Daily Work Reporting
  const saveDailyReport = useCallback(
    (reportData) => {
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
      showToast({
        type: 'success',
        title: 'Daily Report Saved',
        message: `Work report for ${reportData.date} recorded successfully.`,
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
        onConfirm: () => {
          const filtered = dailyReports.filter((r) => r.id !== reportId);
          setDailyReports(filtered);
          storageService.saveDailyReports(filtered);
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
      message: 'This will completely clear all tasks, events, goals, and settings from browser LocalStorage.',
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
      // Sync to backend if accessible
      api.updateSettings(nextSettings).catch(() => {});
    },
    [dispatch, settings]
  );

  // Work Session Handlers (Start, Stop with Reason, Manual Log, Delete)
  const startWorkSession = useCallback((task = null) => {
    const now = new Date();
    const newActive = {
      isRunning: true,
      startTimestamp: Date.now(),
      startTime: now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      date: getTodayDateString(),
      taskId: task?.id || null,
      taskTitle: task?.title || '',
    };
    setActiveWorkSession(newActive);
    storageService.saveActiveWorkSession(newActive);
    showToast({
      type: 'success',
      title: 'Work Timer Started',
      message: task?.title ? `Focusing on: "${task.title}"` : 'Live work session is now tracking.',
    });
  }, [showToast]);

  const requestStopWorkSession = useCallback(() => {
    setIsStopModalOpen(true);
  }, []);

  const cancelStopModal = useCallback(() => {
    setIsStopModalOpen(false);
  }, []);

  const completeStopWorkSession = useCallback(
    async ({ stopReason = 'Finished Work', notes = '', taskId = null, taskTitle = '' }) => {
      if (!activeWorkSession) {
        setIsStopModalOpen(false);
        return;
      }

      const now = new Date();
      const endTimestamp = Date.now();
      const durationSeconds = Math.max(1, Math.round((endTimestamp - activeWorkSession.startTimestamp) / 1000));
      const endTime = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
      const sessionDate = activeWorkSession.date || getTodayDateString();

      const finalTaskId = taskId || activeWorkSession.taskId || null;
      const finalTaskTitle = taskTitle || activeWorkSession.taskTitle || '';

      const sessionPayload = {
        id: `session-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        date: sessionDate,
        startTime: activeWorkSession.startTime,
        endTime,
        durationSeconds,
        stopReason: stopReason || 'Finished Work',
        notes: notes || '',
        taskId: finalTaskId,
        taskTitle: finalTaskTitle,
      };

      // Clear active session immediately
      setActiveWorkSession(null);
      storageService.saveActiveWorkSession(null);
      setIsStopModalOpen(false);

      // Save locally
      setWorkSessions((prev) => {
        const updated = [sessionPayload, ...prev];
        storageService.saveWorkSessions(updated);
        return updated;
      });

      // Persist to backend
      try {
        const res = await api.createWorkSession(sessionPayload);
        if (res?.data) {
          setWorkSessions((prev) =>
            prev.map((s) => (s.id === sessionPayload.id ? res.data : s))
          );
        }
      } catch (err) {
        console.warn('Saved work session locally:', err);
      }

      const durMinutes = Math.floor(durationSeconds / 60);
      const durSecs = durationSeconds % 60;
      const durationLabel = durMinutes > 0 ? `${durMinutes}m ${durSecs}s` : `${durSecs}s`;

      showToast({
        type: 'info',
        title: 'Work Session Recorded',
        message: `Duration: ${durationLabel} · Reason: ${stopReason}`,
      });
    },
    [activeWorkSession, showToast]
  );

  const addManualWorkSession = useCallback(
    async (sessionData) => {
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
