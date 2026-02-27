import { NextRequest, NextResponse } from "next/server"
import { query } from "@/lib/db"
import { verifyAuth } from "@/lib/auth"

// GET - Get business card data
export async function GET(request: NextRequest) {
  try {
    const user = await verifyAuth(request)
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const result = await query(
      `SELECT 
        u.id,
        u.full_name,
        u.email,
        u.phone,
        u.location,
        u.bio,
        u.avatar_url,
        u.is_certified,
        u.certification_date,
        u.certification_badge_type,
        u.certification_id,
        u.total_trades,
        u.rating,
        u.created_at
      FROM users u
      WHERE u.id = ?`,
      [user.id]
    )

    const userData = (result as any[])[0]
    
    if (!userData) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    // Get trade categories the user is active in
    const categoriesResult = await query(
      `SELECT DISTINCT l.category, COUNT(*) as count
       FROM listings l
       WHERE l.user_id = ? AND l.status = 'active'
       GROUP BY l.category
       ORDER BY count DESC
       LIMIT 3`,
      [user.id]
    )

    // Get stats
    const statsResult = await query(
      `SELECT 
        COUNT(DISTINCT CASE WHEN status = 'completed' THEN id END) as completed_trades,
        COUNT(DISTINCT CASE WHEN status = 'active' THEN id END) as active_listings
      FROM offers
      WHERE seller_id = ? OR buyer_id = ?`,
      [user.id, user.id]
    )
    const stats = (statsResult as any[])[0]

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://bartertrade.app'

    return NextResponse.json({
      user: {
        id: userData.id,
        name: userData.full_name,
        email: userData.email,
        phone: userData.phone,
        location: userData.location,
        bio: userData.bio,
        avatar: userData.avatar_url,
        isCertified: Boolean(userData.is_certified),
        certificationId: userData.certification_id,
        certificationDate: userData.certification_date,
        badgeType: userData.certification_badge_type,
        memberSince: userData.created_at
      },
      stats: {
        totalTrades: stats?.completed_trades || userData.total_trades || 0,
        rating: userData.rating || 0,
        activeListings: stats?.active_listings || 0
      },
      categories: (categoriesResult as any[]) || [],
      profileUrl: `${baseUrl}/users/${user.id}`,
      qrCodeUrl: `${baseUrl}/api/user/qr-code`
    })
  } catch (error) {
    console.error("Error fetching business card data:", error)
    return NextResponse.json(
      { error: "Failed to fetch business card data" },
      { status: 500 }
    )
  }
}

// POST - Log business card download/share
export async function POST(request: NextRequest) {
  try {
    const user = await verifyAuth(request)
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { action, format, recipientInfo } = body

    // Log the download/share action
    await query(
      `INSERT INTO business_card_downloads (user_id, download_format, shared_with, ip_address)
       VALUES (?, ?, ?, ?)`,
      [
        user.id, 
        format || 'png', 
        recipientInfo || null,
        request.headers.get('x-forwarded-for') || 'unknown'
      ]
    )

    return NextResponse.json({
      success: true,
      message: `Business card ${action || 'downloaded'} successfully`
    })
  } catch (error) {
    console.error("Error logging business card action:", error)
    return NextResponse.json(
      { error: "Failed to log action" },
      { status: 500 }
    )
  }
}
