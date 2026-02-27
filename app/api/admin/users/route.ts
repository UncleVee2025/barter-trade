import { type NextRequest, NextResponse } from "next/server"
import { verifyAuth } from "@/lib/auth"
import { query, queryOne, execute, generateId } from "@/lib/db"

// GET - List all users with pagination and filters
export async function GET(request: NextRequest) {
  try {
    const auth = await verifyAuth(request)
    if (!auth || auth.role !== "admin") {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 })
    }

    const searchParams = request.nextUrl.searchParams
    const page = Number.parseInt(searchParams.get("page") || "1")
    const limit = Number.parseInt(searchParams.get("limit") || "20")
    const search = searchParams.get("search")
    const status = searchParams.get("status") // active, banned, all
    const role = searchParams.get("role") // user, admin, all
    const region = searchParams.get("region")
    const sort = searchParams.get("sort") || "newest"
    const offset = (page - 1) * limit

    // Build WHERE conditions separately - used for both count and data queries
    let whereConditions = "WHERE 1=1"
    const params: (string | number)[] = []

    if (search) {
      whereConditions += ` AND (u.name LIKE ? OR u.email LIKE ? OR u.phone LIKE ?)`
      params.push(`%${search}%`, `%${search}%`, `%${search}%`)
    }

    if (status === "active") {
      whereConditions += ` AND u.is_banned = FALSE`
    } else if (status === "banned") {
      whereConditions += ` AND u.is_banned = TRUE`
    }

    if (role && role !== "all") {
      whereConditions += ` AND u.role = ?`
      params.push(role)
    }

    if (region) {
      whereConditions += ` AND u.region = ?`
      params.push(region)
    }

    // Count total with a clean, separate query
    const countSql = `SELECT COUNT(*) as total FROM users u ${whereConditions}`
    const countResult = await query<{ total: number }>(countSql, params)
    const total = Number(countResult[0]?.total) || 0

    // Build the main data query
    let sql = `
      SELECT 
        u.id,
        u.email,
        u.name,
        u.phone,
        u.region,
        u.town,
        u.avatar,
        u.role,
        u.wallet_balance,
        u.is_verified,
        u.is_banned,
        u.ban_reason,
        u.last_seen,
        u.created_at,
        COALESCE((SELECT COUNT(*) FROM listings l WHERE l.user_id = u.id), 0) as listing_count,
        COALESCE((SELECT COUNT(*) FROM trade_offers t WHERE t.sender_id = u.id OR t.receiver_id = u.id), 0) as trade_count
      FROM users u
      ${whereConditions}
    `

    // Sorting
    switch (sort) {
      case "oldest":
        sql += ` ORDER BY u.created_at ASC`
        break
      case "name":
        sql += ` ORDER BY u.name ASC`
        break
      case "balance_high":
        sql += ` ORDER BY u.wallet_balance DESC`
        break
      case "balance_low":
        sql += ` ORDER BY u.wallet_balance ASC`
        break
      case "last_active":
        sql += ` ORDER BY u.last_seen DESC`
        break
      default:
        sql += ` ORDER BY u.created_at DESC`
    }

    sql += ` LIMIT ? OFFSET ?`
    // Clone params and add pagination
    const dataParams = [...params, limit, offset]

    const users = await query<Record<string, unknown>>(sql, dataParams)

    // Safe transformation with defensive null checks
    const transformedUsers = users.map((user) => ({
      id: user.id || "",
      email: user.email || "",
      name: user.name || "Unknown",
      phone: user.phone || null,
      region: user.region || "",
      town: user.town || null,
      avatar: user.avatar || null,
      role: user.role || "user",
      walletBalance: Number(user.wallet_balance) || 0,
      isVerified: Boolean(user.is_verified),
      isBanned: Boolean(user.is_banned),
      banReason: user.ban_reason || null,
      lastSeen: user.last_seen || null,
      createdAt: user.created_at || new Date(),
      listingCount: Number(user.listing_count) || 0,
      tradeCount: Number(user.trade_count) || 0,
    }))

    return NextResponse.json({
      users: transformedUsers,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit) || 1,
        hasMore: offset + users.length < total,
      },
    })
  } catch (error) {
    console.error("Admin users list error:", error)
    return NextResponse.json({ error: "Failed to fetch users" }, { status: 500 })
  }
}

// POST - Create new user (admin)
export async function POST(request: NextRequest) {
  try {
    const auth = await verifyAuth(request)
    if (!auth || auth.role !== "admin") {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 })
    }

    const body = await request.json()
    const { email, name, phone, region, role = "user", password } = body

    if (!email || !name || !region || !password) {
      return NextResponse.json(
        { error: "Email, name, region, and password are required" },
        { status: 400 }
      )
    }

    // Check if email already exists
    const existing = await queryOne<{ id: string }>(
      `SELECT id FROM users WHERE email = ?`,
      [email]
    )

    if (existing) {
      return NextResponse.json({ error: "Email already exists" }, { status: 400 })
    }

    // Hash password using bcrypt
    const bcrypt = await import("bcryptjs")
    const passwordHash = await bcrypt.hash(password, 12)

    const userId = generateId()
    await execute(
      `INSERT INTO users (id, email, password_hash, name, phone, region, role) 
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [userId, email, passwordHash, name, phone || null, region, role]
    )

    // Log activity
    await execute(
      `INSERT INTO activity_log (id, user_id, action, entity_type, entity_id, details) 
       VALUES (?, ?, 'admin_create_user', 'user', ?, ?)`,
      [generateId(), auth.userId, userId, JSON.stringify({ email, name, role })]
    )

    return NextResponse.json({
      success: true,
      userId,
      message: "User created successfully",
    })
  } catch (error) {
    console.error("Admin create user error:", error)
    return NextResponse.json({ error: "Failed to create user" }, { status: 500 })
  }
}
