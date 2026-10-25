import { createSlice } from '@reduxjs/toolkit';
import { storageService } from '../../services/storageService';

const initialGoals = storageService.getGoals();

const goalsSlice = createSlice({
  name: 'goals',
  initialState: {
    items: initialGoals,
    status: 'idle',
    error: null,
  },
  reducers: {
    setGoals: (state, action) => {
      state.items = action.payload;
      storageService.saveGoals(state.items);
    },
    addGoal: (state, action) => {
      const newGoal = {
        id: action.payload.id || `goal-${Date.now()}`,
        progress: 0,
        status: 'in-progress',
        relatedTaskIds: [],
        createdAt: new Date().toISOString(),
        ...action.payload,
      };
      state.items.unshift(newGoal);
      storageService.saveGoals(state.items);
    },
    addGoals: (state, action) => {
      const itemsToAdd = (Array.isArray(action.payload) ? action.payload : []).map((goal, idx) => ({
        id: goal.id || `goal-${Date.now()}-${idx}`,
        progress: goal.progress !== undefined ? Number(goal.progress) : 0,
        status: goal.status || 'in-progress',
        relatedTaskIds: goal.relatedTaskIds || [],
        createdAt: new Date().toISOString(),
        ...goal,
      }));
      state.items.unshift(...itemsToAdd);
      storageService.saveGoals(state.items);
    },
    updateGoal: (state, action) => {
      const index = state.items.findIndex((g) => g.id === action.payload.id);
      if (index !== -1) {
        state.items[index] = {
          ...state.items[index],
          ...action.payload,
          updatedAt: new Date().toISOString(),
        };
        storageService.saveGoals(state.items);
      }
    },
    deleteGoal: (state, action) => {
      state.items = state.items.filter((g) => g.id !== action.payload);
      storageService.saveGoals(state.items);
    },
    linkTaskToGoal: (state, action) => {
      const { goalId, taskId } = action.payload;
      const goal = state.items.find((g) => g.id === goalId);
      if (goal) {
        if (!goal.relatedTaskIds) goal.relatedTaskIds = [];
        if (!goal.relatedTaskIds.includes(taskId)) {
          goal.relatedTaskIds.push(taskId);
          storageService.saveGoals(state.items);
        }
      }
    },
    unlinkTaskFromGoal: (state, action) => {
      const { goalId, taskId } = action.payload;
      const goal = state.items.find((g) => g.id === goalId);
      if (goal && goal.relatedTaskIds) {
        goal.relatedTaskIds = goal.relatedTaskIds.filter((id) => id !== taskId);
        storageService.saveGoals(state.items);
      }
    },
    syncGoalProgressWithTasks: (state, action) => {
      const tasks = action.payload;
      let changed = false;
      state.items.forEach((goal) => {
        const related = tasks.filter(
          (t) => t.goalId === goal.id || goal.relatedTaskIds?.includes(t.id)
        );
        if (related.length > 0) {
          const completedCount = related.filter((t) => t.status === 'completed').length;
          const calculatedProgress = Math.round((completedCount / related.length) * 100);
          if (goal.progress !== calculatedProgress) {
            goal.progress = calculatedProgress;
            goal.status = calculatedProgress >= 100 ? 'completed' : 'in-progress';
            changed = true;
          }
        }
      });
      if (changed) {
        storageService.saveGoals(state.items);
      }
    },
  },
});

export const {
  setGoals,
  addGoal,
  addGoals,
  updateGoal,
  deleteGoal,
  linkTaskToGoal,
  unlinkTaskFromGoal,
  syncGoalProgressWithTasks,
} = goalsSlice.actions;

export default goalsSlice.reducer;
