import { type NextRequest, NextResponse } from "next/server"
import { verifyAuth } from "@/lib/auth"
import { TRANSFER_FEE_PERCENTAGE } from "@/lib/types"
import { queryOne, generateId, transaction } from "@/lib/db"
import { checkRateLimit, getClientIP, rateLimitConfigs, rateLimitExceededResponse } from "@/lib/rate-limit"

interface UserWallet {
  id: string
  name: string
  wallet_balance: number
  phone: string | null
}

export async function POST(request: NextRequest) {
  try {
    // Rate limiting - 20 transfers per hour
    const clientIP = getClientIP(request)
    const rateLimitResult = checkRateLimit(clientIP, rateLimitConfigs.transfer)
    
    if (!rateLimitResult.success) {
      return rateLimitExceededResponse(rateLimitResult)
    }

    const auth = await verifyAuth(request)
    if (!auth) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { recipientPhone, recipientEmail, amount, note } = await request.json()

    if ((!recipientPhone && !recipientEmail) || !amount || amount <= 0) {
      return NextResponse.json({ error: "Invalid transfer details. Provide recipient phone or email and a valid amount." }, { status: 400 })
    }

    if (amount < 5) {
      return NextResponse.json({ error: "Minimum transfer amount is N$5" }, { status: 400 })
    }

    if (amount > 10000) {
      return NextResponse.json({ error: "Maximum transfer amount is N$10,000" }, { status: 400 })
    }

    // Get sender's wallet balance
    const sender = await queryOne<UserWallet>(
      `SELECT id, name, wallet_balance, phone FROM users WHERE id = ?`,
      [auth.userId]
    )

    if (!sender) {
      return NextResponse.json({ error: "Sender account not found" }, { status: 404 })
    }

    // Calculate fee (5% from the transfer amount)
    const fee = Math.round(amount * TRANSFER_FEE_PERCENTAGE * 100) / 100
    const recipientAmount = amount - fee

    if (Number(sender.wallet_balance) < amount) {
      return NextResponse.json({ error: "Insufficient balance" }, { status: 400 })
    }

    // Find recipient by phone or email
    let recipientQuery = ``
    let recipientParam = ``
    if (recipientPhone) {
      recipientQuery = `SELECT id, name, wallet_balance, phone, email FROM users WHERE phone = ?`
      recipientParam = recipientPhone
    } else if (recipientEmail) {
      recipientQuery = `SELECT id, name, wallet_balance, phone, email FROM users WHERE email = ?`
      recipientParam = recipientEmail
    }

    const recipient = await queryOne<UserWallet & { email: string }>(recipientQuery, [recipientParam])

    if (!recipient) {
      return NextResponse.json({ error: "Recipient not found. Please check the phone number or email." }, { status: 404 })
    }

    if (recipient.id === auth.userId) {
      return NextResponse.json({ error: "Cannot transfer to yourself" }, { status: 400 })
    }

    // Execute transfer in a transaction
    const result = await transaction(async (conn) => {
      const transferId = generateId()
      const senderTxId = generateId()
      const recipientTxId = generateId()

      // Calculate new balances
      const senderNewBalance = Number(sender.wallet_balance) - amount
      const recipientNewBalance = Number(recipient.wallet_balance) + recipientAmount

      // Deduct from sender
      await conn.execute(
        `UPDATE users SET wallet_balance = ? WHERE id = ?`,
        [senderNewBalance, auth.userId]
      )

      // Credit recipient (minus fee)
      await conn.execute(
        `UPDATE users SET wallet_balance = ? WHERE id = ?`,
        [recipientNewBalance, recipient.id]
      )

      // Create transaction record for sender (debit)
      await conn.execute(
        `INSERT INTO transactions (id, user_id, type, amount, fee, balance_after, status, reference, description, related_user_id) 
         VALUES (?, ?, 'transfer_out', ?, ?, ?, 'completed', ?, ?, ?)`,
        [senderTxId, auth.userId, amount, fee, senderNewBalance, transferId, note || `Transfer to ${recipient.name}`, recipient.id]
      )

      // Create transaction record for recipient (credit)
      await conn.execute(
        `INSERT INTO transactions (id, user_id, type, amount, fee, balance_after, status, reference, description, related_user_id) 
         VALUES (?, ?, 'transfer_in', ?, 0, ?, 'completed', ?, ?, ?)`,
        [recipientTxId, recipient.id, recipientAmount, recipientNewBalance, transferId, note || `Transfer from ${sender.name}`, auth.userId]
      )

      // Create notifications
      const notificationId = generateId()
      await conn.execute(
        `INSERT INTO notifications (id, user_id, type, title, message, data) 
         VALUES (?, ?, 'wallet', 'Money Received', ?, ?)`,
        [notificationId, recipient.id, `You received N$${recipientAmount.toFixed(2)} from ${sender.name}`, JSON.stringify({ amount: recipientAmount, senderId: auth.userId })]
      )

      // Log activity
      await conn.execute(
        `INSERT INTO activity_log (id, user_id, action, entity_type, entity_id, details) 
         VALUES (?, ?, 'wallet_transfer', 'transaction', ?, ?)`,
        [generateId(), auth.userId, senderTxId, JSON.stringify({ amount, fee, recipientId: recipient.id })]
      )

      return {
        transferId,
        senderNewBalance,
        recipientAmount,
        recipientName: recipient.name,
      }
    })

    return NextResponse.json({
      success: true,
      transaction: {
        id: result.transferId,
        type: "transfer_out",
        amount,
        fee,
        recipientAmount: result.recipientAmount,
        recipientName: result.recipientName,
        status: "completed",
        createdAt: new Date().toISOString(),
      },
      newBalance: result.senderNewBalance,
      message: `N$${result.recipientAmount.toFixed(2)} sent to ${result.recipientName} successfully (N$${fee.toFixed(2)} fee)`,
    })
  } catch (error) {
    console.error("Transfer error:", error)
    return NextResponse.json({ error: "Transfer failed. Please try again." }, { status: 500 })
  }
}
