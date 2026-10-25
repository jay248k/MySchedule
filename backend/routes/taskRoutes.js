const express = require('express');
const router = express.Router();
const taskController = require('../controllers/taskController');
const { optionalAuth } = require('../middleware/auth');

router.use(optionalAuth);

router.get('/', taskController.getAllTasks);
router.post('/bulk', taskController.bulkCreateTasks);
router.get('/:id', taskController.getTaskById);
router.post('/', taskController.createTask);
router.put('/:id', taskController.updateTask);
router.patch('/:id/toggle-complete', taskController.toggleTaskComplete);
router.delete('/:id', taskController.deleteTask);

module.exports = router;
