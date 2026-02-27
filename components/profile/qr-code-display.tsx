"use client"

import { useState, useRef, useEffect } from "react"
import { QRCodeSVG } from "qrcode.react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { 
  Download, 
  Share2, 
  Copy, 
  Check, 
  Shield, 
  Star,
  MapPin,
  Calendar
} from "lucide-react"
import { cn } from "@/lib/utils"

interface QRCodeDisplayProps {
  user: {
    id: number
    name: string
    avatar?: string
    location?: string
    isCertified: boolean
    certificationId?: string
    badgeType?: 'bronze' | 'silver' | 'gold' | 'platinum'
    totalTrades: number
    rating: number
    memberSince?: string
  }
  profileUrl: string
  qrData: string
  size?: number
  showActions?: boolean
  className?: string
}

const badgeColors = {
  bronze: "bg-amber-700 text-white",
  silver: "bg-slate-400 text-white",
  gold: "bg-yellow-500 text-black",
  platinum: "bg-gradient-to-r from-slate-300 to-slate-500 text-white"
}

const badgeIcons = {
  bronze: "text-amber-700",
  silver: "text-slate-400",
  gold: "text-yellow-500",
  platinum: "text-slate-400"
}

export function QRCodeDisplay({
  user,
  profileUrl,
  qrData,
  size = 200,
  showActions = true,
  className
}: QRCodeDisplayProps) {
  const [copied, setCopied] = useState(false)
  const qrRef = useRef<HTMLDivElement>(null)

  const handleCopyLink = async () => {
    await navigator.clipboard.writeText(profileUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleDownload = () => {
    const svg = qrRef.current?.querySelector("svg")
    if (!svg) return

    const svgData = new XMLSerializer().serializeToString(svg)
    const canvas = document.createElement("canvas")
    const ctx = canvas.getContext("2d")
    const img = new Image()
    
    img.onload = () => {
      canvas.width = size * 2
      canvas.height = size * 2
      ctx?.drawImage(img, 0, 0, size * 2, size * 2)
      
      const link = document.createElement("a")
      link.download = `barter-trade-qr-${user.id}.png`
      link.href = canvas.toDataURL("image/png")
      link.click()
    }
    
    img.src = "data:image/svg+xml;base64," + btoa(svgData)

    // Log download
    fetch("/api/user/business-card", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "download", format: "png" })
    }).catch(console.error)
  }

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `${user.name} on Barter Trade`,
          text: user.isCertified 
            ? `Check out ${user.name}'s certified trader profile on Barter Trade!`
            : `Check out ${user.name}'s profile on Barter Trade!`,
          url: profileUrl
        })
        
        // Log share
        fetch("/api/user/business-card", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "share", format: "link" })
        }).catch(console.error)
      } catch (err) {
        // User cancelled or share failed
      }
    } else {
      handleCopyLink()
    }
  }

  return (
    <Card className={cn("overflow-hidden", className)}>
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">Your QR Code</CardTitle>
          {user.isCertified && user.badgeType && (
            <Badge className={cn("gap-1", badgeColors[user.badgeType])}>
              <Shield className="h-3 w-3" />
              {user.badgeType.charAt(0).toUpperCase() + user.badgeType.slice(1)} Trader
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="flex flex-col items-center gap-6">
        {/* User Info */}
        <div className="flex items-center gap-3 w-full">
          <Avatar className="h-12 w-12">
            <AvatarImage src={user.avatar || "/placeholder.svg"} alt={user.name} />
            <AvatarFallback>{user.name.charAt(0).toUpperCase()}</AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="font-semibold truncate">{user.name}</h3>
              {user.isCertified && (
                <Shield className={cn("h-4 w-4 shrink-0", badgeIcons[user.badgeType || 'bronze'])} />
              )}
            </div>
            {user.location && (
              <p className="text-sm text-muted-foreground flex items-center gap-1">
                <MapPin className="h-3 w-3" />
                {user.location}
              </p>
            )}
          </div>
        </div>

        {/* QR Code */}
        <div 
          ref={qrRef}
          className={cn(
            "p-4 bg-white rounded-xl shadow-sm border-2",
            user.isCertified ? "border-primary/20" : "border-border"
          )}
        >
          <QRCodeSVG
            value={profileUrl}
            size={size}
            level="H"
            includeMargin={false}
            imageSettings={user.isCertified ? {
              src: "/logo-icon.png",
              height: 40,
              width: 40,
              excavate: true
            } : undefined}
          />
        </div>

        {/* Stats Row */}
        <div className="flex items-center justify-center gap-6 text-sm">
          <div className="flex items-center gap-1.5">
            <span className="font-semibold">{user.totalTrades}</span>
            <span className="text-muted-foreground">trades</span>
          </div>
          {user.rating > 0 && (
            <div className="flex items-center gap-1.5">
              <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
              <span className="font-semibold">{user.rating.toFixed(1)}</span>
            </div>
          )}
          {user.memberSince && (
            <div className="flex items-center gap-1.5 text-muted-foreground">
              <Calendar className="h-3.5 w-3.5" />
              <span>Since {new Date(user.memberSince).getFullYear()}</span>
            </div>
          )}
        </div>

        {/* Certification ID */}
        {user.isCertified && user.certificationId && (
          <div className="text-xs text-center text-muted-foreground">
            Certification ID: <code className="bg-muted px-1.5 py-0.5 rounded">{user.certificationId}</code>
          </div>
        )}

        {/* Actions */}
        {showActions && (
          <div className="flex items-center gap-2 w-full">
            <Button 
              variant="outline" 
              size="sm" 
              className="flex-1 bg-transparent"
              onClick={handleDownload}
            >
              <Download className="h-4 w-4 mr-2" />
              Download
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              className="flex-1 bg-transparent"
              onClick={handleShare}
            >
              <Share2 className="h-4 w-4 mr-2" />
              Share
            </Button>
            <Button 
              variant="outline" 
              size="sm"
              onClick={handleCopyLink}
            >
              {copied ? (
                <Check className="h-4 w-4 text-green-500" />
              ) : (
                <Copy className="h-4 w-4" />
              )}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
