import { NextRequest, NextResponse } from "next/server"
import { execute } from "@/lib/db"

// POST - Track ad click
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    if (!id) {
      return NextResponse.json({ error: "Ad ID required" }, { status: 400 })
    }

    // Increment click count
    await execute(
      `UPDATE advertisements SET clicks = clicks + 1 WHERE id = ?`,
      [id]
    )

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error tracking click:", error)
    return NextResponse.json({ success: false }, { status: 500 })
  }
}
