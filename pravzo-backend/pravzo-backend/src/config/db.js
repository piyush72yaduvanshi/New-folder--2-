'use strict';
const mysql = require('mysql2/promise');
// NOTE: dotenv is loaded by server.js entry point — do not call dotenv.config() here

const pool = mysql.createPool({
  host:     process.env.DB_HOST || '127.0.0.1',
  port:     parseInt(process.env.DB_PORT) || 3306,
  user:     process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'pravzo_db',
  waitForConnections: true,
  connectionLimit: parseInt(process.env.DB_POOL_SIZE) || 20,  // was 10 — too low for production
  queueLimit: 100,
  connectTimeout: 30000,  // 30s timeout on new connections
  timezone: '+00:00',     // always UTC — prevents date conversion bugs
  charset:  'utf8mb4',
  // SSL in production — set DB_SSL=true in production .env
  ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: true } : undefined,
});

module.exports = pool;
