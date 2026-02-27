import { NextRequest, NextResponse } from "next/server"
import { query } from "@/lib/db"
import { verifyAuth } from "@/lib/auth"

// GET - List all certified users or pending certification requests
export async function GET(request: NextRequest) {
  try {
    const user = await verifyAuth(request)
    if (!user || user.role !== 'admin') {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const filter = searchParams.get('filter') || 'all'
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const offset = (page - 1) * limit

    let whereClause = '1=1'
    if (filter === 'certified') {
      whereClause = 'u.is_certified = TRUE'
    } else if (filter === 'eligible') {
      whereClause = 'u.is_certified = FALSE'
    }

    const result = await query(
      `SELECT 
        u.id,
        u.full_name,
        u.email,
        u.phone,
        u.location,
        u.avatar_url,
        u.is_certified,
        u.certification_date,
        u.certification_badge_type,
        u.certification_id,
        u.total_trades,
        u.rating,
        u.created_at,
        u.email_verified,
        u.phone_verified,
        u.id_verified,
        (SELECT COUNT(*) FROM offers WHERE (seller_id = u.id OR buyer_id = u.id) AND status = 'completed') as completed_trades_count
      FROM users u
      WHERE ${whereClause}
      ORDER BY u.is_certified DESC, u.total_trades DESC
      LIMIT ? OFFSET ?`,
      [limit, offset]
    )

    // Get total count
    const countResult = await query(
      `SELECT COUNT(*) as total FROM users u WHERE ${whereClause}`,
      []
    )
    const total = (countResult as any[])[0]?.total || 0

    // Get certification stats
    const statsResult = await query(
      `SELECT 
        COUNT(CASE WHEN is_certified = TRUE THEN 1 END) as certified_count,
        COUNT(CASE WHEN is_certified = FALSE THEN 1 END) as uncertified_count,
        COUNT(CASE WHEN certification_badge_type = 'platinum' THEN 1 END) as platinum_count,
        COUNT(CASE WHEN certification_badge_type = 'gold' THEN 1 END) as gold_count,
        COUNT(CASE WHEN certification_badge_type = 'silver' THEN 1 END) as silver_count,
        COUNT(CASE WHEN certification_badge_type = 'bronze' THEN 1 END) as bronze_count
      FROM users`,
      []
    )
    const stats = (statsResult as any[])[0]

    return NextResponse.json({
      users: result,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      },
      stats: {
        certified: stats?.certified_count || 0,
        uncertified: stats?.uncertified_count || 0,
        byBadge: {
          platinum: stats?.platinum_count || 0,
          gold: stats?.gold_count || 0,
          silver: stats?.silver_count || 0,
          bronze: stats?.bronze_count || 0
        }
      }
    })
  } catch (error) {
    console.error("Error fetching certification data:", error)
    return NextResponse.json(
      { error: "Failed to fetch certification data" },
      { status: 500 }
    )
  }
}

// POST - Manually certify or revoke certification for a user
export async function POST(request: NextRequest) {
  try {
    const admin = await verifyAuth(request)
    if (!admin || admin.role !== 'admin') {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { userId, action, badgeType, notes } = body

    if (!userId || !action) {
      return NextResponse.json(
        { error: "User ID and action are required" },
        { status: 400 }
      )
    }

    // Get current user status
    const userResult = await query(
      "SELECT id, full_name, is_certified, certification_id FROM users WHERE id = ?",
      [userId]
    )
    const user = (userResult as any[])[0]

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    if (action === 'certify') {
      if (user.is_certified) {
        return NextResponse.json(
          { error: "User is already certified" },
          { status: 400 }
        )
      }

      // Generate certification ID
      const certificationId = `BT-${Date.now().toString(36).toUpperCase()}-${userId.toString().padStart(6, '0')}`
      
      await query(
        `UPDATE users SET 
          is_certified = TRUE,
          certification_date = NOW(),
          certification_badge_type = ?,
          certification_id = ?
        WHERE id = ?`,
        [badgeType || 'bronze', certificationId, userId]
      )

      // Log the action
      await query(
        `INSERT INTO certification_logs (user_id, action, performed_by, notes)
         VALUES (?, 'certified', ?, ?)`,
        [userId, admin.id, notes || 'Manual certification by admin']
      )

      return NextResponse.json({
        success: true,
        message: `User ${user.full_name} has been certified`,
        certificationId
      })

    } else if (action === 'revoke') {
      if (!user.is_certified) {
        return NextResponse.json(
          { error: "User is not certified" },
          { status: 400 }
        )
      }

      await query(
        `UPDATE users SET 
          is_certified = FALSE,
          certification_date = NULL,
          certification_badge_type = NULL,
          certification_id = NULL
        WHERE id = ?`,
        [userId]
      )

      // Log the action
      await query(
        `INSERT INTO certification_logs (user_id, action, performed_by, notes)
         VALUES (?, 'revoked', ?, ?)`,
        [userId, admin.id, notes || 'Certification revoked by admin']
      )

      return NextResponse.json({
        success: true,
        message: `Certification for ${user.full_name} has been revoked`
      })

    } else if (action === 'upgrade') {
      if (!user.is_certified) {
        return NextResponse.json(
          { error: "User must be certified first" },
          { status: 400 }
        )
      }

      await query(
        `UPDATE users SET certification_badge_type = ? WHERE id = ?`,
        [badgeType, userId]
      )

      // Log the action
      await query(
        `INSERT INTO certification_logs (user_id, action, performed_by, notes)
         VALUES (?, 'badge_upgraded', ?, ?)`,
        [userId, admin.id, notes || `Badge upgraded to ${badgeType}`]
      )

      return NextResponse.json({
        success: true,
        message: `Badge upgraded to ${badgeType} for ${user.full_name}`
      })
    }

    return NextResponse.json(
      { error: "Invalid action" },
      { status: 400 }
    )
  } catch (error) {
    console.error("Error processing certification action:", error)
    return NextResponse.json(
      { error: "Failed to process certification action" },
      { status: 500 }
    )
  }
}
