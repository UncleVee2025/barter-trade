import { type NextRequest, NextResponse } from "next/server"
import { verifyAuth } from "@/lib/auth"
import { query, execute, generateId, transaction } from "@/lib/db"
import type { PoolConnection } from "mysql2/promise"

// GET - List all listings for admin with filters
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
    const status = searchParams.get("status") // pending, active, flagged, sold, expired, all
    const category = searchParams.get("category")
    const region = searchParams.get("region")
    const featured = searchParams.get("featured")
    const sort = searchParams.get("sort") || "newest"
    const offset = (page - 1) * limit

    // Build WHERE conditions separately - used for both count and data queries
    let whereConditions = "WHERE 1=1"
    const params: (string | number)[] = []

    if (search) {
      whereConditions += ` AND (l.title LIKE ? OR l.description LIKE ? OR u.name LIKE ?)`
      params.push(`%${search}%`, `%${search}%`, `%${search}%`)
    }

    if (status && status !== "all") {
      whereConditions += ` AND l.status = ?`
      params.push(status)
    }

    if (category) {
      whereConditions += ` AND (c.slug = ? OR c.id = ?)`
      params.push(category, category)
    }

    if (region) {
      whereConditions += ` AND l.region = ?`
      params.push(region)
    }

    if (featured === "true") {
      whereConditions += ` AND l.featured = TRUE`
    } else if (featured === "false") {
      whereConditions += ` AND l.featured = FALSE`
    }

    // Clean, separate count query - no regex manipulation
    const countSql = `
      SELECT COUNT(*) as total 
      FROM listings l
      LEFT JOIN users u ON l.user_id = u.id
      LEFT JOIN categories c ON l.category_id = c.id
      ${whereConditions}
    `
    const countResult = await query<{ total: number }>(countSql, params)
    const total = Number(countResult[0]?.total) || 0

    // Build the main data query
    let sql = `
      SELECT 
        l.id,
        l.user_id,
        l.title,
        l.description,
        l.category_id,
        l.type,
        l.value,
        l.currency,
        l.condition,
        l.region,
        l.town,
        l.status,
        l.views,
        l.saves,
        l.featured,
        l.trade_preferences,
        l.created_at,
        l.updated_at,
        u.name as user_name,
        u.email as user_email,
        u.is_verified as user_verified,
        u.is_banned as user_banned,
        c.name as category_name,
        c.slug as category_slug,
        COALESCE((SELECT COUNT(*) FROM listing_reports lr WHERE lr.listing_id = l.id AND lr.status = 'pending'), 0) as report_count,
        (SELECT li.url FROM listing_images li WHERE li.listing_id = l.id AND li.is_primary = TRUE LIMIT 1) as primary_image
      FROM listings l
      LEFT JOIN users u ON l.user_id = u.id
      LEFT JOIN categories c ON l.category_id = c.id
      ${whereConditions}
    `

    // Sorting
    switch (sort) {
      case "oldest":
        sql += ` ORDER BY l.created_at ASC`
        break
      case "value_high":
        sql += ` ORDER BY l.value DESC`
        break
      case "value_low":
        sql += ` ORDER BY l.value ASC`
        break
      case "views":
        sql += ` ORDER BY l.views DESC`
        break
      case "reports":
        sql += ` ORDER BY report_count DESC, l.created_at DESC`
        break
      default:
        sql += ` ORDER BY l.created_at DESC`
    }

    sql += ` LIMIT ? OFFSET ?`
    // Clone params and add pagination
    const dataParams = [...params, limit, offset]

    const listings = await query<Record<string, unknown>>(sql, dataParams)

    // Safe transformation with defensive null checks
    const transformedListings = listings.map((listing) => ({
      id: listing.id || "",
      title: listing.title || "Untitled",
      description: listing.description || null,
      category: listing.category_slug || "other",
      categoryName: listing.category_name || "Other",
      value: Number(listing.value) || 0,
      condition: listing.condition || "good",
      region: listing.region || "",
      town: listing.town || null,
      status: listing.status || "pending",
      views: Number(listing.views) || 0,
      saves: Number(listing.saves) || 0,
      featured: Boolean(listing.featured),
      reportCount: Number(listing.report_count) || 0,
      primaryImage: listing.primary_image || "/placeholder.svg",
      createdAt: listing.created_at || new Date(),
      user: {
        id: listing.user_id || "",
        name: listing.user_name || "Unknown",
        email: listing.user_email || "",
        isVerified: Boolean(listing.user_verified),
        isBanned: Boolean(listing.user_banned),
      },
    }))

    return NextResponse.json({
      listings: transformedListings,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit) || 1,
        hasMore: offset + listings.length < total,
      },
    })
  } catch (error) {
    console.error("Admin listings list error:", error)
    return NextResponse.json({ error: "Failed to fetch listings" }, { status: 500 })
  }
}

// PATCH - Bulk update listings (admin)
export async function PATCH(request: NextRequest) {
  try {
    const auth = await verifyAuth(request)
    if (!auth || auth.role !== "admin") {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 })
    }

    const body = await request.json()
    const { listingIds, action, reason } = body

    if (!listingIds || !Array.isArray(listingIds) || listingIds.length === 0) {
      return NextResponse.json({ error: "Listing IDs are required" }, { status: 400 })
    }

    if (!action) {
      return NextResponse.json({ error: "Action is required" }, { status: 400 })
    }

    await transaction(async (conn: PoolConnection) => {
      const placeholders = listingIds.map(() => "?").join(",")

      switch (action) {
        case "approve":
          await conn.execute(
            `UPDATE listings SET status = 'active', updated_at = NOW() WHERE id IN (${placeholders}) AND status = 'pending'`,
            listingIds
          )
          break
        case "flag":
          await conn.execute(
            `UPDATE listings SET status = 'flagged', updated_at = NOW() WHERE id IN (${placeholders})`,
            listingIds
          )
          break
        case "unflag":
          await conn.execute(
            `UPDATE listings SET status = 'active', updated_at = NOW() WHERE id IN (${placeholders}) AND status = 'flagged'`,
            listingIds
          )
          break
        case "feature":
          await conn.execute(
            `UPDATE listings SET featured = TRUE, updated_at = NOW() WHERE id IN (${placeholders})`,
            listingIds
          )
          break
        case "unfeature":
          await conn.execute(
            `UPDATE listings SET featured = FALSE, updated_at = NOW() WHERE id IN (${placeholders})`,
            listingIds
          )
          break
        case "delete":
          await conn.execute(`DELETE FROM listings WHERE id IN (${placeholders})`, listingIds)
          break
        default:
          throw new Error("Invalid action")
      }

      // Log activity
      await conn.execute(
        `INSERT INTO activity_log (id, user_id, action, entity_type, entity_id, details) 
         VALUES (?, ?, ?, 'listing', ?, ?)`,
        [
          generateId(),
          auth.userId,
          `admin_${action}_listings`,
          listingIds[0],
          JSON.stringify({ listingIds, reason }),
        ]
      )
    })

    return NextResponse.json({
      success: true,
      message: `${listingIds.length} listing(s) ${action}ed successfully`,
    })
  } catch (error) {
    console.error("Admin bulk update listings error:", error)
    return NextResponse.json({ error: "Failed to update listings" }, { status: 500 })
  }
}
