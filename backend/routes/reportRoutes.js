const express = require('express');
const router = express.Router();
const reportController = require('../controllers/reportController');
const { optionalAuth } = require('../middleware/auth');

router.use(optionalAuth);

router.get('/', reportController.getAllReports);
router.get('/:date', reportController.getReportByDate);
router.post('/', reportController.saveReport);
router.delete('/:date', reportController.deleteReport);

module.exports = router;
