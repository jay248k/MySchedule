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

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error('DATABASE_URL environment variable is required in .env');
}

const finalConnectionString = connectionString.includes('sslmode=require')
  ? connectionString.replace('sslmode=require', 'sslmode=verify-full')
  : connectionString;

const sequelize = new Sequelize(finalConnectionString, {
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
    // Production-optimized pool settings: keep warm connections, no per-query SELECT 1 overhead
    max: process.env.NODE_ENV === 'production' ? 20 : 15,
    min: process.env.NODE_ENV === 'production' ? 5 : 3,
    acquire: 30000,
    idle: 30000,
    evict: 60000,
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
