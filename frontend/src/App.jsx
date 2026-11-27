import React, { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { AppProvider } from './context/AppContext';
import { LoginPage } from './pages/LoginPage';
import { ToastContainer } from './components/common/ConfirmDialog';
import 'react-toastify/dist/ReactToastify.css';
import { AppLayout } from './components/layout/AppLayout';
import { NotFound } from './pages/NotFound';

import './styles/global.css';
import './styles/layout.css';

// Lazy load all pages for code splitting
const Dashboard = lazy(() => import('./pages/Dashboard').then(m => ({ default: m.Dashboard || m.default })));
const TodaysTasks = lazy(() => import('./pages/TodaysTasks').then(m => ({ default: m.TodaysTasks || m.default })));
const MonthlySchedule = lazy(() => import('./pages/MonthlySchedule').then(m => ({ default: m.MonthlySchedule || m.default })));
const CalendarPage = lazy(() => import('./pages/CalendarPage').then(m => ({ default: m.CalendarPage || m.default })));
const Categories = lazy(() => import('./pages/Categories').then(m => ({ default: m.Categories || m.default })));
const Goals = lazy(() => import('./pages/Goals').then(m => ({ default: m.Goals || m.default })));
const Reports = lazy(() => import('./pages/Reports').then(m => ({ default: m.Reports || m.default })));
const RedFlagPage = lazy(() => import('./pages/RedFlagPage').then(m => ({ default: m.RedFlagPage || m.default })));
const ReportsArchive = lazy(() => import('./pages/ReportsArchive').then(m => ({ default: m.ReportsArchive || m.default })));
const WorkTracker = lazy(() => import('./pages/WorkTracker').then(m => ({ default: m.WorkTracker || m.default })));
const DeviationsPage = lazy(() => import('./pages/DeviationsPage').then(m => ({ default: m.DeviationsPage || m.default })));
const RequestsPage = lazy(() => import('./pages/RequestsPage').then(m => ({ default: m.default || m.RequestsPage })));
const Settings = lazy(() => import('./pages/Settings').then(m => ({ default: m.Settings || m.default })));
const ThoughtsPage = lazy(() => import('./pages/ThoughtsPage').then(m => ({ default: m.ThoughtsPage || m.default })));
const KnowledgePage = lazy(() => import('./pages/KnowledgePage').then(m => ({ default: m.KnowledgePage || m.default })));
const HabitsPage = lazy(() => import('./pages/HabitsPage').then(m => ({ default: m.HabitsPage || m.default })));
const CurriculumPage = lazy(() => import('./pages/CurriculumPage').then(m => ({ default: m.CurriculumPage || m.default })));
const AnalyticsChartsPage = lazy(() => import('./pages/AnalyticsChartsPage').then(m => ({ default: m.AnalyticsChartsPage || m.default })));
const ScreenTimePage = lazy(() => import('./pages/ScreenTimePage').then(m => ({ default: m.ScreenTimePage || m.default })));

// Loading fallback component
const PageLoader = () => (
  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '200px', color: '#94A3B8' }}>
    <div style={{ textAlign: 'center' }}>
      <div style={{ fontSize: '2rem', marginBottom: '12px', animation: 'pulse 1.5s infinite' }}>⚡</div>
      <p>Loading page...</p>
    </div>
  </div>
);

function AppRoutes() {
  const { isAuthenticated } = useAuth();
  const [initialLoading, setInitialLoading] = React.useState(true);

  React.useEffect(() => {
    // Dismiss initial loader once app boot is ready
    setInitialLoading(false);
  }, []);

  if (initialLoading) {
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
  if (!isAuthenticated) {
    return (
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    );
  }

  // When authenticated, render full application layout with lazy-loaded pages
  return (
    <Suspense fallback={<PageLoader />}>
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
          <Route path="habits" element={<HabitsPage />} />
          <Route path="thoughts" element={<ThoughtsPage />} />
          <Route path="knowledge" element={<KnowledgePage />} />
          <Route path="curriculum" element={<CurriculumPage />} />
          <Route path="screen-time" element={<ScreenTimePage />} />
          <Route path="analytics" element={<AnalyticsChartsPage />} />
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
    </Suspense>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppProvider>
        <BrowserRouter>
          <AppRoutes />
          <ToastContainer />
        </BrowserRouter>
      </AppProvider>
    </AuthProvider>
  );
}
