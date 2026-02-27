"use client"

import type React from "react"
import { createContext, useContext, useState, useCallback, useEffect, useRef } from "react"
import { useAuth } from "./auth-context"
import { useSocket } from "./socket-context"
import type { Transaction as DBTransaction } from "@/lib/types"

interface Transaction {
  id: string
  type: "credit" | "debit"
  amount: number
  fee?: number
  description: string
  date: string
  status: "pending" | "completed" | "failed"
  reference?: string
  relatedUser?: { id: string; name: string } | null
}

interface WalletState {
  balance: number
  pendingBalance: number
  transactions: Transaction[]
  isLoading: boolean
  error: string | null
  monthlyStats: {
    received: number
    spent: number
  }
}

interface WalletContextType extends WalletState {
  topUp: (amount: number, method: string) => Promise<{ success: boolean; error?: string }>
  transfer: (recipient: string, amount: number, isEmail?: boolean) => Promise<{ success: boolean; error?: string }>
  redeemVoucher: (code: string) => Promise<{ success: boolean; amount?: number; error?: string }>
  refreshBalance: () => Promise<void>
  clearError: () => void
}

const WalletContext = createContext<WalletContextType | undefined>(undefined)

function formatTransactionDate(dateStr: string | Date): string {
  const date = new Date(dateStr)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMs / 3600000)
  const diffDays = Math.floor(diffMs / 86400000)

  if (diffMins < 1) return "Just now"
  if (diffMins < 60) return `${diffMins} min${diffMins > 1 ? "s" : ""} ago`
  if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? "s" : ""} ago`
  if (diffDays === 1) return "Yesterday"
  if (diffDays < 7) return `${diffDays} days ago`
  
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: date.getFullYear() !== now.getFullYear() ? "numeric" : undefined })
}

export function WalletProvider({ children }: { children: React.ReactNode }) {
  const { user, isAuthenticated, updateProfile } = useAuth()
  const { on, isConnected } = useSocket()

  const [state, setState] = useState<WalletState>({
    balance: 0,
    pendingBalance: 0,
    transactions: [],
    isLoading: false,
    error: null,
    monthlyStats: { received: 0, spent: 0 },
  })

  const previousBalanceRef = useRef<number>(0)
  const hasFetchedRef = useRef<boolean>(false)

  // Sync with user's wallet balance
  useEffect(() => {
    if (user?.walletBalance !== undefined) {
      setState((prev) => ({ ...prev, balance: user.walletBalance }))
      previousBalanceRef.current = user.walletBalance
    }
  }, [user?.walletBalance])

  // Listen for real-time wallet updates
  useEffect(() => {
    if (!isConnected) return

    const cleanup = on("wallet:update", (data: { balance: number; transaction: DBTransaction }) => {
      setState((prev) => {
        const newTransaction: Transaction = {
          id: data.transaction.id,
          type:
            data.transaction.type === "topup" ||
            data.transaction.type === "voucher" ||
            data.transaction.type === "trade"
              ? "credit"
              : "debit",
          amount: data.transaction.amount,
          fee: data.transaction.fee,
          description: getTransactionDescription(data.transaction),
          date: "Just now",
          status: data.transaction.status === "completed" ? "completed" : "pending",
          reference: data.transaction.reference,
        }

        return {
          ...prev,
          balance: data.balance,
          transactions: [newTransaction, ...prev.transactions],
        }
      })

      // Sync with auth context
      updateProfile({ walletBalance: data.balance })
    })

    return cleanup
  }, [isConnected, on, updateProfile])

  const addTransaction = useCallback((tx: Omit<Transaction, "id" | "date">) => {
    const newTx: Transaction = {
      ...tx,
      id: `tx-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      date: "Just now",
    }
    setState((prev) => ({
      ...prev,
      transactions: [newTx, ...prev.transactions],
    }))
    return newTx
  }, [])

  // Fetch wallet data from API
  const fetchWalletData = useCallback(async () => {
    if (!isAuthenticated) return
    
    try {
      const response = await fetch("/api/wallet/balance")
      if (response.ok) {
        const data = await response.json()
        setState((prev) => ({
          ...prev,
          balance: data.balance,
          pendingBalance: data.pendingBalance || 0,
          monthlyStats: data.monthlyStats || { received: 0, spent: 0 },
          transactions: (data.recentTransactions || []).map((t: Record<string, unknown>) => ({
            id: t.id,
            type: ["topup", "transfer_in", "voucher", "trade", "refund"].includes(t.type as string) ? "credit" : "debit",
            amount: t.amount,
            fee: t.fee,
            description: t.description || getTransactionDescription({ type: t.type } as DBTransaction),
            date: formatTransactionDate(t.createdAt as string),
            status: t.status,
            reference: t.reference,
            relatedUser: t.relatedUser,
          })),
        }))
        // Sync with auth context
        updateProfile({ walletBalance: data.balance })
      }
    } catch (error) {
      console.error("Failed to fetch wallet data:", error)
    }
  }, [isAuthenticated, updateProfile])

  // Fetch wallet data on mount and when authenticated
  useEffect(() => {
    if (isAuthenticated && !hasFetchedRef.current) {
      hasFetchedRef.current = true
      fetchWalletData()
    }
  }, [isAuthenticated, fetchWalletData])

  // Periodic refresh for live data updates (every 30 seconds when authenticated)
  useEffect(() => {
    if (!isAuthenticated) return
    
    const intervalId = setInterval(() => {
      fetchWalletData()
    }, 30000) // 30 seconds

    return () => clearInterval(intervalId)
  }, [isAuthenticated, fetchWalletData])

  const topUp = useCallback(
    async (amount: number, method: string): Promise<{ success: boolean; error?: string }> => {
      if (amount < 10) {
        return { success: false, error: "Minimum top up is N$10" }
      }
      if (amount > 10000) {
        return { success: false, error: "Maximum top up is N$10,000" }
      }

      setState((prev) => ({ ...prev, isLoading: true, error: null }))

      try {
        const response = await fetch("/api/wallet/topup", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ amount, paymentMethod: method }),
        })

        const data = await response.json()

        if (!response.ok) {
          throw new Error(data.error || "Top up failed")
        }

        // Add transaction to state
        const newTransaction: Transaction = {
          id: data.transaction.id,
          type: "credit",
          amount: data.transaction.amount,
          description: `Top up via ${method === "card" ? "Card/PayPal" : "Mobile Money"}`,
          date: "Just now",
          status: "completed",
        }

        setState((prev) => ({
          ...prev,
          balance: data.newBalance,
          isLoading: false,
          transactions: [newTransaction, ...prev.transactions],
        }))

        updateProfile({ walletBalance: data.newBalance })

        return { success: true }
      } catch (error) {
        const message = error instanceof Error ? error.message : "Top up failed. Please try again."
        setState((prev) => ({
          ...prev,
          isLoading: false,
          error: message,
        }))
        return { success: false, error: message }
      }
    },
    [updateProfile],
  )

  const transfer = useCallback(
    async (recipient: string, amount: number, isEmail = false): Promise<{ success: boolean; error?: string }> => {
      if (amount > state.balance) {
        return { success: false, error: "Insufficient balance" }
      }
      if (amount < 5) {
        return { success: false, error: "Minimum transfer is N$5" }
      }

      setState((prev) => ({ ...prev, isLoading: true, error: null }))

      try {
        const response = await fetch("/api/wallet/transfer", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(
            isEmail 
              ? { recipientEmail: recipient, amount } 
              : { recipientPhone: recipient, amount }
          ),
        })

        const data = await response.json()

        if (!response.ok) {
          throw new Error(data.error || "Transfer failed")
        }

        // Add transaction to state
        const newTransaction: Transaction = {
          id: data.transaction.id,
          type: "debit",
          amount: data.transaction.amount,
          fee: data.transaction.fee,
          description: `Transfer to ${data.transaction.recipientName}`,
          date: "Just now",
          status: "completed",
        }

        setState((prev) => ({
          ...prev,
          balance: data.newBalance,
          isLoading: false,
          transactions: [newTransaction, ...prev.transactions],
        }))

        updateProfile({ walletBalance: data.newBalance })

        return { success: true }
      } catch (error) {
        const message = error instanceof Error ? error.message : "Transfer failed. Please try again."
        setState((prev) => ({
          ...prev,
          isLoading: false,
          error: message,
        }))
        return { success: false, error: message }
      }
    },
    [state.balance, updateProfile],
  )

  const redeemVoucher = useCallback(
    async (code: string): Promise<{ success: boolean; amount?: number; error?: string }> => {
      // Production: Validate 10-digit numeric code
      if (!code || !/^\d{10}$/.test(code)) {
        return { success: false, error: "Please enter a valid 10-digit voucher code" }
      }

      setState((prev) => ({ ...prev, isLoading: true, error: null }))

      try {
        const response = await fetch("/api/wallet/voucher", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ code }),
        })

        const data = await response.json()

        if (!response.ok) {
          throw new Error(data.message || data.error || "Voucher redemption failed")
        }

        // Add transaction to state immediately for real-time update
        const newTransaction: Transaction = {
          id: data.transaction.id,
          type: "credit",
          amount: data.amount,
          description: `Voucher redeemed (${code.toUpperCase()})`,
          date: "Just now",
          status: "completed",
        }

        // Immediately update state with new balance
        setState((prev) => ({
          ...prev,
          balance: data.newBalance,
          isLoading: false,
          transactions: [newTransaction, ...prev.transactions],
          monthlyStats: {
            ...prev.monthlyStats,
            received: prev.monthlyStats.received + data.amount,
          },
        }))

        // Sync with auth context for persistent state
        updateProfile({ walletBalance: data.newBalance })

        // Trigger a background refresh to ensure consistency
        setTimeout(() => {
          fetchWalletData()
        }, 500)

        return { success: true, amount: data.amount }
      } catch (error) {
        const message = error instanceof Error ? error.message : "Voucher redemption failed"
        setState((prev) => ({
          ...prev,
          isLoading: false,
          error: message,
        }))
        return { success: false, error: message }
      }
    },
    [updateProfile, fetchWalletData],
  )

  const refreshBalance = useCallback(async () => {
    setState((prev) => ({ ...prev, isLoading: true }))
    try {
      await fetchWalletData()
    } finally {
      setState((prev) => ({ ...prev, isLoading: false }))
    }
  }, [fetchWalletData])

  const clearError = useCallback(() => {
    setState((prev) => ({ ...prev, error: null }))
  }, [])

  return (
    <WalletContext.Provider
      value={{
        ...state,
        topUp,
        transfer,
        redeemVoucher,
        refreshBalance,
        clearError,
      }}
    >
      {children}
    </WalletContext.Provider>
  )
}

function getTransactionDescription(tx: DBTransaction): string {
  switch (tx.type) {
    case "topup":
      return "Top up"
    case "transfer":
      return tx.toUserId ? `Transfer to user` : "Transfer"
    case "listing_fee":
      return "Listing fee"
    case "voucher":
      return "Voucher redeemed"
    case "trade":
      return "Trade completed"
    default:
      return "Transaction"
  }
}

export function useWallet() {
  const context = useContext(WalletContext)
  if (!context) {
    throw new Error("useWallet must be used within a WalletProvider")
  }
  return context
}
