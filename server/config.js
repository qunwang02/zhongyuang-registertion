require('dotenv').config();

const config = {
  // MongoDB配置
  mongodb: {
    uri: process.env.MONGODB_URI,
    database: process.env.DATABASE_NAME || 'zhongyuan_db',
    options: {
      serverApi: {
        version: '1',
        strict: true,
        deprecationErrors: true,
      }
    }
  },
  
// 服务器配置
  server: {
    port: process.env.PORT || 3000,
    env: process.env.NODE_ENV || 'development',
    corsOrigin: process.env.CORS_ORIGIN || '*',
    rateLimit: {
      windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000,
      max: parseInt(process.env.RATE_LIMIT_MAX) || 100
    }
  },
  
  // 安全配置
  security: {
    jwtSecret: process.env.JWT_SECRET || 'zhongyuan_secret_key',
    adminPassword: process.env.ADMIN_PASSWORD || 'admin123'
  }
};

module.exports = config;
