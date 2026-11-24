import React, { createContext, useContext, useCallback, useMemo, useState, useEffect, useRef } from 'react';
import { useWorkSessions, useActiveWorkSession, useSetActiveWorkSession, useClearActiveWorkSession, useCreateWorkSession, useUpdateWorkSession, useDeleteWorkSession } from '../hooks/useApi';
import { getTodayDateString } from '../utils/dateUtils';
import { showToast } from './UIContext';

const WorkSessionsContext = createContext(null);

// Production-level session guards & single shared live ticker
const lastStoppedWorkSessionAtRef = { current: 0 };
const isSessionTransitioningRef = { current: false };
const isRolloverProcessingRef = { current: false };

export function WorkSessionsProvider({ children }) {
  const { data: workSessionsResponse, isLoading: sessionsLoading, refetch: refetchSessions } = useWorkSessions();
  const workSessions = workSessionsResponse?.data || [];

  const { data: activeSessionResponse, isLoading: activeLoading, refetch: refetchActive } = useActiveWorkSession();
  const activeWorkSession = activeSessionResponse?.data || null;

  const [masterTimerTicker, setMasterTimerTicker] = useState(() => Date.now());

  useEffect(() => {
    const timer = setInterval(() => {
      setMasterTimerTicker(Date.now());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const setActiveWorkSessionMutation = useSetActiveWorkSession();
  const clearActiveWorkSessionMutation = useClearActiveWorkSession();
  const createWorkSessionMutation = useCreateWorkSession();
  const updateWorkSessionMutation = useUpdateWorkSession();
  const deleteWorkSessionMutation = useDeleteWorkSession();

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

  const setActiveWorkSession = useCallback(async (sessionData) => {
    try {
      await setActiveWorkSessionMutation.mutateAsync(sessionData);
    } catch (err) {
      console.warn('Failed to set active work session:', err);
    }
  }, [setActiveWorkSessionMutation]);

  const clearActiveWorkSession = useCallback(async () => {
    try {
      await clearActiveWorkSessionMutation.mutateAsync();
    } catch (err) {
      console.warn('Failed to clear active work session:', err);
    }
  }, [clearActiveWorkSessionMutation]);

  const createWorkSession = useCallback(async (sessionData) => {
    try {
      const result = await createWorkSessionMutation.mutateAsync(sessionData);
      showToast({ type: 'success', title: 'Session Logged', message: 'Work session recorded successfully.' });
      return result?.data;
    } catch (err) {
      showToast({ type: 'error', title: 'Error', message: 'Failed to create work session' });
      return null;
    }
  }, [createWorkSessionMutation, showToast]);

  const updateWorkSession = useCallback(async (sessionId, updates) => {
    try {
      await updateWorkSessionMutation.mutateAsync({ id: sessionId, payload: updates });
      showToast({ type: 'success', title: 'Session Updated', message: 'Work log details updated.' });
      return true;
    } catch (err) {
      showToast({ type: 'error', title: 'Error', message: 'Failed to update work session' });
      return false;
    }
  }, [updateWorkSessionMutation, showToast]);

  const deleteWorkSession = useCallback(async (sessionId) => {
    try {
      await deleteWorkSessionMutation.mutateAsync(sessionId);
      showToast({ type: 'info', title: 'Session Removed', message: 'Work session deleted from log.' });
    } catch (err) {
      showToast({ type: 'error', title: 'Error', message: 'Failed to delete work session' });
    }
  }, [deleteWorkSessionMutation, showToast]);

  const value = useMemo(() => ({
    workSessions,
    activeWorkSession,
    setActiveWorkSession,
    clearActiveWorkSession,
    createWorkSession,
    updateWorkSession,
    deleteWorkSession,
    currentLiveWorkSeconds,
    masterTimerTicker,
    isLoading: sessionsLoading || activeLoading,
    refetch: () => { refetchSessions(); refetchActive(); },
  }), [
    workSessions,
    activeWorkSession,
    setActiveWorkSession,
    clearActiveWorkSession,
    createWorkSession,
    updateWorkSession,
    deleteWorkSession,
    currentLiveWorkSeconds,
    masterTimerTicker,
    sessionsLoading,
    activeLoading,
    refetchSessions,
    refetchActive,
  ]);

  return (
    <WorkSessionsContext.Provider value={value}>
      {children}
    </WorkSessionsContext.Provider>
  );
}

export function useWorkSessionsContext() {
  const context = useContext(WorkSessionsContext);
  if (!context) {
    throw new Error('useWorkSessionsContext must be used within a WorkSessionsProvider');
  }
  return context;
}