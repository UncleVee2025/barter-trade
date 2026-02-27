"use client"

import React from "react"

import { motion, AnimatePresence } from "framer-motion"
import { Wallet, MessageSquare, Package, Bell, Check, RefreshCw, ArrowRightLeft, Tag, Loader2, BellOff } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useNotifications } from "@/contexts/notification-context"
import { cn } from "@/lib/utils"
import { useRouter } from "next/navigation"

interface NotificationPanelProps {
  onClose: () => void
}

const typeIcons: Record<string, React.ElementType> = {
  wallet: Wallet,
  trade: Package,
  message: MessageSquare,
  system: Bell,
  listing: Tag,
  offer: ArrowRightLeft,
}

const typeColors: Record<string, string> = {
  wallet: "text-emerald-500 bg-emerald-500/10",
  trade: "text-primary bg-primary/10",
  message: "text-blue-500 bg-blue-500/10",
  system: "text-amber-500 bg-amber-500/10",
  listing: "text-violet-500 bg-violet-500/10",
  offer: "text-orange-500 bg-orange-500/10",
}

export function NotificationPanel({ onClose }: NotificationPanelProps) {
  const router = useRouter()
  const { notifications, markAsRead, markAllAsRead, unreadCount, isLoading, refreshNotifications } = useNotifications()

  const handleNotificationClick = async (notification: typeof notifications[0]) => {
    await markAsRead(notification.id)
    
    // Navigate based on notification type
    const data = notification.data as Record<string, string> | undefined
    switch (notification.type) {
      case "trade":
      case "offer":
        if (data?.offerId) router.push(`/dashboard/offers?id=${data.offerId}`)
        else router.push("/dashboard/offers")
        break
      case "message":
        if (data?.conversationId) router.push(`/dashboard/messages?id=${data.conversationId}`)
        else router.push("/dashboard/messages")
        break
      case "wallet":
        router.push("/dashboard/wallet")
        break
      case "listing":
        if (data?.listingId) router.push(`/dashboard/listings/${data.listingId}`)
        else router.push("/dashboard/listings")
        break
      default:
        break
    }
    onClose()
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 10, scale: 0.95 }}
      className="absolute right-0 top-full mt-2 w-80 sm:w-96 bg-card rounded-2xl shadow-xl border border-border z-50 overflow-hidden"
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-border">
        <div className="flex items-center gap-2">
          <h3 className="font-semibold text-foreground">Notifications</h3>
          {unreadCount > 0 && (
            <span className="px-2 py-0.5 text-xs font-medium bg-primary text-primary-foreground rounded-full">
              {unreadCount}
            </span>
          )}
        </div>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => refreshNotifications()}
            disabled={isLoading}
            className="h-8 w-8 text-muted-foreground hover:text-foreground"
          >
            <RefreshCw className={cn("h-4 w-4", isLoading && "animate-spin")} />
          </Button>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => markAllAsRead()}
              className="text-xs text-primary hover:text-primary/80 h-8"
            >
              <Check className="h-3 w-3 mr-1" />
              Read all
            </Button>
          )}
        </div>
      </div>

      {/* Notifications list */}
      <div className="max-h-[400px] overflow-auto">
        {isLoading && notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-8">
            <Loader2 className="h-8 w-8 text-primary animate-spin mb-2" />
            <p className="text-sm text-muted-foreground">Loading notifications...</p>
          </div>
        ) : notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-8">
            <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mb-3">
              <BellOff className="h-6 w-6 text-muted-foreground" />
            </div>
            <p className="text-sm font-medium text-foreground mb-1">No notifications</p>
            <p className="text-xs text-muted-foreground text-center">
              You're all caught up! New notifications will appear here.
            </p>
          </div>
        ) : (
          <AnimatePresence mode="popLayout">
            {notifications.map((notification, index) => {
              const Icon = typeIcons[notification.type] || Bell
              const colors = typeColors[notification.type] || typeColors.system
              return (
                <motion.button
                  key={notification.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ delay: index * 0.05 }}
                  onClick={() => handleNotificationClick(notification)}
                  className={cn(
                    "w-full flex items-start gap-3 p-4 hover:bg-muted/50 transition-colors text-left border-b border-border/50 last:border-0",
                    !notification.read && "bg-primary/5",
                  )}
                  whileTap={{ scale: 0.98 }}
                >
                  <div
                    className={cn("w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0", colors)}
                  >
                    <Icon className="h-5 w-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className={cn(
                        "text-sm truncate",
                        !notification.read ? "font-semibold text-foreground" : "font-medium text-foreground/80"
                      )}>
                        {notification.title}
                      </span>
                      {!notification.read && (
                        <span className="w-2 h-2 rounded-full bg-primary flex-shrink-0 animate-pulse" />
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground line-clamp-2 mt-0.5">{notification.message}</p>
                    <p className="text-[10px] text-muted-foreground/70 mt-1.5">{notification.time}</p>
                  </div>
                </motion.button>
              )
            })}
          </AnimatePresence>
        )}
      </div>

      {/* Footer */}
      {notifications.length > 0 && (
        <div className="p-3 border-t border-border">
          <Button 
            variant="ghost" 
            className="w-full text-primary hover:text-primary/80 hover:bg-primary/5" 
            onClick={() => {
              router.push("/dashboard/notifications")
              onClose()
            }}
          >
            View All Notifications
          </Button>
        </div>
      )}
    </motion.div>
  )
}
