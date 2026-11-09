const { Sequelize } = require('sequelize');
const dns = require('dns');
require('dotenv').config();

// Resilient DNS fallback: If local Wi-Fi / ISP router DNS refuses Neon hostname lookup (ENOTFOUND / EREFUSED),
// automatically fallback to public DNS resolvers (Google 8.8.8.8, Cloudflare 1.1.1.1)
if (!global.__neonDnsFallbackApplied) {
  global.__neonDnsFallbackApplied = true;
  const originalLookup = dns.lookup;
  dns.lookup = function (hostname, options, callback) {
    if (typeof options === 'function') {
      callback = options;
      options = {};
    }
    originalLookup(hostname, options, (err, address, family) => {
      if (err && (err.code === 'ENOTFOUND' || err.code === 'EREFUSED' || err.code === 'EAI_AGAIN')) {
        const resolver = new dns.Resolver();
        resolver.setServers(['8.8.8.8', '1.1.1.1', '8.8.4.4']);
        resolver.resolve4(hostname, (resErr, addresses) => {
          if (!resErr && addresses && addresses.length > 0) {
            if (options && options.all) {
              return callback(null, addresses.map((a) => ({ address: a, family: 4 })));
            }
            return callback(null, addresses[0], 4);
          }
          callback(err, address, family);
        });
        return;
      }
      callback(err, address, family);
    });
  };
}

let connectionString =
  process.env.DATABASE_URL ||
  'postgresql://neondb_owner:npg_gjp3UbVuT0rQ@ep-little-heart-b5fmqxzj-pooler.c-7.us-east-2.aws.neon.tech/neondb?sslmode=verify-full&channel_binding=require';

if (connectionString.includes('sslmode=require')) {
  connectionString = connectionString.replace('sslmode=require', 'sslmode=verify-full');
}

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
    max: 10,
    min: 0,
    acquire: 30000,
    idle: 10000,
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
