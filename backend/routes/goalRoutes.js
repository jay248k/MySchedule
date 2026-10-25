const express = require('express');
const router = express.Router();
const goalController = require('../controllers/goalController');
const { optionalAuth } = require('../middleware/auth');

router.use(optionalAuth);

router.get('/', goalController.getAllGoals);
router.post('/bulk', goalController.bulkCreateGoals);
router.get('/:id', goalController.getGoalById);
router.post('/', goalController.createGoal);
router.put('/:id', goalController.updateGoal);
router.delete('/:id', goalController.deleteGoal);

module.exports = router;
