"use client"

import React from "react"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { ExternalLink, Sparkles, ChevronLeft, ChevronRight, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import Image from "next/image"
import { cn } from "@/lib/utils"
import useSWR from "swr"

interface Ad {
  id: string
  title: string
  subtitle?: string
  cta_text: string
  cta_href: string
  image_url?: string
  gradient_colors: string
  position: string
  priority: number
}

interface AdBannerCarouselProps {
  position?: string
  autoRotate?: boolean
  rotateInterval?: number
  className?: string
  showControls?: boolean
  showDismiss?: boolean
  height?: "sm" | "md" | "lg"
}

const fetcher = (url: string) => fetch(url).then((res) => res.json())

export function AdBannerCarousel({
  position = "home-banner",
  autoRotate = true,
  rotateInterval = 5000,
  className,
  showControls = false,
  showDismiss = false,
  height = "md",
}: AdBannerCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isDismissed, setIsDismissed] = useState(false)
  const [isPaused, setIsPaused] = useState(false)

  const { data, error } = useSWR<{ ads: Ad[] }>(
    `/api/ads?position=${position}&limit=5`,
    fetcher,
    { revalidateOnFocus: false }
  )

  const ads = data?.ads || []
  const isFromDatabase = data?.source === "database"

  // Auto-rotate ads
  useEffect(() => {
    if (!autoRotate || isPaused || ads.length <= 1) return

    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % ads.length)
    }, rotateInterval)

    return () => clearInterval(timer)
  }, [autoRotate, rotateInterval, ads.length, isPaused])

  // Handle navigation
  const goToNext = () => setCurrentIndex((prev) => (prev + 1) % ads.length)
  const goToPrev = () => setCurrentIndex((prev) => (prev - 1 + ads.length) % ads.length)

  // Don't show anything if no ads from database (admin controls all ads)
  if (isDismissed || !ads.length || !isFromDatabase) return null
  if (error) return null

  const heightClasses = {
    sm: "h-24 sm:h-28",
    md: "h-32 sm:h-40",
    lg: "h-40 sm:h-48",
  }

  const currentAd = ads[currentIndex]

  return (
    <div
      className={cn("relative overflow-hidden rounded-2xl", heightClasses[height], className)}
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      <AnimatePresence mode="wait">
        <motion.div
          key={currentAd.id}
          initial={{ opacity: 0, x: 100 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -100 }}
          transition={{ duration: 0.4, ease: "easeInOut" }}
          className={cn(
            "absolute inset-0 flex items-center justify-between p-4 sm:p-6",
            `bg-gradient-to-r ${currentAd.gradient_colors}`
          )}
          style={{ backgroundSize: "200% 200%", animation: "gradient 4s ease infinite" }}
        >
          {/* Background Image (if provided) */}
          {currentAd.image_url && (
            <div className="absolute inset-0">
              <Image
                src={currentAd.image_url || "/placeholder.svg"}
                alt=""
                fill
                className="object-cover opacity-30"
              />
              <div className="absolute inset-0 bg-gradient-to-r from-black/60 to-transparent" />
            </div>
          )}

          {/* Content */}
          <div className="relative z-10 space-y-1 sm:space-y-2 max-w-[60%]">
            <h3 className="text-lg sm:text-2xl font-bold text-white leading-tight">
              {currentAd.title}
            </h3>
            {currentAd.subtitle && (
              <p className="text-white/80 text-xs sm:text-sm line-clamp-2">
                {currentAd.subtitle}
              </p>
            )}
            <Button
              size="sm"
              className="mt-2 bg-white text-foreground hover:bg-white/90 rounded-xl shadow-lg"
              asChild
            >
              <Link href={currentAd.cta_href}>
                {currentAd.cta_text}
                <ExternalLink className="h-3.5 w-3.5 ml-1.5" />
              </Link>
            </Button>
          </div>

          {/* Decorative Icon */}
          <div className="absolute right-4 sm:right-8 top-1/2 -translate-y-1/2 opacity-20">
            <Sparkles className="h-20 sm:h-32 w-20 sm:w-32 text-white" />
          </div>
        </motion.div>
      </AnimatePresence>

      {/* Navigation Controls */}
      {showControls && ads.length > 1 && (
        <>
          <button
            onClick={goToPrev}
            className="absolute left-2 top-1/2 -translate-y-1/2 z-20 w-8 h-8 rounded-full bg-black/30 backdrop-blur-sm flex items-center justify-center text-white hover:bg-black/50 transition-colors"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <button
            onClick={goToNext}
            className="absolute right-2 top-1/2 -translate-y-1/2 z-20 w-8 h-8 rounded-full bg-black/30 backdrop-blur-sm flex items-center justify-center text-white hover:bg-black/50 transition-colors"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        </>
      )}

      {/* Dismiss Button */}
      {showDismiss && (
        <button
          onClick={() => setIsDismissed(true)}
          className="absolute top-2 right-2 z-20 w-6 h-6 rounded-full bg-black/30 backdrop-blur-sm flex items-center justify-center text-white hover:bg-black/50 transition-colors"
        >
          <X className="h-4 w-4" />
        </button>
      )}

      {/* Pagination Dots */}
      {ads.length > 1 && (
        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5 z-10">
          {ads.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentIndex(index)}
              className={cn(
                "h-1.5 rounded-full transition-all duration-300",
                index === currentIndex
                  ? "bg-white w-6"
                  : "bg-white/50 w-1.5 hover:bg-white/70"
              )}
            />
          ))}
        </div>
      )}
    </div>
  )
}

// Simple single ad banner
interface SingleAdBannerProps {
  title: string
  subtitle?: string
  ctaText: string
  ctaHref: string
  gradient?: string
  icon?: React.ReactNode
  className?: string
  onDismiss?: () => void
}

export function SingleAdBanner({
  title,
  subtitle,
  ctaText,
  ctaHref,
  gradient = "from-primary via-amber-500 to-primary",
  icon,
  className,
  onDismiss,
}: SingleAdBannerProps) {
  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-2xl p-4 sm:p-6",
        `bg-gradient-to-r ${gradient}`,
        className
      )}
      style={{ backgroundSize: "200% 200%", animation: "gradient 4s ease infinite" }}
    >
      <div className="flex items-center justify-between relative z-10">
        <div className="space-y-1">
          <h3 className="text-lg sm:text-xl font-bold text-white">{title}</h3>
          {subtitle && (
            <p className="text-white/80 text-sm">{subtitle}</p>
          )}
        </div>
        <Button
          size="sm"
          className="bg-white text-foreground hover:bg-white/90 rounded-xl shadow-lg"
          asChild
        >
          <Link href={ctaHref}>
            {ctaText}
            <ExternalLink className="h-3.5 w-3.5 ml-1.5" />
          </Link>
        </Button>
      </div>

      {/* Decorative */}
      {icon && (
        <div className="absolute right-4 top-1/2 -translate-y-1/2 opacity-20">
          {icon}
        </div>
      )}

      {onDismiss && (
        <button
          onClick={onDismiss}
          className="absolute top-2 right-2 z-20 w-6 h-6 rounded-full bg-black/30 flex items-center justify-center text-white hover:bg-black/50"
        >
          <X className="h-4 w-4" />
        </button>
      )}
    </div>
  )
}
