"use client"

import { motion, type SVGMotionProps } from "framer-motion"
import { cn } from "@/lib/utils"

interface IconProps extends Omit<SVGMotionProps<SVGSVGElement>, "ref"> {
  className?: string
  animated?: boolean
}

// Modern 3D-style Package/Listing Icon
export function PackageIcon({ className, animated = true, ...props }: IconProps) {
  return (
    <motion.svg
      viewBox="0 0 24 24"
      fill="none"
      strokeWidth={1.5}
      stroke="currentColor"
      className={cn("w-6 h-6", className)}
      whileHover={animated ? { scale: 1.05, rotate: 5 } : undefined}
      {...props}
    >
      <defs>
        <linearGradient id="packageGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="currentColor" stopOpacity="1" />
          <stop offset="100%" stopColor="currentColor" stopOpacity="0.6" />
        </linearGradient>
      </defs>
      <motion.path
        d="M16.5 9.4l-9-5.19M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z"
        strokeLinecap="round"
        strokeLinejoin="round"
        initial={animated ? { pathLength: 0 } : { pathLength: 1 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 0.6 }}
      />
      <motion.polyline
        points="3.27 6.96 12 12.01 20.73 6.96"
        strokeLinecap="round"
        strokeLinejoin="round"
        initial={animated ? { opacity: 0 } : { opacity: 1 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
      />
      <motion.line
        x1="12"
        y1="22.08"
        x2="12"
        y2="12"
        strokeLinecap="round"
        strokeLinejoin="round"
        initial={animated ? { pathLength: 0 } : { pathLength: 1 }}
        animate={{ pathLength: 1 }}
        transition={{ delay: 0.4, duration: 0.3 }}
      />
    </motion.svg>
  )
}

// Modern Success/Trade Icon with handshake feel
export function TradeSuccessIcon({ className, animated = true, ...props }: IconProps) {
  return (
    <motion.svg
      viewBox="0 0 24 24"
      fill="none"
      strokeWidth={1.5}
      stroke="currentColor"
      className={cn("w-6 h-6", className)}
      whileHover={animated ? { scale: 1.1 } : undefined}
      {...props}
    >
      <motion.path
        d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
        strokeLinecap="round"
        strokeLinejoin="round"
        initial={animated ? { pathLength: 0 } : { pathLength: 1 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 0.8 }}
      />
      <motion.path
        d="M9 12l2 2 4-4"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        initial={animated ? { pathLength: 0, opacity: 0 } : { pathLength: 1, opacity: 1 }}
        animate={{ pathLength: 1, opacity: 1 }}
        transition={{ delay: 0.5, duration: 0.3 }}
      />
    </motion.svg>
  )
}

// Modern Eye/Views Icon with glow effect
export function ViewsIcon({ className, animated = true, ...props }: IconProps) {
  return (
    <motion.svg
      viewBox="0 0 24 24"
      fill="none"
      strokeWidth={1.5}
      stroke="currentColor"
      className={cn("w-6 h-6", className)}
      whileHover={animated ? { scale: 1.1 } : undefined}
      {...props}
    >
      <motion.path
        d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"
        strokeLinecap="round"
        strokeLinejoin="round"
        initial={animated ? { pathLength: 0 } : { pathLength: 1 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 0.6 }}
      />
      <motion.circle
        cx="12"
        cy="12"
        r="3"
        strokeLinecap="round"
        strokeLinejoin="round"
        initial={animated ? { scale: 0 } : { scale: 1 }}
        animate={{ scale: 1 }}
        transition={{ delay: 0.3, type: "spring", stiffness: 300 }}
      />
      <motion.circle
        cx="12"
        cy="12"
        r="1"
        fill="currentColor"
        initial={animated ? { scale: 0 } : { scale: 1 }}
        animate={{ scale: [1, 1.2, 1] }}
        transition={{ delay: 0.5, duration: 1.5, repeat: Infinity }}
      />
    </motion.svg>
  )
}

// Modern Trophy/Success Rate Icon
export function TrophyIcon({ className, animated = true, ...props }: IconProps) {
  return (
    <motion.svg
      viewBox="0 0 24 24"
      fill="none"
      strokeWidth={1.5}
      stroke="currentColor"
      className={cn("w-6 h-6", className)}
      whileHover={animated ? { scale: 1.05, y: -2 } : undefined}
      {...props}
    >
      <motion.path
        d="M6 9H4.5a2.5 2.5 0 010-5H6M18 9h1.5a2.5 2.5 0 000-5H18"
        strokeLinecap="round"
        strokeLinejoin="round"
        initial={animated ? { opacity: 0, x: -5 } : { opacity: 1, x: 0 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.2 }}
      />
      <motion.path
        d="M4 4h16v7a6 6 0 01-6 6h-4a6 6 0 01-6-6V4z"
        strokeLinecap="round"
        strokeLinejoin="round"
        initial={animated ? { pathLength: 0 } : { pathLength: 1 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 0.6 }}
      />
      <motion.path
        d="M12 17v3M8 20h8"
        strokeLinecap="round"
        strokeLinejoin="round"
        initial={animated ? { opacity: 0, y: 5 } : { opacity: 1, y: 0 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
      />
      <motion.path
        d="M9 9l2 2 4-4"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        initial={animated ? { pathLength: 0 } : { pathLength: 1 }}
        animate={{ pathLength: 1 }}
        transition={{ delay: 0.5, duration: 0.3 }}
      />
    </motion.svg>
  )
}

// Wallet Icon with card animation
export function WalletIcon({ className, animated = true, ...props }: IconProps) {
  return (
    <motion.svg
      viewBox="0 0 24 24"
      fill="none"
      strokeWidth={1.5}
      stroke="currentColor"
      className={cn("w-6 h-6", className)}
      whileHover={animated ? { scale: 1.05 } : undefined}
      {...props}
    >
      <motion.path
        d="M21 12V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2h14a2 2 0 002-2v-5z"
        strokeLinecap="round"
        strokeLinejoin="round"
        initial={animated ? { pathLength: 0 } : { pathLength: 1 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 0.8, ease: "easeInOut" }}
      />
      <motion.path
        d="M16 12h5v4h-5a2 2 0 110-4z"
        strokeLinecap="round"
        strokeLinejoin="round"
        initial={animated ? { pathLength: 0, opacity: 0 } : { pathLength: 1, opacity: 1 }}
        animate={{ pathLength: 1, opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.4 }}
      />
      <motion.circle
        cx="17"
        cy="14"
        r="1"
        fill="currentColor"
        initial={animated ? { scale: 0 } : { scale: 1 }}
        animate={{ scale: 1 }}
        transition={{ delay: 0.7, type: "spring", stiffness: 300 }}
      />
    </motion.svg>
  )
}

// Modern Fire/Trending Icon
export function FlameIcon({ className, animated = true, ...props }: IconProps) {
  return (
    <motion.svg
      viewBox="0 0 24 24"
      fill="none"
      strokeWidth={1.5}
      stroke="currentColor"
      className={cn("w-6 h-6", className)}
      whileHover={animated ? { scale: 1.1 } : undefined}
      {...props}
    >
      <motion.path
        d="M12 22c4.97 0 9-4.03 9-9 0-4.97-4.03-9-9-9-1.5 0-3 1.5-3 3 0 1.5 1.5 3 3 3-4.97 0-9 4.03-9 9 0 4.97 4.03 6 6 6"
        strokeLinecap="round"
        strokeLinejoin="round"
        initial={animated ? { pathLength: 0 } : { pathLength: 1 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 0.8 }}
      />
      <motion.path
        d="M12 16c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2z"
        fill="currentColor"
        initial={animated ? { scale: 0 } : { scale: 1 }}
        animate={{ scale: [1, 1.15, 1] }}
        transition={{ delay: 0.5, duration: 1.5, repeat: Infinity }}
      />
    </motion.svg>
  )
}

// Modern Grid/Category Icon
export function GridIcon({ className, animated = true, ...props }: IconProps) {
  return (
    <motion.svg
      viewBox="0 0 24 24"
      fill="none"
      strokeWidth={1.5}
      stroke="currentColor"
      className={cn("w-6 h-6", className)}
      whileHover={animated ? { scale: 1.05 } : undefined}
      {...props}
    >
      <motion.rect
        x="3"
        y="3"
        width="7"
        height="7"
        rx="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        initial={animated ? { scale: 0, opacity: 0 } : { scale: 1, opacity: 1 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.3 }}
      />
      <motion.rect
        x="14"
        y="3"
        width="7"
        height="7"
        rx="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        initial={animated ? { scale: 0, opacity: 0 } : { scale: 1, opacity: 1 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.1, duration: 0.3 }}
      />
      <motion.rect
        x="3"
        y="14"
        width="7"
        height="7"
        rx="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        initial={animated ? { scale: 0, opacity: 0 } : { scale: 1, opacity: 1 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.2, duration: 0.3 }}
      />
      <motion.rect
        x="14"
        y="14"
        width="7"
        height="7"
        rx="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        initial={animated ? { scale: 0, opacity: 0 } : { scale: 1, opacity: 1 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.3, duration: 0.3 }}
      />
    </motion.svg>
  )
}

// Modern Clock/Activity Icon  
export function ActivityIcon({ className, animated = true, ...props }: IconProps) {
  return (
    <motion.svg
      viewBox="0 0 24 24"
      fill="none"
      strokeWidth={1.5}
      stroke="currentColor"
      className={cn("w-6 h-6", className)}
      whileHover={animated ? { scale: 1.05 } : undefined}
      {...props}
    >
      <motion.path
        d="M22 12h-4l-3 9L9 3l-3 9H2"
        strokeLinecap="round"
        strokeLinejoin="round"
        initial={animated ? { pathLength: 0 } : { pathLength: 1 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 0.8 }}
      />
    </motion.svg>
  )
}

// Modern Sparkle/Premium Icon
export function SparkleIcon({ className, animated = true, ...props }: IconProps) {
  return (
    <motion.svg
      viewBox="0 0 24 24"
      fill="none"
      strokeWidth={1.5}
      stroke="currentColor"
      className={cn("w-6 h-6", className)}
      whileHover={animated ? { scale: 1.1, rotate: 15 } : undefined}
      {...props}
    >
      <motion.path
        d="M12 3l1.5 5.5L19 10l-5.5 1.5L12 17l-1.5-5.5L5 10l5.5-1.5L12 3z"
        strokeLinecap="round"
        strokeLinejoin="round"
        initial={animated ? { scale: 0, rotate: -180 } : { scale: 1, rotate: 0 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ type: "spring", stiffness: 200 }}
      />
      <motion.path
        d="M19 18l.5 1.5 1.5.5-1.5.5-.5 1.5-.5-1.5-1.5-.5 1.5-.5.5-1.5z"
        strokeLinecap="round"
        strokeLinejoin="round"
        initial={animated ? { scale: 0 } : { scale: 1 }}
        animate={{ scale: [1, 1.2, 1] }}
        transition={{ delay: 0.3, duration: 2, repeat: Infinity }}
      />
      <motion.path
        d="M5 5l.5 1.5 1.5.5-1.5.5L5 9l-.5-1.5L3 7l1.5-.5L5 5z"
        strokeLinecap="round"
        strokeLinejoin="round"
        initial={animated ? { scale: 0 } : { scale: 1 }}
        animate={{ scale: [1, 1.2, 1] }}
        transition={{ delay: 0.6, duration: 2, repeat: Infinity }}
      />
    </motion.svg>
  )
}

// Modern Arrow Right Icon
export function ArrowRightIcon({ className, animated = true, ...props }: IconProps) {
  return (
    <motion.svg
      viewBox="0 0 24 24"
      fill="none"
      strokeWidth={2}
      stroke="currentColor"
      className={cn("w-6 h-6", className)}
      {...props}
    >
      <motion.path
        d="M5 12h14M12 5l7 7-7 7"
        strokeLinecap="round"
        strokeLinejoin="round"
        initial={animated ? { x: -5, opacity: 0 } : { x: 0, opacity: 1 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ duration: 0.3 }}
      />
    </motion.svg>
  )
}

// Modern Heart Icon
export function HeartIcon({ className, animated = true, filled = false, ...props }: IconProps & { filled?: boolean }) {
  return (
    <motion.svg
      viewBox="0 0 24 24"
      fill={filled ? "currentColor" : "none"}
      strokeWidth={1.5}
      stroke="currentColor"
      className={cn("w-6 h-6", className)}
      whileHover={animated ? { scale: 1.2 } : undefined}
      whileTap={animated ? { scale: 0.9 } : undefined}
      {...props}
    >
      <motion.path
        d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"
        strokeLinecap="round"
        strokeLinejoin="round"
        initial={animated ? { scale: 0.8 } : { scale: 1 }}
        animate={{ scale: 1 }}
        transition={{ type: "spring", stiffness: 300 }}
      />
    </motion.svg>
  )
}

// Modern Message Icon
export function MessageIcon({ className, animated = true, badge = 0, ...props }: IconProps & { badge?: number }) {
  return (
    <motion.svg
      viewBox="0 0 24 24"
      fill="none"
      strokeWidth={1.5}
      stroke="currentColor"
      className={cn("w-6 h-6", className)}
      whileHover={animated ? { scale: 1.05 } : undefined}
      {...props}
    >
      <motion.path
        d="M21 11.5a8.38 8.38 0 01-.9 3.8 8.5 8.5 0 01-7.6 4.7 8.38 8.38 0 01-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 01-.9-3.8 8.5 8.5 0 014.7-7.6 8.38 8.38 0 013.8-.9h.5a8.48 8.48 0 018 8v.5z"
        strokeLinecap="round"
        strokeLinejoin="round"
        initial={animated ? { pathLength: 0 } : { pathLength: 1 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 0.6 }}
      />
      {badge > 0 && (
        <motion.circle
          cx="18"
          cy="6"
          r="4"
          fill="#ef4444"
          stroke="none"
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", stiffness: 300 }}
        />
      )}
    </motion.svg>
  )
}

// Modern Verified Badge Icon
export function VerifiedIcon({ className, animated = true, ...props }: IconProps) {
  return (
    <motion.svg
      viewBox="0 0 24 24"
      fill="none"
      strokeWidth={1.5}
      stroke="currentColor"
      className={cn("w-6 h-6", className)}
      {...props}
    >
      <motion.path
        d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"
        strokeLinecap="round"
        strokeLinejoin="round"
        initial={animated ? { pathLength: 0 } : { pathLength: 1 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 0.8 }}
      />
      <motion.path
        d="M9 12l2 2 4-4"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        initial={animated ? { pathLength: 0, opacity: 0 } : { pathLength: 1, opacity: 1 }}
        animate={{ pathLength: 1, opacity: 1 }}
        transition={{ duration: 0.4, delay: 0.6 }}
      />
    </motion.svg>
  )
}

// Trade/Exchange Icon
export function TradeIcon({ className, animated = true, ...props }: IconProps) {
  return (
    <motion.svg
      viewBox="0 0 24 24"
      fill="none"
      strokeWidth={1.5}
      stroke="currentColor"
      className={cn("w-6 h-6", className)}
      {...props}
    >
      <motion.path
        d="M7 16l-4-4m0 0l4-4m-4 4h18"
        strokeLinecap="round"
        strokeLinejoin="round"
        initial={animated ? { x: -10, opacity: 0 } : { x: 0, opacity: 1 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ duration: 0.5 }}
      />
      <motion.path
        d="M17 8l4 4m0 0l-4 4m4-4H3"
        strokeLinecap="round"
        strokeLinejoin="round"
        initial={animated ? { x: 10, opacity: 0 } : { x: 0, opacity: 1 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.2 }}
      />
    </motion.svg>
  )
}

// Shield/Security Icon
export function ShieldIcon({ className, animated = true, ...props }: IconProps) {
  return (
    <motion.svg
      viewBox="0 0 24 24"
      fill="none"
      strokeWidth={1.5}
      stroke="currentColor"
      className={cn("w-6 h-6", className)}
      {...props}
    >
      <motion.path
        d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"
        strokeLinecap="round"
        strokeLinejoin="round"
        initial={animated ? { pathLength: 0 } : { pathLength: 1 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 0.8 }}
      />
      <motion.path
        d="M9 12l2 2 4-4"
        strokeLinecap="round"
        strokeLinejoin="round"
        initial={animated ? { pathLength: 0, opacity: 0 } : { pathLength: 1, opacity: 1 }}
        animate={{ pathLength: 1, opacity: 1 }}
        transition={{ duration: 0.4, delay: 0.6 }}
      />
    </motion.svg>
  )
}

// Lightning/Fast Icon
export function LightningIcon({ className, animated = true, ...props }: IconProps) {
  return (
    <motion.svg
      viewBox="0 0 24 24"
      fill="none"
      strokeWidth={1.5}
      stroke="currentColor"
      className={cn("w-6 h-6", className)}
      {...props}
    >
      <motion.path
        d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"
        strokeLinecap="round"
        strokeLinejoin="round"
        initial={animated ? { pathLength: 0, opacity: 0 } : { pathLength: 1, opacity: 1 }}
        animate={{ pathLength: 1, opacity: 1 }}
        transition={{ duration: 0.6 }}
      />
    </motion.svg>
  )
}

// Globe/Network Icon
export function GlobeIcon({ className, animated = true, ...props }: IconProps) {
  return (
    <motion.svg
      viewBox="0 0 24 24"
      fill="none"
      strokeWidth={1.5}
      stroke="currentColor"
      className={cn("w-6 h-6", className)}
      {...props}
    >
      <motion.circle
        cx="12"
        cy="12"
        r="10"
        strokeLinecap="round"
        strokeLinejoin="round"
        initial={animated ? { pathLength: 0 } : { pathLength: 1 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 0.8 }}
      />
      <motion.path
        d="M2 12h20M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z"
        strokeLinecap="round"
        strokeLinejoin="round"
        initial={animated ? { pathLength: 0, opacity: 0 } : { pathLength: 1, opacity: 1 }}
        animate={{ pathLength: 1, opacity: 1 }}
        transition={{ duration: 0.6, delay: 0.4 }}
      />
    </motion.svg>
  )
}

// Chart/Analytics Icon
export function ChartIcon({ className, animated = true, ...props }: IconProps) {
  return (
    <motion.svg
      viewBox="0 0 24 24"
      fill="none"
      strokeWidth={1.5}
      stroke="currentColor"
      className={cn("w-6 h-6", className)}
      {...props}
    >
      <motion.path
        d="M3 3v18h18"
        strokeLinecap="round"
        strokeLinejoin="round"
        initial={animated ? { pathLength: 0 } : { pathLength: 1 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 0.5 }}
      />
      <motion.path
        d="M18 17V9M13 17V5M8 17v-3"
        strokeLinecap="round"
        strokeLinejoin="round"
        initial={animated ? { scaleY: 0 } : { scaleY: 1 }}
        animate={{ scaleY: 1 }}
        transition={{ duration: 0.5, delay: 0.3 }}
        style={{ transformOrigin: "bottom" }}
      />
    </motion.svg>
  )
}

// User/Profile Icon
export function UserIcon({ className, animated = true, ...props }: IconProps) {
  return (
    <motion.svg
      viewBox="0 0 24 24"
      fill="none"
      strokeWidth={1.5}
      stroke="currentColor"
      className={cn("w-6 h-6", className)}
      {...props}
    >
      <motion.circle
        cx="12"
        cy="8"
        r="4"
        strokeLinecap="round"
        strokeLinejoin="round"
        initial={animated ? { scale: 0 } : { scale: 1 }}
        animate={{ scale: 1 }}
        transition={{ type: "spring", stiffness: 200, damping: 15 }}
      />
      <motion.path
        d="M20 21a8 8 0 10-16 0"
        strokeLinecap="round"
        strokeLinejoin="round"
        initial={animated ? { pathLength: 0 } : { pathLength: 1 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 0.5, delay: 0.3 }}
      />
    </motion.svg>
  )
}

// Bell/Notification Icon
export function BellIcon({
  className,
  animated = true,
  hasNotification = false,
  ...props
}: IconProps & { hasNotification?: boolean }) {
  return (
    <motion.svg
      viewBox="0 0 24 24"
      fill="none"
      strokeWidth={1.5}
      stroke="currentColor"
      className={cn("w-6 h-6", className)}
      {...props}
    >
      <motion.path
        d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 01-3.46 0"
        strokeLinecap="round"
        strokeLinejoin="round"
        initial={animated ? { pathLength: 0 } : { pathLength: 1 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 0.6 }}
      />
      {hasNotification && (
        <motion.circle
          cx="18"
          cy="6"
          r="3"
          fill="#ea580c"
          stroke="none"
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", stiffness: 300, damping: 15 }}
        />
      )}
    </motion.svg>
  )
}

// Send/Arrow Icon
export function SendIcon({ className, animated = true, ...props }: IconProps) {
  return (
    <motion.svg
      viewBox="0 0 24 24"
      fill="none"
      strokeWidth={1.5}
      stroke="currentColor"
      className={cn("w-6 h-6", className)}
      {...props}
    >
      <motion.path
        d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z"
        strokeLinecap="round"
        strokeLinejoin="round"
        initial={animated ? { pathLength: 0 } : { pathLength: 1 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 0.6 }}
      />
    </motion.svg>
  )
}

// Plus Icon
export function PlusIcon({ className, animated = true, ...props }: IconProps) {
  return (
    <motion.svg
      viewBox="0 0 24 24"
      fill="none"
      strokeWidth={2}
      stroke="currentColor"
      className={cn("w-6 h-6", className)}
      {...props}
    >
      <motion.path
        d="M12 5v14M5 12h14"
        strokeLinecap="round"
        strokeLinejoin="round"
        initial={animated ? { pathLength: 0 } : { pathLength: 1 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 0.4 }}
      />
    </motion.svg>
  )
}

// Animated Loading Spinner
export function LoadingSpinner({ className, ...props }: Omit<IconProps, "animated">) {
  return (
    <motion.svg
      viewBox="0 0 24 24"
      fill="none"
      strokeWidth={2}
      stroke="currentColor"
      className={cn("w-6 h-6", className)}
      animate={{ rotate: 360 }}
      transition={{ duration: 1, repeat: Number.POSITIVE_INFINITY, ease: "linear" }}
      {...props}
    >
      <circle cx="12" cy="12" r="10" strokeOpacity={0.25} />
      <path d="M12 2a10 10 0 019.95 9" strokeLinecap="round" />
    </motion.svg>
  )
}

// Category Icons - Modern Style
export function SmartphoneIcon({ className, animated = true, ...props }: IconProps) {
  return (
    <motion.svg viewBox="0 0 24 24" fill="none" strokeWidth={1.5} stroke="currentColor" className={cn("w-6 h-6", className)} {...props}>
      <motion.rect x="5" y="2" width="14" height="20" rx="2" ry="2" initial={animated ? { pathLength: 0 } : {}} animate={{ pathLength: 1 }} transition={{ duration: 0.5 }} />
      <motion.line x1="12" y1="18" x2="12.01" y2="18" strokeLinecap="round" initial={animated ? { opacity: 0 } : {}} animate={{ opacity: 1 }} transition={{ delay: 0.3 }} />
    </motion.svg>
  )
}

export function CarIcon({ className, animated = true, ...props }: IconProps) {
  return (
    <motion.svg viewBox="0 0 24 24" fill="none" strokeWidth={1.5} stroke="currentColor" className={cn("w-6 h-6", className)} {...props}>
      <motion.path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9L18 10l-2.9-5.8c-.2-.5-.7-.8-1.3-.8H10c-.5 0-1 .3-1.3.8L6 10l-2.5 1.1C2.7 11.3 2 12.1 2 13v3c0 .6.4 1 1 1h2" initial={animated ? { pathLength: 0 } : {}} animate={{ pathLength: 1 }} transition={{ duration: 0.6 }} />
      <motion.circle cx="7" cy="17" r="2" initial={animated ? { scale: 0 } : {}} animate={{ scale: 1 }} transition={{ delay: 0.4, type: "spring" }} />
      <motion.circle cx="17" cy="17" r="2" initial={animated ? { scale: 0 } : {}} animate={{ scale: 1 }} transition={{ delay: 0.5, type: "spring" }} />
    </motion.svg>
  )
}

export function HomeIcon({ className, animated = true, ...props }: IconProps) {
  return (
    <motion.svg viewBox="0 0 24 24" fill="none" strokeWidth={1.5} stroke="currentColor" className={cn("w-6 h-6", className)} {...props}>
      <motion.path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" initial={animated ? { pathLength: 0 } : {}} animate={{ pathLength: 1 }} transition={{ duration: 0.6 }} />
      <motion.polyline points="9 22 9 12 15 12 15 22" initial={animated ? { pathLength: 0 } : {}} animate={{ pathLength: 1 }} transition={{ delay: 0.3, duration: 0.4 }} />
    </motion.svg>
  )
}

export function ShirtIcon({ className, animated = true, ...props }: IconProps) {
  return (
    <motion.svg viewBox="0 0 24 24" fill="none" strokeWidth={1.5} stroke="currentColor" className={cn("w-6 h-6", className)} {...props}>
      <motion.path d="M20.38 3.46L16 2a4 4 0 01-8 0L3.62 3.46a2 2 0 00-1.34 2.23l.58 3.47a1 1 0 00.99.84H6v10c0 1.1.9 2 2 2h8a2 2 0 002-2V10h2.15a1 1 0 00.99-.84l.58-3.47a2 2 0 00-1.34-2.23z" initial={animated ? { pathLength: 0 } : {}} animate={{ pathLength: 1 }} transition={{ duration: 0.6 }} />
    </motion.svg>
  )
}

export function CowIcon({ className, animated = true, ...props }: IconProps) {
  return (
    <motion.svg viewBox="0 0 24 24" fill="none" strokeWidth={1.5} stroke="currentColor" className={cn("w-6 h-6", className)} {...props}>
      <motion.path d="M12 5c-4 0-8 3-8 7v5c0 1.1.9 2 2 2h12a2 2 0 002-2v-5c0-4-4-7-8-7z" initial={animated ? { pathLength: 0 } : {}} animate={{ pathLength: 1 }} transition={{ duration: 0.5 }} />
      <motion.path d="M4 8l-2-4h4L4 8zM20 8l2-4h-4l2 4z" initial={animated ? { pathLength: 0 } : {}} animate={{ pathLength: 1 }} transition={{ delay: 0.3, duration: 0.3 }} />
      <motion.circle cx="9" cy="11" r="1" fill="currentColor" initial={animated ? { scale: 0 } : {}} animate={{ scale: 1 }} transition={{ delay: 0.4 }} />
      <motion.circle cx="15" cy="11" r="1" fill="currentColor" initial={animated ? { scale: 0 } : {}} animate={{ scale: 1 }} transition={{ delay: 0.5 }} />
    </motion.svg>
  )
}

export function WrenchIcon({ className, animated = true, ...props }: IconProps) {
  return (
    <motion.svg viewBox="0 0 24 24" fill="none" strokeWidth={1.5} stroke="currentColor" className={cn("w-6 h-6", className)} {...props}>
      <motion.path d="M14.7 6.3a1 1 0 000 1.4l1.6 1.6a1 1 0 001.4 0l3.77-3.77a6 6 0 01-7.94 7.94l-6.91 6.91a2.12 2.12 0 01-3-3l6.91-6.91a6 6 0 017.94-7.94l-3.76 3.76z" initial={animated ? { pathLength: 0, rotate: -45 } : {}} animate={{ pathLength: 1, rotate: 0 }} transition={{ duration: 0.6 }} />
    </motion.svg>
  )
}

export function GemIcon({ className, animated = true, ...props }: IconProps) {
  return (
    <motion.svg viewBox="0 0 24 24" fill="none" strokeWidth={1.5} stroke="currentColor" className={cn("w-6 h-6", className)} {...props}>
      <motion.path d="M6 3h12l4 6-10 13L2 9z" initial={animated ? { pathLength: 0 } : {}} animate={{ pathLength: 1 }} transition={{ duration: 0.5 }} />
      <motion.path d="M2 9h20M12 22V9M6 3l6 6 6-6" initial={animated ? { pathLength: 0 } : {}} animate={{ pathLength: 1 }} transition={{ delay: 0.3, duration: 0.4 }} />
    </motion.svg>
  )
}

export function SofaIcon({ className, animated = true, ...props }: IconProps) {
  return (
    <motion.svg viewBox="0 0 24 24" fill="none" strokeWidth={1.5} stroke="currentColor" className={cn("w-6 h-6", className)} {...props}>
      <motion.path d="M20 9V6a2 2 0 00-2-2H6a2 2 0 00-2 2v3" initial={animated ? { pathLength: 0 } : {}} animate={{ pathLength: 1 }} transition={{ duration: 0.4 }} />
      <motion.path d="M2 11v5a2 2 0 002 2h16a2 2 0 002-2v-5a2 2 0 00-4 0v2H6v-2a2 2 0 00-4 0z" initial={animated ? { pathLength: 0 } : {}} animate={{ pathLength: 1 }} transition={{ delay: 0.2, duration: 0.5 }} />
      <motion.path d="M4 18v2M20 18v2" initial={animated ? { pathLength: 0 } : {}} animate={{ pathLength: 1 }} transition={{ delay: 0.5, duration: 0.2 }} />
    </motion.svg>
  )
}

export function WheatIcon({ className, animated = true, ...props }: IconProps) {
  return (
    <motion.svg viewBox="0 0 24 24" fill="none" strokeWidth={1.5} stroke="currentColor" className={cn("w-6 h-6", className)} {...props}>
      <motion.path d="M2 22L12 12M22 2L12 12" initial={animated ? { pathLength: 0 } : {}} animate={{ pathLength: 1 }} transition={{ duration: 0.4 }} />
      <motion.path d="M7 9l-5-5 5 3-3-5 5 5M17 15l5 5-5-3 3 5-5-5" initial={animated ? { pathLength: 0 } : {}} animate={{ pathLength: 1 }} transition={{ delay: 0.2, duration: 0.4 }} />
      <motion.path d="M9 11l-4 4 4-2-2 4 2-4M15 13l4-4-4 2 2-4-2 4" initial={animated ? { pathLength: 0 } : {}} animate={{ pathLength: 1 }} transition={{ delay: 0.4, duration: 0.3 }} />
    </motion.svg>
  )
}
