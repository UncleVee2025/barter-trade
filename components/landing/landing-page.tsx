"use client"

import { useState, useEffect, useCallback } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
  ArrowRight,
  Shield,
  Zap,
  Users,
  TrendingUp,
  CheckCircle,
  ChevronRight,
  Smartphone,
  Globe,
  Lock,
  X,
  ArrowUpRight,
  Sparkles,
  MapPin,
  Clock,
  BadgeCheck,
  RefreshCcw,
  Menu,
  ChevronLeft,
  Play,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import Image from "next/image"
import Link from "next/link"
import useSWR from "swr"

// ============================================
// TYPES
// ============================================
interface PlatformStats {
  totalUsers: number
  activeListings: number
  completedTrades: number
  totalVolume: number
  successRate: number
  onlineNow: number
  tradesToday: number
  newUsersToday: number
  source: "database" | "demo"
}

interface RecentTrade {
  id: string
  buyerName: string
  sellerName: string
  itemTitle: string
  location: string
  timeAgo: string
}

// ============================================
// FETCHER
// ============================================
const fetcher = (url: string) => fetch(url).then((res) => res.json())

// ============================================
// SLIDE DATA - Enterprise Branding
// ============================================
const slides = [
  {
    id: 1,
    image: "/slides/slide-1.jpg",
    title: "The Future of Trading",
    subtitle: "Namibia's Premier Marketplace",
    description: "Connect with verified traders nationwide. Exchange goods, vehicles, and services with bank-grade security.",
    badge: "Trusted Platform",
    stat: { value: "50K+", label: "Active Traders" },
  },
  {
    id: 2,
    image: "/slides/slide-2.jpg",
    title: "Connect Across Namibia",
    subtitle: "From Windhoek to Katima Mulilo",
    description: "Our nationwide network spans all 14 regions, connecting rural communities with urban markets seamlessly.",
    badge: "Nationwide Coverage",
    stat: { value: "14", label: "Regions Connected" },
  },
  {
    id: 3,
    image: "/slides/slide-3.jpg",
    title: "Trade Smarter, Not Harder",
    subtitle: "Digital Wallet & Escrow Protection",
    description: "Built-in payment protection ensures every transaction is secure. Your trust is our priority.",
    badge: "Secure Payments",
    stat: { value: "98.5%", label: "Success Rate" },
  },
  {
    id: 4,
    image: "/slides/slide-4.jpg",
    title: "Premium Opportunities Await",
    subtitle: "Vehicles, Property & High-Value Assets",
    description: "Verified ID system and escrow protection make high-value trades safe and straightforward.",
    badge: "Premium Trading",
    stat: { value: "N$2M+", label: "Daily Volume" },
  },
]

// ============================================
// ANIMATED NUMBER COMPONENT
// ============================================
function AnimatedNumber({ value, suffix = "", prefix = "" }: { value: number; suffix?: string; prefix?: string }) {
  const [displayValue, setDisplayValue] = useState(0)

  useEffect(() => {
    const duration = 2000
    const steps = 60
    const increment = value / steps
    let current = 0
    const timer = setInterval(() => {
      current += increment
      if (current >= value) {
        setDisplayValue(value)
        clearInterval(timer)
      } else {
        setDisplayValue(Math.floor(current))
      }
    }, duration / steps)
    return () => clearInterval(timer)
  }, [value])

  const formatNumber = (num: number) => {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + "M"
    if (num >= 1000) return (num / 1000).toFixed(1) + "K"
    return num.toLocaleString()
  }

  return (
    <span className="tabular-nums">
      {prefix}
      {formatNumber(displayValue)}
      {suffix}
    </span>
  )
}

// ============================================
// TRADE NOTIFICATION POPUP - Real-time from database
// ============================================
function TradeNotificationPopup({ trade, onClose }: { trade: RecentTrade | null; onClose: () => void }) {
  if (!trade) return null

  return (
    <motion.div
      initial={{ opacity: 0, x: -100, scale: 0.9 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      exit={{ opacity: 0, x: -100, scale: 0.9 }}
      transition={{ type: "spring", damping: 25, stiffness: 300 }}
      className="fixed bottom-6 left-6 z-50 max-w-md"
    >
      <div className="bg-gradient-to-br from-card/98 to-card/95 backdrop-blur-2xl rounded-3xl p-5 shadow-2xl border border-emerald-500/30 relative overflow-hidden">
        {/* Animated glow effect */}
        <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/10 via-transparent to-orange-500/10 animate-pulse" />
        
        <div className="relative flex items-start gap-4">
          <div className="relative flex-shrink-0">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center shadow-lg shadow-emerald-500/30">
              <RefreshCcw className="w-7 h-7 text-white" />
            </div>
            <div className="absolute -top-1 -right-1 w-5 h-5 bg-white rounded-full flex items-center justify-center shadow-md">
              <CheckCircle className="w-4 h-4 text-emerald-500" />
            </div>
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1.5">
              <span className="px-2 py-0.5 text-xs font-bold text-emerald-900 bg-emerald-400 rounded-full">LIVE TRADE</span>
              <span className="text-xs text-muted-foreground font-medium">{trade.timeAgo}</span>
            </div>
            <p className="text-base font-bold text-foreground truncate">{trade.itemTitle}</p>
            <p className="text-sm text-muted-foreground mt-0.5">
              {trade.buyerName} traded with {trade.sellerName}
            </p>
            <div className="flex items-center gap-1.5 mt-2">
              <MapPin className="w-4 h-4 text-orange-500" />
              <span className="text-sm font-medium text-orange-500">{trade.location}</span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-muted rounded-xl transition-colors"
            aria-label="Close notification"
          >
            <X className="w-5 h-5 text-muted-foreground" />
          </button>
        </div>
      </div>
    </motion.div>
  )
}

// ============================================
// MAIN LANDING PAGE
// ============================================
export function LandingPage() {
  const [currentSlide, setCurrentSlide] = useState(0)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [currentTrade, setCurrentTrade] = useState<RecentTrade | null>(null)
  const [tradeIndex, setTradeIndex] = useState(0)

  // Fetch real-time stats from database
  const { data: stats, error: statsError } = useSWR<PlatformStats>("/api/public/stats", fetcher, {
    refreshInterval: 15000, // More frequent updates for real-time feel
    revalidateOnFocus: true,
    fallbackData: {
      totalUsers: 0,
      activeListings: 0,
      completedTrades: 0,
      totalVolume: 0,
      successRate: 0,
      onlineNow: 0,
      tradesToday: 0,
      newUsersToday: 0,
      source: "demo",
    },
  })

  // Show connection status indicator
  const isLiveData = stats?.source === "database" && !statsError

  // Fetch recent trades from database
  const { data: tradesData } = useSWR<{ trades: RecentTrade[] }>("/api/public/recent-trades", fetcher, {
    refreshInterval: 15000,
  })

  // Auto-advance slideshow
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length)
    }, 6000)
    return () => clearInterval(timer)
  }, [])

  // Show trade notifications periodically
  useEffect(() => {
    if (!tradesData?.trades?.length) return

    const showNotification = () => {
      setCurrentTrade(tradesData.trades[tradeIndex])
      setTradeIndex((prev) => (prev + 1) % tradesData.trades.length)

      setTimeout(() => {
        setCurrentTrade(null)
      }, 5000)
    }

    const initialTimer = setTimeout(showNotification, 3000)
    const interval = setInterval(showNotification, 12000)

    return () => {
      clearTimeout(initialTimer)
      clearInterval(interval)
    }
  }, [tradesData, tradeIndex])

  const goToSlide = useCallback((index: number) => {
    setCurrentSlide(index)
  }, [])

  const nextSlide = () => setCurrentSlide((prev) => (prev + 1) % slides.length)
  const prevSlide = () => setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length)

  return (
    <div className="min-h-screen bg-background overflow-x-hidden">
      {/* ============================================ */}
      {/* NAVIGATION */}
      {/* ============================================ */}
      <nav className="fixed top-0 left-0 right-0 z-50">
        <div className="mx-4 mt-4">
          <motion.div
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="bg-card/90 backdrop-blur-xl border border-border/50 rounded-2xl px-4 py-3 max-w-7xl mx-auto shadow-xl"
          >
            <div className="flex items-center justify-between">
              {/* Logo */}
              <Link href="/" className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl overflow-hidden">
                  <Image src="/logo.png" alt="Barter Trade Namibia" width={40} height={40} className="object-contain" priority />
                </div>
                <div className="hidden sm:block">
                  <span className="font-bold text-foreground">Barter Trade</span>
                  <div className="flex items-center gap-1.5">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="text-xs text-emerald-400">{stats?.onlineNow || 0} online now</span>
                  </div>
                </div>
              </Link>

              {/* Desktop Nav */}
              <div className="hidden md:flex items-center gap-6">
                <a href="#features" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                  Features
                </a>
                <a href="#how-it-works" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                  How It Works
                </a>
                <a href="#stats" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                  Stats
                </a>
              </div>

              {/* CTA Buttons */}
              <div className="flex items-center gap-3">
                <Link href="/auth">
                  <Button variant="ghost" size="sm" className="hidden sm:flex">
                    Sign In
                  </Button>
                </Link>
                <Link href="/auth">
                  <Button size="sm" className="bg-gradient-to-r from-primary to-orange-500 hover:from-primary/90 hover:to-orange-500/90 text-white shadow-lg shadow-primary/25">
                    Get Started
                    <ArrowRight className="w-4 h-4 ml-1" />
                  </Button>
                </Link>
                <button
                  onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                  className="md:hidden p-2 hover:bg-muted rounded-lg transition-colors"
                  aria-label="Toggle menu"
                >
                  <Menu className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Mobile Menu */}
            <AnimatePresence>
              {mobileMenuOpen && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="md:hidden overflow-hidden"
                >
                  <div className="pt-4 pb-2 flex flex-col gap-2">
                    <a href="#features" onClick={() => setMobileMenuOpen(false)} className="px-4 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg transition-colors">
                      Features
                    </a>
                    <a href="#how-it-works" onClick={() => setMobileMenuOpen(false)} className="px-4 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg transition-colors">
                      How It Works
                    </a>
                    <a href="#stats" onClick={() => setMobileMenuOpen(false)} className="px-4 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg transition-colors">
                      Stats
                    </a>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </div>
      </nav>

      {/* ============================================ */}
      {/* HERO SLIDESHOW - Enterprise Modern Design */}
      {/* ============================================ */}
      <section className="relative min-h-[100svh] sm:min-h-screen flex items-center overflow-hidden">
        {/* Animated Background Grid */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(20,184,166,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(20,184,166,0.03)_1px,transparent_1px)] bg-[size:60px_60px] pointer-events-none" />
        
        {/* Slides */}
        <AnimatePresence mode="wait">
          {slides.map(
            (slide, index) =>
              index === currentSlide && (
                <motion.div
                  key={slide.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 1, ease: "easeInOut" }}
                  className="absolute inset-0"
                >
                  {/* Background Image with Ken Burns Effect */}
                  <motion.div 
                    className="absolute inset-0"
                    initial={{ scale: 1.1 }}
                    animate={{ scale: 1 }}
                    transition={{ duration: 8, ease: "linear" }}
                  >
                    <Image
                      src={slide.image || "/placeholder.svg"}
                      alt={slide.title}
                      fill
                      className="object-cover object-center"
                      sizes="100vw"
                      priority={index === 0}
                    />
                  </motion.div>
                  
                  {/* Premium Gradient Overlay - Clean and Modern */}
                  <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/50 to-transparent" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/20" />
                  
                  {/* Animated Accent Lines */}
                  <motion.div 
                    initial={{ scaleX: 0 }}
                    animate={{ scaleX: 1 }}
                    transition={{ duration: 1.5, delay: 0.5, ease: "easeOut" }}
                    className="absolute top-1/3 left-0 w-1/3 h-px bg-gradient-to-r from-primary via-primary/50 to-transparent origin-left"
                  />
                  <motion.div 
                    initial={{ scaleX: 0 }}
                    animate={{ scaleX: 1 }}
                    transition={{ duration: 1.5, delay: 0.7, ease: "easeOut" }}
                    className="absolute top-1/3 left-0 mt-2 w-1/4 h-px bg-gradient-to-r from-orange-500/60 via-orange-500/30 to-transparent origin-left"
                  />

                  {/* Content Container */}
                  <div className="relative z-10 h-full flex items-center pt-20 sm:pt-0">
                    <div className="container mx-auto px-4 sm:px-6 lg:px-8">
                      <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-center">
                        {/* Left Content */}
                        <div className="max-w-2xl">
                          {/* Badge with Pulse Animation */}
                          <motion.div
                            initial={{ opacity: 0, x: -30 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.3, duration: 0.6 }}
                            className="mb-6"
                          >
                            <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 backdrop-blur-xl border border-white/10 text-white text-sm font-medium">
                              <span className="relative flex h-2 w-2">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75" />
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-primary" />
                              </span>
                              {slide.badge}
                            </span>
                          </motion.div>

                          {/* Main Title with Stagger */}
                          <motion.h1
                            initial={{ opacity: 0, y: 40 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.4, duration: 0.8, ease: "easeOut" }}
                            className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold text-white mb-4 leading-[1.05] tracking-tight"
                          >
                            {slide.title.split(' ').map((word, i) => (
                              <motion.span
                                key={i}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.4 + i * 0.1, duration: 0.5 }}
                                className="inline-block mr-3"
                              >
                                {word}
                              </motion.span>
                            ))}
                          </motion.h1>

                          {/* Subtitle with Gradient */}
                          <motion.p
                            initial={{ opacity: 0, y: 30 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.6, duration: 0.6 }}
                            className="text-xl sm:text-2xl md:text-3xl font-semibold bg-gradient-to-r from-primary via-emerald-400 to-primary bg-clip-text text-transparent mb-4"
                          >
                            {slide.subtitle}
                          </motion.p>

                          {/* Description */}
                          <motion.p
                            initial={{ opacity: 0, y: 30 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.7, duration: 0.6 }}
                            className="text-base sm:text-lg text-white/70 mb-8 max-w-xl leading-relaxed"
                          >
                            {slide.description}
                          </motion.p>

                          {/* CTA Buttons */}
                          <motion.div
                            initial={{ opacity: 0, y: 30 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.8, duration: 0.6 }}
                            className="flex flex-col sm:flex-row gap-4 mb-10"
                          >
                            <Link href="/auth">
                              <Button 
                                size="lg" 
                                className="relative bg-white text-charcoal hover:bg-white/90 shadow-2xl shadow-white/20 group h-14 px-8 text-lg rounded-xl font-semibold w-full sm:w-auto transition-all duration-300 hover:scale-[1.02] overflow-hidden"
                              >
                                <span className="relative z-10 flex items-center gap-2">
                                  Get Started Free
                                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                                </span>
                                <motion.div 
                                  className="absolute inset-0 bg-gradient-to-r from-primary/20 to-transparent"
                                  initial={{ x: "-100%" }}
                                  whileHover={{ x: "100%" }}
                                  transition={{ duration: 0.5 }}
                                />
                              </Button>
                            </Link>
                            <Link href="/dashboard/browse">
                              <Button 
                                size="lg" 
                                className="bg-transparent hover:bg-white/10 backdrop-blur-sm text-white border border-white/20 hover:border-white/40 h-14 px-8 text-lg rounded-xl font-medium w-full sm:w-auto transition-all duration-300 group"
                              >
                                <Play className="w-5 h-5 mr-2 group-hover:scale-110 transition-transform" />
                                Watch Demo
                              </Button>
                            </Link>
                          </motion.div>

                          {/* Trust Indicators */}
                          <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 1, duration: 0.6 }}
                            className="flex flex-wrap items-center gap-6"
                          >
                            {[
                              { icon: Shield, label: "Bank-Grade Security" },
                              { icon: BadgeCheck, label: "Verified Traders" },
                              { icon: Zap, label: "Instant Transfers" },
                            ].map((item, i) => (
                              <motion.div
                                key={item.label}
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: 1 + i * 0.1 }}
                                className="flex items-center gap-2 text-white/60"
                              >
                                <item.icon className="w-4 h-4 text-primary" />
                                <span className="text-sm">{item.label}</span>
                              </motion.div>
                            ))}
                          </motion.div>
                        </div>

                        {/* Right Side - Floating Stats Card */}
                        <motion.div
                          initial={{ opacity: 0, x: 60, rotateY: -15 }}
                          animate={{ opacity: 1, x: 0, rotateY: 0 }}
                          transition={{ delay: 0.9, duration: 0.8, ease: "easeOut" }}
                          className="hidden lg:block"
                        >
                          <div className="relative">
                            {/* Main Floating Card */}
                            <motion.div 
                              animate={{ y: [0, -10, 0] }}
                              transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                              className="bg-white/5 backdrop-blur-2xl border border-white/10 rounded-3xl p-8 shadow-2xl"
                            >
                              {/* Card Header */}
                              <div className="flex items-center justify-between mb-6">
                                <div className="flex items-center gap-3">
                                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary to-emerald-500 flex items-center justify-center">
                                    <TrendingUp className="w-6 h-6 text-white" />
                                  </div>
                                  <div>
                                    <p className="text-white font-semibold">Live Statistics</p>
                                    <p className="text-white/50 text-sm">Real-time data</p>
                                  </div>
                                </div>
                                <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-500/30">
                                  <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                                  <span className="text-emerald-400 text-xs font-medium">LIVE</span>
                                </div>
                              </div>

                              {/* Featured Stat */}
                              <div className="text-center py-8 border-y border-white/10">
                                <motion.div
                                  key={slide.stat.value}
                                  initial={{ scale: 0.5, opacity: 0 }}
                                  animate={{ scale: 1, opacity: 1 }}
                                  transition={{ duration: 0.5 }}
                                  className="text-5xl sm:text-6xl font-bold bg-gradient-to-r from-white via-white to-white/70 bg-clip-text text-transparent mb-2"
                                >
                                  {slide.stat.value}
                                </motion.div>
                                <p className="text-white/60 text-sm uppercase tracking-wider">{slide.stat.label}</p>
                              </div>

                              {/* Mini Stats Grid */}
                              <div className="grid grid-cols-2 gap-4 mt-6">
                                <div className="bg-white/5 rounded-xl p-4">
                                  <div className="flex items-center gap-2 mb-2">
                                    <div className="w-2 h-2 rounded-full bg-emerald-400" />
                                    <span className="text-white/50 text-xs">Today&apos;s Trades</span>
                                  </div>
                                  <p className="text-2xl font-bold text-white">{stats?.tradesToday || 0}</p>
                                </div>
                                <div className="bg-white/5 rounded-xl p-4">
                                  <div className="flex items-center gap-2 mb-2">
                                    <div className="w-2 h-2 rounded-full bg-orange-400" />
                                    <span className="text-white/50 text-xs">Online Now</span>
                                  </div>
                                  <p className="text-2xl font-bold text-white">{stats?.onlineNow || 0}</p>
                                </div>
                              </div>
                            </motion.div>

                            {/* Decorative Elements */}
                            <div className="absolute -top-4 -right-4 w-24 h-24 bg-primary/20 rounded-full blur-3xl" />
                            <div className="absolute -bottom-4 -left-4 w-32 h-32 bg-orange-500/20 rounded-full blur-3xl" />
                          </div>
                        </motion.div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )
          )}
        </AnimatePresence>

        {/* Navigation Arrows - Modern Minimal */}
        <div className="absolute left-4 right-4 top-1/2 -translate-y-1/2 z-20 flex justify-between pointer-events-none">
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            onClick={prevSlide}
            className="w-12 h-12 rounded-full bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center hover:bg-white/20 transition-all pointer-events-auto hidden md:flex"
            aria-label="Previous slide"
          >
            <ChevronLeft className="w-5 h-5 text-white" />
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            onClick={nextSlide}
            className="w-12 h-12 rounded-full bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center hover:bg-white/20 transition-all pointer-events-auto hidden md:flex"
            aria-label="Next slide"
          >
            <ChevronRight className="w-5 h-5 text-white" />
          </motion.button>
        </div>

        {/* Slide Indicators - Premium Style */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-20">
          <div className="flex items-center gap-3 px-4 py-3 bg-black/30 backdrop-blur-md rounded-full border border-white/10">
            {slides.map((slide, index) => (
              <button
                key={slide.id}
                onClick={() => goToSlide(index)}
                className="group relative"
                aria-label={`Go to slide ${index + 1}`}
              >
                <div className={`h-2 rounded-full transition-all duration-500 ${
                  index === currentSlide 
                    ? "w-8 bg-gradient-to-r from-primary to-emerald-400" 
                    : "w-2 bg-white/30 group-hover:bg-white/50"
                }`} />
                {index === currentSlide && (
                  <motion.div
                    layoutId="slideIndicator"
                    className="absolute inset-0 rounded-full ring-2 ring-primary/50 ring-offset-2 ring-offset-transparent"
                  />
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Progress Bar */}
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/10">
          <motion.div
            key={currentSlide}
            initial={{ width: "0%" }}
            animate={{ width: "100%" }}
            transition={{ duration: 6, ease: "linear" }}
            className="h-full bg-gradient-to-r from-primary via-emerald-400 to-primary"
          />
        </div>

        {/* Scroll Indicator */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 2 }}
          className="absolute bottom-24 left-1/2 -translate-x-1/2 z-20 hidden sm:block"
        >
          <motion.div
            animate={{ y: [0, 8, 0] }}
            transition={{ duration: 1.5, repeat: Infinity }}
            className="flex flex-col items-center gap-2 text-white/50"
          >
            <span className="text-xs uppercase tracking-widest">Scroll</span>
            <div className="w-5 h-8 rounded-full border border-white/30 flex items-start justify-center p-1">
              <motion.div
                animate={{ y: [0, 12, 0] }}
                transition={{ duration: 1.5, repeat: Infinity }}
                className="w-1 h-2 bg-white/50 rounded-full"
              />
            </div>
          </motion.div>
        </motion.div>
      </section>

      {/* ============================================ */}
      {/* LIVE STATS BAR */}
      {/* ============================================ */}
      <section id="stats" className="relative py-20 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-background via-primary/5 to-background" />

        <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 text-sm font-medium mb-4">
              <div className="relative">
                <div className="w-2 h-2 rounded-full bg-emerald-500" />
                <div className="absolute inset-0 w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
              </div>
              Live Platform Statistics
            </span>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-foreground">
              Trusted by <span className="bg-gradient-to-r from-primary to-orange-500 bg-clip-text text-transparent">Thousands</span> of Namibians
            </h2>
          </motion.div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
            {[
              { label: "Active Users", value: stats?.totalUsers || 0, icon: Users, color: "from-primary to-cyan-500", suffix: "+" },
              { label: "Live Listings", value: stats?.activeListings || 0, icon: Globe, color: "from-orange-500 to-gold", suffix: "" },
              { label: "Trades Completed", value: stats?.completedTrades || 0, icon: RefreshCcw, color: "from-emerald-500 to-primary", suffix: "+" },
              { label: "Success Rate", value: stats?.successRate || 98.5, icon: BadgeCheck, color: "from-gold to-orange-500", suffix: "%" },
            ].map((stat, index) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="bg-card/50 backdrop-blur-sm border border-border/50 rounded-2xl p-6 text-center hover:border-primary/30 transition-all duration-300 hover:-translate-y-1"
              >
                <div className={`w-14 h-14 mx-auto mb-4 rounded-2xl bg-gradient-to-br ${stat.color} flex items-center justify-center shadow-lg`}>
                  <stat.icon className="w-7 h-7 text-white" />
                </div>
                <div className="text-3xl sm:text-4xl font-bold text-foreground mb-1">
                  <AnimatedNumber value={stat.value} suffix={stat.suffix} />
                </div>
                <p className="text-sm text-muted-foreground">{stat.label}</p>
              </motion.div>
            ))}
          </div>

          {/* Enhanced FOMO Banner - Real-time urgency */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mt-10 bg-gradient-to-r from-orange-500/10 via-primary/10 to-emerald-500/10 backdrop-blur-md border border-orange-500/30 rounded-3xl p-5 sm:p-6"
          >
            <div className="flex flex-col lg:flex-row items-center justify-between gap-4 lg:gap-8">
              <div className="flex items-center gap-4">
                <div className="relative">
                  <div className="w-4 h-4 rounded-full bg-orange-500 animate-pulse" />
                  <div className="absolute inset-0 w-4 h-4 rounded-full bg-orange-500 animate-ping opacity-50" />
                </div>
                <span className="text-base sm:text-lg font-medium text-foreground">
                  <span className="text-orange-500 font-bold text-xl sm:text-2xl">{stats?.onlineNow || 0}</span> people browsing now
                </span>
              </div>
              <div className="hidden lg:block w-px h-8 bg-border/50" />
              <div className="flex items-center gap-3">
                <RefreshCcw className="w-5 h-5 text-emerald-500 animate-spin" style={{ animationDuration: '3s' }} />
                <span className="text-base sm:text-lg font-medium text-foreground">
                  <span className="text-emerald-500 font-bold text-xl sm:text-2xl">{stats?.tradesToday || 0}</span> trades completed today
                </span>
              </div>
              <div className="hidden lg:block w-px h-8 bg-border/50" />
              <div className="flex items-center gap-3">
                <Users className="w-5 h-5 text-primary" />
                <span className="text-base sm:text-lg font-medium text-foreground">
                  <span className="text-primary font-bold text-xl sm:text-2xl">{stats?.newUsersToday || 0}</span> new members today
                </span>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ============================================ */}
      {/* FEATURES SECTION */}
      {/* ============================================ */}
      <section id="features" className="py-24 relative overflow-hidden">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/20 border border-primary/30 text-primary text-sm font-medium mb-4">
              <Sparkles className="w-4 h-4" />
              Why Choose Us
            </span>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-foreground mb-4">
              Built for <span className="bg-gradient-to-r from-primary to-orange-500 bg-clip-text text-transparent">Namibians</span>,
              <br className="hidden sm:block" /> By Namibians
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              The most trusted barter trading platform designed specifically for the unique needs of Namibian traders
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              {
                icon: Shield,
                title: "Verified ID System",
                description: "Every user is verified with national ID for maximum trust and security in every transaction",
                color: "from-primary to-cyan-500",
              },
              {
                icon: Zap,
                title: "Instant Digital Wallet",
                description: "Built-in wallet system for seamless payments, escrow protection, and instant transfers",
                color: "from-orange-500 to-gold",
              },
              {
                icon: Globe,
                title: "Nationwide Coverage",
                description: "Connect with traders across all 14 regions of Namibia, from Windhoek to Katima Mulilo",
                color: "from-emerald-500 to-primary",
              },
              {
                icon: Lock,
                title: "Escrow Protection",
                description: "Funds are held securely until both parties confirm the trade is complete",
                color: "from-primary to-orange-500",
              },
              {
                icon: Smartphone,
                title: "Mobile-First Design",
                description: "Optimized for all devices, trade anywhere with our responsive platform",
                color: "from-gold to-orange-500",
              },
              {
                icon: TrendingUp,
                title: "Real-Time Market",
                description: "Live listings, instant notifications, and real-time chat with sellers",
                color: "from-cyan-500 to-primary",
              },
            ].map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="group bg-card/50 backdrop-blur-sm border border-border/50 rounded-2xl p-6 hover:border-primary/30 transition-all duration-300 hover:-translate-y-1"
              >
                <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${feature.color} flex items-center justify-center mb-4 shadow-lg group-hover:scale-110 transition-transform`}>
                  <feature.icon className="w-7 h-7 text-white" />
                </div>
                <h3 className="text-xl font-semibold text-foreground mb-2">{feature.title}</h3>
                <p className="text-muted-foreground">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ============================================ */}
      {/* HOW IT WORKS */}
      {/* ============================================ */}
      <section id="how-it-works" className="py-24 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-background via-primary/5 to-background" />

        <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-orange-500/20 border border-orange-500/30 text-orange-400 text-sm font-medium mb-4">
              <Clock className="w-4 h-4" />
              Simple Process
            </span>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-foreground mb-4">
              Start Trading in <span className="bg-gradient-to-r from-orange-500 to-gold bg-clip-text text-transparent">3 Easy Steps</span>
            </h2>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8 lg:gap-12">
            {[
              {
                step: "01",
                title: "Create Account",
                description: "Sign up with your phone number and verify your identity with your Namibian ID",
                icon: Users,
              },
              {
                step: "02",
                title: "List or Browse",
                description: "Post items you want to trade or browse thousands of listings from verified users",
                icon: Globe,
              },
              {
                step: "03",
                title: "Trade Securely",
                description: "Make offers, negotiate, and complete trades with escrow protection",
                icon: RefreshCcw,
              },
            ].map((item, index) => (
              <motion.div
                key={item.step}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.2 }}
                className="relative"
              >
                {/* Connector Line */}
                {index < 2 && (
                  <div className="hidden md:block absolute top-16 left-[calc(50%+4rem)] w-[calc(100%-8rem)] h-0.5 bg-gradient-to-r from-primary/50 to-orange-500/50" />
                )}

                <div className="text-center">
                  <div className="relative inline-block mb-6">
                    <div className="w-32 h-32 rounded-3xl bg-gradient-to-br from-primary/20 to-orange-500/20 flex items-center justify-center border border-primary/30">
                      <item.icon className="w-12 h-12 text-primary" />
                    </div>
                    <div className="absolute -top-3 -right-3 w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-orange-500 flex items-center justify-center text-white font-bold shadow-lg">
                      {item.step}
                    </div>
                  </div>
                  <h3 className="text-xl font-semibold text-foreground mb-2">{item.title}</h3>
                  <p className="text-muted-foreground max-w-xs mx-auto">{item.description}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ============================================ */}
      {/* CTA SECTION */}
      {/* ============================================ */}
      <section className="py-24 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-orange-500/10 to-gold/10" />

        <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="bg-card/80 backdrop-blur-xl border border-primary/20 rounded-3xl p-8 sm:p-12 lg:p-16 text-center max-w-4xl mx-auto"
          >
            <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 text-sm font-medium mb-6">
              <Sparkles className="w-4 h-4" />
              Join {stats?.totalUsers?.toLocaleString() || "12,000"}+ Traders
            </span>

            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-foreground mb-4">
              Ready to Start{" "}
              <span className="bg-gradient-to-r from-primary to-orange-500 bg-clip-text text-transparent">Trading</span>?
            </h2>
            <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
              Join Namibia's fastest-growing barter trading community. List your first item in under 2 minutes.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link href="/auth">
                <Button size="lg" className="bg-gradient-to-r from-primary to-orange-500 hover:from-primary/90 hover:to-orange-500/90 text-white shadow-xl shadow-primary/25 w-full sm:w-auto group h-14 px-8 text-lg rounded-xl">
                  Create Free Account
                  <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>
              <Link href="/dashboard/browse">
                <Button size="lg" variant="outline" className="border-primary/50 hover:bg-primary/10 w-full sm:w-auto bg-transparent h-14 px-8 text-lg rounded-xl">
                  Explore Listings
                </Button>
              </Link>
            </div>

            {/* Trust Badges */}
            <div className="flex flex-wrap items-center justify-center gap-6 mt-10 pt-8 border-t border-border/50">
              {[
                { icon: Shield, label: "Verified Users" },
                { icon: Lock, label: "Escrow Protected" },
                { icon: BadgeCheck, label: "ID Verified" },
              ].map((badge) => (
                <div key={badge.label} className="flex items-center gap-2 text-muted-foreground">
                  <badge.icon className="w-5 h-5 text-primary" />
                  <span className="text-sm">{badge.label}</span>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* ============================================ */}
      {/* FOOTER */}
      {/* ============================================ */}
      <footer className="py-12 border-t border-border/50">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl overflow-hidden">
                <Image src="/logo.png" alt="Barter Trade Namibia" width={40} height={40} className="object-contain" />
              </div>
              <div>
                <span className="font-semibold text-foreground">Barter Trade Namibia</span>
                <p className="text-xs text-muted-foreground">Trade. Connect. Prosper.</p>
              </div>
            </div>

            <div className="flex items-center gap-6">
              <Link href="/auth" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                Sign In
              </Link>
              <Link href="/auth" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                Register
              </Link>
              <Link href="/dashboard/browse" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                Browse
              </Link>
            </div>

            <p className="text-sm text-muted-foreground">
              © {new Date().getFullYear()} Barter Trade Namibia. All rights reserved.
            </p>
          </div>
        </div>
      </footer>

      {/* ============================================ */}
      {/* TRADE NOTIFICATION POPUP */}
      {/* ============================================ */}
      <AnimatePresence>
        {currentTrade && <TradeNotificationPopup trade={currentTrade} onClose={() => setCurrentTrade(null)} />}
      </AnimatePresence>
    </div>
  )
}

export default LandingPage
