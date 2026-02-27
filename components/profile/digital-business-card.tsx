"use client"

import { useState, useRef } from "react"
import { QRCodeSVG } from "qrcode.react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { 
  Download, 
  Share2, 
  Shield, 
  Star,
  MapPin,
  Mail,
  Phone,
  ExternalLink,
  Award
} from "lucide-react"
import { cn } from "@/lib/utils"
import html2canvas from "html2canvas"

interface DigitalBusinessCardProps {
  user: {
    id: number
    name: string
    email?: string
    phone?: string
    avatar?: string
    location?: string
    bio?: string
    isCertified: boolean
    certificationId?: string
    certificationDate?: string
    badgeType?: 'bronze' | 'silver' | 'gold' | 'platinum'
    memberSince?: string
  }
  stats: {
    totalTrades: number
    rating: number
    activeListings?: number
  }
  categories?: Array<{ category: string; count: number }>
  profileUrl: string
  variant?: 'compact' | 'full'
  className?: string
}

const badgeGradients = {
  bronze: "from-amber-600 to-amber-800",
  silver: "from-slate-300 to-slate-500",
  gold: "from-yellow-400 to-amber-500",
  platinum: "from-slate-200 via-slate-400 to-slate-300"
}

const badgeTextColors = {
  bronze: "text-white",
  silver: "text-white",
  gold: "text-amber-900",
  platinum: "text-slate-800"
}

export function DigitalBusinessCard({
  user,
  stats,
  categories = [],
  profileUrl,
  variant = 'full',
  className
}: DigitalBusinessCardProps) {
  const [isDownloading, setIsDownloading] = useState(false)
  const cardRef = useRef<HTMLDivElement>(null)

  const handleDownload = async () => {
    if (!cardRef.current) return
    
    setIsDownloading(true)
    try {
      const canvas = await html2canvas(cardRef.current, {
        scale: 2,
        backgroundColor: null,
        useCORS: true
      })
      
      const link = document.createElement("a")
      link.download = `${user.name.replace(/\s+/g, '-').toLowerCase()}-business-card.png`
      link.href = canvas.toDataURL("image/png")
      link.click()

      // Log download
      fetch("/api/user/business-card", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "download", format: "png" })
      }).catch(console.error)
    } catch (error) {
      console.error("Error downloading card:", error)
    } finally {
      setIsDownloading(false)
    }
  }

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `${user.name} - Barter Trade`,
          text: `Connect with ${user.name} on Barter Trade${user.isCertified ? ' - Certified Trader' : ''}`,
          url: profileUrl
        })
      } catch (err) {
        // User cancelled share
      }
    }
  }

  if (variant === 'compact') {
    return (
      <div className={cn("relative", className)}>
        <div
          ref={cardRef}
          className={cn(
            "w-[350px] rounded-xl overflow-hidden shadow-lg",
            user.isCertified && user.badgeType
              ? `bg-gradient-to-br ${badgeGradients[user.badgeType]}`
              : "bg-gradient-to-br from-slate-800 to-slate-900"
          )}
        >
          <div className="p-5">
            <div className="flex items-start gap-4">
              <Avatar className="h-16 w-16 ring-2 ring-white/30">
                <AvatarImage src={user.avatar || "/placeholder.svg"} alt={user.name} />
                <AvatarFallback className="text-lg bg-white/20 text-white">
                  {user.name.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h2 className={cn(
                    "font-bold text-lg truncate",
                    user.isCertified && user.badgeType ? badgeTextColors[user.badgeType] : "text-white"
                  )}>
                    {user.name}
                  </h2>
                  {user.isCertified && (
                    <Shield className="h-5 w-5 text-white/90 shrink-0" />
                  )}
                </div>
                
                {user.location && (
                  <p className="text-sm text-white/70 flex items-center gap-1 mt-0.5">
                    <MapPin className="h-3 w-3" />
                    {user.location}
                  </p>
                )}

                <div className="flex items-center gap-3 mt-2 text-sm text-white/80">
                  <span className="font-medium">{stats.totalTrades} trades</span>
                  {stats.rating > 0 && (
                    <span className="flex items-center gap-1">
                      <Star className="h-3.5 w-3.5 fill-yellow-300 text-yellow-300" />
                      {stats.rating.toFixed(1)}
                    </span>
                  )}
                </div>
              </div>

              <div className="bg-white rounded-lg p-1.5">
                <QRCodeSVG
                  value={profileUrl}
                  size={60}
                  level="M"
                  includeMargin={false}
                />
              </div>
            </div>

            {user.isCertified && user.certificationId && (
              <div className="mt-3 pt-3 border-t border-white/20 flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-xs text-white/60">
                  <Award className="h-3.5 w-3.5" />
                  <span>Certified Trader</span>
                </div>
                <code className="text-xs text-white/50">{user.certificationId}</code>
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2 mt-4">
          <Button size="sm" onClick={handleDownload} disabled={isDownloading}>
            <Download className="h-4 w-4 mr-2" />
            {isDownloading ? "Downloading..." : "Download"}
          </Button>
          <Button size="sm" variant="outline" onClick={handleShare}>
            <Share2 className="h-4 w-4 mr-2" />
            Share
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className={cn("relative", className)}>
      <div
        ref={cardRef}
        className={cn(
          "w-[400px] rounded-2xl overflow-hidden shadow-xl",
          user.isCertified && user.badgeType
            ? `bg-gradient-to-br ${badgeGradients[user.badgeType]}`
            : "bg-gradient-to-br from-slate-800 to-slate-900"
        )}
      >
        {/* Header */}
        <div className="p-6 pb-4">
          <div className="flex items-start gap-4">
            <Avatar className="h-20 w-20 ring-4 ring-white/30">
              <AvatarImage src={user.avatar || "/placeholder.svg"} alt={user.name} />
              <AvatarFallback className="text-2xl bg-white/20 text-white">
                {user.name.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <h2 className={cn(
                  "font-bold text-xl truncate",
                  user.isCertified && user.badgeType ? badgeTextColors[user.badgeType] : "text-white"
                )}>
                  {user.name}
                </h2>
                {user.isCertified && (
                  <Shield className="h-5 w-5 text-white/90 shrink-0" />
                )}
              </div>
              
              {user.location && (
                <p className="text-sm text-white/70 flex items-center gap-1 mt-1">
                  <MapPin className="h-3.5 w-3.5" />
                  {user.location}
                </p>
              )}

              {user.isCertified && user.badgeType && (
                <Badge 
                  variant="secondary" 
                  className="mt-2 bg-white/20 text-white border-0"
                >
                  <Award className="h-3 w-3 mr-1" />
                  {user.badgeType.charAt(0).toUpperCase() + user.badgeType.slice(1)} Trader
                </Badge>
              )}
            </div>
          </div>

          {user.bio && (
            <p className="mt-4 text-sm text-white/80 line-clamp-2">
              {user.bio}
            </p>
          )}
        </div>

        {/* Stats */}
        <div className="px-6 py-4 bg-black/10">
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold text-white">{stats.totalTrades}</div>
              <div className="text-xs text-white/60 uppercase tracking-wide">Trades</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-white flex items-center justify-center gap-1">
                {stats.rating > 0 ? stats.rating.toFixed(1) : '-'}
                {stats.rating > 0 && <Star className="h-4 w-4 fill-yellow-300 text-yellow-300" />}
              </div>
              <div className="text-xs text-white/60 uppercase tracking-wide">Rating</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-white">{stats.activeListings || 0}</div>
              <div className="text-xs text-white/60 uppercase tracking-wide">Active</div>
            </div>
          </div>
        </div>

        {/* Contact & QR */}
        <div className="p-6 pt-4 flex items-end justify-between">
          <div className="space-y-2">
            {user.email && (
              <div className="flex items-center gap-2 text-sm text-white/70">
                <Mail className="h-4 w-4" />
                <span className="truncate max-w-[180px]">{user.email}</span>
              </div>
            )}
            {user.phone && (
              <div className="flex items-center gap-2 text-sm text-white/70">
                <Phone className="h-4 w-4" />
                <span>{user.phone}</span>
              </div>
            )}
            <div className="flex items-center gap-2 text-sm text-white/70">
              <ExternalLink className="h-4 w-4" />
              <span className="text-xs">bartertrade.app/users/{user.id}</span>
            </div>
          </div>

          <div className="bg-white rounded-xl p-2 shadow-lg">
            <QRCodeSVG
              value={profileUrl}
              size={80}
              level="H"
              includeMargin={false}
            />
          </div>
        </div>

        {/* Footer */}
        {user.isCertified && user.certificationId && (
          <div className="px-6 py-3 bg-black/20 flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs text-white/50">
              <Shield className="h-3.5 w-3.5" />
              <span>Verified by Barter Trade</span>
            </div>
            <code className="text-xs text-white/40">{user.certificationId}</code>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2 mt-4">
        <Button onClick={handleDownload} disabled={isDownloading}>
          <Download className="h-4 w-4 mr-2" />
          {isDownloading ? "Downloading..." : "Download Card"}
        </Button>
        <Button variant="outline" onClick={handleShare}>
          <Share2 className="h-4 w-4 mr-2" />
          Share Profile
        </Button>
      </div>
    </div>
  )
}
