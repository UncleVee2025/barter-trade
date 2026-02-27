import { type NextRequest, NextResponse } from "next/server"
import { verifyAuth } from "@/lib/auth"
import { query } from "@/lib/db"
import { isDemoMode } from "@/lib/utils" // Declare or import the isDemoMode function

interface VoucherSearchResult {
  id: string
  code: string
  amount: number
  type: string
  status: string
  vendor: string | null
  batchId: string | null
  createdBy: string | null
  createdAt: string
  usedBy: string | null
  usedByPhone: string | null
  usedByName: string | null
  usedByEmail: string | null
  usedAt: string | null
  expiresAt: string
}

// GET - Search vouchers for support/disputes
// Can search by voucher code or user mobile number
export async function GET(request: NextRequest) {
  try {
    const auth = await verifyAuth(request)
    if (!auth || auth.role !== "admin") {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 })
    }

    const searchParams = request.nextUrl.searchParams
    const voucherCode = searchParams.get("voucherCode")
    const userMobile = searchParams.get("userMobile")

    if (!voucherCode && !userMobile) {
      return NextResponse.json({ 
        error: "Please provide either a voucher code or user mobile number" 
      }, { status: 400 })
    }

    // MySQL query
    let sql = `
      SELECT 
        v.id,
        v.code,
        v.amount,
        v.type,
        v.status,
        v.vendor,
        v.batch_id,
        creator.name as created_by_name,
        v.created_at,
        v.used_by,
        v.used_by_phone,
        u.name as used_by_name,
        u.email as used_by_email,
        v.used_at,
        v.expires_at
      FROM vouchers v
      LEFT JOIN users creator ON v.created_by = creator.id
      LEFT JOIN users u ON v.used_by = u.id
      WHERE 1=1
    `
    const params: string[] = []

    if (voucherCode) {
      const sanitizedCode = voucherCode.replace(/\D/g, "").slice(0, 10)
      sql += ` AND v.code = ?`
      params.push(sanitizedCode)
    }

    if (userMobile) {
      const sanitizedPhone = userMobile.replace(/\D/g, "")
      sql += ` AND v.used_by_phone LIKE ?`
      params.push(`%${sanitizedPhone}%`)
    }

    sql += ` ORDER BY v.created_at DESC LIMIT 100`

    const vouchers = await query<{
      id: string
      code: string
      amount: number
      type: string
      status: string
      vendor: string | null
      batch_id: string | null
      created_by_name: string | null
      created_at: Date
      used_by: string | null
      used_by_phone: string | null
      used_by_name: string | null
      used_by_email: string | null
      used_at: Date | null
      expires_at: Date
    }>(sql, params)

    const results: VoucherSearchResult[] = vouchers.map(v => ({
      id: v.id,
      code: v.code,
      amount: Number(v.amount),
      type: v.type,
      status: v.status,
      vendor: v.vendor,
      batchId: v.batch_id,
      createdBy: v.created_by_name,
      createdAt: v.created_at.toISOString(),
      usedBy: v.used_by,
      usedByPhone: v.used_by_phone,
      usedByName: v.used_by_name,
      usedByEmail: v.used_by_email,
      usedAt: v.used_at?.toISOString() || null,
      expiresAt: v.expires_at.toISOString(),
    }))

    return NextResponse.json({
      results,
      count: results.length,
      searchParams: {
        voucherCode: voucherCode || null,
        userMobile: userMobile || null,
      },
    })
  } catch (error) {
    console.error("Support voucher search error:", error)
    return NextResponse.json({ error: "Search failed" }, { status: 500 })
  }
}
