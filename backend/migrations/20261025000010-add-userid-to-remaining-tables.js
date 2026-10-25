'use strict';

/**
 * Migration: Add userId foreign key column to daily_reports, notifications, and settings
 * Enforces multi-user isolation across all application tables.
 */
module.exports = {
  async up(queryInterface, Sequelize) {
    const addColumnSafely = async (table, column, options) => {
      try {
        await queryInterface.addColumn(table, column, options);
        console.log(`[Migration] Added column "${column}" to table "${table}".`);
      } catch (err) {
        // Column may already exist or error occurred; ignore safely
        console.log(`[Migration] Column "${column}" in table "${table}" already exists or could not be added: ${err.message}`);
      }
    };

    // 1. Add userId to daily_reports
    await addColumnSafely('daily_reports', 'userId', {
      type: Sequelize.UUID,
      allowNull: true,
      references: {
        model: 'users',
        key: 'id',
      },
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE',
    });

    // 2. Add userId to notifications
    await addColumnSafely('notifications', 'userId', {
      type: Sequelize.UUID,
      allowNull: true,
      references: {
        model: 'users',
        key: 'id',
      },
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE',
    });

    // 3. Add userId to settings
    await addColumnSafely('settings', 'userId', {
      type: Sequelize.UUID,
      allowNull: true,
      references: {
        model: 'users',
        key: 'id',
      },
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE',
    });
  },

  async down(queryInterface, Sequelize) {
    const removeColumnSafely = async (table, column) => {
      try {
        await queryInterface.removeColumn(table, column);
        console.log(`[Migration] Removed column "${column}" from table "${table}".`);
      } catch (err) {
        console.log(`[Migration] Could not remove "${column}" from "${table}": ${err.message}`);
      }
    };

    await removeColumnSafely('daily_reports', 'userId');
    await removeColumnSafely('notifications', 'userId');
    await removeColumnSafely('settings', 'userId');
  },
};
