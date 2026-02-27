"use client"

import React from "react"

import { useState, useRef, useEffect } from "react"
import { motion, useMotionValue, useSpring, useTransform } from "framer-motion"
import {
  Smartphone,
  Car,
  Beef,
  Home,
  Wheat,
  Shirt,
  Wrench,
  Sofa,
  ChevronLeft,
  ChevronRight,
  Sparkles,
} from "lucide-react"
import { cn } from "@/lib/utils"
import Link from "next/link"
import Image from "next/image"

// Category data with gradients and images
const categories = [
  {
    id: "electronics",
    name: "Electronics",
    icon: Smartphone,
    count: 156,
    gradient: "from-blue-600 to-cyan-500",
    shadowColor: "shadow-blue-500/25",
    image: "/categories/electronics.jpg",
    trending: true,
  },
  {
    id: "vehicles",
    name: "Vehicles",
    icon: Car,
    count: 89,
    gradient: "from-rose-600 to-red-500",
    shadowColor: "shadow-rose-500/25",
    image: "/categories/vehicles.jpg",
    trending: true,
  },
  {
    id: "livestock",
    name: "Livestock",
    icon: Beef,
    count: 234,
    gradient: "from-lime-600 to-green-500",
    shadowColor: "shadow-lime-500/25",
    image: "/categories/livestock.jpg",
    trending: false,
  },
  {
    id: "property",
    name: "Property",
    icon: Home,
    count: 67,
    gradient: "from-amber-600 to-yellow-500",
    shadowColor: "shadow-amber-500/25",
    image: "/categories/property.jpg",
    trending: true,
  },
  {
    id: "agriculture",
    name: "Agriculture",
    icon: Wheat,
    count: 145,
    gradient: "from-emerald-600 to-teal-500",
    shadowColor: "shadow-emerald-500/25",
    image: "/categories/agriculture.jpg",
    trending: false,
  },
  {
    id: "fashion",
    name: "Fashion",
    icon: Shirt,
    count: 312,
    gradient: "from-pink-600 to-fuchsia-500",
    shadowColor: "shadow-pink-500/25",
    image: "/categories/fashion.jpg",
    trending: true,
  },
  {
    id: "services",
    name: "Services",
    icon: Wrench,
    count: 98,
    gradient: "from-violet-600 to-purple-500",
    shadowColor: "shadow-violet-500/25",
    image: "/categories/services.jpg",
    trending: false,
  },
  {
    id: "home-garden",
    name: "Home & Garden",
    icon: Sofa,
    count: 187,
    gradient: "from-teal-600 to-cyan-500",
    shadowColor: "shadow-teal-500/25",
    image: "/categories/home.jpg",
    trending: false,
  },
]

// Individual category card with 3D hover effect
function CategoryCard({
  category,
  index,
}: {
  category: (typeof categories)[0]
  index: number
}) {
  const cardRef = useRef<HTMLDivElement>(null)
  const [isHovered, setIsHovered] = useState(false)

  // Mouse position tracking for 3D effect
  const mouseX = useMotionValue(0)
  const mouseY = useMotionValue(0)

  const rotateX = useSpring(useTransform(mouseY, [-0.5, 0.5], [8, -8]), {
    stiffness: 300,
    damping: 30,
  })
  const rotateY = useSpring(useTransform(mouseX, [-0.5, 0.5], [-8, 8]), {
    stiffness: 300,
    damping: 30,
  })

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!cardRef.current) return
    const rect = cardRef.current.getBoundingClientRect()
    const x = (e.clientX - rect.left) / rect.width - 0.5
    const y = (e.clientY - rect.top) / rect.height - 0.5
    mouseX.set(x)
    mouseY.set(y)
  }

  const handleMouseLeave = () => {
    mouseX.set(0)
    mouseY.set(0)
    setIsHovered(false)
  }

  const Icon = category.icon

  return (
    <motion.div
      ref={cardRef}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={handleMouseLeave}
      style={{ rotateX, rotateY, transformStyle: "preserve-3d" }}
      className="flex-shrink-0 w-40 lg:w-48 perspective-1000"
    >
      <Link href={`/dashboard/browse?category=${category.id}`}>
        <div
          className={cn(
            "relative overflow-hidden rounded-2xl h-48 lg:h-56 cursor-pointer transition-all duration-300",
            isHovered && "shadow-xl",
            category.shadowColor
          )}
        >
          {/* Background Image */}
          <div className="absolute inset-0">
            <Image
              src={category.image || "/placeholder.svg"}
              alt={category.name}
              fill
              className={cn(
                "object-cover transition-transform duration-500",
                isHovered && "scale-110"
              )}
            />
            <div
              className={cn(
                "absolute inset-0 bg-gradient-to-t transition-opacity duration-300",
                category.gradient,
                isHovered ? "opacity-80" : "opacity-70"
              )}
            />
          </div>

          {/* Content */}
          <div className="relative h-full p-4 flex flex-col justify-between text-white">
            {/* Trending Badge */}
            {category.trending && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2 + index * 0.05, type: "spring" }}
                className="self-end"
              >
                <span className="flex items-center gap-1 px-2 py-1 rounded-full bg-white/20 backdrop-blur-sm text-xs font-medium">
                  <Sparkles className="h-3 w-3" />
                  Trending
                </span>
              </motion.div>
            )}

            <div className="mt-auto">
              {/* Icon */}
              <motion.div
                animate={{ scale: isHovered ? 1.1 : 1, y: isHovered ? -4 : 0 }}
                transition={{ type: "spring", stiffness: 300 }}
                className="w-12 h-12 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center mb-3"
              >
                <Icon className="h-6 w-6" />
              </motion.div>

              {/* Name */}
              <h3 className="font-bold text-lg mb-1">{category.name}</h3>

              {/* Count */}
              <motion.p
                animate={{ opacity: isHovered ? 1 : 0.8 }}
                className="text-sm text-white/80"
              >
                {category.count} listings
              </motion.p>

              {/* Animated Arrow */}
              <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: isHovered ? 1 : 0, x: isHovered ? 0 : -10 }}
                className="absolute bottom-4 right-4"
              >
                <div className="w-8 h-8 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
                  <ChevronRight className="h-4 w-4" />
                </div>
              </motion.div>
            </div>
          </div>

          {/* Shine effect on hover */}
          <motion.div
            initial={{ x: "-100%", opacity: 0 }}
            animate={{ x: isHovered ? "100%" : "-100%", opacity: isHovered ? 0.3 : 0 }}
            transition={{ duration: 0.6 }}
            className="absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent skew-x-12"
          />
        </div>
      </Link>
    </motion.div>
  )
}

export function AnimatedCategoryCarousel() {
  const scrollRef = useRef<HTMLDivElement>(null)
  const [canScrollLeft, setCanScrollLeft] = useState(false)
  const [canScrollRight, setCanScrollRight] = useState(true)
  const [isDragging, setIsDragging] = useState(false)
  const [startX, setStartX] = useState(0)
  const [scrollLeft, setScrollLeft] = useState(0)

  const updateScrollButtons = () => {
    if (!scrollRef.current) return
    const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current
    setCanScrollLeft(scrollLeft > 0)
    setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 10)
  }

  useEffect(() => {
    const scrollContainer = scrollRef.current
    if (scrollContainer) {
      scrollContainer.addEventListener("scroll", updateScrollButtons)
      updateScrollButtons()
      return () => scrollContainer.removeEventListener("scroll", updateScrollButtons)
    }
  }, [])

  const scroll = (direction: "left" | "right") => {
    if (!scrollRef.current) return
    const scrollAmount = 200
    scrollRef.current.scrollBy({
      left: direction === "left" ? -scrollAmount : scrollAmount,
      behavior: "smooth",
    })
  }

  // Mouse drag scrolling
  const handleMouseDown = (e: React.MouseEvent) => {
    if (!scrollRef.current) return
    setIsDragging(true)
    setStartX(e.pageX - scrollRef.current.offsetLeft)
    setScrollLeft(scrollRef.current.scrollLeft)
  }

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || !scrollRef.current) return
    e.preventDefault()
    const x = e.pageX - scrollRef.current.offsetLeft
    const walk = (x - startX) * 1.5
    scrollRef.current.scrollLeft = scrollLeft - walk
  }

  const handleMouseUp = () => {
    setIsDragging(false)
  }

  return (
    <div className="relative group">
      {/* Scroll buttons */}
      <motion.button
        initial={{ opacity: 0 }}
        animate={{ opacity: canScrollLeft ? 1 : 0 }}
        onClick={() => scroll("left")}
        disabled={!canScrollLeft}
        className="absolute left-0 top-1/2 -translate-y-1/2 z-10 w-10 h-10 rounded-full bg-card/90 backdrop-blur-sm border border-border/50 flex items-center justify-center text-foreground shadow-lg hover:bg-card transition-colors disabled:opacity-0"
      >
        <ChevronLeft className="h-5 w-5" />
      </motion.button>

      <motion.button
        initial={{ opacity: 0 }}
        animate={{ opacity: canScrollRight ? 1 : 0 }}
        onClick={() => scroll("right")}
        disabled={!canScrollRight}
        className="absolute right-0 top-1/2 -translate-y-1/2 z-10 w-10 h-10 rounded-full bg-card/90 backdrop-blur-sm border border-border/50 flex items-center justify-center text-foreground shadow-lg hover:bg-card transition-colors disabled:opacity-0"
      >
        <ChevronRight className="h-5 w-5" />
      </motion.button>

      {/* Gradient fade edges */}
      <div className="absolute left-0 top-0 bottom-0 w-8 bg-gradient-to-r from-background to-transparent z-[5] pointer-events-none" />
      <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-background to-transparent z-[5] pointer-events-none" />

      {/* Carousel container */}
      <div
        ref={scrollRef}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        className={cn(
          "flex gap-4 overflow-x-auto scrollbar-hide py-2 px-1",
          isDragging ? "cursor-grabbing" : "cursor-grab"
        )}
        style={{ scrollSnapType: "x mandatory" }}
      >
        {categories.map((category, index) => (
          <CategoryCard key={category.id} category={category} index={index} />
        ))}
      </div>
    </div>
  )
}
