const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Section = sequelize.define(
    'Section',
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
      planId: {
        type: DataTypes.STRING,
        allowNull: false,
        references: {
          model: 'plans',
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
      tableName: 'sections',
      timestamps: true,
      indexes: [
        { fields: ['planId'] },
        { fields: ['userId'] },
        { fields: ['orderIndex'] },
      ],
    }
  );

  Section.associate = (models) => {
    if (models.Plan) {
      Section.belongsTo(models.Plan, { foreignKey: 'planId', as: 'plan' });
    }
    if (models.User) {
      Section.belongsTo(models.User, { foreignKey: 'userId', as: 'user' });
    }
    if (models.Subsection) {
      Section.hasMany(models.Subsection, { foreignKey: 'sectionId', as: 'subsections', onDelete: 'CASCADE' });
    }
  };

  return Section;
};