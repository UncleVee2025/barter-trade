// Configuration for Barter Trade Namibia
// Production-ready settings for Neon PostgreSQL deployment

// Check if Neon is configured - strict check for production
export const HAS_DATABASE = !!process.env.DATABASE_URL

// Environment mode
export const IS_PRODUCTION = process.env.NODE_ENV === "production"
export const IS_DEVELOPMENT = process.env.NODE_ENV === "development"

// Database configuration for Neon PostgreSQL
export const DB_CONFIG = {
  connectionString: process.env.DATABASE_URL,
  // Neon handles pooling serverlessly
}

// JWT Configuration - Set to provided secret
export const JWT_SECRET = process.env.JWT_SECRET || "my_super_secret_key_2026"

// Log configuration on startup (server-side only)
if (typeof window === "undefined" && IS_PRODUCTION) {
  console.log("[Config] Production mode detected - using Neon PostgreSQL database")
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
  console.log(`[Config] Neon PostgreSQL Configured: ${HAS_DATABASE ? "YES" : "NO - REQUIRED FOR OPERATION"}`)
  if (!HAS_DATABASE) {
    console.error(`[Config] CRITICAL: DATABASE_URL environment variable not set!`)
    console.error(`[Config] Required: DATABASE_URL (Neon connection string)`)
  }
}
