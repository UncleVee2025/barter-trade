import { type NextRequest, NextResponse } from "next/server"
import { verifyAuth } from "@/lib/auth"
import { query, queryOne, execute, generateId } from "@/lib/db"

// Document types available for high-value listings
const DOCUMENT_TYPES = {
  ownership_proof: {
    name: "Proof of Ownership",
    description: "Documents proving legal ownership of the item",
    required_for: ["vehicles", "property", "livestock"],
  },
  title_deed: {
    name: "Title Deed",
    description: "Official title deed or property registration",
    required_for: ["property"],
  },
  registration: {
    name: "Registration Documents",
    description: "Vehicle registration, brand certificates, etc.",
    required_for: ["vehicles", "livestock"],
  },
  valuation: {
    name: "Valuation Certificate",
    description: "Professional appraisal or valuation",
    required_for: ["property", "vehicles", "collectibles"],
  },
  inspection: {
    name: "Inspection Report",
    description: "Recent inspection or condition report",
    required_for: ["vehicles", "property"],
  },
  other: {
    name: "Other Documents",
    description: "Any other relevant verification documents",
    required_for: ["all"],
  },
}

// GET - Get document requests for a listing or user
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await verifyAuth(request)
    if (!auth) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id: listingId } = await params
    const searchParams = request.nextUrl.searchParams
    const type = searchParams.get("type") // 'requests' | 'documents' | 'info'

    // Get listing details
    const listing = await queryOne<{
      id: string
      user_id: string
      title: string
      value: number
      category_id: string
      is_high_value: boolean
      documents_required: boolean
      documents_verified: boolean
    }>(
      `SELECT l.*, c.slug as category_slug, c.is_high_value as category_high_value, c.min_high_value_threshold
       FROM listings l
       LEFT JOIN categories c ON l.category_id = c.id
       WHERE l.id = ?`,
      [listingId]
    )

    if (!listing) {
      return NextResponse.json({ error: "Listing not found" }, { status: 404 })
    }

    // Check if this is a high-value listing
    const isHighValue = listing.is_high_value || listing.value >= 50000 // N$50,000 threshold

    if (type === "info") {
      // Return document requirements info
      const categorySlug = await queryOne<{ slug: string }>(
        `SELECT slug FROM categories WHERE id = ?`,
        [listing.category_id]
      )

      const relevantDocTypes = Object.entries(DOCUMENT_TYPES)
        .filter(([, config]) => 
          config.required_for.includes("all") || 
          (categorySlug && config.required_for.includes(categorySlug.slug))
        )
        .map(([key, config]) => ({ type: key, ...config }))

      return NextResponse.json({
        listing: {
          id: listing.id,
          title: listing.title,
          value: listing.value,
          isHighValue,
          documentsRequired: listing.documents_required,
          documentsVerified: listing.documents_verified,
        },
        documentTypes: relevantDocTypes,
        canRequestDocuments: auth.userId !== listing.user_id && isHighValue,
        isOwner: auth.userId === listing.user_id,
      })
    }

    if (type === "documents") {
      // Get uploaded documents for this listing
      const documents = await query<Record<string, unknown>>(
        `SELECT ld.*, u.name as verified_by_name
         FROM listing_documents ld
         LEFT JOIN users u ON ld.verified_by = u.id
         WHERE ld.listing_id = ?
         ORDER BY ld.uploaded_at DESC`,
        [listingId]
      )

      return NextResponse.json({
        documents: documents.map((d) => ({
          id: d.id,
          type: d.document_type,
          name: d.document_name,
          url: d.document_url,
          isVerified: Boolean(d.is_verified),
          verifiedBy: d.verified_by_name,
          verifiedAt: d.verified_at,
          uploadedAt: d.uploaded_at,
        })),
        isOwner: auth.userId === listing.user_id,
      })
    }

    // Default: Get document requests
    let requestsSql = `
      SELECT dr.*, 
             requester.name as requester_name, 
             requester.avatar as requester_avatar,
             requester.is_verified as requester_verified,
             seller.name as seller_name
      FROM document_requests dr
      LEFT JOIN users requester ON dr.requester_id = requester.id
      LEFT JOIN users seller ON dr.seller_id = seller.id
      WHERE dr.listing_id = ?
    `
    const requestParams: string[] = [listingId]

    // If user is not owner, only show their own requests
    if (auth.userId !== listing.user_id) {
      requestsSql += ` AND dr.requester_id = ?`
      requestParams.push(auth.userId)
    }

    requestsSql += ` ORDER BY dr.created_at DESC`

    const requests = await query<Record<string, unknown>>(requestsSql, requestParams)

    return NextResponse.json({
      requests: requests.map((r) => ({
        id: r.id,
        documentTypes: r.document_types ? JSON.parse(r.document_types as string) : [],
        message: r.message,
        status: r.status,
        responseMessage: r.response_message,
        respondedAt: r.responded_at,
        expiresAt: r.expires_at,
        createdAt: r.created_at,
        requester: {
          id: r.requester_id,
          name: r.requester_name,
          avatar: r.requester_avatar,
          isVerified: Boolean(r.requester_verified),
        },
        isOwner: auth.userId === listing.user_id,
        isRequester: auth.userId === r.requester_id,
      })),
      isOwner: auth.userId === listing.user_id,
      isHighValue,
    })
  } catch (error) {
    console.error("Error fetching document requests:", error)
    return NextResponse.json({ error: "Failed to fetch document requests" }, { status: 500 })
  }
}

// POST - Request documents from seller
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await verifyAuth(request)
    if (!auth) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id: listingId } = await params
    const { documentTypes, message } = await request.json()

    if (!documentTypes || !Array.isArray(documentTypes) || documentTypes.length === 0) {
      return NextResponse.json(
        { error: "Please select at least one document type to request" },
        { status: 400 }
      )
    }

    // Validate document types
    const validTypes = Object.keys(DOCUMENT_TYPES)
    const invalidTypes = documentTypes.filter((t: string) => !validTypes.includes(t))
    if (invalidTypes.length > 0) {
      return NextResponse.json(
        { error: `Invalid document types: ${invalidTypes.join(", ")}` },
        { status: 400 }
      )
    }

    // Get listing
    const listing = await queryOne<{
      id: string
      user_id: string
      title: string
      value: number
      is_high_value: boolean
    }>(
      `SELECT * FROM listings WHERE id = ? AND status = 'active'`,
      [listingId]
    )

    if (!listing) {
      return NextResponse.json({ error: "Listing not found or not active" }, { status: 404 })
    }

    // Cannot request documents for your own listing
    if (listing.user_id === auth.userId) {
      return NextResponse.json(
        { error: "You cannot request documents for your own listing" },
        { status: 400 }
      )
    }

    // Check if this is a high-value listing
    const isHighValue = listing.is_high_value || listing.value >= 50000
    if (!isHighValue) {
      return NextResponse.json(
        { error: "Document requests are only available for high-value listings (N$50,000+)" },
        { status: 400 }
      )
    }

    // Check if user already has a pending request
    const existingRequest = await queryOne<{ id: string; status: string }>(
      `SELECT id, status FROM document_requests 
       WHERE listing_id = ? AND requester_id = ? AND status IN ('pending', 'documents_uploaded')`,
      [listingId, auth.userId]
    )

    if (existingRequest) {
      return NextResponse.json(
        { error: "You already have an active document request for this listing" },
        { status: 400 }
      )
    }

    // Create document request
    const requestId = generateId()
    const expiresAt = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000) // 14 days

    await execute(
      `INSERT INTO document_requests (id, listing_id, requester_id, seller_id, document_types, message, expires_at)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        requestId,
        listingId,
        auth.userId,
        listing.user_id,
        JSON.stringify(documentTypes),
        message || null,
        expiresAt,
      ]
    )

    // Get requester name
    const requester = await queryOne<{ name: string }>(
      `SELECT name FROM users WHERE id = ?`,
      [auth.userId]
    )

    // Create notification for seller
    await execute(
      `INSERT INTO notifications (id, user_id, type, title, message, data, priority)
       VALUES (?, ?, 'listing', ?, ?, ?, 'high')`,
      [
        generateId(),
        listing.user_id,
        "Document Request Received",
        `${requester?.name || "A buyer"} has requested verification documents for "${listing.title}"`,
        JSON.stringify({ listingId, requestId }),
      ]
    )

    return NextResponse.json({
      success: true,
      requestId,
      message: "Document request sent successfully! The seller will be notified.",
      expiresAt,
    })
  } catch (error) {
    console.error("Error creating document request:", error)
    return NextResponse.json({ error: "Failed to create document request" }, { status: 500 })
  }
}

// PATCH - Respond to document request (upload documents or decline)
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await verifyAuth(request)
    if (!auth) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id: listingId } = await params
    const { requestId, action, documents, responseMessage } = await request.json()

    if (!requestId) {
      return NextResponse.json({ error: "requestId is required" }, { status: 400 })
    }

    // Get the document request
    const docRequest = await queryOne<{
      id: string
      listing_id: string
      requester_id: string
      seller_id: string
      status: string
    }>(
      `SELECT * FROM document_requests WHERE id = ? AND listing_id = ?`,
      [requestId, listingId]
    )

    if (!docRequest) {
      return NextResponse.json({ error: "Document request not found" }, { status: 404 })
    }

    // Verify ownership
    if (docRequest.seller_id !== auth.userId) {
      return NextResponse.json(
        { error: "Only the seller can respond to document requests" },
        { status: 403 }
      )
    }

    if (action === "upload" && documents && Array.isArray(documents)) {
      // Upload documents
      for (const doc of documents) {
        if (!doc.type || !doc.name || !doc.url) continue

        await execute(
          `INSERT INTO listing_documents (id, listing_id, document_type, document_name, document_url)
           VALUES (?, ?, ?, ?, ?)`,
          [generateId(), listingId, doc.type, doc.name, doc.url]
        )
      }

      // Update request status
      await execute(
        `UPDATE document_requests 
         SET status = 'documents_uploaded', response_message = ?, responded_at = NOW()
         WHERE id = ?`,
        [responseMessage || "Documents have been uploaded", requestId]
      )

      // Get seller name
      const seller = await queryOne<{ name: string }>(
        `SELECT name FROM users WHERE id = ?`,
        [auth.userId]
      )

      // Notify requester
      await execute(
        `INSERT INTO notifications (id, user_id, type, title, message, data, priority)
         VALUES (?, ?, 'listing', ?, ?, ?, 'high')`,
        [
          generateId(),
          docRequest.requester_id,
          "Documents Uploaded",
          `${seller?.name || "The seller"} has uploaded verification documents for your request`,
          JSON.stringify({ listingId, requestId }),
        ]
      )

      return NextResponse.json({
        success: true,
        message: "Documents uploaded successfully! The buyer has been notified.",
      })
    }

    if (action === "decline") {
      await execute(
        `UPDATE document_requests 
         SET status = 'rejected', response_message = ?, responded_at = NOW()
         WHERE id = ?`,
        [responseMessage || "Request declined by seller", requestId]
      )

      // Notify requester
      await execute(
        `INSERT INTO notifications (id, user_id, type, title, message, data)
         VALUES (?, ?, 'listing', ?, ?, ?)`,
        [
          generateId(),
          docRequest.requester_id,
          "Document Request Declined",
          responseMessage || "The seller has declined your document request",
          JSON.stringify({ listingId, requestId }),
        ]
      )

      return NextResponse.json({
        success: true,
        message: "Document request declined",
      })
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 })
  } catch (error) {
    console.error("Error responding to document request:", error)
    return NextResponse.json({ error: "Failed to respond to document request" }, { status: 500 })
  }
}
