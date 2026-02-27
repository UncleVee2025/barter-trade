import { type NextRequest, NextResponse } from "next/server"
import { verifyAuth } from "@/lib/auth"
import { queryOne, query } from "@/lib/db"

interface UserWallet {
  wallet_balance: number
  name: string
}

interface TransactionRow {
  id: string
  type: string
  amount: number
  fee: number
  balance_after: number
  status: string
  description: string | null
  reference: string | null
  related_user_id: string | null
  related_user_name: string | null
  created_at: Date
}

export async function GET(request: NextRequest) {
  try {
    const auth = await verifyAuth(request)
    if (!auth) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get user wallet balance from database
    const user = await queryOne<UserWallet>(
      `SELECT wallet_balance, name FROM users WHERE id = ?`,
      [auth.userId]
    )

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    // Get recent transactions for the user from the transactions table
    const transactions = await query<TransactionRow>(
      `SELECT 
        t.id, 
        t.type, 
        t.amount, 
        t.fee, 
        t.balance_after, 
        t.status, 
        t.description,
        t.reference,
        t.related_user_id,
        u.name as related_user_name,
        t.created_at 
       FROM transactions t
       LEFT JOIN users u ON t.related_user_id = u.id
       WHERE t.user_id = ? 
       ORDER BY t.created_at DESC 
       LIMIT 10`,
      [auth.userId]
    )

    // Get pending balance (sum of pending transactions)
    const pendingResult = await queryOne<{ pending: number }>(
      `SELECT COALESCE(SUM(amount), 0) as pending 
       FROM transactions 
       WHERE user_id = ? AND status = 'pending'`,
      [auth.userId]
    )

    // Get total received this month
    const monthlyReceivedResult = await queryOne<{ total: number }>(
      `SELECT COALESCE(SUM(amount), 0) as total 
       FROM transactions 
       WHERE user_id = ? 
       AND type IN ('topup', 'transfer_in', 'voucher', 'trade') 
       AND status = 'completed'
       AND created_at >= DATE_FORMAT(NOW(), '%Y-%m-01')`,
      [auth.userId]
    )

    // Get total spent this month
    const monthlySpentResult = await queryOne<{ total: number }>(
      `SELECT COALESCE(SUM(amount), 0) as total 
       FROM transactions 
       WHERE user_id = ? 
       AND type IN ('transfer_out', 'listing_fee') 
       AND status = 'completed'
       AND created_at >= DATE_FORMAT(NOW(), '%Y-%m-01')`,
      [auth.userId]
    )

    return NextResponse.json({
      balance: Number(user.wallet_balance) || 0,
      pendingBalance: Number(pendingResult?.pending) || 0,
      currency: "NAD",
      monthlyStats: {
        received: Number(monthlyReceivedResult?.total) || 0,
        spent: Number(monthlySpentResult?.total) || 0,
      },
      recentTransactions: transactions.map(t => ({
        id: t.id,
        type: t.type,
        amount: Number(t.amount),
        fee: Number(t.fee),
        balanceAfter: Number(t.balance_after),
        status: t.status,
        description: t.description,
        reference: t.reference,
        relatedUser: t.related_user_id ? {
          id: t.related_user_id,
          name: t.related_user_name,
        } : null,
        createdAt: t.created_at,
      })),
    })
  } catch (error) {
    console.error("Wallet balance error:", error)
    return NextResponse.json({ error: "Failed to fetch balance" }, { status: 500 })
  }
}
