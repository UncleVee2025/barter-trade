"use client"

import useSWR, { mutate } from "swr"

const fetcher = async (url: string) => {
  const res = await fetch(url)
  if (!res.ok) {
    const error = await res.json()
    throw new Error(error.error || "API request failed")
  }
  return res.json()
}

export function useWalletBalance() {
  const { data, error, isLoading } = useSWR("/api/wallet/balance", fetcher)

  return {
    balance: data?.balance ?? 0,
    currency: data?.currency ?? "NAD",
    isLoading,
    error,
    refresh: () => mutate("/api/wallet/balance"),
  }
}

export function useListings(filters?: Record<string, string>) {
  const params = new URLSearchParams(filters)
  const url = `/api/listings${params.toString() ? `?${params}` : ""}`

  const { data, error, isLoading } = useSWR(url, fetcher)

  return {
    listings: data?.listings ?? [],
    total: data?.total ?? 0,
    isLoading,
    error,
    refresh: () => mutate(url),
  }
}

export function useListing(id: string | null) {
  const { data, error, isLoading } = useSWR(id ? `/api/listings/${id}` : null, fetcher)

  return {
    listing: data?.listing,
    isLoading,
    error,
  }
}

export function useConversations() {
  const { data, error, isLoading } = useSWR("/api/messages", fetcher)

  return {
    conversations: data?.conversations ?? [],
    isLoading,
    error,
    refresh: () => mutate("/api/messages"),
  }
}

export function useMessages(conversationId: string | null) {
  const url = conversationId ? `/api/messages?conversationId=${conversationId}` : null
  const { data, error, isLoading } = useSWR(url, fetcher)

  return {
    messages: data?.messages ?? [],
    isLoading,
    error,
    refresh: () => mutate(url),
  }
}

export function useOffers(status?: string) {
  const url = status ? `/api/offers?status=${status}` : "/api/offers"
  const { data, error, isLoading } = useSWR(url, fetcher)

  return {
    offers: data?.offers ?? [],
    isLoading,
    error,
    refresh: () => mutate(url),
  }
}

export function useAdminStats() {
  const { data, error, isLoading } = useSWR("/api/admin/stats", fetcher)

  return {
    stats: data,
    isLoading,
    error,
    refresh: () => mutate("/api/admin/stats"),
  }
}

export function useAdminVouchers(status?: string) {
  const url = status ? `/api/admin/vouchers?status=${status}` : "/api/admin/vouchers"
  const { data, error, isLoading } = useSWR(url, fetcher)

  return {
    vouchers: data?.vouchers ?? [],
    stats: data?.stats,
    isLoading,
    error,
    refresh: () => mutate(url),
  }
}

// API mutation helpers
export async function apiPost<T>(url: string, data: T) {
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  })
  if (!res.ok) {
    const error = await res.json()
    throw new Error(error.error || "Request failed")
  }
  return res.json()
}

export async function apiPatch<T>(url: string, data: T) {
  const res = await fetch(url, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  })
  if (!res.ok) {
    const error = await res.json()
    throw new Error(error.error || "Request failed")
  }
  return res.json()
}

export async function apiDelete(url: string) {
  const res = await fetch(url, { method: "DELETE" })
  if (!res.ok) {
    const error = await res.json()
    throw new Error(error.error || "Request failed")
  }
  return res.json()
}
