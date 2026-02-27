import { type NextRequest, NextResponse } from "next/server"
import { verifyAuth } from "@/lib/auth"
import { queryOne, execute, generateId, query, transaction } from "@/lib/db"
import type { PoolConnection } from "mysql2/promise"

// GET - Get single user details (admin)
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

    const user = await queryOne<Record<string, unknown>>(
      `SELECT 
        u.*,
        COALESCE((SELECT COUNT(*) FROM listings l WHERE l.user_id = u.id), 0) as listing_count,
        COALESCE((SELECT COUNT(*) FROM listings l WHERE l.user_id = u.id AND l.status = 'active'), 0) as active_listings,
        COALESCE((SELECT COUNT(*) FROM trade_offers t WHERE t.sender_id = u.id OR t.receiver_id = u.id), 0) as trade_count,
        COALESCE((SELECT COUNT(*) FROM trade_offers t WHERE (t.sender_id = u.id OR t.receiver_id = u.id) AND t.status = 'accepted'), 0) as completed_trades,
        COALESCE((SELECT SUM(amount) FROM transactions wt WHERE wt.user_id = u.id AND wt.type = 'topup' AND wt.status = 'completed'), 0) as total_topups,
        (SELECT AVG(r.rating) FROM user_ratings r WHERE r.to_user_id = u.id) as avg_rating,
        COALESCE((SELECT COUNT(*) FROM user_ratings r WHERE r.to_user_id = u.id), 0) as rating_count
      FROM users u
      WHERE u.id = ?`,
      [id]
    )

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    // Get recent activity
    const recentActivity = await query<Record<string, unknown>>(
      `SELECT * FROM activity_log WHERE user_id = ? ORDER BY created_at DESC LIMIT 20`,
      [id]
    )

    // Get recent transactions (use 'transactions' table as per schema)
    const recentTransactions = await query<Record<string, unknown>>(
      `SELECT * FROM transactions WHERE user_id = ? ORDER BY created_at DESC LIMIT 10`,
      [id]
    )

    return NextResponse.json({
      user: {
        id: user.id || "",
        email: user.email || "",
        name: user.name || "Unknown",
        phone: user.phone || null,
        region: user.region || "",
        town: user.town || null,
        avatar: user.avatar || null,
        role: user.role || "user",
        walletBalance: Number(user.wallet_balance) || 0,
        isVerified: Boolean(user.is_verified),
        isBanned: Boolean(user.is_banned),
        banReason: user.ban_reason || null,
        lastSeen: user.last_seen || null,
        createdAt: user.created_at || new Date(),
        stats: {
          totalListings: Number(user.listing_count) || 0,
          activeListings: Number(user.active_listings) || 0,
          totalTrades: Number(user.trade_count) || 0,
          completedTrades: Number(user.completed_trades) || 0,
          totalTopups: Number(user.total_topups) || 0,
          avgRating: user.avg_rating ? Number(user.avg_rating).toFixed(1) : null,
          ratingCount: Number(user.rating_count) || 0,
        },
      },
      recentActivity: (recentActivity || []).map((a) => ({
        id: a.id || "",
        action: a.action || "",
        entityType: a.entity_type || null,
        entityId: a.entity_id || null,
        details: a.details || null,
        createdAt: a.created_at || new Date(),
      })),
      recentTransactions: (recentTransactions || []).map((t) => ({
        id: t.id || "",
        type: t.type || "",
        amount: Number(t.amount) || 0,
        fee: Number(t.fee) || 0,
        status: t.status || "pending",
        description: t.description || null,
        createdAt: t.created_at || new Date(),
      })),
    })
  } catch (error) {
    console.error("Admin get user error:", error)
    return NextResponse.json({ error: "Failed to fetch user" }, { status: 500 })
  }
}

// PATCH - Update user (admin)
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
    const { name, phone, region, town, role, isVerified, isBanned, banReason, walletBalance, newPassword } = body

    // Check user exists
    const user = await queryOne<{ id: string; email: string }>(`SELECT id, email FROM users WHERE id = ?`, [id])
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    // Build update query
    const updates: string[] = []
    const updateParams: unknown[] = []

    if (name !== undefined) {
      updates.push("name = ?")
      updateParams.push(name)
    }
    if (phone !== undefined) {
      updates.push("phone = ?")
      updateParams.push(phone)
    }
    if (region !== undefined) {
      updates.push("region = ?")
      updateParams.push(region)
    }
    if (town !== undefined) {
      updates.push("town = ?")
      updateParams.push(town)
    }
    if (role !== undefined) {
      updates.push("role = ?")
      updateParams.push(role)
    }
    if (isVerified !== undefined) {
      updates.push("is_verified = ?")
      updateParams.push(isVerified)
    }
    if (isBanned !== undefined) {
      updates.push("is_banned = ?")
      updateParams.push(isBanned)
      if (isBanned && banReason) {
        updates.push("ban_reason = ?")
        updateParams.push(banReason)
      } else if (!isBanned) {
        updates.push("ban_reason = NULL")
      }
    }
    if (walletBalance !== undefined) {
      updates.push("wallet_balance = ?")
      updateParams.push(walletBalance)
    }

    // Handle password reset
    if (newPassword !== undefined && newPassword.length >= 8) {
      const bcrypt = await import("bcryptjs")
      const passwordHash = await bcrypt.hash(newPassword, 12)
      updates.push("password_hash = ?")
      updateParams.push(passwordHash)
    } else if (newPassword !== undefined && newPassword.length < 8) {
      return NextResponse.json({ error: "Password must be at least 8 characters" }, { status: 400 })
    }

    if (updates.length > 0) {
      updates.push("updated_at = NOW()")
      updateParams.push(id)
      await execute(`UPDATE users SET ${updates.join(", ")} WHERE id = ?`, updateParams)
    }

    // Log activity
    const activityDetails: Record<string, unknown> = { updates: Object.keys(body) }
    if (newPassword) {
      activityDetails.passwordReset = true
    }
    
    await execute(
      `INSERT INTO activity_log (id, user_id, action, entity_type, entity_id, details) 
       VALUES (?, ?, 'admin_update_user', 'user', ?, ?)`,
      [generateId(), auth.userId, id, JSON.stringify(activityDetails)]
    )

    return NextResponse.json({
      success: true,
      message: newPassword ? "User updated and password reset successfully" : "User updated successfully",
    })
  } catch (error) {
    console.error("Admin update user error:", error)
    return NextResponse.json({ error: "Failed to update user" }, { status: 500 })
  }
}

// DELETE - Delete user (admin)
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

    // Prevent self-deletion
    if (id === auth.userId) {
      return NextResponse.json({ error: "Cannot delete your own account" }, { status: 400 })
    }

    const user = await queryOne<{ name: string; email: string }>(
      `SELECT name, email FROM users WHERE id = ?`,
      [id]
    )

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    await transaction(async (conn: PoolConnection) => {
      // Delete user (cascades will handle related data)
      await conn.execute(`DELETE FROM users WHERE id = ?`, [id])

      // Log activity
      await conn.execute(
        `INSERT INTO activity_log (id, user_id, action, entity_type, entity_id, details) 
         VALUES (?, ?, 'admin_delete_user', 'user', ?, ?)`,
        [generateId(), auth.userId, id, JSON.stringify({ name: user.name, email: user.email })]
      )
    })

    return NextResponse.json({
      success: true,
      message: "User deleted successfully",
    })
  } catch (error) {
    console.error("Admin delete user error:", error)
    return NextResponse.json({ error: "Failed to delete user" }, { status: 500 })
  }
}
