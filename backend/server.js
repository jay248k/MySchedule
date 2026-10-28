require('dotenv').config();
const express = require('express');
const cors = require('cors');
const compression = require('compression');
const morgan = require('morgan');

const { sequelize } = require('./config/database');
const { optimizeDatabase } = require('./config/optimizeDatabase');
const db = require('./models');

// Import routes
const healthRoutes = require('./routes/healthRoutes');
const categoryRoutes = require('./routes/categoryRoutes');
const taskRoutes = require('./routes/taskRoutes');
const eventRoutes = require('./routes/eventRoutes');
const goalRoutes = require('./routes/goalRoutes');
const reportRoutes = require('./routes/reportRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const settingRoutes = require('./routes/settingRoutes');
const userRoutes = require('./routes/userRoutes');
const authRoutes = require('./routes/authRoutes');
const workSessionRoutes = require('./routes/workSessionRoutes');
const scheduleDeviationRoutes = require('./routes/scheduleDeviationRoutes');
const workRequestRoutes = require('./routes/workRequestRoutes');

const { errorHandler, notFoundHandler } = require('./middleware/errorHandler');

const app = express();
const PORT = process.env.PORT || 5000;

// Performance Middleware: Gzip/Brotli compression for all JSON responses
app.use(compression());

// Middleware
app.use(
  cors({
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan('dev'));

// Detailed API Call Logger: Prints API path in console for every request
app.use((req, res, next) => {
  const start = Date.now();
  const timestamp = new Date().toLocaleTimeString();
  const apiPath = req.originalUrl || req.url;

  console.log(`\n➡️  [${timestamp}] API CALL: ${req.method} ${apiPath}`);

  res.on('finish', () => {
    const duration = Date.now() - start;
    console.log(`⬅️  [${timestamp}] COMPLETED: ${req.method} ${apiPath} | Status: ${res.statusCode} (${duration}ms)`);
  });

  next();
});

// Welcome root route
app.get('/', (req, res) => {
  res.json({
    message: '🚀 MySchedule Backend API is running with Neon PostgreSQL & Sequelize',
    docs: {
      health: '/api/health',
      dbStatus: '/api/db-status',
      auth: {
        signup: 'POST /api/auth/signup',
        login: 'POST /api/auth/login',
        demo: 'POST /api/auth/demo',
        logout: 'POST /api/auth/logout',
        me: 'GET /api/auth/me',
        profile: 'PUT /api/auth/profile',
      },
      categories: '/api/categories',
      tasks: '/api/tasks',
      events: '/api/events',
      goals: '/api/goals',
      reports: '/api/reports',
      notifications: '/api/notifications',
      settings: '/api/settings',
      user: '/api/user',
    },
  });
});

// API Routes
app.use('/api', healthRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/v1/auth', authRoutes);


// Business Resource Routes
app.use('/api/categories', categoryRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/events', eventRoutes);
app.use('/api/goals', goalRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/settings', settingRoutes);
app.use('/api/user', userRoutes);
app.use('/api/work-sessions', workSessionRoutes);
app.use('/api/deviations', scheduleDeviationRoutes);
app.use('/api/requests', workRequestRoutes);

// 404 & Error Handlers
app.use(notFoundHandler);
app.use(errorHandler);

// Start Server and Connect Database
const startServer = async () => {
  try {
    console.log('🔄 Connecting to Neon PostgreSQL database...');
    await sequelize.authenticate();
    console.log('✅ Connected to Neon PostgreSQL successfully!');

    // Clean up removed RBAC tables and columns in database if they exist
    try {
      await sequelize.query('DROP TABLE IF EXISTS permissions CASCADE;');
      await sequelize.query('DROP TABLE IF EXISTS module_masters CASCADE;');
      await sequelize.query('DROP TABLE IF EXISTS roles CASCADE;');
      await sequelize.query('ALTER TABLE users DROP COLUMN IF EXISTS "roleId";');
      await sequelize.query('ALTER TABLE users DROP COLUMN IF EXISTS "role";');
      await sequelize.query('ALTER TABLE tasks ADD COLUMN IF NOT EXISTS "color" VARCHAR(255);');
    } catch (cleanupErr) {
      // safe ignore if already cleaned
    }

    // Ensure database tables exist (safe sync without dropping data)
    await sequelize.sync();
    console.log('✅ Sequelize models synchronized with database tables.');

    // Apply database indexing & optimization
    await optimizeDatabase();

    // Auto-seed initial data if categories table is empty
    const categoryCount = await db.Category.count();
    if (categoryCount === 0) {
      console.log('📦 Database is empty. Seeding initial categories, tasks, goals & settings...');
      const runSeed = require('./seeders/seedRunner');
      await runSeed();
    }

    app.listen(PORT, () => {
      console.log(`\n==================================================`);
      console.log(`🚀 Server running on: http://localhost:${PORT}`);
      console.log(`📡 Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`🐘 Database: Neon Serverless PostgreSQL`);
      console.log(`==================================================\n`);
    });
  } catch (error) {
    console.error('❌ Failed to initialize database / server:', error);
    process.exit(1);
  }
};

startServer();

module.exports = app;
