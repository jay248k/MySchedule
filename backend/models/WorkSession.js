const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const WorkSession = sequelize.define(
    'WorkSession',
    {
      id: {
        type: DataTypes.STRING,
        primaryKey: true,
        defaultValue: DataTypes.UUIDV4,
      },
      date: {
        type: DataTypes.STRING, // 'YYYY-MM-DD'
        allowNull: false,
      },
      startTime: {
        type: DataTypes.STRING, // e.g. '09:30:00' or ISO
        allowNull: false,
      },
      endTime: {
        type: DataTypes.STRING, // e.g. '11:15:30' or ISO
        allowNull: true,
      },
      durationSeconds: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
      },
      stopReason: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      notes: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      taskId: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      taskTitle: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      userId: {
        type: DataTypes.UUID,
        allowNull: true,
      },
    },
    {
      tableName: 'work_sessions',
      timestamps: true,
    }
  );

  WorkSession.associate = (models) => {
    WorkSession.belongsTo(models.User, { foreignKey: 'userId', as: 'user' });
    if (models.Task) {
      WorkSession.belongsTo(models.Task, { foreignKey: 'taskId', as: 'task' });
    }
  };

  return WorkSession;
};
