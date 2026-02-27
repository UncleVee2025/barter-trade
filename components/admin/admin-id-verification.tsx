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
  Shield,
  CheckCircle,
  XCircle,
  Clock,
  Search,
  RefreshCw,
  Eye,
  User,
  Phone,
  Mail,
  MapPin,
  Calendar,
  FileText,
  AlertTriangle,
  ZoomIn,
  Download
} from "lucide-react"
import { formatDistanceToNow } from "date-fns"

interface VerificationRequest {
  id: string
  userId?: string
  name: string
  email: string
  phone: string | null
  region: string
  town: string | null
  streetAddress?: string | null
  id_verification_status: "not_submitted" | "pending" | "approved" | "rejected"
  id_rejection_reason: string | null
  national_id_front: string | null
  national_id_back: string | null
  frontImage?: string | null
  backImage?: string | null
  status?: string
  rejectionReason?: string | null
  created_at: string
  updated_at: string
  user?: {
    name: string
    email: string
    phone: string | null
    region: string
    town: string | null
    streetAddress: string | null
  }
}

export function AdminIdVerification() {
  const [requests, setRequests] = useState<VerificationRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [activeTab, setActiveTab] = useState("pending")
  const [search, setSearch] = useState("")
  const [selectedRequest, setSelectedRequest] = useState<VerificationRequest | null>(null)
  const [detailsOpen, setDetailsOpen] = useState(false)
  const [rejectOpen, setRejectOpen] = useState(false)
  const [rejectReason, setRejectReason] = useState("")
  const [processing, setProcessing] = useState(false)
  const [imagePreview, setImagePreview] = useState<string | null>(null)

  const fetchRequests = async () => {
    try {
      setRefreshing(true)
      const response = await fetch(`/api/admin/verifications?status=${activeTab}`)
      if (response.ok) {
        const data = await response.json()
        // Transform API response to match component interface
        const transformedData = (data.verifications || []).map((v: Record<string, unknown>) => ({
          id: v.userId || v.id,
          name: v.user?.name || v.name,
          email: v.user?.email || v.email,
          phone: v.user?.phone || v.phone,
          region: v.user?.region || v.region,
          town: v.user?.town || v.town,
          id_verification_status: v.status || v.id_verification_status || "pending",
          id_rejection_reason: v.rejectionReason || v.id_rejection_reason,
          national_id_front: v.frontImage || v.national_id_front,
          national_id_back: v.backImage || v.national_id_back,
          created_at: v.createdAt || v.created_at,
          updated_at: v.updatedAt || v.updated_at
        }))
        setRequests(transformedData)
      } else {
        const errorData = await response.json().catch(() => ({}))
        console.error("Failed to fetch verifications:", errorData)
        setRequests([])
      }
    } catch (error) {
      console.error("Failed to fetch verifications:", error)
      setRequests([])
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  useEffect(() => {
    fetchRequests()
  }, [activeTab])

  const handleApprove = async (request: VerificationRequest) => {
    setProcessing(true)
    try {
      const response = await fetch(`/api/admin/verifications/${request.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "approve" })
      })

      if (response.ok) {
        setRequests(prev => prev.filter(r => r.id !== request.id))
        setDetailsOpen(false)
        setSelectedRequest(null)
      }
    } catch (error) {
      console.error("Failed to approve verification:", error)
    } finally {
      setProcessing(false)
    }
  }

  const handleReject = async () => {
    if (!selectedRequest || !rejectReason.trim()) return
    
    setProcessing(true)
    try {
      const response = await fetch(`/api/admin/verifications/${selectedRequest.id}`, {
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
      }
    } catch (error) {
      console.error("Failed to reject verification:", error)
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
        return <Badge variant="secondary">Not Submitted</Badge>
    }
  }

  const filteredRequests = requests.filter(request => {
    if (!search) return true
    const searchLower = search.toLowerCase()
    return (
      request.name.toLowerCase().includes(searchLower) ||
      request.email.toLowerCase().includes(searchLower) ||
      request.phone?.toLowerCase().includes(searchLower)
    )
  })

  const counts = {
    pending: requests.filter(r => r.id_verification_status === "pending").length,
    approved: requests.filter(r => r.id_verification_status === "approved").length,
    rejected: requests.filter(r => r.id_verification_status === "rejected").length
  }

  const RequestCard = ({ request }: { request: VerificationRequest }) => (
    <Card className="transition-shadow hover:shadow-md">
      <CardContent className="p-4">
        <div className="flex items-start gap-4">
          <Avatar className="h-12 w-12">
            <AvatarImage src={`https://api.dicebear.com/7.x/initials/svg?seed=${request.name}`} />
            <AvatarFallback>{request.name.charAt(0)}</AvatarFallback>
          </Avatar>
          <div className="flex-1 space-y-1">
            <div className="flex items-center justify-between">
              <p className="font-medium">{request.name}</p>
              {getStatusBadge(request.id_verification_status)}
            </div>
            <p className="text-sm text-muted-foreground">{request.email}</p>
            <div className="flex items-center gap-4 text-xs text-muted-foreground">
              {request.phone && (
                <span className="flex items-center gap-1">
                  <Phone className="h-3 w-3" />
                  {request.phone}
                </span>
              )}
              <span className="flex items-center gap-1">
                <MapPin className="h-3 w-3" />
                {request.town}, {request.region}
              </span>
            </div>
            <p className="text-xs text-muted-foreground">
              Submitted {formatDistanceToNow(new Date(request.created_at), { addSuffix: true })}
            </p>
          </div>
          <div className="flex gap-2">
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
          </div>
        </div>
      </CardContent>
    </Card>
  )

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-10 w-32" />
        </div>
        <div className="grid gap-4">
          {[...Array(5)].map((_, i) => (
            <Card key={i}>
              <CardContent className="p-4">
                <div className="flex items-start gap-4">
                  <Skeleton className="h-12 w-12 rounded-full" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-5 w-32" />
                    <Skeleton className="h-4 w-48" />
                    <Skeleton className="h-3 w-64" />
                  </div>
                  <Skeleton className="h-9 w-24" />
                </div>
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
          <h2 className="text-2xl font-bold tracking-tight">ID Verification</h2>
          <p className="text-muted-foreground">Review and manage user identity verification requests</p>
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
              <p className="text-sm text-muted-foreground">Pending Review</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 p-4">
            <div className="rounded-full bg-green-100 p-3 dark:bg-green-900">
              <CheckCircle className="h-6 w-6 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{counts.approved}</p>
              <p className="text-sm text-muted-foreground">Approved</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 p-4">
            <div className="rounded-full bg-red-100 p-3 dark:bg-red-900">
              <XCircle className="h-6 w-6 text-red-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{counts.rejected}</p>
              <p className="text-sm text-muted-foreground">Rejected</p>
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
              {counts.pending > 0 && (
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
            placeholder="Search by name, email, phone..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      {/* Request List */}
      <ScrollArea className="h-[600px]">
        <div className="space-y-3 pr-4">
          {filteredRequests.length > 0 ? (
            filteredRequests.map((request) => (
              <RequestCard key={request.id} request={request} />
            ))
          ) : (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Shield className="h-12 w-12 text-muted-foreground" />
                <p className="mt-4 text-lg font-medium">No verification requests</p>
                <p className="text-sm text-muted-foreground">
                  {activeTab === "pending"
                    ? "All verification requests have been processed"
                    : `No ${activeTab} verifications found`}
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </ScrollArea>

      {/* Details Dialog */}
      <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Verification Request Details</DialogTitle>
            <DialogDescription>Review the submitted documents and user information</DialogDescription>
          </DialogHeader>
          
          {selectedRequest && (
            <div className="space-y-6">
              {/* User Info */}
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-16 w-16">
                      <AvatarImage src={`https://api.dicebear.com/7.x/initials/svg?seed=${selectedRequest.name}`} />
                      <AvatarFallback>{selectedRequest.name.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="text-lg font-semibold">{selectedRequest.name}</p>
                      {getStatusBadge(selectedRequest.id_verification_status)}
                    </div>
                  </div>
                  
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4 text-muted-foreground" />
                      <span>{selectedRequest.email}</span>
                    </div>
                    {selectedRequest.phone && (
                      <div className="flex items-center gap-2">
                        <Phone className="h-4 w-4 text-muted-foreground" />
                        <span>{selectedRequest.phone}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-muted-foreground" />
                      <span>{selectedRequest.town}, {selectedRequest.region}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span>Submitted {formatDistanceToNow(new Date(selectedRequest.created_at), { addSuffix: true })}</span>
                    </div>
                  </div>
                </div>

                {selectedRequest.id_rejection_reason && (
                  <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4">
                    <div className="flex items-center gap-2 text-destructive">
                      <AlertTriangle className="h-5 w-5" />
                      <span className="font-medium">Rejection Reason</span>
                    </div>
                    <p className="mt-2 text-sm">{selectedRequest.id_rejection_reason}</p>
                  </div>
                )}
              </div>

              {/* ID Documents */}
              <div className="space-y-4">
                <h4 className="font-medium">Submitted Documents</h4>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label>National ID - Front</Label>
                    <div className="group relative overflow-hidden rounded-lg border">
                      {selectedRequest.national_id_front ? (
                        <>
                          <img
                            src={selectedRequest.national_id_front || "/placeholder.svg"}
                            alt="ID Front"
                            className="aspect-video w-full object-cover"
                          />
                          <div className="absolute inset-0 flex items-center justify-center gap-2 bg-black/50 opacity-0 transition-opacity group-hover:opacity-100">
                            <Button size="sm" variant="secondary" onClick={() => setImagePreview(selectedRequest.national_id_front)}>
                              <ZoomIn className="mr-1 h-4 w-4" />
                              View
                            </Button>
                            <Button size="sm" variant="secondary" asChild>
                              <a href={selectedRequest.national_id_front} download target="_blank" rel="noopener noreferrer">
                                <Download className="mr-1 h-4 w-4" />
                                Download
                              </a>
                            </Button>
                          </div>
                        </>
                      ) : (
                        <div className="flex aspect-video items-center justify-center bg-muted">
                          <FileText className="h-12 w-12 text-muted-foreground" />
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>National ID - Back</Label>
                    <div className="group relative overflow-hidden rounded-lg border">
                      {selectedRequest.national_id_back ? (
                        <>
                          <img
                            src={selectedRequest.national_id_back || "/placeholder.svg"}
                            alt="ID Back"
                            className="aspect-video w-full object-cover"
                          />
                          <div className="absolute inset-0 flex items-center justify-center gap-2 bg-black/50 opacity-0 transition-opacity group-hover:opacity-100">
                            <Button size="sm" variant="secondary" onClick={() => setImagePreview(selectedRequest.national_id_back)}>
                              <ZoomIn className="mr-1 h-4 w-4" />
                              View
                            </Button>
                            <Button size="sm" variant="secondary" asChild>
                              <a href={selectedRequest.national_id_back} download target="_blank" rel="noopener noreferrer">
                                <Download className="mr-1 h-4 w-4" />
                                Download
                              </a>
                            </Button>
                          </div>
                        </>
                      ) : (
                        <div className="flex aspect-video items-center justify-center bg-muted">
                          <FileText className="h-12 w-12 text-muted-foreground" />
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          <DialogFooter>
            {selectedRequest?.id_verification_status === "pending" && (
              <>
                <Button variant="outline" onClick={() => setRejectOpen(true)} disabled={processing}>
                  <XCircle className="mr-2 h-4 w-4" />
                  Reject
                </Button>
                <Button onClick={() => selectedRequest && handleApprove(selectedRequest)} disabled={processing}>
                  <CheckCircle className="mr-2 h-4 w-4" />
                  Approve
                </Button>
              </>
            )}
            {selectedRequest?.id_verification_status !== "pending" && (
              <Button variant="outline" onClick={() => setDetailsOpen(false)}>
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
            <AlertDialogTitle>Reject Verification</AlertDialogTitle>
            <AlertDialogDescription>
              Please provide a reason for rejecting this verification request. The user will be notified.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="space-y-2">
            <Label htmlFor="rejection-reason">Rejection Reason</Label>
            <Textarea
              id="rejection-reason"
              placeholder="Enter the reason for rejection..."
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
              Reject Verification
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Image Preview Dialog */}
      <Dialog open={!!imagePreview} onOpenChange={() => setImagePreview(null)}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Document Preview</DialogTitle>
          </DialogHeader>
          {imagePreview && (
            <img src={imagePreview || "/placeholder.svg"} alt="Document preview" className="w-full rounded-lg" />
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
