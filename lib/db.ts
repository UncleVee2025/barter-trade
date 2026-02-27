// Database abstraction layer for Barter Trade Namibia
// PRODUCTION MODE - Strictly requires MySQL database connection
// NO FALLBACK - Application will error if database is unavailable

import bcrypt from "bcryptjs"

// Check if we have MySQL configured
function checkMySQLConfig(): boolean {
  return !!(
    process.env.MYSQL_HOST &&
    process.env.MYSQL_USER &&
    process.env.MYSQL_PASSWORD &&
    process.env.MYSQL_DATABASE
  )
}

// Export function to check database configuration
export function isDemoMode(): boolean {
  return false // Never in demo mode - always production
}

// Export function to verify database is configured
export function requireDatabase(): void {
  if (!checkMySQLConfig()) {
    throw new Error(
      "Database not configured. Please set MYSQL_HOST, MYSQL_USER, MYSQL_PASSWORD, and MYSQL_DATABASE environment variables."
    )
  }
}

// Log database mode on startup - server-side only
if (typeof window === "undefined") {
  const hasMysql = checkMySQLConfig()
  console.log(
    `[DB] Database Mode: ${hasMysql ? "MySQL Production" : "NOT CONFIGURED - WILL ERROR"}`
  )
  if (hasMysql) {
    console.log(`[DB] MySQL Host: ${process.env.MYSQL_HOST}`)
    console.log(`[DB] MySQL Database: ${process.env.MYSQL_DATABASE}`)
  } else {
    console.error(
      "[DB] CRITICAL: MySQL not configured. Application requires database connection."
    )
    console.error(
      "[DB] Required: MYSQL_HOST, MYSQL_USER, MYSQL_PASSWORD, MYSQL_DATABASE"
    )
  }
}

// Types for database models
export interface DBUser {
  id: string
  email: string
  password_hash: string
  name: string
  phone: string | null
  gender: "male" | "female" | "other" | null
  date_of_birth: string | null
  region: string
  town: string | null
  street_address: string | null
  postal_code: string | null
  avatar: string | null
  role: "user" | "admin"
  wallet_balance: number
  is_verified: boolean
  is_banned: boolean
  ban_reason: string | null
  id_verification_status: "not_submitted" | "pending" | "approved" | "rejected"
  id_rejection_reason: string | null
  national_id_front: string | null
  national_id_back: string | null
  last_seen: Date
  created_at: Date
  updated_at: Date
}

export interface DBCategory {
  id: string
  name: string
  slug: string
  icon: string
  color: string
  description: string | null
  image: string | null
  listing_count: number
  display_order: number
  is_active: boolean
}

export interface DBListing {
  id: string
  user_id: string
  title: string
  description: string | null
  category_id: string
  subcategory_id: string | null
  type: "item" | "service"
  value: number
  currency: string
  condition: "new" | "like_new" | "good" | "fair" | "poor"
  region: string
  town: string | null
  latitude: number | null
  longitude: number | null
  status: "pending" | "active" | "sold" | "flagged" | "expired" | "draft"
  views: number
  saves: number
  featured: boolean
  trade_preferences: string | null
  created_at: Date
  updated_at: Date
}

export interface DBTransaction {
  id: string
  user_id: string
  type: "topup" | "transfer_in" | "transfer_out" | "listing_fee" | "featured_fee" | "offer_fee" | "voucher" | "trade" | "refund"
  amount: number
  fee: number
  balance_after: number
  status: "pending" | "completed" | "failed" | "refunded"
  reference: string | null
  description: string | null
  related_user_id: string | null
  related_listing_id: string | null
  created_at: Date
}

export interface DBVoucher {
  id: string
  code: string
  amount: number
  type: "scratch" | "online"
  status: "unused" | "used" | "disabled" | "expired"
  vendor: string | null
  batch_id: string | null
  created_by: string
  used_by: string | null
  used_by_phone: string | null
  used_at: Date | null
  expires_at: Date
  created_at: Date
}

export interface DBConversation {
  id: string
  listing_id: string | null
  created_at: Date
  updated_at: Date
}

export interface DBMessage {
  id: string
  conversation_id: string
  sender_id: string
  content: string
  type: "text" | "image" | "offer" | "system"
  offer_id: string | null
  read_at: Date | null
  created_at: Date
}

export interface DBTradeOffer {
  id: string
  sender_id: string
  receiver_id: string
  conversation_id: string | null
  listing_id: string | null
  wallet_amount: number
  message: string | null
  status: "pending" | "accepted" | "rejected" | "countered" | "expired" | "cancelled"
  expires_at: Date
  created_at: Date
  updated_at: Date
}

export interface DBNotification {
  id: string
  user_id: string
  type: "trade" | "message" | "wallet" | "listing" | "system" | "offer"
  title: string
  message: string
  data: Record<string, unknown> | null
  is_read: boolean
  created_at: Date
}

export interface DBSession {
  id: string
  user_id: string
  token: string
  ip_address: string | null
  user_agent: string | null
  expires_at: Date
  created_at: Date
}

export interface DBSavedListing {
  id: string
  user_id: string
  listing_id: string
  created_at: Date
}

export interface DBListingImage {
  id: string
  listing_id: string
  url: string
  thumbnail_url: string | null
  display_order: number
  is_primary: boolean
  created_at: Date
}

export interface DBTopUpRequest {
  id: string
  user_id: string
  amount: number
  bank: string
  bank_name: string
  receipt_url: string
  status: "pending" | "approved" | "rejected"
  voucher_code: string | null
  rejection_reason: string | null
  created_at: Date
  processed_at: Date | null
  processed_by: string | null
}

export interface DBAdvertisement {
  id: string
  title: string
  description: string | null
  image_url: string
  link_url: string | null
  placement: "banner" | "sidebar" | "listing_feed" | "featured"
  start_date: Date
  end_date: Date
  is_active: boolean
  impressions: number
  clicks: number
  created_by: string
  created_at: Date
  updated_at: Date
}

export interface DBListingWantedItem {
  id: string
  listing_id: string
  description: string
  category_id: string | null
  display_order: number
  created_at: Date
}

// Helper to generate UUID
export function generateId(): string {
  return crypto.randomUUID()
}

// MySQL pool (lazy loaded)
let mysqlPool: unknown = null
let poolInitialized = false

async function getMySQLPool() {
  const hasMySQL = checkMySQLConfig()
  
  if (!hasMySQL) {
    throw new Error(
      "Database not configured. Set MYSQL_HOST, MYSQL_USER, MYSQL_PASSWORD, and MYSQL_DATABASE environment variables."
    )
  }
  
  if (mysqlPool) return mysqlPool
  
  try {
    const mysql = await import("mysql2/promise")
    
    mysqlPool = mysql.createPool({
      host: process.env.MYSQL_HOST || "localhost",
      user: process.env.MYSQL_USER || "barter_trade",
      password: process.env.MYSQL_PASSWORD || "Freedom@2025",
      database: process.env.MYSQL_DATABASE || "barter_trade",
      port: Number(process.env.MYSQL_PORT) || 3306,
      waitForConnections: true,
      connectionLimit: 20,
      maxIdle: 10,
      idleTimeout: 60000,
      queueLimit: 0,
      enableKeepAlive: true,
      keepAliveInitialDelay: 10000,
      connectTimeout: 30000,
      charset: "utf8mb4",
    })
    
    // Test the connection
    const connection = await (mysqlPool as { getConnection: () => Promise<{ release: () => void }> }).getConnection()
    connection.release()
    
    console.log("[DB] MySQL connection pool established successfully")
    console.log(`[DB] Connected to: ${process.env.MYSQL_HOST}/${process.env.MYSQL_DATABASE}`)
    poolInitialized = true
    
    return mysqlPool
  } catch (error) {
    console.error("[DB] MySQL connection failed:", error)
    throw new Error(`Database connection failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}

// Query function - strictly MySQL only
export async function query<T = unknown>(sql: string, params?: unknown[]): Promise<T[]> {
  const pool = await getMySQLPool()
  
  try {
    const [rows] = await (pool as { execute: (sql: string, params?: unknown[]) => Promise<[T[], unknown]> }).execute(sql, params)
    return rows
  } catch (error) {
    console.error("[DB] Query error:", error)
    console.error("[DB] SQL:", sql.substring(0, 200))
    throw error
  }
}

export async function queryOne<T = unknown>(sql: string, params?: unknown[]): Promise<T | null> {
  const rows = await query<T>(sql, params)
  return rows[0] || null
}

export async function execute(
  sql: string,
  params?: unknown[]
): Promise<{ insertId: number; affectedRows: number; changedRows: number }> {
  const pool = await getMySQLPool()
  
  try {
    const [result] = await (pool as { execute: (sql: string, params?: unknown[]) => Promise<[{ insertId: number; affectedRows: number; changedRows?: number }, unknown]> }).execute(sql, params)
    return {
      insertId: result.insertId,
      affectedRows: result.affectedRows,
      changedRows: result.changedRows || 0,
    }
  } catch (error) {
    console.error("[DB] Execute error:", error)
    console.error("[DB] SQL:", sql.substring(0, 200))
    throw error
  }
}

// Transaction helper
export async function transaction<T>(
  callback: (conn: {
    query: <R = unknown>(sql: string, params?: unknown[]) => Promise<R[]>
    execute: (sql: string, params?: unknown[]) => Promise<{ insertId: number; affectedRows: number; changedRows: number }>
  }) => Promise<T>
): Promise<T> {
  const pool = await getMySQLPool()
  const connection = await (pool as { getConnection: () => Promise<unknown> }).getConnection()
  
  try {
    await (connection as { beginTransaction: () => Promise<void> }).beginTransaction()
    
    const result = await callback({
      query: async <R = unknown>(sql: string, params?: unknown[]): Promise<R[]> => {
        const [rows] = await (connection as { execute: (sql: string, params?: unknown[]) => Promise<[R[], unknown]> }).execute(sql, params)
        return rows
      },
      execute: async (sql: string, params?: unknown[]) => {
        const [result] = await (connection as { execute: (sql: string, params?: unknown[]) => Promise<[{ insertId: number; affectedRows: number; changedRows?: number }, unknown]> }).execute(sql, params)
        return {
          insertId: result.insertId,
          affectedRows: result.affectedRows,
          changedRows: result.changedRows || 0,
        }
      },
    })
    
    await (connection as { commit: () => Promise<void> }).commit()
    return result
  } catch (error) {
    await (connection as { rollback: () => Promise<void> }).rollback()
    throw error
  } finally {
    (connection as { release: () => void }).release()
  }
}

// Utility: Format currency as Namibian Dollars
export function formatNAD(amount: number): string {
  return `N$ ${amount.toLocaleString('en-NA', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

// Utility: Get system setting
export async function getSystemSetting(key: string): Promise<string | null> {
  try {
    const result = await queryOne<{ setting_value: string }>(
      `SELECT setting_value FROM system_settings WHERE setting_key = ?`,
      [key]
    )
    return result?.setting_value || null
  } catch {
    return null
  }
}

// Utility: Update system setting
export async function updateSystemSetting(key: string, value: string): Promise<boolean> {
  try {
    await execute(
      `UPDATE system_settings SET setting_value = ?, updated_at = NOW() WHERE setting_key = ?`,
      [value, key]
    )
    return true
  } catch {
    return false
  }
}

// Utility: Deduct wallet balance with transaction logging
export async function deductWalletBalance(
  userId: string,
  amount: number,
  type: DBTransaction['type'],
  description: string,
  relatedListingId?: string
): Promise<{ success: boolean; newBalance: number; error?: string }> {
  return transaction(async (conn) => {
    // Get current balance with lock
    const [user] = await conn.query<DBUser>(
      `SELECT id, wallet_balance FROM users WHERE id = ? FOR UPDATE`,
      [userId]
    )
    
    if (!user) {
      return { success: false, newBalance: 0, error: "User not found" }
    }
    
    const currentBalance = Number(user.wallet_balance)
    if (currentBalance < amount) {
      return { success: false, newBalance: currentBalance, error: "Insufficient balance" }
    }
    
    const newBalance = currentBalance - amount
    
    // Update balance
    await conn.execute(
      `UPDATE users SET wallet_balance = ?, updated_at = NOW() WHERE id = ?`,
      [newBalance, userId]
    )
    
    // Log transaction
    const txId = generateId()
    await conn.execute(
      `INSERT INTO transactions (id, user_id, type, amount, fee, balance_after, status, description, related_listing_id, created_at)
       VALUES (?, ?, ?, ?, 0, ?, 'completed', ?, ?, NOW())`,
      [txId, userId, type, -amount, newBalance, description, relatedListingId || null]
    )
    
    return { success: true, newBalance }
  })
}

// Utility: Add wallet balance with transaction logging
export async function addWalletBalance(
  userId: string,
  amount: number,
  type: DBTransaction['type'],
  description: string,
  relatedUserId?: string
): Promise<{ success: boolean; newBalance: number; error?: string }> {
  return transaction(async (conn) => {
    // Get current balance with lock
    const [user] = await conn.query<DBUser>(
      `SELECT id, wallet_balance FROM users WHERE id = ? FOR UPDATE`,
      [userId]
    )
    
    if (!user) {
      return { success: false, newBalance: 0, error: "User not found" }
    }
    
    const currentBalance = Number(user.wallet_balance)
    const newBalance = currentBalance + amount
    
    // Update balance
    await conn.execute(
      `UPDATE users SET wallet_balance = ?, updated_at = NOW() WHERE id = ?`,
      [newBalance, userId]
    )
    
    // Log transaction
    const txId = generateId()
    await conn.execute(
      `INSERT INTO transactions (id, user_id, type, amount, fee, balance_after, status, description, related_user_id, created_at)
       VALUES (?, ?, ?, ?, 0, ?, 'completed', ?, ?, NOW())`,
      [txId, userId, type, amount, newBalance, description, relatedUserId || null]
    )
    
    return { success: true, newBalance }
  })
}

// Export bcrypt for password hashing
export { bcrypt }


export async function getPool() {
  return await getMySQLPool()
}