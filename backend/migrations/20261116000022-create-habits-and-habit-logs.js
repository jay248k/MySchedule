'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // 1. Create habits table
    await queryInterface.createTable('habits', {
      id: {
        type: Sequelize.STRING,
        primaryKey: true,
        defaultValue: Sequelize.UUIDV4,
      },
      name: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      description: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      targetTime: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      category: {
        type: Sequelize.STRING,
        defaultValue: 'Discipline',
      },
      color: {
        type: Sequelize.STRING,
        defaultValue: '#10B981',
      },
      icon: {
        type: Sequelize.STRING,
        defaultValue: 'flame',
      },
      frequency: {
        type: Sequelize.STRING,
        defaultValue: 'daily',
      },
      isArchived: {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
      },
      userId: {
        type: Sequelize.UUID,
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

    // 2. Create habit_logs table
    await queryInterface.createTable('habit_logs', {
      id: {
        type: Sequelize.STRING,
        primaryKey: true,
        defaultValue: Sequelize.UUIDV4,
      },
      habitId: {
        type: Sequelize.STRING,
        allowNull: false,
        references: {
          model: 'habits',
          key: 'id',
        },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE',
      },
      date: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      completed: {
        type: Sequelize.BOOLEAN,
        defaultValue: true,
      },
      completedAt: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      notes: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      userId: {
        type: Sequelize.UUID,
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

    // 3. Add composite unique index on [habitId, date]
    await queryInterface.addIndex('habit_logs', ['habitId', 'date'], {
      unique: true,
      name: 'habit_logs_habit_date_unique',
    });
  },

  down: async (queryInterface) => {
    await queryInterface.dropTable('habit_logs');
    await queryInterface.dropTable('habits');
  },
};
