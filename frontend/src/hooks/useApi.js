import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import { api } from '../services/api';

// Query Keys for consistent caching
export const queryKeys = {
  tasks: (params = {}) => ['tasks', params],
  task: (id) => ['task', id],
  categories: () => ['categories'],
  category: (id) => ['category', id],
  events: (params = {}) => ['events', params],
  event: (id) => ['event', id],
  goals: () => ['goals'],
  goal: (id) => ['goal', id],
  reports: (params = {}) => ['reports', params],
  report: (date) => ['report', date],
  notifications: () => ['notifications'],
  settings: () => ['settings'],
  userProfile: () => ['userProfile'],
  thoughts: (params = {}) => ['thoughts', params],
  knowledgeItems: (params = {}) => ['knowledgeItems', params],
  workSessions: (params = {}) => ['workSessions', params],
  activeWorkSession: () => ['activeWorkSession'],
  deviations: (params = {}) => ['deviations', params],
  requests: (params = {}) => ['requests', params],
  habits: (params = {}) => ['habits', params],
  habit: (id, includeLogs = false) => ['habit', id, { includeLogs }],
  habitsReport: () => ['habitsReport'],
};

// ============ TASKS ============
export function useTasks(params = {}) {
  return useQuery({
    queryKey: queryKeys.tasks(params),
    queryFn: () => api.getTasks(params),
    placeholderData: keepPreviousData,
  });
}

export function useTask(id) {
  return useQuery({
    queryKey: queryKeys.task(id),
    queryFn: () => api.getTask(id),
    enabled: !!id,
  });
}

export function useCreateTask() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: api.createTask,
    onMutate: async (newTask) => {
      await queryClient.cancelQueries({ queryKey: ['tasks'] });
      const previous = queryClient.getQueriesData({ queryKey: ['tasks'] });

      // Add optimistic task to cache
      queryClient.setQueriesData({ queryKey: ['tasks'] }, (old) => {
        if (!old || !old.data) return old;
        // Only add to cache if it matches the current filter (date)
        return {
          ...old,
          data: [newTask, ...old.data]
        };
      });

      return { previous };
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) {
        context.previous.forEach(([key, data]) => queryClient.setQueryData(key, data));
      }
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: ['tasks'] }),
  });
}

export function useUpdateTask() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }) => api.updateTask(id, payload),
    onMutate: async ({ id, payload }) => {
      await queryClient.cancelQueries({ queryKey: ['tasks'] });
      const previous = queryClient.getQueriesData({ queryKey: ['tasks'] });

      queryClient.setQueriesData({ queryKey: ['tasks'] }, (old) => {
        if (!old || !old.data) return old;
        return {
          ...old,
          data: old.data.map(task =>
            task.id === id ? { ...task, ...payload } : task
          )
        };
      });

      return { previous };
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) {
        context.previous.forEach(([key, data]) => queryClient.setQueryData(key, data));
      }
    },
    onSettled: (_err, _vars, _context) => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
    },
  });
}

export function useDeleteTask() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: api.deleteTask,
    onMutate: async (taskId) => {
      await queryClient.cancelQueries({ queryKey: ['tasks'] });
      const previous = queryClient.getQueriesData({ queryKey: ['tasks'] });

      queryClient.setQueriesData({ queryKey: ['tasks'] }, (old) => {
        if (!old || !old.data) return old;
        return {
          ...old,
          data: old.data.filter(task => task.id !== taskId)
        };
      });

      return { previous };
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) {
        context.previous.forEach(([key, data]) => queryClient.setQueryData(key, data));
      }
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: ['tasks'] }),
  });
}

export function useToggleTaskComplete() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: api.toggleTaskComplete,
    onMutate: async (taskId) => {
      // Cancel any outgoing refetches to avoid overwriting our optimistic update
      await queryClient.cancelQueries({ queryKey: ['tasks'] });

      // Snapshot the previous value from all task query keys
      const previousQueries = queryClient.getQueriesData({ queryKey: ['tasks'] });

      // Optimistically update the task status in all cached variants
      queryClient.setQueriesData({ queryKey: ['tasks'] }, (old) => {
        if (!old || !old.data) return old;
        return {
          ...old,
          data: old.data.map(task =>
            task.id === taskId
              ? { ...task, status: task.status === 'completed' ? 'pending' : 'completed' }
              : task
          )
        };
      });

      return { previousQueries };
    },
    onError: (_err, _taskId, context) => {
      // Rollback all optimistic updates on error
      if (context?.previousQueries) {
        context.previousQueries.forEach(([queryKey, queryData]) => {
          if (queryClient && queryClient.setQueryData) {
            queryClient.setQueryData(queryKey, queryData);
          }
        });
      }
    },
    onSettled: () => {
      // Refetch to ensure consistency with server after mutation completes
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
    },
  });
}

export function useBulkCreateTasks() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: api.bulkCreateTasks,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
    },
  });
}

// ============ CATEGORIES ============
export function useCategories() {
  return useQuery({
    queryKey: queryKeys.categories(),
    queryFn: api.getCategories,
    staleTime: 5 * 60 * 1000, // 5 minutes - categories change rarely
  });
}

export function useCreateCategory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: api.createCategory,
    onMutate: async (newCat) => {
      await queryClient.cancelQueries({ queryKey: ['categories'] });
      const previous = queryClient.getQueriesData({ queryKey: ['categories'] });
      queryClient.setQueriesData({ queryKey: ['categories'] }, (old) => {
        if (!old || !old.data) return old;
        return { ...old, data: [newCat, ...old.data] };
      });
      return { previous };
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) context.previous.forEach(([k, d]) => queryClient.setQueryData(k, d));
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: ['categories'] }),
  });
}

export function useUpdateCategory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }) => api.updateCategory(id, payload),
    onMutate: async ({ id, payload }) => {
      await queryClient.cancelQueries({ queryKey: ['categories'] });
      const previous = queryClient.getQueriesData({ queryKey: ['categories'] });
      queryClient.setQueriesData({ queryKey: ['categories'] }, (old) => {
        if (!old || !old.data) return old;
        return { ...old, data: old.data.map(c => c.id === id ? { ...c, ...payload } : c) };
      });
      return { previous };
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) context.previous.forEach(([k, d]) => queryClient.setQueryData(k, d));
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: ['categories'] }),
  });
}

export function useDeleteCategory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: api.deleteCategory,
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: ['categories'] });
      const previous = queryClient.getQueriesData({ queryKey: ['categories'] });
      queryClient.setQueriesData({ queryKey: ['categories'] }, (old) => {
        if (!old || !old.data) return old;
        return { ...old, data: old.data.filter(c => c.id !== id) };
      });
      return { previous };
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) context.previous.forEach(([k, d]) => queryClient.setQueryData(k, d));
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: ['categories'] }),
  });
}

export function useBulkCreateCategories() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: api.bulkCreateCategories,
    onMutate: async (items) => {
      await queryClient.cancelQueries({ queryKey: ['categories'] });
      const previous = queryClient.getQueriesData({ queryKey: ['categories'] });
      queryClient.setQueriesData({ queryKey: ['categories'] }, (old) => {
        if (!old || !old.data) return old;
        return { ...old, data: [...items, ...old.data] };
      });
      return { previous };
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) context.previous.forEach(([k, d]) => queryClient.setQueryData(k, d));
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: ['categories'] }),
  });
}

// ============ EVENTS ============
export function useEvents(params = {}) {
  return useQuery({
    queryKey: queryKeys.events(params),
    queryFn: () => api.getEvents(params),
    placeholderData: keepPreviousData,
  });
}

export function useCreateEvent() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: api.createEvent,
    onMutate: async (newEvent) => {
      await queryClient.cancelQueries({ queryKey: ['events'] });
      const previous = queryClient.getQueriesData({ queryKey: ['events'] });
      queryClient.setQueriesData({ queryKey: ['events'] }, (old) => {
        if (!old || !old.data) return old;
        return { ...old, data: [newEvent, ...old.data] };
      });
      return { previous };
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) context.previous.forEach(([k, d]) => queryClient.setQueryData(k, d));
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: ['events'] }),
  });
}

export function useUpdateEvent() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }) => api.updateEvent(id, payload),
    onMutate: async ({ id, payload }) => {
      await queryClient.cancelQueries({ queryKey: ['events'] });
      const previous = queryClient.getQueriesData({ queryKey: ['events'] });
      queryClient.setQueriesData({ queryKey: ['events'] }, (old) => {
        if (!old || !old.data) return old;
        return { ...old, data: old.data.map(e => e.id === id ? { ...e, ...payload } : e) };
      });
      return { previous };
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) context.previous.forEach(([k, d]) => queryClient.setQueryData(k, d));
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: ['events'] }),
  });
}

export function useDeleteEvent() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: api.deleteEvent,
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: ['events'] });
      const previous = queryClient.getQueriesData({ queryKey: ['events'] });
      queryClient.setQueriesData({ queryKey: ['events'] }, (old) => {
        if (!old || !old.data) return old;
        return { ...old, data: old.data.filter(e => e.id !== id) };
      });
      return { previous };
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) context.previous.forEach(([k, d]) => queryClient.setQueryData(k, d));
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: ['events'] }),
  });
}

// ============ GOALS ============
export function useGoals() {
  return useQuery({
    queryKey: queryKeys.goals(),
    queryFn: api.getGoals,
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
}

export function useCreateGoal() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: api.createGoal,
    onMutate: async (newGoal) => {
      await queryClient.cancelQueries({ queryKey: ['goals'] });
      await queryClient.cancelQueries({ queryKey: ['tasks'] });
      const previousGoals = queryClient.getQueriesData({ queryKey: ['goals'] });
      const previousTasks = queryClient.getQueriesData({ queryKey: ['tasks'] });
      queryClient.setQueriesData({ queryKey: ['goals'] }, (old) => {
        if (!old || !old.data) return old;
        return { ...old, data: [newGoal, ...old.data] };
      });
      return { previousGoals, previousTasks };
    },
    onError: (_err, _vars, context) => {
      if (context?.previousGoals) context.previousGoals.forEach(([k, d]) => queryClient.setQueryData(k, d));
      if (context?.previousTasks) context.previousTasks.forEach(([k, d]) => queryClient.setQueryData(k, d));
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['goals'] });
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
    },
  });
}

export function useUpdateGoal() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }) => api.updateGoal(id, payload),
    onMutate: async ({ id, payload }) => {
      await queryClient.cancelQueries({ queryKey: ['goals'] });
      const previous = queryClient.getQueriesData({ queryKey: ['goals'] });
      queryClient.setQueriesData({ queryKey: ['goals'] }, (old) => {
        if (!old || !old.data) return old;
        return { ...old, data: old.data.map(g => g.id === id ? { ...g, ...payload } : g) };
      });
      return { previous };
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) context.previous.forEach(([k, d]) => queryClient.setQueryData(k, d));
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: ['goals'] }),
  });
}

export function useDeleteGoal() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: api.deleteGoal,
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: ['goals'] });
      await queryClient.cancelQueries({ queryKey: ['tasks'] });
      const previousGoals = queryClient.getQueriesData({ queryKey: ['goals'] });
      const previousTasks = queryClient.getQueriesData({ queryKey: ['tasks'] });
      queryClient.setQueriesData({ queryKey: ['goals'] }, (old) => {
        if (!old || !old.data) return old;
        return { ...old, data: old.data.filter(g => g.id !== id) };
      });
      return { previousGoals, previousTasks };
    },
    onError: (_err, _vars, context) => {
      if (context?.previousGoals) context.previousGoals.forEach(([k, d]) => queryClient.setQueryData(k, d));
      if (context?.previousTasks) context.previousTasks.forEach(([k, d]) => queryClient.setQueryData(k, d));
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['goals'] });
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
    },
  });
}

export function useBulkCreateGoals() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: api.bulkCreateGoals,
    onMutate: async (items) => {
      await queryClient.cancelQueries({ queryKey: ['goals'] });
      const previous = queryClient.getQueriesData({ queryKey: ['goals'] });
      queryClient.setQueriesData({ queryKey: ['goals'] }, (old) => {
        if (!old || !old.data) return old;
        return { ...old, data: [...items, ...old.data] };
      });
      return { previous };
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) context.previous.forEach(([k, d]) => queryClient.setQueryData(k, d));
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: ['goals'] }),
  });
}

// ============ REPORTS ============
export function useReports(params = {}) {
  return useQuery({
    queryKey: queryKeys.reports(params),
    queryFn: () => api.getReports(params),
    placeholderData: keepPreviousData,
  });
}

export function useReportByDate(date) {
  return useQuery({
    queryKey: queryKeys.report(date),
    queryFn: () => api.getReportByDate(date),
    enabled: !!date,
  });
}

export function useSaveReport() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: api.saveReport,
    onMutate: async (newReport) => {
      await queryClient.cancelQueries({ queryKey: ['reports'] });
      const previous = queryClient.getQueriesData({ queryKey: ['reports'] });
      queryClient.setQueriesData({ queryKey: ['reports'] }, (old) => {
        if (!old || !old.data) return old;
        // Upsert - replace if exists, add if new
        const existingIndex = old.data.findIndex(r => r.date === newReport.date);
        let newData;
        if (existingIndex >= 0) {
          newData = old.data.map((r, i) => i === existingIndex ? newReport : r);
        } else {
          newData = [newReport, ...old.data];
        }
        return { ...old, data: newData };
      });
      return { previous };
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) context.previous.forEach(([k, d]) => queryClient.setQueryData(k, d));
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: ['reports'] }),
  });
}

export function useDeleteReport() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: api.deleteReport,
    onMutate: async (date) => {
      await queryClient.cancelQueries({ queryKey: ['reports'] });
      const previous = queryClient.getQueriesData({ queryKey: ['reports'] });
      queryClient.setQueriesData({ queryKey: ['reports'] }, (old) => {
        if (!old || !old.data) return old;
        return { ...old, data: old.data.filter(r => r.date !== date) };
      });
      return { previous };
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) context.previous.forEach(([k, d]) => queryClient.setQueryData(k, d));
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: ['reports'] }),
  });
}

// ============ SETTINGS ============
export function useSettings() {
  return useQuery({
    queryKey: queryKeys.settings(),
    queryFn: api.getSettings,
    staleTime: 5 * 60 * 1000,
  });
}

export function useUpdateSettings() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: api.updateSettings,
    onMutate: async (payload) => {
      await queryClient.cancelQueries({ queryKey: ['settings'] });
      const previous = queryClient.getQueriesData({ queryKey: ['settings'] });
      queryClient.setQueriesData({ queryKey: ['settings'] }, (old) => {
        if (!old || !old.data) return old;
        return { ...old, data: { ...old.data, ...payload } };
      });
      return { previous };
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) context.previous.forEach(([k, d]) => queryClient.setQueryData(k, d));
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: ['settings'] }),
  });
}

// ============ NOTIFICATIONS ============
export function useNotifications() {
  return useQuery({
    queryKey: queryKeys.notifications(),
    queryFn: api.getNotifications,
    refetchInterval: 30000, // Poll every 30s for notifications
  });
}

export function useMarkNotificationRead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: api.markNotificationRead,
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: ['notifications'] });
      const previous = queryClient.getQueriesData({ queryKey: ['notifications'] });
      queryClient.setQueriesData({ queryKey: ['notifications'] }, (old) => {
        if (!old || !old.data) return old;
        return { ...old, data: old.data.map(n => n.id === id ? { ...n, read: true } : n) };
      });
      return { previous };
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) context.previous.forEach(([k, d]) => queryClient.setQueryData(k, d));
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: ['notifications'] }),
  });
}

export function useMarkAllNotificationsRead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: api.markAllNotificationsRead,
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: ['notifications'] });
      const previous = queryClient.getQueriesData({ queryKey: ['notifications'] });
      queryClient.setQueriesData({ queryKey: ['notifications'] }, (old) => {
        if (!old || !old.data) return old;
        return { ...old, data: old.data.map(n => ({ ...n, read: true })) };
      });
      return { previous };
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) context.previous.forEach(([k, d]) => queryClient.setQueryData(k, d));
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: ['notifications'] }),
  });
}

export function useClearNotifications() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: api.clearNotifications,
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: ['notifications'] });
      const previous = queryClient.getQueriesData({ queryKey: ['notifications'] });
      queryClient.setQueriesData({ queryKey: ['notifications'] }, (old) => {
        if (!old) return old;
        return { ...old, data: [] };
      });
      return { previous };
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) context.previous.forEach(([k, d]) => queryClient.setQueryData(k, d));
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: ['notifications'] }),
  });
}

// ============ WORK SESSIONS ============
export function useWorkSessions(params = {}) {
  return useQuery({
    queryKey: queryKeys.workSessions(params),
    queryFn: () => api.getWorkSessions(params),
    placeholderData: keepPreviousData,
  });
}

export function useActiveWorkSession() {
  return useQuery({
    queryKey: queryKeys.activeWorkSession(),
    queryFn: api.getActiveWorkSession,
    refetchInterval: false,
  });
}

export function useSetActiveWorkSession() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: api.setActiveWorkSession,
    onMutate: async (payload) => {
      await queryClient.cancelQueries({ queryKey: ['activeWorkSession'] });
      const previous = queryClient.getQueriesData({ queryKey: ['activeWorkSession'] });
      queryClient.setQueriesData({ queryKey: ['activeWorkSession'] }, (old) => {
        if (!old) return old;
        return { ...old, data: { ...old.data, ...payload } };
      });
      return { previous };
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) context.previous.forEach(([k, d]) => queryClient.setQueryData(k, d));
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['activeWorkSession'] });
      queryClient.invalidateQueries({ queryKey: ['workSessions'] });
    },
  });
}

export function useClearActiveWorkSession() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: api.clearActiveWorkSession,
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: ['activeWorkSession'] });
      const previous = queryClient.getQueriesData({ queryKey: ['activeWorkSession'] });
      queryClient.setQueriesData({ queryKey: ['activeWorkSession'] }, (old) => {
        if (!old) return old;
        return { ...old, data: null };
      });
      return { previous };
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) context.previous.forEach(([k, d]) => queryClient.setQueryData(k, d));
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['activeWorkSession'] });
      queryClient.invalidateQueries({ queryKey: ['workSessions'] });
    },
  });
}

export function useCreateWorkSession() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: api.createWorkSession,
    onMutate: async (newSession) => {
      await queryClient.cancelQueries({ queryKey: ['workSessions'] });
      await queryClient.cancelQueries({ queryKey: ['activeWorkSession'] });
      const previousSessions = queryClient.getQueriesData({ queryKey: ['workSessions'] });
      const previousActive = queryClient.getQueriesData({ queryKey: ['activeWorkSession'] });
      queryClient.setQueriesData({ queryKey: ['workSessions'] }, (old) => {
        if (!old || !old.data) return old;
        return { ...old, data: [newSession, ...old.data] };
      });
      queryClient.setQueriesData({ queryKey: ['activeWorkSession'] }, (old) => {
        if (!old) return old;
        return { ...old, data: null }; // Clear active after creating completed session
      });
      return { previousSessions, previousActive };
    },
    onError: (_err, _vars, context) => {
      if (context?.previousSessions) context.previousSessions.forEach(([k, d]) => queryClient.setQueryData(k, d));
      if (context?.previousActive) context.previousActive.forEach(([k, d]) => queryClient.setQueryData(k, d));
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['workSessions'] });
      queryClient.invalidateQueries({ queryKey: ['activeWorkSession'] });
    },
  });
}

export function useUpdateWorkSession() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }) => api.updateWorkSession(id, payload),
    onMutate: async ({ id, payload }) => {
      await queryClient.cancelQueries({ queryKey: ['workSessions'] });
      const previous = queryClient.getQueriesData({ queryKey: ['workSessions'] });
      queryClient.setQueriesData({ queryKey: ['workSessions'] }, (old) => {
        if (!old || !old.data) return old;
        return { ...old, data: old.data.map(s => s.id === id ? { ...s, ...payload } : s) };
      });
      return { previous };
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) context.previous.forEach(([k, d]) => queryClient.setQueryData(k, d));
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: ['workSessions'] }),
  });
}

export function useDeleteWorkSession() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: api.deleteWorkSession,
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: ['workSessions'] });
      const previous = queryClient.getQueriesData({ queryKey: ['workSessions'] });
      queryClient.setQueriesData({ queryKey: ['workSessions'] }, (old) => {
        if (!old || !old.data) return old;
        return { ...old, data: old.data.filter(s => s.id !== id) };
      });
      return { previous };
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) context.previous.forEach(([k, d]) => queryClient.setQueryData(k, d));
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: ['workSessions'] }),
  });
}

// ============ DEVIATIONS ============
export function useDeviations(params = {}) {
  return useQuery({
    queryKey: queryKeys.deviations(params),
    queryFn: () => api.getDeviations(params),
    placeholderData: keepPreviousData,
  });
}

export function useCreateDeviation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: api.createDeviation,
    onMutate: async (newDev) => {
      await queryClient.cancelQueries({ queryKey: ['deviations'] });
      const previous = queryClient.getQueriesData({ queryKey: ['deviations'] });
      queryClient.setQueriesData({ queryKey: ['deviations'] }, (old) => {
        if (!old || !old.data) return old;
        return { ...old, data: [newDev, ...old.data] };
      });
      return { previous };
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) context.previous.forEach(([k, d]) => queryClient.setQueryData(k, d));
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: ['deviations'] }),
  });
}

export function useUpdateDeviation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }) => api.updateDeviation(id, payload),
    onMutate: async ({ id, payload }) => {
      await queryClient.cancelQueries({ queryKey: ['deviations'] });
      const previous = queryClient.getQueriesData({ queryKey: ['deviations'] });
      queryClient.setQueriesData({ queryKey: ['deviations'] }, (old) => {
        if (!old || !old.data) return old;
        return { ...old, data: old.data.map(d => d.id === id ? { ...d, ...payload } : d) };
      });
      return { previous };
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) context.previous.forEach(([k, d]) => queryClient.setQueryData(k, d));
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: ['deviations'] }),
  });
}

export function useDeleteDeviation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: api.deleteDeviation,
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: ['deviations'] });
      const previous = queryClient.getQueriesData({ queryKey: ['deviations'] });
      queryClient.setQueriesData({ queryKey: ['deviations'] }, (old) => {
        if (!old || !old.data) return old;
        return { ...old, data: old.data.filter(d => d.id !== id) };
      });
      return { previous };
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) context.previous.forEach(([k, d]) => queryClient.setQueryData(k, d));
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: ['deviations'] }),
  });
}

// ============ REQUESTS ============
export function useRequests(params = {}) {
  return useQuery({
    queryKey: queryKeys.requests(params),
    queryFn: () => api.getRequests(params),
    placeholderData: keepPreviousData,
  });
}

export function useCreateRequest() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: api.createRequest,
    onMutate: async (newReq) => {
      await queryClient.cancelQueries({ queryKey: ['requests'] });
      const previous = queryClient.getQueriesData({ queryKey: ['requests'] });
      queryClient.setQueriesData({ queryKey: ['requests'] }, (old) => {
        if (!old || !old.data) return old;
        return { ...old, data: [newReq, ...old.data] };
      });
      return { previous };
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) context.previous.forEach(([k, d]) => queryClient.setQueryData(k, d));
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: ['requests'] }),
  });
}

export function useCompleteRequest() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }) => api.completeRequest(id, payload),
    onMutate: async ({ id, payload }) => {
      await queryClient.cancelQueries({ queryKey: ['requests'] });
      const previous = queryClient.getQueriesData({ queryKey: ['requests'] });
      queryClient.setQueriesData({ queryKey: ['requests'] }, (old) => {
        if (!old || !old.data) return old;
        return { ...old, data: old.data.map(r => r.id === id ? { ...r, status: 'completed', ...payload } : r) };
      });
      return { previous };
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) context.previous.forEach(([k, d]) => queryClient.setQueryData(k, d));
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: ['requests'] }),
  });
}

export function useRescheduleRequest() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }) => api.rescheduleRequest(id, payload),
    onMutate: async ({ id, payload }) => {
      await queryClient.cancelQueries({ queryKey: ['requests'] });
      const previous = queryClient.getQueriesData({ queryKey: ['requests'] });
      queryClient.setQueriesData({ queryKey: ['requests'] }, (old) => {
        if (!old || !old.data) return old;
        return { ...old, data: old.data.map(r => r.id === id ? { ...r, status: 'rescheduled', ...payload } : r) };
      });
      return { previous };
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) context.previous.forEach(([k, d]) => queryClient.setQueryData(k, d));
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: ['requests'] }),
  });
}

export function useCancelRequest() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }) => api.cancelRequest(id, payload),
    onMutate: async ({ id, payload }) => {
      await queryClient.cancelQueries({ queryKey: ['requests'] });
      const previous = queryClient.getQueriesData({ queryKey: ['requests'] });
      queryClient.setQueriesData({ queryKey: ['requests'] }, (old) => {
        if (!old || !old.data) return old;
        return { ...old, data: old.data.map(r => r.id === id ? { ...r, status: 'cancelled', ...payload } : r) };
      });
      return { previous };
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) context.previous.forEach(([k, d]) => queryClient.setQueryData(k, d));
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: ['requests'] }),
  });
}

export function useDeleteRequest() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: api.deleteRequest,
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: ['requests'] });
      const previous = queryClient.getQueriesData({ queryKey: ['requests'] });
      queryClient.setQueriesData({ queryKey: ['requests'] }, (old) => {
        if (!old || !old.data) return old;
        return { ...old, data: old.data.filter(r => r.id !== id) };
      });
      return { previous };
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) context.previous.forEach(([k, d]) => queryClient.setQueryData(k, d));
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: ['requests'] }),
  });
}

// ============ HABITS ============
export function useHabits(params = {}) {
  return useQuery({
    queryKey: queryKeys.habits(params),
    queryFn: () => api.getHabits(params),
    staleTime: 60 * 1000, // 1 minute
  });
}

export function useHabit(id, includeLogs = false) {
  return useQuery({
    queryKey: queryKeys.habit(id, includeLogs),
    queryFn: () => api.getHabit(id, { params: { includeLogs: includeLogs ? 'true' : 'false' } }),
    enabled: !!id,
  });
}

export function useCreateHabit() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: api.createHabit,
    onMutate: async (newHabit) => {
      await queryClient.cancelQueries({ queryKey: ['habits'] });
      const previous = queryClient.getQueriesData({ queryKey: ['habits'] });
      queryClient.setQueriesData({ queryKey: ['habits'] }, (old) => {
        if (!old || !old.data) return old;
        return { ...old, data: [newHabit, ...old.data] };
      });
      return { previous };
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) context.previous.forEach(([k, d]) => queryClient.setQueryData(k, d));
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['habits'] });
      queryClient.invalidateQueries({ queryKey: ['habitsReport'] });
    },
  });
}

export function useUpdateHabit() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }) => api.updateHabit(id, payload),
    onMutate: async ({ id, payload }) => {
      await queryClient.cancelQueries({ queryKey: ['habits'] });
      const previous = queryClient.getQueriesData({ queryKey: ['habits'] });
      queryClient.setQueriesData({ queryKey: ['habits'] }, (old) => {
        if (!old || !old.data) return old;
        return { ...old, data: old.data.map(h => h.id === id ? { ...h, ...payload } : h) };
      });
      return { previous };
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) context.previous.forEach(([k, d]) => queryClient.setQueryData(k, d));
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['habits'] });
      queryClient.invalidateQueries({ queryKey: ['habitsReport'] });
    },
  });
}

export function useDeleteHabit() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: api.deleteHabit,
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: ['habits'] });
      const previous = queryClient.getQueriesData({ queryKey: ['habits'] });
      queryClient.setQueriesData({ queryKey: ['habits'] }, (old) => {
        if (!old || !old.data) return old;
        return { ...old, data: old.data.filter(h => h.id !== id) };
      });
      return { previous };
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) context.previous.forEach(([k, d]) => queryClient.setQueryData(k, d));
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['habits'] });
      queryClient.invalidateQueries({ queryKey: ['habitsReport'] });
    },
  });
}

export function useToggleHabitDate() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }) => api.toggleHabitDate(id, payload),
    onMutate: async ({ id, payload }) => {
      // 1. Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['habits'] });
      await queryClient.cancelQueries({ queryKey: ['habitsReport'] });

      // 2. Snapshot current state
      const previousHabits = queryClient.getQueryData(['habits']);

      // 3. Optimistically update UI
      queryClient.setQueriesData({ queryKey: ['habits'] }, (old) => {
        if (!old || !old.data) return old;
        return {
          ...old,
          data: old.data.map(habit => {
            if (habit.id === id) {
              // Note: We don't recalculate streaks here as it's complex,
              // but we flip the "completed today" flag if the date is today
              const todayStr = new Date().toISOString().split('T')[0];
              const isToday = payload.date === todayStr;
              return {
                ...habit,
                isCompletedToday: isToday ? payload.completed : habit.isCompletedToday
              };
            }
            return habit;
          })
        };
      });

      return { previousHabits };
    },
    onError: (_err, _vars, context) => {
      if (context?.previousHabits) {
        queryClient.setQueryData(['habits'], context.previousHabits);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['habits'] });
      queryClient.invalidateQueries({ queryKey: ['habitsReport'] });
    },
  });
}

export function useHabitsReport() {
  return useQuery({
    queryKey: queryKeys.habitsReport(),
    queryFn: api.getHabitsReport,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

// ============ THOUGHTS ============
export function useThoughts(params = {}) {
  return useQuery({
    queryKey: queryKeys.thoughts(params),
    queryFn: () => api.getThoughts(params),
    placeholderData: keepPreviousData,
  });
}

export function useCreateThought() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: api.createThought,
    onMutate: async (newThought) => {
      await queryClient.cancelQueries({ queryKey: ['thoughts'] });
      const previous = queryClient.getQueriesData({ queryKey: ['thoughts'] });
      queryClient.setQueriesData({ queryKey: ['thoughts'] }, (old) => {
        if (!old || !old.data) return old;
        return { ...old, data: [newThought, ...old.data] };
      });
      return { previous };
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) context.previous.forEach(([k, d]) => queryClient.setQueryData(k, d));
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: ['thoughts'] }),
  });
}

export function useUpdateThought() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }) => api.updateThought(id, payload),
    onMutate: async ({ id, payload }) => {
      await queryClient.cancelQueries({ queryKey: ['thoughts'] });
      const previous = queryClient.getQueriesData({ queryKey: ['thoughts'] });
      queryClient.setQueriesData({ queryKey: ['thoughts'] }, (old) => {
        if (!old || !old.data) return old;
        return { ...old, data: old.data.map(t => t.id === id ? { ...t, ...payload } : t) };
      });
      return { previous };
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) context.previous.forEach(([k, d]) => queryClient.setQueryData(k, d));
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: ['thoughts'] }),
  });
}

export function useDeleteThought() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: api.deleteThought,
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: ['thoughts'] });
      const previous = queryClient.getQueriesData({ queryKey: ['thoughts'] });
      queryClient.setQueriesData({ queryKey: ['thoughts'] }, (old) => {
        if (!old || !old.data) return old;
        return { ...old, data: old.data.filter(t => t.id !== id) };
      });
      return { previous };
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) context.previous.forEach(([k, d]) => queryClient.setQueryData(k, d));
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: ['thoughts'] }),
  });
}

// ============ KNOWLEDGE ============
export function useKnowledgeItems(params = {}) {
  return useQuery({
    queryKey: queryKeys.knowledgeItems(params),
    queryFn: () => api.getKnowledgeItems(params),
    placeholderData: keepPreviousData,
  });
}

export function useCreateKnowledgeItem() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: api.createKnowledgeItem,
    onMutate: async (newItem) => {
      await queryClient.cancelQueries({ queryKey: ['knowledgeItems'] });
      const previous = queryClient.getQueriesData({ queryKey: ['knowledgeItems'] });
      queryClient.setQueriesData({ queryKey: ['knowledgeItems'] }, (old) => {
        if (!old || !old.data) return old;
        return { ...old, data: [newItem, ...old.data] };
      });
      return { previous };
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) context.previous.forEach(([k, d]) => queryClient.setQueryData(k, d));
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: ['knowledgeItems'] }),
  });
}

export function useUpdateKnowledgeItem() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }) => api.updateKnowledgeItem(id, payload),
    onMutate: async ({ id, payload }) => {
      await queryClient.cancelQueries({ queryKey: ['knowledgeItems'] });
      const previous = queryClient.getQueriesData({ queryKey: ['knowledgeItems'] });
      queryClient.setQueriesData({ queryKey: ['knowledgeItems'] }, (old) => {
        if (!old || !old.data) return old;
        return { ...old, data: old.data.map(i => i.id === id ? { ...i, ...payload } : i) };
      });
      return { previous };
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) context.previous.forEach(([k, d]) => queryClient.setQueryData(k, d));
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: ['knowledgeItems'] }),
  });
}

export function useDeleteKnowledgeItem() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: api.deleteKnowledgeItem,
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: ['knowledgeItems'] });
      const previous = queryClient.getQueriesData({ queryKey: ['knowledgeItems'] });
      queryClient.setQueriesData({ queryKey: ['knowledgeItems'] }, (old) => {
        if (!old || !old.data) return old;
        return { ...old, data: old.data.filter(i => i.id !== id) };
      });
      return { previous };
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) context.previous.forEach(([k, d]) => queryClient.setQueryData(k, d));
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: ['knowledgeItems'] }),
  });
}

// ============ HEALTH ============
export function useHealthCheck() {
  return useQuery({
    queryKey: ['health'],
    queryFn: api.checkHealth,
    refetchInterval: 60000, // Check every minute
  });
}