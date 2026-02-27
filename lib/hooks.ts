"use client"

import useSWR, { type SWRConfiguration } from "swr"
import { useCallback, useEffect, useRef } from "react"
import { useSocket } from "@/contexts/socket-context"

const fetcher = async (url: string) => {
  const res = await fetch(url)
  if (!res.ok) {
    const error = new Error("An error occurred while fetching the data.")
    throw error
  }
  return res.json()
}

const defaultConfig: SWRConfiguration = {
  revalidateOnFocus: true,
  revalidateOnReconnect: true,
  dedupingInterval: 2000,
  errorRetryCount: 3,
}

// Wallet data hook with real-time updates
export function useWalletData(userId?: string) {
  const { on, isConnected } = useSocket()

  const { data, error, isLoading, mutate } = useSWR(userId ? `/api/wallet/balance?userId=${userId}` : null, fetcher, {
    ...defaultConfig,
    refreshInterval: 30000, // Refresh every 30s as backup
  })

  // Listen for real-time wallet updates
  useEffect(() => {
    if (!isConnected) return

    const cleanup = on("wallet:update", () => {
      mutate() // Revalidate on real-time update
    })

    return cleanup
  }, [isConnected, on, mutate])

  return {
    balance: data?.balance ?? 0,
    pendingBalance: data?.pendingBalance ?? 0,
    isLoading,
    error,
    refresh: mutate,
  }
}

// Listings hook with filtering
export function useListings(filters?: {
  category?: string
  region?: string
  status?: string
  search?: string
  page?: number
  limit?: number
}) {
  const params = new URLSearchParams()
  if (filters?.category) params.set("category", filters.category)
  if (filters?.region) params.set("region", filters.region)
  if (filters?.status) params.set("status", filters.status)
  if (filters?.search) params.set("search", filters.search)
  if (filters?.page) params.set("page", String(filters.page))
  if (filters?.limit) params.set("limit", String(filters.limit))

  const queryString = params.toString()
  const url = `/api/listings${queryString ? `?${queryString}` : ""}`

  const { data, error, isLoading, mutate } = useSWR(url, fetcher, defaultConfig)

  return {
    listings: data?.listings ?? [],
    total: data?.total ?? 0,
    hasMore: data?.hasMore ?? false,
    isLoading,
    error,
    refresh: mutate,
  }
}

// User listings hook
export function useUserListings(userId?: string) {
  const { data, error, isLoading, mutate } = useSWR(
    userId ? `/api/listings?userId=${userId}` : null,
    fetcher,
    defaultConfig,
  )

  return {
    listings: data?.listings ?? [],
    isLoading,
    error,
    refresh: mutate,
  }
}

// Messages/Conversations hook with real-time updates
export function useConversations(userId?: string) {
  const { on, isConnected } = useSocket()

  const { data, error, isLoading, mutate } = useSWR(
    userId ? `/api/messages/conversations?userId=${userId}` : null,
    fetcher,
    defaultConfig,
  )

  // Listen for new messages to update conversation list
  useEffect(() => {
    if (!isConnected) return

    const cleanup = on("message:new", () => {
      mutate()
    })

    return cleanup
  }, [isConnected, on, mutate])

  return {
    conversations: data?.conversations ?? [],
    isLoading,
    error,
    refresh: mutate,
  }
}

// Single conversation messages hook
export function useMessages(conversationId?: string) {
  const { on, isConnected, joinRoom, leaveRoom } = useSocket()

  const { data, error, isLoading, mutate } = useSWR(
    conversationId ? `/api/messages/${conversationId}` : null,
    fetcher,
    {
      ...defaultConfig,
      refreshInterval: 0, // Real-time only
    },
  )

  // Join conversation room for real-time updates
  useEffect(() => {
    if (!conversationId || !isConnected) return

    joinRoom(`conversation:${conversationId}`)

    const cleanup = on("message:new", (message) => {
      if (message.conversationId === conversationId) {
        mutate()
      }
    })

    return () => {
      cleanup()
      leaveRoom(`conversation:${conversationId}`)
    }
  }, [conversationId, isConnected, joinRoom, leaveRoom, on, mutate])

  return {
    messages: data?.messages ?? [],
    isLoading,
    error,
    refresh: mutate,
  }
}

// Trade offers hook
export function useTradeOffers(userId?: string, status?: string) {
  const { on, isConnected } = useSocket()

  const params = new URLSearchParams()
  if (userId) params.set("userId", userId)
  if (status) params.set("status", status)

  const { data, error, isLoading, mutate } = useSWR(
    userId ? `/api/offers?${params.toString()}` : null,
    fetcher,
    defaultConfig,
  )

  // Listen for offer updates
  useEffect(() => {
    if (!isConnected) return

    const cleanup = on("offer:update", () => {
      mutate()
    })

    return cleanup
  }, [isConnected, on, mutate])

  return {
    offers: data?.offers ?? [],
    isLoading,
    error,
    refresh: mutate,
  }
}

// Admin stats hook
export function useAdminStats() {
  const { data, error, isLoading, mutate } = useSWR("/api/admin/stats", fetcher, {
    ...defaultConfig,
    refreshInterval: 60000, // Refresh every minute
  })

  return {
    stats: data ?? {
      totalUsers: 0,
      activeListings: 0,
      tradesCompleted: 0,
      totalVolume: 0,
    },
    isLoading,
    error,
    refresh: mutate,
  }
}

// Debounced search hook
export function useDebouncedValue<T>(value: T, delay = 300): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value)
  const timerRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    timerRef.current = setTimeout(() => {
      setDebouncedValue(value)
    }, delay)

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current)
      }
    }
  }, [value, delay])

  return debouncedValue
}

// Missing import
import { useState } from "react"

// Online users hook
export function useOnlineUsers() {
  const { on, isConnected } = useSocket()
  const [onlineUsers, setOnlineUsers] = useState<Set<string>>(new Set())

  useEffect(() => {
    if (!isConnected) return

    const cleanupOnline = on("user:online", (userId: string) => {
      setOnlineUsers((prev) => new Set([...prev, userId]))
    })

    const cleanupOffline = on("user:offline", (userId: string) => {
      setOnlineUsers((prev) => {
        const next = new Set(prev)
        next.delete(userId)
        return next
      })
    })

    return () => {
      cleanupOnline()
      cleanupOffline()
    }
  }, [isConnected, on])

  const isUserOnline = useCallback((userId: string) => onlineUsers.has(userId), [onlineUsers])

  return {
    onlineUsers,
    isUserOnline,
    onlineCount: onlineUsers.size,
  }
}
