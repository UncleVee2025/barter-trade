import { type NextRequest, NextResponse } from "next/server"
import { verifyAuth } from "@/lib/auth"
import { queryOne, execute, generateId, query, transaction } from "@/lib/db"
import type { PoolConnection } from "mysql2/promise"

// GET - Get single listing details (admin)
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await verifyAuth(request)
    if (!auth || auth.role !== "admin") {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 })
    }

    const { id } = await params

    const listing = await queryOne<Record<string, unknown>>(
      `SELECT 
        l.*,
        u.id as user_id,
        u.name as user_name,
        u.email as user_email,
        u.phone as user_phone,
        u.is_verified as user_verified,
        u.is_banned as user_banned,
        c.name as category_name,
        c.slug as category_slug
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

    // Get reports
    const reports = await query<Record<string, unknown>>(
      `SELECT 
        lr.*,
        u.name as reporter_name,
        u.email as reporter_email
      FROM listing_reports lr
      LEFT JOIN users u ON lr.reporter_id = u.id
      WHERE lr.listing_id = ?
      ORDER BY lr.created_at DESC`,
      [id]
    )

    // Get activity log
    const activity = await query<Record<string, unknown>>(
      `SELECT * FROM activity_log 
       WHERE entity_type = 'listing' AND entity_id = ? 
       ORDER BY created_at DESC LIMIT 20`,
      [id]
    )

    return NextResponse.json({
      listing: {
        id: listing.id,
        title: listing.title,
        description: listing.description,
        category: listing.category_slug,
        categoryName: listing.category_name,
        value: Number(listing.value),
        condition: listing.condition,
        region: listing.region,
        town: listing.town,
        status: listing.status,
        views: Number(listing.views),
        saves: Number(listing.saves),
        featured: Boolean(listing.featured),
        tradePreferences: listing.trade_preferences,
        images: images.map((img) => img.url),
        createdAt: listing.created_at,
        updatedAt: listing.updated_at,
        user: {
          id: listing.user_id,
          name: listing.user_name,
          email: listing.user_email,
          phone: listing.user_phone,
          isVerified: Boolean(listing.user_verified),
          isBanned: Boolean(listing.user_banned),
        },
      },
      reports: reports.map((r) => ({
        id: r.id,
        reason: r.reason,
        description: r.description,
        status: r.status,
        createdAt: r.created_at,
        reporter: {
          id: r.reporter_id,
          name: r.reporter_name,
          email: r.reporter_email,
        },
      })),
      activity: activity.map((a) => ({
        id: a.id,
        action: a.action,
        userId: a.user_id,
        details: a.details,
        createdAt: a.created_at,
      })),
    })
  } catch (error) {
    console.error("Admin get listing error:", error)
    return NextResponse.json({ error: "Failed to fetch listing" }, { status: 500 })
  }
}

// PATCH - Update listing (admin)
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await verifyAuth(request)
    if (!auth || auth.role !== "admin") {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 })
    }

    const { id } = await params
    const body = await request.json()
    const { status, featured, title, description, value, reason } = body

    const listing = await queryOne<{ id: string; title: string }>(
      `SELECT id, title FROM listings WHERE id = ?`,
      [id]
    )

    if (!listing) {
      return NextResponse.json({ error: "Listing not found" }, { status: 404 })
    }

    const updates: string[] = []
    const updateParams: unknown[] = []

    if (status !== undefined) {
      updates.push("status = ?")
      updateParams.push(status)
    }
    if (featured !== undefined) {
      updates.push("featured = ?")
      updateParams.push(featured)
    }
    if (title !== undefined) {
      updates.push("title = ?")
      updateParams.push(title)
    }
    if (description !== undefined) {
      updates.push("description = ?")
      updateParams.push(description)
    }
    if (value !== undefined) {
      updates.push("value = ?")
      updateParams.push(value)
    }

    if (updates.length > 0) {
      updates.push("updated_at = NOW()")
      updateParams.push(id)
      await execute(`UPDATE listings SET ${updates.join(", ")} WHERE id = ?`, updateParams)
    }

    // Log activity
    await execute(
      `INSERT INTO activity_log (id, user_id, action, entity_type, entity_id, details) 
       VALUES (?, ?, 'admin_update_listing', 'listing', ?, ?)`,
      [generateId(), auth.userId, id, JSON.stringify({ updates: Object.keys(body), reason })]
    )

    return NextResponse.json({
      success: true,
      message: "Listing updated successfully",
    })
  } catch (error) {
    console.error("Admin update listing error:", error)
    return NextResponse.json({ error: "Failed to update listing" }, { status: 500 })
  }
}

// DELETE - Delete listing (admin)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await verifyAuth(request)
    if (!auth || auth.role !== "admin") {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 })
    }

    const { id } = await params
    const { reason } = await request.json().catch(() => ({ reason: null }))

    const listing = await queryOne<{ title: string; user_id: string; category_id: string }>(
      `SELECT title, user_id, category_id FROM listings WHERE id = ?`,
      [id]
    )

    if (!listing) {
      return NextResponse.json({ error: "Listing not found" }, { status: 404 })
    }

    await transaction(async (conn: PoolConnection) => {
      await conn.execute(`DELETE FROM listings WHERE id = ?`, [id])

      // Update category count
      await conn.execute(
        `UPDATE categories SET listing_count = GREATEST(listing_count - 1, 0) WHERE id = ?`,
        [listing.category_id]
      )

      // Log activity
      await conn.execute(
        `INSERT INTO activity_log (id, user_id, action, entity_type, entity_id, details) 
         VALUES (?, ?, 'admin_delete_listing', 'listing', ?, ?)`,
        [generateId(), auth.userId, id, JSON.stringify({ title: listing.title, reason })]
      )
    })

    return NextResponse.json({
      success: true,
      message: "Listing deleted successfully",
    })
  } catch (error) {
    console.error("Admin delete listing error:", error)
    return NextResponse.json({ error: "Failed to delete listing" }, { status: 500 })
  }
}
