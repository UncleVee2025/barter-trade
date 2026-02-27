"use client"

import { useState, useEffect, useRef } from "react"
import Image from "next/image"
import Link from "next/link"
import { motion, AnimatePresence } from "framer-motion"
import {
  X,
  Heart,
  Share2,
  MapPin,
  Clock,
  Star,
  BadgeCheck,
  Flame,
  Eye,
  MessageCircle,
  ChevronLeft,
  ChevronRight,
  Bookmark,
  Flag,
  ExternalLink,
  Send,
  Users,
  Shield,
  Calendar,
  Package,
  ArrowRight,
  Copy,
  Check,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent } from "@/components/ui/dialog"
import { Drawer, DrawerContent, DrawerClose } from "@/components/ui/drawer"
import { UserAvatar } from "@/components/ui/user-avatar"
import { cn } from "@/lib/utils"
import { toast } from "@/hooks/use-toast"
import { useAuth } from "@/contexts/auth-context"
import { useIsMobile } from "@/hooks/use-mobile"

interface ListingDetailData {
  id: string
  title: string
  description: string
  value: number
  tradeFor?: string[]
  category: string
  condition: string
  region: string
  town?: string
  images: string[]
  views: number
  viewingNow?: number
  saves?: number
  likes?: number
  comments?: number
  hot?: boolean
  featured?: boolean
  createdAt: string
  seller: {
    id: string
    name: string
    avatar?: string | null
    gender?: "male" | "female" | "other"
    rating: number
    trades: number
    verified: boolean
    memberSince?: string
    responseTime?: string
  }
}

interface ModernListingModalProps {
  listing: ListingDetailData | null
  isOpen: boolean
  onClose: () => void
  onMakeOffer?: (listing: ListingDetailData) => void
  onMessage?: (listing: ListingDetailData) => void
}

export function ModernListingModal({
  listing,
  isOpen,
  onClose,
  onMakeOffer,
  onMessage,
}: ModernListingModalProps) {
  const { user } = useAuth()
  const isMobile = useIsMobile()
  const [currentImageIndex, setCurrentImageIndex] = useState(0)
  const [isLiked, setIsLiked] = useState(false)
  const [isSaved, setIsSaved] = useState(false)
  const [showComments, setShowComments] = useState(false)
  const [newComment, setNewComment] = useState("")
  const [copiedLink, setCopiedLink] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)

  // Reset state when listing changes
  useEffect(() => {
    setCurrentImageIndex(0)
    setShowComments(false)
    setNewComment("")
  }, [listing?.id])

  if (!listing) return null

  const nextImage = () => {
    setCurrentImageIndex((prev) => (prev + 1) % listing.images.length)
  }

  const prevImage = () => {
    setCurrentImageIndex((prev) => (prev - 1 + listing.images.length) % listing.images.length)
  }

  const handleLike = async () => {
    if (!user) {
      toast({ title: "Please log in to like listings" })
      return
    }
    
    setIsLiked(!isLiked)
    
    try {
      await fetch(`/api/listings/${listing.id}/like`, { method: "POST" })
    } catch {
      setIsLiked(isLiked)
    }
  }

  const handleSave = async () => {
    if (!user) {
      toast({ title: "Please log in to save listings" })
      return
    }
    
    const wasSaved = isSaved
    setIsSaved(!wasSaved)

    try {
      await fetch("/api/saved-listings", {
        method: wasSaved ? "DELETE" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ listingId: listing.id }),
      })
      toast({ title: wasSaved ? "Removed from saved" : "Saved for later" })
    } catch {
      setIsSaved(wasSaved)
    }
  }

  const handleShare = async () => {
    const url = `${window.location.origin}/listing/${listing.id}`
    
    if (navigator.share && isMobile) {
      try {
        await navigator.share({
          title: listing.title,
          text: `Check out this listing: ${listing.title}`,
          url,
        })
      } catch {
        // User cancelled
      }
    } else {
      await navigator.clipboard.writeText(url)
      setCopiedLink(true)
      setTimeout(() => setCopiedLink(false), 2000)
      toast({ title: "Link copied to clipboard" })
    }
    
    // Track share
    try {
      await fetch(`/api/listings/${listing.id}/share`, { method: "POST" })
    } catch {
      // Silent fail
    }
  }

  const handleComment = async () => {
    if (!newComment.trim() || !user) return

    try {
      const response = await fetch("/api/comments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ listingId: listing.id, content: newComment }),
      })

      if (response.ok) {
        setNewComment("")
        toast({ title: "Comment posted" })
      }
    } catch {
      toast({ title: "Failed to post comment", variant: "destructive" })
    }
  }

  // Content component shared between dialog and drawer
  const ModalContent = () => (
    <div className="flex flex-col h-full max-h-[90vh] md:max-h-[85vh]">
      {/* Image Gallery */}
      <div className="relative aspect-[4/3] md:aspect-video bg-black flex-shrink-0">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentImageIndex}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0"
          >
            <Image
              src={listing.images[currentImageIndex] || "/placeholder.svg"}
              alt={listing.title}
              fill
              className="object-contain"
              priority
            />
          </motion.div>
        </AnimatePresence>

        {/* Gradient overlays */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-transparent to-black/50 pointer-events-none" />

        {/* Top bar */}
        <div className="absolute top-0 left-0 right-0 flex items-center justify-between p-4 z-10">
          <div className="flex flex-wrap items-center gap-2">
            {listing.featured && (
              <Badge className="bg-gradient-to-r from-primary to-amber-500 text-white border-0 shadow-lg shadow-primary/30">
                <Star className="h-3.5 w-3.5 mr-1 fill-current" />
                Featured
              </Badge>
            )}
            {listing.hot && (
              <Badge className="bg-gradient-to-r from-orange-500 to-red-500 text-white border-0 shadow-lg shadow-orange-500/30">
                <Flame className="h-3.5 w-3.5 mr-1" />
                Hot
              </Badge>
            )}
            {listing.viewingNow && listing.viewingNow > 0 && (
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-black/60 backdrop-blur-sm text-white text-xs shadow-md">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute h-full w-full rounded-full bg-red-400 opacity-75" />
                  <span className="relative rounded-full h-2 w-2 bg-red-500" />
                </span>
                {listing.viewingNow} viewing now
              </div>
            )}
          </div>
          
          <button
            onClick={onClose}
            className="w-10 h-10 rounded-xl bg-black/50 backdrop-blur-sm flex items-center justify-center text-white hover:bg-black/70 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Image navigation */}
        {listing.images.length > 1 && (
          <>
            <button
              onClick={prevImage}
              className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-xl bg-black/50 backdrop-blur-sm flex items-center justify-center text-white hover:bg-black/70 transition-colors z-10"
            >
              <ChevronLeft className="h-6 w-6" />
            </button>
            <button
              onClick={nextImage}
              className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-xl bg-black/50 backdrop-blur-sm flex items-center justify-center text-white hover:bg-black/70 transition-colors z-10"
            >
              <ChevronRight className="h-6 w-6" />
            </button>
          </>
        )}

        {/* Image indicators */}
        {listing.images.length > 1 && (
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-1.5 z-10">
            {listing.images.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentImageIndex(index)}
                className={cn(
                  "h-1.5 rounded-full transition-all",
                  index === currentImageIndex
                    ? "bg-white w-6"
                    : "bg-white/50 w-1.5 hover:bg-white/70"
                )}
              />
            ))}
          </div>
        )}

        {/* Thumbnail strip */}
        {listing.images.length > 1 && (
          <div className="absolute bottom-4 left-4 right-4 hidden md:flex gap-2 z-10">
            {listing.images.slice(0, 5).map((img, index) => (
              <button
                key={index}
                onClick={() => setCurrentImageIndex(index)}
                className={cn(
                  "w-16 h-12 rounded-lg overflow-hidden border-2 transition-all",
                  index === currentImageIndex
                    ? "border-white"
                    : "border-transparent opacity-60 hover:opacity-100"
                )}
              >
                <Image
                  src={img || "/placeholder.svg"}
                  alt=""
                  width={64}
                  height={48}
                  className="object-cover w-full h-full"
                />
              </button>
            ))}
            {listing.images.length > 5 && (
              <div className="w-16 h-12 rounded-lg bg-black/50 flex items-center justify-center text-white text-xs">
                +{listing.images.length - 5}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Scrollable Content */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto">
        <div className="p-4 md:p-6 space-y-5">
          {/* Header */}
          <div className="space-y-3">
            <div className="flex items-start justify-between gap-4">
              <div>
                <Badge variant="outline" className="mb-2 text-xs">
                  {listing.category}
                </Badge>
                <h2 className="text-xl md:text-2xl font-bold text-foreground leading-tight">
                  {listing.title}
                </h2>
              </div>
              <div className="text-right flex-shrink-0">
                <p className="text-2xl md:text-3xl font-bold text-primary">
                  N${listing.value.toLocaleString()}
                </p>
                <p className="text-xs text-muted-foreground">or trade</p>
              </div>
            </div>

            {/* Quick stats */}
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <span className="flex items-center gap-1">
                <Eye className="h-4 w-4" />
                {listing.views} views
              </span>
              <span className="flex items-center gap-1">
                <Heart className="h-4 w-4" />
                {listing.likes || 0} likes
              </span>
              <span className="flex items-center gap-1">
                <Clock className="h-4 w-4" />
                {listing.createdAt}
              </span>
            </div>
          </div>

          {/* Trade preferences */}
          {listing.tradeFor && listing.tradeFor.length > 0 && (
            <Card className="bg-secondary/30 border-border/50">
              <CardContent className="p-4">
                <h3 className="font-medium text-sm text-foreground mb-2 flex items-center gap-2">
                  <Package className="h-4 w-4 text-primary" />
                  Open to trade for
                </h3>
                <div className="flex flex-wrap gap-2">
                  {listing.tradeFor.map((item) => (
                    <Badge key={item} variant="secondary" className="text-xs">
                      {item}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Description */}
          <div>
            <h3 className="font-medium text-foreground mb-2">Description</h3>
            <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap">
              {listing.description}
            </p>
          </div>

          {/* Details grid */}
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 rounded-xl bg-secondary/30">
              <p className="text-xs text-muted-foreground">Condition</p>
              <p className="font-medium text-foreground">{listing.condition}</p>
            </div>
            <div className="p-3 rounded-xl bg-secondary/30">
              <p className="text-xs text-muted-foreground">Location</p>
              <p className="font-medium text-foreground flex items-center gap-1">
                <MapPin className="h-3.5 w-3.5" />
                {listing.town ? `${listing.town}, ${listing.region}` : listing.region}
              </p>
            </div>
          </div>

          {/* Seller Card */}
          <Card className="border-border/50">
            <CardContent className="p-4">
              <div className="flex items-start gap-4">
                <UserAvatar
                  src={listing.seller.avatar}
                  name={listing.seller.name}
                  gender={listing.seller.gender}
                  size="xl"
                  ring="primary"
                  showVerifiedBadge
                  isVerified={listing.seller.verified}
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h4 className="font-semibold text-foreground">{listing.seller.name}</h4>
                    {listing.seller.verified && (
                      <Badge className="bg-blue-500/10 text-blue-500 text-[10px] border-0">
                        <BadgeCheck className="h-3 w-3 mr-1" />
                        Verified
                      </Badge>
                    )}
                  </div>
                  
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1 text-amber-400">
                      <Star className="h-3.5 w-3.5 fill-current" />
                      {listing.seller.rating} rating
                    </span>
                    <span className="flex items-center gap-1">
                      <Users className="h-3.5 w-3.5" />
                      {listing.seller.trades} trades
                    </span>
                    {listing.seller.memberSince && (
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3.5 w-3.5" />
                        Member since {listing.seller.memberSince}
                      </span>
                    )}
                  </div>

                  {listing.seller.responseTime && (
                    <p className="text-xs text-emerald-400 mt-2 flex items-center gap-1">
                      <Clock className="h-3.5 w-3.5" />
                      Usually responds {listing.seller.responseTime}
                    </p>
                  )}
                </div>
              </div>

              <div className="flex gap-2 mt-4">
                <Button
                  variant="outline"
                  className="flex-1 rounded-xl bg-transparent"
                  asChild
                >
                  <Link href={`/users/${listing.seller.id}`}>
                    View Profile
                    <ExternalLink className="h-4 w-4 ml-2" />
                  </Link>
                </Button>
                <Button
                  variant="outline"
                  className="flex-1 rounded-xl bg-transparent"
                  onClick={() => onMessage?.(listing)}
                >
                  Message
                  <MessageCircle className="h-4 w-4 ml-2" />
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Comments section toggle */}
          <button
            onClick={() => setShowComments(!showComments)}
            className="w-full flex items-center justify-between p-4 rounded-xl bg-secondary/30 hover:bg-secondary/50 transition-colors"
          >
            <span className="flex items-center gap-2 font-medium text-foreground">
              <MessageCircle className="h-5 w-5" />
              Comments ({listing.comments || 0})
            </span>
            <ChevronRight className={cn(
              "h-5 w-5 text-muted-foreground transition-transform",
              showComments && "rotate-90"
            )} />
          </button>

          {/* Comments expanded */}
          <AnimatePresence>
            {showComments && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="space-y-3 overflow-hidden"
              >
                {/* Comment input */}
                <div className="flex gap-2">
                  <Textarea
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    placeholder="Write a comment..."
                    className="min-h-[60px] rounded-xl resize-none"
                  />
                  <Button
                    onClick={handleComment}
                    disabled={!newComment.trim()}
                    className="rounded-xl px-4"
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
                
                {/* Comment placeholder */}
                <div className="text-center py-6 text-muted-foreground text-sm">
                  No comments yet. Be the first to comment!
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Safety notice */}
          <Card className="bg-amber-500/10 border-amber-500/20">
            <CardContent className="p-4 flex items-start gap-3">
              <Shield className="h-5 w-5 text-amber-500 flex-shrink-0 mt-0.5" />
              <div className="text-sm">
                <p className="font-medium text-amber-400">Trade Safely</p>
                <p className="text-muted-foreground">
                  Always meet in public places and verify items before trading.
                  Use our escrow service for high-value trades.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Report button */}
          <button className="flex items-center gap-2 text-sm text-muted-foreground hover:text-destructive transition-colors">
            <Flag className="h-4 w-4" />
            Report this listing
          </button>
        </div>
      </div>

      {/* Sticky Footer - improved for mobile */}
      <div className="flex-shrink-0 p-3 sm:p-4 border-t border-border bg-background/95 backdrop-blur-xl safe-area-bottom">
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="flex gap-1.5 sm:gap-2">
            <Button
              variant="outline"
              size="icon"
              onClick={handleSave}
              className={cn(
                "rounded-xl w-10 h-10 sm:w-12 sm:h-12 bg-transparent",
                isSaved && "bg-primary/10 border-primary text-primary"
              )}
            >
              <Bookmark className={cn("h-4 w-4 sm:h-5 sm:w-5", isSaved && "fill-current")} />
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={handleLike}
              className={cn(
                "rounded-xl w-10 h-10 sm:w-12 sm:h-12 bg-transparent",
                isLiked && "bg-rose-500/10 border-rose-500 text-rose-500"
              )}
            >
              <Heart className={cn("h-4 w-4 sm:h-5 sm:w-5", isLiked && "fill-current")} />
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={handleShare}
              className="rounded-xl w-10 h-10 sm:w-12 sm:h-12 bg-transparent"
            >
              {copiedLink ? (
                <Check className="h-4 w-4 sm:h-5 sm:w-5 text-emerald-500" />
              ) : (
                <Share2 className="h-4 w-4 sm:h-5 sm:w-5" />
              )}
            </Button>
          </div>
          
          <Button
            className="flex-1 h-10 sm:h-12 rounded-xl text-sm sm:text-base font-semibold"
            onClick={() => onMakeOffer?.(listing)}
          >
            Make an Offer
            <ArrowRight className="h-4 w-4 sm:h-5 sm:w-5 ml-1.5 sm:ml-2" />
          </Button>
        </div>
      </div>
    </div>
  )

  // Render as drawer on mobile, dialog on desktop
  if (isMobile) {
    return (
      <Drawer open={isOpen} onOpenChange={(open) => !open && onClose()}>
        <DrawerContent className="max-h-[92vh] overflow-hidden">
          <div className="w-12 h-1.5 bg-muted-foreground/30 rounded-full mx-auto mt-3 mb-2" />
          <ModalContent />
        </DrawerContent>
      </Drawer>
    )
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-3xl p-0 overflow-hidden max-h-[90vh] gap-0">
        <ModalContent />
      </DialogContent>
    </Dialog>
  )
}
