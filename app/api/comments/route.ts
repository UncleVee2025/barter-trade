import { type NextRequest, NextResponse } from "next/server"
import { verifyAuth } from "@/lib/auth"
import { query, queryOne, execute, generateId } from "@/lib/db"

// GET - Fetch comments for a listing
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const listingId = searchParams.get("listingId")
    const page = Number.parseInt(searchParams.get("page") || "1")
    const limit = Number.parseInt(searchParams.get("limit") || "50")
    const offset = (page - 1) * limit

    if (!listingId) {
      return NextResponse.json({ error: "listingId is required" }, { status: 400 })
    }

    // Get total count
    const countResult = await queryOne<{ total: number }>(
      `SELECT COUNT(*) as total FROM comments WHERE listing_id = ?`,
      [listingId]
    )
    const total = countResult?.total || 0

    // Get comments with user info
    const comments = await query<Record<string, unknown>>(
      `SELECT 
        c.*,
        u.name as user_name,
        u.avatar as user_avatar,
        u.is_verified as user_verified,
        u.region as user_region
      FROM comments c
      LEFT JOIN users u ON c.user_id = u.id
      WHERE c.listing_id = ?
      ORDER BY c.created_at DESC
      LIMIT ? OFFSET ?`,
      [listingId, limit, offset]
    )

    // Transform comments into nested structure
    const commentMap = new Map<string, Record<string, unknown>>()
    const rootComments: Record<string, unknown>[] = []

    for (const comment of comments) {
      const transformed = {
        id: comment.id,
        listingId: comment.listing_id,
        content: comment.content,
        parentId: comment.parent_id,
        isEdited: Boolean(comment.is_edited),
        createdAt: comment.created_at,
        updatedAt: comment.updated_at,
        user: {
          id: comment.user_id,
          name: comment.user_name,
          avatar: comment.user_avatar,
          isVerified: Boolean(comment.user_verified),
          region: comment.user_region,
        },
        replies: [],
      }
      commentMap.set(comment.id as string, transformed)
    }

    // Build tree structure
    for (const comment of comments) {
      const transformed = commentMap.get(comment.id as string)!
      if (comment.parent_id) {
        const parent = commentMap.get(comment.parent_id as string)
        if (parent) {
          (parent.replies as unknown[]).push(transformed)
        }
      } else {
        rootComments.push(transformed)
      }
    }

    return NextResponse.json({
      comments: rootComments,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    console.error("Error fetching comments:", error)
    return NextResponse.json({ error: "Failed to fetch comments" }, { status: 500 })
  }
}

// POST - Create a new comment
export async function POST(request: NextRequest) {
  try {
    const auth = await verifyAuth(request)
    if (!auth) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { listingId, content, parentId } = await request.json()

    if (!listingId || !content) {
      return NextResponse.json({ error: "listingId and content are required" }, { status: 400 })
    }

    if (content.trim().length < 1) {
      return NextResponse.json({ error: "Comment cannot be empty" }, { status: 400 })
    }

    if (content.length > 2000) {
      return NextResponse.json({ error: "Comment cannot exceed 2000 characters" }, { status: 400 })
    }

    // Check if listing exists
    const listing = await queryOne<{ id: string; user_id: string; title: string }>(
      `SELECT id, user_id, title FROM listings WHERE id = ?`,
      [listingId]
    )

    if (!listing) {
      return NextResponse.json({ error: "Listing not found" }, { status: 404 })
    }

    // If replying, check parent exists
    if (parentId) {
      const parent = await queryOne<{ id: string }>(
        `SELECT id FROM comments WHERE id = ? AND listing_id = ?`,
        [parentId, listingId]
      )
      if (!parent) {
        return NextResponse.json({ error: "Parent comment not found" }, { status: 404 })
      }
    }

    const commentId = generateId()

    await execute(
      `INSERT INTO comments (id, listing_id, user_id, parent_id, content) VALUES (?, ?, ?, ?, ?)`,
      [commentId, listingId, auth.userId, parentId || null, content.trim()]
    )

    // Get user info for response
    const user = await queryOne<{ name: string; avatar: string | null; is_verified: boolean }>(
      `SELECT name, avatar, is_verified FROM users WHERE id = ?`,
      [auth.userId]
    )

    // Create notification for listing owner (if not commenting on own listing)
    if (listing.user_id !== auth.userId) {
      await execute(
        `INSERT INTO notifications (id, user_id, type, title, message, data) VALUES (?, ?, 'listing', ?, ?, ?)`,
        [
          generateId(),
          listing.user_id,
          "New Comment",
          `${user?.name || "Someone"} commented on your listing "${listing.title}"`,
          JSON.stringify({ listingId, commentId }),
        ]
      )
    }

    // If replying, notify parent comment author
    if (parentId) {
      const parentComment = await queryOne<{ user_id: string }>(
        `SELECT user_id FROM comments WHERE id = ?`,
        [parentId]
      )
      if (parentComment && parentComment.user_id !== auth.userId) {
        await execute(
          `INSERT INTO notifications (id, user_id, type, title, message, data) VALUES (?, ?, 'listing', ?, ?, ?)`,
          [
            generateId(),
            parentComment.user_id,
            "New Reply",
            `${user?.name || "Someone"} replied to your comment`,
            JSON.stringify({ listingId, commentId, parentId }),
          ]
        )
      }
    }

    return NextResponse.json({
      success: true,
      comment: {
        id: commentId,
        listingId,
        content: content.trim(),
        parentId: parentId || null,
        isEdited: false,
        createdAt: new Date(),
        user: {
          id: auth.userId,
          name: user?.name,
          avatar: user?.avatar,
          isVerified: Boolean(user?.is_verified),
        },
        replies: [],
      },
      message: "Comment posted successfully",
    })
  } catch (error) {
    console.error("Error creating comment:", error)
    return NextResponse.json({ error: "Failed to create comment" }, { status: 500 })
  }
}
