const { Sequelize } = require('sequelize');
require('dotenv').config();

const connectionString =
  process.env.DATABASE_URL ||
  'postgresql://neondb_owner:npg_gjp3UbVuT0rQ@ep-little-heart-b5fmqxzj-pooler.c-7.us-east-2.aws.neon.tech/neondb?sslmode=require&channel_binding=require';

const sequelize = new Sequelize(connectionString, {
  dialect: 'postgres',
  dialectOptions: {
    ssl: {
      require: true,
      rejectUnauthorized: false,
    },
  },
  logging: process.env.DEBUG_SQL === 'true' ? (msg) => console.log(`[Sequelize] ${msg}`) : false,
  benchmark: false,
  pool: {
    max: 20,
    min: 2,
    acquire: 30000,
    idle: 20000,
  },
});

const testConnection = async () => {
  try {
    await sequelize.authenticate();
    console.log('✅ Successfully connected to Neon PostgreSQL Database!');
    return true;
  } catch (error) {
    console.error('❌ Unable to connect to Neon PostgreSQL Database:', error.message);
    return false;
  }
};

module.exports = {
  sequelize,
  testConnection,
};
