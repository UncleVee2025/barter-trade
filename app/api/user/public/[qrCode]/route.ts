import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db'
import { v4 as uuidv4 } from 'uuid'

// GET - Get public profile by QR code
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ qrCode: string }> }
) {
  try {
    const { qrCode } = await params

    if (!qrCode) {
      return NextResponse.json({ error: 'QR code required' }, { status: 400 })
    }

    // Find user by QR code
    const results = await query(
      `SELECT 
        u.id,
        u.name,
        u.email,
        u.avatar_url,
        u.town,
        u.region,
        u.id_verified,
        u.email_verified,
        u.phone_verified,
        u.created_at as member_since,
        uc.is_certified,
        uc.display_title,
        uc.certified_at,
        uc.completed_trades_count,
        ug.tier,
        ug.total_points,
        ug.completed_trades as gamification_trades,
        (SELECT COUNT(*) FROM listings WHERE user_id = u.id AND status = 'active') as active_listings,
        (SELECT AVG(rating) FROM user_reviews WHERE reviewed_user_id = u.id) as average_rating,
        (SELECT COUNT(*) FROM user_reviews WHERE reviewed_user_id = u.id) as review_count
       FROM user_certification uc
       JOIN users u ON uc.user_id = u.id
       LEFT JOIN user_gamification ug ON u.id = ug.user_id
       WHERE uc.qr_code_data = ? AND uc.is_certified = TRUE`,
      [qrCode]
    )

    if (results.length === 0) {
      return NextResponse.json({ 
        error: 'Profile not found or not certified' 
      }, { status: 404 })
    }

    const user = results[0]

    // Log QR scan
    const scannerIp = request.headers.get('x-forwarded-for') || 
                      request.headers.get('x-real-ip') || 
                      'unknown'
    const userAgent = request.headers.get('user-agent') || 'unknown'

    await query(
      `INSERT INTO qr_scan_logs (id, certification_id, scanned_at, scanner_ip, user_agent)
       SELECT ?, uc.id, NOW(), ?, ?
       FROM user_certification uc WHERE uc.qr_code_data = ?`,
      [uuidv4(), scannerIp.split(',')[0].trim(), userAgent.slice(0, 500), qrCode]
    ).catch(() => {}) // Ignore if table doesn't exist

    // Get recent listings
    const listings = await query(
      `SELECT id, title, category, price, images, condition, status, created_at
       FROM listings 
       WHERE user_id = ? AND status = 'active'
       ORDER BY created_at DESC
       LIMIT 6`,
      [user.id]
    )

    // Build location string
    const locationParts = [user.town, user.region].filter(Boolean)
    const location = locationParts.length > 0 ? locationParts.join(', ') : 'Namibia'

    // Calculate trust score
    const trustFactors = {
      id_verified: user.id_verified ? 30 : 0,
      email_verified: user.email_verified ? 20 : 0,
      phone_verified: user.phone_verified ? 20 : 0,
      trades: Math.min(user.completed_trades_count * 2, 20),
      rating: user.average_rating ? Math.round(user.average_rating * 2) : 0
    }
    const trustScore = Object.values(trustFactors).reduce((a, b) => a + b, 0)

    return NextResponse.json({
      // Basic info
      id: user.id,
      name: user.name,
      avatar_url: user.avatar_url,
      location: location,
      member_since: user.member_since,
      
      // Certification
      is_certified: user.is_certified,
      display_title: user.display_title || 'Certified Barter Trader',
      certified_at: user.certified_at,
      
      // Verifications
      verifications: {
        id: user.id_verified,
        email: user.email_verified,
        phone: user.phone_verified
      },
      
      // Stats
      stats: {
        completed_trades: user.completed_trades_count || 0,
        active_listings: user.active_listings || 0,
        average_rating: user.average_rating ? parseFloat(user.average_rating).toFixed(1) : null,
        review_count: user.review_count || 0,
        trust_score: trustScore
      },
      
      // Gamification
      tier: user.tier || 'bronze',
      total_points: user.total_points || 0,
      
      // Recent listings
      recent_listings: listings.map((l: any) => ({
        id: l.id,
        title: l.title,
        category: l.category,
        price: l.price,
        image: l.images ? (typeof l.images === 'string' ? JSON.parse(l.images)[0] : l.images[0]) : null,
        condition: l.condition
      })),
      
      // Actions available
      actions: {
        can_message: true,
        can_transfer_credits: true,
        can_view_listings: true,
        can_make_offer: true
      }
    })

  } catch (error) {
    console.error('Error fetching public profile:', error)
    return NextResponse.json({ error: 'Failed to load profile' }, { status: 500 })
  }
}
