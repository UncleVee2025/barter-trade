"use client"

import React, { useState, useCallback } from "react"
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
  MoreHorizontal,
  Clock,
  ArrowRightLeft,
  Shield,
  FileCheck,
  Crown,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { UserAvatar } from "@/components/ui/user-avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { cn } from "@/lib/utils"
import { toast } from "@/hooks/use-toast"
import { useAuth } from "@/contexts/auth-context"

// Unified listing data interface
export interface UnifiedListingData {
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
  featured?: boolean
  hot?: boolean
  viewingNow?: number
  createdAt?: string
  // High-value listing properties
  isHighValue?: boolean
  documentsRequired?: boolean
  documentsVerified?: boolean
  hasDocuments?: boolean
  user?: {
    id?: string
    name?: string
    avatar?: string | null
    gender?: "male" | "female" | "other"
    rating?: number
    trades?: number
    isVerified?: boolean
    verified?: boolean
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
  }
  wantedItems?: Array<{ description: string; estimatedValue?: number | null; isFlexible?: boolean }>
  tradeFor?: string[]
}

interface UnifiedListingCardProps {
  listing: UnifiedListingData
  index?: number
  variant?: "compact" | "standard" | "featured"
  onViewDetails?: (listing: UnifiedListingData) => void
  onMakeOffer?: (listing: UnifiedListingData) => void
  showActions?: boolean
  className?: string
}

// Format currency as NAD (Namibian Dollars) with perceived value emphasis
function formatNAD(amount: number): string {
  return `N$ ${amount.toLocaleString("en-NA", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`
}

// Get perceived value label based on amount
function getValueLabel(amount: number): { label: string; color: string } | null {
  if (amount >= 100000) return { label: "Premium", color: "from-amber-500 to-orange-500" }
  if (amount >= 50000) return { label: "High Value", color: "from-violet-500 to-purple-500" }
  if (amount >= 10000) return { label: "Great Deal", color: "from-emerald-500 to-teal-500" }
  return null
}

// Get urgency indicator
function getUrgencyIndicator(views: number, saves: number, createdAt?: string): { message: string; type: "high" | "medium" | "low" } | null {
  // High demand indicator
  if (views > 100 || saves > 10) {
    return { message: "High demand", type: "high" }
  }
  
  // New listing indicator (within 24 hours)
  if (createdAt) {
    const hours = (Date.now() - new Date(createdAt).getTime()) / (1000 * 60 * 60)
    if (hours < 24) return { message: "Just listed", type: "medium" }
    if (hours < 72) return { message: "New", type: "low" }
  }
  
  return null
}

// Format relative time
function formatTimeAgo(dateString?: string): string {
  if (!dateString) return "Recently"
  
  const date = new Date(dateString)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
  const diffDays = Math.floor(diffHours / 24)
  
  if (diffDays > 7) return date.toLocaleDateString()
  if (diffDays > 0) return `${diffDays}d ago`
  if (diffHours > 0) return `${diffHours}h ago`
  return "Just now"
}

// Category color mapping
const categoryColors: Record<string, { bg: string; text: string; border: string }> = {
  electronics: { bg: "bg-blue-500/10", text: "text-blue-500", border: "border-blue-500/20" },
  vehicles: { bg: "bg-rose-500/10", text: "text-rose-500", border: "border-rose-500/20" },
  property: { bg: "bg-amber-500/10", text: "text-amber-500", border: "border-amber-500/20" },
  "home-garden": { bg: "bg-teal-500/10", text: "text-teal-500", border: "border-teal-500/20" },
  fashion: { bg: "bg-pink-500/10", text: "text-pink-500", border: "border-pink-500/20" },
  livestock: { bg: "bg-lime-500/10", text: "text-lime-500", border: "border-lime-500/20" },
  services: { bg: "bg-violet-500/10", text: "text-violet-500", border: "border-violet-500/20" },
  collectibles: { bg: "bg-indigo-500/10", text: "text-indigo-500", border: "border-indigo-500/20" },
  agriculture: { bg: "bg-emerald-500/10", text: "text-emerald-500", border: "border-emerald-500/20" },
  other: { bg: "bg-muted", text: "text-muted-foreground", border: "border-border" },
}

export function UnifiedListingCard({
  listing,
  index = 0,
  variant = "standard",
  onViewDetails,
  onMakeOffer,
  showActions = true,
  className,
}: UnifiedListingCardProps) {
  const { user: currentUser } = useAuth()
  const [isLiked, setIsLiked] = useState(false)
  const [isSaved, setIsSaved] = useState(false)
  const [likesCount, setLikesCount] = useState(listing.likes || 0)
  const [isLoading, setIsLoading] = useState(false)

  // Normalize user data (handle both 'user' and 'seller' fields)
  const seller = listing.seller || listing.user
  const isVerified = seller?.isVerified || seller?.verified || false
  
  // Get location
  const region = listing.location?.region || listing.region || "Unknown"
  const town = listing.location?.town || listing.town
  
  // Get main image
  const mainImage = listing.primaryImage || listing.images?.[0] || "/placeholder.svg"
  
  // Get category colors
  const categoryKey = (listing.category || "other").toLowerCase()
  const colors = categoryColors[categoryKey] || categoryColors.other

  // Get trade items
  const tradeItems = listing.tradeFor || listing.wantedItems?.map(w => w.description) || []

  const handleLike = useCallback(async (e: React.MouseEvent) => {
    e.stopPropagation()
    
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
    
    const shareUrl = `${window.location.origin}/listing/${listing.id}`
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: listing.title,
          text: `Check out this listing: ${listing.title}`,
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

  const router = useRouter()
  
  const handleClick = useCallback(() => {
    // Navigate to the listing detail page for better SEO and user experience
    router.push(`/dashboard/listings/${listing.id}`)
    // Also call the callback if provided (for modal fallback)
    onViewDetails?.(listing)
  }, [listing, onViewDetails, router])

  // Compact variant
  if (variant === "compact") {
    return (
      <Link href={`/dashboard/listings/${listing.id}`} className={cn("block", className)}>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.03 * index }}
          whileHover={{ y: -4 }}
          whileTap={{ scale: 0.98 }}
          className="cursor-pointer"
        >
          <Card className="overflow-hidden bg-card border-border/50 hover:border-primary/30 transition-all duration-300 h-full group">
            <div className="relative aspect-square overflow-hidden">
              <Image
                src={mainImage || "/placeholder.svg"}
                alt={listing.title}
                fill
                className="object-cover transition-transform duration-500 group-hover:scale-110"
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

              <div className="absolute bottom-2 left-2 right-2">
                <p className="text-foreground font-bold text-lg drop-shadow-md">{formatNAD(listing.value)}</p>
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

  // Featured variant
  if (variant === "featured") {
    return (
      <Link href={`/dashboard/listings/${listing.id}`} className={cn("block", className)}>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.03 * index }}
          whileHover={{ y: -6 }}
          className="cursor-pointer"
        >
        <Card className="overflow-hidden bg-card border-primary/20 hover:border-primary/50 transition-all duration-500 shadow-lg hover:shadow-xl hover:shadow-primary/10 group">
          <div className="relative aspect-[16/10] overflow-hidden">
            <Image
              src={mainImage || "/placeholder.svg"}
              alt={listing.title}
              fill
              className="object-cover transition-transform duration-700 group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-background via-background/40 to-transparent" />
            
            {/* Badges */}
            <div className="absolute top-3 left-3 flex flex-wrap gap-2">
              <Badge className="bg-gradient-to-r from-amber-500 to-orange-500 text-white font-semibold text-xs px-2.5 py-1 border-0 shadow-lg">
                <Star className="h-3.5 w-3.5 mr-1 fill-current" />
                Featured
              </Badge>
              {listing.hot && (
                <Badge className="bg-gradient-to-r from-orange-500 to-red-500 text-white text-xs px-2 py-1 border-0">
                  <Flame className="h-3.5 w-3.5 mr-1" />
                  Trending
                </Badge>
              )}
              {(listing.isHighValue || listing.value >= 50000) && (
                <Badge className="bg-gradient-to-r from-violet-600 to-purple-600 text-white text-xs px-2 py-1 border-0">
                  <Crown className="h-3.5 w-3.5 mr-1" />
                  High Value
                </Badge>
              )}
              {listing.documentsVerified && (
                <Badge className="bg-gradient-to-r from-emerald-500 to-green-500 text-white text-xs px-2 py-1 border-0">
                  <FileCheck className="h-3.5 w-3.5 mr-1" />
                  Verified
                </Badge>
              )}
            </div>

            {/* Action buttons */}
            <div className="absolute top-3 right-3 flex gap-2">
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={handleSave}
                className={cn(
                  "w-10 h-10 rounded-xl flex items-center justify-center backdrop-blur-md transition-all shadow-lg",
                  isSaved ? "bg-primary text-primary-foreground" : "bg-background/80 text-foreground hover:bg-primary hover:text-primary-foreground"
                )}
              >
                <Bookmark className={cn("h-5 w-5", isSaved && "fill-current")} />
              </motion.button>
            </div>

            {/* Live viewers */}
            {listing.viewingNow && listing.viewingNow > 0 && (
              <div className="absolute bottom-3 left-3 flex items-center gap-2 px-3 py-1.5 rounded-full bg-background/80 backdrop-blur-md">
                <span className="relative flex h-2.5 w-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500" />
                </span>
                <span className="text-foreground text-sm font-medium">
                  {listing.viewingNow} viewing now
                </span>
              </div>
            )}

            {/* Stats */}
            <div className="absolute bottom-3 right-3 flex items-center gap-3 text-muted-foreground text-sm">
              <span className="flex items-center gap-1 bg-background/80 backdrop-blur-sm px-2 py-1 rounded-lg">
                <Eye className="h-4 w-4" />
                {listing.views || 0}
              </span>
              <span className="flex items-center gap-1 bg-background/80 backdrop-blur-sm px-2 py-1 rounded-lg">
                <Heart className="h-4 w-4" />
                {likesCount}
              </span>
            </div>
          </div>
          
          <CardContent className="p-5">
            <div className="flex items-start justify-between gap-4 mb-3">
              <div className="min-w-0 flex-1">
                <Badge variant="outline" className={cn("text-xs mb-2", colors.bg, colors.text, colors.border)}>
                  {listing.categoryName || listing.category}
                </Badge>
                <h3 className="font-semibold text-lg text-foreground truncate group-hover:text-primary transition-colors">
                  {listing.title}
                </h3>
                <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                  <MapPin className="h-3.5 w-3.5" />
                  {town ? `${town}, ${region}` : region}
                </p>
              </div>
              <div className="text-right flex-shrink-0">
                <p className="text-2xl font-bold text-primary">{formatNAD(listing.value)}</p>
                <p className="text-xs text-muted-foreground">or trade</p>
              </div>
            </div>

            {/* Trade preferences */}
            {tradeItems.length > 0 && (
              <div className="flex flex-wrap items-center gap-1.5 mb-4">
                <ArrowRightLeft className="h-3.5 w-3.5 text-muted-foreground" />
                <span className="text-xs text-muted-foreground">Trade for:</span>
                {tradeItems.slice(0, 3).map((item) => (
                  <Badge key={item} variant="secondary" className="text-[10px] bg-muted/50">
                    {item}
                  </Badge>
                ))}
                {tradeItems.length > 3 && (
                  <Badge variant="secondary" className="text-[10px] bg-muted/50">
                    +{tradeItems.length - 3}
                  </Badge>
                )}
              </div>
            )}

            {/* Seller info and actions */}
            <div className="flex items-center justify-between pt-4 border-t border-border/50">
              <div className="flex items-center gap-3">
                <UserAvatar
                  src={seller?.avatar}
                  name={seller?.name || "Unknown"}
                  gender={seller?.gender}
                  size="md"
                  showVerifiedBadge
                  isVerified={isVerified}
                />
                <div>
                  <p className="font-medium text-sm text-foreground">{seller?.name || "Unknown"}</p>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span className="flex items-center gap-0.5 text-amber-500">
                      <Star className="h-3 w-3 fill-current" />
                      {seller?.rating?.toFixed(1) || "4.5"}
                    </span>
                    {seller?.trades && (
                      <>
                        <span className="w-1 h-1 rounded-full bg-muted-foreground/50" />
                        <span>{seller.trades} trades</span>
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
                    className="rounded-xl bg-transparent hover:bg-primary/10 hover:border-primary/50"
                    onClick={(e) => {
                      e.stopPropagation()
                      onViewDetails?.(listing)
                    }}
                  >
                    View
                  </Button>
                  <Button
                    size="sm"
                    className="rounded-xl bg-primary hover:bg-primary/90"
                    onClick={(e) => {
                      e.stopPropagation()
                      onMakeOffer?.(listing)
                    }}
                  >
                    Offer
                  </Button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
        </motion.div>
      </Link>
    )
  }

  // Get FOMO indicators
  const valueLabel = getValueLabel(listing.value)
  const urgency = getUrgencyIndicator(listing.views || 0, listing.saves || 0, listing.createdAt)

  // Standard variant (default) - Enterprise 2026 Design
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.03 * index }}
      className={cn("group", className)}
    >
      <Card className="overflow-hidden bg-card border-border/50 hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5 transition-all duration-300 h-full">
       {/* Image Section */}
<div
  className="relative aspect-[4/3] overflow-hidden cursor-pointer"
  onClick={() => router.push(`/dashboard/listings/${listing.id}`)}
>
  <Image
    src={mainImage || "/placeholder.svg"}
    alt={listing.title}
    fill
    className="object-cover transition-transform duration-500 group-hover:scale-105"
  />
  <div className="absolute inset-0 bg-gradient-to-t from-background/90 via-background/20 to-transparent" />

  {/* Status Badges */}
  <div className="absolute top-2 left-2 flex flex-wrap gap-1 max-w-[70%]">
    {listing.featured && (
      <Badge className="bg-gradient-to-r from-amber-500 to-orange-500 text-white text-[10px] px-2 py-0.5 border-0 shadow-sm">
        <Star className="h-3 w-3 mr-1 fill-current" />
        Featured
      </Badge>
    )}
    {listing.hot && (
      <Badge className="bg-gradient-to-r from-orange-500 to-red-500 text-white text-[10px] px-2 py-0.5 border-0 shadow-sm">
        <Flame className="h-3 w-3 mr-1" />
        Hot
      </Badge>
    )}
    {listing.documentsVerified && (
      <Badge className="bg-gradient-to-r from-emerald-500 to-green-500 text-white text-[10px] px-2 py-0.5 border-0 shadow-sm">
        <FileCheck className="h-3 w-3 mr-1" />
        Verified
      </Badge>
    )}
  </div>

  {/* Save Button */}
  <motion.button
    whileHover={{ scale: 1.1 }}
    whileTap={{ scale: 0.9 }}
    onClick={handleSave}
    className={cn(
      "absolute top-2 right-2 w-9 h-9 rounded-xl flex items-center justify-center backdrop-blur-md transition-all shadow-sm",
      isSaved
        ? "bg-primary text-primary-foreground"
        : "bg-background/80 text-foreground hover:bg-primary hover:text-primary-foreground"
    )}
  >
    <Bookmark className={cn("h-4 w-4", isSaved && "fill-current")} />
  </motion.button>

  {/* Category Tag */}
  <Badge
    variant="outline"
    className={cn(
      "absolute bottom-2 right-2 text-[10px] backdrop-blur-sm",
      colors.bg,
      colors.text,
      colors.border
    )}
  >
    {listing.categoryName || listing.category}
  </Badge>
</div>


        {/* Content Section */}
        <CardContent className="p-4">
          {/* Title */}
      <h3 className="font-semibold text-foreground text-sm line-clamp-2 group-hover:text-primary transition-colors min-h-[40px]">
  {listing.title}
</h3>

          
          {/* Item Value - Barter terminology */}
          <div className="mt-2 p-2.5 rounded-xl bg-primary/5 border border-primary/10">
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-wide">Item Value</span>
              {valueLabel && (
                <Badge className={cn("text-[9px] px-1.5 py-0 border-0 bg-gradient-to-r", valueLabel.color, "text-white")}>
                  {valueLabel.label}
                </Badge>
              )}
            </div>
            <p className="text-xl font-bold text-primary mt-0.5">
              {formatNAD(listing.value)}
            </p>
          </div>

          {/* Trade For Tags */}
          {tradeItems.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-3">
              <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                <ArrowRightLeft className="h-3 w-3" />
                Trade for:
              </span>
              {tradeItems.slice(0, 2).map((item) => (
                <span key={item} className="text-[10px] px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
                  {item}
                </span>
              ))}
              {tradeItems.length > 2 && (
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
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
            <div className="flex items-center gap-2">
              <span className="flex items-center gap-1">
                <Eye className="h-3 w-3" />
                {listing.views || 0}
              </span>
              <span className="flex items-center gap-1">
                <Heart className="h-3 w-3" />
                {likesCount}
              </span>
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

          {/* Action Buttons - Enterprise CTA */}
          {showActions && (
            <div className="flex gap-2 mt-4">
             <Link href={`/dashboard/listings/${listing.id}`} className="flex-1">
  <Button
    variant="outline"
    size="sm"
    className="w-full h-9 rounded-xl text-xs font-medium bg-transparent hover:bg-muted"
  >
    <Eye className="h-3.5 w-3.5 mr-1.5" />
    View Trade
  </Button>
</Link>


              <Button
                size="sm"
                className="flex-1 h-9 rounded-xl text-xs font-medium bg-primary hover:bg-primary/90"
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
      </Card>
    </motion.div>
  )
}
