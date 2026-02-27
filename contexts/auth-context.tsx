"use client"

import type React from "react"
import { createContext, useContext, useState, useCallback, useEffect } from "react"

// User type with all fields including gender and ID verification
export interface User {
  id: string
  email: string
  name: string
  phone?: string
  gender?: "male" | "female" | "other"
  dateOfBirth?: string
  region: string
  town?: string
  streetAddress?: string
  postalCode?: string
  avatar?: string
  role: "user" | "admin"
  walletBalance: number
  isVerified: boolean
  isBanned: boolean
  banReason?: string
  idVerificationStatus: "not_submitted" | "pending" | "approved" | "rejected"
  idRejectionReason?: string
  nationalIdFront?: string
  nationalIdBack?: string
  createdAt: Date
  lastSeen: Date
}

interface RegisterData {
  email: string
  password: string
  name: string
  phone?: string
  gender: string
  region: string
  town?: string
  streetAddress?: string
}

interface LoginData {
  email: string
  password: string
}

interface AuthState {
  user: User | null
  isAuthenticated: boolean
  isAdmin: boolean
  isLoading: boolean
  isInitialized: boolean
  error: string | null
}

interface AuthContextType extends AuthState {
  login: (data: LoginData) => Promise<{ success: boolean; error?: string }>
  register: (data: RegisterData) => Promise<{ success: boolean; error?: string; email?: string }>
  logout: () => Promise<void>
  updateProfile: (data: Partial<User>) => void
  refreshUser: () => Promise<void>
  clearError: () => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AuthState>({
    user: null,
    isAuthenticated: false,
    isAdmin: false,
    isLoading: false,
    isInitialized: false,
    error: null,
  })

  // Check auth status on mount
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await fetch("/api/auth/me")
        if (response.ok) {
          const data = await response.json()
          if (data.user) {
            const transformedUser = transformUser(data.user)
            setState({
              user: transformedUser,
              isAuthenticated: true,
              isAdmin: transformedUser.role === "admin",
              isLoading: false,
              isInitialized: true,
              error: null,
            })
            return
          }
        }
      } catch (error) {
        console.error("Auth check failed:", error)
      }
      setState((prev) => ({ ...prev, isInitialized: true }))
    }

    checkAuth()
  }, [])

  const transformUser = (userData: Record<string, unknown>): User => ({
    id: userData.id as string,
    email: userData.email as string,
    name: userData.name as string,
    phone: userData.phone as string | undefined,
    gender: userData.gender as "male" | "female" | "other" | undefined,
    dateOfBirth: userData.dateOfBirth as string | undefined,
    region: userData.region as string,
    town: userData.town as string | undefined,
    streetAddress: userData.streetAddress as string | undefined,
    postalCode: userData.postalCode as string | undefined,
    avatar: userData.avatar as string | undefined,
    role: (userData.role as "user" | "admin") || "user",
    walletBalance: Number(userData.walletBalance) || 0,
    isVerified: Boolean(userData.isVerified),
    isBanned: Boolean(userData.isBanned),
    banReason: userData.banReason as string | undefined,
    idVerificationStatus: (userData.idVerificationStatus as User["idVerificationStatus"]) || "not_submitted",
    idRejectionReason: userData.idRejectionReason as string | undefined,
    nationalIdFront: userData.nationalIdFront as string | undefined,
    nationalIdBack: userData.nationalIdBack as string | undefined,
    createdAt: new Date(userData.createdAt as string),
    lastSeen: new Date(userData.lastSeen as string),
  })

  const login = useCallback(async (data: LoginData): Promise<{ success: boolean; error?: string }> => {
    setState((prev) => ({ ...prev, isLoading: true, error: null }))

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || "Login failed")
      }

      const loggedInUser = transformUser(result.user)
      setState({
        user: loggedInUser,
        isAuthenticated: true,
        isAdmin: loggedInUser.role === "admin",
        isLoading: false,
        isInitialized: true,
        error: null,
      })

      return { success: true }
    } catch (error) {
      const message = error instanceof Error ? error.message : "Login failed"
      setState((prev) => ({
        ...prev,
        isLoading: false,
        error: message,
      }))
      return { success: false, error: message }
    }
  }, [])

  const register = useCallback(async (data: RegisterData): Promise<{ success: boolean; error?: string; email?: string; needsOnboarding?: boolean }> => {
    setState((prev) => ({ ...prev, isLoading: true, error: null }))

    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || "Registration failed")
      }

      // Auto-login after registration and redirect to onboarding
      if (result.user) {
        const newUser = transformUser(result.user)
        setState({
          user: newUser,
          isAuthenticated: true,
          isAdmin: newUser.role === "admin",
          isLoading: false,
          isInitialized: true,
          error: null,
        })
        return { success: true, email: data.email, needsOnboarding: true }
      }

      setState((prev) => ({
        ...prev,
        isLoading: false,
        isInitialized: true,
        error: null,
      }))

      return { success: true, email: data.email, needsOnboarding: true }
    } catch (error) {
      const message = error instanceof Error ? error.message : "Registration failed"
      setState((prev) => ({
        ...prev,
        isLoading: false,
        error: message,
      }))
      return { success: false, error: message }
    }
  }, [])

  const logout = useCallback(async () => {
    setState((prev) => ({ ...prev, isLoading: true }))

    try {
      await fetch("/api/auth/logout", { method: "POST" })
    } catch (error) {
      console.error("Logout error:", error)
    }

    setState({
      user: null,
      isAuthenticated: false,
      isAdmin: false,
      isLoading: false,
      isInitialized: true,
      error: null,
    })
  }, [])

  const updateProfile = useCallback((data: Partial<User>) => {
    setState((prev) => {
      if (!prev.user) return prev
      return {
        ...prev,
        user: { ...prev.user, ...data },
      }
    })
  }, [])

  const refreshUser = useCallback(async () => {
    try {
      const response = await fetch("/api/auth/me")
      if (response.ok) {
        const data = await response.json()
        if (data.user) {
          const refreshedUser = transformUser(data.user)
          setState((prev) => ({
            ...prev,
            user: refreshedUser,
            isAdmin: refreshedUser.role === "admin",
          }))
        }
      }
    } catch (error) {
      console.error("Failed to refresh user:", error)
    }
  }, [])

  const clearError = useCallback(() => {
    setState((prev) => ({ ...prev, error: null }))
  }, [])

  return (
    <AuthContext.Provider
      value={{
        ...state,
        login,
        register,
        logout,
        updateProfile,
        refreshUser,
        clearError,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
