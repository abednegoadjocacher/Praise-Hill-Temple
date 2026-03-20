// lib/db.ts
import mysql from 'mysql2/promise';

const pool = mysql.createPool({
  // Use Railway's auto-injected variables first
  host: process.env.MYSQLHOST || process.env.DB_HOST || 'localhost',
  user: process.env.MYSQLUSER || process.env.DB_USER || 'root',
  password: process.env.MYSQLPASSWORD || process.env.DB_PASSWORD,
  database: process.env.MYSQLDATABASE || process.env.DB_NAME || 'icgc_db',
  port: Number(process.env.MYSQLPORT || process.env.DB_PORT || 3306),
  
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  // Add this for extra stability on Railway
  enableKeepAlive: true,
  keepAliveInitialDelay: 0,
});

export default pool;