const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Topic = sequelize.define(
    'Topic',
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
      subsectionId: {
        type: DataTypes.STRING,
        allowNull: false,
        references: {
          model: 'subsections',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      orderIndex: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
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
      tableName: 'topics',
      timestamps: true,
      indexes: [
        { fields: ['subsectionId'] },
        { fields: ['userId'] },
        { fields: ['orderIndex'] },
      ],
    }
  );

  Topic.associate = (models) => {
    if (models.Subsection) {
      Topic.belongsTo(models.Subsection, { foreignKey: 'subsectionId', as: 'subsection' });
    }
    if (models.User) {
      Topic.belongsTo(models.User, { foreignKey: 'userId', as: 'user' });
    }
    if (models.Subtopic) {
      Topic.hasMany(models.Subtopic, { foreignKey: 'topicId', as: 'subtopics', onDelete: 'CASCADE' });
    }
  };

  return Topic;
};