const express = require('express');
const router = express.Router();

// Deprecated: Permission routes removed.
router.all('*', (req, res) => {
  res.status(404).json({ success: false, message: 'Permission API endpoints have been removed.' });
});

module.exports = router;
