const express = require('express');
const router = express.Router();
const habitController = require('../controllers/habitController');
const { optionalAuth } = require('../middleware/auth');

router.use(optionalAuth);

router.get('/', habitController.getHabits);
router.get('/report', habitController.getHabitsReport);
router.get('/:id', habitController.getHabitById);
router.post('/', habitController.createHabit);
router.put('/:id', habitController.updateHabit);
router.delete('/:id', habitController.deleteHabit);
router.post('/:id/toggle', habitController.toggleHabitDate);

module.exports = router;

