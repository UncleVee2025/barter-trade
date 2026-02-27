import { type NextRequest, NextResponse } from "next/server"
import { verifyAuth } from "@/lib/auth"
import { query, queryOne, execute, generateId, transaction } from "@/lib/db"
import type { PoolConnection } from "mysql2/promise"

// GET - List all reports
export async function GET(request: NextRequest) {
  try {
    const auth = await verifyAuth(request)
    if (!auth || auth.role !== "admin") {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 })
    }

    const searchParams = request.nextUrl.searchParams
    const page = Number.parseInt(searchParams.get("page") || "1")
    const limit = Number.parseInt(searchParams.get("limit") || "20")
    const status = searchParams.get("status") // pending, reviewed, resolved, dismissed
    const type = searchParams.get("type") // listing, user
    const sort = searchParams.get("sort") || "newest"
    const offset = (page - 1) * limit

    let sql = `
      SELECT 
        lr.*,
        l.title as listing_title,
        l.status as listing_status,
        reporter.name as reporter_name,
        reporter.email as reporter_email,
        owner.name as owner_name,
        owner.email as owner_email
      FROM listing_reports lr
      LEFT JOIN listings l ON lr.listing_id = l.id
      LEFT JOIN users reporter ON lr.reporter_id = reporter.id
      LEFT JOIN users owner ON l.user_id = owner.id
      WHERE 1=1
    `
    const params: (string | number)[] = []

    if (status && status !== "all") {
      sql += ` AND lr.status = ?`
      params.push(status)
    }

    // Count total
    const countSql = sql.replace(/SELECT[\s\S]*?FROM/, "SELECT COUNT(*) as total FROM")
    const countResult = await query<{ total: number }>(countSql, params)
    const total = countResult[0]?.total || 0

    // Sorting
    switch (sort) {
      case "oldest":
        sql += ` ORDER BY lr.created_at ASC`
        break
      default:
        sql += ` ORDER BY lr.created_at DESC`
    }

    sql += ` LIMIT ? OFFSET ?`
    params.push(limit, offset)

    const reports = await query<Record<string, unknown>>(sql, params)

    const transformedReports = reports.map((report) => ({
      id: report.id,
      listingId: report.listing_id,
      listingTitle: report.listing_title,
      listingStatus: report.listing_status,
      reason: report.reason,
      description: report.description,
      status: report.status,
      adminNotes: report.admin_notes,
      createdAt: report.created_at,
      updatedAt: report.updated_at,
      reporter: {
        id: report.reporter_id,
        name: report.reporter_name,
        email: report.reporter_email,
      },
      listingOwner: {
        name: report.owner_name,
        email: report.owner_email,
      },
    }))

    return NextResponse.json({
      reports: transformedReports,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasMore: offset + reports.length < total,
      },
    })
  } catch (error) {
    console.error("Admin reports list error:", error)
    return NextResponse.json({ error: "Failed to fetch reports" }, { status: 500 })
  }
}

// PATCH - Update report status
export async function PATCH(request: NextRequest) {
  try {
    const auth = await verifyAuth(request)
    if (!auth || auth.role !== "admin") {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 })
    }

    const body = await request.json()
    const { reportId, status, adminNotes, action } = body

    if (!reportId || !status) {
      return NextResponse.json({ error: "Report ID and status are required" }, { status: 400 })
    }

    const report = await queryOne<{ listing_id: string }>(
      `SELECT listing_id FROM listing_reports WHERE id = ?`,
      [reportId]
    )

    if (!report) {
      return NextResponse.json({ error: "Report not found" }, { status: 404 })
    }

    await transaction(async (conn: PoolConnection) => {
      // Update report status
      await conn.execute(
        `UPDATE listing_reports SET status = ?, admin_notes = ?, reviewed_by = ?, reviewed_at = NOW(), updated_at = NOW() WHERE id = ?`,
        [status, adminNotes || null, auth.userId, reportId]
      )

      // Take action on listing if specified
      if (action === "flag" && report.listing_id) {
        await conn.execute(`UPDATE listings SET status = 'flagged' WHERE id = ?`, [report.listing_id])
      } else if (action === "delete" && report.listing_id) {
        await conn.execute(`DELETE FROM listings WHERE id = ?`, [report.listing_id])
      }

      // Log activity
      await conn.execute(
        `INSERT INTO activity_log (id, user_id, action, entity_type, entity_id, details) 
         VALUES (?, ?, 'admin_review_report', 'report', ?, ?)`,
        [generateId(), auth.userId, reportId, JSON.stringify({ status, action, adminNotes })]
      )
    })

    return NextResponse.json({
      success: true,
      message: "Report updated successfully",
    })
  } catch (error) {
    console.error("Admin update report error:", error)
    return NextResponse.json({ error: "Failed to update report" }, { status: 500 })
  }
}
