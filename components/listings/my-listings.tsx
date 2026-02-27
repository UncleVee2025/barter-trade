"use client"

import { useState, useMemo } from "react"
import { motion } from "framer-motion"
import { Plus, Search, Filter, MoreVertical, Eye, Edit, Trash2, Package, Loader2, RefreshCw, AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog"
import Link from "next/link"
import Image from "next/image"
import useSWR, { mutate } from "swr"
import { cn } from "@/lib/utils"
import { useAuth } from "@/contexts/auth-context"
import { toast } from "@/hooks/use-toast"

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
  featured: boolean
  createdAt: string
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

const fetcher = (url: string) => fetch(url).then((res) => {
  if (!res.ok) throw new Error("Failed to fetch listings")
  return res.json()
})

const statusColors: Record<string, string> = {
  active: "bg-green-500/10 text-green-500",
  pending: "bg-yellow-500/10 text-yellow-500",
  sold: "bg-blue-500/10 text-blue-500",
  flagged: "bg-red-500/10 text-red-500",
  expired: "bg-gray-500/10 text-gray-500",
}

// Helper to format relative time
function formatRelativeTime(dateString: string): string {
  const date = new Date(dateString)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
  const diffDays = Math.floor(diffHours / 24)
  
  if (diffDays > 30) {
    const diffMonths = Math.floor(diffDays / 30)
    return `${diffMonths} month${diffMonths > 1 ? "s" : ""} ago`
  }
  if (diffDays > 7) {
    const diffWeeks = Math.floor(diffDays / 7)
    return `${diffWeeks} week${diffWeeks > 1 ? "s" : ""} ago`
  }
  if (diffDays > 0) return `${diffDays} day${diffDays > 1 ? "s" : ""} ago`
  if (diffHours > 0) return `${diffHours} hour${diffHours > 1 ? "s" : ""} ago`
  return "Just now"
}

export function MyListings() {
  const { user } = useAuth()
  const [searchQuery, setSearchQuery] = useState("")
  const [categoryFilter, setCategoryFilter] = useState("all")
  const [statusFilter, setStatusFilter] = useState("all")
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [listingToDelete, setListingToDelete] = useState<APIListing | null>(null)

  // Build API URL - fetch all user's listings (no status filter on API, we filter client-side)
  const apiUrl = user ? `/api/listings?userId=${user.id}&status=all&limit=100` : null

  // Fetch user's listings from API
  const { data, error, isLoading, mutate: refreshListings } = useSWR<ListingsResponse>(
    apiUrl,
    fetcher,
    { revalidateOnFocus: true }
  )

  const listings = data?.listings || []

  // Client-side filtering
  const filteredListings = useMemo(() => {
    return listings.filter((listing) => {
      const matchesSearch = listing.title.toLowerCase().includes(searchQuery.toLowerCase())
      const matchesCategory = categoryFilter === "all" || listing.categoryName === categoryFilter || listing.category === categoryFilter
      const matchesStatus = statusFilter === "all" || listing.status === statusFilter
      return matchesSearch && matchesCategory && matchesStatus
    })
  }, [listings, searchQuery, categoryFilter, statusFilter])

  // Get unique categories from user's listings for filter dropdown
  const categories = useMemo(() => {
    const cats = new Set(listings.map((l) => l.categoryName || l.category))
    return Array.from(cats)
  }, [listings])

  // Handle delete listing
  const handleDeleteClick = (listing: APIListing) => {
    setListingToDelete(listing)
    setShowDeleteDialog(true)
  }

  const handleDeleteConfirm = async () => {
    if (!listingToDelete) return
    
    setDeletingId(listingToDelete.id)
    setShowDeleteDialog(false)
    
    try {
      const response = await fetch(`/api/listings/${listingToDelete.id}`, {
        method: "DELETE",
      })
      
      if (!response.ok) {
        throw new Error("Failed to delete listing")
      }
      
      toast({ title: "Listing deleted successfully" })
      refreshListings()
    } catch {
      toast({ title: "Failed to delete listing", variant: "destructive" })
    } finally {
      setDeletingId(null)
      setListingToDelete(null)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">My Listings</h1>
          <p className="text-muted-foreground">
            {isLoading ? "Loading..." : `${listings.length} total listings`}
          </p>
        </div>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            size="icon" 
            onClick={() => refreshListings()}
            disabled={isLoading}
            className="rounded-xl bg-transparent"
          >
            <RefreshCw className={cn("h-4 w-4", isLoading && "animate-spin")} />
          </Button>
          <Button asChild className="rounded-xl">
            <Link href="/dashboard/listings/new">
              <Plus className="h-4 w-4 mr-2" />
              Create Listing
            </Link>
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search listings..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 bg-muted border-0 rounded-xl"
          />
        </div>
        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger className="w-full sm:w-40 bg-muted border-0 rounded-xl">
            <Filter className="h-4 w-4 mr-2" />
            <SelectValue placeholder="Category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            {categories.map((cat) => (
              <SelectItem key={cat} value={cat}>{cat}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-36 bg-muted border-0 rounded-xl">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="sold">Sold</SelectItem>
            <SelectItem value="expired">Expired</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Error State */}
      {error && (
        <div className="text-center py-16">
          <AlertCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
          <h3 className="text-lg font-medium text-foreground mb-2">Failed to load listings</h3>
          <p className="text-muted-foreground mb-4">Please check your connection and try again</p>
          <Button onClick={() => refreshListings()} className="rounded-xl">
            <RefreshCw className="h-4 w-4 mr-2" />
            Try Again
          </Button>
        </div>
      )}

      {/* Loading State */}
      {isLoading && !error && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="bg-card rounded-2xl border border-border overflow-hidden">
              <Skeleton className="aspect-square w-full" />
              <div className="p-4 space-y-3">
                <Skeleton className="h-3 w-20" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-6 w-32" />
                <div className="flex justify-between pt-3 border-t border-border">
                  <Skeleton className="h-3 w-20" />
                  <Skeleton className="h-3 w-16" />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Empty State */}
      {!isLoading && !error && filteredListings.length === 0 && (
        <div className="text-center py-16">
          <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-medium text-foreground mb-2">
            {listings.length === 0 ? "No listings yet" : "No listings found"}
          </h3>
          <p className="text-muted-foreground mb-4">
            {listings.length === 0 
              ? "Create your first listing to start trading" 
              : "Try adjusting your filters"}
          </p>
          <Button asChild className="rounded-xl">
            <Link href="/dashboard/listings/new">
              <Plus className="h-4 w-4 mr-2" />
              Create Listing
            </Link>
          </Button>
        </div>
      )}

      {/* Listings Grid */}
      {!isLoading && !error && filteredListings.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredListings.map((listing, i) => (
            <motion.div
              key={listing.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className={cn(
                "group bg-card rounded-2xl border border-border overflow-hidden hover:shadow-lg transition-all",
                deletingId === listing.id && "opacity-50 pointer-events-none"
              )}
            >
              <div className="relative aspect-square">
                <Image 
                  src={listing.primaryImage || listing.images?.[0] || "/placeholder.svg"} 
                  alt={listing.title} 
                  fill 
                  className="object-cover" 
                />
                <div className="absolute top-3 left-3">
                  <span
                    className={cn(
                      "px-2 py-1 rounded-lg text-xs font-medium",
                      statusColors[listing.status] || statusColors.pending,
                    )}
                  >
                    {listing.status.charAt(0).toUpperCase() + listing.status.slice(1)}
                  </span>
                </div>
                {deletingId === listing.id ? (
                  <div className="absolute top-3 right-3 w-8 h-8 rounded-lg bg-black/50 flex items-center justify-center">
                    <Loader2 className="h-4 w-4 text-white animate-spin" />
                  </div>
                ) : (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button className="absolute top-3 right-3 w-8 h-8 rounded-lg bg-black/50 flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity">
                        <MoreVertical className="h-4 w-4" />
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem asChild>
                        <Link href={`/dashboard/listings/${listing.id}`}>
                          <Eye className="h-4 w-4 mr-2" />
                          View Details
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link href={`/dashboard/listings/${listing.id}/edit`}>
                          <Edit className="h-4 w-4 mr-2" />
                          Edit
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        className="text-red-500"
                        onClick={() => handleDeleteClick(listing)}
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}
              </div>
              <div className="p-4">
                <p className="text-xs text-muted-foreground mb-1">{listing.categoryName || listing.category}</p>
                <h3 className="font-medium text-foreground truncate">{listing.title}</h3>
                <p className="text-lg font-bold text-primary mt-1">N${listing.value.toLocaleString()}</p>
                <div className="flex items-center justify-between mt-3 pt-3 border-t border-border">
                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Eye className="h-3 w-3" />
                      {listing.views || 0}
                    </span>
                    <span className="flex items-center gap-1">
                      <Package className="h-3 w-3" />
                      {listing.saves || 0} saves
                    </span>
                  </div>
                  <span className="text-xs text-muted-foreground">{formatRelativeTime(listing.createdAt)}</span>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Listing</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{listingToDelete?.title}"? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDeleteConfirm}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
