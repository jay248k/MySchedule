import React, { useCallback, useMemo, useEffect, createContext, useContext } from 'react';
import { useAppDispatch, useAppSelector } from '../redux/hooks';
import { applyThemeToDocument } from '../utils/themeUtils';
import { storageService } from '../services/storageService';
import { purgeLegacyLocalStorage } from '../utils/cookieUtils';
import { TasksProvider, useTasksContext } from './TasksContext';
import { CategoriesProvider, useCategoriesContext } from './CategoriesContext';
import { GoalsProvider, useGoalsContext } from './GoalsContext';
import { EventsProvider, useEventsContext } from './EventsContext';
import { UIProvider, useUI } from './UIContext';
import { WorkSessionsProvider, useWorkSessionsContext } from './WorkSessionsContext';
import { HabitsProvider, useHabitsContext } from './HabitsContext';
import { ReportsProvider, useReportsContext } from './ReportsContext';
import { getTodayDateString } from '../utils/dateUtils';

const AppContext = createContext(null);

export function AppProvider({ children }) {
  const dispatch = useAppDispatch();
  const authUser = useAppSelector((state) => state.auth.user);
  const selectedDate = useAppSelector((state) => state.tasks.selectedDate || getTodayDateString());

  const setSelectedDate = useCallback((newDate) => {
    dispatch({ type: 'tasks/setSelectedDate', payload: newDate || getTodayDateString() });
  }, [dispatch]);

  // Purge any legacy static data stored in Chrome localStorage on mount
  React.useEffect(() => {
    purgeLegacyLocalStorage();
  }, []);

  // Keep local user state synchronized with Redux auth user
  const [user, setUser] = React.useState(() => authUser || storageService.getUser());
  React.useEffect(() => {
    if (authUser) {
      setUser(authUser);
    } else {
      setUser(null);
      purgeLegacyLocalStorage();
      // Clear Redux state on logout
      dispatch({ type: 'tasks/setTasks', payload: [] });
      dispatch({ type: 'categories/setCategories', payload: [] });
      dispatch({ type: 'goals/setGoals', payload: [] });
      dispatch({ type: 'events/setEvents', payload: [] });
    }
  }, [authUser, dispatch]);

  // Apply dynamic theme mode and brand accents to document
  const settings = useAppSelector((state) => state.ui.settings);
  React.useEffect(() => {
    applyThemeToDocument({
      theme: settings?.theme || 'light',
      colorCombinationId: settings?.colorCombinationId || 'electric-sapphire',
      accentColor: settings?.accentColor || '#1769FF',
    });
  }, [settings?.theme, settings?.colorCombinationId, settings?.accentColor]);

  // The context value is now composed from sub-contexts
  // This provider just passes through the selectedDate and user
  const value = useMemo(() => ({
    selectedDate,
    setSelectedDate,
    user,
    setUser,
    // All other state and actions come from sub-contexts
  }), [selectedDate, setSelectedDate, user, setUser]);

  return (
    <AppContext.Provider value={value}>
      <UIProvider>
        <TasksProvider selectedDate={selectedDate}>
          <CategoriesProvider>
            <GoalsProvider>
              <EventsProvider>
                <WorkSessionsProvider>
                  <HabitsProvider>
                    <ReportsProvider>
                      {children}
                    </ReportsProvider>
                  </HabitsProvider>
                </WorkSessionsProvider>
              </EventsProvider>
            </GoalsProvider>
          </CategoriesProvider>
        </TasksProvider>
      </UIProvider>
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }

  // Also get sub-contexts
  const tasks = useTasksContext();
  const categories = useCategoriesContext();
  const goals = useGoalsContext();
  const events = useEventsContext();
  const ui = useUI();
  const workSessions = useWorkSessionsContext();
  const habits = useHabitsContext();
  const reports = useReportsContext();

  // Merge all contexts into a single object for backward compatibility
  return useMemo(() => ({
    ...context,
    ...tasks,
    ...categories,
    ...goals,
    ...events,
    ...ui,
    ...workSessions,
    ...habits,
    ...reports,
  }), [context, tasks, categories, goals, events, ui, workSessions, habits, reports]);
}
