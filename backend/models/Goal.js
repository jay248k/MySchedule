const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Goal = sequelize.define(
    'Goal',
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
      targetDate: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      progress: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
        validate: {
          min: 0,
          max: 100,
        },
      },
      status: {
        type: DataTypes.STRING,
        defaultValue: 'in-progress',
        validate: {
          isIn: [['in-progress', 'completed', 'behind']],
        },
      },
      category: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      relatedTaskIds: {
        type: DataTypes.JSON,
        defaultValue: [],
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
      tableName: 'goals',
      timestamps: true,
    }
  );

  Goal.associate = (models) => {
    Goal.hasMany(models.Task, {
      foreignKey: 'goalId',
      as: 'tasks',
      onDelete: 'SET NULL',
    });
    Goal.belongsTo(models.User, {
      foreignKey: 'userId',
      as: 'user',
    });
  };

  return Goal;
};
