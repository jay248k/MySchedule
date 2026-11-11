'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const settingsTable = await queryInterface.describeTable('settings');
    if (!settingsTable.hiddenNavigationItems) {
      await queryInterface.addColumn('settings', 'hiddenNavigationItems', {
        type: Sequelize.TEXT,
        allowNull: true,
        defaultValue: '[]',
      });
    }
  },

  down: async (queryInterface) => {
    try {
      const settingsTable = await queryInterface.describeTable('settings');
      if (settingsTable.hiddenNavigationItems) {
        await queryInterface.removeColumn('settings', 'hiddenNavigationItems');
      }
    } catch (err) {
      console.warn('Error removing hiddenNavigationItems:', err);
    }
  },
};
