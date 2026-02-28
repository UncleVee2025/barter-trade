// Database abstraction layer for Barter Trade Namibia
// PRODUCTION MODE - Uses Neon PostgreSQL (serverless)
// NO FALLBACK - Application will error if database is unavailable

import { neon, neonConfig } from "@neondatabase/serverless"
import bcrypt from "bcryptjs"

// Configure Neon for serverless environments
neonConfig.fetchConnectionCache = true

// Check if we have Neon configured
function checkNeonConfig(): boolean {
  return !!process.env.DATABASE_URL
}

// Export function to check database configuration
export function isDemoMode(): boolean {
  return false // Never in demo mode - always production
}

// Export function to verify database is configured
export function requireDatabase(): void {
  if (!checkNeonConfig()) {
    throw new Error(
      "Database not configured. Please set DATABASE_URL environment variable for Neon PostgreSQL."
    )
  }
}

// Log database mode on startup - server-side only
if (typeof window === "undefined") {
  const hasNeon = checkNeonConfig()
  console.log(
    `[DB] Database Mode: ${hasNeon ? "Neon PostgreSQL Production" : "NOT CONFIGURED - WILL ERROR"}`
  )
  if (!hasNeon) {
    console.error(
      "[DB] CRITICAL: Neon not configured. Application requires database connection."
    )
    console.error("[DB] Required: DATABASE_URL")
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

// Create Neon SQL client (lazy initialized)
let sqlClient: ReturnType<typeof neon> | null = null

function getSqlClient() {
  if (!checkNeonConfig()) {
    throw new Error(
      "Database not configured. Set DATABASE_URL environment variable for Neon PostgreSQL."
    )
  }
  
  if (!sqlClient) {
    sqlClient = neon(process.env.DATABASE_URL!)
    console.log("[DB] Neon PostgreSQL client initialized")
  }
  
  return sqlClient
}

// Convert MySQL-style ? placeholders to PostgreSQL $1, $2 style
function convertPlaceholders(sql: string): string {
  let index = 0
  return sql.replace(/\?/g, () => `$${++index}`)
}

// Query function - uses Neon PostgreSQL
export async function query<T = unknown>(sql: string, params?: unknown[]): Promise<T[]> {
  const client = getSqlClient()
  const pgSql = convertPlaceholders(sql)
  
  try {
    const rows = await client(pgSql, params as (string | number | boolean | null | undefined)[])
    return rows as T[]
  } catch (error) {
    console.error("[DB] Query error:", error)
    console.error("[DB] SQL:", pgSql.substring(0, 200))
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
  const client = getSqlClient()
  const pgSql = convertPlaceholders(sql)
  
  try {
    // For INSERT with RETURNING, extract the id
    const isInsert = sql.trim().toUpperCase().startsWith("INSERT")
    let modifiedSql = pgSql
    
    // Add RETURNING id for INSERT statements if not already present
    if (isInsert && !pgSql.toUpperCase().includes("RETURNING")) {
      modifiedSql = pgSql.replace(/;?\s*$/, " RETURNING id")
    }
    
    const result = await client(modifiedSql, params as (string | number | boolean | null | undefined)[])
    
    return {
      insertId: result[0]?.id || 0,
      affectedRows: result.length || 1,
      changedRows: result.length || 0,
    }
  } catch (error) {
    console.error("[DB] Execute error:", error)
    console.error("[DB] SQL:", pgSql.substring(0, 200))
    throw error
  }
}

// Transaction helper using Neon's transaction support
export async function transaction<T>(
  callback: (conn: {
    query: <R = unknown>(sql: string, params?: unknown[]) => Promise<R[]>
    execute: (sql: string, params?: unknown[]) => Promise<{ insertId: number; affectedRows: number; changedRows: number }>
  }) => Promise<T>
): Promise<T> {
  const client = getSqlClient()
  
  // Start transaction
  await client`BEGIN`
  
  try {
    const result = await callback({
      query: async <R = unknown>(sql: string, params?: unknown[]): Promise<R[]> => {
        const pgSql = convertPlaceholders(sql)
        const rows = await client(pgSql, params as (string | number | boolean | null | undefined)[])
        return rows as R[]
      },
      execute: async (sql: string, params?: unknown[]) => {
        const pgSql = convertPlaceholders(sql)
        const isInsert = sql.trim().toUpperCase().startsWith("INSERT")
        let modifiedSql = pgSql
        
        if (isInsert && !pgSql.toUpperCase().includes("RETURNING")) {
          modifiedSql = pgSql.replace(/;?\s*$/, " RETURNING id")
        }
        
        const result = await client(modifiedSql, params as (string | number | boolean | null | undefined)[])
        return {
          insertId: result[0]?.id || 0,
          affectedRows: result.length || 1,
          changedRows: result.length || 0,
        }
      },
    })
    
    await client`COMMIT`
    return result
  } catch (error) {
    await client`ROLLBACK`
    throw error
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

// Legacy compatibility - return the SQL client
export async function getPool() {
  return getSqlClient()
}
