require('dotenv').config();

const defaultConfig = {
  use_env_variable: 'DATABASE_URL',
  dialect: 'postgres',
  dialectOptions: {
    ssl: {
      require: true,
      rejectUnauthorized: false,
    },
  },
  logging: false,
  pool: {
    max: 10,
    min: 0,
    acquire: 30000,
    idle: 10000,
  },
};

module.exports = {
  development: {
    ...defaultConfig,
    logging: (msg) => console.log(`[Sequelize] ${msg}`),
  },
  test: {
    ...defaultConfig,
    logging: false,
  },
  production: {
    ...defaultConfig,
    logging: false,
  },
};
