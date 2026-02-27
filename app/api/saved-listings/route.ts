import { type NextRequest, NextResponse } from "next/server"
import { verifyAuth } from "@/lib/auth"
import { query, queryOne, execute, generateId } from "@/lib/db"

// GET - Fetch user's saved listings
export async function GET(request: NextRequest) {
  try {
    const auth = await verifyAuth(request)
    if (!auth) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const searchParams = request.nextUrl.searchParams
    const page = Number.parseInt(searchParams.get("page") || "1")
    const limit = Number.parseInt(searchParams.get("limit") || "20")
    const offset = (page - 1) * limit

    // Count total
    const countResult = await queryOne<{ total: number }>(
      `SELECT COUNT(*) as total FROM saved_listings WHERE user_id = ?`,
      [auth.userId]
    )
    const total = countResult?.total || 0

    // Get saved listings with full details
    const savedListings = await query<Record<string, unknown>>(
      `SELECT 
        sl.id as save_id,
        sl.created_at as saved_at,
        l.*,
        u.name as user_name,
        u.avatar as user_avatar,
        u.is_verified as user_verified,
        c.name as category_name,
        c.slug as category_slug,
        c.icon as category_icon,
        (SELECT li.url FROM listing_images li WHERE li.listing_id = l.id AND li.is_primary = TRUE LIMIT 1) as primary_image
      FROM saved_listings sl
      LEFT JOIN listings l ON sl.listing_id = l.id
      LEFT JOIN users u ON l.user_id = u.id
      LEFT JOIN categories c ON l.category_id = c.id
      WHERE sl.user_id = ?
      ORDER BY sl.created_at DESC
      LIMIT ? OFFSET ?`,
      [auth.userId, limit, offset]
    )

    const transformedListings = savedListings.map((item) => ({
      saveId: item.save_id,
      savedAt: item.saved_at,
      id: item.id,
      userId: item.user_id,
      title: item.title,
      description: item.description,
      category: item.category_slug,
      categoryName: item.category_name,
      categoryIcon: item.category_icon,
      type: item.type,
      value: Number(item.value),
      condition: item.condition,
      primaryImage: item.primary_image || "/placeholder.svg",
      location: {
        region: item.region,
        town: item.town,
      },
      status: item.status,
      views: item.views,
      createdAt: item.created_at,
      user: {
        id: item.user_id,
        name: item.user_name,
        avatar: item.user_avatar,
        isVerified: Boolean(item.user_verified),
      },
    }))

    return NextResponse.json({
      listings: transformedListings,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    console.error("Error fetching saved listings:", error)
    return NextResponse.json({ error: "Failed to fetch saved listings" }, { status: 500 })
  }
}

// POST - Save a listing
export async function POST(request: NextRequest) {
  try {
    const auth = await verifyAuth(request)
    if (!auth) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { listingId } = await request.json()

    if (!listingId) {
      return NextResponse.json({ error: "listingId is required" }, { status: 400 })
    }

    // Check if listing exists
    const listing = await queryOne<{ id: string; user_id: string }>(
      `SELECT id, user_id FROM listings WHERE id = ?`,
      [listingId]
    )

    if (!listing) {
      return NextResponse.json({ error: "Listing not found" }, { status: 404 })
    }

    // Check if already saved
    const existingSave = await queryOne<{ id: string }>(
      `SELECT id FROM saved_listings WHERE user_id = ? AND listing_id = ?`,
      [auth.userId, listingId]
    )

    if (existingSave) {
      return NextResponse.json({ error: "Listing already saved" }, { status: 409 })
    }

    // Save listing
    const saveId = generateId()
    await execute(
      `INSERT INTO saved_listings (id, user_id, listing_id) VALUES (?, ?, ?)`,
      [saveId, auth.userId, listingId]
    )

    // Update saves count
    await execute(`UPDATE listings SET saves = saves + 1 WHERE id = ?`, [listingId])

    return NextResponse.json({
      success: true,
      saveId,
      message: "Listing saved successfully",
    })
  } catch (error) {
    console.error("Error saving listing:", error)
    return NextResponse.json({ error: "Failed to save listing" }, { status: 500 })
  }
}

// DELETE - Remove saved listing
export async function DELETE(request: NextRequest) {
  try {
    const auth = await verifyAuth(request)
    if (!auth) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const searchParams = request.nextUrl.searchParams
    const listingId = searchParams.get("listingId")

    if (!listingId) {
      return NextResponse.json({ error: "listingId is required" }, { status: 400 })
    }

    // Check if saved
    const savedListing = await queryOne<{ id: string }>(
      `SELECT id FROM saved_listings WHERE user_id = ? AND listing_id = ?`,
      [auth.userId, listingId]
    )

    if (!savedListing) {
      return NextResponse.json({ error: "Listing not saved" }, { status: 404 })
    }

    // Remove save
    await execute(`DELETE FROM saved_listings WHERE user_id = ? AND listing_id = ?`, [auth.userId, listingId])

    // Update saves count
    await execute(`UPDATE listings SET saves = GREATEST(saves - 1, 0) WHERE id = ?`, [listingId])

    return NextResponse.json({
      success: true,
      message: "Listing removed from saved",
    })
  } catch (error) {
    console.error("Error removing saved listing:", error)
    return NextResponse.json({ error: "Failed to remove saved listing" }, { status: 500 })
  }
}
