import { type NextRequest, NextResponse } from "next/server"
import { verifyAuth } from "@/lib/auth"
import { query, queryOne } from "@/lib/db"

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
  related_listing_id: string | null
  related_listing_title: string | null
  metadata: string | null
  created_at: Date
}

export async function GET(request: NextRequest) {
  try {
    const auth = await verifyAuth(request)
    if (!auth) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const searchParams = request.nextUrl.searchParams
    const page = Number.parseInt(searchParams.get("page") || "1")
    const limit = Number.parseInt(searchParams.get("limit") || "20")
    const type = searchParams.get("type") // topup, transfer_in, transfer_out, listing_fee, voucher, trade, refund
    const status = searchParams.get("status") // pending, completed, failed, refunded
    const startDate = searchParams.get("startDate")
    const endDate = searchParams.get("endDate")
    const sort = searchParams.get("sort") || "newest"
    const offset = (page - 1) * limit

    let sql = `
      SELECT 
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
        t.related_listing_id,
        l.title as related_listing_title,
        t.metadata,
        t.created_at
      FROM transactions t
      LEFT JOIN users u ON t.related_user_id = u.id
      LEFT JOIN listings l ON t.related_listing_id = l.id
      WHERE t.user_id = ?
    `
    const params: (string | number)[] = [auth.userId]

    if (type && type !== "all") {
      sql += ` AND t.type = ?`
      params.push(type)
    }

    if (status && status !== "all") {
      sql += ` AND t.status = ?`
      params.push(status)
    }

    if (startDate) {
      sql += ` AND t.created_at >= ?`
      params.push(startDate)
    }

    if (endDate) {
      sql += ` AND t.created_at <= ?`
      params.push(`${endDate} 23:59:59`)
    }

    // Count total
    const countSql = sql.replace(/SELECT[\s\S]*?FROM/, "SELECT COUNT(*) as total FROM")
    const countResult = await query<{ total: number }>(countSql, params)
    const total = countResult[0]?.total || 0

    // Sorting
    switch (sort) {
      case "oldest":
        sql += ` ORDER BY t.created_at ASC`
        break
      case "amount_high":
        sql += ` ORDER BY t.amount DESC`
        break
      case "amount_low":
        sql += ` ORDER BY t.amount ASC`
        break
      default:
        sql += ` ORDER BY t.created_at DESC`
    }

    sql += ` LIMIT ? OFFSET ?`
    params.push(limit, offset)

    const transactions = await query<TransactionRow>(sql, params)

    // Get summary stats
    const summaryStats = await queryOne<{
      total_received: number
      total_spent: number
      total_fees: number
    }>(
      `SELECT 
        COALESCE(SUM(CASE WHEN type IN ('topup', 'transfer_in', 'voucher', 'trade', 'refund') AND status = 'completed' THEN amount ELSE 0 END), 0) as total_received,
        COALESCE(SUM(CASE WHEN type IN ('transfer_out', 'listing_fee') AND status = 'completed' THEN amount ELSE 0 END), 0) as total_spent,
        COALESCE(SUM(CASE WHEN status = 'completed' THEN fee ELSE 0 END), 0) as total_fees
      FROM transactions WHERE user_id = ?`,
      [auth.userId]
    )

    const transformedTransactions = transactions.map((t) => ({
      id: t.id,
      type: t.type,
      amount: Number(t.amount),
      fee: Number(t.fee),
      balanceAfter: Number(t.balance_after),
      status: t.status,
      description: t.description,
      reference: t.reference,
      relatedUser: t.related_user_id
        ? {
            id: t.related_user_id,
            name: t.related_user_name,
          }
        : null,
      relatedListing: t.related_listing_id
        ? {
            id: t.related_listing_id,
            title: t.related_listing_title,
          }
        : null,
      metadata: t.metadata ? JSON.parse(t.metadata) : null,
      createdAt: t.created_at,
    }))

    return NextResponse.json({
      transactions: transformedTransactions,
      summary: {
        totalReceived: Number(summaryStats?.total_received) || 0,
        totalSpent: Number(summaryStats?.total_spent) || 0,
        totalFees: Number(summaryStats?.total_fees) || 0,
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
    console.error("Wallet transactions error:", error)
    return NextResponse.json(
      { error: "Failed to fetch transactions" },
      { status: 500 }
    )
  }
}
