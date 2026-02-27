import { type NextRequest, NextResponse } from "next/server"
import { query, queryOne } from "@/lib/db"

// GET - Get public user profile
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    // Get user public info
    const user = await queryOne<Record<string, unknown>>(
      `SELECT 
        u.id,
        u.name,
        u.avatar,
        u.region,
        u.town,
        u.is_verified,
        u.created_at,
        (SELECT COUNT(*) FROM listings l WHERE l.user_id = u.id) as total_listings,
        (SELECT COUNT(*) FROM listings l WHERE l.user_id = u.id AND l.status = 'active') as active_listings,
        (SELECT COUNT(*) FROM trade_offers t WHERE (t.sender_id = u.id OR t.receiver_id = u.id) AND t.status = 'accepted') as completed_trades,
        (SELECT AVG(r.rating) FROM user_ratings r WHERE r.to_user_id = u.id) as avg_rating,
        (SELECT COUNT(*) FROM user_ratings r WHERE r.to_user_id = u.id) as rating_count
      FROM users u
      WHERE u.id = ? AND u.is_banned = FALSE`,
      [id]
    )

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    // Get user's active listings
    const listings = await query<Record<string, unknown>>(
      `SELECT 
        l.id,
        l.title,
        l.value,
        l.status,
        l.views,
        l.region,
        l.town,
        l.created_at,
        (SELECT COUNT(*) FROM listing_likes ll WHERE ll.listing_id = l.id) as likes,
        (SELECT li.url FROM listing_images li WHERE li.listing_id = l.id AND li.is_primary = TRUE LIMIT 1) as primary_image
      FROM listings l
      WHERE l.user_id = ? AND l.status = 'active'
      ORDER BY l.created_at DESC
      LIMIT 20`,
      [id]
    )

    // Get user ratings
    const ratings = await query<Record<string, unknown>>(
      `SELECT 
        r.id,
        r.rating,
        r.review,
        r.created_at,
        u.id as from_user_id,
        u.name as from_user_name,
        u.avatar as from_user_avatar
      FROM user_ratings r
      LEFT JOIN users u ON r.from_user_id = u.id
      WHERE r.to_user_id = ?
      ORDER BY r.created_at DESC
      LIMIT 20`,
      [id]
    )

    return NextResponse.json({
      user: {
        id: user.id,
        name: user.name,
        avatar: user.avatar,
        region: user.region,
        town: user.town,
        isVerified: Boolean(user.is_verified),
        joinedAt: user.created_at,
        stats: {
          totalListings: Number(user.total_listings),
          activeListings: Number(user.active_listings),
          completedTrades: Number(user.completed_trades),
          avgRating: user.avg_rating ? Number(user.avg_rating) : null,
          ratingCount: Number(user.rating_count),
        },
      },
      listings: listings.map((l) => ({
        id: l.id,
        title: l.title,
        value: Number(l.value),
        primaryImage: l.primary_image || "/placeholder.svg",
        status: l.status,
        views: Number(l.views),
        likes: Number(l.likes),
        location: {
          region: l.region,
          town: l.town,
        },
        createdAt: l.created_at,
      })),
      ratings: ratings.map((r) => ({
        id: r.id,
        rating: Number(r.rating),
        review: r.review,
        createdAt: r.created_at,
        fromUser: {
          id: r.from_user_id,
          name: r.from_user_name,
          avatar: r.from_user_avatar,
        },
      })),
    })
  } catch (error) {
    console.error("Get public user error:", error)
    return NextResponse.json({ error: "Failed to fetch user" }, { status: 500 })
  }
}
