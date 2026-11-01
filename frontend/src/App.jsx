import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { AppProvider } from './context/AppContext';
import { LoginPage } from './pages/LoginPage';
import { AppLayout } from './components/layout/AppLayout';
import { Dashboard } from './pages/Dashboard';
import { TodaysTasks } from './pages/TodaysTasks';
import { MonthlySchedule } from './pages/MonthlySchedule';
import { CalendarPage } from './pages/CalendarPage';
import { Categories } from './pages/Categories';
import { Goals } from './pages/Goals';
import { Reports } from './pages/Reports';
import { RedFlagPage } from './pages/RedFlagPage';
import { ReportsArchive } from './pages/ReportsArchive';
import { WorkTracker } from './pages/WorkTracker';
import { DeviationsPage } from './pages/DeviationsPage';
import RequestsPage from './pages/RequestsPage';
import { Settings } from './pages/Settings';
import { NotFound } from './pages/NotFound';

import './styles/global.css';
import './styles/layout.css';

function AppRoutes() {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '100vh',
          backgroundColor: '#070D18',
          color: '#94A3B8',
          fontSize: '0.95rem',
          fontWeight: 600,
        }}
      >
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '2rem', marginBottom: '12px' }}>⚡</div>
          <p>Loading MySchedule...</p>
        </div>
      </div>
    );
  }

  // If user is logged out, DIRECTLY render full-screen LoginPage.
  // Zero user dashboard, tasks, or information is visible!
  if (!isAuthenticated) {
    return (
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    );
  }

  // When authenticated, render full application layout
  return (
    <Routes>
      <Route path="/" element={<AppLayout />}>
        <Route index element={<Dashboard />} />
        <Route path="today" element={<TodaysTasks />} />
        <Route path="work-tracker" element={<WorkTracker />} />
        <Route path="deviations" element={<DeviationsPage />} />
        <Route path="requests" element={<RequestsPage />} />
        <Route path="monthly" element={<MonthlySchedule />} />
        <Route path="calendar" element={<CalendarPage />} />
        <Route path="categories" element={<Categories />} />
        <Route path="goals" element={<Goals />} />
        <Route path="red-flags" element={<RedFlagPage />} />
        <Route path="reports" element={<Reports />} />
        <Route path="reports/:reportType" element={<Reports />} />
        <Route path="archive" element={<ReportsArchive />} />
        <Route path="reports/archive" element={<ReportsArchive />} />
        <Route path="settings" element={<Settings />} />
        <Route path="*" element={<NotFound />} />
      </Route>
      <Route path="/login" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppProvider>
        <BrowserRouter>
          <AppRoutes />
        </BrowserRouter>
      </AppProvider>
    </AuthProvider>
  );
}
