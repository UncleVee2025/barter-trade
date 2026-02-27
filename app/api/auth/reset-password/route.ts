import { type NextRequest, NextResponse } from "next/server"
import { queryOne, execute, generateId } from "@/lib/db"
import bcrypt from "bcryptjs"

interface UserRow {
  id: string
  email: string
  reset_token_expires: Date
}

export async function POST(request: NextRequest) {
  try {
    const { token, password } = await request.json()

    if (!token) {
      return NextResponse.json({ error: "Reset token is required" }, { status: 400 })
    }

    if (!password || password.length < 6) {
      return NextResponse.json(
        { error: "Password must be at least 6 characters long" },
        { status: 400 }
      )
    }

    // Find user by reset token
    const user = await queryOne<UserRow>(
      `SELECT id, email, reset_token_expires FROM users WHERE reset_token = ?`,
      [token]
    )

    if (!user) {
      return NextResponse.json(
        { error: "Invalid or expired reset token" },
        { status: 400 }
      )
    }

    // Check if token has expired
    const tokenExpires = new Date(user.reset_token_expires)
    if (tokenExpires < new Date()) {
      // Clear the expired token
      await execute(
        `UPDATE users SET reset_token = NULL, reset_token_expires = NULL WHERE id = ?`,
        [user.id]
      )
      return NextResponse.json(
        { error: "Reset token has expired. Please request a new password reset." },
        { status: 400 }
      )
    }

    // Hash the new password
    const saltRounds = 12
    const passwordHash = await bcrypt.hash(password, saltRounds)

    // Update user's password and clear reset token
    await execute(
      `UPDATE users SET 
        password_hash = ?, 
        reset_token = NULL, 
        reset_token_expires = NULL,
        updated_at = NOW()
       WHERE id = ?`,
      [passwordHash, user.id]
    )

    // Invalidate all existing sessions for security
    await execute(`DELETE FROM sessions WHERE user_id = ?`, [user.id])

    // Log the activity
    await execute(
      `INSERT INTO activity_log (id, user_id, action, entity_type, details)
       VALUES (?, ?, 'password_reset_completed', 'user', ?)`,
      [generateId(), user.id, JSON.stringify({ email: user.email })]
    )

    return NextResponse.json({
      success: true,
      message: "Password has been reset successfully. Please log in with your new password.",
    })
  } catch (error) {
    console.error("Reset password error:", error)
    return NextResponse.json(
      { error: "Failed to reset password" },
      { status: 500 }
    )
  }
}

// GET - Validate reset token
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const token = searchParams.get("token")

    if (!token) {
      return NextResponse.json({ valid: false, error: "Token is required" }, { status: 400 })
    }

    const user = await queryOne<{ id: string; reset_token_expires: Date }>(
      `SELECT id, reset_token_expires FROM users WHERE reset_token = ?`,
      [token]
    )

    if (!user) {
      return NextResponse.json({ valid: false, error: "Invalid token" })
    }

    const tokenExpires = new Date(user.reset_token_expires)
    if (tokenExpires < new Date()) {
      return NextResponse.json({ valid: false, error: "Token has expired" })
    }

    return NextResponse.json({ valid: true })
  } catch (error) {
    console.error("Validate token error:", error)
    return NextResponse.json({ valid: false, error: "Failed to validate token" }, { status: 500 })
  }
}
