import { NextResponse } from "next/server"
import { query, type DBCategory } from "@/lib/db"

export async function GET() {
  try {
    // Fetch categories from production database
    const categories = await query<DBCategory>(
      `SELECT c.*, COUNT(l.id) as listing_count 
       FROM categories c 
       LEFT JOIN listings l ON c.id = l.category_id AND l.status = 'active'
       WHERE c.is_active = TRUE
       GROUP BY c.id
       ORDER BY c.display_order ASC`
    )

    return NextResponse.json({ categories, source: "database" })
  } catch (error) {
    console.error("Failed to fetch categories:", error)
    return NextResponse.json(
      { 
        error: "Failed to fetch categories. Database connection required.",
        categories: [],
        source: "error"
      },
      { status: 500 }
    )
  }
}
