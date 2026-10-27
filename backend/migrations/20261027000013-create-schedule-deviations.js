'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('schedule_deviations', {
      id: {
        type: Sequelize.STRING,
        primaryKey: true,
        allowNull: false,
      },
      date: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      startTime: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      endTime: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      durationMinutes: {
        type: Sequelize.INTEGER,
        defaultValue: 60,
      },
      plannedAction: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      actualAction: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      reasonCategory: {
        type: Sequelize.STRING,
        defaultValue: 'Distraction',
      },
      rootCause: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      lessonLearned: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      deviationType: {
        type: Sequelize.STRING,
        defaultValue: 'unproductive',
      },
      taskId: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      userId: {
        type: Sequelize.UUID,
        allowNull: true,
        references: {
          model: 'users',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
    });

    await queryInterface.addIndex('schedule_deviations', ['date']);
    await queryInterface.addIndex('schedule_deviations', ['userId']);
  },

  down: async (queryInterface) => {
    await queryInterface.dropTable('schedule_deviations');
  },
};
