import { type NextRequest, NextResponse } from "next/server"
import { verifyAuth } from "@/lib/auth"
import { queryOne, execute, generateId, transaction } from "@/lib/db"
import type { PoolConnection } from "mysql2/promise"

interface UserWallet {
  id: string
  wallet_balance: number
}

export async function POST(request: NextRequest) {
  try {
    const auth = await verifyAuth(request)
    if (!auth) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { amount, paymentMethod, paymentReference } = await request.json()

    if (!amount || amount < 10 || amount > 10000) {
      return NextResponse.json({ error: "Amount must be between N$10 and N$10,000" }, { status: 400 })
    }

    if (!paymentMethod) {
      return NextResponse.json({ error: "Payment method is required" }, { status: 400 })
    }

    // Get user's current balance
    const user = await queryOne<UserWallet>(
      `SELECT id, wallet_balance FROM users WHERE id = ?`,
      [auth.userId]
    )

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    // Execute top-up in a transaction
    const result = await transaction(async (conn: PoolConnection) => {
      const txId = generateId()
      const newBalance = Number(user.wallet_balance) + amount

      // Update user's wallet balance
      await conn.execute(
        `UPDATE users SET wallet_balance = ? WHERE id = ?`,
        [newBalance, auth.userId]
      )

      // Create transaction record
      await conn.execute(
        `INSERT INTO transactions (id, user_id, type, amount, fee, balance_after, status, reference, description, metadata) 
         VALUES (?, ?, 'topup', ?, 0, ?, 'completed', ?, ?, ?)`,
        [
          txId, 
          auth.userId, 
          amount, 
          newBalance, 
          paymentReference || `TOPUP-${Date.now()}`,
          `Wallet top-up via ${paymentMethod === 'card' ? 'Card/PayPal' : paymentMethod === 'mobile' ? 'Mobile Money' : paymentMethod}`,
          JSON.stringify({ paymentMethod, reference: paymentReference })
        ]
      )

      // Log activity
      await conn.execute(
        `INSERT INTO activity_log (id, user_id, action, entity_type, entity_id, details) 
         VALUES (?, ?, 'wallet_topup', 'transaction', ?, ?)`,
        [generateId(), auth.userId, txId, JSON.stringify({ amount, paymentMethod })]
      )

      return { txId, newBalance }
    })

    return NextResponse.json({
      success: true,
      transaction: {
        id: result.txId,
        type: "topup",
        amount,
        status: "completed",
        paymentMethod,
        createdAt: new Date().toISOString(),
      },
      newBalance: result.newBalance,
      message: `N$${amount.toFixed(2)} added to your wallet`,
    })
  } catch (error) {
    console.error("Top-up error:", error)
    return NextResponse.json({ error: "Top-up failed. Please try again." }, { status: 500 })
  }
}
