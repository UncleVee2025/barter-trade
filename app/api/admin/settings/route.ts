// Admin System Settings API
import { NextRequest, NextResponse } from "next/server"
import { query, execute } from "@/lib/db"
import { verifyAuth } from "@/lib/auth"

interface SystemSetting {
  id: string
  setting_key: string
  setting_value: string
  setting_type: "string" | "number" | "boolean" | "json"
  category: string
  description: string
  is_public: boolean
  updated_by: string | null
  updated_at: Date
}

// GET - Fetch all system settings
export async function GET(request: NextRequest) {
  try {
    const auth = await verifyAuth(request)
    if (!auth || auth.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const category = searchParams.get("category")

    let whereClause = ""
    const params: string[] = []

    if (category) {
      whereClause = "WHERE category = ?"
      params.push(category)
    }

    const settings = await query<SystemSetting>(`
      SELECT * FROM system_settings ${whereClause} ORDER BY category, setting_key
    `, params)

    // Group settings by category
    const groupedSettings = (settings || []).reduce((acc, setting) => {
      if (!acc[setting.category]) {
        acc[setting.category] = []
      }
      acc[setting.category].push(setting)
      return acc
    }, {} as Record<string, SystemSetting[]>)

    // Get default settings if table doesn't exist or is empty
    const defaultSettings = {
      general: [
        { setting_key: "site_name", setting_value: "Barter Trade Namibia", setting_type: "string", description: "Platform name" },
        { setting_key: "site_description", setting_value: "Namibia's Premier Trade & Barter Platform", setting_type: "string", description: "Platform description" },
        { setting_key: "maintenance_mode", setting_value: "false", setting_type: "boolean", description: "Enable maintenance mode" },
        { setting_key: "allow_registrations", setting_value: "true", setting_type: "boolean", description: "Allow new user registrations" },
      ],
      listings: [
        { setting_key: "max_images_per_listing", setting_value: "10", setting_type: "number", description: "Maximum images per listing" },
        { setting_key: "require_approval", setting_value: "false", setting_type: "boolean", description: "Require admin approval for listings" },
        { setting_key: "listing_expiry_days", setting_value: "90", setting_type: "number", description: "Days until listing expires" },
        { setting_key: "featured_listing_fee", setting_value: "50", setting_type: "number", description: "Fee for featuring a listing (NAD)" },
      ],
      wallet: [
        { setting_key: "min_topup_amount", setting_value: "10", setting_type: "number", description: "Minimum wallet top-up (NAD)" },
        { setting_key: "max_topup_amount", setting_value: "10000", setting_type: "number", description: "Maximum wallet top-up (NAD)" },
        { setting_key: "transfer_fee_percentage", setting_value: "0", setting_type: "number", description: "Transfer fee percentage" },
        { setting_key: "min_transfer_amount", setting_value: "5", setting_type: "number", description: "Minimum transfer amount (NAD)" },
      ],
      verification: [
        { setting_key: "require_id_for_trade", setting_value: "true", setting_type: "boolean", description: "Require ID verification for trading" },
        { setting_key: "require_id_for_withdraw", setting_value: "true", setting_type: "boolean", description: "Require ID verification for withdrawals" },
      ],
      notifications: [
        { setting_key: "email_notifications", setting_value: "true", setting_type: "boolean", description: "Enable email notifications" },
        { setting_key: "sms_notifications", setting_value: "false", setting_type: "boolean", description: "Enable SMS notifications" },
      ]
    }

    // Return grouped settings or defaults
    const finalSettings = Object.keys(groupedSettings).length > 0 ? groupedSettings : defaultSettings

    return NextResponse.json({ settings: finalSettings })
  } catch (error) {
    console.error("Settings fetch error:", error)
    // Return default settings on error
    return NextResponse.json({ 
      settings: {
        general: [
          { setting_key: "site_name", setting_value: "Barter Trade Namibia", setting_type: "string", description: "Platform name" },
          { setting_key: "maintenance_mode", setting_value: "false", setting_type: "boolean", description: "Enable maintenance mode" },
        ]
      } 
    })
  }
}

// PUT - Update system settings
export async function PUT(request: NextRequest) {
  try {
    const auth = await verifyAuth(request)
    if (!auth || auth.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { settings } = body

    if (!settings || !Array.isArray(settings)) {
      return NextResponse.json({ error: "Invalid settings data" }, { status: 400 })
    }

    // Update each setting
    for (const setting of settings) {
      const { setting_key, setting_value } = setting
      
      // Check if setting exists
      const [existing] = await query<{ id: string }>(`
        SELECT id FROM system_settings WHERE setting_key = ?
      `, [setting_key])

      if (existing) {
        await execute(`
          UPDATE system_settings 
          SET setting_value = ?, updated_by = ?, updated_at = NOW()
          WHERE setting_key = ?
        `, [setting_value, auth.userId, setting_key])
      } else {
        // Insert new setting
        await execute(`
          INSERT INTO system_settings (
            id, setting_key, setting_value, setting_type, category, 
            description, is_public, updated_by, created_at, updated_at
          ) VALUES (?, ?, ?, 'string', 'custom', ?, 0, ?, NOW(), NOW())
        `, [
          `setting_${Date.now()}`,
          setting_key,
          setting_value,
          `Custom setting: ${setting_key}`,
          auth.userId
        ])
      }
    }

    // Log the activity
    await execute(`
      INSERT INTO activity_log (
        id, admin_id, action_type, entity_type, description, created_at
      ) VALUES (?, ?, 'admin_action', 'settings', ?, NOW())
    `, [
      `act_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      auth.userId,
      `Updated ${settings.length} system setting(s)`
    ])

    return NextResponse.json({ success: true, message: "Settings updated successfully" })
  } catch (error) {
    console.error("Settings update error:", error)
    return NextResponse.json({ error: "Failed to update settings" }, { status: 500 })
  }
}
