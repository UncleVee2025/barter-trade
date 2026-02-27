"use client"

import { useState } from "react"
import { Search, MessageSquare } from "lucide-react"
import { Input } from "@/components/ui/input"
import type { Conversation } from "./messages-screen"
import { cn } from "@/lib/utils"
import Image from "next/image"

interface ConversationListProps {
  conversations: Conversation[]
  selectedId?: string
  onSelect: (conversation: Conversation) => void
}

export function ConversationList({ conversations, selectedId, onSelect }: ConversationListProps) {
  const [search, setSearch] = useState("")

  const filteredConversations = conversations.filter(
    (c) =>
      c.user.name.toLowerCase().includes(search.toLowerCase()) ||
      c.listing.title.toLowerCase().includes(search.toLowerCase()),
  )

  const unreadCount = conversations.filter((c) => c.lastMessage.unread).length

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b border-border">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-foreground">Messages</h2>
          {unreadCount > 0 && (
            <span className="bg-primary text-primary-foreground text-xs font-bold px-2 py-0.5 rounded-full">
              {unreadCount} new
            </span>
          )}
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search conversations..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10 bg-muted border-0 rounded-xl"
          />
        </div>
      </div>

      {/* Conversations */}
      <div className="flex-1 overflow-auto">
        {filteredConversations.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-muted-foreground p-4">
            <MessageSquare className="h-12 w-12 mb-4 opacity-50" />
            <p className="text-center">No conversations found</p>
          </div>
        ) : (
          filteredConversations.map((conversation) => (
            <button
              key={conversation.id}
              onClick={() => onSelect(conversation)}
              className={cn(
                "w-full flex items-start gap-3 p-4 hover:bg-muted/50 transition-colors text-left border-b border-border",
                selectedId === conversation.id && "bg-muted",
                conversation.lastMessage.unread && "bg-primary/5",
              )}
            >
              {/* Listing image */}
              <div className="relative">
                <Image
                  src={conversation.listing.image || "/placeholder.svg"}
                  alt={conversation.listing.title}
                  width={48}
                  height={48}
                  className="w-12 h-12 rounded-xl object-cover"
                />
                {/* Online indicator */}
                {conversation.user.online && (
                  <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 border-2 border-card rounded-full" />
                )}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-medium text-foreground truncate">{conversation.user.name}</span>
                  <span className="text-xs text-muted-foreground flex-shrink-0">{conversation.lastMessage.time}</span>
                </div>
                <p className="text-xs text-muted-foreground truncate mb-1">{conversation.listing.title}</p>
                <div className="flex items-center gap-2">
                  <p
                    className={cn(
                      "text-sm truncate flex-1",
                      conversation.lastMessage.unread ? "text-foreground font-medium" : "text-muted-foreground",
                    )}
                  >
                    {conversation.lastMessage.fromMe && <span className="text-primary">You: </span>}
                    {conversation.lastMessage.text}
                  </p>
                  {conversation.lastMessage.unread && (
                    <span className="w-2 h-2 rounded-full bg-primary flex-shrink-0" />
                  )}
                </div>
                {conversation.hasOffer && (
                  <span className="inline-block mt-1 text-xs bg-gold/10 text-gold px-2 py-0.5 rounded-full">
                    Active Offer
                  </span>
                )}
              </div>
            </button>
          ))
        )}
      </div>
    </div>
  )
}
