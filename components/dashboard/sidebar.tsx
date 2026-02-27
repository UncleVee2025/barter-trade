"use client"

import { usePathname, useRouter } from "next/navigation"
import Link from "next/link"
import Image from "next/image"
import { motion, AnimatePresence } from "framer-motion"
import {
  Home,
  Package,
  MessageSquare,
  Heart,
  User,
  Settings,
  HelpCircle,
  LogOut,
  X,
  TrendingUp,
  Wallet,
  BarChart3,
  Shield,
  ChevronRight,
  Sparkles,
  Bell,
  Crown,
  Zap,
  Gift,
  ChevronDown,
  Eye,
  ArrowRightLeft,
  Trophy,
  Target,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { useAuth } from "@/contexts/auth-context"
import { useWallet } from "@/contexts/wallet-context"
import { Badge } from "@/components/ui/badge"
import { useState } from "react"
import useSWR from "swr"

// SWR fetcher
const fetcher = (url: string) => fetch(url).then((res) => res.json())

interface SidebarProps {
  open: boolean
  onClose: () => void
}

const menuItems = [
  { icon: Home, label: "Dashboard", href: "/dashboard", gradient: "from-blue-500 to-cyan-500" },
  { icon: Package, label: "My Listings", href: "/dashboard/listings", gradient: "from-emerald-500 to-green-500" },
  { icon: TrendingUp, label: "Browse", href: "/dashboard/browse", gradient: "from-violet-500 to-purple-500" },
  { icon: MessageSquare, label: "Messages", href: "/dashboard/messages", badge: "3", gradient: "from-rose-500 to-pink-500" },
  { icon: Heart, label: "Saved", href: "/dashboard/saved", gradient: "from-amber-500 to-orange-500" },
  { icon: Wallet, label: "Wallet", href: "/dashboard/wallet", gradient: "from-cyan-500 to-teal-500" },
]

// Trade Activities submenu items
const tradeActivityItems = [
  { icon: Package, label: "Active Listings", href: "/dashboard/listings?status=active" },
  { icon: ArrowRightLeft, label: "Completed Trades", href: "/dashboard/trades?status=completed" },
  { icon: Eye, label: "Total Views", href: "/dashboard/listings?view=analytics" },
  { icon: Trophy, label: "Success Rate", href: "/dashboard/profile#stats" },
]

const bottomItems = [
  { icon: User, label: "Profile", href: "/dashboard/profile" },
  { icon: Settings, label: "Settings", href: "/dashboard/settings" },
  { icon: HelpCircle, label: "Help Center", href: "/dashboard/help" },
]

// Currency formatter for N$ (Namibian Dollar) - the only currency used on the platform
const formatNAD = (amount: number) => `N$ ${amount.toLocaleString("en-NA", { minimumFractionDigits: 2 })}`

export function Sidebar({ open, onClose }: SidebarProps) {
  const pathname = usePathname()
  const router = useRouter()
  const { user, logout, isAdmin } = useAuth()
  const { balance } = useWallet()
  const [tradeActivityOpen, setTradeActivityOpen] = useState(false)

  // Fetch user stats
  const { data: statsData } = useSWR("/api/user/stats", fetcher, { refreshInterval: 30000 })
  const userStats = statsData?.stats || {
    activeListings: 0,
    successfulTrades: 0,
    totalViews: 0,
    successRate: 0,
    unreadMessages: 0,
  }

  const handleLogout = async () => {
    await logout()
    router.push("/auth")
  }

  // Calculate trader level based on trades
  const traderLevel = user?.walletBalance ? Math.min(Math.floor(user.walletBalance / 1000) + 1, 10) : 1
  const levelProgress = ((user?.walletBalance || 0) % 1000) / 10

  const SidebarContent = () => (
    <div className="flex flex-col h-full bg-sidebar relative overflow-hidden">
      {/* Premium glass overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-primary/5 via-transparent to-transparent pointer-events-none" />
      
      {/* Logo */}
      <div className="p-5 flex items-center justify-between border-b border-sidebar-border/50 relative z-10">
        <Link href="/dashboard" className="flex items-center gap-3 group">
          <motion.div
            whileHover={{ rotate: 5, scale: 1.05 }}
            className="w-11 h-11 rounded-xl overflow-hidden shadow-lg shadow-primary/30"
          >
            <Image 
              src="/logo.png" 
              alt="Barter Trade Namibia" 
              width={44} 
              height={44} 
              className="object-contain"
              priority
            />
          </motion.div>
          <div>
            <span className="font-bold text-sidebar-foreground text-lg">Barter Trade</span>
            <div className="flex items-center gap-1">
              <span className="text-xs text-primary font-medium">Namibia</span>
              <Sparkles className="h-3 w-3 text-primary" />
            </div>
          </div>
        </Link>
        <button
          onClick={onClose}
          className="lg:hidden text-sidebar-foreground/60 hover:text-sidebar-foreground p-2 rounded-lg hover:bg-sidebar-accent transition-colors"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      {/* User Profile Card - Premium */}
      {user && (
        <div className="p-3 mx-3 mt-4 rounded-2xl glass-card relative overflow-hidden border border-sidebar-border/30">
          {/* Level badge glow */}
          <div className="absolute -top-10 -right-10 w-24 h-24 bg-primary/20 rounded-full blur-2xl" />
          
          <div className="flex items-center gap-3 relative z-10">
            <div className="relative">
              <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-primary to-cyan-500 flex items-center justify-center overflow-hidden ring-2 ring-primary/30">
                {user.avatar ? (
                  <Image src={user.avatar || "/placeholder.svg"} alt={user.name || "User"} width={56} height={56} className="object-cover" />
                ) : (
                  <span className="text-white font-bold text-xl">{user.name?.charAt(0) || "U"}</span>
                )}
              </div>
              {/* Level badge */}
              <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-gradient-to-br from-primary to-cyan-500 border-2 border-sidebar flex items-center justify-center shadow-lg">
                <span className="text-[10px] font-bold text-white">{traderLevel}</span>
              </div>
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <p className="font-semibold text-sidebar-foreground truncate">{user.name}</p>
                {user.isVerified && (
                  <Shield className="h-4 w-4 text-blue-500 flex-shrink-0" />
                )}
              </div>
              <div className="flex items-center gap-2 mt-0.5">
                <Crown className="h-3 w-3 text-primary" />
                <span className="text-xs text-primary font-medium">Level {traderLevel} Trader</span>
              </div>
            </div>
          </div>

          {/* Level progress bar */}
          <div className="mt-3 relative z-10">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[10px] text-muted-foreground">Progress to Level {traderLevel + 1}</span>
              <span className="text-[10px] text-primary font-medium">{levelProgress.toFixed(0)}%</span>
            </div>
            <div className="h-1.5 bg-sidebar-accent rounded-full overflow-hidden">
              <motion.div 
                className="h-full bg-gradient-to-r from-primary to-cyan-500 rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${levelProgress}%` }}
                transition={{ duration: 1, ease: "easeOut" }}
              />
            </div>
          </div>

          {/* Wallet Balance - Prominent */}
          <Link
            href="/dashboard/wallet"
            className="mt-3 flex items-center justify-between p-3 rounded-xl bg-gradient-to-r from-emerald-500/10 to-teal-500/10 border border-emerald-500/20 hover:border-emerald-500/40 transition-all group"
          >
            <div className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center shadow-lg shadow-emerald-500/30">
                <Wallet className="h-4 w-4 text-white" />
              </div>
              <div>
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Credit Balance</p>
                <p className="font-bold text-lg text-sidebar-foreground">{formatNAD(balance)}</p>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <Zap className="h-4 w-4 text-emerald-500 opacity-0 group-hover:opacity-100 transition-opacity" />
              <ChevronRight className="h-4 w-4 text-sidebar-foreground/40 group-hover:text-emerald-500 transition-colors" />
            </div>
          </Link>
        </div>
      )}

      {/* Main menu */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        <p className="px-4 text-[10px] font-semibold text-sidebar-foreground/40 uppercase tracking-wider mb-3">Menu</p>
        {menuItems.map((item, index) => {
          const isActive = pathname === item.href || 
            (item.href !== "/dashboard" && pathname.startsWith(item.href))
          const badgeCount = item.label === "Messages" ? userStats.unreadMessages : null
          
          return (
            <motion.div
              key={item.href}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <Link
                href={item.href}
                onClick={onClose}
                className={cn(
                  "relative flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group",
                  isActive
                    ? "bg-sidebar-primary text-sidebar-primary-foreground shadow-lg shadow-primary/30"
                    : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground"
                )}
              >
                {isActive && (
                  <motion.div
                    layoutId="activeIndicator"
                    className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 rounded-r-full bg-white"
                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                  />
                )}
                <div className={cn(
                  "w-10 h-10 rounded-lg flex items-center justify-center transition-all",
                  isActive 
                    ? "bg-white/20" 
                    : `bg-gradient-to-br ${item.gradient} shadow-lg opacity-80 group-hover:opacity-100 group-hover:scale-105`
                )}>
                  <item.icon className="h-5 w-5 text-white" />
                </div>
                <span className="font-medium flex-1">{item.label}</span>
                {badgeCount && badgeCount > 0 && (
                  <Badge className={cn(
                    "text-[10px] font-bold",
                    isActive ? "bg-white/20 text-white" : "bg-rose-500 text-white"
                  )}>
                    {badgeCount}
                  </Badge>
                )}
              </Link>
            </motion.div>
          )
        })}

        {/* Trade Activities Collapsible Section */}
        <div className="mt-4">
          <button
            onClick={() => setTradeActivityOpen(!tradeActivityOpen)}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground transition-all"
          >
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-indigo-500 to-violet-500 flex items-center justify-center shadow-lg">
              <BarChart3 className="h-5 w-5 text-white" />
            </div>
            <span className="font-medium flex-1 text-left">Trade Activities</span>
            <motion.div
              animate={{ rotate: tradeActivityOpen ? 180 : 0 }}
              transition={{ duration: 0.2 }}
            >
              <ChevronDown className="h-4 w-4" />
            </motion.div>
          </button>

          <AnimatePresence>
            {tradeActivityOpen && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="overflow-hidden"
              >
                <div className="ml-4 pl-6 border-l border-sidebar-border/50 space-y-1 py-2">
                  {tradeActivityItems.map((item, idx) => {
                    const statsValue = idx === 0 ? userStats.activeListings :
                                      idx === 1 ? userStats.successfulTrades :
                                      idx === 2 ? userStats.totalViews :
                                      `${userStats.successRate}%`
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        onClick={onClose}
                        className="flex items-center justify-between px-3 py-2 rounded-lg text-sm text-sidebar-foreground/60 hover:bg-sidebar-accent hover:text-sidebar-foreground transition-all"
                      >
                        <div className="flex items-center gap-2">
                          <item.icon className="h-4 w-4" />
                          <span>{item.label}</span>
                        </div>
                        <Badge variant="secondary" className="text-[10px] bg-sidebar-accent">
                          {statsValue}
                        </Badge>
                      </Link>
                    )
                  })}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Voucher Banner */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="mx-1 mt-4"
        >
          <Link
            href="/dashboard/wallet?tab=voucher"
            className="block p-3 rounded-xl bg-gradient-to-r from-emerald-500/10 to-teal-500/10 border border-emerald-500/20 hover:border-emerald-500/40 transition-all"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center">
                <Gift className="h-5 w-5 text-white" />
              </div>
              <div>
                <p className="text-sm font-medium text-foreground">Got a voucher?</p>
                <p className="text-xs text-muted-foreground">Redeem for credits now</p>
              </div>
            </div>
          </Link>
        </motion.div>

        {/* Admin Link */}
        {isAdmin && (
          <>
            <div className="my-4 px-4">
              <div className="h-px bg-sidebar-border/50" />
            </div>
            <p className="px-4 text-[10px] font-semibold text-sidebar-foreground/40 uppercase tracking-wider mb-3">Admin</p>
            <Link
              href="/admin"
              onClick={onClose}
              className={cn(
                "flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group",
                pathname.startsWith("/admin")
                  ? "bg-gradient-to-r from-rose-500/20 to-orange-500/20 text-rose-500 border border-rose-500/30"
                  : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground"
              )}
            >
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-rose-500 to-orange-500 flex items-center justify-center shadow-lg shadow-rose-500/30">
                <Shield className="h-5 w-5 text-white" />
              </div>
              <span className="font-medium flex-1">Admin Panel</span>
              <Sparkles className="h-4 w-4 text-primary" />
            </Link>
          </>
        )}
      </nav>

      {/* Bottom menu */}
      <div className="px-3 py-4 border-t border-sidebar-border/50 space-y-1">
        {bottomItems.map((item) => {
          const isActive = pathname === item.href
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onClose}
              className={cn(
                "flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all duration-200",
                isActive
                  ? "bg-sidebar-accent text-sidebar-foreground"
                  : "text-sidebar-foreground/60 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
              )}
            >
              <item.icon className="h-5 w-5" />
              <span className="font-medium text-sm">{item.label}</span>
            </Link>
          )
        })}

        <button
          onClick={handleLogout}
          className="flex items-center gap-3 px-4 py-2.5 rounded-xl text-rose-500 hover:bg-rose-500/10 transition-all duration-200 w-full"
        >
          <LogOut className="h-5 w-5" />
          <span className="font-medium text-sm">Logout</span>
        </button>

        {/* Version badge */}
        <div className="pt-3 px-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <p className="text-[10px] text-sidebar-foreground/30">Connected</p>
          </div>
          <Badge variant="outline" className="text-[10px] text-sidebar-foreground/40 border-sidebar-border/50">
            v3.0 Production
          </Badge>
        </div>
      </div>
    </div>
  )

  return (
    <>
      {/* Desktop sidebar - Always visible on lg screens */}
      <div className="hidden lg:fixed lg:inset-y-0 lg:z-50 lg:flex lg:w-72 lg:flex-col">
        <div className="h-full border-r border-sidebar-border/30">
          <SidebarContent />
        </div>
      </div>

      {/* Mobile sidebar - Slide in panel */}
      <AnimatePresence>
        {open && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm lg:hidden"
              onClick={onClose}
            />
            <motion.div
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="fixed inset-y-0 left-0 z-50 w-72 lg:hidden"
            >
              <SidebarContent />
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  )
}
