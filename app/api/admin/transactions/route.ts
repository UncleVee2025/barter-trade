import { type NextRequest, NextResponse } from "next/server"
import { verifyAuth } from "@/lib/auth"
import { query, queryOne, execute, generateId, isDemoMode, transaction } from "@/lib/db"

// GET - Fetch all transactions with filters
export async function GET(request: NextRequest) {
  try {
    const auth = await verifyAuth(request)
    if (!auth || auth.role !== "admin") {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 })
    }

    const searchParams = request.nextUrl.searchParams
    const type = searchParams.get("type")
    const status = searchParams.get("status")
    const page = Number.parseInt(searchParams.get("page") || "1")
    const limit = Number.parseInt(searchParams.get("limit") || "50")
    const search = searchParams.get("search")
    const offset = (page - 1) * limit

    // Build WHERE conditions separately - used for both count and data queries
    let whereConditions = "WHERE 1=1"
    const params: (string | number)[] = []

    if (type && type !== "all") {
      whereConditions += ` AND t.type = ?`
      params.push(type)
    }

    if (status && status !== "all") {
      whereConditions += ` AND t.status = ?`
      params.push(status)
    }

    if (search) {
      whereConditions += ` AND (u.name LIKE ? OR u.email LIKE ? OR t.reference LIKE ?)`
      params.push(`%${search}%`, `%${search}%`, `%${search}%`)
    }

    // Clean, separate count query - no regex manipulation
    const countSql = `
      SELECT COUNT(*) as total 
      FROM transactions t
      LEFT JOIN users u ON t.user_id = u.id
      LEFT JOIN users ru ON t.related_user_id = ru.id
      ${whereConditions}
    `
    const countResult = await query<{ total: number }>(countSql, params)
    const total = Number(countResult[0]?.total) || 0

    // Build the main data query
    let sql = `
      SELECT 
        t.*,
        u.name as user_name,
        u.email as user_email,
        ru.name as related_user_name
      FROM transactions t
      LEFT JOIN users u ON t.user_id = u.id
      LEFT JOIN users ru ON t.related_user_id = ru.id
      ${whereConditions}
    `

    sql += ` ORDER BY t.created_at DESC LIMIT ? OFFSET ?`
    // Clone params and add pagination
    const dataParams = [...params, limit, offset]

    const transactions = await query<Record<string, unknown>>(sql, dataParams)

    // Get stats
    const stats = await queryOne<{
      total: number
      total_volume: number
      total_fees: number
      pending: number
      completed: number
      failed: number
    }>(`
      SELECT 
        COUNT(*) as total,
        COALESCE(SUM(CASE WHEN status = 'completed' THEN amount ELSE 0 END), 0) as total_volume,
        COALESCE(SUM(fee), 0) as total_fees,
        SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending,
        SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed,
        SUM(CASE WHEN status = 'failed' THEN 1 ELSE 0 END) as failed
      FROM transactions
    `)

    return NextResponse.json({
      transactions: transactions.map(t => ({
        id: t.id,
        userId: t.user_id,
        userName: t.user_name,
        userEmail: t.user_email,
        type: t.type,
        amount: Number(t.amount),
        fee: Number(t.fee),
        balanceAfter: Number(t.balance_after),
        status: t.status,
        reference: t.reference,
        description: t.description,
        relatedUserId: t.related_user_id,
        relatedUserName: t.related_user_name,
        createdAt: t.created_at,
      })),
      stats: {
        total: Number(stats?.total) || 0,
        totalVolume: Number(stats?.total_volume) || 0,
        totalFees: Number(stats?.total_fees) || 0,
        pending: Number(stats?.pending) || 0,
        completed: Number(stats?.completed) || 0,
        failed: Number(stats?.failed) || 0,
      },
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasMore: offset + transactions.length < total,
      },
    })
  } catch (error) {
    console.error("Fetch transactions error:", error)
    return NextResponse.json({ error: "Failed to fetch transactions" }, { status: 500 })
  }
}

// POST - Process manual transaction (admin only) with atomic database transaction
export async function POST(request: NextRequest) {
  try {
    const auth = await verifyAuth(request)
    if (!auth || auth.role !== "admin") {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 })
    }

    const body = await request.json()
    const { userId, type, amount, description } = body

    if (!userId || !type || amount === undefined || amount === null) {
      return NextResponse.json(
        { error: "User ID, type, and amount are required" },
        { status: 400 }
      )
    }

    const numericAmount = Number(amount)
    if (isNaN(numericAmount) || numericAmount === 0) {
      return NextResponse.json(
        { error: "Amount must be a valid non-zero number" },
        { status: 400 }
      )
    }

    if (!["topup", "refund", "adjustment", "deduction"].includes(type)) {
      return NextResponse.json(
        { error: "Invalid transaction type. Allowed: topup, refund, adjustment, deduction" },
        { status: 400 }
      )
    }

    // Get current user balance first to validate
    const user = await queryOne<{ wallet_balance: number; name: string }>(
      `SELECT wallet_balance, name FROM users WHERE id = ?`,
      [userId]
    )

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    const currentBalance = Number(user.wallet_balance) || 0
    const newBalance = currentBalance + numericAmount

    // Prevent negative balance for deductions
    if (newBalance < 0) {
      return NextResponse.json(
        { error: `Insufficient balance. User has N$${currentBalance.toFixed(2)} but you are trying to deduct N$${Math.abs(numericAmount).toFixed(2)}` },
        { status: 400 }
      )
    }

    const txId = generateId()

    // Use database transaction for atomicity - all operations succeed or all fail
    const { transaction: dbTransaction } = await import("@/lib/db")
    
    const result = await dbTransaction(async (conn) => {
      // Update user balance
      await conn.execute(
        `UPDATE users SET wallet_balance = ?, updated_at = NOW() WHERE id = ?`,
        [newBalance, userId]
      )

      // Verify the update was successful
      const [rows] = await conn.execute(
        `SELECT wallet_balance FROM users WHERE id = ?`,
        [userId]
      ) as [Array<{ wallet_balance: number }>, unknown]
      
      const updatedBalance = Number(rows[0]?.wallet_balance)
      if (Math.abs(updatedBalance - newBalance) > 0.01) {
        throw new Error("Balance update verification failed")
      }

      // Create transaction record
      await conn.execute(
        `INSERT INTO transactions 
         (id, user_id, type, amount, fee, balance_after, status, reference, description, related_user_id, created_at)
         VALUES (?, ?, ?, ?, 0, ?, 'completed', ?, ?, ?, NOW())`,
        [
          txId,
          userId,
          type,
          Math.abs(numericAmount),
          newBalance,
          `ADMIN-${Date.now()}`,
          description || `Admin ${type}: ${numericAmount >= 0 ? '+' : ''}N$${numericAmount.toFixed(2)}`,
          auth.userId,
        ]
      )

      // Create notification for the user
      await conn.execute(
        `INSERT INTO notifications (id, user_id, type, title, message, data, created_at)
         VALUES (?, ?, 'wallet', ?, ?, ?, NOW())`,
        [
          generateId(),
          userId,
          numericAmount >= 0 ? "Wallet Credit" : "Wallet Debit",
          numericAmount >= 0 
            ? `N$${numericAmount.toFixed(2)} has been added to your wallet by admin.`
            : `N$${Math.abs(numericAmount).toFixed(2)} has been deducted from your wallet by admin.`,
          JSON.stringify({ amount: numericAmount, type, adminId: auth.userId }),
        ]
      )

      // Log activity
      await conn.execute(
        `INSERT INTO activity_log (id, user_id, action, entity_type, entity_id, details, created_at)
         VALUES (?, ?, ?, 'transaction', ?, ?, NOW())`,
        [
          generateId(),
          auth.userId,
          `admin_wallet_${type}`,
          txId,
          JSON.stringify({ userId, userName: user.name, amount: numericAmount, type, previousBalance: currentBalance, newBalance }),
        ]
      )

      return { txId, newBalance, previousBalance: currentBalance }
    })

    return NextResponse.json({
      success: true,
      transactionId: result.txId,
      previousBalance: result.previousBalance,
      newBalance: result.newBalance,
      adjustment: numericAmount,
      message: `Wallet ${numericAmount >= 0 ? 'credited' : 'debited'} successfully. ${numericAmount >= 0 ? '+' : ''}N$${numericAmount.toFixed(2)} (New balance: N$${result.newBalance.toFixed(2)})`,
    })
  } catch (error) {
    console.error("Process transaction error:", error)
    const message = error instanceof Error ? error.message : "Failed to process transaction"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
