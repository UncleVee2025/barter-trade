import { type NextRequest, NextResponse } from "next/server"
import { verifyAuth } from "@/lib/auth"
import { query, queryOne, execute, generateId } from "@/lib/db"

interface MatchResult {
  listingId: string
  matchScore: number
  matchType: string
  matchReasons: string[]
}

// GET - Get matches for the current user
export async function GET(request: NextRequest) {
  try {
    const auth = await verifyAuth(request)
    if (!auth) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const searchParams = request.nextUrl.searchParams
    const limit = Number.parseInt(searchParams.get("limit") || "10")
    const includesSeen = searchParams.get("includeSeen") === "true"

    // Get user's interests and preferences
    const userInterests = await query<{
      category_id: string
      interest_type: string
      keywords: string | null
      min_value: number | null
      max_value: number | null
      preferred_regions: string | null
    }>(
      `SELECT * FROM user_interests WHERE user_id = ? AND is_active = TRUE`,
      [auth.userId]
    )

    // Get user's wanted items from their listings
    const userWantedItems = await query<{
      description: string
      category_id: string | null
      estimated_value: number | null
    }>(
      `SELECT lwi.description, lwi.category_id, lwi.estimated_value
       FROM listing_wanted_items lwi
       JOIN listings l ON lwi.listing_id = l.id
       WHERE l.user_id = ? AND l.status = 'active'`,
      [auth.userId]
    )

    // Get user's region for nearby matching
    const user = await queryOne<{ region: string; town: string | null }>(
      `SELECT region, town FROM users WHERE id = ?`,
      [auth.userId]
    )

    // Get match notifications (existing matches)
    let existingMatchSql = `
      SELECT mn.*, l.title, l.value, l.region,
             (SELECT url FROM listing_images WHERE listing_id = l.id AND is_primary = TRUE LIMIT 1) as image
      FROM match_notifications mn
      JOIN listings l ON mn.listing_id = l.id
      WHERE mn.user_id = ? AND mn.is_dismissed = FALSE
    `
    const params: (string | number | boolean)[] = [auth.userId]

    if (!includesSeen) {
      existingMatchSql += ` AND mn.is_seen = FALSE`
    }

    existingMatchSql += ` ORDER BY mn.match_score DESC, mn.created_at DESC LIMIT ?`
    params.push(limit)

    const existingMatches = await query<Record<string, unknown>>(existingMatchSql, params)

    // Transform matches
    const matches = existingMatches.map((m) => ({
      id: m.id,
      listingId: m.listing_id,
      title: m.title,
      value: Number(m.value),
      region: m.region,
      image: m.image || "/placeholder.svg",
      matchType: m.match_type,
      matchScore: Number(m.match_score),
      matchReasons: m.match_reasons ? JSON.parse(m.match_reasons as string) : [],
      isSeen: Boolean(m.is_seen),
      createdAt: m.created_at,
    }))

    return NextResponse.json({
      matches,
      totalInterests: userInterests.length,
      totalWantedItems: userWantedItems.length,
      userRegion: user?.region || "Unknown",
    })
  } catch (error) {
    console.error("Error fetching matches:", error)
    return NextResponse.json({ error: "Failed to fetch matches" }, { status: 500 })
  }
}

// POST - Trigger match calculation for a new listing or update interests
export async function POST(request: NextRequest) {
  try {
    const auth = await verifyAuth(request)
    if (!auth) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { action, listingId, interests } = body

    if (action === "calculate_for_listing" && listingId) {
      // Calculate matches for users when a new listing is created
      const matches = await calculateMatchesForListing(listingId, auth.userId)
      return NextResponse.json({ success: true, matchesCreated: matches.length })
    }

    if (action === "update_interests" && interests) {
      // Update user's interests
      await updateUserInterests(auth.userId, interests)
      
      // Calculate new matches based on updated interests
      const newMatches = await calculateMatchesForUser(auth.userId)
      
      return NextResponse.json({
        success: true,
        message: "Interests updated successfully",
        newMatches: newMatches.length,
      })
    }

    if (action === "find_matches") {
      // Find matches for current user
      const matches = await calculateMatchesForUser(auth.userId)
      return NextResponse.json({ success: true, matches })
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 })
  } catch (error) {
    console.error("Error in matching:", error)
    return NextResponse.json({ error: "Failed to process matching request" }, { status: 500 })
  }
}

// PATCH - Mark matches as seen or dismissed
export async function PATCH(request: NextRequest) {
  try {
    const auth = await verifyAuth(request)
    if (!auth) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { matchIds, action } = await request.json()

    if (!matchIds || !Array.isArray(matchIds) || matchIds.length === 0) {
      return NextResponse.json({ error: "matchIds array is required" }, { status: 400 })
    }

    const placeholders = matchIds.map(() => "?").join(",")

    if (action === "seen") {
      await execute(
        `UPDATE match_notifications SET is_seen = TRUE WHERE id IN (${placeholders}) AND user_id = ?`,
        [...matchIds, auth.userId]
      )
    } else if (action === "dismiss") {
      await execute(
        `UPDATE match_notifications SET is_dismissed = TRUE WHERE id IN (${placeholders}) AND user_id = ?`,
        [...matchIds, auth.userId]
      )
    } else {
      return NextResponse.json({ error: "Invalid action. Use 'seen' or 'dismiss'" }, { status: 400 })
    }

    return NextResponse.json({ success: true, message: `Matches marked as ${action}` })
  } catch (error) {
    console.error("Error updating matches:", error)
    return NextResponse.json({ error: "Failed to update matches" }, { status: 500 })
  }
}

// Calculate matches for a newly created listing (notify potential buyers)
async function calculateMatchesForListing(listingId: string, sellerId: string): Promise<MatchResult[]> {
  const matches: MatchResult[] = []

  // Get listing details
  const listing = await queryOne<{
    id: string
    title: string
    description: string
    category_id: string
    value: number
    region: string
    town: string | null
  }>(
    `SELECT id, title, description, category_id, value, region, town FROM listings WHERE id = ?`,
    [listingId]
  )

  if (!listing) return matches

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
      const regions = JSON.parse(interest.preferred_regions)
      if (regions.includes(listing.region)) {
        score += 25
        matchReasons.push(`Located in ${listing.region}`)
      }
    }

    // Keyword match
    if (interest.keywords) {
      const keywords = interest.keywords.toLowerCase().split(",").map((k: string) => k.trim())
      const titleLower = listing.title.toLowerCase()
      const descLower = (listing.description || "").toLowerCase()
      
      for (const keyword of keywords) {
        if (titleLower.includes(keyword) || descLower.includes(keyword)) {
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
           VALUES (?, ?, ?, 'interest_match', ?, ?)`,
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
            `"${listing.title}" matches your interests. Score: ${score}%`,
            JSON.stringify({ listingId, matchScore: score }),
          ]
        )

        matches.push({
          listingId,
          matchScore: score,
          matchType: "interest_match",
          matchReasons,
        })
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

        matches.push({
          listingId,
          matchScore: score,
          matchType: "wanted_item_match",
          matchReasons,
        })
      }
    }
  }

  return matches
}

// Calculate matches for a user based on their interests (find existing listings)
async function calculateMatchesForUser(userId: string): Promise<MatchResult[]> {
  const matches: MatchResult[] = []

  // Get user's interests
  const interests = await query<{
    category_id: string | null
    keywords: string | null
    min_value: number | null
    max_value: number | null
    preferred_regions: string | null
  }>(
    `SELECT * FROM user_interests WHERE user_id = ? AND is_active = TRUE`,
    [userId]
  )

  // Get user's region
  const user = await queryOne<{ region: string }>(
    `SELECT region FROM users WHERE id = ?`,
    [userId]
  )

  for (const interest of interests) {
    // Find matching listings
    let sql = `
      SELECT l.id, l.title, l.description, l.category_id, l.value, l.region
      FROM listings l
      WHERE l.user_id != ? AND l.status = 'active'
    `
    const params: (string | number)[] = [userId]

    if (interest.category_id) {
      sql += ` AND l.category_id = ?`
      params.push(interest.category_id)
    }

    if (interest.min_value) {
      sql += ` AND l.value >= ?`
      params.push(interest.min_value)
    }

    if (interest.max_value) {
      sql += ` AND l.value <= ?`
      params.push(interest.max_value)
    }

    sql += ` ORDER BY l.created_at DESC LIMIT 50`

    const listings = await query<{
      id: string
      title: string
      description: string
      category_id: string
      value: number
      region: string
    }>(sql, params)

    for (const listing of listings) {
      const matchReasons: string[] = []
      let score = 0

      // Category match
      if (interest.category_id === listing.category_id) {
        score += 30
        matchReasons.push("Matches your interested category")
      }

      // Price range match
      score += 20
      matchReasons.push("Within your price range")

      // Region match
      if (interest.preferred_regions) {
        const regions = JSON.parse(interest.preferred_regions)
        if (regions.includes(listing.region)) {
          score += 25
          matchReasons.push(`Located in ${listing.region}`)
        }
      } else if (user && listing.region === user.region) {
        score += 15
        matchReasons.push("In your region")
      }

      // Keyword match
      if (interest.keywords) {
        const keywords = interest.keywords.toLowerCase().split(",").map((k: string) => k.trim())
        const titleLower = listing.title.toLowerCase()
        const descLower = (listing.description || "").toLowerCase()
        
        for (const keyword of keywords) {
          if (titleLower.includes(keyword) || descLower.includes(keyword)) {
            score += 15
            matchReasons.push(`Contains "${keyword}"`)
            break
          }
        }
      }

      if (score >= 40) {
        // Check if match already exists
        const existing = await queryOne<{ id: string }>(
          `SELECT id FROM match_notifications WHERE user_id = ? AND listing_id = ?`,
          [userId, listing.id]
        )

        if (!existing) {
          const matchId = generateId()
          await execute(
            `INSERT INTO match_notifications (id, user_id, listing_id, match_type, match_score, match_reasons)
             VALUES (?, ?, ?, 'interest_match', ?, ?)`,
            [matchId, userId, listing.id, score, JSON.stringify(matchReasons)]
          )

          matches.push({
            listingId: listing.id,
            matchScore: score,
            matchType: "interest_match",
            matchReasons,
          })
        }
      }
    }
  }

  return matches
}

// Update user's interests
async function updateUserInterests(
  userId: string,
  interests: Array<{
    categoryId?: string
    type?: string
    keywords?: string
    minValue?: number
    maxValue?: number
    regions?: string[]
  }>
): Promise<void> {
  // Clear existing interests
  await execute(`DELETE FROM user_interests WHERE user_id = ?`, [userId])

  // Insert new interests
  for (const interest of interests) {
    await execute(
      `INSERT INTO user_interests (id, user_id, category_id, interest_type, keywords, min_value, max_value, preferred_regions)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        generateId(),
        userId,
        interest.categoryId || null,
        interest.type || "general",
        interest.keywords || null,
        interest.minValue || null,
        interest.maxValue || null,
        interest.regions ? JSON.stringify(interest.regions) : null,
      ]
    )
  }
}
