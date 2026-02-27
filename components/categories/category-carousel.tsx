"use client"

import React from "react"

import { useRef, useState, useEffect } from "react"
import { motion } from "framer-motion"
import {
  ChevronLeft,
  ChevronRight,
  Smartphone,
  Car,
  Home,
  Beef,
  Shirt,
  Hammer,
  Gem,
  Gift,
  ShoppingBag,
  Laptop,
  Sofa,
  TreePine,
  Wrench,
  BookOpen,
  Music,
  Dumbbell,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"
import { cn } from "@/lib/utils"
import useSWR from "swr"

// Category configuration with icons and gradients
const categoryConfig: Record<string, { icon: React.ComponentType<{ className?: string }>; gradient: string }> = {
  electronics: { icon: Smartphone, gradient: "from-blue-500 to-cyan-500" },
  vehicles: { icon: Car, gradient: "from-emerald-500 to-green-500" },
  property: { icon: Home, gradient: "from-violet-500 to-purple-500" },
  livestock: { icon: Beef, gradient: "from-amber-500 to-orange-500" },
  fashion: { icon: Shirt, gradient: "from-pink-500 to-rose-500" },
  services: { icon: Hammer, gradient: "from-teal-500 to-cyan-500" },
  collectibles: { icon: Gem, gradient: "from-indigo-500 to-blue-500" },
  computers: { icon: Laptop, gradient: "from-slate-500 to-gray-500" },
  furniture: { icon: Sofa, gradient: "from-amber-600 to-yellow-500" },
  outdoor: { icon: TreePine, gradient: "from-green-500 to-emerald-500" },
  tools: { icon: Wrench, gradient: "from-gray-500 to-zinc-500" },
  books: { icon: BookOpen, gradient: "from-orange-500 to-red-500" },
  music: { icon: Music, gradient: "from-purple-500 to-pink-500" },
  sports: { icon: Dumbbell, gradient: "from-red-500 to-orange-500" },
  other: { icon: Gift, gradient: "from-gray-500 to-slate-500" },
}

interface Category {
  id: string
  name: string
  slug: string
  count: number
}

interface CategoryCarouselProps {
  title?: string
  showHeader?: boolean
  onCategoryClick?: (categoryId: string) => void
  className?: string
  cardSize?: "sm" | "md" | "lg"
}

const fetcher = (url: string) => fetch(url).then((res) => res.json())

// Default categories for fallback
const defaultCategories: Category[] = [
  { id: "electronics", name: "Electronics", slug: "electronics", count: 234 },
  { id: "vehicles", name: "Vehicles", slug: "vehicles", count: 156 },
  { id: "property", name: "Property", slug: "property", count: 89 },
  { id: "livestock", name: "Livestock", slug: "livestock", count: 312 },
  { id: "fashion", name: "Fashion", slug: "fashion", count: 445 },
  { id: "services", name: "Services", slug: "services", count: 167 },
  { id: "collectibles", name: "Collectibles", slug: "collectibles", count: 78 },
  { id: "furniture", name: "Furniture", slug: "furniture", count: 198 },
  { id: "other", name: "Other", slug: "other", count: 223 },
]

export function CategoryCarousel({
  title = "Categories",
  showHeader = true,
  onCategoryClick,
  className,
  cardSize = "md",
}: CategoryCarouselProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [canScrollLeft, setCanScrollLeft] = useState(false)
  const [canScrollRight, setCanScrollRight] = useState(true)

  const { data } = useSWR<{ categories: Category[] }>("/api/categories", fetcher, {
    revalidateOnFocus: false,
    fallbackData: { categories: defaultCategories },
  })

  const categories = data?.categories || defaultCategories

  // Check scroll position
  const checkScroll = () => {
    if (containerRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = containerRef.current
      setCanScrollLeft(scrollLeft > 0)
      setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 10)
    }
  }

  useEffect(() => {
    checkScroll()
    const container = containerRef.current
    if (container) {
      container.addEventListener("scroll", checkScroll)
      return () => container.removeEventListener("scroll", checkScroll)
    }
  }, [])

  const scroll = (direction: "left" | "right") => {
    if (containerRef.current) {
      const scrollAmount = direction === "left" ? -240 : 240
      containerRef.current.scrollBy({ left: scrollAmount, behavior: "smooth" })
    }
  }

  const sizeClasses = {
    sm: "w-[100px]",
    md: "w-[130px]",
    lg: "w-[160px]",
  }

  const iconSizeClasses = {
    sm: "w-8 h-8",
    md: "w-12 h-12",
    lg: "w-14 h-14",
  }

  const iconInnerSizeClasses = {
    sm: "h-4 w-4",
    md: "h-6 w-6",
    lg: "h-7 w-7",
  }

  return (
    <section className={className}>
      {showHeader && (
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-gradient-to-br from-violet-500 to-purple-500">
              <ShoppingBag className="h-4 w-4 text-white" />
            </div>
            <h2 className="text-lg font-semibold text-foreground">{title}</h2>
          </div>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              className={cn(
                "h-8 w-8 rounded-lg transition-opacity",
                !canScrollLeft && "opacity-30 cursor-not-allowed"
              )}
              onClick={() => scroll("left")}
              disabled={!canScrollLeft}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className={cn(
                "h-8 w-8 rounded-lg transition-opacity",
                !canScrollRight && "opacity-30 cursor-not-allowed"
              )}
              onClick={() => scroll("right")}
              disabled={!canScrollRight}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      <div
        ref={containerRef}
        className="flex gap-3 overflow-x-auto no-scrollbar pb-2 -mx-4 px-4 scroll-smooth"
      >
        {categories.map((category, index) => {
          const config = categoryConfig[category.slug] || categoryConfig.other
          const Icon = config.icon

          return (
            <motion.div
              key={category.id}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.03 * index }}
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.98 }}
              className={cn("flex-shrink-0", sizeClasses[cardSize])}
            >
              <Link
                href={`/dashboard/browse?category=${category.slug}`}
                onClick={() => onCategoryClick?.(category.id)}
              >
                <Card className="border-border/50 hover:border-primary/30 transition-all duration-300 bg-card/50 h-full">
                  <CardContent className="p-3 sm:p-4 flex flex-col items-center text-center">
                    <div
                      className={cn(
                        "rounded-2xl flex items-center justify-center bg-gradient-to-br mb-2 sm:mb-3",
                        config.gradient,
                        iconSizeClasses[cardSize]
                      )}
                    >
                      <Icon className={cn("text-white", iconInnerSizeClasses[cardSize])} />
                    </div>
                    <p className="font-medium text-xs sm:text-sm text-foreground truncate w-full">
                      {category.name}
                    </p>
                    <Badge
                      variant="secondary"
                      className="mt-1.5 text-[9px] sm:text-[10px] bg-muted/50 px-1.5 py-0"
                    >
                      {category.count}
                    </Badge>
                  </CardContent>
                </Card>
              </Link>
            </motion.div>
          )
        })}
      </div>
    </section>
  )
}

// Grid layout alternative
export function CategoryGrid({
  title = "Browse by Category",
  columns = 4,
  showCounts = true,
  className,
}: {
  title?: string
  columns?: 2 | 3 | 4 | 6
  showCounts?: boolean
  className?: string
}) {
  const { data } = useSWR<{ categories: Category[] }>("/api/categories", fetcher, {
    revalidateOnFocus: false,
    fallbackData: { categories: defaultCategories },
  })

  const categories = data?.categories || defaultCategories

  const gridClasses = {
    2: "grid-cols-2",
    3: "grid-cols-3",
    4: "grid-cols-2 sm:grid-cols-4",
    6: "grid-cols-3 sm:grid-cols-6",
  }

  return (
    <section className={className}>
      {title && (
        <h2 className="text-lg font-semibold text-foreground mb-4">{title}</h2>
      )}
      <div className={cn("grid gap-3", gridClasses[columns])}>
        {categories.map((category, index) => {
          const config = categoryConfig[category.slug] || categoryConfig.other
          const Icon = config.icon

          return (
            <motion.div
              key={category.id}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.03 * index }}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <Link href={`/dashboard/browse?category=${category.slug}`}>
                <Card className="border-border/50 hover:border-primary/30 transition-all duration-300 bg-card/50">
                  <CardContent className="p-4 flex items-center gap-3">
                    <div
                      className={cn(
                        "w-10 h-10 rounded-xl flex items-center justify-center bg-gradient-to-br flex-shrink-0",
                        config.gradient
                      )}
                    >
                      <Icon className="h-5 w-5 text-white" />
                    </div>
                    <div className="min-w-0">
                      <p className="font-medium text-sm text-foreground truncate">
                        {category.name}
                      </p>
                      {showCounts && (
                        <p className="text-xs text-muted-foreground">
                          {category.count} items
                        </p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </Link>
            </motion.div>
          )
        })}
      </div>
    </section>
  )
}
