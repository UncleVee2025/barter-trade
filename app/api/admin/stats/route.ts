import { type NextRequest, NextResponse } from "next/server"
import { verifyAuth } from "@/lib/auth"
import { queryOne, query } from "@/lib/db"

export async function GET(request: NextRequest) {
  try {
    const auth = await verifyAuth(request)
    if (!auth || auth.role !== "admin") {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 })
    }

    // User stats
    const userStats = await queryOne<{
      total: number
      active: number
      new_today: number
      new_week: number
    }>(`
      SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN last_seen >= DATE_SUB(NOW(), INTERVAL 7 DAY) THEN 1 ELSE 0 END) as active,
        SUM(CASE WHEN DATE(created_at) = CURDATE() THEN 1 ELSE 0 END) as new_today,
        SUM(CASE WHEN created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY) THEN 1 ELSE 0 END) as new_week
      FROM users WHERE is_banned = FALSE
    `)

    // Listing stats
    const listingStats = await queryOne<{
      total: number
      active: number
      pending: number
      flagged: number
    }>(`
      SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN status = 'active' THEN 1 ELSE 0 END) as active,
        SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending,
        SUM(CASE WHEN status = 'flagged' THEN 1 ELSE 0 END) as flagged
      FROM listings
    `)

    // Transaction stats
    const transactionStats = await queryOne<{
      total: number
      volume: number
      today_volume: number
    }>(`
      SELECT 
        COUNT(*) as total,
        COALESCE(SUM(amount), 0) as volume,
        COALESCE(SUM(CASE WHEN DATE(created_at) = CURDATE() THEN amount ELSE 0 END), 0) as today_volume
      FROM transactions WHERE status = 'completed'
    `)

    // Trade stats
    const tradeStats = await queryOne<{
      total: number
      completed: number
      pending: number
    }>(`
      SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN status = 'accepted' THEN 1 ELSE 0 END) as completed,
        SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending
      FROM trade_offers
    `)

    // Revenue breakdown
    const revenue = await queryOne<{
      total: number
      listing_fees: number
      transfer_fees: number
      today: number
    }>(`
      SELECT 
        COALESCE(SUM(fee), 0) as total,
        COALESCE(SUM(CASE WHEN type = 'listing_fee' THEN fee ELSE 0 END), 0) as listing_fees,
        COALESCE(SUM(CASE WHEN type IN ('transfer_in', 'transfer_out') THEN fee ELSE 0 END), 0) as transfer_fees,
        COALESCE(SUM(CASE WHEN DATE(created_at) = CURDATE() THEN fee ELSE 0 END), 0) as today
      FROM transactions WHERE status = 'completed'
    `)

    // Region stats
    const regionStats = await query<{
      region: string
      users: number
      listings: number
    }>(`
      SELECT 
        u.region,
        COUNT(DISTINCT u.id) as users,
        COUNT(DISTINCT l.id) as listings
      FROM users u
      LEFT JOIN listings l ON u.region = l.region AND l.status = 'active'
      WHERE u.region IS NOT NULL AND u.region != ''
      GROUP BY u.region
      ORDER BY users DESC
      LIMIT 10
    `)

    // Category stats
    const categoryStats = await query<{
      category: string
      listings: number
      category_id: string
    }>(`
      SELECT 
        c.name as category,
        c.id as category_id,
        COUNT(l.id) as listings
      FROM categories c
      LEFT JOIN listings l ON c.id = l.category_id AND l.status = 'active'
      GROUP BY c.id, c.name
      ORDER BY listings DESC
      LIMIT 10
    `)

    // Voucher stats - status enum is: 'unused', 'used', 'disabled', 'expired'
    const voucherStats = await queryOne<{
      total: number
      available: number
      redeemed: number
      total_value: number
    }>(`
      SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN status = 'unused' THEN 1 ELSE 0 END) as available,
        SUM(CASE WHEN status = 'used' THEN 1 ELSE 0 END) as redeemed,
        COALESCE(SUM(amount), 0) as total_value
      FROM vouchers
    `)

    // Pending top-up requests count
    const pendingTopups = await queryOne<{ count: number }>(`
      SELECT COUNT(*) as count FROM topup_requests WHERE status = 'pending'
    `)

    // Pending user reports count
    const pendingReports = await queryOne<{ count: number }>(`
      SELECT COUNT(*) as count FROM reports WHERE status = 'pending'
    `)

    // Calculate growth rates
    const lastWeekUsers = await queryOne<{ count: number }>(`
      SELECT COUNT(*) as count FROM users 
      WHERE created_at >= DATE_SUB(NOW(), INTERVAL 14 DAY) 
      AND created_at < DATE_SUB(NOW(), INTERVAL 7 DAY)
    `)

    const userGrowth = lastWeekUsers?.count && lastWeekUsers.count > 0
      ? (((userStats?.new_week || 0) - lastWeekUsers.count) / lastWeekUsers.count) * 100
      : 0

    const tradeSuccessRate = tradeStats?.total && Number(tradeStats.total) > 0
      ? (Number(tradeStats.completed) / Number(tradeStats.total)) * 100
      : 0

    const stats = {
      totalUsers: Number(userStats?.total) || 0,
      activeUsers: Number(userStats?.active) || 0,
      newUsersToday: Number(userStats?.new_today) || 0,
      userGrowth: Math.round(userGrowth * 10) / 10,

      totalListings: Number(listingStats?.total) || 0,
      activeListings: Number(listingStats?.active) || 0,
      pendingListings: Number(listingStats?.pending) || 0,
      flaggedListings: Number(listingStats?.flagged) || 0,

      totalTransactions: Number(transactionStats?.total) || 0,
      transactionVolume: Number(transactionStats?.volume) || 0,
      todayVolume: Number(transactionStats?.today_volume) || 0,
      volumeGrowth: 0,

      totalTrades: Number(tradeStats?.total) || 0,
      completedTrades: Number(tradeStats?.completed) || 0,
      pendingTrades: Number(tradeStats?.pending) || 0,
      tradeSuccessRate: Math.round(tradeSuccessRate * 10) / 10,

      revenue: {
        total: Number(revenue?.total) || 0,
        listingFees: Number(revenue?.listing_fees) || 0,
        transferFees: Number(revenue?.transfer_fees) || 0,
        today: Number(revenue?.today) || 0,
      },

      vouchers: {
        total: Number(voucherStats?.total) || 0,
        available: Number(voucherStats?.available) || 0,
        redeemed: Number(voucherStats?.redeemed) || 0,
        totalValue: Number(voucherStats?.total_value) || 0,
      },

      regionStats: regionStats.map(r => ({
        region: r.region,
        users: Number(r.users),
        listings: Number(r.listings),
      })),

      categoryStats: categoryStats.map(c => ({
        category: c.category,
        listings: Number(c.listings),
      })),

      // Pending action counts
      pendingTopupRequests: Number(pendingTopups?.count) || 0,
      pendingReports: Number(pendingReports?.count) || 0,
    }

    return NextResponse.json(stats)
  } catch (error) {
    console.error("Admin stats error:", error)
    return NextResponse.json({ error: "Failed to fetch stats" }, { status: 500 })
  }
}
