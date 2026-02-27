"use client"

import React from "react"

import { useState, useRef, useEffect } from "react"
import { motion } from "framer-motion"
import useSWR from "swr"
import { 
  User, 
  Mail, 
  Phone, 
  MapPin, 
  Camera, 
  Save, 
  Shield, 
  Star, 
  Package, 
  HandshakeIcon,
  Calendar,
  Loader2,
  CheckCircle,
  AlertCircle,
  Upload,
  Eye
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { DashboardLayout } from "@/components/dashboard/dashboard-layout"
import { useAuth } from "@/contexts/auth-context"
import { toast } from "@/hooks/use-toast"
import { cn } from "@/lib/utils"

const fetcher = (url: string) => fetch(url).then(res => res.json())

const namibiaRegions = [
  "Erongo",
  "Hardap",
  "Karas",
  "Kavango East",
  "Kavango West",
  "Khomas",
  "Kunene",
  "Ohangwena",
  "Omaheke",
  "Omusati",
  "Oshana",
  "Oshikoto",
  "Otjozondjupa",
  "Zambezi",
]

interface UserStats {
  activeListings: number
  successfulTrades: number
  totalViews: number
  successRate: number
  pendingOffers: number
  memberSince: string
}

export default function ProfilePage() {
  const { user, updateProfile, refreshUser } = useAuth()
  const [isEditing, setIsEditing] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false)
  const [isVerifyingEmail, setIsVerifyingEmail] = useState(false)
  const [isVerifyingPhone, setIsVerifyingPhone] = useState(false)
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  
  // Verification states
  const [showEmailVerifyModal, setShowEmailVerifyModal] = useState(false)
  const [showPhoneVerifyModal, setShowPhoneVerifyModal] = useState(false)
  const [emailOtp, setEmailOtp] = useState("")
  const [phoneOtp, setPhoneOtp] = useState("")
  const [phoneNumber, setPhoneNumber] = useState("")
  const [verificationStep, setVerificationStep] = useState<"request" | "verify">("request")
  const [isSubmittingVerification, setIsSubmittingVerification] = useState(false)
  
  // Fetch real stats from API
  const { data: statsData, isLoading: statsLoading } = useSWR<{ stats: UserStats }>(
    "/api/user/stats",
    fetcher,
    { refreshInterval: 60000 }
  )
  
  const stats = statsData?.stats || {
    activeListings: 0,
    successfulTrades: 0,
    totalViews: 0,
    successRate: 0,
    pendingOffers: 0,
    memberSince: user?.createdAt ? new Date(user.createdAt).toLocaleDateString("en-US", { month: "long", year: "numeric" }) : "Recently",
  }
  
  const [formData, setFormData] = useState({
    name: user?.name || "",
    email: user?.email || "",
    phone: user?.phone || "",
    region: user?.region || "",
    bio: "",
  })
  
  // Update form data when user changes
  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || "",
        email: user.email || "",
        phone: user.phone || "",
        region: user.region || "",
        bio: "",
      })
    }
  }, [user])

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const handleAvatarSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file type
    if (!file.type.startsWith("image/")) {
      toast({ title: "Please select an image file", variant: "destructive" })
      return
    }

    // Validate file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      toast({ title: "Image must be less than 5MB", variant: "destructive" })
      return
    }

    // Show preview
    const reader = new FileReader()
    reader.onloadend = () => {
      setAvatarPreview(reader.result as string)
    }
    reader.readAsDataURL(file)

    // Upload the file
    handleAvatarUpload(file)
  }

  const handleAvatarUpload = async (file: File) => {
    setIsUploadingAvatar(true)
    
    try {
      const formData = new FormData()
      formData.append("file", file)
      formData.append("type", "avatar")

      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || "Failed to upload avatar")
      }

      const { url } = await response.json()
      
      // Update local state and refresh user data
      updateProfile({ avatar: url })
      await refreshUser()
      
      toast({ title: "Profile picture updated successfully" })
    } catch (error) {
      toast({ 
        title: error instanceof Error ? error.message : "Failed to upload avatar", 
        variant: "destructive" 
      })
      setAvatarPreview(null)
    } finally {
      setIsUploadingAvatar(false)
    }
  }

  const handleSave = async () => {
    setIsSaving(true)
    
    try {
      const response = await fetch("/api/user/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      })

      if (!response.ok) {
        throw new Error("Failed to update profile")
      }

      toast({ title: "Profile updated successfully" })
      setIsEditing(false)
    } catch {
      toast({ title: "Failed to update profile", variant: "destructive" })
    } finally {
      setIsSaving(false)
    }
  }

  // Email verification handlers
  const handleRequestEmailVerification = async () => {
    setIsSubmittingVerification(true)
    try {
      const response = await fetch("/api/user/verify-email", { method: "POST" })
      const data = await response.json()
      
      if (!response.ok) throw new Error(data.error || "Failed to send code")
      
      toast({ title: "Verification code sent to your email" })
      setVerificationStep("verify")
    } catch (error) {
      toast({ 
        title: error instanceof Error ? error.message : "Failed to send code", 
        variant: "destructive" 
      })
    } finally {
      setIsSubmittingVerification(false)
    }
  }

  const handleVerifyEmail = async () => {
    if (emailOtp.length !== 6) {
      toast({ title: "Please enter a 6-digit code", variant: "destructive" })
      return
    }
    
    setIsSubmittingVerification(true)
    try {
      const response = await fetch("/api/user/verify-email", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: emailOtp }),
      })
      const data = await response.json()
      
      if (!response.ok) throw new Error(data.error || "Invalid code")
      
      toast({ title: "Email verified successfully!" })
      setShowEmailVerifyModal(false)
      setEmailOtp("")
      setVerificationStep("request")
      refreshUser()
    } catch (error) {
      toast({ 
        title: error instanceof Error ? error.message : "Verification failed", 
        variant: "destructive" 
      })
    } finally {
      setIsSubmittingVerification(false)
    }
  }

  // Phone verification handlers
  const handleRequestPhoneVerification = async () => {
    if (!phoneNumber || phoneNumber.length < 10) {
      toast({ title: "Please enter a valid phone number", variant: "destructive" })
      return
    }
    
    setIsSubmittingVerification(true)
    try {
      const formattedPhone = phoneNumber.startsWith("+264") ? phoneNumber : `+264${phoneNumber.replace(/^0/, "")}`
      const response = await fetch("/api/user/verify-phone", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: formattedPhone }),
      })
      const data = await response.json()
      
      if (!response.ok) throw new Error(data.error || "Failed to send code")
      
      toast({ title: "Verification code sent to your phone" })
      setVerificationStep("verify")
    } catch (error) {
      toast({ 
        title: error instanceof Error ? error.message : "Failed to send code", 
        variant: "destructive" 
      })
    } finally {
      setIsSubmittingVerification(false)
    }
  }

  const handleVerifyPhone = async () => {
    if (phoneOtp.length !== 6) {
      toast({ title: "Please enter a 6-digit code", variant: "destructive" })
      return
    }
    
    setIsSubmittingVerification(true)
    try {
      const response = await fetch("/api/user/verify-phone", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: phoneOtp }),
      })
      const data = await response.json()
      
      if (!response.ok) throw new Error(data.error || "Invalid code")
      
      toast({ title: "Phone verified successfully!" })
      setShowPhoneVerifyModal(false)
      setPhoneOtp("")
      setPhoneNumber("")
      setVerificationStep("request")
      refreshUser()
    } catch (error) {
      toast({ 
        title: error instanceof Error ? error.message : "Verification failed", 
        variant: "destructive" 
      })
    } finally {
      setIsSubmittingVerification(false)
    }
  }

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">My Profile</h1>
            <p className="text-muted-foreground">Manage your account information</p>
          </div>
          {!isEditing ? (
            <Button onClick={() => setIsEditing(true)} className="rounded-xl">
              Edit Profile
            </Button>
          ) : (
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                onClick={() => setIsEditing(false)}
                className="rounded-xl bg-transparent"
              >
                Cancel
              </Button>
              <Button onClick={handleSave} disabled={isSaving} className="rounded-xl">
                {isSaving ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Save className="h-4 w-4 mr-2" />
                )}
                Save Changes
              </Button>
            </div>
          )}
        </div>

        {/* Profile Card */}
        <Card className="rounded-2xl">
          <CardContent className="p-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
              {/* Avatar with Upload */}
              <div className="relative group">
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleAvatarSelect}
                  accept="image/jpeg,image/png,image/webp"
                  className="hidden"
                />
                <Avatar className="h-24 w-24 ring-4 ring-primary/20">
                  <AvatarImage src={avatarPreview || user?.avatar || "/placeholder.svg"} />
                  <AvatarFallback className="bg-gradient-to-br from-primary to-amber-500 text-white text-2xl">
                    {user?.name?.charAt(0) || "U"}
                  </AvatarFallback>
                </Avatar>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploadingAvatar}
                  className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer disabled:cursor-not-allowed"
                >
                  {isUploadingAvatar ? (
                    <Loader2 className="h-6 w-6 text-white animate-spin" />
                  ) : (
                    <Camera className="h-6 w-6 text-white" />
                  )}
                </button>
                {isUploadingAvatar && (
                  <div className="absolute -bottom-1 -right-1 bg-primary text-white rounded-full p-1.5">
                    <Loader2 className="h-3 w-3 animate-spin" />
                  </div>
                )}
              </div>

              {/* User Info */}
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h2 className="text-xl font-bold text-foreground">{user?.name || "User"}</h2>
                  {user?.isVerified && (
                    <Badge variant="secondary" className="bg-blue-500/10 text-blue-500">
                      <Shield className="h-3 w-3 mr-1" />
                      Verified
                    </Badge>
                  )}
                </div>
                <p className="text-muted-foreground">{user?.email}</p>
                {user?.region && (
                  <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                    <MapPin className="h-4 w-4" />
                    {user.region}
                  </p>
                )}
              </div>

              {/* Quick Stats */}
              <div className="grid grid-cols-2 gap-4 sm:flex sm:gap-6">
                <div className="text-center">
                  <p className="text-2xl font-bold text-foreground">{stats.activeListings}</p>
                  <p className="text-xs text-muted-foreground">Listings</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-foreground">{stats.successfulTrades}</p>
                  <p className="text-xs text-muted-foreground">Trades</p>
                </div>
                <div className="text-center">
                  <div className="flex items-center justify-center gap-1">
                    <Star className="h-5 w-5 text-yellow-500 fill-yellow-500" />
                    <span className="text-2xl font-bold text-foreground">{stats.successRate}</span>
                  </div>
                  <p className="text-xs text-muted-foreground">Rating</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Profile Form */}
        <Card className="rounded-2xl">
          <CardHeader>
            <CardTitle>Personal Information</CardTitle>
            <CardDescription>Update your personal details</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="name">Full Name</Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => handleChange("name", e.target.value)}
                    disabled={!isEditing}
                    className={cn(
                      "pl-10 h-11 rounded-xl",
                      !isEditing && "bg-muted border-0"
                    )}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleChange("email", e.target.value)}
                    disabled={!isEditing}
                    className={cn(
                      "pl-10 h-11 rounded-xl",
                      !isEditing && "bg-muted border-0"
                    )}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number</Label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="phone"
                    value={formData.phone}
                    onChange={(e) => handleChange("phone", e.target.value)}
                    disabled={!isEditing}
                    placeholder="+264 XX XXX XXXX"
                    className={cn(
                      "pl-10 h-11 rounded-xl",
                      !isEditing && "bg-muted border-0"
                    )}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="region">Region</Label>
                <Select 
                  value={formData.region} 
                  onValueChange={(value) => handleChange("region", value)}
                  disabled={!isEditing}
                >
                  <SelectTrigger className={cn(
                    "h-11 rounded-xl",
                    !isEditing && "bg-muted border-0"
                  )}>
                    <MapPin className="h-4 w-4 mr-2 text-muted-foreground" />
                    <SelectValue placeholder="Select region" />
                  </SelectTrigger>
                  <SelectContent>
                    {namibiaRegions.map((region) => (
                      <SelectItem key={region} value={region}>{region}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="bio">Bio</Label>
              <Textarea
                id="bio"
                value={formData.bio}
                onChange={(e) => handleChange("bio", e.target.value)}
                disabled={!isEditing}
                placeholder="Tell others about yourself..."
                className={cn(
                  "rounded-xl resize-none",
                  !isEditing && "bg-muted border-0"
                )}
                rows={3}
              />
            </div>
          </CardContent>
        </Card>

        {/* Account Stats */}
        <Card className="rounded-2xl">
          <CardHeader>
            <CardTitle>Account Statistics</CardTitle>
            <CardDescription>Your trading activity overview</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="p-4 rounded-xl bg-muted/50 text-center"
              >
                <Package className="h-8 w-8 mx-auto mb-2 text-primary" />
                <p className="text-2xl font-bold text-foreground">{stats.activeListings}</p>
                <p className="text-xs text-muted-foreground">Active Listings</p>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="p-4 rounded-xl bg-muted/50 text-center"
              >
                <HandshakeIcon className="h-8 w-8 mx-auto mb-2 text-emerald-500" />
                <p className="text-2xl font-bold text-foreground">{stats.successfulTrades}</p>
                <p className="text-xs text-muted-foreground">Completed Trades</p>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="p-4 rounded-xl bg-muted/50 text-center"
              >
                <Star className="h-8 w-8 mx-auto mb-2 text-yellow-500" />
                <p className="text-2xl font-bold text-foreground">{stats.successRate}</p>
                <p className="text-xs text-muted-foreground">Average Rating</p>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="p-4 rounded-xl bg-muted/50 text-center"
              >
                <Calendar className="h-8 w-8 mx-auto mb-2 text-blue-500" />
                <p className="text-sm font-bold text-foreground">{stats.memberSince}</p>
                <p className="text-xs text-muted-foreground">Member Since</p>
              </motion.div>
            </div>
          </CardContent>
        </Card>

        {/* Verification Status */}
        <Card className="rounded-2xl">
          <CardHeader>
            <CardTitle>Verification Status</CardTitle>
            <CardDescription>Build trust with other traders</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-4 rounded-xl bg-muted/50">
              <div className="flex items-center gap-3">
                <div className={cn(
                  "w-10 h-10 rounded-lg flex items-center justify-center",
                  user?.isVerified ? "bg-green-500/10" : "bg-yellow-500/10"
                )}>
                  {user?.isVerified ? (
                    <CheckCircle className="h-5 w-5 text-green-500" />
                  ) : (
                    <AlertCircle className="h-5 w-5 text-yellow-500" />
                  )}
                </div>
                <div>
                  <p className="font-medium text-foreground">Email Verification</p>
                  <p className="text-xs text-muted-foreground">
                    {user?.isVerified ? "Your email is verified" : "Verify your email for added security"}
                  </p>
                </div>
              </div>
              {!user?.isVerified && (
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="rounded-lg bg-transparent"
                  onClick={() => setShowEmailVerifyModal(true)}
                >
                  Verify
                </Button>
              )}
            </div>

            <div className="flex items-center justify-between p-4 rounded-xl bg-muted/50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
                  <Phone className="h-5 w-5 text-blue-500" />
                </div>
                <div>
                  <p className="font-medium text-foreground">Phone Verification</p>
                  <p className="text-xs text-muted-foreground">Add and verify your phone number</p>
                </div>
              </div>
              <Button 
                variant="outline" 
                size="sm" 
                className="rounded-lg bg-transparent"
                onClick={() => setShowPhoneVerifyModal(true)}
              >
                Add Phone
              </Button>
            </div>

            <div className="flex items-center justify-between p-4 rounded-xl bg-muted/50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-purple-500/10 flex items-center justify-center">
                  <Shield className="h-5 w-5 text-purple-500" />
                </div>
                <div>
                  <p className="font-medium text-foreground">ID Verification</p>
                  <p className="text-xs text-muted-foreground">Verify your identity for premium features</p>
                </div>
              </div>
              <Button variant="outline" size="sm" className="rounded-lg bg-transparent">
                Verify ID
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Email Verification Modal */}
        {showEmailVerifyModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
            <Card className="w-full max-w-md mx-4 rounded-2xl">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Mail className="h-5 w-5 text-primary" />
                  {verificationStep === "request" ? "Verify Email" : "Enter Code"}
                </CardTitle>
                <CardDescription>
                  {verificationStep === "request" 
                    ? "We'll send a verification code to your email" 
                    : "Enter the 6-digit code sent to your email"}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {verificationStep === "request" ? (
                  <>
                    <p className="text-sm text-muted-foreground">
                      A verification code will be sent to: <strong>{user?.email}</strong>
                    </p>
                    <div className="flex gap-2">
                      <Button 
                        variant="outline" 
                        className="flex-1 bg-transparent"
                        onClick={() => setShowEmailVerifyModal(false)}
                      >
                        Cancel
                      </Button>
                      <Button 
                        className="flex-1"
                        onClick={handleRequestEmailVerification}
                        disabled={isSubmittingVerification}
                      >
                        {isSubmittingVerification ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                        Send Code
                      </Button>
                    </div>
                  </>
                ) : (
                  <>
                    <Input
                      value={emailOtp}
                      onChange={(e) => setEmailOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
                      placeholder="000000"
                      className="h-14 text-center text-2xl tracking-[0.5em] font-mono"
                      maxLength={6}
                    />
                    <div className="flex gap-2">
                      <Button 
                        variant="outline" 
                        className="flex-1 bg-transparent"
                        onClick={() => {
                          setVerificationStep("request")
                          setEmailOtp("")
                        }}
                      >
                        Back
                      </Button>
                      <Button 
                        className="flex-1"
                        onClick={handleVerifyEmail}
                        disabled={isSubmittingVerification || emailOtp.length !== 6}
                      >
                        {isSubmittingVerification ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                        Verify
                      </Button>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {/* Phone Verification Modal */}
        {showPhoneVerifyModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
            <Card className="w-full max-w-md mx-4 rounded-2xl">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Phone className="h-5 w-5 text-blue-500" />
                  {verificationStep === "request" ? "Add Phone Number" : "Enter Code"}
                </CardTitle>
                <CardDescription>
                  {verificationStep === "request" 
                    ? "Enter your Namibian phone number" 
                    : "Enter the 6-digit code sent to your phone"}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {verificationStep === "request" ? (
                  <>
                    <div className="flex gap-2">
                      <div className="flex items-center px-3 bg-muted rounded-lg text-sm font-medium">
                        +264
                      </div>
                      <Input
                        value={phoneNumber}
                        onChange={(e) => setPhoneNumber(e.target.value.replace(/\D/g, "").slice(0, 9))}
                        placeholder="81 234 5678"
                        className="flex-1"
                      />
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Enter your number without the country code
                    </p>
                    <div className="flex gap-2">
                      <Button 
                        variant="outline" 
                        className="flex-1 bg-transparent"
                        onClick={() => {
                          setShowPhoneVerifyModal(false)
                          setPhoneNumber("")
                        }}
                      >
                        Cancel
                      </Button>
                      <Button 
                        className="flex-1"
                        onClick={handleRequestPhoneVerification}
                        disabled={isSubmittingVerification || phoneNumber.length < 7}
                      >
                        {isSubmittingVerification ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                        Send Code
                      </Button>
                    </div>
                  </>
                ) : (
                  <>
                    <Input
                      value={phoneOtp}
                      onChange={(e) => setPhoneOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
                      placeholder="000000"
                      className="h-14 text-center text-2xl tracking-[0.5em] font-mono"
                      maxLength={6}
                    />
                    <div className="flex gap-2">
                      <Button 
                        variant="outline" 
                        className="flex-1 bg-transparent"
                        onClick={() => {
                          setVerificationStep("request")
                          setPhoneOtp("")
                        }}
                      >
                        Back
                      </Button>
                      <Button 
                        className="flex-1"
                        onClick={handleVerifyPhone}
                        disabled={isSubmittingVerification || phoneOtp.length !== 6}
                      >
                        {isSubmittingVerification ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                        Verify
                      </Button>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}
