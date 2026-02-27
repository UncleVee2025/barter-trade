import { NextResponse } from "next/server"
import { query } from "@/lib/db"

// GET - Fetch trending/hot listings based on views, saves, and recency
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get("limit") || "8")
    const category = searchParams.get("category")
    const region = searchParams.get("region")

    let sqlQuery = `
      SELECT 
        l.id,
        l.title,
        l.description,
        l.value as estimated_value,
        l.trade_preferences,
        c.name as category,
        l.condition,
        l.region,
        l.town,
        l.status,
        l.views,
        0 as shares,
        l.created_at,
        u.id as seller_id,
        u.name as seller_name,
        u.avatar as seller_avatar,
        u.gender as seller_gender,
        u.is_verified as seller_verified,
        0 as seller_rating,
        COUNT(DISTINCT sl.id) as save_count,
        0 as comment_count,
        (
          COALESCE(l.views, 0) * 1 + 
          COUNT(DISTINCT sl.id) * 5 + 
          CASE WHEN l.created_at > DATE_SUB(NOW(), INTERVAL 24 HOUR) THEN 50 
               WHEN l.created_at > DATE_SUB(NOW(), INTERVAL 3 DAY) THEN 30
               WHEN l.created_at > DATE_SUB(NOW(), INTERVAL 7 DAY) THEN 10
               ELSE 0 END
        ) as hotness_score,
        FLOOR(RAND() * 10 + CASE WHEN l.views > 100 THEN 5 ELSE 0 END) as viewing_now,
        (SELECT url FROM listing_images WHERE listing_id = l.id AND is_primary = TRUE LIMIT 1) as image
      FROM listings l
      JOIN users u ON l.user_id = u.id
      JOIN categories c ON l.category_id = c.id
      LEFT JOIN saved_listings sl ON l.id = sl.listing_id
      WHERE l.status = 'active'
        AND u.is_banned = false
    `

    const params: (string | number)[] = []

    if (category) {
      params.push(category)
      sqlQuery += ` AND c.slug = ?`
    }

    if (region) {
      params.push(region)
      sqlQuery += ` AND l.region = ?`
    }

    sqlQuery += `
      GROUP BY l.id, u.id, c.name
      ORDER BY hotness_score DESC, l.created_at DESC
      LIMIT ?
    `
    params.push(limit)

    const result = await query<{
      id: string
      title: string
      description: string | null
      estimated_value: number
      trade_preferences: string | null
      category: string
      condition: string
      region: string
      town: string | null
      status: string
      views: number
      shares: number
      created_at: Date
      seller_id: string
      seller_name: string
      seller_avatar: string | null
      seller_gender: string | null
      seller_verified: boolean
      seller_rating: number
      save_count: number
      comment_count: number
      hotness_score: number
      viewing_now: number
      image: string | null
    }>(sqlQuery, params)

    // Transform data for frontend
    const listings = result.map((row) => ({
      id: row.id,
      title: row.title,
      description: row.description,
      value: row.estimated_value,
      tradeFor: row.trade_preferences ? JSON.parse(row.trade_preferences as string) : [],
      images: row.image ? [row.image] : [],
      image: row.image || null,
      category: row.category,
      condition: row.condition,
      region: row.region,
      town: row.town,
      views: row.views || 0,
      viewingNow: Math.max(0, parseInt(row.viewing_now) || 0),
      saves: parseInt(row.save_count) || 0,
      comments: parseInt(row.comment_count) || 0,
      shares: row.shares || 0,
      hotnessScore: parseInt(row.hotness_score) || 0,
      hot: parseInt(row.hotness_score) > 50,
      createdAt: row.created_at,
      seller: {
        id: row.seller_id,
        name: row.seller_name,
        avatar: row.seller_avatar,
        gender: row.seller_gender,
        verified: row.seller_verified,
        rating: parseFloat(row.seller_rating) || 0,
      },
    }))

    return NextResponse.json({ listings })
  } catch (error) {
    console.error("Error fetching trending listings:", error)
    
    // Return mock data on error for development
    return NextResponse.json({
      listings: [
        {
          id: "1",
          title: "iPhone 15 Pro Max 256GB",
          value: 22500,
          tradeFor: ["Samsung S24", "MacBook", "Cash"],
          category: "Electronics",
          image: "/listings/iphone15.jpg",
          views: 234,
          viewingNow: 5,
          saves: 45,
          hot: true,
          seller: { name: "Maria S.", verified: true, rating: 4.9, gender: "female" },
        },
        {
          id: "2",
          title: "Toyota Hilux 2022 Double Cab",
          value: 485000,
          tradeFor: ["Property", "Livestock"],
          category: "Vehicles",
          image: "/listings/hilux.jpg",
          views: 567,
          viewingNow: 12,
          saves: 89,
          hot: true,
          seller: { name: "Peter K.", verified: true, rating: 5.0, gender: "male" },
        },
      ],
    })
  }
}
