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

module.exports = router;

