"use client"

import { motion, useInView } from "framer-motion"
import { useRef, useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { 
  ArrowRight, 
  Smartphone, 
  QrCode, 
  Sparkles, 
  Clock, 
  Gift, 
  Users, 
  TrendingUp,
  CheckCircle2,
  Shield,
  Zap,
  Mail
} from "lucide-react"
import { WaitlistForm } from "./waitlist-form"

export function CTASection() {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: "-100px" })
  
  // Countdown timer for FOMO
  const [timeLeft, setTimeLeft] = useState({
    hours: 23,
    minutes: 59,
    seconds: 59
  })

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev.seconds > 0) {
          return { ...prev, seconds: prev.seconds - 1 }
        } else if (prev.minutes > 0) {
          return { ...prev, minutes: prev.minutes - 1, seconds: 59 }
        } else if (prev.hours > 0) {
          return { hours: prev.hours - 1, minutes: 59, seconds: 59 }
        }
        return { hours: 23, minutes: 59, seconds: 59 }
      })
    }, 1000)
    return () => clearInterval(timer)
  }, [])

  const benefits = [
    { icon: Gift, text: "N$50 signup bonus" },
    { icon: Shield, text: "100% secure trading" },
    { icon: Zap, text: "Zero platform fees for 30 days" },
    { icon: Users, text: "Join 50,000+ traders" },
  ]

  return (
    <section ref={ref} className="relative py-24 lg:py-32 overflow-hidden">
      {/* Animated background */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-background to-gold/5" />
      <div className="absolute inset-0">
        {[...Array(20)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-2 h-2 bg-primary/20 rounded-full"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
            }}
            animate={{
              scale: [1, 1.5, 1],
              opacity: [0.2, 0.5, 0.2],
            }}
            transition={{
              duration: 3 + Math.random() * 2,
              repeat: Infinity,
              delay: Math.random() * 2,
            }}
          />
        ))}
      </div>

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="relative"
        >
          {/* Main CTA card */}
          <div className="relative bg-gradient-to-br from-card via-card to-secondary rounded-[2rem] p-8 lg:p-16 overflow-hidden border border-border">
            {/* Decorative gradient orbs */}
            <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary/20 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/2" />
            <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-gold/15 rounded-full blur-[100px] translate-y-1/2 -translate-x-1/2" />
            
            {/* Grid pattern */}
            <div className="absolute inset-0 bg-[linear-gradient(rgba(234,88,12,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(234,88,12,0.03)_1px,transparent_1px)] bg-[size:40px_40px] rounded-[2rem]" />

            <div className="relative z-10">
              {/* Urgency banner */}
              <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={isInView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.5, delay: 0.2 }}
                className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-10"
              >
                <div className="flex items-center gap-3 px-5 py-3 bg-destructive/10 border border-destructive/30 rounded-2xl">
                  <Clock className="h-5 w-5 text-destructive animate-pulse" />
                  <span className="text-sm font-medium text-foreground">
                    Limited Time Offer Ends In:
                  </span>
                  <div className="flex items-center gap-1 font-mono font-bold text-destructive">
                    <span className="px-2 py-1 bg-destructive/20 rounded-lg">{String(timeLeft.hours).padStart(2, '0')}</span>
                    <span>:</span>
                    <span className="px-2 py-1 bg-destructive/20 rounded-lg">{String(timeLeft.minutes).padStart(2, '0')}</span>
                    <span>:</span>
                    <span className="px-2 py-1 bg-destructive/20 rounded-lg">{String(timeLeft.seconds).padStart(2, '0')}</span>
                  </div>
                </div>
              </motion.div>

              <div className="flex flex-col lg:flex-row items-center justify-between gap-12">
                {/* Content */}
                <div className="flex-1 text-center lg:text-left">
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={isInView ? { opacity: 1, y: 0 } : {}}
                    transition={{ duration: 0.5, delay: 0.3 }}
                  >
                    <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 border border-primary/20 rounded-full mb-6">
                      <Sparkles className="h-4 w-4 text-primary animate-pulse" />
                      <span className="text-sm font-semibold text-primary">Exclusive Launch Offer</span>
                    </div>
                  </motion.div>

                  <motion.h2
                    initial={{ opacity: 0, y: 20 }}
                    animate={isInView ? { opacity: 1, y: 0 } : {}}
                    transition={{ duration: 0.5, delay: 0.4 }}
                    className="text-3xl sm:text-4xl lg:text-5xl font-bold text-foreground mb-6"
                  >
                    Ready to Start{" "}
                    <span className="bg-gradient-to-r from-primary to-gold bg-clip-text text-transparent">
                      Trading?
                    </span>
                  </motion.h2>

                  <motion.p
                    initial={{ opacity: 0, y: 20 }}
                    animate={isInView ? { opacity: 1, y: 0 } : {}}
                    transition={{ duration: 0.5, delay: 0.5 }}
                    className="text-lg text-muted-foreground mb-8 max-w-xl"
                  >
                    Join thousands of Namibians who are already trading smarter. Create your free account 
                    and get <span className="text-primary font-semibold">N$50 bonus</span> to start trading immediately.
                  </motion.p>

                  {/* Benefits grid */}
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={isInView ? { opacity: 1, y: 0 } : {}}
                    transition={{ duration: 0.5, delay: 0.6 }}
                    className="grid grid-cols-2 gap-3 mb-8 max-w-lg mx-auto lg:mx-0"
                  >
                    {benefits.map((benefit, i) => (
                      <div
                        key={i}
                        className="flex items-center gap-2 px-3 py-2 bg-card/50 border border-border/50 rounded-xl"
                      >
                        <benefit.icon className="h-4 w-4 text-primary flex-shrink-0" />
                        <span className="text-sm text-foreground/80">{benefit.text}</span>
                      </div>
                    ))}
                  </motion.div>

                  {/* CTA buttons */}
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={isInView ? { opacity: 1, y: 0 } : {}}
                    transition={{ duration: 0.5, delay: 0.7 }}
                    className="flex flex-col sm:flex-row items-center gap-4 justify-center lg:justify-start"
                  >
                    <Link href="/auth">
                      <Button
                        size="lg"
                        className="relative bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary text-primary-foreground px-10 py-7 text-lg font-semibold rounded-2xl shadow-2xl shadow-primary/30 gap-3 group overflow-hidden"
                      >
                        <span className="relative z-10 flex items-center gap-2">
                          Claim Your N$50 Bonus
                          <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
                        </span>
                        <motion.div
                          className="absolute inset-0 bg-gradient-to-r from-gold/30 to-transparent"
                          animate={{ x: ['-100%', '100%'] }}
                          transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                        />
                      </Button>
                    </Link>
                    <Button
                      variant="outline"
                      size="lg"
                      className="px-8 py-7 text-lg rounded-2xl border-border/50 text-foreground hover:bg-card gap-2 bg-transparent"
                    >
                      <Smartphone className="h-5 w-5" />
                      Download App
                    </Button>
                  </motion.div>

                  {/* Trust indicators */}
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={isInView ? { opacity: 1 } : {}}
                    transition={{ duration: 0.5, delay: 0.8 }}
                    className="flex items-center gap-6 mt-6 justify-center lg:justify-start"
                  >
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <CheckCircle2 className="h-4 w-4 text-green-500" />
                      <span>No credit card required</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <CheckCircle2 className="h-4 w-4 text-green-500" />
                      <span>Cancel anytime</span>
                    </div>
                  </motion.div>
                </div>

                {/* App preview / QR code */}
                <motion.div
                  initial={{ opacity: 0, scale: 0.9, x: 50 }}
                  animate={isInView ? { opacity: 1, scale: 1, x: 0 } : {}}
                  transition={{ duration: 0.6, delay: 0.5 }}
                  className="flex flex-col items-center gap-6"
                >
                  {/* Phone mockup */}
                  <div className="relative">
                    <div className="w-64 h-[500px] bg-gradient-to-b from-card to-secondary rounded-[3rem] border-4 border-border p-3 shadow-2xl">
                      <div className="w-full h-full bg-background rounded-[2.5rem] overflow-hidden">
                        {/* App UI preview */}
                        <div className="p-4">
                          <div className="flex items-center justify-between mb-6">
                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-gold" />
                            <div className="w-16 h-2 bg-muted rounded-full" />
                            <div className="w-8 h-8 rounded-full bg-muted" />
                          </div>
                          <div className="space-y-3">
                            <div className="h-24 bg-gradient-to-br from-primary/20 to-gold/20 rounded-2xl" />
                            <div className="grid grid-cols-2 gap-2">
                              <div className="h-16 bg-muted rounded-xl" />
                              <div className="h-16 bg-muted rounded-xl" />
                            </div>
                            <div className="h-20 bg-muted rounded-xl" />
                            <div className="h-20 bg-muted rounded-xl" />
                          </div>
                        </div>
                      </div>
                    </div>
                    {/* Floating notification */}
                    <motion.div
                      initial={{ opacity: 0, y: 20, x: -20 }}
                      animate={isInView ? { opacity: 1, y: 0, x: 0 } : {}}
                      transition={{ duration: 0.5, delay: 1 }}
                      className="absolute -left-16 top-20 px-4 py-3 bg-card border border-border rounded-2xl shadow-xl"
                    >
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-green-500/20 flex items-center justify-center">
                          <TrendingUp className="h-4 w-4 text-green-500" />
                        </div>
                        <div>
                          <p className="text-xs font-medium text-foreground">New Trade!</p>
                          <p className="text-[10px] text-muted-foreground">+N$2,500</p>
                        </div>
                      </div>
                    </motion.div>
                    {/* QR code */}
                    <motion.div
                      initial={{ opacity: 0, y: 20, x: 20 }}
                      animate={isInView ? { opacity: 1, y: 0, x: 0 } : {}}
                      transition={{ duration: 0.5, delay: 1.2 }}
                      className="absolute -right-12 bottom-20 p-3 bg-card border border-border rounded-2xl shadow-xl"
                    >
                      <div className="w-20 h-20 bg-gradient-to-br from-primary to-gold rounded-xl flex items-center justify-center">
                        <QrCode className="h-12 w-12 text-white" />
                      </div>
                      <p className="text-[10px] text-center text-muted-foreground mt-2">Scan to download</p>
                    </motion.div>
                  </div>
                </motion.div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  )
}
