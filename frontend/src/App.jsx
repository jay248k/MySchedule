import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { AppProvider } from './context/AppContext';
import { AuthModal } from './components/auth/AuthModal';
import { AppLayout } from './components/layout/AppLayout';
import { Dashboard } from './pages/Dashboard';
import { TodaysTasks } from './pages/TodaysTasks';
import { MonthlySchedule } from './pages/MonthlySchedule';
import { CalendarPage } from './pages/CalendarPage';
import { Categories } from './pages/Categories';
import { Goals } from './pages/Goals';
import { Reports } from './pages/Reports';
import { ReportsArchive } from './pages/ReportsArchive';
import { WorkTracker } from './pages/WorkTracker';
import { Settings } from './pages/Settings';
import { NotFound } from './pages/NotFound';

import './styles/global.css';
import './styles/layout.css';

export default function App() {
  return (
    <AuthProvider>
      <AppProvider>
        <BrowserRouter>
          <AuthModal />
          <Routes>
            {/* Standard App Navigation Layout */}
            <Route path="/" element={<AppLayout />}>
              <Route index element={<Dashboard />} />
              <Route path="today" element={<TodaysTasks />} />
              <Route path="work-tracker" element={<WorkTracker />} />
              <Route path="monthly" element={<MonthlySchedule />} />
              <Route path="calendar" element={<CalendarPage />} />
              <Route path="categories" element={<Categories />} />
              <Route path="goals" element={<Goals />} />
              <Route path="reports" element={<Reports />} />
              <Route path="archive" element={<ReportsArchive />} />
              <Route path="reports/archive" element={<ReportsArchive />} />
              <Route path="settings" element={<Settings />} />
              <Route path="*" element={<NotFound />} />
            </Route>
          </Routes>
        </BrowserRouter>
      </AppProvider>
    </AuthProvider>
  );
}
