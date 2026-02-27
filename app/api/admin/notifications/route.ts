// Admin Notifications API - Send notifications to users
import { type NextRequest, NextResponse } from "next/server"
import { verifyAuth } from "@/lib/auth"
import { query, execute, generateId, queryOne } from "@/lib/db"

// GET - List all notifications (with filters)
export async function GET(request: NextRequest) {
  try {
    const auth = await verifyAuth(request)
    if (!auth || auth.role !== "admin") {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const userId = searchParams.get("userId")
    const type = searchParams.get("type")
    const page = Number.parseInt(searchParams.get("page") || "1")
    const limit = Number.parseInt(searchParams.get("limit") || "50")
    const offset = (page - 1) * limit

    let whereClause = "WHERE 1=1"
    const params: (string | number)[] = []

    if (userId) {
      whereClause += " AND n.user_id = ?"
      params.push(userId)
    }

    if (type) {
      whereClause += " AND n.type = ?"
      params.push(type)
    }

    // Get notifications with user info
    const notifications = await query<{
      id: string
      user_id: string
      type: string
      title: string
      message: string
      data: string | null
      is_read: boolean
      created_at: Date
      user_name: string
      user_email: string
    }>(`
      SELECT 
        n.*,
        u.name as user_name,
        u.email as user_email
      FROM notifications n
      LEFT JOIN users u ON n.user_id = u.id
      ${whereClause}
      ORDER BY n.created_at DESC
      LIMIT ? OFFSET ?
    `, [...params, limit, offset])

    // Get total count
    const countResult = await queryOne<{ total: number }>(`
      SELECT COUNT(*) as total FROM notifications n ${whereClause}
    `, params)

    return NextResponse.json({
      notifications: notifications || [],
      pagination: {
        page,
        limit,
        total: Number(countResult?.total) || 0,
        totalPages: Math.ceil((Number(countResult?.total) || 0) / limit),
      },
    })
  } catch (error) {
    console.error("Admin notifications list error:", error)
    return NextResponse.json({ error: "Failed to fetch notifications" }, { status: 500 })
  }
}

// POST - Send notification to user(s)
export async function POST(request: NextRequest) {
  try {
    const auth = await verifyAuth(request)
    if (!auth || auth.role !== "admin") {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 })
    }

    const body = await request.json()
    const { userId, userIds, type = "system", title, message, data } = body

    if (!title || !message) {
      return NextResponse.json(
        { error: "Title and message are required" },
        { status: 400 }
      )
    }

    // Determine target users
    let targetUserIds: string[] = []

    if (userId) {
      targetUserIds = [userId]
    } else if (userIds && Array.isArray(userIds)) {
      targetUserIds = userIds
    } else {
      return NextResponse.json(
        { error: "Either userId or userIds is required" },
        { status: 400 }
      )
    }

    // Send notification to each user
    const notificationIds: string[] = []

    for (const uid of targetUserIds) {
      const notificationId = generateId()
      await execute(
        `INSERT INTO notifications (id, user_id, type, title, message, data, is_read, created_at)
         VALUES (?, ?, ?, ?, ?, ?, FALSE, NOW())`,
        [notificationId, uid, type, title, message, data ? JSON.stringify(data) : null]
      )
      notificationIds.push(notificationId)
    }

    // Log activity
    await execute(
      `INSERT INTO activity_log (id, user_id, action, entity_type, details, created_at)
       VALUES (?, ?, 'admin_send_notification', 'notification', ?, NOW())`,
      [
        generateId(),
        auth.userId,
        JSON.stringify({
          targetUsers: targetUserIds.length,
          type,
          title,
        }),
      ]
    )

    return NextResponse.json({
      success: true,
      message: `Notification sent to ${targetUserIds.length} user(s)`,
      notificationIds,
    })
  } catch (error) {
    console.error("Admin send notification error:", error)
    return NextResponse.json({ error: "Failed to send notification" }, { status: 500 })
  }
}

// DELETE - Delete notification
export async function DELETE(request: NextRequest) {
  try {
    const auth = await verifyAuth(request)
    if (!auth || auth.role !== "admin") {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 })
    }

    const body = await request.json()
    const { id } = body

    if (!id) {
      return NextResponse.json({ error: "Notification ID required" }, { status: 400 })
    }

    await execute(`DELETE FROM notifications WHERE id = ?`, [id])

    return NextResponse.json({
      success: true,
      message: "Notification deleted",
    })
  } catch (error) {
    console.error("Admin delete notification error:", error)
    return NextResponse.json({ error: "Failed to delete notification" }, { status: 500 })
  }
}
