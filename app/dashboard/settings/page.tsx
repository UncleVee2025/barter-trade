"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import useSWR from "swr"
import { 
  Bell, 
  Moon, 
  Sun, 
  Lock, 
  Eye, 
  EyeOff, 
  Smartphone, 
  Globe, 
  Shield,
  Trash2,
  Save,
  Loader2,
  ChevronRight,
  AlertTriangle
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog"
import { DashboardLayout } from "@/components/dashboard/dashboard-layout"
import { useAuth } from "@/contexts/auth-context"
import { toast } from "@/hooks/use-toast"
import { cn } from "@/lib/utils"
import { useTheme } from "next-themes"

const fetcher = (url: string) => fetch(url).then(res => res.json())

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

export default function SettingsPage() {
  const { user, logout } = useAuth()
  const { theme, setTheme } = useTheme()
  const [isSaving, setIsSaving] = useState(false)
  const [isChangingPassword, setIsChangingPassword] = useState(false)
  const [isDeletingAccount, setIsDeletingAccount] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)
  
  // Fetch user settings from API
  const { data: settingsData, mutate: mutateSettings } = useSWR<{ settings: UserSettings }>(
    "/api/user/settings",
    fetcher
  )
  
  // Notification settings
  const [notifications, setNotifications] = useState({
    email: true,
    push: true,
    newOffers: true,
    messages: true,
    priceDrops: false,
    weeklyDigest: true,
  })

  // Privacy settings
  const [privacy, setPrivacy] = useState({
    showOnlineStatus: true,
    showLocation: true,
    allowMessages: true,
  })
  
  const [language, setLanguage] = useState("en")

  // Update local state when settings are fetched
  useEffect(() => {
    if (settingsData?.settings) {
      setNotifications(settingsData.settings.notifications)
      setPrivacy(settingsData.settings.privacy)
      setLanguage(settingsData.settings.language || "en")
    }
  }, [settingsData])

  // Password change
  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  })

  const handleNotificationChange = (key: string, value: boolean) => {
    setNotifications((prev) => ({ ...prev, [key]: value }))
    setHasUnsavedChanges(true)
  }

  const handlePrivacyChange = (key: string, value: boolean) => {
    setPrivacy((prev) => ({ ...prev, [key]: value }))
    setHasUnsavedChanges(true)
  }

  const handleSaveSettings = async () => {
    setIsSaving(true)
    
    try {
      const response = await fetch("/api/user/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          notifications,
          privacy,
          language,
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || "Failed to save settings")
      }

      await mutateSettings()
      setHasUnsavedChanges(false)
      toast({ title: "Settings saved successfully" })
    } catch (error) {
      toast({ 
        title: error instanceof Error ? error.message : "Failed to save settings", 
        variant: "destructive" 
      })
    } finally {
      setIsSaving(false)
    }
  }

  const handlePasswordChange = async () => {
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast({ title: "Passwords do not match", variant: "destructive" })
      return
    }

    if (passwordData.newPassword.length < 8) {
      toast({ title: "Password must be at least 8 characters", variant: "destructive" })
      return
    }

    setIsChangingPassword(true)
    
    try {
      const response = await fetch("/api/user/password", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          currentPassword: passwordData.currentPassword,
          newPassword: passwordData.newPassword,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to change password")
      }

      toast({ title: "Password changed successfully" })
      setPasswordData({ currentPassword: "", newPassword: "", confirmPassword: "" })
    } catch (error) {
      toast({ 
        title: error instanceof Error ? error.message : "Failed to change password", 
        variant: "destructive" 
      })
    } finally {
      setIsChangingPassword(false)
    }
  }

  const handleDeleteAccount = async () => {
    setIsDeletingAccount(true)
    
    try {
      const response = await fetch("/api/user/delete", {
        method: "DELETE",
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || "Failed to delete account")
      }

      await logout()
      window.location.href = "/"
    } catch (error) {
      toast({ 
        title: error instanceof Error ? error.message : "Failed to delete account", 
        variant: "destructive" 
      })
      setIsDeletingAccount(false)
    }
  }

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Settings</h1>
            <p className="text-muted-foreground">Manage your account preferences</p>
          </div>
          <Button onClick={handleSaveSettings} disabled={isSaving} className="rounded-xl">
            {isSaving ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Save className="h-4 w-4 mr-2" />
            )}
            Save Changes
          </Button>
        </div>

        {/* Appearance */}
        <Card className="rounded-2xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sun className="h-5 w-5" />
              Appearance
            </CardTitle>
            <CardDescription>Customize how the app looks</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-foreground">Theme</Label>
                <p className="text-sm text-muted-foreground">Select your preferred theme</p>
              </div>
              <Select value={theme} onValueChange={setTheme}>
                <SelectTrigger className="w-40 rounded-xl">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="light">
                    <div className="flex items-center gap-2">
                      <Sun className="h-4 w-4" />
                      Light
                    </div>
                  </SelectItem>
                  <SelectItem value="dark">
                    <div className="flex items-center gap-2">
                      <Moon className="h-4 w-4" />
                      Dark
                    </div>
                  </SelectItem>
                  <SelectItem value="system">
                    <div className="flex items-center gap-2">
                      <Smartphone className="h-4 w-4" />
                      System
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Separator />

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-foreground">Language</Label>
                <p className="text-sm text-muted-foreground">Choose your preferred language</p>
              </div>
              <Select defaultValue="en">
                <SelectTrigger className="w-40 rounded-xl">
                  <Globe className="h-4 w-4 mr-2" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="en">English</SelectItem>
                  <SelectItem value="af">Afrikaans</SelectItem>
                  <SelectItem value="de">German</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Notifications */}
        <Card className="rounded-2xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5" />
              Notifications
            </CardTitle>
            <CardDescription>Configure how you receive notifications</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-foreground">Email Notifications</Label>
                <p className="text-sm text-muted-foreground">Receive updates via email</p>
              </div>
              <Switch
                checked={notifications.email}
                onCheckedChange={(value) => handleNotificationChange("email", value)}
              />
            </div>

            <Separator />

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-foreground">Push Notifications</Label>
                <p className="text-sm text-muted-foreground">Receive push notifications</p>
              </div>
              <Switch
                checked={notifications.push}
                onCheckedChange={(value) => handleNotificationChange("push", value)}
              />
            </div>

            <Separator />

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-foreground">New Offers</Label>
                <p className="text-sm text-muted-foreground">Get notified when you receive offers</p>
              </div>
              <Switch
                checked={notifications.newOffers}
                onCheckedChange={(value) => handleNotificationChange("newOffers", value)}
              />
            </div>

            <Separator />

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-foreground">Messages</Label>
                <p className="text-sm text-muted-foreground">Get notified for new messages</p>
              </div>
              <Switch
                checked={notifications.messages}
                onCheckedChange={(value) => handleNotificationChange("messages", value)}
              />
            </div>

            <Separator />

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-foreground">Price Drops</Label>
                <p className="text-sm text-muted-foreground">Notify when saved items drop in price</p>
              </div>
              <Switch
                checked={notifications.priceDrops}
                onCheckedChange={(value) => handleNotificationChange("priceDrops", value)}
              />
            </div>

            <Separator />

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-foreground">Weekly Digest</Label>
                <p className="text-sm text-muted-foreground">Receive a weekly summary of activity</p>
              </div>
              <Switch
                checked={notifications.weeklyDigest}
                onCheckedChange={(value) => handleNotificationChange("weeklyDigest", value)}
              />
            </div>
          </CardContent>
        </Card>

        {/* Privacy */}
        <Card className="rounded-2xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Privacy
            </CardTitle>
            <CardDescription>Manage your privacy settings</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-foreground">Show Online Status</Label>
                <p className="text-sm text-muted-foreground">Let others see when you are online</p>
              </div>
              <Switch
                checked={privacy.showOnlineStatus}
                onCheckedChange={(value) => handlePrivacyChange("showOnlineStatus", value)}
              />
            </div>

            <Separator />

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-foreground">Show Location</Label>
                <p className="text-sm text-muted-foreground">Display your region on listings</p>
              </div>
              <Switch
                checked={privacy.showLocation}
                onCheckedChange={(value) => handlePrivacyChange("showLocation", value)}
              />
            </div>

            <Separator />

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-foreground">Allow Messages</Label>
                <p className="text-sm text-muted-foreground">Allow others to send you messages</p>
              </div>
              <Switch
                checked={privacy.allowMessages}
                onCheckedChange={(value) => handlePrivacyChange("allowMessages", value)}
              />
            </div>
          </CardContent>
        </Card>

        {/* Security */}
        <Card className="rounded-2xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Lock className="h-5 w-5" />
              Security
            </CardTitle>
            <CardDescription>Update your password and security settings</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="currentPassword">Current Password</Label>
                <div className="relative">
                  <Input
                    id="currentPassword"
                    type={showPassword ? "text" : "password"}
                    value={passwordData.currentPassword}
                    onChange={(e) => setPasswordData((prev) => ({ ...prev, currentPassword: e.target.value }))}
                    className="h-11 rounded-xl pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="newPassword">New Password</Label>
                <Input
                  id="newPassword"
                  type={showPassword ? "text" : "password"}
                  value={passwordData.newPassword}
                  onChange={(e) => setPasswordData((prev) => ({ ...prev, newPassword: e.target.value }))}
                  className="h-11 rounded-xl"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm New Password</Label>
                <Input
                  id="confirmPassword"
                  type={showPassword ? "text" : "password"}
                  value={passwordData.confirmPassword}
                  onChange={(e) => setPasswordData((prev) => ({ ...prev, confirmPassword: e.target.value }))}
                  className="h-11 rounded-xl"
                />
              </div>

              <Button 
                onClick={handlePasswordChange} 
                disabled={!passwordData.currentPassword || !passwordData.newPassword || isSaving}
                className="rounded-xl"
              >
                {isSaving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
                Change Password
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Danger Zone */}
        <Card className="rounded-2xl border-destructive/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="h-5 w-5" />
              Danger Zone
            </CardTitle>
            <CardDescription>Irreversible actions</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between p-4 rounded-xl bg-destructive/5 border border-destructive/20">
              <div className="space-y-0.5">
                <p className="font-medium text-foreground">Delete Account</p>
                <p className="text-sm text-muted-foreground">
                  Permanently delete your account and all data
                </p>
              </div>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive" className="rounded-xl">
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This action cannot be undone. This will permanently delete your account
                      and remove all your data from our servers, including all listings,
                      messages, and transaction history.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={handleDeleteAccount}
                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    >
                      Delete Account
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}
