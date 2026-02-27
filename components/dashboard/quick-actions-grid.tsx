"use client"

import React from "react"

import { motion } from "framer-motion"
import {
  Plus,
  Search,
  MessageSquare,
  Wallet,
  Heart,
  MapPin,
  BarChart3,
  Gift,
  ArrowRight,
  Sparkles,
  QrCode,
  Bell,
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import Link from "next/link"
import { cn } from "@/lib/utils"

interface QuickAction {
  id: string
  title: string
  description: string
  icon: React.ElementType
  href: string
  gradient: string
  shadowColor: string
  badge?: string
  badgeColor?: string
}

const quickActions: QuickAction[] = [
  {
    id: "create",
    title: "Create Trade",
    description: "Post an item or service to trade",
    icon: Plus,
    href: "/dashboard/listings/new",
    gradient: "from-primary to-amber-500",
    shadowColor: "shadow-primary/25",
    badge: "Popular",
    badgeColor: "bg-emerald-500",
  },
  {
    id: "browse",
    title: "Browse Listings",
    description: "Discover items to trade",
    icon: Search,
    href: "/dashboard/browse",
    gradient: "from-blue-500 to-cyan-500",
    shadowColor: "shadow-blue-500/25",
  },
  {
    id: "messages",
    title: "Messages",
    description: "Chat with traders",
    icon: MessageSquare,
    href: "/dashboard/messages",
    gradient: "from-violet-500 to-purple-500",
    shadowColor: "shadow-violet-500/25",
    badge: "3 New",
    badgeColor: "bg-rose-500",
  },
  {
    id: "wallet",
    title: "My Wallet",
    description: "Manage your balance",
    icon: Wallet,
    href: "/dashboard/wallet",
    gradient: "from-emerald-500 to-green-500",
    shadowColor: "shadow-emerald-500/25",
  },
  {
    id: "saved",
    title: "Saved Items",
    description: "Your wishlist",
    icon: Heart,
    href: "/dashboard/saved",
    gradient: "from-rose-500 to-pink-500",
    shadowColor: "shadow-rose-500/25",
    badge: "12",
    badgeColor: "bg-rose-500",
  },
  {
    id: "nearby",
    title: "Nearby Deals",
    description: "Find local trades",
    icon: MapPin,
    href: "/dashboard/nearby",
    gradient: "from-cyan-500 to-teal-500",
    shadowColor: "shadow-cyan-500/25",
  },
  {
    id: "analytics",
    title: "Analytics",
    description: "Track performance",
    icon: BarChart3,
    href: "/dashboard/analytics",
    gradient: "from-indigo-500 to-blue-500",
    shadowColor: "shadow-indigo-500/25",
  },
  {
    id: "voucher",
    title: "Redeem Voucher",
    description: "Enter voucher code",
    icon: Gift,
    href: "/dashboard/wallet?tab=voucher",
    gradient: "from-amber-500 to-orange-500",
    shadowColor: "shadow-amber-500/25",
    badge: "Free N$50",
    badgeColor: "bg-emerald-500",
  },
]

function QuickActionCard({ action, index }: { action: QuickAction; index: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      whileHover={{ scale: 1.02, y: -4 }}
      whileTap={{ scale: 0.98 }}
    >
      <Link href={action.href}>
        <div
          className={cn(
            "relative overflow-hidden rounded-2xl p-4 h-full bg-card/50 backdrop-blur-sm border border-border/50 hover:border-primary/30 transition-all duration-300 cursor-pointer group",
            action.shadowColor
          )}
        >
          {/* Badge */}
          {action.badge && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2 + index * 0.05, type: "spring" }}
              className="absolute top-3 right-3"
            >
              <span
                className={cn(
                  "px-2 py-0.5 rounded-full text-[10px] font-bold text-white",
                  action.badgeColor
                )}
              >
                {action.badge}
              </span>
            </motion.div>
          )}

          {/* Icon */}
          <div
            className={cn(
              "w-12 h-12 rounded-xl flex items-center justify-center mb-3 bg-gradient-to-br transition-transform duration-300 group-hover:scale-110",
              action.gradient
            )}
          >
            <action.icon className="h-6 w-6 text-white" />
          </div>

          {/* Content */}
          <h3 className="font-semibold text-foreground mb-1 group-hover:text-primary transition-colors">
            {action.title}
          </h3>
          <p className="text-sm text-muted-foreground">{action.description}</p>

          {/* Hover arrow */}
          <motion.div
            initial={{ opacity: 0, x: -10 }}
            whileHover={{ opacity: 1, x: 0 }}
            className="absolute bottom-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <ArrowRight className="h-4 w-4 text-primary" />
          </motion.div>

          {/* Subtle gradient overlay on hover */}
          <div
            className={cn(
              "absolute inset-0 opacity-0 group-hover:opacity-5 transition-opacity bg-gradient-to-br rounded-2xl",
              action.gradient
            )}
          />
        </div>
      </Link>
    </motion.div>
  )
}

export function QuickActionsGrid() {
  return (
    <Card className="bg-card/50 backdrop-blur-sm border-border/50">
      <CardHeader className="pb-2">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500 to-purple-500 flex items-center justify-center">
            <Sparkles className="h-4 w-4 text-white" />
          </div>
          <CardTitle className="text-lg font-semibold text-foreground">Quick Actions</CardTitle>
        </div>
      </CardHeader>

      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {quickActions.map((action, index) => (
            <QuickActionCard key={action.id} action={action} index={index} />
          ))}
        </div>

        {/* Pro tip banner */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="mt-4 p-4 rounded-xl bg-gradient-to-r from-primary/10 to-amber-500/10 border border-primary/20"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center flex-shrink-0">
              <QrCode className="h-5 w-5 text-primary" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-foreground">Pro Tip: Share your QR code</p>
              <p className="text-xs text-muted-foreground">
                Let others scan your profile QR code to connect instantly
              </p>
            </div>
            <Link
              href="/dashboard/profile/qr"
              className="text-primary text-sm font-medium hover:underline flex-shrink-0"
            >
              Generate
            </Link>
          </div>
        </motion.div>
      </CardContent>
    </Card>
  )
}
