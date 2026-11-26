const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Subsection = sequelize.define(
    'Subsection',
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
      sectionId: {
        type: DataTypes.STRING,
        allowNull: false,
        references: {
          model: 'sections',
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
      tableName: 'subsections',
      timestamps: true,
      indexes: [
        { fields: ['sectionId'] },
        { fields: ['userId'] },
        { fields: ['orderIndex'] },
      ],
    }
  );

  Subsection.associate = (models) => {
    if (models.Section) {
      Subsection.belongsTo(models.Section, { foreignKey: 'sectionId', as: 'section' });
    }
    if (models.User) {
      Subsection.belongsTo(models.User, { foreignKey: 'userId', as: 'user' });
    }
    if (models.Topic) {
      Subsection.hasMany(models.Topic, { foreignKey: 'subsectionId', as: 'topics', onDelete: 'CASCADE' });
    }
  };

  return Subsection;
};