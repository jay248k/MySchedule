const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Thought = sequelize.define(
    'Thought',
    {
      id: {
        type: DataTypes.STRING,
        primaryKey: true,
        defaultValue: DataTypes.UUIDV4,
      },
      text: {
        type: DataTypes.TEXT,
        allowNull: false,
      },
      category: {
        type: DataTypes.STRING,
        defaultValue: 'Motivation',
      },
      isFavorite: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
      },
      isPinned: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
      },
      userId: {
        type: DataTypes.UUID,
        allowNull: true,
      },
    },
    {
      tableName: 'thoughts',
      timestamps: true,
    }
  );

  Thought.associate = (models) => {
    if (models.User) {
      Thought.belongsTo(models.User, { foreignKey: 'userId', as: 'user' });
    }
  };

  return Thought;
};

