'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    // 1. Create users table without any default values
    await queryInterface.createTable('users', {
      id: {
        type: Sequelize.UUID,
        primaryKey: true,
        allowNull: false,
      },
      name: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      email: {
        type: Sequelize.STRING,
        allowNull: false,
        unique: true,
      },
      password: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      title: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      avatarInitials: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      avatarBg: {
        type: Sequelize.STRING,
        allowNull: true,
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

    // 2. Add userId columns to existing tables if not existing
    const addColumnSafely = async (table, column, options) => {
      try {
        await queryInterface.addColumn(table, column, options);
      } catch (err) {
        // column may already exist, ignore error
      }
    };

    await addColumnSafely('tasks', 'userId', {
      type: Sequelize.UUID,
      allowNull: true,
      references: { model: 'users', key: 'id' },
      onDelete: 'SET NULL',
    });

    await addColumnSafely('events', 'userId', {
      type: Sequelize.UUID,
      allowNull: true,
      references: { model: 'users', key: 'id' },
      onDelete: 'SET NULL',
    });

    await addColumnSafely('goals', 'userId', {
      type: Sequelize.UUID,
      allowNull: true,
      references: { model: 'users', key: 'id' },
      onDelete: 'SET NULL',
    });

    await addColumnSafely('categories', 'userId', {
      type: Sequelize.UUID,
      allowNull: true,
      references: { model: 'users', key: 'id' },
      onDelete: 'SET NULL',
    });
  },

  async down(queryInterface, Sequelize) {
    const removeColumnSafely = async (table, column) => {
      try {
        await queryInterface.removeColumn(table, column);
      } catch (err) {
        // ignore
      }
    };

    await removeColumnSafely('tasks', 'userId');
    await removeColumnSafely('events', 'userId');
    await removeColumnSafely('goals', 'userId');
    await removeColumnSafely('categories', 'userId');
    await queryInterface.dropTable('users');
  },
};
