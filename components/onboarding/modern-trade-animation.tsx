"use client"

import { motion } from "framer-motion"
import { ArrowLeftRight, Package, Smartphone, Car, Shirt } from "lucide-react"

export function ModernTradeAnimation() {
  const items = [
    { icon: Smartphone, color: "#3b82f6", label: "Phone" },
    { icon: Car, color: "#ef4444", label: "Vehicle" },
    { icon: Shirt, color: "#8b5cf6", label: "Fashion" },
    { icon: Package, color: "#22c55e", label: "Goods" },
  ]

  return (
    <div className="relative w-full h-64 flex items-center justify-center">
      {/* Central trade icon */}
      <motion.div
        className="absolute z-10 p-4 bg-primary/20 rounded-full"
        animate={{
          scale: [1, 1.1, 1],
          rotate: [0, 180, 360],
        }}
        transition={{
          duration: 4,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      >
        <ArrowLeftRight className="w-8 h-8 text-primary" />
      </motion.div>

      {/* Orbiting items */}
      {items.map((item, index) => {
        const angle = (index / items.length) * 360
        const radius = 80

        return (
          <motion.div
            key={item.label}
            className="absolute"
            initial={{
              x: Math.cos((angle * Math.PI) / 180) * radius,
              y: Math.sin((angle * Math.PI) / 180) * radius,
            }}
            animate={{
              x: [
                Math.cos((angle * Math.PI) / 180) * radius,
                Math.cos(((angle + 90) * Math.PI) / 180) * radius,
                Math.cos(((angle + 180) * Math.PI) / 180) * radius,
                Math.cos(((angle + 270) * Math.PI) / 180) * radius,
                Math.cos((angle * Math.PI) / 180) * radius,
              ],
              y: [
                Math.sin((angle * Math.PI) / 180) * radius,
                Math.sin(((angle + 90) * Math.PI) / 180) * radius,
                Math.sin(((angle + 180) * Math.PI) / 180) * radius,
                Math.sin(((angle + 270) * Math.PI) / 180) * radius,
                Math.sin((angle * Math.PI) / 180) * radius,
              ],
            }}
            transition={{
              duration: 8,
              repeat: Infinity,
              ease: "linear",
            }}
          >
            <motion.div
              className="p-3 rounded-xl shadow-lg"
              style={{ backgroundColor: `${item.color}20` }}
              whileHover={{ scale: 1.1 }}
            >
              <item.icon className="w-6 h-6" style={{ color: item.color }} />
            </motion.div>
          </motion.div>
        )
      })}

      {/* Connecting lines animation */}
      <svg className="absolute inset-0 w-full h-full pointer-events-none">
        <motion.circle
          cx="50%"
          cy="50%"
          r="60"
          fill="none"
          stroke="currentColor"
          strokeWidth="1"
          strokeDasharray="4 4"
          className="text-muted-foreground/30"
          animate={{ rotate: 360 }}
          transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
          style={{ transformOrigin: "center" }}
        />
        <motion.circle
          cx="50%"
          cy="50%"
          r="90"
          fill="none"
          stroke="currentColor"
          strokeWidth="1"
          strokeDasharray="8 8"
          className="text-muted-foreground/20"
          animate={{ rotate: -360 }}
          transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
          style={{ transformOrigin: "center" }}
        />
      </svg>
    </div>
  )
}
