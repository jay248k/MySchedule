import { createSlice } from '@reduxjs/toolkit';
import { storageService } from '../../services/storageService';
import { getTodayDateString } from '../../utils/dateUtils';

const initialTasks = storageService.getTasks();

const tasksSlice = createSlice({
  name: 'tasks',
  initialState: {
    items: initialTasks,
    selectedDate: getTodayDateString(),
    statusFilter: 'all',
    selectedCategory: 'all',
    selectedPriority: 'all',
    sortBy: 'time',
    searchQuery: '',
    status: 'idle',
    error: null,
  },
  reducers: {
    setTasks: (state, action) => {
      state.items = action.payload;
      storageService.saveTasks(state.items);
    },
    addTask: (state, action) => {
      const newTask = {
        id: action.payload.id || `task-${Date.now()}`,
        status: 'pending',
        createdAt: new Date().toISOString(),
        ...action.payload,
      };
      state.items.unshift(newTask);
      storageService.saveTasks(state.items);
    },
    updateTask: (state, action) => {
      const index = state.items.findIndex((t) => t.id === action.payload.id);
      if (index !== -1) {
        state.items[index] = {
          ...state.items[index],
          ...action.payload,
          updatedAt: new Date().toISOString(),
        };
        storageService.saveTasks(state.items);
      }
    },
    deleteTask: (state, action) => {
      state.items = state.items.filter((t) => t.id !== action.payload);
      storageService.saveTasks(state.items);
    },
    toggleTaskComplete: (state, action) => {
      const task = state.items.find((t) => t.id === action.payload);
      if (task) {
        task.status = task.status === 'completed' ? 'pending' : 'completed';
        task.completedAt = task.status === 'completed' ? new Date().toISOString() : null;
        storageService.saveTasks(state.items);
      }
    },
    moveTaskSlot: (state, action) => {
      const { taskId, newDate, newStartTime, newEndTime } = action.payload;
      const task = state.items.find((t) => t.id === taskId);
      if (task) {
        if (newDate) task.date = newDate;
        if (newStartTime) task.startTime = newStartTime;
        if (newEndTime) task.endTime = newEndTime;
        task.updatedAt = new Date().toISOString();
        storageService.saveTasks(state.items);
      }
    },
    setSelectedDate: (state, action) => {
      state.selectedDate = action.payload;
    },
    setStatusFilter: (state, action) => {
      state.statusFilter = action.payload;
    },
    setSelectedCategory: (state, action) => {
      state.selectedCategory = action.payload;
    },
    setSelectedPriority: (state, action) => {
      state.selectedPriority = action.payload;
    },
    setSortBy: (state, action) => {
      state.sortBy = action.payload;
    },
    setSearchQuery: (state, action) => {
      state.searchQuery = action.payload;
    },
  },
});

export const {
  setTasks,
  addTask,
  updateTask,
  deleteTask,
  toggleTaskComplete,
  moveTaskSlot,
  setSelectedDate,
  setStatusFilter,
  setSelectedCategory,
  setSelectedPriority,
  setSortBy,
  setSearchQuery,
} = tasksSlice.actions;

export default tasksSlice.reducer;
