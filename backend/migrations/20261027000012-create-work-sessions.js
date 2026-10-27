'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('work_sessions', {
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
        allowNull: true,
      },
      durationSeconds: {
        type: Sequelize.INTEGER,
        defaultValue: 0,
      },
      stopReason: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      notes: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      taskId: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      taskTitle: {
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

    await queryInterface.addIndex('work_sessions', ['date']);
    await queryInterface.addIndex('work_sessions', ['userId']);
  },

  down: async (queryInterface) => {
    await queryInterface.dropTable('work_sessions');
  },
};
