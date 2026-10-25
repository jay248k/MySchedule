import { createSlice } from '@reduxjs/toolkit';
import { storageService } from '../../services/storageService';

const initialEvents = storageService.getEvents();

const eventsSlice = createSlice({
  name: 'events',
  initialState: {
    items: initialEvents,
    status: 'idle',
    error: null,
  },
  reducers: {
    setEvents: (state, action) => {
      state.items = action.payload;
      storageService.saveEvents(state.items);
    },
    addEvent: (state, action) => {
      const newEvent = {
        id: action.payload.id || `event-${Date.now()}`,
        createdAt: new Date().toISOString(),
        ...action.payload,
      };
      state.items.push(newEvent);
      storageService.saveEvents(state.items);
    },
    updateEvent: (state, action) => {
      const index = state.items.findIndex((e) => e.id === action.payload.id);
      if (index !== -1) {
        state.items[index] = {
          ...state.items[index],
          ...action.payload,
          updatedAt: new Date().toISOString(),
        };
        storageService.saveEvents(state.items);
      }
    },
    deleteEvent: (state, action) => {
      state.items = state.items.filter((e) => e.id !== action.payload);
      storageService.saveEvents(state.items);
    },
  },
});

export const { setEvents, addEvent, updateEvent, deleteEvent } = eventsSlice.actions;

export default eventsSlice.reducer;
