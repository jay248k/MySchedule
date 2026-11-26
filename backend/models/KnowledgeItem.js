const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const KnowledgeItem = sequelize.define(
    'KnowledgeItem',
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
      type: {
        type: DataTypes.STRING, // 'folder' | 'lesson' | 'table'
        allowNull: false,
        defaultValue: 'lesson',
      },
      parentId: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      content: {
        type: DataTypes.TEXT, // Text / markdown for lesson, or JSON string for table structure { columns: [], rows: [] }
        allowNull: true,
      },
      orderIndex: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
      },
      tags: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      icon: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      color: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      isPinned: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
      },
      nextLessonId: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      linkedLessonIds: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      subtopicId: {
        type: DataTypes.STRING,
        allowNull: true,
        references: {
          model: 'subtopics',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
      },
      lessonOrder: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
      },
      userId: {
        type: DataTypes.UUID,
        allowNull: true,
      },
    },
    {
      tableName: 'knowledge_items',
      timestamps: true,
      indexes: [
        { fields: ['parentId'] },
        { fields: ['userId'] },
        { fields: ['type'] },
        { fields: ['isPinned'] },
        { fields: ['subtopicId'] },
        { fields: ['lessonOrder'] },
      ],
    }
  );

  KnowledgeItem.associate = (models) => {
    if (models.User) {
      KnowledgeItem.belongsTo(models.User, { foreignKey: 'userId', as: 'user' });
    }
    if (models.Subtopic) {
      KnowledgeItem.belongsTo(models.Subtopic, { foreignKey: 'subtopicId', as: 'subtopic' });
    }
  };

  return KnowledgeItem;
};

