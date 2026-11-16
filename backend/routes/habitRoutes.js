const express = require('express');
const router = express.Router();
const habitController = require('../controllers/habitController');
const { authMiddleware } = require('../middleware/authMiddleware');

// Public or optional auth depending on environment
const authenticate = authMiddleware ? [authMiddleware] : [];

router.get('/', ...authenticate, habitController.getHabits);
router.get('/report', ...authenticate, habitController.getHabitsReport);
router.get('/:id', ...authenticate, habitController.getHabitById);
router.post('/', ...authenticate, habitController.createHabit);
router.put('/:id', ...authenticate, habitController.updateHabit);
router.delete('/:id', ...authenticate, habitController.deleteHabit);
router.post('/:id/toggle', ...authenticate, habitController.toggleHabitDate);

module.exports = router;
