const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const HabitLog = sequelize.define(
    'HabitLog',
    {
      id: {
        type: DataTypes.STRING,
        primaryKey: true,
        defaultValue: DataTypes.UUIDV4,
      },
      habitId: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      date: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      completed: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
      },
      completedAt: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      notes: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      userId: {
        type: DataTypes.UUID,
        allowNull: true,
      },
    },
    {
      tableName: 'habit_logs',
      timestamps: true,
      indexes: [
        {
          unique: true,
          fields: ['habitId', 'date'],
          name: 'habit_logs_habit_date_unique',
        },
      ],
    }
  );

  HabitLog.associate = (models) => {
    if (models.Habit) {
      HabitLog.belongsTo(models.Habit, {
        foreignKey: 'habitId',
        as: 'habit',
      });
    }
    if (models.User) {
      HabitLog.belongsTo(models.User, { foreignKey: 'userId', as: 'user' });
    }
  };

  return HabitLog;
};
