import { type NextRequest, NextResponse } from "next/server"
import { verifyAuth } from "@/lib/auth"
import { queryOne, execute, generateId } from "@/lib/db"

// POST - Toggle like on a comment
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = await verifyAuth(request)
    if (!auth) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id: commentId } = await params

    // Check if comment exists
    const comment = await queryOne<{ id: string; user_id: string; listing_id: string }>(
      `SELECT id, user_id, listing_id FROM comments WHERE id = ?`,
      [commentId]
    )

    if (!comment) {
      return NextResponse.json({ error: "Comment not found" }, { status: 404 })
    }

    // Check if already liked
    const existingLike = await queryOne<{ id: string }>(
      `SELECT id FROM comment_likes WHERE user_id = ? AND comment_id = ?`,
      [auth.userId, commentId]
    )

    if (existingLike) {
      // Unlike
      await execute(`DELETE FROM comment_likes WHERE id = ?`, [existingLike.id])

      const count = await queryOne<{ total: number }>(
        `SELECT COUNT(*) as total FROM comment_likes WHERE comment_id = ?`,
        [commentId]
      )

      return NextResponse.json({
        success: true,
        liked: false,
        likesCount: count?.total || 0,
        message: "Like removed",
      })
    }

    // Add new like
    const likeId = generateId()
    await execute(
      `INSERT INTO comment_likes (id, user_id, comment_id) VALUES (?, ?, ?)`,
      [likeId, auth.userId, commentId]
    )

    // Notify comment author (if not liking own comment)
    if (comment.user_id !== auth.userId) {
      const user = await queryOne<{ name: string }>(`SELECT name FROM users WHERE id = ?`, [auth.userId])
      await execute(
        `INSERT INTO notifications (id, user_id, type, title, message, data) VALUES (?, ?, 'listing', ?, ?, ?)`,
        [
          generateId(),
          comment.user_id,
          "Comment Liked",
          `${user?.name || "Someone"} liked your comment`,
          JSON.stringify({ commentId, listingId: comment.listing_id, likeId }),
        ]
      )
    }

    const count = await queryOne<{ total: number }>(
      `SELECT COUNT(*) as total FROM comment_likes WHERE comment_id = ?`,
      [commentId]
    )

    return NextResponse.json({
      success: true,
      liked: true,
      likesCount: count?.total || 0,
      message: "Comment liked",
    })
  } catch (error) {
    console.error("Error toggling comment like:", error)
    return NextResponse.json({ error: "Failed to toggle like" }, { status: 500 })
  }
}

// GET - Get like status for a comment
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: commentId } = await params

    const comment = await queryOne<{ id: string }>(`SELECT id FROM comments WHERE id = ?`, [commentId])
    if (!comment) {
      return NextResponse.json({ error: "Comment not found" }, { status: 404 })
    }

    const count = await queryOne<{ total: number }>(
      `SELECT COUNT(*) as total FROM comment_likes WHERE comment_id = ?`,
      [commentId]
    )

    let liked = false
    const auth = await verifyAuth(request)
    if (auth) {
      const existingLike = await queryOne<{ id: string }>(
        `SELECT id FROM comment_likes WHERE user_id = ? AND comment_id = ?`,
        [auth.userId, commentId]
      )
      liked = !!existingLike
    }

    return NextResponse.json({
      liked,
      likesCount: count?.total || 0,
    })
  } catch (error) {
    console.error("Error getting comment like status:", error)
    return NextResponse.json({ error: "Failed to get like status" }, { status: 500 })
  }
}
