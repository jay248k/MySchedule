'use strict';
const { Model, DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  class NotificationLog extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
    }
  }
  NotificationLog.init({
    id: {
      type: DataTypes.UUID,
      primaryKey: true,
      defaultValue: DataTypes.UUIDV4,
    },
    userId: DataTypes.UUID,
    title: DataTypes.STRING,
    message: DataTypes.TEXT,
    scheduledTime: DataTypes.DATE,
    isSent: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    }
  }, {
    sequelize,
    modelName: 'NotificationLog',
    tableName: 'NotificationLogs',
  });
  return NotificationLog;
};