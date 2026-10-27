const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const ScheduleDeviation = sequelize.define(
    'ScheduleDeviation',
    {
      id: {
        type: DataTypes.STRING,
        primaryKey: true,
        defaultValue: DataTypes.UUIDV4,
      },
      date: {
        type: DataTypes.STRING, // YYYY-MM-DD
        allowNull: false,
      },
      startTime: {
        type: DataTypes.STRING, // e.g. "10:00"
        allowNull: false,
      },
      endTime: {
        type: DataTypes.STRING, // e.g. "11:30"
        allowNull: false,
      },
      durationMinutes: {
        type: DataTypes.INTEGER,
        defaultValue: 60,
      },
      plannedAction: {
        type: DataTypes.STRING, // What I was supposed to do
        allowNull: false,
      },
      actualAction: {
        type: DataTypes.STRING, // What I actually did instead
        allowNull: false,
      },
      reasonCategory: {
        type: DataTypes.STRING, // e.g. "Procrastination", "Distraction", "Interruption"
        defaultValue: 'Distraction',
      },
      rootCause: {
        type: DataTypes.TEXT, // Why did this mistake / deviation occur?
        allowNull: true,
      },
      lessonLearned: {
        type: DataTypes.TEXT, // How to prevent or fix it next time
        allowNull: true,
      },
      deviationType: {
        type: DataTypes.STRING, // 'unproductive', 'productive', 'neutral'
        defaultValue: 'unproductive',
      },
      taskId: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      userId: {
        type: DataTypes.UUID,
        allowNull: true,
      },
    },
    {
      tableName: 'schedule_deviations',
      timestamps: true,
    }
  );

  ScheduleDeviation.associate = (models) => {
    ScheduleDeviation.belongsTo(models.User, { foreignKey: 'userId', as: 'user' });
    if (models.Task) {
      ScheduleDeviation.belongsTo(models.Task, { foreignKey: 'taskId', as: 'task' });
    }
  };

  return ScheduleDeviation;
};
