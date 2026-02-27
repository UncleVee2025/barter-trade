"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { QrCode, Download, Share2, Copy, Check, Lock, Sparkles } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"
import { cn } from "@/lib/utils"

interface QRCodeDisplayProps {
  className?: string
}

interface CertificationData {
  is_certified: boolean
  certification_type: string | null
  qr_code_data: string | null
  completed_trades_count: number
  trades_required: number
  progress: number
  progress_percentage: number
  is_eligible: boolean
  message?: string
  certified_at?: string
  display_title?: string
}

interface QRCodeData {
  qr_code_data: string
  qr_code_url: string
  profile_url: string
  user_name: string
}

export function QRCodeDisplay({ className }: QRCodeDisplayProps) {
  const [certification, setCertification] = useState<CertificationData | null>(null)
  const [qrCode, setQrCode] = useState<QRCodeData | null>(null)
  const [loading, setLoading] = useState(true)
  const [unlocking, setUnlocking] = useState(false)
  const [copied, setCopied] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    fetchCertificationStatus()
  }, [])

  const fetchCertificationStatus = async () => {
    try {
      const res = await fetch("/api/user/certification")
      if (res.ok) {
        const data = await res.json()
        setCertification(data)
        
        if (data.is_certified) {
          fetchQRCode()
        }
      }
    } catch (error) {
      console.error("Failed to fetch certification:", error)
    } finally {
      setLoading(false)
    }
  }

  const fetchQRCode = async () => {
    try {
      const res = await fetch("/api/user/qr-code")
      if (res.ok) {
        const data = await res.json()
        setQrCode(data)
      }
    } catch (error) {
      console.error("Failed to fetch QR code:", error)
    }
  }

  const handleUnlock = async () => {
    if (!certification?.is_eligible) return
    
    setUnlocking(true)
    try {
      const res = await fetch("/api/user/certification", { method: "POST" })
      const data = await res.json()
      
      if (res.ok) {
        toast({
          title: "Certification Unlocked!",
          description: data.message,
        })
        fetchCertificationStatus()
      } else {
        toast({
          title: "Error",
          description: data.error,
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to unlock certification",
        variant: "destructive",
      })
    } finally {
      setUnlocking(false)
    }
  }

  const handleCopyLink = async () => {
    if (!qrCode?.profile_url) return
    
    await navigator.clipboard.writeText(qrCode.profile_url)
    setCopied(true)
    toast({ title: "Link copied!", description: "Profile link copied to clipboard" })
    setTimeout(() => setCopied(false), 2000)
  }

  const handleDownloadQR = async () => {
    try {
      const res = await fetch("/api/user/qr-code?format=png&size=500")
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `barter-qr-${qrCode?.qr_code_data || "code"}.png`
      a.click()
      URL.revokeObjectURL(url)
      toast({ title: "Downloaded!", description: "QR code saved to your device" })
    } catch (error) {
      toast({ title: "Error", description: "Failed to download QR code", variant: "destructive" })
    }
  }

  const handleShare = async () => {
    if (!qrCode?.profile_url) return
    
    if (navigator.share) {
      await navigator.share({
        title: "My Barter Trade Profile",
        text: "Check out my certified trader profile!",
        url: qrCode.profile_url,
      })
    } else {
      handleCopyLink()
    }
  }

  if (loading) {
    return (
      <Card className={cn("animate-pulse", className)}>
        <CardHeader>
          <div className="h-6 bg-muted rounded w-1/3" />
          <div className="h-4 bg-muted rounded w-2/3 mt-2" />
        </CardHeader>
        <CardContent>
          <div className="aspect-square bg-muted rounded-lg max-w-[200px] mx-auto" />
        </CardContent>
      </Card>
    )
  }

  // Not certified - show progress
  if (!certification?.is_certified) {
    return (
      <Card className={cn("overflow-hidden", className)}>
        <CardHeader className="relative">
          <div className="absolute inset-0 bg-gradient-to-br from-amber-500/10 to-orange-500/10" />
          <div className="relative">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-amber-500/10">
                <Lock className="h-5 w-5 text-amber-500" />
              </div>
              <div>
                <CardTitle className="text-lg">Trader QR Code</CardTitle>
                <CardDescription>Unlock your certified trader badge</CardDescription>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Locked QR Preview */}
          <div className="relative aspect-square max-w-[200px] mx-auto">
            <div className="absolute inset-0 bg-gradient-to-br from-muted to-muted/50 rounded-xl flex items-center justify-center">
              <div className="text-center space-y-2">
                <Lock className="h-12 w-12 mx-auto text-muted-foreground/50" />
                <p className="text-sm text-muted-foreground">QR Code Locked</p>
              </div>
            </div>
            {/* Blurred QR placeholder */}
            <div className="absolute inset-4 opacity-20 blur-sm">
              <QrCode className="h-full w-full text-muted-foreground" />
            </div>
          </div>

          {/* Progress Section */}
          <div className="space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Progress to Certification</span>
              <span className="font-medium">
                {certification?.progress || 0}/{certification?.trades_required || 10} trades
              </span>
            </div>
            <Progress value={certification?.progress_percentage || 0} className="h-2" />
            <p className="text-xs text-muted-foreground text-center">
              {certification?.message}
            </p>
          </div>

          {/* Unlock Button */}
          <AnimatePresence mode="wait">
            {certification?.is_eligible && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
              >
                <Button 
                  onClick={handleUnlock}
                  disabled={unlocking}
                  className="w-full bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white"
                >
                  {unlocking ? (
                    <>
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ repeat: Infinity, duration: 1 }}
                        className="mr-2"
                      >
                        <Sparkles className="h-4 w-4" />
                      </motion.div>
                      Unlocking...
                    </>
                  ) : (
                    <>
                      <Sparkles className="mr-2 h-4 w-4" />
                      Unlock Certification
                    </>
                  )}
                </Button>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Benefits Preview */}
          <div className="border-t pt-4">
            <p className="text-xs text-muted-foreground mb-2">Unlock to get:</p>
            <ul className="text-xs space-y-1">
              <li className="flex items-center gap-2 text-muted-foreground">
                <QrCode className="h-3 w-3" />
                Personal QR Code
              </li>
              <li className="flex items-center gap-2 text-muted-foreground">
                <Share2 className="h-3 w-3" />
                Digital Business Card
              </li>
              <li className="flex items-center gap-2 text-muted-foreground">
                <Badge className="h-3 w-3">Certified</Badge>
                Certified Trader Badge
              </li>
            </ul>
          </div>
        </CardContent>
      </Card>
    )
  }

  // Certified - show QR code
  return (
    <Card className={cn("overflow-hidden", className)}>
      <CardHeader className="relative">
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/10 to-teal-500/10" />
        <div className="relative">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-emerald-500/10">
                <QrCode className="h-5 w-5 text-emerald-500" />
              </div>
              <div>
                <CardTitle className="text-lg">Your QR Code</CardTitle>
                <CardDescription>
                  {certification.display_title || "Certified Barter Trader"}
                </CardDescription>
              </div>
            </div>
            <Badge variant="secondary" className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20">
              Certified
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* QR Code Display */}
        <motion.div 
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="relative aspect-square max-w-[220px] mx-auto"
        >
          {qrCode?.qr_code_url ? (
            <div className="relative">
              <div className="absolute -inset-2 bg-gradient-to-br from-emerald-500/20 to-teal-500/20 rounded-2xl blur-xl" />
              <div className="relative bg-white p-4 rounded-xl shadow-lg">
                <img 
                  src={qrCode.qr_code_url || "/placeholder.svg"} 
                  alt="Your QR Code"
                  className="w-full h-full"
                />
              </div>
            </div>
          ) : (
            <div className="bg-muted rounded-xl flex items-center justify-center h-full">
              <QrCode className="h-16 w-16 text-muted-foreground animate-pulse" />
            </div>
          )}
        </motion.div>

        {/* QR Code ID */}
        <div className="text-center">
          <p className="text-xs text-muted-foreground">Code ID</p>
          <p className="font-mono text-sm font-medium">{qrCode?.qr_code_data || "---"}</p>
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-3 gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleDownloadQR}
            className="flex-col h-auto py-3 bg-transparent"
          >
            <Download className="h-4 w-4 mb-1" />
            <span className="text-xs">Download</span>
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleCopyLink}
            className="flex-col h-auto py-3 bg-transparent"
          >
            {copied ? (
              <>
                <Check className="h-4 w-4 mb-1 text-emerald-500" />
                <span className="text-xs">Copied!</span>
              </>
            ) : (
              <>
                <Copy className="h-4 w-4 mb-1" />
                <span className="text-xs">Copy Link</span>
              </>
            )}
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleShare}
            className="flex-col h-auto py-3 bg-transparent"
          >
            <Share2 className="h-4 w-4 mb-1" />
            <span className="text-xs">Share</span>
          </Button>
        </div>

        {/* Stats */}
        <div className="border-t pt-4 grid grid-cols-2 gap-4 text-center">
          <div>
            <p className="text-2xl font-bold text-foreground">
              {certification.completed_trades_count}
            </p>
            <p className="text-xs text-muted-foreground">Completed Trades</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-foreground">
              {certification.certified_at 
                ? new Date(certification.certified_at).toLocaleDateString("en-ZA", { month: "short", year: "numeric" })
                : "---"
              }
            </p>
            <p className="text-xs text-muted-foreground">Certified Since</p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
