const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Habit = sequelize.define(
    'Habit',
    {
      id: {
        type: DataTypes.STRING,
        primaryKey: true,
        defaultValue: DataTypes.UUIDV4,
      },
      name: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      description: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      targetTime: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      category: {
        type: DataTypes.STRING,
        defaultValue: 'Discipline',
      },
      color: {
        type: DataTypes.STRING,
        defaultValue: '#10B981',
      },
      icon: {
        type: DataTypes.STRING,
        defaultValue: 'flame',
      },
      frequency: {
        type: DataTypes.STRING,
        defaultValue: 'daily',
      },
      isArchived: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
      },
      // Cached streak fields for O(1) retrieval
      streakCurrent: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
      },
      streakLongest: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
      },
      lastCompletedDate: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      userId: {
        type: DataTypes.UUID,
        allowNull: true,
      },
    },
    {
      tableName: 'habits',
      timestamps: true,
    }
  );

  Habit.associate = (models) => {
    if (models.HabitLog) {
      Habit.hasMany(models.HabitLog, {
        foreignKey: 'habitId',
        as: 'logs',
        onDelete: 'CASCADE',
      });
    }
    if (models.User) {
      Habit.belongsTo(models.User, { foreignKey: 'userId', as: 'user' });
    }
  };

  return Habit;
};

