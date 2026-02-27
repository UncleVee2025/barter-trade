import mysql from "mysql2/promise";
import dns from "dns";

// Force IPv4 to avoid connection issues with some hosts
dns.setDefaultResultOrder("ipv4first");

/**
 * MySQL Connection Pool
 * Uses global caching to reuse connections in serverless environments
 */

const globalForDb = globalThis;

function createPool() {
  return mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: parseInt(process.env.DB_PORT || "3306", 10),
    waitForConnections: true,
    connectionLimit: 10,
    connectTimeout: 10000,
    queueLimit: 0,
  });
}

// Use cached pool in development, create new in production
const pool = globalForDb.mysqlPool ?? createPool();

if (process.env.NODE_ENV !== "production") {
  globalForDb.mysqlPool = pool;
}

export default pool;
