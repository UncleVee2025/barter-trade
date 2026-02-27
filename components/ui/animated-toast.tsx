"use client"

import { motion, AnimatePresence } from "framer-motion"
import { CheckCircle2, XCircle, AlertCircle, Info, X, Wallet, MessageCircle, Bell, ArrowRightLeft } from "lucide-react"
import { useNotifications } from "@/contexts/notification-context"
import { cn } from "@/lib/utils"

const toastIcons = {
  success: CheckCircle2,
  error: XCircle,
  warning: AlertCircle,
  info: Info,
  wallet: Wallet,
  message: MessageCircle,
  notification: Bell,
  trade: ArrowRightLeft,
}

const toastColors = {
  success: {
    bg: "bg-emerald-500/10",
    border: "border-emerald-500/30",
    icon: "text-emerald-500",
    ring: "ring-emerald-500/20",
  },
  error: {
    bg: "bg-red-500/10",
    border: "border-red-500/30",
    icon: "text-red-500",
    ring: "ring-red-500/20",
  },
  warning: {
    bg: "bg-amber-500/10",
    border: "border-amber-500/30",
    icon: "text-amber-500",
    ring: "ring-amber-500/20",
  },
  info: {
    bg: "bg-blue-500/10",
    border: "border-blue-500/30",
    icon: "text-blue-500",
    ring: "ring-blue-500/20",
  },
}

export function AnimatedToastContainer() {
  const { toasts, dismissToast } = useNotifications()

  return (
    <div className="fixed top-4 right-4 z-[100] flex flex-col gap-3 pointer-events-none max-w-[380px] w-full sm:w-auto">
      <AnimatePresence mode="popLayout">
        {toasts.map((toast) => {
          const colors = toastColors[toast.type]
          const Icon = toastIcons[toast.type]

          return (
            <motion.div
              key={toast.id}
              layout
              initial={{ opacity: 0, y: -20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, x: 100, scale: 0.95 }}
              transition={{ type: "spring", stiffness: 400, damping: 30 }}
              className={cn(
                "pointer-events-auto relative flex items-start gap-3 p-4 rounded-2xl border shadow-lg backdrop-blur-xl",
                colors.bg,
                colors.border,
                `ring-1 ${colors.ring}`
              )}
            >
              {/* Progress bar */}
              <motion.div
                initial={{ scaleX: 1 }}
                animate={{ scaleX: 0 }}
                transition={{ duration: (toast.duration || 4000) / 1000, ease: "linear" }}
                className={cn(
                  "absolute bottom-0 left-0 right-0 h-1 origin-left rounded-b-2xl",
                  toast.type === "success" && "bg-emerald-500/50",
                  toast.type === "error" && "bg-red-500/50",
                  toast.type === "warning" && "bg-amber-500/50",
                  toast.type === "info" && "bg-blue-500/50"
                )}
              />

              {/* Icon */}
              <div className={cn("flex-shrink-0 mt-0.5", colors.icon)}>
                <Icon className="h-5 w-5" />
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm text-foreground leading-tight">
                  {toast.title}
                </p>
                {toast.message && (
                  <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                    {toast.message}
                  </p>
                )}
                {toast.action && (
                  <button
                    onClick={toast.action.onClick}
                    className={cn(
                      "mt-2 text-xs font-medium underline-offset-2 hover:underline",
                      colors.icon
                    )}
                  >
                    {toast.action.label}
                  </button>
                )}
              </div>

              {/* Close button */}
              <button
                onClick={() => dismissToast(toast.id)}
                className="flex-shrink-0 p-1 rounded-lg text-muted-foreground hover:text-foreground hover:bg-background/50 transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </motion.div>
          )
        })}
      </AnimatePresence>
    </div>
  )
}
