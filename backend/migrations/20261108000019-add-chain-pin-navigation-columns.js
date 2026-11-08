'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // 1. Add pinning and chain columns to knowledge_items
    const knowledgeTable = await queryInterface.describeTable('knowledge_items');
    if (!knowledgeTable.isPinned) {
      await queryInterface.addColumn('knowledge_items', 'isPinned', {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
      });
    }
    if (!knowledgeTable.nextLessonId) {
      await queryInterface.addColumn('knowledge_items', 'nextLessonId', {
        type: Sequelize.STRING,
        allowNull: true,
      });
    }
    if (!knowledgeTable.linkedLessonIds) {
      await queryInterface.addColumn('knowledge_items', 'linkedLessonIds', {
        type: Sequelize.TEXT,
        allowNull: true,
      });
    }

    // 2. Add isPinned to thoughts
    const thoughtsTable = await queryInterface.describeTable('thoughts');
    if (!thoughtsTable.isPinned) {
      await queryInterface.addColumn('thoughts', 'isPinned', {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
      });
    }

    // 3. Add navigationOrder to settings
    const settingsTable = await queryInterface.describeTable('settings');
    if (!settingsTable.navigationOrder) {
      await queryInterface.addColumn('settings', 'navigationOrder', {
        type: Sequelize.TEXT,
        allowNull: true,
      });
    }
  },

  down: async (queryInterface) => {
    try {
      await queryInterface.removeColumn('knowledge_items', 'isPinned');
      await queryInterface.removeColumn('knowledge_items', 'nextLessonId');
      await queryInterface.removeColumn('knowledge_items', 'linkedLessonIds');
      await queryInterface.removeColumn('thoughts', 'isPinned');
      await queryInterface.removeColumn('settings', 'navigationOrder');
    } catch {}
  },
};
