const express = require('express');
const multer = require('multer');
const router = express.Router();
const curriculumImportController = require('../controllers/curriculumImportController');
const { optionalAuth } = require('../middleware/auth');

// Configure multer for file upload (in memory)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = [
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // xlsx
      'application/vnd.ms-excel', // xls
      'text/csv',
      'application/csv',
    ];
    if (allowedTypes.includes(file.mimetype) || file.originalname.match(/\.(xlsx|xls|csv)$/i)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only Excel (.xlsx, .xls) and CSV files are allowed.'), false);
    }
  },
});

router.use(optionalAuth);

// Import curriculum from Excel/CSV
router.post('/import', upload.single('file'), curriculumImportController.importCurriculum);

// Preview import without making changes
router.post('/preview', upload.single('file'), curriculumImportController.previewImport);

// Download import template
router.get('/template', curriculumImportController.getImportTemplate);

// Rebuild lesson chains
router.post('/rebuild-chains', curriculumImportController.rebuildChains);

// Validate chain integrity
router.get('/validate-chain', curriculumImportController.validateChains);

// Repair chain integrity
router.post('/repair-chain', curriculumImportController.repairChains);

module.exports = router;