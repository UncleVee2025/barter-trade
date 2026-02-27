// Admin Analytics API - Comprehensive dashboard analytics
import { NextRequest, NextResponse } from "next/server"
import { query } from "@/lib/db"
import { verifyAuth } from "@/lib/auth"

export async function GET(request: NextRequest) {
  try {
    const auth = await verifyAuth(request)
    if (!auth || auth.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const period = searchParams.get("period") || "7d" // 7d, 30d, 90d, 1y
    const type = searchParams.get("type") || "overview" // overview, users, listings, transactions, engagement

    // Calculate date range
    let dateInterval: string
    switch (period) {
      case "30d":
        dateInterval = "30 DAY"
        break
      case "90d":
        dateInterval = "90 DAY"
        break
      case "1y":
        dateInterval = "365 DAY"
        break
      default:
        dateInterval = "7 DAY"
    }

    if (type === "overview") {
      // Get comprehensive overview stats
      const [userStats] = await query<{
        total_users: number
        new_users: number
        verified_users: number
        banned_users: number
        online_users: number
      }>(`
        SELECT 
          COUNT(*) as total_users,
          SUM(CASE WHEN created_at >= DATE_SUB(NOW(), INTERVAL ${dateInterval}) THEN 1 ELSE 0 END) as new_users,
          SUM(CASE WHEN is_verified = 1 THEN 1 ELSE 0 END) as verified_users,
          SUM(CASE WHEN is_banned = 1 THEN 1 ELSE 0 END) as banned_users,
          SUM(CASE WHEN last_seen >= DATE_SUB(NOW(), INTERVAL 15 MINUTE) THEN 1 ELSE 0 END) as online_users
        FROM users WHERE role != 'admin'
      `)

      const [listingStats] = await query<{
        total_listings: number
        active_listings: number
        new_listings: number
        pending_listings: number
        flagged_listings: number
      }>(`
        SELECT 
          COUNT(*) as total_listings,
          SUM(CASE WHEN status = 'active' THEN 1 ELSE 0 END) as active_listings,
          SUM(CASE WHEN created_at >= DATE_SUB(NOW(), INTERVAL ${dateInterval}) THEN 1 ELSE 0 END) as new_listings,
          SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending_listings,
          SUM(CASE WHEN status = 'flagged' THEN 1 ELSE 0 END) as flagged_listings
        FROM listings
      `)

      const [transactionStats] = await query<{
        total_volume: number
        transaction_count: number
        avg_transaction: number
        total_fees: number
      }>(`
        SELECT 
          COALESCE(SUM(amount), 0) as total_volume,
          COUNT(*) as transaction_count,
          COALESCE(AVG(amount), 0) as avg_transaction,
          COALESCE(SUM(fee), 0) as total_fees
        FROM transactions
        WHERE created_at >= DATE_SUB(NOW(), INTERVAL ${dateInterval})
          AND status = 'completed'
      `)

      const [tradeStats] = await query<{
        total_trades: number
        completed_trades: number
        pending_trades: number
        success_rate: number
      }>(`
        SELECT 
          COUNT(*) as total_trades,
          SUM(CASE WHEN status = 'accepted' THEN 1 ELSE 0 END) as completed_trades,
          SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending_trades,
          ROUND(SUM(CASE WHEN status = 'accepted' THEN 1 ELSE 0 END) * 100.0 / NULLIF(COUNT(*), 0), 1) as success_rate
        FROM trade_offers
        WHERE created_at >= DATE_SUB(NOW(), INTERVAL ${dateInterval})
      `)

      const [walletStats] = await query<{
        total_balance: number
        topup_volume: number
        transfer_volume: number
      }>(`
        SELECT 
          COALESCE(SUM(wallet_balance), 0) as total_balance,
          (SELECT COALESCE(SUM(amount), 0) FROM transactions WHERE type = 'topup' AND status = 'completed' AND created_at >= DATE_SUB(NOW(), INTERVAL ${dateInterval})) as topup_volume,
          (SELECT COALESCE(SUM(amount), 0) FROM transactions WHERE type IN ('transfer_in', 'transfer_out') AND status = 'completed' AND created_at >= DATE_SUB(NOW(), INTERVAL ${dateInterval})) as transfer_volume
        FROM users
      `)

      // Get daily stats for chart
      const dailyStats = await query<{
        date: string
        users: number
        listings: number
        transactions: number
        volume: number
      }>(`
        SELECT 
          DATE(created_at) as date,
          0 as users,
          0 as listings,
          COUNT(*) as transactions,
          COALESCE(SUM(amount), 0) as volume
        FROM transactions
        WHERE created_at >= DATE_SUB(NOW(), INTERVAL ${dateInterval})
        GROUP BY DATE(created_at)
        ORDER BY date ASC
      `)

      // Get user registration trend
      const userTrend = await query<{ date: string; count: number }>(`
        SELECT DATE(created_at) as date, COUNT(*) as count
        FROM users
        WHERE created_at >= DATE_SUB(NOW(), INTERVAL ${dateInterval})
        GROUP BY DATE(created_at)
        ORDER BY date ASC
      `)

      // Get listing creation trend
      const listingTrend = await query<{ date: string; count: number }>(`
        SELECT DATE(created_at) as date, COUNT(*) as count
        FROM listings
        WHERE created_at >= DATE_SUB(NOW(), INTERVAL ${dateInterval})
        GROUP BY DATE(created_at)
        ORDER BY date ASC
      `)

      // Get top categories
      const topCategories = await query<{ name: string; count: number; percentage: number }>(`
        SELECT 
          c.name,
          COUNT(l.id) as count,
          ROUND(COUNT(l.id) * 100.0 / NULLIF((SELECT COUNT(*) FROM listings WHERE status = 'active'), 0), 1) as percentage
        FROM categories c
        LEFT JOIN listings l ON c.id = l.category_id AND l.status = 'active'
        GROUP BY c.id, c.name
        ORDER BY count DESC
        LIMIT 6
      `)

      // Get regional distribution
      const regionStats = await query<{ region: string; users: number; listings: number }>(`
        SELECT 
          region,
          COUNT(DISTINCT CASE WHEN role != 'admin' THEN id END) as users,
          0 as listings
        FROM users
        GROUP BY region
        ORDER BY users DESC
      `)

      return NextResponse.json({
        period,
        users: userStats || { total_users: 0, new_users: 0, verified_users: 0, banned_users: 0, online_users: 0 },
        listings: listingStats || { total_listings: 0, active_listings: 0, new_listings: 0, pending_listings: 0, flagged_listings: 0 },
        transactions: transactionStats || { total_volume: 0, transaction_count: 0, avg_transaction: 0, total_fees: 0 },
        trades: tradeStats || { total_trades: 0, completed_trades: 0, pending_trades: 0, success_rate: 0 },
        wallet: walletStats || { total_balance: 0, topup_volume: 0, transfer_volume: 0 },
        trends: {
          daily: dailyStats || [],
          users: userTrend || [],
          listings: listingTrend || []
        },
        topCategories: topCategories || [],
        regionStats: regionStats || []
      })
    }

    if (type === "users") {
      // Detailed user analytics
      const verificationStats = await query<{ status: string; count: number }>(`
        SELECT id_verification_status as status, COUNT(*) as count
        FROM users WHERE role != 'admin'
        GROUP BY id_verification_status
      `)

      const activityStats = await query<{
        date: string
        active_users: number
        new_signups: number
        returning_users: number
      }>(`
        SELECT 
          DATE(last_seen) as date,
          COUNT(DISTINCT id) as active_users,
          SUM(CASE WHEN DATE(created_at) = DATE(last_seen) THEN 1 ELSE 0 END) as new_signups,
          SUM(CASE WHEN DATE(created_at) != DATE(last_seen) THEN 1 ELSE 0 END) as returning_users
        FROM users
        WHERE last_seen >= DATE_SUB(NOW(), INTERVAL ${dateInterval})
        GROUP BY DATE(last_seen)
        ORDER BY date ASC
      `)

      const topUsers = await query<{
        id: string
        name: string
        email: string
        listing_count: number
        trade_count: number
        wallet_balance: number
      }>(`
        SELECT 
          u.id, u.name, u.email, u.wallet_balance,
          COUNT(DISTINCT l.id) as listing_count,
          COUNT(DISTINCT t.id) as trade_count
        FROM users u
        LEFT JOIN listings l ON u.id = l.user_id
        LEFT JOIN trade_offers t ON u.id = t.sender_id OR u.id = t.receiver_id
        WHERE u.role != 'admin'
        GROUP BY u.id
        ORDER BY listing_count DESC
        LIMIT 10
      `)

      return NextResponse.json({
        verification: verificationStats || [],
        activity: activityStats || [],
        topUsers: topUsers || []
      })
    }

    if (type === "engagement") {
      // Engagement metrics
      const messageStats = await query<{ date: string; count: number }>(`
        SELECT DATE(created_at) as date, COUNT(*) as count
        FROM messages
        WHERE created_at >= DATE_SUB(NOW(), INTERVAL ${dateInterval})
        GROUP BY DATE(created_at)
        ORDER BY date ASC
      `)

      const viewStats = await query<{ total_views: number; avg_views: number }>(`
        SELECT SUM(views) as total_views, AVG(views) as avg_views
        FROM listings
        WHERE status = 'active'
      `)

      const saveStats = await query<{ total_saves: number; avg_saves: number }>(`
        SELECT SUM(saves) as total_saves, AVG(saves) as avg_saves
        FROM listings
        WHERE status = 'active'
      `)

      return NextResponse.json({
        messages: messageStats || [],
        views: viewStats?.[0] || { total_views: 0, avg_views: 0 },
        saves: saveStats?.[0] || { total_saves: 0, avg_saves: 0 }
      })
    }

    return NextResponse.json({ error: "Invalid analytics type" }, { status: 400 })
  } catch (error) {
    console.error("Analytics fetch error:", error)
    return NextResponse.json({ error: "Failed to fetch analytics" }, { status: 500 })
  }
}
