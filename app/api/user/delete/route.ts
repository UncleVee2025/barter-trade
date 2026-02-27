import { type NextRequest, NextResponse } from "next/server"
import { verifyAuth } from "@/lib/auth"
import { execute } from "@/lib/db"
import { cookies } from "next/headers"

// DELETE - Delete user account
export async function DELETE(request: NextRequest) {
  try {
    const auth = await verifyAuth(request)

    if (!auth) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const userId = auth.userId

    try {
      // Start deletion process - use a transaction in production
      // For now, we'll delete in order to maintain referential integrity

      // 1. Delete user's notifications
      await execute("DELETE FROM notifications WHERE user_id = ?", [userId])

      // 2. Delete user's messages (as sender)
      await execute("DELETE FROM messages WHERE sender_id = ?", [userId])

      // 3. Delete user's conversation participations
      await execute("DELETE FROM conversation_participants WHERE user_id = ?", [userId])

      // 4. Delete user's trade offers (both as sender and receiver)
      await execute("DELETE FROM trade_offers WHERE sender_id = ? OR receiver_id = ?", [userId, userId])

      // 5. Delete user's saved listings
      await execute("DELETE FROM saved_listings WHERE user_id = ?", [userId])

      // 6. Delete listing images for user's listings
      await execute(`
        DELETE li FROM listing_images li 
        INNER JOIN listings l ON li.listing_id = l.id 
        WHERE l.user_id = ?
      `, [userId])

      // 7. Delete user's listings
      await execute("DELETE FROM listings WHERE user_id = ?", [userId])

      // 8. Delete user's transactions
      await execute("DELETE FROM transactions WHERE user_id = ?", [userId])

      // 9. Delete user's top-up requests
      await execute("DELETE FROM topup_requests WHERE user_id = ?", [userId])

      // 10. Delete user's settings
      await execute("DELETE FROM user_settings WHERE user_id = ?", [userId])

      // 11. Delete user's sessions
      await execute("DELETE FROM sessions WHERE user_id = ?", [userId])

      // 12. Finally, delete the user
      await execute("DELETE FROM users WHERE id = ?", [userId])

      // Clear auth cookie
      const cookieStore = await cookies()
      cookieStore.delete("auth-token")

      return NextResponse.json({ 
        success: true, 
        message: "Account deleted successfully" 
      })
    } catch (dbError) {
      console.error("Database error deleting account:", dbError)
      return NextResponse.json({ error: "Failed to delete account" }, { status: 500 })
    }
  } catch (error) {
    console.error("Error deleting account:", error)
    return NextResponse.json({ error: "Failed to delete account" }, { status: 500 })
  }
}
