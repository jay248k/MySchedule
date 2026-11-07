'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('active_work_sessions', {
      id: {
        type: Sequelize.STRING,
        primaryKey: true,
        allowNull: false,
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
      isRunning: {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
      },
      startTimestamp: {
        type: Sequelize.BIGINT,
        allowNull: true,
      },
      startTime: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      date: {
        type: Sequelize.STRING,
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
      baseAccumulatedSeconds: {
        type: Sequelize.INTEGER,
        defaultValue: 0,
      },
      status: {
        type: Sequelize.STRING,
        defaultValue: 'idle',
      },
      lastPausedTimestamp: {
        type: Sequelize.BIGINT,
        allowNull: true,
      },
      lastPauseReason: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      lastPauseRemarks: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
      updatedAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
    });

    await queryInterface.addIndex('active_work_sessions', ['userId']);
  },

  down: async (queryInterface) => {
    await queryInterface.dropTable('active_work_sessions');
  },
};

