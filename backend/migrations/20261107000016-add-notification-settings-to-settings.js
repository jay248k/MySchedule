'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const tableInfo = await queryInterface.describeTable('settings');
    if (!tableInfo.notificationSettings) {
      await queryInterface.addColumn('settings', 'notificationSettings', {
        type: Sequelize.TEXT,
        allowNull: true,
      });
    }
  },

  down: async (queryInterface) => {
    const tableInfo = await queryInterface.describeTable('settings');
    if (tableInfo.notificationSettings) {
      await queryInterface.removeColumn('settings', 'notificationSettings');
    }
  },
};
