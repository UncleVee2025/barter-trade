"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import useSWR from "swr"
import { 
  ArrowLeftRight, 
  Check, 
  X, 
  Clock, 
  MessageSquare, 
  ChevronRight,
  Loader2,
  RefreshCw,
  Package,
  AlertCircle,
  Filter,
  Send,
  Inbox
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Skeleton } from "@/components/ui/skeleton"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog"
import { DashboardLayout } from "@/components/dashboard/dashboard-layout"
import { useAuth } from "@/contexts/auth-context"
import { toast } from "@/hooks/use-toast"
import { cn } from "@/lib/utils"
import Image from "next/image"
import Link from "next/link"

interface OfferListing {
  id: string
  title: string
  value: number
  primaryImage: string
}

interface OfferUser {
  id: string
  name: string
  avatar: string | null
  isVerified: boolean
  region: string
}

interface Offer {
  id: string
  status: string
  walletAmount: number
  message: string | null
  createdAt: string
  sender: OfferUser
  receiver: OfferUser
  targetListing: OfferListing
  offeredListings: OfferListing[]
  totalValue: number
}

interface OffersResponse {
  offers: Offer[]
  pagination: {
    total: number
    page: number
    limit: number
  }
}

const fetcher = (url: string) => fetch(url).then((res) => res.json())

const statusConfig: Record<string, { label: string; color: string; bgColor: string }> = {
  pending: { label: "Pending", color: "text-yellow-500", bgColor: "bg-yellow-500/10" },
  accepted: { label: "Accepted", color: "text-green-500", bgColor: "bg-green-500/10" },
  rejected: { label: "Rejected", color: "text-red-500", bgColor: "bg-red-500/10" },
  countered: { label: "Countered", color: "text-blue-500", bgColor: "bg-blue-500/10" },
  completed: { label: "Completed", color: "text-emerald-500", bgColor: "bg-emerald-500/10" },
  cancelled: { label: "Cancelled", color: "text-gray-500", bgColor: "bg-gray-500/10" },
}

function formatRelativeTime(dateString: string): string {
  const date = new Date(dateString)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
  const diffDays = Math.floor(diffHours / 24)
  
  if (diffDays > 7) return date.toLocaleDateString()
  if (diffDays > 0) return `${diffDays}d ago`
  if (diffHours > 0) return `${diffHours}h ago`
  return "Just now"
}

export default function OffersPage() {
  const { user } = useAuth()
  const [activeTab, setActiveTab] = useState<"received" | "sent">("received")
  const [statusFilter, setStatusFilter] = useState("all")
  const [selectedOffer, setSelectedOffer] = useState<Offer | null>(null)
  const [actionType, setActionType] = useState<"accept" | "reject" | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)

  // Fetch offers
  const { data, error, isLoading, mutate: refreshOffers } = useSWR<OffersResponse>(
    user ? `/api/offers?type=${activeTab}&status=${statusFilter}` : null,
    fetcher,
    { revalidateOnFocus: true }
  )

  const offers = data?.offers || []

  const handleAcceptOffer = async (offerId: string) => {
    setIsProcessing(true)
    try {
      const response = await fetch(`/api/offers/${offerId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "accept" }),
      })

      if (!response.ok) throw new Error("Failed to accept offer")

      toast({ title: "Offer accepted successfully!" })
      refreshOffers()
    } catch {
      toast({ title: "Failed to accept offer", variant: "destructive" })
    } finally {
      setIsProcessing(false)
      setSelectedOffer(null)
      setActionType(null)
    }
  }

  const handleRejectOffer = async (offerId: string) => {
    setIsProcessing(true)
    try {
      const response = await fetch(`/api/offers/${offerId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "reject" }),
      })

      if (!response.ok) throw new Error("Failed to reject offer")

      toast({ title: "Offer rejected" })
      refreshOffers()
    } catch {
      toast({ title: "Failed to reject offer", variant: "destructive" })
    } finally {
      setIsProcessing(false)
      setSelectedOffer(null)
      setActionType(null)
    }
  }

  const confirmAction = () => {
    if (!selectedOffer || !actionType) return
    if (actionType === "accept") {
      handleAcceptOffer(selectedOffer.id)
    } else {
      handleRejectOffer(selectedOffer.id)
    }
  }

  const OfferCard = ({ offer, type }: { offer: Offer; type: "received" | "sent" }) => {
    const otherUser = type === "received" ? offer.sender : offer.receiver
    const status = statusConfig[offer.status] || statusConfig.pending

    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-card rounded-2xl border border-border p-4 hover:shadow-lg transition-all"
      >
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <Avatar className="h-10 w-10">
              <AvatarImage src={otherUser.avatar || "/placeholder.svg"} />
              <AvatarFallback className="bg-gradient-to-br from-primary to-amber-500 text-white">
                {otherUser.name.charAt(0)}
              </AvatarFallback>
            </Avatar>
            <div>
              <p className="font-medium text-foreground">{otherUser.name}</p>
              <p className="text-xs text-muted-foreground">{otherUser.region}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge className={cn("rounded-lg", status.bgColor, status.color)}>
              {status.label}
            </Badge>
            <span className="text-xs text-muted-foreground">{formatRelativeTime(offer.createdAt)}</span>
          </div>
        </div>

        {/* Trade Visual */}
        <div className="flex items-center gap-3 mb-4">
          {/* Offered Items */}
          <div className="flex-1">
            <p className="text-xs text-muted-foreground mb-2">
              {type === "received" ? "They offer" : "You offer"}
            </p>
            <div className="flex -space-x-2">
              {offer.offeredListings.slice(0, 3).map((listing) => (
                <div
                  key={listing.id}
                  className="w-12 h-12 rounded-lg border-2 border-background overflow-hidden"
                >
                  <Image
                    src={listing.primaryImage || "/placeholder.svg"}
                    alt={listing.title}
                    width={48}
                    height={48}
                    className="w-full h-full object-cover"
                  />
                </div>
              ))}
              {offer.offeredListings.length > 3 && (
                <div className="w-12 h-12 rounded-lg border-2 border-background bg-muted flex items-center justify-center text-xs font-medium">
                  +{offer.offeredListings.length - 3}
                </div>
              )}
            </div>
            {offer.walletAmount > 0 && (
              <p className="text-xs text-primary mt-1">+ N${offer.walletAmount.toLocaleString()}</p>
            )}
          </div>

          {/* Arrow */}
          <div className="flex-shrink-0 w-10 h-10 rounded-full bg-muted flex items-center justify-center">
            <ArrowLeftRight className="h-5 w-5 text-muted-foreground" />
          </div>

          {/* Target Item */}
          <div className="flex-1 text-right">
            <p className="text-xs text-muted-foreground mb-2">
              {type === "received" ? "For your" : "For their"}
            </p>
            <div className="flex justify-end">
              <div className="w-12 h-12 rounded-lg overflow-hidden">
                <Image
                  src={offer.targetListing.primaryImage || "/placeholder.svg"}
                  alt={offer.targetListing.title}
                  width={48}
                  height={48}
                  className="w-full h-full object-cover"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Value Summary */}
        <div className="flex items-center justify-between p-3 rounded-xl bg-muted/50 mb-4">
          <div>
            <p className="text-xs text-muted-foreground">Total Offer Value</p>
            <p className="font-bold text-foreground">N${offer.totalValue.toLocaleString()}</p>
          </div>
          <div className="text-right">
            <p className="text-xs text-muted-foreground">Target Value</p>
            <p className="font-bold text-primary">N${offer.targetListing.value.toLocaleString()}</p>
          </div>
        </div>

        {/* Message */}
        {offer.message && (
          <div className="p-3 rounded-xl bg-muted/30 mb-4">
            <p className="text-sm text-foreground/80 italic">"{offer.message}"</p>
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center gap-2">
          {type === "received" && offer.status === "pending" && (
            <>
              <Button
                size="sm"
                className="flex-1 rounded-xl"
                onClick={() => {
                  setSelectedOffer(offer)
                  setActionType("accept")
                }}
              >
                <Check className="h-4 w-4 mr-1" />
                Accept
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="flex-1 rounded-xl bg-transparent"
                onClick={() => {
                  setSelectedOffer(offer)
                  setActionType("reject")
                }}
              >
                <X className="h-4 w-4 mr-1" />
                Decline
              </Button>
            </>
          )}
          <Button
            size="sm"
            variant="ghost"
            className="rounded-xl"
            asChild
          >
            <Link href={`/dashboard/messages?userId=${otherUser.id}`}>
              <MessageSquare className="h-4 w-4 mr-1" />
              Message
            </Link>
          </Button>
        </div>
      </motion.div>
    )
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Trade Offers</h1>
            <p className="text-muted-foreground">Manage your sent and received trade offers</p>
          </div>
          <Button
            variant="outline"
            size="icon"
            onClick={() => refreshOffers()}
            disabled={isLoading}
            className="rounded-xl bg-transparent"
          >
            <RefreshCw className={cn("h-4 w-4", isLoading && "animate-spin")} />
          </Button>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as "received" | "sent")}>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <TabsList className="grid w-full sm:w-auto grid-cols-2 rounded-xl bg-muted p-1">
              <TabsTrigger value="received" className="rounded-lg data-[state=active]:bg-background">
                <Inbox className="h-4 w-4 mr-2" />
                Received
              </TabsTrigger>
              <TabsTrigger value="sent" className="rounded-lg data-[state=active]:bg-background">
                <Send className="h-4 w-4 mr-2" />
                Sent
              </TabsTrigger>
            </TabsList>

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-40 rounded-xl bg-muted border-0">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Filter" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="accepted">Accepted</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Error State */}
          {error && (
            <div className="text-center py-12">
              <AlertCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
              <h3 className="text-lg font-medium text-foreground mb-2">Failed to load offers</h3>
              <Button onClick={() => refreshOffers()} className="rounded-xl">
                <RefreshCw className="h-4 w-4 mr-2" />
                Try Again
              </Button>
            </div>
          )}

          {/* Loading State */}
          {isLoading && !error && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="bg-card rounded-2xl border border-border p-4">
                  <div className="flex items-center gap-3 mb-4">
                    <Skeleton className="h-10 w-10 rounded-full" />
                    <div className="space-y-2">
                      <Skeleton className="h-4 w-24" />
                      <Skeleton className="h-3 w-16" />
                    </div>
                  </div>
                  <div className="flex items-center gap-3 mb-4">
                    <Skeleton className="h-12 w-12 rounded-lg" />
                    <Skeleton className="h-10 w-10 rounded-full" />
                    <Skeleton className="h-12 w-12 rounded-lg ml-auto" />
                  </div>
                  <Skeleton className="h-16 w-full rounded-xl mb-4" />
                  <div className="flex gap-2">
                    <Skeleton className="h-9 flex-1 rounded-xl" />
                    <Skeleton className="h-9 flex-1 rounded-xl" />
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Content */}
          {!isLoading && !error && (
            <>
              <TabsContent value="received" className="mt-6">
                {offers.length === 0 ? (
                  <div className="text-center py-16">
                    <Inbox className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-foreground mb-2">No offers received</h3>
                    <p className="text-muted-foreground">
                      When someone makes an offer on your listings, it will appear here
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {offers.map((offer) => (
                      <OfferCard key={offer.id} offer={offer} type="received" />
                    ))}
                  </div>
                )}
              </TabsContent>

              <TabsContent value="sent" className="mt-6">
                {offers.length === 0 ? (
                  <div className="text-center py-16">
                    <Send className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-foreground mb-2">No offers sent</h3>
                    <p className="text-muted-foreground mb-4">
                      Browse listings and make offers to start trading
                    </p>
                    <Button asChild className="rounded-xl">
                      <Link href="/dashboard/browse">Browse Listings</Link>
                    </Button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {offers.map((offer) => (
                      <OfferCard key={offer.id} offer={offer} type="sent" />
                    ))}
                  </div>
                )}
              </TabsContent>
            </>
          )}
        </Tabs>

        {/* Confirmation Dialog */}
        <AlertDialog open={!!selectedOffer && !!actionType} onOpenChange={() => {
          setSelectedOffer(null)
          setActionType(null)
        }}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>
                {actionType === "accept" ? "Accept this offer?" : "Decline this offer?"}
              </AlertDialogTitle>
              <AlertDialogDescription>
                {actionType === "accept" 
                  ? "By accepting, you agree to trade your item for the offered items. The other party will be notified."
                  : "This will decline the trade offer. You can always negotiate via messages."
                }
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={confirmAction}
                disabled={isProcessing}
                className={actionType === "reject" ? "bg-destructive hover:bg-destructive/90" : ""}
              >
                {isProcessing && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                {actionType === "accept" ? "Accept Offer" : "Decline Offer"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </DashboardLayout>
  )
}
