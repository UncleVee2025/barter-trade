import { type NextRequest, NextResponse } from "next/server"
import { verifyAuth } from "@/lib/auth"
import { query } from "@/lib/db"

interface UserLookup {
  id: string
  name: string
  phone: string | null
  email: string
  avatar: string | null
  is_verified: boolean
}

// GET - Lookup user by phone or email for credit transfers
export async function GET(request: NextRequest) {
  try {
    const auth = await verifyAuth(request)
    if (!auth) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const searchParams = request.nextUrl.searchParams
    const q = searchParams.get("q")

    if (!q || q.length < 3) {
      return NextResponse.json({ users: [] })
    }

    // Clean up phone number formats
    const cleanedQuery = q.replace(/\s/g, "").replace(/^\+264/, "0")
    
    // Search by phone or email
    const users = await query<UserLookup>(
      `SELECT id, name, phone, email, avatar, is_verified
       FROM users 
       WHERE (
         phone LIKE ? OR 
         phone LIKE ? OR 
         email LIKE ?
       )
       AND id != ?
       AND is_banned = 0
       LIMIT 5`,
      [`%${q}%`, `%${cleanedQuery}%`, `%${q}%`, auth.userId]
    )

    // Return users with minimal info for privacy
    return NextResponse.json({
      users: users.map(u => ({
        id: u.id,
        name: u.name,
        phone: u.phone ? maskPhone(u.phone) : null,
        email: maskEmail(u.email),
        avatar: u.avatar,
        isVerified: Boolean(u.is_verified),
        // Return full identifiers for actual transfer
        phoneRaw: u.phone,
        emailRaw: u.email,
      }))
    })
  } catch (error) {
    console.error("User lookup error:", error)
    return NextResponse.json({ error: "Failed to lookup user" }, { status: 500 })
  }
}

// Mask phone number for privacy (show last 4 digits)
function maskPhone(phone: string): string {
  if (!phone || phone.length < 4) return "***"
  return "***" + phone.slice(-4)
}

// Mask email for privacy
function maskEmail(email: string): string {
  if (!email) return "***"
  const [local, domain] = email.split("@")
  if (!local || !domain) return "***@***"
  const maskedLocal = local.length > 2 ? local[0] + "***" + local[local.length - 1] : "***"
  return `${maskedLocal}@${domain}`
}
