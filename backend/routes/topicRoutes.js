const express = require('express');
const router = express.Router();
const topicController = require('../controllers/topicController');
const { optionalAuth } = require('../middleware/auth');

router.use(optionalAuth);

// Subsections
router.get('/subsection/section/:sectionId', topicController.getSubsectionsBySection);
router.get('/subsection/:id', topicController.getSubsectionById);
router.post('/subsection', topicController.createSubsection);
router.put('/subsection/:id', topicController.updateSubsection);
router.delete('/subsection/:id', topicController.deleteSubsection);

// Topics
router.get('/topic/subsection/:subsectionId', topicController.getTopicsBySubsection);
router.get('/topic/:id', topicController.getTopicById);
router.post('/topic', topicController.createTopic);
router.put('/topic/:id', topicController.updateTopic);
router.delete('/topic/:id', topicController.deleteTopic);

// Subtopics
router.get('/subtopic/topic/:topicId', topicController.getSubtopicsByTopic);
router.get('/subtopic/:id', topicController.getSubtopicById);
router.post('/subtopic', topicController.createSubtopic);
router.put('/subtopic/:id', topicController.updateSubtopic);
router.delete('/subtopic/:id', topicController.deleteSubtopic);

module.exports = router;