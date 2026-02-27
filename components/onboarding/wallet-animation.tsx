"use client"

import { motion } from "framer-motion"
import { Wallet, Lock, Shield, Zap } from "lucide-react"

export function WalletAnimation() {
  return (
    <div className="relative w-64 h-64 md:w-80 md:h-80 flex items-center justify-center">
      {/* Outer pulsing ring */}
      <motion.div
        className="absolute w-48 h-48 rounded-full border-2 border-primary/30"
        animate={{
          scale: [1, 1.2, 1],
          opacity: [0.3, 0.6, 0.3],
        }}
        transition={{
          duration: 2,
          repeat: Number.POSITIVE_INFINITY,
          ease: "easeInOut",
        }}
      />

      {/* Data pulses */}
      {[0, 1, 2, 3].map((i) => (
        <motion.div
          key={i}
          className="absolute w-3 h-3 rounded-full bg-gold"
          style={{
            top: "50%",
            left: "50%",
          }}
          animate={{
            x: [0, Math.cos((i * Math.PI) / 2) * 80],
            y: [0, Math.sin((i * Math.PI) / 2) * 80],
            scale: [0, 1, 0],
            opacity: [0, 1, 0],
          }}
          transition={{
            duration: 2,
            repeat: Number.POSITIVE_INFINITY,
            delay: i * 0.5,
            ease: "easeOut",
          }}
        />
      ))}

      {/* Central wallet */}
      <motion.div
        className="relative z-10 w-32 h-32 rounded-3xl bg-gradient-to-br from-primary to-primary/80 shadow-2xl shadow-primary/30 flex items-center justify-center"
        initial={{ scale: 0, rotate: -180 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ delay: 0.3, duration: 0.6, type: "spring" }}
      >
        <motion.div
          animate={{
            scale: [1, 1.1, 1],
          }}
          transition={{
            duration: 1.5,
            repeat: Number.POSITIVE_INFINITY,
            ease: "easeInOut",
          }}
        >
          <Wallet className="w-16 h-16 text-primary-foreground" />
        </motion.div>
      </motion.div>

      {/* Lock icon merging */}
      <motion.div
        className="absolute w-10 h-10 rounded-full bg-card shadow-lg flex items-center justify-center"
        initial={{ x: 80, y: -80, opacity: 0 }}
        animate={{ x: 40, y: -40, opacity: 1 }}
        transition={{ delay: 0.8, duration: 0.5 }}
      >
        <Lock className="w-5 h-5 text-primary" />
      </motion.div>

      {/* Shield icon */}
      <motion.div
        className="absolute w-10 h-10 rounded-full bg-card shadow-lg flex items-center justify-center"
        initial={{ x: -80, y: 80, opacity: 0 }}
        animate={{ x: -40, y: 40, opacity: 1 }}
        transition={{ delay: 1, duration: 0.5 }}
      >
        <Shield className="w-5 h-5 text-gold" />
      </motion.div>

      {/* Zap icon */}
      <motion.div
        className="absolute w-10 h-10 rounded-full bg-card shadow-lg flex items-center justify-center"
        initial={{ x: 80, y: 80, opacity: 0 }}
        animate={{ x: 40, y: 40, opacity: 1 }}
        transition={{ delay: 1.2, duration: 0.5 }}
      >
        <Zap className="w-5 h-5 text-primary" />
      </motion.div>
    </div>
  )
}
