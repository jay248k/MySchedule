const express = require('express');
const router = express.Router();
const workSessionController = require('../controllers/workSessionController');
const { optionalAuth } = require('../middleware/auth');

router.use(optionalAuth);

router.get('/', workSessionController.getAllWorkSessions);
router.get('/:id', workSessionController.getWorkSessionById);
router.post('/', workSessionController.createWorkSession);
router.put('/:id', workSessionController.updateWorkSession);
router.delete('/:id', workSessionController.deleteWorkSession);

module.exports = router;
