const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Category = sequelize.define(
    'Category',
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
      color: {
        type: DataTypes.STRING,
        defaultValue: '#1769FF',
      },
      icon: {
        type: DataTypes.STRING,
        defaultValue: 'Tag',
      },
      description: {
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
      },
    },
    {
      tableName: 'categories',
      timestamps: true,
    }
  );

  Category.associate = (models) => {
    Category.hasMany(models.Task, {
      foreignKey: 'categoryId',
      as: 'tasks',
      onDelete: 'SET NULL',
    });
    Category.hasMany(models.Event, {
      foreignKey: 'categoryId',
      as: 'events',
      onDelete: 'SET NULL',
    });
    Category.belongsTo(models.User, {
      foreignKey: 'userId',
      as: 'user',
    });
  };

  return Category;
};
