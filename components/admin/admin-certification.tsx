"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import useSWR from "swr"
import {
  Search,
  Shield,
  ShieldCheck,
  ShieldX,
  Award,
  ChevronLeft,
  ChevronRight,
  MoreVertical,
  Eye,
  CheckCircle,
  XCircle,
  Loader2,
  RefreshCw,
  TrendingUp,
  Users,
  Star,
  ArrowUpCircle
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { cn } from "@/lib/utils"
import { useNotifications } from "@/contexts/notification-context"

interface CertifiedUser {
  id: number
  full_name: string
  email: string
  phone: string | null
  location: string | null
  avatar_url: string | null
  is_certified: boolean
  certification_date: string | null
  certification_badge_type: 'bronze' | 'silver' | 'gold' | 'platinum' | null
  certification_id: string | null
  total_trades: number
  rating: number
  created_at: string
  email_verified: boolean
  phone_verified: boolean
  id_verified: boolean
  completed_trades_count: number
}

interface CertificationResponse {
  users: CertifiedUser[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
  stats: {
    certified: number
    uncertified: number
    byBadge: {
      platinum: number
      gold: number
      silver: number
      bronze: number
    }
  }
}

const fetcher = (url: string) => fetch(url).then((res) => res.json())

const badgeConfig = {
  bronze: {
    bg: "bg-amber-700",
    text: "text-white",
    border: "border-amber-600",
    label: "Bronze"
  },
  silver: {
    bg: "bg-slate-400",
    text: "text-white",
    border: "border-slate-300",
    label: "Silver"
  },
  gold: {
    bg: "bg-yellow-500",
    text: "text-yellow-900",
    border: "border-yellow-400",
    label: "Gold"
  },
  platinum: {
    bg: "bg-gradient-to-r from-slate-300 to-slate-500",
    text: "text-white",
    border: "border-slate-300",
    label: "Platinum"
  }
}

export function AdminCertification() {
  const [search, setSearch] = useState("")
  const [filter, setFilter] = useState("all")
  const [page, setPage] = useState(1)
  const [selectedUser, setSelectedUser] = useState<CertifiedUser | null>(null)
  const [isViewModalOpen, setIsViewModalOpen] = useState(false)
  const [isCertifyDialogOpen, setIsCertifyDialogOpen] = useState(false)
  const [isRevokeDialogOpen, setIsRevokeDialogOpen] = useState(false)
  const [isUpgradeModalOpen, setIsUpgradeModalOpen] = useState(false)
  const [certifyBadge, setCertifyBadge] = useState<string>("bronze")
  const [certifyNotes, setCertifyNotes] = useState("")
  const [isProcessing, setIsProcessing] = useState(false)
  const { showToast } = useNotifications()

  const buildApiUrl = () => {
    const params = new URLSearchParams()
    params.set("page", page.toString())
    params.set("limit", "20")
    params.set("filter", filter)
    if (search) params.set("search", search)
    return `/api/admin/certification?${params.toString()}`
  }

  const { data, error, isLoading, mutate } = useSWR<CertificationResponse>(
    buildApiUrl(),
    fetcher,
    { refreshInterval: 30000 }
  )

  const users = data?.users || []
  const pagination = data?.pagination || { page: 1, limit: 20, total: 0, totalPages: 1 }
  const stats = data?.stats || { certified: 0, uncertified: 0, byBadge: { platinum: 0, gold: 0, silver: 0, bronze: 0 } }

  const handleCertify = async () => {
    if (!selectedUser) return

    setIsProcessing(true)
    try {
      const response = await fetch("/api/admin/certification", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: selectedUser.id,
          action: "certify",
          badgeType: certifyBadge,
          notes: certifyNotes
        })
      })

      const result = await response.json()
      if (!response.ok) throw new Error(result.error)

      showToast({
        type: "success",
        title: "User Certified",
        message: `${selectedUser.full_name} is now a certified ${certifyBadge} trader`,
        duration: 4000
      })
      setIsCertifyDialogOpen(false)
      setCertifyNotes("")
      setCertifyBadge("bronze")
      mutate()
    } catch (error) {
      showToast({
        type: "error",
        title: "Certification Failed",
        message: error instanceof Error ? error.message : "Failed to certify user",
        duration: 5000
      })
    } finally {
      setIsProcessing(false)
    }
  }

  const handleRevoke = async () => {
    if (!selectedUser) return

    setIsProcessing(true)
    try {
      const response = await fetch("/api/admin/certification", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: selectedUser.id,
          action: "revoke",
          notes: certifyNotes
        })
      })

      const result = await response.json()
      if (!response.ok) throw new Error(result.error)

      showToast({
        type: "success",
        title: "Certification Revoked",
        message: `Certification has been revoked for ${selectedUser.full_name}`,
        duration: 4000
      })
      setIsRevokeDialogOpen(false)
      setCertifyNotes("")
      mutate()
    } catch (error) {
      showToast({
        type: "error",
        title: "Revocation Failed",
        message: error instanceof Error ? error.message : "Failed to revoke certification",
        duration: 5000
      })
    } finally {
      setIsProcessing(false)
    }
  }

  const handleUpgrade = async () => {
    if (!selectedUser) return

    setIsProcessing(true)
    try {
      const response = await fetch("/api/admin/certification", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: selectedUser.id,
          action: "upgrade",
          badgeType: certifyBadge,
          notes: certifyNotes
        })
      })

      const result = await response.json()
      if (!response.ok) throw new Error(result.error)

      showToast({
        type: "success",
        title: "Badge Upgraded",
        message: `${selectedUser.full_name}'s badge upgraded to ${certifyBadge}`,
        duration: 4000
      })
      setIsUpgradeModalOpen(false)
      setCertifyNotes("")
      mutate()
    } catch (error) {
      showToast({
        type: "error",
        title: "Upgrade Failed",
        message: error instanceof Error ? error.message : "Failed to upgrade badge",
        duration: 5000
      })
    } finally {
      setIsProcessing(false)
    }
  }

  const openCertifyDialog = (user: CertifiedUser) => {
    setSelectedUser(user)
    setCertifyBadge("bronze")
    setCertifyNotes("")
    setIsCertifyDialogOpen(true)
  }

  const openRevokeDialog = (user: CertifiedUser) => {
    setSelectedUser(user)
    setCertifyNotes("")
    setIsRevokeDialogOpen(true)
  }

  const openUpgradeModal = (user: CertifiedUser) => {
    setSelectedUser(user)
    setCertifyBadge(user.certification_badge_type || "silver")
    setCertifyNotes("")
    setIsUpgradeModalOpen(true)
  }

  const openViewModal = (user: CertifiedUser) => {
    setSelectedUser(user)
    setIsViewModalOpen(true)
  }

  const isEligible = (user: CertifiedUser) => {
    return user.completed_trades_count >= 10 && user.email_verified && user.phone_verified
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Trader Certification</h1>
          <p className="text-muted-foreground">
            Manage certified traders and badge levels
          </p>
        </div>
        <Button variant="outline" className="rounded-xl bg-transparent" onClick={() => mutate()}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-6 gap-4">
        <Card className="bg-card border-border">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-green-500" />
              <span className="text-2xl font-bold text-green-500">{stats.certified}</span>
            </div>
            <p className="text-sm text-muted-foreground">Certified</p>
          </CardContent>
        </Card>
        <Card className="bg-card border-border">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-muted-foreground" />
              <span className="text-2xl font-bold text-foreground">{stats.uncertified}</span>
            </div>
            <p className="text-sm text-muted-foreground">Uncertified</p>
          </CardContent>
        </Card>
        <Card className="bg-card border-border">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Award className="h-5 w-5 text-slate-400" />
              <span className="text-2xl font-bold text-slate-400">{stats.byBadge.platinum}</span>
            </div>
            <p className="text-sm text-muted-foreground">Platinum</p>
          </CardContent>
        </Card>
        <Card className="bg-card border-border">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Award className="h-5 w-5 text-yellow-500" />
              <span className="text-2xl font-bold text-yellow-500">{stats.byBadge.gold}</span>
            </div>
            <p className="text-sm text-muted-foreground">Gold</p>
          </CardContent>
        </Card>
        <Card className="bg-card border-border">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Award className="h-5 w-5 text-slate-400" />
              <span className="text-2xl font-bold text-slate-400">{stats.byBadge.silver}</span>
            </div>
            <p className="text-sm text-muted-foreground">Silver</p>
          </CardContent>
        </Card>
        <Card className="bg-card border-border">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Award className="h-5 w-5 text-amber-700" />
              <span className="text-2xl font-bold text-amber-700">{stats.byBadge.bronze}</span>
            </div>
            <p className="text-sm text-muted-foreground">Bronze</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-col lg:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by name or email..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1) }}
            className="pl-10 bg-muted border-0 rounded-xl"
          />
        </div>
        <Select value={filter} onValueChange={(v) => { setFilter(v); setPage(1) }}>
          <SelectTrigger className="w-full lg:w-44 bg-muted border-0 rounded-xl">
            <SelectValue placeholder="Filter" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Users</SelectItem>
            <SelectItem value="certified">Certified Only</SelectItem>
            <SelectItem value="eligible">Eligible (Uncertified)</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <div className="bg-card rounded-xl border border-border overflow-hidden">
        {isLoading ? (
          <div className="p-6 space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex items-center gap-4">
                <Skeleton className="h-10 w-10 rounded-full" />
                <div className="space-y-2 flex-1">
                  <Skeleton className="h-4 w-48" />
                  <Skeleton className="h-3 w-32" />
                </div>
                <Skeleton className="h-6 w-20" />
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="p-12 text-center">
            <XCircle className="w-12 h-12 text-destructive mx-auto mb-4" />
            <p className="text-muted-foreground">Failed to load certification data</p>
            <Button variant="outline" size="sm" className="mt-4 bg-transparent" onClick={() => mutate()}>
              Try Again
            </Button>
          </div>
        ) : users.length === 0 ? (
          <div className="p-12 text-center">
            <Shield className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-lg font-medium text-foreground mb-1">No users found</p>
            <p className="text-muted-foreground">Try adjusting your search or filters</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border bg-muted/50">
                    <th className="text-left p-4 font-medium text-muted-foreground">User</th>
                    <th className="text-left p-4 font-medium text-muted-foreground">Status</th>
                    <th className="text-left p-4 font-medium text-muted-foreground">Badge</th>
                    <th className="text-left p-4 font-medium text-muted-foreground">Trades</th>
                    <th className="text-left p-4 font-medium text-muted-foreground">Rating</th>
                    <th className="text-left p-4 font-medium text-muted-foreground">Verified</th>
                    <th className="text-left p-4 font-medium text-muted-foreground">Cert. Date</th>
                    <th className="text-left p-4 font-medium text-muted-foreground"></th>
                  </tr>
                </thead>
                <tbody>
                  <AnimatePresence>
                    {users.map((user, i) => (
                      <motion.tr
                        key={user.id}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: i * 0.03 }}
                        className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors"
                      >
                        <td className="p-4">
                          <div className="flex items-center gap-3">
                            <Avatar className="h-10 w-10">
                              <AvatarImage src={user.avatar_url || undefined} alt={user.full_name} />
                              <AvatarFallback className="bg-primary/10 text-primary">
                                {user.full_name.split(" ").map((n) => n[0]).join("").toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="font-medium text-foreground">{user.full_name}</p>
                              <p className="text-sm text-muted-foreground">{user.email}</p>
                            </div>
                          </div>
                        </td>
                        <td className="p-4">
                          {user.is_certified ? (
                            <Badge className="bg-green-500/10 text-green-500 border-green-500/20 gap-1">
                              <ShieldCheck className="h-3 w-3" />
                              Certified
                            </Badge>
                          ) : isEligible(user) ? (
                            <Badge className="bg-yellow-500/10 text-yellow-600 border-yellow-500/20 gap-1">
                              <TrendingUp className="h-3 w-3" />
                              Eligible
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="text-muted-foreground gap-1">
                              <Shield className="h-3 w-3" />
                              Not Eligible
                            </Badge>
                          )}
                        </td>
                        <td className="p-4">
                          {user.is_certified && user.certification_badge_type ? (
                            <Badge className={cn(
                              "gap-1",
                              badgeConfig[user.certification_badge_type].bg,
                              badgeConfig[user.certification_badge_type].text
                            )}>
                              <Award className="h-3 w-3" />
                              {badgeConfig[user.certification_badge_type].label}
                            </Badge>
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </td>
                        <td className="p-4">
                          <span className="font-medium text-foreground">{user.completed_trades_count || user.total_trades || 0}</span>
                          <span className="text-muted-foreground text-sm"> / 10 min</span>
                        </td>
                        <td className="p-4">
                          {user.rating > 0 ? (
                            <div className="flex items-center gap-1">
                              <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                              <span className="font-medium">{user.rating.toFixed(1)}</span>
                            </div>
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </td>
                        <td className="p-4">
                          <div className="flex items-center gap-1">
                            {user.email_verified && (
                              <Badge variant="secondary" className="text-xs">Email</Badge>
                            )}
                            {user.phone_verified && (
                              <Badge variant="secondary" className="text-xs">Phone</Badge>
                            )}
                            {user.id_verified && (
                              <Badge variant="secondary" className="text-xs">ID</Badge>
                            )}
                            {!user.email_verified && !user.phone_verified && (
                              <span className="text-muted-foreground text-sm">None</span>
                            )}
                          </div>
                        </td>
                        <td className="p-4 text-muted-foreground text-sm">
                          {user.certification_date 
                            ? new Date(user.certification_date).toLocaleDateString()
                            : "-"
                          }
                        </td>
                        <td className="p-4">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon">
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => openViewModal(user)}>
                                <Eye className="h-4 w-4 mr-2" />
                                View Details
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              {!user.is_certified ? (
                                <DropdownMenuItem 
                                  onClick={() => openCertifyDialog(user)}
                                  className="text-green-500"
                                >
                                  <ShieldCheck className="h-4 w-4 mr-2" />
                                  Certify User
                                </DropdownMenuItem>
                              ) : (
                                <>
                                  <DropdownMenuItem onClick={() => openUpgradeModal(user)}>
                                    <ArrowUpCircle className="h-4 w-4 mr-2" />
                                    Upgrade Badge
                                  </DropdownMenuItem>
                                  <DropdownMenuItem 
                                    onClick={() => openRevokeDialog(user)}
                                    className="text-red-500"
                                  >
                                    <ShieldX className="h-4 w-4 mr-2" />
                                    Revoke Certification
                                  </DropdownMenuItem>
                                </>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </td>
                      </motion.tr>
                    ))}
                  </AnimatePresence>
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className="flex items-center justify-between p-4 border-t border-border">
              <p className="text-sm text-muted-foreground">
                Showing {(page - 1) * 20 + 1}-{Math.min(page * 20, pagination.total)} of {pagination.total} users
              </p>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8 bg-transparent"
                  onClick={() => setPage(Math.max(1, page - 1))}
                  disabled={page === 1}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <span className="text-sm text-muted-foreground px-2">
                  Page {page} of {pagination.totalPages}
                </span>
                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8 bg-transparent"
                  onClick={() => setPage(Math.min(pagination.totalPages, page + 1))}
                  disabled={page === pagination.totalPages}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </>
        )}
      </div>

      {/* View User Modal */}
      <Dialog open={isViewModalOpen} onOpenChange={setIsViewModalOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>User Certification Details</DialogTitle>
          </DialogHeader>
          {selectedUser && (
            <div className="space-y-4 mt-4">
              <div className="flex items-center gap-4">
                <Avatar className="h-16 w-16">
                  <AvatarImage src={selectedUser.avatar_url || undefined} alt={selectedUser.full_name} />
                  <AvatarFallback className="bg-primary/10 text-primary text-xl">
                    {selectedUser.full_name.split(" ").map((n) => n[0]).join("").toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="text-lg font-bold text-foreground">{selectedUser.full_name}</p>
                  <p className="text-muted-foreground">{selectedUser.email}</p>
                  {selectedUser.is_certified && selectedUser.certification_badge_type && (
                    <Badge className={cn(
                      "mt-2 gap-1",
                      badgeConfig[selectedUser.certification_badge_type].bg,
                      badgeConfig[selectedUser.certification_badge_type].text
                    )}>
                      <Award className="h-3 w-3" />
                      {badgeConfig[selectedUser.certification_badge_type].label} Trader
                    </Badge>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 pt-4 border-t border-border">
                <div>
                  <p className="text-sm text-muted-foreground">Certification ID</p>
                  <p className="font-mono text-sm text-foreground">{selectedUser.certification_id || "Not certified"}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Certified Since</p>
                  <p className="font-medium text-foreground">
                    {selectedUser.certification_date 
                      ? new Date(selectedUser.certification_date).toLocaleDateString()
                      : "N/A"
                    }
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Completed Trades</p>
                  <p className="font-medium text-foreground">{selectedUser.completed_trades_count || selectedUser.total_trades || 0}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Rating</p>
                  <div className="flex items-center gap-1">
                    <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                    <span className="font-medium">{selectedUser.rating > 0 ? selectedUser.rating.toFixed(1) : "No ratings"}</span>
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-border">
                <p className="text-sm text-muted-foreground mb-2">Verification Status</p>
                <div className="flex flex-wrap gap-2">
                  <Badge variant={selectedUser.email_verified ? "default" : "secondary"} className="gap-1">
                    {selectedUser.email_verified ? <CheckCircle className="h-3 w-3" /> : <XCircle className="h-3 w-3" />}
                    Email
                  </Badge>
                  <Badge variant={selectedUser.phone_verified ? "default" : "secondary"} className="gap-1">
                    {selectedUser.phone_verified ? <CheckCircle className="h-3 w-3" /> : <XCircle className="h-3 w-3" />}
                    Phone
                  </Badge>
                  <Badge variant={selectedUser.id_verified ? "default" : "secondary"} className="gap-1">
                    {selectedUser.id_verified ? <CheckCircle className="h-3 w-3" /> : <XCircle className="h-3 w-3" />}
                    ID Document
                  </Badge>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Certify User Dialog */}
      <AlertDialog open={isCertifyDialogOpen} onOpenChange={setIsCertifyDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Certify User</AlertDialogTitle>
            <AlertDialogDescription>
              Grant certification to {selectedUser?.full_name}. This will give them a verified trader badge.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="space-y-4 my-4">
            <div>
              <Label>Badge Level</Label>
              <Select value={certifyBadge} onValueChange={setCertifyBadge}>
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="bronze">Bronze (10+ trades)</SelectItem>
                  <SelectItem value="silver">Silver (25+ trades)</SelectItem>
                  <SelectItem value="gold">Gold (50+ trades)</SelectItem>
                  <SelectItem value="platinum">Platinum (100+ trades)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Notes (Optional)</Label>
              <Textarea
                value={certifyNotes}
                onChange={(e) => setCertifyNotes(e.target.value)}
                placeholder="Reason for certification..."
                className="mt-1"
              />
            </div>
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleCertify}
              disabled={isProcessing}
              className="bg-green-500 hover:bg-green-600"
            >
              {isProcessing ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <ShieldCheck className="h-4 w-4 mr-2" />}
              Certify User
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Revoke Certification Dialog */}
      <AlertDialog open={isRevokeDialogOpen} onOpenChange={setIsRevokeDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Revoke Certification</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to revoke certification for {selectedUser?.full_name}? This action can be reversed later.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="my-4">
            <Label>Reason (Optional)</Label>
            <Textarea
              value={certifyNotes}
              onChange={(e) => setCertifyNotes(e.target.value)}
              placeholder="Reason for revoking certification..."
              className="mt-1"
            />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleRevoke}
              disabled={isProcessing}
              className="bg-red-500 hover:bg-red-600"
            >
              {isProcessing ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <ShieldX className="h-4 w-4 mr-2" />}
              Revoke Certification
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Upgrade Badge Modal */}
      <Dialog open={isUpgradeModalOpen} onOpenChange={setIsUpgradeModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Upgrade Badge Level</DialogTitle>
            <DialogDescription>
              Change badge level for {selectedUser?.full_name}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <div>
              <Label>Current Badge</Label>
              <p className="mt-1 font-medium capitalize">{selectedUser?.certification_badge_type || "None"}</p>
            </div>
            <div>
              <Label>New Badge Level</Label>
              <Select value={certifyBadge} onValueChange={setCertifyBadge}>
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="bronze">Bronze</SelectItem>
                  <SelectItem value="silver">Silver</SelectItem>
                  <SelectItem value="gold">Gold</SelectItem>
                  <SelectItem value="platinum">Platinum</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Notes (Optional)</Label>
              <Textarea
                value={certifyNotes}
                onChange={(e) => setCertifyNotes(e.target.value)}
                placeholder="Reason for upgrade..."
                className="mt-1"
              />
            </div>
          </div>
          <DialogFooter className="mt-6">
            <Button variant="outline" onClick={() => setIsUpgradeModalOpen(false)} className="bg-transparent">
              Cancel
            </Button>
            <Button onClick={handleUpgrade} disabled={isProcessing}>
              {isProcessing ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <ArrowUpCircle className="h-4 w-4 mr-2" />}
              Upgrade Badge
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
