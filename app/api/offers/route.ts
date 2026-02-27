import { type NextRequest, NextResponse } from "next/server"
import { verifyAuth } from "@/lib/auth"
import { query, queryOne, execute, generateId, transaction } from "@/lib/db"
import type { PoolConnection } from "mysql2/promise"

// GET - Fetch user's offers (sent and received)
export async function GET(request: NextRequest) {
  try {
    const auth = await verifyAuth(request)
    if (!auth) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const searchParams = request.nextUrl.searchParams
    const status = searchParams.get("status")
    const type = searchParams.get("type") // 'sent' | 'received' | 'all'
    const page = Number.parseInt(searchParams.get("page") || "1")
    const limit = Number.parseInt(searchParams.get("limit") || "20")
    const offset = (page - 1) * limit

    let sql = `
      SELECT 
        o.*,
        sender.name as sender_name,
        sender.avatar as sender_avatar,
        sender.region as sender_region,
        sender.is_verified as sender_verified,
        receiver.name as receiver_name,
        receiver.avatar as receiver_avatar,
        receiver.region as receiver_region,
        receiver.is_verified as receiver_verified,
        c.id as conversation_id
      FROM trade_offers o
      LEFT JOIN users sender ON o.sender_id = sender.id
      LEFT JOIN users receiver ON o.receiver_id = receiver.id
      LEFT JOIN conversations c ON o.conversation_id = c.id
      WHERE (o.sender_id = ? OR o.receiver_id = ?)
    `
    const params: (string | number)[] = [auth.userId, auth.userId]

    if (type === "sent") {
      sql = sql.replace("(o.sender_id = ? OR o.receiver_id = ?)", "o.sender_id = ?")
      params.pop()
    } else if (type === "received") {
      sql = sql.replace("(o.sender_id = ? OR o.receiver_id = ?)", "o.receiver_id = ?")
      params.shift()
    }

    if (status) {
      sql += ` AND o.status = ?`
      params.push(status)
    }

    // Count
    const countSql = sql.replace(/SELECT[\s\S]*?FROM/, "SELECT COUNT(*) as total FROM")
    const countResult = await queryOne<{ total: number }>(countSql, params)
    const total = countResult?.total || 0

    sql += ` ORDER BY o.created_at DESC LIMIT ? OFFSET ?`
    params.push(limit, offset)

    const offers = await query<Record<string, unknown>>(sql, params)

    // Get items for each offer
    const offerIds = offers.map((o) => o.id as string)
    let itemsMap: Record<string, { senderItems: unknown[]; receiverItems: unknown[] }> = {}

    if (offerIds.length > 0) {
      const items = await query<Record<string, unknown>>(
        `SELECT 
          toi.*,
          l.title as listing_title,
          l.value as listing_value,
          (SELECT url FROM listing_images WHERE listing_id = l.id AND is_primary = TRUE LIMIT 1) as listing_image
        FROM trade_offer_items toi
        LEFT JOIN listings l ON toi.listing_id = l.id
        WHERE toi.offer_id IN (${offerIds.map(() => "?").join(",")})`,
        offerIds
      )

      itemsMap = items.reduce(
        (acc, item) => {
          const oid = item.offer_id as string
          if (!acc[oid]) acc[oid] = { senderItems: [], receiverItems: [] }
          const itemData = {
            id: item.listing_id,
            title: item.listing_title,
            value: Number(item.listing_value),
            image: item.listing_image || "/placeholder.svg",
          }
          if (item.side === "sender") {
            acc[oid].senderItems.push(itemData)
          } else {
            acc[oid].receiverItems.push(itemData)
          }
          return acc
        },
        {} as typeof itemsMap
      )
    }

    const transformedOffers = offers.map((offer) => ({
      id: offer.id,
      senderId: offer.sender_id,
      receiverId: offer.receiver_id,
      conversationId: offer.conversation_id,
      walletAmount: Number(offer.wallet_amount),
      message: offer.message,
      status: offer.status,
      senderItems: itemsMap[offer.id as string]?.senderItems || [],
      receiverItems: itemsMap[offer.id as string]?.receiverItems || [],
      expiresAt: offer.expires_at,
      createdAt: offer.created_at,
      updatedAt: offer.updated_at,
      sender: {
        id: offer.sender_id,
        name: offer.sender_name,
        avatar: offer.sender_avatar,
        region: offer.sender_region,
        isVerified: Boolean(offer.sender_verified),
      },
      receiver: {
        id: offer.receiver_id,
        name: offer.receiver_name,
        avatar: offer.receiver_avatar,
        region: offer.receiver_region,
        isVerified: Boolean(offer.receiver_verified),
      },
      isSender: offer.sender_id === auth.userId,
    }))

    return NextResponse.json({
      offers: transformedOffers,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    })
  } catch (error) {
    console.error("Error fetching offers:", error)
    return NextResponse.json({ error: "Failed to fetch offers" }, { status: 500 })
  }
}

// POST - Create a new trade offer
export async function POST(request: NextRequest) {
  try {
    const auth = await verifyAuth(request)
    if (!auth) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { receiverId, senderItems = [], receiverItems = [], walletAmount = 0, message, conversationId } = await request.json()

    if (!receiverId) {
      return NextResponse.json({ error: "receiverId is required" }, { status: 400 })
    }

    if (receiverId === auth.userId) {
      return NextResponse.json({ error: "Cannot send offer to yourself" }, { status: 400 })
    }

    if (senderItems.length === 0 && walletAmount <= 0) {
      return NextResponse.json({ error: "Offer must include items or wallet amount" }, { status: 400 })
    }

    // Verify receiver exists
    const receiver = await queryOne<{ id: string; name: string }>(
      `SELECT id, name FROM users WHERE id = ?`,
      [receiverId]
    )

    if (!receiver) {
      return NextResponse.json({ error: "Receiver not found" }, { status: 404 })
    }

    // If wallet amount > 0, verify sender has sufficient balance
    if (walletAmount > 0) {
      const sender = await queryOne<{ wallet_balance: number }>(
        `SELECT wallet_balance FROM users WHERE id = ?`,
        [auth.userId]
      )
      if (!sender || Number(sender.wallet_balance) < walletAmount) {
        return NextResponse.json({ error: "Insufficient wallet balance" }, { status: 400 })
      }
    }

    // Verify sender owns all items being offered
    if (senderItems.length > 0) {
      const ownedItems = await query<{ id: string }>(
        `SELECT id FROM listings WHERE id IN (${senderItems.map(() => "?").join(",")}) AND user_id = ? AND status = 'active'`,
        [...senderItems, auth.userId]
      )
      if (ownedItems.length !== senderItems.length) {
        return NextResponse.json({ error: "You can only offer your own active listings" }, { status: 400 })
      }
    }

    // Verify receiver owns requested items
    if (receiverItems.length > 0) {
      const receiverOwnedItems = await query<{ id: string }>(
        `SELECT id FROM listings WHERE id IN (${receiverItems.map(() => "?").join(",")}) AND user_id = ? AND status = 'active'`,
        [...receiverItems, receiverId]
      )
      if (receiverOwnedItems.length !== receiverItems.length) {
        return NextResponse.json({ error: "Some requested items are not available" }, { status: 400 })
      }
    }

    const offerId = await transaction(async (conn: PoolConnection) => {
      const id = generateId()
      const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days

      // Create offer
      await conn.execute(
        `INSERT INTO trade_offers (id, sender_id, receiver_id, conversation_id, wallet_amount, message, status, expires_at)
         VALUES (?, ?, ?, ?, ?, ?, 'pending', ?)`,
        [id, auth.userId, receiverId, conversationId || null, walletAmount, message || null, expiresAt]
      )

      // Add sender items
      for (const listingId of senderItems) {
        await conn.execute(
          `INSERT INTO trade_offer_items (id, offer_id, listing_id, side) VALUES (?, ?, ?, 'sender')`,
          [generateId(), id, listingId]
        )
      }

      // Add receiver items
      for (const listingId of receiverItems) {
        await conn.execute(
          `INSERT INTO trade_offer_items (id, offer_id, listing_id, side) VALUES (?, ?, ?, 'receiver')`,
          [generateId(), id, listingId]
        )
      }

      // Create notification for receiver
      const senderUser = await queryOne<{ name: string }>(`SELECT name FROM users WHERE id = ?`, [auth.userId])
      await conn.execute(
        `INSERT INTO notifications (id, user_id, type, title, message, data) VALUES (?, ?, 'trade', ?, ?, ?)`,
        [
          generateId(),
          receiverId,
          "New Trade Offer",
          `${senderUser?.name || "Someone"} sent you a trade offer`,
          JSON.stringify({ offerId: id }),
        ]
      )

      return id
    })

    return NextResponse.json({
      success: true,
      offerId,
      message: "Offer sent successfully!",
    })
  } catch (error) {
    console.error("Error creating offer:", error)
    return NextResponse.json({ error: "Failed to create offer" }, { status: 500 })
  }
}
