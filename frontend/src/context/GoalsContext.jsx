import React, { createContext, useContext, useCallback, useMemo } from 'react';
import { useGoals, useCreateGoal, useUpdateGoal, useDeleteGoal, useBulkCreateGoals } from '../hooks/useApi';
import { showToast } from './UIContext';

const GoalsContext = createContext(null);

export function GoalsProvider({ children }) {
  const { data: goalsResponse, isLoading, error, refetch } = useGoals();
  const goals = goalsResponse?.data || [];

  const createGoalMutation = useCreateGoal();
  const updateGoalMutation = useUpdateGoal();
  const deleteGoalMutation = useDeleteGoal();
  const bulkCreateGoalsMutation = useBulkCreateGoals();

  const addGoal = useCallback(async (goalData) => {
    const payload = {
      title: goalData.title || 'New Goal',
      description: goalData.description || '',
      targetDate: goalData.targetDate,
      category: goalData.category || 'General',
      relatedTaskIds: goalData.relatedTaskIds || [],
    };
    try {
      const result = await createGoalMutation.mutateAsync(payload);
      const created = result?.data || { id: `goal-${Date.now()}`, ...payload };
      showToast({
        type: 'success',
        title: 'Goal Added',
        message: `New goal "${payload.title}" created with auto-progress tracking.`,
      });
      return created;
    } catch (err) {
      showToast({ type: 'error', title: 'Error', message: 'Failed to create goal' });
      return null;
    }
  }, [createGoalMutation, showToast]);

  const updateGoal = useCallback(async (goalId, updates) => {
    try {
      await updateGoalMutation.mutateAsync({ id: goalId, payload: updates });
      showToast({ type: 'info', title: 'Goal Updated', message: 'Goal progress and details saved.' });
      return true;
    } catch (err) {
      showToast({ type: 'error', title: 'Error', message: 'Failed to update goal' });
      return false;
    }
  }, [updateGoalMutation, showToast]);

  const deleteGoal = useCallback(async (goalId) => {
    try {
      await deleteGoalMutation.mutateAsync(goalId);
      showToast({ type: 'info', title: 'Goal Deleted', message: 'Goal was successfully removed.' });
    } catch (err) {
      showToast({ type: 'error', title: 'Error', message: 'Failed to delete goal' });
    }
  }, [deleteGoalMutation, showToast]);

  const bulkImportGoals = useCallback(async (items, options = {}) => {
    try {
      const result = await bulkCreateGoalsMutation.mutateAsync(items);
      const created = result?.data || items.map((g, i) => ({ id: `goal-${Date.now()}-${i}`, ...g }));
      if (!options.silent) {
        showToast({
          type: 'success',
          title: 'Goals Imported',
          message: `Successfully imported ${created.length} goals.`,
        });
      }
      return { success: true, count: created.length, data: created };
    } catch (err) {
      showToast({ type: 'error', title: 'Error', message: 'Failed to import goals' });
      return { success: false, error: err.message };
    }
  }, [bulkCreateGoalsMutation, showToast]);

  const value = useMemo(() => ({
    goals,
    isLoading,
    error,
    refetch,
    addGoal,
    updateGoal,
    deleteGoal,
    bulkImportGoals,
  }), [
    goals,
    isLoading,
    error,
    refetch,
    addGoal,
    updateGoal,
    deleteGoal,
    bulkImportGoals,
  ]);

  return (
    <GoalsContext.Provider value={value}>
      {children}
    </GoalsContext.Provider>
  );
}

export function useGoalsContext() {
  const context = useContext(GoalsContext);
  if (!context) {
    throw new Error('useGoalsContext must be used within a GoalsProvider');
  }
  return context;
}