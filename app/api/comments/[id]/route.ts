import { type NextRequest, NextResponse } from "next/server"
import { verifyAuth } from "@/lib/auth"
import { queryOne, execute, generateId } from "@/lib/db"

// PATCH - Update a comment
export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = await verifyAuth(request)
    if (!auth) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = await params
    const { content } = await request.json()

    if (!content || content.trim().length < 1) {
      return NextResponse.json({ error: "Content is required" }, { status: 400 })
    }

    if (content.length > 2000) {
      return NextResponse.json({ error: "Comment cannot exceed 2000 characters" }, { status: 400 })
    }

    // Check ownership
    const comment = await queryOne<{ user_id: string }>(
      `SELECT user_id FROM comments WHERE id = ?`,
      [id]
    )

    if (!comment) {
      return NextResponse.json({ error: "Comment not found" }, { status: 404 })
    }

    if (comment.user_id !== auth.userId && auth.role !== "admin") {
      return NextResponse.json({ error: "Not authorized to edit this comment" }, { status: 403 })
    }

    await execute(
      `UPDATE comments SET content = ?, is_edited = TRUE, updated_at = NOW() WHERE id = ?`,
      [content.trim(), id]
    )

    return NextResponse.json({
      success: true,
      message: "Comment updated successfully",
    })
  } catch (error) {
    console.error("Error updating comment:", error)
    return NextResponse.json({ error: "Failed to update comment" }, { status: 500 })
  }
}

// DELETE - Delete a comment
export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = await verifyAuth(request)
    if (!auth) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = await params

    const comment = await queryOne<{ user_id: string; listing_id: string }>(
      `SELECT user_id, listing_id FROM comments WHERE id = ?`,
      [id]
    )

    if (!comment) {
      return NextResponse.json({ error: "Comment not found" }, { status: 404 })
    }

    // Check if user is comment author, listing owner, or admin
    const listing = await queryOne<{ user_id: string }>(
      `SELECT user_id FROM listings WHERE id = ?`,
      [comment.listing_id]
    )

    const canDelete =
      comment.user_id === auth.userId ||
      listing?.user_id === auth.userId ||
      auth.role === "admin"

    if (!canDelete) {
      return NextResponse.json({ error: "Not authorized to delete this comment" }, { status: 403 })
    }

    // Delete comment (cascade will handle replies)
    await execute(`DELETE FROM comments WHERE id = ?`, [id])

    // Log activity
    await execute(
      `INSERT INTO activity_log (id, user_id, action, entity_type, entity_id) VALUES (?, ?, 'delete_comment', 'comment', ?)`,
      [generateId(), auth.userId, id]
    )

    return NextResponse.json({
      success: true,
      message: "Comment deleted successfully",
    })
  } catch (error) {
    console.error("Error deleting comment:", error)
    return NextResponse.json({ error: "Failed to delete comment" }, { status: 500 })
  }
}
