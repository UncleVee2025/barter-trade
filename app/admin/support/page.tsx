"use client"

import React from "react"

import { useState } from "react"
import { motion } from "framer-motion"
import useSWR from "swr"
import {
  Search,
  Ticket,
  Phone,
  User,
  Calendar,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Store,
  Loader2,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { cn } from "@/lib/utils"
import { AdminLayout } from "@/components/admin/admin-layout"

interface VoucherSearchResult {
  id: string
  code: string
  amount: number
  type: "scratch" | "online"
  status: "unused" | "used" | "disabled" | "expired"
  vendor: string | null
  batchId: string | null
  createdBy: string | null
  createdAt: string
  usedBy: string | null
  usedByPhone: string | null
  usedByName: string | null
  usedByEmail: string | null
  usedAt: string | null
  expiresAt: string
}

interface SearchResponse {
  results: VoucherSearchResult[]
  count: number
  searchParams: {
    voucherCode: string | null
    userMobile: string | null
  }
}

const fetcher = (url: string) => fetch(url).then((res) => res.json())

const statusConfig = {
  unused: { label: "Unused", color: "bg-green-500/10 text-green-500 border-green-500/20", icon: Ticket },
  used: { label: "Used", color: "bg-blue-500/10 text-blue-500 border-blue-500/20", icon: CheckCircle2 },
  disabled: { label: "Disabled", color: "bg-red-500/10 text-red-500 border-red-500/20", icon: XCircle },
  expired: { label: "Expired", color: "bg-gray-500/10 text-gray-500 border-gray-500/20", icon: AlertCircle },
}

function formatDateTime(dateStr: string): string {
  const date = new Date(dateStr)
  return date.toLocaleString("en-NA", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })
}

function SupportDashboardContent() {
  const [searchType, setSearchType] = useState<"voucher" | "mobile">("voucher")
  const [voucherCode, setVoucherCode] = useState("")
  const [userMobile, setUserMobile] = useState("")
  const [searchUrl, setSearchUrl] = useState<string | null>(null)
  const [isSearching, setIsSearching] = useState(false)

  const { data, error, isLoading } = useSWR<SearchResponse>(
    searchUrl,
    fetcher
  )

  const handleSearch = () => {
    if (searchType === "voucher" && !voucherCode.trim()) return
    if (searchType === "mobile" && !userMobile.trim()) return

    setIsSearching(true)
    const params = new URLSearchParams()
    if (searchType === "voucher") {
      params.set("voucherCode", voucherCode.trim())
    } else {
      params.set("userMobile", userMobile.trim())
    }
    setSearchUrl(`/api/support/vouchers/search?${params.toString()}`)
    setIsSearching(false)
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSearch()
    }
  }

  const results = data?.results || []

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">Support & Disputes</h1>
        <p className="text-muted-foreground">Search vouchers to resolve customer issues and disputes</p>
      </div>

      {/* Search Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="h-5 w-5" />
            Voucher Lookup
          </CardTitle>
          <CardDescription>
            Search by voucher code or user mobile number to trace voucher usage
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={searchType} onValueChange={(v) => setSearchType(v as "voucher" | "mobile")}>
            <TabsList className="grid w-full grid-cols-2 mb-4">
              <TabsTrigger value="voucher" className="flex items-center gap-2">
                <Ticket className="h-4 w-4" />
                Voucher Code
              </TabsTrigger>
              <TabsTrigger value="mobile" className="flex items-center gap-2">
                <Phone className="h-4 w-4" />
                Mobile Number
              </TabsTrigger>
            </TabsList>

            <TabsContent value="voucher" className="space-y-4">
              <div>
                <Label>Enter Voucher Code</Label>
                <div className="flex gap-3 mt-2">
                  <Input
                    value={voucherCode}
                    onChange={(e) => setVoucherCode(e.target.value.replace(/\D/g, "").slice(0, 10))}
                    onKeyDown={handleKeyPress}
                    placeholder="1234567890"
                    className="font-mono text-lg"
                    maxLength={10}
                  />
                  <Button onClick={handleSearch} disabled={!voucherCode.trim() || isLoading}>
                    {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4 mr-2" />}
                    Search
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Enter the 10-digit voucher code (numbers only)
                </p>
              </div>
            </TabsContent>

            <TabsContent value="mobile" className="space-y-4">
              <div>
                <Label>Enter User Mobile Number</Label>
                <div className="flex gap-3 mt-2">
                  <Input
                    value={userMobile}
                    onChange={(e) => setUserMobile(e.target.value)}
                    onKeyDown={handleKeyPress}
                    placeholder="081 123 4567"
                    className="font-mono text-lg"
                  />
                  <Button onClick={handleSearch} disabled={!userMobile.trim() || isLoading}>
                    {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4 mr-2" />}
                    Search
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Search for all vouchers used by this mobile number
                </p>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Results Section */}
      {searchUrl && (
        <Card>
          <CardHeader>
            <CardTitle>Search Results</CardTitle>
            <CardDescription>
              {data?.count !== undefined && (
                <>Found {data.count} voucher{data.count !== 1 ? "s" : ""}</>
              )}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : error ? (
              <div className="text-center py-12">
                <XCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
                <p className="text-muted-foreground">Search failed. Please try again.</p>
              </div>
            ) : results.length === 0 ? (
              <div className="text-center py-12">
                <Ticket className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-lg font-medium text-foreground">No vouchers found</p>
                <p className="text-muted-foreground">
                  {searchType === "voucher" 
                    ? "This voucher code does not exist in the system" 
                    : "No vouchers have been used by this mobile number"}
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {results.map((voucher, index) => {
                  const statusInfo = statusConfig[voucher.status]
                  const StatusIcon = statusInfo.icon
                  
                  return (
                    <motion.div
                      key={voucher.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="border border-border rounded-xl p-4 space-y-4"
                    >
                      {/* Header */}
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="flex items-center gap-3">
                            <code className="text-lg font-mono font-bold bg-muted px-3 py-1 rounded-lg">
                              {voucher.code.slice(0, 4)} {voucher.code.slice(4, 8)} {voucher.code.slice(8)}
                            </code>
                            <Badge variant="outline" className={cn(statusInfo.color)}>
                              <StatusIcon className="h-3 w-3 mr-1" />
                              {statusInfo.label}
                            </Badge>
                            <Badge variant="outline" className="capitalize">
                              {voucher.type}
                            </Badge>
                          </div>
                          <p className="text-2xl font-bold text-amber-500 mt-2">N${voucher.amount}</p>
                        </div>
                      </div>

                      {/* Details Grid */}
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t border-border">
                        {/* Vendor */}
                        <div className="flex items-start gap-2">
                          <Store className="h-4 w-4 text-muted-foreground mt-0.5" />
                          <div>
                            <p className="text-xs text-muted-foreground">Vendor</p>
                            <p className="text-sm font-medium">{voucher.vendor || "-"}</p>
                          </div>
                        </div>

                        {/* Created Date */}
                        <div className="flex items-start gap-2">
                          <Calendar className="h-4 w-4 text-muted-foreground mt-0.5" />
                          <div>
                            <p className="text-xs text-muted-foreground">Created</p>
                            <p className="text-sm font-medium">{formatDateTime(voucher.createdAt)}</p>
                          </div>
                        </div>

                        {/* Expires */}
                        <div className="flex items-start gap-2">
                          <Clock className="h-4 w-4 text-muted-foreground mt-0.5" />
                          <div>
                            <p className="text-xs text-muted-foreground">Expires</p>
                            <p className="text-sm font-medium">{formatDateTime(voucher.expiresAt)}</p>
                          </div>
                        </div>

                        {/* Created By */}
                        <div className="flex items-start gap-2">
                          <User className="h-4 w-4 text-muted-foreground mt-0.5" />
                          <div>
                            <p className="text-xs text-muted-foreground">Created By</p>
                            <p className="text-sm font-medium">{voucher.createdBy || "System"}</p>
                          </div>
                        </div>
                      </div>

                      {/* Usage Information (if used) */}
                      {voucher.status === "used" && voucher.usedAt && (
                        <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4">
                          <h4 className="font-medium text-blue-500 mb-3 flex items-center gap-2">
                            <CheckCircle2 className="h-4 w-4" />
                            Usage Details
                          </h4>
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <div>
                              <p className="text-xs text-muted-foreground">Used By (Phone)</p>
                              <p className="text-sm font-medium font-mono">{voucher.usedByPhone || "-"}</p>
                            </div>
                            <div>
                              <p className="text-xs text-muted-foreground">User Name</p>
                              <p className="text-sm font-medium">{voucher.usedByName || "-"}</p>
                            </div>
                            <div>
                              <p className="text-xs text-muted-foreground">User Email</p>
                              <p className="text-sm font-medium">{voucher.usedByEmail || "-"}</p>
                            </div>
                            <div>
                              <p className="text-xs text-muted-foreground">Used At</p>
                              <p className="text-sm font-medium">{formatDateTime(voucher.usedAt)}</p>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Support Response Template */}
                      {voucher.status === "used" && (
                        <div className="bg-muted/50 rounded-lg p-4">
                          <p className="text-xs text-muted-foreground mb-2">Support Response Template:</p>
                          <p className="text-sm text-foreground">
                            "This voucher (code: {voucher.code.slice(0, 4)} {voucher.code.slice(4, 8)} {voucher.code.slice(8)}) 
                            with value N${voucher.amount} was used on {formatDateTime(voucher.usedAt)} 
                            by mobile number {voucher.usedByPhone || "unknown"}."
                          </p>
                        </div>
                      )}
                    </motion.div>
                  )
                })}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Help Section */}
      {!searchUrl && (
        <Card>
          <CardHeader>
            <CardTitle>How to Use This Tool</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                <span className="text-sm font-bold text-primary">1</span>
              </div>
              <div>
                <p className="font-medium">Customer Claims Voucher Issue</p>
                <p className="text-sm text-muted-foreground">
                  When a customer contacts support about a voucher not working or already being used.
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                <span className="text-sm font-bold text-primary">2</span>
              </div>
              <div>
                <p className="font-medium">Search by Voucher Code</p>
                <p className="text-sm text-muted-foreground">
                  Enter the 10-digit voucher code to see its current status and usage history.
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                <span className="text-sm font-bold text-primary">3</span>
              </div>
              <div>
                <p className="font-medium">Search by Mobile Number</p>
                <p className="text-sm text-muted-foreground">
                  Enter a user's mobile number to see all vouchers they have redeemed.
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                <span className="text-sm font-bold text-primary">4</span>
              </div>
              <div>
                <p className="font-medium">Use Response Template</p>
                <p className="text-sm text-muted-foreground">
                  Copy the generated response template to provide accurate information to the customer.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

export default function SupportDashboardPage() {
  return (
    <AdminLayout>
      <SupportDashboardContent />
    </AdminLayout>
  )
}
