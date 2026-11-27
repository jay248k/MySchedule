const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const DailyScreenTime = sequelize.define(
    'DailyScreenTime',
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
      totalMinutes: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
      },
      targetLimitMinutes: {
        type: DataTypes.INTEGER,
        allowNull: true,
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
      tableName: 'daily_screen_times',
      timestamps: true,
    }
  );

  DailyScreenTime.associate = (models) => {
    DailyScreenTime.belongsTo(models.User, {
      foreignKey: 'userId',
      as: 'user',
    });
    if (models.ScreenTimeLog) {
      DailyScreenTime.hasMany(models.ScreenTimeLog, {
        foreignKey: 'dailyScreenTimeId',
        as: 'apps',
        onDelete: 'CASCADE',
      });
    }
  };

  return DailyScreenTime;
};
