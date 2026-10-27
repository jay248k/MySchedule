const express = require('express');
const router = express.Router();
const requestController = require('../controllers/workRequestController');
const { optionalAuth } = require('../middleware/auth');

router.use(optionalAuth);

router.get('/', requestController.getAllRequests);
router.get('/:id', requestController.getRequestById);
router.post('/', requestController.createRequest);
router.patch('/:id/complete', requestController.completeRequest);
router.patch('/:id/reschedule', requestController.rescheduleRequest);
router.patch('/:id/cancel', requestController.cancelRequest);
router.delete('/:id', requestController.deleteRequest);

module.exports = router;
