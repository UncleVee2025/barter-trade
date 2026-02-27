"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import useSWR from "swr"
import {
  Wallet,
  ArrowDownLeft,
  ArrowUpRight,
  Gift,
  RefreshCw,
  Filter,
  Download,
  Calendar,
  TrendingUp,
  TrendingDown,
  Clock,
  CheckCircle2,
  XCircle,
  Loader2,
  ChevronDown,
  Search,
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
import { Skeleton } from "@/components/ui/skeleton"
import { cn } from "@/lib/utils"
import { useAuth } from "@/contexts/auth-context"
import { WalletModal } from "./wallet-modal"

interface Transaction {
  id: string
  type: string
  amount: number
  fee: number
  balanceAfter: number
  status: string
  description: string | null
  reference: string | null
  relatedUser: { id: string; name: string } | null
  relatedListing: { id: string; title: string } | null
  createdAt: string
}

interface TransactionsResponse {
  transactions: Transaction[]
  summary: {
    totalReceived: number
    totalSpent: number
    totalFees: number
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

const transactionTypes = [
  { value: "all", label: "All Types" },
  { value: "topup", label: "Top Up" },
  { value: "transfer_in", label: "Received" },
  { value: "transfer_out", label: "Sent" },
  { value: "voucher", label: "Voucher" },
  { value: "trade", label: "Trade" },
  { value: "listing_fee", label: "Listing Fee" },
  { value: "refund", label: "Refund" },
]

const statusFilters = [
  { value: "all", label: "All Status" },
  { value: "completed", label: "Completed" },
  { value: "pending", label: "Pending" },
  { value: "failed", label: "Failed" },
]

function getTransactionIcon(type: string) {
  switch (type) {
    case "topup":
      return <ArrowDownLeft className="w-5 h-5" />
    case "transfer_in":
      return <ArrowDownLeft className="w-5 h-5" />
    case "transfer_out":
      return <ArrowUpRight className="w-5 h-5" />
    case "voucher":
      return <Gift className="w-5 h-5" />
    case "trade":
      return <RefreshCw className="w-5 h-5" />
    case "listing_fee":
      return <ArrowUpRight className="w-5 h-5" />
    case "refund":
      return <ArrowDownLeft className="w-5 h-5" />
    default:
      return <Wallet className="w-5 h-5" />
  }
}

function getTransactionColor(type: string): string {
  switch (type) {
    case "topup":
    case "transfer_in":
    case "voucher":
    case "refund":
      return "text-green-500 bg-green-500/10"
    case "transfer_out":
    case "listing_fee":
      return "text-red-500 bg-red-500/10"
    case "trade":
      return "text-primary bg-primary/10"
    default:
      return "text-muted-foreground bg-muted"
  }
}

function getStatusIcon(status: string) {
  switch (status) {
    case "completed":
      return <CheckCircle2 className="w-4 h-4 text-green-500" />
    case "pending":
      return <Clock className="w-4 h-4 text-yellow-500" />
    case "failed":
      return <XCircle className="w-4 h-4 text-red-500" />
    default:
      return null
  }
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMs / 3600000)
  const diffDays = Math.floor(diffMs / 86400000)

  if (diffMins < 1) return "Just now"
  if (diffMins < 60) return `${diffMins}m ago`
  if (diffHours < 24) return `${diffHours}h ago`
  if (diffDays === 1) return "Yesterday"
  if (diffDays < 7) return `${diffDays}d ago`
  
  return date.toLocaleDateString("en-NA", {
    month: "short",
    day: "numeric",
    year: date.getFullYear() !== now.getFullYear() ? "numeric" : undefined,
  })
}

function formatFullDate(dateStr: string): string {
  return new Date(dateStr).toLocaleString("en-NA", {
    dateStyle: "medium",
    timeStyle: "short",
  })
}

export function WalletHistoryScreen() {
  const { user } = useAuth()
  const [typeFilter, setTypeFilter] = useState("all")
  const [statusFilter, setStatusFilter] = useState("all")
  const [page, setPage] = useState(1)
  const [isWalletModalOpen, setIsWalletModalOpen] = useState(false)
  const [walletModalTab, setWalletModalTab] = useState<"topup" | "transfer" | "voucher">("topup")

  // Build API URL with filters
  const buildApiUrl = () => {
    const params = new URLSearchParams()
    params.set("page", page.toString())
    params.set("limit", "20")
    if (typeFilter !== "all") params.set("type", typeFilter)
    if (statusFilter !== "all") params.set("status", statusFilter)
    return `/api/wallet/transactions?${params.toString()}`
  }

  const { data, error, isLoading, mutate } = useSWR<TransactionsResponse>(
    buildApiUrl(),
    fetcher,
    { 
      revalidateOnFocus: true,
      refreshInterval: 30000, // Auto-refresh every 30 seconds for live data
      dedupingInterval: 5000,
    }
  )

  const transactions = data?.transactions || []
  const summary = data?.summary || { totalReceived: 0, totalSpent: 0, totalFees: 0 }
  const pagination = data?.pagination

  const handleOpenWalletModal = (tab: "topup" | "transfer" | "voucher") => {
    setWalletModalTab(tab)
    setIsWalletModalOpen(true)
  }

  const handleWalletModalClose = () => {
    setIsWalletModalOpen(false)
    mutate() // Refresh data after modal closes
  }

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
              <span className="text-gradient">Wallet</span> History
            </h1>
            <p className="text-muted-foreground mt-1">
              Track all your transactions and wallet activity
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              className="rounded-xl bg-transparent"
              onClick={() => mutate()}
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh
            </Button>
          </div>
        </motion.div>
      </div>

      {/* Balance Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="mb-6"
      >
        <Card className="bg-gradient-to-br from-primary/10 via-background to-gold/10 border-primary/20">
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Current Balance</p>
                <p className="text-4xl font-bold text-foreground">
                  N${(user?.walletBalance || 0).toLocaleString("en-NA", { minimumFractionDigits: 2 })}
                </p>
              </div>
              <div className="flex flex-wrap gap-3">
                <Button
                  onClick={() => handleOpenWalletModal("topup")}
                  className="rounded-xl bg-primary hover:bg-primary/90"
                >
                  <ArrowDownLeft className="w-4 h-4 mr-2" />
                  Top Up
                </Button>
                <Button
                  variant="outline"
                  onClick={() => handleOpenWalletModal("transfer")}
                  className="rounded-xl bg-transparent"
                >
                  <ArrowUpRight className="w-4 h-4 mr-2" />
                  Transfer
                </Button>
                <Button
                  variant="outline"
                  onClick={() => handleOpenWalletModal("voucher")}
                  className="rounded-xl bg-transparent"
                >
                  <Gift className="w-4 h-4 mr-2" />
                  Voucher
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Stats Cards */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6"
      >
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-green-500/10 flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-green-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Received</p>
                <p className="text-xl font-bold text-green-500">
                  +N${summary.totalReceived.toLocaleString("en-NA", { minimumFractionDigits: 2 })}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-red-500/10 flex items-center justify-center">
                <TrendingDown className="w-5 h-5 text-red-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Spent</p>
                <p className="text-xl font-bold text-red-500">
                  -N${summary.totalSpent.toLocaleString("en-NA", { minimumFractionDigits: 2 })}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center">
                <Wallet className="w-5 h-5 text-muted-foreground" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Fees</p>
                <p className="text-xl font-bold text-muted-foreground">
                  N${summary.totalFees.toLocaleString("en-NA", { minimumFractionDigits: 2 })}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Filters */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="glass rounded-2xl p-4 mb-6"
      >
        <div className="flex flex-col md:flex-row gap-3">
          <Select value={typeFilter} onValueChange={(v) => { setTypeFilter(v); setPage(1); }}>
            <SelectTrigger className="w-full md:w-48 h-11 bg-background/50 border-border/50 rounded-xl">
              <Filter className="w-4 h-4 mr-2 text-muted-foreground" />
              <SelectValue placeholder="Transaction Type" />
            </SelectTrigger>
            <SelectContent>
              {transactionTypes.map((type) => (
                <SelectItem key={type.value} value={type.value}>
                  {type.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setPage(1); }}>
            <SelectTrigger className="w-full md:w-48 h-11 bg-background/50 border-border/50 rounded-xl">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              {statusFilters.map((status) => (
                <SelectItem key={status.value} value={status.value}>
                  {status.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {(typeFilter !== "all" || statusFilter !== "all") && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => { setTypeFilter("all"); setStatusFilter("all"); setPage(1); }}
              className="text-muted-foreground hover:text-foreground"
            >
              Clear Filters
            </Button>
          )}
        </div>
      </motion.div>

      {/* Transactions List */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
      >
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg font-semibold">
              Transaction History
              {pagination && (
                <span className="text-sm font-normal text-muted-foreground ml-2">
                  ({pagination.total} transactions)
                </span>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {isLoading ? (
              <div className="p-6 space-y-4">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="flex items-center gap-4">
                    <Skeleton className="w-12 h-12 rounded-xl" />
                    <div className="flex-1 space-y-2">
                      <Skeleton className="h-4 w-32" />
                      <Skeleton className="h-3 w-24" />
                    </div>
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
                <p className="text-lg font-medium text-foreground mb-1">No transactions yet</p>
                <p className="text-muted-foreground mb-4">
                  Your wallet transactions will appear here
                </p>
                <Button onClick={() => handleOpenWalletModal("topup")} className="rounded-xl">
                  Top Up Wallet
                </Button>
              </div>
            ) : (
              <div className="divide-y divide-border">
                <AnimatePresence>
                  {transactions.map((tx, index) => (
                    <motion.div
                      key={tx.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="p-4 hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex items-center gap-4">
                        <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center", getTransactionColor(tx.type))}>
                          {getTransactionIcon(tx.type)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="font-medium text-foreground truncate">
                              {tx.description || transactionTypes.find((t) => t.value === tx.type)?.label || tx.type}
                            </p>
                            {getStatusIcon(tx.status)}
                          </div>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <span title={formatFullDate(tx.createdAt)}>{formatDate(tx.createdAt)}</span>
                            {tx.reference && (
                              <>
                                <span>-</span>
                                <span className="font-mono text-xs">{tx.reference}</span>
                              </>
                            )}
                          </div>
                          {tx.relatedUser && (
                            <p className="text-xs text-muted-foreground mt-1">
                              {tx.type === "transfer_in" ? "From: " : "To: "}
                              {tx.relatedUser.name}
                            </p>
                          )}
                        </div>
                        <div className="text-right">
                          <p className={cn(
                            "font-semibold",
                            ["topup", "transfer_in", "voucher", "refund"].includes(tx.type)
                              ? "text-green-500"
                              : "text-red-500"
                          )}>
                            {["topup", "transfer_in", "voucher", "refund"].includes(tx.type) ? "+" : "-"}
                            N${tx.amount.toLocaleString("en-NA", { minimumFractionDigits: 2 })}
                          </p>
                          {tx.fee > 0 && (
                            <p className="text-xs text-muted-foreground">
                              Fee: N${tx.fee.toFixed(2)}
                            </p>
                          )}
                          <p className="text-xs text-muted-foreground">
                            Bal: N${tx.balanceAfter.toLocaleString("en-NA", { minimumFractionDigits: 2 })}
                          </p>
                        </div>
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

      {/* Wallet Modal */}
      <WalletModal
        isOpen={isWalletModalOpen}
        onClose={handleWalletModalClose}
        defaultTab={walletModalTab}
      />
    </div>
  )
}
