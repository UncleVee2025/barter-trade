"use client"

import { useState } from "react"
import useSWR from "swr"
import { ConversationList } from "./conversation-list"
import { ChatWindow } from "./chat-window"
import { ArrowLeft, MessageSquare, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/contexts/auth-context"

export interface Conversation {
  id: string
  user: {
    id: string
    name: string
    avatar?: string
    online: boolean
  }
  listing: {
    id: string
    title: string
    value: number
    image: string
  }
  lastMessage: {
    text: string
    time: string
    unread: boolean
    fromMe: boolean
  }
  hasOffer: boolean
  unreadCount: number
}

const fetcher = (url: string) => fetch(url).then((res) => res.json())

// Transform API response to component format
function transformConversation(conv: Record<string, unknown>): Conversation {
  const participants = conv.participants as Array<{ id: string; name: string; avatar?: string; lastSeen?: string }> || []
  const otherUser = participants[0] || { id: "", name: "Unknown", avatar: undefined }
  const lastMessage = conv.lastMessage as { content?: string; createdAt?: string; isOwn?: boolean } | null
  
  // Check if user is online (seen within last 5 minutes)
  const isOnline = otherUser.lastSeen 
    ? (new Date().getTime() - new Date(otherUser.lastSeen as string).getTime()) < 5 * 60 * 1000
    : false

  // Format time
  const formatTime = (dateStr?: string) => {
    if (!dateStr) return ""
    const date = new Date(dateStr)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMins / 60)
    const diffDays = Math.floor(diffHours / 24)
    
    if (diffMins < 1) return "Just now"
    if (diffMins < 60) return `${diffMins}m ago`
    if (diffHours < 24) return `${diffHours}h ago`
    if (diffDays < 7) return `${diffDays}d ago`
    return date.toLocaleDateString()
  }

  return {
    id: conv.id as string,
    user: {
      id: otherUser.id,
      name: otherUser.name,
      avatar: otherUser.avatar,
      online: isOnline,
    },
    listing: {
      id: conv.listingId as string || "",
      title: conv.listingTitle as string || "Untitled Listing",
      value: 0,
      image: conv.listingImage as string || "/placeholder.svg",
    },
    lastMessage: {
      text: lastMessage?.content || "No messages yet",
      time: formatTime(lastMessage?.createdAt as string),
      unread: (conv.unreadCount as number || 0) > 0,
      fromMe: lastMessage?.isOwn || false,
    },
    hasOffer: false,
    unreadCount: conv.unreadCount as number || 0,
  }
}

export function MessagesScreen() {
  const { user, isAuthenticated } = useAuth()
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null)

  // Fetch conversations from API
  const { data, error, isLoading, mutate: refreshConversations } = useSWR<{ conversations: Record<string, unknown>[] }>(
    isAuthenticated ? "/api/messages" : null,
    fetcher,
    { 
      revalidateOnFocus: true,
      refreshInterval: 30000 // Refresh every 30 seconds
    }
  )

  const conversations: Conversation[] = (data?.conversations || []).map(transformConversation)

  // Not logged in state
  if (!isAuthenticated) {
    return (
      <div className="h-[calc(100vh-8rem)] flex bg-card rounded-2xl border border-border overflow-hidden">
        <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground p-8">
          <MessageSquare className="h-16 w-16 mb-4 opacity-50" />
          <p className="text-lg font-medium text-foreground mb-2">Sign in to view messages</p>
          <p className="text-sm text-center max-w-md">
            Create an account or sign in to start conversations with other traders.
          </p>
          <Button className="mt-4" onClick={() => window.location.href = "/auth"}>
            Sign In
          </Button>
        </div>
      </div>
    )
  }

  // Loading state
  if (isLoading) {
    return (
      <div className="h-[calc(100vh-8rem)] flex bg-card rounded-2xl border border-border overflow-hidden">
        <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground">
          <Loader2 className="h-8 w-8 animate-spin mb-4" />
          <p className="text-sm">Loading conversations...</p>
        </div>
      </div>
    )
  }

  // Error state
  if (error) {
    return (
      <div className="h-[calc(100vh-8rem)] flex bg-card rounded-2xl border border-border overflow-hidden">
        <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground p-8">
          <MessageSquare className="h-16 w-16 mb-4 opacity-50" />
          <p className="text-lg font-medium text-foreground mb-2">Failed to load messages</p>
          <p className="text-sm text-center max-w-md mb-4">
            There was an error loading your conversations. Please try again.
          </p>
          <Button variant="outline" className="bg-transparent" onClick={() => refreshConversations()}>
            Try Again
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="h-[calc(100vh-8rem)] flex bg-card rounded-2xl border border-border overflow-hidden">
      {/* Conversation list - hidden on mobile when chat is open */}
      <div
        className={`w-full md:w-80 lg:w-96 border-r border-border flex-shrink-0 ${selectedConversation ? "hidden md:block" : ""}`}
      >
        <ConversationList
          conversations={conversations}
          selectedId={selectedConversation?.id}
          onSelect={setSelectedConversation}
        />
      </div>

      {/* Chat window */}
      <div className={`flex-1 ${!selectedConversation ? "hidden md:flex" : "flex"}`}>
        {selectedConversation ? (
          <>
            <div className="md:hidden absolute top-4 left-4 z-10">
              <Button variant="ghost" size="icon" onClick={() => setSelectedConversation(null)}>
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </div>
            <ChatWindow 
              conversation={selectedConversation} 
              onRefresh={refreshConversations}
            />
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-muted-foreground">
            <div className="text-center">
              <MessageSquare className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p className="text-lg font-medium">Select a conversation</p>
              <p className="text-sm">Choose from your existing conversations or start a new one</p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
