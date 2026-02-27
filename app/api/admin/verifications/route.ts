import { type NextRequest, NextResponse } from "next/server"
import { verifyAuth } from "@/lib/auth"
import { query, queryOne, execute, generateId, transaction } from "@/lib/db"
import type { PoolConnection } from "mysql2/promise"

interface VerificationRow {
  id: string
  user_id: string
  user_name: string
  user_email: string
  user_phone: string | null
  user_region: string
  user_town: string | null
  user_street_address: string | null
  national_id_front: string
  national_id_back: string
  status: string
  rejection_reason: string | null
  created_at: Date
  updated_at: Date
  reviewed_at: Date | null
  reviewed_by: string | null
}

// GET - List pending verifications
export async function GET(request: NextRequest) {
  try {
    const auth = await verifyAuth(request)
    if (!auth || auth.role !== "admin") {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 })
    }

    const searchParams = request.nextUrl.searchParams
    const status = searchParams.get("status") || "pending"
    const page = Number.parseInt(searchParams.get("page") || "1")
    const limit = Number.parseInt(searchParams.get("limit") || "20")
    const offset = (page - 1) * limit

    // First try id_verification_requests table, fall back to users table
    let verifications: VerificationRow[] = []
    let total = 0
    let stats = { pending: 0, approved: 0, rejected: 0 }

    try {
      // Try the dedicated verification requests table first
      let sql = `
        SELECT 
          v.id,
          v.user_id,
          u.name as user_name,
          u.email as user_email,
          u.phone as user_phone,
          u.region as user_region,
          u.town as user_town,
          u.street_address as user_street_address,
          v.national_id_front,
          v.national_id_back,
          v.status,
          v.rejection_reason,
          v.created_at,
          COALESCE(v.reviewed_at, v.created_at) as updated_at,
          v.reviewed_at,
          v.admin_id as reviewed_by
        FROM id_verification_requests v
        LEFT JOIN users u ON v.user_id = u.id
        WHERE 1=1
      `
      const params: (string | number)[] = []

      if (status && status !== "all") {
        sql += ` AND v.status = ?`
        params.push(status)
      }

      // Count total
      const countSql = sql.replace(/SELECT[\s\S]*?FROM/, "SELECT COUNT(*) as total FROM")
      const countResult = await query<{ total: number }>(countSql, params)
      total = countResult[0]?.total || 0

      sql += ` ORDER BY v.created_at DESC LIMIT ? OFFSET ?`
      params.push(limit, offset)

      verifications = await query<VerificationRow>(sql, params)

      // Get stats from verification requests table
      const statsResult = await queryOne<{
        pending: number
        approved: number
        rejected: number
      }>(`
        SELECT 
          SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending,
          SUM(CASE WHEN status = 'approved' THEN 1 ELSE 0 END) as approved,
          SUM(CASE WHEN status = 'rejected' THEN 1 ELSE 0 END) as rejected
        FROM id_verification_requests
      `)
      
      if (statsResult) {
        stats = {
          pending: Number(statsResult.pending) || 0,
          approved: Number(statsResult.approved) || 0,
          rejected: Number(statsResult.rejected) || 0,
        }
      }
    } catch {
      // Fallback: Query users table directly for verification data
      console.log("Falling back to users table for verification data")
      
      let sql = `
        SELECT 
          id,
          id as user_id,
          name as user_name,
          email as user_email,
          phone as user_phone,
          region as user_region,
          town as user_town,
          street_address as user_street_address,
          national_id_front,
          national_id_back,
          id_verification_status as status,
          id_rejection_reason as rejection_reason,
          created_at,
          updated_at,
          id_verified_at as reviewed_at,
          NULL as reviewed_by
        FROM users
        WHERE national_id_front IS NOT NULL 
          AND national_id_front != ''
      `
      const params: (string | number)[] = []

      if (status && status !== "all") {
        sql += ` AND id_verification_status = ?`
        params.push(status)
      }

      // Count total
      const countSql = sql.replace(/SELECT[\s\S]*?FROM/, "SELECT COUNT(*) as total FROM")
      const countResult = await query<{ total: number }>(countSql, params)
      total = countResult[0]?.total || 0

      sql += ` ORDER BY created_at DESC LIMIT ? OFFSET ?`
      params.push(limit, offset)

      verifications = await query<VerificationRow>(sql, params)

      // Get stats from users table
      const statsResult = await queryOne<{
        pending: number
        approved: number
        rejected: number
      }>(`
        SELECT 
          SUM(CASE WHEN id_verification_status = 'pending' THEN 1 ELSE 0 END) as pending,
          SUM(CASE WHEN id_verification_status = 'approved' THEN 1 ELSE 0 END) as approved,
          SUM(CASE WHEN id_verification_status = 'rejected' THEN 1 ELSE 0 END) as rejected
        FROM users
        WHERE national_id_front IS NOT NULL AND national_id_front != ''
      `)
      
      if (statsResult) {
        stats = {
          pending: Number(statsResult.pending) || 0,
          approved: Number(statsResult.approved) || 0,
          rejected: Number(statsResult.rejected) || 0,
        }
      }
    }

    const transformedVerifications = verifications.map((v) => ({
      id: v.id,
      userId: v.user_id,
      user: {
        name: v.user_name,
        email: v.user_email,
        phone: v.user_phone,
        region: v.user_region,
        town: v.user_town,
        streetAddress: v.user_street_address,
      },
      frontImage: v.national_id_front,
      backImage: v.national_id_back,
      status: v.status,
      rejectionReason: v.rejection_reason,
      createdAt: v.created_at,
      updatedAt: v.updated_at,
    }))

    return NextResponse.json({
      verifications: transformedVerifications,
      stats: {
        pending: Number(stats?.pending) || 0,
        approved: Number(stats?.approved) || 0,
        rejected: Number(stats?.rejected) || 0,
      },
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasMore: offset + verifications.length < total,
      },
    })
  } catch (error) {
    console.error("Fetch verifications error:", error)
    return NextResponse.json({ error: "Failed to fetch verifications" }, { status: 500 })
  }
}

// PATCH - Approve or reject verification
export async function PATCH(request: NextRequest) {
  try {
    const auth = await verifyAuth(request)
    if (!auth || auth.role !== "admin") {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 })
    }

    const { verificationId, action, rejectionReason } = await request.json()

    if (!verificationId || !action) {
      return NextResponse.json({ error: "Verification ID and action are required" }, { status: 400 })
    }

    if (!["approve", "reject"].includes(action)) {
      return NextResponse.json({ error: "Invalid action. Use 'approve' or 'reject'" }, { status: 400 })
    }

    if (action === "reject" && !rejectionReason) {
      return NextResponse.json({ error: "Rejection reason is required" }, { status: 400 })
    }

    const verification = await queryOne<{ user_id: string; status: string }>(
      `SELECT user_id, status FROM id_verification_requests WHERE id = ?`,
      [verificationId]
    )

    if (!verification) {
      return NextResponse.json({ error: "Verification request not found" }, { status: 404 })
    }

    if (verification.status !== "pending") {
      return NextResponse.json({ error: "This verification has already been processed" }, { status: 400 })
    }

    const newStatus = action === "approve" ? "approved" : "rejected"

    await transaction(async (conn: PoolConnection) => {
      // Update verification request
      await conn.execute(
        `UPDATE id_verification_requests SET 
          status = ?,
          rejection_reason = ?,
          reviewed_by = ?,
          reviewed_at = NOW(),
          updated_at = NOW()
        WHERE id = ?`,
        [newStatus, action === "reject" ? rejectionReason : null, auth.userId, verificationId]
      )

      // Update user verification status
      await conn.execute(
        `UPDATE users SET 
          id_verification_status = ?,
          id_rejection_reason = ?,
          id_verified_at = ${action === "approve" ? "NOW()" : "NULL"},
          id_verified_by = ?,
          is_verified = ${action === "approve" ? "TRUE" : "is_verified"},
          updated_at = NOW()
        WHERE id = ?`,
        [newStatus, action === "reject" ? rejectionReason : null, auth.userId, verification.user_id]
      )

      // Create notification for user
      await conn.execute(
        `INSERT INTO notifications (id, user_id, type, title, message, data, created_at)
         VALUES (?, ?, 'system', ?, ?, ?, NOW())`,
        [
          generateId(),
          verification.user_id,
          action === "approve" ? "ID Verification Approved" : "ID Verification Rejected",
          action === "approve"
            ? "Your ID has been verified successfully. You now have full access to all platform features."
            : `Your ID verification was rejected: ${rejectionReason}. Please submit new documents.`,
          JSON.stringify({ action, verificationId }),
        ]
      )

      // Log activity
      await conn.execute(
        `INSERT INTO activity_log (id, user_id, action, entity_type, entity_id, details)
         VALUES (?, ?, 'admin_verify_id', 'user', ?, ?)`,
        [generateId(), auth.userId, verification.user_id, JSON.stringify({ action, rejectionReason })]
      )
    })

    return NextResponse.json({
      success: true,
      message: action === "approve" ? "ID verification approved" : "ID verification rejected",
    })
  } catch (error) {
    console.error("Update verification error:", error)
    return NextResponse.json({ error: "Failed to update verification" }, { status: 500 })
  }
}
