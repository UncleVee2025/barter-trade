"use client"

import { motion, useInView } from "framer-motion"
import { useRef, useState } from "react"
import { 
  Wallet, 
  Shield, 
  MessageSquare, 
  Zap, 
  Globe2, 
  BarChart3, 
  Smartphone, 
  Users, 
  ArrowRight,
  Lock,
  Bell,
  Camera,
  MapPin,
  Star,
  CreditCard,
  RefreshCw
} from "lucide-react"
import { cn } from "@/lib/utils"

const features = [
  {
    icon: Wallet,
    title: "Digital Wallet",
    description: "Secure digital wallet with instant P2P transfers, voucher redemption, and complete transaction history.",
    color: "from-primary to-orange-400",
    gradient: "bg-gradient-to-br from-primary/20 to-orange-400/20",
    size: "large",
    highlights: ["Instant transfers", "5% low fee", "Voucher system"],
  },
  {
    icon: Shield,
    title: "Verified Trading",
    description: "Every trade secured with our escrow system and multi-layer user verification.",
    color: "from-green-500 to-emerald-400",
    gradient: "bg-gradient-to-br from-green-500/20 to-emerald-400/20",
    size: "medium",
    highlights: ["ID verification", "Escrow protection"],
  },
  {
    icon: MessageSquare,
    title: "Real-Time Chat",
    description: "Instant messaging with read receipts, media sharing, and integrated offer management.",
    color: "from-blue-500 to-cyan-400",
    gradient: "bg-gradient-to-br from-blue-500/20 to-cyan-400/20",
    size: "medium",
    highlights: ["Instant messaging", "Trade offers"],
  },
  {
    icon: Zap,
    title: "Instant Listings",
    description: "Create listings in seconds with smart categories and AI-powered pricing suggestions.",
    color: "from-gold to-yellow-400",
    gradient: "bg-gradient-to-br from-gold/20 to-yellow-400/20",
    size: "small",
    highlights: ["Smart pricing"],
  },
  {
    icon: Globe2,
    title: "Nationwide",
    description: "Trade across all 14 Namibian regions with GPS-based discovery.",
    color: "from-purple-500 to-pink-400",
    gradient: "bg-gradient-to-br from-purple-500/20 to-pink-400/20",
    size: "small",
    highlights: ["14 regions"],
  },
  {
    icon: BarChart3,
    title: "Analytics",
    description: "Track your trades with detailed insights and performance metrics.",
    color: "from-red-500 to-rose-400",
    gradient: "bg-gradient-to-br from-red-500/20 to-rose-400/20",
    size: "small",
    highlights: ["Real-time data"],
  },
]

const additionalFeatures = [
  { icon: Lock, label: "End-to-end Encryption" },
  { icon: Bell, label: "Smart Notifications" },
  { icon: Camera, label: "Photo Verification" },
  { icon: MapPin, label: "Location Services" },
  { icon: Star, label: "Reputation System" },
  { icon: CreditCard, label: "Multiple Payment Methods" },
  { icon: RefreshCw, label: "Trade History" },
  { icon: Users, label: "Community Support" },
]

export function FeaturesSection() {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: "-100px" })
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null)

  return (
    <section id="features" ref={ref} className="relative py-24 lg:py-32 overflow-hidden">
      {/* Background pattern */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_50%,rgba(234,88,12,0.08),transparent_50%),radial-gradient(circle_at_70%_80%,rgba(234,179,8,0.06),transparent_50%)]" />

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Section header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={isInView ? { opacity: 1, scale: 1 } : {}}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 px-4 py-2 bg-card border border-border rounded-full mb-6"
          >
            <Smartphone className="h-4 w-4 text-primary" />
            <span className="text-sm font-medium text-foreground">Platform Features</span>
          </motion.div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-foreground mb-4 text-balance">
            Everything You Need to <span className="text-primary">Trade Smarter</span>
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto text-pretty">
            A complete trading ecosystem built for Namibians. Secure, fast, and reliable.
          </p>
        </motion.div>

        {/* Bento grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6 mb-16">
          {features.map((feature, i) => {
            const isLarge = feature.size === "large"
            const isMedium = feature.size === "medium"
            
            return (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 30 }}
                animate={isInView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.5, delay: i * 0.1 }}
                onMouseEnter={() => setHoveredIndex(i)}
                onMouseLeave={() => setHoveredIndex(null)}
                className={cn(
                  "group relative rounded-3xl border border-border bg-card/50 backdrop-blur-sm overflow-hidden transition-all duration-500",
                  isLarge && "md:col-span-2 lg:col-span-2 lg:row-span-2",
                  isMedium && "lg:col-span-2",
                  hoveredIndex === i && "border-primary/50 shadow-2xl shadow-primary/10 scale-[1.02]",
                  hoveredIndex !== null && hoveredIndex !== i && "opacity-60"
                )}
              >
                {/* Gradient background */}
                <div className={cn(
                  "absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500",
                  feature.gradient
                )} />

                {/* Content */}
                <div className={cn(
                  "relative z-10 p-6 lg:p-8 h-full flex flex-col",
                  isLarge && "lg:p-10"
                )}>
                  {/* Icon */}
                  <motion.div
                    whileHover={{ scale: 1.1, rotate: 5 }}
                    className={cn(
                      "w-14 h-14 rounded-2xl bg-gradient-to-br flex items-center justify-center mb-6 shadow-lg",
                      feature.color,
                      isLarge && "w-16 h-16"
                    )}
                  >
                    <feature.icon className={cn("text-white", isLarge ? "h-8 w-8" : "h-7 w-7")} />
                  </motion.div>

                  {/* Title */}
                  <h3 className={cn(
                    "font-bold text-foreground mb-3",
                    isLarge ? "text-2xl lg:text-3xl" : "text-xl"
                  )}>
                    {feature.title}
                  </h3>

                  {/* Description */}
                  <p className={cn(
                    "text-muted-foreground mb-6 flex-grow",
                    isLarge ? "text-lg" : "text-base"
                  )}>
                    {feature.description}
                  </p>

                  {/* Highlights */}
                  <div className="flex flex-wrap gap-2">
                    {feature.highlights.map((highlight, j) => (
                      <span
                        key={j}
                        className="px-3 py-1 text-xs font-medium text-foreground/70 bg-background/50 border border-border rounded-full"
                      >
                        {highlight}
                      </span>
                    ))}
                  </div>

                  {/* Arrow indicator */}
                  <motion.div
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: hoveredIndex === i ? 1 : 0, x: hoveredIndex === i ? 0 : -10 }}
                    className="absolute bottom-6 right-6 lg:bottom-8 lg:right-8"
                  >
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <ArrowRight className="h-5 w-5 text-primary" />
                    </div>
                  </motion.div>
                </div>

                {/* Decorative elements */}
                <div className="absolute -top-20 -right-20 w-40 h-40 bg-gradient-to-br from-primary/10 to-transparent rounded-full blur-2xl opacity-0 group-hover:opacity-100 transition-opacity" />
              </motion.div>
            )
          })}
        </div>

        {/* Additional features strip */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, delay: 0.6 }}
          className="relative"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-transparent to-gold/5 rounded-2xl" />
          <div className="relative p-6 lg:p-8 border border-border/50 rounded-2xl bg-card/30 backdrop-blur-sm">
            <div className="flex items-center justify-between flex-wrap gap-6">
              <div>
                <h3 className="text-lg font-semibold text-foreground mb-1">And so much more...</h3>
                <p className="text-sm text-muted-foreground">Discover all the features that make trading effortless</p>
              </div>
              <div className="flex flex-wrap gap-3">
                {additionalFeatures.map((feature, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={isInView ? { opacity: 1, scale: 1 } : {}}
                    transition={{ duration: 0.3, delay: 0.7 + i * 0.05 }}
                    whileHover={{ scale: 1.05, y: -2 }}
                    className="flex items-center gap-2 px-3 py-2 bg-background/50 border border-border/50 rounded-full cursor-default hover:border-primary/30 transition-colors"
                  >
                    <feature.icon className="h-4 w-4 text-primary" />
                    <span className="text-sm text-foreground/80">{feature.label}</span>
                  </motion.div>
                ))}
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  )
}
