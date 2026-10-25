import { createSlice } from '@reduxjs/toolkit';
import { storageService } from '../../services/storageService';

const initialCategories = storageService.getCategories();

const categoriesSlice = createSlice({
  name: 'categories',
  initialState: {
    items: initialCategories,
    status: 'idle',
    error: null,
  },
  reducers: {
    setCategories: (state, action) => {
      state.items = action.payload;
      storageService.saveCategories(state.items);
    },
    addCategory: (state, action) => {
      const newCategory = {
        id: action.payload.id || `cat-${Date.now()}`,
        color: action.payload.color || '#1769FF',
        ...action.payload,
      };
      state.items.push(newCategory);
      storageService.saveCategories(state.items);
    },
    addCategories: (state, action) => {
      const itemsToAdd = (Array.isArray(action.payload) ? action.payload : []).map((cat, idx) => ({
        id: cat.id || `cat-${Date.now()}-${idx}`,
        color: cat.color || '#1769FF',
        ...cat,
      }));
      state.items.push(...itemsToAdd);
      storageService.saveCategories(state.items);
    },
    updateCategory: (state, action) => {
      const index = state.items.findIndex((c) => c.id === action.payload.id);
      if (index !== -1) {
        state.items[index] = {
          ...state.items[index],
          ...action.payload,
        };
        storageService.saveCategories(state.items);
      }
    },
    deleteCategory: (state, action) => {
      if (action.payload === 'cat-other') return;
      state.items = state.items.filter((c) => c.id !== action.payload);
      storageService.saveCategories(state.items);
    },
  },
});

export const { setCategories, addCategory, addCategories, updateCategory, deleteCategory } = categoriesSlice.actions;

export default categoriesSlice.reducer;
