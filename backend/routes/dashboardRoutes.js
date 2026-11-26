const express = require('express');
const router = express.Router();
const dashboardController = require('../controllers/dashboardController');
const { optionalAuth } = require('../middleware/auth');

router.use(optionalAuth);

router.get('/bootstrap', dashboardController.getBootstrapData);
router.get('/summary', dashboardController.getDashboardSummary);

module.exports = router;

