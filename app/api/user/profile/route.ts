import { type NextRequest, NextResponse } from "next/server"
import { query } from "@/lib/db"
import { verifyAuth } from "@/lib/auth"

// GET /api/user/profile - Get current user profile
export async function GET(request: NextRequest) {
  try {
    const auth = await verifyAuth(request)
    
    if (!auth) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get user profile with stats
    // Note: trade_offers uses sender_id and receiver_id, not buyer_id/seller_id
    const userResult = await query(
      `SELECT 
        u.id, u.name, u.email, u.phone, u.avatar, u.region, u.role, u.town,
        u.is_verified as isVerified, u.created_at as createdAt,
        u.id_verification_status as idVerificationStatus,
        (SELECT COUNT(*) FROM listings WHERE user_id = u.id AND status = 'active') as activeListings,
        (SELECT COUNT(*) FROM trade_offers WHERE (sender_id = u.id OR receiver_id = u.id) AND status = 'accepted') as completedTrades,
        (SELECT AVG(rating) FROM user_ratings WHERE to_user_id = u.id) as averageRating
      FROM users u
      WHERE u.id = ?`,
      [auth.userId]
    )

    if (!userResult || userResult.length === 0) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    const profile = userResult[0]

    return NextResponse.json({
      user: {
        id: profile.id,
        name: profile.name,
        email: profile.email,
        phone: profile.phone,
        avatar: profile.avatar,
        region: profile.region,
        role: profile.role,
        isVerified: Boolean(profile.isVerified),
        createdAt: profile.createdAt,
        stats: {
          activeListings: profile.activeListings || 0,
          completedTrades: profile.completedTrades || 0,
          averageRating: profile.averageRating ? Number(profile.averageRating).toFixed(1) : null,
        },
      },
    })
  } catch (error) {
    console.error("Error fetching user profile:", error)
    return NextResponse.json({ error: "Failed to fetch profile" }, { status: 500 })
  }
}

// PATCH /api/user/profile - Update current user profile
export async function PATCH(request: NextRequest) {
  try {
    const auth = await verifyAuth(request)
    
    if (!auth) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { name, phone, region, bio, avatar } = body

    // Validate inputs
    if (name && (name.length < 2 || name.length > 100)) {
      return NextResponse.json({ error: "Name must be between 2 and 100 characters" }, { status: 400 })
    }

    if (phone && !/^(\+264|0)?[0-9]{8,10}$/.test(phone.replace(/\s/g, ""))) {
      return NextResponse.json({ error: "Invalid phone number format" }, { status: 400 })
    }

    // Build update query dynamically
    const updates: string[] = []
    const values: (string | null)[] = []

    if (name !== undefined) {
      updates.push("name = ?")
      values.push(name.trim())
    }
    if (phone !== undefined) {
      updates.push("phone = ?")
      values.push(phone ? phone.trim() : null)
    }
    if (region !== undefined) {
      updates.push("region = ?")
      values.push(region || null)
    }
    if (bio !== undefined) {
      updates.push("bio = ?")
      values.push(bio ? bio.trim() : null)
    }
    if (avatar !== undefined) {
      updates.push("avatar = ?")
      values.push(avatar || null)
    }

    if (updates.length === 0) {
      return NextResponse.json({ error: "No fields to update" }, { status: 400 })
    }

    updates.push("updated_at = NOW()")
    values.push(auth.userId)

    await query(
      `UPDATE users SET ${updates.join(", ")} WHERE id = ?`,
      values
    )

    // Fetch updated user
    const updatedUserResult = await query(
      `SELECT id, name, email, phone, avatar, region, role, is_verified as isVerified 
       FROM users WHERE id = ?`,
      [auth.userId]
    )

    return NextResponse.json({
      message: "Profile updated successfully",
      user: updatedUserResult[0],
    })
  } catch (error) {
    console.error("Error updating user profile:", error)
    return NextResponse.json({ error: "Failed to update profile" }, { status: 500 })
  }
}
