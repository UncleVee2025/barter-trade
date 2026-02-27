"use client"

import { motion } from "framer-motion"

const regions = [
  { name: "Kunene", x: 15, y: 20 },
  { name: "Omusati", x: 30, y: 15 },
  { name: "Oshana", x: 40, y: 18 },
  { name: "Ohangwena", x: 50, y: 12 },
  { name: "Oshikoto", x: 45, y: 25 },
  { name: "Kavango West", x: 55, y: 18 },
  { name: "Kavango East", x: 70, y: 15 },
  { name: "Zambezi", x: 85, y: 10 },
  { name: "Otjozondjupa", x: 45, y: 40 },
  { name: "Erongo", x: 20, y: 45 },
  { name: "Khomas", x: 35, y: 55 },
  { name: "Omaheke", x: 55, y: 55 },
  { name: "Hardap", x: 35, y: 70 },
  { name: "Karas", x: 35, y: 85 },
]

export function NamibiaMap() {
  return (
    <div className="relative w-72 h-72 md:w-96 md:h-96">
      {/* Map outline */}
      <motion.svg
        viewBox="0 0 100 100"
        className="w-full h-full"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        {/* Simplified Namibia shape */}
        <motion.path
          d="M10,5 L60,5 L90,5 L90,20 L85,25 L80,20 L70,25 L60,20 L55,25 L50,20 L45,25 L40,20 L35,15 L25,20 L15,15 L10,20 L10,30 L5,50 L10,70 L15,95 L50,95 L55,80 L65,95 L60,70 L55,50 L60,40 L70,45 L80,35 L75,25 L90,20 L90,5 L60,5 L10,5 Z"
          fill="none"
          stroke="var(--primary)"
          strokeWidth="0.5"
          strokeOpacity="0.5"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 2, delay: 0.3 }}
        />
      </motion.svg>

      {/* Region dots */}
      {regions.map((region, index) => (
        <motion.div
          key={region.name}
          className="absolute"
          style={{
            left: `${region.x}%`,
            top: `${region.y}%`,
            transform: "translate(-50%, -50%)",
          }}
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{
            delay: 0.5 + index * 0.1,
            duration: 0.3,
            type: "spring",
          }}
        >
          <motion.div
            className="w-3 h-3 rounded-full bg-primary"
            animate={{
              scale: [1, 1.5, 1],
              opacity: [0.7, 1, 0.7],
            }}
            transition={{
              duration: 1.5,
              repeat: Number.POSITIVE_INFINITY,
              delay: index * 0.1,
            }}
          />
          <motion.div
            className="absolute inset-0 rounded-full bg-primary"
            animate={{
              scale: [1, 2.5],
              opacity: [0.5, 0],
            }}
            transition={{
              duration: 1.5,
              repeat: Number.POSITIVE_INFINITY,
              delay: index * 0.1,
            }}
          />
        </motion.div>
      ))}

      {/* Connection lines between regions */}
      <svg className="absolute inset-0 w-full h-full" style={{ zIndex: -1 }}>
        <defs>
          <linearGradient id="connectionGradient">
            <stop offset="0%" stopColor="var(--primary)" stopOpacity="0" />
            <stop offset="50%" stopColor="var(--primary)" stopOpacity="0.3" />
            <stop offset="100%" stopColor="var(--primary)" stopOpacity="0" />
          </linearGradient>
        </defs>
        {regions.slice(0, -1).map((region, i) => {
          const nextRegion = regions[i + 1]
          return (
            <motion.line
              key={i}
              x1={`${region.x}%`}
              y1={`${region.y}%`}
              x2={`${nextRegion.x}%`}
              y2={`${nextRegion.y}%`}
              stroke="url(#connectionGradient)"
              strokeWidth="1"
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ delay: 1 + i * 0.05, duration: 0.3 }}
            />
          )
        })}
      </svg>

      {/* Label */}
      <motion.div
        className="absolute bottom-0 left-1/2 -translate-x-1/2 text-center"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 2 }}
      >
        <span className="text-sm text-foreground/60">All 14 Regions Connected</span>
      </motion.div>
    </div>
  )
}
