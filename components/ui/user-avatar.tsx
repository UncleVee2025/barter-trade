"use client"

import * as React from "react"
import Image from "next/image"
import { cn } from "@/lib/utils"
import { User } from "lucide-react"

// Avatar variants with different styling options
const avatarVariants = {
  size: {
    xs: "h-6 w-6 text-[8px]",
    sm: "h-8 w-8 text-xs",
    md: "h-10 w-10 text-sm",
    lg: "h-12 w-12 text-base",
    xl: "h-16 w-16 text-lg",
    "2xl": "h-20 w-20 text-xl",
    "3xl": "h-24 w-24 text-2xl",
  },
  ring: {
    none: "",
    default: "ring-2 ring-border",
    primary: "ring-2 ring-primary",
    gold: "ring-2 ring-gold",
    gradient: "ring-2 ring-offset-2 ring-offset-background ring-primary",
  },
}

// Default avatars based on gender
const DEFAULT_AVATARS = {
  male: "/avatars/default-male.jpg",
  female: "/avatars/default-female.jpg",
  other: "/avatars/default-neutral.jpg",
  neutral: "/avatars/default-neutral.jpg",
} as const

interface UserAvatarProps {
  src?: string | null
  name?: string
  gender?: "male" | "female" | "other"
  size?: keyof typeof avatarVariants.size
  ring?: keyof typeof avatarVariants.ring
  showOnlineStatus?: boolean
  isOnline?: boolean
  showVerifiedBadge?: boolean
  isVerified?: boolean
  className?: string
  onClick?: () => void
}

export function UserAvatar({
  src,
  name,
  gender,
  size = "md",
  ring = "none",
  showOnlineStatus = false,
  isOnline = false,
  showVerifiedBadge = false,
  isVerified = false,
  className,
  onClick,
}: UserAvatarProps) {
  const [imageError, setImageError] = React.useState(false)
  
  // Determine which avatar to show
  const avatarSrc = React.useMemo(() => {
    if (src && !imageError) return src
    if (gender && gender in DEFAULT_AVATARS) {
      return DEFAULT_AVATARS[gender as keyof typeof DEFAULT_AVATARS]
    }
    return DEFAULT_AVATARS.neutral
  }, [src, gender, imageError])

  // Get initials from name
  const initials = React.useMemo(() => {
    if (!name) return ""
    const parts = name.trim().split(" ")
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase()
    }
    return parts[0].substring(0, 2).toUpperCase()
  }, [name])

  // Size classes for badges
  const badgeSizeClasses = {
    xs: "h-2 w-2",
    sm: "h-2.5 w-2.5",
    md: "h-3 w-3",
    lg: "h-3.5 w-3.5",
    xl: "h-4 w-4",
    "2xl": "h-5 w-5",
    "3xl": "h-6 w-6",
  }

  const verifiedSizeClasses = {
    xs: "h-3 w-3 -bottom-0.5 -right-0.5",
    sm: "h-3.5 w-3.5 -bottom-0.5 -right-0.5",
    md: "h-4 w-4 -bottom-0.5 -right-0.5",
    lg: "h-5 w-5 -bottom-1 -right-1",
    xl: "h-6 w-6 -bottom-1 -right-1",
    "2xl": "h-7 w-7 -bottom-1 -right-1",
    "3xl": "h-8 w-8 -bottom-1.5 -right-1.5",
  }

  return (
    <div
      className={cn(
        "relative inline-flex shrink-0",
        onClick && "cursor-pointer"
      )}
      onClick={onClick}
    >
      <div
        className={cn(
          "relative overflow-hidden rounded-full bg-muted flex items-center justify-center",
          avatarVariants.size[size],
          avatarVariants.ring[ring],
          className
        )}
      >
        {avatarSrc && !imageError ? (
          <Image
            src={avatarSrc || "/placeholder.svg"}
            alt={name || "User avatar"}
            fill
            className="object-cover"
            onError={() => setImageError(true)}
            sizes={`(max-width: 768px) ${size === "3xl" ? "96px" : size === "2xl" ? "80px" : "48px"}, ${size === "3xl" ? "96px" : size === "2xl" ? "80px" : "48px"}`}
          />
        ) : initials ? (
          <span className="font-semibold text-muted-foreground select-none">
            {initials}
          </span>
        ) : (
          <User className="h-1/2 w-1/2 text-muted-foreground" />
        )}
      </div>

      {/* Online Status Indicator */}
      {showOnlineStatus && (
        <span
          className={cn(
            "absolute top-0 right-0 block rounded-full border-2 border-background",
            badgeSizeClasses[size],
            isOnline ? "bg-emerald-500" : "bg-muted-foreground"
          )}
        />
      )}

      {/* Verified Badge */}
      {showVerifiedBadge && isVerified && (
        <span
          className={cn(
            "absolute flex items-center justify-center rounded-full bg-primary text-primary-foreground",
            verifiedSizeClasses[size]
          )}
        >
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="h-2/3 w-2/3"
          >
            <polyline points="20 6 9 17 4 12" />
          </svg>
        </span>
      )}
    </div>
  )
}

// Avatar Selection Component for Profile Settings
interface AvatarSelectorProps {
  currentAvatar?: string | null
  gender?: "male" | "female" | "other"
  onSelect: (avatarUrl: string) => void
  className?: string
}

export function AvatarSelector({
  currentAvatar,
  gender,
  onSelect,
  className,
}: AvatarSelectorProps) {
  const [selectedAvatar, setSelectedAvatar] = React.useState<string | null>(currentAvatar || null)

  const availableAvatars = [
    { id: "male", src: DEFAULT_AVATARS.male, label: "Male" },
    { id: "female", src: DEFAULT_AVATARS.female, label: "Female" },
    { id: "neutral", src: DEFAULT_AVATARS.neutral, label: "Neutral" },
  ]

  const handleSelect = (avatarSrc: string) => {
    setSelectedAvatar(avatarSrc)
    onSelect(avatarSrc)
  }

  return (
    <div className={cn("space-y-4", className)}>
      <p className="text-sm text-muted-foreground">Choose a default avatar or upload your own</p>
      <div className="flex flex-wrap gap-4">
        {availableAvatars.map((avatar) => (
          <button
            key={avatar.id}
            type="button"
            onClick={() => handleSelect(avatar.src)}
            className={cn(
              "relative rounded-full p-1 transition-all duration-200",
              selectedAvatar === avatar.src
                ? "ring-2 ring-primary ring-offset-2 ring-offset-background"
                : "hover:ring-2 hover:ring-muted-foreground/50 hover:ring-offset-2 hover:ring-offset-background"
            )}
          >
            <div className="relative h-16 w-16 overflow-hidden rounded-full">
              <Image
                src={avatar.src || "/placeholder.svg"}
                alt={avatar.label}
                fill
                className="object-cover"
              />
            </div>
            {selectedAvatar === avatar.src && (
              <span className="absolute -bottom-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-primary-foreground">
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="3"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="h-3 w-3"
                >
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              </span>
            )}
          </button>
        ))}
      </div>
    </div>
  )
}

// Export default avatars for use elsewhere
export { DEFAULT_AVATARS }
