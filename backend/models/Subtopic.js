const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Subtopic = sequelize.define(
    'Subtopic',
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
      topicId: {
        type: DataTypes.STRING,
        allowNull: false,
        references: {
          model: 'topics',
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
      tableName: 'subtopics',
      timestamps: true,
      indexes: [
        { fields: ['topicId'] },
        { fields: ['userId'] },
        { fields: ['orderIndex'] },
      ],
    }
  );

  Subtopic.associate = (models) => {
    if (models.Topic) {
      Subtopic.belongsTo(models.Topic, { foreignKey: 'topicId', as: 'topic' });
    }
    if (models.User) {
      Subtopic.belongsTo(models.User, { foreignKey: 'userId', as: 'user' });
    }
    if (models.KnowledgeItem) {
      Subtopic.hasMany(models.KnowledgeItem, {
        foreignKey: 'subtopicId',
        as: 'lessons',
        onDelete: 'SET NULL'
      });
    }
  };

  return Subtopic;
};