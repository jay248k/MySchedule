const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const WorkRequest = sequelize.define(
    'WorkRequest',
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
      date: {
        type: DataTypes.STRING, // YYYY-MM-DD (supports past dates)
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
      reason: {
        type: DataTypes.TEXT, // Reason why work was missed or submitted
        allowNull: false,
      },
      status: {
        type: DataTypes.STRING, // 'pending', 'completed', 'rescheduled', 'cancelled'
        defaultValue: 'pending',
      },
      actionRemarks: {
        type: DataTypes.TEXT, // e.g. Why canceled, or reschedule notes
        allowNull: true,
      },
      rescheduledDate: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      rescheduledStartTime: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      rescheduledEndTime: {
        type: DataTypes.STRING,
        allowNull: true,
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
      tableName: 'work_requests',
      timestamps: true,
    }
  );

  WorkRequest.associate = (models) => {
    WorkRequest.belongsTo(models.User, { foreignKey: 'userId', as: 'user' });
    if (models.Task) {
      WorkRequest.belongsTo(models.Task, { foreignKey: 'taskId', as: 'task' });
    }
  };

  return WorkRequest;
};
