"use client"

import { useState, useEffect, use } from "react"
import { motion } from "framer-motion"
import Link from "next/link"
import { 
  BadgeCheck, 
  MapPin, 
  Calendar, 
  Star, 
  Shield, 
  Mail, 
  Phone,
  MessageCircle,
  Send,
  Eye,
  ArrowRight,
  Sparkles,
  Award,
  TrendingUp,
  ExternalLink
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Progress } from "@/components/ui/progress"
import { Separator } from "@/components/ui/separator"
import { Skeleton } from "@/components/ui/skeleton"
import { cn } from "@/lib/utils"
import { QRTransferModal } from "@/components/certification/qr-transfer-modal"

interface ProfileData {
  id: string
  name: string
  avatar_url: string | null
  location: string
  member_since: string
  is_certified: boolean
  display_title: string
  certified_at: string
  verifications: {
    id: boolean
    email: boolean
    phone: boolean
  }
  stats: {
    completed_trades: number
    active_listings: number
    average_rating: string | null
    review_count: number
    trust_score: number
  }
  tier: string
  total_points: number
  recent_listings: Array<{
    id: string
    title: string
    category: string
    price: number
    image: string | null
    condition: string
  }>
  actions: {
    can_message: boolean
    can_transfer_credits: boolean
    can_view_listings: boolean
    can_make_offer: boolean
  }
}

const tierConfig: Record<string, { color: string; bg: string; icon: string }> = {
  bronze: { color: "text-orange-600", bg: "bg-orange-100", icon: "🥉" },
  silver: { color: "text-slate-600", bg: "bg-slate-100", icon: "🥈" },
  gold: { color: "text-amber-600", bg: "bg-amber-100", icon: "🥇" },
  platinum: { color: "text-cyan-600", bg: "bg-cyan-100", icon: "💎" },
  diamond: { color: "text-violet-600", bg: "bg-violet-100", icon: "👑" },
}

export default function PublicQRProfilePage({ 
  params 
}: { 
  params: Promise<{ qrCode: string }> 
}) {
  const { qrCode } = use(params)
  const [profile, setProfile] = useState<ProfileData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [transferModalOpen, setTransferModalOpen] = useState(false)

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await fetch(`/api/user/public/${qrCode}`)
        if (!res.ok) {
          const data = await res.json()
          setError(data.error || "Profile not found")
          return
        }
        const data = await res.json()
        setProfile(data)
      } catch (err) {
        setError("Failed to load profile")
      } finally {
        setLoading(false)
      }
    }

    if (qrCode) {
      fetchProfile()
    }
  }, [qrCode])

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-background to-muted/30 py-8 px-4">
        <div className="max-w-lg mx-auto space-y-6">
          <Skeleton className="h-48 rounded-2xl" />
          <Skeleton className="h-32 rounded-xl" />
          <Skeleton className="h-24 rounded-xl" />
        </div>
      </div>
    )
  }

  if (error || !profile) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-background to-muted/30 flex items-center justify-center p-4">
        <Card className="max-w-md w-full text-center">
          <CardContent className="pt-8 pb-6 space-y-4">
            <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center mx-auto">
              <BadgeCheck className="h-8 w-8 text-destructive" />
            </div>
            <h2 className="text-xl font-semibold">Profile Not Found</h2>
            <p className="text-muted-foreground">
              {error || "This QR code is invalid or the user is no longer certified."}
            </p>
            <Button asChild className="mt-4">
              <Link href="/">Go to Homepage</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  const tierStyle = tierConfig[profile.tier] || tierConfig.bronze

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/30">
      {/* Header */}
      <div className="relative h-32 bg-gradient-to-r from-primary/10 via-primary/5 to-amber-500/10">
        <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-30" />
        <div className="absolute -bottom-16 left-1/2 -translate-x-1/2">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.1 }}
          >
            <Avatar className="h-32 w-32 border-4 border-background shadow-xl">
              <AvatarImage src={profile.avatar_url || undefined} alt={profile.name} />
              <AvatarFallback className="text-3xl bg-primary/10">
                {profile.name?.charAt(0)?.toUpperCase() || "?"}
              </AvatarFallback>
            </Avatar>
            {profile.is_certified && (
              <div className="absolute -bottom-1 -right-1 bg-emerald-500 rounded-full p-1.5 shadow-lg">
                <BadgeCheck className="h-5 w-5 text-white" />
              </div>
            )}
          </motion.div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-lg mx-auto px-4 pt-20 pb-8 space-y-6">
        {/* Name & Title */}
        <motion.div 
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="text-center space-y-2"
        >
          <h1 className="text-2xl font-bold">{profile.name}</h1>
          <div className="flex items-center justify-center gap-2">
            <Badge 
              variant="secondary" 
              className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20"
            >
              <Sparkles className="mr-1 h-3 w-3" />
              {profile.display_title}
            </Badge>
          </div>
          <div className="flex items-center justify-center gap-4 text-sm text-muted-foreground">
            <span className="flex items-center gap-1">
              <MapPin className="h-3.5 w-3.5" />
              {profile.location}
            </span>
            <span className="flex items-center gap-1">
              <Calendar className="h-3.5 w-3.5" />
              Member since {new Date(profile.member_since).getFullYear()}
            </span>
          </div>
        </motion.div>

        {/* Trust Score & Tier */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          <Card>
            <CardContent className="pt-4 pb-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Shield className="h-4 w-4 text-primary" />
                  <span className="text-sm font-medium">Trust Score</span>
                </div>
                <span className="text-lg font-bold">{profile.stats.trust_score}%</span>
              </div>
              <Progress value={profile.stats.trust_score} className="h-2" />
              <div className="flex items-center justify-between mt-3">
                <div className="flex items-center gap-2">
                  {profile.verifications.id && (
                    <Badge variant="outline" className="text-xs bg-emerald-500/10 text-emerald-600 border-emerald-500/20">
                      ID Verified
                    </Badge>
                  )}
                  {profile.verifications.email && (
                    <Badge variant="outline" className="text-xs bg-blue-500/10 text-blue-600 border-blue-500/20">
                      Email
                    </Badge>
                  )}
                  {profile.verifications.phone && (
                    <Badge variant="outline" className="text-xs bg-violet-500/10 text-violet-600 border-violet-500/20">
                      Phone
                    </Badge>
                  )}
                </div>
                <Badge className={cn(tierStyle.bg, tierStyle.color, "border-0")}>
                  {tierStyle.icon} {profile.tier.charAt(0).toUpperCase() + profile.tier.slice(1)}
                </Badge>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Stats */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.4 }}
        >
          <div className="grid grid-cols-3 gap-3">
            <Card className="text-center">
              <CardContent className="pt-4 pb-3">
                <TrendingUp className="h-5 w-5 mx-auto mb-1 text-primary" />
                <p className="text-2xl font-bold">{profile.stats.completed_trades}</p>
                <p className="text-xs text-muted-foreground">Trades</p>
              </CardContent>
            </Card>
            <Card className="text-center">
              <CardContent className="pt-4 pb-3">
                <Eye className="h-5 w-5 mx-auto mb-1 text-primary" />
                <p className="text-2xl font-bold">{profile.stats.active_listings}</p>
                <p className="text-xs text-muted-foreground">Listings</p>
              </CardContent>
            </Card>
            <Card className="text-center">
              <CardContent className="pt-4 pb-3">
                <Star className="h-5 w-5 mx-auto mb-1 text-amber-500" />
                <p className="text-2xl font-bold">
                  {profile.stats.average_rating || "N/A"}
                </p>
                <p className="text-xs text-muted-foreground">
                  {profile.stats.review_count} reviews
                </p>
              </CardContent>
            </Card>
          </div>
        </motion.div>

        {/* Quick Actions */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="grid grid-cols-2 gap-3"
        >
          <Button 
            className="h-auto py-4 flex-col gap-2"
            onClick={() => setTransferModalOpen(true)}
          >
            <Send className="h-5 w-5" />
            <span>Send Credits</span>
          </Button>
          <Button 
            variant="outline" 
            className="h-auto py-4 flex-col gap-2 bg-transparent"
            asChild
          >
            <Link href={`/users/${profile.id}`}>
              <MessageCircle className="h-5 w-5" />
              <span>View Full Profile</span>
            </Link>
          </Button>
        </motion.div>

        {/* Recent Listings */}
        {profile.recent_listings.length > 0 && (
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.6 }}
          >
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">Recent Listings</CardTitle>
                  <Button variant="ghost" size="sm" asChild>
                    <Link href={`/users/${profile.id}?tab=listings`}>
                      View All <ArrowRight className="ml-1 h-3 w-3" />
                    </Link>
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {profile.recent_listings.slice(0, 3).map((listing) => (
                  <Link 
                    key={listing.id} 
                    href={`/dashboard/listings/${listing.id}`}
                    className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors"
                  >
                    <div className="w-12 h-12 rounded-lg bg-muted overflow-hidden flex-shrink-0">
                      {listing.image ? (
                        <img 
                          src={listing.image || "/placeholder.svg"} 
                          alt={listing.title}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                          📦
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">{listing.title}</p>
                      <p className="text-xs text-muted-foreground">{listing.category}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-sm">
                        {listing.price > 0 ? `N$${listing.price}` : "Trade Only"}
                      </p>
                    </div>
                  </Link>
                ))}
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Footer */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.7 }}
          className="text-center pt-4"
        >
          <Separator className="mb-4" />
          <p className="text-xs text-muted-foreground mb-2">
            Verified on Barter Trade Namibia
          </p>
          <Button variant="link" size="sm" asChild>
            <Link href="/">
              <ExternalLink className="mr-1 h-3 w-3" />
              Visit bartertrade.na
            </Link>
          </Button>
        </motion.div>
      </div>

      {/* Transfer Modal */}
      <QRTransferModal
        open={transferModalOpen}
        onClose={() => setTransferModalOpen(false)}
        recipientQrCode={qrCode}
        recipientName={profile.name}
      />
    </div>
  )
}
