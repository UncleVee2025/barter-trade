import { type NextRequest, NextResponse } from "next/server"
import { queryOne, execute, generateId } from "@/lib/db"
import crypto from "crypto"

interface UserRow {
  id: string
  email: string
  name: string
}

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json()

    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 })
    }

    const normalizedEmail = email.toLowerCase().trim()

    // Find user by email
    const user = await queryOne<UserRow>(
      `SELECT id, email, name FROM users WHERE email = ?`,
      [normalizedEmail]
    )

    // Always return success to prevent email enumeration
    if (!user) {
      return NextResponse.json({
        success: true,
        message: "If an account with this email exists, a password reset link has been sent.",
      })
    }

    // Generate a secure reset token
    const resetToken = crypto.randomBytes(32).toString("hex")
    const resetTokenExpires = new Date(Date.now() + 60 * 60 * 1000) // 1 hour from now

    // Store token in database
    await execute(
      `UPDATE users SET reset_token = ?, reset_token_expires = ?, updated_at = NOW() WHERE id = ?`,
      [resetToken, resetTokenExpires, user.id]
    )

    // Log the activity
    await execute(
      `INSERT INTO activity_log (id, user_id, action, entity_type, details)
       VALUES (?, ?, 'password_reset_requested', 'user', ?)`,
      [generateId(), user.id, JSON.stringify({ email: normalizedEmail })]
    )

    // In production, you would send an email here with the reset link
    // For now, we'll just log it (remove in production)
    const resetUrl = `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/auth/reset-password?token=${resetToken}`
    console.log(`Password reset requested for ${user.email}. Reset URL: ${resetUrl}`)

    // TODO: Send email with nodemailer or similar
    // await sendPasswordResetEmail(user.email, user.name, resetUrl)

    return NextResponse.json({
      success: true,
      message: "If an account with this email exists, a password reset link has been sent.",
      // Only include token in development for testing
      ...(process.env.NODE_ENV === "development" && { token: resetToken }),
    })
  } catch (error) {
    console.error("Forgot password error:", error)
    return NextResponse.json(
      { error: "Failed to process password reset request" },
      { status: 500 }
    )
  }
}
