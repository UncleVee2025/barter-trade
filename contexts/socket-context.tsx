"use client"

import type React from "react"
import { createContext, useContext, useEffect, useState, useCallback, useRef } from "react"
import { socketManager } from "@/lib/socket"
import { useAuth } from "./auth-context"

// Check if socket is enabled via environment variable (defaults to false)
const SOCKET_ENABLED = process.env.NEXT_PUBLIC_ENABLE_SOCKET === "true"

interface SocketContextType {
  isConnected: boolean
  isReconnecting: boolean
  reconnectAttempts: number
  emit: typeof socketManager.emit
  on: typeof socketManager.on
  off: typeof socketManager.off
  joinRoom: (roomId: string) => void
  leaveRoom: (roomId: string) => void
}

const SocketContext = createContext<SocketContextType | undefined>(undefined)

export function SocketProvider({ children }: { children: React.ReactNode }) {
  const { user, isAuthenticated } = useAuth()
  const [isConnected, setIsConnected] = useState(false)
  const [isReconnecting, setIsReconnecting] = useState(false)
  const [reconnectAttempts, setReconnectAttempts] = useState(0)
  const joinedRooms = useRef<Set<string>>(new Set())

  useEffect(() => {
    // Only connect if socket is enabled and user is authenticated
    if (!SOCKET_ENABLED || !isAuthenticated || !user?.id) return
    
    const socket = socketManager.connect(user.id)

    const handleConnect = () => {
      setIsConnected(true)
      setIsReconnecting(false)
      setReconnectAttempts(0)
      // Rejoin rooms after reconnect
      joinedRooms.current.forEach((roomId) => {
        socketManager.emit("join:room", roomId)
      })
    }

    const handleDisconnect = () => {
      setIsConnected(false)
    }

    const handleReconnectAttempt = () => {
      setIsReconnecting(true)
      setReconnectAttempts((prev) => prev + 1)
    }

    socket.on("connect", handleConnect)
    socket.on("disconnect", handleDisconnect)
    socket.io.on("reconnect_attempt", handleReconnectAttempt)

    return () => {
      socket.off("connect", handleConnect)
      socket.off("disconnect", handleDisconnect)
      socket.io.off("reconnect_attempt", handleReconnectAttempt)
      socketManager.disconnect()
    }
  }, [isAuthenticated, user?.id])

  const joinRoom = useCallback((roomId: string) => {
    joinedRooms.current.add(roomId)
    socketManager.emit("join:room", roomId)
  }, [])

  const leaveRoom = useCallback((roomId: string) => {
    joinedRooms.current.delete(roomId)
    socketManager.emit("leave:room", roomId)
  }, [])

  return (
    <SocketContext.Provider
      value={{
        isConnected,
        isReconnecting,
        reconnectAttempts,
        emit: socketManager.emit.bind(socketManager),
        on: socketManager.on.bind(socketManager),
        off: socketManager.off.bind(socketManager),
        joinRoom,
        leaveRoom,
      }}
    >
      {children}
    </SocketContext.Provider>
  )
}

export function useSocket() {
  const context = useContext(SocketContext)
  if (!context) {
    throw new Error("useSocket must be used within a SocketProvider")
  }
  return context
}
