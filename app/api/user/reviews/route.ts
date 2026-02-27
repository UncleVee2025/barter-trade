import { type NextRequest, NextResponse } from "next/server"
import { verifyAuth } from "@/lib/auth"
import { query, queryOne, execute, generateId } from "@/lib/db"

interface Review {
  id: string
  reviewerId: string
  reviewerName: string
  reviewerAvatar: string | null
  rating: number
  comment: string | null
  tradeOfferId: string | null
  isAnonymous: boolean
  createdAt: string
}

// GET - Fetch reviews for a user
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get("userId")
    const page = Number.parseInt(searchParams.get("page") || "1")
    const limit = Math.min(Number.parseInt(searchParams.get("limit") || "10"), 50)
    const offset = (page - 1) * limit

    if (!userId) {
      return NextResponse.json({ error: "User ID is required" }, { status: 400 })
    }

    // Get reviews
    const reviews = await query<{
      id: string
      reviewer_id: string
      reviewer_name: string
      reviewer_avatar: string | null
      rating: number
      comment: string | null
      trade_offer_id: string | null
      is_anonymous: boolean
      created_at: Date
    }>(
      `SELECT 
        r.id, r.reviewer_id, r.rating, r.comment, r.trade_offer_id, r.is_anonymous, r.created_at,
        u.name as reviewer_name, u.avatar as reviewer_avatar
       FROM user_reviews r
       JOIN users u ON r.reviewer_id = u.id
       WHERE r.reviewed_user_id = ?
       ORDER BY r.created_at DESC
       LIMIT ? OFFSET ?`,
      [userId, limit, offset]
    )

    // Get total count
    const countResult = await queryOne<{ total: number }>(
      `SELECT COUNT(*) as total FROM user_reviews WHERE reviewed_user_id = ?`,
      [userId]
    )

    // Get rating summary
    const summary = await queryOne<{
      avg_rating: number
      total_reviews: number
      five_star: number
      four_star: number
      three_star: number
      two_star: number
      one_star: number
    }>(
      `SELECT 
        AVG(rating) as avg_rating,
        COUNT(*) as total_reviews,
        SUM(CASE WHEN rating = 5 THEN 1 ELSE 0 END) as five_star,
        SUM(CASE WHEN rating = 4 THEN 1 ELSE 0 END) as four_star,
        SUM(CASE WHEN rating = 3 THEN 1 ELSE 0 END) as three_star,
        SUM(CASE WHEN rating = 2 THEN 1 ELSE 0 END) as two_star,
        SUM(CASE WHEN rating = 1 THEN 1 ELSE 0 END) as one_star
       FROM user_reviews WHERE reviewed_user_id = ?`,
      [userId]
    )

    const formattedReviews: Review[] = reviews.map((r) => ({
      id: r.id,
      reviewerId: r.is_anonymous ? "" : r.reviewer_id,
      reviewerName: r.is_anonymous ? "Anonymous" : r.reviewer_name,
      reviewerAvatar: r.is_anonymous ? null : r.reviewer_avatar,
      rating: r.rating,
      comment: r.comment,
      tradeOfferId: r.trade_offer_id,
      isAnonymous: r.is_anonymous,
      createdAt: r.created_at.toISOString(),
    }))

    return NextResponse.json({
      reviews: formattedReviews,
      summary: {
        averageRating: Number(summary?.avg_rating?.toFixed(1)) || 0,
        totalReviews: summary?.total_reviews || 0,
        distribution: {
          5: summary?.five_star || 0,
          4: summary?.four_star || 0,
          3: summary?.three_star || 0,
          2: summary?.two_star || 0,
          1: summary?.one_star || 0,
        },
      },
      pagination: {
        page,
        limit,
        total: countResult?.total || 0,
        totalPages: Math.ceil((countResult?.total || 0) / limit),
      },
    })
  } catch (error) {
    console.error("Error fetching reviews:", error)
    return NextResponse.json({ error: "Failed to fetch reviews" }, { status: 500 })
  }
}

// POST - Create a new review
export async function POST(request: NextRequest) {
  try {
    const auth = await verifyAuth(request)
    if (!auth) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { reviewedUserId, tradeOfferId, rating, comment, isAnonymous } = body

    // Validate input
    if (!reviewedUserId) {
      return NextResponse.json({ error: "User ID to review is required" }, { status: 400 })
    }

    if (!rating || rating < 1 || rating > 5) {
      return NextResponse.json({ error: "Rating must be between 1 and 5" }, { status: 400 })
    }

    // Can't review yourself
    if (reviewedUserId === auth.userId) {
      return NextResponse.json({ error: "You cannot review yourself" }, { status: 400 })
    }

    // Check if reviewed user exists
    const reviewedUser = await queryOne<{ id: string }>(
      `SELECT id FROM users WHERE id = ?`,
      [reviewedUserId]
    )

    if (!reviewedUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    // If trade offer ID provided, verify the trade
    if (tradeOfferId) {
      const trade = await queryOne<{ id: string; status: string; sender_id: string; receiver_id: string }>(
        `SELECT id, status, sender_id, receiver_id FROM trade_offers WHERE id = ?`,
        [tradeOfferId]
      )

      if (!trade) {
        return NextResponse.json({ error: "Trade not found" }, { status: 404 })
      }

      if (trade.status !== "accepted") {
        return NextResponse.json({ error: "Can only review completed trades" }, { status: 400 })
      }

      // Verify user was part of the trade
      const wasInTrade = trade.sender_id === auth.userId || trade.receiver_id === auth.userId
      if (!wasInTrade) {
        return NextResponse.json({ error: "You were not part of this trade" }, { status: 403 })
      }

      // Check if already reviewed this trade
      const existingReview = await queryOne<{ id: string }>(
        `SELECT id FROM user_reviews WHERE reviewer_id = ? AND trade_offer_id = ?`,
        [auth.userId, tradeOfferId]
      )

      if (existingReview) {
        return NextResponse.json({ error: "You have already reviewed this trade" }, { status: 400 })
      }
    }

    // Create the review
    const reviewId = generateId()
    await execute(
      `INSERT INTO user_reviews (id, reviewer_id, reviewed_user_id, trade_offer_id, rating, comment, is_anonymous)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [reviewId, auth.userId, reviewedUserId, tradeOfferId || null, rating, comment || null, isAnonymous ? 1 : 0]
    )

    // Update user's gamification star rating
    const newAvg = await queryOne<{ avg_rating: number; total_reviews: number }>(
      `SELECT AVG(rating) as avg_rating, COUNT(*) as total_reviews FROM user_reviews WHERE reviewed_user_id = ?`,
      [reviewedUserId]
    )

    await execute(
      `UPDATE user_gamification SET 
        star_rating = ?,
        total_reviews = ?,
        updated_at = NOW()
       WHERE user_id = ?`,
      [newAvg?.avg_rating?.toFixed(1) || 0, newAvg?.total_reviews || 0, reviewedUserId]
    )

    // Award points for receiving a review
    if (rating >= 4) {
      try {
        await fetch(`${process.env.NEXT_PUBLIC_APP_URL || ""}/api/user/gamification`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            userId: reviewedUserId,
            points: rating === 5 ? 5 : 3,
            actionType: "review_received",
            description: `Received a ${rating}-star review`,
          }),
        })
      } catch {
        // Silently fail gamification update
      }
    }

    return NextResponse.json({
      success: true,
      reviewId,
      message: "Review submitted successfully",
    })
  } catch (error) {
    console.error("Error creating review:", error)
    return NextResponse.json({ error: "Failed to submit review" }, { status: 500 })
  }
}
