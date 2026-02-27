import { type NextRequest, NextResponse } from "next/server"
import { verifyAuth } from "@/lib/auth"
import { queryOne, execute } from "@/lib/db"

interface UserSettings {
  notifications: {
    email: boolean
    push: boolean
    newOffers: boolean
    messages: boolean
    priceDrops: boolean
    weeklyDigest: boolean
  }
  privacy: {
    showOnlineStatus: boolean
    showLocation: boolean
    allowMessages: boolean
  }
  language: string
}

const defaultSettings: UserSettings = {
  notifications: {
    email: true,
    push: true,
    newOffers: true,
    messages: true,
    priceDrops: false,
    weeklyDigest: true,
  },
  privacy: {
    showOnlineStatus: true,
    showLocation: true,
    allowMessages: true,
  },
  language: "en",
}

// GET - Fetch user settings
export async function GET(request: NextRequest) {
  try {
    const auth = await verifyAuth(request)

    if (!auth) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const userId = auth.userId

    // Try to fetch settings from database
    try {
      const settingsRow = await queryOne<{
        notification_email: boolean
        notification_push: boolean
        notification_new_offers: boolean
        notification_messages: boolean
        notification_price_drops: boolean
        notification_weekly_digest: boolean
        privacy_show_online_status: boolean
        privacy_show_location: boolean
        privacy_allow_messages: boolean
        language: string
      }>(
        "SELECT * FROM user_settings WHERE user_id = ?",
        [userId]
      )

      if (settingsRow) {
        const settings: UserSettings = {
          notifications: {
            email: Boolean(settingsRow.notification_email),
            push: Boolean(settingsRow.notification_push),
            newOffers: Boolean(settingsRow.notification_new_offers),
            messages: Boolean(settingsRow.notification_messages),
            priceDrops: Boolean(settingsRow.notification_price_drops),
            weeklyDigest: Boolean(settingsRow.notification_weekly_digest),
          },
          privacy: {
            showOnlineStatus: Boolean(settingsRow.privacy_show_online_status),
            showLocation: Boolean(settingsRow.privacy_show_location),
            allowMessages: Boolean(settingsRow.privacy_allow_messages),
          },
          language: settingsRow.language || "en",
        }

        return NextResponse.json({ settings })
      }

      // Return default settings if no record exists
      return NextResponse.json({ settings: defaultSettings })
    } catch (dbError) {
      console.error("Database error fetching settings:", dbError)
      // Return default settings on error
      return NextResponse.json({ settings: defaultSettings })
    }
  } catch (error) {
    console.error("Error fetching user settings:", error)
    return NextResponse.json({ error: "Failed to fetch settings" }, { status: 500 })
  }
}

// PUT - Update user settings
export async function PUT(request: NextRequest) {
  try {
    const auth = await verifyAuth(request)

    if (!auth) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const userId = auth.userId
    const body = await request.json()
    const { notifications, privacy, language } = body

    // Validate input
    if (!notifications || !privacy) {
      return NextResponse.json({ error: "Invalid settings data" }, { status: 400 })
    }

    try {
      // Check if settings exist
      const existing = await queryOne<{ user_id: string }>(
        "SELECT user_id FROM user_settings WHERE user_id = ?",
        [userId]
      )

      if (existing) {
        // Update existing settings
        await execute(
          `UPDATE user_settings SET
            notification_email = ?,
            notification_push = ?,
            notification_new_offers = ?,
            notification_messages = ?,
            notification_price_drops = ?,
            notification_weekly_digest = ?,
            privacy_show_online_status = ?,
            privacy_show_location = ?,
            privacy_allow_messages = ?,
            language = ?,
            updated_at = NOW()
          WHERE user_id = ?`,
          [
            notifications.email ? 1 : 0,
            notifications.push ? 1 : 0,
            notifications.newOffers ? 1 : 0,
            notifications.messages ? 1 : 0,
            notifications.priceDrops ? 1 : 0,
            notifications.weeklyDigest ? 1 : 0,
            privacy.showOnlineStatus ? 1 : 0,
            privacy.showLocation ? 1 : 0,
            privacy.allowMessages ? 1 : 0,
            language || "en",
            userId,
          ]
        )
      } else {
        // Insert new settings
        await execute(
          `INSERT INTO user_settings (
            user_id,
            notification_email,
            notification_push,
            notification_new_offers,
            notification_messages,
            notification_price_drops,
            notification_weekly_digest,
            privacy_show_online_status,
            privacy_show_location,
            privacy_allow_messages,
            language
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            userId,
            notifications.email ? 1 : 0,
            notifications.push ? 1 : 0,
            notifications.newOffers ? 1 : 0,
            notifications.messages ? 1 : 0,
            notifications.priceDrops ? 1 : 0,
            notifications.weeklyDigest ? 1 : 0,
            privacy.showOnlineStatus ? 1 : 0,
            privacy.showLocation ? 1 : 0,
            privacy.allowMessages ? 1 : 0,
            language || "en",
          ]
        )
      }

      return NextResponse.json({ 
        success: true, 
        message: "Settings updated successfully" 
      })
    } catch (dbError) {
      console.error("Database error saving settings:", dbError)
      return NextResponse.json({ error: "Failed to save settings" }, { status: 500 })
    }
  } catch (error) {
    console.error("Error updating user settings:", error)
    return NextResponse.json({ error: "Failed to update settings" }, { status: 500 })
  }
}
