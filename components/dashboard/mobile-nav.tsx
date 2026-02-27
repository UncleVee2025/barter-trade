"use client"

import { usePathname, useRouter } from "next/navigation"
import Link from "next/link"
import { motion, AnimatePresence } from "framer-motion"
import { Plus, MessageCircle, Sparkles } from "lucide-react"
import { cn } from "@/lib/utils"
import useSWR from "swr"
import { useWallet } from "@/contexts/wallet-context"

// SWR fetcher
const fetcher = (url: string) => fetch(url).then((res) => res.json())

// Enterprise 2026 Custom Icons - Bold, confident design
const HomeIcon = ({ className, isActive }: { className?: string; isActive?: boolean }) => (
  <svg viewBox="0 0 24 24" fill="none" className={className}>
    {isActive ? (
      <path d="M3 10.5V20C3 20.5523 3.44772 21 4 21H9V15C9 14.4477 9.44772 14 10 14H14C14.5523 14 15 14.4477 15 15V21H20C20.5523 21 21 20.5523 21 20V10.5L12 4L3 10.5Z" fill="currentColor" />
    ) : (
      <path d="M3 10.5V20C3 20.5523 3.44772 21 4 21H9V15C9 14.4477 9.44772 14 10 14H14C14.5523 14 15 14.4477 15 15V21H20C20.5523 21 21 20.5523 21 20V10.5L12 4L3 10.5Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    )}
  </svg>
)

const ExploreIcon = ({ className, isActive }: { className?: string; isActive?: boolean }) => (
  <svg viewBox="0 0 24 24" fill="none" className={className}>
    <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth={isActive ? "2" : "1.5"} />
    <path d="M16.24 7.76L14.12 14.12L7.76 16.24L9.88 9.88L16.24 7.76Z" fill={isActive ? "currentColor" : "none"} stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
)

const MessagesIcon = ({ className, isActive }: { className?: string; isActive?: boolean }) => (
  <svg viewBox="0 0 24 24" fill="none" className={className}>
    {isActive ? (
      <>
        <path d="M4 6C4 4.89543 4.89543 4 6 4H18C19.1046 4 20 4.89543 20 6V14C20 15.1046 19.1046 16 18 16H8L4 20V6Z" fill="currentColor" />
        <path d="M8 9H16M8 12H12" stroke="white" strokeWidth="1.5" strokeLinecap="round" />
      </>
    ) : (
      <>
        <path d="M4 6C4 4.89543 4.89543 4 6 4H18C19.1046 4 20 4.89543 20 6V14C20 15.1046 19.1046 16 18 16H8L4 20V6Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M8 9H16M8 12H12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      </>
    )}
  </svg>
)

const ProfileIcon = ({ className, isActive }: { className?: string; isActive?: boolean }) => (
  <svg viewBox="0 0 24 24" fill="none" className={className}>
    {isActive ? (
      <>
        <circle cx="12" cy="8" r="4" fill="currentColor" />
        <path d="M4 20C4 16.6863 7.58172 14 12 14C16.4183 14 20 16.6863 20 20" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      </>
    ) : (
      <>
        <circle cx="12" cy="8" r="4" stroke="currentColor" strokeWidth="1.5" />
        <path d="M4 20C4 16.6863 7.58172 14 12 14C16.4183 14 20 16.6863 20 20" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      </>
    )}
  </svg>
)

const WalletIcon = ({ className, isActive }: { className?: string; isActive?: boolean }) => (
  <svg viewBox="0 0 24 24" fill="none" className={className}>
    {isActive ? (
      <>
        <rect x="3" y="6" width="18" height="14" rx="2" fill="currentColor" />
        <path d="M3 10H21" stroke="white" strokeWidth="1.5" />
        <circle cx="16" cy="14" r="1.5" fill="white" />
      </>
    ) : (
      <>
        <rect x="3" y="6" width="18" height="14" rx="2" stroke="currentColor" strokeWidth="1.5" />
        <path d="M3 10H21" stroke="currentColor" strokeWidth="1.5" />
        <circle cx="16" cy="14" r="1.5" stroke="currentColor" strokeWidth="1.5" />
      </>
    )}
  </svg>
)

const navItems = [
  { icon: HomeIcon, label: "Home", href: "/dashboard" },
  { icon: ExploreIcon, label: "Browse", href: "/dashboard/browse" },
  // Create button goes in the middle (index 2)
  { icon: MessagesIcon, label: "Messages", href: "/dashboard/messages" },
  { icon: WalletIcon, label: "Wallet", href: "/dashboard/wallet" },
]

export function MobileNav() {
  const pathname = usePathname()
  const router = useRouter()
  const { balance } = useWallet()

  // Fetch unread messages count and notifications
  const { data: statsData } = useSWR("/api/user/stats", fetcher, { refreshInterval: 15000 })
  const unreadMessages = statsData?.stats?.unreadMessages || 0

  // Direct navigation to create listing
  const handleCreateClick = () => {
    router.push("/dashboard/listings/new")
  }

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 lg:hidden">
      {/* Enterprise glass morphism background with gradient accent */}
      <div className="absolute inset-0 bg-background/95 backdrop-blur-2xl border-t border-border/50">
        {/* Premium top gradient accent */}
        <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-primary/50 via-amber-500/50 to-primary/50" />
        {/* Inner glow */}
        <div className="absolute inset-0 bg-gradient-to-t from-background/50 to-transparent" />
      </div>
      
      <div className="relative flex items-end justify-around px-2 pt-2 pb-2 safe-area-bottom max-w-lg mx-auto">
        {/* Left side nav items */}
        {navItems.slice(0, 2).map((item) => {
          const isActive = pathname === item.href || 
            (item.href !== "/dashboard" && pathname.startsWith(item.href))
          
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "relative flex flex-col items-center justify-center gap-1 py-2 px-4 rounded-xl transition-all duration-200 min-w-[60px]",
                isActive
                  ? "text-primary"
                  : "text-muted-foreground hover:text-foreground active:scale-95"
              )}
            >
              {isActive && (
                <motion.div
                  layoutId="mobileNavIndicator"
                  className="absolute inset-0 bg-primary/10 rounded-xl border border-primary/20"
                  transition={{ type: "spring", stiffness: 500, damping: 35 }}
                />
              )}
              <div className="relative z-10">
                <item.icon className={cn(
                  "h-6 w-6 transition-all duration-200",
                  isActive && "scale-110"
                )} isActive={isActive} />
              </div>
              <span className={cn(
                "text-[10px] tracking-wide transition-all duration-200 relative z-10",
                isActive ? "font-bold text-primary" : "font-medium"
              )}>
                {item.label}
              </span>
            </Link>
          )
        })}

        {/* Center Create Button - Premium Floating Action */}
        <div className="relative flex flex-col items-center -mt-6">
          <motion.button
            onClick={handleCreateClick}
            whileTap={{ scale: 0.9 }}
            className="relative flex items-center justify-center w-[60px] h-[60px] rounded-2xl bg-gradient-to-br from-primary via-primary to-amber-500 text-primary-foreground shadow-xl"
            style={{
              boxShadow: "0 8px 30px rgba(var(--primary), 0.4), 0 0 0 2px rgba(255, 255, 255, 0.1) inset"
            }}
          >
            {/* Animated sparkle effect */}
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
              className="absolute inset-0 rounded-2xl overflow-hidden"
            >
              <div className="absolute top-0 left-1/2 w-8 h-8 bg-white/20 blur-xl" />
            </motion.div>
            
            <Plus className="h-7 w-7 relative z-10" strokeWidth={2.5} />
            
            {/* Inner highlight */}
            <div className="absolute inset-0 rounded-2xl bg-gradient-to-b from-white/20 to-transparent pointer-events-none" />
          </motion.button>
          
          <span className="text-[10px] font-bold mt-1.5 text-primary tracking-wide">
            List Item
          </span>
        </div>

        {/* Right side nav items */}
        {navItems.slice(2).map((item) => {
          const isActive = pathname === item.href || 
            (item.href !== "/dashboard" && pathname.startsWith(item.href))
          const hasNotification = item.label === "Messages" && unreadMessages > 0
          const isWallet = item.label === "Wallet"
          
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "relative flex flex-col items-center justify-center gap-1 py-2 px-4 rounded-xl transition-all duration-200 min-w-[60px]",
                isActive
                  ? "text-primary"
                  : "text-muted-foreground hover:text-foreground active:scale-95"
              )}
            >
              {isActive && (
                <motion.div
                  layoutId="mobileNavIndicator"
                  className="absolute inset-0 bg-primary/10 rounded-xl border border-primary/20"
                  transition={{ type: "spring", stiffness: 500, damping: 35 }}
                />
              )}
              <div className="relative z-10">
                <item.icon className={cn(
                  "h-6 w-6 transition-all duration-200",
                  isActive && "scale-110"
                )} isActive={isActive} />
                
                {/* Message Notification Badge */}
                {hasNotification && (
                  <motion.span
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="absolute -top-1 -right-2 flex items-center justify-center min-w-[18px] h-[18px] px-1 text-[10px] font-bold text-white bg-red-500 rounded-full shadow-lg"
                  >
                    {unreadMessages > 9 ? "9+" : unreadMessages}
                  </motion.span>
                )}
              </div>
              <span className={cn(
                "text-[10px] tracking-wide transition-all duration-200 relative z-10",
                isActive ? "font-bold text-primary" : "font-medium"
              )}>
                {isWallet ? `N$${balance >= 1000 ? `${(balance/1000).toFixed(1)}k` : balance.toFixed(0)}` : item.label}
              </span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
