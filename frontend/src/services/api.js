import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://my-schedule-somq.vercel.app/api';

/**
 * Custom Axios client configured for MySchedule API
 */
export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 15000,
});

/**
 * Request Interceptor: Attach JWT bearer token from localStorage
 */
apiClient.interceptors.request.use(
  (config) => {
    const token =
      localStorage.getItem('my_schedule_auth_token') ||
      localStorage.getItem('myschedule_auth_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

/**
 * Response Interceptor: Unwrap data payload and standardize error reporting
 */
apiClient.interceptors.response.use(
  (response) => {
    // Return the response body directly
    return response.data;
  },
  (error) => {
    const message =
      error.response?.data?.message ||
      error.response?.data?.error ||
      error.message ||
      'Network request failed. Please check your connection or backend server.';

    const customError = new Error(message);
    customError.status = error.response?.status;
    customError.data = error.response?.data;
    return Promise.reject(customError);
  }
);

/**
 * Modular API service using Axios
 */
export const api = {
  // Underlying axios instance for custom requests
  client: apiClient,

  // Health & Server Status
  checkHealth: () => apiClient.get('/health'),
  checkDbStatus: () => apiClient.get('/db-status'),

  // Authentication & User Accounts
  auth: {
    signup: (payload) => apiClient.post('/auth/signup', payload),
    login: (credentials, maybePassword) => {
      const payload =
        typeof credentials === 'string'
          ? { email: credentials, password: maybePassword }
          : credentials;
      return apiClient.post('/auth/login', payload);
    },
    demoLogin: (email) => {
      const payload = typeof email === 'string' ? { email } : (email || {});
      return apiClient.post('/auth/demo', payload);
    },
    logout: () => apiClient.post('/auth/logout'),
    getMe: () => apiClient.get('/auth/me'),
    updateProfile: (payload) => apiClient.put('/auth/profile', payload),
  },


  // Categories
  getCategories: () => apiClient.get('/categories'),
  getCategory: (id) => apiClient.get(`/categories/${id}`),
  createCategory: (payload) => apiClient.post('/categories', payload),
  bulkCreateCategories: (payload) =>
    apiClient.post('/categories/bulk', Array.isArray(payload) ? { categories: payload } : payload),
  updateCategory: (id, payload) => apiClient.put(`/categories/${id}`, payload),
  deleteCategory: (id) => apiClient.delete(`/categories/${id}`),

  // Tasks
  getTasks: (params = {}) => apiClient.get('/tasks', { params }),
  getTask: (id) => apiClient.get(`/tasks/${id}`),
  createTask: (payload) => apiClient.post('/tasks', payload),
  bulkCreateTasks: (payload) =>
    apiClient.post('/tasks/bulk', Array.isArray(payload) ? { tasks: payload } : payload),
  updateTask: (id, payload) => apiClient.put(`/tasks/${id}`, payload),
  toggleTaskComplete: (id) => apiClient.patch(`/tasks/${id}/toggle-complete`),
  deleteTask: (id) => apiClient.delete(`/tasks/${id}`),

  // Events
  getEvents: (params = {}) => apiClient.get('/events', { params }),
  getEvent: (id) => apiClient.get(`/events/${id}`),
  createEvent: (payload) => apiClient.post('/events', payload),
  updateEvent: (id, payload) => apiClient.put(`/events/${id}`, payload),
  deleteEvent: (id) => apiClient.delete(`/events/${id}`),

  // Goals
  getGoals: () => apiClient.get('/goals'),
  getGoal: (id) => apiClient.get(`/goals/${id}`),
  createGoal: (payload) => apiClient.post('/goals', payload),
  bulkCreateGoals: (payload) =>
    apiClient.post('/goals/bulk', Array.isArray(payload) ? { goals: payload } : payload),
  updateGoal: (id, payload) => apiClient.put(`/goals/${id}`, payload),
  deleteGoal: (id) => apiClient.delete(`/goals/${id}`),

  // Daily Reports & Analytics
  getReports: () => apiClient.get('/reports'),
  getReportByDate: (date) => apiClient.get(`/reports/${date}`),
  saveReport: (payload) => apiClient.post('/reports', payload),
  deleteReport: (date) => apiClient.delete(`/reports/${date}`),

  // Notifications
  getNotifications: () => apiClient.get('/notifications'),
  markNotificationRead: (id) => apiClient.patch(`/notifications/${id}/read`),
  markAllNotificationsRead: () => apiClient.patch('/notifications/mark-all-read'),
  clearNotifications: () => apiClient.delete('/notifications/clear-all'),

  // User Settings & Profile
  getSettings: () => apiClient.get('/settings'),
  updateSettings: (payload) => apiClient.put('/settings', payload),
  getUserProfile: () => apiClient.get('/user'),
  updateUserProfile: (payload) => apiClient.put('/user', payload),

  // Work Tracker & Time Sessions
  getWorkSessions: (params = {}) => apiClient.get('/work-sessions', { params }),
  createWorkSession: (payload) => apiClient.post('/work-sessions', payload),
  updateWorkSession: (id, payload) => apiClient.put(`/work-sessions/${id}`, payload),
  deleteWorkSession: (id) => apiClient.delete(`/work-sessions/${id}`),

  // Schedule Deviations & Mistakes Log (Planned vs Actual)
  getDeviations: (params = {}) => apiClient.get('/deviations', { params }),
  createDeviation: (payload) => apiClient.post('/deviations', payload),
  updateDeviation: (id, payload) => apiClient.put(`/deviations/${id}`, payload),
  deleteDeviation: (id) => apiClient.delete(`/deviations/${id}`),

  // Work & Missed Work Requests
  getRequests: (params = {}) => apiClient.get('/requests', { params }),
  createRequest: (payload) => apiClient.post('/requests', payload),
  completeRequest: (id, payload = {}) => apiClient.patch(`/requests/${id}/complete`, payload),
  rescheduleRequest: (id, payload) => apiClient.patch(`/requests/${id}/reschedule`, payload),
  cancelRequest: (id, payload) => apiClient.patch(`/requests/${id}/cancel`, payload),
  deleteRequest: (id) => apiClient.delete(`/requests/${id}`),
};

export default api;
