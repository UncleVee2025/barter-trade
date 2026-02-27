import { type NextRequest, NextResponse } from "next/server"
import { verifyAuth } from "@/lib/auth"
import { queryOne, execute, generateId } from "@/lib/db"
import crypto from "crypto"

// POST - Request email verification (send OTP)
export async function POST(request: NextRequest) {
  try {
    const auth = await verifyAuth(request)
    if (!auth) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get user info
    const user = await queryOne<{
      id: string
      email: string
      email_verified: boolean
    }>(
      `SELECT id, email, email_verified FROM users WHERE id = ?`,
      [auth.userId]
    )

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    if (user.email_verified) {
      return NextResponse.json(
        { error: "Email is already verified" },
        { status: 400 }
      )
    }

    // Check for existing pending verification
    const existingVerification = await queryOne<{ created_at: Date }>(
      `SELECT created_at FROM email_verifications 
       WHERE user_id = ? AND used = FALSE AND expires_at > NOW()
       ORDER BY created_at DESC LIMIT 1`,
      [auth.userId]
    )

    if (existingVerification) {
      const timeSinceRequest = Date.now() - new Date(existingVerification.created_at).getTime()
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

    // Store verification code
    await execute(
      `INSERT INTO email_verifications (id, user_id, email, code, expires_at, created_at)
       VALUES (?, ?, ?, ?, ?, NOW())`,
      [generateId(), auth.userId, user.email, otpCode, expiresAt]
    )

    // In production, you would send an actual email here
    // For now, we'll log it and return a success message
    console.log(`[Email Verification] Code for ${user.email}: ${otpCode}`)

    // TODO: Integrate with email service (e.g., SendGrid, Resend, etc.)
    // await sendVerificationEmail(user.email, otpCode)

    return NextResponse.json({
      success: true,
      message: "Verification code sent to your email",
      // In development, you might want to return the code for testing
      // code: process.env.NODE_ENV === "development" ? otpCode : undefined,
    })
  } catch (error) {
    console.error("Email verification request error:", error)
    return NextResponse.json({ error: "Failed to send verification code" }, { status: 500 })
  }
}

// PUT - Verify email with OTP code
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
      email: string
      attempts: number
    }>(
      `SELECT id, user_id, email, attempts FROM email_verifications 
       WHERE user_id = ? AND code = ? AND used = FALSE AND expires_at > NOW()`,
      [auth.userId, code]
    )

    if (!verification) {
      // Check if there's an expired or used code
      const expiredVerification = await queryOne<{ attempts: number }>(
        `SELECT attempts FROM email_verifications 
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
        `UPDATE email_verifications SET attempts = attempts + 1 
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
      `UPDATE email_verifications SET used = TRUE, verified_at = NOW() WHERE id = ?`,
      [verification.id]
    )

    // Update user's email verification status
    await execute(
      `UPDATE users SET email_verified = TRUE, is_verified = TRUE, updated_at = NOW() WHERE id = ?`,
      [auth.userId]
    )

    // Award gamification points for email verification
    try {
      await fetch(`${process.env.NEXT_PUBLIC_APP_URL || ""}/api/user/gamification`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: auth.userId,
          points: 10,
          actionType: "email_verification",
          description: "Email verified successfully",
        }),
      })
    } catch {
      // Silently fail gamification update
    }

    return NextResponse.json({
      success: true,
      message: "Email verified successfully",
    })
  } catch (error) {
    console.error("Email verification error:", error)
    return NextResponse.json({ error: "Failed to verify email" }, { status: 500 })
  }
}

// GET - Check email verification status
export async function GET(request: NextRequest) {
  try {
    const auth = await verifyAuth(request)
    if (!auth) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const user = await queryOne<{
      email_verified: boolean
      email: string
    }>(
      `SELECT email_verified, email FROM users WHERE id = ?`,
      [auth.userId]
    )

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    // Check for pending verification
    const pendingVerification = await queryOne<{ created_at: Date }>(
      `SELECT created_at FROM email_verifications 
       WHERE user_id = ? AND used = FALSE AND expires_at > NOW()
       ORDER BY created_at DESC LIMIT 1`,
      [auth.userId]
    )

    return NextResponse.json({
      verified: user.email_verified,
      email: user.email,
      hasPendingVerification: Boolean(pendingVerification),
    })
  } catch (error) {
    console.error("Get email verification status error:", error)
    return NextResponse.json({ error: "Failed to get status" }, { status: 500 })
  }
}
