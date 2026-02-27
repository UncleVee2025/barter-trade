"use client"

import type React from "react"

import { motion } from "framer-motion"
import { Smartphone, Monitor, Wrench, Footprints } from "lucide-react"

const itemIcons: Record<string, React.ReactNode> = {
  phone: <Smartphone className="w-8 h-8" />,
  goat: (
    <svg viewBox="0 0 24 24" fill="currentColor" className="w-8 h-8">
      <path d="M18 6c0-1.1-.9-2-2-2h-1V2h-2v2h-2V2H9v2H8C6.9 4 6 4.9 6 6v1c-1.1 0-2 .9-2 2v4c0 1.1.9 2 2 2v5c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2v-5c1.1 0 2-.9 2-2V9c0-1.1-.9-2-2-2V6zm-2 0v1H8V6h8zm2 7h-2v7H8v-7H6V9h12v4zm-8-2c-.55 0-1-.45-1-1s.45-1 1-1 1 .45 1 1-.45 1-1 1zm4 0c-.55 0-1-.45-1-1s.45-1 1-1 1 .45 1 1-.45 1-1 1z" />
    </svg>
  ),
  tv: <Monitor className="w-8 h-8" />,
  plough: <Wrench className="w-8 h-8" />,
  shoes: <Footprints className="w-8 h-8" />,
}

interface FloatingItemsProps {
  items: string[]
}

export function FloatingItems({ items }: FloatingItemsProps) {
  const positions = [
    { x: -80, y: -60, delay: 0 },
    { x: 100, y: -40, delay: 0.2 },
    { x: -60, y: 80, delay: 0.4 },
    { x: 80, y: 60, delay: 0.6 },
    { x: 0, y: 0, delay: 0.8 },
  ]

  return (
    <div className="relative w-64 h-64 md:w-80 md:h-80">
      {/* Central swap animation */}
      <motion.div
        className="absolute inset-0 flex items-center justify-center"
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.5, duration: 0.5 }}
      >
        <div className="w-20 h-20 rounded-full bg-primary/20 flex items-center justify-center">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 8, repeat: Number.POSITIVE_INFINITY, ease: "linear" }}
            className="w-12 h-12 rounded-full border-2 border-dashed border-primary/50"
          />
        </div>
      </motion.div>

      {/* Floating items */}
      {items.map((item, index) => {
        const pos = positions[index] || positions[0]
        return (
          <motion.div
            key={item}
            className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"
            initial={{ x: 0, y: 0, scale: 0, opacity: 0 }}
            animate={{
              x: pos.x,
              y: pos.y,
              scale: 1,
              opacity: 1,
            }}
            transition={{
              delay: pos.delay,
              duration: 0.6,
              type: "spring",
              stiffness: 100,
            }}
          >
            <motion.div
              animate={{
                y: [0, -10, 0],
              }}
              transition={{
                duration: 2 + index * 0.3,
                repeat: Number.POSITIVE_INFINITY,
                ease: "easeInOut",
              }}
              className="w-16 h-16 rounded-2xl bg-card/90 backdrop-blur-sm shadow-lg flex items-center justify-center text-primary"
            >
              {itemIcons[item]}
            </motion.div>
          </motion.div>
        )
      })}

      {/* Connection lines */}
      <svg className="absolute inset-0 w-full h-full" style={{ zIndex: -1 }}>
        <defs>
          <linearGradient id="lineGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="var(--primary)" stopOpacity="0.2" />
            <stop offset="50%" stopColor="var(--primary)" stopOpacity="0.5" />
            <stop offset="100%" stopColor="var(--primary)" stopOpacity="0.2" />
          </linearGradient>
        </defs>
        {positions.slice(0, -1).map((_, i) => (
          <motion.line
            key={i}
            x1="50%"
            y1="50%"
            x2={`${50 + positions[i].x / 3}%`}
            y2={`${50 + positions[i].y / 3}%`}
            stroke="url(#lineGradient)"
            strokeWidth="2"
            initial={{ pathLength: 0, opacity: 0 }}
            animate={{ pathLength: 1, opacity: 1 }}
            transition={{ delay: 1 + i * 0.1, duration: 0.5 }}
          />
        ))}
      </svg>
    </div>
  )
}
