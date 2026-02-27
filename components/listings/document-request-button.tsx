"use client"

import React from "react"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
  FileText,
  FileCheck,
  Shield,
  X,
  CheckCircle2,
  AlertCircle,
  Car,
  Home,
  FileSpreadsheet,
  ClipboardCheck,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Checkbox } from "@/components/ui/checkbox"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { cn } from "@/lib/utils"
import { toast } from "@/hooks/use-toast"
import { useAuth } from "@/contexts/auth-context"

interface DocumentType {
  type: string
  name: string
  description: string
  icon: React.ComponentType<{ className?: string }>
}

const DOCUMENT_TYPES: DocumentType[] = [
  {
    type: "ownership_proof",
    name: "Proof of Ownership",
    description: "Documents proving legal ownership",
    icon: FileCheck,
  },
  {
    type: "title_deed",
    name: "Title Deed",
    description: "Official property registration",
    icon: Home,
  },
  {
    type: "registration",
    name: "Registration Documents",
    description: "Vehicle/livestock registration",
    icon: Car,
  },
  {
    type: "valuation",
    name: "Valuation Certificate",
    description: "Professional appraisal",
    icon: FileSpreadsheet,
  },
  {
    type: "inspection",
    name: "Inspection Report",
    description: "Recent condition report",
    icon: ClipboardCheck,
  },
  {
    type: "other",
    name: "Other Documents",
    description: "Any other verification docs",
    icon: FileText,
  },
]

interface DocumentRequestButtonProps {
  listingId: string
  listingTitle: string
  sellerId: string
  isHighValue: boolean
  hasDocuments?: boolean
  documentsVerified?: boolean
  className?: string
}

export function DocumentRequestButton({
  listingId,
  listingTitle,
  sellerId,
  isHighValue,
  hasDocuments = false,
  documentsVerified = false,
  className,
}: DocumentRequestButtonProps) {
  const { user } = useAuth()
  const [isOpen, setIsOpen] = useState(false)
  const [selectedTypes, setSelectedTypes] = useState<string[]>([])
  const [message, setMessage] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [requestStatus, setRequestStatus] = useState<"idle" | "success" | "error">("idle")

  // Don't show button if user is the seller
  if (user?.id === sellerId) return null

  // Don't show if not high value
  if (!isHighValue) return null

  const handleToggleType = (type: string) => {
    setSelectedTypes((prev) =>
      prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type]
    )
  }

  const handleSubmit = async () => {
    if (selectedTypes.length === 0) {
      toast({ title: "Please select at least one document type", variant: "destructive" })
      return
    }

    setIsLoading(true)
    try {
      const response = await fetch(`/api/listings/${listingId}/documents`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          documentTypes: selectedTypes,
          message: message.trim() || null,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to submit request")
      }

      setRequestStatus("success")
      toast({ title: "Document request sent!", description: "The seller has been notified." })
      
      // Close dialog after delay
      setTimeout(() => {
        setIsOpen(false)
        setRequestStatus("idle")
        setSelectedTypes([])
        setMessage("")
      }, 2000)
    } catch (error) {
      setRequestStatus("error")
      toast({
        title: "Failed to send request",
        description: error instanceof Error ? error.message : "Please try again",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  // If documents are already verified, show a trust badge instead
  if (documentsVerified) {
    return (
      <div className={cn("flex items-center gap-2", className)}>
        <Badge className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20 gap-1.5 py-1.5 px-3">
          <Shield className="h-4 w-4" />
          Documents Verified
        </Badge>
      </div>
    )
  }

  return (
    <>
      <Button
        variant="outline"
        onClick={() => setIsOpen(true)}
        className={cn(
          "gap-2 border-amber-500/30 text-amber-600 hover:bg-amber-500/10 hover:border-amber-500/50",
          className
        )}
      >
        <FileText className="h-4 w-4" />
        Request Documents
      </Button>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-primary" />
              Request Verification Documents
            </DialogTitle>
            <DialogDescription>
              For high-value items, you can request the seller to provide verification documents before trading.
            </DialogDescription>
          </DialogHeader>

          <AnimatePresence mode="wait">
            {requestStatus === "success" ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="py-8 text-center"
              >
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-emerald-500/10 flex items-center justify-center">
                  <CheckCircle2 className="h-8 w-8 text-emerald-500" />
                </div>
                <h3 className="text-lg font-semibold text-foreground">Request Sent!</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  The seller will be notified and can respond within 14 days.
                </p>
              </motion.div>
            ) : (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="space-y-4"
              >
                <div className="bg-muted/50 rounded-lg p-3">
                  <p className="text-sm text-muted-foreground">
                    <strong className="text-foreground">Listing:</strong> {listingTitle}
                  </p>
                </div>

                <div className="space-y-3">
                  <Label className="text-sm font-medium">Select documents to request:</Label>
                  <div className="grid gap-2">
                    {DOCUMENT_TYPES.map((docType) => {
                      const Icon = docType.icon
                      const isSelected = selectedTypes.includes(docType.type)
                      
                      return (
                        <motion.div
                          key={docType.type}
                          whileHover={{ scale: 1.01 }}
                          whileTap={{ scale: 0.99 }}
                          onClick={() => handleToggleType(docType.type)}
                          className={cn(
                            "flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all",
                            isSelected
                              ? "border-primary bg-primary/5"
                              : "border-border hover:border-primary/50"
                          )}
                        >
                          <Checkbox
                            checked={isSelected}
                            onCheckedChange={() => handleToggleType(docType.type)}
                            className="pointer-events-none"
                          />
                          <div className={cn(
                            "w-8 h-8 rounded-lg flex items-center justify-center",
                            isSelected ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"
                          )}>
                            <Icon className="h-4 w-4" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-foreground">{docType.name}</p>
                            <p className="text-xs text-muted-foreground truncate">{docType.description}</p>
                          </div>
                        </motion.div>
                      )
                    })}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="message" className="text-sm font-medium">
                    Message to seller (optional)
                  </Label>
                  <Textarea
                    id="message"
                    placeholder="Add any specific requirements or questions..."
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    className="resize-none"
                    rows={3}
                  />
                </div>

                <div className="flex items-center gap-2 p-3 rounded-lg bg-amber-500/10 border border-amber-500/20">
                  <AlertCircle className="h-4 w-4 text-amber-600 flex-shrink-0" />
                  <p className="text-xs text-amber-700">
                    The seller has 14 days to respond. You will be notified when documents are uploaded.
                  </p>
                </div>

                <div className="flex gap-2 pt-2">
                  <Button
                    variant="outline"
                    onClick={() => setIsOpen(false)}
                    className="flex-1"
                    disabled={isLoading}
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleSubmit}
                    className="flex-1"
                    disabled={isLoading || selectedTypes.length === 0}
                  >
                    {isLoading ? (
                      <span className="flex items-center gap-2">
                        <motion.div
                          animate={{ rotate: 360 }}
                          transition={{ duration: 1, repeat: Number.POSITIVE_INFINITY, ease: "linear" }}
                          className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full"
                        />
                        Sending...
                      </span>
                    ) : (
                      "Send Request"
                    )}
                  </Button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </DialogContent>
      </Dialog>
    </>
  )
}
