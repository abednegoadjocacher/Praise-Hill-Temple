// lib/db.ts
import mysql from 'mysql2/promise';

const pool = mysql.createPool({
  // Railway uses MYSQLHOST, local usually uses DB_HOST
  host: process.env.MYSQLHOST || process.env.DB_HOST || 'localhost',
  user: process.env.MYSQLUSER || process.env.DB_USER || 'root',
  password: process.env.MYSQLPASSWORD || process.env.DB_PASSWORD,
  database: process.env.MYSQLDATABASE || process.env.DB_NAME || 'icgc_db',
  port: Number(process.env.MYSQLPORT || process.env.DB_PORT || 3306),
  
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

export default pool;