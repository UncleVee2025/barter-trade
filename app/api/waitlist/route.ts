import { NextResponse } from "next/server"
import { query, queryOne, execute } from "@/lib/db"

// POST - Add email to waitlist
export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { email } = body

    // Validate email
    if (!email || typeof email !== "string") {
      return NextResponse.json(
        { error: "Email is required" },
        { status: 400 }
      )
    }

    // Simple email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: "Invalid email format" },
        { status: 400 }
      )
    }

    // Check if email already exists
    const existing = await queryOne<{ id: string }>(
      "SELECT id FROM waitlist WHERE email = ?",
      [email.toLowerCase().trim()]
    )

    if (existing) {
      return NextResponse.json(
        { error: "This email is already on the waitlist", alreadyExists: true },
        { status: 409 }
      )
    }

    // Insert into waitlist
    await execute(
      "INSERT INTO waitlist (id, email, created_at) VALUES (UUID(), ?, NOW())",
      [email.toLowerCase().trim()]
    )

    // Get total waitlist count for social proof
    const count = await queryOne<{ total: number }>(
      "SELECT COUNT(*) as total FROM waitlist"
    )

    return NextResponse.json({
      success: true,
      message: "You're on the waitlist!",
      position: count?.total || 1,
    })
  } catch (error) {
    console.error("Waitlist signup error:", error)
    return NextResponse.json(
      { error: "Failed to join waitlist. Please try again." },
      { status: 500 }
    )
  }
}

// GET - Get waitlist stats (for admin)
export async function GET() {
  try {
    const count = await queryOne<{ total: number }>(
      "SELECT COUNT(*) as total FROM waitlist"
    )

    const recent = await query<{ email: string; created_at: string }>(
      "SELECT email, created_at FROM waitlist ORDER BY created_at DESC LIMIT 10"
    )

    return NextResponse.json({
      total: count?.total || 0,
      recent: recent || [],
    })
  } catch (error) {
    console.error("Waitlist fetch error:", error)
    return NextResponse.json(
      { error: "Failed to fetch waitlist data" },
      { status: 500 }
    )
  }
}
