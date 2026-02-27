"use client"

import { useState, useEffect } from "react"
import { DashboardLayout } from "@/components/dashboard/dashboard-layout"
import { ProtectedRoute } from "@/components/auth/protected-route"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { Badge } from "@/components/ui/badge"
import { toast } from "@/hooks/use-toast"
import Image from "next/image"
import Link from "next/link"
import {
  Bookmark,
  BookmarkX,
  MapPin,
  Eye,
  Heart,
  ArrowRight,
  Search,
  AlertCircle,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Input } from "@/components/ui/input"

interface SavedListing {
  saveId: string
  savedAt: string
  id: string
  userId: string
  title: string
  description?: string
  category?: string
  categoryName?: string
  categoryIcon?: string
  type?: string
  value: number
  condition?: string
  primaryImage: string
  location: {
    region: string
    town?: string
  }
  status: string
  views: number
  createdAt?: string
  user: {
    id: string
    name: string
    avatar?: string
    isVerified?: boolean
  }
}

export default function SavedListingsPage() {
  const [savedListings, setSavedListings] = useState<SavedListing[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [removingId, setRemovingId] = useState<string | null>(null)

  useEffect(() => {
    fetchSavedListings()
  }, [])

  const fetchSavedListings = async () => {
    try {
      const response = await fetch("/api/saved-listings")
      if (!response.ok) throw new Error("Failed to fetch")
      const data = await response.json()
      // API returns `listings` array, not `savedListings`
      setSavedListings(data.listings || data.savedListings || [])
    } catch {
      toast({ title: "Error", description: "Failed to load saved listings", variant: "destructive" })
    } finally {
      setIsLoading(false)
    }
  }

  const handleRemove = async (listingId: string) => {
    setRemovingId(listingId)
    try {
      const response = await fetch(`/api/saved-listings?listingId=${listingId}`, {
        method: "DELETE",
      })
      if (!response.ok) throw new Error("Failed to remove")
      setSavedListings((prev) => prev.filter((s) => s.id !== listingId))
      toast({ title: "Removed", description: "Listing removed from saved" })
    } catch {
      toast({ title: "Error", description: "Failed to remove listing", variant: "destructive" })
    } finally {
      setRemovingId(null)
    }
  }

  const filteredListings = savedListings.filter((s) =>
    s.title?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active": return "bg-green-500/10 text-green-600"
      case "sold": return "bg-blue-500/10 text-blue-600"
      case "pending": return "bg-yellow-500/10 text-yellow-600"
      default: return "bg-muted text-muted-foreground"
    }
  }

  return (
    <ProtectedRoute>
      <DashboardLayout>
        <div className="p-4 md:p-6">
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
            <div>
              <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
                <Bookmark className="h-6 w-6 text-primary" />
                Saved Listings
              </h1>
              <p className="text-muted-foreground">
                {savedListings.length} item{savedListings.length !== 1 ? "s" : ""} saved
              </p>
            </div>
            <div className="relative w-full md:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search saved..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 bg-muted border-0 rounded-xl"
              />
            </div>
          </div>

          {/* Content */}
          {isLoading ? (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <Skeleton key={i} className="h-64 rounded-2xl" />
              ))}
            </div>
          ) : filteredListings.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center mb-4">
                <Bookmark className="h-10 w-10 text-muted-foreground" />
              </div>
              <h2 className="text-xl font-semibold mb-2">No saved listings</h2>
              <p className="text-muted-foreground mb-6 max-w-md">
                {searchQuery
                  ? "No listings match your search"
                  : "Browse listings and save the ones you're interested in"}
              </p>
              <Button asChild>
                <Link href="/dashboard/browse">
                  Browse Listings <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {filteredListings.map((saved) => (
                <div
                  key={saved.saveId || saved.id}
                  className="group bg-card rounded-2xl overflow-hidden border border-border hover:border-primary/50 transition-colors"
                >
                  <Link href={`/dashboard/listings/${saved.id}`} className="block">
                    <div className="relative aspect-[4/3]">
                      <Image
                        src={saved.primaryImage || "/placeholder.svg"}
                        alt={saved.title || "Listing"}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                      <Badge className={cn("absolute top-3 left-3", getStatusColor(saved.status || "active"))}>
                        {saved.status || "active"}
                      </Badge>
                    </div>
                  </Link>
                  <div className="p-4">
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <Link href={`/dashboard/listings/${saved.id}`} className="flex-1">
                        <h3 className="font-semibold text-foreground line-clamp-1 hover:text-primary transition-colors">
                          {saved.title}
                        </h3>
                      </Link>
                      <p className="font-bold text-primary whitespace-nowrap">
                        N${(saved.value || 0).toLocaleString()}
                      </p>
                    </div>
                    <div className="flex items-center gap-3 text-sm text-muted-foreground mb-3">
                      <span className="flex items-center gap-1">
                        <MapPin className="h-3.5 w-3.5" />
                        {saved.location?.region || "Unknown"}
                      </span>
                      <span className="flex items-center gap-1">
                        <Eye className="h-3.5 w-3.5" />
                        {saved.views || 0}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-muted-foreground">
                        Saved {saved.savedAt ? new Date(saved.savedAt).toLocaleDateString() : "recently"}
                      </span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemove(saved.id)}
                        disabled={removingId === saved.id}
                        className="text-muted-foreground hover:text-destructive"
                      >
                        <BookmarkX className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  )
}
