"use client"

import type React from "react"
import { useState, useRef, useEffect, useCallback } from "react"
import { motion, AnimatePresence, useMotionValue, useTransform, useSpring, useAnimationControls } from "framer-motion"
import {
  Wallet,
  ChevronDown,
  Plus,
  Send,
  History,
  ArrowUpRight,
  ArrowDownLeft,
  Ticket,
  RefreshCw,
  TrendingUp,
  TrendingDown,
  Sparkles,
  Coins,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { useWallet } from "@/contexts/wallet-context"
import { useNotifications } from "@/contexts/notification-context"
import { cn } from "@/lib/utils"
import { WalletModal } from "./wallet-modal"

// Animated number counter component
function AnimatedNumber({ value, duration = 0.5 }: { value: number; duration?: number }) {
  const [displayValue, setDisplayValue] = useState(value)
  const previousValue = useRef(value)

  useEffect(() => {
    if (value === previousValue.current) return
    
    const startValue = previousValue.current
    const endValue = value
    const startTime = Date.now()
    const durationMs = duration * 1000

    const animate = () => {
      const elapsed = Date.now() - startTime
      const progress = Math.min(elapsed / durationMs, 1)
      
      // Easing function for smooth animation
      const easeOutExpo = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress)
      const currentValue = startValue + (endValue - startValue) * easeOutExpo
      
      setDisplayValue(Math.round(currentValue))
      
      if (progress < 1) {
        requestAnimationFrame(animate)
      }
    }
    
    requestAnimationFrame(animate)
    previousValue.current = value
  }, [value, duration])

  return <>{new Intl.NumberFormat("en-NA").format(displayValue)}</>
}

// Format as NAD currency (Namibian Dollars)
const formatNAD = (amount: number) => `N$ ${new Intl.NumberFormat("en-NA").format(amount)}`

// Floating coin particle effect
function FloatingCoins({ show, isPositive }: { show: boolean; isPositive: boolean }) {
  if (!show) return null
  
  return (
    <div className="absolute inset-0 pointer-events-none overflow-visible">
      {[...Array(6)].map((_, i) => (
        <motion.div
          key={i}
          initial={{ 
            opacity: 0, 
            scale: 0,
            x: 0,
            y: 0,
          }}
          animate={{ 
            opacity: [0, 1, 1, 0],
            scale: [0, 1, 1, 0.5],
            x: (Math.random() - 0.5) * 60,
            y: isPositive ? -40 - Math.random() * 30 : 40 + Math.random() * 30,
            rotate: Math.random() * 360,
          }}
          transition={{ 
            duration: 1 + Math.random() * 0.5,
            delay: i * 0.1,
            ease: "easeOut",
          }}
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"
        >
          <Coins className={cn(
            "w-3 h-3",
            isPositive ? "text-green-400" : "text-amber-400"
          )} />
        </motion.div>
      ))}
    </div>
  )
}

// Ripple effect component
function RippleEffect({ trigger }: { trigger: boolean }) {
  return (
    <AnimatePresence>
      {trigger && (
        <>
          {[...Array(3)].map((_, i) => (
            <motion.div
              key={i}
              initial={{ scale: 0.8, opacity: 0.8 }}
              animate={{ scale: 2.5, opacity: 0 }}
              exit={{ opacity: 0 }}
              transition={{ 
                duration: 1,
                delay: i * 0.15,
                ease: "easeOut",
              }}
              className="absolute inset-0 rounded-2xl border-2 border-primary/50 pointer-events-none"
            />
          ))}
        </>
      )}
    </AnimatePresence>
  )
}

export function WalletWidget() {
  const { balance, isLoading, transactions, refreshBalance, monthlyStats } = useWallet()
  const { showToast } = useNotifications()
  const [isOpen, setIsOpen] = useState(false)
  const [modalType, setModalType] = useState<"topup" | "transfer" | "history" | "voucher" | null>(null)
  const [isHovered, setIsHovered] = useState(false)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [previousBalance, setPreviousBalance] = useState(balance)
  const [balanceChange, setBalanceChange] = useState<number | null>(null)
  const [showCoins, setShowCoins] = useState(false)
  const [showRipple, setShowRipple] = useState(false)
  const [pulseIntensity, setPulseIntensity] = useState(0)
  const buttonRef = useRef<HTMLButtonElement>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const iconControls = useAnimationControls()

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current && 
        !dropdownRef.current.contains(event.target as Node) &&
        buttonRef.current &&
        !buttonRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false)
      }
    }

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside)
      return () => document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [isOpen])

  // Enhanced 3D tilt effect with more dramatic rotation
  const x = useMotionValue(0)
  const y = useMotionValue(0)
  const rotateX = useTransform(y, [-50, 50], [8, -8])
  const rotateY = useTransform(x, [-50, 50], [-8, 8])
  const springRotateX = useSpring(rotateX, { stiffness: 400, damping: 25 })
  const springRotateY = useSpring(rotateY, { stiffness: 400, damping: 25 })
  
  // Glow intensity based on mouse position
  const glowX = useTransform(x, [-50, 50], [-20, 20])
  const glowY = useTransform(y, [-50, 50], [-20, 20])
  const springGlowX = useSpring(glowX, { stiffness: 300, damping: 30 })
  const springGlowY = useSpring(glowY, { stiffness: 300, damping: 30 })

  // Trigger celebration animation on balance increase
  const triggerCelebration = useCallback(async (isPositive: boolean) => {
    setShowCoins(true)
    setShowRipple(true)
    setPulseIntensity(isPositive ? 1 : 0.5)
    
    // Bounce the wallet icon
    await iconControls.start({
      scale: [1, 1.3, 0.9, 1.1, 1],
      rotate: isPositive ? [0, -10, 10, -5, 0] : [0, 5, -5, 0],
      transition: { duration: 0.6, ease: "easeInOut" }
    })
    
    setTimeout(() => {
      setShowCoins(false)
      setShowRipple(false)
      setPulseIntensity(0)
    }, 1200)
  }, [iconControls])

  useEffect(() => {
    if (balance !== previousBalance && previousBalance > 0) {
      const change = balance - previousBalance
      setBalanceChange(change)
      
      // Trigger visual celebration
      triggerCelebration(change > 0)

      if (change > 0) {
        showToast({
          type: "success",
          title: "Credit Added",
          message: `+N$ ${change.toFixed(2)} added to your wallet`,
          duration: 4000,
        })
      } else if (change < 0) {
        showToast({
          type: "info",
          title: "Credit Transferred",
          message: `N$ ${Math.abs(change).toFixed(2)} transferred from your wallet`,
          duration: 4000,
        })
      }

      setTimeout(() => setBalanceChange(null), 3000)
    }
    setPreviousBalance(balance)
  }, [balance, previousBalance, showToast, triggerCelebration])

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!buttonRef.current) return
    const rect = buttonRef.current.getBoundingClientRect()
    x.set(e.clientX - rect.left - rect.width / 2)
    y.set(e.clientY - rect.top - rect.height / 2)
  }

  const handleMouseLeave = () => {
    x.set(0)
    y.set(0)
    setIsHovered(false)
  }

  const handleRefresh = async () => {
    setIsRefreshing(true)
    await refreshBalance()
    setIsRefreshing(false)
  }

  const formatBalance = (amount: number) => {
    return new Intl.NumberFormat("en-NA", {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount)
  }

  const recentTransactions = transactions.slice(0, 3)

  return (
    <>
      <div className="relative" style={{ perspective: 1200 }}>
        {/* Ambient glow effect */}
        <motion.div
          className="absolute -inset-2 rounded-3xl opacity-0 blur-xl pointer-events-none"
          style={{
            background: `radial-gradient(circle at calc(50% + ${springGlowX}px) calc(50% + ${springGlowY}px), rgba(234, 88, 12, 0.4), transparent 70%)`,
          }}
          animate={{ opacity: isHovered ? 0.6 : 0 }}
          transition={{ duration: 0.3 }}
        />
        
        {/* Pulse glow on balance change */}
        <AnimatePresence>
          {pulseIntensity > 0 && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ 
                opacity: [0, 0.8, 0],
                scale: [0.8, 1.5, 2],
              }}
              exit={{ opacity: 0 }}
              transition={{ duration: 1, ease: "easeOut" }}
              className={cn(
                "absolute -inset-4 rounded-3xl blur-xl pointer-events-none",
                balanceChange && balanceChange > 0 ? "bg-green-500/50" : "bg-amber-500/50"
              )}
            />
          )}
        </AnimatePresence>

        <motion.div
          ref={buttonRef}
          onMouseMove={handleMouseMove}
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={handleMouseLeave}
          style={{ rotateX: springRotateX, rotateY: springRotateY }}
          whileTap={{ scale: 0.96 }}
          className="relative"
        >
          {/* Ripple effect container */}
          <RippleEffect trigger={showRipple} />
          
          <Button
            variant="outline"
            onClick={(e) => {
              e.stopPropagation()
              setIsOpen(!isOpen)
            }}
            className={cn(
              "relative flex items-center gap-1 sm:gap-1.5 h-9 sm:h-10 lg:h-11 px-2 sm:px-2.5 lg:px-3 rounded-xl border-border transition-all duration-300 overflow-visible bg-transparent touch-manipulation min-w-0",
              isOpen ? "bg-card shadow-xl border-primary/50" : "hover:bg-card hover:border-primary/30",
              isHovered && "shadow-xl shadow-primary/20",
              pulseIntensity > 0 && "border-primary",
            )}
          >
            {/* Animated shimmer background */}
            <motion.div
              className="absolute inset-0 rounded-2xl overflow-hidden"
              style={{ opacity: isHovered ? 1 : 0 }}
            >
              <motion.div
                className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent"
                animate={{ x: ["-200%", "200%"] }}
                transition={{ 
                  duration: 2, 
                  repeat: Number.POSITIVE_INFINITY,
                  repeatDelay: 1,
                  ease: "linear",
                }}
              />
            </motion.div>

            {/* Gradient border effect on hover */}
            <motion.div
              className="absolute inset-0 rounded-2xl"
              style={{
                background: "linear-gradient(135deg, rgba(234, 88, 12, 0.3) 0%, rgba(251, 191, 36, 0.3) 50%, rgba(234, 88, 12, 0.3) 100%)",
                opacity: isHovered ? 1 : 0,
                padding: "1px",
              }}
              transition={{ duration: 0.3 }}
            />

            {/* Wallet icon with enhanced animations */}
            <motion.div 
              animate={iconControls}
              className="relative w-7 h-7 sm:w-8 sm:h-8 rounded-lg flex items-center justify-center overflow-visible flex-shrink-0"
            >
              {/* Icon background with gradient animation */}
              <motion.div
                className="absolute inset-0 rounded-xl"
                style={{
                  background: "linear-gradient(135deg, #ea580c 0%, #f59e0b 50%, #ea580c 100%)",
                  backgroundSize: "200% 200%",
                }}
                animate={{
                  backgroundPosition: isHovered 
                    ? ["0% 0%", "100% 100%", "0% 0%"] 
                    : "0% 0%",
                }}
                transition={{ duration: 3, repeat: isHovered ? Number.POSITIVE_INFINITY : 0 }}
              />
              
              {/* Inner glow */}
              <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-white/20 to-transparent" />
              
              {/* Shadow */}
              <div className="absolute -inset-1 rounded-xl bg-primary/30 blur-md -z-10" />
              
              <Wallet className="h-4 w-4 text-white relative z-10 drop-shadow-sm" />
              
              {/* Floating coins effect */}
              <FloatingCoins show={showCoins} isPositive={balanceChange !== null && balanceChange > 0} />
              
              {/* Balance change badge with enhanced animation */}
              <AnimatePresence>
                {balanceChange !== null && (
                  <motion.div
                    initial={{ scale: 0, y: 0, opacity: 0 }}
                    animate={{ 
                      scale: [0, 1.2, 1],
                      y: -24,
                      opacity: 1,
                    }}
                    exit={{ scale: 0, opacity: 0, y: -30 }}
                    transition={{ type: "spring", stiffness: 500, damping: 25 }}
                    className={cn(
                      "absolute -top-2 left-1/2 -translate-x-1/2 px-2 py-1 rounded-full text-xs font-bold whitespace-nowrap shadow-lg z-20",
                      balanceChange > 0 
                        ? "bg-gradient-to-r from-green-500 to-emerald-400 text-white shadow-green-500/30" 
                        : "bg-gradient-to-r from-amber-500 to-orange-400 text-white shadow-amber-500/30",
                    )}
                  >
                    <motion.span
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="flex items-center gap-0.5"
                    >
                      {balanceChange > 0 ? (
                        <TrendingUp className="w-3 h-3" />
                      ) : (
                        <TrendingDown className="w-3 h-3" />
                      )}
                      {balanceChange > 0 ? "+" : ""}N$ {Math.abs(balanceChange).toFixed(0)}
                    </motion.span>
                  </motion.div>
                )}
              </AnimatePresence>
              
              {/* Sparkle effect on positive change */}
              <AnimatePresence>
                {balanceChange !== null && balanceChange > 0 && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0 }}
                    animate={{ opacity: [0, 1, 0], scale: [0.5, 1.5, 0.5], rotate: [0, 180] }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.8 }}
                    className="absolute -top-1 -right-1"
                  >
                    <Sparkles className="w-4 h-4 text-yellow-400" />
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>

            {/* Balance display with animated counter */}
            <div className="relative text-left min-w-[40px] sm:min-w-[50px] lg:min-w-[60px]">
              <motion.div
                key={isLoading ? "loading" : "balance"}
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
                className="font-bold text-foreground text-[11px] sm:text-xs lg:text-sm whitespace-nowrap"
              >
                {isLoading ? (
                  <motion.div 
                    className="h-4 w-16 rounded bg-gradient-to-r from-muted via-muted-foreground/10 to-muted"
                    animate={{ 
                      backgroundPosition: ["0% 0%", "100% 0%"],
                    }}
                    transition={{ 
                      duration: 1.5, 
                      repeat: Number.POSITIVE_INFINITY,
                      ease: "linear",
                    }}
                    style={{ backgroundSize: "200% 100%" }}
                  />
                ) : (
                  <span className="tabular-nums">
                    N$ <AnimatedNumber value={balance} duration={0.6} />
                  </span>
                )}
              </motion.div>
            </div>

            <motion.div
              animate={{ rotate: isOpen ? 180 : 0 }}
              transition={{ type: "spring", stiffness: 300, damping: 20 }}
              className="text-muted-foreground"
            >
              <ChevronDown className="h-4 w-4" />
            </motion.div>
          </Button>
        </motion.div>

        <AnimatePresence>
          {isOpen && (
            <>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-[54]"
                onClick={() => setIsOpen(false)}
              />
              <motion.div
                ref={dropdownRef}
                initial={{ opacity: 0, y: 15, scale: 0.92 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                transition={{ type: "spring", stiffness: 350, damping: 28 }}
                className="fixed inset-x-2 sm:inset-x-auto sm:absolute sm:right-0 sm:left-auto top-[60px] sm:top-full sm:mt-2 w-auto sm:w-80 md:w-[340px] bg-card rounded-2xl shadow-2xl border border-border z-[55] overflow-hidden max-h-[calc(100vh-80px)] sm:max-h-[85vh] overflow-y-auto"
                onClick={(e) => e.stopPropagation()}
              >
                {/* Mobile header with drag handle and close */}
                <div className="sm:hidden">
                  {/* Drag handle */}
                  <div className="flex justify-center pt-2 pb-1">
                    <div className="w-10 h-1 rounded-full bg-muted-foreground/30" />
                  </div>
                  <div className="flex items-center justify-between px-4 pb-2 border-b border-border/50">
                    <div className="flex items-center gap-2">
                      <Wallet className="h-4 w-4 text-primary" />
                      <span className="text-sm font-semibold text-foreground">My Wallet</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setIsOpen(false)}
                      className="p-2 -mr-2 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors active:bg-muted/80"
                      aria-label="Close wallet"
                    >
                      <ChevronDown className="h-5 w-5" />
                    </button>
                  </div>
                </div>
                
                {/* Decorative gradient overlay */}
                <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-gold/5 pointer-events-none" />
                
                {/* Balance header with enhanced styling */}
                <div className="relative p-4 sm:p-5">
                  {/* Animated background pattern */}
                  <div className="absolute inset-0 overflow-hidden">
                    <motion.div
                      className="absolute -top-20 -right-20 w-40 h-40 rounded-full bg-primary/10 blur-3xl"
                      animate={{
                        scale: [1, 1.2, 1],
                        opacity: [0.3, 0.5, 0.3],
                      }}
                      transition={{ duration: 4, repeat: Number.POSITIVE_INFINITY }}
                    />
                    <motion.div
                      className="absolute -bottom-10 -left-10 w-32 h-32 rounded-full bg-gold/10 blur-3xl"
                      animate={{
                        scale: [1.2, 1, 1.2],
                        opacity: [0.3, 0.5, 0.3],
                      }}
                      transition={{ duration: 4, repeat: Number.POSITIVE_INFINITY, delay: 2 }}
                    />
                  </div>
                  
                  <div className="relative flex items-center justify-between mb-3">
                    <motion.span 
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.1 }}
                      className="text-sm text-muted-foreground font-medium"
                    >
                      Available Balance
                    </motion.span>
                    <motion.button
                      initial={{ opacity: 0, scale: 0.5 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: 0.2 }}
                      onClick={handleRefresh}
                      disabled={isRefreshing}
                      whileHover={{ scale: 1.1, rotate: 15 }}
                      whileTap={{ scale: 0.9 }}
                      className="p-1.5 rounded-lg hover:bg-primary/10 transition-colors"
                    >
                      <RefreshCw className={cn("h-4 w-4 text-muted-foreground", isRefreshing && "animate-spin")} />
                    </motion.button>
                  </div>
                  
                  {/* Large balance display with animation */}
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.15, type: "spring", stiffness: 300 }}
                    className="relative"
                  >
                    <motion.span
                      key={balance}
                      initial={{ scale: 0.9, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      className="text-4xl font-bold bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text"
                    >
                      N$ <AnimatedNumber value={balance} duration={0.4} />
                    </motion.span>
                    
                    {/* Subtle shine effect */}
                    <motion.div
                      className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -skew-x-12 opacity-0"
                      animate={{ 
                        x: ["-100%", "200%"],
                        opacity: [0, 0.5, 0],
                      }}
                      transition={{ 
                        duration: 2,
                        repeat: Number.POSITIVE_INFINITY,
                        repeatDelay: 3,
                      }}
                    />
                  </motion.div>
                  
                  {/* Monthly Stats with staggered animation */}
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.25 }}
                    className="flex items-center gap-4 mt-4 pt-4 border-t border-border/30"
                  >
                    <motion.div 
                      className="flex items-center gap-2 flex-1"
                      whileHover={{ scale: 1.02 }}
                    >
                      <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-green-500/20 to-emerald-500/20 flex items-center justify-center">
                        <TrendingUp className="h-4 w-4 text-green-500" />
                      </div>
                      <div>
                        <p className="text-[10px] text-muted-foreground leading-none mb-0.5">This Month</p>
                        <p className="text-sm font-bold text-green-500">+N$ {formatBalance(monthlyStats?.received || 0)}</p>
                      </div>
                    </motion.div>
                    <div className="w-px h-8 bg-border/50" />
                    <motion.div 
                      className="flex items-center gap-2 flex-1"
                      whileHover={{ scale: 1.02 }}
                    >
                      <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-red-500/20 to-orange-500/20 flex items-center justify-center">
                        <TrendingDown className="h-4 w-4 text-red-500" />
                      </div>
                      <div>
                        <p className="text-[10px] text-muted-foreground leading-none mb-0.5">Spent</p>
                        <p className="text-sm font-bold text-red-500">-N$ {formatBalance(monthlyStats?.spent || 0)}</p>
                      </div>
                    </motion.div>
                  </motion.div>
                </div>

                {/* Quick actions grid with enhanced animations */}
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.2 }}
                  className="grid grid-cols-4 gap-2 p-3 border-y border-border/50 bg-gradient-to-b from-muted/30 to-transparent"
                >
                  {[
                    { icon: Plus, label: "Top Up", type: "topup" as const, color: "from-green-500 to-emerald-400", shadow: "shadow-green-500/20" },
                    { icon: Send, label: "Send", type: "transfer" as const, color: "from-primary to-orange-400", shadow: "shadow-primary/20" },
                    { icon: Ticket, label: "Voucher", type: "voucher" as const, color: "from-gold to-yellow-400", shadow: "shadow-yellow-500/20" },
                    { icon: History, label: "History", type: "history" as const, color: "from-blue-500 to-cyan-400", shadow: "shadow-blue-500/20" },
                  ].map((action, i) => (
                    <motion.button
                      key={action.type}
                      initial={{ opacity: 0, y: 15, scale: 0.8 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      transition={{ 
                        delay: 0.25 + i * 0.06,
                        type: "spring",
                        stiffness: 400,
                        damping: 25,
                      }}
                      onClick={() => {
                        setModalType(action.type)
                        setIsOpen(false)
                      }}
                      className="group flex flex-col items-center gap-1.5 p-2 rounded-xl hover:bg-card/80 transition-all duration-200"
                    >
                      <motion.div
                        whileHover={{ scale: 1.15, y: -2 }}
                        whileTap={{ scale: 0.9 }}
                        className={cn(
                          "relative w-11 h-11 rounded-xl bg-gradient-to-br flex items-center justify-center shadow-lg",
                          action.color,
                          action.shadow
                        )}
                      >
                        {/* Icon glow effect on hover */}
                        <motion.div
                          className="absolute inset-0 rounded-xl bg-white/0 group-hover:bg-white/10 transition-colors duration-200"
                        />
                        <action.icon className="h-5 w-5 text-white relative z-10 drop-shadow-sm" />
                      </motion.div>
                      <motion.span 
                        className="text-[10px] font-medium text-muted-foreground group-hover:text-foreground transition-colors"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.3 + i * 0.06 }}
                      >
                        {action.label}
                      </motion.span>
                    </motion.button>
                  ))}
                </motion.div>

                {/* Recent transactions with enhanced styling */}
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.35 }}
                  className="p-3"
                >
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Recent Activity</span>
                    <motion.button
                      whileHover={{ scale: 1.05, x: 2 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => {
                        setModalType("history")
                        setIsOpen(false)
                      }}
                      className="text-xs text-primary hover:text-primary/80 font-medium flex items-center gap-1"
                    >
                      View All
                      <ArrowUpRight className="w-3 h-3" />
                    </motion.button>
                  </div>
                  <div className="space-y-1.5">
                    {recentTransactions.length === 0 ? (
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="text-center py-4 text-muted-foreground text-sm"
                      >
                        No recent transactions
                      </motion.div>
                    ) : (
                      recentTransactions.map((tx, i) => (
                        <motion.div
                          key={tx.id}
                          initial={{ opacity: 0, x: -15 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ 
                            delay: 0.4 + i * 0.06,
                            type: "spring",
                            stiffness: 300,
                          }}
                          whileHover={{ scale: 1.01, x: 2 }}
                          className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-muted/50 transition-all cursor-pointer group"
                        >
                          <motion.div 
                            className={cn(
                              "w-9 h-9 rounded-lg flex items-center justify-center transition-colors",
                              tx.type === "credit" 
                                ? "bg-gradient-to-br from-green-500/15 to-emerald-500/15 text-green-500" 
                                : "bg-gradient-to-br from-muted to-muted/80 text-muted-foreground group-hover:text-foreground"
                            )}
                            whileHover={{ scale: 1.1 }}
                          >
                            {tx.type === "credit" ? (
                              <ArrowDownLeft className="h-4 w-4" />
                            ) : (
                              <ArrowUpRight className="h-4 w-4" />
                            )}
                          </motion.div>
                          <div className="flex-1 min-w-0">
                            <div className="text-sm font-medium text-foreground truncate">{tx.description}</div>
                            <div className="text-[11px] text-muted-foreground">{tx.date}</div>
                          </div>
                          <motion.div 
                            className={cn(
                              "text-sm font-bold tabular-nums",
                              tx.type === "credit" ? "text-green-500" : "text-foreground"
                            )}
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: 0.45 + i * 0.06 }}
                          >
                            {tx.type === "credit" ? "+" : "-"}N$ {tx.amount}
                          </motion.div>
                        </motion.div>
                      ))
                    )}
                  </div>
                </motion.div>
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </div>

      {/* Wallet Modal */}
      <WalletModal type={modalType} onClose={() => setModalType(null)} />
    </>
  )
}
