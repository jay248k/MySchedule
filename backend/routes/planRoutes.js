const express = require('express');
const router = express.Router();
const planController = require('../controllers/planController');
const { optionalAuth } = require('../middleware/auth');

router.use(optionalAuth);

router.get('/', planController.getAllPlans);
router.get('/template', (req, res) => res.json({ success: true, message: 'Template endpoint' }));
router.get('/:id', planController.getPlanById);
router.get('/:id/progress', planController.getPlanProgress);
router.post('/', planController.createPlan);
router.post('/bulk', planController.bulkCreatePlans);
router.put('/:id', planController.updatePlan);
router.delete('/:id', planController.deletePlan);

module.exports = router;