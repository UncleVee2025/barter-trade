import { NextResponse } from "next/server"
import { query } from "@/lib/db"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const position = searchParams.get("position")

    let sql = `
      SELECT
        id,
        title,
        subtitle,
        description,
        image_url,
        link_url,
        cta_text,
        cta_href,
        gradient_colors,
        priority,
        position
      FROM advertisements
      WHERE (status = 'active' OR is_active = 1)
        AND (start_date IS NULL OR start_date <= NOW())
        AND (end_date IS NULL OR end_date >= NOW())
    `

    const params: any[] = []

    if (position) {
      sql += " AND position = ?"
      params.push(position)
    }

    sql += " ORDER BY priority DESC, created_at DESC"

    const ads = await query(sql, params)

    return NextResponse.json({ ads })
  } catch (error) {
    console.error("ADS API ERROR:", error)
    return NextResponse.json({ ads: [] })
  }
}
