"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import useSWR from "swr"
import {
  Plus,
  Search,
  Copy,
  Check,
  Ticket,
  Download,
  Loader2,
  XCircle,
  RefreshCw,
  Eye,
  Ban,
  CheckCircle2,
  Clock,
  AlertCircle,
  Store,
  FileText,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { cn } from "@/lib/utils"
import { useNotifications } from "@/contexts/notification-context"
import { VOUCHER_AMOUNTS, MOBILE_MONEY_BANKS } from "@/lib/types"

interface Voucher {
  id: string
  code: string
  amount: number
  type: "scratch" | "online"
  status: "unused" | "used" | "disabled" | "expired"
  vendor: string | null
  batchId: string | null
  createdBy: { id: string; name: string | null; email: string | null }
  usedBy: { id: string; phone: string | null; name: string | null; email: string | null } | null
  usedAt: string | null
  expiresAt: string
  createdAt: string
}

interface TopUpRequest {
  id: string
  userId: string
  userName: string
  userEmail: string
  amount: number
  bank: string
  bankName: string
  receiptUrl: string
  status: "pending" | "approved" | "rejected"
  voucherCode: string | null
  rejectionReason: string | null
  createdAt: string
  processedAt: string | null
}

interface VouchersResponse {
  vouchers: Voucher[]
  stats: {
    total: number
    unused: number
    used: number
    disabled: number
    expired: number
    totalValue: number
    usedValue: number
  }
  vendors: string[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
    hasMore: boolean
  }
}

interface TopUpRequestsResponse {
  requests: TopUpRequest[]
  stats: {
    pending: number
    approved: number
    rejected: number
  }
}

const fetcher = (url: string) => fetch(url).then((res) => res.json())

const statusColors = {
  unused: "bg-green-500/10 text-green-500 border-green-500/20",
  used: "bg-blue-500/10 text-blue-500 border-blue-500/20",
  expired: "bg-gray-500/10 text-gray-500 border-gray-500/20",
  disabled: "bg-red-500/10 text-red-500 border-red-500/20",
  pending: "bg-yellow-500/10 text-yellow-500 border-yellow-500/20",
  approved: "bg-green-500/10 text-green-500 border-green-500/20",
  rejected: "bg-red-500/10 text-red-500 border-red-500/20",
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr)
  return date.toLocaleDateString("en-NA", {
    month: "short",
    day: "numeric",
    year: "numeric",
  })
}

function formatDateTime(dateStr: string): string {
  const date = new Date(dateStr)
  return date.toLocaleString("en-NA", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })
}

export function AdminVouchers() {
  const [activeTab, setActiveTab] = useState("vouchers")

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Voucher Management</h1>
          <p className="text-muted-foreground">Generate scratch card vouchers and manage mobile money top-up requests</p>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="vouchers">Scratch Card Vouchers</TabsTrigger>
          <TabsTrigger value="topup-requests">Mobile Money Requests</TabsTrigger>
        </TabsList>

        <TabsContent value="vouchers" className="space-y-6 mt-6">
          <VouchersTab />
        </TabsContent>

        <TabsContent value="topup-requests" className="space-y-6 mt-6">
          <TopUpRequestsTab />
        </TabsContent>
      </Tabs>
    </div>
  )
}

function VouchersTab() {
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [vendorFilter, setVendorFilter] = useState("")
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const [isGenerating, setIsGenerating] = useState(false)
  const [newVoucherValue, setNewVoucherValue] = useState("50")
  const [newVoucherCount, setNewVoucherCount] = useState("10")
  const [newVoucherVendor, setNewVoucherVendor] = useState("")
  const [dialogOpen, setDialogOpen] = useState(false)
  const [exportDialogOpen, setExportDialogOpen] = useState(false)
  const [exportVendor, setExportVendor] = useState("")
  const [exportValue, setExportValue] = useState("")
  const { showToast } = useNotifications()

  const buildApiUrl = () => {
    const params = new URLSearchParams()
    if (statusFilter !== "all") params.set("status", statusFilter)
    if (vendorFilter) params.set("vendor", vendorFilter)
    if (search) params.set("search", search)
    return `/api/admin/vouchers?${params.toString()}`
  }

  const { data, error, isLoading, mutate } = useSWR<VouchersResponse>(
    buildApiUrl(),
    fetcher,
    { refreshInterval: 30000 }
  )

  const vouchers = data?.vouchers || []
  const stats = data?.stats || { total: 0, unused: 0, used: 0, disabled: 0, expired: 0, totalValue: 0, usedValue: 0 }
  const vendors = data?.vendors || []

  const copyCode = (id: string, code: string) => {
    navigator.clipboard.writeText(code)
    setCopiedId(id)
    setTimeout(() => setCopiedId(null), 2000)
  }

  const handleGenerate = async () => {
    if (!newVoucherVendor.trim()) {
      showToast({
        type: "error",
        title: "Vendor Required",
        message: "Please enter a vendor name for the scratch card vouchers",
        duration: 3000,
      })
      return
    }

    setIsGenerating(true)
    try {
      const response = await fetch("/api/admin/vouchers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: Number.parseInt(newVoucherValue),
          quantity: Number.parseInt(newVoucherCount),
          vendor: newVoucherVendor.trim(),
          expiryDays: 365,
        }),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || "Failed to generate vouchers")
      }

      showToast({
        type: "success",
        title: "Vouchers Generated",
        message: result.message,
        duration: 5000,
      })

      setDialogOpen(false)
      setNewVoucherVendor("")
      mutate()
    } catch (error) {
      showToast({
        type: "error",
        title: "Generation Failed",
        message: error instanceof Error ? error.message : "Failed to generate vouchers",
        duration: 5000,
      })
    } finally {
      setIsGenerating(false)
    }
  }

  // Export vouchers to CSV for vendors
  const handleExport = () => {
    let vouchersToExport = vouchers.filter(v => v.status === "unused")
    
    if (exportVendor) {
      vouchersToExport = vouchersToExport.filter(v => v.vendor === exportVendor)
    }
    
    if (exportValue) {
      vouchersToExport = vouchersToExport.filter(v => v.amount === Number(exportValue))
    }

    if (vouchersToExport.length === 0) {
      showToast({
        type: "error",
        title: "No Vouchers to Export",
        message: "There are no unused vouchers matching your filters",
        duration: 3000,
      })
      return
    }

    // Generate CSV content
    const headers = ["Voucher Code", "Value (NAD)", "Vendor", "Expiry Date", "Created Date"]
    const rows = vouchersToExport.map(v => [
      v.code,
      v.amount.toString(),
      v.vendor || "",
      formatDate(v.expiresAt),
      formatDate(v.createdAt)
    ])

    const csvContent = [
      headers.join(","),
      ...rows.map(row => row.join(","))
    ].join("\n")

    // Create and download file
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
    const link = document.createElement("a")
    const url = URL.createObjectURL(blob)
    link.setAttribute("href", url)
    link.setAttribute("download", `vouchers_export_${exportVendor || "all"}_${new Date().toISOString().split("T")[0]}.csv`)
    link.style.visibility = "hidden"
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)

    // Calculate summary
    const totalValue = vouchersToExport.reduce((sum, v) => sum + v.amount, 0)

    showToast({
      type: "success",
      title: "Export Complete",
      message: `Exported ${vouchersToExport.length} vouchers (Total value: N$${totalValue.toLocaleString()})`,
      duration: 5000,
    })

    setExportDialogOpen(false)
  }

  // Export vouchers for printing (formatted for physical scratch cards)
  const handleExportForPrint = () => {
    let vouchersToExport = vouchers.filter(v => v.status === "unused")
    
    if (exportVendor) {
      vouchersToExport = vouchersToExport.filter(v => v.vendor === exportVendor)
    }
    
    if (exportValue) {
      vouchersToExport = vouchersToExport.filter(v => v.amount === Number(exportValue))
    }

    if (vouchersToExport.length === 0) {
      showToast({
        type: "error",
        title: "No Vouchers to Export",
        message: "There are no unused vouchers matching your filters",
        duration: 3000,
      })
      return
    }

    // Group vouchers by denomination
    const grouped = vouchersToExport.reduce((acc, v) => {
      if (!acc[v.amount]) acc[v.amount] = []
      acc[v.amount].push(v)
      return acc
    }, {} as Record<number, Voucher[]>)

    // Generate printable content
    let printContent = "BARTER TRADE NAMIBIA - VOUCHER CODES FOR PRINTING\n"
    printContent += "=".repeat(70) + "\n"
    printContent += `Generated: ${new Date().toLocaleString()}\n`
    printContent += `Vendor: ${exportVendor || "All Vendors"}\n`
    printContent += `Total Vouchers: ${vouchersToExport.length}\n`
    printContent += `Total Value: N$${vouchersToExport.reduce((sum, v) => sum + v.amount, 0).toLocaleString()}\n`
    printContent += "=".repeat(70) + "\n\n"

    Object.entries(grouped).sort((a, b) => Number(a[0]) - Number(b[0])).forEach(([amount, voucherList]) => {
      printContent += `\n--- N$${amount} VOUCHERS (${voucherList.length} vouchers, Total: N$${(Number(amount) * voucherList.length).toLocaleString()}) ---\n\n`
      voucherList.forEach((v, i) => {
        // Format code with spaces for readability: 1234 5678 90
        const formattedCode = `${v.code.slice(0, 4)} ${v.code.slice(4, 8)} ${v.code.slice(8, 10)}`
        printContent += `${String(i + 1).padStart(3, " ")}. ${formattedCode}   Value: N$${amount}   Expires: ${formatDate(v.expiresAt)}\n`
      })
    })

    printContent += "\n" + "=".repeat(70) + "\n"
    printContent += "INSTRUCTIONS FOR VENDORS:\n"
    printContent += "1. Keep voucher codes secure - each code can only be used once\n"
    printContent += "2. Sell at face value (N$ amount shown)\n"
    printContent += "3. Users redeem by entering 10-digit code in the Barter Trade app\n"
    printContent += "4. Code format: 1234 5678 90 (spaces are optional when entering)\n"
    printContent += "=".repeat(70) + "\n"

    const blob = new Blob([printContent], { type: "text/plain;charset=utf-8;" })
    const link = document.createElement("a")
    const url = URL.createObjectURL(blob)
    link.setAttribute("href", url)
    link.setAttribute("download", `vouchers_print_${exportVendor || "all"}_${new Date().toISOString().split("T")[0]}.txt`)
    link.style.visibility = "hidden"
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)

    showToast({
      type: "success",
      title: "Print Export Complete",
      message: `Exported ${vouchersToExport.length} vouchers for printing`,
      duration: 3000,
    })

    setExportDialogOpen(false)
  }

  const handleDisable = async (voucherId: string) => {
    try {
      const response = await fetch("/api/admin/vouchers", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ voucherId }),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || "Failed to disable voucher")
      }

      showToast({
        type: "success",
        title: "Voucher Disabled",
        message: "Voucher has been disabled and can no longer be used",
        duration: 3000,
      })

      mutate()
    } catch (error) {
      showToast({
        type: "error",
        title: "Action Failed",
        message: error instanceof Error ? error.message : "Failed to disable voucher",
        duration: 5000,
      })
    }
  }

  return (
    <>
      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Total Vouchers", value: stats.total, color: "text-foreground" },
          { label: "Unused", value: stats.unused, color: "text-green-500" },
          { label: "Used", value: stats.used, color: "text-blue-500" },
          { label: "Available Value", value: `N$${stats.totalValue.toLocaleString()}`, color: "text-amber-500" },
        ].map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="bg-card rounded-xl border border-border p-4"
          >
            <p className={`text-2xl font-bold ${stat.color}`}>{stat.value}</p>
            <p className="text-sm text-muted-foreground">{stat.label}</p>
          </motion.div>
        ))}
      </div>

      {/* Actions */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search voucher codes..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10 bg-muted border-0 rounded-xl"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-36 bg-muted border-0 rounded-xl">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="unused">Unused</SelectItem>
            <SelectItem value="used">Used</SelectItem>
            <SelectItem value="disabled">Disabled</SelectItem>
            <SelectItem value="expired">Expired</SelectItem>
          </SelectContent>
        </Select>
{vendors.length > 0 && (
  <Select value={vendorFilter || "__all__"} onValueChange={(v) => setVendorFilter(v === "__all__" ? "" : v)}>
  <SelectTrigger className="w-full sm:w-44 bg-muted border-0 rounded-xl">
  <SelectValue placeholder="All Vendors" />
  </SelectTrigger>
  <SelectContent>
  <SelectItem value="__all__">All Vendors</SelectItem>
  {vendors.map(v => (
  <SelectItem key={v} value={v}>{v}</SelectItem>
  ))}
  </SelectContent>
  </Select>
  )}
        <Button variant="outline" className="rounded-xl bg-transparent" onClick={() => mutate()}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
        
        {/* Export Dialog */}
        <Dialog open={exportDialogOpen} onOpenChange={setExportDialogOpen}>
          <DialogTrigger asChild>
            <Button variant="outline" className="rounded-xl bg-transparent">
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Export Vouchers</DialogTitle>
              <DialogDescription>
                Export unused vouchers for vendors to print and distribute
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 mt-4">
              <div>
                <Label>Vendor (Optional)</Label>
                <Select value={exportVendor || "__all__"} onValueChange={(v) => setExportVendor(v === "__all__" ? "" : v)}>
                  <SelectTrigger className="mt-2">
                    <SelectValue placeholder="All Vendors" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__all__">All Vendors</SelectItem>
                    {vendors.map(v => (
                      <SelectItem key={v} value={v}>{v}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Voucher Value (Optional)</Label>
                <Select value={exportValue || "__all__"} onValueChange={(v) => setExportValue(v === "__all__" ? "" : v)}>
                  <SelectTrigger className="mt-2">
                    <SelectValue placeholder="All Values" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__all__">All Values</SelectItem>
                    {VOUCHER_AMOUNTS.map((amount) => (
                      <SelectItem key={amount} value={amount.toString()}>
                        N${amount}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex gap-3">
                <Button onClick={handleExport} className="flex-1">
                  <FileText className="h-4 w-4 mr-2" />
                  Export CSV
                </Button>
                <Button onClick={handleExportForPrint} variant="outline" className="flex-1 bg-transparent">
                  <Ticket className="h-4 w-4 mr-2" />
                  Export for Print
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
        
        {/* Generate Dialog */}
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button className="rounded-xl">
              <Plus className="h-4 w-4 mr-2" />
              Generate Vouchers
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Generate Scratch Card Vouchers</DialogTitle>
              <DialogDescription>
                Create vouchers with secure 10-digit numeric codes for vendor distribution
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 mt-4">
              <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-3">
                <div className="flex items-start gap-2">
                  <Store className="h-4 w-4 text-amber-500 mt-0.5" />
                  <p className="text-xs text-muted-foreground">
                    Generated vouchers use cryptographically secure 10-digit numeric codes. 
                    These can be printed for physical voucher cards and distributed to vendors for sale.
                  </p>
                </div>
              </div>
              <div>
                <Label>Vendor Name <span className="text-red-500">*</span></Label>
                <Input
                  value={newVoucherVendor}
                  onChange={(e) => setNewVoucherVendor(e.target.value)}
                  placeholder="e.g., Shop ABC, Vendor XYZ"
                  className="mt-2"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Enter the name of the vendor who will sell these vouchers
                </p>
              </div>
              <div>
                <Label>Voucher Value (NAD)</Label>
                <Select value={newVoucherValue} onValueChange={setNewVoucherValue}>
                  <SelectTrigger className="mt-2">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {VOUCHER_AMOUNTS.map((amount) => (
                      <SelectItem key={amount} value={amount.toString()}>
                        N${amount}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Number of Vouchers</Label>
                <Input
                  type="number"
                  value={newVoucherCount}
                  onChange={(e) => setNewVoucherCount(e.target.value)}
                  min="1"
                  max="1000"
                  className="mt-2"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Maximum 1000 vouchers per batch
                </p>
              </div>
              <div className="bg-muted rounded-lg p-3 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Vendor</span>
                  <span className="font-medium text-foreground">{newVoucherVendor || "-"}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Value per Voucher</span>
                  <span className="font-medium text-foreground">N${newVoucherValue}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Quantity</span>
                  <span className="font-medium text-foreground">{newVoucherCount}</span>
                </div>
                <div className="border-t border-border pt-2 flex justify-between text-sm">
                  <span className="text-muted-foreground">Total Value</span>
                  <span className="font-bold text-amber-500">
                    N${(Number.parseInt(newVoucherValue) * Number.parseInt(newVoucherCount || "0")).toLocaleString()}
                  </span>
                </div>
              </div>
              <Button 
                onClick={handleGenerate} 
                disabled={isGenerating || !newVoucherVendor.trim()} 
                className="w-full"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Ticket className="h-4 w-4 mr-2" />
                    Generate {newVoucherCount} Voucher{Number.parseInt(newVoucherCount) > 1 ? "s" : ""}
                  </>
                )}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Vouchers Table */}
      <div className="bg-card rounded-xl border border-border overflow-hidden">
        {isLoading ? (
          <div className="p-6 space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex items-center gap-4">
                <Skeleton className="h-8 w-32" />
                <Skeleton className="h-6 w-20" />
                <Skeleton className="h-6 w-24" />
                <div className="flex-1" />
                <Skeleton className="h-8 w-16" />
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="p-12 text-center">
            <XCircle className="w-12 h-12 text-destructive mx-auto mb-4" />
            <p className="text-muted-foreground">Failed to load vouchers</p>
            <Button variant="outline" size="sm" className="mt-4 bg-transparent" onClick={() => mutate()}>
              Try Again
            </Button>
          </div>
        ) : vouchers.length === 0 ? (
          <div className="p-12 text-center">
            <Ticket className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-lg font-medium text-foreground mb-1">No vouchers found</p>
            <p className="text-muted-foreground">Generate some vouchers to get started</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border bg-muted/50">
                  <th className="text-left p-4 font-medium text-muted-foreground">Code</th>
                  <th className="text-left p-4 font-medium text-muted-foreground">Value</th>
                  <th className="text-left p-4 font-medium text-muted-foreground">Vendor</th>
                  <th className="text-left p-4 font-medium text-muted-foreground">Status</th>
                  <th className="text-left p-4 font-medium text-muted-foreground">Created</th>
                  <th className="text-left p-4 font-medium text-muted-foreground">Used By</th>
                  <th className="text-left p-4 font-medium text-muted-foreground"></th>
                </tr>
              </thead>
              <tbody>
                <AnimatePresence>
                  {vouchers.map((voucher, i) => (
                    <motion.tr
                      key={voucher.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: i * 0.03 }}
                      className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors"
                    >
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          <code className="font-mono text-sm bg-muted px-2 py-1 rounded">
                            {voucher.code.slice(0, 4)} {voucher.code.slice(4, 8)} {voucher.code.slice(8)}
                          </code>
                          <button
                            onClick={() => copyCode(voucher.id, voucher.code)}
                            className="text-muted-foreground hover:text-foreground transition-colors"
                          >
                            {copiedId === voucher.id ? (
                              <Check className="h-4 w-4 text-green-500" />
                            ) : (
                              <Copy className="h-4 w-4" />
                            )}
                          </button>
                        </div>
                      </td>
                      <td className="p-4">
                        <span className="font-bold text-amber-500">N${voucher.amount}</span>
                      </td>
                      <td className="p-4">
                        {voucher.vendor ? (
                          <span className="text-foreground">{voucher.vendor}</span>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </td>
                      <td className="p-4">
                        <Badge
                          variant="outline"
                          className={cn("capitalize", statusColors[voucher.status])}
                        >
                          {voucher.status}
                        </Badge>
                      </td>
                      <td className="p-4 text-muted-foreground">{formatDate(voucher.createdAt)}</td>
                      <td className="p-4">
                        {voucher.usedBy ? (
                          <div>
                            <p className="text-foreground">{voucher.usedBy.name || voucher.usedBy.phone}</p>
                            <p className="text-xs text-muted-foreground">
                              {voucher.usedAt && formatDateTime(voucher.usedAt)}
                            </p>
                          </div>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </td>
                      <td className="p-4">
                        {voucher.status === "unused" && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDisable(voucher.id)}
                            className="text-red-500 hover:text-red-600 hover:bg-red-500/10"
                          >
                            <Ban className="h-4 w-4 mr-1" />
                            Disable
                          </Button>
                        )}
                      </td>
                    </motion.tr>
                  ))}
                </AnimatePresence>
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  )
}

function TopUpRequestsTab() {
  const [statusFilter, setStatusFilter] = useState("pending")
  const [selectedRequest, setSelectedRequest] = useState<TopUpRequest | null>(null)
  const [rejectReason, setRejectReason] = useState("")
  const [isProcessing, setIsProcessing] = useState(false)
  const { showToast } = useNotifications()

  const buildApiUrl = () => {
    const params = new URLSearchParams()
    if (statusFilter !== "all") params.set("status", statusFilter)
    return `/api/wallet/mobile-money?${params.toString()}`
  }

  const { data, error, isLoading, mutate } = useSWR<TopUpRequestsResponse>(
    buildApiUrl(),
    fetcher,
    { refreshInterval: 10000 }
  )

  const requests = data?.requests || []
  const stats = data?.stats || { pending: 0, approved: 0, rejected: 0 }

  const handleProcess = async (action: "approve" | "reject") => {
    if (!selectedRequest) return
    if (action === "reject" && !rejectReason.trim()) {
      showToast({
        type: "error",
        title: "Rejection Reason Required",
        message: "Please provide a reason for rejection",
        duration: 3000,
      })
      return
    }

    setIsProcessing(true)
    try {
      const response = await fetch(`/api/wallet/mobile-money/${selectedRequest.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action,
          rejectionReason: action === "reject" ? rejectReason : undefined,
        }),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || `Failed to ${action} request`)
      }

      showToast({
        type: "success",
        title: action === "approve" ? "Request Approved" : "Request Rejected",
        message: result.message,
        duration: 5000,
      })

      setSelectedRequest(null)
      setRejectReason("")
      mutate()
    } catch (error) {
      showToast({
        type: "error",
        title: "Processing Failed",
        message: error instanceof Error ? error.message : "Failed to process request",
        duration: 5000,
      })
    } finally {
      setIsProcessing(false)
    }
  }

  const getBankInfo = (bankId: string) => {
    return MOBILE_MONEY_BANKS.find((b) => b.id === bankId)
  }

  return (
    <>
      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <Card className={cn(statusFilter === "pending" && "ring-2 ring-yellow-500")}>
          <CardContent className="p-4 cursor-pointer" onClick={() => setStatusFilter("pending")}>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-yellow-500/10 flex items-center justify-center">
                <Clock className="w-5 h-5 text-yellow-500" />
              </div>
              <div>
                <p className="text-2xl font-bold text-yellow-500">{stats.pending}</p>
                <p className="text-sm text-muted-foreground">Pending</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className={cn(statusFilter === "approved" && "ring-2 ring-green-500")}>
          <CardContent className="p-4 cursor-pointer" onClick={() => setStatusFilter("approved")}>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-green-500/10 flex items-center justify-center">
                <CheckCircle2 className="w-5 h-5 text-green-500" />
              </div>
              <div>
                <p className="text-2xl font-bold text-green-500">{stats.approved}</p>
                <p className="text-sm text-muted-foreground">Approved</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className={cn(statusFilter === "rejected" && "ring-2 ring-red-500")}>
          <CardContent className="p-4 cursor-pointer" onClick={() => setStatusFilter("rejected")}>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-red-500/10 flex items-center justify-center">
                <XCircle className="w-5 h-5 text-red-500" />
              </div>
              <div>
                <p className="text-2xl font-bold text-red-500">{stats.rejected}</p>
                <p className="text-sm text-muted-foreground">Rejected</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Requests List */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>
            {statusFilter === "all" ? "All" : statusFilter.charAt(0).toUpperCase() + statusFilter.slice(1)} Requests
          </CardTitle>
          <Button variant="outline" size="sm" className="bg-transparent" onClick={() => mutate()}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-6 space-y-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="flex items-center gap-4">
                  <Skeleton className="h-12 w-12 rounded-xl" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-3 w-24" />
                  </div>
                  <Skeleton className="h-8 w-20" />
                </div>
              ))}
            </div>
          ) : error ? (
            <div className="p-12 text-center">
              <XCircle className="w-12 h-12 text-destructive mx-auto mb-4" />
              <p className="text-muted-foreground">Failed to load requests</p>
            </div>
          ) : requests.length === 0 ? (
            <div className="p-12 text-center">
              <Ticket className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-lg font-medium text-foreground mb-1">No requests found</p>
              <p className="text-muted-foreground">
                {statusFilter === "pending" ? "No pending top-up requests" : "No requests in this category"}
              </p>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {requests.map((request, i) => {
                const bankInfo = getBankInfo(request.bank)
                return (
                  <motion.div
                    key={request.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className="p-4 hover:bg-muted/30 transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      <div
                        className="w-12 h-12 rounded-xl flex items-center justify-center text-white font-bold"
                        style={{ backgroundColor: bankInfo?.color || "#6B7280" }}
                      >
                        {bankInfo?.name.charAt(0) || "?"}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="font-medium text-foreground">{request.userName}</p>
                          <Badge variant="outline" className={cn("capitalize", statusColors[request.status])}>
                            {request.status}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {request.bankName} - N${request.amount}
                        </p>
                        <p className="text-xs text-muted-foreground">{formatDate(request.createdAt)}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        {request.status === "pending" && (
                          <Button
                            size="sm"
                            variant="outline"
                            className="bg-transparent"
                            onClick={() => setSelectedRequest(request)}
                          >
                            <Eye className="h-4 w-4 mr-1" />
                            Review
                          </Button>
                        )}
                        {request.voucherCode && (
                          <code className="text-xs bg-muted px-2 py-1 rounded font-mono">
                            {request.voucherCode}
                          </code>
                        )}
                      </div>
                    </div>
                  </motion.div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Review Dialog */}
      <Dialog open={!!selectedRequest} onOpenChange={(open) => !open && setSelectedRequest(null)}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Review Top-up Request</DialogTitle>
            <DialogDescription>Approve or reject this mobile money top-up request</DialogDescription>
          </DialogHeader>
          {selectedRequest && (
            <div className="space-y-4 mt-4">
              {/* Request Details */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-muted-foreground">User</Label>
                  <p className="font-medium">{selectedRequest.userName}</p>
                  <p className="text-xs text-muted-foreground">{selectedRequest.userEmail}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Amount</Label>
                  <p className="font-bold text-xl text-amber-500">N${selectedRequest.amount}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Bank</Label>
                  <p className="font-medium">{selectedRequest.bankName}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Requested</Label>
                  <p className="font-medium">{formatDate(selectedRequest.createdAt)}</p>
                </div>
              </div>

              {/* Receipt Image */}
              <div>
                <Label className="text-muted-foreground">Payment Receipt (POP)</Label>
                <div className="mt-2 border border-border rounded-xl overflow-hidden">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={selectedRequest.receiptUrl || "/placeholder.svg"}
                    alt="Payment receipt"
                    className="w-full max-h-64 object-contain bg-muted"
                  />
                </div>
                <a
                  href={selectedRequest.receiptUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-primary hover:underline mt-2 inline-block"
                >
                  View full image
                </a>
              </div>

              {/* Rejection Reason */}
              <div>
                <Label>Rejection Reason (required if rejecting)</Label>
                <Input
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  placeholder="Enter reason for rejection..."
                  className="mt-2"
                />
              </div>

              {/* Info */}
              <div className="flex items-start gap-2 p-3 bg-amber-500/10 rounded-xl">
                <AlertCircle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
                <div className="text-sm">
                  <p className="font-medium text-amber-500">Important</p>
                  <p className="text-muted-foreground">
                    Approving this request will add N${selectedRequest.amount} credit to the user's wallet immediately.
                    Verify the payment receipt before approving.
                  </p>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  className="flex-1 bg-transparent text-red-500 hover:text-red-600 hover:bg-red-500/10"
                  onClick={() => handleProcess("reject")}
                  disabled={isProcessing}
                >
                  {isProcessing ? <Loader2 className="h-4 w-4 animate-spin" /> : <XCircle className="h-4 w-4 mr-2" />}
                  Reject
                </Button>
                <Button
                  className="flex-1 bg-green-600 hover:bg-green-700"
                  onClick={() => handleProcess("approve")}
                  disabled={isProcessing}
                >
                  {isProcessing ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <CheckCircle2 className="h-4 w-4 mr-2" />
                  )}
                  Approve & Credit
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}
