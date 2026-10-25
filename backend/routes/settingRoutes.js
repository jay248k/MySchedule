const express = require('express');
const router = express.Router();
const settingController = require('../controllers/settingController');
const { optionalAuth } = require('../middleware/auth');

router.use(optionalAuth);

router.get('/', settingController.getSettings);
router.put('/', settingController.updateSettings);

module.exports = router;
