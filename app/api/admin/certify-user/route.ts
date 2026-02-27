import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db'
import { verifyToken } from '@/lib/auth'
import { v4 as uuidv4 } from 'uuid'

// POST - Admin grant/revoke certification
export async function POST(request: NextRequest) {
  try {
    const token = request.cookies.get('token')?.value
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const decoded = await verifyToken(token)
    if (!decoded || !decoded.userId) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
    }

    // Verify admin status
    const admins = await query(
      'SELECT id, role FROM users WHERE id = ? AND role = "admin"',
      [decoded.userId]
    )

    if (admins.length === 0) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    const adminId = decoded.userId
    const body = await request.json()
    const { user_id, action, reason, display_title } = body

    if (!user_id) {
      return NextResponse.json({ error: 'User ID required' }, { status: 400 })
    }

    if (!['grant', 'revoke'].includes(action)) {
      return NextResponse.json({ error: 'Invalid action. Use "grant" or "revoke"' }, { status: 400 })
    }

    // Verify target user exists
    const users = await query(
      'SELECT id, name, email FROM users WHERE id = ?',
      [user_id]
    )

    if (users.length === 0) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const targetUser = users[0]

    if (action === 'grant') {
      // Generate QR code data
      const qrCodeData = `BTN-${uuidv4().toUpperCase().slice(0, 8)}-${user_id.slice(0, 8)}`
      
      // Check if certification record exists
      const existing = await query(
        'SELECT id FROM user_certification WHERE user_id = ?',
        [user_id]
      )

      if (existing.length > 0) {
        // Update existing record
        await query(
          `UPDATE user_certification SET
            is_certified = TRUE,
            certification_type = 'admin_granted',
            certified_at = NOW(),
            certified_by = ?,
            certification_reason = ?,
            display_title = ?,
            qr_code_data = COALESCE(qr_code_data, ?),
            updated_at = NOW()
          WHERE user_id = ?`,
          [adminId, reason || 'Admin granted certification', 
           display_title || 'Certified Barter Trader', qrCodeData, user_id]
        )
      } else {
        // Create new record
        await query(
          `INSERT INTO user_certification 
            (id, user_id, is_certified, certification_type, certified_at, certified_by, 
             certification_reason, display_title, qr_code_data)
          VALUES (?, ?, TRUE, 'admin_granted', NOW(), ?, ?, ?, ?)`,
          [uuidv4(), user_id, adminId, reason || 'Admin granted certification',
           display_title || 'Certified Barter Trader', qrCodeData]
        )
      }

      // Log admin action
      await query(
        `INSERT INTO activity_log (id, user_id, action, details, created_at)
         VALUES (?, ?, 'admin_certification_granted', ?, NOW())`,
        [uuidv4(), adminId, JSON.stringify({ 
          target_user_id: user_id, 
          target_user_name: targetUser.name,
          reason 
        })]
      ).catch(() => {})

      // Notify user
      await query(
        `INSERT INTO notifications (id, user_id, type, title, message, created_at)
         VALUES (?, ?, 'certification', 'Certification Granted!', 
         'Congratulations! You have been certified as a Barter Trader by an administrator.', NOW())`,
        [uuidv4(), user_id]
      ).catch(() => {})

      return NextResponse.json({
        success: true,
        message: `Certification granted to ${targetUser.name}`,
        user: {
          id: user_id,
          name: targetUser.name,
          email: targetUser.email
        }
      })

    } else {
      // Revoke certification
      await query(
        `UPDATE user_certification SET
          is_certified = FALSE,
          certification_type = NULL,
          certified_at = NULL,
          certified_by = NULL,
          certification_reason = ?,
          updated_at = NOW()
        WHERE user_id = ?`,
        [reason || 'Certification revoked by admin', user_id]
      )

      // Log admin action
      await query(
        `INSERT INTO activity_log (id, user_id, action, details, created_at)
         VALUES (?, ?, 'admin_certification_revoked', ?, NOW())`,
        [uuidv4(), adminId, JSON.stringify({ 
          target_user_id: user_id, 
          target_user_name: targetUser.name,
          reason 
        })]
      ).catch(() => {})

      // Notify user
      await query(
        `INSERT INTO notifications (id, user_id, type, title, message, created_at)
         VALUES (?, ?, 'certification', 'Certification Status Update', 
         'Your certification status has been updated. Please contact support for more information.', NOW())`,
        [uuidv4(), user_id]
      ).catch(() => {})

      return NextResponse.json({
        success: true,
        message: `Certification revoked from ${targetUser.name}`,
        user: {
          id: user_id,
          name: targetUser.name,
          email: targetUser.email
        }
      })
    }

  } catch (error) {
    console.error('Error processing admin certification:', error)
    return NextResponse.json({ error: 'Failed to process certification' }, { status: 500 })
  }
}

// GET - Get all certifications for admin view
export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get('token')?.value
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const decoded = await verifyToken(token)
    if (!decoded || !decoded.userId) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
    }

    // Verify admin status
    const admins = await query(
      'SELECT id FROM users WHERE id = ? AND role = "admin"',
      [decoded.userId]
    )

    if (admins.length === 0) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const status = searchParams.get('status') // 'certified', 'pending', 'all'
    const offset = (page - 1) * limit

    let whereClause = ''
    if (status === 'certified') {
      whereClause = 'WHERE uc.is_certified = TRUE'
    } else if (status === 'pending') {
      whereClause = 'WHERE uc.is_certified = FALSE OR uc.id IS NULL'
    }

    // Get certifications with user data
    const certifications = await query(
      `SELECT 
        u.id as user_id,
        u.name,
        u.email,
        u.avatar_url,
        u.created_at as member_since,
        uc.id as certification_id,
        uc.is_certified,
        uc.certification_type,
        uc.certified_at,
        uc.certification_reason,
        uc.qr_code_data,
        uc.completed_trades_count,
        uc.card_download_count,
        admin.name as certified_by_name,
        (SELECT COUNT(*) FROM trade_offers WHERE (buyer_id = u.id OR seller_id = u.id) AND status = 'completed') as actual_trades
       FROM users u
       LEFT JOIN user_certification uc ON u.id = uc.user_id
       LEFT JOIN users admin ON uc.certified_by = admin.id
       ${whereClause}
       ORDER BY uc.certified_at DESC, u.created_at DESC
       LIMIT ? OFFSET ?`,
      [limit, offset]
    )

    // Get total count
    const countResult = await query(
      `SELECT COUNT(*) as total FROM users u
       LEFT JOIN user_certification uc ON u.id = uc.user_id
       ${whereClause}`
    )

    return NextResponse.json({
      certifications,
      pagination: {
        page,
        limit,
        total: countResult[0].total,
        total_pages: Math.ceil(countResult[0].total / limit)
      }
    })

  } catch (error) {
    console.error('Error fetching certifications:', error)
    return NextResponse.json({ error: 'Failed to fetch certifications' }, { status: 500 })
  }
}
