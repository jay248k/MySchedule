'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('settings', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false,
      },
      theme: {
        type: Sequelize.STRING,
        defaultValue: 'light',
      },
      accentColor: {
        type: Sequelize.STRING,
        defaultValue: '#1769FF',
      },
      weekStartsOnSunday: {
        type: Sequelize.BOOLEAN,
        defaultValue: true,
      },
      defaultCalendarView: {
        type: Sequelize.STRING,
        defaultValue: 'month',
      },
      timeFormat: {
        type: Sequelize.STRING,
        defaultValue: '12h',
      },
      layoutComfort: {
        type: Sequelize.STRING,
        defaultValue: 'comfortable',
      },
      enableInAppNotifications: {
        type: Sequelize.BOOLEAN,
        defaultValue: true,
      },
      soundEffects: {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE,
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE,
      },
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('settings');
  },
};
