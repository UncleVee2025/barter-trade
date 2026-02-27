"use client"

import * as React from "react"
import { X } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
  DrawerFooter,
  DrawerClose,
} from "@/components/ui/drawer"
import { useIsMobile } from "@/hooks/use-mobile"
import { cn } from "@/lib/utils"

interface ResponsiveModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  description?: string
  children: React.ReactNode
  footer?: React.ReactNode
  className?: string
  maxWidth?: "sm" | "md" | "lg" | "xl" | "2xl" | "3xl" | "4xl"
}

const maxWidthClasses = {
  sm: "sm:max-w-sm",
  md: "sm:max-w-md",
  lg: "sm:max-w-lg",
  xl: "sm:max-w-xl",
  "2xl": "sm:max-w-2xl",
  "3xl": "sm:max-w-3xl",
  "4xl": "sm:max-w-4xl",
}

export function ResponsiveModal({
  open,
  onOpenChange,
  title,
  description,
  children,
  footer,
  className,
  maxWidth = "md",
}: ResponsiveModalProps) {
  const isMobile = useIsMobile()

  // Mobile: Use Drawer
  if (isMobile) {
    return (
      <Drawer open={open} onOpenChange={onOpenChange}>
        <DrawerContent className={cn("max-h-[90vh]", className)}>
          <DrawerHeader className="border-b border-border/50 pb-3">
            <div className="flex items-center justify-between">
              <div>
                <DrawerTitle>{title}</DrawerTitle>
                {description && (
                  <DrawerDescription className="mt-1">{description}</DrawerDescription>
                )}
              </div>
              <DrawerClose asChild>
                <button className="p-2 rounded-lg hover:bg-muted text-muted-foreground transition-colors">
                  <X className="h-5 w-5" />
                  <span className="sr-only">Close</span>
                </button>
              </DrawerClose>
            </div>
          </DrawerHeader>
          <div className="flex-1 overflow-y-auto px-4 py-4">
            {children}
          </div>
          {footer && (
            <DrawerFooter className="border-t border-border/50 pt-4">
              {footer}
            </DrawerFooter>
          )}
        </DrawerContent>
      </Drawer>
    )
  }

  // Desktop: Use Dialog
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={cn(maxWidthClasses[maxWidth], className)}>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          {description && <DialogDescription>{description}</DialogDescription>}
        </DialogHeader>
        <div className="py-4">
          {children}
        </div>
        {footer && (
          <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2 pt-4 border-t border-border/50">
            {footer}
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}

// Simple variant without header/footer for full control
export function ResponsiveModalSimple({
  open,
  onOpenChange,
  children,
  className,
  maxWidth = "md",
}: Omit<ResponsiveModalProps, "title" | "description" | "footer">) {
  const isMobile = useIsMobile()

  if (isMobile) {
    return (
      <Drawer open={open} onOpenChange={onOpenChange}>
        <DrawerContent className={cn("max-h-[92vh] overflow-hidden", className)}>
          <div className="w-12 h-1.5 bg-muted-foreground/30 rounded-full mx-auto mt-3 mb-2" />
          {children}
        </DrawerContent>
      </Drawer>
    )
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={cn("p-0 gap-0 overflow-hidden", maxWidthClasses[maxWidth], className)}>
        {children}
      </DialogContent>
    </Dialog>
  )
}
