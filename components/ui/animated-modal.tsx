"use client"

import type React from "react"
import { useEffect, useCallback, useRef } from "react"
import { motion, AnimatePresence, type Variants } from "framer-motion"
import { X } from "lucide-react"
import { cn } from "@/lib/utils"

interface AnimatedModalProps {
  isOpen: boolean
  onClose: () => void
  children: React.ReactNode
  title?: string
  subtitle?: string
  size?: "sm" | "md" | "lg" | "xl" | "full"
  showCloseButton?: boolean
  closeOnBackdrop?: boolean
  closeOnEscape?: boolean
  className?: string
  overlayClassName?: string
  icon?: React.ReactNode
}

const backdropVariants: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 },
}

const modalVariants: Variants = {
  hidden: {
    opacity: 0,
    scale: 0.8,
    y: 20,
  },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: {
      type: "spring",
      stiffness: 300,
      damping: 25,
    },
  },
  exit: {
    opacity: 0,
    scale: 0.9,
    y: 10,
    transition: {
      duration: 0.15,
    },
  },
}

const sizeClasses = {
  sm: "max-w-sm",
  md: "max-w-md",
  lg: "max-w-lg",
  xl: "max-w-xl",
  full: "max-w-4xl",
}

export function AnimatedModal({
  isOpen,
  onClose,
  children,
  title,
  subtitle,
  size = "md",
  showCloseButton = true,
  closeOnBackdrop = true,
  closeOnEscape = true,
  className,
  overlayClassName,
  icon,
}: AnimatedModalProps) {
  const modalRef = useRef<HTMLDivElement>(null)

  const handleEscape = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Escape" && closeOnEscape) {
        onClose()
      }
    },
    [onClose, closeOnEscape],
  )

  useEffect(() => {
    if (isOpen) {
      document.addEventListener("keydown", handleEscape)
      document.body.style.overflow = "hidden"
    }

    return () => {
      document.removeEventListener("keydown", handleEscape)
      document.body.style.overflow = ""
    }
  }, [isOpen, handleEscape])

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (closeOnBackdrop && e.target === e.currentTarget) {
      onClose()
    }
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className={cn(
            "fixed inset-0 z-50 flex items-center justify-center p-4",
            "bg-black/60 backdrop-blur-sm",
            overlayClassName,
          )}
          variants={backdropVariants}
          initial="hidden"
          animate="visible"
          exit="hidden"
          onClick={handleBackdropClick}
        >
          <motion.div
            ref={modalRef}
            className={cn(
              "relative w-full bg-card rounded-2xl shadow-2xl",
              "border border-border overflow-hidden",
              sizeClasses[size],
              className,
            )}
            variants={modalVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            role="dialog"
            aria-modal="true"
            aria-labelledby={title ? "modal-title" : undefined}
          >
            {/* Header */}
            {(title || showCloseButton) && (
              <div className="flex items-start justify-between p-6 pb-0">
                <div className="flex items-center gap-3">
                  {icon && (
                    <motion.div
                      initial={{ scale: 0, rotate: -180 }}
                      animate={{ scale: 1, rotate: 0 }}
                      transition={{ type: "spring", stiffness: 200, damping: 15, delay: 0.1 }}
                      className="p-2 rounded-xl bg-primary/10"
                    >
                      {icon}
                    </motion.div>
                  )}
                  {title && (
                    <div>
                      <motion.h2
                        id="modal-title"
                        className="text-xl font-semibold text-foreground"
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.1 }}
                      >
                        {title}
                      </motion.h2>
                      {subtitle && (
                        <motion.p
                          className="text-sm text-muted-foreground mt-0.5"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ delay: 0.15 }}
                        >
                          {subtitle}
                        </motion.p>
                      )}
                    </div>
                  )}
                </div>
                {showCloseButton && (
                  <motion.button
                    className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                    onClick={onClose}
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.2 }}
                  >
                    <X className="w-5 h-5" />
                  </motion.button>
                )}
              </div>
            )}

            {/* Content */}
            <motion.div
              className="p-6"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
            >
              {children}
            </motion.div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

// Success/Error state modal
interface ResultModalProps {
  isOpen: boolean
  onClose: () => void
  type: "success" | "error"
  title: string
  message?: string
  action?: {
    label: string
    onClick: () => void
  }
}

export function ResultModal({ isOpen, onClose, type, title, message, action }: ResultModalProps) {
  return (
    <AnimatedModal isOpen={isOpen} onClose={onClose} size="sm" showCloseButton={false}>
      <div className="text-center py-4">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", stiffness: 200, damping: 15 }}
          className={cn(
            "w-20 h-20 rounded-full mx-auto flex items-center justify-center",
            type === "success" ? "bg-green-500/20" : "bg-red-500/20",
          )}
        >
          {type === "success" ? (
            <motion.svg
              className="w-10 h-10 text-green-500"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={3}
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              <motion.path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round" />
            </motion.svg>
          ) : (
            <motion.svg
              className="w-10 h-10 text-red-500"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={3}
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              <motion.path d="M6 18L18 6M6 6l12 12" strokeLinecap="round" strokeLinejoin="round" />
            </motion.svg>
          )}
        </motion.div>

        <motion.h3
          className="text-xl font-semibold mt-4"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          {title}
        </motion.h3>

        {message && (
          <motion.p
            className="text-muted-foreground mt-2"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
          >
            {message}
          </motion.p>
        )}

        <motion.div
          className="mt-6 flex gap-3 justify-center"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          {action && (
            <button
              onClick={action.onClick}
              className={cn(
                "px-6 py-2.5 rounded-xl font-medium transition-all",
                type === "success"
                  ? "bg-green-500 hover:bg-green-600 text-white"
                  : "bg-red-500 hover:bg-red-600 text-white",
              )}
            >
              {action.label}
            </button>
          )}
          <button
            onClick={onClose}
            className="px-6 py-2.5 rounded-xl font-medium bg-muted hover:bg-muted/80 transition-all"
          >
            Close
          </button>
        </motion.div>
      </div>
    </AnimatedModal>
  )
}
