const XLSX = require('xlsx');
const ExcelImportService = require('../services/excelImportService');

const getModels = () => require('../models');

/**
 * Import curriculum from Excel/CSV file
 */
exports.importCurriculum = async (req, res, next) => {
  try {
    const models = getModels();

    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No file uploaded' });
    }

    const userId = req.userId;
    const fileBuffer = req.file.buffer;
    const filename = req.file.originalname;

    const importService = new ExcelImportService(models);

    // Parse the file
    const { headers, rows, detectedTitle } = await importService.parseFile(fileBuffer, filename);

    if (rows.length === 0) {
      return res.status(400).json({ success: false, message: 'No data rows found in file' });
    }

    // Normalize rows
    const normalizedRows = rows.map((row, idx) => {
      const obj = {};
      headers.forEach((header, i) => {
        obj[header] = row[i];
      });
      return importService.normalizeRow(obj);
    });

    // Validate each row - validateRow sets lessonOrder on the row
    const allErrors = [];
    const allWarnings = [];
    normalizedRows.forEach((row, idx) => {
      const validation = importService.validateRow(row, idx + 2);
      allErrors.push(...validation.errors);
      allWarnings.push(...validation.warnings);
    });

    // Check for duplicate orders (uses lessonOrder set by validateRow)
    const duplicateValidation = importService.validateDuplicateOrders(normalizedRows);
    allErrors.push(...duplicateValidation.errors);

    if (allErrors.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: allErrors,
        warnings: allWarnings,
      });
    }

    // Execute import using validated rows (which now have lessonOrder set)
    const result = await importService.executeImport(normalizedRows, userId);

    res.json({
      success: true,
      message: 'Curriculum imported successfully',
      detectedTitle,
      stats: result.stats,
      chains: result.chains,
      warnings: allWarnings,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Preview import without making changes
 */
exports.previewImport = async (req, res, next) => {
  try {
    const models = getModels();

    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No file uploaded' });
    }

    const userId = req.userId;
    const fileBuffer = req.file.buffer;
    const filename = req.file.originalname;

    const importService = new ExcelImportService(models);

    const { headers, rows, detectedTitle } = await importService.parseFile(fileBuffer, filename);

    if (rows.length === 0) {
      return res.status(400).json({ success: false, message: 'No data rows found in file' });
    }

    const normalizedRows = rows.map((row, idx) => {
      const obj = {};
      headers.forEach((header, i) => {
        obj[header] = row[i];
      });
      return importService.normalizeRow(obj);
    });

    // Validate
    const allErrors = [];
    const allWarnings = [];
    normalizedRows.forEach((row, idx) => {
      const validation = importService.validateRow(row, idx + 2);
      allErrors.push(...validation.errors);
      allWarnings.push(...validation.warnings);
    });

    const duplicateValidation = importService.validateDuplicateOrders(normalizedRows);
    allErrors.push(...duplicateValidation.errors);

    // Generate preview
    const preview = await importService.generatePreview(normalizedRows, userId);

    res.json({
      success: true,
      detectedTitle,
      headers,
      rowCount: rows.length,
      preview,
      validation: {
        valid: allErrors.length === 0,
        errors: allErrors,
        warnings: allWarnings,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get import template (Excel file with headers)
 */
exports.getImportTemplate = async (req, res, next) => {
  try {
    const templateHeaders = [
      'Category',
      'CategoryDescription',
      'CategoryColor',
      'CategoryIcon',
      'Goal',
      'GoalDescription',
      'GoalTargetDate',
      'GoalProgress',
      'GoalStatus',
      'Plan',
      'PlanDescription',
      'PlanStartDate',
      'PlanEndDate',
      'PlanStatus',
      'Section',
      'SectionDescription',
      'SectionOrder',
      'Subsection',
      'SubsectionDescription',
      'SubsectionOrder',
      'Topic',
      'TopicDescription',
      'TopicOrder',
      'Subtopic',
      'SubtopicDescription',
      'SubtopicOrder',
      'Lesson Title',
      'Lesson Order',
      'Lesson Type',
      'Lesson Content',
      'Lesson Tags',
    ];

    // Sample data
    const sampleData = [
      [
        'Semiconductor',
        'Semiconductor technology learning',
        '#1769FF',
        'Tag',
        'Learn Semiconductor Fundamentals',
        'Master the basics of semiconductor physics',
        '2025-12-31',
        0,
        'in-progress',
        'Semiconductor Roadmap',
        'Complete learning path for semiconductors',
        '2025-01-01',
        '2025-12-31',
        'in-progress',
        'Fundamentals',
        'Basic semiconductor concepts',
        1,
        'Electronic Devices',
        'Diodes, transistors, etc.',
        1,
        'Diode',
        'PN Junction diode',
        1,
        'PN Junction',
        'Physics of PN junction',
        1,
        'Introduction',
        1,
        'lesson',
        'Introduction to PN junctions',
        'semiconductor,diode',
      ],
      [
        'Semiconductor',
        '',
        '',
        '',
        'Learn Semiconductor Fundamentals',
        '',
        '',
        '',
        '',
        'Semiconductor Roadmap',
        '',
        '',
        '',
        'Fundamentals',
        '',
        '',
        'Electronic Devices',
        '',
        '',
        'Diode',
        '',
        '',
        'PN Junction',
        '',
        '',
        'Formation',
        2,
        'lesson',
        'How PN junctions form',
        'semiconductor,diode',
      ],
      [
        'Semiconductor',
        '',
        '',
        '',
        'Learn Semiconductor Fundamentals',
        '',
        '',
        '',
        '',
        'Semiconductor Roadmap',
        '',
        '',
        '',
        'Fundamentals',
        '',
        '',
        'Electronic Devices',
        '',
        '',
        'Diode',
        '',
        '',
        'PN Junction',
        '',
        '',
        'Depletion Region',
        3,
        'lesson',
        'Depletion region physics',
        'semiconductor,diode',
      ],
    ];

    const workbook = XLSX.utils.book_new();
    const worksheet = XLSX.utils.aoa_to_sheet([templateHeaders, ...sampleData]);
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Curriculum Template');

    const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename="curriculum-import-template.xlsx"');
    res.send(buffer);
  } catch (error) {
    next(error);
  }
};

/**
 * Rebuild lesson chains for a plan/section/topic/subtopic
 */
exports.rebuildChains = async (req, res, next) => {
  try {
    const { models } = getModels();
    const LessonChainService = require('../services/lessonChainService');
    const chainService = new LessonChainService(models);

    const { planId, sectionId, subsectionId, topicId, subtopicId } = req.body;
    const userId = req.userId;

    let subtopicIds = [];

    if (subtopicId) {
      subtopicIds = [subtopicId];
    } else if (topicId) {
      const subtopics = await models.Subtopic.findAll({
        where: { topicId, userId: userId || null },
        attributes: ['id'],
      });
      subtopicIds = subtopics.map(s => s.id);
    } else if (subsectionId) {
      const topics = await models.Topic.findAll({
        where: { subsectionId, userId: userId || null },
        attributes: ['id'],
        include: [{
          model: models.Subtopic,
          as: 'subtopics',
          attributes: ['id'],
        }],
      });
      subtopicIds = topics.flatMap(t => t.subtopics.map(s => s.id));
    } else if (sectionId) {
      const subsections = await models.Subsection.findAll({
        where: { sectionId, userId: userId || null },
        attributes: ['id'],
        include: [{
          model: models.Topic,
          as: 'topics',
          attributes: ['id'],
          include: [{
            model: models.Subtopic,
            as: 'subtopics',
            attributes: ['id'],
          }],
        }],
      });
      subtopicIds = subsections.flatMap(ss =>
        ss.topics.flatMap(t => t.subtopics.map(s => s.id))
      );
    } else if (planId) {
      const sections = await models.Section.findAll({
        where: { planId, userId: userId || null },
        attributes: ['id'],
        include: [{
          model: models.Subsection,
          as: 'subsections',
          attributes: ['id'],
          include: [{
            model: models.Topic,
            as: 'topics',
            attributes: ['id'],
            include: [{
              model: models.Subtopic,
              as: 'subtopics',
              attributes: ['id'],
            }],
          }],
        }],
      });
      subtopicIds = sections.flatMap(s =>
        s.subsections.flatMap(ss =>
          ss.topics.flatMap(t => t.subtopics.map(st => st.id))
        )
      );
    } else {
      return res.status(400).json({
        success: false,
        message: 'At least one of: planId, sectionId, subsectionId, topicId, subtopicId is required',
      });
    }

    const results = [];
    for (const sid of subtopicIds) {
      const result = await chainService.rebuildChain({ subtopicId: sid, userId });
      results.push({ subtopicId: sid, ...result });
    }

    res.json({
      success: true,
      message: `Rebuilt chains for ${results.length} subtopics`,
      results,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Validate chain integrity
 */
exports.validateChains = async (req, res, next) => {
  try {
    const { models } = getModels();
    const LessonChainService = require('../services/lessonChainService');
    const chainService = new LessonChainService(models);

    const { subtopicId } = req.query;
    const userId = req.userId;

    if (!subtopicId) {
      return res.status(400).json({ success: false, message: 'subtopicId is required' });
    }

    const validation = await chainService.validateChain({ subtopicId, userId });
    res.json({ success: true, data: validation });
  } catch (error) {
    next(error);
  }
};

/**
 * Repair chain integrity
 */
exports.repairChains = async (req, res, next) => {
  try {
    const { models } = getModels();
    const LessonChainService = require('../services/lessonChainService');
    const chainService = new LessonChainService(models);

    const { subtopicId } = req.body;
    const userId = req.userId;

    if (!subtopicId) {
      return res.status(400).json({ success: false, message: 'subtopicId is required' });
    }

    const result = await chainService.repairChain({ subtopicId, userId });
    res.json({ success: true, message: 'Chain repaired', data: result });
  } catch (error) {
    next(error);
  }
};