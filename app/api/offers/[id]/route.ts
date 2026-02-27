import { type NextRequest, NextResponse } from "next/server"
import { verifyAuth } from "@/lib/auth"
import { query, queryOne, execute, generateId, transaction } from "@/lib/db"
import type { PoolConnection } from "mysql2/promise"

// GET - Get single offer details
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = await verifyAuth(request)
    if (!auth) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = await params

    const offer = await queryOne<Record<string, unknown>>(
      `SELECT 
        o.*,
        sender.name as sender_name, sender.avatar as sender_avatar, sender.is_verified as sender_verified,
        receiver.name as receiver_name, receiver.avatar as receiver_avatar, receiver.is_verified as receiver_verified
      FROM trade_offers o
      LEFT JOIN users sender ON o.sender_id = sender.id
      LEFT JOIN users receiver ON o.receiver_id = receiver.id
      WHERE o.id = ? AND (o.sender_id = ? OR o.receiver_id = ?)`,
      [id, auth.userId, auth.userId]
    )

    if (!offer) {
      return NextResponse.json({ error: "Offer not found" }, { status: 404 })
    }

    // Get items
    const items = await query<Record<string, unknown>>(
      `SELECT toi.*, l.title, l.value, 
        (SELECT url FROM listing_images WHERE listing_id = l.id AND is_primary = TRUE LIMIT 1) as image
      FROM trade_offer_items toi
      LEFT JOIN listings l ON toi.listing_id = l.id
      WHERE toi.offer_id = ?`,
      [id]
    )

    const senderItems = items.filter((i) => i.side === "sender").map((i) => ({
      id: i.listing_id,
      title: i.title,
      value: Number(i.value),
      image: i.image || "/placeholder.svg",
    }))

    const receiverItems = items.filter((i) => i.side === "receiver").map((i) => ({
      id: i.listing_id,
      title: i.title,
      value: Number(i.value),
      image: i.image || "/placeholder.svg",
    }))

    return NextResponse.json({
      offer: {
        id: offer.id,
        senderId: offer.sender_id,
        receiverId: offer.receiver_id,
        walletAmount: Number(offer.wallet_amount),
        message: offer.message,
        status: offer.status,
        senderItems,
        receiverItems,
        expiresAt: offer.expires_at,
        createdAt: offer.created_at,
        sender: {
          id: offer.sender_id,
          name: offer.sender_name,
          avatar: offer.sender_avatar,
          isVerified: Boolean(offer.sender_verified),
        },
        receiver: {
          id: offer.receiver_id,
          name: offer.receiver_name,
          avatar: offer.receiver_avatar,
          isVerified: Boolean(offer.receiver_verified),
        },
        isSender: offer.sender_id === auth.userId,
      },
    })
  } catch (error) {
    console.error("Error fetching offer:", error)
    return NextResponse.json({ error: "Failed to fetch offer" }, { status: 500 })
  }
}

// PATCH - Accept, reject, or cancel offer
export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = await verifyAuth(request)
    if (!auth) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = await params
    const { action } = await request.json()

    const offer = await queryOne<Record<string, unknown>>(
      `SELECT * FROM trade_offers WHERE id = ?`,
      [id]
    )

    if (!offer) {
      return NextResponse.json({ error: "Offer not found" }, { status: 404 })
    }

    if (offer.status !== "pending") {
      return NextResponse.json({ error: "Offer is no longer pending" }, { status: 400 })
    }

    // Check if offer expired
    if (new Date(offer.expires_at as string) < new Date()) {
      await execute(`UPDATE trade_offers SET status = 'expired' WHERE id = ?`, [id])
      return NextResponse.json({ error: "Offer has expired" }, { status: 400 })
    }

    const senderId = offer.sender_id as string
    const receiverId = offer.receiver_id as string
    const walletAmount = Number(offer.wallet_amount)

    switch (action) {
      case "accept": {
        // Only receiver can accept
        if (receiverId !== auth.userId) {
          return NextResponse.json({ error: "Only the receiver can accept this offer" }, { status: 403 })
        }

        await transaction(async (conn: PoolConnection) => {
          // Transfer wallet amount if any
          if (walletAmount > 0) {
            // Deduct from sender
            await conn.execute(
              `UPDATE users SET wallet_balance = wallet_balance - ? WHERE id = ? AND wallet_balance >= ?`,
              [walletAmount, senderId, walletAmount]
            )

            // Add to receiver
            await conn.execute(
              `UPDATE users SET wallet_balance = wallet_balance + ? WHERE id = ?`,
              [walletAmount, receiverId]
            )

            // Create transaction records
            const senderBalance = await queryOne<{ wallet_balance: number }>(
              `SELECT wallet_balance FROM users WHERE id = ?`,
              [senderId]
            )
            const receiverBalance = await queryOne<{ wallet_balance: number }>(
              `SELECT wallet_balance FROM users WHERE id = ?`,
              [receiverId]
            )

            await conn.execute(
              `INSERT INTO transactions (id, user_id, type, amount, balance_after, status, description, related_user_id)
               VALUES (?, ?, 'transfer_out', ?, ?, 'completed', 'Trade offer payment', ?)`,
              [generateId(), senderId, walletAmount, Number(senderBalance?.wallet_balance), receiverId]
            )

            await conn.execute(
              `INSERT INTO transactions (id, user_id, type, amount, balance_after, status, description, related_user_id)
               VALUES (?, ?, 'transfer_in', ?, ?, 'completed', 'Trade offer received', ?)`,
              [generateId(), receiverId, walletAmount, Number(receiverBalance?.wallet_balance), senderId]
            )
          }

          // Get items involved
          const items = await query<{ listing_id: string; side: string }>(
            `SELECT listing_id, side FROM trade_offer_items WHERE offer_id = ?`,
            [id]
          )

          // Mark listings as sold
          const allListingIds = items.map((i) => i.listing_id)
          if (allListingIds.length > 0) {
            await conn.execute(
              `UPDATE listings SET status = 'sold' WHERE id IN (${allListingIds.map(() => "?").join(",")})`,
              allListingIds
            )
          }

          // Update offer status
          await conn.execute(`UPDATE trade_offers SET status = 'accepted', updated_at = NOW() WHERE id = ?`, [id])

          // Create completed trade record
          await conn.execute(
            `INSERT INTO completed_trades (id, offer_id, seller_id, buyer_id, wallet_amount)
             VALUES (?, ?, ?, ?, ?)`,
            [generateId(), id, receiverId, senderId, walletAmount]
          )

          // Notify sender
          const receiverUser = await queryOne<{ name: string }>(`SELECT name FROM users WHERE id = ?`, [receiverId])
          await conn.execute(
            `INSERT INTO notifications (id, user_id, type, title, message, data) VALUES (?, ?, 'trade', ?, ?, ?)`,
            [
              generateId(),
              senderId,
              "Offer Accepted",
              `${receiverUser?.name || "The user"} accepted your trade offer!`,
              JSON.stringify({ offerId: id }),
            ]
          )
        })

        return NextResponse.json({ success: true, message: "Offer accepted! Trade completed." })
      }

      case "reject": {
        // Only receiver can reject
        if (receiverId !== auth.userId) {
          return NextResponse.json({ error: "Only the receiver can reject this offer" }, { status: 403 })
        }

        await execute(`UPDATE trade_offers SET status = 'rejected', updated_at = NOW() WHERE id = ?`, [id])

        // Notify sender
        const receiverUser = await queryOne<{ name: string }>(`SELECT name FROM users WHERE id = ?`, [receiverId])
        await execute(
          `INSERT INTO notifications (id, user_id, type, title, message, data) VALUES (?, ?, 'trade', ?, ?, ?)`,
          [
            generateId(),
            senderId,
            "Offer Rejected",
            `${receiverUser?.name || "The user"} declined your trade offer`,
            JSON.stringify({ offerId: id }),
          ]
        )

        return NextResponse.json({ success: true, message: "Offer rejected" })
      }

      case "cancel": {
        // Only sender can cancel
        if (senderId !== auth.userId) {
          return NextResponse.json({ error: "Only the sender can cancel this offer" }, { status: 403 })
        }

        await execute(`UPDATE trade_offers SET status = 'cancelled', updated_at = NOW() WHERE id = ?`, [id])

        // Notify receiver
        const senderUser = await queryOne<{ name: string }>(`SELECT name FROM users WHERE id = ?`, [senderId])
        await execute(
          `INSERT INTO notifications (id, user_id, type, title, message, data) VALUES (?, ?, 'trade', ?, ?, ?)`,
          [
            generateId(),
            receiverId,
            "Offer Cancelled",
            `${senderUser?.name || "The user"} cancelled their trade offer`,
            JSON.stringify({ offerId: id }),
          ]
        )

        return NextResponse.json({ success: true, message: "Offer cancelled" })
      }

      default:
        return NextResponse.json({ error: "Invalid action. Use: accept, reject, or cancel" }, { status: 400 })
    }
  } catch (error) {
    console.error("Error updating offer:", error)
    return NextResponse.json({ error: "Failed to update offer" }, { status: 500 })
  }
}
