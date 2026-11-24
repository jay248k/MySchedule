import React, { createContext, useContext, useCallback, useMemo } from 'react';
import { useCategories, useCreateCategory, useUpdateCategory, useDeleteCategory, useBulkCreateCategories } from '../hooks/useApi';
import { showToast } from './UIContext';

const CategoriesContext = createContext(null);

export function CategoriesProvider({ children }) {
  const { data: categoriesResponse, isLoading, error, refetch } = useCategories();
  const categories = categoriesResponse?.data || [];

  const createCategoryMutation = useCreateCategory();
  const updateCategoryMutation = useUpdateCategory();
  const deleteCategoryMutation = useDeleteCategory();
  const bulkCreateCategoriesMutation = useBulkCreateCategories();

  const addCategory = useCallback(async (catData) => {
    const payload = {
      name: catData.name,
      color: catData.color || '#1769FF',
      icon: catData.icon || 'Tag',
      description: catData.description || '',
    };
    try {
      const result = await createCategoryMutation.mutateAsync(payload);
      const created = result?.data || { id: `cat-${Date.now()}`, ...payload };
      showToast({
        type: 'success',
        title: 'Category Created',
        message: `Category "${payload.name}" is now available.`,
      });
      return created;
    } catch (err) {
      showToast({ type: 'error', title: 'Error', message: 'Failed to create category' });
      return null;
    }
  }, [createCategoryMutation, showToast]);

  const updateCategory = useCallback(async (catId, updates) => {
    try {
      await updateCategoryMutation.mutateAsync({ id: catId, payload: updates });
      showToast({ type: 'info', title: 'Category Updated', message: 'Category modified.' });
      return true;
    } catch (err) {
      showToast({ type: 'error', title: 'Error', message: 'Failed to update category' });
      return false;
    }
  }, [updateCategoryMutation, showToast]);

  const deleteCategory = useCallback(async (catId) => {
    try {
      await deleteCategoryMutation.mutateAsync(catId);
      showToast({ type: 'info', title: 'Category Deleted', message: 'Category was removed.' });
    } catch (err) {
      showToast({ type: 'error', title: 'Error', message: 'Failed to delete category' });
    }
  }, [deleteCategoryMutation, showToast]);

  const bulkImportCategories = useCallback(async (items, options = {}) => {
    try {
      const result = await bulkCreateCategoriesMutation.mutateAsync(items);
      const created = result?.data || items.map((c, i) => ({ id: `cat-${Date.now()}-${i}`, ...c }));
      if (!options.silent) {
        showToast({
          type: 'success',
          title: 'Categories Imported',
          message: `Successfully imported ${created.length} categories.`,
        });
      }
      return { success: true, count: created.length, data: created };
    } catch (err) {
      showToast({ type: 'error', title: 'Error', message: 'Failed to import categories' });
      return { success: false, error: err.message };
    }
  }, [bulkCreateCategoriesMutation, showToast]);

  const value = useMemo(() => ({
    categories,
    isLoading,
    error,
    refetch,
    addCategory,
    updateCategory,
    deleteCategory,
    bulkImportCategories,
  }), [
    categories,
    isLoading,
    error,
    refetch,
    addCategory,
    updateCategory,
    deleteCategory,
    bulkImportCategories,
  ]);

  return (
    <CategoriesContext.Provider value={value}>
      {children}
    </CategoriesContext.Provider>
  );
}

export function useCategoriesContext() {
  const context = useContext(CategoriesContext);
  if (!context) {
    throw new Error('useCategoriesContext must be used within a CategoriesProvider');
  }
  return context;
}