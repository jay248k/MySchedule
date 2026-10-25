'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('daily_reports', {
      id: {
        type: Sequelize.STRING,
        primaryKey: true,
        allowNull: false,
      },
      date: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      title: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      accomplishments: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      highlights: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      blockers: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      tomorrowPlan: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      hoursLogged: {
        type: Sequelize.FLOAT,
        defaultValue: 0,
      },
      rating: {
        type: Sequelize.INTEGER,
        defaultValue: 5,
      },
      mood: {
        type: Sequelize.STRING,
        defaultValue: 'productive',
      },
      tasksCompletedCount: {
        type: Sequelize.INTEGER,
        defaultValue: 0,
      },
      tasksTotalCount: {
        type: Sequelize.INTEGER,
        defaultValue: 0,
      },
      submittedAt: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.NOW,
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
    await queryInterface.dropTable('daily_reports');
  },
};
