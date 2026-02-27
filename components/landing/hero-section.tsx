"use client"

import type React from "react"
import Image from "next/image"
import { motion, useMotionValue, useSpring, useTransform } from "framer-motion"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { 
  ArrowRight, 
  Play, 
  Shield, 
  Zap, 
  Globe2, 
  Smartphone, 
  Car, 
  Home, 
  Wheat, 
  Laptop,
  TrendingUp,
  Users,
  Clock,
  Sparkles,
  CheckCircle2,
  Activity
} from "lucide-react"
import { useRef, useState, useEffect } from "react"

const floatingItems = [
  { icon: Smartphone, label: "Electronics", x: -320, y: -120, delay: 0, value: "N$8,500" },
  { icon: Car, label: "Vehicles", x: 320, y: -100, delay: 0.1, value: "N$45,000" },
  { icon: Home, label: "Property", x: -380, y: 60, delay: 0.2, value: "N$125,000" },
  { icon: Wheat, label: "Agriculture", x: 360, y: 100, delay: 0.3, value: "N$12,000" },
  { icon: Laptop, label: "Services", x: -240, y: 180, delay: 0.4, value: "N$3,500" },
]

const liveActivities = [
  { user: "Maria S.", action: "traded", item: "Samsung Galaxy", location: "Windhoek", time: "2s ago" },
  { user: "Johannes A.", action: "listed", item: "Ford Ranger 2021", location: "Oshakati", time: "15s ago" },
  { user: "Grace N.", action: "completed", item: "Furniture Set", location: "Swakopmund", time: "32s ago" },
  { user: "Peter K.", action: "traded", item: "50 Cattle", location: "Rundu", time: "1m ago" },
  { user: "Anna M.", action: "listed", item: "Macbook Pro", location: "Walvis Bay", time: "2m ago" },
]

export function HeroSection() {
  const containerRef = useRef<HTMLDivElement>(null)
  const [currentActivity, setCurrentActivity] = useState(0)
  const [onlineUsers, setOnlineUsers] = useState(2847)
  const [todayTrades, setTodayTrades] = useState(156)

  const mouseX = useMotionValue(0)
  const mouseY = useMotionValue(0)

  const springConfig = { damping: 25, stiffness: 150 }
  const x = useSpring(mouseX, springConfig)
  const y = useSpring(mouseY, springConfig)

  // Simulate live data updates
  useEffect(() => {
    const activityInterval = setInterval(() => {
      setCurrentActivity((prev) => (prev + 1) % liveActivities.length)
    }, 3000)

    const usersInterval = setInterval(() => {
      setOnlineUsers((prev) => prev + Math.floor(Math.random() * 10) - 4)
    }, 5000)

    const tradesInterval = setInterval(() => {
      setTodayTrades((prev) => prev + 1)
    }, 8000)

    return () => {
      clearInterval(activityInterval)
      clearInterval(usersInterval)
      clearInterval(tradesInterval)
    }
  }, [])

  const handleMouseMove = (e: React.MouseEvent) => {
    const rect = containerRef.current?.getBoundingClientRect()
    if (rect) {
      const centerX = rect.left + rect.width / 2
      const centerY = rect.top + rect.height / 2
      mouseX.set((e.clientX - centerX) / 50)
      mouseY.set((e.clientY - centerY) / 50)
    }
  }

  const floatingItemStyles = floatingItems.map((item, i) => ({
    x: item.x,
    y: item.y,
    directionX: i % 2 === 0 ? 2 : -2,
    directionY: i % 2 === 0 ? -2 : 2,
  }))

  return (
    <section
      ref={containerRef}
      onMouseMove={handleMouseMove}
      className="relative min-h-screen flex items-center justify-center pt-24 pb-16 px-4 overflow-hidden"
    >
      {/* Animated background particles */}
      <div className="absolute inset-0 overflow-hidden">
        {[...Array(50)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-1 h-1 bg-primary/30 rounded-full"
            initial={{
              x: Math.random() * (typeof window !== 'undefined' ? window.innerWidth : 1920),
              y: Math.random() * (typeof window !== 'undefined' ? window.innerHeight : 1080),
            }}
            animate={{
              y: [null, -20, 20, -20],
              opacity: [0.2, 0.5, 0.2],
            }}
            transition={{
              duration: 3 + Math.random() * 2,
              repeat: Infinity,
              ease: "easeInOut",
              delay: Math.random() * 2,
            }}
          />
        ))}
      </div>

      {/* Animated gradient orbs */}
      <motion.div
        animate={{
          scale: [1, 1.3, 1],
          opacity: [0.2, 0.4, 0.2],
          rotate: [0, 180, 360],
        }}
        transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
        className="absolute top-1/4 left-1/4 w-[600px] h-[600px] bg-gradient-to-br from-primary/30 via-transparent to-transparent rounded-full blur-3xl"
      />
      <motion.div
        animate={{
          scale: [1.2, 1, 1.2],
          opacity: [0.15, 0.3, 0.15],
          rotate: [360, 180, 0],
        }}
        transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
        className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] bg-gradient-to-br from-gold/25 via-transparent to-transparent rounded-full blur-3xl"
      />

      {/* Grid pattern overlay */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(234,88,12,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(234,88,12,0.03)_1px,transparent_1px)] bg-[size:60px_60px] [mask-image:radial-gradient(ellipse_80%_50%_at_50%_0%,#000_70%,transparent_100%)]" />

      {/* Live activity notification - floating */}
      <motion.div
        initial={{ opacity: 0, x: -100 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 1.5, duration: 0.5 }}
        className="fixed left-4 bottom-24 z-50 hidden lg:block"
      >
        <motion.div
          key={currentActivity}
          initial={{ opacity: 0, y: 20, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -20, scale: 0.9 }}
          className="flex items-center gap-3 px-4 py-3 bg-card/90 backdrop-blur-xl border border-border rounded-2xl shadow-2xl max-w-xs"
        >
          <div className="relative">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-gold flex items-center justify-center">
              <Activity className="h-5 w-5 text-white" />
            </div>
            <span className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-card animate-pulse" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-foreground truncate">
              {liveActivities[currentActivity].user} {liveActivities[currentActivity].action}
            </p>
            <p className="text-xs text-muted-foreground truncate">
              {liveActivities[currentActivity].item} in {liveActivities[currentActivity].location}
            </p>
          </div>
          <span className="text-[10px] text-primary font-medium">
            {liveActivities[currentActivity].time}
          </span>
        </motion.div>
      </motion.div>

      {/* Floating mascot (desktop) */}
      <motion.div
        initial={{ opacity: 0, scale: 0.8, x: 100 }}
        animate={{ opacity: 1, scale: 1, x: 0 }}
        transition={{ delay: 1, duration: 0.8, type: "spring" }}
        className="absolute right-8 xl:right-16 top-1/2 -translate-y-1/2 hidden lg:block z-20"
      >
        <motion.div
          animate={{ y: [0, -20, 0] }}
          transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
          className="relative"
        >
          <div className="relative w-56 h-56 xl:w-72 xl:h-72">
            <Image
              src="/mascot.jpg"
              alt="Barter Trade Namibia Mascot"
              fill
              className="object-contain drop-shadow-2xl"
              priority
            />
            <div className="absolute inset-0 -z-10 bg-gradient-to-t from-primary/30 via-gold/20 to-transparent blur-3xl rounded-full" />
          </div>
          {/* Speech bubble */}
          <motion.div
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 1.5, duration: 0.4 }}
            className="absolute -top-4 -left-8 bg-card/95 backdrop-blur-sm border border-border rounded-2xl px-4 py-2 shadow-xl"
          >
            <p className="text-sm font-medium text-foreground">Welcome to trading!</p>
            <div className="absolute -bottom-2 left-8 w-4 h-4 bg-card/95 border-b border-r border-border rotate-45" />
          </motion.div>
        </motion.div>
      </motion.div>

      {/* Floating trade items with values */}
      <div className="absolute inset-0 hidden lg:block">
        {floatingItems.map((item, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.8 + item.delay, duration: 0.5 }}
            style={{
              x: floatingItemStyles[i].x + x.get() * floatingItemStyles[i].directionX,
              y: floatingItemStyles[i].y + y.get() * floatingItemStyles[i].directionY,
            }}
            className="absolute left-1/2 top-1/2"
          >
            <motion.div
              animate={{ y: [0, -15, 0] }}
              transition={{ duration: 3 + i * 0.5, repeat: Infinity, ease: "easeInOut" }}
              whileHover={{ scale: 1.1 }}
              className="relative group"
            >
              <div className="flex items-center gap-3 px-4 py-3 bg-card/80 backdrop-blur-xl border border-border/50 rounded-2xl shadow-xl hover:border-primary/50 transition-all duration-300 cursor-pointer">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary/20 to-gold/20 flex items-center justify-center">
                  <item.icon className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <span className="text-sm font-semibold text-foreground block">{item.label}</span>
                  <span className="text-xs text-gold font-medium">{item.value}</span>
                </div>
              </div>
              <div className="absolute -inset-1 bg-gradient-to-r from-primary/20 to-gold/20 rounded-2xl blur-lg opacity-0 group-hover:opacity-100 transition-opacity -z-10" />
            </motion.div>
          </motion.div>
        ))}
      </div>

      <div className="relative z-10 max-w-6xl mx-auto text-center">
        {/* Live stats bar */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="flex flex-wrap items-center justify-center gap-4 sm:gap-8 mb-8"
        >
          <div className="flex items-center gap-2 px-4 py-2 bg-green-500/10 border border-green-500/20 rounded-full">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500" />
            </span>
            <span className="text-sm text-green-400 font-medium">
              <span className="font-bold">{onlineUsers.toLocaleString()}</span> traders online
            </span>
          </div>
          <div className="flex items-center gap-2 px-4 py-2 bg-primary/10 border border-primary/20 rounded-full">
            <TrendingUp className="h-4 w-4 text-primary" />
            <span className="text-sm text-primary font-medium">
              <span className="font-bold">{todayTrades}</span> trades today
            </span>
          </div>
          <div className="hidden sm:flex items-center gap-2 px-4 py-2 bg-gold/10 border border-gold/20 rounded-full">
            <Clock className="h-4 w-4 text-gold" />
            <span className="text-sm text-gold font-medium">
              Avg. trade time: <span className="font-bold">4.2 hours</span>
            </span>
          </div>
        </motion.div>

        {/* Badge with urgency */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }} 
          animate={{ opacity: 1, y: 0 }} 
          transition={{ duration: 0.6, delay: 0.1 }}
        >
          <div className="inline-flex items-center gap-3 px-5 py-2.5 bg-gradient-to-r from-primary/20 via-primary/10 to-gold/20 backdrop-blur-sm border border-primary/30 rounded-full mb-8 group hover:border-primary/50 transition-colors cursor-pointer">
            <Sparkles className="h-4 w-4 text-gold animate-pulse" />
            <span className="text-sm text-foreground font-medium">
              Limited Time: <span className="text-primary font-bold">Zero Platform Fees</span> for new traders
            </span>
            <ArrowRight className="h-4 w-4 text-primary group-hover:translate-x-1 transition-transform" />
          </div>
        </motion.div>

        {/* Main headline with animated gradient */}
        <motion.h1
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-bold text-foreground mb-6 tracking-tight"
        >
          <span className="block">Trade Anything.</span>
          <span className="block mt-2">
            <span className="relative">
              <span className="bg-gradient-to-r from-primary via-gold to-primary bg-clip-text text-transparent bg-[length:200%_auto] animate-gradient">
                No Cash Needed.
              </span>
              <motion.span
                className="absolute -bottom-2 left-0 right-0 h-1 bg-gradient-to-r from-primary via-gold to-primary rounded-full"
                initial={{ scaleX: 0 }}
                animate={{ scaleX: 1 }}
                transition={{ delay: 1, duration: 0.8 }}
              />
            </span>
          </span>
        </motion.h1>

        {/* Subheadline */}
        <motion.p
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="text-lg sm:text-xl lg:text-2xl text-muted-foreground max-w-3xl mx-auto mb-10 text-pretty leading-relaxed"
        >
          Join <span className="text-primary font-semibold">50,000+</span> Namibians trading goods, vehicles, 
          livestock, and services on Africa&apos;s most trusted digital barter platform.
        </motion.p>

        {/* CTA Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-12"
        >
          <Link href="/auth">
            <Button
              size="lg"
              className="relative bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary text-primary-foreground px-10 py-7 text-lg font-semibold rounded-2xl shadow-2xl shadow-primary/30 transition-all hover:scale-105 hover:shadow-primary/40 gap-3 group overflow-hidden"
            >
              <span className="relative z-10 flex items-center gap-2">
                Start Trading Free
                <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
              </span>
              <motion.div
                className="absolute inset-0 bg-gradient-to-r from-gold/20 to-transparent"
                animate={{ x: ['-100%', '100%'] }}
                transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
              />
            </Button>
          </Link>
          <Button
            variant="outline"
            size="lg"
            className="px-10 py-7 text-lg rounded-2xl border-border/50 hover:bg-card hover:border-primary/50 gap-3 group bg-transparent backdrop-blur-sm"
          >
            <Play className="h-5 w-5 text-primary group-hover:scale-110 transition-transform" />
            Watch Demo
          </Button>
        </motion.div>

        {/* Mobile mascot (visible only on small screens) */}
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, delay: 0.45, type: "spring" }}
          className="lg:hidden flex justify-center mb-8"
        >
          <div className="relative w-40 h-40">
            <Image
              src="/mascot.jpg"
              alt="Barter Trade Namibia Mascot"
              fill
              className="object-contain drop-shadow-2xl"
              priority
            />
            <div className="absolute inset-0 -z-10 bg-gradient-to-t from-primary/20 via-gold/10 to-transparent blur-2xl rounded-full" />
          </div>
        </motion.div>

        {/* Trust badges with icons */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.5 }}
          className="flex flex-wrap items-center justify-center gap-x-8 gap-y-4"
        >
          {[
            { icon: Shield, text: "Bank-Grade Security", color: "text-green-400" },
            { icon: Zap, text: "Instant Transfers", color: "text-gold" },
            { icon: Globe2, text: "14 Regions Connected", color: "text-primary" },
            { icon: CheckCircle2, text: "Verified Traders", color: "text-blue-400" },
          ].map((item, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.6 + i * 0.1 }}
              className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors cursor-default"
            >
              <item.icon className={`h-5 w-5 ${item.color}`} />
              <span className="text-sm font-medium">{item.text}</span>
            </motion.div>
          ))}
        </motion.div>

        {/* Social proof avatars */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.7 }}
          className="flex items-center justify-center gap-4 mt-12"
        >
          <div className="flex -space-x-3">
            {[...Array(5)].map((_, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.8 + i * 0.1 }}
                className="w-10 h-10 rounded-full bg-gradient-to-br from-primary/50 to-gold/50 border-2 border-background flex items-center justify-center"
              >
                <Users className="h-4 w-4 text-foreground/70" />
              </motion.div>
            ))}
          </div>
          <div className="text-left">
            <div className="flex items-center gap-1">
              {[...Array(5)].map((_, i) => (
                <motion.svg
                  key={i}
                  initial={{ opacity: 0, scale: 0 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 1 + i * 0.05 }}
                  className="w-4 h-4 text-gold fill-current"
                  viewBox="0 0 20 20"
                >
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </motion.svg>
              ))}
            </div>
            <p className="text-sm text-muted-foreground">
              <span className="text-foreground font-semibold">4.9/5</span> from 2,847 reviews
            </p>
          </div>
        </motion.div>
      </div>

      {/* Scroll indicator */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 2 }}
        className="absolute bottom-8 left-1/2 -translate-x-1/2"
      >
        <motion.div
          animate={{ y: [0, 12, 0] }}
          transition={{ duration: 2, repeat: Infinity }}
          className="flex flex-col items-center gap-2"
        >
          <span className="text-xs text-muted-foreground uppercase tracking-widest">Scroll to explore</span>
          <div className="w-6 h-10 rounded-full border-2 border-muted-foreground/30 flex items-start justify-center pt-2">
            <motion.div
              animate={{ y: [0, 12, 0], opacity: [1, 0.3, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="w-1.5 h-3 rounded-full bg-primary"
            />
          </div>
        </motion.div>
      </motion.div>
    </section>
  )
}
