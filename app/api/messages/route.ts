import { type NextRequest, NextResponse } from "next/server"
import { verifyAuth } from "@/lib/auth"
import { query, queryOne, execute, generateId, transaction } from "@/lib/db"
import type { PoolConnection } from "mysql2/promise"

// GET - Fetch conversations or messages
export async function GET(request: NextRequest) {
  try {
    const auth = await verifyAuth(request)
    if (!auth) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const searchParams = request.nextUrl.searchParams
    const conversationId = searchParams.get("conversationId")

    if (conversationId) {
      // Get messages for a specific conversation
      const messages = await query<Record<string, unknown>>(
        `SELECT 
          m.*,
          u.name as sender_name,
          u.avatar as sender_avatar,
          u.is_verified as sender_verified
        FROM messages m
        LEFT JOIN users u ON m.sender_id = u.id
        WHERE m.conversation_id = ?
        ORDER BY m.created_at ASC`,
        [conversationId]
      )

      // Mark messages as read
      await execute(
        `UPDATE messages SET read_at = NOW() 
         WHERE conversation_id = ? AND sender_id != ? AND read_at IS NULL`,
        [conversationId, auth.userId]
      )

      // Update last_read_at for participant
      await execute(
        `UPDATE conversation_participants SET last_read_at = NOW() 
         WHERE conversation_id = ? AND user_id = ?`,
        [conversationId, auth.userId]
      )

      const transformedMessages = messages.map((m) => ({
        id: m.id,
        conversationId: m.conversation_id,
        content: m.content,
        type: m.type,
        offerId: m.offer_id,
        readAt: m.read_at,
        createdAt: m.created_at,
        sender: {
          id: m.sender_id,
          name: m.sender_name,
          avatar: m.sender_avatar,
          isVerified: Boolean(m.sender_verified),
        },
        isOwn: m.sender_id === auth.userId,
      }))

      return NextResponse.json({ messages: transformedMessages })
    }

    // Get all conversations for the user
    const conversations = await query<Record<string, unknown>>(
      `SELECT 
        c.*,
        l.id as listing_id,
        l.title as listing_title,
        (SELECT li.url FROM listing_images li WHERE li.listing_id = l.id AND li.is_primary = TRUE LIMIT 1) as listing_image,
        (SELECT COUNT(*) FROM messages m WHERE m.conversation_id = c.id AND m.sender_id != ? AND m.read_at IS NULL) as unread_count
      FROM conversations c
      LEFT JOIN conversation_participants cp ON c.id = cp.conversation_id
      LEFT JOIN listings l ON c.listing_id = l.id
      WHERE cp.user_id = ?
      GROUP BY c.id
      ORDER BY c.updated_at DESC`,
      [auth.userId, auth.userId]
    )

    // Get participants and last message for each conversation
    const enrichedConversations = await Promise.all(
      conversations.map(async (conv) => {
        // Get other participants
        const participants = await query<Record<string, unknown>>(
          `SELECT u.id, u.name, u.avatar, u.is_verified, u.last_seen
           FROM conversation_participants cp
           LEFT JOIN users u ON cp.user_id = u.id
           WHERE cp.conversation_id = ? AND cp.user_id != ?`,
          [conv.id, auth.userId]
        )

        // Get last message
        const lastMessage = await queryOne<Record<string, unknown>>(
          `SELECT m.*, u.name as sender_name
           FROM messages m
           LEFT JOIN users u ON m.sender_id = u.id
           WHERE m.conversation_id = ?
           ORDER BY m.created_at DESC LIMIT 1`,
          [conv.id]
        )

        return {
          id: conv.id,
          listingId: conv.listing_id,
          listingTitle: conv.listing_title,
          listingImage: conv.listing_image,
          unreadCount: Number(conv.unread_count),
          updatedAt: conv.updated_at,
          createdAt: conv.created_at,
          participants: participants.map((p) => ({
            id: p.id,
            name: p.name,
            avatar: p.avatar,
            isVerified: Boolean(p.is_verified),
            lastSeen: p.last_seen,
          })),
          lastMessage: lastMessage
            ? {
                id: lastMessage.id,
                content: lastMessage.content,
                type: lastMessage.type,
                senderName: lastMessage.sender_name,
                senderId: lastMessage.sender_id,
                createdAt: lastMessage.created_at,
                isOwn: lastMessage.sender_id === auth.userId,
              }
            : null,
        }
      })
    )

    return NextResponse.json({ conversations: enrichedConversations })
  } catch (error) {
    console.error("Error fetching messages:", error)
    return NextResponse.json({ error: "Failed to fetch messages" }, { status: 500 })
  }
}




