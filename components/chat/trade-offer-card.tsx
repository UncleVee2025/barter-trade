"use client"

import { motion } from "framer-motion"
import { Check, X, RefreshCw, Sparkles } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import Image from "next/image"

interface TradeOfferCardProps {
  offer: {
    items: { title: string; value: number; image: string }[]
    walletAmount: number
    status: "pending" | "accepted" | "rejected" | "countered"
  }
  fromMe: boolean
  onAccept?: () => void
  onReject?: () => void
  onCounter?: () => void
}

const statusConfig = {
  pending: { label: "Pending", color: "bg-yellow-500/10 text-yellow-500", icon: Sparkles },
  accepted: { label: "Accepted", color: "bg-green-500/10 text-green-500", icon: Check },
  rejected: { label: "Rejected", color: "bg-red-500/10 text-red-500", icon: X },
  countered: { label: "Countered", color: "bg-blue-500/10 text-blue-500", icon: RefreshCw },
}

export function TradeOfferCard({ offer, fromMe, onAccept, onReject, onCounter }: TradeOfferCardProps) {
  const totalValue = offer.items.reduce((sum, item) => sum + item.value, 0) + offer.walletAmount
  const status = statusConfig[offer.status]
  const StatusIcon = status.icon

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className={cn(
        "w-full max-w-sm rounded-2xl border overflow-hidden",
        fromMe ? "bg-primary/5 border-primary/20" : "bg-muted border-border",
      )}
    >
      {/* Header */}
      <div className={cn("px-4 py-3 flex items-center justify-between", fromMe ? "bg-primary/10" : "bg-muted")}>
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-gold" />
          <span className="font-medium text-foreground">Trade Offer</span>
        </div>
        <span className={cn("text-xs px-2 py-1 rounded-full flex items-center gap-1", status.color)}>
          <StatusIcon className="h-3 w-3" />
          {status.label}
        </span>
      </div>

      {/* Items */}
      <div className="p-4 space-y-3">
        {offer.items.map((item, i) => (
          <div key={i} className="flex items-center gap-3 p-2 rounded-xl bg-background/50">
            <Image
              src={item.image || "/placeholder.svg"}
              alt={item.title}
              width={48}
              height={48}
              className="w-12 h-12 rounded-lg object-cover"
            />
            <div className="flex-1 min-w-0">
              <p className="font-medium text-foreground text-sm truncate">{item.title}</p>
              <p className="text-primary text-sm">N${item.value.toLocaleString()}</p>
            </div>
          </div>
        ))}

        {/* Wallet amount */}
        {offer.walletAmount > 0 && (
          <div className="flex items-center gap-3 p-2 rounded-xl bg-background/50">
            <div className="w-12 h-12 rounded-lg bg-gold/10 flex items-center justify-center">
              <span className="text-gold font-bold">N$</span>
            </div>
            <div className="flex-1">
              <p className="font-medium text-foreground text-sm">Wallet Transfer</p>
              <p className="text-gold text-sm">N${offer.walletAmount.toLocaleString()}</p>
            </div>
          </div>
        )}

        {/* Total */}
        <div className="flex items-center justify-between pt-3 border-t border-border">
          <span className="text-muted-foreground text-sm">Total Value</span>
          <span className="font-bold text-foreground">N${totalValue.toLocaleString()}</span>
        </div>
      </div>

      {/* Actions - only show for received offers that are pending */}
      {!fromMe && offer.status === "pending" && (
        <div className="px-4 pb-4 flex gap-2">
          <Button
            onClick={onReject}
            variant="outline"
            className="flex-1 rounded-xl border-red-500/30 text-red-500 hover:bg-red-500/10 bg-transparent"
          >
            <X className="h-4 w-4 mr-1" />
            Reject
          </Button>
          <Button onClick={onCounter} variant="outline" className="flex-1 rounded-xl bg-transparent">
            <RefreshCw className="h-4 w-4 mr-1" />
            Counter
          </Button>
          <Button onClick={onAccept} className="flex-1 rounded-xl bg-green-500 hover:bg-green-600">
            <Check className="h-4 w-4 mr-1" />
            Accept
          </Button>
        </div>
      )}
    </motion.div>
  )
}
