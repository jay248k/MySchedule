'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // 1. Create screen_time_limits table (App names and their targeted limits)
    await queryInterface.createTable('screen_time_limits', {
      id: {
        type: Sequelize.STRING,
        primaryKey: true,
        allowNull: false,
      },
      appName: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      category: {
        type: Sequelize.STRING,
        defaultValue: 'Social Media',
      },
      dailyLimitMinutes: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 30,
      },
      icon: {
        type: Sequelize.STRING,
        defaultValue: 'smartphone',
      },
      color: {
        type: Sequelize.STRING,
        defaultValue: '#E1306C',
      },
      isActive: {
        type: Sequelize.BOOLEAN,
        defaultValue: true,
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

    await queryInterface.addIndex('screen_time_limits', ['userId']);
    await queryInterface.addIndex('screen_time_limits', ['appName']);

    // 2. Create screen_time_logs table (Daily mobile screen time entries with limit comparison)
    await queryInterface.createTable('screen_time_logs', {
      id: {
        type: Sequelize.STRING,
        primaryKey: true,
        allowNull: false,
      },
      date: {
        type: Sequelize.STRING, // 'YYYY-MM-DD'
        allowNull: false,
      },
      appName: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      screenTimeLimitId: {
        type: Sequelize.STRING,
        allowNull: true,
        references: {
          model: 'screen_time_limits',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
      },
      spentMinutes: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0,
      },
      targetLimitMinutes: {
        type: Sequelize.INTEGER,
        allowNull: true,
      },
      exceededMinutes: {
        type: Sequelize.INTEGER,
        defaultValue: 0,
      },
      isExceeded: {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
      },
      notes: {
        type: Sequelize.TEXT,
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

    await queryInterface.addIndex('screen_time_logs', ['userId', 'date']);
    await queryInterface.addIndex('screen_time_logs', ['date']);
    await queryInterface.addIndex('screen_time_logs', ['appName']);
    await queryInterface.addIndex('screen_time_logs', ['userId', 'date', 'appName'], {
      unique: true,
      name: 'screen_time_logs_user_date_app_unique',
    });
  },

  down: async (queryInterface) => {
    await queryInterface.dropTable('screen_time_logs');
    await queryInterface.dropTable('screen_time_limits');
  },
};
