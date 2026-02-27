"use client"

import React, { useState, useCallback, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import Image from "next/image"
import { motion, AnimatePresence } from "framer-motion"
import {
  Heart,
  Eye,
  MapPin,
  Star,
  BadgeCheck,
  Flame,
  Bookmark,
  Share2,
  Clock,
  ArrowRightLeft,
  Shield,
  FileCheck,
  Crown,
  TrendingUp,
  Users,
  Zap,
  MessageCircle,
  Sparkles,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { UserAvatar } from "@/components/ui/user-avatar"
import { cn } from "@/lib/utils"
import { toast } from "@/hooks/use-toast"
import { useAuth } from "@/contexts/auth-context"

// Enterprise listing data interface with dynamic stats
export interface EnterpriseListingData {
  id: string
  title: string
  description?: string
  value: number
  category: string
  categoryName?: string
  condition?: string
  location?: {
    region?: string
    town?: string
  }
  region?: string
  town?: string
  images?: string[]
  primaryImage?: string
  views?: number
  saves?: number
  likes?: number
  comments?: number
  offers?: number
  featured?: boolean
  hot?: boolean
  viewingNow?: number
  createdAt?: string
  updatedAt?: string
  // High-value listing properties
  isHighValue?: boolean
  documentsRequired?: boolean
  documentsVerified?: boolean
  hasDocuments?: boolean
  // FOMO data
  recentActivity?: {
    type: "view" | "like" | "save" | "offer"
    userName?: string
    timeAgo: string
  }[]
  interestScore?: number // 0-100
  user?: {
    id?: string
    name?: string
    avatar?: string | null
    gender?: "male" | "female" | "other"
    rating?: number
    trades?: number
    isVerified?: boolean
    verified?: boolean
    responseTime?: string
  }
  seller?: {
    id?: string
    name?: string
    avatar?: string | null
    gender?: "male" | "female" | "other"
    rating?: number
    trades?: number
    isVerified?: boolean
    verified?: boolean
    responseTime?: string
  }
  wantedItems?: Array<{ description: string; estimatedValue?: number | null; isFlexible?: boolean }>
  tradeFor?: string[]
}

interface EnterpriseListingCardProps {
  listing: EnterpriseListingData
  index?: number
  variant?: "compact" | "standard" | "featured" | "grid"
  onViewDetails?: (listing: EnterpriseListingData) => void
  onMakeOffer?: (listing: EnterpriseListingData) => void
  showActions?: boolean
  className?: string
}

// Format currency as NAD
function formatNAD(amount: number): string {
  return `N$${amount.toLocaleString("en-NA", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`
}

// Get perceived value label
function getValueTier(amount: number): { label: string; gradient: string; icon: React.ReactNode } | null {
  if (amount >= 100000) return { 
    label: "Premium", 
    gradient: "from-amber-500 via-orange-500 to-red-500",
    icon: <Crown className="h-3 w-3" />
  }
  if (amount >= 50000) return { 
    label: "High Value", 
    gradient: "from-violet-500 via-purple-500 to-indigo-500",
    icon: <Sparkles className="h-3 w-3" />
  }
  if (amount >= 20000) return { 
    label: "Great Deal", 
    gradient: "from-emerald-500 via-teal-500 to-cyan-500",
    icon: <TrendingUp className="h-3 w-3" />
  }
  return null
}

// Get urgency level based on engagement
function getUrgencyLevel(views: number, saves: number, offers: number = 0): { 
  level: "critical" | "high" | "medium" | "low" | null
  message: string
} {
  const engagementScore = (views * 0.1) + (saves * 2) + (offers * 5)
  
  if (engagementScore > 50 || offers > 3) {
    return { level: "critical", message: "Very High Demand" }
  }
  if (engagementScore > 25 || offers > 1) {
    return { level: "high", message: "High Interest" }
  }
  if (engagementScore > 10) {
    return { level: "medium", message: "Gaining Traction" }
  }
  return { level: null, message: "" }
}

// Format relative time
function formatTimeAgo(dateString?: string): string {
  if (!dateString) return "Recently"
  
  const date = new Date(dateString)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
  const diffDays = Math.floor(diffHours / 24)
  
  if (diffHours < 1) return "Just now"
  if (diffHours < 24) return `${diffHours}h ago`
  if (diffDays < 7) return `${diffDays}d ago`
  return date.toLocaleDateString()
}

// Category styling
const categoryStyles: Record<string, { bg: string; text: string; border: string; glow: string }> = {
  electronics: { bg: "bg-blue-500/10", text: "text-blue-400", border: "border-blue-500/20", glow: "shadow-blue-500/20" },
  vehicles: { bg: "bg-rose-500/10", text: "text-rose-400", border: "border-rose-500/20", glow: "shadow-rose-500/20" },
  property: { bg: "bg-amber-500/10", text: "text-amber-400", border: "border-amber-500/20", glow: "shadow-amber-500/20" },
  "home-garden": { bg: "bg-teal-500/10", text: "text-teal-400", border: "border-teal-500/20", glow: "shadow-teal-500/20" },
  fashion: { bg: "bg-pink-500/10", text: "text-pink-400", border: "border-pink-500/20", glow: "shadow-pink-500/20" },
  livestock: { bg: "bg-lime-500/10", text: "text-lime-400", border: "border-lime-500/20", glow: "shadow-lime-500/20" },
  services: { bg: "bg-violet-500/10", text: "text-violet-400", border: "border-violet-500/20", glow: "shadow-violet-500/20" },
  collectibles: { bg: "bg-indigo-500/10", text: "text-indigo-400", border: "border-indigo-500/20", glow: "shadow-indigo-500/20" },
  agriculture: { bg: "bg-emerald-500/10", text: "text-emerald-400", border: "border-emerald-500/20", glow: "shadow-emerald-500/20" },
  other: { bg: "bg-muted", text: "text-muted-foreground", border: "border-border", glow: "" },
}

export function EnterpriseListingCard({
  listing,
  index = 0,
  variant = "standard",
  onViewDetails,
  onMakeOffer,
  showActions = true,
  className,
}: EnterpriseListingCardProps) {
  const { user: currentUser } = useAuth()
  const router = useRouter()
  const [isLiked, setIsLiked] = useState(false)
  const [isSaved, setIsSaved] = useState(false)
  const [likesCount, setLikesCount] = useState(listing.likes || 0)
  const [isLoading, setIsLoading] = useState(false)
  const [showActivity, setShowActivity] = useState(false)

  // Normalize data
  const seller = listing.seller || listing.user
  const isVerified = seller?.isVerified || seller?.verified || false
  const region = listing.location?.region || listing.region || "Unknown"
  const town = listing.location?.town || listing.town
  const mainImage = listing.primaryImage || listing.images?.[0] || "/placeholder.svg"
  const categoryKey = (listing.category || "other").toLowerCase()
  const styles = categoryStyles[categoryKey] || categoryStyles.other
  const tradeItems = listing.tradeFor || listing.wantedItems?.map(w => w.description) || []
  
  // Calculate FOMO indicators
  const valueTier = getValueTier(listing.value)
  const urgency = getUrgencyLevel(listing.views || 0, listing.saves || 0, listing.offers || 0)
  const interestPercentage = listing.interestScore || Math.min(95, Math.floor((listing.views || 0) / 3 + (listing.saves || 0) * 5 + (listing.likes || 0) * 3))

  // Simulate periodic activity notifications for FOMO
  useEffect(() => {
    if (listing.viewingNow && listing.viewingNow > 1) {
      const interval = setInterval(() => {
        setShowActivity(true)
        setTimeout(() => setShowActivity(false), 3000)
      }, 8000)
      return () => clearInterval(interval)
    }
  }, [listing.viewingNow])

  const handleLike = useCallback(async (e: React.MouseEvent) => {
    e.stopPropagation()
    e.preventDefault()
    
    if (!currentUser) {
      toast({ title: "Please log in to like listings" })
      return
    }
    
    if (isLoading) return
    setIsLoading(true)

    const wasLiked = isLiked
    setIsLiked(!wasLiked)
    setLikesCount((prev) => wasLiked ? prev - 1 : prev + 1)

    try {
      const response = await fetch(`/api/listings/${listing.id}/like`, { method: "POST" })
      const data = await response.json()

      if (!response.ok) {
        setIsLiked(wasLiked)
        setLikesCount((prev) => wasLiked ? prev + 1 : prev - 1)
        throw new Error(data.error || "Failed to toggle like")
      }

      setIsLiked(data.liked)
      setLikesCount(data.likesCount)
    } catch {
      toast({ title: "Failed to like", variant: "destructive" })
    } finally {
      setIsLoading(false)
    }
  }, [currentUser, isLoading, isLiked, listing.id])

  const handleSave = useCallback(async (e: React.MouseEvent) => {
    e.stopPropagation()
    e.preventDefault()
    
    if (!currentUser) {
      toast({ title: "Please log in to save listings" })
      return
    }

    const wasSaved = isSaved
    setIsSaved(!wasSaved)

    try {
      const response = await fetch("/api/saved-listings", {
        method: wasSaved ? "DELETE" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ listingId: listing.id }),
      })

      if (!response.ok) {
        setIsSaved(wasSaved)
        throw new Error("Failed to save listing")
      }

      toast({ title: wasSaved ? "Removed from saved" : "Saved for later" })
    } catch {
      toast({ title: "Failed to save", variant: "destructive" })
    }
  }, [currentUser, isSaved, listing.id])

  const handleShare = useCallback(async (e: React.MouseEvent) => {
    e.stopPropagation()
    e.preventDefault()
    
    const shareUrl = `${window.location.origin}/listing/${listing.id}`
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: listing.title,
          text: `Check out this trade: ${listing.title}`,
          url: shareUrl,
        })
      } catch {
        // User cancelled
      }
    } else {
      await navigator.clipboard.writeText(shareUrl)
      toast({ title: "Link copied to clipboard" })
    }
  }, [listing.id, listing.title])

  // Grid variant - compact for grid layouts
  if (variant === "grid") {
    return (
      <Link href={`/dashboard/listings/${listing.id}`} className={cn("block", className)}>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.03 * index, duration: 0.4 }}
          whileHover={{ y: -6 }}
          className="listing-card-enterprise"
        >
          <Card className="overflow-hidden bg-card border-border/40 hover:border-primary/40 h-full group relative">
            {/* Featured Ribbon */}
            {listing.featured && <div className="featured-ribbon" />}
            
            {/* Image Container */}
            <div className="relative aspect-square image-zoom-container">
              <Image
                src={mainImage || "/placeholder.svg"}
                alt={listing.title}
                fill
                className="object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent opacity-80" />
              
              {/* Top Badges */}
              <div className="absolute top-2 left-2 flex flex-wrap gap-1.5 max-w-[75%]">
                {listing.hot && (
                  <Badge className="bg-gradient-to-r from-orange-500 to-red-500 text-white text-[10px] px-2 py-0.5 border-0 shadow-lg fomo-badge">
                    <Flame className="h-3 w-3 mr-1" />
                    Hot
                  </Badge>
                )}
                {urgency.level === "critical" && (
                  <Badge className="bg-gradient-to-r from-red-500 to-rose-500 text-white text-[10px] px-2 py-0.5 border-0 urgency-badge">
                    <Zap className="h-3 w-3 mr-1" />
                    {urgency.message}
                  </Badge>
                )}
                {listing.documentsVerified && (
                  <Badge className="bg-gradient-to-r from-emerald-500 to-green-500 text-white text-[10px] px-2 py-0.5 border-0">
                    <Shield className="h-3 w-3 mr-1" />
                    Verified
                  </Badge>
                )}
              </div>

              {/* Action Buttons */}
              <div className="absolute top-2 right-2 flex flex-col gap-1.5">
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={handleSave}
                  className={cn(
                    "w-8 h-8 rounded-xl flex items-center justify-center backdrop-blur-md transition-all shadow-lg",
                    isSaved ? "bg-primary text-primary-foreground" : "bg-background/80 text-foreground hover:bg-primary hover:text-primary-foreground"
                  )}
                >
                  <Bookmark className={cn("h-4 w-4", isSaved && "fill-current")} />
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={handleLike}
                  className={cn(
                    "w-8 h-8 rounded-xl flex items-center justify-center backdrop-blur-md transition-all shadow-lg",
                    isLiked ? "bg-rose-500 text-white" : "bg-background/80 text-foreground hover:bg-rose-500 hover:text-white"
                  )}
                >
                  <Heart className={cn("h-4 w-4", isLiked && "fill-current")} />
                </motion.button>
              </div>

              {/* Live Viewers */}
              {listing.viewingNow && listing.viewingNow > 0 && (
                <div className="absolute bottom-2 left-2 flex items-center gap-1.5 px-2 py-1 rounded-full bg-background/90 backdrop-blur-md viewers-counter">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute h-full w-full rounded-full bg-red-400 opacity-75" />
                    <span className="relative rounded-full h-2 w-2 bg-red-500" />
                  </span>
                  <span className="text-[10px] font-medium">{listing.viewingNow} viewing</span>
                </div>
              )}

              {/* Value */}
              <div className="absolute bottom-2 right-2 px-2.5 py-1 rounded-lg bg-primary/90 backdrop-blur-sm">
                <p className="text-sm font-bold text-primary-foreground">{formatNAD(listing.value)}</p>
              </div>
            </div>

            <CardContent className="p-3">
              <p className="font-medium text-sm text-foreground truncate group-hover:text-primary transition-colors">
                {listing.title}
              </p>
              <p className="text-xs text-muted-foreground truncate mt-1 flex items-center gap-1">
                <MapPin className="h-3 w-3" />
                {region}
              </p>
              <div className="flex items-center justify-between mt-2 text-[10px] text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Eye className="h-3 w-3" /> {listing.views || 0}
                </span>
                <span className="flex items-center gap-1">
                  <Heart className="h-3 w-3" /> {likesCount}
                </span>
                <span className="flex items-center gap-1">
                  <MessageCircle className="h-3 w-3" /> {listing.comments || 0}
                </span>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </Link>
    )
  }

  // Featured variant - larger, more prominent
  if (variant === "featured") {
    return (
      <Link href={`/dashboard/listings/${listing.id}`} className={cn("block", className)}>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.03 * index, duration: 0.4 }}
          whileHover={{ y: -8 }}
          className="listing-card-enterprise"
        >
          <Card className="overflow-hidden bg-card border-primary/20 hover:border-primary/50 shadow-xl hover:shadow-2xl hover:shadow-primary/10 group relative">
            {/* Featured Indicator */}
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary via-emerald-500 to-primary" />
            
            <div className="md:flex">
              {/* Image Section */}
              <div className="relative md:w-2/5 aspect-[4/3] md:aspect-auto image-zoom-container">
                <Image
                  src={mainImage || "/placeholder.svg"}
                  alt={listing.title}
                  fill
                  className="object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t md:bg-gradient-to-r from-background/90 via-background/40 to-transparent" />
                
                {/* Badges */}
                <div className="absolute top-3 left-3 flex flex-wrap gap-2">
                  <Badge className="bg-gradient-to-r from-amber-500 to-orange-500 text-white text-xs px-2.5 py-1 border-0 shadow-lg">
                    <Star className="h-3.5 w-3.5 mr-1 fill-current" />
                    Featured
                  </Badge>
                  {listing.hot && (
                    <Badge className="bg-gradient-to-r from-orange-500 to-red-500 text-white text-xs px-2.5 py-1 border-0 fomo-badge">
                      <Flame className="h-3.5 w-3.5 mr-1" />
                      Trending
                    </Badge>
                  )}
                  {valueTier && (
                    <Badge className={cn("text-white text-xs px-2.5 py-1 border-0 bg-gradient-to-r", valueTier.gradient)}>
                      {valueTier.icon}
                      <span className="ml-1">{valueTier.label}</span>
                    </Badge>
                  )}
                </div>

                {/* Live viewers on image */}
                {listing.viewingNow && listing.viewingNow > 0 && (
                  <div className="absolute bottom-3 left-3 flex items-center gap-2 px-3 py-1.5 rounded-full bg-background/90 backdrop-blur-md shadow-lg viewers-counter">
                    <span className="relative flex h-2.5 w-2.5">
                      <span className="animate-ping absolute h-full w-full rounded-full bg-red-400 opacity-75" />
                      <span className="relative rounded-full h-2.5 w-2.5 bg-red-500" />
                    </span>
                    <span className="text-sm font-medium">{listing.viewingNow} viewing now</span>
                  </div>
                )}
              </div>

              {/* Content Section */}
              <div className="flex-1 p-5">
                {/* Category & Title */}
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="flex-1 min-w-0">
                    <Badge variant="outline" className={cn("text-xs mb-2", styles.bg, styles.text, styles.border)}>
                      {listing.categoryName || listing.category}
                    </Badge>
                    <h3 className="font-semibold text-xl text-foreground line-clamp-2 group-hover:text-primary transition-colors">
                      {listing.title}
                    </h3>
                    <p className="text-sm text-muted-foreground flex items-center gap-1.5 mt-1">
                      <MapPin className="h-4 w-4" />
                      {town ? `${town}, ${region}` : region}
                    </p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-3xl font-bold text-primary value-highlight">{formatNAD(listing.value)}</p>
                    <p className="text-xs text-muted-foreground">or trade equivalent</p>
                  </div>
                </div>

                {/* Interest Bar - FOMO Element */}
                {interestPercentage > 20 && (
                  <div className="mb-4 p-3 rounded-xl bg-muted/50 border border-border/50">
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-xs font-medium flex items-center gap-1.5">
                        <TrendingUp className="h-3.5 w-3.5 text-emerald-500" />
                        Interest Level
                      </span>
                      <span className="text-xs font-bold text-emerald-500">{interestPercentage}%</span>
                    </div>
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                      <motion.div 
                        className="h-full bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full interest-bar-fill"
                        initial={{ width: 0 }}
                        animate={{ width: `${interestPercentage}%` }}
                        transition={{ duration: 1.5, ease: "easeOut" }}
                      />
                    </div>
                  </div>
                )}

                {/* Trade Preferences */}
                {tradeItems.length > 0 && (
                  <div className="flex flex-wrap items-center gap-1.5 mb-4">
                    <ArrowRightLeft className="h-4 w-4 text-muted-foreground" />
                    <span className="text-xs text-muted-foreground">Trade for:</span>
                    {tradeItems.slice(0, 3).map((item) => (
                      <Badge key={item} variant="secondary" className="text-[11px] bg-secondary/50">
                        {item}
                      </Badge>
                    ))}
                    {tradeItems.length > 3 && (
                      <Badge variant="secondary" className="text-[11px] bg-secondary/50">
                        +{tradeItems.length - 3} more
                      </Badge>
                    )}
                  </div>
                )}

                {/* Stats Row */}
                <div className="flex items-center gap-4 mb-4 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1.5">
                    <Eye className="h-4 w-4" />
                    {listing.views || 0} views
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Heart className="h-4 w-4" />
                    {likesCount} likes
                  </span>
                  {listing.offers && listing.offers > 0 && (
                    <span className="flex items-center gap-1.5 text-amber-500 font-medium">
                      <ArrowRightLeft className="h-4 w-4" />
                      {listing.offers} offers
                    </span>
                  )}
                  <span className="flex items-center gap-1.5">
                    <Clock className="h-4 w-4" />
                    {formatTimeAgo(listing.createdAt)}
                  </span>
                </div>

                {/* Trader Info & Actions */}
                <div className="flex items-center justify-between pt-4 border-t border-border/50">
                  <div className="flex items-center gap-3">
                    <UserAvatar
                      src={seller?.avatar}
                      name={seller?.name || "Unknown"}
                      gender={seller?.gender}
                      size="lg"
                      showVerifiedBadge
                      isVerified={isVerified}
                    />
                    <div>
                      <p className="font-medium text-foreground flex items-center gap-1.5">
                        {seller?.name || "Unknown"}
                        {isVerified && <BadgeCheck className="h-4 w-4 text-primary fill-primary/20" />}
                      </p>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <span className="flex items-center gap-0.5 text-amber-500">
                          <Star className="h-3.5 w-3.5 fill-current" />
                          {seller?.rating?.toFixed(1) || "4.5"}
                        </span>
                        {seller?.trades && (
                          <>
                            <span className="w-1 h-1 rounded-full bg-muted-foreground/50" />
                            <span>{seller.trades} trades</span>
                          </>
                        )}
                        {seller?.responseTime && (
                          <>
                            <span className="w-1 h-1 rounded-full bg-muted-foreground/50" />
                            <span className="text-emerald-500">Replies {seller.responseTime}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  {showActions && (
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="rounded-xl bg-transparent hover:bg-muted"
                        onClick={(e) => {
                          e.preventDefault()
                          e.stopPropagation()
                          onViewDetails?.(listing)
                        }}
                      >
                        <Eye className="h-4 w-4 mr-1.5" />
                        View Trade
                      </Button>
                      <Button
                        size="sm"
                        className="rounded-xl bg-primary hover:bg-primary/90 btn-enterprise"
                        onClick={(e) => {
                          e.preventDefault()
                          e.stopPropagation()
                          onMakeOffer?.(listing)
                        }}
                      >
                        <ArrowRightLeft className="h-4 w-4 mr-1.5" />
                        Make Offer
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Activity Notification - FOMO */}
            <AnimatePresence>
              {showActivity && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="absolute bottom-4 left-4 right-4 p-3 bg-background/95 backdrop-blur-md rounded-xl border border-primary/20 shadow-lg activity-item"
                >
                  <div className="flex items-center gap-2 text-sm">
                    <Users className="h-4 w-4 text-primary" />
                    <span className="text-muted-foreground">Someone just viewed this listing</span>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </Card>
        </motion.div>
      </Link>
    )
  }

  // Compact variant
  if (variant === "compact") {
    return (
      <Link href={`/dashboard/listings/${listing.id}`} className={cn("block", className)}>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.03 * index }}
          whileHover={{ y: -4 }}
          className="listing-card-enterprise"
        >
          <Card className="overflow-hidden bg-card border-border/50 hover:border-primary/30 h-full group">
            <div className="relative aspect-square image-zoom-container">
              <Image
                src={mainImage || "/placeholder.svg"}
                alt={listing.title}
                fill
                className="object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-background/80 to-transparent" />
              
              {listing.hot && (
                <Badge className="absolute top-2 left-2 bg-gradient-to-r from-orange-500 to-red-500 text-white text-[10px] px-1.5 py-0 border-0">
                  <Flame className="h-3 w-3 mr-0.5" />
                  Hot
                </Badge>
              )}

              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={handleSave}
                className={cn(
                  "absolute top-2 right-2 w-7 h-7 rounded-lg flex items-center justify-center transition-all",
                  isSaved ? "bg-primary text-primary-foreground" : "bg-background/80 backdrop-blur-sm text-foreground hover:bg-primary hover:text-primary-foreground"
                )}
              >
                <Bookmark className={cn("h-3.5 w-3.5", isSaved && "fill-current")} />
              </motion.button>

              <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between">
                <p className="text-foreground font-bold text-lg drop-shadow-md">{formatNAD(listing.value)}</p>
                {listing.viewingNow && listing.viewingNow > 0 && (
                  <span className="flex items-center gap-1 text-[10px] bg-background/80 backdrop-blur-sm px-1.5 py-0.5 rounded-full">
                    <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                    {listing.viewingNow}
                  </span>
                )}
              </div>
            </div>
            
            <CardContent className="p-3">
              <p className="font-medium text-sm text-foreground truncate group-hover:text-primary transition-colors">{listing.title}</p>
              <p className="text-xs text-muted-foreground truncate mt-0.5 flex items-center gap-1">
                <MapPin className="h-3 w-3" />
                {region}
              </p>
            </CardContent>
          </Card>
        </motion.div>
      </Link>
    )
  }

  // Standard variant (default) - Enterprise 2026 Design
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.03 * index }}
      className={cn("group listing-card-enterprise", className)}
    >
      <Card className="overflow-hidden bg-card border-border/40 hover:border-primary/40 h-full relative">
        {/* Featured Ribbon for Featured Items */}
        {listing.featured && <div className="featured-ribbon" />}
        
        {/* Image Section */}
        <Link href={`/dashboard/listings/${listing.id}`} className="block">
          <div className="relative aspect-[4/3] image-zoom-container">
            <Image
              src={mainImage || "/placeholder.svg"}
              alt={listing.title}
              fill
              className="object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-background/90 via-background/30 to-transparent" />

            {/* Status Badges - Top Left */}
            <div className="absolute top-2.5 left-2.5 flex flex-wrap gap-1.5 max-w-[70%]">
              {listing.featured && (
                <Badge className="bg-gradient-to-r from-amber-500 to-orange-500 text-white text-[10px] px-2 py-0.5 border-0 shadow-lg">
                  <Star className="h-3 w-3 mr-1 fill-current" />
                  Featured
                </Badge>
              )}
              {listing.hot && (
                <Badge className="bg-gradient-to-r from-orange-500 to-red-500 text-white text-[10px] px-2 py-0.5 border-0 shadow-lg fomo-badge">
                  <Flame className="h-3 w-3 mr-1" />
                  Hot
                </Badge>
              )}
              {urgency.level && (
                <Badge className={cn(
                  "text-white text-[10px] px-2 py-0.5 border-0 shadow-lg",
                  urgency.level === "critical" ? "bg-gradient-to-r from-red-500 to-rose-500 urgency-badge" :
                  urgency.level === "high" ? "bg-gradient-to-r from-amber-500 to-orange-500" :
                  "bg-gradient-to-r from-blue-500 to-cyan-500"
                )}>
                  <TrendingUp className="h-3 w-3 mr-1" />
                  {urgency.message}
                </Badge>
              )}
              {listing.documentsVerified && (
                <Badge className="bg-gradient-to-r from-emerald-500 to-green-500 text-white text-[10px] px-2 py-0.5 border-0 shadow-lg trust-badge">
                  <FileCheck className="h-3 w-3 mr-1" />
                  Verified
                </Badge>
              )}
            </div>

            {/* Action Buttons - Top Right */}
            <div className="absolute top-2.5 right-2.5 flex flex-col gap-1.5">
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={handleSave}
                className={cn(
                  "w-9 h-9 rounded-xl flex items-center justify-center backdrop-blur-md transition-all shadow-lg",
                  isSaved ? "bg-primary text-primary-foreground" : "bg-background/80 text-foreground hover:bg-primary hover:text-primary-foreground"
                )}
              >
                <Bookmark className={cn("h-4 w-4", isSaved && "fill-current")} />
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={handleLike}
                className={cn(
                  "w-9 h-9 rounded-xl flex items-center justify-center backdrop-blur-md transition-all shadow-lg",
                  isLiked ? "bg-rose-500 text-white" : "bg-background/80 text-foreground hover:bg-rose-500 hover:text-white"
                )}
              >
                <Heart className={cn("h-4 w-4", isLiked && "fill-current")} />
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={handleShare}
                className="w-9 h-9 rounded-xl flex items-center justify-center backdrop-blur-md bg-background/80 text-foreground hover:bg-muted shadow-lg transition-all"
              >
                <Share2 className="h-4 w-4" />
              </motion.button>
            </div>

            {/* Live Viewers Indicator - Bottom Left */}
            {listing.viewingNow && listing.viewingNow > 0 && (
              <div className="absolute bottom-2.5 left-2.5 flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-background/90 backdrop-blur-md shadow-lg viewers-counter">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute h-full w-full rounded-full bg-red-400 opacity-75" />
                  <span className="relative rounded-full h-2 w-2 bg-red-500" />
                </span>
                <span className="text-[11px] font-medium">{listing.viewingNow} viewing</span>
              </div>
            )}

            {/* Category Badge - Bottom Right */}
            <Badge 
              variant="outline" 
              className={cn("absolute bottom-2.5 right-2.5 text-[10px] backdrop-blur-sm", styles.bg, styles.text, styles.border)}
            >
              {listing.categoryName || listing.category}
            </Badge>
          </div>
        </Link>

        {/* Content Section */}
        <CardContent className="p-4">
          {/* Title */}
          <Link href={`/dashboard/listings/${listing.id}`}>
            <h3 className="font-semibold text-foreground text-sm line-clamp-2 group-hover:text-primary transition-colors min-h-[40px]">
              {listing.title}
            </h3>
          </Link>
          
          {/* Value Card */}
          <div className="mt-2.5 p-3 rounded-xl bg-gradient-to-br from-primary/10 via-primary/5 to-transparent border border-primary/20">
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-wide">Item Value</span>
              {valueTier && (
                <Badge className={cn("text-[9px] px-1.5 py-0 border-0 bg-gradient-to-r text-white", valueTier.gradient)}>
                  {valueTier.icon}
                  <span className="ml-1">{valueTier.label}</span>
                </Badge>
              )}
            </div>
            <p className="text-xl font-bold text-primary mt-0.5 value-highlight inline-block">
              {formatNAD(listing.value)}
            </p>
          </div>

          {/* Interest Indicator - Small FOMO bar */}
          {interestPercentage > 30 && (
            <div className="mt-2.5">
              <div className="flex items-center justify-between mb-1">
                <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                  <TrendingUp className="h-3 w-3 text-emerald-500" />
                  Interest
                </span>
                <span className="text-[10px] font-medium text-emerald-500">{interestPercentage}%</span>
              </div>
              <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                <motion.div 
                  className="h-full bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full"
                  initial={{ width: 0 }}
                  animate={{ width: `${interestPercentage}%` }}
                  transition={{ duration: 1, ease: "easeOut", delay: 0.2 }}
                />
              </div>
            </div>
          )}

          {/* Trade For Tags */}
          {tradeItems.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-3">
              <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                <ArrowRightLeft className="h-3 w-3" />
                Trade for:
              </span>
              {tradeItems.slice(0, 2).map((item) => (
                <span key={item} className="text-[10px] px-2 py-0.5 rounded-full bg-muted/80 text-muted-foreground">
                  {item}
                </span>
              ))}
              {tradeItems.length > 2 && (
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-muted/80 text-muted-foreground">
                  +{tradeItems.length - 2}
                </span>
              )}
            </div>
          )}

          {/* Location & Stats */}
          <div className="flex items-center justify-between mt-3 text-xs text-muted-foreground">
            <div className="flex items-center gap-1">
              <MapPin className="h-3 w-3" />
              <span className="truncate max-w-[80px]">{region}</span>
            </div>
            <div className="flex items-center gap-2.5">
              <span className="flex items-center gap-1">
                <Eye className="h-3 w-3" />
                {listing.views || 0}
              </span>
              <span className="flex items-center gap-1">
                <Heart className="h-3 w-3" />
                {likesCount}
              </span>
              {listing.offers && listing.offers > 0 && (
                <span className="flex items-center gap-1 text-amber-500 font-medium">
                  <ArrowRightLeft className="h-3 w-3" />
                  {listing.offers}
                </span>
              )}
            </div>
          </div>

          {/* Trader Info */}
          <div className="flex items-center gap-2 mt-3 pt-3 border-t border-border/50">
            <UserAvatar
              src={seller?.avatar}
              name={seller?.name || "Unknown"}
              gender={seller?.gender}
              size="sm"
              showVerifiedBadge
              isVerified={isVerified}
            />
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-foreground truncate">
                {seller?.name || "Unknown"}
              </p>
              <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
                <Star className="h-3 w-3 fill-amber-500 text-amber-500" />
                <span>{seller?.rating?.toFixed(1) || "4.5"}</span>
                {seller?.trades && (
                  <>
                    <span className="w-0.5 h-0.5 rounded-full bg-muted-foreground" />
                    <span>{seller.trades} trades</span>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          {showActions && (
            <div className="flex gap-2 mt-4">
              <Button
                variant="outline"
                size="sm"
                className="flex-1 h-9 rounded-xl text-xs font-medium bg-transparent hover:bg-muted"
                onClick={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                  onViewDetails?.(listing)
                }}
              >
                <Eye className="h-3.5 w-3.5 mr-1.5" />
                View Trade
              </Button>
              <Button
                size="sm"
                className="flex-1 h-9 rounded-xl text-xs font-medium bg-primary hover:bg-primary/90 btn-enterprise"
                onClick={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                  onMakeOffer?.(listing)
                }}
              >
                <ArrowRightLeft className="h-3.5 w-3.5 mr-1.5" />
                Make Offer
              </Button>
            </div>
          )}
        </CardContent>

        {/* Activity Notification Overlay - FOMO */}
        <AnimatePresence>
          {showActivity && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="absolute bottom-20 left-3 right-3 p-2.5 bg-background/95 backdrop-blur-md rounded-lg border border-primary/20 shadow-lg"
            >
              <div className="flex items-center gap-2 text-xs">
                <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center">
                  <Users className="h-3.5 w-3.5 text-primary" />
                </div>
                <span className="text-muted-foreground">Someone just viewed this</span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </Card>
    </motion.div>
  )
}
