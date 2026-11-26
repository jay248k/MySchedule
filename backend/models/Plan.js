const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Plan = sequelize.define(
    'Plan',
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
      categoryId: {
        type: DataTypes.STRING,
        allowNull: true,
        references: {
          model: 'categories',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
      },
      goalId: {
        type: DataTypes.STRING,
        allowNull: true,
        references: {
          model: 'goals',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
      },
      startDate: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      endDate: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      status: {
        type: DataTypes.STRING,
        defaultValue: 'in-progress',
        validate: {
          isIn: [['in-progress', 'completed', 'archived', 'draft']],
        },
      },
      progress: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
        validate: {
          min: 0,
          max: 100,
        },
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
      tableName: 'plans',
      timestamps: true,
      indexes: [
        { fields: ['categoryId'] },
        { fields: ['goalId'] },
        { fields: ['userId'] },
        { fields: ['status'] },
      ],
    }
  );

  Plan.associate = (models) => {
    if (models.Category) {
      Plan.belongsTo(models.Category, { foreignKey: 'categoryId', as: 'category' });
    }
    if (models.Goal) {
      Plan.belongsTo(models.Goal, { foreignKey: 'goalId', as: 'goal' });
    }
    if (models.User) {
      Plan.belongsTo(models.User, { foreignKey: 'userId', as: 'user' });
    }
    if (models.Section) {
      Plan.hasMany(models.Section, { foreignKey: 'planId', as: 'sections', onDelete: 'CASCADE' });
    }
  };

  return Plan;
};