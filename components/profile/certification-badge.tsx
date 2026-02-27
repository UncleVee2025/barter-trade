"use client"

import { Shield, Award, CheckCircle, Star } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { cn } from "@/lib/utils"

interface CertificationBadgeProps {
  isCertified: boolean
  badgeType?: 'bronze' | 'silver' | 'gold' | 'platinum'
  certificationId?: string
  certificationDate?: string
  size?: 'sm' | 'md' | 'lg'
  showLabel?: boolean
  showTooltip?: boolean
  className?: string
}

const badgeConfig = {
  bronze: {
    bg: "bg-amber-700",
    text: "text-white",
    icon: "text-amber-700",
    label: "Bronze Trader",
    description: "Completed 10+ successful trades"
  },
  silver: {
    bg: "bg-slate-400",
    text: "text-white",
    icon: "text-slate-400",
    label: "Silver Trader",
    description: "Completed 25+ successful trades"
  },
  gold: {
    bg: "bg-yellow-500",
    text: "text-yellow-900",
    icon: "text-yellow-500",
    label: "Gold Trader",
    description: "Completed 50+ successful trades"
  },
  platinum: {
    bg: "bg-gradient-to-r from-slate-300 to-slate-500",
    text: "text-white",
    icon: "text-slate-400",
    label: "Platinum Trader",
    description: "Completed 100+ successful trades - Elite status"
  }
}

const sizeConfig = {
  sm: {
    icon: "h-3.5 w-3.5",
    badge: "text-xs px-1.5 py-0.5",
    gap: "gap-1"
  },
  md: {
    icon: "h-4 w-4",
    badge: "text-sm px-2 py-1",
    gap: "gap-1.5"
  },
  lg: {
    icon: "h-5 w-5",
    badge: "text-base px-3 py-1.5",
    gap: "gap-2"
  }
}

export function CertificationBadge({
  isCertified,
  badgeType = 'bronze',
  certificationId,
  certificationDate,
  size = 'md',
  showLabel = false,
  showTooltip = true,
  className
}: CertificationBadgeProps) {
  if (!isCertified) return null

  const config = badgeConfig[badgeType]
  const sizeStyles = sizeConfig[size]

  const BadgeContent = (
    <Badge 
      className={cn(
        config.bg,
        config.text,
        sizeStyles.badge,
        sizeStyles.gap,
        "flex items-center border-0 font-medium",
        className
      )}
    >
      <Shield className={sizeStyles.icon} />
      {showLabel && <span>{config.label}</span>}
    </Badge>
  )

  if (!showTooltip) return BadgeContent

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          {BadgeContent}
        </TooltipTrigger>
        <TooltipContent side="top" className="max-w-xs">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Award className={cn("h-5 w-5", config.icon)} />
              <span className="font-semibold">{config.label}</span>
            </div>
            <p className="text-sm text-muted-foreground">{config.description}</p>
            {certificationId && (
              <div className="pt-1 border-t">
                <p className="text-xs text-muted-foreground">
                  ID: <code className="bg-muted px-1 rounded">{certificationId}</code>
                </p>
              </div>
            )}
            {certificationDate && (
              <p className="text-xs text-muted-foreground">
                Certified since {new Date(certificationDate).toLocaleDateString()}
              </p>
            )}
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}

interface CertificationStatusProps {
  isCertified: boolean
  badgeType?: 'bronze' | 'silver' | 'gold' | 'platinum'
  completedTrades?: number
  className?: string
}

export function CertificationStatus({
  isCertified,
  badgeType,
  completedTrades = 0,
  className
}: CertificationStatusProps) {
  if (isCertified && badgeType) {
    const config = badgeConfig[badgeType]
    return (
      <div className={cn("flex items-center gap-2", className)}>
        <div className={cn(
          "flex items-center justify-center w-8 h-8 rounded-full",
          config.bg
        )}>
          <Shield className={cn("h-4 w-4", config.text)} />
        </div>
        <div>
          <p className="font-medium text-sm">{config.label}</p>
          <p className="text-xs text-muted-foreground">{completedTrades} completed trades</p>
        </div>
      </div>
    )
  }

  // Not certified - show progress
  const tradesNeeded = Math.max(0, 10 - completedTrades)
  const progress = Math.min(100, (completedTrades / 10) * 100)

  return (
    <div className={cn("space-y-2", className)}>
      <div className="flex items-center gap-2">
        <div className="flex items-center justify-center w-8 h-8 rounded-full bg-muted">
          <Shield className="h-4 w-4 text-muted-foreground" />
        </div>
        <div>
          <p className="font-medium text-sm">Not Yet Certified</p>
          <p className="text-xs text-muted-foreground">
            {tradesNeeded > 0 
              ? `${tradesNeeded} more trades needed`
              : "Eligible for certification!"
            }
          </p>
        </div>
      </div>
      <div className="h-2 bg-muted rounded-full overflow-hidden">
        <div 
          className="h-full bg-primary transition-all duration-500"
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  )
}

interface VerificationBadgesProps {
  emailVerified?: boolean
  phoneVerified?: boolean
  idVerified?: boolean
  size?: 'sm' | 'md'
  className?: string
}

export function VerificationBadges({
  emailVerified,
  phoneVerified,
  idVerified,
  size = 'sm',
  className
}: VerificationBadgesProps) {
  const iconSize = size === 'sm' ? 'h-3 w-3' : 'h-4 w-4'
  const badges = []

  if (emailVerified) {
    badges.push({ label: 'Email', verified: true })
  }
  if (phoneVerified) {
    badges.push({ label: 'Phone', verified: true })
  }
  if (idVerified) {
    badges.push({ label: 'ID', verified: true })
  }

  if (badges.length === 0) return null

  return (
    <div className={cn("flex flex-wrap gap-1", className)}>
      {badges.map((badge) => (
        <Badge 
          key={badge.label}
          variant="secondary" 
          className="text-xs gap-1"
        >
          <CheckCircle className={cn(iconSize, "text-green-500")} />
          {badge.label}
        </Badge>
      ))}
    </div>
  )
}
