'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('user_profiles', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false,
      },
      name: {
        type: Sequelize.STRING,
        defaultValue: 'Alex Morgan',
      },
      title: {
        type: Sequelize.STRING,
        defaultValue: 'Product Engineer',
      },
      email: {
        type: Sequelize.STRING,
        defaultValue: 'alex.morgan@myschedule.app',
      },
      avatarInitials: {
        type: Sequelize.STRING,
        defaultValue: 'AM',
      },
      avatarBg: {
        type: Sequelize.STRING,
        defaultValue: '#1769FF',
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
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('user_profiles');
  },
};
