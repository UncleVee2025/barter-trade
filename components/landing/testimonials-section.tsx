"use client"

import { motion, useInView, AnimatePresence } from "framer-motion"
import { useRef, useState, useEffect } from "react"
import { Star, Quote, ChevronLeft, ChevronRight, MapPin, Verified, TrendingUp, Users } from "lucide-react"
import Image from "next/image"
import { cn } from "@/lib/utils"

const testimonials = [
  {
    name: "Maria Shikongo",
    role: "Small Business Owner",
    location: "Windhoek, Khomas",
    image: "/avatars/maria.jpg",
    content:
      "I traded my old bakery equipment for a delivery scooter. This platform made it possible to grow my business without needing cash. The process was smooth and secure - I couldn't believe how easy it was!",
    rating: 5,
    tradedValue: "N$15,000",
    trades: 23,
    verified: true,
  },
  {
    name: "Johannes Amukoshi",
    role: "Livestock Farmer",
    location: "Oshakati, Oshana",
    image: "/avatars/johannes.jpg",
    content:
      "I've been trading cattle and agricultural equipment for 6 months now. The platform connects me with buyers I never could have reached before. It's a real game changer for rural farmers like myself.",
    rating: 5,
    tradedValue: "N$85,000",
    trades: 47,
    verified: true,
  },
  {
    name: "Selma Nghidengwa",
    role: "Teacher & Entrepreneur",
    location: "Swakopmund, Erongo",
    image: "/avatars/selma.jpg",
    content:
      "Traded my old furniture for a laptop for my studies. The chat feature made negotiating easy, and I felt completely safe throughout the process. Already recommended it to all my colleagues!",
    rating: 5,
    tradedValue: "N$12,500",
    trades: 15,
    verified: true,
  },
  {
    name: "David Garoeb",
    role: "Auto Mechanic",
    location: "Walvis Bay, Erongo",
    image: "/avatars/david.jpg",
    content:
      "As a mechanic, I often trade my services for tools and parts. This platform has become essential for my business. The verification system builds real trust between traders.",
    rating: 5,
    tradedValue: "N$45,000",
    trades: 62,
    verified: true,
  },
  {
    name: "Grace Amutenya",
    role: "Fashion Designer",
    location: "Rundu, Kavango East",
    image: "/avatars/grace.jpg",
    content:
      "I've traded fabric, sewing machines, and even my designs for other goods I needed. The platform is intuitive and the community is amazing. Best decision I made for my business!",
    rating: 5,
    tradedValue: "N$28,000",
    trades: 34,
    verified: true,
  },
]

export function TestimonialsSection() {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: "-100px" })
  const [activeIndex, setActiveIndex] = useState(0)
  const [isAutoPlaying, setIsAutoPlaying] = useState(true)

  useEffect(() => {
    if (!isAutoPlaying) return
    const timer = setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % testimonials.length)
    }, 5000)
    return () => clearInterval(timer)
  }, [isAutoPlaying])

  const nextTestimonial = () => {
    setIsAutoPlaying(false)
    setActiveIndex((prev) => (prev + 1) % testimonials.length)
  }

  const prevTestimonial = () => {
    setIsAutoPlaying(false)
    setActiveIndex((prev) => (prev - 1 + testimonials.length) % testimonials.length)
  }

  return (
    <section id="testimonials" ref={ref} className="relative py-24 lg:py-32 overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-b from-card/30 via-background to-card/30" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(234,88,12,0.05),transparent_70%)]" />

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Section header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={isInView ? { opacity: 1, scale: 1 } : {}}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 px-4 py-2 bg-green-500/10 border border-green-500/20 rounded-full mb-6"
          >
            <Star className="h-4 w-4 text-green-500 fill-green-500" />
            <span className="text-sm font-medium text-green-500">4.9/5 Average Rating</span>
          </motion.div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-foreground mb-4 text-balance">
            Real Stories from <span className="text-primary">Real Traders</span>
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto text-pretty">
            Join thousands of Namibians who are already trading smarter and building their businesses.
          </p>
        </motion.div>

        {/* Stats bar */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="flex flex-wrap items-center justify-center gap-8 mb-16"
        >
          {[
            { icon: Users, value: "50,000+", label: "Happy Traders" },
            { icon: Star, value: "4.9/5", label: "Average Rating" },
            { icon: TrendingUp, value: "N$2.5M+", label: "Monthly Trades" },
          ].map((stat, i) => (
            <div key={i} className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center">
                <stat.icon className="h-6 w-6 text-primary" />
              </div>
              <div>
                <div className="text-xl font-bold text-foreground">{stat.value}</div>
                <div className="text-sm text-muted-foreground">{stat.label}</div>
              </div>
            </div>
          ))}
        </motion.div>

        {/* Testimonial carousel */}
        <div className="relative">
          <div className="max-w-5xl mx-auto">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeIndex}
                initial={{ opacity: 0, x: 50 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -50 }}
                transition={{ duration: 0.4 }}
                className="relative"
              >
                <div className="bg-card/80 backdrop-blur-xl rounded-[2rem] border border-border p-8 lg:p-12 shadow-2xl">
                  {/* Quote icon */}
                  <Quote className="h-16 w-16 text-primary/10 absolute top-8 left-8" />
                  
                  <div className="relative z-10">
                    {/* Stars */}
                    <div className="flex gap-1 mb-6">
                      {[...Array(testimonials[activeIndex].rating)].map((_, i) => (
                        <Star key={i} className="h-6 w-6 text-gold fill-gold" />
                      ))}
                    </div>

                    {/* Quote */}
                    <p className="text-xl lg:text-2xl text-foreground mb-10 leading-relaxed font-medium">
                      &quot;{testimonials[activeIndex].content}&quot;
                    </p>

                    {/* Author info */}
                    <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
                      <div className="flex items-center gap-4">
                        <div className="relative">
                          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-gold overflow-hidden">
                            <div className="w-full h-full flex items-center justify-center text-white text-xl font-bold">
                              {testimonials[activeIndex].name.charAt(0)}
                            </div>
                          </div>
                          {testimonials[activeIndex].verified && (
                            <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center border-2 border-card">
                              <Verified className="h-3 w-3 text-white" />
                            </div>
                          )}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-foreground text-lg">{testimonials[activeIndex].name}</span>
                          </div>
                          <div className="text-sm text-muted-foreground">{testimonials[activeIndex].role}</div>
                          <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                            <MapPin className="h-3 w-3" />
                            {testimonials[activeIndex].location}
                          </div>
                        </div>
                      </div>

                      {/* Trade stats */}
                      <div className="flex gap-6">
                        <div className="text-center lg:text-right">
                          <div className="text-2xl font-bold text-primary">{testimonials[activeIndex].tradedValue}</div>
                          <div className="text-xs text-muted-foreground">Total Traded</div>
                        </div>
                        <div className="text-center lg:text-right">
                          <div className="text-2xl font-bold text-foreground">{testimonials[activeIndex].trades}</div>
                          <div className="text-xs text-muted-foreground">Successful Trades</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            </AnimatePresence>

            {/* Navigation */}
            <div className="flex items-center justify-center gap-4 mt-8">
              <button
                onClick={prevTestimonial}
                className="w-12 h-12 rounded-full bg-card border border-border flex items-center justify-center text-muted-foreground hover:text-foreground hover:border-primary hover:bg-primary/5 transition-all"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>

              <div className="flex gap-2">
                {testimonials.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => {
                      setIsAutoPlaying(false)
                      setActiveIndex(i)
                    }}
                    className={cn(
                      "h-2 rounded-full transition-all duration-300",
                      i === activeIndex 
                        ? "w-8 bg-primary" 
                        : "w-2 bg-muted-foreground/30 hover:bg-muted-foreground/50"
                    )}
                  />
                ))}
              </div>

              <button
                onClick={nextTestimonial}
                className="w-12 h-12 rounded-full bg-card border border-border flex items-center justify-center text-muted-foreground hover:text-foreground hover:border-primary hover:bg-primary/5 transition-all"
              >
                <ChevronRight className="h-5 w-5" />
              </button>
            </div>
          </div>

          {/* Side testimonial previews - desktop only */}
          <div className="hidden xl:block">
            {/* Left preview */}
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              animate={isInView ? { opacity: 0.4, x: 0 } : {}}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="absolute left-0 top-1/2 -translate-y-1/2 w-64 p-4 bg-card/50 rounded-2xl border border-border/50 blur-[1px]"
            >
              <div className="flex gap-1 mb-2">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="h-3 w-3 text-gold fill-gold" />
                ))}
              </div>
              <p className="text-xs text-muted-foreground line-clamp-3">
                {testimonials[(activeIndex - 1 + testimonials.length) % testimonials.length].content}
              </p>
            </motion.div>

            {/* Right preview */}
            <motion.div
              initial={{ opacity: 0, x: 50 }}
              animate={isInView ? { opacity: 0.4, x: 0 } : {}}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="absolute right-0 top-1/2 -translate-y-1/2 w-64 p-4 bg-card/50 rounded-2xl border border-border/50 blur-[1px]"
            >
              <div className="flex gap-1 mb-2">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="h-3 w-3 text-gold fill-gold" />
                ))}
              </div>
              <p className="text-xs text-muted-foreground line-clamp-3">
                {testimonials[(activeIndex + 1) % testimonials.length].content}
              </p>
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  )
}
