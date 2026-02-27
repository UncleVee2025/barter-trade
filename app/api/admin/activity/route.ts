import { type NextRequest, NextResponse } from "next/server"
import { verifyAuth } from "@/lib/auth"
import { query } from "@/lib/db"

interface ActivityItem {
  id: string
  type: "user" | "listing" | "trade" | "wallet" | "report"
  action: string
  message: string
  entity_id: string | null
  entity_type: string | null
  user_id: string | null
  user_name: string | null
  created_at: Date
  metadata: Record<string, unknown> | null
}

export async function GET(request: NextRequest) {
  try {
    const auth = await verifyAuth(request)
    if (!auth || auth.role !== "admin") {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const limit = Number.parseInt(searchParams.get("limit") || "20")
    const offset = Number.parseInt(searchParams.get("offset") || "0")
    const type = searchParams.get("type") // Optional filter by activity type

    // Get recent activity from multiple sources
    const activities: ActivityItem[] = []

    // Recent user registrations
    const newUsers = await query<{
      id: string
      name: string
      email: string
      region: string
      created_at: Date
    }>(`
      SELECT id, name, email, region, created_at 
      FROM users 
      WHERE created_at >= DATE_SUB(NOW(), INTERVAL 24 HOUR)
      ORDER BY created_at DESC
      LIMIT 10
    `)

    for (const user of newUsers) {
      activities.push({
        id: `user-${user.id}`,
        type: "user",
        action: "register",
        message: `New user registered: ${user.name}`,
        entity_id: user.id,
        entity_type: "user",
        user_id: user.id,
        user_name: user.name,
        created_at: user.created_at,
        metadata: { email: user.email, region: user.region },
      })
    }

    // Recent listings
    const newListings = await query<{
      id: string
      title: string
      status: string
      user_id: string
      user_name: string
      created_at: Date
    }>(`
      SELECT l.id, l.title, l.status, l.user_id, u.name as user_name, l.created_at
      FROM listings l
      JOIN users u ON l.user_id = u.id
      WHERE l.created_at >= DATE_SUB(NOW(), INTERVAL 24 HOUR)
      ORDER BY l.created_at DESC
      LIMIT 15
    `)

    for (const listing of newListings) {
      const action = listing.status === "pending" ? "Listing pending review" : "New listing created"
      activities.push({
        id: `listing-${listing.id}`,
        type: "listing",
        action: listing.status === "pending" ? "pending" : "created",
        message: `${action}: ${listing.title}`,
        entity_id: listing.id,
        entity_type: "listing",
        user_id: listing.user_id,
        user_name: listing.user_name,
        created_at: listing.created_at,
        metadata: { title: listing.title, status: listing.status },
      })
    }

    // Recent trades
    const recentTrades = await query<{
      id: string
      status: string
      sender_name: string
      receiver_name: string
      wallet_amount: number
      created_at: Date
      updated_at: Date
    }>(`
      SELECT 
        t.id, t.status, t.wallet_amount, t.created_at, t.updated_at,
        s.name as sender_name, r.name as receiver_name
      FROM trade_offers t
      JOIN users s ON t.sender_id = s.id
      JOIN users r ON t.receiver_id = r.id
      WHERE t.updated_at >= DATE_SUB(NOW(), INTERVAL 24 HOUR)
      ORDER BY t.updated_at DESC
      LIMIT 10
    `)

    for (const trade of recentTrades) {
      let message = ""
      let action = trade.status
      
      switch (trade.status) {
        case "accepted":
          message = `Trade completed: ${trade.sender_name} with ${trade.receiver_name}`
          break
        case "rejected":
          message = `Trade rejected between ${trade.sender_name} and ${trade.receiver_name}`
          break
        case "pending":
          message = `New trade offer from ${trade.sender_name} to ${trade.receiver_name}`
          break
        default:
          message = `Trade update: ${trade.status}`
      }

      activities.push({
        id: `trade-${trade.id}`,
        type: "trade",
        action,
        message,
        entity_id: trade.id,
        entity_type: "trade",
        user_id: null,
        user_name: trade.sender_name,
        created_at: trade.updated_at,
        metadata: { 
          sender: trade.sender_name, 
          receiver: trade.receiver_name,
          amount: trade.wallet_amount 
        },
      })
    }

    // Recent wallet transactions
    const recentTransactions = await query<{
      id: string
      type: string
      amount: number
      status: string
      user_id: string
      user_name: string
      created_at: Date
    }>(`
      SELECT t.id, t.type, t.amount, t.status, t.user_id, u.name as user_name, t.created_at
      FROM transactions t
      JOIN users u ON t.user_id = u.id
      WHERE t.created_at >= DATE_SUB(NOW(), INTERVAL 24 HOUR)
      ORDER BY t.created_at DESC
      LIMIT 15
    `)

    for (const tx of recentTransactions) {
      let message = ""
      switch (tx.type) {
        case "topup":
          message = `Top-up ${tx.status}: N$${tx.amount} by ${tx.user_name}`
          break
        case "voucher":
          message = `Voucher redeemed: N$${tx.amount} by ${tx.user_name}`
          break
        case "transfer_out":
          message = `Transfer sent: N$${tx.amount} from ${tx.user_name}`
          break
        case "transfer_in":
          message = `Transfer received: N$${tx.amount} to ${tx.user_name}`
          break
        default:
          message = `Transaction ${tx.type}: N$${tx.amount}`
      }

      activities.push({
        id: `wallet-${tx.id}`,
        type: "wallet",
        action: tx.type,
        message,
        entity_id: tx.id,
        entity_type: "transaction",
        user_id: tx.user_id,
        user_name: tx.user_name,
        created_at: tx.created_at,
        metadata: { type: tx.type, amount: tx.amount, status: tx.status },
      })
    }

    // Recent reports
    const recentReports = await query<{
      id: string
      reported_type: string
      reason: string
      status: string
      reporter_name: string
      created_at: Date
    }>(`
      SELECT r.id, r.reported_type, r.reason, r.status, u.name as reporter_name, r.created_at
      FROM reports r
      JOIN users u ON r.reporter_id = u.id
      WHERE r.created_at >= DATE_SUB(NOW(), INTERVAL 48 HOUR)
      ORDER BY r.created_at DESC
      LIMIT 10
    `)

    for (const report of recentReports) {
      activities.push({
        id: `report-${report.id}`,
        type: "report",
        action: report.reason,
        message: `${report.reported_type} reported for ${report.reason}`,
        entity_id: report.id,
        entity_type: "report",
        user_id: null,
        user_name: report.reporter_name,
        created_at: report.created_at,
        metadata: { 
          reported_type: report.reported_type, 
          reason: report.reason,
          status: report.status 
        },
      })
    }

    // Sort all activities by time
    activities.sort((a, b) => 
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    )

    // Filter by type if specified
    let filteredActivities = activities
    if (type && type !== "all") {
      filteredActivities = activities.filter(a => a.type === type)
    }

    // Apply pagination
    const paginatedActivities = filteredActivities.slice(offset, offset + limit)

    // Format for frontend
    const formattedActivities = paginatedActivities.map(a => ({
      ...a,
      time: formatTimeAgo(new Date(a.created_at)),
      status: getActivityStatus(a),
    }))

    return NextResponse.json({
      activities: formattedActivities,
      total: filteredActivities.length,
      hasMore: offset + limit < filteredActivities.length,
    })
  } catch (error) {
    console.error("Admin activity error:", error)
    return NextResponse.json({ error: "Failed to fetch activity" }, { status: 500 })
  }
}

function formatTimeAgo(date: Date): string {
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMs / 3600000)
  const diffDays = Math.floor(diffMs / 86400000)

  if (diffMins < 1) return "Just now"
  if (diffMins < 60) return `${diffMins}m ago`
  if (diffHours < 24) return `${diffHours}h ago`
  return `${diffDays}d ago`
}

function getActivityStatus(activity: ActivityItem): "success" | "warning" | "error" {
  switch (activity.type) {
    case "report":
      return "error"
    case "listing":
      if (activity.action === "pending") return "warning"
      return "success"
    case "wallet":
      if (activity.metadata?.status === "pending") return "warning"
      if (activity.metadata?.status === "failed") return "error"
      return "success"
    case "trade":
      if (activity.action === "rejected") return "error"
      if (activity.action === "pending") return "warning"
      return "success"
    default:
      return "success"
  }
}
