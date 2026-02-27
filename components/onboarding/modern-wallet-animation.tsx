"use client"

import { motion } from "framer-motion"
import { Wallet, Shield, Zap, Lock, CheckCircle2, ArrowDownLeft, ArrowUpRight } from "lucide-react"

export function ModernWalletAnimation() {
  return (
    <div className="relative w-80 h-80 lg:w-96 lg:h-96 flex items-center justify-center">
      {/* Background glow */}
      <motion.div
        className="absolute w-64 h-64 rounded-full bg-green-500/10 blur-3xl"
        animate={{
          scale: [1, 1.2, 1],
          opacity: [0.3, 0.5, 0.3],
        }}
        transition={{ duration: 4, repeat: Number.POSITIVE_INFINITY }}
      />

      {/* Main wallet card */}
      <motion.div
        initial={{ scale: 0, rotateY: -180 }}
        animate={{ scale: 1, rotateY: 0 }}
        transition={{ type: "spring", delay: 0.2 }}
        className="relative z-10"
      >
        <div className="w-72 h-44 rounded-3xl bg-gradient-to-br from-charcoal via-secondary to-charcoal border border-border shadow-2xl overflow-hidden">
          {/* Card content */}
          <div className="p-6 h-full flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-gold flex items-center justify-center">
                  <Wallet className="w-5 h-5 text-white" />
                </div>
                <span className="text-foreground font-semibold">Barter Wallet</span>
              </div>
              <motion.div
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ duration: 2, repeat: Number.POSITIVE_INFINITY }}
              >
                <Shield className="w-5 h-5 text-green-500" />
              </motion.div>
            </div>

            <div>
              <div className="text-xs text-muted-foreground mb-1">Available Balance</div>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
                className="text-3xl font-bold text-foreground"
              >
                N$1,250.00
              </motion.div>
            </div>

            <div className="flex items-center gap-4">
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.6 }}
                className="flex items-center gap-1 text-green-500"
              >
                <ArrowDownLeft className="w-4 h-4" />
                <span className="text-xs">+N$500</span>
              </motion.div>
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.7 }}
                className="flex items-center gap-1 text-muted-foreground"
              >
                <ArrowUpRight className="w-4 h-4" />
                <span className="text-xs">-N$95</span>
              </motion.div>
            </div>
          </div>

          {/* Animated shimmer effect */}
          <motion.div
            className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent"
            animate={{ x: ["-100%", "100%"] }}
            transition={{ duration: 3, repeat: Number.POSITIVE_INFINITY, repeatDelay: 2 }}
          />
        </div>
      </motion.div>

      {/* Floating security badges */}
      {[
        { icon: Lock, label: "Encrypted", x: -100, y: -60, delay: 0.8 },
        { icon: Zap, label: "Instant", x: 100, y: -40, delay: 0.9 },
        { icon: CheckCircle2, label: "Verified", x: -80, y: 80, delay: 1 },
      ].map((badge, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0, scale: 0 }}
          animate={{ opacity: 1, scale: 1, x: badge.x, y: badge.y }}
          transition={{ delay: badge.delay, type: "spring" }}
          className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"
        >
          <motion.div
            animate={{ y: [0, -5, 0] }}
            transition={{ duration: 2, repeat: Number.POSITIVE_INFINITY, delay: i * 0.3 }}
            className="flex items-center gap-2 px-3 py-2 bg-card/80 backdrop-blur-sm border border-border rounded-full shadow-lg"
          >
            <badge.icon className="w-4 h-4 text-primary" />
            <span className="text-xs text-foreground">{badge.label}</span>
          </motion.div>
        </motion.div>
      ))}

      {/* Transaction animation */}
      <motion.div
        className="absolute right-0 top-1/2 -translate-y-1/2"
        initial={{ opacity: 0, x: 50 }}
        animate={{ opacity: 1, x: 80 }}
        transition={{ delay: 1.2 }}
      >
        <motion.div
          animate={{ x: [0, -20, 0], opacity: [1, 0.5, 1] }}
          transition={{ duration: 2, repeat: Number.POSITIVE_INFINITY }}
          className="w-3 h-3 rounded-full bg-green-500"
        />
      </motion.div>
    </div>
  )
}
