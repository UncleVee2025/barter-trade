"use client"

import { motion, AnimatePresence } from "framer-motion"
import { useSocket } from "@/contexts/socket-context"
import { WifiOff, Loader2 } from "lucide-react"

// Check if socket is enabled via environment variable (defaults to false)
const SOCKET_ENABLED = process.env.NEXT_PUBLIC_ENABLE_SOCKET === "true"

export function ConnectionStatus() {
  const { isConnected, isReconnecting, reconnectAttempts } = useSocket()

  // Don't show connection status if socket is disabled
  if (!SOCKET_ENABLED) {
    return null
  }

  return (
    <AnimatePresence>
      {(!isConnected || isReconnecting) && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          className="fixed top-0 left-0 right-0 z-[100] flex items-center justify-center py-2 bg-amber-500 text-amber-950"
        >
          <div className="flex items-center gap-2 text-sm font-medium">
            {isReconnecting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Reconnecting... (Attempt {reconnectAttempts})</span>
              </>
            ) : (
              <>
                <WifiOff className="w-4 h-4" />
                <span>Connection lost. Trying to reconnect...</span>
              </>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

export function ConnectionIndicator() {
  const { isConnected } = useSocket()

  // Don't show connection indicator if socket is disabled
  if (!SOCKET_ENABLED) {
    return null
  }

  return (
    <div className="flex items-center gap-1.5">
      <motion.div
        animate={{
          scale: isConnected ? [1, 1.2, 1] : 1,
          backgroundColor: isConnected ? "#22c55e" : "#ef4444",
        }}
        transition={{ duration: 0.3 }}
        className="w-2 h-2 rounded-full"
      />
      <span className="text-xs text-muted-foreground">{isConnected ? "Live" : "Offline"}</span>
    </div>
  )
}
