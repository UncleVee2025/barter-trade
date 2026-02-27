"use client"

import { useState, useEffect } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Loader2, Wallet, ArrowRightLeft, Package, CheckCircle2, AlertCircle, Plus, X, Info } from "lucide-react"
import { useWallet } from "@/contexts/wallet-context"
import { useAuth } from "@/contexts/auth-context"
import { toast } from "@/hooks/use-toast"
import { cn } from "@/lib/utils"
import Image from "next/image"

interface ListingData {
  id: string
  title: string
  value: number
  images?: string[]
  user?: { id: string; name: string }
  seller?: { id: string; name: string }
}

interface MakeOfferModalProps {
  open: boolean
  onClose: () => void
  listing?: ListingData | null
  onSubmit?: (offer: { walletAmount: number; tradeItems: string[]; message?: string }) => Promise<void>
}

export function MakeOfferModal({ open, onClose, listing, onSubmit }: MakeOfferModalProps) {
  const { user } = useAuth()
  const { balance } = useWallet()
  const [walletAmount, setWalletAmount] = useState("")
  const [tradeItems, setTradeItems] = useState<string[]>([])
  const [newTradeItem, setNewTradeItem] = useState("")
  const [message, setMessage] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [offerType, setOfferType] = useState<"wallet" | "trade" | "mixed">("mixed")
  const [showSuccess, setShowSuccess] = useState(false)

  // Reset form when modal opens
  useEffect(() => {
    if (open) {
      setWalletAmount("")
      setTradeItems([])
      setNewTradeItem("")
      setMessage("")
      setOfferType("mixed")
      setShowSuccess(false)
    }
  }, [open])

  const parsedAmount = Number.parseFloat(walletAmount) || 0
  const hasEnoughBalance = parsedAmount <= balance
  const hasValidOffer = (parsedAmount > 0 && hasEnoughBalance) || tradeItems.length > 0

  const addTradeItem = () => {
    if (newTradeItem.trim() && tradeItems.length < 5) {
      setTradeItems([...tradeItems, newTradeItem.trim()])
      setNewTradeItem("")
    }
  }

  const removeTradeItem = (index: number) => {
    setTradeItems(tradeItems.filter((_, i) => i !== index))
  }

  const handleSubmit = async () => {
    if (!user) {
      toast({ title: "Please log in to make an offer", variant: "destructive" })
      return
    }

    if (!hasValidOffer) {
      toast({ title: "Please add a wallet amount or trade items", variant: "destructive" })
      return
    }

    if (parsedAmount > 0 && !hasEnoughBalance) {
      toast({ title: "Insufficient wallet balance", variant: "destructive" })
      return
    }

    setIsSubmitting(true)

    try {
      // If custom onSubmit provided, use it
      if (onSubmit) {
        await onSubmit({ 
          walletAmount: parsedAmount, 
          tradeItems, 
          message: message.trim() || undefined 
        })
      } else {
        // Default API call to create offer
        const response = await fetch("/api/offers", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            listingId: listing?.id,
            walletAmount: parsedAmount,
            tradeItems,
            message: message.trim() || null,
            offerType: parsedAmount > 0 && tradeItems.length > 0 ? "mixed" : parsedAmount > 0 ? "wallet" : "trade"
          }),
        })

        const data = await response.json()

        if (!response.ok) {
          throw new Error(data.error || "Failed to send offer")
        }

        // Show success state
        setShowSuccess(true)
        toast({ 
          title: "Offer Sent Successfully", 
          description: "The seller will be notified of your offer"
        })

        // Close after delay
        setTimeout(() => {
          onClose()
        }, 2000)
        return
      }

      toast({ title: "Offer sent successfully" })
      onClose()
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Failed to send offer"
      toast({ title: errorMessage, variant: "destructive" })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleClose = () => {
    if (!isSubmitting) {
      onClose()
    }
  }

  // Success state
  if (showSuccess) {
    return (
      <Dialog open={open} onOpenChange={handleClose}>
        <DialogContent className="sm:max-w-md">
          <div className="flex flex-col items-center justify-center py-8">
            <div className="w-16 h-16 rounded-full bg-emerald-500/10 flex items-center justify-center mb-4">
              <CheckCircle2 className="h-8 w-8 text-emerald-500" />
            </div>
            <h3 className="text-xl font-semibold text-foreground mb-2">Offer Sent!</h3>
            <p className="text-muted-foreground text-center text-sm">
              Your offer has been sent to the seller. You'll be notified when they respond.
            </p>
          </div>
        </DialogContent>
      </Dialog>
    )
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ArrowRightLeft className="h-5 w-5 text-primary" />
            Make a Trade Offer
          </DialogTitle>
          <DialogDescription>
            Send an offer combining wallet credit and/or items to trade
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5 py-4">
          {/* Listing Preview */}
          {listing && (
            <div className="flex items-center gap-3 p-3 rounded-xl bg-muted/50 border border-border">
              {listing.images?.[0] && (
                <div className="w-16 h-16 rounded-lg overflow-hidden bg-muted flex-shrink-0">
                  <Image
                    src={listing.images[0] || "/placeholder.svg"}
                    alt={listing.title}
                    width={64}
                    height={64}
                    className="object-cover w-full h-full"
                  />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="font-medium text-foreground text-sm truncate">{listing.title}</p>
                <p className="text-xs text-muted-foreground">
                  Item Value: <span className="font-semibold text-primary">N${listing.value?.toLocaleString()}</span>
                </p>
              </div>
            </div>
          )}

          {/* Wallet Balance Info */}
          <div className="flex items-center justify-between p-3 rounded-xl bg-primary/5 border border-primary/10">
            <div className="flex items-center gap-2">
              <Wallet className="h-4 w-4 text-primary" />
              <span className="text-sm text-muted-foreground">Your Wallet Balance</span>
            </div>
            <span className="font-semibold text-foreground">N${balance.toLocaleString()}</span>
          </div>

          {/* Wallet Amount Input */}
          <div className="space-y-2">
            <Label htmlFor="offer-amount" className="text-sm font-medium">
              Wallet Amount to Offer
            </Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">N$</span>
              <Input
                id="offer-amount"
                type="number"
                placeholder="0"
                value={walletAmount}
                onChange={(e) => setWalletAmount(e.target.value)}
                className="pl-10 h-12 rounded-xl"
                min="0"
                max={balance}
                step="1"
                disabled={isSubmitting}
              />
            </div>
            {parsedAmount > 0 && !hasEnoughBalance && (
              <p className="text-xs text-destructive flex items-center gap-1">
                <AlertCircle className="h-3 w-3" />
                Insufficient balance. You have N${balance.toLocaleString()} available.
              </p>
            )}
          </div>

          {/* Trade Items */}
          <div className="space-y-2">
            <Label className="text-sm font-medium flex items-center gap-2">
              <Package className="h-4 w-4" />
              Items to Trade (Optional)
            </Label>
            <div className="flex gap-2">
              <Input
                placeholder="e.g., iPhone 13, Bicycle, etc."
                value={newTradeItem}
                onChange={(e) => setNewTradeItem(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addTradeItem())}
                className="flex-1 h-10 rounded-xl"
                disabled={isSubmitting || tradeItems.length >= 5}
              />
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={addTradeItem}
                disabled={!newTradeItem.trim() || tradeItems.length >= 5 || isSubmitting}
                className="h-10 w-10 rounded-xl bg-transparent"
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            {tradeItems.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {tradeItems.map((item, index) => (
                  <Badge
                    key={index}
                    variant="secondary"
                    className="pl-3 pr-1.5 py-1.5 text-sm flex items-center gap-1"
                  >
                    {item}
                    <button
                      type="button"
                      onClick={() => removeTradeItem(index)}
                      className="ml-1 hover:bg-destructive/20 rounded-full p-0.5"
                      disabled={isSubmitting}
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            )}
            <p className="text-[10px] text-muted-foreground">
              Add up to 5 items. Be specific about what you're offering.
            </p>
          </div>

          {/* Message */}
          <div className="space-y-2">
            <Label htmlFor="offer-message" className="text-sm font-medium">
              Message (Optional)
            </Label>
            <Textarea
              id="offer-message"
              placeholder="Add a message to the seller..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={3}
              className="rounded-xl resize-none"
              disabled={isSubmitting}
            />
          </div>

          {/* Offer Summary */}
          {hasValidOffer && (
            <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
              <p className="text-sm font-medium text-emerald-600 dark:text-emerald-400 mb-2 flex items-center gap-2">
                <Info className="h-4 w-4" />
                Your Offer Summary
              </p>
              <div className="space-y-1 text-sm text-foreground">
                {parsedAmount > 0 && (
                  <p>Wallet: <span className="font-semibold">N${parsedAmount.toLocaleString()}</span></p>
                )}
                {tradeItems.length > 0 && (
                  <p>Trade Items: <span className="font-semibold">{tradeItems.join(", ")}</span></p>
                )}
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="gap-2 sm:gap-2">
          <Button 
            variant="outline" 
            onClick={handleClose} 
            disabled={isSubmitting}
            className="rounded-xl bg-transparent"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!hasValidOffer || isSubmitting}
            className={cn(
              "rounded-xl min-w-[120px]",
              hasValidOffer && "bg-primary hover:bg-primary/90"
            )}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Sending...
              </>
            ) : (
              <>
                <ArrowRightLeft className="mr-2 h-4 w-4" />
                Send Offer
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
