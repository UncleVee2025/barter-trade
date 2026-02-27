"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import useSWR from "swr"
import {
  Search,
  Filter,
  MoreVertical,
  Eye,
  Ban,
  CheckCircle,
  Mail,
  UserCog,
  Download,
  ChevronLeft,
  ChevronRight,
  Plus,
  Loader2,
  Wallet,
  Package,
  RefreshCw,
  XCircle,
  ShieldCheck,
  Shield,
  UserX,
  Edit,
  Trash2,
  Send,
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
  DialogTrigger,
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
import { NAMIBIA_REGIONS } from "@/lib/types"

interface User {
  id: string
  email: string
  name: string
  phone: string | null
  region: string
  town: string | null
  avatar: string | null
  role: "user" | "admin"
  walletBalance: number
  isVerified: boolean
  isBanned: boolean
  banReason: string | null
  lastSeen: string
  createdAt: string
  listingCount: number
  tradeCount: number
}

interface UsersResponse {
  users: User[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
    hasMore: boolean
  }
}

const fetcher = (url: string) => fetch(url).then((res) => res.json())

const statusColors = {
  active: "bg-green-500/10 text-green-500 border-green-500/20",
  banned: "bg-red-500/10 text-red-500 border-red-500/20",
  unverified: "bg-yellow-500/10 text-yellow-500 border-yellow-500/20",
}

const roleColors = {
  admin: "bg-purple-500/10 text-purple-500 border-purple-500/20",
  user: "bg-blue-500/10 text-blue-500 border-blue-500/20",
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr)
  return date.toLocaleDateString("en-NA", {
    month: "short",
    day: "numeric",
    year: "numeric",
  })
}

function getTimeAgo(dateStr: string): string {
  const date = new Date(dateStr)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / (1000 * 60))
  
  if (diffMins < 1) return "Just now"
  if (diffMins < 60) return `${diffMins}m ago`
  
  const diffHours = Math.floor(diffMins / 60)
  if (diffHours < 24) return `${diffHours}h ago`
  
  const diffDays = Math.floor(diffHours / 24)
  if (diffDays < 7) return `${diffDays}d ago`
  
  return formatDate(dateStr)
}

export function AdminUsers() {
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [roleFilter, setRoleFilter] = useState("all")
  const [regionFilter, setRegionFilter] = useState("")
  const [sortBy, setSortBy] = useState("newest")
  const [page, setPage] = useState(1)
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [isViewModalOpen, setIsViewModalOpen] = useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [isBanDialogOpen, setIsBanDialogOpen] = useState(false)
  const [isAdjustWalletOpen, setIsAdjustWalletOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [isSendMessageOpen, setIsSendMessageOpen] = useState(false)
  const [messageContent, setMessageContent] = useState("")
  const [banReason, setBanReason] = useState("")
  const [walletAdjustment, setWalletAdjustment] = useState({ amount: "", type: "add", description: "" })
  const [isProcessing, setIsProcessing] = useState(false)
  const { showToast } = useNotifications()

  // New user form state
  const [newUser, setNewUser] = useState({
    email: "",
    name: "",
    phone: "",
    region: "",
    password: "",
    role: "user",
  })

  // Edit user form state
  const [editForm, setEditForm] = useState({
    name: "",
    phone: "",
    region: "",
    role: "user",
  })
  
  // Password reset state
  const [isResetPasswordOpen, setIsResetPasswordOpen] = useState(false)
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")

  const buildApiUrl = () => {
    const params = new URLSearchParams()
    params.set("page", page.toString())
    params.set("limit", "20")
    params.set("sort", sortBy)
    if (search) params.set("search", search)
    if (statusFilter !== "all") params.set("status", statusFilter)
    if (roleFilter !== "all") params.set("role", roleFilter)
    if (regionFilter) params.set("region", regionFilter)
    return `/api/admin/users?${params.toString()}`
  }

  const { data, error, isLoading, mutate } = useSWR<UsersResponse>(
    buildApiUrl(),
    fetcher,
    { refreshInterval: 30000 }
  )

  const users = data?.users || []
  const pagination = data?.pagination || { page: 1, limit: 20, total: 0, totalPages: 1, hasMore: false }

  const handleCreateUser = async () => {
    if (!newUser.email || !newUser.name || !newUser.region || !newUser.password) {
      showToast({ type: "error", title: "Validation Error", message: "Please fill all required fields", duration: 3000 })
      return
    }

    setIsProcessing(true)
    try {
      const response = await fetch("/api/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newUser),
      })

      const result = await response.json()
      if (!response.ok) throw new Error(result.error)

      showToast({ type: "success", title: "User Created", message: "New user has been created successfully", duration: 3000 })
      setIsCreateModalOpen(false)
      setNewUser({ email: "", name: "", phone: "", region: "", password: "", role: "user" })
      mutate()
    } catch (error) {
      showToast({ type: "error", title: "Creation Failed", message: error instanceof Error ? error.message : "Failed to create user", duration: 5000 })
    } finally {
      setIsProcessing(false)
    }
  }

  const handleUpdateUser = async () => {
    if (!selectedUser) return

    setIsProcessing(true)
    try {
      const response = await fetch(`/api/admin/users/${selectedUser.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editForm),
      })

      const result = await response.json()
      if (!response.ok) throw new Error(result.error)

      showToast({ type: "success", title: "User Updated", message: "User details have been updated", duration: 3000 })
      setIsEditModalOpen(false)
      mutate()
    } catch (error) {
      showToast({ type: "error", title: "Update Failed", message: error instanceof Error ? error.message : "Failed to update user", duration: 5000 })
    } finally {
      setIsProcessing(false)
    }
  }

  const handleBanUser = async () => {
    if (!selectedUser) return

    setIsProcessing(true)
    try {
      const action = selectedUser.isBanned ? "unban" : "ban"
      const response = await fetch(`/api/admin/users/${selectedUser.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action,
          banReason: action === "ban" ? banReason : null,
        }),
      })

      const result = await response.json()
      if (!response.ok) throw new Error(result.error)

      showToast({
        type: "success",
        title: selectedUser.isBanned ? "User Unbanned" : "User Banned",
        message: result.message,
        duration: 3000,
      })
      setIsBanDialogOpen(false)
      setBanReason("")
      mutate()
    } catch (error) {
      showToast({ type: "error", title: "Action Failed", message: error instanceof Error ? error.message : "Failed to process action", duration: 5000 })
    } finally {
      setIsProcessing(false)
    }
  }

  const handleAdjustWallet = async () => {
    if (!selectedUser || !walletAdjustment.amount) return

    const amountValue = Number.parseFloat(walletAdjustment.amount)
    if (isNaN(amountValue) || amountValue <= 0) {
      showToast({ type: "error", title: "Invalid Amount", message: "Please enter a valid positive amount", duration: 3000 })
      return
    }

    // Calculate what the new balance would be
    const adjustedAmount = walletAdjustment.type === "add" ? amountValue : -amountValue
    const expectedNewBalance = selectedUser.walletBalance + adjustedAmount
    
    if (expectedNewBalance < 0) {
      showToast({ 
        type: "error", 
        title: "Insufficient Balance", 
        message: `Cannot deduct N$${amountValue.toFixed(2)} from wallet with N$${selectedUser.walletBalance.toFixed(2)} balance`, 
        duration: 5000 
      })
      return
    }

    setIsProcessing(true)
    try {
      const response = await fetch("/api/admin/transactions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: selectedUser.id,
          type: walletAdjustment.type === "add" ? "topup" : "deduction",
          amount: adjustedAmount,
          description: walletAdjustment.description || `Admin wallet ${walletAdjustment.type === "add" ? "credit" : "debit"}`,
        }),
      })

      const result = await response.json()
      if (!response.ok) throw new Error(result.error || "Failed to process adjustment")

      showToast({
        type: "success",
        title: "Wallet Adjusted Successfully",
        message: result.message || `N$${amountValue.toFixed(2)} ${walletAdjustment.type === "add" ? "added to" : "deducted from"} ${selectedUser.name}'s wallet. New balance: N$${(result.newBalance || expectedNewBalance).toFixed(2)}`,
        duration: 5000,
      })
      setIsAdjustWalletOpen(false)
      setWalletAdjustment({ amount: "", type: "add", description: "" })
      // Refresh user list to show updated balance
      mutate()
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Failed to adjust wallet"
      showToast({ 
        type: "error", 
        title: "Adjustment Failed", 
        message: errorMessage, 
        duration: 5000 
      })
    } finally {
      setIsProcessing(false)
    }
  }

  const handleDeleteUser = async () => {
    if (!selectedUser) return

    setIsProcessing(true)
    try {
      const response = await fetch(`/api/admin/users/${selectedUser.id}`, {
        method: "DELETE",
      })

      const result = await response.json()
      if (!response.ok) throw new Error(result.error)

      showToast({
        type: "success",
        title: "User Deleted",
        message: `${selectedUser.name} has been permanently deleted`,
        duration: 4000,
      })
      setIsDeleteDialogOpen(false)
      setSelectedUser(null)
      mutate()
    } catch (error) {
      showToast({
        type: "error",
        title: "Deletion Failed",
        message: error instanceof Error ? error.message : "Failed to delete user",
        duration: 5000,
      })
    } finally {
      setIsProcessing(false)
    }
  }

  const handleSendMessage = async () => {
    if (!selectedUser || !messageContent.trim()) return

    setIsProcessing(true)
    try {
      const response = await fetch("/api/admin/notifications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: selectedUser.id,
          type: "system",
          title: "Message from Admin",
          message: messageContent,
        }),
      })

      const result = await response.json()
      if (!response.ok) throw new Error(result.error)

      showToast({
        type: "success",
        title: "Message Sent",
        message: `Notification sent to ${selectedUser.name}`,
        duration: 3000,
      })
      setIsSendMessageOpen(false)
      setMessageContent("")
    } catch (error) {
      showToast({
        type: "error",
        title: "Send Failed",
        message: error instanceof Error ? error.message : "Failed to send message",
        duration: 5000,
      })
    } finally {
      setIsProcessing(false)
    }
  }

  const handleResetPassword = async () => {
    if (!selectedUser) return

    if (newPassword.length < 8) {
      showToast({ type: "error", title: "Password Error", message: "Password must be at least 8 characters", duration: 3000 })
      return
    }

    if (newPassword !== confirmPassword) {
      showToast({ type: "error", title: "Password Mismatch", message: "Passwords do not match", duration: 3000 })
      return
    }

    setIsProcessing(true)
    try {
      const response = await fetch(`/api/admin/users/${selectedUser.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ newPassword }),
      })

      const result = await response.json()
      if (!response.ok) throw new Error(result.error)

      showToast({ type: "success", title: "Password Reset", message: `Password for ${selectedUser.name} has been reset successfully`, duration: 4000 })
      setIsResetPasswordOpen(false)
      setNewPassword("")
      setConfirmPassword("")
    } catch (error) {
      showToast({ type: "error", title: "Reset Failed", message: error instanceof Error ? error.message : "Failed to reset password", duration: 5000 })
    } finally {
      setIsProcessing(false)
    }
  }

  const openResetPasswordDialog = (user: User) => {
    setSelectedUser(user)
    setNewPassword("")
    setConfirmPassword("")
    setIsResetPasswordOpen(true)
  }

  const openEditModal = (user: User) => {
    setSelectedUser(user)
    setEditForm({
      name: user.name,
      phone: user.phone || "",
      region: user.region,
      role: user.role,
    })
    setIsEditModalOpen(true)
  }

  const openDeleteDialog = (user: User) => {
    setSelectedUser(user)
    setIsDeleteDialogOpen(true)
  }

  const openSendMessage = (user: User) => {
    setSelectedUser(user)
    setMessageContent("")
    setIsSendMessageOpen(true)
  }

  const openViewModal = (user: User) => {
    setSelectedUser(user)
    setIsViewModalOpen(true)
  }

  const openBanDialog = (user: User) => {
    setSelectedUser(user)
    setIsBanDialogOpen(true)
  }

  const openWalletAdjust = (user: User) => {
    setSelectedUser(user)
    setIsAdjustWalletOpen(true)
  }

  const getUserStatus = (user: User) => {
    if (user.isBanned) return "banned"
    if (!user.isVerified) return "unverified"
    return "active"
  }

  // Stats - with defensive null checks
  const totalUsers = pagination?.total ?? 0
  const activeUsers = (users || []).filter(u => !u?.isBanned).length
  const adminCount = (users || []).filter(u => u?.role === "admin").length

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">User Management</h1>
          <p className="text-muted-foreground">
            {(totalUsers || 0).toLocaleString()} registered users
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="rounded-xl bg-transparent" onClick={() => mutate()}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
            <DialogTrigger asChild>
              <Button className="rounded-xl">
                <Plus className="h-4 w-4 mr-2" />
                Add User
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Create New User</DialogTitle>
                <DialogDescription>Add a new user to the platform</DialogDescription>
              </DialogHeader>
              <div className="space-y-4 mt-4">
                <div>
                  <Label>Email *</Label>
                  <Input
                    type="email"
                    value={newUser.email}
                    onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                    placeholder="user@example.com"
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label>Full Name *</Label>
                  <Input
                    value={newUser.name}
                    onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
                    placeholder="John Doe"
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label>Phone</Label>
                  <Input
                    value={newUser.phone}
                    onChange={(e) => setNewUser({ ...newUser, phone: e.target.value })}
                    placeholder="+264 81 123 4567"
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label>Region *</Label>
                  <Select value={newUser.region} onValueChange={(v) => setNewUser({ ...newUser, region: v })}>
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="Select region" />
                    </SelectTrigger>
                    <SelectContent>
                      {NAMIBIA_REGIONS.map(region => (
                        <SelectItem key={region} value={region}>{region}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Password *</Label>
                  <Input
                    type="password"
                    value={newUser.password}
                    onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                    placeholder="Minimum 8 characters"
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label>Role</Label>
                  <Select value={newUser.role} onValueChange={(v) => setNewUser({ ...newUser, role: v })}>
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="user">User</SelectItem>
                      <SelectItem value="admin">Admin</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <DialogFooter className="mt-6">
                <Button variant="outline" onClick={() => setIsCreateModalOpen(false)} className="bg-transparent">
                  Cancel
                </Button>
                <Button onClick={handleCreateUser} disabled={isProcessing}>
                  {isProcessing ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Plus className="h-4 w-4 mr-2" />}
                  Create User
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Total Users", value: totalUsers, color: "text-foreground" },
          { label: "Active Users", value: activeUsers, color: "text-green-500" },
          { label: "Admins", value: adminCount, color: "text-purple-500" },
          { label: "This Page", value: users.length, color: "text-blue-500" },
        ].map((stat, i) => (
          <Card key={stat.label} className="bg-card border-border">
            <CardContent className="p-4">
              <p className={cn("text-2xl font-bold", stat.color)}>{stat.value}</p>
              <p className="text-sm text-muted-foreground">{stat.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-col lg:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by name, email, or phone..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1) }}
            className="pl-10 bg-muted border-0 rounded-xl"
          />
        </div>
        <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setPage(1) }}>
          <SelectTrigger className="w-full lg:w-36 bg-muted border-0 rounded-xl">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="banned">Banned</SelectItem>
          </SelectContent>
        </Select>
        <Select value={roleFilter} onValueChange={(v) => { setRoleFilter(v); setPage(1) }}>
          <SelectTrigger className="w-full lg:w-32 bg-muted border-0 rounded-xl">
            <SelectValue placeholder="Role" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Roles</SelectItem>
            <SelectItem value="user">Users</SelectItem>
            <SelectItem value="admin">Admins</SelectItem>
          </SelectContent>
        </Select>
        <Select value={sortBy} onValueChange={(v) => { setSortBy(v); setPage(1) }}>
          <SelectTrigger className="w-full lg:w-36 bg-muted border-0 rounded-xl">
            <SelectValue placeholder="Sort" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="newest">Newest First</SelectItem>
            <SelectItem value="oldest">Oldest First</SelectItem>
            <SelectItem value="name">By Name</SelectItem>
            <SelectItem value="balance_high">Balance (High)</SelectItem>
            <SelectItem value="last_active">Last Active</SelectItem>
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
            <p className="text-muted-foreground">Failed to load users</p>
            <Button variant="outline" size="sm" className="mt-4 bg-transparent" onClick={() => mutate()}>
              Try Again
            </Button>
          </div>
        ) : users.length === 0 ? (
          <div className="p-12 text-center">
            <UserX className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
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
                    <th className="text-left p-4 font-medium text-muted-foreground">Region</th>
                    <th className="text-left p-4 font-medium text-muted-foreground">Status</th>
                    <th className="text-left p-4 font-medium text-muted-foreground">Role</th>
                    <th className="text-left p-4 font-medium text-muted-foreground">Wallet</th>
                    <th className="text-left p-4 font-medium text-muted-foreground">Activity</th>
                    <th className="text-left p-4 font-medium text-muted-foreground">Last Seen</th>
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
                              <AvatarImage src={user.avatar || undefined} alt={user.name} />
                              <AvatarFallback className="bg-primary/10 text-primary">
                                {user.name.split(" ").map((n) => n[0]).join("").toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="font-medium text-foreground">{user.name}</p>
                              <p className="text-sm text-muted-foreground">{user.email}</p>
                            </div>
                          </div>
                        </td>
                        <td className="p-4 text-foreground">{user.region}</td>
                        <td className="p-4">
                          <Badge
                            variant="outline"
                            className={cn("capitalize", statusColors[getUserStatus(user)])}
                          >
                            {getUserStatus(user)}
                          </Badge>
                        </td>
                        <td className="p-4">
                          <Badge
                            variant="outline"
                            className={cn("capitalize", roleColors[user.role])}
                          >
                            {user.role === "admin" ? <Shield className="h-3 w-3 mr-1" /> : null}
                            {user.role}
                          </Badge>
                        </td>
                        <td className="p-4">
                          <span className="font-medium text-green-500">
                            N${user.walletBalance.toLocaleString()}
                          </span>
                        </td>
                        <td className="p-4">
                          <div className="flex items-center gap-3 text-sm">
                            <span className="flex items-center gap-1 text-muted-foreground">
                              <Package className="h-3 w-3" /> {user.listingCount}
                            </span>
                            <span className="flex items-center gap-1 text-muted-foreground">
                              <RefreshCw className="h-3 w-3" /> {user.tradeCount}
                            </span>
                          </div>
                        </td>
                        <td className="p-4 text-muted-foreground text-sm">
                          {getTimeAgo(user.lastSeen)}
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
                              <DropdownMenuItem onClick={() => openEditModal(user)}>
                                <Edit className="h-4 w-4 mr-2" />
                                Edit User
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => openResetPasswordDialog(user)}>
                                <UserCog className="h-4 w-4 mr-2" />
                                Reset Password
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => openWalletAdjust(user)}>
                                <Wallet className="h-4 w-4 mr-2" />
                                Adjust Wallet
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem onClick={() => openSendMessage(user)}>
                                <Send className="h-4 w-4 mr-2" />
                                Send Message
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem onClick={() => openBanDialog(user)} className={user.isBanned ? "text-green-500" : "text-red-500"}>
                                {user.isBanned ? <CheckCircle className="h-4 w-4 mr-2" /> : <Ban className="h-4 w-4 mr-2" />}
                                {user.isBanned ? "Unban User" : "Ban User"}
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => openDeleteDialog(user)} className="text-red-500">
                                <Trash2 className="h-4 w-4 mr-2" />
                                Delete User
                              </DropdownMenuItem>
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
                {[...Array(Math.min(5, pagination.totalPages))].map((_, i) => {
                  const pageNum = i + 1
                  return (
                    <Button
                      key={pageNum}
                      variant="outline"
                      size="sm"
                      className={cn("h-8 px-3", page === pageNum ? "bg-primary text-primary-foreground" : "bg-transparent")}
                      onClick={() => setPage(pageNum)}
                    >
                      {pageNum}
                    </Button>
                  )
                })}
                {pagination.totalPages > 5 && <span className="text-muted-foreground">...</span>}
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
            <DialogTitle>User Details</DialogTitle>
          </DialogHeader>
          {selectedUser && (
            <div className="space-y-4 mt-4">
              <div className="flex items-center gap-4">
                <Avatar className="h-16 w-16">
                  <AvatarImage src={selectedUser.avatar || undefined} alt={selectedUser.name} />
                  <AvatarFallback className="bg-primary/10 text-primary text-xl">
                    {selectedUser.name.split(" ").map((n) => n[0]).join("").toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="text-lg font-bold text-foreground">{selectedUser.name}</p>
                  <p className="text-muted-foreground">{selectedUser.email}</p>
                  <div className="flex gap-2 mt-2">
                    <Badge variant="outline" className={statusColors[getUserStatus(selectedUser)]}>
                      {getUserStatus(selectedUser)}
                    </Badge>
                    <Badge variant="outline" className={roleColors[selectedUser.role]}>
                      {selectedUser.role}
                    </Badge>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 pt-4 border-t border-border">
                <div>
                  <p className="text-sm text-muted-foreground">Phone</p>
                  <p className="font-medium text-foreground">{selectedUser.phone || "Not provided"}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Region</p>
                  <p className="font-medium text-foreground">{selectedUser.region}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Wallet Balance</p>
                  <p className="font-medium text-green-500">N${selectedUser.walletBalance.toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Member Since</p>
                  <p className="font-medium text-foreground">{formatDate(selectedUser.createdAt)}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Listings</p>
                  <p className="font-medium text-foreground">{selectedUser.listingCount}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Trades</p>
                  <p className="font-medium text-foreground">{selectedUser.tradeCount}</p>
                </div>
              </div>

              {selectedUser.isBanned && selectedUser.banReason && (
                <div className="p-3 bg-red-500/10 rounded-lg border border-red-500/20">
                  <p className="text-sm text-red-500 font-medium">Ban Reason</p>
                  <p className="text-sm text-foreground mt-1">{selectedUser.banReason}</p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Edit User Modal */}
      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Edit User</DialogTitle>
            <DialogDescription>Update user information</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <div>
              <Label>Full Name</Label>
              <Input
                value={editForm.name}
                onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                className="mt-1"
              />
            </div>
            <div>
              <Label>Phone</Label>
              <Input
                value={editForm.phone}
                onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                className="mt-1"
              />
            </div>
            <div>
              <Label>Region</Label>
              <Select value={editForm.region} onValueChange={(v) => setEditForm({ ...editForm, region: v })}>
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {NAMIBIA_REGIONS.map(region => (
                    <SelectItem key={region} value={region}>{region}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Role</Label>
              <Select value={editForm.role} onValueChange={(v) => setEditForm({ ...editForm, role: v })}>
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="user">User</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter className="mt-6">
            <Button variant="outline" onClick={() => setIsEditModalOpen(false)} className="bg-transparent">
              Cancel
            </Button>
            <Button onClick={handleUpdateUser} disabled={isProcessing}>
              {isProcessing ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <CheckCircle className="h-4 w-4 mr-2" />}
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Ban/Unban Dialog */}
      <AlertDialog open={isBanDialogOpen} onOpenChange={setIsBanDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {selectedUser?.isBanned ? "Unban User" : "Ban User"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {selectedUser?.isBanned
                ? `Are you sure you want to unban ${selectedUser?.name}? They will regain access to their account.`
                : `Are you sure you want to ban ${selectedUser?.name}? They will lose access to their account.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          {!selectedUser?.isBanned && (
            <div className="my-4">
              <Label>Ban Reason</Label>
              <Textarea
                value={banReason}
                onChange={(e) => setBanReason(e.target.value)}
                placeholder="Provide a reason for the ban..."
                className="mt-1"
              />
            </div>
          )}
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleBanUser}
              disabled={isProcessing}
              className={selectedUser?.isBanned ? "bg-green-500 hover:bg-green-600" : "bg-red-500 hover:bg-red-600"}
            >
              {isProcessing ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
              {selectedUser?.isBanned ? "Unban" : "Ban"} User
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Wallet Adjustment Dialog */}
      <Dialog open={isAdjustWalletOpen} onOpenChange={setIsAdjustWalletOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Adjust Wallet Balance</DialogTitle>
            <DialogDescription>
              Adjusting credit balance for {selectedUser?.name}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            {/* Current Balance Display */}
            <div className="p-4 bg-muted/50 rounded-lg border border-border">
              <p className="text-sm text-muted-foreground">Current Balance</p>
              <p className="text-2xl font-bold text-green-500">
                N$ {selectedUser?.walletBalance?.toLocaleString("en-NA", { minimumFractionDigits: 2 }) || "0.00"}
              </p>
            </div>

            <div>
              <Label>Adjustment Type</Label>
              <Select value={walletAdjustment.type} onValueChange={(v) => setWalletAdjustment({ ...walletAdjustment, type: v })}>
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="add">Add Credit</SelectItem>
                  <SelectItem value="deduct">Deduct Credit</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Amount (N$)</Label>
              <Input
                type="number"
                min="0"
                step="0.01"
                value={walletAdjustment.amount}
                onChange={(e) => setWalletAdjustment({ ...walletAdjustment, amount: e.target.value })}
                placeholder="0.00"
                className="mt-1"
              />
            </div>

            {/* New Balance Preview */}
            {walletAdjustment.amount && Number(walletAdjustment.amount) > 0 && selectedUser && (
              <div className={cn(
                "p-4 rounded-lg border",
                walletAdjustment.type === "add" 
                  ? "bg-green-500/10 border-green-500/20" 
                  : "bg-orange-500/10 border-orange-500/20"
              )}>
                <p className="text-sm text-muted-foreground">New Balance After Adjustment</p>
                <p className={cn("text-2xl font-bold", walletAdjustment.type === "add" ? "text-green-500" : "text-orange-500")}>
                  N$ {(
                    selectedUser.walletBalance + 
                    (walletAdjustment.type === "add" ? Number(walletAdjustment.amount) : -Number(walletAdjustment.amount))
                  ).toLocaleString("en-NA", { minimumFractionDigits: 2 })}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {walletAdjustment.type === "add" ? "+" : "-"}N${Number(walletAdjustment.amount).toLocaleString("en-NA", { minimumFractionDigits: 2 })} adjustment
                </p>
                {walletAdjustment.type === "deduct" && 
                 selectedUser.walletBalance - Number(walletAdjustment.amount) < 0 && (
                  <p className="text-xs text-red-500 mt-2 font-medium">
                    Warning: This would result in a negative balance
                  </p>
                )}
              </div>
            )}

            <div>
              <Label>Description (optional)</Label>
              <Textarea
                value={walletAdjustment.description}
                onChange={(e) => setWalletAdjustment({ ...walletAdjustment, description: e.target.value })}
                placeholder="Reason for adjustment (will be visible to user)..."
                className="mt-1"
              />
            </div>
          </div>
          <DialogFooter className="mt-6">
            <Button variant="outline" onClick={() => setIsAdjustWalletOpen(false)} className="bg-transparent">
              Cancel
            </Button>
            <Button 
              onClick={handleAdjustWallet} 
              disabled={
                isProcessing || 
                !walletAdjustment.amount || 
                Number(walletAdjustment.amount) <= 0 ||
                (walletAdjustment.type === "deduct" && selectedUser && selectedUser.walletBalance - Number(walletAdjustment.amount) < 0)
              }
              className={walletAdjustment.type === "add" ? "bg-green-600 hover:bg-green-700" : "bg-orange-600 hover:bg-orange-700"}
            >
              {isProcessing ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Wallet className="h-4 w-4 mr-2" />}
              {walletAdjustment.type === "add" ? "Add" : "Deduct"} N${Number(walletAdjustment.amount || 0).toLocaleString("en-NA", { minimumFractionDigits: 2 })}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete User Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="text-red-500">Delete User Permanently</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete <span className="font-semibold">{selectedUser?.name}</span>? 
              This will permanently remove their account, all listings, transactions, and associated data. 
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteUser}
              disabled={isProcessing}
              className="bg-red-500 hover:bg-red-600"
            >
              {isProcessing ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Trash2 className="h-4 w-4 mr-2" />}
              Delete Permanently
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Send Message Dialog */}
      <Dialog open={isSendMessageOpen} onOpenChange={setIsSendMessageOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Send Message to User</DialogTitle>
            <DialogDescription>
              Send a notification message to {selectedUser?.name}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <div>
              <Label>Message</Label>
              <Textarea
                value={messageContent}
                onChange={(e) => setMessageContent(e.target.value)}
                placeholder="Enter your message to the user..."
                className="mt-1"
                rows={4}
              />
            </div>
          </div>
          <DialogFooter className="mt-6">
            <Button variant="outline" onClick={() => setIsSendMessageOpen(false)} className="bg-transparent">
              Cancel
            </Button>
            <Button onClick={handleSendMessage} disabled={isProcessing || !messageContent.trim()}>
              {isProcessing ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Send className="h-4 w-4 mr-2" />}
              Send Message
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reset Password Dialog */}
      <Dialog open={isResetPasswordOpen} onOpenChange={setIsResetPasswordOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Reset User Password</DialogTitle>
            <DialogDescription>
              Set a new password for {selectedUser?.name} ({selectedUser?.email})
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <div>
              <Label>New Password</Label>
              <Input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Enter new password (min 8 characters)"
                className="mt-1"
              />
            </div>
            <div>
              <Label>Confirm Password</Label>
              <Input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm new password"
                className="mt-1"
              />
              {confirmPassword && newPassword !== confirmPassword && (
                <p className="text-xs text-red-500 mt-1">Passwords do not match</p>
              )}
            </div>
            {newPassword && newPassword.length < 8 && (
              <p className="text-xs text-amber-500">Password must be at least 8 characters</p>
            )}
          </div>
          <DialogFooter className="mt-6">
            <Button variant="outline" onClick={() => setIsResetPasswordOpen(false)} className="bg-transparent">
              Cancel
            </Button>
            <Button 
              onClick={handleResetPassword} 
              disabled={isProcessing || newPassword.length < 8 || newPassword !== confirmPassword}
            >
              {isProcessing ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <UserCog className="h-4 w-4 mr-2" />}
              Reset Password
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
