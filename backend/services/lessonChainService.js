const { Op, Sequelize } = require('sequelize');

/**
 * Lesson Chain Service
 * Handles automatic chain building from lessonOrder
 * Ensures nextLessonId is always in sync with lessonOrder
 */
class LessonChainService {
  constructor(models) {
    this.models = models;
  }

  /**
   * Get the chain scope for a lesson (what defines the boundary of the chain)
   * Lessons in the same subtopic belong to the same chain
   * @param {Object} lesson - KnowledgeItem instance
   * @returns {Object} Scope criteria
   */
  getChainScope(lesson) {
    return {
      subtopicId: lesson.subtopicId,
      type: 'lesson',
      userId: lesson.userId,
    };
  }

  /**
   * Find all lessons in a chain scope
   * @param {Object} scope - { subtopicId, userId }
   * @returns {Array} Sorted lessons
   */
  async findLessonsInScope(scope) {
    const where = {
      type: 'lesson',
      subtopicId: scope.subtopicId,
    };

    if (scope.userId) {
      where[Op.or] = [{ userId: scope.userId }, { userId: null }];
    }

    const lessons = await this.models.KnowledgeItem.findAll({
      where,
      order: [
        ['lessonOrder', 'ASC'],
        ['createdAt', 'ASC'],
      ],
    });

    return lessons;
  }

  /**
   * Rebuild the lesson chain for a given scope
   * Sets nextLessonId sequentially based on lessonOrder
   * @param {Object} scope - { subtopicId, userId }
   * @param {Object} transaction - Sequelize transaction (optional)
   * @returns {Object} Result with chain info
   */
  async rebuildChain(scope, transaction = null) {
    const lessons = await this.findLessonsInScope(scope);

    if (lessons.length === 0) {
      return { success: true, chain: [], message: 'No lessons in scope' };
    }

    // Validate lesson orders
    const orders = lessons.map(l => l.lessonOrder);
    const uniqueOrders = new Set(orders);
    if (uniqueOrders.size !== orders.length) {
      // Duplicate orders - need to renumber
      await this.renumberLessonOrders(lessons, transaction);
      // Re-fetch after renumbering
      const updatedLessons = await this.findLessonsInScope(scope);
      return this.setNextLessonIds(updatedLessons, transaction);
    }

    return this.setNextLessonIds(lessons, transaction);
  }

  /**
   * Set nextLessonId for all lessons in sequence
   * @param {Array} lessons - Sorted lessons
   * @param {Object} transaction - Sequelize transaction
   * @returns {Object} Result
   */
  async setNextLessonIds(lessons, transaction = null) {
    const chain = [];

    for (let i = 0; i < lessons.length; i++) {
      const current = lessons[i];
      const next = lessons[i + 1];
      const nextLessonId = next ? next.id : null;

      chain.push({
        id: current.id,
        title: current.title,
        lessonOrder: current.lessonOrder,
        nextLessonId,
      });

      if (current.nextLessonId !== nextLessonId) {
        await current.update({ nextLessonId }, { transaction });
      }
    }

    return {
      success: true,
      chain,
      count: lessons.length,
      message: `Chain rebuilt: ${lessons.length} lessons linked`,
    };
  }

  /**
   * Renumber lesson orders to be sequential (1, 2, 3, ...)
   * @param {Array} lessons - Lessons to renumber
   * @param {Object} transaction - Sequelize transaction
   */
  async renumberLessonOrders(lessons, transaction = null) {
    // Sort by current order, then by createdAt
    lessons.sort((a, b) => {
      if (a.lessonOrder !== b.lessonOrder) {
        return a.lessonOrder - b.lessonOrder;
      }
      return new Date(a.createdAt) - new Date(b.createdAt);
    });

    for (let i = 0; i < lessons.length; i++) {
      const newOrder = i + 1;
      if (lessons[i].lessonOrder !== newOrder) {
        await lessons[i].update({ lessonOrder: newOrder }, { transaction });
      }
    }
  }

  /**
   * Rebuild chain for a specific lesson's scope
   * @param {string} lessonId - Lesson ID
   * @param {Object} transaction - Sequelize transaction
   * @returns {Object} Result
   */
  async rebuildChainForLesson(lessonId, transaction = null) {
    const lesson = await this.models.KnowledgeItem.findByPk(lessonId, { transaction });
    if (!lesson) {
      throw new Error('Lesson not found');
    }

    if (lesson.type !== 'lesson') {
      return { success: true, message: 'Not a lesson, no chain to rebuild' };
    }

    const scope = this.getChainScope(lesson);
    return this.rebuildChain(scope, transaction);
  }

  /**
   * Handle lesson creation - add to chain
   * @param {Object} lesson - New lesson
   * @param {Object} transaction - Sequelize transaction
   * @returns {Object} Result
   */
  async onLessonCreated(lesson, transaction = null) {
    if (lesson.type !== 'lesson' || !lesson.subtopicId) {
      return { success: true, message: 'Not a plan-managed lesson' };
    }

    // Ensure lessonOrder is set
    if (!lesson.lessonOrder || lesson.lessonOrder < 1) {
      // Find max order in scope and add 1
      const scope = this.getChainScope(lesson);
      const lessons = await this.findLessonsInScope(scope);
      const maxOrder = Math.max(...lessons.map(l => l.lessonOrder), 0);
      await lesson.update({ lessonOrder: maxOrder + 1 }, { transaction });
    }

    // Rebuild chain
    const scope = this.getChainScope(lesson);
    return this.rebuildChain(scope, transaction);
  }

  /**
   * Handle lesson deletion - rebuild chain
   * @param {string} lessonId - Deleted lesson ID
   * @param {Object} scope - Chain scope (subtopicId, userId)
   * @param {Object} transaction - Sequelize transaction
   * @returns {Object} Result
   */
  async onLessonDeleted(lessonId, scope, transaction = null) {
    return this.rebuildChain(scope, transaction);
  }

  /**
   * Handle lesson order change - rebuild chain
   * @param {Object} lesson - Updated lesson
   * @param {Object} transaction - Sequelize transaction
   * @returns {Object} Result
   */
  async onLessonOrderChanged(lesson, transaction = null) {
    if (lesson.type !== 'lesson' || !lesson.subtopicId) {
      return { success: true, message: 'Not a plan-managed lesson' };
    }

    const scope = this.getChainScope(lesson);
    return this.rebuildChain(scope, transaction);
  }

  /**
   * Handle lesson move between subtopics
   * @param {Object} lesson - Moved lesson
   * @param {string} oldSubtopicId - Previous subtopic ID
   * @param {Object} transaction - Sequelize transaction
   * @returns {Object} Result
   */
  async onLessonMoved(lesson, oldSubtopicId, transaction = null) {
    if (lesson.type !== 'lesson') {
      return { success: true, message: 'Not a lesson' };
    }

    const results = {};

    // Rebuild old chain
    if (oldSubtopicId) {
      const oldScope = { subtopicId: oldSubtopicId, userId: lesson.userId };
      results.oldChain = await this.rebuildChain(oldScope, transaction);
    }

    // Rebuild new chain
    if (lesson.subtopicId) {
      const newScope = { subtopicId: lesson.subtopicId, userId: lesson.userId };
      results.newChain = await this.rebuildChain(newScope, transaction);
    }

    return { success: true, ...results };
  }

  /**
   * Get the chain starting lesson (lowest order)
   * @param {Object} scope - Chain scope
   * @returns {Object|null} First lesson
   */
  async getChainStart(scope) {
    const lessons = await this.findLessonsInScope(scope);
    return lessons[0] || null;
  }

  /**
   * Get the full chain as a linked list
   * @param {Object} scope - Chain scope
   * @returns {Array} Chain with nextLessonId populated
   */
  async getFullChain(scope) {
    const lessons = await this.findLessonsInScope(scope);
    return lessons.map((lesson, idx) => ({
      ...lesson.toJSON(),
      nextLesson: lessons[idx + 1] || null,
      position: idx + 1,
      total: lessons.length,
    }));
  }

  /**
   * Validate chain integrity
   * @param {Object} scope - Chain scope
   * @returns {Object} Validation result
   */
  async validateChain(scope) {
    const lessons = await this.findLessonsInScope(scope);
    const issues = [];

    if (lessons.length === 0) {
      return { valid: true, issues: [] };
    }

    // Check for self-references
    for (const lesson of lessons) {
      if (lesson.nextLessonId === lesson.id) {
        issues.push({
          type: 'self_reference',
          lessonId: lesson.id,
          message: `Lesson ${lesson.title} references itself`,
        });
      }
    }

    // Check for circular references
    const visited = new Set();
    for (const lesson of lessons) {
      if (visited.has(lesson.id)) continue;

      const path = new Set();
      let current = lesson;
      while (current && current.nextLessonId) {
        if (path.has(current.id)) {
          issues.push({
            type: 'circular_reference',
            lessonId: current.id,
            message: `Circular reference detected starting at ${current.title}`,
          });
          break;
        }
        path.add(current.id);
        current = lessons.find(l => l.id === current.nextLessonId);
      }
      path.forEach(id => visited.add(id));
    }

    // Check for deleted references
    for (const lesson of lessons) {
      if (lesson.nextLessonId) {
        const next = lessons.find(l => l.id === lesson.nextLessonId);
        if (!next) {
          issues.push({
            type: 'deleted_reference',
            lessonId: lesson.id,
            message: `Lesson ${lesson.title} references deleted lesson ${lesson.nextLessonId}`,
          });
        }
      }
    }

    // Check order matches chain
    for (let i = 0; i < lessons.length - 1; i++) {
      if (lessons[i].nextLessonId !== lessons[i + 1].id) {
        issues.push({
          type: 'order_mismatch',
          lessonId: lessons[i].id,
          message: `Lesson ${lessons[i].title} nextLessonId doesn't match order`,
        });
      }
    }

    // Check last lesson has null nextLessonId
    if (lessons.length > 0 && lessons[lessons.length - 1].nextLessonId !== null) {
      issues.push({
        type: 'terminal_not_null',
        lessonId: lessons[lessons.length - 1].id,
        message: `Last lesson ${lessons[lessons.length - 1].title} should have null nextLessonId`,
      });
    }

    return {
      valid: issues.length === 0,
      issues,
      lessonCount: lessons.length,
    };
  }

  /**
   * Repair chain by rebuilding it
   * @param {Object} scope - Chain scope
   * @param {Object} transaction - Sequelize transaction
   * @returns {Object} Result
   */
  async repairChain(scope, transaction = null) {
    return this.rebuildChain(scope, transaction);
  }
}

module.exports = LessonChainService;