// Admin Advertisements Management API - Paid and Sponsored Ads
// PRODUCTION ONLY - Requires MySQL database connection
import { NextRequest, NextResponse } from "next/server"
import { query, execute, generateId, queryOne } from "@/lib/db"
import { verifyAuth } from "@/lib/auth"

// Pricing configuration (NAD)
const PRICING = {
  daily: 550,
  weekly: 3000,
  monthly: 9800
}

// GET - Fetch all advertisements
export async function GET(request: NextRequest) {
  try {
    const auth = await verifyAuth(request)
    if (!auth || auth.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const status = searchParams.get("status")
    const position = searchParams.get("position")
    const adType = searchParams.get("adType") // paid, sponsored

    let whereClause = "WHERE 1=1"
    const params: (string | number)[] = []

    if (status && status !== "all") {
      whereClause += " AND a.status = ?"
      params.push(status)
    }

    if (position && position !== "all") {
      whereClause += " AND a.position = ?"
      params.push(position)
    }

    if (adType && adType !== "all") {
      whereClause += " AND a.ad_type = ?"
      params.push(adType)
    }

    const advertisements = await query<{
      id: string
      title: string
      description: string | null
      image_url: string
      link_url: string | null
      position: string
      ad_type: string
      status: string
      start_date: Date | null
      end_date: Date | null
      impressions: number
      clicks: number
      created_by: string
      created_at: Date
      updated_at: Date
      // Add ad specific fields
      business_name: string | null
      contact_person: string | null
      email: string | null
      phone: string | null
      website: string | null
      duration_type: string | null
      duration_days: number | null
      pricing_package: string | null
      total_amount: number | null
      payment_status: string | null
      invoice_number: string | null
      quotation_sent_at: Date | null
      invoice_sent_at: Date | null
      reminder_sent_at: Date | null
    }>(`
      SELECT * FROM advertisements a
      ${whereClause}
      ORDER BY a.created_at DESC
    `, params)

    // Get stats
    const statsResult = await queryOne<{
      total: number
      active: number
      scheduled: number
      inactive: number
      total_impressions: number
      total_clicks: number
      paid_count: number
      sponsored_count: number
      total_revenue: number
    }>(`
      SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN status = 'active' THEN 1 ELSE 0 END) as active,
        SUM(CASE WHEN status = 'scheduled' THEN 1 ELSE 0 END) as scheduled,
        SUM(CASE WHEN status = 'inactive' THEN 1 ELSE 0 END) as inactive,
        COALESCE(SUM(impressions), 0) as total_impressions,
        COALESCE(SUM(clicks), 0) as total_clicks,
        SUM(CASE WHEN ad_type = 'paid' THEN 1 ELSE 0 END) as paid_count,
        SUM(CASE WHEN ad_type = 'sponsored' THEN 1 ELSE 0 END) as sponsored_count,
        COALESCE(SUM(CASE WHEN ad_type = 'paid' AND payment_status = 'paid' THEN total_amount ELSE 0 END), 0) as total_revenue
      FROM advertisements
    `)

    const stats = {
      total: Number(statsResult?.total) || 0,
      active: Number(statsResult?.active) || 0,
      scheduled: Number(statsResult?.scheduled) || 0,
      inactive: Number(statsResult?.inactive) || 0,
      totalImpressions: Number(statsResult?.total_impressions) || 0,
      totalClicks: Number(statsResult?.total_clicks) || 0,
      paidCount: Number(statsResult?.paid_count) || 0,
      sponsoredCount: Number(statsResult?.sponsored_count) || 0,
      totalRevenue: Number(statsResult?.total_revenue) || 0
    }

    return NextResponse.json({
      advertisements: advertisements || [],
      stats,
      pricing: PRICING
    })
  } catch (error) {
    console.error("Admin ads fetch error:", error)
    return NextResponse.json({ 
      advertisements: [],
      stats: { total: 0, active: 0, scheduled: 0, inactive: 0, totalImpressions: 0, totalClicks: 0, paidCount: 0, sponsoredCount: 0, totalRevenue: 0 },
      pricing: PRICING
    })
  }
}

// POST - Create new advertisement
export async function POST(request: NextRequest) {
  try {
    const auth = await verifyAuth(request)
    if (!auth || auth.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const {
      title,
      description,
      imageUrl,
      linkUrl,
      position,
      adType, // 'paid' or 'sponsored'
      status,
      startDate,
      endDate,
      // Paid ad specific fields
      businessName,
      contactPerson,
      email,
      phone,
      website,
      durationType, // 'daily', 'weekly', 'monthly'
      durationDays
    } = body

    if (!title || !imageUrl || !position || !adType) {
      return NextResponse.json({ error: "Title, image, position and ad type are required" }, { status: 400 })
    }

    const adId = generateId()
    let totalAmount = 0
    let invoiceNumber: string | null = null
    let quotationSentAt: Date | null = null // Declare the variable here

    // Calculate pricing for paid ads
    if (adType === "paid") {
      if (!businessName || !contactPerson || !email || !phone || !durationType) {
        return NextResponse.json({ 
          error: "Business name, contact person, email, phone and duration are required for paid ads" 
        }, { status: 400 })
      }

      // Calculate total amount based on duration
      const days = durationDays || getDurationDays(durationType)
      const dailyRate = PRICING[durationType as keyof typeof PRICING] / (durationType === 'daily' ? 1 : durationType === 'weekly' ? 7 : 30)
      totalAmount = days * dailyRate

      // Generate invoice number
      invoiceNumber = `INV-${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}-${adId.substring(0, 6).toUpperCase()}`
      quotationSentAt = new Date()
    }

    // Calculate end date if not provided
    let calculatedEndDate = endDate ? new Date(endDate) : null
    if (!calculatedEndDate && startDate && durationDays) {
      calculatedEndDate = new Date(startDate)
      calculatedEndDate.setDate(calculatedEndDate.getDate() + durationDays)
    }

    // Insert into database
    await execute(`
      INSERT INTO advertisements (
        id, title, description, image_url, link_url, position, ad_type, status,
        start_date, end_date, impressions, clicks, created_by, created_at, updated_at,
        business_name, contact_person, email, phone, website,
        duration_type, duration_days, pricing_package, total_amount, payment_status,
        invoice_number, quotation_sent_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, 0, ?, NOW(), NOW(), ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      adId,
      title,
      description || null,
      imageUrl,
      linkUrl || null,
      position,
      adType,
      status || (adType === 'sponsored' ? 'active' : 'inactive'),
      startDate || null,
      calculatedEndDate,
      auth.userId,
      businessName || null,
      contactPerson || null,
      email || null,
      phone || null,
      website || null,
      durationType || null,
      durationDays || null,
      durationType ? `N$${PRICING[durationType as keyof typeof PRICING]} per ${durationType.replace('ly', '')}` : null,
      totalAmount,
      adType === 'paid' ? 'pending' : null,
      invoiceNumber,
      adType === 'paid' ? new Date() : null
    ])

    // Log activity
    await execute(`
      INSERT INTO activity_log (id, user_id, action, entity_type, entity_id, details, created_at)
      VALUES (?, ?, 'create_advertisement', 'advertisement', ?, ?, NOW())
    `, [generateId(), auth.userId, adId, JSON.stringify({ title, adType, position })])

    return NextResponse.json({
      success: true,
      adId,
      invoiceNumber,
      totalAmount,
      message: adType === 'paid' 
        ? `Paid advertisement created. Invoice ${invoiceNumber} generated. Total: N$${totalAmount.toFixed(2)}`
        : 'Sponsored advertisement created successfully'
    })
  } catch (error) {
    console.error("Create advertisement error:", error)
    return NextResponse.json({ error: "Failed to create advertisement" }, { status: 500 })
  }
}

// PATCH - Update advertisement
export async function PATCH(request: NextRequest) {
  try {
    const auth = await verifyAuth(request)
    if (!auth || auth.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { id, ...updates } = body

    if (!id) {
      return NextResponse.json({ error: "Advertisement ID is required" }, { status: 400 })
    }

    // Build update query dynamically
    const updateFields: string[] = []
    const params: (string | number | Date | null)[] = []

    const fieldMappings: Record<string, string> = {
      title: 'title',
      description: 'description',
      imageUrl: 'image_url',
      linkUrl: 'link_url',
      position: 'position',
      status: 'status',
      startDate: 'start_date',
      endDate: 'end_date',
      businessName: 'business_name',
      contactPerson: 'contact_person',
      email: 'email',
      phone: 'phone',
      website: 'website',
      paymentStatus: 'payment_status'
    }

    for (const [key, dbField] of Object.entries(fieldMappings)) {
      if (updates[key] !== undefined) {
        updateFields.push(`${dbField} = ?`)
        params.push(updates[key])
      }
    }

    if (updateFields.length === 0) {
      return NextResponse.json({ error: "No fields to update" }, { status: 400 })
    }

    updateFields.push('updated_at = NOW()')
    params.push(id)

    await execute(`
      UPDATE advertisements SET ${updateFields.join(', ')} WHERE id = ?
    `, params)

    return NextResponse.json({ success: true, message: "Advertisement updated successfully" })
  } catch (error) {
    console.error("Update advertisement error:", error)
    return NextResponse.json({ error: "Failed to update advertisement" }, { status: 500 })
  }
}

// DELETE - Remove advertisement
export async function DELETE(request: NextRequest) {
  try {
    const auth = await verifyAuth(request)
    if (!auth || auth.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { id } = body

    if (!id) {
      return NextResponse.json({ error: "Advertisement ID is required" }, { status: 400 })
    }

    await execute(`DELETE FROM advertisements WHERE id = ?`, [id])

    // Log activity
    await execute(`
      INSERT INTO activity_log (id, user_id, action, entity_type, entity_id, created_at)
      VALUES (?, ?, 'delete_advertisement', 'advertisement', ?, NOW())
    `, [generateId(), auth.userId, id])

    return NextResponse.json({ success: true, message: "Advertisement deleted successfully" })
  } catch (error) {
    console.error("Delete advertisement error:", error)
    return NextResponse.json({ error: "Failed to delete advertisement" }, { status: 500 })
  }
}

function getDurationDays(durationType: string): number {
  switch (durationType) {
    case 'daily': return 1
    case 'weekly': return 7
    case 'monthly': return 30
    default: return 1
  }
}
