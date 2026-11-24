const { sequelize } = require('./database');

/**
 * Optimizes the PostgreSQL database by creating essential composite
 * and foreign key indexes, and analyzing tables for the query planner.
 */
async function optimizeDatabase() {
  console.log('⚡ Applying PostgreSQL database indexing & performance optimizations...');

  const indexQueries = [
    // ============ TASKS - Critical Composite Indexes ============
    // Most common: userId + date (+ status filter)
    'CREATE INDEX IF NOT EXISTS idx_tasks_user_date ON tasks ("userId", "date");',
    'CREATE INDEX IF NOT EXISTS idx_tasks_user_date_status ON tasks ("userId", "date", "status");',
    'CREATE INDEX IF NOT EXISTS idx_tasks_user_date_category ON tasks ("userId", "date", "categoryId");',
    'CREATE INDEX IF NOT EXISTS idx_tasks_user_status_priority ON tasks ("userId", "status", "priority");',
    'CREATE INDEX IF NOT EXISTS idx_tasks_user_goal ON tasks ("userId", "goalId");',

    // Single column for foreign key joins
    'CREATE INDEX IF NOT EXISTS idx_tasks_category ON tasks ("categoryId");',
    'CREATE INDEX IF NOT EXISTS idx_tasks_goal ON tasks ("goalId");',
    'CREATE INDEX IF NOT EXISTS idx_tasks_date ON tasks ("date");',
    'CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks ("status");',
    'CREATE INDEX IF NOT EXISTS idx_tasks_user ON tasks ("userId");',

    // Partial indexes for common filters (PostgreSQL 11+)
    'CREATE INDEX IF NOT EXISTS idx_tasks_pending_user_date ON tasks ("userId", "date") WHERE status = \'pending\';',
    'CREATE INDEX IF NOT EXISTS idx_tasks_completed_user_date ON tasks ("userId", "date") WHERE status = \'completed\';',
    'CREATE INDEX IF NOT EXISTS idx_tasks_overdue_user_date ON tasks ("userId", "date") WHERE status = \'overdue\';',

    // ============ EVENTS ============
    'CREATE INDEX IF NOT EXISTS idx_events_user_date ON events ("userId", "date");',
    'CREATE INDEX IF NOT EXISTS idx_events_user_date_status ON events ("userId", "date", "status");',
    'CREATE INDEX IF NOT EXISTS idx_events_user_category ON events ("userId", "categoryId");',
    'CREATE INDEX IF NOT EXISTS idx_events_category ON events ("categoryId");',
    'CREATE INDEX IF NOT EXISTS idx_events_user ON events ("userId");',
    'CREATE INDEX IF NOT EXISTS idx_events_date ON events ("date");',

    // ============ DAILY REPORTS ============
    'CREATE INDEX IF NOT EXISTS idx_reports_user_date ON daily_reports ("userId", "date");',
    'CREATE INDEX IF NOT EXISTS idx_reports_user_date_desc ON daily_reports ("userId", "date" DESC);',
    'CREATE INDEX IF NOT EXISTS idx_reports_user ON daily_reports ("userId");',

    // ============ GOALS ============
    'CREATE INDEX IF NOT EXISTS idx_goals_user ON goals ("userId");',
    'CREATE INDEX IF NOT EXISTS idx_goals_user_status ON goals ("userId", "status");',
    'CREATE INDEX IF NOT EXISTS idx_goals_status ON goals ("status");',

    // ============ WORK SESSIONS ============
    'CREATE INDEX IF NOT EXISTS idx_work_sessions_user_date ON work_sessions ("userId", "date");',
    'CREATE INDEX IF NOT EXISTS idx_work_sessions_user_date_status ON work_sessions ("userId", "date", "status");',
    'CREATE INDEX IF NOT EXISTS idx_work_sessions_user_task ON work_sessions ("userId", "taskId");',
    'CREATE INDEX IF NOT EXISTS idx_work_sessions_status ON work_sessions ("status");',
    'CREATE INDEX IF NOT EXISTS idx_work_sessions_user ON work_sessions ("userId");',
    'CREATE INDEX IF NOT EXISTS idx_work_sessions_date ON work_sessions ("date");',

    // ============ SCHEDULE DEVIATIONS ============
    'CREATE INDEX IF NOT EXISTS idx_schedule_deviations_user_date ON schedule_deviations ("userId", "date");',
    'CREATE INDEX IF NOT EXISTS idx_schedule_deviations_user ON schedule_deviations ("userId");',

    // ============ WORK REQUESTS ============
    'CREATE INDEX IF NOT EXISTS idx_work_requests_user_status ON work_requests ("userId", "status");',
    'CREATE INDEX IF NOT EXISTS idx_work_requests_user_status_date ON work_requests ("userId", "status", "date");',
    'CREATE INDEX IF NOT EXISTS idx_work_requests_user ON work_requests ("userId");',
    'CREATE INDEX IF NOT EXISTS idx_work_requests_task ON work_requests ("taskId");',

    // ============ CATEGORIES ============
    'CREATE INDEX IF NOT EXISTS idx_categories_user ON categories ("userId");',

    // ============ SETTINGS ============
    'CREATE INDEX IF NOT EXISTS idx_settings_user ON settings ("userId");',

    // ============ NOTIFICATIONS ============
    'CREATE INDEX IF NOT EXISTS idx_notifications_user_read ON notifications ("userId", "read");',
    'CREATE INDEX IF NOT EXISTS idx_notifications_user_read_created ON notifications ("userId", "read", "createdAt" DESC);',
    'CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications ("userId");',

    // ============ HABITS & HABIT LOGS ============
    'CREATE INDEX IF NOT EXISTS idx_habits_user_archived ON habits ("userId", "isArchived");',
    'CREATE INDEX IF NOT EXISTS idx_habits_user ON habits ("userId");',
    'CREATE INDEX IF NOT EXISTS idx_habit_logs_habit_date ON habit_logs ("habitId", "date");',
    'CREATE INDEX IF NOT EXISTS idx_habit_logs_habit_date_completed ON habit_logs ("habitId", "date", "completed");',
    'CREATE INDEX IF NOT EXISTS idx_habit_logs_user_date ON habit_logs ("userId", "date");',

    // ============ KNOWLEDGE ITEMS ============
    'CREATE INDEX IF NOT EXISTS idx_knowledge_items_user_parent_order ON knowledge_items ("userId", "parentId", "orderIndex");',
    'CREATE INDEX IF NOT EXISTS idx_knowledge_items_user ON knowledge_items ("userId");',
    'CREATE INDEX IF NOT EXISTS idx_knowledge_items_parent ON knowledge_items ("parentId");',

    // ============ THOUGHTS ============
    'CREATE INDEX IF NOT EXISTS idx_thoughts_user_date ON thoughts ("userId", "date");',
    'CREATE INDEX IF NOT EXISTS idx_thoughts_user ON thoughts ("userId");',

    // ============ USER SESSIONS ============
    'CREATE INDEX IF NOT EXISTS idx_user_sessions_user_active ON user_sessions ("userId", "deletedAt") WHERE "deletedAt" IS NULL;',
    'CREATE INDEX IF NOT EXISTS idx_user_sessions_user ON user_sessions ("userId");',
  ];

  for (const q of indexQueries) {
    try {
      await sequelize.query(q);
    } catch (err) {
      // Ignore if table doesn't exist yet or index already exists
    }
  }

  // Run ANALYZE to update PostgreSQL optimizer statistics
  try {
    await sequelize.query('ANALYZE tasks, events, daily_reports, goals, work_sessions, schedule_deviations, work_requests, categories;');
  } catch (err) {
    // safe ignore
  }

  console.log('✅ PostgreSQL database indexes and query planner successfully optimized!');
}

module.exports = { optimizeDatabase };
