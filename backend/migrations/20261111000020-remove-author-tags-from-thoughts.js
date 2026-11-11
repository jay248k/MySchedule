'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const table = await queryInterface.describeTable('thoughts');

    if (table.author) {
      await queryInterface.removeColumn('thoughts', 'author');
    }

    if (table.tags) {
      await queryInterface.removeColumn('thoughts', 'tags');
    }
  },

  down: async (queryInterface, Sequelize) => {
    const table = await queryInterface.describeTable('thoughts');

    if (!table.author) {
      await queryInterface.addColumn('thoughts', 'author', {
        type: Sequelize.STRING,
        allowNull: true,
        defaultValue: 'Unknown',
      });
    }

    if (!table.tags) {
      await queryInterface.addColumn('thoughts', 'tags', {
        type: Sequelize.STRING,
        allowNull: true,
      });
    }
  },
};

