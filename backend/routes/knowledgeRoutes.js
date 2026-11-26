const express = require('express');
const router = express.Router();
const knowledgeController = require('../controllers/knowledgeController');
const { optionalAuth } = require('../middleware/auth');

router.use(optionalAuth);

router.get('/', knowledgeController.getKnowledgeItems);
router.get('/:id', knowledgeController.getKnowledgeItemById);
router.post('/', knowledgeController.createKnowledgeItem);
router.put('/:id', knowledgeController.updateKnowledgeItem);
router.delete('/:id', knowledgeController.deleteKnowledgeItem);

// Lesson chain endpoints
router.get('/chain/:subtopicId', knowledgeController.getLessonChain);
router.post('/chain/:subtopicId/rebuild', knowledgeController.rebuildLessonChain);

module.exports = router;

