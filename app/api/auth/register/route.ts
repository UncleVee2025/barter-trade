import { type NextRequest, NextResponse } from "next/server"
import { SignJWT } from "jose"
import { cookies } from "next/headers"
import bcrypt from "bcryptjs"
import { queryOne, execute, generateId, type DBUser } from "@/lib/db"
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

    const { email, password, name, phone, gender, region, town, streetAddress, postalCode = "" } = await request.json()

    // Validation
    if (!email || !password || !name || !region || !gender) {
      return NextResponse.json(
        { error: "Missing required fields: email, password, name, gender, and region are required" },
        { status: 400 }
      )
    }

    // Gender validation
    if (!["male", "female", "other"].includes(gender)) {
      return NextResponse.json({ error: "Invalid gender value" }, { status: 400 })
    }

    // Town validation
    if (!town || town.length < 2) {
      return NextResponse.json(
        { error: "Town/City is required" },
        { status: 400 }
      )
    }

    // Address validation
    if (!streetAddress || streetAddress.length < 5) {
      return NextResponse.json(
        { error: "Full street address is required (minimum 5 characters)" },
        { status: 400 }
      )
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json({ error: "Invalid email format" }, { status: 400 })
    }

    // Password validation
    if (password.length < 6) {
      return NextResponse.json(
        { error: "Password must be at least 6 characters long" },
        { status: 400 }
      )
    }

    // Name validation
    if (name.trim().length < 2) {
      return NextResponse.json(
        { error: "Name must be at least 2 characters long" },
        { status: 400 }
      )
    }

    const normalizedEmail = email.toLowerCase().trim()

    // Check if email already exists in database
    const existingUser = await queryOne<DBUser>(
      `SELECT id FROM users WHERE email = ?`,
      [normalizedEmail]
    )

    if (existingUser) {
      return NextResponse.json(
        { error: "An account with this email already exists" },
        { status: 409 }
      )
    }

    // Hash password with bcrypt
    const saltRounds = 12
    const passwordHash = await bcrypt.hash(password, saltRounds)

    // Create user in database
    const userId = generateId()
    
    try {
      await execute(
        `INSERT INTO users (
          id, email, password_hash, name, phone, gender, region, town, 
          street_address, postal_code, role, wallet_balance, is_verified, 
          is_banned, id_verification_status, created_at, updated_at, last_seen
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'user', 0.00, FALSE, FALSE, 'not_submitted', NOW(), NOW(), NOW())`,
        [
          userId,
          normalizedEmail,
          passwordHash,
          name.trim(),
          phone?.trim() || null,
          gender,
          region.trim(),
          town?.trim() || null,
          streetAddress?.trim() || null,
          postalCode?.trim() || null
        ]
      )
    } catch (dbError) {
      console.error("Database insert error:", dbError)
      // Check for duplicate entry
      if (dbError instanceof Error && dbError.message.includes("Duplicate")) {
        return NextResponse.json(
          { error: "An account with this email already exists" },
          { status: 409 }
        )
      }
      throw dbError
    }

    // Create JWT token
    const token = await new SignJWT({
      userId: userId,
      email: normalizedEmail,
      role: "user",
    })
      .setProtectedHeader({ alg: "HS256" })
      .setIssuedAt()
      .setExpirationTime("7d")
      .sign(JWT_SECRET)

    // Create session in database
    const sessionId = generateId()
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
    
    await execute(
      `INSERT INTO sessions (id, user_id, token, ip_address, user_agent, expires_at)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        sessionId,
        userId,
        token,
        request.headers.get("x-forwarded-for") || "unknown",
        request.headers.get("user-agent") || "unknown",
        expiresAt
      ]
    )

    // Set cookie
    const cookieStore = await cookies()
    cookieStore.set("auth-token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7,
      path: "/",
    })

    // Return user
    const safeUser = {
      id: userId,
      email: normalizedEmail,
      name: name.trim(),
      phone: phone?.trim() || null,
      gender: gender,
      region: region.trim(),
      town: town?.trim() || null,
      streetAddress: streetAddress?.trim() || null,
      avatar: null,
      walletBalance: 0,
      role: "user" as const,
      isVerified: false,
      isBanned: false,
      idVerificationStatus: "not_submitted",
      createdAt: new Date(),
      lastSeen: new Date(),
    }

    return NextResponse.json({
      success: true,
      user: safeUser,
      token,
      message: "Registration successful! Welcome to Barter Trade Namibia.",
    })
  } catch (error) {
    console.error("Registration error:", error)
    return NextResponse.json(
      { error: "Registration failed. Please try again." },
      { status: 500 }
    )
  }
}
