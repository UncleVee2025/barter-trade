"use client"

import { useState, useEffect, useRef, useCallback, useMemo } from "react"
import { motion, AnimatePresence, useInView } from "framer-motion"
import {
  Plus,
  ArrowRight,
  Clock,
  Heart,
  Flame,
  ChevronRight,
  BadgeCheck,
  ArrowUpRight,
  ChevronLeft,
  Eye,
  TrendingUp,
  Calendar,
  Zap,
  ArrowRightLeft,
  Shield,
  MapPin,
  Search,
  Layers,
  Crown,
  Sparkles,
  RefreshCw,
  Sun,
  Moon,
  Sunrise,
  Sunset,
  Star,
  Wallet,
  History,
  Activity,
  Users,
  Package,
  ArrowDownRight,
  ExternalLink,
  Bell,
  Target,
  Trophy,
  Timer,
  AlertCircle,
  CheckCircle2,
  Gift,
  Rocket,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useWallet } from "@/contexts/wallet-context"
import { useAuth } from "@/contexts/auth-context"
import { UserAvatar } from "@/components/ui/user-avatar"
import {
  SmartphoneIcon,
  CarIcon,
  HomeIcon,
  ShirtIcon,
  CowIcon,
  WrenchIcon,
  GemIcon,
  SofaIcon,
  WheatIcon,
} from "@/components/icons/modern-icons"
import Link from "next/link"
import Image from "next/image"
import { cn } from "@/lib/utils"
import useSWR from "swr"
import { UnifiedListingCard, type UnifiedListingData } from "@/components/listings/unified-listing-card"
import { ModernListingModal } from "@/components/listings/modern-listing-modal"

// SWR fetcher with refresh
const fetcher = (url: string) => fetch(url).then((res) => res.json())

// Currency formatter for NAD (Namibian Dollars)
function formatNAD(amount: number): string {
  return `N$ ${amount.toLocaleString("en-NA", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

// Animated counter with smooth counting effect
function AnimatedCounter({ 
  value, 
  prefix = "", 
  suffix = "",
  duration = 1500,
  decimals = 0
}: { 
  value: number
  prefix?: string
  suffix?: string
  duration?: number
  decimals?: number
}) {
  const [count, setCount] = useState(0)
  const ref = useRef<HTMLSpanElement>(null)
  const isInView = useInView(ref, { once: true })

  useEffect(() => {
    if (!isInView) return
    
    let startTime: number
    let animationFrame: number
    
    const animate = (currentTime: number) => {
      if (!startTime) startTime = currentTime
      const progress = Math.min((currentTime - startTime) / duration, 1)
      
      const easeOutExpo = 1 - Math.pow(2, -10 * progress)
      const currentValue = easeOutExpo * value
      setCount(decimals > 0 ? parseFloat(currentValue.toFixed(decimals)) : Math.floor(currentValue))
      
      if (progress < 1) {
        animationFrame = requestAnimationFrame(animate)
      }
    }
    
    animationFrame = requestAnimationFrame(animate)
    return () => cancelAnimationFrame(animationFrame)
  }, [value, duration, isInView, decimals])

  return (
    <span ref={ref} className="tabular-nums font-mono">
      {prefix}{decimals > 0 ? count.toFixed(decimals) : count.toLocaleString()}{suffix}
    </span>
  )
}

// Live status indicator
function LiveIndicator({ isLive = true }: { isLive?: boolean }) {
  return (
    <div className="flex items-center gap-2">
      <div className="relative">
        <div className={cn(
          "w-2 h-2 rounded-full",
          isLive ? "bg-emerald-500" : "bg-muted-foreground"
        )}>
          {isLive && (
            <div className="absolute inset-0 rounded-full bg-emerald-500 animate-ping opacity-75" />
          )}
        </div>
      </div>
      <span className={cn(
        "text-xs font-medium",
        isLive ? "text-emerald-600" : "text-muted-foreground"
      )}>
        {isLive ? "Live" : "Offline"}
      </span>
    </div>
  )
}

// FOMO Live Activity Ticker - Shows real-time trading activity from database
function LiveActivityTicker() {
  // Fetch recent activity from API
  const { data: activityData } = useSWR("/api/public/recent-trades?limit=10", fetcher, { refreshInterval: 30000 })
  
  const activities = useMemo(() => {
    // Use real data from API if available
    if (activityData?.activities && activityData.activities.length > 0) {
      return activityData.activities.map((a: Record<string, unknown>) => ({
        user: a.userName || "A trader",
        action: a.action || "made a trade",
        item: a.itemTitle || "an item",
        region: a.region || "Namibia",
        time: a.timeAgo || "recently"
      }))
    }
    // Return empty array if no data - component will show nothing
    return []
  }, [activityData])
  
  const [currentIndex, setCurrentIndex] = useState(0)
  
  useEffect(() => {
    if (activities.length === 0) return
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % activities.length)
    }, 4000)
    return () => clearInterval(interval)
  }, [activities.length])

  // Don't render if no real activity data
  if (activities.length === 0) {
    return null
  }
  
  return (
    <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-gradient-to-r from-amber-500/10 to-orange-500/10 border border-amber-500/20 overflow-hidden">
      <motion.div
        animate={{ scale: [1, 1.2, 1] }}
        transition={{ duration: 0.5, repeat: Number.POSITIVE_INFINITY, repeatDelay: 3 }}
      >
        <Zap className="h-3.5 w-3.5 text-amber-400" />
      </motion.div>
      <AnimatePresence mode="wait">
        <motion.span
          key={currentIndex}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.3 }}
          className="text-xs text-slate-300 truncate max-w-[200px] sm:max-w-[300px]"
        >
          <span className="font-medium text-amber-300">{activities[currentIndex]?.user}</span>
          {" "}{activities[currentIndex]?.action}{" "}
          <span className="text-white">{activities[currentIndex]?.item}</span>
        </motion.span>
      </AnimatePresence>
    </div>
  )
}

// Urgency Banner Component
function UrgencyBanner({ count = 24, type = "viewing" }: { count?: number; type?: "viewing" | "sold" | "expiring" }) {
  const messages = {
    viewing: { icon: Eye, text: `${count} people viewing trades now`, color: "text-cyan-400" },
    sold: { icon: CheckCircle2, text: `${count} items traded in last hour`, color: "text-emerald-400" },
    expiring: { icon: Timer, text: `${count} deals expiring soon`, color: "text-amber-400" },
  }
  const { icon: Icon, text, color } = messages[type]
  
  return (
    <motion.div 
      className="flex items-center gap-2"
      animate={{ opacity: [0.7, 1, 0.7] }}
      transition={{ duration: 2, repeat: Number.POSITIVE_INFINITY }}
    >
      <Icon className={cn("h-3.5 w-3.5", color)} />
      <span className={cn("text-xs font-medium", color)}>{text}</span>
    </motion.div>
  )
}

// Achievement Toast Component
function AchievementBadge({ achievement }: { achievement: { title: string; description: string; icon: string } }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8, y: 20 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      className="flex items-center gap-3 px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500/20 to-orange-500/20 border border-amber-500/30"
    >
      <div className="text-2xl">{achievement.icon}</div>
      <div>
        <p className="text-sm font-semibold text-amber-300">{achievement.title}</p>
        <p className="text-xs text-amber-200/70">{achievement.description}</p>
      </div>
    </motion.div>
  )
}

// Category icon mapping
const categoryIcons: Record<string, typeof SmartphoneIcon> = {
  electronics: SmartphoneIcon,
  vehicles: CarIcon,
  property: HomeIcon,
  "home-garden": SofaIcon,
  fashion: ShirtIcon,
  livestock: CowIcon,
  services: WrenchIcon,
  collectibles: GemIcon,
  agriculture: WheatIcon,
  other: GemIcon,
}

// Category colors mapping - Modern vibrant palette
const categoryColors: Record<string, { gradient: string; bg: string; text: string; border: string }> = {
  electronics: { gradient: "from-blue-500 to-cyan-400", bg: "bg-blue-50", text: "text-blue-600", border: "border-blue-200" },
  vehicles: { gradient: "from-rose-500 to-orange-400", bg: "bg-rose-50", text: "text-rose-600", border: "border-rose-200" },
  property: { gradient: "from-amber-500 to-yellow-400", bg: "bg-amber-50", text: "text-amber-600", border: "border-amber-200" },
  "home-garden": { gradient: "from-teal-500 to-emerald-400", bg: "bg-teal-50", text: "text-teal-600", border: "border-teal-200" },
  fashion: { gradient: "from-pink-500 to-rose-400", bg: "bg-pink-50", text: "text-pink-600", border: "border-pink-200" },
  livestock: { gradient: "from-lime-500 to-green-400", bg: "bg-lime-50", text: "text-lime-600", border: "border-lime-200" },
  services: { gradient: "from-violet-500 to-purple-400", bg: "bg-violet-50", text: "text-violet-600", border: "border-violet-200" },
  collectibles: { gradient: "from-indigo-500 to-blue-400", bg: "bg-indigo-50", text: "text-indigo-600", border: "border-indigo-200" },
  agriculture: { gradient: "from-emerald-500 to-teal-400", bg: "bg-emerald-50", text: "text-emerald-600", border: "border-emerald-200" },
  sports: { gradient: "from-cyan-500 to-blue-400", bg: "bg-cyan-50", text: "text-cyan-600", border: "border-cyan-200" },
  other: { gradient: "from-gray-500 to-slate-400", bg: "bg-gray-50", text: "text-gray-600", border: "border-gray-200" },
}

function ListingCard({
  listing,
  index,
}: {
  listing: Record<string, unknown>
  index: number
}) {
  const colors =
    categoryColors[(listing.category as string) || "other"] ||
    categoryColors.other

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.03 * index }}
    >
      <Link href={`/dashboard/listings/${listing.id}`}>
        <Card className="overflow-hidden hover:shadow-xl transition-all duration-300 border-border/50 hover:border-primary/30 group cursor-pointer bg-card">

          {/* IMAGE */}
          <div className="relative aspect-[4/3] overflow-hidden bg-muted">
            <Image
              src={(listing.primaryImage as string) || "/placeholder.svg"}
              alt={listing.title as string}
              fill
              className="object-cover group-hover:scale-105 transition-transform duration-500"
            />

            {listing.featured && (
              <div className="absolute top-2 left-2">
                <Badge className="bg-gradient-to-r from-amber-500 to-orange-500 text-white border-0 gap-1">
                  <Flame className="h-3 w-3" />
                  Hot
                </Badge>
              </div>
            )}

            <button
              type="button"
              className="absolute top-2 right-2 w-8 h-8 rounded-full bg-white/90 backdrop-blur-sm flex items-center justify-center shadow-lg opacity-0 group-hover:opacity-100 transition-opacity hover:bg-white hover:text-rose-500"
            >
              <Heart className="h-4 w-4" />
            </button>

            <div className="absolute bottom-2 left-2">
              <Badge
                variant="secondary"
                className={cn("text-xs", colors.bg, colors.text, colors.border)}
              >
                {listing.categoryName || "Other"}
              </Badge>
            </div>
          </div>

          {/* CONTENT */}
          <CardContent className="p-4">
            <h3 className="font-semibold text-foreground line-clamp-1 group-hover:text-primary transition-colors">
              {listing.title as string}
            </h3>

            <p className="text-lg font-bold text-primary mt-1">
              {formatNAD(Number(listing.value) || 0)}
            </p>

            <div className="flex items-center justify-between mt-3 text-xs text-muted-foreground">
              <div className="flex items-center gap-1">
                <MapPin className="h-3 w-3" />
                <span>
                  {(listing.location as { region?: string })?.region || "Unknown"}
                </span>
              </div>

              <div className="flex items-center gap-3">
                <span className="flex items-center gap-1">
                  <Eye className="h-3 w-3" />
                  {(listing.views as number) || 0}
                </span>
                <span className="flex items-center gap-1">
                  <Heart className="h-3 w-3" />
                  {(listing.saves as number) || 0}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2 mt-3 pt-3 border-t border-border/50">
              <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center overflow-hidden">
                {(listing.user as { avatar?: string })?.avatar ? (
                  <Image
                    src={(listing.user as { avatar?: string }).avatar || "/placeholder.svg"}
                    alt=""
                    width={24}
                    height={24}
                    className="object-cover"
                  />
                ) : (
                  <span className="text-xs font-medium text-primary">
                    {((listing.user as { name?: string })?.name || "U").charAt(0)}
                  </span>
                )}
              </div>

              <span className="text-xs text-muted-foreground truncate">
                {(listing.user as { name?: string })?.name || "Unknown"}
              </span>

              {(listing.user as { isVerified?: boolean })?.isVerified && (
                <BadgeCheck className="h-3.5 w-3.5 text-blue-500 flex-shrink-0" />
              )}
            </div>
          </CardContent>

        </Card>
      </Link>
    </motion.div>
  )
}


// Ad Banner Component - Premium In-Feed Ad with Database Position Support
function AdBanner({ ad, index }: { ad: Record<string, unknown>; index: number }) {
  // Track ad impression on render
  useEffect(() => {
    if (ad.id) {
      // Fire and forget impression tracking
      fetch(`/api/ads/${ad.id}/impression`, { method: 'POST' }).catch(() => {})
    }
  }, [ad.id])

  // Handle ad click tracking
  const handleClick = () => {
    if (ad.id) {
      fetch(`/api/ads/${ad.id}/click`, { method: 'POST' }).catch(() => {})
    }
  }

  const hasImage = !!ad.image_url

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: 0.05 * index }}
      className="col-span-1 sm:col-span-2"
    >
      <Card
  onClick={() => {
    handleClick()
    window.location.href =
      (ad.cta_href as string) ||
      (ad.link_url as string) ||
      "#"
  }}
  className={cn(
    "overflow-hidden h-full border-0 group cursor-pointer min-h-[200px] relative",
    hasImage ? "bg-slate-900" : `bg-gradient-to-br ${(ad.gradient_colors as string) || 'from-primary to-cyan-500'}`
  )}
>

          {/* Background Image if available */}
          {hasImage && (
            <>
              <Image
                src={(ad.image_url as string) || "/placeholder.svg"}
                alt={ad.title as string || "Advertisement"}
                fill
                className="object-cover opacity-60 group-hover:opacity-70 transition-opacity duration-300"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/60 to-transparent" />
            </>
          )}
          
          <div className="relative z-10 p-6 h-full flex flex-col justify-end">
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-4">
                <Badge className="bg-white/20 text-white border-0 backdrop-blur-sm">
                  <Sparkles className="h-3 w-3 mr-1" />
                  Sponsored
                </Badge>
                {ad.priority && Number(ad.priority) > 50 && (
                  <Badge className="bg-amber-500/20 text-amber-300 border-amber-500/30">
                    Featured
                  </Badge>
                )}
              </div>
              <Button 
                size="sm" 
                className="bg-white text-slate-900 hover:bg-white/90 rounded-xl shadow-lg group-hover:shadow-xl transition-all"
              >
                {(ad.cta_text as string) || "Learn More"}
                <ArrowRight className="h-4 w-4 ml-2 group-hover:translate-x-1 transition-transform" />
              </Button>
            </div>
            
            <h3 className="text-xl font-bold text-white mb-2 group-hover:text-primary transition-colors">
              {ad.title as string}
            </h3>
            
            {(ad.subtitle || ad.description) && (
              <p className="text-white/80 text-sm mb-4 line-clamp-2">
                {(ad.subtitle as string) || (ad.description as string)}
              </p>
            )}
            
            <div className="flex items-center justify-between">
             <Button
  size="sm"
  className="bg-white text-slate-900 hover:bg-white/90 rounded-xl shadow-lg group-hover:shadow-xl transition-all"
  onClick={(e) => {
    e.stopPropagation()
    window.location.href = "/dashboard/wallet"
  }}
>
  <History className="h-4 w-4 mr-2" />
  History
</Button>


             <Button
  size="sm"
  className="bg-gradient-to-r from-emerald-500 to-cyan-500 text-white shadow-lg h-10"
  onClick={(e) => {
    e.stopPropagation()
    window.location.href = "/dashboard/wallet"
  }}
>
  <Plus className="h-4 w-4 mr-2" />
  Top Up
</Button>


            </div>
          </div>

          {/* Decorative elements */}
          {!hasImage && (
            <div className="absolute top-0 right-0 opacity-10">
              <Sparkles className="h-32 w-32 text-white" />
            </div>
          )}
        </Card>
    </motion.div>
  )
}

export function DashboardHome() {
  const { user } = useAuth()
  const { balance, monthlyStats } = useWallet()
  const [currentTime, setCurrentTime] = useState(new Date())
  const categoryContainerRef = useRef<HTMLDivElement>(null)
  const [page, setPage] = useState(1)
  const [allListings, setAllListings] = useState<Record<string, unknown>[]>([])
  
  // Modal state for listing details
  const [selectedListing, setSelectedListing] = useState<UnifiedListingData | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)

  // Fetch real data from APIs with SWR for real-time updates
  const { data: categoriesData, isLoading: categoriesLoading } = useSWR("/api/categories", fetcher, { refreshInterval: 60000 })
  const { data: hotListingsData } = useSWR("/api/listings/trending?limit=6", fetcher, { refreshInterval: 30000 })
  const { data: listingsData, isLoading: listingsLoading, mutate: mutateListings } = useSWR(
    `/api/listings?status=active&limit=20&page=${page}`, 
    fetcher, 
    { refreshInterval: 15000 }
  )
  // Fetch ads with proper position filtering from database
  const { data: adsData } = useSWR("/api/ads?position=in-feed", fetcher, { refreshInterval: 60000 })
  const { data: bannerAdsData } = useSWR("/api/ads?position=home-banner", fetcher, { refreshInterval: 60000 })

  const categories = categoriesData?.categories || []
  const hotListings = hotListingsData?.listings || []
  const inFeedAds = adsData?.ads || []
  const bannerAds = bannerAdsData?.ads || []
  const pagination = listingsData?.pagination || {}

  // Accumulate listings for infinite scroll
  useEffect(() => {
    if (listingsData?.listings) {
      if (page === 1) {
        setAllListings(listingsData.listings)
      } else {
        setAllListings(prev => [...prev, ...listingsData.listings])
      }
    }
  }, [listingsData, page])

  // Update time every second
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000)
    return () => clearInterval(timer)
  }, [])

  // Category scroll handlers
  const scrollCategories = useCallback((direction: "left" | "right") => {
    if (categoryContainerRef.current) {
      const scrollAmount = 200
      const currentScroll = categoryContainerRef.current.scrollLeft
      const newScroll = direction === "left" 
        ? currentScroll - scrollAmount 
        : currentScroll + scrollAmount
      categoryContainerRef.current.scrollTo({ left: newScroll, behavior: "smooth" })
    }
  }, [])

  // Time-based dynamic content
  const timeOfDay = useMemo(() => {
    const hour = currentTime.getHours()
    if (hour >= 5 && hour < 12) return "morning"
    if (hour >= 12 && hour < 17) return "afternoon"
    if (hour >= 17 && hour < 21) return "evening"
    return "night"
  }, [currentTime])

  // Get greeting based on time
  const getGreeting = () => {
    const hour = currentTime.getHours()
    if (hour >= 5 && hour < 12) return "Good morning"
    if (hour >= 12 && hour < 17) return "Good afternoon"
    if (hour >= 17 && hour < 21) return "Good evening"
    return "Good night"
  }

  // Time-based icon
  const TimeIcon = useMemo(() => {
    switch (timeOfDay) {
      case "morning": return Sunrise
      case "afternoon": return Sun
      case "evening": return Sunset
      default: return Moon
    }
  }, [timeOfDay])

  // Time-based colors for hero gradient
  const heroGradient = useMemo(() => {
    switch (timeOfDay) {
      case "morning": return "from-amber-500/10 via-card to-orange-500/5"
      case "afternoon": return "from-primary/10 via-card to-cyan-500/5"
      case "evening": return "from-purple-500/10 via-card to-pink-500/5"
      default: return "from-indigo-500/10 via-card to-blue-500/5"
    }
  }, [timeOfDay])

  // Dynamic motivational messages based on time
  const motivationalMessages = useMemo(() => {
    const messages = {
      morning: [
        "Rise and trade! New opportunities await.",
        "Start your day with a great trade.",
        "Fresh listings are waiting for you!",
        "Early traders catch the best deals.",
      ],
      afternoon: [
        "Peak trading hours! Don't miss out.",
        "Traders are most active right now.",
        "Great deals are being made as we speak.",
        "Your next trade is just a click away.",
      ],
      evening: [
        "Evening traders often find hidden gems.",
        "Wind down your day with a great trade.",
        "New listings added throughout the day!",
        "Perfect time to browse and plan.",
      ],
      night: [
        "Night owls find the best deals.",
        "Quiet hours, quality listings.",
        "Plan your trades for tomorrow.",
        "Exclusive night-time listings await.",
      ],
    }
    return messages[timeOfDay]
  }, [timeOfDay])

  // Cycle through motivational messages
  const [messageIndex, setMessageIndex] = useState(0)
  useEffect(() => {
    const interval = setInterval(() => {
      setMessageIndex((prev) => (prev + 1) % motivationalMessages.length)
    }, 5000)
    return () => clearInterval(interval)
  }, [motivationalMessages.length])

  // Format date
  const formatDate = () => {
    return currentTime.toLocaleDateString("en-US", {
      weekday: "long",
      month: "short",
      day: "numeric",
    })
  }

  // Format time
  const formatTime = () => {
    return currentTime.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  // Insert ads into listings feed - position based on database priority
  const getListingsWithAds = useCallback(() => {
    const result: Array<{ type: "listing" | "ad"; data: Record<string, unknown>; index: number }> = []
    let adIndex = 0
    
    // Sort ads by priority (higher priority first)
    const sortedAds = [...inFeedAds].sort((a: Record<string, unknown>, b: Record<string, unknown>) => 
      (Number(b.priority) || 50) - (Number(a.priority) || 50)
    )
    
    allListings.forEach((listing, idx) => {
      result.push({ type: "listing", data: listing, index: idx })
      
      // Insert ad after every 4 listings (positions 4, 8, 12, etc.)
      // This respects the database position field "in-feed"
      if ((idx + 1) % 4 === 0 && adIndex < sortedAds.length) {
        result.push({ type: "ad", data: sortedAds[adIndex], index: adIndex })
        adIndex++
      }
    })
    
    return result
  }, [allListings, inFeedAds])

  // Load more listings
  const loadMore = () => {
    if (pagination.hasMore) {
      setPage(prev => prev + 1)
    }
  }

  // Refresh listings
  const refreshListings = () => {
    setPage(1)
    setAllListings([])
    mutateListings()
  }

  // Handle viewing listing details in modal
  const handleViewDetails = useCallback((listing: UnifiedListingData) => {
    setSelectedListing(listing)
    setIsModalOpen(true)
  }, [])

  // Handle making an offer (opens modal with offer tab)
  const handleMakeOffer = useCallback((listing: UnifiedListingData) => {
    setSelectedListing(listing)
    setIsModalOpen(true)
  }, [])

  // Close modal
  const handleCloseModal = useCallback(() => {
    setIsModalOpen(false)
    setSelectedListing(null)
  }, [])

  // Transform listing data for modal
  const getModalListingData = useCallback(() => {
    if (!selectedListing) return null
    
    const seller = selectedListing.seller || selectedListing.user
    return {
      id: selectedListing.id,
      title: selectedListing.title,
      description: selectedListing.description || "",
      value: selectedListing.value,
      tradeFor: selectedListing.tradeFor || selectedListing.wantedItems?.map(w => w.description),
      category: selectedListing.categoryName || selectedListing.category,
      condition: selectedListing.condition || "Good",
      region: selectedListing.location?.region || selectedListing.region || "Unknown",
      town: selectedListing.location?.town || selectedListing.town,
      images: selectedListing.images || (selectedListing.primaryImage ? [selectedListing.primaryImage] : ["/placeholder.svg"]),
      views: selectedListing.views || 0,
      viewingNow: selectedListing.viewingNow,
      saves: selectedListing.saves,
      likes: selectedListing.likes,
      hot: selectedListing.hot,
      featured: selectedListing.featured,
      createdAt: selectedListing.createdAt || new Date().toISOString(),
      seller: {
        id: seller?.id || "",
        name: seller?.name || "Unknown",
        avatar: seller?.avatar,
        gender: seller?.gender,
        rating: seller?.rating || 4.5,
        trades: seller?.trades || 0,
        verified: seller?.isVerified || seller?.verified || false,
      },
    }
  }, [selectedListing])

  return (
    <div className="space-y-6 pb-28 lg:pb-6">
      {/* Premium Hero Section - Enterprise 2026 Design */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden"
      >
        {/* Main Hero Card with Glassmorphism */}
        <div className={cn(
          "relative rounded-3xl border border-border/30 shadow-2xl overflow-hidden",
          "bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950"
        )}>
          {/* Animated mesh gradient background */}
          <div className="absolute inset-0 overflow-hidden">
            <motion.div
              className="absolute -top-32 -right-32 w-96 h-96 rounded-full bg-primary/20 blur-[100px]"
              animate={{ 
                scale: [1, 1.3, 1], 
                opacity: [0.3, 0.5, 0.3],
                x: [0, 30, 0],
                y: [0, -20, 0]
              }}
              transition={{ duration: 12, repeat: Number.POSITIVE_INFINITY, ease: "easeInOut" }}
            />
            <motion.div
              className="absolute -bottom-20 -left-20 w-72 h-72 rounded-full bg-cyan-500/20 blur-[80px]"
              animate={{ 
                scale: [1.2, 1, 1.2], 
                opacity: [0.2, 0.4, 0.2],
                x: [0, -20, 0]
              }}
              transition={{ duration: 15, repeat: Number.POSITIVE_INFINITY, ease: "easeInOut" }}
            />
            <motion.div
              className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full bg-emerald-500/10 blur-[120px]"
              animate={{ 
                scale: [1, 1.1, 1],
                opacity: [0.1, 0.2, 0.1]
              }}
              transition={{ duration: 10, repeat: Number.POSITIVE_INFINITY }}
            />
            {/* Grid pattern overlay */}
            <div className="absolute inset-0 opacity-5" style={{
              backgroundImage: 'linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)',
              backgroundSize: '50px 50px'
            }} />
          </div>

          <div className="relative p-6 lg:p-8">
            {/* Top bar with live indicators and FOMO elements */}
            <div className="flex flex-col gap-3 mb-6">
              {/* Primary status row */}
              <div className="flex items-center justify-between flex-wrap gap-3">
                <div className="flex items-center gap-3 flex-wrap">
                  {/* Live market indicator with pulse */}
                  <motion.div 
                    className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.2 }}
                  >
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                    </span>
                    <span className="text-xs font-medium text-emerald-400">Market Live</span>
                  </motion.div>
                  
                  {/* Live activity ticker - FOMO element */}
                  <div className="hidden md:block">
                    <LiveActivityTicker />
                  </div>
                  
                  {/* Time display */}
                  <motion.div 
                    className="hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.3 }}
                  >
                    <TimeIcon className="h-3.5 w-3.5 text-primary" />
                    <span className="text-xs font-mono text-slate-300">{formatDate()}</span>
                    <span className="text-slate-600">|</span>
                    <Clock className="h-3.5 w-3.5 text-slate-400" />
                    <span className="text-xs font-mono text-slate-300">{formatTime()}</span>
                  </motion.div>
                </div>

                {/* Quick actions - Desktop */}
                <div className="hidden lg:flex items-center gap-2">
                  <Button 
                    variant="ghost" 
                    size="sm"
                    className="rounded-xl text-slate-300 hover:text-white hover:bg-white/10"
                    asChild
                  >
                    <Link href="/dashboard/wallet">
                      <Wallet className="h-4 w-4 mr-2" />
                      Wallet
                    </Link>
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="sm"
                    className="rounded-xl text-slate-300 hover:text-white hover:bg-white/10"
                    asChild
                  >
                    <Link href="/dashboard/offers">
                      <Bell className="h-4 w-4 mr-2" />
                      Offers
                    </Link>
                  </Button>
                </div>
              </div>
              
              {/* FOMO urgency row - Shows social proof */}
              <motion.div 
                className="flex items-center gap-4 overflow-x-auto no-scrollbar pb-1"
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
              >
                <UrgencyBanner count={37} type="viewing" />
                <div className="hidden sm:block h-4 w-px bg-slate-700" />
                <UrgencyBanner count={12} type="sold" />
                <div className="hidden md:block h-4 w-px bg-slate-700" />
                <div className="hidden md:block">
                  <UrgencyBanner count={5} type="expiring" />
                </div>
              </motion.div>
            </div>

            {/* Main content grid */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8">
              {/* Left column - User greeting and stats */}
              <div className="lg:col-span-7 space-y-6">
                {/* User greeting */}
                <div className="flex items-start gap-4">
                  <motion.div
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="relative flex-shrink-0"
                  >
                    <Link href="/dashboard/profile">
                      <div className="relative">
                        <div className="absolute -inset-1 bg-gradient-to-br from-primary via-cyan-500 to-emerald-500 rounded-2xl blur opacity-50" />
                        <UserAvatar
                          src={user?.avatar}
                          name={user?.name}
                          gender={user?.gender}
                          size="xl"
                          ring="gradient"
                          showOnlineStatus
                          isOnline={true}
                          showVerifiedBadge
                          isVerified={user?.isVerified}
                        />
                      </div>
                    </Link>
                    {/* Level/Tier badge */}
                    <motion.div 
                      className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center border-2 border-slate-900 shadow-lg"
                      animate={{ scale: [1, 1.1, 1] }}
                      transition={{ duration: 2, repeat: Number.POSITIVE_INFINITY }}
                    >
                      <Crown className="h-4 w-4 text-white" />
                    </motion.div>
                  </motion.div>
                  
                  <div className="flex-1 min-w-0">
                    <motion.h1 
                      className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white tracking-tight mb-1"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.1 }}
                    >
                      {getGreeting()},{' '}
                      <span className="bg-gradient-to-r from-primary via-cyan-400 to-emerald-400 bg-clip-text text-transparent">
                        {user?.name?.split(" ")[0] || "Trader"}
                      </span>
                    </motion.h1>
                    
                    {/* Animated tagline */}
                    <AnimatePresence mode="wait">
                      <motion.p
                        key={messageIndex}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.4 }}
                        className="text-slate-400 text-sm sm:text-base flex items-center gap-2"
                      >
                        <Sparkles className="h-4 w-4 text-amber-400 flex-shrink-0" />
                        {motivationalMessages[messageIndex]}
                      </motion.p>
                    </AnimatePresence>

                    {/* User badges */}
                    <div className="flex flex-wrap items-center gap-2 mt-3">
                      {user?.isVerified ? (
                        <Badge className="bg-blue-500/20 text-blue-300 border-blue-500/30 gap-1">
                          <BadgeCheck className="h-3 w-3" />
                          Verified
                        </Badge>
                      ) : (
                        <Badge className="bg-slate-500/20 text-slate-400 border-slate-500/30 gap-1">
                          <Shield className="h-3 w-3" />
                          Unverified
                        </Badge>
                      )}
                      <Badge className="bg-emerald-500/20 text-emerald-300 border-emerald-500/30 gap-1">
                        <Activity className="h-3 w-3" />
                        Active Trader
                      </Badge>
                    </div>
                  </div>
                </div>

                {/* Quick stats row */}
                <motion.div 
                  className="grid grid-cols-3 gap-3"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                >
                  <div className="p-4 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-8 h-8 rounded-lg bg-emerald-500/20 flex items-center justify-center">
                        <TrendingUp className="h-4 w-4 text-emerald-400" />
                      </div>
                    </div>
                    <p className="text-2xl font-bold text-white">
                      <AnimatedCounter value={hotListings.length || 12} duration={1000} />
                    </p>
                    <p className="text-xs text-slate-400">Hot Listings</p>
                  </div>
                  
                  <div className="p-4 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-8 h-8 rounded-lg bg-blue-500/20 flex items-center justify-center">
                        <Users className="h-4 w-4 text-blue-400" />
                      </div>
                    </div>
                    <p className="text-2xl font-bold text-white">
                      <AnimatedCounter value={145} duration={1200} />
                    </p>
                    <p className="text-xs text-slate-400">Online Now</p>
                  </div>
                  
                  <div className="p-4 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-8 h-8 rounded-lg bg-amber-500/20 flex items-center justify-center">
                        <Package className="h-4 w-4 text-amber-400" />
                      </div>
                    </div>
                    <p className="text-2xl font-bold text-white">
                      <AnimatedCounter value={pagination?.total || 248} duration={1400} />
                    </p>
                    <p className="text-xs text-slate-400">Total Trades</p>
                  </div>
                </motion.div>

               {/* Action buttons */}
<div className="flex flex-col sm:flex-row gap-3">
  <Button
    variant="outline"
    className="flex-1 rounded-xl bg-white/5 border-white/20 text-white hover:bg-white/10 hover:border-white/30 transition-all h-12"
    asChild
  >
    <Link href="/dashboard/browse">
      <Search className="h-4 w-4 mr-2" />
      Browse Marketplace
      <ChevronRight className="h-4 w-4 ml-auto opacity-50" />
    </Link>
  </Button>

  <Button
    className="flex-1 rounded-xl bg-gradient-to-r from-primary to-cyan-500 hover:opacity-90 shadow-lg shadow-primary/30 transition-all text-white h-12 font-semibold"
    asChild
  >
    <Link href="/dashboard/listings/new">
      <Plus className="h-5 w-5 mr-2" />
      Create Trade
      <Sparkles className="h-4 w-4 ml-2" />
    </Link>
  </Button>
</div>

</div>
              {/* Right column - Wallet preview */}
              <div className="lg:col-span-5">
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3 }}
                  className="h-full"
                >
                  <div className="relative h-full min-h-[280px] rounded-2xl bg-gradient-to-br from-slate-800/80 to-slate-900/80 border border-white/10 backdrop-blur-xl p-5 flex flex-col">
                    {/* Wallet header */}
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <motion.div
                          className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-cyan-500 flex items-center justify-center shadow-lg"
                          whileHover={{ scale: 1.1, rotate: 5 }}
                        >
                          <Wallet className="h-5 w-5 text-white" />
                        </motion.div>
                        <div>
                          <p className="text-sm font-medium text-white">Digital Wallet</p>
                          <div className="flex items-center gap-1.5">
                            <span className="text-[10px] text-slate-400">NAD Currency</span>
                            <span className="relative flex h-1.5 w-1.5">
                              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                              <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500" />
                            </span>
                          </div>
                        </div>
                      </div>
                      <Link href="/dashboard/wallet">
                        <Button variant="ghost" size="icon" className="rounded-lg h-8 w-8 hover:bg-white/10 text-slate-400 hover:text-white">
                          <ExternalLink className="h-4 w-4" />
                        </Button>
                      </Link>
                    </div>

                    {/* Balance display */}
                    <div className="flex-1 flex flex-col justify-center">
                      <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">Available Balance</p>
                      <motion.p 
                        className="text-4xl lg:text-5xl font-bold text-white tracking-tight"
                        key={balance}
                        initial={{ scale: 0.95 }}
                        animate={{ scale: 1 }}
                      >
                        <span className="text-slate-400 text-2xl lg:text-3xl mr-1">N$</span>
                        <AnimatedCounter value={balance} duration={1200} decimals={2} />
                      </motion.p>
                      
                      {/* Mini stats */}
                      <div className="flex gap-4 mt-4">
                        <div className="flex items-center gap-2">
                          <ArrowUpRight className="h-4 w-4 text-emerald-400" />
                          <span className="text-sm text-emerald-400">
                            +N$ <AnimatedCounter value={monthlyStats?.received || 0} decimals={0} duration={800} />
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <ArrowDownRight className="h-4 w-4 text-rose-400" />
                          <span className="text-sm text-rose-400">
                            -N$ <AnimatedCounter value={monthlyStats?.spent || 0} decimals={0} duration={800} />
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Quick wallet actions */}
                    <div className="flex gap-2 mt-4">
  <Button
    variant="outline"
    size="sm"
    className="flex-1 rounded-xl bg-white/5 border-white/10 text-white hover:bg-white/10 h-10"
    onClick={() => window.location.href = "/dashboard/wallet"}
  >
    <History className="h-4 w-4 mr-2" />
    History
  </Button>

  <Button
    size="sm"
    className="flex-1 rounded-xl bg-gradient-to-r from-emerald-500 to-cyan-500 text-white shadow-lg h-10"
    onClick={() => window.location.href = "/dashboard/wallet"}
  >
    <Plus className="h-4 w-4 mr-2" />
    Top Up
  </Button>
</div>

                  </div>
                </motion.div>
              </div>
            </div>
          </div>
        </div>

        {/* Banner Ad Section - From Database */}
        {bannerAds.length > 0 && (
          <motion.div 
            className="mt-4"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
           <div
  onClick={() => {
    window.location.href = (bannerAds[0]?.cta_href as string) || "#"
  }}
  className={cn(
    "relative overflow-hidden rounded-2xl p-4 lg:p-6 border border-white/10",
    `bg-gradient-to-r ${(bannerAds[0]?.gradient_colors as string) || "from-primary to-cyan-500"}`
  )}
>
             
                <div className="relative z-10 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <Badge className="bg-white/20 text-white border-0 backdrop-blur-sm">
                      <Sparkles className="h-3 w-3 mr-1" />
                      Sponsored
                    </Badge>
                    {bannerAds[0].priority && Number(bannerAds[0].priority) > 50 && (
                      <Badge className="bg-amber-500/20 text-amber-300 border-amber-500/30">
                        Featured
                      </Badge>
                    )}
                  </div>
                  <Button size="sm" className="bg-white text-slate-900 hover:bg-white/90 rounded-xl">
                    {(bannerAds[0]?.cta_text as string) || "Learn More"}
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                </div>
                <div className="absolute top-0 right-0 opacity-10">
                  <Sparkles className="h-24 w-24 text-white" />
                </div>
              </div>
             </motion.div>
        )}
      </motion.section>

      {/* Categories Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
      >
        <Card className="border-border/50 bg-card overflow-hidden">
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-gradient-to-br from-violet-500 to-purple-500 shadow-lg">
                  <Layers className="h-5 w-5 text-white" />
                </div>
                <div>
                  <CardTitle className="text-lg font-semibold">Browse Categories</CardTitle>
                  <p className="text-sm text-muted-foreground">{categories.length} categories available</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-9 w-9 rounded-xl hover:bg-primary/10"
                  onClick={() => scrollCategories("left")}
                >
                  <ChevronLeft className="h-5 w-5" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-9 w-9 rounded-xl hover:bg-primary/10"
                  onClick={() => scrollCategories("right")}
                >
                  <ChevronRight className="h-5 w-5" />
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div 
              ref={categoryContainerRef}
              className="flex gap-3 overflow-x-auto no-scrollbar pb-2 -mx-2 px-2"
            >
              {categoriesLoading ? (
                // Skeleton loading
                Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="w-[120px] flex-shrink-0">
                    <div className="p-4 rounded-2xl bg-muted/50 animate-pulse">
                      <div className="w-12 h-12 rounded-xl bg-muted mb-3 mx-auto" />
                      <div className="h-4 bg-muted rounded w-16 mx-auto mb-2" />
                      <div className="h-3 bg-muted rounded w-12 mx-auto" />
                    </div>
                  </div>
                ))
              ) : (
                categories.map((category: { id: string; name: string; slug: string; listing_count: number }, index: number) => {
                  const IconComponent = categoryIcons[category.slug] || GemIcon
                  const colors = categoryColors[category.slug] || categoryColors.other
                  
                  return (
                    <motion.div
                      key={category.id}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.03 * index }}
                      whileHover={{ scale: 1.02, y: -4 }}
                      whileTap={{ scale: 0.98 }}
                      className="flex-shrink-0"
                    >
                      <Link href={`/dashboard/browse?category=${category.slug}`}>
                        <div className={cn(
                          "w-[120px] p-4 rounded-2xl border transition-all text-center group cursor-pointer",
                          colors.bg, colors.border, "hover:shadow-lg"
                        )}>
                          <motion.div 
                            className={cn(
                              "w-12 h-12 rounded-xl flex items-center justify-center bg-gradient-to-br mb-3 mx-auto shadow-lg",
                              colors.gradient
                            )}
                            whileHover={{ rotate: 10 }}
                          >
                            <IconComponent className="h-6 w-6 text-white" animated={false} />
                          </motion.div>
                          <p className={cn("font-medium text-sm truncate", colors.text)}>
                            {category.name}
                          </p>
                          <p className="text-xs text-muted-foreground mt-1">
                            {category.listing_count} items
                          </p>
                        </div>
                      </Link>
                    </motion.div>
                  )
                })
              )}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Hot Listings Section */}
      {hotListings.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 shadow-lg">
                <Flame className="h-5 w-5 text-white" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-foreground">Hot Listings</h2>
                <p className="text-sm text-muted-foreground">Most popular trades right now</p>
              </div>
            </div>
            <Button variant="ghost" size="sm" className="rounded-xl" asChild>
              <Link href="/dashboard/browse?sort=popular">
                View All
                <ChevronRight className="h-4 w-4 ml-1" />
              </Link>
            </Button>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {hotListings.slice(0, 6).map((listing: Record<string, unknown>, index: number) => (
              <UnifiedListingCard
                key={listing.id as string}
                listing={{ ...listing, hot: true } as UnifiedListingData}
                index={index}
                variant="compact"
                onViewDetails={handleViewDetails}
                onMakeOffer={handleMakeOffer}
              />
            ))}
          </div>
        </motion.div>
      )}

          {/* All Listings Feed */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.25 }}
      >
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-gradient-to-br from-primary to-cyan-500 shadow-lg">
              <Layers className="h-5 w-5 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-foreground">
                Latest Listings
              </h2>
              <p className="text-sm text-muted-foreground">
                Discover new trades in your area
              </p>
            </div>
          </div>

          <Button
            variant="ghost"
            size="sm"
            className="rounded-xl gap-2"
            onClick={refreshListings}
            disabled={listingsLoading}
          >
            <RefreshCw
              className={cn("h-4 w-4", listingsLoading && "animate-spin")}
            />
            Refresh
          </Button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {getListingsWithAds().map((item) =>
            item.type === "listing" ? (
              <Link
                key={`listing-${item.data.id}`}
                href={`/dashboard/listings/${item.data.id}`}
              >
                <UnifiedListingCard
                  listing={item.data as UnifiedListingData}
                  index={item.index}
                />
              </Link>
            ) : (
              <AdBanner
                key={`ad-${item.index}`}
                ad={item.data}
                index={item.index}
              />
            )
          )}
        </div>

        {pagination.hasMore && !listingsLoading && (
          <div className="flex justify-center mt-8">
            <Button
              variant="outline"
              size="lg"
              className="rounded-xl px-8 bg-transparent"
              onClick={loadMore}
            >
              Load More Listings
              <ChevronRight className="h-4 w-4 ml-2" />
            </Button>
          </div>
        )}
      </motion.div>

    </div>
  )
}


