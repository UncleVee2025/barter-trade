"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import useSWR from "swr"
import {
  Flag,
  AlertTriangle,
  User,
  Package,
  MessageSquare,
  CheckCircle2,
  XCircle,
  Clock,
  Eye,
  MoreHorizontal,
  RefreshCw,
  Filter,
  Search,
  ChevronDown,
  Ban,
  Trash2,
  Shield,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { Skeleton } from "@/components/ui/skeleton"
import { cn } from "@/lib/utils"

interface Report {
  id: string
  listingId: string
  listingTitle: string
  listingStatus: string
  reason: string
  description: string | null
  status: string
  adminNotes: string | null
  createdAt: string
  updatedAt: string
  reporter: {
    id: string
    name: string
    email: string
  }
  listingOwner: {
    name: string
    email: string
  }
}

interface ReportsResponse {
  reports: Report[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
    hasMore: boolean
  }
}

const fetcher = (url: string) => fetch(url).then((res) => res.json())

const statusFilters = [
  { value: "all", label: "All Reports" },
  { value: "pending", label: "Pending Review" },
  { value: "reviewed", label: "Under Review" },
  { value: "resolved", label: "Resolved" },
  { value: "dismissed", label: "Dismissed" },
]

const reasonLabels: Record<string, { label: string; color: string }> = {
  spam: { label: "Spam", color: "bg-yellow-500/10 text-yellow-500" },
  fraud: { label: "Fraud", color: "bg-red-500/10 text-red-500" },
  inappropriate: { label: "Inappropriate", color: "bg-orange-500/10 text-orange-500" },
  counterfeit: { label: "Counterfeit", color: "bg-purple-500/10 text-purple-500" },
  wrong_category: { label: "Wrong Category", color: "bg-blue-500/10 text-blue-500" },
  other: { label: "Other", color: "bg-muted text-muted-foreground" },
}

const statusColors: Record<string, string> = {
  pending: "bg-yellow-500/10 text-yellow-500",
  reviewed: "bg-blue-500/10 text-blue-500",
  resolved: "bg-green-500/10 text-green-500",
  dismissed: "bg-muted text-muted-foreground",
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffHours = Math.floor(diffMs / 3600000)
  const diffDays = Math.floor(diffMs / 86400000)

  if (diffHours < 1) return "Just now"
  if (diffHours < 24) return `${diffHours}h ago`
  if (diffDays === 1) return "Yesterday"
  if (diffDays < 7) return `${diffDays}d ago`
  
  return date.toLocaleDateString("en-NA", { month: "short", day: "numeric" })
}

export function AdminReports() {
  const [statusFilter, setStatusFilter] = useState("pending")
  const [searchQuery, setSearchQuery] = useState("")
  const [page, setPage] = useState(1)
  const [selectedReport, setSelectedReport] = useState<Report | null>(null)
  const [isActionDialogOpen, setIsActionDialogOpen] = useState(false)
  const [actionType, setActionType] = useState<"resolve" | "dismiss" | "flag" | "delete">("resolve")
  const [adminNotes, setAdminNotes] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Build API URL
  const buildApiUrl = () => {
    const params = new URLSearchParams()
    params.set("page", page.toString())
    params.set("limit", "20")
    if (statusFilter !== "all") params.set("status", statusFilter)
    return `/api/admin/reports?${params.toString()}`
  }

  const { data, error, isLoading, mutate } = useSWR<ReportsResponse>(
    buildApiUrl(),
    fetcher,
    { revalidateOnFocus: false }
  )

  const reports = data?.reports || []
  const pagination = data?.pagination

  const handleAction = async () => {
    if (!selectedReport) return

    setIsSubmitting(true)
    try {
      const response = await fetch("/api/admin/reports", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          reportId: selectedReport.id,
          status: actionType === "dismiss" ? "dismissed" : "resolved",
          adminNotes,
          action: actionType === "flag" ? "flag" : actionType === "delete" ? "delete" : undefined,
        }),
      })

      if (response.ok) {
        mutate()
        setIsActionDialogOpen(false)
        setSelectedReport(null)
        setAdminNotes("")
      }
    } catch (error) {
      console.error("Failed to update report:", error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const openActionDialog = (report: Report, action: typeof actionType) => {
    setSelectedReport(report)
    setActionType(action)
    setAdminNotes("")
    setIsActionDialogOpen(true)
  }

  // Stats
  const pendingCount = reports.filter((r) => r.status === "pending").length
  const resolvedCount = reports.filter((r) => r.status === "resolved").length

  return (
    <div className="min-h-screen pb-24">
      {/* Header */}
      <div className="mb-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col md:flex-row md:items-center md:justify-between gap-4"
        >
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-foreground">
              <span className="text-gradient">Reports</span> Dashboard
            </h1>
            <p className="text-muted-foreground mt-1">
              Review and manage reported listings and users
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            className="rounded-xl bg-transparent"
            onClick={() => mutate()}
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
        </motion.div>
      </div>

      {/* Stats Cards */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6"
      >
        <Card className="cursor-pointer hover:border-yellow-500/50 transition-colors" onClick={() => setStatusFilter("pending")}>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-yellow-500/10 flex items-center justify-center">
                <Clock className="w-5 h-5 text-yellow-500" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{pagination?.total || 0}</p>
                <p className="text-xs text-muted-foreground">Pending</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-red-500/10 flex items-center justify-center">
                <AlertTriangle className="w-5 h-5 text-red-500" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">
                  {reports.filter((r) => r.reason === "fraud").length}
                </p>
                <p className="text-xs text-muted-foreground">Fraud Reports</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-green-500/10 flex items-center justify-center">
                <CheckCircle2 className="w-5 h-5 text-green-500" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{resolvedCount}</p>
                <p className="text-xs text-muted-foreground">Resolved</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center">
                <Flag className="w-5 h-5 text-muted-foreground" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">
                  {reports.filter((r) => r.listingStatus === "flagged").length}
                </p>
                <p className="text-xs text-muted-foreground">Flagged Items</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Filters */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="glass rounded-2xl p-4 mb-6"
      >
        <div className="flex flex-col md:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by listing title or reporter..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 h-11 bg-background/50 border-border/50 rounded-xl"
            />
          </div>

          <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setPage(1); }}>
            <SelectTrigger className="w-full md:w-48 h-11 bg-background/50 border-border/50 rounded-xl">
              <Filter className="w-4 h-4 mr-2 text-muted-foreground" />
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              {statusFilters.map((status) => (
                <SelectItem key={status.value} value={status.value}>
                  {status.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </motion.div>

      {/* Reports List */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg font-semibold flex items-center gap-2">
              <Flag className="w-5 h-5 text-primary" />
              Reports
              {pagination && (
                <span className="text-sm font-normal text-muted-foreground">
                  ({pagination.total} total)
                </span>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {isLoading ? (
              <div className="p-6 space-y-4">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="flex items-center gap-4">
                    <Skeleton className="w-10 h-10 rounded-xl" />
                    <div className="flex-1 space-y-2">
                      <Skeleton className="h-4 w-48" />
                      <Skeleton className="h-3 w-32" />
                    </div>
                    <Skeleton className="h-8 w-20" />
                  </div>
                ))}
              </div>
            ) : error ? (
              <div className="p-12 text-center">
                <XCircle className="w-12 h-12 text-destructive mx-auto mb-4" />
                <p className="text-muted-foreground">Failed to load reports</p>
                <Button variant="outline" size="sm" className="mt-4 bg-transparent" onClick={() => mutate()}>
                  Try Again
                </Button>
              </div>
            ) : reports.length === 0 ? (
              <div className="p-12 text-center">
                <CheckCircle2 className="w-12 h-12 text-green-500 mx-auto mb-4" />
                <p className="text-lg font-medium text-foreground mb-1">No pending reports</p>
                <p className="text-muted-foreground">
                  All reports have been reviewed. Great job!
                </p>
              </div>
            ) : (
              <div className="divide-y divide-border">
                <AnimatePresence>
                  {reports
                    .filter((r) => 
                      !searchQuery || 
                      r.listingTitle?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                      r.reporter.name?.toLowerCase().includes(searchQuery.toLowerCase())
                    )
                    .map((report, index) => (
                    <motion.div
                      key={report.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="p-4 hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex items-start gap-4">
                        <div className="w-10 h-10 rounded-xl bg-red-500/10 flex items-center justify-center flex-shrink-0">
                          <AlertTriangle className="w-5 h-5 text-red-500" />
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap mb-1">
                            <h3 className="font-medium text-foreground truncate">
                              {report.listingTitle || "Unknown Listing"}
                            </h3>
                            <Badge className={cn("text-xs", reasonLabels[report.reason]?.color || "bg-muted")}>
                              {reasonLabels[report.reason]?.label || report.reason}
                            </Badge>
                            <Badge className={cn("text-xs", statusColors[report.status])}>
                              {report.status}
                            </Badge>
                          </div>
                          
                          <p className="text-sm text-muted-foreground line-clamp-2 mb-2">
                            {report.description || "No additional details provided"}
                          </p>
                          
                          <div className="flex items-center gap-4 text-xs text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <User className="w-3 h-3" />
                              Reported by: {report.reporter.name}
                            </span>
                            <span className="flex items-center gap-1">
                              <Package className="w-3 h-3" />
                              Owner: {report.listingOwner.name}
                            </span>
                            <span>{formatDate(report.createdAt)}</span>
                          </div>
                        </div>

                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreHorizontal className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => window.open(`/dashboard/listings/${report.listingId}`, "_blank")}>
                              <Eye className="w-4 h-4 mr-2" />
                              View Listing
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => openActionDialog(report, "resolve")}>
                              <CheckCircle2 className="w-4 h-4 mr-2" />
                              Mark Resolved
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => openActionDialog(report, "flag")}>
                              <Flag className="w-4 h-4 mr-2" />
                              Flag Listing
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              onClick={() => openActionDialog(report, "delete")}
                              className="text-red-500"
                            >
                              <Trash2 className="w-4 h-4 mr-2" />
                              Delete Listing
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => openActionDialog(report, "dismiss")}>
                              <XCircle className="w-4 h-4 mr-2" />
                              Dismiss Report
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            )}

            {/* Pagination */}
            {pagination && pagination.totalPages > 1 && (
              <div className="p-4 border-t border-border flex items-center justify-between">
                <p className="text-sm text-muted-foreground">
                  Page {pagination.page} of {pagination.totalPages}
                </p>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="bg-transparent"
                    disabled={pagination.page === 1}
                    onClick={() => setPage((p) => p - 1)}
                  >
                    Previous
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="bg-transparent"
                    disabled={!pagination.hasMore}
                    onClick={() => setPage((p) => p + 1)}
                  >
                    Next
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* Action Dialog */}
      <Dialog open={isActionDialogOpen} onOpenChange={setIsActionDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {actionType === "resolve" && <CheckCircle2 className="w-5 h-5 text-green-500" />}
              {actionType === "dismiss" && <XCircle className="w-5 h-5 text-muted-foreground" />}
              {actionType === "flag" && <Flag className="w-5 h-5 text-yellow-500" />}
              {actionType === "delete" && <Trash2 className="w-5 h-5 text-red-500" />}
              {actionType === "resolve" && "Mark as Resolved"}
              {actionType === "dismiss" && "Dismiss Report"}
              {actionType === "flag" && "Flag Listing"}
              {actionType === "delete" && "Delete Listing"}
            </DialogTitle>
            <DialogDescription>
              {actionType === "resolve" && "Mark this report as resolved after taking appropriate action."}
              {actionType === "dismiss" && "Dismiss this report if it's invalid or doesn't violate policies."}
              {actionType === "flag" && "Flag this listing for policy violation. The listing will be hidden from search."}
              {actionType === "delete" && "Permanently delete this listing. This action cannot be undone."}
            </DialogDescription>
          </DialogHeader>

          {selectedReport && (
            <div className="py-4">
              <div className="p-3 rounded-xl bg-muted/50 mb-4">
                <p className="text-sm font-medium text-foreground mb-1">{selectedReport.listingTitle}</p>
                <p className="text-xs text-muted-foreground">
                  Reported for: {reasonLabels[selectedReport.reason]?.label || selectedReport.reason}
                </p>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Admin Notes</label>
                <Textarea
                  placeholder="Add notes about this action (optional)"
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  className="resize-none"
                  rows={3}
                />
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsActionDialogOpen(false)} className="bg-transparent">
              Cancel
            </Button>
            <Button
              onClick={handleAction}
              disabled={isSubmitting}
              className={cn(
                actionType === "delete" && "bg-red-500 hover:bg-red-600",
                actionType === "flag" && "bg-yellow-500 hover:bg-yellow-600",
              )}
            >
              {isSubmitting ? "Processing..." : "Confirm"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
