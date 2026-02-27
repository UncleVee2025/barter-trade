"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import useSWR from "swr"
import {
  Bell,
  Send,
  Users,
  User,
  Megaphone,
  Plus,
  Search,
  RefreshCw,
  XCircle,
  CheckCircle,
  Clock,
  Trash2,
  Eye,
  Loader2,
  ChevronLeft,
  ChevronRight,
  AlertTriangle,
  Info,
  Wallet,
  Package,
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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Switch } from "@/components/ui/switch"
import { cn } from "@/lib/utils"
import { useNotifications } from "@/contexts/notification-context"

interface NotificationTemplate {
  id: string
  name: string
  title: string
  message: string
  type: "system" | "trade" | "wallet" | "listing"
}

interface SentNotification {
  id: string
  title: string
  message: string
  type: "system" | "trade" | "wallet" | "listing"
  targetType: "all" | "specific" | "region"
  targetValue: string | null
  recipientCount: number
  sentAt: string
  sentBy: string
}

const templates: NotificationTemplate[] = [
  {
    id: "maintenance",
    name: "Scheduled Maintenance",
    title: "Scheduled Maintenance",
    message: "We will be performing scheduled maintenance on [DATE] from [TIME]. The platform may be temporarily unavailable.",
    type: "system",
  },
  {
    id: "new-feature",
    name: "New Feature Announcement",
    title: "New Feature Available!",
    message: "We've just launched a new feature: [FEATURE_NAME]. Check it out in your dashboard!",
    type: "system",
  },
  {
    id: "promotion",
    name: "Promotional Offer",
    title: "Special Offer Just for You!",
    message: "Get [DISCOUNT]% off your next listing fee! Use code [CODE] at checkout. Valid until [DATE].",
    type: "wallet",
  },
  {
    id: "security",
    name: "Security Alert",
    title: "Important Security Update",
    message: "We've detected unusual activity on your account. Please verify your identity to continue using the platform.",
    type: "system",
  },
]

const demoSentNotifications: SentNotification[] = [
  {
    id: "1",
    title: "Platform Update v2.5",
    message: "We've released a new version with improved trading features and faster performance.",
    type: "system",
    targetType: "all",
    targetValue: null,
    recipientCount: 12456,
    sentAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    sentBy: "Admin",
  },
  {
    id: "2",
    title: "Weekend Trading Bonus",
    message: "Trade this weekend and earn double rewards on all completed trades!",
    type: "trade",
    targetType: "all",
    targetValue: null,
    recipientCount: 12456,
    sentAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
    sentBy: "Admin",
  },
  {
    id: "3",
    title: "Khomas Region Update",
    message: "New trading zones now available in Windhoek West and Pioneers Park.",
    type: "listing",
    targetType: "region",
    targetValue: "Khomas",
    recipientCount: 4521,
    sentAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    sentBy: "Admin",
  },
]

const typeIcons = {
  system: AlertTriangle,
  trade: Package,
  wallet: Wallet,
  listing: Package,
}

const typeColors = {
  system: "bg-blue-500/10 text-blue-500 border-blue-500/20",
  trade: "bg-green-500/10 text-green-500 border-green-500/20",
  wallet: "bg-gold/10 text-gold border-gold/20",
  listing: "bg-purple-500/10 text-purple-500 border-purple-500/20",
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

export function AdminNotifications() {
  const [activeTab, setActiveTab] = useState("broadcast")
  const [isComposeOpen, setIsComposeOpen] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [selectedTemplate, setSelectedTemplate] = useState<NotificationTemplate | null>(null)
  const { showToast } = useNotifications()

  const [composeForm, setComposeForm] = useState({
    title: "",
    message: "",
    type: "system",
    targetType: "all",
    targetValue: "",
    userId: "",
  })

  const [sentNotifications] = useState<SentNotification[]>(demoSentNotifications)

  const handleSendNotification = async () => {
    if (!composeForm.title || !composeForm.message) {
      showToast({ type: "error", title: "Validation Error", message: "Title and message are required", duration: 3000 })
      return
    }

    if (composeForm.targetType === "specific" && !composeForm.userId) {
      showToast({ type: "error", title: "Validation Error", message: "User ID is required for specific user notification", duration: 3000 })
      return
    }

    setIsProcessing(true)
    try {
      // In a real app, this would call an API
      await new Promise(resolve => setTimeout(resolve, 1500))

      showToast({
        type: "success",
        title: "Notification Sent",
        message: composeForm.targetType === "all" 
          ? "Notification sent to all users"
          : composeForm.targetType === "specific"
          ? "Notification sent to user"
          : `Notification sent to users in ${composeForm.targetValue}`,
        duration: 3000,
      })
      
      setIsComposeOpen(false)
      resetForm()
    } catch (error) {
      showToast({ type: "error", title: "Send Failed", message: "Failed to send notification", duration: 5000 })
    } finally {
      setIsProcessing(false)
    }
  }

  const applyTemplate = (template: NotificationTemplate) => {
    setComposeForm({
      ...composeForm,
      title: template.title,
      message: template.message,
      type: template.type,
    })
    setSelectedTemplate(template)
  }

  const resetForm = () => {
    setComposeForm({
      title: "",
      message: "",
      type: "system",
      targetType: "all",
      targetValue: "",
      userId: "",
    })
    setSelectedTemplate(null)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Notifications & Broadcasts</h1>
          <p className="text-muted-foreground">Send notifications and announcements to users</p>
        </div>
        <div className="flex gap-2">
          <Dialog open={isComposeOpen} onOpenChange={setIsComposeOpen}>
            <DialogTrigger asChild>
              <Button className="rounded-xl" onClick={resetForm}>
                <Send className="h-4 w-4 mr-2" />
                Compose Broadcast
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Compose Notification</DialogTitle>
                <DialogDescription>Send a notification to users</DialogDescription>
              </DialogHeader>
              <div className="space-y-4 mt-4">
                {/* Template Selection */}
                <div>
                  <Label>Use Template</Label>
                  <Select
                    value={selectedTemplate?.id || ""}
                    onValueChange={(id) => {
                      const template = templates.find(t => t.id === id)
                      if (template) applyTemplate(template)
                    }}
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="Select a template (optional)" />
                    </SelectTrigger>
                    <SelectContent>
                      {templates.map(template => (
                        <SelectItem key={template.id} value={template.id}>
                          {template.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Title *</Label>
                  <Input
                    value={composeForm.title}
                    onChange={(e) => setComposeForm({ ...composeForm, title: e.target.value })}
                    placeholder="Notification title"
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label>Message *</Label>
                  <Textarea
                    value={composeForm.message}
                    onChange={(e) => setComposeForm({ ...composeForm, message: e.target.value })}
                    placeholder="Write your message..."
                    className="mt-1"
                    rows={4}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Type</Label>
                    <Select value={composeForm.type} onValueChange={(v) => setComposeForm({ ...composeForm, type: v })}>
                      <SelectTrigger className="mt-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="system">System</SelectItem>
                        <SelectItem value="trade">Trade</SelectItem>
                        <SelectItem value="wallet">Wallet</SelectItem>
                        <SelectItem value="listing">Listing</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label>Target Audience</Label>
                    <Select value={composeForm.targetType} onValueChange={(v) => setComposeForm({ ...composeForm, targetType: v })}>
                      <SelectTrigger className="mt-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Users</SelectItem>
                        <SelectItem value="specific">Specific User</SelectItem>
                        <SelectItem value="region">By Region</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {composeForm.targetType === "specific" && (
                  <div>
                    <Label>User ID</Label>
                    <Input
                      value={composeForm.userId}
                      onChange={(e) => setComposeForm({ ...composeForm, userId: e.target.value })}
                      placeholder="Enter user ID"
                      className="mt-1"
                    />
                  </div>
                )}

                {composeForm.targetType === "region" && (
                  <div>
                    <Label>Region</Label>
                    <Select value={composeForm.targetValue} onValueChange={(v) => setComposeForm({ ...composeForm, targetValue: v })}>
                      <SelectTrigger className="mt-1">
                        <SelectValue placeholder="Select region" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Khomas">Khomas</SelectItem>
                        <SelectItem value="Erongo">Erongo</SelectItem>
                        <SelectItem value="Oshana">Oshana</SelectItem>
                        <SelectItem value="Otjozondjupa">Otjozondjupa</SelectItem>
                        <SelectItem value="Omusati">Omusati</SelectItem>
                        <SelectItem value="Kavango East">Kavango East</SelectItem>
                        <SelectItem value="Kavango West">Kavango West</SelectItem>
                        <SelectItem value="Kunene">Kunene</SelectItem>
                        <SelectItem value="Zambezi">Zambezi</SelectItem>
                        <SelectItem value="Hardap">Hardap</SelectItem>
                        <SelectItem value="Karas">Karas</SelectItem>
                        <SelectItem value="Ohangwena">Ohangwena</SelectItem>
                        <SelectItem value="Oshikoto">Oshikoto</SelectItem>
                        <SelectItem value="Omaheke">Omaheke</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}

                <div className="p-3 bg-muted rounded-lg">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Info className="h-4 w-4" />
                    <span>
                      {composeForm.targetType === "all" && "This will be sent to all registered users"}
                      {composeForm.targetType === "specific" && "This will be sent to a specific user"}
                      {composeForm.targetType === "region" && `This will be sent to all users in ${composeForm.targetValue || "the selected region"}`}
                    </span>
                  </div>
                </div>
              </div>

              <DialogFooter className="mt-6">
                <Button variant="outline" onClick={() => setIsComposeOpen(false)} className="bg-transparent">
                  Cancel
                </Button>
                <Button onClick={handleSendNotification} disabled={isProcessing}>
                  {isProcessing ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Send className="h-4 w-4 mr-2" />}
                  Send Notification
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Total Sent", value: "156", icon: Send, color: "text-foreground" },
          { label: "This Week", value: "12", icon: Clock, color: "text-blue-500" },
          { label: "Broadcasts", value: "45", icon: Megaphone, color: "text-purple-500" },
          { label: "Users Reached", value: "89.2K", icon: Users, color: "text-green-500" },
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

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="broadcast">Sent Broadcasts</TabsTrigger>
          <TabsTrigger value="templates">Templates</TabsTrigger>
        </TabsList>

        <TabsContent value="broadcast" className="space-y-4 mt-6">
          {/* Sent Notifications List */}
          <div className="space-y-3">
            <AnimatePresence>
              {sentNotifications.map((notification, i) => {
                const TypeIcon = typeIcons[notification.type]
                return (
                  <motion.div
                    key={notification.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ delay: i * 0.05 }}
                  >
                    <Card className="bg-card border-border">
                      <CardContent className="p-4">
                        <div className="flex items-start gap-4">
                          <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center", typeColors[notification.type])}>
                            <TypeIcon className="h-5 w-5" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-2">
                              <div>
                                <h3 className="font-medium text-foreground">{notification.title}</h3>
                                <p className="text-sm text-muted-foreground line-clamp-2 mt-1">{notification.message}</p>
                              </div>
                              <Badge variant="outline" className={typeColors[notification.type]}>
                                {notification.type}
                              </Badge>
                            </div>
                            <div className="flex items-center gap-4 mt-3 text-xs text-muted-foreground">
                              <span className="flex items-center gap-1">
                                <Users className="h-3 w-3" />
                                {notification.recipientCount.toLocaleString()} recipients
                              </span>
                              <span className="flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                {formatDate(notification.sentAt)}
                              </span>
                              {notification.targetType === "region" && (
                                <Badge variant="secondary" className="text-xs">
                                  {notification.targetValue}
                                </Badge>
                              )}
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                )
              })}
            </AnimatePresence>
          </div>
        </TabsContent>

        <TabsContent value="templates" className="space-y-4 mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {templates.map((template, i) => {
              const TypeIcon = typeIcons[template.type]
              return (
                <motion.div
                  key={template.id}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: i * 0.05 }}
                >
                  <Card className="bg-card border-border h-full">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-3">
                          <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center", typeColors[template.type])}>
                            <TypeIcon className="h-5 w-5" />
                          </div>
                          <div>
                            <h3 className="font-medium text-foreground">{template.name}</h3>
                            <Badge variant="outline" className={cn("mt-1", typeColors[template.type])}>
                              {template.type}
                            </Badge>
                          </div>
                        </div>
                      </div>
                      <div className="mt-3 p-3 bg-muted rounded-lg">
                        <p className="text-sm font-medium text-foreground">{template.title}</p>
                        <p className="text-sm text-muted-foreground mt-1">{template.message}</p>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full mt-3 bg-transparent"
                        onClick={() => {
                          applyTemplate(template)
                          setIsComposeOpen(true)
                        }}
                      >
                        <Send className="h-4 w-4 mr-2" />
                        Use Template
                      </Button>
                    </CardContent>
                  </Card>
                </motion.div>
              )
            })}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
