const XLSX = require('xlsx');
const CurriculumHierarchyService = require('./curriculumHierarchyService');
const LessonChainService = require('./lessonChainService');

/**
 * Excel Import Service
 * Handles parsing, validation, and import of curriculum Excel files
 */
class ExcelImportService {
  constructor(models) {
    this.models = models;
    this.hierarchyService = new CurriculumHierarchyService(models);
    this.chainService = new LessonChainService(models);
  }

  /**
   * Parse Excel/CSV file buffer
   * @param {Buffer} fileBuffer - File buffer
   * @param {string} filename - Original filename
   * @returns {Object} Parsed data with headers and rows
   */
  async parseFile(fileBuffer, filename) {
    const ext = filename.split('.').pop().toLowerCase();
    let workbook;

    if (ext === 'xlsx' || ext === 'xls') {
      workbook = XLSX.read(fileBuffer, { type: 'buffer' });
    } else if (ext === 'csv') {
      const text = fileBuffer.toString('utf-8');
      workbook = XLSX.read(text, { type: 'string' });
    } else {
      throw new Error(`Unsupported file format: ${ext}. Supported: xlsx, xls, csv`);
    }

    const firstSheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[firstSheetName];
    const rawData = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: '' });

    if (rawData.length === 0) {
      return { headers: [], rows: [], detectedTitle: '' };
    }

    // Find header row (skip empty rows)
    let headerIdx = 0;
    while (headerIdx < rawData.length &&
           (!rawData[headerIdx] || rawData[headerIdx].every(c => !String(c).trim()))) {
      headerIdx++;
    }

    if (headerIdx >= rawData.length) {
      return { headers: [], rows: [], detectedTitle: '' };
    }

    const headerRow = rawData[headerIdx];
    const headers = headerRow.map((h, i) =>
      h !== undefined && String(h).trim() ? String(h).trim() : `Col ${i + 1}`
    );

    const rows = rawData.slice(headerIdx + 1)
      .filter(r => r && r.some(c => c !== undefined && String(c).trim() !== ''))
      .map(r => headers.map((_, i) => r[i] !== undefined && r[i] !== null ? String(r[i]).trim() : ''));

    // Try to detect title from sheet name or filename
    let detectedTitle = '';
    if (firstSheetName && firstSheetName.toLowerCase() !== 'sheet1') {
      detectedTitle = firstSheetName;
    } else {
      const cleanFilename = filename.replace(/\.[^/.]+$/, '').replace(/[_-]/g, ' ').trim();
      if (cleanFilename) {
        detectedTitle = cleanFilename.charAt(0).toUpperCase() + cleanFilename.slice(1);
      }
    }

    return { headers, rows, detectedTitle };
  }

  /**
   * Normalize row keys to handle case variations
   * @param {Object} row - Raw row object
   * @returns {Object} Normalized row
   */
  normalizeRow(row) {
    const normalized = {};
    const keyMap = {
      'category': 'Category',
      'goal': 'Goal',
      'plan': 'Plan',
      'section': 'Section',
      'subsection': 'Subsection',
      'topic': 'Topic',
      'subtopic': 'Subtopic',
      'lesson title': 'Lesson Title',
      'lesson order': 'Lesson Order',
      'lesson type': 'Lesson Type',
      'lesson content': 'Lesson Content',
      'lesson tags': 'Lesson Tags',
      'order': 'Lesson Order',
      'title': 'Lesson Title',
      'type': 'Lesson Type',
      'content': 'Lesson Content',
      'tags': 'Lesson Tags',
    };

    for (const [key, value] of Object.entries(row)) {
      const normalizedKey = keyMap[key.toLowerCase().trim()] || key.trim();
      normalized[normalizedKey] = value;
    }

    return normalized;
  }

  /**
   * Validate a single row
   * @param {Object} row - Normalized row
   * @param {number} rowIndex - Row index (for error reporting)
   * @returns {Object} Validation result
   */
  validateRow(row, rowIndex) {
    const errors = [];
    const warnings = [];

    // Lesson Title is required
    const lessonTitle = row['Lesson Title'] || row['Lesson'] || row['Title'];
    if (!lessonTitle || !lessonTitle.trim()) {
      errors.push(`Row ${rowIndex}: Lesson Title is required`);
    }

    // Lesson Order validation - assign to row.lessonOrder for later use
    const order = row['Lesson Order'] || row['Order'];
    if (order !== undefined && order !== '') {
      const numOrder = Number(order);
      if (isNaN(numOrder) || numOrder < 1) {
        errors.push(`Row ${rowIndex}: Lesson Order must be a positive number, got: ${order}`);
      } else {
        row.lessonOrder = numOrder;
      }
    }

    // Hierarchy validation
    const hasSubtopic = !!(row.Subtopic || row.subtopic);
    const hasTopic = !!(row.Topic || row.topic);
    const hasSubsection = !!(row.Subsection || row.subsection);
    const hasSection = !!(row.Section || row.section);
    const hasPlan = !!(row.Plan || row.plan);
    const hasGoal = !!(row.Goal || row.goal);
    const hasCategory = !!(row.Category || row.category);

    if (hasSubtopic && !hasTopic) {
      errors.push(`Row ${rowIndex}: Subtopic requires a Topic`);
    }
    if (hasTopic && !hasSubsection) {
      warnings.push(`Row ${rowIndex}: Topic without Subsection`);
    }
    if (hasSubsection && !hasSection) {
      warnings.push(`Row ${rowIndex}: Subsection without Section`);
    }
    if (hasSection && !hasPlan) {
      errors.push(`Row ${rowIndex}: Section requires a Plan`);
    }
    if (hasPlan && !hasGoal && !hasCategory) {
      warnings.push(`Row ${rowIndex}: Plan without Goal or Category`);
    }

    return { valid: errors.length === 0, errors, warnings };
  }

  /**
   * Validate entire dataset for duplicate lesson orders within same chain scope
   * @param {Array} rows - Normalized rows with lessonOrder
   * @returns {Object} Validation result
   */
  validateDuplicateOrders(rows) {
    const errors = [];
    const chainOrders = new Map(); // key: "category|goal|plan|section|subsection|topic|subtopic" -> Set of orders

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const rowNum = i + 2; // +2 for header and 1-based

      const lessonOrder = row.lessonOrder;
      if (!lessonOrder) continue;

      const scopeKey = [
        row.Category || row.category || '',
        row.Goal || row.goal || '',
        row.Plan || row.plan || '',
        row.Section || row.section || '',
        row.Subsection || row.subsection || '',
        row.Topic || row.topic || '',
        row.Subtopic || row.subtopic || '',
      ].join('|');

      if (!chainOrders.has(scopeKey)) {
        chainOrders.set(scopeKey, new Map());
      }
      const orderMap = chainOrders.get(scopeKey);

      if (orderMap.has(lessonOrder)) {
        const firstRow = orderMap.get(lessonOrder);
        errors.push(
          `Row ${rowNum}: Duplicate Lesson Order ${lessonOrder} in scope: ${scopeKey} ` +
          `(first seen at row ${firstRow})`
        );
      } else {
        orderMap.set(lessonOrder, rowNum);
      }
    }

    return { valid: errors.length === 0, errors };
  }

  /**
   * Generate import preview without making changes
   * @param {Array} rows - Normalized rows
   * @param {string} userId - User ID (can be null/undefined for unauthenticated preview)
   * @returns {Object} Preview result
   */
  async generatePreview(rows, userId) {
    const effectiveUserId = userId || null;
    const preview = {
      categories: new Map(),
      goals: new Map(),
      plans: new Map(),
      sections: new Map(),
      subsections: new Map(),
      topics: new Map(),
      subtopics: new Map(),
      lessons: [],
      errors: [],
      warnings: [],
      stats: {
        categories: { create: 0, reuse: 0 },
        goals: { create: 0, reuse: 0 },
        plans: { create: 0, reuse: 0 },
        sections: { create: 0, reuse: 0 },
        subsections: { create: 0, reuse: 0 },
        topics: { create: 0, reuse: 0 },
        subtopics: { create: 0, reuse: 0 },
        lessons: { create: 0 },
      },
    };

    // Check each hierarchy level for existence
    for (const row of rows) {
      // Category
      if (row.Category || row.category) {
        const name = (row.Category || row.category).trim();
        const key = `cat:${effectiveUserId}:${name}`;
        if (!preview.categories.has(key)) {
          const existing = await this.models.Category.findOne({
            where: { name, [this.models.Sequelize.Op.or]: [{ userId: effectiveUserId }, { userId: null }] },
          });
          preview.categories.set(key, { name, existing: !!existing });
          if (existing) preview.stats.categories.reuse++;
          else preview.stats.categories.create++;
        }
      }

      // Goal
      if (row.Goal || row.goal) {
        const title = (row.Goal || row.goal).trim();
        const catName = (row.Category || row.category || '').trim();
        const cat = await this.models.Category.findOne({
          where: { name: catName, [this.models.Sequelize.Op.or]: [{ userId: effectiveUserId }, { userId: null }] },
        });
        const key = `goal:${effectiveUserId}:${cat?.id || 'none'}:${title}`;
        if (!preview.goals.has(key)) {
          const existing = await this.models.Goal.findOne({
            where: { title, category: cat?.id || null, [this.models.Sequelize.Op.or]: [{ userId: effectiveUserId }, { userId: null }] },
          });
          preview.goals.set(key, { title, category: cat?.id, existing: !!existing });
          if (existing) preview.stats.goals.reuse++;
          else preview.stats.goals.create++;
        }
      }

      // Plan
      if (row.Plan || row.plan) {
        const title = (row.Plan || row.plan).trim();
        const goalTitle = (row.Goal || row.goal || '').trim();
        const goal = goalTitle ? await this.models.Goal.findOne({
          where: { title: goalTitle, [this.models.Sequelize.Op.or]: [{ userId: effectiveUserId }, { userId: null }] },
        }) : null;
        const key = `plan:${effectiveUserId}:${goal?.id || 'none'}:${title}`;
        if (!preview.plans.has(key)) {
          const existing = await this.models.Plan.findOne({
            where: { title, goalId: goal?.id || null, [this.models.Sequelize.Op.or]: [{ userId: effectiveUserId }, { userId: null }] },
          });
          preview.plans.set(key, { title, goalId: goal?.id, existing: !!existing });
          if (existing) preview.stats.plans.reuse++;
          else preview.stats.plans.create++;
        }
      }

      // Section
      if (row.Section || row.section) {
        const title = (row.Section || row.section).trim();
        const planTitle = (row.Plan || row.plan || '').trim();
        const plan = planTitle ? await this.models.Plan.findOne({
          where: { title: planTitle, [this.models.Sequelize.Op.or]: [{ userId: effectiveUserId }, { userId: null }] },
        }) : null;
        const key = `sec:${effectiveUserId}:${plan?.id || 'none'}:${title}`;
        if (!preview.sections.has(key) && plan) {
          const existing = await this.models.Section.findOne({
            where: { title, planId: plan.id, userId: effectiveUserId },
          });
          preview.sections.set(key, { title, planId: plan.id, existing: !!existing });
          if (existing) preview.stats.sections.reuse++;
          else preview.stats.sections.create++;
        }
      }

      // Subsection
      if (row.Subsection || row.subsection) {
        const title = (row.Subsection || row.subsection).trim();
        const sectionTitle = (row.Section || row.section || '').trim();
        const section = sectionTitle ? await this.models.Section.findOne({
          where: { title: sectionTitle, userId: effectiveUserId },
        }) : null;
        const key = `subsec:${effectiveUserId}:${section?.id || 'none'}:${title}`;
        if (!preview.subsections.has(key) && section) {
          const existing = await this.models.Subsection.findOne({
            where: { title, sectionId: section.id, userId: effectiveUserId },
          });
          preview.subsections.set(key, { title, sectionId: section.id, existing: !!existing });
          if (existing) preview.stats.subsections.reuse++;
          else preview.stats.subsections.create++;
        }
      }

      // Topic
      if (row.Topic || row.topic) {
        const title = (row.Topic || row.topic).trim();
        const subsectionTitle = (row.Subsection || row.subsection || '').trim();
        const subsection = subsectionTitle ? await this.models.Subsection.findOne({
          where: { title: subsectionTitle, userId: effectiveUserId },
        }) : null;
        const key = `topic:${effectiveUserId}:${subsection?.id || 'none'}:${title}`;
        if (!preview.topics.has(key) && subsection) {
          const existing = await this.models.Topic.findOne({
            where: { title, subsectionId: subsection.id, userId: effectiveUserId },
          });
          preview.topics.set(key, { title, subsectionId: subsection.id, existing: !!existing });
          if (existing) preview.stats.topics.reuse++;
          else preview.stats.topics.create++;
        }
      }

      // Subtopic
      if (row.Subtopic || row.subtopic) {
        const title = (row.Subtopic || row.subtopic).trim();
        const topicTitle = (row.Topic || row.topic || '').trim();
        const topic = topicTitle ? await this.models.Topic.findOne({
          where: { title: topicTitle, userId: effectiveUserId },
        }) : null;
        const key = `subtopic:${effectiveUserId}:${topic?.id || 'none'}:${title}`;
        if (!preview.subtopics.has(key) && topic) {
          const existing = await this.models.Subtopic.findOne({
            where: { title, topicId: topic.id, userId: effectiveUserId },
          });
          preview.subtopics.set(key, { title, topicId: topic.id, existing: !!existing });
          if (existing) preview.stats.subtopics.reuse++;
          else preview.stats.subtopics.create++;
        }
      }

      // Lesson
      const lessonTitle = row['Lesson Title'] || row['Lesson'] || row['Title'];
      if (lessonTitle) {
        preview.lessons.push({
          title: lessonTitle.trim(),
          order: row.lessonOrder,
          content: row['Lesson Content'] || row['Content'] || '',
          tags: row['Lesson Tags'] || row['Tags'] || '',
          type: row['Lesson Type'] || row['Type'] || 'lesson',
        });
        preview.stats.lessons.create++;
      }
    }

    // Convert maps to arrays for JSON serialization
    preview.categories = Array.from(preview.categories.values());
    preview.goals = Array.from(preview.goals.values());
    preview.plans = Array.from(preview.plans.values());
    preview.sections = Array.from(preview.sections.values());
    preview.subsections = Array.from(preview.subsections.values());
    preview.topics = Array.from(preview.topics.values());
    preview.subtopics = Array.from(preview.subtopics.values());

    return preview;
  }

  /**
   * Execute the full import
   * @param {Array} rows - Normalized rows
   * @param {string} userId - User ID
   * @returns {Object} Import result
   */
  async executeImport(rows, userId) {
    const effectiveUserId = userId || null;
    const result = {
      success: true,
      stats: {
        categories: { created: 0, reused: 0 },
        goals: { created: 0, reused: 0 },
        plans: { created: 0, reused: 0 },
        sections: { created: 0, reused: 0 },
        subsections: { created: 0, reused: 0 },
        topics: { created: 0, reused: 0 },
        subtopics: { created: 0, reused: 0 },
        lessons: { created: 0, updated: 0 },
        chains: { rebuilt: 0 },
      },
      errors: [],
      chains: [],
    };

    const transaction = await this.models.sequelize.transaction();

    try {
      // Group rows by subtopic for chain building
      const rowsBySubtopic = new Map();

      // Context to carry forward hierarchy from previous rows
      const hierarchyContext = {};

      for (let i = 0; i < rows.length; i++) {
        const row = rows[i];
        const rowNum = i + 2;

        // Resolve hierarchy with context from previous rows
        const { results: hierarchy, errors: hierarchyErrors } =
          await this.hierarchyService.resolveHierarchy(row, effectiveUserId, hierarchyContext);

        hierarchyErrors.forEach(e => result.errors.push(`Row ${rowNum}: ${e}`));

        // Update context for next row
        if (hierarchy.categoryId) hierarchyContext.categoryId = hierarchy.categoryId;
        if (hierarchy.goalId) hierarchyContext.goalId = hierarchy.goalId;
        if (hierarchy.planId) hierarchyContext.planId = hierarchy.planId;
        if (hierarchy.sectionId) hierarchyContext.sectionId = hierarchy.sectionId;
        if (hierarchy.subsectionId) hierarchyContext.subsectionId = hierarchy.subsectionId;
        if (hierarchy.topicId) hierarchyContext.topicId = hierarchy.topicId;
        if (hierarchy.subtopicId) hierarchyContext.subtopicId = hierarchy.subtopicId;

        if (!hierarchy.subtopicId) {
          result.errors.push(`Row ${rowNum}: Could not resolve subtopic for lesson`);
          continue;
        }

        // Create/update lesson
        const lessonTitle = (row['Lesson Title'] || row['Lesson'] || row['Title']).trim();
        const lessonOrder = row.lessonOrder || 1;
        const lessonContent = row['Lesson Content'] || row['Content'] || '';
        const lessonTags = row['Lesson Tags'] || row['Tags'] || '';
        const lessonType = row['Lesson Type'] || row['Type'] || 'lesson';

        // Check if lesson already exists (by title + subtopicId + order)
        const userIdCondition = effectiveUserId
          ? { [this.models.Sequelize.Op.or]: [{ userId: effectiveUserId }, { userId: null }] }
          : { userId: null };

        let lesson = await this.models.KnowledgeItem.findOne({
          where: {
            title: lessonTitle,
            subtopicId: hierarchy.subtopicId,
            lessonOrder,
            type: 'lesson',
            ...userIdCondition,
          },
          transaction,
        });

        if (lesson) {
          // Update existing
          await lesson.update({
            content: lessonContent,
            tags: lessonTags,
            type: lessonType,
            lessonOrder,
            subtopicId: hierarchy.subtopicId,
          }, { transaction });
          result.stats.lessons.updated++;
        } else {
          // Create new
          lesson = await this.models.KnowledgeItem.create({
            title: lessonTitle,
            type: lessonType,
            content: lessonContent,
            tags: lessonTags,
            lessonOrder,
            subtopicId: hierarchy.subtopicId,
            userId: effectiveUserId,
            orderIndex: lessonOrder, // Also set orderIndex for backward compatibility
          }, { transaction });
          result.stats.lessons.created++;
        }

        // Track for chain rebuilding
        const subtopicKey = hierarchy.subtopicId;
        if (!rowsBySubtopic.has(subtopicKey)) {
          rowsBySubtopic.set(subtopicKey, { subtopicId: hierarchy.subtopicId, userId: effectiveUserId, lessons: [] });
        }
        rowsBySubtopic.get(subtopicKey).lessons.push(lesson);

        // Update stats for hierarchy
        if (hierarchy.created.category) result.stats.categories.created++;
        if (hierarchy.reused.category) result.stats.categories.reused++;
        if (hierarchy.created.goal) result.stats.goals.created++;
        if (hierarchy.reused.goal) result.stats.goals.reused++;
        if (hierarchy.created.plan) result.stats.plans.created++;
        if (hierarchy.reused.plan) result.stats.plans.reused++;
        if (hierarchy.created.section) result.stats.sections.created++;
        if (hierarchy.reused.section) result.stats.sections.reused++;
        if (hierarchy.created.subsection) result.stats.subsections.created++;
        if (hierarchy.reused.subsection) result.stats.subsections.reused++;
        if (hierarchy.created.topic) result.stats.topics.created++;
        if (hierarchy.reused.topic) result.stats.topics.reused++;
        if (hierarchy.created.subtopic) result.stats.subtopics.created++;
        if (hierarchy.reused.subtopic) result.stats.subtopics.reused++;
      }

      // Rebuild chains for each subtopic
      for (const [subtopicId, scope] of rowsBySubtopic) {
        const chainResult = await this.chainService.rebuildChain(scope, transaction);
        result.chains.push({
          subtopicId,
          lessonCount: chainResult.count,
          chain: chainResult.chain,
        });
        result.stats.chains.rebuilt++;
      }

      await transaction.commit();
      return result;
    } catch (error) {
      await transaction.rollback();
      result.success = false;
      result.errors.push(error.message);
      return result;
    }
  }
}

module.exports = ExcelImportService;