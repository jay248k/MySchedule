const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const ScreenTimeLog = sequelize.define(
    'ScreenTimeLog',
    {
      id: {
        type: DataTypes.STRING,
        primaryKey: true,
        defaultValue: DataTypes.UUIDV4,
      },
      date: {
        type: DataTypes.STRING, // 'YYYY-MM-DD'
        allowNull: false,
      },
      appName: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      screenTimeLimitId: {
        type: DataTypes.STRING,
        allowNull: true,
        references: {
          model: 'screen_time_limits',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
      },
      spentMinutes: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
      },
      targetLimitMinutes: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      exceededMinutes: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
      },
      isExceeded: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
      },
      notes: {
        type: DataTypes.TEXT,
        allowNull: true,
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
      tableName: 'screen_time_logs',
      timestamps: true,
      indexes: [
        {
          unique: true,
          fields: ['userId', 'date', 'appName'],
          name: 'screen_time_logs_user_date_app_unique',
        },
      ],
    }
  );

  ScreenTimeLog.associate = (models) => {
    ScreenTimeLog.belongsTo(models.User, {
      foreignKey: 'userId',
      as: 'user',
    });
    if (models.ScreenTimeLimit) {
      ScreenTimeLog.belongsTo(models.ScreenTimeLimit, {
        foreignKey: 'screenTimeLimitId',
        as: 'limit',
      });
    }
  };

  return ScreenTimeLog;
};
