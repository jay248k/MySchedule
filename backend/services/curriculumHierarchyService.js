const { Op } = require('sequelize');

/**
 * Curriculum Hierarchy Service
 * Handles automatic find-or-create for Category → Goal → Plan → Section → Subsection → Topic → Subtopic
 * Ensures no duplicates are created during import
 */
class CurriculumHierarchyService {
  constructor(models) {
    this.models = models;
  }

  /**
   * Find or create a Category by name and userId
   * @param {Object} params - { name, userId, description, color, icon }
   * @returns {Object} Category instance
   */
  async findOrCreateCategory({ name, userId, description, color, icon }) {
    if (!name || !name.trim()) {
      throw new Error('Category name is required');
    }
    const trimmedName = name.trim();

    const where = { name: trimmedName };
    if (userId) {
      where[Op.or] = [{ userId }, { userId: null }];
    }

    let category = await this.models.Category.findOne({ where });
    if (category) {
      return { category, created: false, reused: true };
    }

    category = await this.models.Category.create({
      name: trimmedName,
      description: description?.trim() || null,
      color: color || '#1769FF',
      icon: icon || 'Tag',
      userId: userId || null,
    });

    return { category, created: true, reused: false };
  }

  /**
   * Find or create a Goal by title and category/userId
   * @param {Object} params - { title, categoryId, userId, description, targetDate, progress, status }
   * @returns {Object} Goal instance
   */
  async findOrCreateGoal({ title, categoryId, userId, description, targetDate, progress, status }) {
    if (!title || !title.trim()) {
      throw new Error('Goal title is required');
    }
    if (!targetDate) {
      throw new Error('Goal targetDate is required');
    }
    const trimmedTitle = title.trim();

    const where = { title: trimmedTitle };
    if (categoryId) {
      where.category = categoryId; // Goal model uses 'category' field, not 'categoryId'
    }
    if (userId) {
      where[Op.or] = [{ userId }, { userId: null }];
    }

    let goal = await this.models.Goal.findOne({ where });
    if (goal) {
      return { goal, created: false, reused: true };
    }

    const validProgress = Math.min(100, Math.max(0, Number(progress) || 0));
    goal = await this.models.Goal.create({
      title: trimmedTitle,
      description: description?.trim() || null,
      targetDate,
      progress: validProgress,
      status: status || (validProgress >= 100 ? 'completed' : 'in-progress'),
      category: categoryId || null, // Goal model uses 'category' field
      userId: userId || null,
    }).catch(() => {
      // If userId FK fails, try without userId
      return this.models.Goal.create({
        title: trimmedTitle,
        description: description?.trim() || null,
        targetDate,
        progress: validProgress,
        status: status || (validProgress >= 100 ? 'completed' : 'in-progress'),
        category: categoryId || null,
        userId: null,
      });
    });

    return { goal, created: true, reused: false };
  }

  /**
   * Find or create a Plan by title and goal/category/userId
   * @param {Object} params - { title, goalId, categoryId, userId, description, startDate, endDate, status }
   * @returns {Object} Plan instance
   */
  async findOrCreatePlan({ title, goalId, categoryId, userId, description, startDate, endDate, status }) {
    if (!title || !title.trim()) {
      throw new Error('Plan title is required');
    }
    const trimmedTitle = title.trim();

    const where = { title: trimmedTitle };
    if (goalId) {
      where.goalId = goalId;
    } else if (categoryId) {
      where.categoryId = categoryId;
    }
    if (userId) {
      where[Op.or] = [{ userId }, { userId: null }];
    }

    let plan = await this.models.Plan.findOne({ where });
    if (plan) {
      return { plan, created: false, reused: true };
    }

    plan = await this.models.Plan.create({
      title: trimmedTitle,
      description: description?.trim() || null,
      goalId: goalId || null,
      categoryId: categoryId || null,
      startDate: startDate || null,
      endDate: endDate || null,
      status: status || 'in-progress',
      progress: 0,
      userId: userId || null,
    }).catch(() => {
      // If userId FK fails, try without userId
      return this.models.Plan.create({
        title: trimmedTitle,
        description: description?.trim() || null,
        goalId: goalId || null,
        categoryId: categoryId || null,
        startDate: startDate || null,
        endDate: endDate || null,
        status: status || 'in-progress',
        progress: 0,
        userId: null,
      });
    });

    return { plan, created: true, reused: false };
  }

  /**
   * Find or create a Section by title and planId/userId
   * @param {Object} params - { title, planId, userId, description, orderIndex }
   * @returns {Object} Section instance
   */
  async findOrCreateSection({ title, planId, userId, description, orderIndex }) {
    if (!title || !title.trim()) {
      throw new Error('Section title is required');
    }
    if (!planId) {
      throw new Error('Section requires a planId');
    }
    const trimmedTitle = title.trim();

    const where = { title: trimmedTitle, planId };
    if (userId) {
      where.userId = userId;
    }

    let section = await this.models.Section.findOne({ where });
    if (section) {
      return { section, created: false, reused: true };
    }

    section = await this.models.Section.create({
      title: trimmedTitle,
      description: description?.trim() || null,
      planId,
      orderIndex: Number(orderIndex) || 0,
      userId: userId || null,
    }).catch(() => {
      // If userId FK fails, try without userId
      return this.models.Section.create({
        title: trimmedTitle,
        description: description?.trim() || null,
        planId,
        orderIndex: Number(orderIndex) || 0,
        userId: null,
      });
    });

    return { section, created: true, reused: false };
  }

  /**
   * Find or create a Subsection by title and sectionId/userId
   * @param {Object} params - { title, sectionId, userId, description, orderIndex }
   * @returns {Object} Subsection instance
   */
  async findOrCreateSubsection({ title, sectionId, userId, description, orderIndex }) {
    if (!title || !title.trim()) {
      throw new Error('Subsection title is required');
    }
    if (!sectionId) {
      throw new Error('Subsection requires a sectionId');
    }
    const trimmedTitle = title.trim();

    const where = { title: trimmedTitle, sectionId };
    if (userId) {
      where.userId = userId;
    }

    let subsection = await this.models.Subsection.findOne({ where });
    if (subsection) {
      return { subsection, created: false, reused: true };
    }

    subsection = await this.models.Subsection.create({
      title: trimmedTitle,
      description: description?.trim() || null,
      sectionId,
      orderIndex: Number(orderIndex) || 0,
      userId: userId || null,
    }).catch(() => {
      // If userId FK fails, try without userId
      return this.models.Subsection.create({
        title: trimmedTitle,
        description: description?.trim() || null,
        sectionId,
        orderIndex: Number(orderIndex) || 0,
        userId: null,
      });
    });

    return { subsection, created: true, reused: false };
  }

  /**
   * Find or create a Topic by title and subsectionId/userId
   * @param {Object} params - { title, subsectionId, userId, description, orderIndex }
   * @returns {Object} Topic instance
   */
  async findOrCreateTopic({ title, subsectionId, userId, description, orderIndex }) {
    if (!title || !title.trim()) {
      throw new Error('Topic title is required');
    }
    if (!subsectionId) {
      throw new Error('Topic requires a subsectionId');
    }
    const trimmedTitle = title.trim();

    const where = { title: trimmedTitle, subsectionId };
    if (userId) {
      where.userId = userId;
    }

    let topic = await this.models.Topic.findOne({ where });
    if (topic) {
      return { topic, created: false, reused: true };
    }

    topic = await this.models.Topic.create({
      title: trimmedTitle,
      description: description?.trim() || null,
      subsectionId,
      orderIndex: Number(orderIndex) || 0,
      userId: userId || null,
    }).catch(() => {
      // If userId FK fails, try without userId
      return this.models.Topic.create({
        title: trimmedTitle,
        description: description?.trim() || null,
        subsectionId,
        orderIndex: Number(orderIndex) || 0,
        userId: null,
      });
    });

    return { topic, created: true, reused: false };
  }

  /**
   * Find or create a Subtopic by title and topicId/userId
   * @param {Object} params - { title, topicId, userId, description, orderIndex }
   * @returns {Object} Subtopic instance
   */
  async findOrCreateSubtopic({ title, topicId, userId, description, orderIndex }) {
    if (!title || !title.trim()) {
      throw new Error('Subtopic title is required');
    }
    if (!topicId) {
      throw new Error('Subtopic requires a topicId');
    }
    const trimmedTitle = title.trim();

    const where = { title: trimmedTitle, topicId };
    if (userId) {
      where.userId = userId;
    }

    let subtopic = await this.models.Subtopic.findOne({ where });
    if (subtopic) {
      return { subtopic, created: false, reused: true };
    }

    subtopic = await this.models.Subtopic.create({
      title: trimmedTitle,
      description: description?.trim() || null,
      topicId,
      orderIndex: Number(orderIndex) || 0,
      userId: userId || null,
    }).catch(() => {
      // If userId FK fails, try without userId
      return this.models.Subtopic.create({
        title: trimmedTitle,
        description: description?.trim() || null,
        topicId,
        orderIndex: Number(orderIndex) || 0,
        userId: null,
      });
    });

    return { subtopic, created: true, reused: false };
  }

  /**
   * Resolve the full curriculum hierarchy from a row of Excel data
   * @param {Object} row - Excel row with Category, Goal, Plan, Section, Subsection, Topic, Subtopic
   * @param {string} userId - Current user ID
   * @param {Object} context - Optional context to carry forward hierarchy from previous rows
   * @returns {Object} All resolved hierarchy IDs
   */
  async resolveHierarchy(row, userId, context = {}) {
    const errors = [];
    const results = {
      categoryId: context.categoryId || null,
      goalId: context.goalId || null,
      planId: context.planId || null,
      sectionId: context.sectionId || null,
      subsectionId: context.subsectionId || null,
      topicId: context.topicId || null,
      subtopicId: context.subtopicId || null,
      created: {},
      reused: {},
    };

    // 1. Category
    if (row.Category || row.category) {
      const categoryName = (row.Category || row.category).toString().trim();
      const { category, created, reused } = await this.findOrCreateCategory({
        name: categoryName,
        userId,
        description: row.CategoryDescription || row.categoryDescription,
        color: row.CategoryColor || row.categoryColor,
        icon: row.CategoryIcon || row.categoryIcon,
      });
      results.categoryId = category.id;
      results.created.category = created;
      results.reused.category = reused;
    }

    // 2. Goal
    if (row.Goal || row.goal) {
      const goalTitle = (row.Goal || row.goal).toString().trim();
      const { goal, created, reused } = await this.findOrCreateGoal({
        title: goalTitle,
        categoryId: results.categoryId,
        userId,
        description: row.GoalDescription || row.goalDescription,
        targetDate: row.GoalTargetDate || row.goalTargetDate || new Date().toISOString().split('T')[0],
        progress: row.GoalProgress || row.goalProgress || 0,
        status: row.GoalStatus || row.goalStatus,
      });
      results.goalId = goal.id;
      results.created.goal = created;
      results.reused.goal = reused;
    }

    // 3. Plan
    if (row.Plan || row.plan) {
      const planTitle = (row.Plan || row.plan).toString().trim();
      const { plan, created, reused } = await this.findOrCreatePlan({
        title: planTitle,
        goalId: results.goalId,
        categoryId: results.categoryId,
        userId,
        description: row.PlanDescription || row.planDescription,
        startDate: row.PlanStartDate || row.planStartDate,
        endDate: row.PlanEndDate || row.planEndDate,
        status: row.PlanStatus || row.planStatus,
      });
      results.planId = plan.id;
      results.created.plan = created;
      results.reused.plan = reused;
    }

    // 4. Section
    if (row.Section || row.section) {
      const sectionTitle = (row.Section || row.section).toString().trim();
      const { section, created, reused } = await this.findOrCreateSection({
        title: sectionTitle,
        planId: results.planId,
        userId,
        description: row.SectionDescription || row.sectionDescription,
        orderIndex: row.SectionOrder || row.sectionOrder || 0,
      });
      results.sectionId = section.id;
      results.created.section = created;
      results.reused.section = reused;
    }

    // 5. Subsection
    if (row.Subsection || row.subsection) {
      const subsectionTitle = (row.Subsection || row.subsection).toString().trim();
      const { subsection, created, reused } = await this.findOrCreateSubsection({
        title: subsectionTitle,
        sectionId: results.sectionId,
        userId,
        description: row.SubsectionDescription || row.subsectionDescription,
        orderIndex: row.SubsectionOrder || row.subsectionOrder || 0,
      });
      results.subsectionId = subsection.id;
      results.created.subsection = created;
      results.reused.subsection = reused;
    }

    // 6. Topic
    if (row.Topic || row.topic) {
      const topicTitle = (row.Topic || row.topic).toString().trim();
      const { topic, created, reused } = await this.findOrCreateTopic({
        title: topicTitle,
        subsectionId: results.subsectionId,
        userId,
        description: row.TopicDescription || row.topicDescription,
        orderIndex: row.TopicOrder || row.topicOrder || 0,
      });
      results.topicId = topic.id;
      results.created.topic = created;
      results.reused.topic = reused;
    }

    // 7. Subtopic
    if (row.Subtopic || row.subtopic) {
      const subtopicTitle = (row.Subtopic || row.subtopic).toString().trim();
      const { subtopic, created, reused } = await this.findOrCreateSubtopic({
        title: subtopicTitle,
        topicId: results.topicId,
        userId,
        description: row.SubtopicDescription || row.subtopicDescription,
        orderIndex: row.SubtopicOrder || row.subtopicOrder || 0,
      });
      results.subtopicId = subtopic.id;
      results.created.subtopic = created;
      results.reused.subtopic = reused;
    }

    return { results, errors };
  }

  /**
   * Validate that required hierarchy fields exist
   * @param {Object} row - Excel row
   * @returns {Object} Validation result
   */
  validateHierarchyRow(row) {
    const errors = [];
    const warnings = [];

    // Lesson Title is required for lesson creation
    if (!(row['Lesson Title'] || row.lessonTitle || row['Lesson'] || row.lesson)) {
      errors.push('Lesson Title is required');
    }

    // Lesson Order should be a positive number
    const order = row['Lesson Order'] || row.lessonOrder || row.Order || row.order;
    if (order !== undefined && order !== '') {
      const numOrder = Number(order);
      if (isNaN(numOrder) || numOrder < 1) {
        errors.push(`Lesson Order must be a positive number, got: ${order}`);
      }
    }

    // Check for required parent hierarchy
    if (row.Subtopic || row.subtopic) {
      if (!(row.Topic || row.topic)) {
        errors.push('Subtopic requires a Topic');
      }
    }
    if (row.Topic || row.topic) {
      if (!(row.Subsection || row.subsection)) {
        warnings.push('Topic without Subsection will be created at root level');
      }
    }
    if (row.Subsection || row.subsection) {
      if (!(row.Section || row.section)) {
        warnings.push('Subsection without Section will be created at root level');
      }
    }
    if (row.Section || row.section) {
      if (!(row.Plan || row.plan)) {
        errors.push('Section requires a Plan');
      }
    }
    if (row.Plan || row.plan) {
      if (!(row.Goal || row.goal) && !(row.Category || row.category)) {
        warnings.push('Plan without Goal or Category');
      }
    }

    return { valid: errors.length === 0, errors, warnings };
  }
}

module.exports = CurriculumHierarchyService;