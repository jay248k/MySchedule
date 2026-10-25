import React from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { MobileNavigation } from './MobileNavigation';
import { TaskModal } from '../tasks/TaskModal';
import { EventModal } from '../events/EventModal';
import { GoalModal } from '../goals/GoalModal';
import { CategoryModal } from '../categories/CategoryModal';
import { BulkImportModal } from '../common/BulkImportModal';
import { ConfirmDialog, ToastContainer } from '../common/ConfirmDialog';

export function AppLayout() {
  return (
    <div className="app-layout">
      {/* Sidebar Navigation */}
      <Sidebar />

      {/* Main Content Area */}
      <div className="main-wrapper">
        <Header />

        <main className="page-container">
          <Outlet />
        </main>

        {/* Mobile Bottom Navigation Bar */}
        <MobileNavigation />
      </div>

      {/* Global Modals */}
      <TaskModal />
      <EventModal />
      <GoalModal />
      <CategoryModal />
      <BulkImportModal />

      {/* Global Feedback Dialogs & Notifications */}
      <ConfirmDialog />
      <ToastContainer />
    </div>
  );
}
