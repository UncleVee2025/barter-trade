"use client"

import { useState, useEffect, useRef } from "react"
import { Html5Qrcode } from "html5-qrcode"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { 
  Camera, 
  Shield, 
  Star, 
  MapPin, 
  CheckCircle,
  XCircle,
  Loader2,
  ExternalLink,
  MessageSquare
} from "lucide-react"
import { cn } from "@/lib/utils"
import { useRouter } from "next/navigation"

interface QRScannerModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  currentUserId?: number
}

interface ScannedUser {
  id: number
  name: string
  avatar?: string
  location?: string
  bio?: string
  isCertified: boolean
  certificationId?: string
  certificationDate?: string
  badgeType?: 'bronze' | 'silver' | 'gold' | 'platinum'
  totalTrades: number
  rating: number
  memberSince?: string
}

const badgeColors = {
  bronze: "bg-amber-700 text-white",
  silver: "bg-slate-400 text-white",
  gold: "bg-yellow-500 text-amber-900",
  platinum: "bg-gradient-to-r from-slate-300 to-slate-500 text-white"
}

export function QRScannerModal({
  open,
  onOpenChange,
  currentUserId
}: QRScannerModalProps) {
  const [isScanning, setIsScanning] = useState(false)
  const [scanResult, setScanResult] = useState<ScannedUser | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const scannerRef = useRef<Html5Qrcode | null>(null)
  const router = useRouter()

  useEffect(() => {
    if (open && !scanResult) {
      startScanning()
    }

    return () => {
      stopScanning()
    }
  }, [open, scanResult])

  const startScanning = async () => {
    setError(null)
    setIsScanning(true)

    try {
      const html5QrCode = new Html5Qrcode("qr-reader")
      scannerRef.current = html5QrCode

      await html5QrCode.start(
        { facingMode: "environment" },
        {
          fps: 10,
          qrbox: { width: 250, height: 250 }
        },
        async (decodedText) => {
          await handleScan(decodedText)
          stopScanning()
        },
        () => {} // Ignore scan failures
      )
    } catch (err) {
      setError("Unable to access camera. Please grant camera permissions.")
      setIsScanning(false)
    }
  }

  const stopScanning = async () => {
    if (scannerRef.current) {
      try {
        await scannerRef.current.stop()
        scannerRef.current = null
      } catch (err) {
        // Ignore errors when stopping
      }
    }
    setIsScanning(false)
  }

  const handleScan = async (data: string) => {
    setIsLoading(true)
    setError(null)

    try {
      // Try to parse as base64 JSON first (our QR format)
      let userId: number | null = null
      
      try {
        const decoded = JSON.parse(atob(data))
        if (decoded.type === 'barter_trade_user' && decoded.userId) {
          userId = decoded.userId
        }
      } catch {
        // Try as URL
        const urlMatch = data.match(/\/users\/(\d+)/)
        if (urlMatch) {
          userId = parseInt(urlMatch[1])
        }
      }

      if (!userId) {
        setError("Invalid QR code. This doesn't appear to be a Barter Trade profile.")
        setIsLoading(false)
        return
      }

      // Fetch user data
      const response = await fetch("/api/user/qr-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          scannedUserId: userId,
          scannerUserId: currentUserId,
          context: "qr_scan"
        })
      })

      if (!response.ok) {
        throw new Error("User not found")
      }

      const result = await response.json()
      setScanResult(result.user)
    } catch (err) {
      setError("Failed to verify user. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  const handleViewProfile = () => {
    if (scanResult) {
      onOpenChange(false)
      router.push(`/users/${scanResult.id}`)
    }
  }

  const handleStartChat = () => {
    if (scanResult) {
      onOpenChange(false)
      router.push(`/dashboard/messages?user=${scanResult.id}`)
    }
  }

  const handleReset = () => {
    setScanResult(null)
    setError(null)
    startScanning()
  }

  const handleClose = () => {
    stopScanning()
    setScanResult(null)
    setError(null)
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Camera className="h-5 w-5" />
            Scan Trader QR Code
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Scanner View */}
          {!scanResult && !isLoading && (
            <div className="relative">
              <div 
                id="qr-reader" 
                className={cn(
                  "w-full aspect-square rounded-lg overflow-hidden bg-muted",
                  !isScanning && "flex items-center justify-center"
                )}
              >
                {!isScanning && !error && (
                  <div className="text-center p-4">
                    <Camera className="h-12 w-12 mx-auto text-muted-foreground mb-2" />
                    <p className="text-sm text-muted-foreground">
                      Initializing camera...
                    </p>
                  </div>
                )}
              </div>

              {error && (
                <div className="absolute inset-0 flex items-center justify-center bg-background/90 rounded-lg">
                  <div className="text-center p-4">
                    <XCircle className="h-12 w-12 mx-auto text-destructive mb-2" />
                    <p className="text-sm text-destructive mb-4">{error}</p>
                    <Button size="sm" onClick={startScanning}>
                      Try Again
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Loading State */}
          {isLoading && (
            <div className="flex flex-col items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
              <p className="text-sm text-muted-foreground">Verifying trader...</p>
            </div>
          )}

          {/* Scan Result */}
          {scanResult && !isLoading && (
            <Card className="border-2 border-green-500/20 bg-green-500/5">
              <CardContent className="pt-6">
                <div className="flex items-center gap-2 text-green-600 mb-4">
                  <CheckCircle className="h-5 w-5" />
                  <span className="font-medium">Verified Trader</span>
                </div>

                <div className="flex items-start gap-4">
                  <Avatar className="h-16 w-16">
                    <AvatarImage src={scanResult.avatar || "/placeholder.svg"} alt={scanResult.name} />
                    <AvatarFallback className="text-lg">
                      {scanResult.name.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-semibold text-lg">{scanResult.name}</h3>
                      {scanResult.isCertified && scanResult.badgeType && (
                        <Badge className={cn("gap-1", badgeColors[scanResult.badgeType])}>
                          <Shield className="h-3 w-3" />
                          {scanResult.badgeType.charAt(0).toUpperCase() + scanResult.badgeType.slice(1)}
                        </Badge>
                      )}
                    </div>

                    {scanResult.location && (
                      <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                        <MapPin className="h-3 w-3" />
                        {scanResult.location}
                      </p>
                    )}

                    <div className="flex items-center gap-4 mt-3 text-sm">
                      <span className="font-medium">{scanResult.totalTrades} trades</span>
                      {scanResult.rating > 0 && (
                        <span className="flex items-center gap-1">
                          <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                          {scanResult.rating.toFixed(1)}
                        </span>
                      )}
                    </div>

                    {scanResult.certificationId && (
                      <p className="text-xs text-muted-foreground mt-2">
                        Cert ID: <code className="bg-muted px-1 rounded">{scanResult.certificationId}</code>
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2 mt-6">
                  <Button className="flex-1" onClick={handleViewProfile}>
                    <ExternalLink className="h-4 w-4 mr-2" />
                    View Profile
                  </Button>
                  <Button variant="outline" className="flex-1 bg-transparent" onClick={handleStartChat}>
                    <MessageSquare className="h-4 w-4 mr-2" />
                    Message
                  </Button>
                </div>

                <Button 
                  variant="ghost" 
                  className="w-full mt-2" 
                  onClick={handleReset}
                >
                  Scan Another
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Instructions */}
          {!scanResult && !isLoading && (
            <p className="text-xs text-center text-muted-foreground">
              Point your camera at a Barter Trade QR code to verify a trader&apos;s identity and certification status.
            </p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
