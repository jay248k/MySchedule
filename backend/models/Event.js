const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Event = sequelize.define(
    'Event',
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
      location: {
        type: DataTypes.STRING,
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
      tableName: 'events',
      timestamps: true,
    }
  );

  Event.associate = (models) => {
    Event.belongsTo(models.Category, {
      foreignKey: 'categoryId',
      as: 'category',
    });
    Event.belongsTo(models.User, {
      foreignKey: 'userId',
      as: 'user',
    });
  };

  return Event;
};
