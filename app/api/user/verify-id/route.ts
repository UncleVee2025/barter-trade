import { type NextRequest, NextResponse } from "next/server"
import { verifyAuth } from "@/lib/auth"
import { queryOne, execute, generateId, transaction } from "@/lib/db"
import type { PoolConnection } from "mysql2/promise"

interface UserIdInfo {
  id: string
  national_id_front: string | null
  national_id_back: string | null
  id_verification_status: string
}

// POST - Submit ID verification request
export async function POST(request: NextRequest) {
  try {
    const auth = await verifyAuth(request)
    if (!auth) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { frontImageUrl, backImageUrl } = await request.json()

    if (!frontImageUrl || !backImageUrl) {
      return NextResponse.json(
        { error: "Both front and back images of your ID are required" },
        { status: 400 }
      )
    }

    // Check current verification status
    const user = await queryOne<UserIdInfo>(
      `SELECT id, national_id_front, national_id_back, id_verification_status FROM users WHERE id = ?`,
      [auth.userId]
    )

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    if (user.id_verification_status === "pending") {
      return NextResponse.json(
        { error: "You already have a pending verification request" },
        { status: 400 }
      )
    }

    if (user.id_verification_status === "approved") {
      return NextResponse.json(
        { error: "Your ID has already been verified" },
        { status: 400 }
      )
    }

    await transaction(async (conn: PoolConnection) => {
      // Update user with ID images and set status to pending
      await conn.execute(
        `UPDATE users SET 
          national_id_front = ?,
          national_id_back = ?,
          id_verification_status = 'pending',
          id_rejection_reason = NULL,
          updated_at = NOW()
        WHERE id = ?`,
        [frontImageUrl, backImageUrl, auth.userId]
      )

      // Create verification request record
      await conn.execute(
        `INSERT INTO id_verification_requests (id, user_id, national_id_front, national_id_back, status, created_at)
         VALUES (?, ?, ?, ?, 'pending', NOW())`,
        [generateId(), auth.userId, frontImageUrl, backImageUrl]
      )

      // Log activity
      await conn.execute(
        `INSERT INTO activity_log (id, user_id, action, entity_type, details)
         VALUES (?, ?, 'submit_id_verification', 'user', ?)`,
        [generateId(), auth.userId, JSON.stringify({ frontImageUrl, backImageUrl })]
      )

      // Create notification for admins
      const admins = await conn.execute<Array<{ id: string }>>(
        `SELECT id FROM users WHERE role = 'admin'`
      )
      
      // Note: Would create notifications for admins here
    })

    return NextResponse.json({
      success: true,
      message: "ID verification request submitted successfully. We'll review it within 24-48 hours.",
      status: "pending",
    })
  } catch (error) {
    console.error("ID verification submission error:", error)
    return NextResponse.json({ error: "Failed to submit verification" }, { status: 500 })
  }
}

// GET - Get verification status
export async function GET(request: NextRequest) {
  try {
    const auth = await verifyAuth(request)
    if (!auth) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const user = await queryOne<{
      id_verification_status: string
      id_rejection_reason: string | null
      id_verified_at: Date | null
      national_id_front: string | null
      national_id_back: string | null
    }>(
      `SELECT id_verification_status, id_rejection_reason, id_verified_at, national_id_front, national_id_back 
       FROM users WHERE id = ?`,
      [auth.userId]
    )

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    return NextResponse.json({
      status: user.id_verification_status || "not_submitted",
      rejectionReason: user.id_rejection_reason,
      verifiedAt: user.id_verified_at,
      hasDocuments: Boolean(user.national_id_front && user.national_id_back),
    })
  } catch (error) {
    console.error("Get verification status error:", error)
    return NextResponse.json({ error: "Failed to get status" }, { status: 500 })
  }
}
