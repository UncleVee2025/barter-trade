import { NextRequest, NextResponse } from "next/server"
import { query } from "@/lib/db"
import { verifyAuth } from "@/lib/auth"

// GET - Fetch user's certification status
export async function GET(request: NextRequest) {
  try {
    const user = await verifyAuth(request)
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const result = await query(
      `SELECT 
        id,
        full_name,
        email,
        phone,
        location,
        bio,
        avatar_url,
        is_certified,
        certification_date,
        certification_badge_type,
        certification_id,
        total_trades,
        rating,
        created_at,
        email_verified,
        phone_verified,
        id_verified
      FROM users 
      WHERE id = ?`,
      [user.id]
    )

    const userData = (result as any[])[0]
    
    if (!userData) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    // Calculate certification eligibility
    const eligibilityResult = await query(
      `SELECT 
        COUNT(DISTINCT CASE WHEN (seller_id = ? OR buyer_id = ?) AND status = 'completed' THEN id END) as completed_trades,
        (SELECT COUNT(*) FROM reviews WHERE reviewed_user_id = ? AND rating >= 4) as positive_reviews
      FROM offers
      WHERE (seller_id = ? OR buyer_id = ?) AND status = 'completed'`,
      [user.id, user.id, user.id, user.id, user.id]
    )

    const eligibility = (eligibilityResult as any[])[0]
    
    const certificationData = {
      ...userData,
      is_certified: Boolean(userData.is_certified),
      eligibility: {
        completedTrades: eligibility?.completed_trades || 0,
        positiveReviews: eligibility?.positive_reviews || 0,
        requiredTrades: 10,
        isEligible: (eligibility?.completed_trades || 0) >= 10 && 
                    Boolean(userData.email_verified) && 
                    Boolean(userData.phone_verified)
      }
    }

    return NextResponse.json(certificationData)
  } catch (error) {
    console.error("Error fetching certification:", error)
    return NextResponse.json(
      { error: "Failed to fetch certification status" },
      { status: 500 }
    )
  }
}

// POST - Request certification (self-service for eligible users)
export async function POST(request: NextRequest) {
  try {
    const user = await verifyAuth(request)
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Check if already certified
    const existingResult = await query(
      "SELECT is_certified FROM users WHERE id = ?",
      [user.id]
    )
    
    if ((existingResult as any[])[0]?.is_certified) {
      return NextResponse.json(
        { error: "User is already certified" },
        { status: 400 }
      )
    }

    // Check eligibility
    const eligibilityResult = await query(
      `SELECT 
        COUNT(DISTINCT CASE WHEN status = 'completed' THEN id END) as completed_trades
      FROM offers
      WHERE (seller_id = ? OR buyer_id = ?) AND status = 'completed'`,
      [user.id, user.id]
    )

    const completedTrades = (eligibilityResult as any[])[0]?.completed_trades || 0

    // Get user verification status
    const userResult = await query(
      "SELECT email_verified, phone_verified FROM users WHERE id = ?",
      [user.id]
    )
    const userData = (userResult as any[])[0]

    if (completedTrades < 10) {
      return NextResponse.json(
        { 
          error: "Not eligible for certification",
          message: `You need ${10 - completedTrades} more completed trades to be eligible.`
        },
        { status: 400 }
      )
    }

    if (!userData?.email_verified || !userData?.phone_verified) {
      return NextResponse.json(
        { 
          error: "Not eligible for certification",
          message: "You must verify your email and phone number first."
        },
        { status: 400 }
      )
    }

    // Generate certification ID
    const certificationId = `BT-${Date.now().toString(36).toUpperCase()}-${user.id.toString().padStart(6, '0')}`
    
    // Determine badge type based on trades
    let badgeType = 'bronze'
    if (completedTrades >= 100) badgeType = 'platinum'
    else if (completedTrades >= 50) badgeType = 'gold'
    else if (completedTrades >= 25) badgeType = 'silver'

    // Update user certification
    await query(
      `UPDATE users SET 
        is_certified = TRUE,
        certification_date = NOW(),
        certification_badge_type = ?,
        certification_id = ?
      WHERE id = ?`,
      [badgeType, certificationId, user.id]
    )

    // Log certification
    await query(
      `INSERT INTO certification_logs (user_id, action, performed_by, notes)
       VALUES (?, 'certified', ?, 'Self-service certification - met eligibility requirements')`,
      [user.id, user.id]
    )

    return NextResponse.json({
      success: true,
      message: "Congratulations! You are now a certified trader.",
      certificationId,
      badgeType
    })
  } catch (error) {
    console.error("Error processing certification:", error)
    return NextResponse.json(
      { error: "Failed to process certification" },
      { status: 500 }
    )
  }
}
