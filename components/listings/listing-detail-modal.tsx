"use client"

import React from "react"

import { useState, useRef, useEffect, useCallback } from "react"
import Image from "next/image"
import { motion, AnimatePresence } from "framer-motion"
import useSWR, { mutate } from "swr"
import {
  X,
  Heart,
  MessageCircle,
  Share2,
  Eye,
  MapPin,
  Clock,
  Star,
  BadgeCheck,
  Send,
  ChevronLeft,
  ChevronRight,
  Bookmark,
  HandshakeIcon,
  Flame,
  Phone,
  Mail,
  ExternalLink,
  Flag,
  MoreHorizontal,
  ThumbsUp,
  Reply,
  Loader2,
  Copy,
  Link2,
  Package,
  Check,
  Pencil,
  Trash2,
  AlertTriangle,
} from "lucide-react"
import { useSpring } from "framer-motion"

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
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Sheet,
  SheetContent,
} from "@/components/ui/sheet"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { ScrollArea } from "@/components/ui/scroll-area"
import { cn } from "@/lib/utils"
import { toast } from "@/hooks/use-toast"
import { useAuth } from "@/contexts/auth-context"
import type { ListingData } from "./enhanced-listing-card"

// API Comment type
interface APIComment {
  id: string
  listingId: string
  content: string
  parentId: string | null
  isEdited: boolean
  createdAt: string
  updatedAt: string
  user: {
    id: string
    name: string
    avatar: string | null
    isVerified: boolean
    region: string
  }
  replies: APIComment[]
}

interface CommentsResponse {
  comments: APIComment[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

// Display comment type
interface Comment {
  id: string
  user: {
    id?: string
    name: string
    avatar?: string
    verified: boolean
  }
  content: string
  likes: number
  replies: number
  createdAt: string
  isLiked: boolean
}

// Full listing data from API
interface FullListingData {
  id: string
  userId: string
  title: string
  description: string
  category: string
  categoryName: string
  type: string
  value: number
  condition: string
  images: string[]
  primaryImage: string
  location: { region: string; town?: string }
  status: string
  views: number
  saves: number
  likes: number
  shares: number
  isLiked: boolean
  isSaved: boolean
  featured: boolean
  wantedItems: Array<{ id: string; description: string; estimatedValue: number | null; isFlexible: boolean }>
  comments: Array<{
    id: string
    content: string
    parentId: string | null
    isEdited: boolean
    createdAt: string
    user: { id: string; name: string; avatar: string | null; isVerified: boolean }
  }>
  pendingOffers: number
  createdAt: string
  user: {
    id: string
    name: string
    avatar: string | null
    phone: string | null
    region: string
    isVerified: boolean
    joinedAt: string
    listingCount: number
    tradeCount: number
    rating: string | null
  }
}

interface ListingDetailModalProps {
  listing: ListingData | null
  isOpen: boolean
  onClose: () => void
  onMakeOffer?: (listing: ListingData) => void
}

// Helper to format relative time
function formatRelativeTime(dateString: string): string {
  const date = new Date(dateString)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffSeconds = Math.floor(diffMs / 1000)
  const diffMinutes = Math.floor(diffSeconds / 60)
  const diffHours = Math.floor(diffMinutes / 60)
  const diffDays = Math.floor(diffHours / 24)
  
  if (diffSeconds < 60) return "Just now"
  if (diffMinutes < 60) return `${diffMinutes} minute${diffMinutes > 1 ? "s" : ""} ago`
  if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? "s" : ""} ago`
  if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? "s" : ""} ago`
  return date.toLocaleDateString()
}

const fetcher = (url: string) => fetch(url).then((res) => res.json())

export function ListingDetailModal({
  listing,
  isOpen,
  onClose,
  onMakeOffer,
}: ListingDetailModalProps) {
  const { user } = useAuth()
  const [currentImageIndex, setCurrentImageIndex] = useState(0)
  const [isLiked, setIsLiked] = useState(false)
  const [isSaved, setIsSaved] = useState(false)
  const [likesCount, setLikesCount] = useState(0)
  const [sharesCount, setSharesCount] = useState(0)
  const [newComment, setNewComment] = useState("")
  const [isSubmittingComment, setIsSubmittingComment] = useState(false)
  const [showOfferForm, setShowOfferForm] = useState(false)
  const [offerAmount, setOfferAmount] = useState("")
  const [offerMessage, setOfferMessage] = useState("")
  const [isSubmittingOffer, setIsSubmittingOffer] = useState(false)
  const [replyingTo, setReplyingTo] = useState<string | null>(null)
  const [showShareMenu, setShowShareMenu] = useState(false)
  const [copiedLink, setCopiedLink] = useState(false)
  const [isLiking, setIsLiking] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const commentsEndRef = useRef<HTMLDivElement>(null)
  
  // Fetch full listing data from API
  const { data: listingData, error: listingError, isLoading: listingLoading, mutate: refreshListing } = useSWR<{ listing: FullListingData }>(
    listing && isOpen ? `/api/listings/${listing.id}` : null,
    fetcher,
    { revalidateOnFocus: false }
  )

  // Fetch comments from API
  const { data: commentsData, error: commentsError, isLoading: commentsLoading, mutate: refreshComments } = useSWR<CommentsResponse>(
    listing && isOpen ? `/api/comments?listingId=${listing.id}` : null,
    fetcher,
    { revalidateOnFocus: false }
  )

  // Check if current user is the owner
  const isOwner = user?.id === listing?.seller?.id || user?.id === listingData?.listing?.userId

  // Update local state when full listing data loads
  useEffect(() => {
    if (listingData?.listing) {
      setIsLiked(listingData.listing.isLiked)
      setIsSaved(listingData.listing.isSaved)
      setLikesCount(listingData.listing.likes || 0)
      setSharesCount(listingData.listing.shares || 0)
    }
  }, [listingData])

  // Transform API comments to display format
  const comments: Comment[] = (commentsData?.comments || []).map((c) => ({
    id: c.id,
    user: {
      id: c.user.id,
      name: c.user.name,
      avatar: c.user.avatar || undefined,
      verified: c.user.isVerified,
    },
    content: c.content,
    likes: 0,
    replies: c.replies?.length || 0,
    createdAt: formatRelativeTime(c.createdAt),
    isLiked: false,
  }))

  useEffect(() => {
    if (listing) {
      setLikesCount(listing.stats.likes)
      setCurrentImageIndex(0)
    }
  }, [listing])

  if (!listing) return null

  const fullListing = listingData?.listing
  const images = fullListing?.images?.length 
    ? fullListing.images 
    : listing.images.length > 0 
      ? listing.images 
      : ["/placeholder.svg"]

  const handleLike = async () => {
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

  const handleSave = async () => {
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

  const handleShare = async (platform: string = "copy") => {
    const listingUrl = `${window.location.origin}/listing/${listing.id}`
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

  const handleCommentSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newComment.trim()) return

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
          content: newComment.trim(),
          parentId: replyingTo,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to post comment")
      }

      setNewComment("")
      setReplyingTo(null)
      refreshComments()
      toast({ title: "Comment posted successfully" })
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to post comment"
      toast({ title: message, variant: "destructive" })
    } finally {
      setIsSubmittingComment(false)
    }
  }

  const handleCommentLike = async (commentId: string) => {
    if (!user) {
      toast({ title: "Please log in to like comments" })
      return
    }

    try {
      const response = await fetch(`/api/comments/${commentId}/like`, {
        method: "POST",
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to like comment")
      }

      refreshComments()
      toast({ title: data.liked ? "Comment liked" : "Like removed" })
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to like comment"
      toast({ title: message, variant: "destructive" })
    }
  }

  const handleOfferSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!offerAmount) return

    if (!user) {
      toast({ title: "Please log in to make an offer" })
      return
    }

    setIsSubmittingOffer(true)

    try {
      const response = await fetch("/api/offers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          receiverId: listing.seller.id,
          receiverItems: [listing.id],
          walletAmount: Number(offerAmount),
          message: offerMessage || null,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to send offer")
      }

      toast({
        title: "Offer sent successfully",
        description: `Your offer of N$${Number(offerAmount).toLocaleString()} has been sent to ${listing.seller.name}`,
      })

      setShowOfferForm(false)
      setOfferAmount("")
      setOfferMessage("")
      refreshListing()
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to send offer"
      toast({ title: message, variant: "destructive" })
    } finally {
      setIsSubmittingOffer(false)
    }
  }
  
  const handleDeleteListing = async () => {
    if (!listing || !isOwner) return
    
    setIsDeleting(true)
    
    try {
      const response = await fetch(`/api/listings/${listing.id}`, {
        method: "DELETE",
      })
      
      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(data.error || "Failed to delete listing")
      }
      
      toast({
        title: "Listing deleted",
        description: "Your listing has been removed successfully",
      })
      
      onClose()
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to delete listing"
      toast({ title: message, variant: "destructive" })
    } finally {
      setIsDeleting(false)
      setShowDeleteConfirm(false)
    }
  }
  
  const handleEditListing = () => {
    if (listing?.id) {
      window.location.href = `/dashboard/listings/${listing.id}/edit`
    }
  }

  const nextImage = () => {
    setCurrentImageIndex((prev) => (prev + 1) % images.length)
  }

  const prevImage = () => {
    setCurrentImageIndex((prev) => (prev - 1 + images.length) % images.length)
  }

  const sellerData = fullListing?.user || {
    id: listing.seller.id,
    name: listing.seller.name,
    avatar: listing.seller.avatar,
    isVerified: listing.seller.verified,
    region: listing.location.region,
    listingCount: 0,
    tradeCount: listing.seller.trades,
    rating: listing.seller.rating.toString(),
  }

  const wantedItems = fullListing?.wantedItems || []

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent
        side="bottom"
        className="h-[95vh] p-0 rounded-t-3xl overflow-hidden"
      >
        <div className="flex flex-col h-full bg-background">
          {/* Header Bar */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-border/50 bg-background/95 backdrop-blur-xl sticky top-0 z-10">
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="rounded-xl"
            >
              <X className="h-5 w-5" />
            </Button>
            <div className="flex items-center gap-2">
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={handleSave}
                disabled={isSaving}
                className={cn(
                  "p-2.5 rounded-xl transition-all",
                  isSaved
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground hover:text-foreground"
                )}
              >
                <Bookmark className={cn("h-5 w-5", isSaved && "fill-current")} />
              </motion.button>

              {/* Share Menu */}
              <DropdownMenu open={showShareMenu} onOpenChange={setShowShareMenu}>
                <DropdownMenuTrigger asChild>
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    className="p-2.5 rounded-xl bg-muted text-muted-foreground hover:text-foreground transition-all"
                  >
                    <Share2 className="h-5 w-5" />
                  </motion.button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuItem onClick={() => handleShare("copy")}>
                    {copiedLink ? (
                      <Check className="h-4 w-4 mr-2 text-green-500" />
                    ) : (
                      <Link2 className="h-4 w-4 mr-2" />
                    )}
                    {copiedLink ? "Copied!" : "Copy Link"}
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => handleShare("whatsapp")}>
                    <MessageCircle className="h-4 w-4 mr-2" />
                    WhatsApp
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleShare("facebook")}>
                    <Share2 className="h-4 w-4 mr-2" />
                    Facebook
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleShare("twitter")}>
                    <Share2 className="h-4 w-4 mr-2" />
                    Twitter / X
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleShare("email")}>
                    <Mail className="h-4 w-4 mr-2" />
                    Email
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="rounded-xl">
                    <MoreHorizontal className="h-5 w-5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  {isOwner && (
                    <>
                      <DropdownMenuItem onClick={handleEditListing}>
                        <Pencil className="h-4 w-4 mr-2" />
                        Edit listing
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        onClick={() => setShowDeleteConfirm(true)}
                        className="text-destructive focus:text-destructive"
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete listing
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                    </>
                  )}
                  <DropdownMenuItem>
                    <Flag className="h-4 w-4 mr-2" />
                    Report listing
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          <ScrollArea className="flex-1">
            <div className="pb-32">
              {/* Image Gallery */}
              <div className="relative aspect-[4/3] md:aspect-[16/9] bg-muted">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={currentImageIndex}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="absolute inset-0"
                  >
                    <Image
                      src={images[currentImageIndex] || "/placeholder.svg"}
                      alt={listing.title}
                      fill
                      className="object-cover"
                    />
                  </motion.div>
                </AnimatePresence>

                {/* Image Navigation */}
                {images.length > 1 && (
                  <>
                    <button
                      onClick={prevImage}
                      className="absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/50 backdrop-blur-sm text-white flex items-center justify-center hover:bg-black/70 transition-colors"
                    >
                      <ChevronLeft className="h-5 w-5" />
                    </button>
                    <button
                      onClick={nextImage}
                      className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/50 backdrop-blur-sm text-white flex items-center justify-center hover:bg-black/70 transition-colors"
                    >
                      <ChevronRight className="h-5 w-5" />
                    </button>
                  </>
                )}

                {/* Image Counter */}
                <div className="absolute bottom-3 left-1/2 -translate-x-1/2 px-3 py-1.5 rounded-full bg-black/50 backdrop-blur-sm text-white text-sm">
                  {currentImageIndex + 1} / {images.length}
                </div>

                {/* Enterprise Badges */}
                <div className="absolute top-3 left-3 flex flex-wrap gap-2">
                  {listing.featured && (
                    <Badge className="bg-gradient-to-r from-primary to-amber-500 text-white border-0 shadow-lg shadow-primary/30">
                      <Star className="w-3 h-3 mr-1 fill-current" />
                      Featured
                    </Badge>
                  )}
                  {listing.hot && (
                    <Badge className="bg-gradient-to-r from-rose-500 to-orange-500 text-white border-0 animate-pulse shadow-lg shadow-rose-500/30">
                      <Flame className="w-3 h-3 mr-1 fill-current" />
                      Hot
                    </Badge>
                  )}
                  {fullListing?.status === "active" && (
                    <Badge className="bg-emerald-500/90 text-white border-0 shadow-md">
                      <BadgeCheck className="w-3 h-3 mr-1" />
                      Active
                    </Badge>
                  )}
                  {(fullListing?.pendingOffers || 0) > 0 && (
                    <Badge className="bg-amber-500/90 text-white border-0 shadow-md">
                      <HandshakeIcon className="w-3 h-3 mr-1" />
                      {fullListing?.pendingOffers} Offers
                    </Badge>
                  )}
                </div>
              </div>

              {/* Thumbnail Strip */}
              {images.length > 1 && (
                <div className="flex gap-2 p-4 overflow-x-auto no-scrollbar">
                  {images.map((img, i) => (
                    <button
                      key={i}
                      onClick={() => setCurrentImageIndex(i)}
                      className={cn(
                        "flex-shrink-0 w-16 h-16 rounded-xl overflow-hidden border-2 transition-all",
                        i === currentImageIndex
                          ? "border-primary ring-2 ring-primary/30"
                          : "border-transparent opacity-60 hover:opacity-100"
                      )}
                    >
                      <Image
                        src={img || "/placeholder.svg"}
                        alt={`${listing.title} ${i + 1}`}
                        width={64}
                        height={64}
                        className="object-cover w-full h-full"
                      />
                    </button>
                  ))}
                </div>
              )}

              {/* Content */}
              <div className="px-4 pb-6">
                {/* Title & Price */}
                <div className="mb-4">
                  <div className="flex items-start justify-between gap-4 mb-2">
                    <h1 className="text-2xl font-bold text-foreground leading-tight">
                      {listing.title}
                    </h1>
                  </div>
                  <p className="text-3xl font-bold text-primary">
                    N${listing.value.toLocaleString()}
                    <span className="text-sm font-normal text-muted-foreground ml-2">
                      or trade
                    </span>
                  </p>
                </div>

                {/* Quick Stats */}
                <div className="flex flex-wrap gap-3 mb-6">
                  <motion.div 
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-muted/50 text-sm"
                    whileHover={{ scale: 1.02 }}
                  >
                    <Eye className="h-4 w-4 text-muted-foreground" />
                    <AnimatedCounter value={fullListing?.views || listing.stats.views} className="font-medium" />
                    <span className="text-muted-foreground">views</span>
                  </motion.div>
                  <motion.button
                    onClick={handleLike}
                    disabled={isLiking}
                    className={cn(
                      "flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm transition-all",
                      isLiked ? "bg-rose-500/10 text-rose-500" : "bg-muted/50",
                      isLiking && "opacity-50 cursor-not-allowed"
                    )}
                    whileTap={{ scale: 0.95 }}
                    whileHover={{ scale: 1.02 }}
                  >
                    <motion.span
                      animate={isLiked ? { scale: [1, 1.3, 1] } : {}}
                      transition={{ duration: 0.3 }}
                    >
                      <Heart className={cn("h-4 w-4", isLiked && "fill-current")} />
                    </motion.span>
                    <AnimatedCounter value={likesCount} className="font-medium" />
                    <span className={isLiked ? "" : "text-muted-foreground"}>likes</span>
                  </motion.button>
                  <motion.div 
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-muted/50 text-sm"
                    whileHover={{ scale: 1.02 }}
                  >
                    <MessageCircle className="h-4 w-4 text-muted-foreground" />
                    <AnimatedCounter value={comments.length} className="font-medium" />
                    <span className="text-muted-foreground">comments</span>
                  </motion.div>
                  <motion.div 
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-muted/50 text-sm"
                    whileHover={{ scale: 1.02 }}
                  >
                    <Share2 className="h-4 w-4 text-muted-foreground" />
                    <AnimatedCounter value={sharesCount} className="font-medium" />
                    <span className="text-muted-foreground">shares</span>
                  </motion.div>
                  <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-muted/50 text-sm">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    <span>{listing.location.region}</span>
                  </div>
                  <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-muted/50 text-sm">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <span>{listing.postedAt}</span>
                  </div>
                </div>

                {/* Wanted Items Section */}
                {wantedItems.length > 0 && (
                  <div className="mb-6 p-4 rounded-2xl bg-primary/5 border border-primary/20">
                    <h3 className="font-semibold text-foreground mb-3 flex items-center gap-2">
                      <Package className="h-5 w-5 text-primary" />
                      Looking for in exchange
                    </h3>
                    <div className="space-y-2">
                      {wantedItems.map((item, index) => (
                        <div key={item.id || index} className="flex items-center gap-3 p-2 rounded-lg bg-background/50">
                          <div className="w-2 h-2 rounded-full bg-primary" />
                          <span className="flex-1 text-sm">{item.description}</span>
                          {item.estimatedValue && (
                            <Badge variant="outline" className="text-xs">
                              ~N${item.estimatedValue.toLocaleString()}
                            </Badge>
                          )}
                          {item.isFlexible && (
                            <Badge variant="secondary" className="text-xs">Flexible</Badge>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Enhanced Seller Card */}
                <div className="p-4 rounded-2xl bg-gradient-to-br from-card to-muted/30 border border-border/50 mb-6 shadow-sm">
                  <div className="flex items-center gap-4">
                    <div className="relative">
                      <Avatar className="h-14 w-14 ring-2 ring-primary/20">
                        <AvatarImage src={sellerData.avatar || "/placeholder.svg"} alt={sellerData.name} />
                        <AvatarFallback className="bg-gradient-to-br from-primary to-amber-500 text-white text-lg font-semibold">
                          {sellerData.name.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                      {sellerData.isVerified && (
                        <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center ring-2 ring-background">
                          <BadgeCheck className="h-3.5 w-3.5 text-white" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-foreground text-lg">
                          {sellerData.name}
                        </span>
                        {sellerData.isVerified && (
                          <Badge variant="secondary" className="text-[10px] px-1.5 py-0.5 h-5">
                            <BadgeCheck className="h-3 w-3 mr-0.5 text-blue-500" />
                            Verified
                          </Badge>
                        )}
                      </div>
                      <div className="flex flex-wrap items-center gap-2 sm:gap-3 text-xs sm:text-sm text-muted-foreground mt-1">
                        <span className="flex items-center gap-1 bg-amber-500/10 px-2 py-0.5 rounded-full">
                          <Star className="h-3.5 w-3.5 text-amber-500 fill-current" />
                          <span className="font-medium text-amber-600 dark:text-amber-400">{sellerData.rating || "N/A"}</span>
                        </span>
                        <span className="flex items-center gap-1">
                          <HandshakeIcon className="h-3.5 w-3.5 text-primary" />
                          {sellerData.tradeCount} trades
                        </span>
                        <span className="flex items-center gap-1">
                          <Package className="h-3.5 w-3.5 text-muted-foreground" />
                          {sellerData.listingCount} listings
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-2 mt-4">
                    <Button
                      variant="outline"
                      className="flex-1 rounded-xl bg-transparent hover:bg-primary/5"
                      asChild
                    >
                      <a href={`/users/${sellerData.id}`}>
                        <ExternalLink className="h-4 w-4 mr-2" />
                        View Profile
                      </a>
                    </Button>
                    <Button
                      variant="outline"
                      className="flex-1 rounded-xl bg-transparent hover:bg-emerald-500/10 hover:border-emerald-500/50 hover:text-emerald-600"
                    >
                      <MessageCircle className="h-4 w-4 mr-2" />
                      Message
                    </Button>
                  </div>
                </div>

                {/* Tabs: Details & Comments */}
                <Tabs defaultValue="details" className="w-full">
                  <TabsList className="grid w-full grid-cols-2 mb-4">
                    <TabsTrigger value="details" className="rounded-xl">
                      Details
                    </TabsTrigger>
                    <TabsTrigger value="comments" className="rounded-xl">
                      Comments ({comments.length})
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="details" className="space-y-4">
                    {/* Description */}
                    <div>
                      <h3 className="font-semibold text-foreground mb-2">
                        Description
                      </h3>
                      <p className="text-muted-foreground leading-relaxed">
                        {fullListing?.description || listing.description || "No description provided."}
                      </p>
                    </div>

                    {/* Specs */}
                    <div className="grid grid-cols-2 gap-4">
                      <div className="p-3 rounded-xl bg-muted/30">
                        <p className="text-sm text-muted-foreground">Category</p>
                        <p className="font-medium text-foreground">
                          {fullListing?.categoryName || listing.category}
                        </p>
                      </div>
                      <div className="p-3 rounded-xl bg-muted/30">
                        <p className="text-sm text-muted-foreground">Condition</p>
                        <p className="font-medium text-foreground">
                          {fullListing?.condition || listing.condition}
                        </p>
                      </div>
                      <div className="p-3 rounded-xl bg-muted/30">
                        <p className="text-sm text-muted-foreground">Location</p>
                        <p className="font-medium text-foreground">
                          {fullListing?.location?.region || listing.location.region}
                          {(fullListing?.location?.town || listing.location.distance) && (
                            <span className="text-muted-foreground"> - {fullListing?.location?.town || listing.location.distance}</span>
                          )}
                        </p>
                      </div>
                      <div className="p-3 rounded-xl bg-muted/30">
                        <p className="text-sm text-muted-foreground">Posted</p>
                        <p className="font-medium text-foreground">
                          {listing.postedAt}
                        </p>
                      </div>
                    </div>

                    {/* Pending Offers */}
                    {(fullListing?.pendingOffers || 0) > 0 && (
                      <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20">
                        <p className="text-sm font-medium text-amber-600 dark:text-amber-400">
                          {fullListing?.pendingOffers} pending offer{(fullListing?.pendingOffers || 0) > 1 ? "s" : ""} on this listing
                        </p>
                      </div>
                    )}
                  </TabsContent>

                  <TabsContent value="comments" className="space-y-4">
                    {/* Comment Form */}
                    <form onSubmit={handleCommentSubmit} className="flex gap-2">
                      <Avatar className="h-9 w-9 flex-shrink-0">
                        <AvatarImage src={user?.avatar || "/placeholder.svg"} />
                        <AvatarFallback className="bg-primary text-primary-foreground text-sm">
                          {user?.name?.charAt(0) || "U"}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 flex gap-2">
                        <div className="flex-1">
                          {replyingTo && (
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-xs text-muted-foreground">Replying to comment</span>
                              <button
                                type="button"
                                onClick={() => setReplyingTo(null)}
                                className="text-xs text-primary hover:underline"
                              >
                                Cancel
                              </button>
                            </div>
                          )}
                          <Input
                            placeholder={replyingTo ? "Write a reply..." : "Write a comment..."}
                            value={newComment}
                            onChange={(e) => setNewComment(e.target.value)}
                            className="rounded-xl"
                          />
                        </div>
                        <Button
                          type="submit"
                          size="icon"
                          className="rounded-xl flex-shrink-0"
                          disabled={!newComment.trim() || isSubmittingComment}
                        >
                          {isSubmittingComment ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Send className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                    </form>

                    {/* Comments List */}
                    <div className="space-y-4">
                      {/* Loading State */}
                      {commentsLoading && (
                        <div className="space-y-4">
                          {Array.from({ length: 3 }).map((_, i) => (
                            <div key={i} className="p-4 rounded-xl bg-muted/30">
                              <div className="flex items-start gap-3">
                                <Skeleton className="h-9 w-9 rounded-full" />
                                <div className="flex-1 space-y-2">
                                  <Skeleton className="h-4 w-32" />
                                  <Skeleton className="h-4 w-full" />
                                  <Skeleton className="h-3 w-20" />
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Empty State */}
                      {!commentsLoading && comments.length === 0 && (
                        <div className="text-center py-8">
                          <MessageCircle className="h-10 w-10 mx-auto text-muted-foreground/50 mb-3" />
                          <p className="text-sm text-muted-foreground">No comments yet</p>
                          <p className="text-xs text-muted-foreground mt-1">Be the first to comment!</p>
                        </div>
                      )}

                      {/* Comments */}
                      {!commentsLoading && comments.map((comment) => (
                        <div
                          key={comment.id}
                          className="p-4 rounded-xl bg-muted/30"
                        >
                          <div className="flex items-start gap-3">
                            <Avatar className="h-9 w-9">
                              <AvatarImage src={comment.user.avatar || "/placeholder.svg"} />
                              <AvatarFallback className="bg-gradient-to-br from-primary to-amber-500 text-white text-sm">
                                {comment.user.name.charAt(0)}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="font-medium text-foreground text-sm">
                                  {comment.user.name}
                                </span>
                                {comment.user.verified && (
                                  <BadgeCheck className="h-4 w-4 text-blue-500" />
                                )}
                                <span className="text-xs text-muted-foreground">
                                  {comment.createdAt}
                                </span>
                              </div>
                              <p className="text-sm text-foreground/90 leading-relaxed">
                                {comment.content}
                              </p>
                              <div className="flex items-center gap-4 mt-2">
                                <button
                                  onClick={() => handleCommentLike(comment.id)}
                                  className={cn(
                                    "flex items-center gap-1.5 text-xs transition-colors",
                                    comment.isLiked
                                      ? "text-primary"
                                      : "text-muted-foreground hover:text-foreground"
                                  )}
                                >
                                  <ThumbsUp
                                    className={cn(
                                      "h-3.5 w-3.5",
                                      comment.isLiked && "fill-current"
                                    )}
                                  />
                                  {comment.likes > 0 && comment.likes}
                                </button>
                                <button
                                  onClick={() => setReplyingTo(comment.id)}
                                  className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
                                >
                                  <Reply className="h-3.5 w-3.5" />
                                  Reply
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                    <div ref={commentsEndRef} />
                  </TabsContent>
                </Tabs>
              </div>
            </div>
          </ScrollArea>

          {/* Fixed Bottom Actions */}
          <div className="absolute bottom-0 left-0 right-0 p-4 bg-background/95 backdrop-blur-xl border-t border-border/50 safe-area-bottom">
            {isOwner ? (
              /* Owner Actions */
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-muted/50">
                  <Eye className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium">{fullListing?.views || listing.stats.views}</span>
                </div>
                <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-muted/50">
                  <Heart className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium">{likesCount}</span>
                </div>
                
                <Button
                  variant="outline"
                  className="flex-1 h-12 rounded-xl bg-transparent"
                  onClick={handleEditListing}
                >
                  <Pencil className="h-5 w-5 mr-2" />
                  Edit Listing
                </Button>

                <Button
                  variant="destructive"
                  className="h-12 rounded-xl"
                  onClick={() => setShowDeleteConfirm(true)}
                >
                  <Trash2 className="h-5 w-5" />
                </Button>
              </div>
            ) : (
              /* Buyer Actions */
              <div className="flex items-center gap-3">
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={handleLike}
                  disabled={isLiking}
                  className={cn(
                    "flex items-center gap-2 px-4 py-3 rounded-xl font-medium transition-all",
                    isLiked
                      ? "bg-rose-500/10 text-rose-500"
                      : "bg-muted text-muted-foreground hover:text-foreground"
                  )}
                >
                  <Heart className={cn("h-5 w-5", isLiked && "fill-current")} />
                  <span>{likesCount}</span>
                </motion.button>

                <Button
                  variant="outline"
                  className="flex-1 h-12 rounded-xl bg-transparent"
                  onClick={() => setShowOfferForm(true)}
                >
                  <MessageCircle className="h-5 w-5 mr-2" />
                  Contact Seller
                </Button>

                <Button
                  className="flex-1 h-12 rounded-xl bg-gradient-to-r from-primary to-amber-500 hover:from-primary/90 hover:to-amber-500/90 text-white shadow-lg shadow-primary/20"
                  onClick={() => setShowOfferForm(true)}
                >
                  <HandshakeIcon className="h-5 w-5 mr-2" />
                  Make Offer
                </Button>
              </div>
            )}
          </div>
        </div>

        {/* Delete Confirmation Dialog */}
        <Dialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-destructive">
                <AlertTriangle className="h-5 w-5" />
                Delete Listing
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Are you sure you want to delete <strong className="text-foreground">{listing.title}</strong>? This action cannot be undone.
              </p>
              <div className="flex gap-3">
                <Button
                  type="button"
                  variant="outline"
                  className="flex-1 rounded-xl bg-transparent"
                  onClick={() => setShowDeleteConfirm(false)}
                  disabled={isDeleting}
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  variant="destructive"
                  className="flex-1 rounded-xl"
                  onClick={handleDeleteListing}
                  disabled={isDeleting}
                >
                  {isDeleting ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Deleting...
                    </>
                  ) : (
                    <>
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete
                    </>
                  )}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Make Offer Dialog */}
        <Dialog open={showOfferForm} onOpenChange={setShowOfferForm}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Make an Offer</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleOfferSubmit} className="space-y-4">
              <div className="p-4 rounded-xl bg-muted/50 flex items-center gap-4">
                <Image
                  src={listing.images[0] || "/placeholder.svg"}
                  alt={listing.title}
                  width={60}
                  height={60}
                  className="rounded-lg object-cover"
                />
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-foreground truncate">
                    {listing.title}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Listed at{" "}
                    <span className="text-primary font-semibold">
                      N${listing.value.toLocaleString()}
                    </span>
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="offerAmount">Your Offer (NAD)</Label>
                <Input
                  id="offerAmount"
                  type="number"
                  placeholder="Enter amount"
                  value={offerAmount}
                  onChange={(e) => setOfferAmount(e.target.value)}
                  className="rounded-xl h-12 text-lg"
                  required
                />
                <p className="text-xs text-muted-foreground">
                  This amount will be deducted from your wallet when the offer is accepted.
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="offerMessage">Message (Optional)</Label>
                <Textarea
                  id="offerMessage"
                  placeholder="Add a message to your offer..."
                  value={offerMessage}
                  onChange={(e) => setOfferMessage(e.target.value)}
                  className="rounded-xl resize-none"
                  rows={3}
                />
              </div>

              <div className="flex gap-3">
                <Button
                  type="button"
                  variant="outline"
                  className="flex-1 rounded-xl bg-transparent"
                  onClick={() => setShowOfferForm(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  className="flex-1 rounded-xl bg-gradient-to-r from-primary to-amber-500"
                  disabled={isSubmittingOffer || !offerAmount}
                >
                  {isSubmittingOffer ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Sending...
                    </>
                  ) : (
                    "Send Offer"
                  )}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </SheetContent>
    </Sheet>
  )
}
