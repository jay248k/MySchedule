const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const UserProfile = sequelize.define(
    'UserProfile',
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      name: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      title: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      email: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      avatarInitials: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      avatarBg: {
        type: DataTypes.STRING,
        allowNull: true,
      },
    },
    {
      tableName: 'user_profiles',
      timestamps: true,
    }
  );

  return UserProfile;
};
