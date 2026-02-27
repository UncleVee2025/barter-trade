import { type NextRequest, NextResponse } from "next/server"
import { verifyAuth } from "@/lib/auth"
import { queryOne, execute, generateId, query } from "@/lib/db"

// POST - Record a share action
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: listingId } = await params
    const { platform = "copy" } = await request.json()

    // Validate platform
    const validPlatforms = ["copy", "whatsapp", "facebook", "twitter", "email", "other"]
    if (!validPlatforms.includes(platform)) {
      return NextResponse.json({ error: "Invalid platform" }, { status: 400 })
    }

    // Check if listing exists
    const listing = await queryOne<{ id: string; user_id: string; title: string }>(
      `SELECT id, user_id, title FROM listings WHERE id = ?`,
      [listingId]
    )

    if (!listing) {
      return NextResponse.json({ error: "Listing not found" }, { status: 404 })
    }

    // Get user if authenticated
    const auth = await verifyAuth(request)
    const userId = auth?.userId || null

    // Get request metadata
    const ipAddress = request.headers.get("x-forwarded-for")?.split(",")[0] || 
                      request.headers.get("x-real-ip") || 
                      null
    const userAgent = request.headers.get("user-agent") || null

    // Record share
    const shareId = generateId()
    await execute(
      `INSERT INTO listing_shares (id, user_id, listing_id, platform, ip_address, user_agent) 
       VALUES (?, ?, ?, ?, ?, ?)`,
      [shareId, userId, listingId, platform, ipAddress, userAgent]
    )

    // Create notification for listing owner (if not sharing own listing)
    if (userId && listing.user_id !== userId) {
      const user = await queryOne<{ name: string }>(`SELECT name FROM users WHERE id = ?`, [userId])
      await execute(
        `INSERT INTO notifications (id, user_id, type, title, message, data) VALUES (?, ?, 'listing', ?, ?, ?)`,
        [
          generateId(),
          listing.user_id,
          "Listing Shared",
          `${user?.name || "Someone"} shared your listing "${listing.title}"`,
          JSON.stringify({ listingId, shareId, platform }),
        ]
      )
    }

    // Get total shares count
    const count = await queryOne<{ total: number }>(
      `SELECT COUNT(*) as total FROM listing_shares WHERE listing_id = ?`,
      [listingId]
    )

    return NextResponse.json({
      success: true,
      shareId,
      sharesCount: count?.total || 0,
      message: "Share recorded",
    })
  } catch (error) {
    console.error("Error recording share:", error)
    return NextResponse.json({ error: "Failed to record share" }, { status: 500 })
  }
}

// GET - Get share stats for a listing
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: listingId } = await params

    // Check if listing exists
    const listing = await queryOne<{ id: string }>(`SELECT id FROM listings WHERE id = ?`, [listingId])
    if (!listing) {
      return NextResponse.json({ error: "Listing not found" }, { status: 404 })
    }

    // Get total shares count
    const count = await queryOne<{ total: number }>(
      `SELECT COUNT(*) as total FROM listing_shares WHERE listing_id = ?`,
      [listingId]
    )

    // Get shares by platform
    const platformStats = await query<{ platform: string; count: number }>(
      `SELECT platform, COUNT(*) as count FROM listing_shares WHERE listing_id = ? GROUP BY platform`,
      [listingId]
    )

    return NextResponse.json({
      sharesCount: count?.total || 0,
      byPlatform: platformStats.reduce((acc, s) => {
        acc[s.platform] = s.count
        return acc
      }, {} as Record<string, number>),
    })
  } catch (error) {
    console.error("Error getting share stats:", error)
    return NextResponse.json({ error: "Failed to get share stats" }, { status: 500 })
  }
}
