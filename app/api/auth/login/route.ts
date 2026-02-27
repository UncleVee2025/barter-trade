import { type NextRequest, NextResponse } from "next/server"
import { SignJWT } from "jose"
import { cookies } from "next/headers"
import bcrypt from "bcryptjs"
import { query, queryOne, execute, generateId, type DBUser } from "@/lib/db"
import { checkRateLimit, getClientIP, rateLimitConfigs, rateLimitExceededResponse } from "@/lib/rate-limit"

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET || "my_super_secret_key_2026")

export async function POST(request: NextRequest) {
  try {
    // Rate limiting - 5 attempts per 15 minutes
    const clientIP = getClientIP(request)
    const rateLimitResult = checkRateLimit(clientIP, rateLimitConfigs.auth)
    
    if (!rateLimitResult.success) {
      return rateLimitExceededResponse(rateLimitResult)
    }

    const { email, password } = await request.json()

    if (!email || !password) {
      return NextResponse.json({ error: "Email and password are required" }, { status: 400 })
    }

    const normalizedEmail = email.toLowerCase().trim()

    // Query user from database
    const user = await queryOne<DBUser>(
      `SELECT * FROM users WHERE email = ?`,
      [normalizedEmail]
    )

    if (!user) {
      return NextResponse.json({ error: "Invalid email or password" }, { status: 401 })
    }

    // Check if user is banned
    if (user.is_banned) {
      return NextResponse.json({ 
        error: user.ban_reason || "This account has been suspended" 
      }, { status: 403 })
    }

    // Verify password using bcrypt - SECURE: No hard-coded passwords
    let isValidPassword = false
    
    if (user.password_hash) {
      try {
        // Let bcrypt decide - do NOT pre-check the hash string
        // This fixes the issue where startsWith("$2") was rejecting valid hashes
        isValidPassword = await bcrypt.compare(password, user.password_hash)
      } catch (err) {
        console.error("Bcrypt comparison error:", err)
        isValidPassword = false
      }
    }

    if (!isValidPassword) {
      return NextResponse.json({ error: "Invalid email or password" }, { status: 401 })
    }

    // Create JWT token
    const token = await new SignJWT({
      userId: user.id,
      email: user.email,
      role: user.role,
    })
      .setProtectedHeader({ alg: "HS256" })
      .setIssuedAt()
      .setExpirationTime("7d")
      .sign(JWT_SECRET)

    // Create session in database
    const sessionId = generateId()
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days
    
    await execute(
      `INSERT INTO sessions (id, user_id, token, ip_address, user_agent, expires_at)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        sessionId,
        user.id,
        token,
        request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || "unknown",
        request.headers.get("user-agent") || "unknown",
        expiresAt
      ]
    )

    // Update last_seen
    await execute(
      `UPDATE users SET last_seen = NOW() WHERE id = ?`,
      [user.id]
    )

    // Set cookie
    const cookieStore = await cookies()
    cookieStore.set("auth-token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: "/",
    })

    // Return user without password hash
    const safeUser = {
      id: user.id,
      email: user.email,
      name: user.name,
      phone: user.phone,
      region: user.region,
      town: user.town,
      avatar: user.avatar,
      walletBalance: Number(user.wallet_balance),
      role: user.role,
      isVerified: user.is_verified,
      isBanned: user.is_banned,
      createdAt: user.created_at,
      lastSeen: new Date(),
    }

    return NextResponse.json({
      success: true,
      user: safeUser,
      token,
    })
  } catch (error) {
    console.error("Login error:", error)
    return NextResponse.json({ error: "Login failed. Please try again." }, { status: 500 })
  }
}
