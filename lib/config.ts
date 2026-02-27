// Configuration for Barter Trade Namibia
// Production-ready settings for cPanel MySQL deployment

// Check if MySQL is configured - strict check for production
// Uses the exact credentials provided by user
export const HAS_MYSQL = !!(
  process.env.MYSQL_HOST &&
  process.env.MYSQL_USER &&
  process.env.MYSQL_PASSWORD &&
  process.env.MYSQL_DATABASE
)

// Environment mode
export const IS_PRODUCTION = process.env.NODE_ENV === "production"
export const IS_DEVELOPMENT = process.env.NODE_ENV === "development"

// Database configuration for cPanel MySQL
// Configured for: MYSQL_HOST=localhost, MYSQL_USER=barter_trade, MYSQL_DATABASE=barter_trade
export const DB_CONFIG = {
  host: process.env.MYSQL_HOST || "localhost",
  user: process.env.MYSQL_USER || "barter_trade",
  password: process.env.MYSQL_PASSWORD || "Freedom@2025",
  database: process.env.MYSQL_DATABASE || "barter_trade",
  port: Number(process.env.MYSQL_PORT) || 3306,
  connectionLimit: IS_PRODUCTION ? 20 : 10,
  waitForConnections: true,
  queueLimit: 0,
  enableKeepAlive: true,
  keepAliveInitialDelay: 10000,
  // Connection pooling optimizations for cPanel
  idleTimeout: 60000,
  maxIdle: IS_PRODUCTION ? 10 : 5,
  // cPanel usually doesn't require SSL for localhost connections
  ssl: process.env.MYSQL_SSL === "true" ? { rejectUnauthorized: false } : undefined,
  // Important for cPanel: Use native password authentication
  authPlugins: undefined,
}

// JWT Configuration - Set to provided secret
export const JWT_SECRET = process.env.JWT_SECRET || "my_super_secret_key_2026"

// Log configuration on startup (server-side only)
if (typeof window === "undefined" && IS_PRODUCTION) {
  console.log("[Config] Production mode detected - using MySQL database")
}

// App Configuration
export const APP_CONFIG = {
  name: "Barter Trade Namibia",
  currency: "NAD", // Namibian Dollars
  currencySymbol: "N$",
  minTransfer: 5,
  maxTopUp: 50000,
  minTopUp: 50,
  maxWalletBalance: 500000,
  listingFee: 0, // Free basic listings
  featuredListingFee: 100, // N$100 to feature a listing
  offerFee: 5, // N$5 per offer made
  transactionFeePercent: 0, // No transaction fees
}

// API Configuration
export const API_CONFIG = {
  baseUrl: process.env.NEXT_PUBLIC_API_URL || "",
  socketUrl: process.env.NEXT_PUBLIC_SOCKET_URL || "",
  enableSocket: process.env.NEXT_PUBLIC_ENABLE_SOCKET === "true",
}

// Log database configuration status on server start
if (typeof window === "undefined") {
  console.log(`[Config] Environment: ${IS_PRODUCTION ? "PRODUCTION" : "DEVELOPMENT"}`)
  console.log(`[Config] MySQL Configured: ${HAS_MYSQL ? "YES" : "NO - REQUIRED FOR OPERATION"}`)
  if (HAS_MYSQL) {
    console.log(`[Config] MySQL Host: ${DB_CONFIG.host}`)
    console.log(`[Config] MySQL Database: ${DB_CONFIG.database}`)
  } else {
    console.error(`[Config] CRITICAL: MySQL environment variables not set!`)
    console.error(`[Config] Required: MYSQL_HOST, MYSQL_USER, MYSQL_PASSWORD, MYSQL_DATABASE`)
  }
}
