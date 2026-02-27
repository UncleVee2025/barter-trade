// Admin Activity Log API - Real-time activity tracking
import { NextRequest, NextResponse } from "next/server"
import { query, execute } from "@/lib/db"
import { verifyAuth } from "@/lib/auth"

// Activity types for logging
export type ActivityType = 
  | "user_login" | "user_logout" | "user_register" | "user_banned" | "user_unbanned"
  | "listing_created" | "listing_updated" | "listing_deleted" | "listing_approved" | "listing_flagged"
  | "trade_initiated" | "trade_completed" | "trade_cancelled"
  | "wallet_topup" | "wallet_transfer" | "voucher_redeemed" | "voucher_created"
  | "id_verification_submitted" | "id_verification_approved" | "id_verification_rejected"
  | "admin_action" | "system_event" | "security_alert"

interface ActivityLog {
  id: string
  user_id: string | null
  admin_id: string | null
  action_type: ActivityType
  entity_type: string | null
  entity_id: string | null
  description: string
  ip_address: string | null
  user_agent: string | null
  metadata: Record<string, unknown> | null
  created_at: Date
}

// GET - Fetch activity logs with filtering and pagination
export async function GET(request: NextRequest) {
  try {
    const auth = await verifyAuth(request)
    if (!auth || auth.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get("page") || "1")
    const limit = parseInt(searchParams.get("limit") || "50")
    const actionType = searchParams.get("action_type")
    const userId = searchParams.get("user_id")
    const startDate = searchParams.get("start_date")
    const endDate = searchParams.get("end_date")
    const realtime = searchParams.get("realtime") === "true"

    const offset = (page - 1) * limit

    // Build dynamic query based on filters
    let whereClause = "WHERE 1=1"
    const params: (string | number)[] = []

    if (actionType) {
      whereClause += " AND al.action_type = ?"
      params.push(actionType)
    }

    if (userId) {
      whereClause += " AND al.user_id = ?"
      params.push(userId)
    }

    if (startDate) {
      whereClause += " AND al.created_at >= ?"
      params.push(startDate)
    }

    if (endDate) {
      whereClause += " AND al.created_at <= ?"
      params.push(endDate)
    }

    // For real-time feed, get last 5 minutes of activity
    if (realtime) {
      whereClause += " AND al.created_at >= DATE_SUB(NOW(), INTERVAL 5 MINUTE)"
    }

    // Main query with user info
    const activities = await query<ActivityLog & { user_name: string; user_email: string; admin_name: string }>(`
      SELECT 
        al.*,
        u.name as user_name,
        u.email as user_email,
        a.name as admin_name
      FROM activity_log al
      LEFT JOIN users u ON al.user_id = u.id
      LEFT JOIN users a ON al.admin_id = a.id
      ${whereClause}
      ORDER BY al.created_at DESC
      LIMIT ? OFFSET ?
    `, [...params, limit, offset])

    // Get total count for pagination
    const [countResult] = await query<{ total: number }>(`
      SELECT COUNT(*) as total FROM activity_log al ${whereClause}
    `, params)

    // Get activity summary for dashboard
    const summary = await query<{ action_type: string; count: number }>(`
      SELECT action_type, COUNT(*) as count 
      FROM activity_log 
      WHERE created_at >= DATE_SUB(NOW(), INTERVAL 24 HOUR)
      GROUP BY action_type
      ORDER BY count DESC
    `)

    return NextResponse.json({
      activities,
      pagination: {
        page,
        limit,
        total: countResult?.total || 0,
        totalPages: Math.ceil((countResult?.total || 0) / limit)
      },
      summary: summary || []
    })
  } catch (error) {
    console.error("Activity log fetch error:", error)
    return NextResponse.json({ error: "Failed to fetch activity logs" }, { status: 500 })
  }
}

// POST - Create new activity log entry
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { 
      user_id, 
      admin_id, 
      action_type, 
      entity_type, 
      entity_id, 
      description, 
      metadata 
    } = body

    // Get IP and user agent from request
    const ip_address = request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || "unknown"
    const user_agent = request.headers.get("user-agent") || "unknown"

    const id = `act_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

    await execute(`
      INSERT INTO activity_log (
        id, user_id, admin_id, action_type, entity_type, entity_id, 
        description, ip_address, user_agent, metadata, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())
    `, [
      id,
      user_id || null,
      admin_id || null,
      action_type,
      entity_type || null,
      entity_id || null,
      description,
      ip_address,
      user_agent,
      metadata ? JSON.stringify(metadata) : null
    ])

    return NextResponse.json({ success: true, id })
  } catch (error) {
    console.error("Activity log creation error:", error)
    return NextResponse.json({ error: "Failed to create activity log" }, { status: 500 })
  }
}
