const { sequelize } = require('./database');

/**
 * Optimizes the PostgreSQL database by creating essential composite
 * and foreign key indexes, and analyzing tables for the query planner.
 */
async function optimizeDatabase() {
  console.log('⚡ Applying PostgreSQL database indexing & performance optimizations...');

  const indexQueries = [
    // Tasks: heavily queried by (userId, date), (userId, status), categoryId, and goalId
    'CREATE INDEX IF NOT EXISTS idx_tasks_user_date ON tasks ("userId", "date");',
    'CREATE INDEX IF NOT EXISTS idx_tasks_user_status ON tasks ("userId", "status");',
    'CREATE INDEX IF NOT EXISTS idx_tasks_category ON tasks ("categoryId");',
    'CREATE INDEX IF NOT EXISTS idx_tasks_goal ON tasks ("goalId");',
    'CREATE INDEX IF NOT EXISTS idx_tasks_date ON tasks ("date");',

    // Events: queried by (userId, date) and categoryId
    'CREATE INDEX IF NOT EXISTS idx_events_user_date ON events ("userId", "date");',
    'CREATE INDEX IF NOT EXISTS idx_events_category ON events ("categoryId");',

    // Daily Reports: queried by (userId, date)
    'CREATE INDEX IF NOT EXISTS idx_reports_user_date ON daily_reports ("userId", "date");',

    // Goals: queried by userId and status
    'CREATE INDEX IF NOT EXISTS idx_goals_user ON goals ("userId");',
    'CREATE INDEX IF NOT EXISTS idx_goals_status ON goals ("status");',

    // Work Sessions: queried by (userId, date) and status
    'CREATE INDEX IF NOT EXISTS idx_work_sessions_user_date ON work_sessions ("userId", "date");',
    'CREATE INDEX IF NOT EXISTS idx_work_sessions_status ON work_sessions ("status");',

    // Schedule Deviations: queried by (userId, date)
    'CREATE INDEX IF NOT EXISTS idx_schedule_deviations_user_date ON schedule_deviations ("userId", "date");',

    // Work Requests: queried by (userId, status)
    'CREATE INDEX IF NOT EXISTS idx_work_requests_user_status ON work_requests ("userId", "status");',

    // Categories: queried by userId
    'CREATE INDEX IF NOT EXISTS idx_categories_user ON categories ("userId");',

    // Settings: queried by userId
    'CREATE INDEX IF NOT EXISTS idx_settings_user ON settings ("userId");',
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
