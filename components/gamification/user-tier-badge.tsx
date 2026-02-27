"use client"

import React from "react"

import { motion } from "framer-motion"
import { cn } from "@/lib/utils"
import { Crown, Medal, Shield, Award, Diamond, Sparkles } from "lucide-react"

type TierType = "bronze" | "silver" | "gold" | "platinum" | "diamond"

interface UserTierBadgeProps {
  tier: TierType
  points?: number
  showPoints?: boolean
  size?: "sm" | "md" | "lg"
  className?: string
}

const tierConfig: Record<TierType, {
  label: string
  color: string
  bgColor: string
  borderColor: string
  icon: React.ComponentType<{ className?: string }>
  gradient: string
}> = {
  bronze: {
    label: "Bronze",
    color: "text-orange-700",
    bgColor: "bg-orange-100",
    borderColor: "border-orange-300",
    icon: Shield,
    gradient: "from-orange-400 to-orange-600",
  },
  silver: {
    label: "Silver",
    color: "text-slate-600",
    bgColor: "bg-slate-100",
    borderColor: "border-slate-300",
    icon: Medal,
    gradient: "from-slate-300 to-slate-500",
  },
  gold: {
    label: "Gold",
    color: "text-amber-600",
    bgColor: "bg-amber-100",
    borderColor: "border-amber-400",
    icon: Award,
    gradient: "from-amber-400 to-yellow-500",
  },
  platinum: {
    label: "Platinum",
    color: "text-purple-600",
    bgColor: "bg-purple-100",
    borderColor: "border-purple-300",
    icon: Crown,
    gradient: "from-purple-400 to-purple-600",
  },
  diamond: {
    label: "Diamond",
    color: "text-cyan-600",
    bgColor: "bg-cyan-100",
    borderColor: "border-cyan-300",
    icon: Diamond,
    gradient: "from-cyan-400 to-blue-500",
  },
}

const sizeConfig = {
  sm: {
    container: "px-2 py-1 text-xs",
    icon: "h-3 w-3",
    gap: "gap-1",
  },
  md: {
    container: "px-3 py-1.5 text-sm",
    icon: "h-4 w-4",
    gap: "gap-1.5",
  },
  lg: {
    container: "px-4 py-2 text-base",
    icon: "h-5 w-5",
    gap: "gap-2",
  },
}

export function UserTierBadge({ 
  tier, 
  points, 
  showPoints = false, 
  size = "md",
  className 
}: UserTierBadgeProps) {
  const config = tierConfig[tier]
  const sizeStyles = sizeConfig[size]
  const Icon = config.icon

  return (
    <motion.div
      initial={{ scale: 0.9, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      className={cn(
        "inline-flex items-center font-medium rounded-full border",
        sizeStyles.container,
        sizeStyles.gap,
        config.bgColor,
        config.borderColor,
        config.color,
        className
      )}
    >
      <Icon className={sizeStyles.icon} />
      <span>{config.label}</span>
      {showPoints && points !== undefined && (
        <>
          <span className="opacity-50">|</span>
          <span className="font-mono">{points.toLocaleString()} pts</span>
        </>
      )}
    </motion.div>
  )
}

// Animated tier card for profile display
interface TierCardProps {
  tier: TierType
  points: number
  nextTierProgress: {
    currentTier: string
    nextTier: string
    pointsNeeded: number
    progress: number
  }
  className?: string
}

export function TierProgressCard({ 
  tier, 
  points, 
  nextTierProgress,
  className 
}: TierCardProps) {
  const config = tierConfig[tier]
  const nextConfig = nextTierProgress.nextTier !== tier 
    ? tierConfig[nextTierProgress.nextTier as TierType] 
    : null
  const Icon = config.icon

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        "relative overflow-hidden rounded-2xl border p-6",
        config.borderColor,
        "bg-gradient-to-br from-background to-muted/50",
        className
      )}
    >
      {/* Decorative gradient overlay */}
      <div 
        className={cn(
          "absolute top-0 right-0 w-32 h-32 rounded-full blur-3xl opacity-20",
          `bg-gradient-to-br ${config.gradient}`
        )} 
      />
      
      <div className="relative z-10">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className={cn(
              "w-12 h-12 rounded-xl flex items-center justify-center",
              `bg-gradient-to-br ${config.gradient}`
            )}>
              <Icon className="h-6 w-6 text-white" />
            </div>
            <div>
              <h3 className={cn("text-lg font-bold", config.color)}>
                {config.label} Trader
              </h3>
              <p className="text-sm text-muted-foreground">
                {points.toLocaleString()} total points
              </p>
            </div>
          </div>
          {tier === "diamond" && (
            <motion.div
              animate={{ rotate: [0, 10, -10, 0] }}
              transition={{ repeat: Number.POSITIVE_INFINITY, duration: 2 }}
            >
              <Sparkles className="h-6 w-6 text-cyan-500" />
            </motion.div>
          )}
        </div>

        {/* Progress to next tier */}
        {nextConfig && nextTierProgress.progress < 100 && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">
                Progress to {nextConfig.label}
              </span>
              <span className={nextConfig.color}>
                {nextTierProgress.pointsNeeded} pts needed
              </span>
            </div>
            <div className="relative h-2 bg-muted rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${nextTierProgress.progress}%` }}
                transition={{ duration: 1, ease: "easeOut" }}
                className={cn(
                  "absolute inset-y-0 left-0 rounded-full",
                  `bg-gradient-to-r ${nextConfig.gradient}`
                )}
              />
            </div>
            <p className="text-xs text-muted-foreground text-right">
              {nextTierProgress.progress}% complete
            </p>
          </div>
        )}

        {/* Diamond tier - max level */}
        {tier === "diamond" && (
          <div className="flex items-center justify-center gap-2 py-2 px-4 bg-cyan-500/10 rounded-lg border border-cyan-500/20">
            <Diamond className="h-4 w-4 text-cyan-500" />
            <span className="text-sm font-medium text-cyan-600">
              Maximum tier achieved!
            </span>
          </div>
        )}
      </div>
    </motion.div>
  )
}

// Tier requirements info
export function TierRequirements() {
  const tiers = [
    { tier: "bronze" as TierType, min: 0, max: 50 },
    { tier: "silver" as TierType, min: 51, max: 150 },
    { tier: "gold" as TierType, min: 151, max: 300 },
    { tier: "platinum" as TierType, min: 301, max: 500 },
    { tier: "diamond" as TierType, min: 501, max: null },
  ]

  return (
    <div className="space-y-3">
      <h4 className="text-sm font-medium text-foreground">Tier Requirements</h4>
      <div className="grid gap-2">
        {tiers.map(({ tier, min, max }) => {
          const config = tierConfig[tier]
          const Icon = config.icon
          
          return (
            <div
              key={tier}
              className={cn(
                "flex items-center justify-between p-3 rounded-lg border",
                config.bgColor,
                config.borderColor
              )}
            >
              <div className="flex items-center gap-2">
                <Icon className={cn("h-4 w-4", config.color)} />
                <span className={cn("font-medium", config.color)}>
                  {config.label}
                </span>
              </div>
              <span className="text-sm text-muted-foreground font-mono">
                {max ? `${min} - ${max} pts` : `${min}+ pts`}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}
