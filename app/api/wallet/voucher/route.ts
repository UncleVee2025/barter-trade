import { type NextRequest, NextResponse } from "next/server"
import { verifyAuth } from "@/lib/auth"
import { queryOne, generateId, transaction } from "@/lib/db"
import { checkRateLimit, getClientIP, rateLimitConfigs, rateLimitExceededResponse } from "@/lib/rate-limit"

interface VoucherRow {
  id: string
  code: string
  amount: number
  type: string
  status: string
  expires_at: Date
}

interface UserWallet {
  id: string
  phone: string | null
  wallet_balance: number
}

// Validate voucher code format - must be exactly 10 numeric digits
function isValidVoucherFormat(code: string): boolean {
  return /^\d{10}$/.test(code)
}

// Sanitize voucher code input
function sanitizeVoucherCode(code: string): string {
  // Remove any non-numeric characters and limit to 10 digits
  return code.replace(/\D/g, "").slice(0, 10)
}

export async function POST(request: NextRequest) {
  try {
    // Rate limiting - 10 attempts per hour to prevent brute force
    const clientIP = getClientIP(request)
    const rateLimitResult = checkRateLimit(clientIP, rateLimitConfigs.voucher)
    
    if (!rateLimitResult.success) {
      return rateLimitExceededResponse(rateLimitResult)
    }

    const auth = await verifyAuth(request)
    if (!auth) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { code } = await request.json()

    if (!code || typeof code !== "string") {
      return NextResponse.json({ 
        error: "VOUCHER_CODE_REQUIRED",
        message: "Voucher code is required" 
      }, { status: 400 })
    }

    // Sanitize and validate the voucher code
    const sanitizedCode = sanitizeVoucherCode(code.trim())
    
    if (!isValidVoucherFormat(sanitizedCode)) {
      return NextResponse.json({ 
        error: "INVALID_FORMAT",
        message: "Invalid voucher code. Please enter a 10-digit numeric code." 
      }, { status: 400 })
    }



    // Find voucher in database
    const voucher = await queryOne<VoucherRow>(
      `SELECT id, code, amount, type, status, expires_at FROM vouchers WHERE code = ?`,
      [sanitizedCode]
    )

    if (!voucher) {
      return NextResponse.json({ 
        error: "VOUCHER_NOT_FOUND",
        message: "Invalid voucher code. This voucher does not exist." 
      }, { status: 404 })
    }

    if (voucher.status === "used") {
      return NextResponse.json({ 
        error: "VOUCHER_USED",
        message: "This voucher has already been used." 
      }, { status: 400 })
    }

    if (voucher.status === "disabled") {
      return NextResponse.json({ 
        error: "VOUCHER_DISABLED",
        message: "This voucher has been disabled and is no longer valid." 
      }, { status: 400 })
    }

    if (voucher.status === "expired" || new Date(voucher.expires_at) < new Date()) {
      return NextResponse.json({ 
        error: "VOUCHER_EXPIRED",
        message: "This voucher has expired." 
      }, { status: 400 })
    }

    // Valid statuses for redemption: "unused" or "exported" (exported to vendor but not yet used)
    const validStatuses = ["unused", "exported"]
    if (!validStatuses.includes(voucher.status)) {
      return NextResponse.json({ 
        error: "VOUCHER_UNAVAILABLE",
        message: `This voucher is not available for use. Current status: ${voucher.status}` 
      }, { status: 400 })
    }

    // Get user's current balance and phone
    const user = await queryOne<UserWallet>(
      `SELECT id, phone, wallet_balance FROM users WHERE id = ?`,
      [auth.userId]
    )

    if (!user) {
      return NextResponse.json({ 
        error: "USER_NOT_FOUND",
        message: "User not found" 
      }, { status: 404 })
    }

    const txId = generateId()
    const voucherAmount = Number(voucher.amount)
    const newBalance = Number(user.wallet_balance) + voucherAmount

    // Execute voucher redemption in a database transaction
    const result = await transaction(async (conn) => {
      // Update user's wallet balance
      await conn.execute(
        `UPDATE users SET wallet_balance = ?, updated_at = NOW() WHERE id = ?`,
        [newBalance, auth.userId]
      )

      // Mark voucher as used with user info
      await conn.execute(
        `UPDATE vouchers SET 
          status = 'used', 
          used_by = ?, 
          used_by_phone = ?,
          used_at = NOW(),
          redeemed_by = ?,
          redeemed_at = NOW()
        WHERE id = ?`,
        [auth.userId, user.phone || null, auth.userId, voucher.id]
      )

      // Create transaction record
      await conn.execute(
        `INSERT INTO transactions (id, user_id, type, amount, fee, balance_after, status, reference, description, created_at) 
         VALUES (?, ?, 'voucher', ?, 0, ?, 'completed', ?, ?, NOW())`,
        [txId, auth.userId, voucherAmount, newBalance, voucher.code, `Voucher redeemed: ${voucher.code}`]
      )

      // Create notification
      const notificationId = generateId()
      await conn.execute(
        `INSERT INTO notifications (id, user_id, type, title, message, data, created_at) 
         VALUES (?, ?, 'wallet', 'Top-up Successful', ?, ?, NOW())`,
        [notificationId, auth.userId, `N$${voucherAmount.toFixed(2)} has been added to your wallet`, JSON.stringify({ voucherCode: voucher.code, amount: voucherAmount })]
      )

      // Log activity
      await conn.execute(
        `INSERT INTO activity_log (id, user_id, action, entity_type, entity_id, details, created_at) 
         VALUES (?, ?, 'redeem_voucher', 'voucher', ?, ?, NOW())`,
        [generateId(), auth.userId, voucher.id, JSON.stringify({ code: voucher.code, amount: voucherAmount })]
      )

      return { txId, newBalance, voucherAmount }
    })

    return NextResponse.json({
      success: true,
      amount: result.voucherAmount,
      newBalance: result.newBalance,
      transaction: {
        id: result.txId,
        type: "voucher",
        amount: result.voucherAmount,
        status: "completed",
        createdAt: new Date().toISOString(),
      },
      message: `Top-up successful! N$${result.voucherAmount.toFixed(2)} added to your wallet.`,
    })
  } catch (error) {
    console.error("Voucher redemption error:", error)
    return NextResponse.json({ 
      error: "REDEMPTION_FAILED",
      message: "Voucher redemption failed. Please try again." 
    }, { status: 500 })
  }
}
