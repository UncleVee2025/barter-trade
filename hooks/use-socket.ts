"use client"

import { useEffect, useRef, useCallback } from "react"
import { getSocket, connectSocket, disconnectSocket } from "@/lib/socket"
import type { ServerToClientEvents } from "@/lib/types"

export function useSocket(userId: string | null) {
  const socketRef = useRef(getSocket())

  useEffect(() => {
    if (!userId) return

    const socket = connectSocket(userId)
    socketRef.current = socket

    socket.on("connect", () => {
      console.log("Socket connected")
    })

    socket.on("disconnect", () => {
      console.log("Socket disconnected")
    })

    return () => {
      disconnectSocket()
    }
  }, [userId])

  const on = useCallback(<K extends keyof ServerToClientEvents>(event: K, callback: ServerToClientEvents[K]) => {
    socketRef.current?.on(event, callback as any)
    return () => {
      socketRef.current?.off(event, callback as any)
    }
  }, [])

  const emit = useCallback(<T extends Record<string, unknown>>(event: string, data?: T) => {
    socketRef.current?.emit(event, data)
  }, [])

  const joinRoom = useCallback((roomId: string) => {
    socketRef.current?.emit("join:room", roomId)
  }, [])

  const leaveRoom = useCallback((roomId: string) => {
    socketRef.current?.emit("leave:room", roomId)
  }, [])

  return {
    socket: socketRef.current,
    on,
    emit,
    joinRoom,
    leaveRoom,
    isConnected: socketRef.current?.connected ?? false,
  }
}
