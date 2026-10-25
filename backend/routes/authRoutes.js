const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { authenticateUser } = require('../middleware/auth');

// Public routes
router.post('/signup', authController.signup);
router.post('/login', authController.login);
router.post('/demo', authController.demoLogin);
router.post('/demo-login', authController.demoLogin);

// Protected routes (JWT & Session required)
router.post('/logout', authenticateUser, authController.logout);
router.get('/me', authenticateUser, authController.getMe);
router.put('/profile', authenticateUser, authController.updateProfile);

module.exports = router;
