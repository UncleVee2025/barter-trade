import { type NextRequest, NextResponse } from "next/server"
import { verifyAuth } from "@/lib/auth"
import { queryOne, execute, generateId } from "@/lib/db"
import crypto from "crypto"

// POST - Request phone verification (send OTP via SMS)
export async function POST(request: NextRequest) {
  try {
    const auth = await verifyAuth(request)
    if (!auth) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { phone } = body

    // Validate phone number format for Namibia (+264)
    const phoneRegex = /^\+264[0-9]{7,9}$/
    const cleanPhone = phone?.replace(/[\s-]/g, "")
    
    if (!cleanPhone || !phoneRegex.test(cleanPhone)) {
      return NextResponse.json(
        { error: "Please enter a valid Namibian phone number (+264 XX XXX XXXX)" },
        { status: 400 }
      )
    }

    // Get user info
    const user = await queryOne<{
      id: string
      phone: string | null
      phone_verified: boolean
    }>(
      `SELECT id, phone, phone_verified FROM users WHERE id = ?`,
      [auth.userId]
    )

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    // Check if phone is already verified for this user
    if (user.phone === cleanPhone && user.phone_verified) {
      return NextResponse.json(
        { error: "This phone number is already verified" },
        { status: 400 }
      )
    }

    // Check if phone is used by another user
    const existingPhone = await queryOne<{ id: string }>(
      `SELECT id FROM users WHERE phone = ? AND id != ? AND phone_verified = TRUE`,
      [cleanPhone, auth.userId]
    )

    if (existingPhone) {
      return NextResponse.json(
        { error: "This phone number is already registered to another account" },
        { status: 400 }
      )
    }

    // Check for rate limiting
    const recentVerification = await queryOne<{ created_at: Date }>(
      `SELECT created_at FROM phone_verifications 
       WHERE user_id = ? AND used = FALSE AND expires_at > NOW()
       ORDER BY created_at DESC LIMIT 1`,
      [auth.userId]
    )

    if (recentVerification) {
      const timeSinceRequest = Date.now() - new Date(recentVerification.created_at).getTime()
      const cooldownMs = 60 * 1000 // 1 minute cooldown
      
      if (timeSinceRequest < cooldownMs) {
        const remainingSeconds = Math.ceil((cooldownMs - timeSinceRequest) / 1000)
        return NextResponse.json(
          { error: `Please wait ${remainingSeconds} seconds before requesting another code` },
          { status: 429 }
        )
      }
    }

    // Generate 6-digit OTP code
    const otpCode = crypto.randomInt(100000, 999999).toString()
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000) // 10 minutes

    // Update user's phone number (unverified)
    await execute(
      `UPDATE users SET phone = ?, phone_verified = FALSE, updated_at = NOW() WHERE id = ?`,
      [cleanPhone, auth.userId]
    )

    // Store verification code
    await execute(
      `INSERT INTO phone_verifications (id, user_id, phone, code, expires_at, created_at)
       VALUES (?, ?, ?, ?, ?, NOW())`,
      [generateId(), auth.userId, cleanPhone, otpCode, expiresAt]
    )

    // In production, you would send an actual SMS here
    // For now, we'll log it and return a success message
    console.log(`[Phone Verification] Code for ${cleanPhone}: ${otpCode}`)

    // TODO: Integrate with SMS service (e.g., Twilio, AfricasTalking, etc.)
    // await sendSMS(cleanPhone, `Your Barter Trade verification code is: ${otpCode}`)

    return NextResponse.json({
      success: true,
      message: "Verification code sent to your phone",
      // In development, you might want to return the code for testing
      // code: process.env.NODE_ENV === "development" ? otpCode : undefined,
    })
  } catch (error) {
    console.error("Phone verification request error:", error)
    return NextResponse.json({ error: "Failed to send verification code" }, { status: 500 })
  }
}

// PUT - Verify phone with OTP code
export async function PUT(request: NextRequest) {
  try {
    const auth = await verifyAuth(request)
    if (!auth) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { code } = await request.json()

    if (!code || code.length !== 6) {
      return NextResponse.json(
        { error: "Please enter a valid 6-digit code" },
        { status: 400 }
      )
    }

    // Find valid verification record
    const verification = await queryOne<{
      id: string
      user_id: string
      phone: string
      attempts: number
    }>(
      `SELECT id, user_id, phone, attempts FROM phone_verifications 
       WHERE user_id = ? AND code = ? AND used = FALSE AND expires_at > NOW()`,
      [auth.userId, code]
    )

    if (!verification) {
      // Check if there's an expired or used code
      const expiredVerification = await queryOne<{ attempts: number }>(
        `SELECT attempts FROM phone_verifications 
         WHERE user_id = ? AND code = ?`,
        [auth.userId, code]
      )

      if (expiredVerification) {
        return NextResponse.json(
          { error: "This code has expired. Please request a new one." },
          { status: 400 }
        )
      }

      // Increment attempts for wrong codes
      await execute(
        `UPDATE phone_verifications SET attempts = attempts + 1 
         WHERE user_id = ? AND used = FALSE AND expires_at > NOW()`,
        [auth.userId]
      )

      return NextResponse.json(
        { error: "Invalid verification code" },
        { status: 400 }
      )
    }

    // Check max attempts
    if (verification.attempts >= 5) {
      return NextResponse.json(
        { error: "Too many failed attempts. Please request a new code." },
        { status: 400 }
      )
    }

    // Mark verification as used
    await execute(
      `UPDATE phone_verifications SET used = TRUE, verified_at = NOW() WHERE id = ?`,
      [verification.id]
    )

    // Update user's phone verification status
    await execute(
      `UPDATE users SET phone_verified = TRUE, updated_at = NOW() WHERE id = ?`,
      [auth.userId]
    )

    // Award gamification points for phone verification
    try {
      await fetch(`${process.env.NEXT_PUBLIC_APP_URL || ""}/api/user/gamification`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: auth.userId,
          points: 15,
          actionType: "phone_verification",
          description: "Phone number verified successfully",
        }),
      })
    } catch {
      // Silently fail gamification update
    }

    return NextResponse.json({
      success: true,
      message: "Phone number verified successfully",
    })
  } catch (error) {
    console.error("Phone verification error:", error)
    return NextResponse.json({ error: "Failed to verify phone" }, { status: 500 })
  }
}

// GET - Check phone verification status
export async function GET(request: NextRequest) {
  try {
    const auth = await verifyAuth(request)
    if (!auth) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const user = await queryOne<{
      phone: string | null
      phone_verified: boolean
    }>(
      `SELECT phone, phone_verified FROM users WHERE id = ?`,
      [auth.userId]
    )

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    // Check for pending verification
    const pendingVerification = await queryOne<{ created_at: Date }>(
      `SELECT created_at FROM phone_verifications 
       WHERE user_id = ? AND used = FALSE AND expires_at > NOW()
       ORDER BY created_at DESC LIMIT 1`,
      [auth.userId]
    )

    return NextResponse.json({
      phone: user.phone,
      verified: user.phone_verified,
      hasPendingVerification: Boolean(pendingVerification),
    })
  } catch (error) {
    console.error("Get phone verification status error:", error)
    return NextResponse.json({ error: "Failed to get status" }, { status: 500 })
  }
}
