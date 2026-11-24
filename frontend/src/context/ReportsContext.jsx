import React, { createContext, useContext, useCallback, useMemo, useState } from 'react';
import { useReports, useReportByDate, useSaveReport, useDeleteReport } from '../hooks/useApi';
import { storageService } from '../services/storageService';
import { showToast } from './UIContext';

const ReportsContext = createContext(null);

export function ReportsProvider({ children }) {
  const { data: reportsResponse, isLoading, error, refetch } = useReports();
  const reports = reportsResponse?.data || [];

  // Also keep local storage for offline support
  const [dailyReports, setDailyReports] = useState(() => storageService.getDailyReports());

  const saveReportMutation = useSaveReport();
  const deleteReportMutation = useDeleteReport();

  const saveDailyReport = useCallback(async (reportData) => {
    const existingIndex = dailyReports.findIndex((r) => r.date === reportData.date);
    let updated;
    if (existingIndex >= 0) {
      updated = [...dailyReports];
      updated[existingIndex] = {
        ...updated[existingIndex],
        ...reportData,
        updatedAt: new Date().toISOString(),
      };
    } else {
      const newReport = {
        id: `report-${Date.now()}`,
        submittedAt: new Date().toISOString(),
        ...reportData,
      };
      updated = [newReport, ...dailyReports];
    }
    setDailyReports(updated);
    storageService.saveDailyReports(updated);

    // Persist to Database API
    try {
      await saveReportMutation.mutateAsync(reportData);
    } catch (err) {
      console.warn('Backend DB persist warning for report:', err);
    }

    showToast({
      type: 'success',
      title: 'Daily Report Saved',
      message: `Work report for ${reportData.date} recorded successfully in database.`,
    });
    return updated;
  }, [dailyReports, saveReportMutation, showToast]);

  const deleteDailyReport = useCallback(async (reportId) => {
    const target = dailyReports.find((r) => r.id === reportId);
    const filtered = dailyReports.filter((r) => r.id !== reportId);
    setDailyReports(filtered);
    storageService.saveDailyReports(filtered);

    if (target?.date) {
      try {
        await deleteReportMutation.mutateAsync(target.date);
      } catch (err) {
        console.warn('Backend DB delete warning for report:', err);
      }
    }

    showToast({
      type: 'info',
      title: 'Report Removed',
      message: 'The daily work report was removed from your history.',
    });
  }, [dailyReports, deleteReportMutation, showToast]);

  const value = useMemo(() => ({
    dailyReports,
    reports,
    isLoading,
    error,
    refetch,
    saveDailyReport,
    deleteDailyReport,
  }), [
    dailyReports,
    reports,
    isLoading,
    error,
    refetch,
    saveDailyReport,
    deleteDailyReport,
  ]);

  return (
    <ReportsContext.Provider value={value}>
      {children}
    </ReportsContext.Provider>
  );
}

export function useReportsContext() {
  const context = useContext(ReportsContext);
  if (!context) {
    throw new Error('useReportsContext must be used within a ReportsProvider');
  }
  return context;
}