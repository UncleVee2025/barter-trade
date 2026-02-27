import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db'
import { verifyToken } from '@/lib/auth'
import { v4 as uuidv4 } from 'uuid'

// POST - Transfer credits via QR code
export async function POST(request: NextRequest) {
  try {
    const token = request.cookies.get('token')?.value
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const decoded = await verifyToken(token)
    if (!decoded || !decoded.userId) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
    }

    const senderId = decoded.userId
    const body = await request.json()
    const { qr_code, amount, note } = body

    // Validate input
    if (!qr_code) {
      return NextResponse.json({ error: 'QR code is required' }, { status: 400 })
    }

    const transferAmount = parseFloat(amount)
    if (isNaN(transferAmount) || transferAmount <= 0) {
      return NextResponse.json({ error: 'Invalid amount' }, { status: 400 })
    }

    if (transferAmount < 1) {
      return NextResponse.json({ error: 'Minimum transfer is N$1' }, { status: 400 })
    }

    if (transferAmount > 10000) {
      return NextResponse.json({ error: 'Maximum single transfer is N$10,000' }, { status: 400 })
    }

    // Find recipient by QR code
    const recipients = await query(
      `SELECT uc.user_id, u.name, u.email
       FROM user_certification uc
       JOIN users u ON uc.user_id = u.id
       WHERE uc.qr_code_data = ? AND uc.is_certified = TRUE`,
      [qr_code]
    )

    if (recipients.length === 0) {
      return NextResponse.json({ error: 'Invalid QR code or user not certified' }, { status: 404 })
    }

    const recipientId = recipients[0].user_id
    const recipientName = recipients[0].name

    // Prevent self-transfer
    if (senderId === recipientId) {
      return NextResponse.json({ error: 'Cannot transfer to yourself' }, { status: 400 })
    }

    // Get sender's balance
    const senderWallet = await query(
      'SELECT balance FROM wallets WHERE user_id = ?',
      [senderId]
    )

    if (senderWallet.length === 0) {
      return NextResponse.json({ error: 'Wallet not found' }, { status: 404 })
    }

    const senderBalance = parseFloat(senderWallet[0].balance)
    if (senderBalance < transferAmount) {
      return NextResponse.json({ 
        error: 'Insufficient balance',
        current_balance: senderBalance,
        required: transferAmount
      }, { status: 400 })
    }

    // Ensure recipient has a wallet
    const recipientWallet = await query(
      'SELECT id FROM wallets WHERE user_id = ?',
      [recipientId]
    )

    if (recipientWallet.length === 0) {
      // Create wallet for recipient
      await query(
        'INSERT INTO wallets (id, user_id, balance, created_at) VALUES (?, ?, 0, NOW())',
        [uuidv4(), recipientId]
      )
    }

    // Perform the transfer (transaction)
    const transactionId = uuidv4()
    const senderTxId = uuidv4()
    const recipientTxId = uuidv4()

    // Deduct from sender
    await query(
      'UPDATE wallets SET balance = balance - ?, updated_at = NOW() WHERE user_id = ?',
      [transferAmount, senderId]
    )

    // Add to recipient
    await query(
      'UPDATE wallets SET balance = balance + ?, updated_at = NOW() WHERE user_id = ?',
      [transferAmount, recipientId]
    )

    // Record sender's transaction
    await query(
      `INSERT INTO wallet_transactions 
        (id, user_id, type, amount, balance_after, description, reference_id, status, created_at)
       VALUES (?, ?, 'transfer_out', ?, 
        (SELECT balance FROM wallets WHERE user_id = ?),
        ?, ?, 'completed', NOW())`,
      [senderTxId, senderId, -transferAmount, senderId, 
       `QR Transfer to ${recipientName}${note ? `: ${note}` : ''}`, transactionId]
    )

    // Record recipient's transaction
    await query(
      `INSERT INTO wallet_transactions 
        (id, user_id, type, amount, balance_after, description, reference_id, status, created_at)
       VALUES (?, ?, 'transfer_in', ?, 
        (SELECT balance FROM wallets WHERE user_id = ?),
        ?, ?, 'completed', NOW())`,
      [recipientTxId, recipientId, transferAmount, recipientId,
       `QR Transfer received${note ? `: ${note}` : ''}`, transactionId]
    )

    // Create notification for recipient
    await query(
      `INSERT INTO notifications (id, user_id, type, title, message, data, created_at)
       VALUES (?, ?, 'wallet_transfer', 'Credits Received', ?, ?, NOW())`,
      [uuidv4(), recipientId, 
       `You received N$${transferAmount.toFixed(2)} via QR transfer`,
       JSON.stringify({ amount: transferAmount, sender_id: senderId, transaction_id: transactionId })]
    ).catch(() => {})

    // Get updated balances
    const updatedSender = await query(
      'SELECT balance FROM wallets WHERE user_id = ?',
      [senderId]
    )

    return NextResponse.json({
      success: true,
      message: `Successfully transferred N$${transferAmount.toFixed(2)} to ${recipientName}`,
      transaction: {
        id: transactionId,
        amount: transferAmount,
        recipient_name: recipientName,
        timestamp: new Date().toISOString()
      },
      new_balance: parseFloat(updatedSender[0].balance)
    })

  } catch (error) {
    console.error('Error processing QR transfer:', error)
    return NextResponse.json({ error: 'Transfer failed. Please try again.' }, { status: 500 })
  }
}
