const express = require('express');
const router = express.Router();
const deviationController = require('../controllers/scheduleDeviationController');
const { optionalAuth } = require('../middleware/auth');

router.use(optionalAuth);

router.get('/', deviationController.getAllDeviations);
router.get('/:id', deviationController.getDeviationById);
router.post('/', deviationController.createDeviation);
router.put('/:id', deviationController.updateDeviation);
router.delete('/:id', deviationController.deleteDeviation);

module.exports = router;
