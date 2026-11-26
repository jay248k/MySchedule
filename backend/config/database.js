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

const FALLBACK_DATABASE_URL =
  'postgresql://neondb_owner:npg_gjp3UbVuT0rQ@ep-little-heart-b5fmqxzj-pooler.c-7.us-east-2.aws.neon.tech/neondb?sslmode=verify-full&channel_binding=require';

let rawUrl = process.env.DATABASE_URL;
if (!rawUrl || rawUrl.includes('your-neon-host') || rawUrl.includes('password@')) {
  rawUrl = FALLBACK_DATABASE_URL;
}

let connectionString = rawUrl;

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
    keepAlive: true,
    statement_timeout: 30000,
  },
  logging: process.env.DEBUG_SQL === 'true' ? (msg, timing) => {
    if (timing && timing > 100) {
      console.warn(`🐌 SLOW QUERY (${timing}ms): ${msg.substring(0, 200)}`);
    }
    console.log(`[Sequelize] ${msg}`);
  } : false,
  benchmark: process.env.DEBUG_SQL === 'true',
  retry: {
    match: [
      /Connection terminated unexpectedly/,
      /ConnectionAcquireTimeoutError/,
      /SequelizeConnectionError/,
      /SequelizeConnectionRefusedError/,
      /SequelizeHostNotFoundError/,
      /SequelizeHostNotReachableError/,
      /SequelizeInvalidConnectionError/,
      /SequelizeConnectionTimedOutError/,
      /TimeoutError/,
      /Operation timeout/,
    ],
    max: 3,
    backoffBase: 1000,
    backoffExponent: 1.5,
  },
  pool: {
    // Production-optimized pool settings
    max: process.env.NODE_ENV === 'production' ? 20 : 10,
    min: process.env.NODE_ENV === 'production' ? 5 : 0,
    acquire: 30000,
    idle: process.env.NODE_ENV === 'production' ? 30000 : 10000,
    evict: process.env.NODE_ENV === 'production' ? 60000 : 10000,
    // Validate connections before use
    validate: async (connection) => {
      try {
        await connection.query('SELECT 1');
        return true;
      } catch {
        return false;
      }
    },
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
