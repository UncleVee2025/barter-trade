// Admin ID Verification Management API
import { NextRequest, NextResponse } from "next/server"
import { query, execute } from "@/lib/db"
import { verifyAuth } from "@/lib/auth"

// GET - Get verification details
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await verifyAuth(request)
    if (!auth || auth.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = await params

    const [user] = await query<{
      id: string
      name: string
      email: string
      phone: string
      region: string
      town: string
      id_verification_status: string
      id_rejection_reason: string | null
      national_id_front: string | null
      national_id_back: string | null
      created_at: Date
      updated_at: Date
    }>(`
      SELECT id, name, email, phone, region, town,
             id_verification_status, id_rejection_reason,
             national_id_front, national_id_back,
             created_at, updated_at
      FROM users WHERE id = ?
    `, [id])

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    return NextResponse.json({ user })
  } catch (error) {
    console.error("Verification fetch error:", error)
    return NextResponse.json({ error: "Failed to fetch verification" }, { status: 500 })
  }
}

// PUT - Approve or reject verification
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await verifyAuth(request)
    if (!auth || auth.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = await params
    const body = await request.json()
    const { action, rejection_reason } = body

    if (!["approve", "reject"].includes(action)) {
      return NextResponse.json({ error: "Invalid action" }, { status: 400 })
    }

    // Get current user data
    const [user] = await query<{ id: string; name: string; email: string }>(`
      SELECT id, name, email FROM users WHERE id = ?
    `, [id])

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    const newStatus = action === "approve" ? "approved" : "rejected"

    // Update verification status
    await execute(`
      UPDATE users 
      SET id_verification_status = ?,
          id_rejection_reason = ?,
          is_verified = ?,
          updated_at = NOW()
      WHERE id = ?
    `, [
      newStatus,
      action === "reject" ? rejection_reason : null,
      action === "approve" ? 1 : 0,
      id
    ])

    // Log the activity
    await execute(`
      INSERT INTO activity_log (
        id, admin_id, user_id, action_type, entity_type, entity_id,
        description, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, NOW())
    `, [
      `act_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      auth.userId,
      id,
      action === "approve" ? "id_verification_approved" : "id_verification_rejected",
      "user",
      id,
      action === "approve" 
        ? `ID verification approved for ${user.name}`
        : `ID verification rejected for ${user.name}: ${rejection_reason}`
    ])

    // Create notification for user
    await execute(`
      INSERT INTO notifications (
        id, user_id, type, title, message, is_read, created_at
      ) VALUES (?, ?, ?, ?, ?, 0, NOW())
    `, [
      `notif_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      id,
      "system",
      action === "approve" ? "ID Verification Approved" : "ID Verification Rejected",
      action === "approve"
        ? "Your identity has been verified. You now have full access to all platform features."
        : `Your ID verification was rejected. Reason: ${rejection_reason}. Please resubmit with valid documents.`
    ])

    return NextResponse.json({ 
      success: true, 
      message: `Verification ${action === "approve" ? "approved" : "rejected"} successfully` 
    })
  } catch (error) {
    console.error("Verification update error:", error)
    return NextResponse.json({ error: "Failed to update verification" }, { status: 500 })
  }
}
