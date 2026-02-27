"use client"

import React from "react"
import { useState, useEffect } from "react"
import { AnimatePresence, motion } from "framer-motion"
import { useRouter } from "next/navigation"
import useSWR from "swr"
import { User, Camera, Award as IdCard, Heart, CheckCircle, ChevronRight, ChevronLeft, Upload, X, Sparkles, ArrowRight, Shield, AlertCircle, Loader2, TrendingUp, Users, Package, Zap, Clock, MapPin, Star, BadgeCheck, Handshake } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import { useAuth } from "@/contexts/auth-context"
import { useNotifications } from "@/contexts/notification-context"

const fetcher = (url: string) => fetch(url).then((res) => res.json())

const namibiaRegions = [
  "Erongo", "Hardap", "Karas", "Kavango East", "Kavango West", "Khomas",
  "Kunene", "Ohangwena", "Omaheke", "Omusati", "Oshana", "Oshikoto", "Otjozondjupa", "Zambezi",
]

const tradeCategories = [
  { id: "electronics", name: "Electronics", icon: "Smartphone", description: "Phones, laptops, gadgets" },
  { id: "vehicles", name: "Vehicles", icon: "Car", description: "Cars, bikes, parts" },
  { id: "fashion", name: "Fashion", icon: "Shirt", description: "Clothes, shoes, accessories" },
  { id: "home-garden", name: "Home & Garden", icon: "Home", description: "Furniture, decor, tools" },
  { id: "services", name: "Services", icon: "Wrench", description: "Skills, repairs, help" },
  { id: "sports", name: "Sports & Outdoors", icon: "Dumbbell", description: "Equipment, gear, fitness" },
  { id: "livestock", name: "Livestock & Farming", icon: "Beef", description: "Animals, farming equipment" },
  { id: "property", name: "Property", icon: "Building", description: "Houses, land, rentals" },
]

interface OnboardingData {
  onboarding: {
    personalDetailsConfirmed: boolean
    profilePictureUploaded: boolean
    idDocumentUploaded: boolean
    interestsSelected: boolean
    onboardingCompleted: boolean
    selectedInterests: string[]
  }
  user: {
    name: string
    email: string
    phone: string | null
    region: string
    town: string | null
    avatar: string | null
    id_verification_status: string
  } | null
  needsOnboarding: boolean
}

interface PlatformStats {
  totalUsers: number
  activeListings: number
  completedTrades: number
  totalVolume: number
  successRate: number
  onlineNow: number
  tradesToday: number
  newUsersToday: number
  source: "database" | "demo"
}

// Animated counter for stats
function AnimatedCounter({ value, duration = 2000 }: { value: number; duration?: number }) {
  const [count, setCount] = useState(0)
  
  useEffect(() => {
    let startTime: number
    let animationFrame: number
    
    const animate = (timestamp: number) => {
      if (!startTime) startTime = timestamp
      const progress = Math.min((timestamp - startTime) / duration, 1)
      setCount(Math.floor(progress * value))
      
      if (progress < 1) {
        animationFrame = requestAnimationFrame(animate)
      }
    }
    
    animationFrame = requestAnimationFrame(animate)
    return () => cancelAnimationFrame(animationFrame)
  }, [value, duration])
  
  return <>{count.toLocaleString()}</>
}

// Live activity indicator
function LiveIndicator() {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className="relative flex h-2 w-2">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
        <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500" />
      </span>
      <span className="text-green-500 text-xs font-medium">LIVE</span>
    </span>
  )
}

export function OnboardingScreen() {
  const [currentStep, setCurrentStep] = useState(0)
  const [isProcessing, setIsProcessing] = useState(false)
  const [personalDetails, setPersonalDetails] = useState({
    name: "",
    phone: "",
    region: "",
    town: "",
  })
  const [profileImage, setProfileImage] = useState<string | null>(null)
  const [idFront, setIdFront] = useState<string | null>(null)
  const [idBack, setIdBack] = useState<string | null>(null)
  const [selectedInterests, setSelectedInterests] = useState<string[]>([])
  const [showConfetti, setShowConfetti] = useState(false)

  const router = useRouter()
  const { user } = useAuth()
  const { showToast } = useNotifications()

  // Fetch onboarding state
  const { data, mutate } = useSWR<OnboardingData>("/api/user/onboarding", fetcher)
  
  // Fetch real-time platform stats
  const { data: statsData } = useSWR<PlatformStats>("/api/public/stats", fetcher, {
    refreshInterval: 30000, // Refresh every 30 seconds
  })

  // Initialize form with user data
  useEffect(() => {
    if (data?.user) {
      setPersonalDetails({
        name: data.user.name || "",
        phone: data.user.phone || "",
        region: data.user.region || "",
        town: data.user.town || "",
      })
      if (data.user.avatar) {
        setProfileImage(data.user.avatar)
      }
      if (data.onboarding.selectedInterests?.length) {
        setSelectedInterests(data.onboarding.selectedInterests)
      }
    }
  }, [data])

  // Redirect if onboarding is complete
  useEffect(() => {
    if (data?.onboarding?.onboardingCompleted) {
      router.push("/dashboard")
    }
  }, [data, router])

  const steps = [
    { id: "welcome", title: "Welcome", icon: Sparkles, description: "Let's get you started" },
    { id: "personal", title: "Confirm Details", icon: User, description: "Verify your information" },
    { id: "avatar", title: "Profile Picture", icon: Camera, description: "Add a photo" },
    { id: "id", title: "ID Verification", icon: IdCard, description: "Build trust (optional)" },
    { id: "interests", title: "Interests", icon: Heart, description: "What do you want to trade?" },
    { id: "complete", title: "All Done", icon: CheckCircle, description: "You're ready!" },
  ]

  const handleUpdateStep = async (step: string, stepData: Record<string, unknown> = {}) => {
    setIsProcessing(true)
    try {
      const response = await fetch("/api/user/onboarding", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ step, data: stepData }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to update")
      }

      await mutate()
      return true
    } catch (error) {
      console.error("[v0] Onboarding update error:", error)
      showToast({
        type: "error",
        title: "Error",
        message: error instanceof Error ? error.message : "Failed to save your progress. Please try again.",
        duration: 3000,
      })
      return false
    } finally {
      setIsProcessing(false)
    }
  }

  const handleNextStep = async () => {
    if (currentStep === 0) {
      // Welcome step - just move to next
      setCurrentStep((prev) => prev + 1)
    } else if (currentStep === 1) {
      // Personal details confirmation
      const success = await handleUpdateStep("personal_details", personalDetails)
      if (success) {
        showToast({
          type: "success",
          title: "Details Confirmed",
          message: "Your information has been saved",
          duration: 2000,
        })
        setCurrentStep((prev) => prev + 1)
      }
    } else if (currentStep === 2) {
      // Profile picture
      const success = await handleUpdateStep("profile_picture", { avatarUrl: profileImage })
      if (success) {
        showToast({
          type: "success",
          title: "Looking Good!",
          message: "Your profile picture has been uploaded",
          duration: 2000,
        })
        setCurrentStep((prev) => prev + 1)
      }
    } else if (currentStep === 3) {
      // ID documents
      if (idFront && idBack) {
        const success = await handleUpdateStep("id_document", { frontImage: idFront, backImage: idBack })
        if (success) {
          showToast({
            type: "success",
            title: "Documents Submitted",
            message: "Your ID is being reviewed. This usually takes 24-48 hours.",
            duration: 4000,
          })
          setCurrentStep((prev) => prev + 1)
        }
      } else {
        // Skip ID verification
        await handleUpdateStep("skip_id")
        setCurrentStep((prev) => prev + 1)
      }
    } else if (currentStep === 4) {
      // Interests
      const success = await handleUpdateStep("interests", { interests: selectedInterests })
      if (success) {
        showToast({
          type: "success",
          title: "Preferences Saved",
          message: "We'll show you relevant trades based on your interests",
          duration: 2000,
        })
        setCurrentStep((prev) => prev + 1)
      }
    } else if (currentStep === 5) {
      // Complete onboarding
      const success = await handleUpdateStep("complete")
      if (success) {
        setShowConfetti(true)
        setTimeout(() => {
          router.push("/dashboard")
        }, 3000)
      }
    }
  }

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, type: "profile" | "id-front" | "id-back") => {
    const file = e.target.files?.[0]
    if (!file) return

    // Show loading state
    setIsProcessing(true)

    try {
      // Map type to upload API type
      const uploadType = type === "profile" ? "avatar" : type === "id-front" ? "id_front" : "id_back"

      // Upload to server
      const formData = new FormData()
      formData.append("file", file)
      formData.append("type", uploadType)

      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Upload failed")
      }

      const data = await response.json()
      const uploadedUrl = data.url

      // Set the uploaded URL for the appropriate type
      if (type === "profile") {
        setProfileImage(uploadedUrl)
      } else if (type === "id-front") {
        setIdFront(uploadedUrl)
      } else if (type === "id-back") {
        setIdBack(uploadedUrl)
      }

      showToast({
        type: "success",
        title: "Image Uploaded",
        message: "Your image has been uploaded successfully",
        duration: 2000,
      })
    } catch (error) {
      console.error("[v0] Image upload error:", error)
      showToast({
        type: "error",
        title: "Upload Failed",
        message: error instanceof Error ? error.message : "Failed to upload image. Please try again.",
        duration: 3000,
      })
    } finally {
      setIsProcessing(false)
    }
  }

  const toggleInterest = (categoryId: string) => {
    setSelectedInterests((prev) =>
      prev.includes(categoryId) ? prev.filter((id) => id !== categoryId) : [...prev, categoryId]
    )
  }

  const progress = ((currentStep + 1) / steps.length) * 100

  // Platform stats for display
  const stats = statsData || {
    totalUsers: 0,
    activeListings: 0,
    completedTrades: 0,
    onlineNow: 0,
    tradesToday: 0,
    newUsersToday: 0,
    successRate: 98.5,
    source: "demo" as const,
  }

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      {/* Animated Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-background to-amber-500/5" />
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff05_1px,transparent_1px),linear-gradient(to_bottom,#ffffff05_1px,transparent_1px)] bg-[size:3rem_3rem]" />
      
      {/* Floating particles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(6)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-2 h-2 rounded-full bg-primary/20"
            style={{ left: `${15 + i * 15}%`, top: `${20 + (i % 3) * 25}%` }}
            animate={{
              y: [0, -20, 0],
              opacity: [0.3, 0.6, 0.3],
            }}
            transition={{
              duration: 3 + i * 0.5,
              repeat: Number.POSITIVE_INFINITY,
              delay: i * 0.3,
            }}
          />
        ))}
      </div>

      {/* Confetti Animation */}
      <AnimatePresence>
        {showConfetti && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 pointer-events-none z-50"
          >
            {[...Array(50)].map((_, i) => (
              <motion.div
                key={i}
                className="absolute w-3 h-3 rounded-full"
                style={{
                  left: `${Math.random() * 100}%`,
                  backgroundColor: ["#10B981", "#3B82F6", "#F59E0B", "#EF4444", "#8B5CF6"][Math.floor(Math.random() * 5)],
                }}
                initial={{ top: -20, opacity: 1, scale: 0 }}
                animate={{
                  top: "100%",
                  opacity: [1, 1, 0],
                  scale: [0, 1, 1],
                  rotate: Math.random() * 360,
                }}
                transition={{
                  duration: 2 + Math.random() * 2,
                  delay: Math.random() * 0.5,
                  ease: "easeOut",
                }}
              />
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <div className="relative z-10 p-4 sm:p-6">
        <div className="flex items-center justify-between max-w-3xl mx-auto">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-amber-500 flex items-center justify-center shadow-lg">
              <span className="text-primary-foreground font-bold text-lg">B</span>
            </div>
            <span className="text-foreground font-semibold hidden sm:block">Barter Trade Namibia</span>
          </div>
          
          {currentStep > 0 && currentStep < steps.length - 1 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push("/dashboard")}
              className="text-muted-foreground hover:text-foreground"
            >
              Skip for now
            </Button>
          )}
        </div>

        {/* Progress Bar */}
        <div className="max-w-3xl mx-auto mt-6">
          <div className="h-2 bg-muted rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-gradient-to-r from-primary to-amber-500 rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.5, ease: "easeOut" }}
            />
          </div>
          <p className="text-xs text-muted-foreground mt-2 text-center">
            Step {currentStep + 1} of {steps.length}
          </p>
        </div>
      </div>

      {/* Content */}
      <div className="relative z-10 px-4 pb-8 max-w-3xl mx-auto">
        <AnimatePresence mode="wait">
          {/* Step 0: Welcome - Dynamic & Engaging */}
          {currentStep === 0 && (
            <motion.div
              key="welcome"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.4 }}
              className="text-center py-8 sm:py-12"
            >
              {/* Logo with animation */}
              <motion.div
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
                className="w-24 h-24 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-primary to-amber-500 flex items-center justify-center shadow-2xl shadow-primary/30"
              >
                <Handshake className="w-12 h-12 text-primary-foreground" />
              </motion.div>

              <motion.h1
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="text-3xl sm:text-4xl font-bold text-foreground mb-3"
              >
                Welcome, {data?.user?.name?.split(" ")[0] || "Trader"}!
              </motion.h1>

              <motion.p
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="text-lg text-muted-foreground mb-6 max-w-md mx-auto"
              >
                You're joining a thriving community of Namibian traders. Let's set up your profile!
              </motion.p>

              {/* Live Stats Section */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="mb-8"
              >
                <div className="flex items-center justify-center gap-2 mb-4">
                  <LiveIndicator />
                  <span className="text-sm text-muted-foreground">Real-time platform activity</span>
                </div>
                
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 max-w-xl mx-auto">
                  <motion.div
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.6 }}
                    className="p-4 rounded-xl bg-card border border-border shadow-sm"
                  >
                    <div className="flex items-center justify-center gap-1.5 mb-1">
                      <Users className="w-4 h-4 text-primary" />
                    </div>
                    <p className="text-2xl font-bold text-primary">
                      <AnimatedCounter value={stats.totalUsers} />
                    </p>
                    <p className="text-xs text-muted-foreground">Active Traders</p>
                  </motion.div>

                  <motion.div
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.7 }}
                    className="p-4 rounded-xl bg-card border border-border shadow-sm"
                  >
                    <div className="flex items-center justify-center gap-1.5 mb-1">
                      <Package className="w-4 h-4 text-amber-500" />
                    </div>
                    <p className="text-2xl font-bold text-amber-500">
                      <AnimatedCounter value={stats.activeListings} />
                    </p>
                    <p className="text-xs text-muted-foreground">Live Listings</p>
                  </motion.div>

                  <motion.div
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.8 }}
                    className="p-4 rounded-xl bg-card border border-border shadow-sm"
                  >
                    <div className="flex items-center justify-center gap-1.5 mb-1">
                      <Zap className="w-4 h-4 text-green-500" />
                    </div>
                    <p className="text-2xl font-bold text-green-500">
                      <AnimatedCounter value={stats.onlineNow} />
                    </p>
                    <p className="text-xs text-muted-foreground">Online Now</p>
                  </motion.div>

                  <motion.div
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.9 }}
                    className="p-4 rounded-xl bg-card border border-border shadow-sm"
                  >
                    <div className="flex items-center justify-center gap-1.5 mb-1">
                      <TrendingUp className="w-4 h-4 text-blue-500" />
                    </div>
                    <p className="text-2xl font-bold text-blue-500">
                      <AnimatedCounter value={stats.tradesToday} />
                    </p>
                    <p className="text-xs text-muted-foreground">Trades Today</p>
                  </motion.div>
                </div>
              </motion.div>

              {/* FOMO Banner */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1 }}
                className="mb-8 p-4 rounded-xl bg-gradient-to-r from-green-500/10 to-emerald-500/10 border border-green-500/20 max-w-md mx-auto"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-green-500/20 flex items-center justify-center flex-shrink-0">
                    <Star className="w-5 h-5 text-green-500" />
                  </div>
                  <div className="text-left">
                    <p className="text-sm font-medium text-foreground">
                      {stats.newUsersToday > 0 ? (
                        <>{stats.newUsersToday} traders joined today!</>
                      ) : (
                        <>Join our growing community!</>
                      )}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {stats.successRate}% trade success rate
                    </p>
                  </div>
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1.1 }}
              >
                <Button
                  size="lg"
                  className="h-14 px-8 rounded-xl text-lg font-medium bg-gradient-to-r from-primary to-amber-600 hover:from-primary/90 hover:to-amber-600/90 shadow-lg shadow-primary/25"
                  onClick={handleNextStep}
                >
                  Let's Get Started
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </motion.div>
            </motion.div>
          )}

          {/* Step 1: Personal Details - Confirmation Page */}
          {currentStep === 1 && (
            <motion.div
              key="personal"
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -50 }}
              transition={{ duration: 0.4 }}
              className="py-8"
            >
              <div className="text-center mb-8">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-primary/10 flex items-center justify-center">
                  <BadgeCheck className="w-8 h-8 text-primary" />
                </div>
                <h2 className="text-2xl font-bold text-foreground mb-2">Confirm Your Details</h2>
                <p className="text-muted-foreground">Review and update your information if needed</p>
              </div>

              <Card className="border shadow-lg bg-card">
                <CardContent className="p-6 space-y-4">
                  {/* Pre-filled info notice */}
                  <div className="flex items-start gap-3 p-3 rounded-xl bg-blue-500/10 border border-blue-500/20 mb-4">
                    <AlertCircle className="h-5 w-5 text-blue-500 flex-shrink-0 mt-0.5" />
                    <p className="text-sm text-muted-foreground">
                      We've pre-filled your details from registration. Please review and make any corrections.
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="name" className="text-foreground">Full Name</Label>
                    <Input
                      id="name"
                      value={personalDetails.name}
                      onChange={(e) => setPersonalDetails({ ...personalDetails, name: e.target.value })}
                      placeholder="Your full name"
                      className="h-12 rounded-xl"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="phone" className="text-foreground">Phone Number</Label>
                    <Input
                      id="phone"
                      value={personalDetails.phone}
                      onChange={(e) => setPersonalDetails({ ...personalDetails, phone: e.target.value })}
                      placeholder="+264 81 123 4567"
                      className="h-12 rounded-xl"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="region" className="text-foreground flex items-center gap-2">
                        <MapPin className="w-4 h-4" />
                        Region
                      </Label>
                      <Select
                        value={personalDetails.region}
                        onValueChange={(value) => setPersonalDetails({ ...personalDetails, region: value })}
                      >
                        <SelectTrigger className="h-12 rounded-xl">
                          <SelectValue placeholder="Select region" />
                        </SelectTrigger>
                        <SelectContent>
                          {namibiaRegions.map((region) => (
                            <SelectItem key={region} value={region}>
                              {region}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="town" className="text-foreground">Town/City</Label>
                      <Input
                        id="town"
                        value={personalDetails.town}
                        onChange={(e) => setPersonalDetails({ ...personalDetails, town: e.target.value })}
                        placeholder="Your town or city"
                        className="h-12 rounded-xl"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <div className="flex gap-3 mt-6">
                <Button
                  variant="outline"
                  className="flex-1 h-12 rounded-xl bg-transparent"
                  onClick={() => setCurrentStep((prev) => prev - 1)}
                >
                  <ChevronLeft className="h-4 w-4 mr-2" />
                  Back
                </Button>
                <Button
                  className="flex-1 h-12 rounded-xl"
                  onClick={handleNextStep}
                  disabled={isProcessing || !personalDetails.name || !personalDetails.region}
                >
                  {isProcessing ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
                  Confirm & Continue
                  <ChevronRight className="h-4 w-4 ml-2" />
                </Button>
              </div>
            </motion.div>
          )}

          {/* Step 2: Profile Picture */}
          {currentStep === 2 && (
            <motion.div
              key="avatar"
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -50 }}
              transition={{ duration: 0.4 }}
              className="py-8"
            >
              <div className="text-center mb-8">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-primary/10 flex items-center justify-center">
                  <Camera className="w-8 h-8 text-primary" />
                </div>
                <h2 className="text-2xl font-bold text-foreground mb-2">Add a Profile Picture</h2>
                <p className="text-muted-foreground">Help other traders recognize you</p>
              </div>

              <Card className="border shadow-lg bg-card">
                <CardContent className="p-6">
                  <div className="flex flex-col items-center">
                    <label className="cursor-pointer group touch-manipulation">
                      <div
                        className={cn(
                          "w-36 h-36 rounded-full flex items-center justify-center transition-all duration-300 active:scale-95",
                          profileImage
                            ? "bg-muted"
                            : "bg-muted/50 border-2 border-dashed border-muted-foreground/30 hover:border-primary/50 group-hover:bg-muted active:bg-primary/5"
                        )}
                      >
                        {profileImage ? (
                          <img
                            src={profileImage || "/placeholder.svg"}
                            alt="Profile"
                            className="w-full h-full rounded-full object-cover"
                          />
                        ) : (
                          <div className="text-center p-4">
                            <div className="w-14 h-14 mx-auto rounded-full bg-primary/10 flex items-center justify-center mb-2">
                              <Camera className="h-7 w-7 text-primary" />
                            </div>
                            <span className="text-xs font-medium text-muted-foreground">Tap to upload</span>
                            <span className="text-[10px] text-muted-foreground/70 block mt-0.5">Camera or Gallery</span>
                          </div>
                        )}
                      </div>
                      <input
                        type="file"
                        accept="image/jpeg,image/jpg,image/png,image/webp,image/heic,image/heif,.jpg,.jpeg,.png,.webp,.heic,.heif"
                        capture="user"
                        className="hidden"
                        onChange={(e) => handleImageUpload(e, "profile")}
                      />
                    </label>

                    {profileImage && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="mt-3 text-muted-foreground hover:text-destructive"
                        onClick={() => setProfileImage(null)}
                      >
                        <X className="h-4 w-4 mr-1" />
                        Remove
                      </Button>
                    )}

                    <p className="text-sm text-muted-foreground mt-4 text-center">
                      A profile picture helps build trust with other traders
                    </p>
                  </div>
                </CardContent>
              </Card>

              <div className="flex gap-3 mt-6">
                <Button
                  variant="outline"
                  className="flex-1 h-12 rounded-xl bg-transparent"
                  onClick={() => setCurrentStep((prev) => prev - 1)}
                >
                  <ChevronLeft className="h-4 w-4 mr-2" />
                  Back
                </Button>
                <Button
                  className="flex-1 h-12 rounded-xl"
                  onClick={handleNextStep}
                  disabled={isProcessing}
                >
                  {isProcessing ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
                  {profileImage ? "Continue" : "Skip for Now"}
                  <ChevronRight className="h-4 w-4 ml-2" />
                </Button>
              </div>
            </motion.div>
          )}

          {/* Step 3: ID Verification */}
          {currentStep === 3 && (
            <motion.div
              key="id"
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -50 }}
              transition={{ duration: 0.4 }}
              className="py-8"
            >
              <div className="text-center mb-8">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-primary/10 flex items-center justify-center">
                  <Shield className="w-8 h-8 text-primary" />
                </div>
                <h2 className="text-2xl font-bold text-foreground mb-2">ID Verification</h2>
                <p className="text-muted-foreground">Optional but recommended for trust</p>
              </div>

              <Card className="border shadow-lg bg-card mb-4">
                <CardContent className="p-6">
                  <div className="flex items-start gap-3 p-4 rounded-xl bg-blue-500/10 border border-blue-500/20 mb-6">
                    <BadgeCheck className="h-5 w-5 text-blue-500 flex-shrink-0 mt-0.5" />
                    <div className="text-sm">
                      <p className="font-medium text-foreground">Why verify your ID?</p>
                      <ul className="text-muted-foreground mt-1 space-y-1">
                        <li>- Get a verified badge on your profile</li>
                        <li>- Appear higher in search results</li>
                        <li>- Build more trust with traders</li>
                      </ul>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <Label className="text-foreground mb-2 block">ID Front</Label>
                      <label className="cursor-pointer block touch-manipulation">
                        <div
                          className={cn(
                            "h-40 rounded-xl flex items-center justify-center transition-all duration-300 active:scale-95",
                            idFront
                              ? "bg-muted"
                              : "bg-muted/50 border-2 border-dashed border-muted-foreground/30 hover:border-primary/50 active:bg-primary/5"
                          )}
                        >
                          {idFront ? (
                            <img src={idFront || "/placeholder.svg"} alt="ID Front" className="w-full h-full rounded-xl object-cover" />
                          ) : (
                            <div className="text-center p-4">
                              <div className="w-12 h-12 mx-auto rounded-xl bg-primary/10 flex items-center justify-center mb-2">
                                <IdCard className="h-6 w-6 text-primary" />
                              </div>
                              <span className="text-xs font-medium text-muted-foreground">Tap to upload front</span>
                              <span className="text-[10px] text-muted-foreground/70 block mt-0.5">Camera or Gallery</span>
                            </div>
                          )}
                        </div>
                        <input
                          type="file"
                          accept="image/jpeg,image/jpg,image/png,image/webp,image/heic,image/heif,.jpg,.jpeg,.png,.webp,.heic,.heif"
                          capture="environment"
                          className="hidden"
                          onChange={(e) => handleImageUpload(e, "id-front")}
                        />
                      </label>
                    </div>

                    <div>
                      <Label className="text-foreground mb-2 block">ID Back</Label>
                      <label className="cursor-pointer block touch-manipulation">
                        <div
                          className={cn(
                            "h-40 rounded-xl flex items-center justify-center transition-all duration-300 active:scale-95",
                            idBack
                              ? "bg-muted"
                              : "bg-muted/50 border-2 border-dashed border-muted-foreground/30 hover:border-primary/50 active:bg-primary/5"
                          )}
                        >
                          {idBack ? (
                            <img src={idBack || "/placeholder.svg"} alt="ID Back" className="w-full h-full rounded-xl object-cover" />
                          ) : (
                            <div className="text-center p-4">
                              <div className="w-12 h-12 mx-auto rounded-xl bg-primary/10 flex items-center justify-center mb-2">
                                <IdCard className="h-6 w-6 text-primary" />
                              </div>
                              <span className="text-xs font-medium text-muted-foreground">Tap to upload back</span>
                              <span className="text-[10px] text-muted-foreground/70 block mt-0.5">Camera or Gallery</span>
                            </div>
                          )}
                        </div>
                        <input
                          type="file"
                          accept="image/jpeg,image/jpg,image/png,image/webp,image/heic,image/heif,.jpg,.jpeg,.png,.webp,.heic,.heif"
                          capture="environment"
                          className="hidden"
                          onChange={(e) => handleImageUpload(e, "id-back")}
                        />
                      </label>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <div className="flex gap-3 mt-6">
                <Button
                  variant="outline"
                  className="flex-1 h-12 rounded-xl bg-transparent"
                  onClick={() => setCurrentStep((prev) => prev - 1)}
                >
                  <ChevronLeft className="h-4 w-4 mr-2" />
                  Back
                </Button>
                <Button
                  className="flex-1 h-12 rounded-xl"
                  onClick={handleNextStep}
                  disabled={isProcessing}
                >
                  {isProcessing ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
                  {idFront && idBack ? "Submit for Verification" : "Skip for Now"}
                  <ChevronRight className="h-4 w-4 ml-2" />
                </Button>
              </div>
            </motion.div>
          )}

          {/* Step 4: Interests */}
          {currentStep === 4 && (
            <motion.div
              key="interests"
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -50 }}
              transition={{ duration: 0.4 }}
              className="py-8"
            >
              <div className="text-center mb-8">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-primary/10 flex items-center justify-center">
                  <Heart className="w-8 h-8 text-primary" />
                </div>
                <h2 className="text-2xl font-bold text-foreground mb-2">What interests you?</h2>
                <p className="text-muted-foreground">Select categories to get personalized recommendations</p>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
                {tradeCategories.map((category, index) => (
                  <motion.button
                    key={category.id}
                    type="button"
                    onClick={() => toggleInterest(category.id)}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: index * 0.05 }}
                    className={cn(
                      "p-4 rounded-xl text-left transition-all duration-200 border-2",
                      selectedInterests.includes(category.id)
                        ? "bg-primary/10 border-primary text-foreground"
                        : "bg-card border-transparent hover:bg-muted"
                    )}
                    whileTap={{ scale: 0.95 }}
                  >
                    <div className="text-2xl mb-2">
                      {selectedInterests.includes(category.id) ? (
                        <CheckCircle className="h-6 w-6 text-primary" />
                      ) : (
                        <div className="h-6 w-6 rounded-full border-2 border-muted-foreground/30" />
                      )}
                    </div>
                    <p className="font-medium text-sm">{category.name}</p>
                    <p className="text-xs text-muted-foreground mt-1">{category.description}</p>
                  </motion.button>
                ))}
              </div>

              <p className="text-sm text-muted-foreground text-center mb-6">
                Selected: {selectedInterests.length} categories
              </p>

              <div className="flex gap-3">
                <Button
                  variant="outline"
                  className="flex-1 h-12 rounded-xl bg-transparent"
                  onClick={() => setCurrentStep((prev) => prev - 1)}
                >
                  <ChevronLeft className="h-4 w-4 mr-2" />
                  Back
                </Button>
                <Button
                  className="flex-1 h-12 rounded-xl"
                  onClick={handleNextStep}
                  disabled={isProcessing}
                >
                  {isProcessing ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
                  {selectedInterests.length > 0 ? "Continue" : "Skip"}
                  <ChevronRight className="h-4 w-4 ml-2" />
                </Button>
              </div>
            </motion.div>
          )}

          {/* Step 5: Complete */}
          {currentStep === 5 && (
            <motion.div
              key="complete"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ duration: 0.5 }}
              className="text-center py-12"
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
                className="w-28 h-28 mx-auto mb-8 rounded-full bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center shadow-2xl shadow-green-500/30"
              >
                <CheckCircle className="w-14 h-14 text-white" />
              </motion.div>

              <motion.h1
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="text-3xl sm:text-4xl font-bold text-foreground mb-4"
              >
                You're All Set!
              </motion.h1>

              <motion.p
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="text-lg text-muted-foreground mb-8 max-w-md mx-auto"
              >
                Welcome to Barter Trade Namibia! Start exploring listings, connect with traders, and make your first trade!
              </motion.p>

              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
              >
                <Button
                  size="lg"
                  className="h-14 px-8 rounded-xl text-lg font-medium bg-gradient-to-r from-primary to-amber-600 shadow-lg shadow-primary/25"
                  onClick={handleNextStep}
                  disabled={isProcessing}
                >
                  {isProcessing ? (
                    <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                  ) : (
                    <Sparkles className="h-5 w-5 mr-2" />
                  )}
                  Start Trading
                </Button>
              </motion.div>

              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1 }}
                className="text-sm text-muted-foreground mt-8"
              >
                Good luck on your trading journey!
              </motion.p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
