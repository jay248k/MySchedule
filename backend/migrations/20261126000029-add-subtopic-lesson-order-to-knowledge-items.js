'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const table = await queryInterface.describeTable('knowledge_items');

    if (!table.subtopicId) {
      await queryInterface.addColumn('knowledge_items', 'subtopicId', {
        type: Sequelize.STRING,
        allowNull: true,
        references: {
          model: 'subtopics',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
      });
    }

    if (!table.lessonOrder) {
      await queryInterface.addColumn('knowledge_items', 'lessonOrder', {
        type: Sequelize.INTEGER,
        defaultValue: 0,
        allowNull: false,
      });
    }

    await queryInterface.addIndex('knowledge_items', ['subtopicId']);
    await queryInterface.addIndex('knowledge_items', ['lessonOrder']);
  },

  down: async (queryInterface) => {
    try {
      await queryInterface.removeColumn('knowledge_items', 'subtopicId');
      await queryInterface.removeColumn('knowledge_items', 'lessonOrder');
    } catch (e) {
      // columns may not exist
    }
  },
};