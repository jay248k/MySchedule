const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Setting = sequelize.define(
    'Setting',
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      theme: {
        type: DataTypes.STRING,
        defaultValue: 'light',
      },
      accentColor: {
        type: DataTypes.STRING,
        defaultValue: '#1769FF',
      },
      weekStartsOnSunday: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
      },
      defaultCalendarView: {
        type: DataTypes.STRING,
        defaultValue: 'month',
      },
      timeFormat: {
        type: DataTypes.STRING,
        defaultValue: '12h',
      },
      layoutComfort: {
        type: DataTypes.STRING,
        defaultValue: 'comfortable',
      },
      enableInAppNotifications: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
      },
      soundEffects: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
      },
    },
    {
      tableName: 'settings',
      timestamps: true,
    }
  );

  return Setting;
};
