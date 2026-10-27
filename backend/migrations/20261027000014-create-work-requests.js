'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('work_requests', {
      id: {
        type: Sequelize.STRING,
        primaryKey: true,
        allowNull: false,
      },
      title: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      date: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      startTime: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      endTime: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      reason: {
        type: Sequelize.TEXT,
        allowNull: false,
      },
      status: {
        type: Sequelize.STRING,
        defaultValue: 'pending',
      },
      actionRemarks: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      rescheduledDate: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      rescheduledStartTime: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      rescheduledEndTime: {
        type: Sequelize.STRING,
        allowNull: true,
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

    await queryInterface.addIndex('work_requests', ['date']);
    await queryInterface.addIndex('work_requests', ['status']);
    await queryInterface.addIndex('work_requests', ['userId']);
  },

  down: async (queryInterface) => {
    await queryInterface.dropTable('work_requests');
  },
};
