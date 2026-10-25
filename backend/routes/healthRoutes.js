const express = require('express');
const router = express.Router();
const { sequelize } = require('../config/database');
const runSeed = require('../seeders/seedRunner');

router.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
    service: 'MySchedule Backend API',
    database: 'Neon Serverless PostgreSQL',
  });
});

router.get('/db-status', async (req, res) => {
  try {
    await sequelize.authenticate();
    res.json({
      status: 'connected',
      database: 'Neon PostgreSQL',
      ssl: true,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.message,
    });
  }
});

router.post('/seed', async (req, res, next) => {
  try {
    await runSeed();
    res.json({ success: true, message: 'Database seeded successfully' });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
