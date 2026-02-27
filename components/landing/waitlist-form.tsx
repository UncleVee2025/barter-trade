"use client"

import React from "react"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Mail, ArrowRight, CheckCircle, Loader2, Sparkles } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"

interface WaitlistFormProps {
  className?: string
  variant?: "default" | "compact" | "hero"
}

export function WaitlistForm({ className, variant = "default" }: WaitlistFormProps) {
  const [email, setEmail] = useState("")
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle")
  const [message, setMessage] = useState("")
  const [position, setPosition] = useState<number | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!email.trim()) {
      setStatus("error")
      setMessage("Please enter your email")
      return
    }

    setStatus("loading")

    try {
      const response = await fetch("/api/waitlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim() }),
      })

      const data = await response.json()

      if (response.ok) {
        setStatus("success")
        setMessage(data.message || "You're on the list!")
        setPosition(data.position)
        setEmail("")
      } else {
        setStatus("error")
        setMessage(data.error || "Something went wrong")
      }
    } catch {
      setStatus("error")
      setMessage("Network error. Please try again.")
    }
  }

  if (variant === "compact") {
    return (
      <form onSubmit={handleSubmit} className={cn("w-full max-w-md", className)}>
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={status === "loading" || status === "success"}
              className="pl-10 h-12 rounded-xl bg-card border-border"
            />
          </div>
          <Button
            type="submit"
            disabled={status === "loading" || status === "success"}
            className="h-12 px-6 rounded-xl"
          >
            {status === "loading" ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : status === "success" ? (
              <CheckCircle className="h-4 w-4" />
            ) : (
              <ArrowRight className="h-4 w-4" />
            )}
          </Button>
        </div>
        <AnimatePresence>
          {message && (
            <motion.p
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className={cn(
                "text-sm mt-2",
                status === "success" ? "text-emerald-500" : "text-destructive"
              )}
            >
              {message}
            </motion.p>
          )}
        </AnimatePresence>
      </form>
    )
  }

  return (
    <div className={cn("w-full max-w-md mx-auto", className)}>
      <AnimatePresence mode="wait">
        {status === "success" ? (
          <motion.div
            key="success"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="text-center p-6 rounded-2xl bg-emerald-500/10 border border-emerald-500/20"
          >
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-emerald-500/20 flex items-center justify-center">
              <CheckCircle className="h-8 w-8 text-emerald-500" />
            </div>
            <h3 className="text-xl font-semibold text-foreground mb-2">
              You're on the list!
            </h3>
            <p className="text-muted-foreground mb-4">
              {position && (
                <span className="block text-emerald-500 font-medium">
                  You're #{position} on the waitlist
                </span>
              )}
              We'll notify you when it's your turn to join.
            </p>
            <Button
              variant="outline"
              onClick={() => setStatus("idle")}
              className="rounded-xl"
            >
              Add another email
            </Button>
          </motion.div>
        ) : (
          <motion.form
            key="form"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            onSubmit={handleSubmit}
            className="space-y-4"
          >
            <div className="flex items-center justify-center gap-2 mb-4">
              <Sparkles className="h-5 w-5 text-primary" />
              <span className="text-sm font-medium text-primary">Be the first to know</span>
            </div>
            
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input
                type="email"
                placeholder="Enter your email address"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value)
                  if (status === "error") setStatus("idle")
                }}
                disabled={status === "loading"}
                className={cn(
                  "pl-12 h-14 text-base rounded-xl bg-card border-2 transition-colors",
                  status === "error" ? "border-destructive" : "border-border focus:border-primary"
                )}
              />
            </div>

            <Button
              type="submit"
              disabled={status === "loading"}
              className="w-full h-14 text-base rounded-xl bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary"
            >
              {status === "loading" ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Joining...
                </>
              ) : (
                <>
                  Join the Waitlist
                  <ArrowRight className="ml-2 h-5 w-5" />
                </>
              )}
            </Button>

            <AnimatePresence>
              {status === "error" && message && (
                <motion.p
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="text-sm text-center text-destructive"
                >
                  {message}
                </motion.p>
              )}
            </AnimatePresence>

            <p className="text-xs text-center text-muted-foreground">
              No spam, unsubscribe anytime. Join 500+ others waiting.
            </p>
          </motion.form>
        )}
      </AnimatePresence>
    </div>
  )
}
