"use client"

import MakeOfferModal from "@/components/listings/make-offer-modal"
import React from "react"
import { useState, useEffect, use, useCallback } from "react"
import { DashboardLayout } from "@/components/dashboard/dashboard-layout"
import { ProtectedRoute } from "@/components/auth/protected-route"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { useAuth } from "@/contexts/auth-context"
import { useRouter } from "next/navigation"
import { toast } from "@/hooks/use-toast"
import Image from "next/image"
import Link from "next/link"
import useSWR from "swr"
import { motion, AnimatePresence, useSpring } from "framer-motion"
import {
  ArrowLeft,
  Edit,
  Trash2,
  Heart,
  Share2,
  MapPin,
  Eye,
  MessageCircle,
  Clock,
  CheckCircle,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  ArrowRightLeft,
  FileText,
  Star,
  BadgeCheck,
  Shield,
  Flame,
  Crown,
  Send,
  ThumbsUp,
  Reply,
  Loader2,
  Bookmark,
  TrendingUp,
  Users,
  Zap,
  Timer,
  AlertTriangle,
  ExternalLink,
  Copy,
  Check,
  Bell,
  Sparkles,
  Target,
} from "lucide-react"
import AdBannerCarousel from "@/components/ad-banner-carousel"
import { cn } from "@/lib/utils"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"



// Animated counter for live stats
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

// FOMO Countdown Timer Component
function FOMOCountdown({ deadline }: { deadline: Date }) {
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 })
  
  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date().getTime()
      const distance = deadline.getTime() - now
      
      if (distance > 0) {
        setTimeLeft({
          days: Math.floor(distance / (1000 * 60 * 60 * 24)),
          hours: Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
          minutes: Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60)),
          seconds: Math.floor((distance % (1000 * 60)) / 1000),
        })
      }
    }, 1000)
    
    return () => clearInterval(timer)
  }, [deadline])
  
  return (
    <div className="flex items-center gap-2">
      {[
        { value: timeLeft.days, label: "d" },
        { value: timeLeft.hours, label: "h" },
        { value: timeLeft.minutes, label: "m" },
        { value: timeLeft.seconds, label: "s" },
      ].map((item, idx) => (
        <div key={idx} className="flex items-center">
          <div className="bg-destructive/10 px-2 py-1 rounded-lg">
            <span className={cn("font-mono font-bold text-destructive", item.value < 10 && idx === 3 && "countdown-urgent")}>
              {String(item.value).padStart(2, "0")}
            </span>
            <span className="text-destructive/70 text-xs ml-0.5">{item.label}</span>
          </div>
          {idx < 3 && <span className="text-muted-foreground mx-1">:</span>}
        </div>
      ))}
    </div>
  )
}

// Social Proof Notification Component
function SocialProofNotification({ 
  notifications 
}: { 
  notifications: Array<{ type: string; message: string; time: string }> 
}) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isVisible, setIsVisible] = useState(true)
  
  useEffect(() => {
    if (notifications.length === 0) return
    
    const interval = setInterval(() => {
      setIsVisible(false)
      setTimeout(() => {
        setCurrentIndex((prev) => (prev + 1) % notifications.length)
        setIsVisible(true)
      }, 500)
    }, 5000)
    
    return () => clearInterval(interval)
  }, [notifications.length])
  
  if (notifications.length === 0) return null
  
  return (
    <AnimatePresence mode="wait">
      {isVisible && (
        <motion.div
          key={currentIndex}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          className="flex items-center gap-3 p-3 bg-background/95 backdrop-blur-md rounded-xl border border-primary/20 shadow-lg"
        >
          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
            {notifications[currentIndex].type === "view" && <Eye className="h-4 w-4 text-primary" />}
            {notifications[currentIndex].type === "like" && <Heart className="h-4 w-4 text-rose-500" />}
            {notifications[currentIndex].type === "save" && <Bookmark className="h-4 w-4 text-amber-500" />}
            {notifications[currentIndex].type === "offer" && <ArrowRightLeft className="h-4 w-4 text-emerald-500" />}
          </div>
          <div className="flex-1">
            <p className="text-sm text-foreground">{notifications[currentIndex].message}</p>
            <p className="text-xs text-muted-foreground">{notifications[currentIndex].time}</p>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

// Interest Level Gauge
function InterestGauge({ percentage }: { percentage: number }) {
  return (
    <div className="relative w-full h-4 bg-muted rounded-full overflow-hidden">
      <motion.div
        className={cn(
          "h-full rounded-full",
          percentage > 75 ? "bg-gradient-to-r from-red-500 to-orange-500" :
          percentage > 50 ? "bg-gradient-to-r from-amber-500 to-yellow-500" :
          "bg-gradient-to-r from-emerald-500 to-teal-500"
        )}
        initial={{ width: 0 }}
        animate={{ width: `${percentage}%` }}
        transition={{ duration: 1.5, ease: "easeOut" }}
      />
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-[10px] font-bold text-foreground mix-blend-difference">
          {percentage}% Interest
        </span>
      </div>
    </div>
  )
}

interface Comment {
  id: string
  content: string
  parentId: string | null
  isEdited: boolean
  createdAt: string
  user: {
    id: string
    name: string
    avatar: string | null
    isVerified: boolean
  }
  replies?: Comment[]
}

function formatRelativeTime(dateString: string): string {
  const date = new Date(dateString)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffSeconds = Math.floor(diffMs / 1000)
  const diffMinutes = Math.floor(diffSeconds / 60)
  const diffHours = Math.floor(diffMinutes / 60)
  const diffDays = Math.floor(diffHours / 24)
  
  if (diffSeconds < 60) return "Just now"
  if (diffMinutes < 60) return `${diffMinutes}m ago`
  if (diffHours < 24) return `${diffHours}h ago`
  if (diffDays < 7) return `${diffDays}d ago`
  return date.toLocaleDateString()
}

const fetcher = (url: string) => fetch(url).then((res) => res.json())

interface Listing {
  id: string
  userId: string
  title: string
  description: string
  category: string
  categoryName: string
  type: string
  value: number
  currency: string
  condition: string
  images: string[]
  primaryImage: string
  location: {
    region: string
    town?: string
  }
  status: string
  views: number
  saves: number
  likes: number
  isLiked: boolean
  isSaved: boolean
  pendingOffers?: number
  wantedItems: Array<{
    id: string
    description: string
    estimatedValue?: number
    isFlexible: boolean
  }>
  createdAt: string
  user: {
    id: string
    name: string
    avatar?: string
    isVerified: boolean
    rating?: string
    listingCount: number
    tradeCount: number
  }
}

interface PageProps {
  params: Promise<{ id: string }>
}

export default function ListingDetailPage({ params }: PageProps) {
  const { id } = use(params)
  const router = useRouter()
  const { user } = useAuth()
  const [listing, setListing] = useState<Listing | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isDeleting, setIsDeleting] = useState(false)
  const [currentImageIndex, setCurrentImageIndex] = useState(0)
  const [copiedLink, setCopiedLink] = useState(false)
  
  // Engagement state
  const [isLiked, setIsLiked] = useState(false)
  const [isSaved, setIsSaved] = useState(false)
  const [likesCount, setLikesCount] = useState(0)
  const [viewsCount, setViewsCount] = useState(0)
  const [isLiking, setIsLiking] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  
  // Comments state
  const [newComment, setNewComment] = useState("")
  const [isSubmittingComment, setIsSubmittingComment] = useState(false)
  const [replyingTo, setReplyingTo] = useState<string | null>(null)

  // FOMO state - from real data
  const [viewingNow, setViewingNow] = useState(0)
  const [recentOffers, setRecentOffers] = useState(0)
  const [socialProofNotifications, setSocialProofNotifications] = useState<Array<{ type: string; message: string; time: string }>>([])

  // Modal states
  const [showMakeOfferModal, setShowMakeOfferModal] = useState(false)
  const [showTradeDetailsModal, setShowTradeDetailsModal] = useState(false)
  const [showRequestDocumentsModal, setShowRequestDocumentsModal] = useState(false)
  
    
  // Document request state
  const [documentRequestMessage, setDocumentRequestMessage] = useState("")
  const [isRequestingDocuments, setIsRequestingDocuments] = useState(false)

  const isOwner = listing?.userId === user?.id
  const isAdmin = user?.role === "admin"
  const isHighValue = listing ? listing.value >= 20000 : false
  const isPremium = listing ? listing.value >= 50000 : false

  // Calculate interest score
  const interestScore = listing 
    ? Math.min(95, Math.floor((listing.views / 5) + (listing.likes * 3) + (listing.saves * 5) + (recentOffers * 10)))
    : 0

  // Calculate urgency level
  const getUrgencyLevel = () => {
    if (recentOffers > 3 || interestScore > 80) return { level: "critical", message: "Extremely High Demand", color: "destructive" }
    if (recentOffers > 1 || interestScore > 60) return { level: "high", message: "High Interest", color: "amber" }
    if (interestScore > 30) return { level: "medium", message: "Gaining Traction", color: "emerald" }
    return null
  }
  const urgency = getUrgencyLevel()

  // Fetch comments
  const { data: commentsData, mutate: refreshComments, isLoading: commentsLoading } = useSWR<{ comments: Comment[] }>(
    listing ? `/api/comments?listingId=${id}` : null,
    fetcher,
    { refreshInterval: 30000 }
  )

  const comments = commentsData?.comments || []

  // Real activity based on listing data
  useEffect(() => {
    if (!listing) return

    // Calculate viewing now based on recent views (views in last hour approximation)
    const baseViewers = Math.min(Math.floor(listing.views / 50) + 1, 10)
    setViewingNow(baseViewers)
    
    // Set recent offers from listing pending offers
    setRecentOffers(listing.pendingOffers || 0)
    
    // Only show social proof if there's real engagement
    if (listing.likes > 0 || listing.saves > 0) {
      setSocialProofNotifications([
        { type: "view", message: `${listing.views} people have viewed this listing`, time: "Total" },
        ...(listing.likes > 0 ? [{ type: "like", message: `${listing.likes} people liked this item`, time: "Total" }] : []),
        ...(listing.saves > 0 ? [{ type: "save", message: `${listing.saves} people saved this for later`, time: "Total" }] : []),
      ])
    }
  }, [listing])

  useEffect(() => {
    const fetchListing = async () => {
      try {
        const response = await fetch(`/api/listings/${id}`)
        if (!response.ok) throw new Error("Failed to fetch listing")
        const data = await response.json()
        setListing(data.listing)
        setIsLiked(data.listing.isLiked)
        setIsSaved(data.listing.isSaved)
        setLikesCount(data.listing.likes || 0)
        setViewsCount(data.listing.views || 0)
      } catch {
        toast({ title: "Error", description: "Failed to load listing", variant: "destructive" })
      } finally {
        setIsLoading(false)
      }
    }
    fetchListing()
  }, [id])

  const handleLike = async () => {
    if (!user) {
      toast({ title: "Please log in to like listings" })
      return
    }
    if (isLiking) return
    setIsLiking(true)
    
    const wasLiked = isLiked
    setIsLiked(!wasLiked)
    setLikesCount((prev) => wasLiked ? prev - 1 : prev + 1)

    try {
      const response = await fetch(`/api/listings/${id}/like`, { method: "POST" })
      const data = await response.json()
      if (!response.ok) {
        setIsLiked(wasLiked)
        setLikesCount((prev) => wasLiked ? prev + 1 : prev - 1)
        throw new Error(data.error)
      }
      setIsLiked(data.liked)
      setLikesCount(data.likesCount)
    } catch {
      toast({ title: "Failed to update like", variant: "destructive" })
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
    
    const wasSaved = isSaved
    setIsSaved(!wasSaved)

    try {
      const response = await fetch("/api/saved-listings", {
        method: wasSaved ? "DELETE" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ listingId: id }),
      })
      if (!response.ok) {
        setIsSaved(wasSaved)
        throw new Error("Failed")
      }
      toast({ title: wasSaved ? "Removed from saved" : "Saved for later" })
    } catch {
      toast({ title: "Failed to save listing", variant: "destructive" })
    } finally {
      setIsSaving(false)
    }
  }

  const handleShare = async () => {
    const url = `${window.location.origin}/listing/${id}`
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: listing?.title,
          text: `Check out this trade: ${listing?.title}`,
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
  }

  const handleCommentSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newComment.trim() || !user) return
    
    setIsSubmittingComment(true)
    try {
      const response = await fetch("/api/comments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          listingId: id,
          content: newComment.trim(),
          parentId: replyingTo,
        }),
      })
      if (!response.ok) throw new Error("Failed to post comment")
      
      setNewComment("")
      setReplyingTo(null)
      refreshComments()
      toast({ title: "Comment posted!" })
    } catch {
      toast({ title: "Failed to post comment", variant: "destructive" })
    } finally {
      setIsSubmittingComment(false)
    }
  }

  const handleDelete = async () => {
    setIsDeleting(true)
    try {
      const response = await fetch(`/api/listings/${id}`, { method: "DELETE" })
      if (!response.ok) throw new Error("Failed to delete")
      toast({ title: "Listing deleted", description: "Your listing has been removed" })
      router.push("/dashboard/listings")
    } catch {
      toast({ title: "Error", description: "Failed to delete listing", variant: "destructive" })
    } finally {
      setIsDeleting(false)
    }
  }

  const nextImage = () => {
    if (listing?.images) {
      setCurrentImageIndex((prev) => (prev + 1) % listing.images.length)
    }
  }

  const prevImage = () => {
    if (listing?.images) {
      setCurrentImageIndex((prev) => (prev - 1 + listing.images.length) % listing.images.length)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active": return "bg-emerald-500/10 text-emerald-500 border-emerald-500/20"
      case "pending": return "bg-amber-500/10 text-amber-500 border-amber-500/20"
      case "sold": return "bg-blue-500/10 text-blue-500 border-blue-500/20"
      case "flagged": return "bg-red-500/10 text-red-500 border-red-500/20"
      default: return "bg-muted text-muted-foreground"
    }
  }

  


  // Request Documents Handler
  const handleRequestDocuments = async () => {
    if (!user) {
      toast({ title: "Please log in to request documents", variant: "destructive" })
      return
    }

    setIsRequestingDocuments(true)

    try {
     const response = await fetch("/api/messages", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    listingId: id,
    recipientId: listing.user.id,
    content:
      documentRequestMessage.trim() ||
      "I would like to request documents for this item.",
    type: "document_request",
  }),
})

const data = await response.json()

if (!response.ok) {
  throw new Error(data.error || "Failed to request documents")
}


      toast({ 
        title: "Document Request Sent", 
        description: "The trader will be notified of your request"
      })

      setShowRequestDocumentsModal(false)
      setDocumentRequestMessage("")
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Failed to request documents"
      toast({ title: errorMessage, variant: "destructive" })
    } finally {
      setIsRequestingDocuments(false)
    }
  }
// Message trader modal state
const [showMessageModal, setShowMessageModal] = useState(false)
const [chatMessage, setChatMessage] = useState("")
const [isSendingMessage, setIsSendingMessage] = useState(false)

 

  if (isLoading) {
    return (
      <ProtectedRoute>
        <DashboardLayout>
          <div className="p-4 md:p-6 max-w-5xl mx-auto space-y-6">
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-96 w-full rounded-2xl" />
            <div className="grid md:grid-cols-3 gap-6">
              <div className="md:col-span-2 space-y-4">
                <Skeleton className="h-8 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
                <Skeleton className="h-32 w-full" />
              </div>
              <div className="space-y-4">
                <Skeleton className="h-40 w-full rounded-xl" />
                <Skeleton className="h-24 w-full rounded-xl" />
              </div>
            </div>
          </div>
        </DashboardLayout>
      </ProtectedRoute>
    )
  }

  if (!listing) {
    return (
      <ProtectedRoute>
        <DashboardLayout>
          <div className="p-4 md:p-6 flex flex-col items-center justify-center min-h-[50vh]">
            <AlertCircle className="h-12 w-12 text-muted-foreground mb-4" />
            <h2 className="text-xl font-semibold mb-2">Listing not found</h2>
            <p className="text-muted-foreground mb-4">This listing may have been removed or does not exist</p>
            <Button onClick={() => router.back()}>Go Back</Button>
          </div>
        </DashboardLayout>
      </ProtectedRoute>
    )
  }

  return (
    <ProtectedRoute>
      <DashboardLayout>
        <div className="min-h-screen">
          {/* Hero Section with Image Gallery */}
          <div className="relative">
            {/* Back Button - Fixed Position */}
            <div className="absolute top-4 left-4 z-20">
              <Button 
                variant="outline" 
                size="icon" 
                onClick={() => router.back()}
                className="bg-background/80 backdrop-blur-md border-border/50 shadow-lg hover:bg-background"
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </div>

            {/* Owner Actions - Fixed Position */}
            {(isOwner || isAdmin) && (
              <div className="absolute top-4 right-4 z-20 flex items-center gap-2">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => router.push(`/dashboard/listings/${id}/edit`)} 
                  className="bg-background/80 backdrop-blur-md border-border/50 shadow-lg hover:bg-background"
                >
                  <Edit className="h-4 w-4 mr-2" /> Edit
                </Button>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button 
                      variant="destructive" 
                      size="sm"
                      disabled={isDeleting}
                      className="shadow-lg"
                    >
                      <Trash2 className="h-4 w-4 mr-2" /> Delete
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Delete this listing?</AlertDialogTitle>
                      <AlertDialogDescription>
                        This action cannot be undone. This will permanently delete your listing.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground">
                        Delete
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            )}

            {/* Image Gallery */}
            <div className="relative aspect-[16/9] md:aspect-[21/9] bg-muted overflow-hidden">
              <Image
                src={listing.images[currentImageIndex] || listing.primaryImage || "/placeholder.svg"}
                alt={listing.title}
                fill
                className="object-cover"
                priority
              />
              <div className="absolute inset-0 bg-gradient-to-t from-background via-background/20 to-transparent" />
              
              {/* Image Navigation */}
              {listing.images.length > 1 && (
                <>
                  <button
                    onClick={prevImage}
                    className="absolute left-4 top-1/2 -translate-y-1/2 p-3 bg-background/80 backdrop-blur-md rounded-xl hover:bg-background transition-colors shadow-lg"
                  >
                    <ChevronLeft className="h-6 w-6" />
                  </button>
                  <button
                    onClick={nextImage}
                    className="absolute right-4 top-1/2 -translate-y-1/2 p-3 bg-background/80 backdrop-blur-md rounded-xl hover:bg-background transition-colors shadow-lg"
                  >
                    <ChevronRight className="h-6 w-6" />
                  </button>
                </>
              )}

              {/* Status & Featured Badges */}
              <div className="absolute top-4 left-1/2 -translate-x-1/2 flex items-center gap-2">
                <Badge className={cn("shadow-lg", getStatusColor(listing.status))}>
                  {listing.status.charAt(0).toUpperCase() + listing.status.slice(1)}
                </Badge>
                {isPremium && (
                  <Badge className="bg-gradient-to-r from-violet-600 to-purple-600 text-white border-0 shadow-lg">
                    <Crown className="h-3.5 w-3.5 mr-1" /> Premium
                  </Badge>
                )}
                {isHighValue && !isPremium && (
                  <Badge className="bg-gradient-to-r from-amber-500 to-orange-500 text-white border-0 shadow-lg">
                    <Sparkles className="h-3.5 w-3.5 mr-1" /> High Value
                  </Badge>
                )}
              </div>

              {/* Live Viewing Indicator - FOMO */}
              {viewingNow > 0 && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="absolute bottom-20 left-4 flex items-center gap-2 px-4 py-2 bg-background/90 backdrop-blur-md rounded-xl shadow-lg border border-primary/20 viewers-counter"
                >
                  <span className="relative flex h-3 w-3">
                    <span className="animate-ping absolute h-full w-full rounded-full bg-red-400 opacity-75" />
                    <span className="relative rounded-full h-3 w-3 bg-red-500" />
                  </span>
                  <span className="font-medium">{viewingNow} people viewing now</span>
                </motion.div>
              )}

              {/* Image Thumbnails */}
              {listing.images.length > 1 && (
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
                  {listing.images.slice(0, 6).map((img, idx) => (
                    <button
                      key={idx}
                      onClick={() => setCurrentImageIndex(idx)}
                      className={cn(
                        "w-16 h-12 rounded-lg overflow-hidden border-2 transition-all shadow-lg",
                        idx === currentImageIndex ? "border-primary ring-2 ring-primary/30" : "border-transparent opacity-70 hover:opacity-100"
                      )}
                    >
                      <Image src={img || "/placeholder.svg"} alt="" width={64} height={48} className="object-cover w-full h-full" />
                    </button>
                  ))}
                  {listing.images.length > 6 && (
                    <div className="w-16 h-12 rounded-lg bg-background/80 backdrop-blur-sm flex items-center justify-center text-sm font-medium shadow-lg">
                      +{listing.images.length - 6}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Main Content */}
          <div className="max-w-5xl mx-auto px-4 md:px-6 -mt-16 relative z-10">
            <div className="grid md:grid-cols-3 gap-6">
              {/* Left Column - Main Info */}
              <div className="md:col-span-2 space-y-6">
                {/* Title & Value Card */}
                <Card className="overflow-hidden border-border/50 shadow-xl">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between gap-4 mb-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <Badge variant="outline" className="text-xs">
                            {listing.categoryName}
                          </Badge>
                          <Badge variant="outline" className="text-xs">
                            {listing.condition}
                          </Badge>
                        </div>
                        <h1 className="text-2xl md:text-3xl font-bold text-foreground leading-tight text-balance">
                          {listing.title}
                        </h1>
                        <p className="text-muted-foreground flex items-center gap-1.5 mt-2">
                          <MapPin className="h-4 w-4" />
                          {listing.location.town ? `${listing.location.town}, ${listing.location.region}` : listing.location.region}
                        </p>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p className="text-xs text-muted-foreground mb-1">Item Value</p>
                        <p className="text-3xl md:text-4xl font-bold text-primary value-highlight">
                          N${listing.value.toLocaleString()}
                        </p>
                        <p className="text-xs text-muted-foreground">or trade equivalent</p>
                      </div>
                    </div>

                    {/* Urgency Banner - FOMO */}
                    {urgency && (
                      <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className={cn(
                          "flex items-center gap-3 p-3 rounded-xl mb-4",
                          urgency.level === "critical" ? "bg-destructive/10 border border-destructive/20" :
                          urgency.level === "high" ? "bg-amber-500/10 border border-amber-500/20" :
                          "bg-emerald-500/10 border border-emerald-500/20"
                        )}
                      >
                        {urgency.level === "critical" ? (
                          <Zap className="h-5 w-5 text-destructive urgency-badge" />
                        ) : urgency.level === "high" ? (
                          <Flame className="h-5 w-5 text-amber-500" />
                        ) : (
                          <TrendingUp className="h-5 w-5 text-emerald-500" />
                        )}
                        <div className="flex-1">
                          <p className={cn(
                            "font-semibold",
                            urgency.level === "critical" ? "text-destructive" :
                            urgency.level === "high" ? "text-amber-500" : "text-emerald-500"
                          )}>
                            {urgency.message}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {recentOffers > 0 ? `${recentOffers} recent offers` : "Multiple people interested"}
                          </p>
                        </div>
                        {urgency.level === "critical" && (
                          <Badge className="bg-destructive text-destructive-foreground border-0 fomo-badge">
                            Act Fast
                          </Badge>
                        )}
                      </motion.div>
                    )}

                    {/* Interest Level Gauge */}
                    {interestScore > 20 && (
                      <div className="mb-4">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium flex items-center gap-1.5">
                            <Target className="h-4 w-4 text-primary" />
                            Community Interest
                          </span>
                          <span className="text-sm text-muted-foreground">{interestScore}%</span>
                        </div>
                        <InterestGauge percentage={interestScore} />
                      </div>
                    )}

                    {/* Live Stats */}
                    <div className="flex flex-wrap items-center gap-3">
                      <motion.div 
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-blue-500/10"
                        whileHover={{ scale: 1.05 }}
                      >
                        <Eye className="h-4 w-4 text-blue-500" />
                        <AnimatedCounter value={viewsCount} className="font-medium text-blue-500" />
                        <span className="text-xs text-blue-500/70">views</span>
                      </motion.div>
                      
                      <motion.button 
                        onClick={handleLike}
                        disabled={isLiking}
                        className={cn(
                          "flex items-center gap-1.5 px-3 py-1.5 rounded-full transition-all",
                          isLiked ? "bg-rose-500/10" : "bg-muted/50 hover:bg-rose-500/10"
                        )}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        <Heart className={cn("h-4 w-4", isLiked ? "text-rose-500 fill-rose-500" : "text-muted-foreground")} />
                        <AnimatedCounter value={likesCount} className={cn("font-medium", isLiked ? "text-rose-500" : "text-foreground")} />
                        <span className={cn("text-xs", isLiked ? "text-rose-500/70" : "text-muted-foreground")}>likes</span>
                      </motion.button>
                      
                      <motion.button 
                        onClick={handleSave}
                        disabled={isSaving}
                        className={cn(
                          "flex items-center gap-1.5 px-3 py-1.5 rounded-full transition-all",
                          isSaved ? "bg-primary/10" : "bg-muted/50 hover:bg-primary/10"
                        )}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        <Bookmark className={cn("h-4 w-4", isSaved ? "text-primary fill-primary" : "text-muted-foreground")} />
                        <span className={cn("text-sm", isSaved ? "text-primary font-medium" : "text-foreground")}>
                          {isSaved ? "Saved" : "Save"}
                        </span>
                      </motion.button>
                      
                      <motion.button 
                        onClick={handleShare}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-muted/50 hover:bg-muted transition-all"
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        {copiedLink ? (
                          <Check className="h-4 w-4 text-emerald-500" />
                        ) : (
                          <Share2 className="h-4 w-4 text-muted-foreground" />
                        )}
                        <span className="text-sm">{copiedLink ? "Copied!" : "Share"}</span>
                      </motion.button>
                    </div>
                  </CardContent>
                </Card>

                {/* Description */}
                <Card className="border-border/50">
                  <CardContent className="p-6">
                    <h3 className="font-semibold text-lg mb-3">Description</h3>
                    <p className="text-muted-foreground whitespace-pre-wrap leading-relaxed">
                      {listing.description}
                    </p>
                  </CardContent>
                </Card>

                {/* Trade Preferences */}
                <Card className="border-primary/20 bg-gradient-to-br from-primary/5 via-transparent to-transparent">
                  <CardContent className="p-6">
                    <div className="flex items-center gap-2 mb-4">
                      <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                        <ArrowRightLeft className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-lg">What the Trader Wants</h3>
                        <p className="text-xs text-muted-foreground">Items or services they are looking for in exchange</p>
                      </div>
                    </div>
                    
                    {listing.wantedItems.length > 0 ? (
                      <div className="space-y-3">
                        {listing.wantedItems.map((item, idx) => (
                          <motion.div 
                            key={item.id}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: idx * 0.1 }}
                            className="flex items-center gap-3 p-4 bg-card rounded-xl border border-border/50 hover:border-primary/30 transition-colors"
                          >
                            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center flex-shrink-0">
                              <CheckCircle className="h-4 w-4 text-emerald-500" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-foreground">{item.description}</p>
                              {item.estimatedValue && (
                                <p className="text-sm text-muted-foreground">Estimated: N${item.estimatedValue.toLocaleString()}</p>
                              )}
                            </div>
                            {item.isFlexible && (
                              <Badge variant="secondary" className="text-xs flex-shrink-0">Flexible</Badge>
                            )}
                          </motion.div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-6 bg-muted/30 rounded-xl">
                        <Sparkles className="h-8 w-8 mx-auto text-primary/50 mb-2" />
                        <p className="text-muted-foreground">
                          Open to all offers! Make a proposal with what you have.
                        </p>
                      </div>
                    )}
                    
                    <p className="text-xs text-muted-foreground mt-4 flex items-center gap-1.5 p-3 bg-muted/30 rounded-lg">
                      <Shield className="h-4 w-4 text-primary" />
                      This is a barter platform. Trade goods and services instead of cash payments.
                    </p>
                  </CardContent>
                </Card>

                {/* Comments Section */}
                <Card className="border-border/50">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between mb-6">
                      <h3 className="text-lg font-semibold flex items-center gap-2">
                        <MessageCircle className="h-5 w-5 text-primary" />
                        Comments
                        <Badge variant="secondary" className="ml-1">{comments.length}</Badge>
                      </h3>
                      {comments.length > 0 && (
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <TrendingUp className="h-3 w-3" />
                          Active discussion
                        </div>
                      )}
                    </div>

                    {/* Comment Form */}
                    {user ? (
                      <form onSubmit={handleCommentSubmit} className="mb-6">
                        <div className="flex gap-3">
                          <Avatar className="h-10 w-10 flex-shrink-0">
                            <AvatarImage src={user.avatar || "/placeholder.svg"} />
                            <AvatarFallback className="bg-primary text-primary-foreground">
                              {user.name?.charAt(0) || "U"}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 space-y-2">
                            {replyingTo && (
                              <div className="flex items-center gap-2 text-sm">
                                <span className="text-muted-foreground">Replying to comment</span>
                                <button type="button" onClick={() => setReplyingTo(null)} className="text-primary hover:underline">
                                  Cancel
                                </button>
                              </div>
                            )}
                            <div className="flex gap-2">
                              <Input
                                value={newComment}
                                onChange={(e) => setNewComment(e.target.value)}
                                placeholder={replyingTo ? "Write a reply..." : "Write a comment..."}
                                className="flex-1 h-11 rounded-xl"
                              />
                              <Button type="submit" size="icon" disabled={!newComment.trim() || isSubmittingComment} className="h-11 w-11 rounded-xl">
                                {isSubmittingComment ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                              </Button>
                            </div>
                          </div>
                        </div>
                      </form>
                    ) : (
                      <div className="mb-6 p-4 rounded-xl bg-muted/50 text-center">
                        <p className="text-sm text-muted-foreground">
                          Please <Link href="/login" className="text-primary hover:underline">log in</Link> to comment
                        </p>
                      </div>
                    )}

                    {/* Comments List */}
                    <div className="space-y-4">
                      {commentsLoading && (
                        <div className="space-y-4">
                          {[1, 2, 3].map((i) => (
                            <div key={i} className="flex gap-3">
                              <Skeleton className="h-10 w-10 rounded-full flex-shrink-0" />
                              <div className="flex-1 space-y-2">
                                <Skeleton className="h-4 w-32" />
                                <Skeleton className="h-4 w-full" />
                              </div>
                            </div>
                          ))}
                        </div>
                      )}

                      {!commentsLoading && comments.length === 0 && (
                        <div className="text-center py-10">
                          <MessageCircle className="h-12 w-12 mx-auto text-muted-foreground/30 mb-3" />
                          <p className="text-muted-foreground">No comments yet</p>
                          <p className="text-sm text-muted-foreground/70">Be the first to share your thoughts!</p>
                        </div>
                      )}

                      {!commentsLoading && comments.map((comment) => (
                        <motion.div
                          key={comment.id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="flex gap-3 p-4 rounded-xl bg-muted/30 hover:bg-muted/50 transition-colors"
                        >
                          <Avatar className="h-10 w-10 flex-shrink-0">
                            <AvatarImage src={comment.user.avatar || "/placeholder.svg"} />
                            <AvatarFallback className="bg-gradient-to-br from-primary to-amber-500 text-white">
                              {comment.user.name.charAt(0)}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="font-medium text-foreground">{comment.user.name}</span>
                              {comment.user.isVerified && <BadgeCheck className="h-4 w-4 text-blue-500" />}
                              <span className="text-xs text-muted-foreground">{formatRelativeTime(comment.createdAt)}</span>
                            </div>
                            <p className="text-sm text-foreground/90 leading-relaxed">{comment.content}</p>
                            <div className="flex items-center gap-4 mt-2">
                              <button className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground">
                                <ThumbsUp className="h-3.5 w-3.5" /> Like
                              </button>
                              <button onClick={() => setReplyingTo(comment.id)} className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground">
                                <Reply className="h-3.5 w-3.5" /> Reply
                              </button>
                            </div>
                            
                            {comment.replies && comment.replies.length > 0 && (
                              <div className="mt-4 pl-4 border-l-2 border-border space-y-3">
                                {comment.replies.map((reply) => (
                                  <div key={reply.id} className="flex gap-2">
                                    <Avatar className="h-8 w-8">
                                      <AvatarImage src={reply.user.avatar || "/placeholder.svg"} />
                                      <AvatarFallback className="text-xs">{reply.user.name.charAt(0)}</AvatarFallback>
                                    </Avatar>
                                    <div>
                                      <div className="flex items-center gap-2">
                                        <span className="text-sm font-medium">{reply.user.name}</span>
                                        <span className="text-xs text-muted-foreground">{formatRelativeTime(reply.createdAt)}</span>
                                      </div>
                                      <p className="text-sm text-foreground/90">{reply.content}</p>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Advertisements */}
                <AdBannerCarousel position="listing-detail" height="md" showControls className="rounded-xl overflow-hidden" />
              </div>

              {/* Right Column - Action Sidebar */}
              <div className="space-y-4">
                {/* CTA Card - Sticky */}
                <div className="sticky top-24">
                  {/* Main CTA */}
                  {!isOwner && (
                    <Card className="border-primary/30 shadow-xl overflow-hidden mb-4">
                      <div className="h-1 bg-gradient-to-r from-primary via-emerald-500 to-primary" />
                      <CardContent className="p-5">
                        <h4 className="font-semibold text-lg mb-4">Interested in this trade?</h4>
                        
                        <div className="space-y-3 mb-5">
                          <Button 
                            onClick={() => setShowMakeOfferModal(true)}
                            className="w-full h-12 rounded-xl bg-primary hover:bg-primary/90 font-semibold text-base btn-enterprise"
                          >
                            <ArrowRightLeft className="h-5 w-5 mr-2" />
                            Make an Offer
                          </Button>
                          <Button 
  variant="outline" 
  onClick={() => setShowMessageModal(true)}
  className="w-full h-12 rounded-xl bg-transparent font-medium"
>
  <MessageCircle className="h-5 w-5 mr-2" />
  Message Trader
</Button>

                          {isHighValue && (
                            <Button 
                              variant="outline" 
                              onClick={() => setShowRequestDocumentsModal(true)}
                              className="w-full h-11 rounded-xl bg-transparent text-amber-500 border-amber-500/50 hover:bg-amber-500/10"
                            >
                              <FileText className="h-4 w-4 mr-2" />
                              Request Documents
                            </Button>
                          )}
                        </div>

                        {/* Safety Notice */}
                        <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl">
                          <div className="flex items-start gap-2">
                            <Shield className="h-4 w-4 text-amber-500 mt-0.5 flex-shrink-0" />
                            <div className="text-xs">
                              <p className="font-medium text-amber-500 mb-0.5">Trade Safely</p>
                              <p className="text-muted-foreground">Meet in public places and verify items before trading.</p>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {/* Trader Card */}
                  <Card className="border-border/50 mb-4">
                    <CardContent className="p-5">
                      <h4 className="font-medium text-sm text-muted-foreground mb-3">Trader Information</h4>
                      <div className="flex items-center gap-3 mb-4">
                        <Avatar className="h-14 w-14 ring-2 ring-primary/20">
                          <AvatarImage src={listing.user.avatar || "/placeholder.svg"} />
                          <AvatarFallback className="bg-gradient-to-br from-primary to-amber-500 text-white text-lg">
                            {listing.user.name.charAt(0)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5">
                            <span className="font-semibold text-foreground truncate">{listing.user.name}</span>
                            {listing.user.isVerified && <BadgeCheck className="h-4 w-4 text-primary flex-shrink-0" />}
                          </div>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
                            {listing.user.rating && (
                              <span className="flex items-center gap-0.5 text-amber-500">
                                <Star className="h-3.5 w-3.5 fill-current" />
                                {listing.user.rating}
                              </span>
                            )}
                            <span>{listing.user.tradeCount} trades</span>
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3 mb-4">
                        <div className="p-3 bg-muted/50 rounded-xl text-center">
                          <p className="text-lg font-bold text-foreground">{listing.user.listingCount}</p>
                          <p className="text-xs text-muted-foreground">Listings</p>
                        </div>
                        <div className="p-3 bg-muted/50 rounded-xl text-center">
                          <p className="text-lg font-bold text-foreground">{listing.user.tradeCount}</p>
                          <p className="text-xs text-muted-foreground">Trades</p>
                        </div>
                      </div>

                      <Button variant="outline" className="w-full rounded-xl bg-transparent" asChild>
                        <Link href={`/users/${listing.user.id}`}>
                          View Profile
                          <ExternalLink className="h-4 w-4 ml-2" />
                        </Link>
                      </Button>
                    </CardContent>
                  </Card>

                  {/* Social Proof Notifications - FOMO */}
                  {socialProofNotifications.length > 0 && (
                    <div className="mb-4">
                      <SocialProofNotification notifications={socialProofNotifications} />
                    </div>
                  )}

                  {/* Listing Info */}
                  <Card className="border-border/50">
                    <CardContent className="p-4">
                      <div className="space-y-3 text-sm">
                        <div className="flex items-center justify-between">
                          <span className="text-muted-foreground flex items-center gap-1.5">
                            <Clock className="h-4 w-4" /> Listed
                          </span>
                          <span className="text-foreground">{formatRelativeTime(listing.createdAt)}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-muted-foreground flex items-center gap-1.5">
                            <Eye className="h-4 w-4" /> Total Views
                          </span>
                          <span className="text-foreground font-medium">{viewsCount.toLocaleString()}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-muted-foreground flex items-center gap-1.5">
                            <Bookmark className="h-4 w-4" /> Saved
                          </span>
                          <span className="text-foreground font-medium">{listing.saves}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-muted-foreground flex items-center gap-1.5">
                            <Users className="h-4 w-4" /> Viewing Now
                          </span>
                          <span className="text-foreground font-medium flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                            {viewingNow}
                          </span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </div>
          </div>
        </div>

     <MakeOfferModal
  open={showMakeOfferModal}
  onOpenChange={setShowMakeOfferModal}
  listing={listing}
/>
  

        {/* Enterprise Trade Details Modal */}
        <Dialog open={showTradeDetailsModal} onOpenChange={setShowTradeDetailsModal}>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Eye className="h-5 w-5 text-primary" />
                Trade Details
              </DialogTitle>
              <DialogDescription>
                Full details about this trade listing
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 rounded-xl bg-muted/50">
                  <p className="text-xs text-muted-foreground mb-1">Item Value</p>
                  <p className="text-xl font-bold text-primary">N${listing.value.toLocaleString()}</p>
                </div>
                <div className="p-4 rounded-xl bg-muted/50">
                  <p className="text-xs text-muted-foreground mb-1">Condition</p>
                  <p className="text-xl font-bold text-foreground">{listing.condition}</p>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-muted/50">
                <p className="text-xs text-muted-foreground mb-2">Category</p>
                <Badge variant="outline">{listing.categoryName}</Badge>
              </div>

              <div className="p-4 rounded-xl bg-muted/50">
                <p className="text-xs text-muted-foreground mb-2">Location</p>
                <p className="font-medium flex items-center gap-1.5">
                  <MapPin className="h-4 w-4 text-primary" />
                  {listing.location.town ? `${listing.location.town}, ${listing.location.region}` : listing.location.region}
                </p>
              </div>

              <div className="grid grid-cols-3 gap-3 text-center">
                <div className="p-3 rounded-xl bg-blue-500/10">
                  <Eye className="h-5 w-5 text-blue-500 mx-auto mb-1" />
                  <p className="text-lg font-bold text-foreground">{viewsCount}</p>
                  <p className="text-xs text-muted-foreground">Views</p>
                </div>
                <div className="p-3 rounded-xl bg-rose-500/10">
                  <Heart className="h-5 w-5 text-rose-500 mx-auto mb-1" />
                  <p className="text-lg font-bold text-foreground">{likesCount}</p>
                  <p className="text-xs text-muted-foreground">Likes</p>
                </div>
                <div className="p-3 rounded-xl bg-amber-500/10">
                  <Bookmark className="h-5 w-5 text-amber-500 mx-auto mb-1" />
                  <p className="text-lg font-bold text-foreground">{listing.saves}</p>
                  <p className="text-xs text-muted-foreground">Saves</p>
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button 
                variant="outline" 
                onClick={() => setShowTradeDetailsModal(false)}
                className="rounded-xl bg-transparent"
              >
                Close
              </Button>
              <Button
                onClick={() => {
                  setShowTradeDetailsModal(false)
                  setShowMakeOfferModal(true)
                }}
                className="rounded-xl bg-primary hover:bg-primary/90"
              >
                <ArrowRightLeft className="mr-2 h-4 w-4" />
                Make Offer
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Enterprise Request Documents Modal */}
        <Dialog open={showRequestDocumentsModal} onOpenChange={setShowRequestDocumentsModal}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-amber-500" />
                Request Documents
              </DialogTitle>
              <DialogDescription>
                Request proof of ownership, receipts, or other documentation for this high-value item
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20">
                <div className="flex items-start gap-3">
                  <Shield className="h-5 w-5 text-amber-500 mt-0.5" />
                  <div>
                    <p className="font-medium text-amber-500 text-sm">High-Value Item Protection</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      For items valued at N$20,000+, we recommend requesting documentation to verify authenticity and ownership.
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="doc-message" className="text-sm font-medium">
                  Message to Trader
                </Label>
                <Textarea
                  id="doc-message"
                  placeholder="Specify what documents you would like to see..."
                  value={documentRequestMessage}
                  onChange={(e) => setDocumentRequestMessage(e.target.value)}
                  rows={4}
                  className="rounded-xl resize-none"
                  disabled={isRequestingDocuments}
                />
                <p className="text-[10px] text-muted-foreground">
                  Examples: proof of purchase, ownership papers, service history, authenticity certificates
                </p>
              </div>
            </div>

            <DialogFooter className="gap-2 sm:gap-2">
              <Button 
                variant="outline" 
                onClick={() => setShowRequestDocumentsModal(false)} 
                disabled={isRequestingDocuments}
                className="rounded-xl bg-transparent"
              >
                Cancel
              </Button>
              <Button
                onClick={handleRequestDocuments}
                disabled={isRequestingDocuments}
                className="rounded-xl min-w-[140px] bg-amber-500 hover:bg-amber-600 text-white"
              >
                {isRequestingDocuments ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Sending...
                  </>
                ) : (
                  <>
                    <FileText className="mr-2 h-4 w-4" />
                    Send Request
                  </>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
	
      </DashboardLayout>
    </ProtectedRoute>
  )
}
