import React, { createContext, useContext, useCallback, useMemo } from 'react';
import { useTasks, useCreateTask, useUpdateTask, useDeleteTask, useToggleTaskComplete, useBulkCreateTasks } from '../hooks/useApi';
import { findScheduleConflict } from '../utils/taskUtils';
import { showToast } from './UIContext';

const TasksContext = createContext(null);

export function TasksProvider({ children, selectedDate }) {
  // Use React Query for server state
  const { data: tasksResponse, isLoading, error, refetch } = useTasks({ date: selectedDate });
  const tasks = tasksResponse?.data || [];

  const createTaskMutation = useCreateTask();
  const updateTaskMutation = useUpdateTask();
  const deleteTaskMutation = useDeleteTask();
  const toggleTaskCompleteMutation = useToggleTaskComplete();
  const bulkCreateTasksMutation = useBulkCreateTasks();

  const addTask = useCallback(async (taskData) => {
    const payload = {
      title: taskData.title || 'Untitled Task',
      description: taskData.description || '',
      date: taskData.date,
      startTime: taskData.startTime || '09:00',
      endTime: taskData.endTime || '10:00',
      categoryId: taskData.categoryId || null,
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
      const result = await createTaskMutation.mutateAsync(payload);
      const created = result?.data || { id: `task-${Date.now()}`, ...payload };
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
      showToast({ type: 'error', title: 'Error', message: 'Failed to create task' });
      return null;
    }
  }, [tasks, createTaskMutation, showToast]);

  const updateTask = useCallback(async (taskId, updates) => {
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

    try {
      await updateTaskMutation.mutateAsync({ id: taskId, payload: updates });
      showToast({
        type: 'info',
        title: 'Task Updated',
        message: 'Changes saved successfully.',
      });
      return true;
    } catch (err) {
      const errorMsg = err?.response?.data?.message;
      if (errorMsg) {
        showToast({ type: 'error', title: 'Error', message: errorMsg });
        return false;
      }
      showToast({ type: 'error', title: 'Error', message: 'Failed to update task' });
      return false;
    }
  }, [tasks, updateTaskMutation, showToast]);

  const deleteTask = useCallback(async (taskId) => {
    try {
      await deleteTaskMutation.mutateAsync(taskId);
      showToast({ type: 'info', title: 'Task Deleted', message: 'Task was removed.' });
    } catch (err) {
      showToast({ type: 'error', title: 'Error', message: 'Failed to delete task' });
    }
  }, [deleteTaskMutation, showToast]);

  const toggleTaskComplete = useCallback(async (taskId) => {
    const target = tasks.find((t) => t.id === taskId);
    const isDone = target?.status === 'completed';
    showToast({
      type: isDone ? 'info' : 'success',
      title: isDone ? 'Task Incomplete' : 'Task Done',
      message: `"${target?.title || 'Task'}"`,
    });
    try {
      await toggleTaskCompleteMutation.mutateAsync(taskId);
    } catch (err) {
      showToast({ type: 'error', title: 'Error', message: 'Failed to toggle task' });
    }
  }, [tasks, toggleTaskCompleteMutation, showToast]);

  const bulkImportTasks = useCallback(async (items, options = {}) => {
    try {
      const result = await bulkCreateTasksMutation.mutateAsync(items);
      const created = result?.data || items.map((t, i) => ({ id: `task-${Date.now()}-${i}`, ...t }));
      if (!options.silent) {
        showToast({
          type: 'success',
          title: 'Tasks Imported',
          message: `Successfully imported ${created.length} tasks.`,
        });
      }
      return { success: true, count: created.length, data: created };
    } catch (err) {
      showToast({ type: 'error', title: 'Error', message: 'Failed to import tasks' });
      return { success: false, error: err.message };
    }
  }, [bulkCreateTasksMutation, showToast]);

  const value = useMemo(() => ({
    tasks,
    isLoading,
    error,
    refetch,
    addTask,
    updateTask,
    deleteTask,
    toggleTaskComplete,
    bulkImportTasks,
    createTaskMutation,
    updateTaskMutation,
    deleteTaskMutation,
    toggleTaskCompleteMutation,
  }), [
    tasks,
    isLoading,
    error,
    refetch,
    addTask,
    updateTask,
    deleteTask,
    toggleTaskComplete,
    bulkImportTasks,
    createTaskMutation,
    updateTaskMutation,
    deleteTaskMutation,
    toggleTaskCompleteMutation,
  ]);

  return (
    <TasksContext.Provider value={value}>
      {children}
    </TasksContext.Provider>
  );
}

export function useTasksContext() {
  const context = useContext(TasksContext);
  if (!context) {
    throw new Error('useTasksContext must be used within a TasksProvider');
  }
  return context;
}