import { type NextRequest, NextResponse } from "next/server"
import { verifyAuth } from "@/lib/auth"
import { queryOne, generateId, transaction } from "@/lib/db"
import { isDemoMode, getInMemoryDB, PoolConnection } from "@/lib/utils"

// PATCH - Approve or reject a top-up request (Admin only)
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await verifyAuth(request)
    if (!auth || auth.role !== "admin") {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 })
    }

    const { id } = await params
    const { action, rejectionReason } = await request.json()

    if (!["approve", "reject"].includes(action)) {
      return NextResponse.json({ error: "Invalid action. Must be 'approve' or 'reject'" }, { status: 400 })
    }

    if (action === "reject" && !rejectionReason) {
      return NextResponse.json({ error: "Rejection reason is required" }, { status: 400 })
    }

    // MySQL handling with transaction
    const result = await transaction(async (conn) => {
      // Get the request
      const [requests] = await conn.execute(
        `SELECT * FROM topup_requests WHERE id = ?`,
        [id]
      )
      const topUpRequest = (requests as any[])[0]

      if (!topUpRequest) {
        throw new Error("Top-up request not found")
      }

      if (topUpRequest.status !== "pending") {
        throw new Error("Request has already been processed")
      }

      // Get user
      const [users] = await conn.execute(
        `SELECT id, wallet_balance FROM users WHERE id = ?`,
        [topUpRequest.user_id]
      )
      const user = (users as any[])[0]

      if (!user) {
        throw new Error("User not found")
      }

      if (action === "approve") {
        // Directly credit user wallet - no voucher needed for mobile money approval
        const newBalance = Number(user.wallet_balance) + Number(topUpRequest.amount)
        const reference = `TOPUP_${id.slice(0, 8).toUpperCase()}`

        // Credit user
        await conn.execute(
          `UPDATE users SET wallet_balance = ?, updated_at = NOW() WHERE id = ?`,
          [newBalance, topUpRequest.user_id]
        )

        // Update request
        await conn.execute(
          `UPDATE topup_requests SET status = 'approved', processed_at = NOW(), processed_by = ? WHERE id = ?`,
          [auth.userId, id]
        )

        // Create transaction
        const txId = generateId()
        await conn.execute(
          `INSERT INTO transactions (id, user_id, type, amount, fee, balance_after, status, reference, description, created_at)
           VALUES (?, ?, 'topup', ?, 0, ?, 'completed', ?, ?, NOW())`,
          [txId, topUpRequest.user_id, topUpRequest.amount, newBalance, reference, `Mobile Money top-up via ${topUpRequest.bank_name}`]
        )

        // Create notification
        await conn.execute(
          `INSERT INTO notifications (id, user_id, type, title, message, data, created_at)
           VALUES (?, ?, 'wallet', 'Top-up Approved!', ?, ?, NOW())`,
          [
            generateId(),
            topUpRequest.user_id,
            `Your N$${topUpRequest.amount} top-up has been approved. Your wallet has been credited.`,
            JSON.stringify({ amount: topUpRequest.amount, reference })
          ]
        )

        // Log admin activity
        await conn.execute(
          `INSERT INTO activity_log (id, user_id, action, entity_type, entity_id, details, created_at)
           VALUES (?, ?, 'approve_topup', 'topup_request', ?, ?, NOW())`,
          [generateId(), auth.userId, id, JSON.stringify({ amount: topUpRequest.amount, userId: topUpRequest.user_id })]
        )

        return { action: "approved", newBalance, amount: topUpRequest.amount }
      } else {
        // Reject
        await conn.execute(
          `UPDATE topup_requests SET status = 'rejected', rejection_reason = ?, processed_at = NOW(), processed_by = ? WHERE id = ?`,
          [rejectionReason, auth.userId, id]
        )

        // Create notification
        await conn.execute(
          `INSERT INTO notifications (id, user_id, type, title, message, data, created_at)
           VALUES (?, ?, 'wallet', 'Top-up Rejected', ?, ?, NOW())`,
          [
            generateId(),
            topUpRequest.user_id,
            `Your N$${topUpRequest.amount} top-up request was rejected. Reason: ${rejectionReason}`,
            JSON.stringify({ amount: topUpRequest.amount, reason: rejectionReason })
          ]
        )

        // Log admin activity
        await conn.execute(
          `INSERT INTO activity_log (id, user_id, action, entity_type, entity_id, details, created_at)
           VALUES (?, ?, 'reject_topup', 'topup_request', ?, ?, NOW())`,
          [generateId(), auth.userId, id, JSON.stringify({ amount: topUpRequest.amount, reason: rejectionReason })]
        )

        return { action: "rejected" }
      }
    })

    return NextResponse.json({
      success: true,
      ...result,
      message: result.action === "approved" 
        ? `Top-up approved. User wallet credited with the requested amount.` 
        : "Top-up request rejected",
    })
  } catch (error) {
    console.error("Process top-up request error:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to process request" },
      { status: 500 }
    )
  }
}

// GET - Get single top-up request details
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await verifyAuth(request)
    if (!auth) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = await params

    const topUpRequest = await queryOne<any>(
      `SELECT r.*, u.name as user_name, u.email as user_email
       FROM topup_requests r
       JOIN users u ON r.user_id = u.id
       WHERE r.id = ?`,
      [id]
    )

    if (!topUpRequest) {
      return NextResponse.json({ error: "Top-up request not found" }, { status: 404 })
    }

    // Check access
    if (auth.role !== "admin" && topUpRequest.user_id !== auth.userId) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 })
    }

    return NextResponse.json({
      request: {
        id: topUpRequest.id,
        userId: topUpRequest.user_id,
        userName: topUpRequest.user_name,
        userEmail: topUpRequest.user_email,
        amount: Number(topUpRequest.amount),
        bank: topUpRequest.bank,
        bankName: topUpRequest.bank_name,
        receiptUrl: topUpRequest.receipt_url,
        status: topUpRequest.status,
        voucherCode: topUpRequest.voucher_code,
        rejectionReason: topUpRequest.rejection_reason,
        createdAt: topUpRequest.created_at,
        processedAt: topUpRequest.processed_at,
      },
    })
  } catch (error) {
    console.error("Get top-up request error:", error)
    return NextResponse.json({ error: "Failed to fetch request" }, { status: 500 })
  }
}
