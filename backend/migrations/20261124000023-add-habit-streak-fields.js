'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    // Add streak fields to habits table
    await queryInterface.addColumn('habits', 'streakCurrent', {
      type: Sequelize.INTEGER,
      defaultValue: 0,
      allowNull: false,
    });

    await queryInterface.addColumn('habits', 'streakLongest', {
      type: Sequelize.INTEGER,
      defaultValue: 0,
      allowNull: false,
    });

    await queryInterface.addColumn('habits', 'lastCompletedDate', {
      type: Sequelize.STRING,
      allowNull: true,
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn('habits', 'streakCurrent');
    await queryInterface.removeColumn('habits', 'streakLongest');
    await queryInterface.removeColumn('habits', 'lastCompletedDate');
  },
};