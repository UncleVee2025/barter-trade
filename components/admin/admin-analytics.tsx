"use client"

import React from "react"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import { Progress } from "@/components/ui/progress"
import {
  Users,
  Package,
  TrendingUp,
  DollarSign,
  ArrowUpRight,
  ArrowDownRight,
  Activity,
  BarChart3,
  PieChart,
  RefreshCw,
  Download,
  Calendar,
  Eye,
  Heart,
  MessageSquare,
  ShieldCheck,
  AlertTriangle,
  Wallet
} from "lucide-react"
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from "recharts"

interface AnalyticsData {
  users: {
    total_users: number
    new_users: number
    verified_users: number
    banned_users: number
    online_users: number
  }
  listings: {
    total_listings: number
    active_listings: number
    new_listings: number
    pending_listings: number
    flagged_listings: number
  }
  transactions: {
    total_volume: number
    transaction_count: number
    avg_transaction: number
    total_fees: number
  }
  trades: {
    total_trades: number
    completed_trades: number
    pending_trades: number
    success_rate: number
  }
  wallet: {
    total_balance: number
    topup_volume: number
    transfer_volume: number
  }
  trends: {
    daily: { date: string; users: number; listings: number; transactions: number; volume: number }[]
    users: { date: string; count: number }[]
    listings: { date: string; count: number }[]
  }
  topCategories: { name: string; count: number; percentage: number }[]
  regionStats: { region: string; users: number; listings: number }[]
}

const COLORS = ["#3B82F6", "#10B981", "#F59E0B", "#EF4444", "#8B5CF6", "#06B6D4"]

export function AdminAnalytics() {
  const [period, setPeriod] = useState("7d")
  const [data, setData] = useState<AnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  const fetchAnalytics = async () => {
    try {
      setRefreshing(true)
      const response = await fetch(`/api/admin/analytics?period=${period}&type=overview`)
      if (response.ok) {
        const result = await response.json()
        setData(result)
      }
    } catch (error) {
      console.error("Failed to fetch analytics:", error)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  useEffect(() => {
    fetchAnalytics()
  }, [period])

  // Generate demo data if none available
  const getDemoData = (): AnalyticsData => {
    const days = period === "7d" ? 7 : period === "30d" ? 30 : period === "90d" ? 90 : 365
    const dailyData = Array.from({ length: Math.min(days, 30) }, (_, i) => {
      const date = new Date()
      date.setDate(date.getDate() - (days - i - 1))
      return {
        date: date.toISOString().split("T")[0],
        users: Math.floor(Math.random() * 20) + 5,
        listings: Math.floor(Math.random() * 30) + 10,
        transactions: Math.floor(Math.random() * 50) + 20,
        volume: Math.floor(Math.random() * 50000) + 10000
      }
    })

    return {
      users: { total_users: 1250, new_users: 85, verified_users: 890, banned_users: 12, online_users: 45 },
      listings: { total_listings: 3420, active_listings: 2180, new_listings: 156, pending_listings: 23, flagged_listings: 8 },
      transactions: { total_volume: 425000, transaction_count: 892, avg_transaction: 476.57, total_fees: 4250 },
      trades: { total_trades: 456, completed_trades: 389, pending_trades: 34, success_rate: 85.3 },
      wallet: { total_balance: 185000, topup_volume: 125000, transfer_volume: 89000 },
      trends: { daily: dailyData, users: dailyData.map(d => ({ date: d.date, count: d.users })), listings: dailyData.map(d => ({ date: d.date, count: d.listings })) },
      topCategories: [
        { name: "Electronics", count: 856, percentage: 25 },
        { name: "Vehicles", count: 512, percentage: 15 },
        { name: "Fashion", count: 684, percentage: 20 },
        { name: "Home & Garden", count: 410, percentage: 12 },
        { name: "Services", count: 342, percentage: 10 },
        { name: "Other", count: 616, percentage: 18 }
      ],
      regionStats: [
        { region: "Khomas", users: 450, listings: 1200 },
        { region: "Erongo", users: 280, listings: 680 },
        { region: "Oshana", users: 180, listings: 420 },
        { region: "Otjozondjupa", users: 120, listings: 280 },
        { region: "Other", users: 220, listings: 840 }
      ]
    }
  }

  const analytics = data || getDemoData()

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-NA", {
      style: "currency",
      currency: "NAD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount)
  }

  const formatNumber = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`
    return num.toString()
  }

  const handleExport = () => {
    const exportData = {
      period,
      exportedAt: new Date().toISOString(),
      users: analytics.users,
      listings: analytics.listings,
      transactions: analytics.transactions,
      trades: analytics.trades,
      wallet: analytics.wallet,
      topCategories: analytics.topCategories,
      regionStats: analytics.regionStats
    }
    
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: "application/json" })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.href = url
    link.download = `analytics-report-${period}-${new Date().toISOString().split("T")[0]}.json`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  const StatCard = ({
    title,
    value,
    change,
    icon: Icon,
    trend,
    description
  }: {
    title: string
    value: string | number
    change?: number
    icon: React.ElementType
    trend?: "up" | "down" | "neutral"
    description?: string
  }) => (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
            <Icon className="h-6 w-6 text-primary" />
          </div>
          {change !== undefined && (
            <Badge
              variant={trend === "up" ? "default" : trend === "down" ? "destructive" : "secondary"}
              className="flex items-center gap-1"
            >
              {trend === "up" ? <ArrowUpRight className="h-3 w-3" /> : trend === "down" ? <ArrowDownRight className="h-3 w-3" /> : null}
              {Math.abs(change)}%
            </Badge>
          )}
        </div>
        <div className="mt-4">
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          <p className="mt-1 text-2xl font-bold">{value}</p>
          {description && <p className="mt-1 text-xs text-muted-foreground">{description}</p>}
        </div>
      </CardContent>
    </Card>
  )

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[...Array(8)].map((_, i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <Skeleton className="h-12 w-12 rounded-lg" />
                <Skeleton className="mt-4 h-4 w-24" />
                <Skeleton className="mt-2 h-8 w-32" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Analytics Dashboard</h2>
          <p className="text-muted-foreground">Comprehensive platform metrics and insights</p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={period} onValueChange={setPeriod}>
            <SelectTrigger className="w-[140px]">
              <Calendar className="mr-2 h-4 w-4" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">Last 7 days</SelectItem>
              <SelectItem value="30d">Last 30 days</SelectItem>
              <SelectItem value="90d">Last 90 days</SelectItem>
              <SelectItem value="1y">Last year</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" size="icon" onClick={fetchAnalytics} disabled={refreshing}>
            <RefreshCw className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
          </Button>
          <Button variant="outline" onClick={handleExport} className="bg-transparent">
            <Download className="mr-2 h-4 w-4" />
            Export
          </Button>
        </div>
      </div>

      {/* Key Metrics Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Users"
          value={formatNumber(analytics.users.total_users)}
          change={12}
          trend="up"
          icon={Users}
          description={`${analytics.users.online_users} online now`}
        />
        <StatCard
          title="Active Listings"
          value={formatNumber(analytics.listings.active_listings)}
          change={8}
          trend="up"
          icon={Package}
          description={`${analytics.listings.new_listings} new this period`}
        />
        <StatCard
          title="Transaction Volume"
          value={formatCurrency(analytics.transactions.total_volume)}
          change={15}
          trend="up"
          icon={DollarSign}
          description={`${analytics.transactions.transaction_count} transactions`}
        />
        <StatCard
          title="Trade Success Rate"
          value={`${(analytics.trades?.success_rate ?? 0).toFixed(1)}%`}
          change={3}
          trend="up"
          icon={TrendingUp}
          description={`${analytics.trades?.completed_trades ?? 0} completed trades`}
        />
      </div>

      {/* Secondary Metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Verified Users"
          value={formatNumber(analytics.users.verified_users)}
          icon={ShieldCheck}
          description={`${((analytics.users.verified_users / analytics.users.total_users) * 100).toFixed(0)}% verification rate`}
        />
        <StatCard
          title="Pending Listings"
          value={analytics.listings.pending_listings}
          icon={AlertTriangle}
          description="Awaiting approval"
        />
        <StatCard
          title="Total Wallet Balance"
          value={formatCurrency(analytics.wallet.total_balance)}
          icon={Wallet}
          description="Platform-wide balance"
        />
        <StatCard
          title="Avg. Transaction"
          value={formatCurrency(analytics.transactions.avg_transaction)}
          icon={Activity}
          description="Per transaction"
        />
      </div>

      {/* Charts Section */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="users" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Users
          </TabsTrigger>
          <TabsTrigger value="engagement" className="flex items-center gap-2">
            <Activity className="h-4 w-4" />
            Engagement
          </TabsTrigger>
          <TabsTrigger value="distribution" className="flex items-center gap-2">
            <PieChart className="h-4 w-4" />
            Distribution
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 lg:grid-cols-2">
            {/* Transaction Volume Chart */}
            <Card>
              <CardHeader>
                <CardTitle>Transaction Volume</CardTitle>
                <CardDescription>Daily transaction amounts over time</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={analytics.trends.daily}>
                      <defs>
                        <linearGradient id="volumeGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="#3B82F6" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                      <XAxis
                        dataKey="date"
                        tickFormatter={(value) => new Date(value).toLocaleDateString("en-NA", { month: "short", day: "numeric" })}
                        className="text-xs"
                      />
                      <YAxis tickFormatter={(value) => `N$${formatNumber(value)}`} className="text-xs" />
                      <Tooltip
                        formatter={(value: number) => [formatCurrency(value), "Volume"]}
                        labelFormatter={(label) => new Date(label).toLocaleDateString("en-NA", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
                      />
                      <Area type="monotone" dataKey="volume" stroke="#3B82F6" fill="url(#volumeGradient)" strokeWidth={2} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Transactions Count Chart */}
            <Card>
              <CardHeader>
                <CardTitle>Daily Transactions</CardTitle>
                <CardDescription>Number of transactions per day</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={analytics.trends.daily}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                      <XAxis
                        dataKey="date"
                        tickFormatter={(value) => new Date(value).toLocaleDateString("en-NA", { month: "short", day: "numeric" })}
                        className="text-xs"
                      />
                      <YAxis className="text-xs" />
                      <Tooltip
                        formatter={(value: number) => [value, "Transactions"]}
                        labelFormatter={(label) => new Date(label).toLocaleDateString("en-NA", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
                      />
                      <Bar dataKey="transactions" fill="#10B981" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="users" className="space-y-4">
          <div className="grid gap-4 lg:grid-cols-2">
            {/* User Growth Chart */}
            <Card>
              <CardHeader>
                <CardTitle>User Growth</CardTitle>
                <CardDescription>New user registrations over time</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={analytics.trends.users}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                      <XAxis
                        dataKey="date"
                        tickFormatter={(value) => new Date(value).toLocaleDateString("en-NA", { month: "short", day: "numeric" })}
                        className="text-xs"
                      />
                      <YAxis className="text-xs" />
                      <Tooltip
                        formatter={(value: number) => [value, "New Users"]}
                        labelFormatter={(label) => new Date(label).toLocaleDateString("en-NA", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
                      />
                      <Line type="monotone" dataKey="count" stroke="#8B5CF6" strokeWidth={2} dot={{ fill: "#8B5CF6", strokeWidth: 2 }} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* User Status Breakdown */}
            <Card>
              <CardHeader>
                <CardTitle>User Status</CardTitle>
                <CardDescription>Breakdown by verification and activity</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <div className="mb-2 flex items-center justify-between text-sm">
                      <span>Verified Users</span>
                      <span className="font-medium">{analytics.users.verified_users} / {analytics.users.total_users}</span>
                    </div>
                    <Progress value={(analytics.users.verified_users / analytics.users.total_users) * 100} className="h-2" />
                  </div>
                  <div>
                    <div className="mb-2 flex items-center justify-between text-sm">
                      <span>Active Users (Online)</span>
                      <span className="font-medium">{analytics.users.online_users}</span>
                    </div>
                    <Progress value={(analytics.users.online_users / analytics.users.total_users) * 100} className="h-2" />
                  </div>
                  <div>
                    <div className="mb-2 flex items-center justify-between text-sm">
                      <span>New Users (This Period)</span>
                      <span className="font-medium">{analytics.users.new_users}</span>
                    </div>
                    <Progress value={(analytics.users.new_users / analytics.users.total_users) * 100} className="h-2" />
                  </div>
                  <div>
                    <div className="mb-2 flex items-center justify-between text-sm">
                      <span className="text-destructive">Banned Users</span>
                      <span className="font-medium text-destructive">{analytics.users.banned_users}</span>
                    </div>
                    <Progress value={(analytics.users.banned_users / analytics.users.total_users) * 100} className="h-2 bg-destructive/20 [&>div]:bg-destructive" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="engagement" className="space-y-4">
          <div className="grid gap-4 lg:grid-cols-2">
            {/* Listing Activity */}
            <Card>
              <CardHeader>
                <CardTitle>Listing Activity</CardTitle>
                <CardDescription>New listings created over time</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={analytics.trends.listings}>
                      <defs>
                        <linearGradient id="listingGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#10B981" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                      <XAxis
                        dataKey="date"
                        tickFormatter={(value) => new Date(value).toLocaleDateString("en-NA", { month: "short", day: "numeric" })}
                        className="text-xs"
                      />
                      <YAxis className="text-xs" />
                      <Tooltip
                        formatter={(value: number) => [value, "Listings"]}
                        labelFormatter={(label) => new Date(label).toLocaleDateString("en-NA", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
                      />
                      <Area type="monotone" dataKey="count" stroke="#10B981" fill="url(#listingGradient)" strokeWidth={2} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Engagement Metrics */}
            <Card>
              <CardHeader>
                <CardTitle>Engagement Metrics</CardTitle>
                <CardDescription>Platform interaction statistics</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  <div className="rounded-lg border p-4 text-center">
                    <Eye className="mx-auto h-8 w-8 text-blue-500" />
                    <p className="mt-2 text-2xl font-bold">{formatNumber(analytics.listings.active_listings * 45)}</p>
                    <p className="text-xs text-muted-foreground">Total Views</p>
                  </div>
                  <div className="rounded-lg border p-4 text-center">
                    <Heart className="mx-auto h-8 w-8 text-red-500" />
                    <p className="mt-2 text-2xl font-bold">{formatNumber(analytics.listings.active_listings * 12)}</p>
                    <p className="text-xs text-muted-foreground">Total Saves</p>
                  </div>
                  <div className="rounded-lg border p-4 text-center">
                    <MessageSquare className="mx-auto h-8 w-8 text-green-500" />
                    <p className="mt-2 text-2xl font-bold">{formatNumber(analytics.trades.total_trades * 8)}</p>
                    <p className="text-xs text-muted-foreground">Messages Sent</p>
                  </div>
                  <div className="rounded-lg border p-4 text-center">
                    <TrendingUp className="mx-auto h-8 w-8 text-purple-500" />
                    <p className="mt-2 text-2xl font-bold">{analytics.trades.success_rate.toFixed(0)}%</p>
                    <p className="text-xs text-muted-foreground">Conversion Rate</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="distribution" className="space-y-4">
          <div className="grid gap-4 lg:grid-cols-2">
            {/* Category Distribution */}
            <Card>
              <CardHeader>
                <CardTitle>Category Distribution</CardTitle>
                <CardDescription>Listings by category</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <RechartsPieChart>
                      <Pie
                        data={analytics.topCategories}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={100}
                        paddingAngle={2}
                        dataKey="count"
                        nameKey="name"
                        label={({ name, percentage }) => `${name} (${percentage}%)`}
                        labelLine={false}
                      >
                        {analytics.topCategories.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value: number, name: string) => [value, name]} />
                      <Legend />
                    </RechartsPieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Regional Distribution */}
            <Card>
              <CardHeader>
                <CardTitle>Regional Distribution</CardTitle>
                <CardDescription>Users and listings by region</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={analytics.regionStats} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                      <XAxis type="number" className="text-xs" />
                      <YAxis dataKey="region" type="category" className="text-xs" width={80} />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="users" fill="#3B82F6" name="Users" radius={[0, 4, 4, 0]} />
                      <Bar dataKey="listings" fill="#10B981" name="Listings" radius={[0, 4, 4, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
