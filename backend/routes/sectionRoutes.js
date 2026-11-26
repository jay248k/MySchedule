const express = require('express');
const router = express.Router();
const sectionController = require('../controllers/sectionController');
const { optionalAuth } = require('../middleware/auth');

router.use(optionalAuth);

router.get('/plan/:planId', sectionController.getSectionsByPlan);
router.get('/:id', sectionController.getSectionById);
router.post('/', sectionController.createSection);
router.put('/:id', sectionController.updateSection);
router.delete('/:id', sectionController.deleteSection);
router.post('/reorder', sectionController.reorderSections);

module.exports = router;