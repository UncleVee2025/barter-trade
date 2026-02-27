import { type NextRequest, NextResponse } from "next/server"
import { verifyAuth } from "@/lib/auth"
import { queryOne, query, execute, generateId } from "@/lib/db"

interface GamificationData {
  totalPoints: number
  tier: "bronze" | "silver" | "gold" | "platinum" | "diamond"
  starRating: number
  totalReviews: number
  profileCompletion: number
  verifiedTrader: boolean
  badges: Badge[]
  achievements: Achievement[]
  recentActivity: PointTransaction[]
  nextTierProgress: {
    currentTier: string
    nextTier: string
    pointsNeeded: number
    progress: number
  }
}

interface Badge {
  id: string
  name: string
  slug: string
  description: string
  icon: string
  color: string
  earnedAt?: string
}

interface Achievement {
  id: string
  name: string
  slug: string
  description: string
  icon: string
  color: string
  pointsReward: number
  earnedAt?: string
}

interface PointTransaction {
  id: string
  points: number
  actionType: string
  description: string
  createdAt: string
}

// Tier thresholds
const TIER_THRESHOLDS = {
  bronze: 0,
  silver: 51,
  gold: 151,
  platinum: 301,
  diamond: 501,
}

function calculateTier(points: number): "bronze" | "silver" | "gold" | "platinum" | "diamond" {
  if (points >= TIER_THRESHOLDS.diamond) return "diamond"
  if (points >= TIER_THRESHOLDS.platinum) return "platinum"
  if (points >= TIER_THRESHOLDS.gold) return "gold"
  if (points >= TIER_THRESHOLDS.silver) return "silver"
  return "bronze"
}

function getNextTierProgress(points: number, currentTier: string) {
  const tiers = ["bronze", "silver", "gold", "platinum", "diamond"]
  const currentIndex = tiers.indexOf(currentTier)
  
  if (currentIndex === tiers.length - 1) {
    return {
      currentTier,
      nextTier: "diamond",
      pointsNeeded: 0,
      progress: 100,
    }
  }
  
  const nextTier = tiers[currentIndex + 1]
  const currentThreshold = TIER_THRESHOLDS[currentTier as keyof typeof TIER_THRESHOLDS]
  const nextThreshold = TIER_THRESHOLDS[nextTier as keyof typeof TIER_THRESHOLDS]
  const pointsInCurrentTier = points - currentThreshold
  const pointsNeededForNextTier = nextThreshold - currentThreshold
  const progress = Math.min(100, Math.round((pointsInCurrentTier / pointsNeededForNextTier) * 100))
  
  return {
    currentTier,
    nextTier,
    pointsNeeded: nextThreshold - points,
    progress,
  }
}

// GET - Fetch user's gamification data
export async function GET(request: NextRequest) {
  try {
    const auth = await verifyAuth(request)

    if (!auth) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const userId = auth.userId

    try {
      // Get or create gamification record
      let gamificationRecord = await queryOne<{
        total_points: number
        tier: string
        star_rating: number
        total_reviews: number
        profile_completion_percent: number
        verified_trader: boolean
        badges: string
        achievements: string
        points_history: string
      }>(
        "SELECT * FROM user_gamification WHERE user_id = ?",
        [userId]
      )

      // Create record if doesn't exist
      if (!gamificationRecord) {
        const id = generateId()
        await execute(
          `INSERT INTO user_gamification (id, user_id) VALUES (?, ?)`,
          [id, userId]
        )
        gamificationRecord = {
          total_points: 0,
          tier: "bronze",
          star_rating: 0,
          total_reviews: 0,
          profile_completion_percent: 0,
          verified_trader: false,
          badges: "[]",
          achievements: "[]",
          points_history: "[]",
        }
      }

      // Get user's earned badges
      const earnedBadges = await query<{
        id: string
        name: string
        slug: string
        description: string
        icon: string
        color: string
      }>(
        `SELECT b.* FROM badges b 
         WHERE b.id IN (SELECT JSON_UNQUOTE(JSON_EXTRACT(badges, CONCAT('$[', idx, ']')))
                        FROM user_gamification, 
                             JSON_TABLE(badges, '$[*]' COLUMNS(idx FOR ORDINALITY)) jt
                        WHERE user_id = ?)
         OR (b.tier_required IS NOT NULL AND b.tier_required <= ?)`,
        [userId, gamificationRecord.tier]
      )

      // Get user's earned achievements
      const userAchievements = await query<{
        id: string
        name: string
        slug: string
        description: string
        icon: string
        color: string
        points_reward: number
        earned_at: string
      }>(
        `SELECT a.*, ua.earned_at 
         FROM achievements a
         JOIN user_achievements ua ON a.id = ua.achievement_id
         WHERE ua.user_id = ?
         ORDER BY ua.earned_at DESC`,
        [userId]
      )

      // Get recent point transactions
      const recentTransactions = await query<{
        id: string
        points: number
        action_type: string
        description: string
        created_at: string
      }>(
        `SELECT * FROM point_transactions 
         WHERE user_id = ? 
         ORDER BY created_at DESC 
         LIMIT 10`,
        [userId]
      )

      const tier = calculateTier(gamificationRecord.total_points)
      const nextTierProgress = getNextTierProgress(gamificationRecord.total_points, tier)

      const response: GamificationData = {
        totalPoints: gamificationRecord.total_points,
        tier,
        starRating: Number(gamificationRecord.star_rating) || 0,
        totalReviews: gamificationRecord.total_reviews,
        profileCompletion: gamificationRecord.profile_completion_percent,
        verifiedTrader: Boolean(gamificationRecord.verified_trader),
        badges: earnedBadges.map(b => ({
          id: b.id,
          name: b.name,
          slug: b.slug,
          description: b.description || "",
          icon: b.icon,
          color: b.color,
        })),
        achievements: userAchievements.map(a => ({
          id: a.id,
          name: a.name,
          slug: a.slug,
          description: a.description || "",
          icon: a.icon,
          color: a.color,
          pointsReward: a.points_reward,
          earnedAt: a.earned_at,
        })),
        recentActivity: recentTransactions.map(t => ({
          id: t.id,
          points: t.points,
          actionType: t.action_type,
          description: t.description || "",
          createdAt: t.created_at,
        })),
        nextTierProgress,
      }

      return NextResponse.json(response)
    } catch (dbError) {
      console.error("Database error fetching gamification:", dbError)
      
      // Return default data if database not available
      return NextResponse.json({
        totalPoints: 0,
        tier: "bronze",
        starRating: 0,
        totalReviews: 0,
        profileCompletion: 0,
        verifiedTrader: false,
        badges: [],
        achievements: [],
        recentActivity: [],
        nextTierProgress: {
          currentTier: "bronze",
          nextTier: "silver",
          pointsNeeded: 51,
          progress: 0,
        },
      })
    }
  } catch (error) {
    console.error("Error fetching gamification data:", error)
    return NextResponse.json({ error: "Failed to fetch gamification data" }, { status: 500 })
  }
}

// POST - Award points to user (internal use)
export async function POST(request: NextRequest) {
  try {
    const auth = await verifyAuth(request)

    if (!auth) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { userId, points, actionType, description } = body

    // Only admins can manually award points, or it's the user themselves for certain actions
    if (auth.role !== "admin" && auth.userId !== userId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    try {
      // Get current points
      const current = await queryOne<{ total_points: number }>(
        "SELECT total_points FROM user_gamification WHERE user_id = ?",
        [userId]
      )

      const currentPoints = current?.total_points || 0
      const newPoints = currentPoints + points
      const newTier = calculateTier(newPoints)

      // Update points
      await execute(
        `INSERT INTO user_gamification (id, user_id, total_points, tier)
         VALUES (?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE 
           total_points = total_points + ?,
           tier = ?`,
        [generateId(), userId, points, newTier, points, newTier]
      )

      // Record transaction
      await execute(
        `INSERT INTO point_transactions (id, user_id, points, action_type, description, balance_after)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [generateId(), userId, points, actionType, description, newPoints]
      )

      return NextResponse.json({
        success: true,
        newPoints,
        newTier,
      })
    } catch (dbError) {
      console.error("Database error awarding points:", dbError)
      return NextResponse.json({ error: "Failed to award points" }, { status: 500 })
    }
  } catch (error) {
    console.error("Error awarding points:", error)
    return NextResponse.json({ error: "Failed to award points" }, { status: 500 })
  }
}
