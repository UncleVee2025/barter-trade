"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import useSWR from "swr"
import {
  Search,
  Filter,
  Download,
  RefreshCw,
  XCircle,
  ArrowUpRight,
  ArrowDownRight,
  ChevronLeft,
  ChevronRight,
  Wallet,
  DollarSign,
  TrendingUp,
  Clock,
  CheckCircle,
  AlertTriangle,
  Eye,
  Plus,
  Loader2,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { cn } from "@/lib/utils"
import { useNotifications } from "@/contexts/notification-context"

interface Transaction {
  id: string
  userId: string
  userName: string
  userEmail: string | null
  type: "topup" | "transfer_in" | "transfer_out" | "listing_fee" | "voucher" | "trade" | "refund"
  amount: number
  fee: number
  balanceAfter: number
  status: "pending" | "completed" | "failed" | "refunded"
  reference: string | null
  description: string | null
  relatedUserId: string | null
  relatedUserName: string | null
  createdAt: string
}

interface TransactionsResponse {
  transactions: Transaction[]
  stats: {
    total: number
    totalVolume: number
    totalFees: number
    pending: number
    completed: number
    failed: number
  }
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
    hasMore: boolean
  }
}

const fetcher = (url: string) => fetch(url).then((res) => res.json())

const typeLabels: Record<string, string> = {
  topup: "Top-up",
  transfer_in: "Transfer In",
  transfer_out: "Transfer Out",
  listing_fee: "Listing Fee",
  voucher: "Voucher",
  trade: "Trade",
  refund: "Refund",
}

const typeColors: Record<string, string> = {
  topup: "bg-green-500/10 text-green-500 border-green-500/20",
  transfer_in: "bg-blue-500/10 text-blue-500 border-blue-500/20",
  transfer_out: "bg-orange-500/10 text-orange-500 border-orange-500/20",
  listing_fee: "bg-purple-500/10 text-purple-500 border-purple-500/20",
  voucher: "bg-gold/10 text-gold border-gold/20",
  trade: "bg-cyan-500/10 text-cyan-500 border-cyan-500/20",
  refund: "bg-pink-500/10 text-pink-500 border-pink-500/20",
}

const statusColors: Record<string, string> = {
  pending: "bg-yellow-500/10 text-yellow-500 border-yellow-500/20",
  completed: "bg-green-500/10 text-green-500 border-green-500/20",
  failed: "bg-red-500/10 text-red-500 border-red-500/20",
  refunded: "bg-blue-500/10 text-blue-500 border-blue-500/20",
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr)
  return date.toLocaleDateString("en-NA", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })
}

export function AdminTransactions() {
  const [search, setSearch] = useState("")
  const [typeFilter, setTypeFilter] = useState("all")
  const [statusFilter, setStatusFilter] = useState("all")
  const [page, setPage] = useState(1)
  const [selectedTx, setSelectedTx] = useState<Transaction | null>(null)
  const [isViewModalOpen, setIsViewModalOpen] = useState(false)
  const [isManualTxOpen, setIsManualTxOpen] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const { showToast } = useNotifications()

  const [manualTxForm, setManualTxForm] = useState({
    userId: "",
    type: "topup",
    amount: "",
    description: "",
  })

  const buildApiUrl = () => {
    const params = new URLSearchParams()
    params.set("page", page.toString())
    params.set("limit", "50")
    if (search) params.set("search", search)
    if (typeFilter !== "all") params.set("type", typeFilter)
    if (statusFilter !== "all") params.set("status", statusFilter)
    return `/api/admin/transactions?${params.toString()}`
  }

  const { data, error, isLoading, mutate } = useSWR<TransactionsResponse>(
    buildApiUrl(),
    fetcher,
    { refreshInterval: 15000 }
  )

  const transactions = data?.transactions || []
  const stats = data?.stats || { total: 0, totalVolume: 0, totalFees: 0, pending: 0, completed: 0, failed: 0 }
  const pagination = data?.pagination || { page: 1, limit: 50, total: 0, totalPages: 1, hasMore: false }

  const handleManualTransaction = async () => {
    if (!manualTxForm.userId || !manualTxForm.amount) {
      showToast({ type: "error", title: "Validation Error", message: "User ID and amount are required", duration: 3000 })
      return
    }

    setIsProcessing(true)
    try {
      const response = await fetch("/api/admin/transactions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: manualTxForm.userId,
          type: manualTxForm.type,
          amount: Number.parseFloat(manualTxForm.amount),
          description: manualTxForm.description,
        }),
      })

      const result = await response.json()
      if (!response.ok) throw new Error(result.error)

      showToast({ type: "success", title: "Transaction Processed", message: result.message, duration: 3000 })
      setIsManualTxOpen(false)
      setManualTxForm({ userId: "", type: "topup", amount: "", description: "" })
      mutate()
    } catch (error) {
      showToast({ type: "error", title: "Transaction Failed", message: error instanceof Error ? error.message : "Failed to process transaction", duration: 5000 })
    } finally {
      setIsProcessing(false)
    }
  }

  const openViewModal = (tx: Transaction) => {
    setSelectedTx(tx)
    setIsViewModalOpen(true)
  }

  const isPositive = (type: string) => ["topup", "transfer_in", "voucher", "refund"].includes(type)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Transaction Management</h1>
          <p className="text-muted-foreground">Monitor and manage all platform transactions</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="rounded-xl bg-transparent" onClick={() => mutate()}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button variant="outline" className="rounded-xl bg-transparent">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          <Dialog open={isManualTxOpen} onOpenChange={setIsManualTxOpen}>
            <DialogTrigger asChild>
              <Button className="rounded-xl">
                <Plus className="h-4 w-4 mr-2" />
                Manual Transaction
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Process Manual Transaction</DialogTitle>
                <DialogDescription>Add funds or process a refund for a user</DialogDescription>
              </DialogHeader>
              <div className="space-y-4 mt-4">
                <div>
                  <Label>User ID *</Label>
                  <Input
                    value={manualTxForm.userId}
                    onChange={(e) => setManualTxForm({ ...manualTxForm, userId: e.target.value })}
                    placeholder="Enter user ID"
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label>Transaction Type</Label>
                  <Select value={manualTxForm.type} onValueChange={(v) => setManualTxForm({ ...manualTxForm, type: v })}>
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="topup">Top-up (Add Funds)</SelectItem>
                      <SelectItem value="refund">Refund</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Amount (NAD) *</Label>
                  <Input
                    type="number"
                    value={manualTxForm.amount}
                    onChange={(e) => setManualTxForm({ ...manualTxForm, amount: e.target.value })}
                    placeholder="0.00"
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label>Description</Label>
                  <Textarea
                    value={manualTxForm.description}
                    onChange={(e) => setManualTxForm({ ...manualTxForm, description: e.target.value })}
                    placeholder="Reason for transaction..."
                    className="mt-1"
                  />
                </div>
              </div>
              <DialogFooter className="mt-6">
                <Button variant="outline" onClick={() => setIsManualTxOpen(false)} className="bg-transparent">
                  Cancel
                </Button>
                <Button onClick={handleManualTransaction} disabled={isProcessing}>
                  {isProcessing ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <CheckCircle className="h-4 w-4 mr-2" />}
                  Process
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-6 gap-4">
        {[
          { label: "Total Transactions", value: stats.total.toLocaleString(), icon: TrendingUp, color: "text-foreground" },
          { label: "Total Volume", value: `N$${(stats.totalVolume / 1000).toFixed(0)}K`, icon: DollarSign, color: "text-green-500" },
          { label: "Total Fees", value: `N$${stats.totalFees.toLocaleString()}`, icon: Wallet, color: "text-purple-500" },
          { label: "Pending", value: stats.pending, icon: Clock, color: "text-yellow-500" },
          { label: "Completed", value: stats.completed.toLocaleString(), icon: CheckCircle, color: "text-green-500" },
          { label: "Failed", value: stats.failed, icon: AlertTriangle, color: "text-red-500" },
        ].map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
          >
            <Card className="bg-card border-border">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <stat.icon className={cn("h-4 w-4", stat.color)} />
                  <span className="text-xs text-muted-foreground">{stat.label}</span>
                </div>
                <p className={cn("text-xl font-bold", stat.color)}>{stat.value}</p>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by user, reference..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1) }}
            className="pl-10 bg-muted border-0 rounded-xl"
          />
        </div>
        <Select value={typeFilter} onValueChange={(v) => { setTypeFilter(v); setPage(1) }}>
          <SelectTrigger className="w-full sm:w-40 bg-muted border-0 rounded-xl">
            <SelectValue placeholder="Type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="topup">Top-up</SelectItem>
            <SelectItem value="transfer_in">Transfer In</SelectItem>
            <SelectItem value="transfer_out">Transfer Out</SelectItem>
            <SelectItem value="voucher">Voucher</SelectItem>
            <SelectItem value="trade">Trade</SelectItem>
            <SelectItem value="refund">Refund</SelectItem>
          </SelectContent>
        </Select>
        <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setPage(1) }}>
          <SelectTrigger className="w-full sm:w-36 bg-muted border-0 rounded-xl">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
            <SelectItem value="failed">Failed</SelectItem>
            <SelectItem value="refunded">Refunded</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Transactions Table */}
      <div className="bg-card rounded-xl border border-border overflow-hidden">
        {isLoading ? (
          <div className="p-6 space-y-4">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="flex items-center gap-4">
                <Skeleton className="h-8 w-20" />
                <Skeleton className="h-6 w-32" />
                <Skeleton className="h-6 w-24" />
                <div className="flex-1" />
                <Skeleton className="h-6 w-20" />
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="p-12 text-center">
            <XCircle className="w-12 h-12 text-destructive mx-auto mb-4" />
            <p className="text-muted-foreground">Failed to load transactions</p>
            <Button variant="outline" size="sm" className="mt-4 bg-transparent" onClick={() => mutate()}>
              Try Again
            </Button>
          </div>
        ) : transactions.length === 0 ? (
          <div className="p-12 text-center">
            <Wallet className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-lg font-medium text-foreground mb-1">No transactions found</p>
            <p className="text-muted-foreground">Transactions will appear here</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border bg-muted/50">
                    <th className="text-left p-4 font-medium text-muted-foreground">Type</th>
                    <th className="text-left p-4 font-medium text-muted-foreground">User</th>
                    <th className="text-left p-4 font-medium text-muted-foreground">Amount</th>
                    <th className="text-left p-4 font-medium text-muted-foreground">Fee</th>
                    <th className="text-left p-4 font-medium text-muted-foreground">Status</th>
                    <th className="text-left p-4 font-medium text-muted-foreground">Reference</th>
                    <th className="text-left p-4 font-medium text-muted-foreground">Date</th>
                    <th className="text-left p-4 font-medium text-muted-foreground"></th>
                  </tr>
                </thead>
                <tbody>
                  <AnimatePresence>
                    {transactions.map((tx, i) => (
                      <motion.tr
                        key={tx.id}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: i * 0.02 }}
                        className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors"
                      >
                        <td className="p-4">
                          <Badge variant="outline" className={cn("capitalize", typeColors[tx.type] || "")}>
                            {typeLabels[tx.type] || tx.type}
                          </Badge>
                        </td>
                        <td className="p-4">
                          <div>
                            <p className="font-medium text-foreground">{tx.userName || "Unknown"}</p>
                            {tx.userEmail && (
                              <p className="text-xs text-muted-foreground">{tx.userEmail}</p>
                            )}
                          </div>
                        </td>
                        <td className="p-4">
                          <div className={cn("flex items-center gap-1 font-medium", isPositive(tx.type) ? "text-green-500" : "text-red-500")}>
                            {isPositive(tx.type) ? <ArrowUpRight className="h-4 w-4" /> : <ArrowDownRight className="h-4 w-4" />}
                            N${Math.abs(tx.amount).toLocaleString()}
                          </div>
                        </td>
                        <td className="p-4 text-muted-foreground">
                          {tx.fee > 0 ? `N$${tx.fee.toFixed(2)}` : "-"}
                        </td>
                        <td className="p-4">
                          <Badge variant="outline" className={cn("capitalize", statusColors[tx.status] || "")}>
                            {tx.status}
                          </Badge>
                        </td>
                        <td className="p-4 text-muted-foreground text-sm">
                          {tx.reference || "-"}
                        </td>
                        <td className="p-4 text-muted-foreground text-sm">
                          {formatDate(tx.createdAt)}
                        </td>
                        <td className="p-4">
                          <Button variant="ghost" size="icon" onClick={() => openViewModal(tx)}>
                            <Eye className="h-4 w-4" />
                          </Button>
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
                Showing {(page - 1) * 50 + 1}-{Math.min(page * 50, pagination.total)} of {pagination.total}
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
                <span className="text-sm text-muted-foreground">
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

      {/* View Transaction Modal */}
      <Dialog open={isViewModalOpen} onOpenChange={setIsViewModalOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Transaction Details</DialogTitle>
          </DialogHeader>
          {selectedTx && (
            <div className="space-y-4 mt-4">
              <div className="flex items-center justify-between p-4 bg-muted/50 rounded-xl">
                <div>
                  <p className="text-sm text-muted-foreground">Amount</p>
                  <p className={cn("text-2xl font-bold", isPositive(selectedTx.type) ? "text-green-500" : "text-red-500")}>
                    {isPositive(selectedTx.type) ? "+" : "-"}N${Math.abs(selectedTx.amount).toLocaleString()}
                  </p>
                </div>
                <Badge variant="outline" className={cn("capitalize", statusColors[selectedTx.status])}>
                  {selectedTx.status}
                </Badge>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Type</p>
                  <Badge variant="outline" className={cn("capitalize mt-1", typeColors[selectedTx.type])}>
                    {typeLabels[selectedTx.type] || selectedTx.type}
                  </Badge>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Fee</p>
                  <p className="font-medium text-foreground">
                    {selectedTx.fee > 0 ? `N$${selectedTx.fee.toFixed(2)}` : "No fee"}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">User</p>
                  <p className="font-medium text-foreground">{selectedTx.userName}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Balance After</p>
                  <p className="font-medium text-foreground">N${selectedTx.balanceAfter.toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Reference</p>
                  <p className="font-medium text-foreground">{selectedTx.reference || "N/A"}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Date</p>
                  <p className="font-medium text-foreground">{formatDate(selectedTx.createdAt)}</p>
                </div>
              </div>

              {selectedTx.description && (
                <div>
                  <p className="text-sm text-muted-foreground">Description</p>
                  <p className="font-medium text-foreground mt-1">{selectedTx.description}</p>
                </div>
              )}

              {selectedTx.relatedUserName && (
                <div>
                  <p className="text-sm text-muted-foreground">Related User</p>
                  <p className="font-medium text-foreground mt-1">{selectedTx.relatedUserName}</p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
