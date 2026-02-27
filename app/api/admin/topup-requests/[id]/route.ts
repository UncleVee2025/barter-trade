// Admin Top-up Request Action API
import { NextRequest, NextResponse } from "next/server"
import { getPool } from "@/lib/db"  
import { query } from "@/lib/db"
import { verifyAuth } from "@/lib/auth"

// PUT - Approve or reject top-up request
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  let connection: any

  try {
    const auth = await verifyAuth(request)
    if (!auth || auth.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = await params
    const body = await request.json()
    const { action, rejection_reason } = body

    if (!["approve", "reject"].includes(action)) {
      return NextResponse.json({ error: "Invalid action" }, { status: 400 })
    }

    // Get request details
    const [topupRequest] = await query<{
      id: string
      user_id: string
      amount: number
      status: string
    }>(
      `SELECT id, user_id, amount, status FROM topup_requests WHERE id = ?`,
      [id]
    )

    if (!topupRequest) {
      return NextResponse.json({ error: "Top-up request not found" }, { status: 404 })
    }

    if (topupRequest.status !== "pending") {
      return NextResponse.json({ error: "Request already processed" }, { status: 400 })
    }

    const newStatus = action === "approve" ? "approved" : "rejected"

    // 🔥 GET CONNECTION
    const pool = await getPool()
connection = await pool.getConnection()

    // 🔥 START TRANSACTION (CORRECT WAY)
    await connection.beginTransaction()

    // Update request status
    await connection.execute(
      `UPDATE topup_requests 
       SET status = ?, rejection_reason = ?, processed_at = NOW(), processed_by = ?
       WHERE id = ?`,
      [newStatus, action === "reject" ? rejection_reason : null, auth.userId, id]
    )

    if (action === "approve") {
      // Get current balance
const [rows] = await connection.execute(
  `SELECT wallet_balance, name FROM users WHERE id = ?`,
  [topupRequest.user_id]
)

const userData: any = Array.isArray(rows) ? rows[0] : null

if (!userData) {
  throw new Error("User not found")
}

const newBalance =
  (userData.wallet_balance || 0) + topupRequest.amount

      // Update balance
      await connection.execute(
        `UPDATE users SET wallet_balance = ?, updated_at = NOW() WHERE id = ?`,
        [newBalance, topupRequest.user_id]
      )

      // Insert transaction
      const txId = `tx_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`
      await connection.execute(
        `INSERT INTO transactions (
          id, user_id, type, amount, fee, balance_after, status,
          reference, description, created_at
        ) VALUES (?, ?, 'topup', ?, 0, ?, 'completed', ?, ?, NOW())`,
        [
          txId,
          topupRequest.user_id,
          topupRequest.amount,
          newBalance,
          `TOPUP_${id}`,
          `Mobile money top-up approved by admin`
        ]
      )

      // Notification
      await connection.execute(
        `INSERT INTO notifications (
          id, user_id, type, title, message, is_read, created_at
        ) VALUES (?, ?, 'wallet', ?, ?, 0, NOW())`,
        [
          `notif_${Date.now()}`,
          topupRequest.user_id,
          "Top-up Approved",
          `Your wallet has been credited with N$${Number(topupRequest.amount).toFixed(2)}. New balance: N$${Number(newBalance).toFixed(2)}`
        ]
      )
    } else {
      // Rejection notification
      await connection.execute(
        `INSERT INTO notifications (
          id, user_id, type, title, message, is_read, created_at
        ) VALUES (?, ?, 'wallet', ?, ?, 0, NOW())`,
        [
          `notif_${Date.now()}`,
          topupRequest.user_id,
          "Top-up Rejected",
          `Your top-up request for N$${Number(topupRequest.amount).toFixed(2)} was rejected. Reason: ${rejection_reason || "Not specified"}`
        ]
      )
    }

    // Log activity
    await connection.execute(
      `INSERT INTO activity_log (
        id, admin_id, user_id, action_type, entity_type, entity_id,
        description, created_at
      ) VALUES (?, ?, ?, ?, 'topup_request', ?, ?, NOW())`,
      [
        `act_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
        auth.userId,
        topupRequest.user_id,
        action === "approve" ? "wallet_topup" : "admin_action",
        id,
        action === "approve"
          ? `Approved top-up of N$${Number(topupRequest.amount).toFixed(2)}`
          : `Rejected top-up of N$${Number(topupRequest.amount).toFixed(2)}: ${rejection_reason}`
      ]
    )

    // 🔥 COMMIT (CORRECT WAY)
    await connection.commit()

    return NextResponse.json({
      success: true,
      message: `Top-up request ${action === "approve" ? "approved" : "rejected"} successfully`
    })
  } catch (error) {
    if (connection) {
      await connection.rollback()
    }

    console.error("Top-up request action error:", error)

    return NextResponse.json(
      { error: "Failed to process top-up request" },
      { status: 500 }
    )
  } finally {
    if (connection) {
      connection.release()
    }
  }
}