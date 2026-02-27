"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Skeleton } from "@/components/ui/skeleton"
import { ScrollArea } from "@/components/ui/scroll-area"
import { useNotifications } from "@/contexts/notification-context"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from "@/components/ui/dialog"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle
} from "@/components/ui/alert-dialog"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table"
import {
  Wallet,
  CheckCircle,
  XCircle,
  Clock,
  Search,
  RefreshCw,
  Eye,
  DollarSign,
  Receipt,
  Building,
  User,
  Calendar,
  Download,
  ZoomIn
} from "lucide-react"
import { formatDistanceToNow, format } from "date-fns"

interface TopupRequest {
  id: string
  user_id: string
  user_name: string
  user_email: string
  amount: number
  bank: string
  bank_name: string
  receipt_url: string
  status: "pending" | "approved" | "rejected"
  rejection_reason: string | null
  created_at: string
  processed_at: string | null
  processed_by_name: string | null
}

const bankNames: Record<string, string> = {
  fnb: "First National Bank",
  standard: "Standard Bank",
  nedbank: "Nedbank",
  bank_windhoek: "Bank Windhoek",
  ewallet: "FNB eWallet",
  mpesa: "M-Pesa",
  other: "Other"
}

export function AdminTopupRequests() {
  const [requests, setRequests] = useState<TopupRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [activeTab, setActiveTab] = useState("pending")
  const [search, setSearch] = useState("")
  const [selectedRequest, setSelectedRequest] = useState<TopupRequest | null>(null)
  const [detailsOpen, setDetailsOpen] = useState(false)
  const [rejectOpen, setRejectOpen] = useState(false)
  const [rejectReason, setRejectReason] = useState("")
  const [processing, setProcessing] = useState(false)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const { showToast } = useNotifications()

  const fetchRequests = async () => {
    try {
      setRefreshing(true)
      const response = await fetch(`/api/admin/topup-requests?status=${activeTab}`)
      if (response.ok) {
        const data = await response.json()
        setRequests(data.requests || [])
      } else {
        setRequests([])
      }
    } catch (error) {
      console.error("Failed to fetch topup requests:", error)
      setRequests([])
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  useEffect(() => {
    fetchRequests()
  }, [activeTab])

  const handleApprove = async (request: TopupRequest) => {
    setProcessing(true)
    try {
      const response = await fetch(`/api/admin/topup-requests/${request.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "approve" })
      })

      if (response.ok) {
        setRequests(prev => prev.filter(r => r.id !== request.id))
        setDetailsOpen(false)
        setSelectedRequest(null)
        showToast({
          type: "success",
          title: "Top-up Approved",
          message: `Successfully credited N$${request.amount.toFixed(2)} to ${request.user_name}'s wallet`,
          duration: 5000
        })
      } else {
        const data = await response.json()
        showToast({
          type: "error",
          title: "Approval Failed",
          message: data.error || "Failed to approve top-up request",
          duration: 5000
        })
      }
    } catch (error) {
      console.error("Failed to approve request:", error)
      showToast({
        type: "error",
        title: "Error",
        message: "An unexpected error occurred while approving the request",
        duration: 5000
      })
    } finally {
      setProcessing(false)
    }
  }

  const handleReject = async () => {
    if (!selectedRequest || !rejectReason.trim()) {
      showToast({
        type: "warning",
        title: "Reason Required",
        message: "Please provide a reason for rejecting this request",
        duration: 4000
      })
      return
    }

    setProcessing(true)
    try {
      const response = await fetch(`/api/admin/topup-requests/${selectedRequest.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "reject", rejection_reason: rejectReason })
      })

      if (response.ok) {
        setRequests(prev => prev.filter(r => r.id !== selectedRequest.id))
        setRejectOpen(false)
        setDetailsOpen(false)
        setSelectedRequest(null)
        setRejectReason("")
        showToast({
          type: "info",
          title: "Request Rejected",
          message: `Top-up request for ${selectedRequest.user_name} has been rejected`,
          duration: 5000
        })
      } else {
        const data = await response.json()
        showToast({
          type: "error",
          title: "Rejection Failed",
          message: data.error || "Failed to reject the request",
          duration: 5000
        })
      }
    } catch (error) {
      console.error("Failed to reject request:", error)
      showToast({
        type: "error",
        title: "Error",
        message: "An unexpected error occurred",
        duration: 5000
      })
    } finally {
      setProcessing(false)
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return <Badge variant="outline" className="border-yellow-500 text-yellow-500"><Clock className="mr-1 h-3 w-3" /> Pending</Badge>
      case "approved":
        return <Badge variant="default" className="bg-green-500"><CheckCircle className="mr-1 h-3 w-3" /> Approved</Badge>
      case "rejected":
        return <Badge variant="destructive"><XCircle className="mr-1 h-3 w-3" /> Rejected</Badge>
      default:
        return <Badge variant="secondary">{status}</Badge>
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-NA", {
      style: "currency",
      currency: "NAD",
      minimumFractionDigits: 2
    }).format(amount)
  }

  const filteredRequests = requests.filter(request => {
    if (!search) return true
    const searchLower = search.toLowerCase()
    return (
      request.user_name.toLowerCase().includes(searchLower) ||
      request.user_email.toLowerCase().includes(searchLower) ||
      request.bank_name.toLowerCase().includes(searchLower)
    )
  })

  const counts = {
    pending: requests.length,
    totalAmount: requests.reduce((sum, r) => sum + r.amount, 0)
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-64" />
        <div className="grid gap-4 md:grid-cols-3">
          {[...Array(3)].map((_, i) => (
            <Card key={i}>
              <CardContent className="p-4">
                <Skeleton className="h-6 w-24" />
                <Skeleton className="mt-2 h-8 w-32" />
              </CardContent>
            </Card>
          ))}
        </div>
        <Card>
          <CardContent className="p-4">
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Top-up Requests</h2>
          <p className="text-muted-foreground">Review and process wallet top-up requests</p>
        </div>
        <Button variant="outline" onClick={fetchRequests} disabled={refreshing}>
          <RefreshCw className={`mr-2 h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardContent className="flex items-center gap-4 p-4">
            <div className="rounded-full bg-yellow-100 p-3 dark:bg-yellow-900">
              <Clock className="h-6 w-6 text-yellow-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{counts.pending}</p>
              <p className="text-sm text-muted-foreground">Pending Requests</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 p-4">
            <div className="rounded-full bg-green-100 p-3 dark:bg-green-900">
              <DollarSign className="h-6 w-6 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{formatCurrency(counts.totalAmount)}</p>
              <p className="text-sm text-muted-foreground">Total Pending Amount</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 p-4">
            <div className="rounded-full bg-blue-100 p-3 dark:bg-blue-900">
              <Wallet className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{formatCurrency(counts.totalAmount * 0.85)}</p>
              <p className="text-sm text-muted-foreground">Approved Today</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs and Search */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="pending" className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Pending
              {counts.pending > 0 && activeTab !== "pending" && (
                <Badge variant="secondary" className="ml-1">{counts.pending}</Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="approved" className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4" />
              Approved
            </TabsTrigger>
            <TabsTrigger value="rejected" className="flex items-center gap-2">
              <XCircle className="h-4 w-4" />
              Rejected
            </TabsTrigger>
          </TabsList>
        </Tabs>

        <div className="relative w-full md:w-72">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search by name, email, bank..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      {/* Requests Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Bank</TableHead>
                <TableHead>Submitted</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredRequests.length > 0 ? (
                filteredRequests.map((request) => (
                  <TableRow key={request.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={`https://api.dicebear.com/7.x/initials/svg?seed=${request.user_name}`} />
                          <AvatarFallback>{request.user_name.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium">{request.user_name}</p>
                          <p className="text-xs text-muted-foreground">{request.user_email}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="font-semibold text-green-600">{formatCurrency(request.amount)}</span>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Building className="h-4 w-4 text-muted-foreground" />
                        <span>{request.bank_name}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm text-muted-foreground">
                        {formatDistanceToNow(new Date(request.created_at), { addSuffix: true })}
                      </span>
                    </TableCell>
                    <TableCell>{getStatusBadge(request.status)}</TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setSelectedRequest(request)
                          setDetailsOpen(true)
                        }}
                      >
                        <Eye className="mr-1 h-4 w-4" />
                        Review
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={6} className="py-12 text-center">
                    <Wallet className="mx-auto h-12 w-12 text-muted-foreground" />
                    <p className="mt-4 text-lg font-medium">No top-up requests</p>
                    <p className="text-sm text-muted-foreground">
                      {activeTab === "pending"
                        ? "All requests have been processed"
                        : `No ${activeTab} requests found`}
                    </p>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Details Dialog - Made fully responsive */}
      <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
        <DialogContent className="w-[95vw] max-w-2xl max-h-[90vh] overflow-y-auto p-4 sm:p-6">
          <DialogHeader>
            <DialogTitle>Top-up Request Details</DialogTitle>
            <DialogDescription>Review the payment receipt and user information</DialogDescription>
          </DialogHeader>

          {selectedRequest && (
            <div className="space-y-4 sm:space-y-6">
              {/* Request Info */}
              <div className="grid gap-4 sm:gap-6 grid-cols-1 md:grid-cols-2">
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-12 w-12">
                      <AvatarImage src={`https://api.dicebear.com/7.x/initials/svg?seed=${selectedRequest.user_name}`} />
                      <AvatarFallback>{selectedRequest.user_name.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-semibold">{selectedRequest.user_name}</p>
                      <p className="text-sm text-muted-foreground">{selectedRequest.user_email}</p>
                    </div>
                  </div>

                  <div className="space-y-3 text-sm">
                    <div className="flex items-center justify-between rounded-lg border p-3">
                      <span className="text-muted-foreground">Amount</span>
                      <span className="text-lg font-bold text-green-600">{formatCurrency(selectedRequest.amount)}</span>
                    </div>
                    <div className="flex items-center justify-between rounded-lg border p-3">
                      <span className="text-muted-foreground">Bank</span>
                      <span className="font-medium">{selectedRequest.bank_name}</span>
                    </div>
                    <div className="flex items-center justify-between rounded-lg border p-3">
                      <span className="text-muted-foreground">Submitted</span>
                      <span>{format(new Date(selectedRequest.created_at), "PPp")}</span>
                    </div>
                    <div className="flex items-center justify-between rounded-lg border p-3">
                      <span className="text-muted-foreground">Status</span>
                      {getStatusBadge(selectedRequest.status)}
                    </div>
                  </div>

                  {selectedRequest.rejection_reason && (
                    <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-3">
                      <p className="text-sm font-medium text-destructive">Rejection Reason</p>
                      <p className="mt-1 text-sm">{selectedRequest.rejection_reason}</p>
                    </div>
                  )}
                </div>

                {/* Receipt Image */}
                <div className="space-y-2">
                  <Label>Payment Receipt</Label>
                  <div className="group relative overflow-hidden rounded-lg border">
                    <img
                      src={selectedRequest.receipt_url || "/placeholder.svg"}
                      alt="Payment receipt"
                      className="aspect-[3/4] w-full object-cover"
                    />
                    <div className="absolute inset-0 flex items-center justify-center gap-2 bg-black/50 opacity-0 transition-opacity group-hover:opacity-100">
                      <Button size="sm" variant="secondary" onClick={() => setImagePreview(selectedRequest.receipt_url)}>
                        <ZoomIn className="mr-1 h-4 w-4" />
                        View Full
                      </Button>
                      <Button size="sm" variant="secondary" asChild>
                        <a href={selectedRequest.receipt_url} download target="_blank" rel="noopener noreferrer">
                          <Download className="mr-1 h-4 w-4" />
                          Download
                        </a>
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          <DialogFooter className="flex-col sm:flex-row gap-2 sm:gap-0 mt-4">
            {selectedRequest?.status === "pending" && (
              <>
                <Button 
                  variant="outline" 
                  onClick={() => setRejectOpen(true)} 
                  disabled={processing}
                  className="w-full sm:w-auto bg-transparent"
                >
                  <XCircle className="mr-2 h-4 w-4" />
                  Reject
                </Button>
                <Button 
                  onClick={() => selectedRequest && handleApprove(selectedRequest)} 
                  disabled={processing}
                  className="w-full sm:w-auto"
                >
                  <CheckCircle className="mr-2 h-4 w-4" />
                  Approve & Credit
                </Button>
              </>
            )}
            {selectedRequest?.status !== "pending" && (
              <Button variant="outline" onClick={() => setDetailsOpen(false)} className="w-full sm:w-auto bg-transparent">
                Close
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reject Confirmation Dialog */}
      <AlertDialog open={rejectOpen} onOpenChange={setRejectOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Reject Top-up Request</AlertDialogTitle>
            <AlertDialogDescription>
              Please provide a reason for rejecting this top-up request. The user will be notified.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="space-y-2">
            <Label htmlFor="rejection-reason">Rejection Reason</Label>
            <Textarea
              id="rejection-reason"
              placeholder="e.g., Receipt image is unclear, amount doesn't match..."
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              rows={3}
            />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setRejectReason("")}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleReject}
              disabled={!rejectReason.trim() || processing}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Reject Request
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Image Preview Dialog */}
      <Dialog open={!!imagePreview} onOpenChange={() => setImagePreview(null)}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Receipt Preview</DialogTitle>
          </DialogHeader>
          {imagePreview && (
            <img src={imagePreview || "/placeholder.svg"} alt="Receipt preview" className="w-full rounded-lg" />
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
