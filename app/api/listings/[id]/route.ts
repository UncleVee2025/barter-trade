import { type NextRequest, NextResponse } from "next/server"
import { verifyAuth } from "@/lib/auth"
import { query, queryOne, execute, generateId, transaction } from "@/lib/db"
import type { PoolConnection } from "mysql2/promise"

// GET - Fetch single listing with full details
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params

    // Get listing with user and category info
    const listing = await queryOne<Record<string, unknown>>(
      `SELECT 
        l.*,
        u.id as user_id,
        u.name as user_name,
        u.avatar as user_avatar,
        u.region as user_region,
        u.phone as user_phone,
        u.is_verified as user_verified,
        u.created_at as user_joined,
        c.name as category_name,
        c.slug as category_slug,
        c.icon as category_icon,
        c.color as category_color,
        (SELECT COUNT(*) FROM saved_listings sl WHERE sl.listing_id = l.id) as save_count,
        (SELECT COUNT(*) FROM listing_likes ll WHERE ll.listing_id = l.id) as likes_count,
        (SELECT COUNT(*) FROM listing_shares ls WHERE ls.listing_id = l.id) as shares_count,
        (SELECT COUNT(*) FROM listings ol WHERE ol.user_id = l.user_id AND ol.status = 'active') as user_listing_count,
        (SELECT COUNT(*) FROM trade_offers t WHERE (t.sender_id = l.user_id OR t.receiver_id = l.user_id) AND t.status = 'accepted') as user_trade_count,
        (SELECT AVG(r.rating) FROM user_ratings r WHERE r.to_user_id = l.user_id) as user_rating
      FROM listings l
      LEFT JOIN users u ON l.user_id = u.id
      LEFT JOIN categories c ON l.category_id = c.id
      WHERE l.id = ?`,
      [id]
    )

    if (!listing) {
      return NextResponse.json({ error: "Listing not found" }, { status: 404 })
    }

    // Get images
    const images = await query<{ url: string; is_primary: boolean }>(
      `SELECT url, is_primary FROM listing_images WHERE listing_id = ? ORDER BY display_order`,
      [id]
    )

    // Get wanted items
    const wantedItems = await query<Record<string, unknown>>(
      `SELECT lw.*, c.name as category_name FROM listing_wanted_items lw 
       LEFT JOIN categories c ON lw.category_id = c.id
       WHERE lw.listing_id = ? ORDER BY display_order`,
      [id]
    )

    // Get comments with user info
    const comments = await query<Record<string, unknown>>(
      `SELECT 
        cm.*,
        u.name as user_name,
        u.avatar as user_avatar,
        u.is_verified as user_verified
      FROM comments cm
      LEFT JOIN users u ON cm.user_id = u.id
      WHERE cm.listing_id = ?
      ORDER BY cm.created_at DESC`,
      [id]
    )

    // Get recent offers count
    const offerCount = await queryOne<{ count: number }>(
      `SELECT COUNT(*) as count FROM trade_offers t
       JOIN trade_offer_items toi ON t.id = toi.offer_id
       WHERE toi.listing_id = ? AND t.status = 'pending'`,
      [id]
    )

    // Increment views
    await execute(`UPDATE listings SET views = views + 1 WHERE id = ?`, [id])

    // Check if current user saved/liked this listing
    let isSaved = false
    let isLiked = false
    const auth = await verifyAuth(request)
    if (auth) {
      const saved = await queryOne<{ id: string }>(
        `SELECT id FROM saved_listings WHERE user_id = ? AND listing_id = ?`,
        [auth.userId, id]
      )
      isSaved = !!saved

      const liked = await queryOne<{ id: string }>(
        `SELECT id FROM listing_likes WHERE user_id = ? AND listing_id = ?`,
        [auth.userId, id]
      )
      isLiked = !!liked
    }

    const transformedListing = {
      id: listing.id,
      userId: listing.user_id,
      title: listing.title,
      description: listing.description,
      category: listing.category_slug || listing.category_id,
      categoryName: listing.category_name,
      categoryIcon: listing.category_icon,
      categoryColor: listing.category_color,
      type: listing.type,
      value: Number(listing.value),
      currency: listing.currency,
      condition: listing.condition,
      images: images.map((img) => img.url),
      primaryImage: images.find((img) => img.is_primary)?.url || images[0]?.url || "/placeholder.svg",
      location: {
        region: listing.region,
        town: listing.town,
        latitude: listing.latitude,
        longitude: listing.longitude,
      },
      status: listing.status,
      views: Number(listing.views) + 1,
      saves: Number(listing.save_count),
      likes: Number(listing.likes_count),
      shares: Number(listing.shares_count),
      isLiked,
      featured: Boolean(listing.featured),
      tradePreferences: listing.trade_preferences,
      wantedItems: wantedItems.map((item) => ({
        id: item.id,
        description: item.description,
        categoryName: item.category_name,
        estimatedValue: item.estimated_value ? Number(item.estimated_value) : null,
        isFlexible: Boolean(item.is_flexible),
      })),
      comments: comments.map((c) => ({
        id: c.id,
        content: c.content,
        parentId: c.parent_id,
        isEdited: Boolean(c.is_edited),
        createdAt: c.created_at,
        user: {
          id: c.user_id,
          name: c.user_name,
          avatar: c.user_avatar,
          isVerified: Boolean(c.user_verified),
        },
      })),
      pendingOffers: offerCount?.count || 0,
      isSaved,
      createdAt: listing.created_at,
      updatedAt: listing.updated_at,
      user: {
        id: listing.user_id,
        name: listing.user_name,
        avatar: listing.user_avatar,
        phone: listing.user_phone,
        region: listing.user_region,
        isVerified: Boolean(listing.user_verified),
        joinedAt: listing.user_joined,
        listingCount: Number(listing.user_listing_count),
        tradeCount: Number(listing.user_trade_count),
        rating: listing.user_rating ? Number(listing.user_rating).toFixed(1) : null,
      },
    }

    return NextResponse.json({ listing: transformedListing })
  } catch (error) {
    console.error("Fetch listing error:", error)
    return NextResponse.json({ error: "Failed to fetch listing" }, { status: 500 })
  }
}

// PATCH - Update listing
export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = await verifyAuth(request)
    if (!auth) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = await params

    // Check ownership
    const listing = await queryOne<{ user_id: string; category_id: string }>(
      `SELECT user_id, category_id FROM listings WHERE id = ?`,
      [id]
    )

    if (!listing) {
      return NextResponse.json({ error: "Listing not found" }, { status: 404 })
    }

    if (listing.user_id !== auth.userId && auth.role !== "admin") {
      return NextResponse.json({ error: "Not authorized to edit this listing" }, { status: 403 })
    }

    const body = await request.json()
    const { title, description, value, condition, region, town, status, images, wantedItems, tradePreferences } = body

    await transaction(async (conn: PoolConnection) => {
      // Build update query dynamically
      const updates: string[] = []
      const updateParams: unknown[] = []

      if (title !== undefined) {
        updates.push("title = ?")
        updateParams.push(title.trim())
      }
      if (description !== undefined) {
        updates.push("description = ?")
        updateParams.push(description.trim())
      }
      if (value !== undefined) {
        updates.push("value = ?")
        updateParams.push(value)
      }
      if (condition !== undefined) {
        updates.push("`condition` = ?")
        updateParams.push(condition)
      }
      if (region !== undefined) {
        updates.push("region = ?")
        updateParams.push(region)
      }
      if (town !== undefined) {
        updates.push("town = ?")
        updateParams.push(town)
      }
      if (status !== undefined) {
        updates.push("status = ?")
        updateParams.push(status)
      }
      if (tradePreferences !== undefined) {
        updates.push("trade_preferences = ?")
        updateParams.push(tradePreferences)
      }

      if (updates.length > 0) {
        updates.push("updated_at = NOW()")
        updateParams.push(id)
        await conn.execute(`UPDATE listings SET ${updates.join(", ")} WHERE id = ?`, updateParams)
      }

      // Update images if provided
      if (images !== undefined) {
        await conn.execute(`DELETE FROM listing_images WHERE listing_id = ?`, [id])
        for (let i = 0; i < images.length; i++) {
          const imageId = generateId()
          await conn.execute(
            `INSERT INTO listing_images (id, listing_id, url, display_order, is_primary) VALUES (?, ?, ?, ?, ?)`,
            [imageId, id, images[i], i, i === 0]
          )
        }
      }

      // Update wanted items if provided
      if (wantedItems !== undefined) {
        await conn.execute(`DELETE FROM listing_wanted_items WHERE listing_id = ?`, [id])
        for (let i = 0; i < wantedItems.length; i++) {
          const item = wantedItems[i]
          const itemId = generateId()
          await conn.execute(
            `INSERT INTO listing_wanted_items (id, listing_id, description, category_id, estimated_value, is_flexible, display_order)
             VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [itemId, id, item.description, item.categoryId || null, item.estimatedValue || null, item.isFlexible || false, i]
          )
        }
      }

      // Log activity
      await conn.execute(
        `INSERT INTO activity_log (id, user_id, action, entity_type, entity_id, details) VALUES (?, ?, 'update_listing', 'listing', ?, ?)`,
        [generateId(), auth.userId, id, JSON.stringify({ updates: Object.keys(body) })]
      )
    })

    return NextResponse.json({
      success: true,
      message: "Listing updated successfully",
    })
  } catch (error) {
    console.error("Update listing error:", error)
    return NextResponse.json({ error: "Failed to update listing" }, { status: 500 })
  }
}

// DELETE - Delete listing
export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = await verifyAuth(request)
    if (!auth) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = await params

    const listing = await queryOne<{ user_id: string; category_id: string; title: string }>(
      `SELECT user_id, category_id, title FROM listings WHERE id = ?`,
      [id]
    )

    if (!listing) {
      return NextResponse.json({ error: "Listing not found" }, { status: 404 })
    }

    if (listing.user_id !== auth.userId && auth.role !== "admin") {
      return NextResponse.json({ error: "Not authorized to delete this listing" }, { status: 403 })
    }

    await transaction(async (conn: PoolConnection) => {
      // Delete listing (cascade will handle images, wanted items, etc.)
      await conn.execute(`DELETE FROM listings WHERE id = ?`, [id])

      // Update category count
      await conn.execute(`UPDATE categories SET listing_count = GREATEST(listing_count - 1, 0) WHERE id = ?`, [
        listing.category_id,
      ])

      // Log activity
      await conn.execute(
        `INSERT INTO activity_log (id, user_id, action, entity_type, entity_id, details) VALUES (?, ?, 'delete_listing', 'listing', ?, ?)`,
        [generateId(), auth.userId, id, JSON.stringify({ title: listing.title })]
      )
    })

    return NextResponse.json({
      success: true,
      message: "Listing deleted successfully",
    })
  } catch (error) {
    console.error("Delete listing error:", error)
    return NextResponse.json({ error: "Failed to delete listing" }, { status: 500 })
  }
}
