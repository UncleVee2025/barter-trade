import { NextRequest, NextResponse } from "next/server"
import { query, queryOne, execute, generateId } from "@/lib/db"
import { verifyAuth } from "@/lib/auth"

// GET - Generate QR code data for user
export async function GET(request: NextRequest) {
  try {
    const auth = await verifyAuth(request)
    if (!auth) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Fetch user data with proper column names matching production database schema
    const userData = await queryOne<Record<string, unknown>>(
      `SELECT 
        u.id,
        u.name,
        u.email,
        u.phone,
        u.region,
        u.town,
        u.avatar,
        u.is_verified,
        u.is_certified,
        u.certified_at,
        u.qr_code,
        u.completed_trades,
        u.created_at,
        COALESCE((SELECT COUNT(*) FROM trade_offers t WHERE (t.sender_id = u.id OR t.receiver_id = u.id) AND t.status = 'accepted'), 0) as total_trades,
        COALESCE((SELECT AVG(rating) FROM user_ratings WHERE to_user_id = u.id), 0) as avg_rating,
        COALESCE((SELECT COUNT(*) FROM user_ratings WHERE to_user_id = u.id), 0) as rating_count
      FROM users u
      WHERE u.id = ?`,
      [auth.userId]
    )

    if (!userData) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    // Generate QR code if not exists
    let qrCode = userData.qr_code as string | null
    if (!qrCode) {
      qrCode = `BTN-${(userData.id as string).substring(0, 8).toUpperCase()}-${Math.floor(Math.random() * 100000).toString().padStart(5, '0')}`
      await execute(`UPDATE users SET qr_code = ? WHERE id = ?`, [qrCode, auth.userId])
    }

    // Generate QR code payload
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://bartertrade.app'
    const profileUrl = `${baseUrl}/users/${auth.userId}`
    
    // Determine badge type based on trades
    const totalTrades = Number(userData.total_trades) || Number(userData.completed_trades) || 0
    let badgeType: 'bronze' | 'silver' | 'gold' | 'platinum' | null = null
    if (totalTrades >= 100) badgeType = 'platinum'
    else if (totalTrades >= 50) badgeType = 'gold'
    else if (totalTrades >= 25) badgeType = 'silver'
    else if (totalTrades >= 10) badgeType = 'bronze'
    
    // QR code data includes verification info
    const qrPayload = {
      type: 'barter_trade_user',
      version: '1.0',
      userId: auth.userId,
      name: userData.name,
      certified: Boolean(userData.is_certified),
      certificationId: qrCode,
      badgeType,
      profileUrl,
      timestamp: new Date().toISOString()
    }

    // Encode as base64 for QR code
    const qrData = Buffer.from(JSON.stringify(qrPayload)).toString('base64')

    return NextResponse.json({
      qrData,
      profileUrl,
      user: {
        id: userData.id,
        name: userData.name,
        avatar: userData.avatar,
        location: userData.region ? `${userData.town ? userData.town + ', ' : ''}${userData.region}` : null,
        isCertified: Boolean(userData.is_certified),
        certificationId: qrCode,
        badgeType,
        totalTrades,
        rating: Number(userData.avg_rating) || 0,
        memberSince: userData.created_at
      }
    })
  } catch (error) {
    console.error("Error generating QR code:", error)
    return NextResponse.json(
      { error: "Failed to generate QR code" },
      { status: 500 }
    )
  }
}

// POST - Log QR code scan and retrieve user info
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { scannedUserId, scannerUserId, action } = body

    if (!scannedUserId) {
      return NextResponse.json(
        { error: "Scanned user ID is required" },
        { status: 400 }
      )
    }

    // Get scanned user info with proper column names
    const userData = await queryOne<Record<string, unknown>>(
      `SELECT 
        u.id,
        u.name,
        u.email,
        u.phone,
        u.region,
        u.town,
        u.avatar,
        u.is_verified,
        u.is_certified,
        u.certified_at,
        u.qr_code,
        u.completed_trades,
        u.created_at,
        COALESCE((SELECT COUNT(*) FROM trade_offers t WHERE (t.sender_id = u.id OR t.receiver_id = u.id) AND t.status = 'accepted'), 0) as total_trades,
        COALESCE((SELECT AVG(rating) FROM user_ratings WHERE to_user_id = u.id), 0) as avg_rating,
        COALESCE((SELECT COUNT(*) FROM listings WHERE user_id = u.id AND status = 'active'), 0) as active_listings
      FROM users u
      WHERE u.id = ?`,
      [scannedUserId]
    )

    if (!userData) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    // Log the scan
    const scanId = generateId()
    const ipAddress = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown'
    const userAgent = request.headers.get('user-agent') || null
    
    try {
      await execute(
        `INSERT INTO qr_scans (id, scanned_user_id, scanner_user_id, action, ip_address, user_agent, scanned_at)
         VALUES (?, ?, ?, ?, ?, ?, NOW())`,
        [scanId, scannedUserId, scannerUserId || null, action || 'view_profile', ipAddress, userAgent]
      )
    } catch {
      // Table might not exist yet, continue without logging
    }

    // Determine badge type based on trades
    const totalTrades = Number(userData.total_trades) || Number(userData.completed_trades) || 0
    let badgeType: 'bronze' | 'silver' | 'gold' | 'platinum' | null = null
    if (totalTrades >= 100) badgeType = 'platinum'
    else if (totalTrades >= 50) badgeType = 'gold'
    else if (totalTrades >= 25) badgeType = 'silver'
    else if (totalTrades >= 10) badgeType = 'bronze'

    // Get recent reviews/ratings if table exists
    let recentReviews: Record<string, unknown>[] = []
    try {
      recentReviews = await query<Record<string, unknown>>(
        `SELECT 
          r.rating,
          r.comment,
          r.created_at,
          u.name as reviewer_name,
          u.avatar as reviewer_avatar
        FROM user_ratings r
        JOIN users u ON r.from_user_id = u.id
        WHERE r.to_user_id = ?
        ORDER BY r.created_at DESC
        LIMIT 3`,
        [scannedUserId]
      )
    } catch {
      // Table might not exist or have different schema
    }

    return NextResponse.json({
      verified: true,
      user: {
        id: userData.id,
        name: userData.name,
        avatar: userData.avatar,
        location: userData.region ? `${userData.town ? userData.town + ', ' : ''}${userData.region}` : null,
        isCertified: Boolean(userData.is_certified),
        certificationId: userData.qr_code,
        certificationDate: userData.certified_at,
        badgeType,
        totalTrades,
        rating: Number(userData.avg_rating) || 0,
        memberSince: userData.created_at
      },
      stats: {
        completedTrades: totalTrades,
        activeListings: Number(userData.active_listings) || 0
      },
      recentReviews: recentReviews.map(r => ({
        rating: r.rating,
        comment: r.comment,
        createdAt: r.created_at,
        reviewerName: r.reviewer_name,
        reviewerAvatar: r.reviewer_avatar
      }))
    })
  } catch (error) {
    console.error("Error processing QR scan:", error)
    return NextResponse.json(
      { error: "Failed to process QR scan" },
      { status: 500 }
    )
  }
}
