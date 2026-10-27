const { Sequelize } = require('sequelize');
const { sequelize } = require('../config/database');

// Import model definitions
const UserModel = require('./User');
const UserSessionModel = require('./UserSession');
const CategoryModel = require('./Category');
const GoalModel = require('./Goal');
const TaskModel = require('./Task');
const EventModel = require('./Event');
const DailyReportModel = require('./DailyReport');
const NotificationModel = require('./Notification');
const SettingModel = require('./Setting');
const UserProfileModel = require('./UserProfile');
const WorkSessionModel = require('./WorkSession');

// Initialize models
const db = {
  User: UserModel(sequelize),
  UserSession: UserSessionModel(sequelize),
  Category: CategoryModel(sequelize),
  Goal: GoalModel(sequelize),
  Task: TaskModel(sequelize),
  Event: EventModel(sequelize),
  DailyReport: DailyReportModel(sequelize),
  Notification: NotificationModel(sequelize),
  Setting: SettingModel(sequelize),
  UserProfile: UserProfileModel(sequelize),
  WorkSession: WorkSessionModel(sequelize),
};

// Establish associations
Object.keys(db).forEach((modelName) => {
  if (db[modelName].associate) {
    db[modelName].associate(db);
  }
});

db.sequelize = sequelize;
db.Sequelize = Sequelize;

module.exports = db;

