const express = require('express');
const router = express.Router();

// Deprecated: Role routes removed.
router.all('*', (req, res) => {
  res.status(404).json({ success: false, message: 'Role API endpoints have been removed.' });
});

module.exports = router;
