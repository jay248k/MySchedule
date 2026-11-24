import React, { createContext, useContext, useCallback, useMemo } from 'react';
import { useHabits, useHabit, useCreateHabit, useUpdateHabit, useDeleteHabit, useToggleHabitDate, useHabitsReport } from '../hooks/useApi';
import { showToast } from './UIContext';

const HabitsContext = createContext(null);

export function HabitsProvider({ children }) {
  const { data: habitsResponse, isLoading, error, refetch } = useHabits();
  const habits = habitsResponse?.data || [];

  const createHabitMutation = useCreateHabit();
  const updateHabitMutation = useUpdateHabit();
  const deleteHabitMutation = useDeleteHabit();
  const toggleHabitDateMutation = useToggleHabitDate();

  const addHabit = useCallback(async (habitData) => {
    const payload = {
      name: habitData.name,
      description: habitData.description || '',
      targetTime: habitData.targetTime || null,
      category: habitData.category || 'Discipline',
      color: habitData.color || '#10B981',
      icon: habitData.icon || 'flame',
      frequency: habitData.frequency || 'daily',
    };
    try {
      const result = await createHabitMutation.mutateAsync(payload);
      const created = result?.data || { id: `habit-${Date.now()}`, ...payload };
      showToast({
        type: 'success',
        title: 'Habit Created',
        message: `Habit "${payload.name}" created successfully.`,
      });
      return created;
    } catch (err) {
      showToast({ type: 'error', title: 'Error', message: 'Failed to create habit' });
      return null;
    }
  }, [createHabitMutation, showToast]);

  const updateHabit = useCallback(async (habitId, updates) => {
    try {
      await updateHabitMutation.mutateAsync({ id: habitId, payload: updates });
      showToast({ type: 'info', title: 'Habit Updated', message: 'Habit details updated.' });
      return true;
    } catch (err) {
      showToast({ type: 'error', title: 'Error', message: 'Failed to update habit' });
      return false;
    }
  }, [updateHabitMutation, showToast]);

  const deleteHabit = useCallback(async (habitId) => {
    try {
      await deleteHabitMutation.mutateAsync(habitId);
      showToast({ type: 'info', title: 'Habit Deleted', message: 'Habit and calendar history deleted.' });
    } catch (err) {
      showToast({ type: 'error', title: 'Error', message: 'Failed to delete habit' });
    }
  }, [deleteHabitMutation, showToast]);

  const toggleHabitDate = useCallback(async (habitId, payload) => {
    try {
      const result = await toggleHabitDateMutation.mutateAsync({ id: habitId, payload });
      return result?.data;
    } catch (err) {
      showToast({ type: 'error', title: 'Error', message: 'Failed to toggle habit date' });
      return null;
    }
  }, [toggleHabitDateMutation, showToast]);

  const value = useMemo(() => ({
    habits,
    isLoading,
    error,
    refetch,
    addHabit,
    updateHabit,
    deleteHabit,
    toggleHabitDate,
  }), [
    habits,
    isLoading,
    error,
    refetch,
    addHabit,
    updateHabit,
    deleteHabit,
    toggleHabitDate,
  ]);

  return (
    <HabitsContext.Provider value={value}>
      {children}
    </HabitsContext.Provider>
  );
}

export function useHabitsContext() {
  const context = useContext(HabitsContext);
  if (!context) {
    throw new Error('useHabitsContext must be used within a HabitsProvider');
  }
  return context;
}

// Separate hook for habits report (can be used independently)
export function useHabitsReportContext() {
  return useHabitsReport();
}