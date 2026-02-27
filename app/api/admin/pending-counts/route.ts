// Admin Pending Counts API - For notification badges
import { NextRequest, NextResponse } from "next/server"
import { query } from "@/lib/db"
import { verifyAuth } from "@/lib/auth"

export async function GET(request: NextRequest) {
  try {
    const auth = await verifyAuth(request)
    if (!auth || auth.role !== "admin") {
      return NextResponse.json({ 
        pendingTopups: 0, 
        pendingVerifications: 0, 
        pendingReports: 0, 
        unreadNotifications: 0 
      })
    }

    // Get pending top-up requests count
    let pendingTopups = 0
    try {
      const [topupResult] = await query<{ count: number }>(`
        SELECT COUNT(*) as count FROM topup_requests WHERE status = 'pending'
      `)
      pendingTopups = topupResult?.count || 0
    } catch (e) {
      console.error("[v0] Error fetching topup count:", e)
    }

    // Get pending ID verification requests count
    let pendingVerifications = 0
    try {
      const [verificationResult] = await query<{ count: number }>(`
        SELECT COUNT(*) as count FROM users WHERE id_verification_status = 'pending'
      `)
      pendingVerifications = verificationResult?.count || 0
    } catch (e) {
      console.error("[v0] Error fetching verification count:", e)
    }

    // Get pending reports count (if reports table exists)
    let pendingReports = 0
    try {
      const [reportsResult] = await query<{ count: number }>(`
        SELECT COUNT(*) as count FROM reports WHERE status = 'pending'
      `)
      pendingReports = reportsResult?.count || 0
    } catch (e) {
      // Reports table might not exist, that's okay
    }

    // Get unread admin notifications count
    let unreadNotifications = 0
    try {
      const [notifResult] = await query<{ count: number }>(`
        SELECT COUNT(*) as count FROM notifications 
        WHERE user_id = ? AND is_read = FALSE
      `, [auth.userId])
      unreadNotifications = notifResult?.count || 0
    } catch (e) {
      console.error("[v0] Error fetching notification count:", e)
    }

    return NextResponse.json({
      pendingTopups,
      pendingVerifications,
      pendingReports,
      unreadNotifications
    })
  } catch (error) {
    console.error("Admin pending counts error:", error)
    return NextResponse.json({
      pendingTopups: 0,
      pendingVerifications: 0,
      pendingReports: 0,
      unreadNotifications: 0
    })
  }
}
