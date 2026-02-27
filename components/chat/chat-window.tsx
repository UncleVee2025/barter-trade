"use client"

import type React from "react"
import { useState, useRef, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import useSWR from "swr"
import { Send, MoreVertical, Phone, Video, Paperclip, ImageIcon, Smile, Check, CheckCheck, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu"
import type { Conversation } from "./messages-screen"
import { TradeOfferCard } from "./trade-offer-card"
import { MakeOfferModal } from "./make-offer-modal"
import { cn } from "@/lib/utils"
import { useAuth } from "@/contexts/auth-context"
import { toast } from "@/hooks/use-toast"
import Image from "next/image"

interface Message {
  id: string
  text: string
  time: string
  fromMe: boolean
  read: boolean
  type: "text" | "offer" | "image" | "system"
  offer?: {
    items: { title: string; value: number; image: string }[]
    walletAmount: number
    status: "pending" | "accepted" | "rejected" | "countered"
  }
}

interface APIMessage {
  id: string
  conversationId: string
  content: string
  type: "text" | "offer" | "image" | "system"
  offerId: string | null
  readAt: string | null
  createdAt: string
  sender: {
    id: string
    name: string
    avatar: string | null
    isVerified: boolean
  }
  isOwn: boolean
}

interface ChatWindowProps {
  conversation: Conversation
  onRefresh?: () => void
}

const fetcher = (url: string) => fetch(url).then((res) => res.json())

function formatMessageTime(dateStr: string): string {
  const date = new Date(dateStr)
  return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
}

function transformMessage(msg: APIMessage): Message {
  return {
    id: msg.id,
    text: msg.content,
    time: formatMessageTime(msg.createdAt),
    fromMe: msg.isOwn,
    read: !!msg.readAt,
    type: msg.type as Message["type"],
  }
}

export function ChatWindow({ conversation, onRefresh }: ChatWindowProps) {
  const { user } = useAuth()
  const [messages, setMessages] = useState<Message[]>([])
  const [newMessage, setNewMessage] = useState("")
  const [isSending, setIsSending] = useState(false)
  const [showOfferModal, setShowOfferModal] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Fetch messages from API
  const { data, error, isLoading, mutate: refreshMessages } = useSWR<{ messages: APIMessage[] }>(
    conversation?.id ? `/api/messages?conversationId=${conversation.id}` : null,
    fetcher,
    {
      revalidateOnFocus: true,
      refreshInterval: 5000, // Poll for new messages every 5 seconds
    }
  )

  // Update messages when data changes
  useEffect(() => {
    if (data?.messages) {
      setMessages(data.messages.map(transformMessage))
    }
  }, [data])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const handleSend = async () => {
    if (!newMessage.trim() || isSending) return

    setIsSending(true)
    const messageText = newMessage.trim()
    setNewMessage("")

    // Optimistic update
    const optimisticMessage: Message = {
      id: `temp-${Date.now()}`,
      text: messageText,
      time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      fromMe: true,
      read: false,
      type: "text",
    }
    setMessages((prev) => [...prev, optimisticMessage])

    try {
      const response = await fetch("/api/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          conversationId: conversation.id,
          content: messageText,
          type: "text",
        }),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || "Failed to send message")
      }

      // Replace optimistic message with real one
      setMessages((prev) =>
        prev.map((m) =>
          m.id === optimisticMessage.id
            ? {
                id: result.message.id,
                text: result.message.content,
                time: formatMessageTime(result.message.createdAt),
                fromMe: true,
                read: false,
                type: "text",
              }
            : m
        )
      )

      // Refresh conversations list
      onRefresh?.()
    } catch (error) {
      // Remove optimistic message on error
      setMessages((prev) => prev.filter((m) => m.id !== optimisticMessage.id))
      setNewMessage(messageText) // Restore message
      toast({
        title: "Failed to send message",
        description: error instanceof Error ? error.message : "Please try again",
        variant: "destructive",
      })
    } finally {
      setIsSending(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const handleOfferResponse = async (offerId: string, response: "accept" | "reject" | "counter") => {
    // In a real implementation, this would call an API
    setMessages((prev) =>
      prev.map((m) => {
        if (m.id === offerId && m.offer) {
          return {
            ...m,
            offer: {
              ...m.offer,
              status: response === "accept" ? "accepted" : response === "reject" ? "rejected" : "countered",
            },
          }
        }
        return m
      })
    )
  }

  // Loading state
  if (isLoading && messages.length === 0) {
    return (
      <div className="flex-1 flex flex-col h-full">
        <ChatHeader conversation={conversation} />
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </div>
    )
  }

  return (
    <div className="flex-1 flex flex-col h-full">
      <ChatHeader conversation={conversation} />

      {/* Messages */}
      <div className="flex-1 overflow-auto p-4 space-y-4">
        {/* Listing card at top */}
        <div className="flex justify-center mb-4">
          <div className="bg-muted rounded-xl p-3 flex items-center gap-3 max-w-sm">
            <Image
              src={conversation.listing.image || "/placeholder.svg"}
              alt=""
              width={48}
              height={48}
              className="w-12 h-12 rounded-lg object-cover"
            />
            <div>
              <p className="text-sm font-medium text-foreground">{conversation.listing.title}</p>
              {conversation.listing.value > 0 && (
                <p className="text-primary font-semibold">N${conversation.listing.value.toLocaleString()}</p>
              )}
            </div>
          </div>
        </div>

        {/* Empty state */}
        {messages.length === 0 && !isLoading && (
          <div className="flex-1 flex flex-col items-center justify-center text-center py-8">
            <p className="text-muted-foreground text-sm">No messages yet</p>
            <p className="text-muted-foreground text-xs mt-1">Send a message to start the conversation</p>
          </div>
        )}

        {messages.map((message) => (
          <motion.div
            key={message.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className={cn("flex", message.fromMe ? "justify-end" : "justify-start")}
          >
            {message.type === "offer" && message.offer ? (
              <TradeOfferCard
                offer={message.offer}
                fromMe={message.fromMe}
                onAccept={() => handleOfferResponse(message.id, "accept")}
                onReject={() => handleOfferResponse(message.id, "reject")}
                onCounter={() => handleOfferResponse(message.id, "counter")}
              />
            ) : (
              <div
                className={cn(
                  "max-w-[75%] rounded-2xl px-4 py-2",
                  message.fromMe ? "bg-primary text-primary-foreground rounded-tr-sm" : "bg-muted rounded-tl-sm"
                )}
              >
                <p className="text-sm">{message.text}</p>
                <div
                  className={cn(
                    "flex items-center justify-end gap-1 mt-1",
                    message.fromMe ? "text-primary-foreground/70" : "text-muted-foreground"
                  )}
                >
                  <span className="text-xs">{message.time}</span>
                  {message.fromMe && (message.read ? <CheckCheck className="h-3 w-3" /> : <Check className="h-3 w-3" />)}
                </div>
              </div>
            )}
          </motion.div>
        ))}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-4 border-t border-border">
        <div className="flex items-center gap-2">
          <div className="flex gap-1">
            <Button variant="ghost" size="icon" className="text-muted-foreground">
              <Paperclip className="h-5 w-5" />
            </Button>
            <Button variant="ghost" size="icon" className="text-muted-foreground">
              <ImageIcon className="h-5 w-5" />
            </Button>
          </div>
          <div className="flex-1 relative">
            <Input
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Type a message..."
              className="pr-10 bg-muted border-0 rounded-xl"
              disabled={isSending}
            />
            <button className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
              <Smile className="h-5 w-5" />
            </button>
          </div>
          <Button
            onClick={() => setShowOfferModal(true)}
            variant="outline"
            className="rounded-xl hidden sm:flex bg-transparent"
          >
            Make Offer
          </Button>
          <Button onClick={handleSend} size="icon" className="rounded-xl" disabled={!newMessage.trim() || isSending}>
            {isSending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          </Button>
        </div>
      </div>

      {/* Make offer modal */}
      <MakeOfferModal
        open={showOfferModal}
        onClose={() => setShowOfferModal(false)}
        listing={{
          id: conversation.listing.id || "",
          title: conversation.listing.title,
          value: conversation.listing.value,
          images: conversation.listing.image ? [conversation.listing.image] : [],
          seller: { id: conversation.user.id, name: conversation.user.name },
        }}
        onSubmit={async (offer) => {
          // Create the offer first
          try {
            const offerResponse = await fetch("/api/offers", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                listingId: conversation.listing.id,
                walletAmount: offer.walletAmount,
                tradeItems: offer.tradeItems || [],
                message: offer.message,
                offerType: offer.walletAmount > 0 && (offer.tradeItems?.length ?? 0) > 0 ? "mixed" : 
                          offer.walletAmount > 0 ? "wallet" : "trade"
              }),
            })
            
            const offerData = await offerResponse.json()
            
            if (!offerResponse.ok) {
              throw new Error(offerData.error || "Failed to create offer")
            }

            // Send offer as a message with offer reference
            const offerMessage = offer.tradeItems && offer.tradeItems.length > 0
              ? `Trade Offer: N$${offer.walletAmount.toLocaleString()} + ${offer.tradeItems.join(", ")}`
              : `Trade Offer: N$${offer.walletAmount.toLocaleString()}`
            
            await fetch("/api/messages", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                conversationId: conversation.id,
                content: offerMessage,
                type: "offer",
                offerId: offerData.offer?.id,
              }),
            })
            
            refreshMessages()
            onRefresh?.()
            
            toast({
              title: "Offer sent successfully",
              description: "The seller will be notified of your offer",
            })
          } catch (error) {
            toast({
              title: "Failed to send offer",
              description: error instanceof Error ? error.message : "Please try again",
              variant: "destructive",
            })
          }
          setShowOfferModal(false)
        }}
      />
    </div>
  )
}

function ChatHeader({ conversation }: { conversation: Conversation }) {
  return (
    <div className="flex items-center justify-between p-4 border-b border-border">
      <div className="flex items-center gap-3">
        <div className="relative">
          <Image
            src={conversation.listing.image || "/placeholder.svg"}
            alt=""
            width={40}
            height={40}
            className="w-10 h-10 rounded-xl object-cover"
          />
          {conversation.user.online && (
            <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 border-2 border-card rounded-full" />
          )}
        </div>
        <div>
          <h3 className="font-medium text-foreground">{conversation.user.name}</h3>
          <p className="text-xs text-muted-foreground">
            {conversation.user.online ? "Online" : "Offline"} {conversation.listing.title && `• ${conversation.listing.title}`}
          </p>
        </div>
      </div>
      <div className="flex items-center gap-1">
        <Button variant="ghost" size="icon" className="hidden sm:flex">
          <Phone className="h-4 w-4" />
        </Button>
        <Button variant="ghost" size="icon" className="hidden sm:flex">
          <Video className="h-4 w-4" />
        </Button>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon">
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem>View Profile</DropdownMenuItem>
            <DropdownMenuItem>View Listing</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="text-destructive">Block User</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  )
}
