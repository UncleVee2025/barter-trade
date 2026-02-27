"use client"

import { io, type Socket } from "socket.io-client"
import type { ServerToClientEvents, ClientToServerEvents } from "./types"

class SocketManager {
  private socket: Socket<ServerToClientEvents, ClientToServerEvents> | null = null
  private userId: string | null = null
  private eventBuffer: Array<{ event: string; data: unknown }> = []
  private reconnectAttempts = 0
  private maxReconnectAttempts = 5
  private listeners: Map<string, Set<(...args: unknown[]) => void>> = new Map()

  getSocket() {
    if (!this.socket) {
      this.socket = io(process.env.NEXT_PUBLIC_SOCKET_URL || "http://localhost:3000", {
        autoConnect: false,
        transports: ["websocket", "polling"],
        reconnection: true,
        reconnectionAttempts: this.maxReconnectAttempts,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 5000,
        timeout: 10000,
      })

      this.setupEventHandlers()
    }
    return this.socket
  }

  private setupEventHandlers() {
    if (!this.socket) return

    this.socket.on("connect", () => {
      console.log("[Socket] Connected successfully")
      this.reconnectAttempts = 0
      this.flushEventBuffer()
    })

    this.socket.on("disconnect", (reason) => {
      console.log("[Socket] Disconnected:", reason)
      if (reason === "io server disconnect") {
        // Server initiated disconnect, try to reconnect
        this.socket?.connect()
      }
    })

    this.socket.on("connect_error", (error) => {
      console.log("[Socket] Connection error:", error.message)
      this.reconnectAttempts++
    })

    // Forward all events to registered listeners
    const events: (keyof ServerToClientEvents)[] = [
      "wallet:update",
      "message:new",
      "message:typing",
      "offer:update",
      "notification:new",
      "user:online",
      "user:offline",
    ]

    events.forEach((event) => {
      this.socket?.on(event, (data: unknown) => {
        const eventListeners = this.listeners.get(event)
        if (eventListeners) {
          eventListeners.forEach((callback) => callback(data))
        }
      })
    })
  }

  connect(userId: string) {
    this.userId = userId
    const socket = this.getSocket()

    if (!socket.connected) {
      socket.auth = { userId }
      socket.connect()
    }

    return socket
  }

  disconnect() {
    if (this.socket?.connected) {
      this.socket.disconnect()
    }
    this.userId = null
    this.eventBuffer = []
  }

  emit<E extends keyof ClientToServerEvents>(event: E, ...args: Parameters<ClientToServerEvents[E]>) {
    if (this.socket?.connected) {
      this.socket.emit(event, ...args)
    } else {
      // Buffer events when disconnected
      this.eventBuffer.push({ event, data: args })
    }
  }

  on<E extends keyof ServerToClientEvents>(event: E, callback: ServerToClientEvents[E]) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set())
    }
    this.listeners.get(event)?.add(callback as (...args: unknown[]) => void)

    // Return cleanup function
    return () => {
      this.listeners.get(event)?.delete(callback as (...args: unknown[]) => void)
    }
  }

  off<E extends keyof ServerToClientEvents>(event: E, callback?: ServerToClientEvents[E]) {
    if (callback) {
      this.listeners.get(event)?.delete(callback as (...args: unknown[]) => void)
    } else {
      this.listeners.delete(event)
    }
  }

  private flushEventBuffer() {
    while (this.eventBuffer.length > 0) {
      const { event, data } = this.eventBuffer.shift()!
      this.socket?.emit(event as keyof ClientToServerEvents, ...(data as []))
    }
  }

  isConnected() {
    return this.socket?.connected ?? false
  }

  getConnectionState() {
    return {
      connected: this.socket?.connected ?? false,
      reconnecting: this.reconnectAttempts > 0,
      attempts: this.reconnectAttempts,
    }
  }
}

// Singleton instance
export const socketManager = new SocketManager()

// Legacy exports for backwards compatibility
export function getSocket() {
  return socketManager.getSocket()
}

export function connectSocket(userId: string) {
  return socketManager.connect(userId)
}

export function disconnectSocket() {
  return socketManager.disconnect()
}
