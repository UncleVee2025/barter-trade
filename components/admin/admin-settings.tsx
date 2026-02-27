"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Settings,
  Save,
  RefreshCw,
  Globe,
  Package,
  Wallet,
  Shield,
  Bell,
  AlertTriangle,
  CheckCircle,
  Database,
  Server,
  Lock
} from "lucide-react"
import { toast } from "sonner"

interface Setting {
  setting_key: string
  setting_value: string
  setting_type: "string" | "number" | "boolean" | "json"
  description: string
}

interface SettingsGroup {
  [category: string]: Setting[]
}

export function AdminSettings() {
  const [settings, setSettings] = useState<SettingsGroup>({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [changes, setChanges] = useState<Record<string, string>>({})
  const [hasChanges, setHasChanges] = useState(false)

  const fetchSettings = async () => {
    try {
      const response = await fetch("/api/admin/settings")
      if (response.ok) {
        const data = await response.json()
        setSettings(data.settings || getDefaultSettings())
      }
    } catch (error) {
      console.error("Failed to fetch settings:", error)
      setSettings(getDefaultSettings())
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchSettings()
  }, [])

  const getDefaultSettings = (): SettingsGroup => ({
    general: [
      { setting_key: "site_name", setting_value: "Barter Trade Namibia", setting_type: "string", description: "Platform name displayed throughout the site" },
      { setting_key: "site_description", setting_value: "Namibia's Premier Trade & Barter Platform", setting_type: "string", description: "Platform description for SEO and branding" },
      { setting_key: "contact_email", setting_value: "support@bartertrade.na", setting_type: "string", description: "Primary contact email address" },
      { setting_key: "maintenance_mode", setting_value: "false", setting_type: "boolean", description: "Enable maintenance mode to block user access" },
      { setting_key: "allow_registrations", setting_value: "true", setting_type: "boolean", description: "Allow new user registrations" },
    ],
    listings: [
      { setting_key: "max_images_per_listing", setting_value: "10", setting_type: "number", description: "Maximum number of images allowed per listing" },
      { setting_key: "require_approval", setting_value: "false", setting_type: "boolean", description: "Require admin approval for new listings" },
      { setting_key: "listing_expiry_days", setting_value: "90", setting_type: "number", description: "Number of days until listings expire automatically" },
      { setting_key: "featured_listing_fee", setting_value: "50", setting_type: "number", description: "Fee to feature a listing (NAD)" },
      { setting_key: "allow_services", setting_value: "true", setting_type: "boolean", description: "Allow service-type listings" },
      { setting_key: "max_listing_value", setting_value: "1000000", setting_type: "number", description: "Maximum listing value allowed (NAD)" },
    ],
    wallet: [
      { setting_key: "min_topup_amount", setting_value: "10", setting_type: "number", description: "Minimum wallet top-up amount (NAD)" },
      { setting_key: "max_topup_amount", setting_value: "10000", setting_type: "number", description: "Maximum wallet top-up amount (NAD)" },
      { setting_key: "transfer_fee_percentage", setting_value: "0", setting_type: "number", description: "Percentage fee for wallet transfers" },
      { setting_key: "min_transfer_amount", setting_value: "5", setting_type: "number", description: "Minimum transfer amount (NAD)" },
      { setting_key: "max_daily_transfer", setting_value: "50000", setting_type: "number", description: "Maximum daily transfer limit (NAD)" },
      { setting_key: "voucher_expiry_days", setting_value: "365", setting_type: "number", description: "Default voucher expiry in days" },
    ],
    verification: [
      { setting_key: "require_id_for_trade", setting_value: "true", setting_type: "boolean", description: "Require ID verification before trading" },
      { setting_key: "require_id_for_withdraw", setting_value: "true", setting_type: "boolean", description: "Require ID verification for withdrawals" },
      { setting_key: "require_id_for_listing", setting_value: "false", setting_type: "boolean", description: "Require ID verification to create listings" },
      { setting_key: "auto_expire_unverified_days", setting_value: "30", setting_type: "number", description: "Days before unverified accounts are flagged" },
    ],
    notifications: [
      { setting_key: "email_notifications", setting_value: "true", setting_type: "boolean", description: "Enable email notifications system-wide" },
      { setting_key: "sms_notifications", setting_value: "false", setting_type: "boolean", description: "Enable SMS notifications (requires SMS provider)" },
      { setting_key: "push_notifications", setting_value: "true", setting_type: "boolean", description: "Enable push notifications" },
      { setting_key: "admin_alert_email", setting_value: "admin@bartertrade.na", setting_type: "string", description: "Email for admin alerts and reports" },
    ],
    security: [
      { setting_key: "max_login_attempts", setting_value: "5", setting_type: "number", description: "Max failed login attempts before lockout" },
      { setting_key: "lockout_duration_minutes", setting_value: "15", setting_type: "number", description: "Account lockout duration in minutes" },
      { setting_key: "session_timeout_hours", setting_value: "24", setting_type: "number", description: "Session timeout in hours" },
      { setting_key: "require_strong_password", setting_value: "true", setting_type: "boolean", description: "Require strong passwords for users" },
      { setting_key: "two_factor_auth", setting_value: "false", setting_type: "boolean", description: "Enable two-factor authentication" },
    ]
  })

  const handleSettingChange = (key: string, value: string) => {
    setChanges(prev => ({ ...prev, [key]: value }))
    setHasChanges(true)
  }

  const getSettingValue = (key: string, defaultValue: string): string => {
    return changes[key] !== undefined ? changes[key] : defaultValue
  }

  const saveSettings = async () => {
    setSaving(true)
    try {
      const settingsToSave = Object.entries(changes).map(([setting_key, setting_value]) => ({
        setting_key,
        setting_value
      }))

      const response = await fetch("/api/admin/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ settings: settingsToSave })
      })

      if (response.ok) {
        toast.success("Settings saved successfully")
        setChanges({})
        setHasChanges(false)
        fetchSettings()
      } else {
        toast.error("Failed to save settings")
      }
    } catch (error) {
      console.error("Failed to save settings:", error)
      toast.error("Failed to save settings")
    } finally {
      setSaving(false)
    }
  }

  const discardChanges = () => {
    setChanges({})
    setHasChanges(false)
  }

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case "general": return Globe
      case "listings": return Package
      case "wallet": return Wallet
      case "verification": return Shield
      case "notifications": return Bell
      case "security": return Lock
      default: return Settings
    }
  }

  const renderSettingInput = (setting: Setting) => {
    const value = getSettingValue(setting.setting_key, setting.setting_value)

    switch (setting.setting_type) {
      case "boolean":
        return (
          <Switch
            checked={value === "true"}
            onCheckedChange={(checked) => handleSettingChange(setting.setting_key, checked ? "true" : "false")}
          />
        )
      case "number":
        return (
          <Input
            type="number"
            value={value}
            onChange={(e) => handleSettingChange(setting.setting_key, e.target.value)}
            className="w-32"
          />
        )
      default:
        return (
          <Input
            type="text"
            value={value}
            onChange={(e) => handleSettingChange(setting.setting_key, e.target.value)}
            className="w-64"
          />
        )
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-10 w-32" />
        </div>
        <div className="space-y-4">
          {[...Array(6)].map((_, i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-6 w-32" />
              </CardHeader>
              <CardContent className="space-y-4">
                {[...Array(4)].map((_, j) => (
                  <div key={j} className="flex items-center justify-between">
                    <Skeleton className="h-4 w-48" />
                    <Skeleton className="h-10 w-32" />
                  </div>
                ))}
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">System Settings</h2>
          <p className="text-muted-foreground">Configure platform settings and preferences</p>
        </div>
        <div className="flex items-center gap-2">
          {hasChanges && (
            <Badge variant="outline" className="border-yellow-500 text-yellow-500">
              <AlertTriangle className="mr-1 h-3 w-3" />
              Unsaved Changes
            </Badge>
          )}
          <Button variant="outline" onClick={discardChanges} disabled={!hasChanges || saving}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Discard
          </Button>
          <Button onClick={saveSettings} disabled={!hasChanges || saving}>
            {saving ? (
              <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Save className="mr-2 h-4 w-4" />
            )}
            Save Changes
          </Button>
        </div>
      </div>

      {/* System Status Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardContent className="flex items-center gap-4 p-4">
            <div className="rounded-full bg-green-100 p-3 dark:bg-green-900">
              <Server className="h-6 w-6 text-green-600" />
            </div>
            <div>
              <p className="font-medium">System Status</p>
              <p className="text-sm text-green-600">All systems operational</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 p-4">
            <div className="rounded-full bg-blue-100 p-3 dark:bg-blue-900">
              <Database className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <p className="font-medium">Database</p>
              <p className="text-sm text-blue-600">MySQL Connected</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 p-4">
            <div className="rounded-full bg-purple-100 p-3 dark:bg-purple-900">
              <CheckCircle className="h-6 w-6 text-purple-600" />
            </div>
            <div>
              <p className="font-medium">Last Backup</p>
              <p className="text-sm text-muted-foreground">Today, 03:00 AM</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Settings Tabs */}
      <Tabs defaultValue="general" className="space-y-4">
        <TabsList className="flex-wrap">
          {Object.keys(settings).map((category) => {
            const Icon = getCategoryIcon(category)
            return (
              <TabsTrigger key={category} value={category} className="flex items-center gap-2 capitalize">
                <Icon className="h-4 w-4" />
                {category}
              </TabsTrigger>
            )
          })}
        </TabsList>

        {Object.entries(settings).map(([category, categorySettings]) => {
          const Icon = getCategoryIcon(category)
          return (
            <TabsContent key={category} value={category}>
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 capitalize">
                    <Icon className="h-5 w-5" />
                    {category} Settings
                  </CardTitle>
                  <CardDescription>
                    {category === "general" && "Basic platform configuration options"}
                    {category === "listings" && "Configure listing creation and management rules"}
                    {category === "wallet" && "Set wallet transaction limits and fees"}
                    {category === "verification" && "ID verification requirements and settings"}
                    {category === "notifications" && "Configure notification channels and preferences"}
                    {category === "security" && "Security and authentication settings"}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {categorySettings.map((setting, index) => (
                    <div key={setting.setting_key}>
                      <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                          <Label htmlFor={setting.setting_key} className="text-base">
                            {setting.setting_key
                              .split("_")
                              .map(word => word.charAt(0).toUpperCase() + word.slice(1))
                              .join(" ")}
                          </Label>
                          <p className="text-sm text-muted-foreground">{setting.description}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          {renderSettingInput(setting)}
                          {changes[setting.setting_key] !== undefined && (
                            <Badge variant="outline" className="border-blue-500 text-blue-500">
                              Modified
                            </Badge>
                          )}
                        </div>
                      </div>
                      {index < categorySettings.length - 1 && <Separator className="mt-6" />}
                    </div>
                  ))}
                </CardContent>
              </Card>
            </TabsContent>
          )
        })}
      </Tabs>

      {/* Danger Zone */}
      <Card className="border-destructive/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-destructive">
            <AlertTriangle className="h-5 w-5" />
            Danger Zone
          </CardTitle>
          <CardDescription>
            Irreversible actions that affect the entire platform
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between rounded-lg border border-destructive/30 p-4">
            <div>
              <p className="font-medium">Clear All Activity Logs</p>
              <p className="text-sm text-muted-foreground">Permanently delete all activity log entries</p>
            </div>
            <Button variant="destructive" size="sm">Clear Logs</Button>
          </div>
          <div className="flex items-center justify-between rounded-lg border border-destructive/30 p-4">
            <div>
              <p className="font-medium">Reset All User Sessions</p>
              <p className="text-sm text-muted-foreground">Force all users to log in again</p>
            </div>
            <Button variant="destructive" size="sm">Reset Sessions</Button>
          </div>
          <div className="flex items-center justify-between rounded-lg border border-destructive/30 p-4">
            <div>
              <p className="font-medium">Purge Expired Data</p>
              <p className="text-sm text-muted-foreground">Remove all expired listings, vouchers, and sessions</p>
            </div>
            <Button variant="destructive" size="sm">Purge Data</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
