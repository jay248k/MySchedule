const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Task = sequelize.define(
    'Task',
    {
      id: {
        type: DataTypes.STRING,
        primaryKey: true,
        defaultValue: DataTypes.UUIDV4,
      },
      title: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      description: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      date: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      startTime: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      endTime: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      categoryId: {
        type: DataTypes.STRING,
        allowNull: true,
        references: {
          model: 'categories',
          key: 'id',
        },
      },
      priority: {
        type: DataTypes.STRING,
        defaultValue: 'Medium',
        validate: {
          isIn: [['High', 'Medium', 'Low']],
        },
      },
      goalId: {
        type: DataTypes.STRING,
        allowNull: true,
        references: {
          model: 'goals',
          key: 'id',
        },
      },
      status: {
        type: DataTypes.STRING,
        defaultValue: 'pending',
        validate: {
          isIn: [['pending', 'in-progress', 'completed', 'overdue']],
        },
      },
      userId: {
        type: DataTypes.UUID,
        allowNull: true,
        references: {
          model: 'users',
          key: 'id',
        },
      },
    },
    {
      tableName: 'tasks',
      timestamps: true,
    }
  );

  Task.associate = (models) => {
    Task.belongsTo(models.Category, {
      foreignKey: 'categoryId',
      as: 'category',
    });
    Task.belongsTo(models.Goal, {
      foreignKey: 'goalId',
      as: 'goal',
    });
    Task.belongsTo(models.User, {
      foreignKey: 'userId',
      as: 'user',
    });
  };

  return Task;
};
