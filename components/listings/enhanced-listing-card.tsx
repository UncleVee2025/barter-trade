"use client"

import React from "react"

import { useState, useEffect, useCallback, useRef } from "react"
import Image from "next/image"
import { motion, AnimatePresence, useMotionValue, useSpring } from "framer-motion"
import {
  Heart,
  MessageCircle,
  Share2,
  Eye,
  MapPin,
  Clock,
  Star,
  BadgeCheck,
  MoreHorizontal,
  Bookmark,
  HandshakeIcon,
  Flame,
  Send,
  Copy,
  Check,
  Facebook,
  MessageSquare,
  Mail,
  Link2,
  TrendingUp,
  Users,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { cn } from "@/lib/utils"
import { toast } from "@/hooks/use-toast"
import { useAuth } from "@/contexts/auth-context"

export interface ListingData {
  id: string
  title: string
  description: string
  value: number
  category: string
  condition: string
  location: {
    region: string
    distance?: string
  }
  images: string[]
  seller: {
    id: string
    name: string
    avatar?: string
    rating: number
    trades: number
    verified: boolean
  }
  stats: {
    views: number
    likes: number
    comments: number
    saves: number
    shares?: number
  }
  postedAt: string
  featured?: boolean
  hot?: boolean
}

// Animated counter component for live statistics
function AnimatedCounter({ value, className }: { value: number; className?: string }) {
  const springValue = useSpring(0, { stiffness: 100, damping: 20 })
  const [displayValue, setDisplayValue] = useState(value)
  
  useEffect(() => {
    springValue.set(value)
    const unsubscribe = springValue.on("change", (latest) => {
      setDisplayValue(Math.round(latest))
    })
    return unsubscribe
  }, [value, springValue])
  
  return <span className={className}>{displayValue.toLocaleString()}</span>
}

// Format large numbers
function formatCount(num: number): string {
  if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`
  if (num >= 1000) return `${(num / 1000).toFixed(1)}K`
  return num.toString()
}

interface EnhancedListingCardProps {
  listing: ListingData
  onViewDetails?: (listing: ListingData) => void
  onMakeOffer?: (listing: ListingData) => void
  onComment?: (listing: ListingData) => void
  onMessage?: (listing: ListingData) => void
  variant?: "grid" | "list"
}

export function EnhancedListingCard({
  listing,
  onViewDetails,
  onMakeOffer,
  onComment,
  onMessage,
  variant = "grid",
}: EnhancedListingCardProps) {
  const { user } = useAuth()
  const [isLiked, setIsLiked] = useState(false)
  const [isSaved, setIsSaved] = useState(false)
  const [likesCount, setLikesCount] = useState(listing.stats.likes)
  const [viewsCount, setViewsCount] = useState(listing.stats.views)
  const [commentsCount, setCommentsCount] = useState(listing.stats.comments)
  const [savesCount, setSavesCount] = useState(listing.stats.saves)
  const [sharesCount, setSharesCount] = useState(listing.stats.shares || 0)
  const [isHovered, setIsHovered] = useState(false)
  const [showQuickComment, setShowQuickComment] = useState(false)
  const [quickComment, setQuickComment] = useState("")
  const [isLiking, setIsLiking] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [copiedLink, setCopiedLink] = useState(false)
  const [showShareMenu, setShowShareMenu] = useState(false)
  const [showLiveIndicator, setShowLiveIndicator] = useState(false)
  const lastFetchRef = useRef<number>(Date.now())
  
  // Poll for live statistics updates every 30 seconds when hovered
  const fetchStats = useCallback(async () => {
    try {
      const response = await fetch(`/api/listings/${listing.id}?statsOnly=true`)
      if (response.ok) {
        const data = await response.json()
        const newStats = data.listing || data
        
        // Animate if values changed
        if (newStats.views !== viewsCount || newStats.likes !== likesCount) {
          setShowLiveIndicator(true)
          setTimeout(() => setShowLiveIndicator(false), 2000)
        }
        
        setViewsCount(newStats.views || listing.stats.views)
        setLikesCount(newStats.likes || listing.stats.likes)
        setCommentsCount(newStats.commentsCount || listing.stats.comments)
        setSavesCount(newStats.saves || listing.stats.saves)
        setSharesCount(newStats.shares || listing.stats.shares || 0)
        setIsLiked(newStats.isLiked || false)
        setIsSaved(newStats.isSaved || false)
      }
    } catch {
      // Silent fail for stats polling
    }
  }, [listing.id, listing.stats, viewsCount, likesCount])
  
  // Initial fetch and polling
  useEffect(() => {
    // Initial fetch for like/save status
    if (user) {
      fetchStats()
    }
  }, [user, fetchStats])
  
  // Poll when hovered
  useEffect(() => {
    if (!isHovered) return
    
    const interval = setInterval(() => {
      const now = Date.now()
      if (now - lastFetchRef.current > 10000) { // Throttle to 10 seconds
        lastFetchRef.current = now
        fetchStats()
      }
    }, 15000) // Check every 15 seconds
    
    return () => clearInterval(interval)
  }, [isHovered, fetchStats])

  const handleLike = async (e: React.MouseEvent) => {
    e.stopPropagation()
    
    if (!user) {
      toast({ title: "Please log in to like listings" })
      return
    }
    
    if (isLiking) return
    setIsLiking(true)

    // Optimistic update
    const wasLiked = isLiked
    setIsLiked(!wasLiked)
    setLikesCount((prev) => wasLiked ? prev - 1 : prev + 1)

    try {
      const response = await fetch(`/api/listings/${listing.id}/like`, {
        method: "POST",
      })

      const data = await response.json()

      if (!response.ok) {
        // Revert on error
        setIsLiked(wasLiked)
        setLikesCount((prev) => wasLiked ? prev + 1 : prev - 1)
        throw new Error(data.error || "Failed to toggle like")
      }

      // Update with server values
      setIsLiked(data.liked)
      setLikesCount(data.likesCount)
      
      toast({
        title: data.liked ? "Added to likes" : "Removed from likes",
      })
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to toggle like"
      toast({ title: message, variant: "destructive" })
    } finally {
      setIsLiking(false)
    }
  }

  const handleSave = async (e: React.MouseEvent) => {
    e.stopPropagation()
    
    if (!user) {
      toast({ title: "Please log in to save listings" })
      return
    }
    
    if (isSaving) return
    setIsSaving(true)

    // Optimistic update
    const wasSaved = isSaved
    setIsSaved(!wasSaved)

    try {
      const response = await fetch("/api/saved-listings", {
        method: wasSaved ? "DELETE" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ listingId: listing.id }),
      })

      const data = await response.json()

      if (!response.ok) {
        setIsSaved(wasSaved)
        throw new Error(data.error || "Failed to save listing")
      }

      toast({
        title: wasSaved ? "Removed from saved" : "Saved for later",
      })
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to save listing"
      toast({ title: message, variant: "destructive" })
    } finally {
      setIsSaving(false)
    }
  }

  const handleShare = async (e: React.MouseEvent, platform: string = "copy") => {
    e.stopPropagation()
    
    const listingUrl = `${typeof window !== 'undefined' ? window.location.origin : ''}/listing/${listing.id}`
    const shareText = `Check out this listing: ${listing.title}`

    // Record share in database
    try {
      await fetch(`/api/listings/${listing.id}/share`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ platform }),
      })
      setSharesCount((prev) => prev + 1)
    } catch {
      // Silently fail share tracking
    }

    switch (platform) {
      case "whatsapp":
        window.open(`https://wa.me/?text=${encodeURIComponent(shareText + " " + listingUrl)}`, "_blank")
        break
      case "facebook":
        window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(listingUrl)}`, "_blank")
        break
      case "twitter":
        window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(listingUrl)}`, "_blank")
        break
      case "email":
        window.open(`mailto:?subject=${encodeURIComponent(listing.title)}&body=${encodeURIComponent(shareText + "\n\n" + listingUrl)}`)
        break
      default:
        await navigator.clipboard.writeText(listingUrl)
        setCopiedLink(true)
        setTimeout(() => setCopiedLink(false), 2000)
        toast({ title: "Link copied to clipboard" })
    }
    
    setShowShareMenu(false)
  }

  const [isSubmittingComment, setIsSubmittingComment] = useState(false)
  
  const handleQuickComment = async (e: React.FormEvent) => {
    e.preventDefault()
    e.stopPropagation()
    
    if (!quickComment.trim()) return
    
    if (!user) {
      toast({ title: "Please log in to comment" })
      return
    }
    
    setIsSubmittingComment(true)
    
    try {
      const response = await fetch("/api/comments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          listingId: listing.id,
          content: quickComment.trim(),
        }),
      })
      
      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(data.error || "Failed to post comment")
      }
      
      setCommentsCount((prev) => prev + 1)
      setQuickComment("")
      setShowQuickComment(false)
      toast({
        title: "Comment posted",
        description: "Your comment has been posted successfully",
      })
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to post comment"
      toast({ title: message, variant: "destructive" })
    } finally {
      setIsSubmittingComment(false)
    }
  }

  return (
    <motion.div
      className={cn(
        "group relative bg-card rounded-2xl border border-border/50 overflow-hidden",
        "transition-all duration-300 cursor-pointer",
        isHovered && "border-primary/50 shadow-xl shadow-primary/10",
        variant === "list" && "flex"
      )}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -4 }}
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
      onClick={() => onViewDetails?.(listing)}
    >
      {/* Image Container */}
      <div
        className={cn(
          "relative overflow-hidden",
          variant === "grid" ? "aspect-[4/3]" : "w-48 md:w-64 flex-shrink-0"
        )}
      >
        <Image
          src={listing.images[0] || "/placeholder.svg"}
          alt={listing.title}
          fill
          className="object-cover transition-transform duration-500 group-hover:scale-110"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />

        {/* Top Badges */}
        <div className="absolute top-3 left-3 flex flex-wrap gap-2">
          {listing.featured && (
            <Badge className="bg-gradient-to-r from-primary to-amber-500 text-white border-0 shadow-lg text-xs">
              <Star className="w-3 h-3 mr-1 fill-current" />
              Featured
            </Badge>
          )}
          {listing.hot && (
            <Badge className="bg-gradient-to-r from-rose-500 to-orange-500 text-white border-0 shadow-lg text-xs animate-pulse">
              <Flame className="w-3 h-3 mr-1 fill-current" />
              Hot
            </Badge>
          )}
        </div>

        {/* Top Right Actions */}
        <div className="absolute top-3 right-3 flex flex-col gap-2">
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={handleSave}
            className={cn(
              "w-9 h-9 rounded-xl flex items-center justify-center backdrop-blur-md transition-all",
              isSaved
                ? "bg-primary text-primary-foreground"
                : "bg-black/40 text-white hover:bg-black/60"
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
                className="w-9 h-9 rounded-xl flex items-center justify-center backdrop-blur-md bg-black/40 text-white hover:bg-black/60 transition-all"
              >
                <MoreHorizontal className="h-4 w-4" />
              </motion.button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem onClick={handleShare}>
                <Share2 className="h-4 w-4 mr-2" />
                Share listing
              </DropdownMenuItem>
              <DropdownMenuItem>Report listing</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Bottom Stats Overlay */}
        <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-black/50 backdrop-blur-md text-white text-xs">
              <MapPin className="h-3 w-3" />
              {listing.location.distance || listing.location.region}
            </div>
            <motion.div 
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-black/50 backdrop-blur-md text-white text-xs"
              animate={showLiveIndicator ? { scale: [1, 1.1, 1] } : {}}
              transition={{ duration: 0.3 }}
            >
              <Eye className="h-3 w-3" />
              <AnimatedCounter value={viewsCount} />
              {showLiveIndicator && (
                <motion.span
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0 }}
                  className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse"
                />
              )}
            </motion.div>
          </div>
          {listing.condition !== "N/A" && (
            <Badge variant="secondary" className="bg-black/50 backdrop-blur-md text-white border-0 text-xs">
              {listing.condition}
            </Badge>
          )}
        </div>
      </div>

      {/* Content */}
      <div className={cn("flex-1 flex flex-col", variant === "grid" ? "p-4" : "p-4 md:p-5")}>
        {/* Category & Time */}
        <div className="flex items-center justify-between mb-2">
          <Badge variant="outline" className="text-xs bg-muted/50">
            {listing.category}
          </Badge>
          <span className="text-xs text-muted-foreground flex items-center gap-1">
            <Clock className="h-3 w-3" />
            {listing.postedAt}
          </span>
        </div>

        {/* Title */}
        <h3 className="font-semibold text-foreground text-base md:text-lg leading-tight mb-1 line-clamp-2 group-hover:text-primary transition-colors">
          {listing.title}
        </h3>

        {/* Description - only in list view */}
        {variant === "list" && (
          <p className="text-sm text-muted-foreground line-clamp-2 mb-2 hidden md:block">
            {listing.description}
          </p>
        )}

        {/* Price */}
        <p className="text-xl md:text-2xl font-bold text-primary mb-3">
          N${listing.value.toLocaleString()}
          <span className="text-xs font-normal text-muted-foreground ml-2">or trade</span>
        </p>

        {/* Seller Info */}
        <div className="flex items-center gap-3 py-3 border-t border-border/50">
          <Avatar className="h-9 w-9">
            <AvatarImage src={listing.seller.avatar || "/placeholder.svg"} alt={listing.seller.name} />
            <AvatarFallback className="bg-gradient-to-br from-primary to-amber-500 text-white text-sm font-semibold">
              {listing.seller.name.charAt(0)}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="font-medium text-foreground text-sm truncate">
                {listing.seller.name}
              </span>
              {listing.seller.verified && (
                <BadgeCheck className="h-4 w-4 text-blue-500 flex-shrink-0" />
              )}
            </div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <span className="flex items-center gap-0.5">
                <Star className="h-3 w-3 text-amber-500 fill-current" />
                {listing.seller.rating}
              </span>
              <span className="w-1 h-1 rounded-full bg-muted-foreground/50" />
              <span>{listing.seller.trades} trades</span>
            </div>
          </div>
        </div>

        {/* Social Actions Bar */}
        <div className="flex items-center justify-between pt-3 border-t border-border/50 mt-auto">
          {/* Left: Like, Comment, Share */}
          <div className="flex items-center gap-1">
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={handleLike}
              disabled={isLiking}
              className={cn(
                "flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium transition-all",
                isLiked
                  ? "bg-rose-500/10 text-rose-500"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground",
                isLiking && "opacity-50 cursor-not-allowed"
              )}
            >
              <motion.span
                animate={isLiked ? { scale: [1, 1.3, 1] } : {}}
                transition={{ duration: 0.3 }}
              >
                <Heart className={cn("h-4 w-4", isLiked && "fill-current")} />
              </motion.span>
              <AnimatedCounter value={likesCount} />
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={(e) => {
                e.stopPropagation()
                setShowQuickComment(!showQuickComment)
              }}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground transition-all"
            >
              <MessageCircle className="h-4 w-4" />
              <AnimatedCounter value={commentsCount} />
            </motion.button>

<DropdownMenu open={showShareMenu} onOpenChange={setShowShareMenu}>
  <DropdownMenuTrigger asChild>
    <motion.button
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.9 }}
      onClick={(e) => e.stopPropagation()}
      className="flex items-center gap-1.5 px-2 py-2 rounded-xl text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground transition-all"
    >
      <Share2 className="h-4 w-4" />
      {sharesCount > 0 && <span className="text-xs">{sharesCount}</span>}
    </motion.button>
  </DropdownMenuTrigger>
  <DropdownMenuContent align="end" className="w-48">
    <DropdownMenuItem onClick={(e) => handleShare(e as unknown as React.MouseEvent, "copy")}>
      {copiedLink ? <Check className="h-4 w-4 mr-2 text-green-500" /> : <Link2 className="h-4 w-4 mr-2" />}
      {copiedLink ? "Copied!" : "Copy Link"}
    </DropdownMenuItem>
    <DropdownMenuSeparator />
    <DropdownMenuItem onClick={(e) => handleShare(e as unknown as React.MouseEvent, "whatsapp")}>
      <MessageSquare className="h-4 w-4 mr-2" />
      WhatsApp
    </DropdownMenuItem>
    <DropdownMenuItem onClick={(e) => handleShare(e as unknown as React.MouseEvent, "facebook")}>
      <Facebook className="h-4 w-4 mr-2" />
      Facebook
    </DropdownMenuItem>
    <DropdownMenuItem onClick={(e) => handleShare(e as unknown as React.MouseEvent, "twitter")}>
      <Share2 className="h-4 w-4 mr-2" />
      Twitter / X
    </DropdownMenuItem>
    <DropdownMenuItem onClick={(e) => handleShare(e as unknown as React.MouseEvent, "email")}>
      <Mail className="h-4 w-4 mr-2" />
      Email
    </DropdownMenuItem>
  </DropdownMenuContent>
</DropdownMenu>
  </div>

          {/* Right: Make Offer Button */}
          <Button
            size="sm"
            onClick={(e) => {
              e.stopPropagation()
              onMakeOffer?.(listing)
            }}
            className="rounded-xl bg-gradient-to-r from-primary to-amber-500 hover:from-primary/90 hover:to-amber-500/90 text-white shadow-lg shadow-primary/20"
          >
            <HandshakeIcon className="h-4 w-4 mr-1.5" />
            Make Offer
          </Button>
        </div>

        {/* Quick Comment Input */}
        <AnimatePresence>
          {showQuickComment && (
            <motion.form
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="mt-3 overflow-hidden"
              onSubmit={handleQuickComment}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Write a comment..."
                  value={quickComment}
                  onChange={(e) => setQuickComment(e.target.value)}
                  className="flex-1 px-4 py-2 rounded-xl bg-muted/50 border border-border/50 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                />
  <Button
  type="submit"
  size="sm"
  className="rounded-xl"
  disabled={!quickComment.trim() || isSubmittingComment}
  >
  {isSubmittingComment ? (
    <motion.div
      animate={{ rotate: 360 }}
      transition={{ duration: 1, repeat: Number.POSITIVE_INFINITY, ease: "linear" }}
      className="h-4 w-4 border-2 border-current border-t-transparent rounded-full"
    />
  ) : (
    <Send className="h-4 w-4" />
  )}
  </Button>
              </div>
            </motion.form>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  )
}
