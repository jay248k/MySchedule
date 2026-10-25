const express = require('express');
const router = express.Router();
const eventController = require('../controllers/eventController');
const { optionalAuth } = require('../middleware/auth');

router.use(optionalAuth);

router.get('/', eventController.getAllEvents);
router.get('/:id', eventController.getEventById);
router.post('/', eventController.createEvent);
router.put('/:id', eventController.updateEvent);
router.delete('/:id', eventController.deleteEvent);

module.exports = router;
