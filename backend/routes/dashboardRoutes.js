const express = require('express');
const dashboardController = require('../controllers/dashboardController');
const analyticsController = require('../controllers/analyticsController');

const router = express.Router();

// Existing routes
router.get('/bootstrap', dashboardController.getBootstrapData);
router.get('/summary', dashboardController.getDashboardSummary);

// NEW: Analytics Charts Endpoint (under 1s target)
router.get('/analytics/charts', analyticsController.getCharts);
// NEW: Screen Time Report for a date/range & upsert
router.get('/analytics/screen-time/:date', analyticsController.getScreenTimeReport);
router.post('/analytics/screen-time', analyticsController.upsertScreenTime);
router.get('/analytics/screen-time-limits', analyticsController.getScreenTimeLimits);
router.post('/analytics/screen-time-limits', analyticsController.upsertScreenTimeLimit);

module.exports = router;
