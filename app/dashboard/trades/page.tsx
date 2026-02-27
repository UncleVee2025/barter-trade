"use client"

import { useState, useEffect } from "react"
import { DashboardLayout } from "@/components/dashboard/dashboard-layout"
import { ProtectedRoute } from "@/components/auth/protected-route"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { toast } from "@/hooks/use-toast"
import Image from "next/image"
import Link from "next/link"
import {
  ArrowRight,
  ArrowLeftRight,
  Clock,
  CheckCircle,
  XCircle,
  MessageCircle,
  Package,
  Wallet,
} from "lucide-react"
import { cn } from "@/lib/utils"

interface TradeOffer {
  id: string
  senderId: string
  receiverId: string
  walletAmount: number
  message?: string
  status: string
  createdAt: string
  expiresAt: string
  sender: {
    id: string
    name: string
    avatar?: string
  }
  receiver: {
    id: string
    name: string
    avatar?: string
  }
  senderItems: Array<{
    id: string
    title: string
    value: number
    primaryImage: string
  }>
  receiverItems: Array<{
    id: string
    title: string
    value: number
    primaryImage: string
  }>
}

export default function TradesPage() {
  const [trades, setTrades] = useState<TradeOffer[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [activeTab, setActiveTab] = useState("all")

  useEffect(() => {
    fetchTrades()
  }, [])

  const fetchTrades = async () => {
    try {
      const response = await fetch("/api/offers")
      if (!response.ok) throw new Error("Failed to fetch")
      const data = await response.json()
      setTrades(data.offers || [])
    } catch {
      toast({ title: "Error", description: "Failed to load trades", variant: "destructive" })
    } finally {
      setIsLoading(false)
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return <Badge className="bg-yellow-500/10 text-yellow-600"><Clock className="h-3 w-3 mr-1" /> Pending</Badge>
      case "accepted":
        return <Badge className="bg-green-500/10 text-green-600"><CheckCircle className="h-3 w-3 mr-1" /> Accepted</Badge>
      case "rejected":
        return <Badge className="bg-red-500/10 text-red-600"><XCircle className="h-3 w-3 mr-1" /> Rejected</Badge>
      case "expired":
        return <Badge className="bg-muted text-muted-foreground"><Clock className="h-3 w-3 mr-1" /> Expired</Badge>
      case "countered":
        return <Badge className="bg-blue-500/10 text-blue-600"><ArrowLeftRight className="h-3 w-3 mr-1" /> Countered</Badge>
      default:
        return <Badge variant="secondary">{status}</Badge>
    }
  }

  const filteredTrades = trades.filter((trade) => {
    if (activeTab === "all") return true
    return trade.status === activeTab
  })

  const stats = {
    total: trades.length,
    pending: trades.filter((t) => t.status === "pending").length,
    accepted: trades.filter((t) => t.status === "accepted").length,
    rejected: trades.filter((t) => t.status === "rejected").length,
  }

  return (
    <ProtectedRoute>
      <DashboardLayout>
        <div className="p-4 md:p-6">
          {/* Header */}
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
              <ArrowLeftRight className="h-6 w-6 text-primary" />
              Trade History
            </h1>
            <p className="text-muted-foreground">View and manage all your trade offers</p>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-card rounded-xl p-4 border border-border">
              <p className="text-sm text-muted-foreground">Total Trades</p>
              <p className="text-2xl font-bold">{stats.total}</p>
            </div>
            <div className="bg-card rounded-xl p-4 border border-border">
              <p className="text-sm text-muted-foreground">Pending</p>
              <p className="text-2xl font-bold text-yellow-600">{stats.pending}</p>
            </div>
            <div className="bg-card rounded-xl p-4 border border-border">
              <p className="text-sm text-muted-foreground">Completed</p>
              <p className="text-2xl font-bold text-green-600">{stats.accepted}</p>
            </div>
            <div className="bg-card rounded-xl p-4 border border-border">
              <p className="text-sm text-muted-foreground">Rejected</p>
              <p className="text-2xl font-bold text-red-600">{stats.rejected}</p>
            </div>
          </div>

          {/* Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="w-full md:w-auto mb-6 bg-muted rounded-xl p-1">
              <TabsTrigger value="all" className="rounded-lg">All</TabsTrigger>
              <TabsTrigger value="pending" className="rounded-lg">Pending</TabsTrigger>
              <TabsTrigger value="accepted" className="rounded-lg">Completed</TabsTrigger>
              <TabsTrigger value="rejected" className="rounded-lg">Rejected</TabsTrigger>
            </TabsList>

            <TabsContent value={activeTab} className="mt-0">
              {isLoading ? (
                <div className="space-y-4">
                  {[1, 2, 3].map((i) => (
                    <Skeleton key={i} className="h-40 rounded-2xl" />
                  ))}
                </div>
              ) : filteredTrades.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-center">
                  <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center mb-4">
                    <ArrowLeftRight className="h-10 w-10 text-muted-foreground" />
                  </div>
                  <h2 className="text-xl font-semibold mb-2">No trades found</h2>
                  <p className="text-muted-foreground mb-6 max-w-md">
                    {activeTab === "all"
                      ? "You haven't made or received any trade offers yet"
                      : `No ${activeTab} trades`}
                  </p>
                  <Button asChild>
                    <Link href="/dashboard/browse">
                      Browse Listings <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredTrades.map((trade) => (
                    <div
                      key={trade.id}
                      className="bg-card rounded-2xl border border-border overflow-hidden hover:border-primary/50 transition-colors"
                    >
                      <div className="p-4 md:p-6">
                        {/* Trade Header */}
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
                          <div className="flex items-center gap-3">
                            <Avatar>
                              <AvatarImage src={trade.sender.avatar || "/placeholder.svg"} />
                              <AvatarFallback>{trade.sender.name.charAt(0)}</AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="font-medium">{trade.sender.name}</p>
                              <p className="text-sm text-muted-foreground">
                                {new Date(trade.createdAt).toLocaleDateString()}
                              </p>
                            </div>
                          </div>
                          {getStatusBadge(trade.status)}
                        </div>

                        {/* Trade Items */}
                        <div className="flex items-center gap-4">
                          {/* Sender Items */}
                          <div className="flex-1">
                            <p className="text-xs text-muted-foreground mb-2">Offering</p>
                            <div className="flex gap-2">
                              {trade.senderItems.map((item) => (
                                <div key={item.id} className="relative w-16 h-16 rounded-lg overflow-hidden bg-muted">
                                  <Image src={item.primaryImage || "/placeholder.svg"} alt={item.title} fill className="object-cover" />
                                </div>
                              ))}
                              {trade.walletAmount > 0 && (
                                <div className="w-16 h-16 rounded-lg bg-primary/10 flex flex-col items-center justify-center">
                                  <Wallet className="h-4 w-4 text-primary mb-1" />
                                  <span className="text-xs font-medium text-primary">
                                    N${trade.walletAmount}
                                  </span>
                                </div>
                              )}
                            </div>
                          </div>

                          <ArrowLeftRight className="h-6 w-6 text-muted-foreground flex-shrink-0" />

                          {/* Receiver Items */}
                          <div className="flex-1">
                            <p className="text-xs text-muted-foreground mb-2">For</p>
                            <div className="flex gap-2">
                              {trade.receiverItems.map((item) => (
                                <div key={item.id} className="relative w-16 h-16 rounded-lg overflow-hidden bg-muted">
                                  <Image src={item.primaryImage || "/placeholder.svg"} alt={item.title} fill className="object-cover" />
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>

                        {trade.message && (
                          <p className="mt-4 text-sm text-muted-foreground bg-muted/50 p-3 rounded-lg">
                            "{trade.message}"
                          </p>
                        )}

                        {/* Actions */}
                        {trade.status === "pending" && (
                          <div className="flex gap-2 mt-4 pt-4 border-t border-border">
                            <Button asChild variant="outline" className="flex-1 bg-transparent">
                              <Link href={`/dashboard/messages`}>
                                <MessageCircle className="h-4 w-4 mr-2" /> Message
                              </Link>
                            </Button>
                            <Button className="flex-1">View Details</Button>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  )
}
