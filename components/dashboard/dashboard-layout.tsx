"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Sidebar } from "./sidebar"
import { TopBar } from "./top-bar"
import { MobileNav } from "./mobile-nav"
import { motion } from "framer-motion"
import Image from "next/image"
import { useSocket } from "@/hooks/useSocket" // Declare the useSocket hook

interface DashboardLayoutProps {
  children: React.ReactNode
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-16 h-16 rounded-xl overflow-hidden animate-pulse">
            <Image 
              src="/logo.png" 
              alt="Barter Trade Namibia" 
              width={64} 
              height={64} 
              className="object-contain"
              priority
            />
          </div>
          <div className="flex gap-1">
            <div className="w-2 h-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: "0ms" }} />
            <div className="w-2 h-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: "150ms" }} />
            <div className="w-2 h-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: "300ms" }} />
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background relative">
      {/* Ambient background effects */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        {/* Gradient orbs */}
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-primary/10 rounded-full blur-[120px] animate-pulse" />
        <div className="absolute top-1/2 -left-40 w-80 h-80 bg-emerald-500/5 rounded-full blur-[100px]" />
        <div className="absolute -bottom-40 right-1/4 w-72 h-72 bg-violet-500/5 rounded-full blur-[100px]" />
        
        {/* Grid pattern */}
        <div 
          className="absolute inset-0 opacity-[0.015]"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fillRule='evenodd'%3E%3Cg fill='%23ffffff' fillOpacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          }}
        />
      </div>

      {/* Desktop Sidebar - Hidden on mobile */}
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      
      <div className="lg:pl-72 relative">
        {/* Top Bar */}
        <TopBar onMenuClick={() => setSidebarOpen(true)} />
        
        {/* Connection status indicator - Only show when socket is enabled but not connected */}
        {/* Note: Sockets are disabled for cPanel hosting compatibility */}
        
        {/* Main Content - Extra padding at bottom for mobile nav */}
        <main className="p-4 lg:p-6 max-w-7xl mx-auto pb-24 lg:pb-6">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            {children}
          </motion.div>
        </main>
      </div>

      {/* Mobile Bottom Navigation */}
      <MobileNav />
    </div>
  )
}
