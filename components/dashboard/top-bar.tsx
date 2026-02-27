"use client"

import React, { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Menu, Bell, Search, X, Command, TrendingUp, Handshake, MessageCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"

import { useNotifications } from "@/contexts/notification-context"
import { NotificationPanel } from "../notifications/notification-panel"
import { useAuth } from "@/contexts/auth-context"
import { UserAvatar } from "@/components/ui/user-avatar"
import Link from "next/link"
import Image from "next/image"
import { cn } from "@/lib/utils"
import { useRouter } from "next/navigation"
import useSWR from "swr"

// SWR fetcher
const fetcher = (url: string) => fetch(url).then((res) => res.json())

interface TopBarProps {
  onMenuClick: () => void
}

export function TopBar({ onMenuClick }: TopBarProps) {
  const [searchOpen, setSearchOpen] = useState(false)
  const [notificationsOpen, setNotificationsOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [currentTime, setCurrentTime] = useState(new Date())
  const { unreadCount } = useNotifications()
  const { user } = useAuth()
  const router = useRouter()
  
  // Fetch pending offers count and unread messages
  const { data: statsData } = useSWR("/api/user/stats", fetcher, { refreshInterval: 30000 })
  const pendingOffers = statsData?.stats?.pendingOffers || 0
  const unreadMessages = statsData?.stats?.unreadMessages || 0

  // Update time every second
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000)
    return () => clearInterval(timer)
  }, [])

  // Get time-based greeting and theme colors
  const getTimeTheme = () => {
    const hour = currentTime.getHours()
    if (hour >= 5 && hour < 12) {
      return { 
        greeting: "Good morning", 
        bgGradient: "from-amber-500/10 to-orange-500/10",
        borderColor: "border-amber-500/20",
        textColor: "text-amber-500",
        icon: "sunrise"
      }
    }
    if (hour >= 12 && hour < 17) {
      return { 
        greeting: "Good afternoon", 
        bgGradient: "from-blue-500/10 to-cyan-500/10",
        borderColor: "border-blue-500/20",
        textColor: "text-blue-500",
        icon: "sun"
      }
    }
    if (hour >= 17 && hour < 21) {
      return { 
        greeting: "Good evening", 
        bgGradient: "from-orange-500/10 to-rose-500/10",
        borderColor: "border-orange-500/20",
        textColor: "text-orange-500",
        icon: "sunset"
      }
    }
    return { 
      greeting: "Good night", 
      bgGradient: "from-indigo-500/10 to-purple-500/10",
      borderColor: "border-indigo-500/20",
      textColor: "text-indigo-400",
      icon: "moon"
    }
  }

  const timeTheme = getTimeTheme()

  // Handle search submit
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      router.push(`/dashboard/browse?search=${encodeURIComponent(searchQuery.trim())}`)
      setSearchOpen(false)
      setSearchQuery("")
    }
  }

  // Handle keyboard shortcut for search
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault()
        setSearchOpen(true)
      }
      if (e.key === "Escape") {
        setSearchOpen(false)
      }
    }
    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [])

  return (
    <header className="sticky top-0 z-40">
      {/* Premium gradient border effect */}
      <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-primary/50 to-transparent" />
      
      <div className="bg-background/80 backdrop-blur-xl border-b border-border/30">
        <div className="flex items-center justify-between h-16 px-4 lg:px-6">
          {/* Left side - Mobile menu & branding */}
          <div className="flex items-center gap-3">
            {/* Mobile menu button */}
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden rounded-xl hover:bg-primary/10"
              onClick={onMenuClick}
            >
              <Menu className="h-5 w-5" />
            </Button>

            {/* Logo/Brand - Desktop only */}
            <Link href="/dashboard" className="hidden lg:flex items-center gap-2">
              <motion.div 
                className="w-10 h-10 rounded-xl overflow-hidden shadow-lg shadow-primary/30"
                whileHover={{ scale: 1.05, rotate: 5 }}
              >
                <Image 
                  src="/logo.png" 
                  alt="Barter Trade Namibia" 
                  width={40} 
                  height={40} 
                  className="object-contain"
                  priority
                />
              </motion.div>
              <div>
                <span className="font-bold text-foreground">Barter Trade</span>
                <div className="flex items-center gap-1">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="text-[10px] text-emerald-400">Live</span>
                </div>
              </div>
            </Link>

            {/* Search - Desktop only */}
            <form onSubmit={handleSearch} className="hidden lg:flex relative group ml-6">
              <div className="absolute inset-0 bg-gradient-to-r from-primary/20 to-gold/20 rounded-2xl blur-xl opacity-0 group-focus-within:opacity-100 transition-opacity duration-300" />
              <div className="relative flex items-center">
                <Search className="absolute left-4 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search listings, users, categories..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-64 xl:w-96 pl-11 pr-20 bg-secondary/50 border-border/50 rounded-2xl focus:bg-secondary focus:border-primary/50 h-10 transition-all duration-300"
                />
                <div className="absolute right-3 flex items-center gap-2">
                  <kbd className="hidden xl:inline-flex h-5 items-center gap-1 rounded-md border border-border/50 bg-muted/50 px-1.5 font-mono text-[10px] text-muted-foreground">
                    <Command className="h-3 w-3" />K
                  </kbd>
                </div>
              </div>
            </form>
          </div>

          {/* Center - Time-based greeting banner (Desktop) */}
          <div className="hidden xl:flex items-center gap-4">
            <motion.div 
              className={cn(
                "flex items-center gap-3 px-4 py-1.5 rounded-full border",
                `bg-gradient-to-r ${timeTheme.bgGradient}`,
                timeTheme.borderColor
              )}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2 }}
            >
              <TrendingUp className={cn("h-4 w-4", timeTheme.textColor)} />
              <span className={cn("text-sm font-medium", timeTheme.textColor)}>
                {timeTheme.greeting}
                {user?.name && `, ${user.name.split(" ")[0]}`}
              </span>
              <div className={cn("w-1.5 h-1.5 rounded-full animate-pulse", timeTheme.textColor.replace("text-", "bg-"))} />
            </motion.div>
          </div>

          {/* Right side - Actions */}
          <div className="flex items-center gap-1.5 sm:gap-2 lg:gap-3">
            {/* Mobile search toggle */}
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden h-9 w-9 rounded-xl hover:bg-primary/10"
              onClick={() => setSearchOpen(!searchOpen)}
            >
              {searchOpen ? (
                <X className="h-4 w-4" />
              ) : (
                <Search className="h-4 w-4" />
              )}
            </Button>

            {/* Notifications */}
            <div className="relative">
              <Button
                variant="ghost"
                size="icon"
                className={cn(
                  "relative h-9 w-9 sm:h-10 sm:w-10 rounded-xl hover:bg-primary/10 transition-colors",
                  notificationsOpen && "bg-primary/10"
                )}
                onClick={() => setNotificationsOpen(!notificationsOpen)}
              >
                <Bell className="h-4 w-4 sm:h-5 sm:w-5" />
                {unreadCount > 0 && (
                  <motion.span
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="absolute -top-0.5 -right-0.5 h-4 w-4 sm:h-5 sm:w-5 bg-gradient-to-br from-rose-500 to-pink-500 text-white text-[9px] sm:text-[10px] font-bold rounded-full flex items-center justify-center shadow-lg shadow-rose-500/30"
                  >
                    {unreadCount > 9 ? "9+" : unreadCount}
                  </motion.span>
                )}
              </Button>

              <AnimatePresence>
                {notificationsOpen && (
                  <NotificationPanel onClose={() => setNotificationsOpen(false)} />
                )}
              </AnimatePresence>
            </div>

            {/* Messages Button - Mobile accessible */}
            <Link href="/dashboard/messages" className="lg:hidden">
              <Button
                variant="ghost"
                size="icon"
                className="relative h-9 w-9 sm:h-10 sm:w-10 rounded-xl hover:bg-primary/10 transition-colors"
              >
                <MessageCircle className="h-4 w-4 sm:h-5 sm:w-5" />
                {unreadMessages > 0 && (
                  <motion.span
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="absolute -top-0.5 -right-0.5 h-4 w-4 sm:h-5 sm:w-5 bg-gradient-to-br from-blue-500 to-cyan-500 text-white text-[9px] sm:text-[10px] font-bold rounded-full flex items-center justify-center shadow-lg shadow-blue-500/30"
                  >
                    {unreadMessages > 9 ? "9+" : unreadMessages}
                  </motion.span>
                )}
              </Button>
            </Link>

            {/* Offers Button - Always visible */}
            <Link href="/dashboard/offers">
              <Button
                variant="ghost"
                size="icon"
                className="relative h-9 w-9 sm:h-10 sm:w-10 rounded-xl hover:bg-primary/10 transition-colors"
              >
                <Handshake className="h-4 w-4 sm:h-5 sm:w-5" />
                {pendingOffers > 0 && (
                  <motion.span
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="absolute -top-0.5 -right-0.5 h-4 w-4 sm:h-5 sm:w-5 bg-gradient-to-br from-amber-500 to-orange-500 text-white text-[9px] sm:text-[10px] font-bold rounded-full flex items-center justify-center shadow-lg shadow-amber-500/30"
                  >
                    {pendingOffers > 9 ? "9+" : pendingOffers}
                  </motion.span>
                )}
              </Button>
            </Link>

            {/* User Avatar - Desktop only */}
            <Link href="/dashboard/profile" className="hidden lg:flex items-center">
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="relative"
              >
                <UserAvatar
                  src={user?.avatar}
                  name={user?.name}
                  gender={user?.gender}
                  size="md"
                  ring="primary"
                  showOnlineStatus
                  isOnline={true}
                  showVerifiedBadge
                  isVerified={user?.isVerified}
                />
              </motion.div>
            </Link>
          </div>
        </div>

        {/* Mobile search bar */}
        <AnimatePresence>
          {searchOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="lg:hidden overflow-hidden border-t border-border/30"
            >
              <form onSubmit={handleSearch} className="p-4">
                <div className="relative">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search listings, users, categories..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-11 bg-secondary/50 border-border/50 rounded-2xl h-12"
                    autoFocus
                  />
                  <Button 
                    type="submit" 
                    size="sm" 
                    className="absolute right-2 top-1/2 -translate-y-1/2 rounded-xl bg-gradient-to-r from-primary to-cyan-500"
                  >
                    <Search className="h-4 w-4" />
                  </Button>
                </div>
                
                {/* Quick search suggestions */}
                <div className="flex flex-wrap gap-2 mt-3">
                  {["Electronics", "Vehicles", "Property", "Fashion"].map((tag) => (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => {
                        setSearchQuery(tag)
                        router.push(`/dashboard/browse?category=${tag.toLowerCase()}`)
                        setSearchOpen(false)
                      }}
                      className="px-3 py-1.5 rounded-full bg-secondary/50 text-xs text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
                    >
                      {tag}
                    </button>
                  ))}
                </div>
              </form>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </header>
  )
}
