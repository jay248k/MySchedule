const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { optionalAuth } = require('../middleware/auth');

router.use(optionalAuth);

router.get('/', userController.getUserProfile);
router.put('/', userController.updateUserProfile);

module.exports = router;
