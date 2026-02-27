import { type NextRequest, NextResponse } from "next/server"
import { verifyAuth } from "@/lib/auth"
import { query, queryOne, execute, generateId } from "@/lib/db"
import { MOBILE_MONEY_BANKS, VOUCHER_AMOUNTS } from "@/lib/types"

interface TopUpRequestRow {
  id: string
  user_id: string
  user_name: string
  user_email: string
  amount: number
  bank: string
  bank_name: string
  receipt_url: string
  status: string
  voucher_code: string | null
  rejection_reason: string | null
  created_at: Date
  processed_at: Date | null
  processed_by: string | null
}

// POST - Create a new mobile money top-up request
export async function POST(request: NextRequest) {
  try {
    const auth = await verifyAuth(request)
    if (!auth) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { amount, bank, receiptUrl } = await request.json()

    // Validate amount
    if (!VOUCHER_AMOUNTS.includes(amount)) {
      return NextResponse.json(
        { error: `Invalid amount. Allowed amounts: N$${VOUCHER_AMOUNTS.join(", N$")}` },
        { status: 400 }
      )
    }

    // Validate bank
    const bankInfo = MOBILE_MONEY_BANKS.find(b => b.id === bank)
    if (!bankInfo) {
      return NextResponse.json({ error: "Invalid bank selected" }, { status: 400 })
    }

    // Validate receipt
    if (!receiptUrl || typeof receiptUrl !== "string") {
      return NextResponse.json({ error: "Receipt image is required" }, { status: 400 })
    }

    const requestId = generateId()

    // MySQL handling
    await execute(
      `INSERT INTO topup_requests (id, user_id, amount, bank, bank_name, receipt_url, status, created_at)
       VALUES (?, ?, ?, ?, ?, ?, 'pending', NOW())`,
      [requestId, auth.userId, amount, bank, `${bankInfo.name} - ${bankInfo.service}`, receiptUrl]
    )

    // Create notification for admins
await execute(
  `INSERT INTO notifications (user_id, type, title, message, data, created_at)
   SELECT id, 'wallet', 'New Top-up Request', ?, ?, NOW()
   FROM users WHERE role = 'admin'`,
  [
    `New mobile money top-up request for N$${amount} via ${bankInfo.name}`,
    JSON.stringify({ requestId, amount, bank })
  ]
)



    return NextResponse.json({
      success: true,
      request: {
        id: requestId,
        amount,
        bank: bankInfo.name,
        service: bankInfo.service,
        status: "pending",
        createdAt: new Date().toISOString(),
      },
      message: "Top-up request submitted successfully. Please wait for admin approval.",
    })
  } catch (error) {
    console.error("Mobile money request error:", error)
    return NextResponse.json({ error: "Failed to submit top-up request" }, { status: 500 })
  }
}

// GET - Get user's top-up requests or all requests for admin
export async function GET(request: NextRequest) {
  try {
    const auth = await verifyAuth(request)
    if (!auth) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const searchParams = request.nextUrl.searchParams
    const status = searchParams.get("status")
    const isAdmin = auth.role === "admin"

    // MySQL handling
    let sql = `
      SELECT 
        r.id, r.user_id, u.name as user_name, u.email as user_email,
        r.amount, r.bank, r.bank_name, r.receipt_url, r.status,
        r.voucher_code, r.rejection_reason, r.created_at, r.processed_at
      FROM topup_requests r
      JOIN users u ON r.user_id = u.id
      WHERE 1=1
    `
    const params: (string | number)[] = []

    if (!isAdmin) {
      sql += ` AND r.user_id = ?`
      params.push(auth.userId)
    }

    if (status && status !== "all") {
      sql += ` AND r.status = ?`
      params.push(status)
    }

    sql += ` ORDER BY r.created_at DESC LIMIT 100`

    const requests = await query<TopUpRequestRow>(sql, params)

    const stats = await queryOne<{ pending: number; approved: number; rejected: number }>(`
      SELECT 
        SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending,
        SUM(CASE WHEN status = 'approved' THEN 1 ELSE 0 END) as approved,
        SUM(CASE WHEN status = 'rejected' THEN 1 ELSE 0 END) as rejected
      FROM topup_requests
      ${!isAdmin ? 'WHERE user_id = ?' : ''}
    `, !isAdmin ? [auth.userId] : [])

    return NextResponse.json({
      requests: requests.map(r => ({
        id: r.id,
        userId: r.user_id,
        userName: r.user_name,
        userEmail: r.user_email,
        amount: Number(r.amount),
        bank: r.bank,
        bankName: r.bank_name,
        receiptUrl: r.receipt_url,
        status: r.status,
        voucherCode: r.voucher_code,
        rejectionReason: r.rejection_reason,
        createdAt: r.created_at,
        processedAt: r.processed_at,
      })),
      stats: {
        pending: Number(stats?.pending) || 0,
        approved: Number(stats?.approved) || 0,
        rejected: Number(stats?.rejected) || 0,
      },
    })
  } catch (error) {
    console.error("Get top-up requests error:", error)
    return NextResponse.json({ error: "Failed to fetch top-up requests" }, { status: 500 })
  }
}
