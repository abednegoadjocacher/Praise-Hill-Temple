// lib/db.ts
import mysql from 'mysql2/promise';

const pool = mysql.createPool({
  // Use Railway's auto-injected variables first
  host: process.env.MYSQLHOST || 'localhost',
  user: process.env.MYSQLUSER || 'root',
  password: process.env.MYSQLPASSWORD,
  database: process.env.MYSQLDATABASE || 'icgc_db',
  port: Number(process.env.MYSQLPORT || 3306),
  
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  enableKeepAlive: true,
  keepAliveInitialDelay: 0,
});

export default pool;