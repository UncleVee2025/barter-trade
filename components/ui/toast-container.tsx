"use client"

import { motion, AnimatePresence } from "framer-motion"
import { useNotifications } from "@/contexts/notification-context"
import { CheckCircle, XCircle, AlertTriangle, Info, X } from "lucide-react"

const toastIcons = {
  success: CheckCircle,
  error: XCircle,
  warning: AlertTriangle,
  info: Info,
}

const toastColors = {
  success: {
    bg: "bg-emerald-500",
    border: "border-emerald-500/20",
    bgLight: "bg-emerald-500/10",
  },
  error: {
    bg: "bg-red-500",
    border: "border-red-500/20",
    bgLight: "bg-red-500/10",
  },
  warning: {
    bg: "bg-amber-500",
    border: "border-amber-500/20",
    bgLight: "bg-amber-500/10",
  },
  info: {
    bg: "bg-blue-500",
    border: "border-blue-500/20",
    bgLight: "bg-blue-500/10",
  },
}

export function ToastContainer() {
  const { toasts, dismissToast } = useNotifications()

  return (
    <>
      {/* Desktop - Bottom Right */}
      <div className="hidden md:flex fixed bottom-6 right-6 z-[100] flex-col gap-3 pointer-events-none">
        <AnimatePresence mode="popLayout">
          {toasts.map((toast) => {
            const Icon = toastIcons[toast.type]
            const colors = toastColors[toast.type]
            return (
              <motion.div
                key={toast.id}
                initial={{ opacity: 0, y: 50, scale: 0.9 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, x: 100, scale: 0.9 }}
                className="pointer-events-auto"
              >
                <div className={`flex items-start gap-3 bg-card border ${colors.border} rounded-2xl p-4 shadow-2xl min-w-[320px] max-w-[420px]`}>
                  <div className={`${colors.bg} p-2 rounded-xl`}>
                    <Icon className="w-5 h-5 text-white" />
                  </div>
                  <div className="flex-1 min-w-0 pt-0.5">
                    <p className="font-semibold text-foreground">{toast.title}</p>
                    {toast.message && (
                      <p className="text-muted-foreground text-sm mt-0.5 line-clamp-2">{toast.message}</p>
                    )}
                  </div>
                  <button
                    onClick={() => dismissToast(toast.id)}
                    className="text-muted-foreground hover:text-foreground transition-colors p-1 rounded-lg hover:bg-muted"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </motion.div>
            )
          })}
        </AnimatePresence>
      </div>

      {/* Mobile - Bottom Center (above nav) */}
      <div className="md:hidden fixed bottom-20 left-4 right-4 z-[100] flex flex-col items-center gap-2 pointer-events-none">
        <AnimatePresence mode="popLayout">
          {toasts.map((toast) => {
            const Icon = toastIcons[toast.type]
            const colors = toastColors[toast.type]
            return (
              <motion.div
                key={toast.id}
                initial={{ opacity: 0, y: 20, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -20, scale: 0.95 }}
                className="pointer-events-auto w-full max-w-sm"
              >
                <div className={`flex items-center gap-3 bg-card border ${colors.border} rounded-2xl p-3 shadow-2xl`}>
                  <div className={`${colors.bg} p-1.5 rounded-lg`}>
                    <Icon className="w-4 h-4 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-foreground text-sm">{toast.title}</p>
                    {toast.message && (
                      <p className="text-muted-foreground text-xs truncate">{toast.message}</p>
                    )}
                  </div>
                  <button
                    onClick={() => dismissToast(toast.id)}
                    className="text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </motion.div>
            )
          })}
        </AnimatePresence>
      </div>
    </>
  )
}
