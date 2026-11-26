const express = require('express');
const router = express.Router();
const searchController = require('../controllers/searchController');
const { authenticateUser } = require('../middleware/auth');

router.get('/', authenticateUser, searchController.searchAll);

module.exports = router;
