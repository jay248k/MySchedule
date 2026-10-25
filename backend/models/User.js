const { DataTypes } = require('sequelize');
const bcrypt = require('bcryptjs');

module.exports = (sequelize) => {
  const User = sequelize.define(
    'User',
    {
      id: {
        type: DataTypes.UUID,
        primaryKey: true,
        defaultValue: DataTypes.UUIDV4,
      },
      name: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
          notEmpty: { msg: 'Name is required' },
          len: { args: [2, 100], msg: 'Name must be between 2 and 100 characters' },
        },
      },
      email: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
        validate: {
          isEmail: { msg: 'Please provide a valid email address' },
        },
        set(val) {
          this.setDataValue('email', val ? val.toLowerCase().trim() : val);
        },
      },
      password: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
          len: { args: [6, 100], msg: 'Password must be at least 6 characters' },
        },
      },
      title: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      avatarInitials: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      avatarBg: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      status: {
        type: DataTypes.STRING,
        defaultValue: 'Active',
        validate: {
          isIn: [['Active', 'Inactive']],
        },
      },
    },
    {
      tableName: 'users',
      timestamps: true,
      hooks: {
        beforeCreate: async (user) => {
          if (user.password) {
            user.password = await bcrypt.hash(user.password, 10);
          }
          if (user.name && (!user.avatarInitials || user.avatarInitials === 'ME')) {
            const parts = user.name.trim().split(/\s+/);
            const initials = parts.length > 1
              ? (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
              : parts[0].slice(0, 2).toUpperCase();
            user.avatarInitials = initials;
          }
        },
        beforeUpdate: async (user) => {
          if (user.changed('password')) {
            user.password = await bcrypt.hash(user.password, 10);
          }
          if (user.changed('name')) {
            const parts = user.name.trim().split(/\s+/);
            const initials = parts.length > 1
              ? (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
              : parts[0].slice(0, 2).toUpperCase();
            user.avatarInitials = initials;
          }
        },
      },
    }
  );

  // Instance method to check password validity
  User.prototype.comparePassword = async function (candidatePassword) {
    return bcrypt.compare(candidatePassword, this.password);
  };

  // Instance method to return safe public object
  User.prototype.toSafeJSON = function () {
    const values = { ...this.get() };
    delete values.password;
    return values;
  };

  User.associate = (models) => {
    User.hasMany(models.UserSession, { foreignKey: 'userId', as: 'sessions' });
    User.hasMany(models.Task, { foreignKey: 'userId', as: 'tasks' });
    User.hasMany(models.Event, { foreignKey: 'userId', as: 'events' });
    User.hasMany(models.Goal, { foreignKey: 'userId', as: 'goals' });
    User.hasMany(models.Category, { foreignKey: 'userId', as: 'categories' });
    User.hasMany(models.DailyReport, { foreignKey: 'userId', as: 'dailyReports' });
    User.hasMany(models.Notification, { foreignKey: 'userId', as: 'notifications' });
  };

  return User;
};
