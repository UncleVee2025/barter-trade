import { type NextRequest, NextResponse } from "next/server"
import { verifyAuth } from "@/lib/auth"
import { query, queryOne, execute, generateId, transaction } from "@/lib/db"
import { isDemoMode } from "@/lib/config"
import { PoolConnection } from "mysql"
import { sanitizeString, validateAmount, isValidId } from "@/lib/validation"
import { checkRateLimit, getClientIP, rateLimitConfigs, rateLimitExceededResponse } from "@/lib/rate-limit"

// GET - Fetch listings with filters
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const category = searchParams.get("category")
    const region = searchParams.get("region")
    const search = searchParams.get("search")
    const status = searchParams.get("status") || "active"
    const userId = searchParams.get("userId")
    const minPrice = searchParams.get("minPrice")
    const maxPrice = searchParams.get("maxPrice")
    const condition = searchParams.get("condition")
    const sort = searchParams.get("sort") || "newest"
    const page = Number.parseInt(searchParams.get("page") || "1")
    const limit = Number.parseInt(searchParams.get("limit") || "20")
    const offset = (page - 1) * limit

    // Build params array for the query
    const params: (string | number)[] = []

    // Use simpler query structure that works with both MySQL and in-memory
    let sql = `
      SELECT 
        l.id, l.user_id, l.title, l.description, l.category_id, l.type, l.value, l.currency,
        l.condition, l.region, l.town, l.status, l.views, l.saves, l.featured, l.trade_preferences,
        l.created_at, l.updated_at,
        u.name as user_name,
        u.avatar as user_avatar,
        u.region as user_region,
        u.is_verified as user_verified,
        c.name as category_name,
        c.slug as category_slug,
        c.icon as category_icon,
        c.color as category_color
      FROM listings l
      LEFT JOIN users u ON l.user_id = u.id
      LEFT JOIN categories c ON l.category_id = c.id
      WHERE 1=1
    `

    if (status && status !== "all") {
      sql += ` AND l.status = ?`
      params.push(status)
    }

    if (userId) {
      sql += ` AND l.user_id = ?`
      params.push(userId)
    }

    if (category && category !== "all") {
      sql += ` AND (c.slug = ? OR c.id = ?)`
      params.push(category, category)
    }

    if (region) {
      sql += ` AND l.region = ?`
      params.push(region)
    }

    if (search) {
      sql += ` AND (l.title LIKE ? OR l.description LIKE ?)`
      params.push(`%${search}%`, `%${search}%`)
    }

    if (minPrice) {
      sql += ` AND l.value >= ?`
      params.push(Number.parseFloat(minPrice))
    }

    if (maxPrice) {
      sql += ` AND l.value <= ?`
      params.push(Number.parseFloat(maxPrice))
    }

    if (condition) {
      sql += ` AND l.condition = ?`
      params.push(condition.toLowerCase().replace(" ", "_"))
    }

    // Count total first (simpler count query)
    let total = 0
    try {
      const countResult = await query<{ total?: number; count?: number }>(
        `SELECT COUNT(*) as total FROM listings l LEFT JOIN categories c ON l.category_id = c.id WHERE 1=1` + 
        (status && status !== "all" ? ` AND l.status = '${status}'` : "") +
        (userId ? ` AND l.user_id = '${userId}'` : ""),
        []
      )
      total = countResult[0]?.total || countResult[0]?.count || 0
    } catch {
      total = 0
    }

    // Sorting
    switch (sort) {
      case "oldest":
        sql += ` ORDER BY l.created_at ASC`
        break
      case "price_low":
        sql += ` ORDER BY l.value ASC`
        break
      case "price_high":
        sql += ` ORDER BY l.value DESC`
        break
      case "popular":
        sql += ` ORDER BY l.views DESC`
        break
      default:
        sql += ` ORDER BY l.featured DESC, l.created_at DESC`
    }

    sql += ` LIMIT ? OFFSET ?`
    params.push(limit, offset)

    const listings = await query<Record<string, unknown>>(sql, params)

    // Get images for listings (separate query to avoid complex JOINs)
    const listingIds = listings.map((l) => l.id as string)
    let imagesMap: Record<string, string[]> = {}
    let primaryImagesMap: Record<string, string> = {}
    
    if (listingIds.length > 0) {
      try {
        const images = await query<{ listing_id: string; url: string; is_primary: boolean }>(
          `SELECT listing_id, url, is_primary FROM listing_images WHERE listing_id IN (${listingIds.map(() => "?").join(",")}) ORDER BY display_order`,
          listingIds
        )
        images.forEach(img => {
          if (!imagesMap[img.listing_id]) imagesMap[img.listing_id] = []
          imagesMap[img.listing_id].push(img.url)
          if (img.is_primary) primaryImagesMap[img.listing_id] = img.url
        })
      } catch {
        // Images table might not exist, continue without images
      }
    }

    // Get wanted items for each listing
    let wantedItemsMap: Record<string, Array<{ description: string; estimatedValue: number | null; isFlexible: boolean }>> = {}
    
    if (listingIds.length > 0) {
      try {
        const wantedItems = await query<Record<string, unknown>>(
          `SELECT * FROM listing_wanted_items WHERE listing_id IN (${listingIds.map(() => "?").join(",")}) ORDER BY display_order`,
          listingIds
        )
        wantedItemsMap = wantedItems.reduce((acc, item) => {
          const lid = item.listing_id as string
          if (!acc[lid]) acc[lid] = []
          acc[lid].push({
            description: item.description as string,
            estimatedValue: item.estimated_value as number | null,
            isFlexible: Boolean(item.is_flexible),
          })
          return acc
        }, {} as typeof wantedItemsMap)
      } catch {
        // Wanted items table might not exist
      }
    }

    const transformedListings = listings.map((listing) => ({
      id: listing.id,
      userId: listing.user_id,
      title: listing.title,
      description: listing.description,
      category: listing.category_slug || listing.category_id,
      categoryName: listing.category_name || "Other",
      categoryIcon: listing.category_icon || "Package",
      categoryColor: listing.category_color || "#6B7280",
      type: listing.type || "item",
      value: Number(listing.value) || 0,
      currency: listing.currency || "NAD",
      condition: listing.condition || "good",
      images: imagesMap[listing.id as string] || [],
      primaryImage: primaryImagesMap[listing.id as string] || (imagesMap[listing.id as string]?.[0]) || "/placeholder.svg",
      location: {
        region: listing.region || "Unknown",
        town: listing.town || null,
      },
      status: listing.status || "active",
      views: Number(listing.views) || 0,
      saves: Number(listing.saves) || Number(listing.save_count) || 0,
      featured: Boolean(listing.featured),
      tradePreferences: listing.trade_preferences,
      wantedItems: wantedItemsMap[listing.id as string] || [],
      createdAt: listing.created_at,
      updatedAt: listing.updated_at,
      user: {
        id: listing.user_id,
        name: listing.user_name || "Unknown User",
        avatar: listing.user_avatar || null,
        region: listing.user_region || listing.region,
        isVerified: Boolean(listing.user_verified),
      },
    }))

    return NextResponse.json({
      listings: transformedListings,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasMore: offset + listings.length < total,
      },
    })
  } catch (error) {
    console.error("Error fetching listings:", error)
    return NextResponse.json({ 
      error: "Failed to fetch listings",
      listings: [],
      pagination: { page: 1, limit: 20, total: 0, totalPages: 0, hasMore: false }
    }, { status: 500 })
  }
}

// POST - Create a new listing
export async function POST(request: NextRequest) {
  try {
    // Rate limiting - 10 listings per hour
    const clientIP = getClientIP(request)
    const rateLimitResult = checkRateLimit(clientIP, rateLimitConfigs.listing)
    
    if (!rateLimitResult.success) {
      return rateLimitExceededResponse(rateLimitResult)
    }

    const auth = await verifyAuth(request)
    if (!auth) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const {
      title,
      description,
      category,
      subcategory,
      type = "item",
      value,
      condition = "good",
      region,
      town,
      images = [],
      tradePreferences,
      wantedItems = [],
    } = body

    // Sanitize inputs to prevent XSS
    const sanitizedTitle = sanitizeString(title || "")
    const sanitizedDescription = sanitizeString(description || "")
    const sanitizedRegion = sanitizeString(region || "")
    const sanitizedTown = sanitizeString(town || "")

    // Validation
    if (!sanitizedTitle || !sanitizedDescription || !category || !value || !sanitizedRegion) {
      return NextResponse.json(
        { error: "Missing required fields: title, description, category, value, and region are required" },
        { status: 400 }
      )
    }

    if (sanitizedTitle.length < 3 || sanitizedTitle.length > 200) {
      return NextResponse.json({ error: "Title must be between 3 and 200 characters" }, { status: 400 })
    }

    if (sanitizedDescription.length < 10) {
      return NextResponse.json({ error: "Description must be at least 10 characters" }, { status: 400 })
    }

    // Validate amount
    const valueValidation = validateAmount(value)
    if (!valueValidation.valid) {
      return NextResponse.json({ error: valueValidation.error || "Invalid value" }, { status: 400 })
    }

    // Get category with high-value settings
    const categoryRow = await queryOne<{ 
      id: string
      is_high_value: boolean
      min_high_value_threshold: number
      requires_documents: boolean 
    }>(
      `SELECT id, is_high_value, min_high_value_threshold, requires_documents FROM categories WHERE slug = ? OR id = ? OR name = ?`,
      [category, category, category]
    )

    if (!categoryRow) {
      return NextResponse.json({ error: "Invalid category" }, { status: 400 })
    }

    // Determine if this is a high-value listing
    const isHighValue = categoryRow.is_high_value || value >= (categoryRow.min_high_value_threshold || 50000)
    const documentsRequired = categoryRow.requires_documents && isHighValue

    const listingId = generateId()

    // Production mode: use transaction
    const result = await transaction(async (conn) => {
      await conn.execute(
        `INSERT INTO listings (
          id, user_id, title, description, category_id, subcategory_id,
          type, value, \`condition\`, region, town, status, trade_preferences,
          is_high_value, documents_required
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'active', ?, ?, ?)`,
        [
          listingId,
          auth.userId,
          title.trim(),
          description.trim(),
          categoryRow.id,
          subcategory || null,
          type,
          value,
          condition,
          region,
          town || null,
          tradePreferences || null,
          isHighValue,
          documentsRequired,
        ]
      )

      // Insert images
      for (let i = 0; i < images.length; i++) {
        const imageId = generateId()
        await conn.execute(
          `INSERT INTO listing_images (id, listing_id, url, display_order, is_primary) VALUES (?, ?, ?, ?, ?)`,
          [imageId, listingId, images[i], i, i === 0]
        )
      }

      // Insert wanted items
      for (let i = 0; i < wantedItems.length; i++) {
        const item = wantedItems[i]
        const itemId = generateId()
        await conn.execute(
          `INSERT INTO listing_wanted_items (id, listing_id, description, category_id, estimated_value, is_flexible, display_order)
           VALUES (?, ?, ?, ?, ?, ?, ?)`,
          [itemId, listingId, item.description, item.categoryId || null, item.estimatedValue || null, item.isFlexible || false, i]
        )
      }

      // Update category count
      await conn.execute(`UPDATE categories SET listing_count = listing_count + 1 WHERE id = ?`, [categoryRow.id])

      // Log activity
      await conn.execute(
        `INSERT INTO activity_log (id, user_id, action, entity_type, entity_id, details) VALUES (?, ?, 'create_listing', 'listing', ?, ?)`,
        [generateId(), auth.userId, listingId, JSON.stringify({ title, value, isHighValue })]
      )

      return listingId
    })

    // Trigger smart matching in the background (non-blocking)
    triggerSmartMatching(result, auth.userId).catch(console.error)

    const listing = await queryOne<Record<string, unknown>>(
      `SELECT l.*, c.name as category_name, c.slug as category_slug FROM listings l LEFT JOIN categories c ON l.category_id = c.id WHERE l.id = ?`,
      [result]
    )

    return NextResponse.json({
      success: true,
      listing: {
        id: listing?.id || listingId,
        title: listing?.title || title.trim(),
        status: listing?.status || "active",
        isHighValue,
        documentsRequired,
        createdAt: listing?.created_at || new Date().toISOString(),
      },
      message: isHighValue 
        ? "High-value listing created! Buyers may request verification documents." 
        : "Listing created successfully!",
    })
  } catch (error) {
    console.error("Error creating listing:", error)
    return NextResponse.json({ error: "Failed to create listing" }, { status: 500 })
  }
}

// Trigger smart matching for newly created listing
async function triggerSmartMatching(listingId: string, sellerId: string): Promise<void> {
  try {
    // Get listing details
    const listing = await queryOne<{
      id: string
      title: string
      description: string
      category_id: string
      value: number
      region: string
    }>(
      `SELECT id, title, description, category_id, value, region FROM listings WHERE id = ?`,
      [listingId]
    )

    if (!listing) return

    // Find users with matching interests
    const interestedUsers = await query<{
      user_id: string
      category_id: string | null
      keywords: string | null
      min_value: number | null
      max_value: number | null
      preferred_regions: string | null
    }>(
      `SELECT DISTINCT ui.user_id, ui.category_id, ui.keywords, ui.min_value, ui.max_value, ui.preferred_regions
       FROM user_interests ui
       WHERE ui.user_id != ?
         AND ui.is_active = TRUE
         AND ui.interest_type IN ('looking_for', 'general')
         AND (ui.category_id IS NULL OR ui.category_id = ?)`,
      [sellerId, listing.category_id]
    )

    for (const interest of interestedUsers) {
      const matchReasons: string[] = []
      let score = 0

      // Category match
      if (interest.category_id === listing.category_id) {
        score += 30
        matchReasons.push("Matches your interested category")
      }

      // Price range match
      if (
        (interest.min_value === null || listing.value >= interest.min_value) &&
        (interest.max_value === null || listing.value <= interest.max_value)
      ) {
        score += 20
        matchReasons.push("Within your price range")
      }

      // Region match
      if (interest.preferred_regions) {
        try {
          const regions = JSON.parse(interest.preferred_regions)
          if (regions.includes(listing.region)) {
            score += 25
            matchReasons.push(`Located in ${listing.region}`)
          }
        } catch {}
      }

      // Keyword match
      if (interest.keywords) {
        const keywords = interest.keywords.toLowerCase().split(",").map((k: string) => k.trim())
        const titleLower = listing.title.toLowerCase()
        const descLower = (listing.description || "").toLowerCase()
        
        for (const keyword of keywords) {
          if (keyword && (titleLower.includes(keyword) || descLower.includes(keyword))) {
            score += 15
            matchReasons.push(`Contains "${keyword}"`)
            break
          }
        }
      }

      // Only create match if score is meaningful
      if (score >= 30 && matchReasons.length > 0) {
        // Check if match already exists
        const existing = await queryOne<{ id: string }>(
          `SELECT id FROM match_notifications WHERE user_id = ? AND listing_id = ?`,
          [interest.user_id, listingId]
        )

        if (!existing) {
          const matchId = generateId()
          await execute(
            `INSERT INTO match_notifications (id, user_id, listing_id, match_type, match_score, match_reasons)
             VALUES (?, ?, ?, 'new_listing', ?, ?)`,
            [matchId, interest.user_id, listingId, score, JSON.stringify(matchReasons)]
          )

          // Create notification
          await execute(
            `INSERT INTO notifications (id, user_id, type, title, message, data, priority)
             VALUES (?, ?, 'match', ?, ?, ?, 'high')`,
            [
              generateId(),
              interest.user_id,
              "New Matching Listing!",
              `"${listing.title}" matches your interests`,
              JSON.stringify({ listingId, matchScore: score }),
            ]
          )
        }
      }
    }

    // Also find users whose wanted items match this listing
    const wantedItemMatches = await query<{
      user_id: string
      description: string
      category_id: string | null
    }>(
      `SELECT DISTINCT l.user_id, lwi.description, lwi.category_id
       FROM listing_wanted_items lwi
       JOIN listings l ON lwi.listing_id = l.id
       WHERE l.user_id != ? 
         AND l.status = 'active'
         AND (lwi.category_id IS NULL OR lwi.category_id = ?)`,
      [sellerId, listing.category_id]
    )

    for (const wanted of wantedItemMatches) {
      const wantedLower = wanted.description.toLowerCase()
      const titleLower = listing.title.toLowerCase()
      
      // Check if listing title contains wanted item description
      if (
        titleLower.includes(wantedLower) ||
        wantedLower.includes(titleLower) ||
        (wanted.category_id && wanted.category_id === listing.category_id)
      ) {
        // Check if match already exists
        const existing = await queryOne<{ id: string }>(
          `SELECT id FROM match_notifications WHERE user_id = ? AND listing_id = ?`,
          [wanted.user_id, listingId]
        )

        if (!existing) {
          const matchId = generateId()
          const matchReasons = [`Matches your wanted item: "${wanted.description}"`]
          const score = 75

          await execute(
            `INSERT INTO match_notifications (id, user_id, listing_id, match_type, match_score, match_reasons)
             VALUES (?, ?, ?, 'wanted_item_match', ?, ?)`,
            [matchId, wanted.user_id, listingId, score, JSON.stringify(matchReasons)]
          )

          await execute(
            `INSERT INTO notifications (id, user_id, type, title, message, data, priority)
             VALUES (?, ?, 'match', ?, ?, ?, 'high')`,
            [
              generateId(),
              wanted.user_id,
              "Found What You're Looking For!",
              `"${listing.title}" matches what you want to trade for!`,
              JSON.stringify({ listingId, matchScore: score }),
            ]
          )
        }
      }
    }
  } catch (error) {
    console.error("Smart matching error:", error)
  }
}
