import { type NextRequest, NextResponse } from "next/server"
import { verifyAuth } from "@/lib/auth"
import { queryOne, execute, generateId } from "@/lib/db"

// POST - Toggle like on a listing
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = await verifyAuth(request)
    if (!auth) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id: listingId } = await params

    // Check if listing exists
    const listing = await queryOne<{ id: string; user_id: string; title: string }>(
      `SELECT id, user_id, title FROM listings WHERE id = ?`,
      [listingId]
    )

    if (!listing) {
      return NextResponse.json({ error: "Listing not found" }, { status: 404 })
    }

    // Check if already liked
    const existingLike = await queryOne<{ id: string }>(
      `SELECT id FROM listing_likes WHERE user_id = ? AND listing_id = ?`,
      [auth.userId, listingId]
    )

    if (existingLike) {
      // Unlike - remove the like
      await execute(`DELETE FROM listing_likes WHERE id = ?`, [existingLike.id])

      // Get updated count
      const count = await queryOne<{ total: number }>(
        `SELECT COUNT(*) as total FROM listing_likes WHERE listing_id = ?`,
        [listingId]
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
      `INSERT INTO listing_likes (id, user_id, listing_id) VALUES (?, ?, ?)`,
      [likeId, auth.userId, listingId]
    )

    // Create notification for listing owner (if not liking own listing)
    if (listing.user_id !== auth.userId) {
      const user = await queryOne<{ name: string }>(`SELECT name FROM users WHERE id = ?`, [auth.userId])
      await execute(
        `INSERT INTO notifications (id, user_id, type, title, message, data) VALUES (?, ?, 'listing', ?, ?, ?)`,
        [
          generateId(),
          listing.user_id,
          "New Like",
          `${user?.name || "Someone"} liked your listing "${listing.title}"`,
          JSON.stringify({ listingId, likeId }),
        ]
      )
    }

    // Get updated count
    const count = await queryOne<{ total: number }>(
      `SELECT COUNT(*) as total FROM listing_likes WHERE listing_id = ?`,
      [listingId]
    )

    return NextResponse.json({
      success: true,
      liked: true,
      likesCount: count?.total || 0,
      message: "Listing liked",
    })
  } catch (error) {
    console.error("Error toggling like:", error)
    return NextResponse.json({ error: "Failed to toggle like" }, { status: 500 })
  }
}

// GET - Check if user liked a listing and get count
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: listingId } = await params

    // Check if listing exists
    const listing = await queryOne<{ id: string }>(`SELECT id FROM listings WHERE id = ?`, [listingId])
    if (!listing) {
      return NextResponse.json({ error: "Listing not found" }, { status: 404 })
    }

    // Get total likes count
    const count = await queryOne<{ total: number }>(
      `SELECT COUNT(*) as total FROM listing_likes WHERE listing_id = ?`,
      [listingId]
    )

    // Check if current user liked it
    let liked = false
    const auth = await verifyAuth(request)
    if (auth) {
      const existingLike = await queryOne<{ id: string }>(
        `SELECT id FROM listing_likes WHERE user_id = ? AND listing_id = ?`,
        [auth.userId, listingId]
      )
      liked = !!existingLike
    }

    return NextResponse.json({
      liked,
      likesCount: count?.total || 0,
    })
  } catch (error) {
    console.error("Error getting like status:", error)
    return NextResponse.json({ error: "Failed to get like status" }, { status: 500 })
  }
}
