import { type NextRequest, NextResponse } from "next/server"
import { verifyAuth } from "@/lib/auth"
import { queryOne } from "@/lib/db"

interface UserStats {
  activeListings: number
  successfulTrades: number
  totalViews: number
  successRate: number
  pendingOffers: number
  unreadMessages: number
  savedItems: number
  walletBalance: number
  trends: {
    listingsThisWeek: number
    tradesThisMonth: number
    viewsToday: number
    rankPercentile: string
  }
}

// GET - Fetch user-specific dashboard stats
export async function GET(request: NextRequest) {
  try {
    const auth = await verifyAuth(request)

    if (!auth) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    const userId = auth.userId

    // Try database queries
    try {
      // Get active listings count
      const listingsResult = await queryOne<{ count: number }>(
        "SELECT COUNT(*) as count FROM listings WHERE user_id = ? AND status = 'active'",
        [userId]
      )
      
      // Get successful trades count
      const tradesResult = await queryOne<{ count: number }>(
        `SELECT COUNT(*) as count FROM trade_offers 
         WHERE (sender_id = ? OR receiver_id = ?) 
         AND status = 'completed'`,
        [userId, userId]
      )

      // Get total views on user's listings
      const viewsResult = await queryOne<{ total: number }>(
        "SELECT COALESCE(SUM(views), 0) as total FROM listings WHERE user_id = ?",
        [userId]
      )

      // Get pending offers count
      const offersResult = await queryOne<{ count: number }>(
        `SELECT COUNT(*) as count FROM trade_offers 
         WHERE receiver_id = ? AND status = 'pending'`,
        [userId]
      )

      // Get unread messages count
      const messagesResult = await queryOne<{ count: number }>(
        `SELECT COUNT(*) as count FROM messages m
         JOIN conversation_participants cp ON m.conversation_id = cp.conversation_id
         WHERE cp.user_id = ? AND m.sender_id != ? AND m.read_at IS NULL`,
        [userId, userId]
      )

      // Get saved items count
      const savedResult = await queryOne<{ count: number }>(
        "SELECT COUNT(*) as count FROM saved_listings WHERE user_id = ?",
        [userId]
      )

      // Get wallet balance
      const walletResult = await queryOne<{ wallet_balance: number }>(
        "SELECT wallet_balance FROM users WHERE id = ?",
        [userId]
      )

      // Get listings created this week
      const weekListingsResult = await queryOne<{ count: number }>(
        `SELECT COUNT(*) as count FROM listings 
         WHERE user_id = ? AND created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)`,
        [userId]
      )

      // Get trades this month
      const monthTradesResult = await queryOne<{ count: number }>(
        `SELECT COUNT(*) as count FROM trade_offers 
         WHERE (sender_id = ? OR receiver_id = ?) 
         AND status = 'completed'
         AND updated_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)`,
        [userId, userId]
      )

      // Get views today
      const todayViewsResult = await queryOne<{ total: number }>(
        `SELECT COALESCE(SUM(lv.view_count), 0) as total 
         FROM listing_views lv
         JOIN listings l ON lv.listing_id = l.id
         WHERE l.user_id = ? AND lv.viewed_at >= CURDATE()`,
        [userId]
      )

      // Calculate success rate
      const totalOffersResult = await queryOne<{ total: number; completed: number }>(
        `SELECT 
           COUNT(*) as total,
           SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed
         FROM trade_offers 
         WHERE sender_id = ? OR receiver_id = ?`,
        [userId, userId]
      )

      const totalOffers = totalOffersResult?.total || 0
      const completedOffers = totalOffersResult?.completed || 0
      const successRate = totalOffers > 0 
        ? Math.round((completedOffers / totalOffers) * 100) 
        : 0

      // Determine rank percentile based on trades and success rate
      let rankPercentile = "New Trader"
      if (completedOffers >= 50) rankPercentile = "Top 5%"
      else if (completedOffers >= 25) rankPercentile = "Top 10%"
      else if (completedOffers >= 10) rankPercentile = "Top 25%"
      else if (completedOffers >= 5) rankPercentile = "Top 50%"

      const stats: UserStats = {
        activeListings: listingsResult?.count || 0,
        successfulTrades: tradesResult?.count || 0,
        totalViews: viewsResult?.total || 0,
        successRate,
        pendingOffers: offersResult?.count || 0,
        unreadMessages: messagesResult?.count || 0,
        savedItems: savedResult?.count || 0,
        walletBalance: walletResult?.wallet_balance || 0,
        trends: {
          listingsThisWeek: weekListingsResult?.count || 0,
          tradesThisMonth: monthTradesResult?.count || 0,
          viewsToday: todayViewsResult?.total || 0,
          rankPercentile,
        },
      }

      return NextResponse.json({ stats, source: "database" })
    } catch (dbError) {
      console.error("Database error fetching user stats:", dbError)
      // Fall through to demo data
    }

    // Return demo data when database not available
    const demoStats: UserStats = {
      activeListings: 12,
      successfulTrades: 28,
      totalViews: 1256,
      successRate: 94,
      pendingOffers: 3,
      unreadMessages: 5,
      savedItems: 18,
      walletBalance: 500,
      trends: {
        listingsThisWeek: 2,
        tradesThisMonth: 5,
        viewsToday: 156,
        rankPercentile: "Top 10%",
      },
    }

    return NextResponse.json({ stats: demoStats, source: "demo" })
  } catch (error) {
    console.error("Error fetching user stats:", error)
    return NextResponse.json(
      { error: "Failed to fetch stats" },
      { status: 500 }
    )
  }
}
