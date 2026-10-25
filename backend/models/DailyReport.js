const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const DailyReport = sequelize.define(
    'DailyReport',
    {
      id: {
        type: DataTypes.STRING,
        primaryKey: true,
        defaultValue: DataTypes.UUIDV4,
      },
      date: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      title: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      accomplishments: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      highlights: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      blockers: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      tomorrowPlan: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      hoursLogged: {
        type: DataTypes.FLOAT,
        defaultValue: 0,
      },
      rating: {
        type: DataTypes.INTEGER,
        defaultValue: 5,
        validate: {
          min: 1,
          max: 5,
        },
      },
      mood: {
        type: DataTypes.STRING,
        defaultValue: 'productive',
      },
      tasksCompletedCount: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
      },
      tasksTotalCount: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
      },
      submittedAt: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
      },
      userId: {
        type: DataTypes.UUID,
        allowNull: true,
      },
    },
    {
      tableName: 'daily_reports',
      timestamps: true,
    }
  );

  DailyReport.associate = (models) => {
    DailyReport.belongsTo(models.User, { foreignKey: 'userId', as: 'user' });
  };

  return DailyReport;
};
