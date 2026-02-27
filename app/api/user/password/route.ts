import { type NextRequest, NextResponse } from "next/server"
import { verifyAuth } from "@/lib/auth"
import { queryOne, execute } from "@/lib/db"
import bcrypt from "bcryptjs"

// PUT - Change user password
export async function PUT(request: NextRequest) {
  try {
    const auth = await verifyAuth(request)

    if (!auth) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const userId = auth.userId
    const body = await request.json()
    const { currentPassword, newPassword } = body

    // Validate input
    if (!currentPassword || !newPassword) {
      return NextResponse.json({ error: "Current password and new password are required" }, { status: 400 })
    }

    if (newPassword.length < 8) {
      return NextResponse.json({ error: "New password must be at least 8 characters" }, { status: 400 })
    }

    // Additional password strength check
    const hasUpperCase = /[A-Z]/.test(newPassword)
    const hasLowerCase = /[a-z]/.test(newPassword)
    const hasNumbers = /\d/.test(newPassword)
    
    if (!hasUpperCase || !hasLowerCase || !hasNumbers) {
      return NextResponse.json({ 
        error: "Password must contain uppercase, lowercase, and numbers" 
      }, { status: 400 })
    }

    try {
      // Get current user with password hash
      const user = await queryOne<{ id: string; password_hash: string }>(
        "SELECT id, password_hash FROM users WHERE id = ?",
        [userId]
      )

      if (!user) {
        return NextResponse.json({ error: "User not found" }, { status: 404 })
      }

      // Verify current password
      const isValidPassword = await bcrypt.compare(currentPassword, user.password_hash)
      
      if (!isValidPassword) {
        return NextResponse.json({ error: "Current password is incorrect" }, { status: 401 })
      }

      // Hash new password
      const newPasswordHash = await bcrypt.hash(newPassword, 12)

      // Update password in database
      await execute(
        "UPDATE users SET password_hash = ?, updated_at = NOW() WHERE id = ?",
        [newPasswordHash, userId]
      )

      // Optionally: Invalidate all other sessions for security
      // This forces re-login on all other devices
      await execute(
        "DELETE FROM sessions WHERE user_id = ? AND token != ?",
        [userId, request.headers.get("authorization")?.replace("Bearer ", "") || ""]
      )

      return NextResponse.json({ 
        success: true, 
        message: "Password changed successfully" 
      })
    } catch (dbError) {
      console.error("Database error changing password:", dbError)
      return NextResponse.json({ error: "Failed to change password" }, { status: 500 })
    }
  } catch (error) {
    console.error("Error changing password:", error)
    return NextResponse.json({ error: "Failed to change password" }, { status: 500 })
  }
}
