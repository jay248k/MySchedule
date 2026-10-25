const express = require('express');
const router = express.Router();
const reportController = require('../controllers/reportController');

router.get('/', reportController.getAllReports);
router.get('/:date', reportController.getReportByDate);
router.post('/', reportController.saveReport);
router.delete('/:date', reportController.deleteReport);

module.exports = router;
