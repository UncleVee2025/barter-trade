import { type NextRequest, NextResponse } from "next/server"
import { verifyAuth } from "@/lib/auth"
import { query, queryOne, execute } from "@/lib/db"

// GET - Fetch user notifications
export async function GET(request: NextRequest) {
  try {
    const auth = await verifyAuth(request)
    if (!auth) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const searchParams = request.nextUrl.searchParams
    const unreadOnly = searchParams.get("unreadOnly") === "true"
    const type = searchParams.get("type")
    const page = Number.parseInt(searchParams.get("page") || "1")
    const limit = Number.parseInt(searchParams.get("limit") || "20")
    const offset = (page - 1) * limit

    let sql = `SELECT * FROM notifications WHERE user_id = ?`
    const params: (string | number)[] = [auth.userId]

    if (unreadOnly) {
      sql += ` AND is_read = FALSE`
    }

    if (type) {
      sql += ` AND type = ?`
      params.push(type)
    }

    // Count
    const countSql = sql.replace("SELECT *", "SELECT COUNT(*) as total")
    const countResult = await queryOne<{ total: number }>(countSql, params)
    const total = countResult?.total || 0

    // Unread count
    const unreadResult = await queryOne<{ count: number }>(
      `SELECT COUNT(*) as count FROM notifications WHERE user_id = ? AND is_read = FALSE`,
      [auth.userId]
    )
    const unreadCount = unreadResult?.count || 0

    sql += ` ORDER BY created_at DESC LIMIT ? OFFSET ?`
    params.push(limit, offset)

    const notifications = await query<Record<string, unknown>>(sql, params)

    const transformedNotifications = notifications.map((n) => ({
      id: n.id,
      type: n.type,
      title: n.title,
      message: n.message,
      data: n.data ? (typeof n.data === "string" ? JSON.parse(n.data as string) : n.data) : null,
      isRead: Boolean(n.is_read),
      createdAt: n.created_at,
    }))

    return NextResponse.json({
      notifications: transformedNotifications,
      unreadCount,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    console.error("Error fetching notifications:", error)
    return NextResponse.json({ error: "Failed to fetch notifications" }, { status: 500 })
  }
}

// PATCH - Mark notifications as read
export async function PATCH(request: NextRequest) {
  try {
    const auth = await verifyAuth(request)
    if (!auth) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { notificationIds, markAllRead } = await request.json()

    if (markAllRead) {
      await execute(`UPDATE notifications SET is_read = TRUE WHERE user_id = ?`, [auth.userId])
      return NextResponse.json({ success: true, message: "All notifications marked as read" })
    }

    if (!notificationIds || !Array.isArray(notificationIds) || notificationIds.length === 0) {
      return NextResponse.json({ error: "notificationIds array is required" }, { status: 400 })
    }

    const placeholders = notificationIds.map(() => "?").join(",")
    await execute(
      `UPDATE notifications SET is_read = TRUE WHERE id IN (${placeholders}) AND user_id = ?`,
      [...notificationIds, auth.userId]
    )

    return NextResponse.json({ success: true, message: "Notifications marked as read" })
  } catch (error) {
    console.error("Error updating notifications:", error)
    return NextResponse.json({ error: "Failed to update notifications" }, { status: 500 })
  }
}

// DELETE - Delete notifications
export async function DELETE(request: NextRequest) {
  try {
    const auth = await verifyAuth(request)
    if (!auth) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const searchParams = request.nextUrl.searchParams
    const deleteAll = searchParams.get("all") === "true"
    const notificationId = searchParams.get("id")

    if (deleteAll) {
      await execute(`DELETE FROM notifications WHERE user_id = ?`, [auth.userId])
      return NextResponse.json({ success: true, message: "All notifications deleted" })
    }

    if (notificationId) {
      await execute(`DELETE FROM notifications WHERE id = ? AND user_id = ?`, [notificationId, auth.userId])
      return NextResponse.json({ success: true, message: "Notification deleted" })
    }

    return NextResponse.json({ error: "Specify notification id or all=true" }, { status: 400 })
  } catch (error) {
    console.error("Error deleting notifications:", error)
    return NextResponse.json({ error: "Failed to delete notifications" }, { status: 500 })
  }
}
