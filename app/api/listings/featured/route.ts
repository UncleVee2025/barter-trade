import { NextResponse } from "next/server"
import { query } from "@/lib/db"

export async function GET() {
  try {
    const listings = await query(`
      SELECT 
        l.*,
        c.name as category_name,
        c.slug as category_slug,
        u.name as seller_name,
        u.avatar as seller_avatar,
        u.is_verified as seller_verified,
        (SELECT url FROM listing_images WHERE listing_id = l.id AND is_primary = TRUE LIMIT 1) as image
      FROM listings l
      JOIN categories c ON l.category_id = c.id
      JOIN users u ON l.user_id = u.id
      WHERE l.status = 'active' AND l.featured = TRUE
      ORDER BY l.created_at DESC
      LIMIT 10
    `)

    return NextResponse.json({ listings, source: "database" })
  } catch (error) {
    console.error("Failed to fetch featured listings:", error)
    return NextResponse.json(
      { 
        error: "Failed to fetch featured listings. Database connection required.",
        listings: [],
        source: "error"
      },
      { status: 500 }
    )
  }
}
