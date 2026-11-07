const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const ActiveWorkSession = sequelize.define(
    'ActiveWorkSession',
    {
      id: {
        type: DataTypes.STRING,
        primaryKey: true,
      },
      userId: {
        type: DataTypes.UUID,
        allowNull: true,
      },
      isRunning: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
      },
      startTimestamp: {
        type: DataTypes.BIGINT,
        allowNull: true,
      },
      startTime: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      date: {
        type: DataTypes.STRING,
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
      baseAccumulatedSeconds: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
      },
      status: {
        type: DataTypes.STRING,
        defaultValue: 'idle',
      },
      lastPausedTimestamp: {
        type: DataTypes.BIGINT,
        allowNull: true,
      },
      lastPauseReason: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      lastPauseRemarks: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
    },
    {
      tableName: 'active_work_sessions',
      timestamps: true,
    }
  );

  ActiveWorkSession.associate = (models) => {
    if (models.User) {
      ActiveWorkSession.belongsTo(models.User, { foreignKey: 'userId', as: 'user' });
    }
  };

  return ActiveWorkSession;
};

