"use client"

import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { ArrowRight, ArrowLeft, Check } from "lucide-react"
import { ModernTradeAnimation } from "./modern-trade-animation"
import { ModernWalletAnimation } from "./modern-wallet-animation"
import { ModernMapAnimation } from "./modern-map-animation"

interface SlideData {
  id: number
  title: string
  subtitle: string
  gradient: string
  animation: "trade" | "wallet" | "map"
  features: string[]
}

interface OnboardingSlideProps {
  slide: SlideData
  slideIndex: number
  totalSlides: number
  direction: number
  onNext: () => void
  onPrev: () => void
  isLastSlide: boolean
}

const slideVariants = {
  enter: (direction: number) => ({
    x: direction > 0 ? 300 : -300,
    opacity: 0,
  }),
  center: {
    x: 0,
    opacity: 1,
  },
  exit: (direction: number) => ({
    x: direction < 0 ? 300 : -300,
    opacity: 0,
  }),
}

export function OnboardingSlide({
  slide,
  slideIndex,
  totalSlides,
  direction,
  onNext,
  onPrev,
  isLastSlide,
}: OnboardingSlideProps) {
  return (
    <motion.div
      custom={direction}
      variants={slideVariants}
      initial="enter"
      animate="center"
      exit="exit"
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
      className="relative min-h-screen flex flex-col lg:flex-row items-center justify-center gap-8 lg:gap-16 px-6 py-24"
    >
      {/* Animation Section */}
      <div className="flex-1 flex items-center justify-center max-w-md lg:max-w-lg">
        {slide.animation === "trade" && <ModernTradeAnimation />}
        {slide.animation === "wallet" && <ModernWalletAnimation />}
        {slide.animation === "map" && <ModernMapAnimation />}
      </div>

      {/* Content Section */}
      <div className="flex-1 max-w-lg text-center lg:text-left">
        {/* Step indicator */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="inline-flex items-center gap-2 px-3 py-1 bg-primary/10 rounded-full mb-6"
        >
          <span className="text-sm font-medium text-primary">
            Step {slideIndex + 1} of {totalSlides}
          </span>
        </motion.div>

        {/* Title */}
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="text-3xl sm:text-4xl lg:text-5xl font-bold text-foreground mb-4 text-balance"
        >
          {slide.title}
        </motion.h1>

        {/* Subtitle */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="text-lg text-muted-foreground mb-8 text-pretty"
        >
          {slide.subtitle}
        </motion.p>

        {/* Features */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="flex flex-wrap gap-2 justify-center lg:justify-start mb-10"
        >
          {slide.features.map((feature, i) => (
            <motion.div
              key={feature}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.6 + i * 0.1 }}
              className="flex items-center gap-2 px-3 py-1.5 bg-card/60 backdrop-blur-sm border border-border rounded-full"
            >
              <Check className="h-3 w-3 text-primary" />
              <span className="text-sm text-foreground">{feature}</span>
            </motion.div>
          ))}
        </motion.div>

        {/* Navigation buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
          className="flex items-center gap-4 justify-center lg:justify-start"
        >
          {slideIndex > 0 && (
            <Button
              variant="outline"
              size="lg"
              onClick={onPrev}
              className="rounded-xl border-border hover:bg-muted gap-2 bg-transparent"
            >
              <ArrowLeft className="h-4 w-4" />
              Back
            </Button>
          )}
          <Button
            size="lg"
            onClick={onNext}
            className="bg-primary hover:bg-primary/90 text-primary-foreground px-8 rounded-xl shadow-lg shadow-primary/25 transition-all hover:scale-105 hover:shadow-xl gap-2"
          >
            {isLastSlide ? "Get Started" : "Continue"}
            <ArrowRight className="h-4 w-4" />
          </Button>
        </motion.div>
      </div>
    </motion.div>
  )
}
