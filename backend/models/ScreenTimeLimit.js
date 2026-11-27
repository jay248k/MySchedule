const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const ScreenTimeLimit = sequelize.define(
    'ScreenTimeLimit',
    {
      id: {
        type: DataTypes.STRING,
        primaryKey: true,
        defaultValue: DataTypes.UUIDV4,
      },
      appName: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      category: {
        type: DataTypes.STRING,
        defaultValue: 'Social Media',
      },
      dailyLimitMinutes: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 30,
      },
      icon: {
        type: DataTypes.STRING,
        defaultValue: 'smartphone',
      },
      color: {
        type: DataTypes.STRING,
        defaultValue: '#E1306C',
      },
      isActive: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
      },
      userId: {
        type: DataTypes.UUID,
        allowNull: true,
        references: {
          model: 'users',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
      },
    },
    {
      tableName: 'screen_time_limits',
      timestamps: true,
    }
  );

  ScreenTimeLimit.associate = (models) => {
    ScreenTimeLimit.belongsTo(models.User, {
      foreignKey: 'userId',
      as: 'user',
    });
    if (models.ScreenTimeLog) {
      ScreenTimeLimit.hasMany(models.ScreenTimeLog, {
        foreignKey: 'screenTimeLimitId',
        as: 'logs',
        onDelete: 'SET NULL',
      });
    }
  };

  return ScreenTimeLimit;
};
