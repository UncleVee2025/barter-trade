// Admin Top-up Requests Management API
import { NextRequest, NextResponse } from "next/server"
import { query, execute } from "@/lib/db"
import { verifyAuth } from "@/lib/auth"

// GET - Fetch all top-up requests with filtering
export async function GET(request: NextRequest) {
  try {
    const auth = await verifyAuth(request)
    if (!auth || auth.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const status = searchParams.get("status") // pending, approved, rejected
    const page = parseInt(searchParams.get("page") || "1")
    const limit = parseInt(searchParams.get("limit") || "20")
    const offset = (page - 1) * limit

    let whereClause = "WHERE 1=1"
    const params: (string | number)[] = []

    if (status) {
      whereClause += " AND tr.status = ?"
      params.push(status)
    }

    const requests = await query<{
      id: string
      user_id: string
      user_name: string
      user_email: string
      amount: number
      bank: string
      bank_name: string
      receipt_url: string
      status: string
      rejection_reason: string | null
      created_at: Date
      processed_at: Date | null
      processed_by_name: string | null
    }>(`
      SELECT 
        tr.*,
        u.name as user_name,
        u.email as user_email,
        a.name as processed_by_name
      FROM topup_requests tr
      JOIN users u ON tr.user_id = u.id
      LEFT JOIN users a ON tr.processed_by = a.id
      ${whereClause}
      ORDER BY tr.created_at DESC
      LIMIT ? OFFSET ?
    `, [...params, limit, offset])

    const [countResult] = await query<{ total: number }>(`
      SELECT COUNT(*) as total FROM topup_requests tr ${whereClause}
    `, params)

    // Get pending count for badge
    const [pendingCount] = await query<{ count: number }>(`
      SELECT COUNT(*) as count FROM topup_requests WHERE status = 'pending'
    `)

    return NextResponse.json({
      requests: requests || [],
      pagination: {
        page,
        limit,
        total: countResult?.total || 0,
        totalPages: Math.ceil((countResult?.total || 0) / limit)
      },
      pendingCount: pendingCount?.count || 0
    })
  } catch (error) {
    console.error("Top-up requests fetch error:", error)
    return NextResponse.json({ 
      requests: [],
      pagination: { page: 1, limit: 20, total: 0, totalPages: 0 },
      pendingCount: 0
    })
  }
}
