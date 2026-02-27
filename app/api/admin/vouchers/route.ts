import { type NextRequest, NextResponse } from "next/server"
import { verifyAuth } from "@/lib/auth"
import { query, queryOne, execute, generateId, transaction, isDemoMode, PoolConnection } from "@/lib/db"
import { VOUCHER_AMOUNTS } from "@/lib/types"

interface VoucherRow {
  id: string
  code: string
  amount: number
  type: string
  status: string
  vendor: string | null
  batch_id: string | null
  created_by: string
  creator_name: string | null
  creator_email: string | null
  used_by: string | null
  used_by_phone: string | null
  user_name: string | null
  user_email: string | null
  used_at: Date | null
  expires_at: Date
  created_at: Date
}

// Generate 10-digit numeric voucher code for easy entry
function generateVoucherCode(): string {
  const array = new Uint8Array(10)
  crypto.getRandomValues(array)
  
  let code = ""
  for (let i = 0; i < 10; i++) {
    code += (array[i] % 10).toString()
  }
  
  // Ensure the code doesn't start with 0
  if (code.charAt(0) === "0") {
    code = ((array[0] % 9) + 1).toString() + code.slice(1)
  }
  
  return code
}

// Validate voucher code format - must be exactly 10 numeric digits
function isValidVoucherCode(code: string): boolean {
  return /^\d{10}$/.test(code)
}

// GET - Fetch all vouchers with filtering
export async function GET(request: NextRequest) {
  try {
    const auth = await verifyAuth(request)
    if (!auth || auth.role !== "admin") {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 })
    }

    const searchParams = request.nextUrl.searchParams
    const status = searchParams.get("status")
    const type = searchParams.get("type")
    const vendor = searchParams.get("vendor")
    const page = Number.parseInt(searchParams.get("page") || "1")
    const limit = Number.parseInt(searchParams.get("limit") || "50")
    const search = searchParams.get("search")
    const offset = (page - 1) * limit

    // Build WHERE conditions separately - used for both count and data queries
    let whereConditions = "WHERE 1=1"
    const params: (string | number)[] = []

    if (status && status !== "all") {
      whereConditions += ` AND v.status = ?`
      params.push(status)
    }

    if (type && type !== "all") {
      whereConditions += ` AND v.type = ?`
      params.push(type)
    }

    if (vendor) {
      whereConditions += ` AND v.vendor LIKE ?`
      params.push(`%${vendor}%`)
    }

    if (search) {
      whereConditions += ` AND v.code LIKE ?`
      params.push(`%${search}%`)
    }

    // Clean, separate count query - no regex manipulation
    const countSql = `
      SELECT COUNT(*) as total 
      FROM vouchers v
      LEFT JOIN users creator ON v.created_by = creator.id
      LEFT JOIN users usr ON v.used_by = usr.id
      ${whereConditions}
    `
    const countResult = await query<{ total: number }>(countSql, params)
    const total = Number(countResult[0]?.total) || 0

    // Build the main data query
    let sql = `
      SELECT 
        v.id,
        v.code,
        v.amount,
        v.type,
        v.status,
        v.vendor,
        v.batch_id,
        v.created_by,
        creator.name as creator_name,
        creator.email as creator_email,
        v.used_by,
        v.used_by_phone,
        usr.name as user_name,
        usr.email as user_email,
        v.used_at,
        v.expires_at,
        v.created_at
      FROM vouchers v
      LEFT JOIN users creator ON v.created_by = creator.id
      LEFT JOIN users usr ON v.used_by = usr.id
      ${whereConditions}
    `

    sql += ` ORDER BY v.created_at DESC LIMIT ? OFFSET ?`
    // Clone params and add pagination
    const dataParams = [...params, limit, offset]

    const vouchers = await query<VoucherRow>(sql, dataParams)

    // Get stats
    const stats = await queryOne<{
      total: number
      unused: number
      used: number
      disabled: number
      expired: number
      total_value: number
      used_value: number
    }>(`
      SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN status = 'unused' THEN 1 ELSE 0 END) as unused,
        SUM(CASE WHEN status = 'used' THEN 1 ELSE 0 END) as used,
        SUM(CASE WHEN status = 'disabled' THEN 1 ELSE 0 END) as disabled,
        SUM(CASE WHEN status = 'expired' THEN 1 ELSE 0 END) as expired,
        COALESCE(SUM(CASE WHEN status = 'unused' THEN amount ELSE 0 END), 0) as total_value,
        COALESCE(SUM(CASE WHEN status = 'used' THEN amount ELSE 0 END), 0) as used_value
      FROM vouchers
    `)

    // Get unique vendors
    const vendorsResult = await query<{ vendor: string }>(
      `SELECT DISTINCT vendor FROM vouchers WHERE vendor IS NOT NULL ORDER BY vendor`
    )
    const vendors = vendorsResult.map(v => v.vendor)

    const transformedVouchers = vouchers.map((v) => ({
      id: v.id,
      code: v.code,
      amount: Number(v.amount),
      type: v.type,
      status: v.status,
      vendor: v.vendor,
      batchId: v.batch_id,
      createdBy: {
        id: v.created_by,
        name: v.creator_name,
        email: v.creator_email,
      },
      usedBy: v.used_by
        ? {
            id: v.used_by,
            phone: v.used_by_phone,
            name: v.user_name,
            email: v.user_email,
          }
        : null,
      usedAt: v.used_at,
      expiresAt: v.expires_at,
      createdAt: v.created_at,
    }))

    return NextResponse.json({
      vouchers: transformedVouchers,
      stats: {
        total: Number(stats?.total) || 0,
        unused: Number(stats?.unused) || 0,
        used: Number(stats?.used) || 0,
        disabled: Number(stats?.disabled) || 0,
        expired: Number(stats?.expired) || 0,
        totalValue: Number(stats?.total_value) || 0,
        usedValue: Number(stats?.used_value) || 0,
      },
      vendors,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasMore: offset + vouchers.length < total,
      },
    })
  } catch (error) {
    console.error("Fetch vouchers error:", error)
    return NextResponse.json({ error: "Failed to fetch vouchers" }, { status: 500 })
  }
}

// POST - Create new scratch card vouchers for vendors
export async function POST(request: NextRequest) {
  try {
    const auth = await verifyAuth(request)
    if (!auth || auth.role !== "admin") {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 })
    }

    const { amount, quantity = 1, vendor, expiryDays = 365 } = await request.json()

    // Validate amount is in allowed denominations (10, 20, 50, 100, 200)
    if (!VOUCHER_AMOUNTS.includes(amount)) {
      return NextResponse.json(
        { error: `Invalid voucher amount. Allowed amounts: ${VOUCHER_AMOUNTS.join(", ")}` },
        { status: 400 }
      )
    }

    if (quantity < 1 || quantity > 1000) {
      return NextResponse.json({ error: "Quantity must be between 1 and 1000" }, { status: 400 })
    }

    // Vendor is required for scratch card vouchers
    if (!vendor || vendor.trim() === "") {
      return NextResponse.json({ error: "Vendor name is required for scratch card vouchers" }, { status: 400 })
    }

    const expiresAt = new Date(Date.now() + expiryDays * 24 * 60 * 60 * 1000)
    const batchId = generateId()

    // MySQL transaction
    const newVouchers = await transaction(async (conn) => {
      const created: Array<{ id: string; code: string; amount: number; expiresAt: Date }> = []

      for (let i = 0; i < quantity; i++) {
        const voucherId = generateId()
        let code = generateVoucherCode()
        
        // Ensure code is unique
        let attempts = 0
        while (attempts < 10) {
          const existing = await queryOne<{ id: string }>(
            `SELECT id FROM vouchers WHERE code = ?`,
            [code]
          )
          if (!existing) break
          code = generateVoucherCode()
          attempts++
        }

        await conn.execute(
          `INSERT INTO vouchers (id, code, amount, type, status, vendor, batch_id, created_by, expires_at, created_at)
           VALUES (?, ?, ?, 'scratch', 'unused', ?, ?, ?, ?, NOW())`,
          [voucherId, code, amount, vendor.trim(), batchId, auth.userId, expiresAt]
        )

        created.push({ id: voucherId, code, amount, expiresAt })
      }

      // Log activity
      await conn.execute(
        `INSERT INTO activity_log (id, user_id, action, entity_type, details)
         VALUES (?, ?, 'create_voucher_batch', 'voucher', ?)`,
        [generateId(), auth.userId, JSON.stringify({ 
          batchId, 
          quantity, 
          amount, 
          vendor: vendor.trim(),
          totalValue: amount * quantity 
        })]
      )

      return created
    })

    return NextResponse.json({
      success: true,
      batchId,
      vouchers: newVouchers,
      summary: {
        quantity,
        amount,
        vendor: vendor.trim(),
        totalValue: amount * quantity,
      },
      message: `${quantity} voucher(s) created successfully for ${vendor}. Total value: N$${(amount * quantity).toLocaleString()}`,
    })
  } catch (error) {
    console.error("Create voucher error:", error)
    return NextResponse.json({ error: "Failed to create vouchers" }, { status: 500 })
  }
}

// DELETE - Disable a voucher (not delete - vouchers are never deleted)
export async function DELETE(request: NextRequest) {
  try {
    const auth = await verifyAuth(request)
    if (!auth || auth.role !== "admin") {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 })
    }

    const { voucherId } = await request.json()

    if (!voucherId) {
      return NextResponse.json({ error: "Voucher ID is required" }, { status: 400 })
    }

    const voucher = await queryOne<{ id: string; status: string; code: string }>(
      `SELECT id, status, code FROM vouchers WHERE id = ?`,
      [voucherId]
    )

    if (!voucher) {
      return NextResponse.json({ error: "Voucher not found" }, { status: 404 })
    }

    if (voucher.status === "used") {
      return NextResponse.json({ error: "Cannot disable a used voucher" }, { status: 400 })
    }

    await execute(
      `UPDATE vouchers SET status = 'disabled' WHERE id = ?`,
      [voucherId]
    )

    // Log activity
    await execute(
      `INSERT INTO activity_log (id, user_id, action, entity_type, entity_id, details)
       VALUES (?, ?, 'disable_voucher', 'voucher', ?, ?)`,
      [generateId(), auth.userId, voucherId, JSON.stringify({ code: voucher.code })]
    )

    return NextResponse.json({
      success: true,
      message: "Voucher disabled successfully",
    })
  } catch (error) {
    console.error("Disable voucher error:", error)
    return NextResponse.json({ error: "Failed to disable voucher" }, { status: 500 })
  }
}
