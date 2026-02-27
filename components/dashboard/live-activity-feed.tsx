"use client"

import { useState, useEffect, useCallback } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
  Activity,
  ArrowRightLeft,
  ShoppingBag,
  UserPlus,
  Wallet,
  MessageSquare,
  Heart,
  Eye,
  BadgeCheck,
  Flame,
  TrendingUp,
  Zap,
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import useSWR from "swr"
import Link from "next/link"

// SWR fetcher
const fetcher = (url: string) => fetch(url).then((res) => res.json())

interface ActivityItem {
  id: string
  type: "trade" | "listing" | "user" | "wallet" | "message" | "save" | "view" | "offer"
  user: string
  userAvatar?: string
  isVerified?: boolean
  action: string
  target?: string
  amount?: number
  time: string
  region?: string
}

// Demo activity data
const initialActivities: ActivityItem[] = [
  {
    id: "1",
    type: "trade",
    user: "Maria S.",
    isVerified: true,
    action: "completed a trade",
    target: "iPhone 15 Pro Max",
    time: "Just now",
    region: "Windhoek",
  },
  {
    id: "2",
    type: "listing",
    user: "Peter K.",
    action: "listed",
    target: "Toyota Fortuner 2023",
    amount: 485000,
    time: "2 min ago",
    region: "Swakopmund",
  },
  {
    id: "3",
    type: "user",
    user: "Anna N.",
    action: "joined Barter Trade",
    time: "5 min ago",
    region: "Oshakati",
  },
  {
    id: "4",
    type: "wallet",
    user: "Thomas S.",
    isVerified: true,
    action: "topped up",
    amount: 1500,
    time: "8 min ago",
    region: "Otjiwarongo",
  },
  {
    id: "5",
    type: "offer",
    user: "Grace A.",
    action: "made an offer on",
    target: "Samsung OLED TV 77\"",
    time: "12 min ago",
    region: "Rundu",
  },
]

// New activities that will cycle in
const newActivities: ActivityItem[] = [
  {
    id: "n1",
    type: "listing",
    user: "Joseph M.",
    isVerified: true,
    action: "listed",
    target: "Boer Goats (20 Head)",
    amount: 32000,
    time: "Just now",
    region: "Mariental",
  },
  {
    id: "n2",
    type: "save",
    user: "Michael T.",
    action: "saved",
    target: "4 Bed House Klein Windhoek",
    time: "Just now",
    region: "Windhoek",
  },
  {
    id: "n3",
    type: "trade",
    user: "Linda K.",
    isVerified: true,
    action: "accepted offer for",
    target: "MacBook Pro M3 Max",
    time: "Just now",
    region: "Walvis Bay",
  },
  {
    id: "n4",
    type: "user",
    user: "David H.",
    action: "joined Barter Trade",
    time: "Just now",
    region: "Ondangwa",
  },
  {
    id: "n5",
    type: "view",
    user: "Sarah P.",
    action: "viewed",
    target: "Commercial Plot Lafrenz",
    time: "Just now",
    region: "Windhoek",
  },
  {
    id: "n6",
    type: "wallet",
    user: "Emma L.",
    isVerified: true,
    action: "redeemed voucher",
    amount: 100,
    time: "Just now",
    region: "Keetmanshoop",
  },
]

const iconMap = {
  trade: ArrowRightLeft,
  listing: ShoppingBag,
  user: UserPlus,
  wallet: Wallet,
  message: MessageSquare,
  save: Heart,
  view: Eye,
  offer: Flame,
}

const colorMap = {
  trade: { bg: "bg-emerald-500/15", text: "text-emerald-400", glow: "shadow-emerald-500/20" },
  listing: { bg: "bg-blue-500/15", text: "text-blue-400", glow: "shadow-blue-500/20" },
  user: { bg: "bg-violet-500/15", text: "text-violet-400", glow: "shadow-violet-500/20" },
  wallet: { bg: "bg-amber-500/15", text: "text-amber-400", glow: "shadow-amber-500/20" },
  message: { bg: "bg-cyan-500/15", text: "text-cyan-400", glow: "shadow-cyan-500/20" },
  save: { bg: "bg-rose-500/15", text: "text-rose-400", glow: "shadow-rose-500/20" },
  view: { bg: "bg-gray-500/15", text: "text-gray-400", glow: "shadow-gray-500/20" },
  offer: { bg: "bg-orange-500/15", text: "text-orange-400", glow: "shadow-orange-500/20" },
}

function ActivityItemComponent({
  activity,
  isNew,
}: {
  activity: ActivityItem
  isNew?: boolean
}) {
  const Icon = iconMap[activity.type]
  const colors = colorMap[activity.type]

  return (
    <motion.div
      initial={isNew ? { opacity: 0, x: -20, height: 0 } : { opacity: 1, x: 0, height: "auto" }}
      animate={{ opacity: 1, x: 0, height: "auto" }}
      exit={{ opacity: 0, x: 20, height: 0 }}
      transition={{ duration: 0.3 }}
      className="relative"
    >
      {/* New indicator dot */}
      {isNew && (
        <motion.div
          initial={{ opacity: 1 }}
          animate={{ opacity: 0 }}
          transition={{ delay: 3, duration: 1 }}
          className="absolute -left-1 top-1/2 -translate-y-1/2"
        >
          <div className="relative">
            <div className="w-2 h-2 rounded-full bg-primary" />
            <div className="absolute inset-0 w-2 h-2 rounded-full bg-primary animate-ping" />
          </div>
        </motion.div>
      )}

      <div className={cn(
        "flex items-start gap-3 py-3 px-3 rounded-xl transition-all cursor-pointer group",
        "hover:bg-muted/50",
        isNew && "bg-primary/5"
      )}>
        <motion.div 
          className={cn(
            "w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 shadow-lg",
            colors.bg,
            colors.glow
          )}
          whileHover={{ scale: 1.1, rotate: 5 }}
        >
          <Icon className={cn("h-4 w-4", colors.text)} />
        </motion.div>

        <div className="flex-1 min-w-0">
          <p className="text-sm text-foreground leading-relaxed">
            <span className="font-semibold inline-flex items-center gap-1">
              {activity.user}
              {activity.isVerified && (
                <BadgeCheck className="h-3.5 w-3.5 text-blue-500 inline" />
              )}
            </span>{" "}
            <span className="text-muted-foreground">{activity.action}</span>{" "}
            {activity.target && (
              <span className="font-medium text-primary">{activity.target}</span>
            )}
            {activity.amount && (
              <span className="font-bold text-emerald-400">
                {" "}N${activity.amount.toLocaleString()}
              </span>
            )}
          </p>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-xs text-muted-foreground">{activity.time}</span>
            {activity.region && (
              <>
                <span className="text-xs text-muted-foreground/50">|</span>
                <span className="text-xs text-muted-foreground">{activity.region}</span>
              </>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  )
}

export function LiveActivityFeed() {
  const [activities, setActivities] = useState(initialActivities)
  const [isLive, setIsLive] = useState(true)
  const [newActivityIndex, setNewActivityIndex] = useState(0)

  // Fetch real activity from API (would be real-time in production)
  const { data: activityData } = useSWR(
    isLive ? "/api/admin/activity" : null, 
    fetcher, 
    { refreshInterval: 10000 }
  )

  // Simulate live updates
  useEffect(() => {
    if (!isLive) return

    const interval = setInterval(() => {
      const newActivity = {
        ...newActivities[newActivityIndex % newActivities.length],
        id: `new-${Date.now()}`,
        time: "Just now",
      }

      setActivities((prev) => {
        // Update times for existing activities
        const updated = prev.map((a, i) => ({
          ...a,
          time: i === 0 ? "1 min ago" : i === 1 ? "2 min ago" : `${i + 2} min ago`,
        }))
        // Add new activity and remove oldest
        return [newActivity, ...updated.slice(0, 4)]
      })

      setNewActivityIndex((prev) => prev + 1)
    }, 4000)

    return () => clearInterval(interval)
  }, [isLive, newActivityIndex])

  return (
    <Card className="bg-card/50 backdrop-blur-sm border-border/50 h-full overflow-hidden">
      <CardHeader className="pb-3 border-b border-border/50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <motion.div 
              className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center shadow-lg shadow-emerald-500/30"
              animate={{ scale: isLive ? [1, 1.05, 1] : 1 }}
              transition={{ duration: 2, repeat: isLive ? Infinity : 0 }}
            >
              <Activity className="h-5 w-5 text-white" />
            </motion.div>
            <div>
              <CardTitle className="text-lg font-semibold text-foreground">Live Activity</CardTitle>
              <p className="text-xs text-muted-foreground">Platform-wide updates</p>
            </div>
          </div>

          <button
            onClick={() => setIsLive(!isLive)}
            className={cn(
              "flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold transition-all",
              isLive
                ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30"
                : "bg-muted text-muted-foreground border border-border"
            )}
          >
            <span className={cn(
              "relative w-2 h-2 rounded-full",
              isLive ? "bg-emerald-500" : "bg-muted-foreground"
            )}>
              {isLive && (
                <span className="absolute inset-0 rounded-full bg-emerald-500 animate-ping opacity-75" />
              )}
            </span>
            {isLive ? "Live" : "Paused"}
          </button>
        </div>
      </CardHeader>

      <CardContent className="p-4">
        <div className="space-y-1">
          <AnimatePresence mode="popLayout">
            {activities.map((activity, index) => (
              <ActivityItemComponent
                key={activity.id}
                activity={activity}
                isNew={index === 0 && activity.time === "Just now"}
              />
            ))}
          </AnimatePresence>
        </div>

        {/* Online users indicator - Premium */}
        <div className="mt-4 pt-4 border-t border-border/50">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex -space-x-2">
                {[
                  "from-primary to-amber-500",
                  "from-emerald-500 to-teal-500",
                  "from-violet-500 to-purple-500",
                  "from-rose-500 to-pink-500",
                ].map((gradient, i) => (
                  <motion.div
                    key={i}
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: i * 0.1 }}
                    className={cn(
                      "w-7 h-7 rounded-full border-2 border-card flex items-center justify-center text-[10px] font-bold text-white bg-gradient-to-br",
                      gradient
                    )}
                  >
                    {String.fromCharCode(65 + i)}
                  </motion.div>
                ))}
              </div>
              <div className="flex items-center gap-1.5">
                <Zap className="h-3.5 w-3.5 text-amber-500" />
                <span className="text-sm font-medium text-foreground">342</span>
                <span className="text-xs text-muted-foreground">online now</span>
              </div>
            </div>

            <div className="flex items-center gap-1.5">
              <BadgeCheck className="h-4 w-4 text-emerald-400" />
              <span className="text-xs font-medium text-emerald-400">Verified Platform</span>
            </div>
          </div>

          {/* View all link */}
          <Link 
            href="/dashboard/browse" 
            className="mt-3 flex items-center justify-center gap-2 py-2 px-4 rounded-xl bg-muted/50 hover:bg-muted transition-colors text-sm font-medium text-muted-foreground hover:text-foreground"
          >
            <TrendingUp className="h-4 w-4" />
            Browse All Listings
          </Link>
        </div>
      </CardContent>
    </Card>
  )
}
