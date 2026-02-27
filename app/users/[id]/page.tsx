"use client"

import { useState, useEffect, use } from "react"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { toast } from "@/hooks/use-toast"
import Image from "next/image"
import Link from "next/link"
import { useRouter } from "next/navigation"
import {
  ArrowLeft,
  MapPin,
  Calendar,
  Star,
  MessageCircle,
  CheckCircle,
  Package,
  ArrowLeftRight,
  Eye,
  Heart,
} from "lucide-react"
import { cn } from "@/lib/utils"

interface PublicUser {
  id: string
  name: string
  avatar?: string
  region: string
  town?: string
  isVerified: boolean
  joinedAt: string
  stats: {
    totalListings: number
    activeListings: number
    completedTrades: number
    avgRating: number | null
    ratingCount: number
  }
}

interface UserListing {
  id: string
  title: string
  value: number
  primaryImage: string
  status: string
  views: number
  likes: number
  location: {
    region: string
    town?: string
  }
  createdAt: string
}

interface UserRating {
  id: string
  rating: number
  review: string
  createdAt: string
  fromUser: {
    id: string
    name: string
    avatar?: string
  }
}

interface PageProps {
  params: Promise<{ id: string }>
}

export default function PublicProfilePage({ params }: PageProps) {
  const { id } = use(params)
  const router = useRouter()
  const [user, setUser] = useState<PublicUser | null>(null)
  const [listings, setListings] = useState<UserListing[]>([])
  const [ratings, setRatings] = useState<UserRating[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [activeTab, setActiveTab] = useState("listings")

  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        const response = await fetch(`/api/user/${id}`)
        if (!response.ok) throw new Error("Failed to fetch")
        const data = await response.json()
        setUser(data.user)
        setListings(data.listings || [])
        setRatings(data.ratings || [])
      } catch {
        toast({ title: "Error", description: "Failed to load profile", variant: "destructive" })
      } finally {
        setIsLoading(false)
      }
    }
    fetchUserProfile()
  }, [id])

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={cn(
          "h-4 w-4",
          i < rating ? "text-yellow-500 fill-yellow-500" : "text-muted-foreground"
        )}
      />
    ))
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="max-w-4xl mx-auto p-4 md:p-6 space-y-6">
          <Skeleton className="h-10 w-10 rounded-lg" />
          <div className="flex items-center gap-4">
            <Skeleton className="h-24 w-24 rounded-full" />
            <div className="space-y-2">
              <Skeleton className="h-6 w-40" />
              <Skeleton className="h-4 w-32" />
            </div>
          </div>
          <Skeleton className="h-32 w-full rounded-2xl" />
        </div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-2">User not found</h1>
          <p className="text-muted-foreground mb-4">This user doesn't exist or has been removed</p>
          <Button onClick={() => router.back()}>Go Back</Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto p-4 md:p-6">
        {/* Back Button */}
        <Button variant="ghost" size="icon" onClick={() => router.back()} className="mb-6">
          <ArrowLeft className="h-5 w-5" />
        </Button>

        {/* Profile Header */}
        <div className="bg-card rounded-2xl border border-border p-6 mb-6">
          <div className="flex flex-col md:flex-row md:items-center gap-6">
            <Avatar className="h-24 w-24">
              <AvatarImage src={user.avatar || "/placeholder.svg"} />
              <AvatarFallback className="text-2xl">{user.name.charAt(0)}</AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <h1 className="text-2xl font-bold">{user.name}</h1>
                {user.isVerified && <CheckCircle className="h-5 w-5 text-blue-500" />}
              </div>
              <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                <span className="flex items-center gap-1">
                  <MapPin className="h-4 w-4" />
                  {user.town ? `${user.town}, ` : ""}{user.region}
                </span>
                <span className="flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  Joined {new Date(user.joinedAt).toLocaleDateString("en-US", { month: "long", year: "numeric" })}
                </span>
              </div>
              {user.stats.avgRating && (
                <div className="flex items-center gap-2 mt-3">
                  <div className="flex">{renderStars(Math.round(user.stats.avgRating))}</div>
                  <span className="text-sm">
                    {user.stats.avgRating.toFixed(1)} ({user.stats.ratingCount} reviews)
                  </span>
                </div>
              )}
            </div>
            <Button>
              <MessageCircle className="h-4 w-4 mr-2" /> Contact
            </Button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-4 mt-6 pt-6 border-t border-border">
            <div className="text-center">
              <p className="text-2xl font-bold">{user.stats.totalListings}</p>
              <p className="text-sm text-muted-foreground">Listings</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold">{user.stats.completedTrades}</p>
              <p className="text-sm text-muted-foreground">Trades</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold">{user.stats.avgRating?.toFixed(1) || "N/A"}</p>
              <p className="text-sm text-muted-foreground">Rating</p>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="w-full md:w-auto mb-6 bg-muted rounded-xl p-1">
            <TabsTrigger value="listings" className="rounded-lg">
              <Package className="h-4 w-4 mr-2" /> Listings ({listings.length})
            </TabsTrigger>
            <TabsTrigger value="reviews" className="rounded-lg">
              <Star className="h-4 w-4 mr-2" /> Reviews ({ratings.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="listings" className="mt-0">
            {listings.length === 0 ? (
              <div className="text-center py-12">
                <Package className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">No active listings</p>
              </div>
            ) : (
              <div className="grid gap-4 md:grid-cols-2">
                {listings.map((listing) => (
                  <Link
                    key={listing.id}
                    href={`/dashboard/listings/${listing.id}`}
                    className="group bg-card rounded-xl border border-border overflow-hidden hover:border-primary/50 transition-colors"
                  >
                    <div className="relative aspect-video">
                      <Image
                        src={listing.primaryImage || "/placeholder.svg"}
                        alt={listing.title}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                      {listing.status === "active" && (
                        <Badge className="absolute top-2 left-2 bg-green-500/10 text-green-600">
                          Active
                        </Badge>
                      )}
                    </div>
                    <div className="p-4">
                      <h3 className="font-semibold mb-1 line-clamp-1">{listing.title}</h3>
                      <p className="text-lg font-bold text-primary mb-2">
                        N${listing.value.toLocaleString()}
                      </p>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Eye className="h-3.5 w-3.5" /> {listing.views}
                        </span>
                        <span className="flex items-center gap-1">
                          <Heart className="h-3.5 w-3.5" /> {listing.likes}
                        </span>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="reviews" className="mt-0">
            {ratings.length === 0 ? (
              <div className="text-center py-12">
                <Star className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">No reviews yet</p>
              </div>
            ) : (
              <div className="space-y-4">
                {ratings.map((rating) => (
                  <div key={rating.id} className="bg-card rounded-xl border border-border p-4">
                    <div className="flex items-start gap-3">
                      <Avatar>
                        <AvatarImage src={rating.fromUser.avatar || "/placeholder.svg"} />
                        <AvatarFallback>{rating.fromUser.name.charAt(0)}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-medium">{rating.fromUser.name}</span>
                          <span className="text-xs text-muted-foreground">
                            {new Date(rating.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                        <div className="flex mb-2">{renderStars(rating.rating)}</div>
                        {rating.review && (
                          <p className="text-sm text-muted-foreground">{rating.review}</p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
