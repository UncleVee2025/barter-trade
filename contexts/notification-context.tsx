"use client"

import type React from "react"
import { createContext, useContext, useState, useCallback, useEffect, useRef } from "react"
import { useSocket } from "./socket-context"
import { useAuth } from "./auth-context"
import type { Notification as DBNotification } from "@/lib/types"

interface Notification {
  id: string
  type: "wallet" | "trade" | "message" | "system" | "listing" | "offer"
  title: string
  message: string
  time: string
  read: boolean
  data?: Record<string, unknown>
  createdAt?: Date
}

interface Toast {
  id: string
  type: "success" | "error" | "warning" | "info"
  title: string
  message?: string
  duration?: number
  action?: {
    label: string
    onClick: () => void
  }
}

interface NotificationContextType {
  notifications: Notification[]
  unreadCount: number
  toasts: Toast[]
  isLoading: boolean
  markAsRead: (id: string) => Promise<void>
  markAllAsRead: () => Promise<void>
  addNotification: (notification: Omit<Notification, "id" | "time" | "read">) => void
  removeNotification: (id: string) => void
  showToast: (toast: Omit<Toast, "id">) => string
  dismissToast: (id: string) => void
  clearAllNotifications: () => void
  refreshNotifications: () => Promise<void>
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined)

// Helper to format relative time
function formatRelativeTime(date: Date | string): string {
  const now = new Date()
  const then = new Date(date)
  const diffMs = now.getTime() - then.getTime()
  const diffSec = Math.floor(diffMs / 1000)
  const diffMin = Math.floor(diffSec / 60)
  const diffHour = Math.floor(diffMin / 60)
  const diffDay = Math.floor(diffHour / 24)

  if (diffSec < 60) return "Just now"
  if (diffMin < 60) return `${diffMin}m ago`
  if (diffHour < 24) return `${diffHour}h ago`
  if (diffDay < 7) return `${diffDay}d ago`
  return then.toLocaleDateString()
}

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, user } = useAuth()
  const { on, isConnected } = useSocket()

  const [notifications, setNotifications] = useState<Notification[]>([])
  const [toasts, setToasts] = useState<Toast[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const toastTimeoutsRef = useRef<Map<string, NodeJS.Timeout>>(new Map())
  const hasFetchedRef = useRef(false)

  const unreadCount = notifications.filter((n) => !n.read).length

  // Fetch notifications from database
  const refreshNotifications = useCallback(async () => {
    if (!isAuthenticated || !user) return

    setIsLoading(true)
    try {
      const response = await fetch("/api/notifications?limit=50")
      if (response.ok) {
        const data = await response.json()
        const formattedNotifications: Notification[] = (data.notifications || []).map((n: DBNotification) => ({
          id: n.id,
          type: n.type as Notification["type"],
          title: n.title,
          message: n.message,
          time: formatRelativeTime(n.createdAt || new Date()),
          read: n.read || false,
          data: n.data,
          createdAt: n.createdAt,
        }))
        setNotifications(formattedNotifications)
      }
    } catch (error) {
      console.error("Failed to fetch notifications:", error)
    } finally {
      setIsLoading(false)
    }
  }, [isAuthenticated, user])

  // Fetch notifications on mount and auth change
  useEffect(() => {
    if (isAuthenticated && user && !hasFetchedRef.current) {
      hasFetchedRef.current = true
      refreshNotifications()
    }
    if (!isAuthenticated) {
      hasFetchedRef.current = false
      setNotifications([])
    }
  }, [isAuthenticated, user, refreshNotifications])

  // Polling for real-time notifications when socket is not connected
  useEffect(() => {
    if (!isAuthenticated || !user) return
    
    // Poll every 10 seconds for new notifications
    const pollInterval = setInterval(() => {
      refreshNotifications()
    }, 10000)

    return () => clearInterval(pollInterval)
  }, [isAuthenticated, user, refreshNotifications])

  // Listen for real-time notifications
  useEffect(() => {
    if (!isConnected || !isAuthenticated) return

    const cleanup = on("notification:new", (dbNotif: DBNotification) => {
      const notification: Notification = {
        id: dbNotif.id,
        type: dbNotif.type as Notification["type"],
        title: dbNotif.title,
        message: dbNotif.message,
        time: "Just now",
        read: false,
        data: dbNotif.data,
      }

      setNotifications((prev) => [notification, ...prev])

      // Auto-show toast for new notifications with appropriate styling
      const toastType = dbNotif.type === "wallet" ? "success" : 
                        dbNotif.type === "trade" || dbNotif.type === "offer" ? "info" :
                        dbNotif.type === "message" ? "info" : "info"
      
      showToast({
        type: toastType,
        title: notification.title,
        message: notification.message,
        duration: 6000,
      })
    })

    return cleanup
  }, [isConnected, isAuthenticated, on])

  // Cleanup toast timeouts on unmount
  useEffect(() => {
    return () => {
      toastTimeoutsRef.current.forEach((timeout) => clearTimeout(timeout))
    }
  }, [])

  // Mark single notification as read (with API call)
  const markAsRead = useCallback(async (id: string) => {
    // Optimistic update
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)))
    
    // Persist to database
    try {
      await fetch("/api/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, read: true }),
      })
    } catch (error) {
      console.error("Failed to mark notification as read:", error)
    }
  }, [])

  // Mark all notifications as read
  const markAllAsRead = useCallback(async () => {
    const unreadIds = notifications.filter(n => !n.read).map(n => n.id)
    if (unreadIds.length === 0) return

    // Optimistic update
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })))
    
    // Persist to database
    try {
      await fetch("/api/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ markAllRead: true }),
      })
    } catch (error) {
      console.error("Failed to mark all notifications as read:", error)
    }
  }, [notifications])

  const addNotification = useCallback((notification: Omit<Notification, "id" | "time" | "read">) => {
    const newNotification: Notification = {
      ...notification,
      id: `n-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      time: "Just now",
      read: false,
    }
    setNotifications((prev) => [newNotification, ...prev])
    return newNotification
  }, [])

  const removeNotification = useCallback((id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id))
  }, [])

  const showToast = useCallback((toast: Omit<Toast, "id">) => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    const newToast: Toast = { ...toast, id }

    setToasts((prev) => [...prev, newToast])

    // Auto-dismiss after duration
    const duration = toast.duration ?? 4000
    if (duration > 0) {
      const timeout = setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id))
        toastTimeoutsRef.current.delete(id)
      }, duration)
      toastTimeoutsRef.current.set(id, timeout)
    }

    return id
  }, [])

  const dismissToast = useCallback((id: string) => {
    const timeout = toastTimeoutsRef.current.get(id)
    if (timeout) {
      clearTimeout(timeout)
      toastTimeoutsRef.current.delete(id)
    }
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }, [])

  const clearAllNotifications = useCallback(() => {
    setNotifications([])
  }, [])

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        toasts,
        isLoading,
        markAsRead,
        markAllAsRead,
        addNotification,
        removeNotification,
        showToast,
        dismissToast,
        clearAllNotifications,
        refreshNotifications,
      }}
    >
      {children}
    </NotificationContext.Provider>
  )
}

export function useNotifications() {
  const context = useContext(NotificationContext)
  if (!context) {
    throw new Error("useNotifications must be used within a NotificationProvider")
  }
  return context
}
