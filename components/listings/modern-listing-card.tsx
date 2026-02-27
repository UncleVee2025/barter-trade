"use client"

import React from "react"
import { useState, useCallback } from "react"
import Image from "next/image"
import { motion, AnimatePresence } from "framer-motion"
import {
  Heart,
  MessageCircle,
  Share2,
  Eye,
  MapPin,
  Star,
  BadgeCheck,
  Flame,
  ArrowRight,
  Bookmark,
  MoreHorizontal,
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

export interface ModernListingData {
  id: string
  title: string
  description?: string
  value: number
  tradeFor?: string[]
  category: string
  condition?: string
  region: string
  town?: string
  images: string[]
  image?: string
  views: number
  viewingNow?: number
  saves?: number
  likes?: number
  comments?: number
  hot?: boolean
  featured?: boolean
  priceDropped?: boolean
  timeLeft?: string
  createdAt?: string
  seller: {
    id?: string
    name: string
    avatar?: string | null
    gender?: "male" | "female" | "other"
    rating: number
    trades?: number
    verified: boolean
  }
}

interface ModernListingCardProps {
  listing: ModernListingData
  onViewDetails?: (listing: ModernListingData) => void
  onMakeOffer?: (listing: ModernListingData) => void
  variant?: "compact" | "standard" | "featured"
  showActions?: boolean
  className?: string
}

export function ModernListingCard({
  listing,
  onViewDetails,
  onMakeOffer,
  variant = "standard",
  showActions = true,
  className,
}: ModernListingCardProps) {
  const { user } = useAuth()
  const [isLiked, setIsLiked] = useState(false)
  const [isSaved, setIsSaved] = useState(false)
  const [likesCount, setLikesCount] = useState(listing.likes || 0)
  const [isLoading, setIsLoading] = useState(false)

  const handleLike = useCallback(async (e: React.MouseEvent) => {
    e.stopPropagation()
    
    if (!user) {
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
  }, [user, isLoading, isLiked, listing.id])

  const handleSave = useCallback(async (e: React.MouseEvent) => {
    e.stopPropagation()
    
    if (!user) {
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
  }, [user, isSaved, listing.id])

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
        // User cancelled or share failed
      }
    } else {
      await navigator.clipboard.writeText(shareUrl)
      toast({ title: "Link copied to clipboard" })
    }
  }, [listing.id, listing.title])

  const mainImage = listing.image || listing.images?.[0]

  // Compact variant for smaller grids
  if (variant === "compact") {
    return (
      <motion.div
        whileHover={{ y: -4 }}
        whileTap={{ scale: 0.98 }}
        className={cn("cursor-pointer", className)}
        onClick={() => onViewDetails?.(listing)}
      >
        <Card className="overflow-hidden bg-card/50 border-border/50 hover:border-primary/30 transition-all duration-300 h-full">
          <div className="relative aspect-square overflow-hidden">
            <Image
              src={mainImage || "/placeholder.svg"}
              alt={listing.title}
              fill
              className="object-cover transition-transform duration-500 hover:scale-110"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
            
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
                isSaved ? "bg-primary text-white" : "bg-black/40 text-white hover:bg-black/60"
              )}
            >
              <Bookmark className={cn("h-3.5 w-3.5", isSaved && "fill-current")} />
            </motion.button>

            <div className="absolute bottom-2 left-2 right-2">
              <p className="text-white font-bold text-lg">N${listing.value.toLocaleString()}</p>
            </div>
          </div>
          
          <CardContent className="p-2.5">
            <p className="font-medium text-sm text-foreground truncate">{listing.title}</p>
            <p className="text-xs text-muted-foreground truncate mt-0.5">{listing.region}</p>
          </CardContent>
        </Card>
      </motion.div>
    )
  }

  // Featured variant for highlighted listings
  if (variant === "featured") {
    return (
      <motion.div
        whileHover={{ y: -6, scale: 1.01 }}
        className={cn("cursor-pointer", className)}
        onClick={() => onViewDetails?.(listing)}
      >
        <Card className="overflow-hidden bg-gradient-to-br from-card to-secondary border-primary/20 hover:border-primary/50 transition-all duration-500 shadow-lg hover:shadow-2xl hover:shadow-primary/10">
          <div className="relative aspect-[16/10] overflow-hidden">
            <Image
              src={mainImage || "/placeholder.svg"}
              alt={listing.title}
              fill
              className="object-cover transition-transform duration-700 hover:scale-105"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
            
            {/* Featured badge */}
            <div className="absolute top-4 left-4 flex gap-2">
              <Badge className="bg-gradient-to-r from-gold to-amber-500 text-black font-semibold text-xs px-3 py-1 border-0 shadow-lg">
                <Star className="h-3.5 w-3.5 mr-1 fill-current" />
                Featured
              </Badge>
              {listing.hot && (
                <Badge className="bg-gradient-to-r from-orange-500 to-red-500 text-white text-xs px-2.5 py-1 border-0">
                  <Flame className="h-3.5 w-3.5 mr-1" />
                  Trending
                </Badge>
              )}
            </div>

            {/* Action buttons */}
            <div className="absolute top-4 right-4 flex gap-2">
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={handleSave}
                className={cn(
                  "w-10 h-10 rounded-xl flex items-center justify-center backdrop-blur-md transition-all shadow-lg",
                  isSaved ? "bg-primary text-white" : "bg-white/20 text-white hover:bg-white/30"
                )}
              >
                <Bookmark className={cn("h-5 w-5", isSaved && "fill-current")} />
              </motion.button>
            </div>

            {/* Live viewers */}
            {listing.viewingNow && listing.viewingNow > 0 && (
              <div className="absolute bottom-4 left-4 flex items-center gap-2 px-3 py-1.5 rounded-full bg-black/60 backdrop-blur-md">
                <span className="relative flex h-2.5 w-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500" />
                </span>
                <span className="text-white text-sm font-medium">
                  {listing.viewingNow} viewing now
                </span>
              </div>
            )}

            {/* Bottom info */}
            <div className="absolute bottom-4 right-4 flex items-center gap-3 text-white/80 text-sm">
              <span className="flex items-center gap-1">
                <Eye className="h-4 w-4" />
                {listing.views}
              </span>
              <span className="flex items-center gap-1">
                <Heart className="h-4 w-4" />
                {likesCount}
              </span>
            </div>
          </div>
          
          <CardContent className="p-5">
            <div className="flex items-start justify-between gap-4 mb-3">
              <div className="min-w-0 flex-1">
                <h3 className="font-semibold text-lg text-foreground truncate hover:text-primary transition-colors">
                  {listing.title}
                </h3>
                <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                  <MapPin className="h-3.5 w-3.5" />
                  {listing.town ? `${listing.town}, ${listing.region}` : listing.region}
                </p>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold text-primary">N${listing.value.toLocaleString()}</p>
                <p className="text-xs text-muted-foreground">or trade</p>
              </div>
            </div>

            {/* Trade preferences */}
            {listing.tradeFor && listing.tradeFor.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mb-4">
                <span className="text-xs text-muted-foreground">Trade for:</span>
                {listing.tradeFor.slice(0, 3).map((item) => (
                  <Badge key={item} variant="secondary" className="text-[10px] bg-muted/50">
                    {item}
                  </Badge>
                ))}
                {listing.tradeFor.length > 3 && (
                  <Badge variant="secondary" className="text-[10px] bg-muted/50">
                    +{listing.tradeFor.length - 3}
                  </Badge>
                )}
              </div>
            )}

            {/* Seller info and actions */}
            <div className="flex items-center justify-between pt-4 border-t border-border/50">
              <div className="flex items-center gap-3">
                <UserAvatar
                  src={listing.seller.avatar}
                  name={listing.seller.name}
                  gender={listing.seller.gender}
                  size="md"
                  showVerifiedBadge
                  isVerified={listing.seller.verified}
                />
                <div>
                  <p className="font-medium text-sm text-foreground">{listing.seller.name}</p>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span className="flex items-center gap-0.5 text-amber-400">
                      <Star className="h-3 w-3 fill-current" />
                      {listing.seller.rating}
                    </span>
                    {listing.seller.trades && (
                      <>
                        <span className="w-1 h-1 rounded-full bg-muted-foreground/50" />
                        <span>{listing.seller.trades} trades</span>
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
                    className="rounded-xl bg-transparent"
                    onClick={(e) => {
                      e.stopPropagation()
                      onViewDetails?.(listing)
                    }}
                  >
                    View Details
                  </Button>
                  <Button
                    size="sm"
                    className="rounded-xl"
                    onClick={(e) => {
                      e.stopPropagation()
                      onMakeOffer?.(listing)
                    }}
                  >
                    Make Offer
                    <ArrowRight className="h-4 w-4 ml-1" />
                  </Button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </motion.div>
    )
  }

  // Standard variant (default)
  return (
    <motion.div
      whileHover={{ y: -4 }}
      whileTap={{ scale: 0.98 }}
      className={cn("cursor-pointer group", className)}
      onClick={() => onViewDetails?.(listing)}
    >
      <Card className="overflow-hidden bg-card/50 border-border/50 hover:border-primary/30 transition-all duration-300 h-full">
        <div className="relative aspect-[4/3] overflow-hidden">
          <Image
            src={mainImage || "/placeholder.svg"}
            alt={listing.title}
            fill
            className="object-cover transition-transform duration-500 group-hover:scale-110"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />

          {/* Badges */}
          <div className="absolute top-2 left-2 flex flex-wrap gap-1">
            {listing.hot && (
              <Badge className="bg-gradient-to-r from-orange-500 to-red-500 text-white text-[10px] px-2 py-0.5 border-0">
                <Flame className="h-3 w-3 mr-1" />
                Hot
              </Badge>
            )}
            {listing.priceDropped && (
              <Badge className="bg-emerald-500 text-white text-[10px] px-2 py-0.5 border-0">
                Price Drop
              </Badge>
            )}
          </div>

          {/* Action Buttons - Always visible on mobile, hover on desktop */}
          <div className="absolute top-2 right-2 flex gap-1 sm:opacity-0 sm:group-hover:opacity-100 transition-all">
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={handleSave}
              className={cn(
                "w-8 h-8 rounded-xl flex items-center justify-center backdrop-blur-sm transition-all",
                isSaved ? "bg-primary text-white" : "bg-black/40 text-white hover:bg-primary"
              )}
            >
              <Bookmark className={cn("h-4 w-4", isSaved && "fill-current")} />
            </motion.button>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={(e) => e.stopPropagation()}
                  className="w-8 h-8 rounded-xl flex items-center justify-center backdrop-blur-sm bg-black/40 text-white hover:bg-black/60 transition-all"
                >
                  <MoreHorizontal className="h-4 w-4" />
                </motion.button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="rounded-xl">
                <DropdownMenuItem onClick={handleShare}>
                  <Share2 className="h-4 w-4 mr-2" />
                  Share
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleLike}>
                  <Heart className={cn("h-4 w-4 mr-2", isLiked && "fill-current text-red-500")} />
                  {isLiked ? "Unlike" : "Like"}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Live Viewers - FOMO */}
          {listing.viewingNow && listing.viewingNow > 0 && (
            <div className="absolute bottom-2 left-2 flex items-center gap-1.5 px-2 py-1 rounded-lg bg-black/60 backdrop-blur-sm">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500" />
              </span>
              <span className="text-white text-[10px] font-medium">
                {listing.viewingNow} viewing
              </span>
            </div>
          )}

          {/* Category Tag */}
          <span className="absolute bottom-2 right-2 text-[10px] text-white/80 px-2 py-0.5 rounded-md bg-black/40 backdrop-blur-sm">
            {listing.category}
          </span>
        </div>

        <CardContent className="p-3">
          <h3 className="font-medium text-foreground truncate text-sm group-hover:text-primary transition-colors">
            {listing.title}
          </h3>
          
          <div className="flex items-baseline gap-2 mt-1">
            <p className="text-lg font-bold text-primary">
              N${listing.value.toLocaleString()}
            </p>
            <span className="text-[10px] text-muted-foreground">or trade</span>
          </div>

          {/* Trade For Tags */}
          {listing.tradeFor && listing.tradeFor.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-2">
              {listing.tradeFor.slice(0, 2).map((item) => (
                <span key={item} className="text-[9px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground">
                  {item}
                </span>
              ))}
              {listing.tradeFor.length > 2 && (
                <span className="text-[9px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground">
                  +{listing.tradeFor.length - 2}
                </span>
              )}
            </div>
          )}

          {/* Seller Info */}
          <div className="flex items-center justify-between mt-3 pt-2 border-t border-border/50">
            <div className="flex items-center gap-1.5">
              <UserAvatar
                src={listing.seller.avatar}
                name={listing.seller.name}
                gender={listing.seller.gender}
                size="xs"
              />
              <span className="text-xs text-muted-foreground truncate max-w-[60px]">
                {listing.seller.name.split(" ")[0]}
              </span>
              {listing.seller.verified && (
                <BadgeCheck className="h-3 w-3 text-blue-500 flex-shrink-0" />
              )}
            </div>
            <div className="flex items-center gap-0.5 text-amber-400">
              <Star className="h-3 w-3 fill-current" />
              <span className="text-[10px] font-medium">{listing.seller.rating}</span>
            </div>
          </div>

          {/* Engagement Stats */}
          <div className="flex items-center justify-between mt-2 pt-2 border-t border-border/30 text-[10px] text-muted-foreground">
            <span className="flex items-center gap-1">
              <Eye className="h-3 w-3" />
              {listing.views}
            </span>
            <span className="flex items-center gap-1">
              <Heart className={cn("h-3 w-3", isLiked && "fill-current text-red-500")} />
              {likesCount}
            </span>
            <span className="flex items-center gap-1">
              <MessageCircle className="h-3 w-3" />
              {listing.comments || 0}
            </span>
          </div>

          {/* Action Buttons - Consistent across all views */}
          {showActions && (
            <div className="flex gap-2 mt-3">
              <Button
                variant="outline"
                size="sm"
                className="flex-1 rounded-xl text-xs h-8 bg-transparent"
                onClick={(e) => {
                  e.stopPropagation()
                  onViewDetails?.(listing)
                }}
              >
                View Details
              </Button>
              <Button
                size="sm"
                className="flex-1 rounded-xl text-xs h-8"
                onClick={(e) => {
                  e.stopPropagation()
                  onMakeOffer?.(listing)
                }}
              >
                Make Offer
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  )
}

// Grid wrapper for listings
interface ListingGridProps {
  listings: ModernListingData[]
  onViewDetails?: (listing: ModernListingData) => void
  onMakeOffer?: (listing: ModernListingData) => void
  columns?: 2 | 3 | 4
  variant?: "compact" | "standard" | "featured"
  showActions?: boolean
  className?: string
}

export function ListingGrid({
  listings,
  onViewDetails,
  onMakeOffer,
  columns = 2,
  variant = "standard",
  showActions = true,
  className,
}: ListingGridProps) {
  const gridClasses = {
    2: "grid-cols-2",
    3: "grid-cols-2 lg:grid-cols-3",
    4: "grid-cols-2 lg:grid-cols-4",
  }

  return (
    <div className={cn("grid gap-4", gridClasses[columns], className)}>
      {listings.map((listing, index) => (
        <motion.div
          key={listing.id}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.05 }}
        >
          <ModernListingCard
            listing={listing}
            onViewDetails={onViewDetails}
            onMakeOffer={onMakeOffer}
            variant={variant}
            showActions={showActions}
          />
        </motion.div>
      ))}
    </div>
  )
}
