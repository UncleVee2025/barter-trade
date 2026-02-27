"use client"

import { motion } from "framer-motion"
import { Users, MessageCircle, Star } from "lucide-react"

const regions = [
  { name: "Windhoek", x: 35, y: 55, size: "lg", users: "15K+" },
  { name: "Swakopmund", x: 18, y: 48, size: "md", users: "8K+" },
  { name: "Walvis Bay", x: 15, y: 52, size: "md", users: "6K+" },
  { name: "Oshakati", x: 42, y: 18, size: "md", users: "5K+" },
  { name: "Rundu", x: 68, y: 18, size: "sm", users: "3K+" },
  { name: "Katima Mulilo", x: 88, y: 12, size: "sm", users: "2K+" },
  { name: "Otjiwarongo", x: 40, y: 38, size: "sm", users: "2K+" },
  { name: "Keetmanshoop", x: 38, y: 78, size: "sm", users: "1K+" },
]

export function ModernMapAnimation() {
  return (
    <div className="relative w-80 h-80 lg:w-96 lg:h-96">
      {/* Map container */}
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="absolute inset-0"
      >
        {/* Namibia shape outline */}
        <svg viewBox="0 0 100 100" className="w-full h-full">
          <defs>
            <linearGradient id="mapGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="var(--primary)" stopOpacity="0.2" />
              <stop offset="100%" stopColor="var(--gold)" stopOpacity="0.1" />
            </linearGradient>
          </defs>
          <motion.path
            d="M15,8 L50,5 L88,8 L92,22 L85,28 L75,22 L65,28 L55,22 L48,28 L40,22 L30,15 L20,22 L12,18 L8,28 L5,50 L8,72 L15,95 L48,95 L55,78 L62,95 L58,72 L52,50 L58,38 L72,45 L82,32 L78,22 L92,18 L92,8 L50,5 L15,8 Z"
            fill="url(#mapGradient)"
            stroke="var(--primary)"
            strokeWidth="0.5"
            strokeOpacity="0.5"
            initial={{ pathLength: 0, fillOpacity: 0 }}
            animate={{ pathLength: 1, fillOpacity: 1 }}
            transition={{ duration: 2 }}
          />
        </svg>
      </motion.div>

      {/* City markers */}
      {regions.map((region, i) => (
        <motion.div
          key={region.name}
          className="absolute"
          style={{ left: `${region.x}%`, top: `${region.y}%`, transform: "translate(-50%, -50%)" }}
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.5 + i * 0.1, type: "spring" }}
        >
          <motion.div className="relative group cursor-pointer" whileHover={{ scale: 1.2 }}>
            {/* Pulse ring */}
            <motion.div
              className={`absolute inset-0 rounded-full bg-primary ${
                region.size === "lg" ? "w-6 h-6 -m-1.5" : region.size === "md" ? "w-5 h-5 -m-1" : "w-4 h-4 -m-0.5"
              }`}
              animate={{ scale: [1, 1.5, 1], opacity: [0.5, 0, 0.5] }}
              transition={{ duration: 2, repeat: Number.POSITIVE_INFINITY, delay: i * 0.2 }}
            />

            {/* Marker dot */}
            <div
              className={`relative rounded-full bg-primary shadow-lg shadow-primary/30 ${
                region.size === "lg" ? "w-3 h-3" : region.size === "md" ? "w-2.5 h-2.5" : "w-2 h-2"
              }`}
            />

            {/* Tooltip */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              whileHover={{ opacity: 1, y: 0 }}
              className="absolute left-1/2 -translate-x-1/2 top-full mt-2 px-2 py-1 bg-card border border-border rounded-lg shadow-lg whitespace-nowrap z-10 pointer-events-none"
            >
              <div className="text-xs font-medium text-foreground">{region.name}</div>
              <div className="text-[10px] text-primary">{region.users} users</div>
            </motion.div>
          </motion.div>
        </motion.div>
      ))}

      {/* Floating stats */}
      {[
        { icon: Users, value: "50K+", label: "Users", x: 85, y: 70 },
        { icon: MessageCircle, value: "100K+", label: "Trades", x: 10, y: 75 },
        { icon: Star, value: "4.9", label: "Rating", x: 75, y: 35 },
      ].map((stat, i) => (
        <motion.div
          key={i}
          className="absolute"
          style={{ left: `${stat.x}%`, top: `${stat.y}%` }}
          initial={{ opacity: 0, scale: 0 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 1.5 + i * 0.2, type: "spring" }}
        >
          <motion.div
            animate={{ y: [0, -5, 0] }}
            transition={{ duration: 3, repeat: Number.POSITIVE_INFINITY, delay: i * 0.5 }}
            className="flex items-center gap-2 px-3 py-2 bg-card/90 backdrop-blur-sm border border-border rounded-xl shadow-lg"
          >
            <stat.icon className="w-4 h-4 text-primary" />
            <div>
              <div className="text-sm font-bold text-foreground">{stat.value}</div>
              <div className="text-[10px] text-muted-foreground">{stat.label}</div>
            </div>
          </motion.div>
        </motion.div>
      ))}

      {/* Connection lines between cities */}
      <svg className="absolute inset-0 w-full h-full" style={{ zIndex: -1 }}>
        <defs>
          <linearGradient id="connectionLine" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="var(--primary)" stopOpacity="0" />
            <stop offset="50%" stopColor="var(--primary)" stopOpacity="0.3" />
            <stop offset="100%" stopColor="var(--primary)" stopOpacity="0" />
          </linearGradient>
        </defs>
        {regions.slice(0, 5).map((region, i) => {
          const nextRegion = regions[(i + 1) % regions.length]
          return (
            <motion.line
              key={i}
              x1={`${region.x}%`}
              y1={`${region.y}%`}
              x2={`${nextRegion.x}%`}
              y2={`${nextRegion.y}%`}
              stroke="url(#connectionLine)"
              strokeWidth="1"
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ delay: 2 + i * 0.1, duration: 0.5 }}
            />
          )
        })}
      </svg>
    </div>
  )
}
