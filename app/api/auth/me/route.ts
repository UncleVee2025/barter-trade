import { type NextRequest, NextResponse } from "next/server"
import { verifyAuth } from "@/lib/auth"
import { queryOne } from "@/lib/db"

interface UserRow {
  id: string
  email: string
  name: string
  phone: string | null
  gender: string | null
  date_of_birth: string | null
  region: string
  town: string | null
  street_address: string | null
  postal_code: string | null
  avatar: string | null
  role: "user" | "admin"
  wallet_balance: number
  is_verified: boolean
  is_banned: boolean
  ban_reason: string | null
  id_verification_status: string | null
  id_rejection_reason: string | null
  national_id_front: string | null
  national_id_back: string | null
  created_at: Date
  last_seen: Date
}

export async function GET(request: NextRequest) {
  try {
    const auth = await verifyAuth(request)
    if (!auth) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const user = await queryOne<UserRow>(
      `SELECT 
        id, email, name, phone, gender, date_of_birth, region, town, 
        street_address, postal_code, avatar, role, wallet_balance, 
        is_verified, is_banned, ban_reason, id_verification_status, 
        id_rejection_reason, national_id_front, national_id_back,
        created_at, last_seen
      FROM users WHERE id = ?`,
      [auth.userId]
    )

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    // Update last_seen
    await queryOne(`UPDATE users SET last_seen = NOW() WHERE id = ?`, [auth.userId])

    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        phone: user.phone,
        gender: user.gender,
        dateOfBirth: user.date_of_birth,
        region: user.region,
        town: user.town,
        streetAddress: user.street_address,
        postalCode: user.postal_code,
        avatar: user.avatar,
        role: user.role,
        walletBalance: Number(user.wallet_balance),
        isVerified: Boolean(user.is_verified),
        isBanned: Boolean(user.is_banned),
        banReason: user.ban_reason,
        idVerificationStatus: user.id_verification_status || "not_submitted",
        idRejectionReason: user.id_rejection_reason,
        nationalIdFront: user.national_id_front,
        nationalIdBack: user.national_id_back,
        createdAt: user.created_at,
        lastSeen: user.last_seen,
      },
    })
  } catch (error) {
    console.error("Get current user error:", error)
    return NextResponse.json({ error: "Failed to get user" }, { status: 500 })
  }
}
