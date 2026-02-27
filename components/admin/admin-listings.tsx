"use client"

import { useState, useEffect, useCallback } from "react"
import { motion } from "framer-motion"
import { Search, Filter, MoreVertical, Eye, Trash2, CheckCircle, XCircle, AlertCircle, Star, RefreshCw, Loader2 } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { useNotifications } from "@/contexts/notification-context"
import Image from "next/image"
import { cn } from "@/lib/utils"
import { useToast } from "@/hooks/use-toast"

interface Listing {
  id: string
  title: string
  description: string | null
  category: string
  categoryName: string
  value: number
  condition: string
  region: string
  town: string | null
  status: "pending" | "active" | "flagged" | "sold" | "expired"
  views: number
  saves: number
  featured: boolean
  reportCount: number
  primaryImage: string
  createdAt: string
  user: {
    id: string
    name: string
    email: string
    isVerified: boolean
    isBanned: boolean
  }
}

interface Pagination {
  page: number
  limit: number
  total: number
  totalPages: number
  hasMore: boolean
}

const statusColors = {
  active: "bg-green-500/10 text-green-500 border-green-500/20",
  pending: "bg-yellow-500/10 text-yellow-500 border-yellow-500/20",
  flagged: "bg-red-500/10 text-red-500 border-red-500/20",
  sold: "bg-blue-500/10 text-blue-500 border-blue-500/20",
  expired: "bg-gray-500/10 text-gray-500 border-gray-500/20",
}

export function AdminListings() {
  const [listings, setListings] = useState<Listing[]>([])
  const [pagination, setPagination] = useState<Pagination | null>(null)
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [categoryFilter, setCategoryFilter] = useState("all")
  const [sortBy, setSortBy] = useState("newest")
  const { toast } = useToast()

  const fetchListings = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        page: "1",
        limit: "20",
        sort: sortBy,
      })
      
      if (search) params.set("search", search)
      if (statusFilter !== "all") params.set("status", statusFilter)
      if (categoryFilter !== "all") params.set("category", categoryFilter)

      const response = await fetch(`/api/admin/listings?${params}`)
      const data = await response.json()

      if (response.ok) {
        setListings(data.listings || [])
        setPagination(data.pagination || null)
      } else {
        toast({
          title: "Error",
          description: data.error || "Failed to fetch listings",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error fetching listings:", error)
      toast({
        title: "Error",
        description: "Failed to connect to server",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }, [search, statusFilter, categoryFilter, sortBy, toast])

  useEffect(() => {
    fetchListings()
  }, [fetchListings])

  const handleAction = async (listingId: string, action: string) => {
    setActionLoading(listingId)
    try {
      const response = await fetch("/api/admin/listings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ listingIds: [listingId], action }),
      })

      const data = await response.json()

      if (response.ok) {
        toast({
          title: "Success",
          description: data.message || `Listing ${action}ed successfully`,
        })
        fetchListings()
      } else {
        toast({
          title: "Error",
          description: data.error || `Failed to ${action} listing`,
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error(`Error ${action}ing listing:`, error)
      toast({
        title: "Error",
        description: "Failed to connect to server",
        variant: "destructive",
      })
    } finally {
      setActionLoading(null)
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))
    
    if (diffDays === 0) return "Today"
    if (diffDays === 1) return "Yesterday"
    if (diffDays < 7) return `${diffDays} days ago`
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`
    return date.toLocaleDateString()
  }

  const filteredListings = listings.filter(listing => {
    if (statusFilter !== "all" && listing.status !== statusFilter) return false
    if (categoryFilter !== "all" && listing.category !== categoryFilter) return false
    if (search && !listing.title.toLowerCase().includes(search.toLowerCase())) return false
    return true
  }).sort((a, b) => {
    if (sortBy === "newest") return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    if (sortBy === "oldest") return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    if (sortBy === "highest") return b.value - a.value
    if (sortBy === "lowest") return a.value - b.value
    return 0
  })

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Listings</h1>
          <p className="text-muted-foreground">
            {loading ? "Loading..." : `${(pagination?.total ?? listings?.length ?? 0)} total listings`}
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={fetchListings}
          disabled={loading}
          className="bg-transparent"
        >
          <RefreshCw className={cn("h-4 w-4 mr-2", loading && "animate-spin")} />
          Refresh
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search listings..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10 bg-muted border-0 rounded-xl"
          />
        </div>
        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger className="w-full sm:w-40 bg-muted border-0 rounded-xl">
            <SelectValue placeholder="Category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            <SelectItem value="Electronics">Electronics</SelectItem>
            <SelectItem value="Vehicles">Vehicles</SelectItem>
            <SelectItem value="Livestock">Livestock</SelectItem>
            <SelectItem value="Land">Land</SelectItem>
            <SelectItem value="Services">Services</SelectItem>
          </SelectContent>
        </Select>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-36 bg-muted border-0 rounded-xl">
            <Filter className="h-4 w-4 mr-2" />
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="flagged">Flagged</SelectItem>
            <SelectItem value="removed">Removed</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Listings grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {loading ? (
          // Loading skeletons
          Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="bg-card rounded-xl border border-border overflow-hidden">
              <Skeleton className="h-40 w-full" />
              <div className="p-4 space-y-2">
                <Skeleton className="h-3 w-20" />
                <Skeleton className="h-5 w-full" />
                <Skeleton className="h-6 w-24" />
                <div className="flex items-center justify-between pt-3 mt-3 border-t border-border">
                  <Skeleton className="h-6 w-24" />
                  <Skeleton className="h-4 w-16" />
                </div>
              </div>
            </div>
          ))
        ) : listings.length === 0 ? (
          <div className="col-span-full text-center py-12">
            <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium text-foreground">No listings found</h3>
            <p className="text-muted-foreground">Try adjusting your filters or search term</p>
          </div>
        ) : (
          listings.map((listing, i) => (
            <motion.div
              key={listing.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="bg-card rounded-xl border border-border overflow-hidden"
            >
              <div className="relative h-40">
                <Image src={listing.primaryImage || "/placeholder.svg"} alt={listing.title} fill className="object-cover" />
                <div className="absolute top-3 left-3 flex gap-2 flex-wrap">
                  <Badge
                    variant="outline"
                    className={cn("capitalize", statusColors[listing.status as keyof typeof statusColors])}
                  >
                    {listing.status}
                  </Badge>
                  {listing.featured && (
                    <Badge variant="outline" className="bg-yellow-500/10 text-yellow-500 border-yellow-500/20">
                      <Star className="h-3 w-3 mr-1 fill-current" />
                      Featured
                    </Badge>
                  )}
                  {listing.reportCount > 0 && (
                    <Badge variant="outline" className="bg-red-500/10 text-red-500 border-red-500/20">
                      <AlertCircle className="h-3 w-3 mr-1" />
                      {listing.reportCount}
                    </Badge>
                  )}
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button 
                      className="absolute top-3 right-3 w-8 h-8 rounded-lg bg-black/50 flex items-center justify-center text-white hover:bg-black/70 transition-colors"
                      disabled={actionLoading === listing.id}
                    >
                      {actionLoading === listing.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <MoreVertical className="h-4 w-4" />
                      )}
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem>
                      <Eye className="h-4 w-4 mr-2" />
                      View Details
                    </DropdownMenuItem>
                    {listing.status === "pending" && (
                      <DropdownMenuItem 
                        className="text-green-500"
                        onClick={() => handleAction(listing.id, "approve")}
                      >
                        <CheckCircle className="h-4 w-4 mr-2" />
                        Approve
                      </DropdownMenuItem>
                    )}
                    {listing.status === "flagged" && (
                      <DropdownMenuItem 
                        className="text-green-500"
                        onClick={() => handleAction(listing.id, "unflag")}
                      >
                        <CheckCircle className="h-4 w-4 mr-2" />
                        Unflag
                      </DropdownMenuItem>
                    )}
                    {listing.status === "active" && (
                      <DropdownMenuItem 
                        className="text-yellow-500"
                        onClick={() => handleAction(listing.id, "flag")}
                      >
                        <AlertCircle className="h-4 w-4 mr-2" />
                        Flag
                      </DropdownMenuItem>
                    )}
                    {!listing.featured ? (
                      <DropdownMenuItem 
                        className="text-yellow-500"
                        onClick={() => handleAction(listing.id, "feature")}
                      >
                        <Star className="h-4 w-4 mr-2" />
                        Feature
                      </DropdownMenuItem>
                    ) : (
                      <DropdownMenuItem 
                        onClick={() => handleAction(listing.id, "unfeature")}
                      >
                        <Star className="h-4 w-4 mr-2" />
                        Remove Feature
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuItem 
                      className="text-red-500"
                      onClick={() => handleAction(listing.id, "delete")}
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
              <div className="p-4">
                <div className="flex items-center gap-2 mb-1">
                  <p className="text-xs text-muted-foreground">{listing.categoryName || listing.category}</p>
                  <span className="text-xs text-muted-foreground">���</span>
                  <p className="text-xs text-muted-foreground">{listing.region}</p>
                </div>
                <h3 className="font-medium text-foreground truncate">{listing.title}</h3>
                <p className="text-lg font-bold text-primary font-mono tabular-nums">
                  N${(listing.value ?? 0).toLocaleString()}
                </p>
                <div className="flex items-center gap-4 text-xs text-muted-foreground mt-2">
                  <span>{listing.views} views</span>
                  <span>{listing.saves} saves</span>
                </div>
                <div className="flex items-center justify-between mt-3 pt-3 border-t border-border">
                  <div className="flex items-center gap-2">
                    <div className={cn(
                      "w-6 h-6 rounded-full bg-muted flex items-center justify-center text-xs font-medium",
                      listing.user.isBanned && "bg-red-500/20 text-red-500"
                    )}>
                      {listing.user.name.charAt(0)}
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="text-sm text-muted-foreground">{listing.user.name}</span>
                      {listing.user.isVerified && (
                        <CheckCircle className="h-3 w-3 text-green-500" />
                      )}
                    </div>
                  </div>
                  <span className="text-xs text-muted-foreground">{formatDate(listing.createdAt)}</span>
                </div>
              </div>
            </motion.div>
          ))
        )}
      </div>

      {/* Pagination */}
      {pagination && pagination.totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={pagination.page <= 1}
            className="bg-transparent"
          >
            Previous
          </Button>
          <span className="text-sm text-muted-foreground">
            Page {pagination.page} of {pagination.totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            disabled={!pagination.hasMore}
            className="bg-transparent"
          >
            Next
          </Button>
        </div>
      )}
    </div>
  )
}
