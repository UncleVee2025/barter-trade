"use client"

import type React from "react"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/contexts/auth-context"
import { motion } from "framer-motion"
import { Loader2 } from "lucide-react"

interface ProtectedRouteProps {
  children: React.ReactNode
  requireAdmin?: boolean
}

export function ProtectedRoute({ children, requireAdmin = false }: ProtectedRouteProps) {
  const { isAuthenticated, isAdmin, isLoading, isInitialized } = useAuth()
  const router = useRouter()

  useEffect(() => {
    // Only redirect after auth state is fully initialized
    if (isInitialized && !isLoading) {
      if (!isAuthenticated) {
        router.push("/auth")
      } else if (requireAdmin && !isAdmin) {
        router.push("/dashboard")
      }
    }
  }, [isAuthenticated, isAdmin, isLoading, isInitialized, requireAdmin, router])

  // Show loading state while auth is being checked
  if (!isInitialized || isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex flex-col items-center gap-4"
        >
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-gold flex items-center justify-center">
            <Loader2 className="h-8 w-8 text-white animate-spin" />
          </div>
          <p className="text-muted-foreground">Loading...</p>
        </motion.div>
      </div>
    )
  }

  if (!isAuthenticated || (requireAdmin && !isAdmin)) {
    return null
  }

  return <>{children}</>
}
