'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('screen_time_daily', {
      id: {
        type: Sequelize.STRING,
        primaryKey: true,
        allowNull: false,
      },
      date: {
        type: Sequelize.STRING, // 'YYYY-MM-DD'
        allowNull: false,
      },
      totalScreenTimeMinutes: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0,
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

    await queryInterface.addIndex('screen_time_daily', ['userId', 'date'], {
      unique: true,
      name: 'screen_time_daily_user_date_unique',
    });
    await queryInterface.addIndex('screen_time_daily', ['date']);
  },

  down: async (queryInterface) => {
    await queryInterface.dropTable('screen_time_daily');
  },
};
