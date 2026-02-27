// Authentication utilities for Barter Trade Namibia
import { jwtVerify } from "jose"
import { cookies } from "next/headers"
import { type NextRequest } from "next/server"
import { queryOne, type DBUser } from "./db"

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET || "my_super_secret_key_2026")

export interface AuthPayload {
  userId: string
  email: string
  role: "user" | "admin"
}

/**
 * Verify authentication from request
 * Extracts JWT from cookie or Authorization header and validates it
 */
export async function verifyAuth(request: NextRequest): Promise<AuthPayload | null> {
  try {
    // Try to get token from cookie first
    let token: string | undefined

    // Check Authorization header
    const authHeader = request.headers.get("authorization")
    if (authHeader?.startsWith("Bearer ")) {
      token = authHeader.substring(7)
    }

    // If no header, try cookie
    if (!token) {
      const cookieStore = await cookies()
      token = cookieStore.get("auth-token")?.value
    }

    if (!token) {
      return null
    }

    // Verify JWT
    const { payload } = await jwtVerify(token, JWT_SECRET)

    if (!payload.userId || !payload.email) {
      return null
    }

    return {
      userId: payload.userId as string,
      email: payload.email as string,
      role: (payload.role as "user" | "admin") || "user",
    }
  } catch (error) {
    console.error("Auth verification failed:", error)
    return null
  }
}

/**
 * Verify authentication and return full user data
 */
export async function verifyAuthWithUser(request: NextRequest): Promise<DBUser | null> {
  const auth = await verifyAuth(request)
  if (!auth) return null

  const user = await queryOne<DBUser>(
    `SELECT * FROM users WHERE id = ?`,
    [auth.userId]
  )

  if (!user || user.is_banned) {
    return null
  }

  return user
}

/**
 * Check if user is admin
 */
export async function verifyAdmin(request: NextRequest): Promise<AuthPayload | null> {
  const auth = await verifyAuth(request)
  if (!auth || auth.role !== "admin") {
    return null
  }
  return auth
}

/**
 * Get current user ID from request (for route handlers)
 */
export async function getCurrentUserId(request: NextRequest): Promise<string | null> {
  const auth = await verifyAuth(request)
  return auth?.userId || null
}

/**
 * Helper to create authenticated response headers
 */
export function createAuthHeaders(token: string) {
  return {
    "Set-Cookie": `auth-token=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${60 * 60 * 24 * 7}`,
  }
}

/**
 * Verify JWT token directly (for use with cookies in route handlers)
 * Returns the payload if valid, null otherwise
 */
export async function verifyToken(token: string): Promise<AuthPayload | null> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET)

    if (!payload.userId || !payload.email) {
      return null
    }

    return {
      userId: payload.userId as string,
      email: payload.email as string,
      role: (payload.role as "user" | "admin") || "user",
    }
  } catch (error) {
    console.error("Token verification failed:", error)
    return null
  }
}

/**
 * Get current user from request (convenience wrapper)
 * Returns user data from database if authenticated
 */
export async function getCurrentUser(request: NextRequest): Promise<DBUser | null> {
  return verifyAuthWithUser(request)
}
