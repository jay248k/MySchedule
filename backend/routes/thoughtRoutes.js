const express = require('express');
const router = express.Router();
const thoughtController = require('../controllers/thoughtController');
const { optionalAuth } = require('../middleware/auth');

router.use(optionalAuth);

router.get('/', thoughtController.getThoughts);
router.get('/:id', thoughtController.getThoughtById);
router.post('/', thoughtController.createThought);
router.put('/:id', thoughtController.updateThought);
router.delete('/:id', thoughtController.deleteThought);

module.exports = router;
