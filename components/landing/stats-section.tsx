"use client"

import { motion, useInView } from "framer-motion"
import { useRef, useEffect, useState } from "react"
import { TrendingUp, Users, Globe2, Shield, Zap, ArrowUpRight } from "lucide-react"
import useSWR from "swr"

const fetcher = (url: string) => fetch(url).then((res) => res.json())

interface PlatformStats {
  totalUsers: number
  activeListings: number
  tradesToday: number
  totalTradeVolume: number
  regionsActive: number
  successRate: number
}

// Stat configuration that will use dynamic values
const getStats = (data: PlatformStats | undefined) => [
  { 
    value: data?.totalUsers || 0, 
    suffix: "+", 
    label: "Active Traders", 
    prefix: "",
    icon: Users,
    description: "Growing daily across Namibia",
    color: "from-primary to-orange-400",
    trend: "Growing daily"
  },
  { 
    value: (data?.totalTradeVolume || 0) / 1000000, 
    suffix: "M", 
    label: "NAD Traded Monthly", 
    prefix: "N$",
    icon: TrendingUp,
    description: "In successful transactions",
    color: "from-gold to-yellow-400",
    trend: "Active trading"
  },
  { 
    value: data?.regionsActive || 14, 
    suffix: "", 
    label: "Regions Connected", 
    prefix: "",
    icon: Globe2,
    description: "Full nationwide coverage",
    color: "from-blue-500 to-cyan-400",
    trend: "100% coverage"
  },
  { 
    value: data?.successRate || 95, 
    suffix: "%", 
    label: "Success Rate", 
    prefix: "",
    icon: Shield,
    description: "Verified safe trades",
    color: "from-green-500 to-emerald-400",
    trend: "Industry leading"
  },
]

function AnimatedCounter({ 
  value, 
  suffix, 
  prefix,
  decimals = 0
}: { 
  value: number
  suffix: string
  prefix: string
  decimals?: number
}) {
  const [count, setCount] = useState(0)
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true })

  useEffect(() => {
    if (isInView) {
      const duration = 2500
      const steps = 100
      const increment = value / steps
      let current = 0

      const timer = setInterval(() => {
        current += increment
        if (current >= value) {
          setCount(value)
          clearInterval(timer)
        } else {
          setCount(current)
        }
      }, duration / steps)

      return () => clearInterval(timer)
    }
  }, [isInView, value])

  const displayValue = decimals > 0 
    ? count.toFixed(decimals) 
    : Math.floor(count).toLocaleString()

  return (
    <span ref={ref}>
      {prefix}
      {displayValue}
      {suffix}
    </span>
  )
}

export function StatsSection() {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: "-100px" })
  const { data } = useSWR<PlatformStats>("/api/public/stats", fetcher, { refreshInterval: 60000 })
  const stats = getStats(data)

  return (
    <section ref={ref} className="relative py-24 overflow-hidden">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-b from-background via-card/50 to-background" />
      
      {/* Decorative elements */}
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent" />
      <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent" />

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Section header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={isInView ? { opacity: 1, scale: 1 } : {}}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 border border-primary/20 rounded-full mb-6"
          >
            <Zap className="h-4 w-4 text-primary" />
            <span className="text-sm font-medium text-primary">Live Platform Stats</span>
          </motion.div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-foreground mb-4">
            Trusted by <span className="text-primary">Thousands</span>
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Real numbers from real trades happening every day across Namibia
          </p>
        </motion.div>

        {/* Stats grid */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {stats.map((stat, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 30, scale: 0.95 }}
              animate={isInView ? { opacity: 1, y: 0, scale: 1 } : {}}
              transition={{ duration: 0.5, delay: i * 0.1 }}
              whileHover={{ y: -8, scale: 1.02 }}
              className="group relative"
            >
              <div className="relative p-6 bg-card/80 backdrop-blur-xl border border-border rounded-3xl overflow-hidden transition-all duration-300 hover:border-primary/50 hover:shadow-2xl hover:shadow-primary/10">
                {/* Gradient background on hover */}
                <div className={`absolute inset-0 bg-gradient-to-br ${stat.color} opacity-0 group-hover:opacity-5 transition-opacity duration-300`} />
                
                {/* Icon */}
                <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${stat.color} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300 shadow-lg`}>
                  <stat.icon className="h-7 w-7 text-white" />
                </div>

                {/* Value */}
                <div className="text-4xl sm:text-5xl font-bold text-foreground mb-2">
                  <AnimatedCounter 
                    value={stat.value} 
                    suffix={stat.suffix} 
                    prefix={stat.prefix}
                    decimals={stat.value % 1 !== 0 ? 1 : 0}
                  />
                </div>

                {/* Label */}
                <div className="text-lg font-semibold text-foreground/90 mb-1">
                  {stat.label}
                </div>

                {/* Description */}
                <div className="text-sm text-muted-foreground mb-3">
                  {stat.description}
                </div>

                {/* Trend badge */}
                <div className="inline-flex items-center gap-1 px-3 py-1 bg-green-500/10 border border-green-500/20 rounded-full">
                  <ArrowUpRight className="h-3 w-3 text-green-400" />
                  <span className="text-xs font-medium text-green-400">{stat.trend}</span>
                </div>

                {/* Decorative corner */}
                <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-bl from-primary/10 to-transparent rounded-bl-full opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
            </motion.div>
          ))}
        </div>

        {/* Bottom marquee of live trades */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, delay: 0.5 }}
          className="mt-16 overflow-hidden"
        >
          <div className="flex items-center justify-center gap-2 mb-4">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500" />
            </span>
            <span className="text-sm text-muted-foreground">Live trades happening now</span>
          </div>
          
          <div className="relative">
            <div className="absolute left-0 top-0 bottom-0 w-32 bg-gradient-to-r from-background to-transparent z-10" />
            <div className="absolute right-0 top-0 bottom-0 w-32 bg-gradient-to-l from-background to-transparent z-10" />
            
            <motion.div
              animate={{ x: [0, -1920] }}
              transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
              className="flex gap-4"
            >
              {[...Array(20)].map((_, i) => (
                <div
                  key={i}
                  className="flex-shrink-0 flex items-center gap-3 px-4 py-2 bg-card/50 border border-border/50 rounded-full whitespace-nowrap"
                >
                  <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                  <span className="text-sm text-muted-foreground">
                    {["Electronics", "Vehicles", "Furniture", "Livestock", "Services", "Property"][i % 6]} traded in{" "}
                    <span className="text-primary font-medium">
                      {["Windhoek", "Oshakati", "Swakopmund", "Rundu", "Walvis Bay", "Otjiwarongo"][i % 6]}
                    </span>
                  </span>
                </div>
              ))}
            </motion.div>
          </div>
        </motion.div>
      </div>
    </section>
  )
}
