"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Eye, EyeOff, Loader2, Check, AlertCircle } from "lucide-react"
import { useRouter } from "next/navigation"
import { cn } from "@/lib/utils"
import { useAuth } from "@/contexts/auth-context"

interface LoginFormProps {
  prefilledEmail?: string
}

export function LoginForm({ prefilledEmail }: LoginFormProps) {
  const [email, setEmail] = useState(prefilledEmail || "")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isSuccess, setIsSuccess] = useState(false)
  const passwordInputRef = useRef<HTMLInputElement>(null)
  const router = useRouter()
  const { login, isLoading } = useAuth()

  // Auto-focus password field if email is pre-filled
  useEffect(() => {
    if (prefilledEmail) {
      setEmail(prefilledEmail)
      // Focus password input after a brief delay
      setTimeout(() => {
        passwordInputRef.current?.focus()
      }, 300)
    }
  }, [prefilledEmail])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    const result = await login({ email, password })

    if (result.success) {
      setIsSuccess(true)
      // Navigate after success animation - redirect based on role
      setTimeout(async () => {
        // Fetch current user to determine the role for redirect
        try {
          const meResponse = await fetch("/api/auth/me")
          if (meResponse.ok) {
            const meData = await meResponse.json()
            if (meData.user?.role === "admin") {
              router.push("/admin")
              return
            }
          }
        } catch {
          // Fall through to default redirect
        }
        router.push("/dashboard")
      }, 800)
    } else {
      setError(result.error || "Login failed")
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {error && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-2 p-3 bg-destructive/10 border border-destructive/20 rounded-xl text-sm text-destructive"
        >
          <AlertCircle className="h-4 w-4 flex-shrink-0" />
          {error}
        </motion.div>
      )}

      <div className="space-y-2">
        <Label htmlFor="email" className="text-card-foreground">
          Email
        </Label>
        <div className="relative">
          <Input
            id="email"
            type="email"
            placeholder="name@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className={cn(
              "h-12 bg-background border-input rounded-xl px-4",
              "focus:ring-2 focus:ring-primary/20 focus:border-primary",
              "transition-all duration-200",
            )}
            required
          />
        </div>
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label htmlFor="password" className="text-card-foreground">
            Password
          </Label>
          <button type="button" className="text-sm text-primary hover:text-primary/80 transition-colors">
            Forgot password?
          </button>
        </div>
        <div className="relative">
          <Input
            ref={passwordInputRef}
            id="password"
            type={showPassword ? "text" : "password"}
            placeholder="Enter your password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className={cn(
              "h-12 bg-background border-input rounded-xl px-4 pr-12",
              "focus:ring-2 focus:ring-primary/20 focus:border-primary",
              "transition-all duration-200",
            )}
            required
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-card-foreground transition-colors"
          >
            {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
          </button>
        </div>
      </div>

      <Button
        type="submit"
        disabled={isLoading || isSuccess}
        className={cn(
          "w-full h-12 rounded-xl text-base font-medium transition-all duration-300",
          isSuccess
            ? "bg-green-500 hover:bg-green-500"
            : "bg-primary hover:bg-primary/90 hover:shadow-lg hover:shadow-primary/25",
        )}
      >
        {isLoading ? (
          <Loader2 className="h-5 w-5 animate-spin" />
        ) : isSuccess ? (
          <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="flex items-center gap-2">
            <Check className="h-5 w-5" />
            Success!
          </motion.div>
        ) : (
          "Sign In"
        )}
      </Button>

      <div className="relative my-6">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-border" />
        </div>
        <div className="relative flex justify-center text-sm">
          <span className="bg-card px-4 text-muted-foreground">Or continue with</span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Button
          type="button"
          variant="outline"
          className="h-12 rounded-xl border-border hover:bg-muted transition-colors bg-transparent"
        >
          <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
            <path
              fill="currentColor"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="currentColor"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="currentColor"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
            />
            <path
              fill="currentColor"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
            />
          </svg>
          Google
        </Button>
        <Button
          type="button"
          variant="outline"
          className="h-12 rounded-xl border-border hover:bg-muted transition-colors bg-transparent"
        >
          <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 24 24">
            <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
          </svg>
          Facebook
        </Button>
      </div>
    </form>
  )
}
