const express = require('express');
const screenTimeController = require('../controllers/screenTimeController');
const { optionalAuth } = require('../middleware/auth');

const router = express.Router();

router.use(optionalAuth);

router.get('/', screenTimeController.getDailyScreenTimes);
router.get('/apps/list', screenTimeController.getDynamicApps);
router.post('/apps', screenTimeController.upsertDynamicApp);
router.delete('/apps/:id', screenTimeController.deleteDynamicApp);
router.get('/:date', screenTimeController.getDailyScreenTimeByDate);
router.post('/total', screenTimeController.upsertDailyScreenTime);
router.post('/app', screenTimeController.addAppUnderDailyScreenTime);
router.delete('/app/:id', screenTimeController.deleteAppScreenTime);
router.delete('/total/:id', screenTimeController.deleteDailyScreenTime);

module.exports = router;
