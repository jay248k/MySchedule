import axios from 'axios';
import { cookieUtils, purgeLegacyLocalStorage } from '../utils/cookieUtils';

// Smart Base URL resolver: prioritize local development server on port 5000
const resolveApiBaseUrl = () => {
  if (typeof window !== 'undefined') {
    const host = window.location.hostname;
    // Localhost loopback or LAN IP (Wi-Fi testing on phone/tablet)
    if (
      host === 'localhost' ||
      host === '127.0.0.1' ||
      host.startsWith('192.168.') ||
      host.startsWith('10.') ||
      host.startsWith('172.')
    ) {
      return `http://${host}:5000/api`;
    }
  }
  const envUrl = import.meta.env.VITE_API_URL;
  // If env URL is pointing to suspended Render, fallback to local backend
  if (envUrl && !envUrl.includes('onrender.com')) {
    return envUrl;
  }
  return 'http://localhost:5000/api';
};

const API_BASE_URL = resolveApiBaseUrl();

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
 * Request Interceptor: Attach JWT bearer token strictly from Cookies (NO localStorage)
 */
apiClient.interceptors.request.use(
  (config) => {
    // Purge any accidental localStorage
    purgeLegacyLocalStorage();

    // Primary: Retrieve token strictly from Cookie
    const token =
      cookieUtils.get('myschedule_auth_token') ||
      cookieUtils.get('my_schedule_auth_token');

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

  // Thoughts & Motivation
  getThoughts: (params = {}) => apiClient.get('/thoughts', { params }),
  createThought: (payload) => apiClient.post('/thoughts', payload),
  updateThought: (id, payload) => apiClient.put(`/thoughts/${id}`, payload),
  deleteThought: (id) => apiClient.delete(`/thoughts/${id}`),

  // Knowledge Base & Lessons
  getKnowledgeItems: (params = {}) => apiClient.get('/knowledge', { params }),
  getKnowledgeItem: (id) => apiClient.get(`/knowledge/${id}`),
  createKnowledgeItem: (payload) => apiClient.post('/knowledge', payload),
  updateKnowledgeItem: (id, payload) => apiClient.put(`/knowledge/${id}`, payload),
  deleteKnowledgeItem: (id) => apiClient.delete(`/knowledge/${id}`),

  // Work Tracker & Time Sessions
  getWorkSessions: (params = {}) => apiClient.get('/work-sessions', { params }),
  getActiveWorkSession: () => apiClient.get('/work-sessions/active'),
  setActiveWorkSession: (payload) => apiClient.post('/work-sessions/active', payload),
  clearActiveWorkSession: () => apiClient.delete('/work-sessions/active'),
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

  // Habits & Streaks
  getHabits: (params = {}) => apiClient.get('/habits', { params }),
  getHabit: (id, params = {}) => apiClient.get(`/habits/${id}`, { params }),
  createHabit: (payload) => apiClient.post('/habits', payload),
  updateHabit: (id, payload) => apiClient.put(`/habits/${id}`, payload),
  deleteHabit: (id) => apiClient.delete(`/habits/${id}`),
  toggleHabitDate: (id, payload) => apiClient.post(`/habits/${id}/toggle`, payload),
  getHabitsReport: () => apiClient.get('/habits/report'),

  // Search
  search: (q) => apiClient.get('/search', { params: { q } }),

  // Dashboard Aggregated Summary
  getDashboardSummary: (date) => apiClient.get('/dashboard/summary', { params: { date } }),

  // Plans
  getPlans: (params = {}) => apiClient.get('/plans', { params }),
  getPlan: (id) => apiClient.get(`/plans/${id}`),
  createPlan: (payload) => apiClient.post('/plans', payload),
  bulkCreatePlans: (payload) =>
    apiClient.post('/plans/bulk', Array.isArray(payload) ? { plans: payload } : payload),
  updatePlan: (id, payload) => apiClient.put(`/plans/${id}`, payload),
  deletePlan: (id) => apiClient.delete(`/plans/${id}`),
  getPlanProgress: (id) => apiClient.get(`/plans/${id}/progress`),

  // Sections
  getSectionsByPlan: (planId) => apiClient.get(`/sections/plan/${planId}`),
  getSection: (id) => apiClient.get(`/sections/${id}`),
  createSection: (payload) => apiClient.post('/sections', payload),
  updateSection: (id, payload) => apiClient.put(`/sections/${id}`, payload),
  deleteSection: (id) => apiClient.delete(`/sections/${id}`),
  reorderSections: (payload) => apiClient.post('/sections/reorder', payload),

  // Topics hierarchy
  getSubsectionsBySection: (sectionId) => apiClient.get(`/topics/subsection/section/${sectionId}`),
  getSubsection: (id) => apiClient.get(`/topics/subsection/${id}`),
  createSubsection: (payload) => apiClient.post('/topics/subsection', payload),
  updateSubsection: (id, payload) => apiClient.put(`/topics/subsection/${id}`, payload),
  deleteSubsection: (id) => apiClient.delete(`/topics/subsection/${id}`),

  getTopicsBySubsection: (subsectionId) => apiClient.get(`/topics/topic/subsection/${subsectionId}`),
  getTopic: (id) => apiClient.get(`/topics/topic/${id}`),
  createTopic: (payload) => apiClient.post('/topics/topic', payload),
  updateTopic: (id, payload) => apiClient.put(`/topics/topic/${id}`, payload),
  deleteTopic: (id) => apiClient.delete(`/topics/topic/${id}`),

  getSubtopicsByTopic: (topicId) => apiClient.get(`/topics/subtopic/topic/${topicId}`),
  getSubtopic: (id) => apiClient.get(`/topics/subtopic/${id}`),
  createSubtopic: (payload) => apiClient.post('/topics/subtopic', payload),
  updateSubtopic: (id, payload) => apiClient.put(`/topics/subtopic/${id}`, payload),
  deleteSubtopic: (id) => apiClient.delete(`/topics/subtopic/${id}`),

  // Curriculum Import
  importCurriculum: (file) => {
    const formData = new FormData();
    formData.append('file', file);
    return apiClient.post('/curriculum-import/import', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
  previewCurriculumImport: (file) => {
    const formData = new FormData();
    formData.append('file', file);
    return apiClient.post('/curriculum-import/preview', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
  downloadImportTemplate: () => apiClient.get('/curriculum-import/template', { responseType: 'blob' }),
  rebuildLessonChains: (payload) => apiClient.post('/curriculum-import/rebuild-chains', payload),
  validateLessonChain: (subtopicId) => apiClient.get('/curriculum-import/validate-chain', { params: { subtopicId } }),
  repairLessonChain: (payload) => apiClient.post('/curriculum-import/repair-chain', payload),

  // Lesson Chain
  getLessonChain: (subtopicId) => apiClient.get(`/knowledge/chain/${subtopicId}`),
  rebuildLessonChain: (subtopicId) => apiClient.post(`/knowledge/chain/${subtopicId}/rebuild`),
};

export default api;
