"use client"

import { useState, useCallback } from "react"
import { motion, AnimatePresence } from "framer-motion"
import Image from "next/image"
import useSWR from "swr"
import { useRouter } from "next/navigation"
import {
  Search,
  Filter,
  MapPin,
  Grid3X3,
  List,
  SlidersHorizontal,
  X,
  TrendingUp,
  Star,
  Clock,
  ChevronDown,
  Sparkles,
  Zap,
  Loader2,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import { Label } from "@/components/ui/label"
import { Slider } from "@/components/ui/slider"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { Skeleton } from "@/components/ui/skeleton"
import { cn } from "@/lib/utils"
import { UnifiedListingCard, type UnifiedListingData } from "./unified-listing-card"
import { AdBannerCarousel } from "@/components/ads/ad-banner-carousel"

// API response types
interface APIListing {
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
  location: { region: string; town: string }
  status: string
  views: number
  saves: number
  likes: number
  featured: boolean
  wantedItems: Array<{ description: string; estimatedValue: number | null; isFlexible: boolean }>
  createdAt: string
  user: { id: string; name: string; avatar: string; region: string; isVerified: boolean }
}

interface ListingsResponse {
  listings: APIListing[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
    hasMore: boolean
  }
}

// Transform API listing to UnifiedListingData format
function transformListing(listing: APIListing): UnifiedListingData {
  return {
    id: listing.id,
    title: listing.title,
    description: listing.description,
    value: listing.value,
    category: listing.category,
    categoryName: listing.categoryName,
    condition: listing.condition || "N/A",
    location: {
      region: listing.location.region,
      town: listing.location.town,
    },
    images: listing.images.length > 0 ? listing.images : [listing.primaryImage],
    primaryImage: listing.primaryImage,
    views: listing.views || 0,
    likes: listing.likes || 0,
    saves: listing.saves || 0,
    featured: listing.featured,
    hot: (listing.views || 0) > 100,
    createdAt: listing.createdAt,
    wantedItems: listing.wantedItems,
    user: {
      id: listing.user.id,
      name: listing.user.name,
      avatar: listing.user.avatar,
      isVerified: listing.user.isVerified,
    },
  }
}

const fetcher = (url: string) => fetch(url).then((res) => res.json())

const categories = [
  { value: "all", label: "All Categories", icon: Grid3X3 },
  { value: "electronics", label: "Electronics", icon: Zap },
  { value: "vehicles", label: "Vehicles", icon: TrendingUp },
  { value: "livestock", label: "Livestock", icon: Star },
  { value: "property", label: "Property", icon: MapPin },
  { value: "services", label: "Services", icon: Sparkles },
  { value: "agriculture", label: "Agriculture", icon: Clock },
]

const sortOptions = [
  { value: "featured", label: "Featured First" },
  { value: "newest", label: "Newest First" },
  { value: "price_low", label: "Price: Low to High" },
  { value: "price_high", label: "Price: High to Low" },
  { value: "popular", label: "Most Viewed" },
]

const conditions = ["New", "Like New", "Good", "Fair"]

interface PlatformStats {
  activeListings: number
  totalUsers: number
  tradesToday: number
}

export function BrowseListings() {
  const router = useRouter()
  const [searchQuery, setSearchQuery] = useState("")
  const [debouncedSearch, setDebouncedSearch] = useState("")
  const [category, setCategory] = useState("all")
  const [sortBy, setSortBy] = useState("featured")
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid")
  const [priceRange, setPriceRange] = useState([0, 800000])
  const [selectedConditions, setSelectedConditions] = useState<string[]>([])
  const [verifiedOnly, setVerifiedOnly] = useState(false)
  const [isFilterOpen, setIsFilterOpen] = useState(false)
  const [page, setPage] = useState(1)

  // Fetch platform stats
  const { data: platformStats } = useSWR<PlatformStats>("/api/public/stats", fetcher, {
    revalidateOnFocus: false,
    refreshInterval: 60000,
  })

  // Debounce search
  const handleSearchChange = useCallback((value: string) => {
    setSearchQuery(value)
    const timer = setTimeout(() => {
      setDebouncedSearch(value)
      setPage(1)
    }, 300)
    return () => clearTimeout(timer)
  }, [])

  // Build API URL with filters
  const buildApiUrl = useCallback(() => {
    const params = new URLSearchParams()
    params.set("status", "active")
    params.set("page", page.toString())
    params.set("limit", "20")
    params.set("sort", sortBy === "featured" ? "newest" : sortBy)
    
    if (category !== "all") params.set("category", category)
    if (debouncedSearch) params.set("search", debouncedSearch)
    if (priceRange[0] > 0) params.set("minPrice", priceRange[0].toString())
    if (priceRange[1] < 800000) params.set("maxPrice", priceRange[1].toString())
    if (selectedConditions.length === 1) params.set("condition", selectedConditions[0])
    
    return `/api/listings?${params.toString()}`
  }, [page, sortBy, category, debouncedSearch, priceRange, selectedConditions])

  // Fetch listings from API with real-time updates
  const { data, error, isLoading, isValidating } = useSWR<ListingsResponse>(
    buildApiUrl(),
    fetcher,
    { 
      revalidateOnFocus: true, 
      keepPreviousData: true,
      refreshInterval: 30000,
      dedupingInterval: 5000,
    }
  )

  // Update listings when data changes
  const listings = data?.listings?.map(transformListing) || []
  const pagination = data?.pagination
  const totalListings = pagination?.total || 0
  
  // Filter by verified if needed (client-side since API might not support it)
  const filteredListings = verifiedOnly 
    ? listings.filter((l) => l.user?.isVerified) 
    : listings

  // Handle load more
  const handleLoadMore = () => {
    if (pagination?.hasMore) {
      setPage((p) => p + 1)
    }
  }

  const activeFiltersCount =
    (category !== "all" ? 1 : 0) +
    (priceRange[0] > 0 || priceRange[1] < 800000 ? 1 : 0) +
    selectedConditions.length +
    (verifiedOnly ? 1 : 0)

  // Navigate to listing detail page
  const handleViewDetails = (listing: UnifiedListingData) => {
    router.push(`/dashboard/listings/${listing.id}`)
  }

  return (
    <div className="min-h-screen pb-24">
      {/* Hero Header */}
      <div className="relative mb-6">
        <div className="absolute inset-0 bg-gradient-to-r from-primary/10 via-transparent to-gold/10 rounded-3xl" />
        <div className="relative px-4 md:px-6 py-6 md:py-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-2xl"
          >
            <div className="flex items-center gap-3 mb-3">
              <Image
                src="/logo.png"
                alt="Barter Trade Namibia"
                width={48}
                height={48}
                className="rounded-xl"
              />
              <div>
                <h1 className="text-2xl md:text-3xl font-bold text-foreground">
                  <span className="text-gradient">Discover</span> Amazing Trades
                </h1>
                <p className="text-muted-foreground text-sm md:text-base">
                  Browse {totalListings.toLocaleString()}+ listings from verified traders
                </p>
              </div>
            </div>
          </motion.div>

          {/* Stats Bar */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="flex flex-wrap gap-4 md:gap-6 mt-4"
          >
            {[
              { label: "Active Listings", value: platformStats?.activeListings?.toLocaleString() || totalListings.toLocaleString() || "0", icon: TrendingUp },
              { label: "Verified Sellers", value: platformStats?.totalUsers?.toLocaleString() || "0", icon: Star },
              { label: "Trades Today", value: platformStats?.tradesToday?.toString() || "0", icon: Zap },
            ].map((stat, i) => (
              <div key={i} className="flex items-center gap-2 md:gap-3">
                <div className="w-8 h-8 md:w-10 md:h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                  <stat.icon className="w-4 h-4 md:w-5 md:h-5 text-primary" />
                </div>
                <div>
                  <p className="text-lg md:text-xl font-bold text-foreground">{stat.value}</p>
                  <p className="text-[10px] md:text-xs text-muted-foreground">{stat.label}</p>
                </div>
              </div>
            ))}
          </motion.div>
        </div>
      </div>

      {/* Search and Filters Bar */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="glass rounded-2xl p-3 md:p-4 mb-6 mx-1"
      >
        <div className="flex flex-col lg:flex-row gap-3">
          {/* Search Input */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input
              placeholder="Search listings..."
              value={searchQuery}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="pl-10 h-11 bg-background/50 border-border/50 rounded-xl text-base focus:ring-2 focus:ring-primary/50"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          {/* Mobile: Category + Filter Row */}
          <div className="flex gap-2 lg:hidden">
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger className="flex-1 h-11 bg-background/50 border-border/50 rounded-xl">
                <Filter className="h-4 w-4 mr-2 text-muted-foreground" />
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                {categories.map((cat) => (
                  <SelectItem key={cat.value} value={cat.value}>
                    {cat.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Sheet open={isFilterOpen} onOpenChange={setIsFilterOpen}>
              <SheetTrigger asChild>
                <Button
                  variant="outline"
                  className="h-11 px-4 rounded-xl border-border/50 bg-background/50 hover:bg-primary/10 hover:border-primary/50 relative"
                >
                  <SlidersHorizontal className="h-4 w-4" />
                  {activeFiltersCount > 0 && (
                    <Badge className="absolute -top-2 -right-2 h-5 w-5 p-0 flex items-center justify-center text-xs bg-primary">
                      {activeFiltersCount}
                    </Badge>
                  )}
                </Button>
              </SheetTrigger>
              <SheetContent className="w-full sm:max-w-md bg-card border-border">
                <SheetHeader>
                  <SheetTitle className="text-foreground">Filter Listings</SheetTitle>
                </SheetHeader>
                <div className="space-y-8 mt-8">
                  {/* Price Range */}
                  <div>
                    <Label className="text-sm font-medium text-foreground">Price Range (NAD)</Label>
                    <div className="mt-4 px-2">
                      <Slider
                        value={priceRange}
                        onValueChange={setPriceRange}
                        min={0}
                        max={800000}
                        step={5000}
                        className="mb-4"
                      />
                      <div className="flex justify-between text-sm">
                        <span className="px-3 py-1 rounded-lg bg-muted text-foreground">
                          N${priceRange[0].toLocaleString()}
                        </span>
                        <span className="px-3 py-1 rounded-lg bg-muted text-foreground">
                          N${priceRange[1].toLocaleString()}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Condition */}
                  <div>
                    <Label className="text-sm font-medium text-foreground">Condition</Label>
                    <div className="flex flex-wrap gap-2 mt-3">
                      {conditions.map((condition) => (
                        <button
                          key={condition}
                          onClick={() =>
                            setSelectedConditions((prev) =>
                              prev.includes(condition)
                                ? prev.filter((c) => c !== condition)
                                : [...prev, condition]
                            )
                          }
                          className={cn(
                            "px-4 py-2 rounded-xl text-sm font-medium transition-all",
                            selectedConditions.includes(condition)
                              ? "bg-primary text-primary-foreground"
                              : "bg-muted text-muted-foreground hover:bg-muted/80"
                          )}
                        >
                          {condition}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Verified Only */}
                  <div className="flex items-center justify-between p-4 rounded-xl bg-muted/50">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                        <Star className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium text-foreground">Verified Sellers Only</p>
                        <p className="text-xs text-muted-foreground">Show only trusted traders</p>
                      </div>
                    </div>
                    <Checkbox
                      checked={verifiedOnly}
                      onCheckedChange={(checked) => setVerifiedOnly(checked as boolean)}
                      className="data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                    />
                  </div>

                  {/* Apply Button */}
                  <div className="flex gap-3">
                    <Button
                      variant="outline"
                      className="flex-1 rounded-xl bg-transparent"
                      onClick={() => {
                        setPriceRange([0, 800000])
                        setSelectedConditions([])
                        setVerifiedOnly(false)
                      }}
                    >
                      Reset
                    </Button>
                    <Button
                      className="flex-1 rounded-xl bg-primary hover:bg-primary/90"
                      onClick={() => setIsFilterOpen(false)}
                    >
                      Apply Filters
                    </Button>
                  </div>
                </div>
              </SheetContent>
            </Sheet>
          </div>

          {/* Desktop: Category + Sort + Filter + View Toggle */}
          <div className="hidden lg:flex gap-3">
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger className="w-52 h-11 bg-background/50 border-border/50 rounded-xl">
                <Filter className="h-4 w-4 mr-2 text-muted-foreground" />
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                {categories.map((cat) => (
                  <SelectItem key={cat.value} value={cat.value}>
                    <div className="flex items-center gap-2">
                      <cat.icon className="h-4 w-4" />
                      {cat.label}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-48 h-11 bg-background/50 border-border/50 rounded-xl">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {sortOptions.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Sheet open={isFilterOpen} onOpenChange={setIsFilterOpen}>
              <SheetTrigger asChild>
                <Button
                  variant="outline"
                  className="h-11 px-4 rounded-xl border-border/50 bg-background/50 hover:bg-primary/10 hover:border-primary/50 relative"
                >
                  <SlidersHorizontal className="h-4 w-4 mr-2" />
                  Filters
                  {activeFiltersCount > 0 && (
                    <Badge className="absolute -top-2 -right-2 h-5 w-5 p-0 flex items-center justify-center text-xs bg-primary">
                      {activeFiltersCount}
                    </Badge>
                  )}
                </Button>
              </SheetTrigger>
              <SheetContent className="w-full sm:max-w-md bg-card border-border">
                <SheetHeader>
                  <SheetTitle className="text-foreground">Filter Listings</SheetTitle>
                </SheetHeader>
                <div className="space-y-8 mt-8">
                  <div>
                    <Label className="text-sm font-medium text-foreground">Price Range (NAD)</Label>
                    <div className="mt-4 px-2">
                      <Slider
                        value={priceRange}
                        onValueChange={setPriceRange}
                        min={0}
                        max={800000}
                        step={5000}
                        className="mb-4"
                      />
                      <div className="flex justify-between text-sm">
                        <span className="px-3 py-1 rounded-lg bg-muted text-foreground">
                          N${priceRange[0].toLocaleString()}
                        </span>
                        <span className="px-3 py-1 rounded-lg bg-muted text-foreground">
                          N${priceRange[1].toLocaleString()}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div>
                    <Label className="text-sm font-medium text-foreground">Condition</Label>
                    <div className="flex flex-wrap gap-2 mt-3">
                      {conditions.map((condition) => (
                        <button
                          key={condition}
                          onClick={() =>
                            setSelectedConditions((prev) =>
                              prev.includes(condition)
                                ? prev.filter((c) => c !== condition)
                                : [...prev, condition]
                            )
                          }
                          className={cn(
                            "px-4 py-2 rounded-xl text-sm font-medium transition-all",
                            selectedConditions.includes(condition)
                              ? "bg-primary text-primary-foreground"
                              : "bg-muted text-muted-foreground hover:bg-muted/80"
                          )}
                        >
                          {condition}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="flex items-center justify-between p-4 rounded-xl bg-muted/50">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                        <Star className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium text-foreground">Verified Sellers Only</p>
                        <p className="text-xs text-muted-foreground">Show only trusted traders</p>
                      </div>
                    </div>
                    <Checkbox
                      checked={verifiedOnly}
                      onCheckedChange={(checked) => setVerifiedOnly(checked as boolean)}
                      className="data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                    />
                  </div>

                  <div className="flex gap-3">
                    <Button
                      variant="outline"
                      className="flex-1 rounded-xl bg-transparent"
                      onClick={() => {
                        setPriceRange([0, 800000])
                        setSelectedConditions([])
                        setVerifiedOnly(false)
                      }}
                    >
                      Reset
                    </Button>
                    <Button
                      className="flex-1 rounded-xl bg-primary hover:bg-primary/90"
                      onClick={() => setIsFilterOpen(false)}
                    >
                      Apply Filters
                    </Button>
                  </div>
                </div>
              </SheetContent>
            </Sheet>

            {/* View Toggle */}
            <div className="flex bg-muted/50 rounded-xl p-1">
              <button
                onClick={() => setViewMode("grid")}
                className={cn(
                  "p-2.5 rounded-lg transition-all",
                  viewMode === "grid"
                    ? "bg-primary text-primary-foreground shadow-lg"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                <Grid3X3 className="h-4 w-4" />
              </button>
              <button
                onClick={() => setViewMode("list")}
                className={cn(
                  "p-2.5 rounded-lg transition-all",
                  viewMode === "list"
                    ? "bg-primary text-primary-foreground shadow-lg"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                <List className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Results Info */}
      <div className="flex items-center justify-between mb-4 px-1">
        <p className="text-sm text-muted-foreground">
          <span className="text-foreground font-semibold">{filteredListings.length}</span> listings
          found
          {category !== "all" && (
            <span>
              {" "}
              in{" "}
              <span className="text-primary">
                {categories.find((c) => c.value === category)?.label}
              </span>
            </span>
          )}
        </p>
        {activeFiltersCount > 0 && (
          <button
            onClick={() => {
              setCategory("all")
              setPriceRange([0, 800000])
              setSelectedConditions([])
              setVerifiedOnly(false)
            }}
            className="flex items-center gap-1 text-sm text-primary hover:underline"
          >
            Clear all
            <X className="h-3 w-3" />
          </button>
        )}
      </div>

      {/* Listings Grid */}
      <div
        className={cn(
          "grid gap-4 md:gap-6 px-1",
          viewMode === "grid"
            ? "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
            : "grid-cols-1"
        )}
      >
        <AnimatePresence mode="popLayout">
          {filteredListings.map((listing, i) => (
            <div key={listing.id}>
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ delay: i * 0.03 }}
                layout
              >
                <UnifiedListingCard
                  listing={listing}
                  index={i}
                  variant={viewMode === "list" ? "featured" : "standard"}
                  onViewDetails={handleViewDetails}
                  showActions={true}
                />
              </motion.div>
              {/* Insert ad after every 5 listings */}
              {(i + 1) % 5 === 0 && i < filteredListings.length - 1 && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={cn(
                    viewMode === "grid" ? "col-span-full" : "",
                    "mt-4"
                  )}
                >
                  <AdBannerCarousel 
                    position="browse-listings" 
                    height="sm"
                    className="rounded-xl overflow-hidden"
                  />
                </motion.div>
              )}
            </div>
          ))}
        </AnimatePresence>
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className={cn(
          "grid gap-4 md:gap-6 px-1",
          viewMode === "grid"
            ? "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
            : "grid-cols-1"
        )}>
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="bg-card rounded-2xl border border-border/50 overflow-hidden">
              <Skeleton className="aspect-[4/3] w-full" />
              <div className="p-4 space-y-3">
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-5 w-full" />
                <Skeleton className="h-7 w-32" />
                <div className="flex items-center gap-3 pt-3 border-t border-border/50">
                  <Skeleton className="h-9 w-9 rounded-full" />
                  <div className="flex-1">
                    <Skeleton className="h-4 w-24 mb-1" />
                    <Skeleton className="h-3 w-16" />
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Empty State */}
      {!isLoading && filteredListings.length === 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center py-16"
        >
          <div className="w-20 h-20 rounded-full bg-muted mx-auto mb-6 flex items-center justify-center">
            <Search className="w-8 h-8 text-muted-foreground" />
          </div>
          <h3 className="text-xl font-semibold text-foreground mb-2">No listings found</h3>
          <p className="text-muted-foreground mb-6 max-w-md mx-auto">
            {error 
              ? "Failed to load listings. Please try again later."
              : "Try adjusting your filters or search terms to find what you are looking for."
            }
          </p>
          <Button
            onClick={() => {
              setSearchQuery("")
              setDebouncedSearch("")
              setCategory("all")
              setPriceRange([0, 800000])
              setSelectedConditions([])
              setVerifiedOnly(false)
              setPage(1)
            }}
            className="rounded-xl"
          >
            Clear all filters
          </Button>
        </motion.div>
      )}

      {/* Load More */}
      {!isLoading && filteredListings.length > 0 && pagination?.hasMore && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="flex justify-center mt-8"
        >
          <Button
            variant="outline"
            size="lg"
            onClick={handleLoadMore}
            disabled={isValidating}
            className="rounded-xl border-border/50 hover:border-primary/50 hover:bg-primary/5 group bg-transparent"
          >
            {isValidating ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Loading...
              </>
            ) : (
              <>
                Load More Listings
                <ChevronDown className="ml-2 h-4 w-4 group-hover:translate-y-0.5 transition-transform" />
              </>
            )}
          </Button>
        </motion.div>
      )}
    </div>
  )
}
