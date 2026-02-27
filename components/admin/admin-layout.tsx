"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { usePathname, useRouter } from "next/navigation"
import Link from "next/link"
import Image from "next/image"
import { motion, AnimatePresence } from "framer-motion"
import {
  LayoutDashboard,
  Users,
  Package,
  Ticket,
  Bell,
  Settings,
  ChevronLeft,
  ChevronRight,
  LogOut,
  TrendingUp,
  Wallet,
  Mail,
  Shield,
  Activity,
  FileText,
  DollarSign,
  Megaphone,
  HeadphonesIcon,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { useAuth } from "@/contexts/auth-context"
import useSWR from "swr"

// Badge counts interface
interface AdminCounts {
  pendingTopups: number
  pendingVerifications: number
  pendingReports: number
  unreadNotifications: number
}

const fetcher = (url: string) => fetch(url).then(r => r.ok ? r.json() : { pendingTopups: 0, pendingVerifications: 0, pendingReports: 0, unreadNotifications: 0 })

interface AdminLayoutProps {
  children: React.ReactNode
}

const menuItems = [
  { icon: LayoutDashboard, label: "Dashboard", href: "/admin" },
  { icon: Activity, label: "Activity Feed", href: "/admin/activity" },
  { icon: TrendingUp, label: "Analytics", href: "/admin/analytics" },
  { icon: Users, label: "Users", href: "/admin/users" },
  { icon: Shield, label: "ID Verification", href: "/admin/verification" },
  { icon: Package, label: "Listings", href: "/admin/listings" },
  { icon: FileText, label: "Reports", href: "/admin/reports" },
  { icon: DollarSign, label: "Top-up Requests", href: "/admin/topups" },
  { icon: Wallet, label: "Transactions", href: "/admin/transactions" },
  { icon: Ticket, label: "Vouchers", href: "/admin/vouchers" },
  { icon: HeadphonesIcon, label: "Support", href: "/admin/support" },
  { icon: Megaphone, label: "Ads", href: "/admin/ads" },
  { icon: Mail, label: "Waitlist", href: "/admin/waitlist" },
  { icon: Bell, label: "Notifications", href: "/admin/notifications" },
  { icon: Settings, label: "Settings", href: "/admin/settings" },
]

export function AdminLayout({ children }: AdminLayoutProps) {
  const pathname = usePathname()
  const router = useRouter()
  const { logout } = useAuth()
  const [collapsed, setCollapsed] = useState(false)

  // Fetch pending counts for notification badges
  const { data: counts } = useSWR<AdminCounts>(
    "/api/admin/pending-counts",
    fetcher,
    { refreshInterval: 30000, fallbackData: { pendingTopups: 0, pendingVerifications: 0, pendingReports: 0, unreadNotifications: 0 } }
  )

  // Get badge count for a specific menu item
  const getBadgeCount = (href: string): number => {
    if (!counts) return 0
    switch (href) {
      case "/admin/topups":
        return counts.pendingTopups
      case "/admin/verification":
        return counts.pendingVerifications
      case "/admin/reports":
        return counts.pendingReports
      case "/admin/notifications":
        return counts.unreadNotifications
      default:
        return 0
    }
  }

  const handleLogout = async () => {
    await logout()
    router.push("/auth")
  }

  return (
    <div className="min-h-screen bg-background flex">
      {/* Sidebar */}
      <motion.aside
        initial={false}
        animate={{ width: collapsed ? 72 : 256 }}
        className="fixed inset-y-0 left-0 z-50 bg-sidebar border-r border-sidebar-border flex flex-col"
      >
        {/* Logo */}
        <div className="h-16 flex items-center justify-between px-4 border-b border-sidebar-border">
          <AnimatePresence mode="wait">
            {!collapsed && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex items-center gap-2"
              >
                <div className="w-9 h-9 rounded-lg overflow-hidden">
                  <Image 
                    src="/logo.png" 
                    alt="Barter Trade Namibia" 
                    width={36} 
                    height={36} 
                    className="object-contain"
                    priority
                  />
                </div>
                <div>
                  <span className="font-bold text-sidebar-foreground text-sm">Barter Trade</span>
                  <p className="text-xs text-sidebar-foreground/60">Admin Panel</p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="w-8 h-8 rounded-lg hover:bg-sidebar-accent flex items-center justify-center text-sidebar-foreground/60"
          >
            {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 py-4 px-2 space-y-1 overflow-y-auto">
          {menuItems.map((item) => {
            const isActive = pathname === item.href || (item.href !== "/admin" && pathname.startsWith(item.href))
            const badgeCount = getBadgeCount(item.href)
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all relative",
                  collapsed ? "justify-center" : "",
                  isActive
                    ? "bg-sidebar-primary text-sidebar-primary-foreground"
                    : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground",
                )}
                title={collapsed ? item.label : undefined}
              >
                <div className="relative">
                  <item.icon className="h-5 w-5 flex-shrink-0" />
                  {/* Red notification dot for collapsed sidebar */}
                  {collapsed && badgeCount > 0 && (
                    <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-red-500 rounded-full animate-pulse" />
                  )}
                </div>
                <AnimatePresence>
                  {!collapsed && (
                    <motion.span
                      initial={{ opacity: 0, width: 0 }}
                      animate={{ opacity: 1, width: "auto" }}
                      exit={{ opacity: 0, width: 0 }}
                      className="font-medium text-sm whitespace-nowrap overflow-hidden flex-1"
                    >
                      {item.label}
                    </motion.span>
                  )}
                </AnimatePresence>
                {/* Badge count for expanded sidebar */}
                {!collapsed && badgeCount > 0 && (
                  <motion.span
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className={cn(
                      "min-w-5 h-5 flex items-center justify-center text-xs font-bold rounded-full",
                      isActive 
                        ? "bg-white/20 text-white" 
                        : "bg-red-500 text-white"
                    )}
                  >
                    {badgeCount > 99 ? "99+" : badgeCount}
                  </motion.span>
                )}
              </Link>
            )
          })}
        </nav>

        {/* Footer */}
        <div className="p-2 border-t border-sidebar-border">
          <button
            onClick={handleLogout}
            className={cn(
              "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-red-400 hover:bg-red-500/10 transition-all",
              collapsed && "justify-center",
            )}
          >
            <LogOut className="h-5 w-5" />
            {!collapsed && <span className="font-medium text-sm">Logout</span>}
          </button>
        </div>
      </motion.aside>

      {/* Main content */}
      <main
        className={cn("flex-1 min-h-screen transition-all duration-300", collapsed ? "ml-[72px]" : "ml-64")}
        style={{ marginLeft: collapsed ? 72 : 256 }}
      >
        <div className="p-6">{children}</div>
      </main>
    </div>
  )
}
