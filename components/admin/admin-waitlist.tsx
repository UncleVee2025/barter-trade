"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { Mail, Users, Download, RefreshCw, Loader2, Clock, Copy, Check } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

interface WaitlistEntry {
  email: string
  created_at: string
}

interface WaitlistData {
  total: number
  recent: WaitlistEntry[]
}

export function AdminWaitlist() {
  const [data, setData] = useState<WaitlistData | null>(null)
  const [loading, setLoading] = useState(true)
  const [copiedEmail, setCopiedEmail] = useState<string | null>(null)

  const fetchData = async () => {
    setLoading(true)
    try {
      const res = await fetch("/api/waitlist")
      if (res.ok) {
        const json = await res.json()
        setData(json)
      }
    } catch (error) {
      console.error("Failed to fetch waitlist:", error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  const copyEmail = async (email: string) => {
    await navigator.clipboard.writeText(email)
    setCopiedEmail(email)
    setTimeout(() => setCopiedEmail(null), 2000)
  }

  const exportToCsv = () => {
    if (!data?.recent) return
    const csv = "Email,Signed Up\n" + data.recent.map(e => 
      `${e.email},${new Date(e.created_at).toISOString()}`
    ).join("\n")
    
    const blob = new Blob([csv], { type: "text/csv" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `waitlist-${new Date().toISOString().split("T")[0]}.csv`
    a.click()
  }

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr)
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  const timeAgo = (dateStr: string) => {
    const date = new Date(dateStr)
    const now = new Date()
    const diff = now.getTime() - date.getTime()
    const minutes = Math.floor(diff / 60000)
    const hours = Math.floor(diff / 3600000)
    const days = Math.floor(diff / 86400000)

    if (minutes < 60) return `${minutes}m ago`
    if (hours < 24) return `${hours}h ago`
    return `${days}d ago`
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Waitlist</h1>
          <p className="text-muted-foreground">
            Manage email signups and early access requests
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={fetchData}
            disabled={loading}
            className="gap-2 bg-transparent"
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4" />
            )}
            Refresh
          </Button>
          <Button onClick={exportToCsv} disabled={!data?.recent?.length} className="gap-2">
            <Download className="h-4 w-4" />
            Export CSV
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Card className="bg-card border-border">
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                  <Users className="h-6 w-6 text-primary" />
                </div>
              </div>
              <div className="mt-4">
                <p className="text-3xl font-bold text-foreground">
                  {loading ? "..." : data?.total || 0}
                </p>
                <p className="text-sm text-muted-foreground">Total Signups</p>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card className="bg-card border-border">
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <div className="w-12 h-12 rounded-xl bg-emerald-500/10 flex items-center justify-center">
                  <Mail className="h-6 w-6 text-emerald-500" />
                </div>
              </div>
              <div className="mt-4">
                <p className="text-3xl font-bold text-foreground">
                  {loading ? "..." : data?.recent?.length || 0}
                </p>
                <p className="text-sm text-muted-foreground">Recent Signups</p>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card className="bg-card border-border">
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <div className="w-12 h-12 rounded-xl bg-blue-500/10 flex items-center justify-center">
                  <Clock className="h-6 w-6 text-blue-500" />
                </div>
              </div>
              <div className="mt-4">
                <p className="text-3xl font-bold text-foreground">
                  {loading || !data?.recent?.[0] 
                    ? "..." 
                    : timeAgo(data.recent[0].created_at)}
                </p>
                <p className="text-sm text-muted-foreground">Last Signup</p>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Table */}
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="text-foreground">Recent Signups</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : !data?.recent?.length ? (
            <div className="text-center py-12">
              <Mail className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
              <p className="text-muted-foreground">No signups yet</p>
              <p className="text-sm text-muted-foreground/70">
                Waitlist signups will appear here
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Email</TableHead>
                  <TableHead>Signed Up</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.recent.map((entry, i) => (
                  <TableRow key={entry.email}>
                    <TableCell className="font-medium">{entry.email}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {formatDate(entry.created_at)}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => copyEmail(entry.email)}
                        className="gap-1"
                      >
                        {copiedEmail === entry.email ? (
                          <>
                            <Check className="h-4 w-4 text-emerald-500" />
                            Copied
                          </>
                        ) : (
                          <>
                            <Copy className="h-4 w-4" />
                            Copy
                          </>
                        )}
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
