"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { ArrowRightLeft, Loader2, X } from "lucide-react"
import Image from "next/image"
import { toast } from "@/hooks/use-toast"

interface MakeOfferModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  listing: any
}

export default function MakeOfferModal({
  open,
  onOpenChange,
  listing,
}: MakeOfferModalProps) {
  const [items, setItems] = useState<string[]>([])
  const [newItem, setNewItem] = useState("")
  const [message, setMessage] = useState("")
  const [loading, setLoading] = useState(false)

  const addItem = () => {
    if (!newItem.trim() || items.length >= 5) return
    setItems((prev) => [...prev, newItem.trim()])
    setNewItem("")
  }

  const removeItem = (index: number) => {
    setItems((prev) => prev.filter((_, i) => i !== index))
  }

  const sendOffer = async () => {
    if (!items.length && !message.trim()) {
      toast({
        title: "Add items or a message",
        description: "Your offer must include something",
        variant: "destructive",
      })
      return
    }

    setLoading(true)

    try {
      const res = await fetch("/api/messages", {
        method: "POST",
        credentials: "include", // 🔥 REQUIRED
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          listingId: listing.id,
          recipientId: listing.user?.id || listing.userId, // 🔥 SAFE
          type: "offer",
          content: `
TRADE OFFER

Listing: ${listing.title}

Items Offered:
${items.length ? items.join(", ") : "None"}

Message:
${message || "No message"}
          `.trim(),
        }),
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data?.error)

      toast({ title: "Offer sent successfully" })

      setItems([])
      setMessage("")
      setNewItem("")
      onOpenChange(false)
    } catch {
      toast({
        title: "Failed to send offer",
        description: "Please make sure you are logged in",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  if (!listing) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ArrowRightLeft className="h-5 w-5 text-primary" />
            Make Trade Offer
          </DialogTitle>
        </DialogHeader>

        {/* Listing preview */}
        <div className="flex gap-3 p-3 rounded-xl bg-muted">
          <Image
            src={listing.images?.[0] || "/placeholder.svg"}
            alt={listing.title}
            width={56}
            height={56}
            className="rounded-lg object-cover"
          />
          <div>
            <p className="font-medium">{listing.title}</p>
            <p className="text-sm text-muted-foreground">
              Value: N${listing.value?.toLocaleString()}
            </p>
          </div>
        </div>

        {/* Items */}
        <div className="space-y-2">
          <Input
            placeholder="Add item (e.g. Laptop, TV, Service)"
            value={newItem}
            onChange={(e) => setNewItem(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && addItem()}
          />

          <div className="flex flex-wrap gap-2">
            {items.map((item, i) => (
              <Badge key={i} variant="secondary" className="flex items-center gap-1">
                {item}
                <button onClick={() => removeItem(i)}>
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            ))}
          </div>
        </div>

        {/* Message */}
        <Textarea
          placeholder="Optional message to the trader"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          rows={4}
        />

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={loading}
          >
            Cancel
          </Button>

          <Button
            onClick={sendOffer}
            disabled={loading}
            className="min-w-[140px]"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Sending…
              </>
            ) : (
              "Send Offer"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
