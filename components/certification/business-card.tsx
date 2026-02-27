"use client"

import { useState, useEffect, useRef } from "react"
import { motion } from "framer-motion"
import { 
  Download, 
  Mail, 
  Phone, 
  MapPin, 
  Shield, 
  BadgeCheck, 
  QrCode,
  Sparkles,
  ExternalLink,
  Eye
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { useToast } from "@/hooks/use-toast"
import { cn } from "@/lib/utils"

interface BusinessCardData {
  name: string
  title: string
  email: string
  phone: string
  location: string
  avatar_url: string | null
  verifications: {
    id_verified: boolean
    email_verified: boolean
    phone_verified: boolean
  }
  tier: string
  total_points: number
  qr_code_data: string
  qr_code_url: string
  profile_url: string
  completed_trades: number
  certified_at: string
  download_count: number
}

interface BusinessCardProps {
  className?: string
}

const tierColors: Record<string, { bg: string; text: string; border: string }> = {
  bronze: { bg: "bg-orange-100", text: "text-orange-700", border: "border-orange-300" },
  silver: { bg: "bg-slate-100", text: "text-slate-700", border: "border-slate-300" },
  gold: { bg: "bg-amber-100", text: "text-amber-700", border: "border-amber-300" },
  platinum: { bg: "bg-cyan-100", text: "text-cyan-700", border: "border-cyan-300" },
  diamond: { bg: "bg-violet-100", text: "text-violet-700", border: "border-violet-300" },
}

export function BusinessCard({ className }: BusinessCardProps) {
  const [cardData, setCardData] = useState<BusinessCardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [downloading, setDownloading] = useState(false)
  const [previewOpen, setPreviewOpen] = useState(false)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const { toast } = useToast()

  useEffect(() => {
    fetchBusinessCard()
  }, [])

  const fetchBusinessCard = async () => {
    try {
      const res = await fetch("/api/user/business-card")
      if (res.ok) {
        const data = await res.json()
        setCardData(data)
      }
    } catch (error) {
      console.error("Failed to fetch business card:", error)
    } finally {
      setLoading(false)
    }
  }

  const generateCardImage = async (): Promise<Blob | null> => {
    if (!cardData) return null
    
    const canvas = document.createElement("canvas")
    const ctx = canvas.getContext("2d")
    if (!ctx) return null

    // Card dimensions (standard business card ratio ~1.75:1)
    const width = 1050
    const height = 600
    canvas.width = width
    canvas.height = height

    // Background gradient
    const gradient = ctx.createLinearGradient(0, 0, width, height)
    gradient.addColorStop(0, "#1A1A2E")
    gradient.addColorStop(1, "#16213E")
    ctx.fillStyle = gradient
    ctx.fillRect(0, 0, width, height)

    // Gold accent line at top
    ctx.fillStyle = "#D4A106"
    ctx.fillRect(0, 0, width, 6)

    // Company logo/name area
    ctx.fillStyle = "#FFFFFF"
    ctx.font = "bold 28px system-ui, -apple-system, sans-serif"
    ctx.fillText("BARTER TRADE NAMIBIA", 50, 60)

    // Tagline
    ctx.fillStyle = "#D4A106"
    ctx.font = "14px system-ui, -apple-system, sans-serif"
    ctx.fillText("Trade Smart. Trade Secure.", 50, 85)

    // Certified badge
    ctx.fillStyle = "rgba(212, 161, 6, 0.2)"
    roundRect(ctx, 50, 110, 180, 30, 15)
    ctx.fill()
    ctx.fillStyle = "#D4A106"
    ctx.font = "bold 12px system-ui, -apple-system, sans-serif"
    ctx.fillText("CERTIFIED TRADER", 75, 130)

    // User name
    ctx.fillStyle = "#FFFFFF"
    ctx.font = "bold 36px system-ui, -apple-system, sans-serif"
    ctx.fillText(cardData.name || "Barter Trader", 50, 200)

    // Title
    ctx.fillStyle = "#A0A0A0"
    ctx.font = "18px system-ui, -apple-system, sans-serif"
    ctx.fillText(cardData.title || "Certified Barter Trader", 50, 235)

    // Divider line
    ctx.strokeStyle = "rgba(255, 255, 255, 0.1)"
    ctx.lineWidth = 1
    ctx.beginPath()
    ctx.moveTo(50, 265)
    ctx.lineTo(400, 265)
    ctx.stroke()

    // Contact info
    const iconY = 300
    ctx.fillStyle = "#D4A106"
    ctx.font = "14px system-ui, -apple-system, sans-serif"
    
    // Email
    ctx.fillText("Email", 50, iconY)
    ctx.fillStyle = "#FFFFFF"
    ctx.font = "16px system-ui, -apple-system, sans-serif"
    ctx.fillText(cardData.email || "---", 50, iconY + 22)

    // Phone
    ctx.fillStyle = "#D4A106"
    ctx.font = "14px system-ui, -apple-system, sans-serif"
    ctx.fillText("Phone", 50, iconY + 60)
    ctx.fillStyle = "#FFFFFF"
    ctx.font = "16px system-ui, -apple-system, sans-serif"
    ctx.fillText(cardData.phone || "---", 50, iconY + 82)

    // Location
    ctx.fillStyle = "#D4A106"
    ctx.font = "14px system-ui, -apple-system, sans-serif"
    ctx.fillText("Location", 50, iconY + 120)
    ctx.fillStyle = "#FFFFFF"
    ctx.font = "16px system-ui, -apple-system, sans-serif"
    ctx.fillText(cardData.location || "Namibia", 50, iconY + 142)

    // Stats section
    ctx.fillStyle = "#D4A106"
    ctx.font = "14px system-ui, -apple-system, sans-serif"
    ctx.fillText("Completed Trades", 50, iconY + 180)
    ctx.fillStyle = "#FFFFFF"
    ctx.font = "bold 24px system-ui, -apple-system, sans-serif"
    ctx.fillText(String(cardData.completed_trades || 0), 50, iconY + 210)

    // Tier badge
    ctx.fillStyle = "#D4A106"
    ctx.font = "14px system-ui, -apple-system, sans-serif"
    ctx.fillText("Trader Tier", 200, iconY + 180)
    ctx.fillStyle = "#FFFFFF"
    ctx.font = "bold 24px system-ui, -apple-system, sans-serif"
    ctx.fillText((cardData.tier || "Bronze").toUpperCase(), 200, iconY + 210)

    // QR Code section (right side)
    const qrSize = 220
    const qrX = width - qrSize - 80
    const qrY = (height - qrSize) / 2

    // QR background
    ctx.fillStyle = "#FFFFFF"
    roundRect(ctx, qrX - 20, qrY - 20, qrSize + 40, qrSize + 40, 16)
    ctx.fill()

    // Load and draw QR code
    if (cardData.qr_code_url) {
      try {
        const qrImage = new Image()
        qrImage.crossOrigin = "anonymous"
        await new Promise((resolve, reject) => {
          qrImage.onload = resolve
          qrImage.onerror = reject
          qrImage.src = cardData.qr_code_url
        })
        ctx.drawImage(qrImage, qrX, qrY, qrSize, qrSize)
      } catch (e) {
        // Fallback: draw placeholder
        ctx.fillStyle = "#1A1A2E"
        ctx.font = "14px system-ui, -apple-system, sans-serif"
        ctx.fillText("Scan to connect", qrX + 50, qrY + qrSize / 2)
      }
    }

    // QR code label
    ctx.fillStyle = "#666666"
    ctx.font = "12px system-ui, -apple-system, sans-serif"
    ctx.textAlign = "center"
    ctx.fillText("Scan to view profile", qrX + qrSize / 2, qrY + qrSize + 45)
    ctx.textAlign = "left"

    // Footer
    ctx.fillStyle = "#666666"
    ctx.font = "11px system-ui, -apple-system, sans-serif"
    ctx.fillText(`ID: ${cardData.qr_code_data}`, 50, height - 25)
    ctx.fillText(`bartertrade.na`, width - 150, height - 25)

    return new Promise((resolve) => {
      canvas.toBlob(resolve, "image/jpeg", 0.95)
    })
  }

  const handleDownload = async () => {
    if (!cardData) return
    
    setDownloading(true)
    try {
      const blob = await generateCardImage()
      if (blob) {
        const url = URL.createObjectURL(blob)
        const a = document.createElement("a")
        a.href = url
        a.download = `barter-card-${cardData.qr_code_data}.jpg`
        a.click()
        URL.revokeObjectURL(url)
        
        toast({
          title: "Downloaded!",
          description: "Your business card has been saved",
        })
        
        // Refresh to update download count
        fetchBusinessCard()
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to generate business card",
        variant: "destructive",
      })
    } finally {
      setDownloading(false)
    }
  }

  if (loading) {
    return (
      <Card className={cn("animate-pulse", className)}>
        <CardHeader>
          <div className="h-6 bg-muted rounded w-1/2" />
        </CardHeader>
        <CardContent>
          <div className="aspect-[1.75/1] bg-muted rounded-lg" />
        </CardContent>
      </Card>
    )
  }

  if (!cardData) {
    return (
      <Card className={cn(className)}>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <QrCode className="h-5 w-5 text-muted-foreground" />
            Digital Business Card
          </CardTitle>
          <CardDescription>
            Complete 10 trades to unlock your digital business card
          </CardDescription>
        </CardHeader>
      </Card>
    )
  }

  const tierStyle = tierColors[cardData.tier] || tierColors.bronze

  return (
    <Card className={cn("overflow-hidden", className)}>
      <CardHeader className="relative">
        <div className="absolute inset-0 bg-gradient-to-br from-slate-900/5 to-amber-500/5" />
        <div className="relative">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-amber-500" />
                Digital Business Card
              </CardTitle>
              <CardDescription>
                Share your professional trader profile
              </CardDescription>
            </div>
            <Badge variant="outline" className={cn(tierStyle.bg, tierStyle.text, tierStyle.border)}>
              {cardData.tier.charAt(0).toUpperCase() + cardData.tier.slice(1)} Tier
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Card Preview */}
        <div 
          className="relative aspect-[1.75/1] rounded-xl overflow-hidden cursor-pointer group"
          onClick={() => setPreviewOpen(true)}
        >
          {/* Mini card preview */}
          <div className="absolute inset-0 bg-gradient-to-br from-[#1A1A2E] to-[#16213E] p-4 flex">
            {/* Left section */}
            <div className="flex-1 flex flex-col justify-between text-white">
              <div>
                <div className="flex items-center gap-1 mb-1">
                  <span className="text-[10px] text-amber-400 font-medium tracking-wider">
                    BARTER TRADE NAMIBIA
                  </span>
                </div>
                <Badge 
                  variant="outline" 
                  className="text-[8px] h-4 border-amber-500/30 text-amber-400 bg-amber-500/10"
                >
                  CERTIFIED
                </Badge>
              </div>
              
              <div className="space-y-0.5">
                <p className="font-bold text-sm truncate">{cardData.name}</p>
                <p className="text-[10px] text-gray-400">{cardData.title}</p>
              </div>

              <div className="space-y-1">
                <div className="flex items-center gap-1 text-[9px] text-gray-300">
                  <Mail className="h-2.5 w-2.5 text-amber-500" />
                  <span className="truncate">{cardData.email}</span>
                </div>
                {cardData.phone && (
                  <div className="flex items-center gap-1 text-[9px] text-gray-300">
                    <Phone className="h-2.5 w-2.5 text-amber-500" />
                    <span>{cardData.phone}</span>
                  </div>
                )}
                <div className="flex items-center gap-1 text-[9px] text-gray-300">
                  <MapPin className="h-2.5 w-2.5 text-amber-500" />
                  <span>{cardData.location}</span>
                </div>
              </div>
            </div>

            {/* Right section - QR */}
            <div className="flex items-center justify-center w-24">
              <div className="bg-white p-1.5 rounded-lg">
                <img 
                  src={cardData.qr_code_url || "/placeholder.svg"} 
                  alt="QR Code"
                  className="w-16 h-16"
                />
              </div>
            </div>

            {/* Gold accent line */}
            <div className="absolute top-0 left-0 right-0 h-1 bg-amber-500" />
          </div>

          {/* Hover overlay */}
          <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
            <Button variant="secondary" size="sm">
              <Eye className="mr-2 h-4 w-4" />
              Preview Full Size
            </Button>
          </div>
        </div>

        {/* Info & Actions */}
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1">
              <Download className="h-3.5 w-3.5" />
              <span>{cardData.download_count} downloads</span>
            </div>
            <div className="flex items-center gap-1">
              <BadgeCheck className="h-3.5 w-3.5 text-emerald-500" />
              <span>{cardData.completed_trades} trades</span>
            </div>
          </div>
        </div>

        {/* Verification badges */}
        <div className="flex items-center gap-2 flex-wrap">
          {cardData.verifications.id_verified && (
            <Badge variant="secondary" className="text-xs bg-emerald-500/10 text-emerald-600">
              <Shield className="mr-1 h-3 w-3" />
              ID Verified
            </Badge>
          )}
          {cardData.verifications.email_verified && (
            <Badge variant="secondary" className="text-xs bg-blue-500/10 text-blue-600">
              <Mail className="mr-1 h-3 w-3" />
              Email Verified
            </Badge>
          )}
          {cardData.verifications.phone_verified && (
            <Badge variant="secondary" className="text-xs bg-violet-500/10 text-violet-600">
              <Phone className="mr-1 h-3 w-3" />
              Phone Verified
            </Badge>
          )}
        </div>

        {/* Action buttons */}
        <div className="grid grid-cols-2 gap-2">
          <Button 
            onClick={handleDownload}
            disabled={downloading}
            className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white"
          >
            {downloading ? (
              <>
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ repeat: Infinity, duration: 1 }}
                  className="mr-2"
                >
                  <Download className="h-4 w-4" />
                </motion.div>
                Generating...
              </>
            ) : (
              <>
                <Download className="mr-2 h-4 w-4" />
                Download JPEG
              </>
            )}
          </Button>
          <Button 
            variant="outline"
            onClick={() => window.open(cardData.profile_url, "_blank")}
          >
            <ExternalLink className="mr-2 h-4 w-4" />
            View Profile
          </Button>
        </div>

        {/* Full Preview Dialog */}
        <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
          <DialogContent className="max-w-3xl">
            <DialogHeader>
              <DialogTitle>Business Card Preview</DialogTitle>
            </DialogHeader>
            <div className="relative aspect-[1.75/1] rounded-xl overflow-hidden bg-gradient-to-br from-[#1A1A2E] to-[#16213E]">
              {/* Full size preview */}
              <div className="absolute inset-0 p-8 flex">
                {/* Left section */}
                <div className="flex-1 flex flex-col justify-between text-white">
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-lg text-amber-400 font-bold tracking-wider">
                        BARTER TRADE NAMIBIA
                      </span>
                    </div>
                    <p className="text-xs text-amber-400/70 mb-4">Trade Smart. Trade Secure.</p>
                    <Badge 
                      variant="outline" 
                      className="border-amber-500/30 text-amber-400 bg-amber-500/10"
                    >
                      CERTIFIED TRADER
                    </Badge>
                  </div>
                  
                  <div className="space-y-1">
                    <p className="font-bold text-3xl">{cardData.name}</p>
                    <p className="text-gray-400">{cardData.title}</p>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center gap-3 text-gray-300">
                      <Mail className="h-4 w-4 text-amber-500" />
                      <span>{cardData.email}</span>
                    </div>
                    {cardData.phone && (
                      <div className="flex items-center gap-3 text-gray-300">
                        <Phone className="h-4 w-4 text-amber-500" />
                        <span>{cardData.phone}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-3 text-gray-300">
                      <MapPin className="h-4 w-4 text-amber-500" />
                      <span>{cardData.location}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-8">
                    <div>
                      <p className="text-2xl font-bold">{cardData.completed_trades}</p>
                      <p className="text-xs text-gray-500">Completed Trades</p>
                    </div>
                    <div>
                      <p className="text-2xl font-bold uppercase">{cardData.tier}</p>
                      <p className="text-xs text-gray-500">Trader Tier</p>
                    </div>
                  </div>
                </div>

                {/* Right section - QR */}
                <div className="flex flex-col items-center justify-center w-64">
                  <div className="bg-white p-4 rounded-xl shadow-2xl">
                    <img 
                      src={cardData.qr_code_url || "/placeholder.svg"} 
                      alt="QR Code"
                      className="w-40 h-40"
                    />
                  </div>
                  <p className="text-xs text-gray-500 mt-3">Scan to view profile</p>
                </div>

                {/* Gold accent line */}
                <div className="absolute top-0 left-0 right-0 h-2 bg-amber-500" />
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-4">
              <Button variant="outline" onClick={() => setPreviewOpen(false)}>
                Close
              </Button>
              <Button onClick={handleDownload} disabled={downloading}>
                <Download className="mr-2 h-4 w-4" />
                Download JPEG
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  )
}

// Helper function for rounded rectangles
function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number
) {
  ctx.beginPath()
  ctx.moveTo(x + radius, y)
  ctx.lineTo(x + width - radius, y)
  ctx.quadraticCurveTo(x + width, y, x + width, y + radius)
  ctx.lineTo(x + width, y + height - radius)
  ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height)
  ctx.lineTo(x + radius, y + height)
  ctx.quadraticCurveTo(x, y + height, x, y + height - radius)
  ctx.lineTo(x, y + radius)
  ctx.quadraticCurveTo(x, y, x + radius, y)
  ctx.closePath()
}
