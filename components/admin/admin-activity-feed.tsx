"use client"

import React from "react"

import { useState, useEffect, useCallback } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Activity,
  RefreshCw,
  Filter,
  Search,
  User,
  Package,
  DollarSign,
  Shield,
  AlertTriangle,
  MessageSquare,
  LogIn,
  LogOut,
  UserPlus,
  Ban,
  CheckCircle,
  XCircle,
  Clock,
  MoreHorizontal
} from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu"
import { formatDistanceToNow } from "date-fns"

interface ActivityItem {
  id: string
  user_id: string | null
  admin_id: string | null
  action_type: string
  entity_type: string | null
  entity_id: string | null
  description: string
  ip_address: string | null
  user_agent: string | null
  metadata: Record<string, unknown> | null
  created_at: string
  user_name?: string
  user_email?: string
  admin_name?: string
}

interface ActivitySummary {
  action_type: string
  count: number
}

const actionTypeConfig: Record<string, { icon: React.ElementType; color: string; label: string }> = {
  user_login: { icon: LogIn, color: "text-green-500", label: "User Login" },
  user_logout: { icon: LogOut, color: "text-gray-500", label: "User Logout" },
  user_register: { icon: UserPlus, color: "text-blue-500", label: "New Registration" },
  user_banned: { icon: Ban, color: "text-red-500", label: "User Banned" },
  user_unbanned: { icon: CheckCircle, color: "text-green-500", label: "User Unbanned" },
  listing_created: { icon: Package, color: "text-blue-500", label: "Listing Created" },
  listing_updated: { icon: Package, color: "text-yellow-500", label: "Listing Updated" },
  listing_deleted: { icon: Package, color: "text-red-500", label: "Listing Deleted" },
  listing_approved: { icon: CheckCircle, color: "text-green-500", label: "Listing Approved" },
  listing_flagged: { icon: AlertTriangle, color: "text-orange-500", label: "Listing Flagged" },
  trade_initiated: { icon: MessageSquare, color: "text-blue-500", label: "Trade Initiated" },
  trade_completed: { icon: CheckCircle, color: "text-green-500", label: "Trade Completed" },
  trade_cancelled: { icon: XCircle, color: "text-red-500", label: "Trade Cancelled" },
  wallet_topup: { icon: DollarSign, color: "text-green-500", label: "Wallet Top-up" },
  wallet_transfer: { icon: DollarSign, color: "text-blue-500", label: "Wallet Transfer" },
  voucher_redeemed: { icon: DollarSign, color: "text-purple-500", label: "Voucher Redeemed" },
  voucher_created: { icon: DollarSign, color: "text-indigo-500", label: "Voucher Created" },
  id_verification_submitted: { icon: Shield, color: "text-blue-500", label: "ID Submitted" },
  id_verification_approved: { icon: Shield, color: "text-green-500", label: "ID Approved" },
  id_verification_rejected: { icon: Shield, color: "text-red-500", label: "ID Rejected" },
  admin_action: { icon: Shield, color: "text-purple-500", label: "Admin Action" },
  system_event: { icon: Activity, color: "text-gray-500", label: "System Event" },
  security_alert: { icon: AlertTriangle, color: "text-red-500", label: "Security Alert" }
}

export function AdminActivityFeed({ compact = false }: { compact?: boolean }) {
  const [activities, setActivities] = useState<ActivityItem[]>([])
  const [summary, setSummary] = useState<ActivitySummary[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [filter, setFilter] = useState<string>("all")
  const [search, setSearch] = useState("")
  const [autoRefresh, setAutoRefresh] = useState(true)

  const fetchActivities = useCallback(async (isRefresh = false) => {
    try {
      if (isRefresh) setRefreshing(true)
      
      const params = new URLSearchParams({
        limit: compact ? "10" : "50",
        ...(filter !== "all" && { action_type: filter })
      })

      const response = await fetch(`/api/admin/activity-log?${params}`)
      if (response.ok) {
        const data = await response.json()
        setActivities(data.activities || [])
        setSummary(data.summary || [])
      }
    } catch (error) {
      console.error("Failed to fetch activities:", error)
      // Generate demo activities
      setActivities(generateDemoActivities())
      setSummary([
        { action_type: "user_login", count: 45 },
        { action_type: "listing_created", count: 23 },
        { action_type: "wallet_topup", count: 12 },
        { action_type: "trade_completed", count: 8 }
      ])
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [filter, compact])

  useEffect(() => {
    fetchActivities()
  }, [fetchActivities])

  // Auto-refresh every 30 seconds if enabled
  useEffect(() => {
    if (!autoRefresh) return
    const interval = setInterval(() => {
      fetchActivities(true)
    }, 30000)
    return () => clearInterval(interval)
  }, [autoRefresh, fetchActivities])

  const generateDemoActivities = (): ActivityItem[] => {
    const actionTypes = Object.keys(actionTypeConfig)
    const names = ["John Doe", "Maria Santos", "David Nghikembua", "Anna Shikongo", "Peter Kamati"]
    const emails = ["john@example.com", "maria@example.com", "david@example.com", "anna@example.com", "peter@example.com"]
    
    return Array.from({ length: compact ? 10 : 30 }, (_, i) => {
      const actionType = actionTypes[Math.floor(Math.random() * actionTypes.length)]
      const config = actionTypeConfig[actionType]
      const userIdx = Math.floor(Math.random() * names.length)
      const minutesAgo = Math.floor(Math.random() * 120) + i * 5
      
      return {
        id: `act_demo_${i}`,
        user_id: `user_${userIdx}`,
        admin_id: actionType.includes("admin") ? "admin-001" : null,
        action_type: actionType,
        entity_type: actionType.includes("listing") ? "listing" : actionType.includes("user") ? "user" : null,
        entity_id: `entity_${i}`,
        description: `${config.label} by ${names[userIdx]}`,
        ip_address: `192.168.1.${Math.floor(Math.random() * 255)}`,
        user_agent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
        metadata: null,
        created_at: new Date(Date.now() - minutesAgo * 60000).toISOString(),
        user_name: names[userIdx],
        user_email: emails[userIdx],
        admin_name: actionType.includes("admin") ? "Admin User" : undefined
      }
    }).sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
  }

  const getActionConfig = (actionType: string) => {
    return actionTypeConfig[actionType] || { icon: Activity, color: "text-gray-500", label: actionType }
  }

  const filteredActivities = activities.filter(activity => {
    if (search) {
      const searchLower = search.toLowerCase()
      return (
        activity.description.toLowerCase().includes(searchLower) ||
        activity.user_name?.toLowerCase().includes(searchLower) ||
        activity.user_email?.toLowerCase().includes(searchLower)
      )
    }
    return true
  })

  const ActivityItemComponent = ({ activity }: { activity: ActivityItem }) => {
    const config = getActionConfig(activity.action_type)
    const Icon = config.icon

    return (
      <div className="flex items-start gap-3 rounded-lg border p-3 transition-colors hover:bg-muted/50">
        <div className={`mt-0.5 rounded-full bg-muted p-2 ${config.color}`}>
          <Icon className="h-4 w-4" />
        </div>
        <div className="flex-1 space-y-1">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium leading-none">{activity.description}</p>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem>View Details</DropdownMenuItem>
                {activity.user_id && <DropdownMenuItem>View User Profile</DropdownMenuItem>}
                {activity.entity_id && <DropdownMenuItem>View Related Item</DropdownMenuItem>}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            {activity.user_name && (
              <>
                <Avatar className="h-4 w-4">
                  <AvatarImage src={`https://api.dicebear.com/7.x/initials/svg?seed=${activity.user_name}`} />
                  <AvatarFallback>{activity.user_name.charAt(0)}</AvatarFallback>
                </Avatar>
                <span>{activity.user_name}</span>
                <span>-</span>
              </>
            )}
            <Clock className="h-3 w-3" />
            <span>{formatDistanceToNow(new Date(activity.created_at), { addSuffix: true })}</span>
          </div>
          {activity.ip_address && !compact && (
            <p className="text-xs text-muted-foreground">IP: {activity.ip_address}</p>
          )}
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Activity Feed</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex items-start gap-3 rounded-lg border p-3">
                <Skeleton className="h-8 w-8 rounded-full" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-3 w-1/2" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  if (compact) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5" />
                Live Activity
              </CardTitle>
              <CardDescription>Real-time platform activity</CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant={autoRefresh ? "default" : "secondary"} className="cursor-pointer" onClick={() => setAutoRefresh(!autoRefresh)}>
                {autoRefresh ? "Live" : "Paused"}
              </Badge>
              <Button variant="ghost" size="icon" onClick={() => fetchActivities(true)} disabled={refreshing}>
                <RefreshCw className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[400px] pr-4">
            <div className="space-y-2">
              {filteredActivities.slice(0, 10).map((activity) => (
                <ActivityItemComponent key={activity.id} activity={activity} />
              ))}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Activity Feed</h2>
          <p className="text-muted-foreground">Real-time platform activity and audit log</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant={autoRefresh ? "default" : "secondary"} className="cursor-pointer" onClick={() => setAutoRefresh(!autoRefresh)}>
            {autoRefresh ? "Live Updates" : "Paused"}
          </Badge>
          <Button variant="outline" size="icon" onClick={() => fetchActivities(true)} disabled={refreshing}>
            <RefreshCw className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        {summary.slice(0, 4).map((item) => {
          const config = getActionConfig(item.action_type)
          const Icon = config.icon
          return (
            <Card key={item.action_type}>
              <CardContent className="flex items-center gap-4 p-4">
                <div className={`rounded-full bg-muted p-2 ${config.color}`}>
                  <Icon className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{item.count}</p>
                  <p className="text-xs text-muted-foreground">{config.label}</p>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col gap-4 md:flex-row md:items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search activities..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={filter} onValueChange={setFilter}>
              <SelectTrigger className="w-[200px]">
                <Filter className="mr-2 h-4 w-4" />
                <SelectValue placeholder="Filter by type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Activities</SelectItem>
                <SelectItem value="user_login">User Logins</SelectItem>
                <SelectItem value="user_register">Registrations</SelectItem>
                <SelectItem value="listing_created">New Listings</SelectItem>
                <SelectItem value="trade_completed">Completed Trades</SelectItem>
                <SelectItem value="wallet_topup">Wallet Top-ups</SelectItem>
                <SelectItem value="id_verification_submitted">ID Verifications</SelectItem>
                <SelectItem value="admin_action">Admin Actions</SelectItem>
                <SelectItem value="security_alert">Security Alerts</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Activity List */}
      <Card>
        <CardContent className="p-4">
          <ScrollArea className="h-[600px] pr-4">
            <div className="space-y-2">
              {filteredActivities.length > 0 ? (
                filteredActivities.map((activity) => (
                  <ActivityItemComponent key={activity.id} activity={activity} />
                ))
              ) : (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <Activity className="h-12 w-12 text-muted-foreground" />
                  <p className="mt-4 text-lg font-medium">No activities found</p>
                  <p className="text-sm text-muted-foreground">Try adjusting your filters</p>
                </div>
              )}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  )
}
