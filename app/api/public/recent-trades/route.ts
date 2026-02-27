import { NextResponse, type NextRequest } from "next/server"
import { query } from "@/lib/db"

// Recent trades for real-time notifications - production data only
interface RecentTrade {
  id: string
  buyerName: string
  buyerAvatar: string | null
  sellerName: string
  sellerAvatar: string | null
  itemTitle: string
  itemImage: string | null
  location: string
  timeAgo: string
  createdAt: string
}

interface Activity {
  userName: string
  action: string
  itemTitle: string
  region: string
  timeAgo: string
}

function getTimeAgo(date: Date): string {
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  
  if (diffMins < 1) return "Just now"
  if (diffMins < 60) return `${diffMins} minute${diffMins > 1 ? "s" : ""} ago`
  
  const diffHours = Math.floor(diffMins / 60)
  if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? "s" : ""} ago`
  
  const diffDays = Math.floor(diffHours / 24)
  return `${diffDays} day${diffDays > 1 ? "s" : ""} ago`
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const limit = Math.min(Number(searchParams.get("limit")) || 20, 50)

    // Fetch recent completed trades from database
    const trades = await query<{
      id: string
      sender_id: string
      sender_name: string
      sender_avatar: string | null
      receiver_id: string
      receiver_name: string
      receiver_avatar: string | null
      listing_title: string
      listing_image: string | null
      location: string | null
      created_at: string
    }>(`
      SELECT 
        t.id,
        t.sender_id,
        sender.name as sender_name,
        sender.avatar as sender_avatar,
        t.receiver_id,
        receiver.name as receiver_name,
        receiver.avatar as receiver_avatar,
        l.title as listing_title,
        (SELECT url FROM listing_images WHERE listing_id = l.id AND is_primary = TRUE LIMIT 1) as listing_image,
        l.region as location,
        t.updated_at as created_at
      FROM trade_offers t
      JOIN users sender ON t.sender_id = sender.id
      JOIN users receiver ON t.receiver_id = receiver.id
      LEFT JOIN trade_offer_items toi ON toi.offer_id = t.id
      LEFT JOIN listings l ON toi.listing_id = l.id
      WHERE t.status = 'accepted'
      GROUP BY t.id
      ORDER BY t.updated_at DESC
      LIMIT ?
    `, [limit])

    // Also fetch recent listings for activity feed
    const recentListings = await query<{
      id: string
      title: string
      user_name: string
      region: string
      created_at: string
    }>(`
      SELECT 
        l.id,
        l.title,
        u.name as user_name,
        l.region,
        l.created_at
      FROM listings l
      JOIN users u ON l.user_id = u.id
      WHERE l.status = 'active'
      ORDER BY l.created_at DESC
      LIMIT 10
    `)

    // Format names with privacy (first name + last initial)
    const formatName = (name: string) => {
      if (!name) return "A trader"
      const parts = name.split(" ")
      return parts[0] + (parts[1] ? " " + parts[1][0] + "." : "")
    }

    // Build activities array combining trades and listings
    const activities: Activity[] = []

    // Add completed trades to activities
    if (trades && trades.length > 0) {
      trades.forEach((trade) => {
        const createdAt = new Date(trade.created_at)
        activities.push({
          userName: formatName(trade.sender_name),
          action: "completed a trade for",
          itemTitle: trade.listing_title || "an item",
          region: trade.location || "Namibia",
          timeAgo: getTimeAgo(createdAt)
        })
      })
    }

    // Add recent listings to activities
    if (recentListings && recentListings.length > 0) {
      recentListings.forEach((listing) => {
        const createdAt = new Date(listing.created_at)
        activities.push({
          userName: formatName(listing.user_name),
          action: "just listed",
          itemTitle: listing.title,
          region: listing.region || "Namibia",
          timeAgo: getTimeAgo(createdAt)
        })
      })
    }

    // Sort activities by time and limit
    activities.sort((a, b) => {
      const aTime = parseTimeAgo(a.timeAgo)
      const bTime = parseTimeAgo(b.timeAgo)
      return aTime - bTime
    })

    const formattedTrades: RecentTrade[] = (trades || []).map((trade) => {
      const createdAt = new Date(trade.created_at)
      return {
        id: trade.id.toString(),
        buyerName: formatName(trade.sender_name),
        buyerAvatar: trade.sender_avatar,
        sellerName: formatName(trade.receiver_name),
        sellerAvatar: trade.receiver_avatar,
        itemTitle: trade.listing_title || "Trade",
        itemImage: trade.listing_image,
        location: trade.location || "Namibia",
        timeAgo: getTimeAgo(createdAt),
        createdAt: createdAt.toISOString(),
      }
    })

    return NextResponse.json({
      trades: formattedTrades,
      activities: activities.slice(0, limit),
      source: "database",
    })
  } catch (error) {
    console.error("Failed to fetch recent trades:", error)
    return NextResponse.json(
      { 
        error: "Failed to fetch recent trades",
        details: error instanceof Error ? error.message : "Unknown error",
        trades: [],
        activities: [],
      },
      { status: 500 }
    )
  }
}

// Helper to parse time ago string back to minutes for sorting
function parseTimeAgo(timeAgo: string): number {
  if (timeAgo === "Just now") return 0
  const match = timeAgo.match(/(\d+)\s*(minute|hour|day)/)
  if (!match) return Infinity
  const value = parseInt(match[1])
  const unit = match[2]
  if (unit === "minute") return value
  if (unit === "hour") return value * 60
  if (unit === "day") return value * 60 * 24
  return Infinity
}
