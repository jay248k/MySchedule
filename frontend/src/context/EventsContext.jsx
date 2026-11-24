import React, { createContext, useContext, useCallback, useMemo } from 'react';
import { useEvents, useCreateEvent, useUpdateEvent, useDeleteEvent } from '../hooks/useApi';
import { showToast } from './UIContext';

const EventsContext = createContext(null);

export function EventsProvider({ children }) {
  const { data: eventsResponse, isLoading, error, refetch } = useEvents();
  const events = eventsResponse?.data || [];

  const createEventMutation = useCreateEvent();
  const updateEventMutation = useUpdateEvent();
  const deleteEventMutation = useDeleteEvent();

  const addEvent = useCallback(async (eventData) => {
    const payload = {
      title: eventData.title || 'Untitled Event',
      description: eventData.description || '',
      date: eventData.date,
      startTime: eventData.startTime || '10:00',
      endTime: eventData.endTime || '11:00',
      categoryId: eventData.categoryId || null,
      location: eventData.location || '',
    };
    try {
      const result = await createEventMutation.mutateAsync(payload);
      const created = result?.data || { id: `event-${Date.now()}`, ...payload };
      showToast({
        type: 'success',
        title: 'Event Scheduled',
        message: `"${payload.title}" was added to calendar.`,
      });
      return created;
    } catch (err) {
      showToast({ type: 'error', title: 'Error', message: 'Failed to create event' });
      return null;
    }
  }, [createEventMutation, showToast]);

  const updateEvent = useCallback(async (eventId, updates) => {
    try {
      await updateEventMutation.mutateAsync({ id: eventId, payload: updates });
      showToast({ type: 'info', title: 'Event Updated', message: 'Event details updated.' });
      return true;
    } catch (err) {
      showToast({ type: 'error', title: 'Error', message: 'Failed to update event' });
      return false;
    }
  }, [updateEventMutation, showToast]);

  const deleteEvent = useCallback(async (eventId) => {
    try {
      await deleteEventMutation.mutateAsync(eventId);
      showToast({ type: 'info', title: 'Event Deleted', message: 'Calendar event removed.' });
    } catch (err) {
      showToast({ type: 'error', title: 'Error', message: 'Failed to delete event' });
    }
  }, [deleteEventMutation, showToast]);

  const value = useMemo(() => ({
    events,
    isLoading,
    error,
    refetch,
    addEvent,
    updateEvent,
    deleteEvent,
  }), [
    events,
    isLoading,
    error,
    refetch,
    addEvent,
    updateEvent,
    deleteEvent,
  ]);

  return (
    <EventsContext.Provider value={value}>
      {children}
    </EventsContext.Provider>
  );
}

export function useEventsContext() {
  const context = useContext(EventsContext);
  if (!context) {
    throw new Error('useEventsContext must be used within an EventsProvider');
  }
  return context;
}