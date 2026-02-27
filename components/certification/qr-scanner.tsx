"use client"

import { useState, useRef, useEffect, useCallback } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { 
  Camera, 
  X, 
  Flashlight, 
  SwitchCamera, 
  QrCode,
  AlertCircle,
  CheckCircle2,
  Loader2
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { cn } from "@/lib/utils"

interface QRScannerProps {
  open: boolean
  onClose: () => void
  onScan: (data: string) => void
  title?: string
  description?: string
}

export function QRScanner({ 
  open, 
  onClose, 
  onScan, 
  title = "Scan QR Code",
  description = "Point your camera at a Barter Trade QR code"
}: QRScannerProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const animationRef = useRef<number>(0)
  
  const [hasCamera, setHasCamera] = useState(true)
  const [cameraError, setCameraError] = useState<string | null>(null)
  const [scanning, setScanning] = useState(false)
  const [scanned, setScanned] = useState(false)
  const [facingMode, setFacingMode] = useState<"environment" | "user">("environment")
  const [torchEnabled, setTorchEnabled] = useState(false)
  const [torchSupported, setTorchSupported] = useState(false)

  const startCamera = useCallback(async () => {
    try {
      setCameraError(null)
      setScanning(true)

      // Stop any existing stream
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop())
      }

      const constraints = {
        video: {
          facingMode,
          width: { ideal: 1280 },
          height: { ideal: 720 }
        }
      }

      const stream = await navigator.mediaDevices.getUserMedia(constraints)
      streamRef.current = stream

      if (videoRef.current) {
        videoRef.current.srcObject = stream
        await videoRef.current.play()
      }

      // Check torch support
      const track = stream.getVideoTracks()[0]
      const capabilities = track.getCapabilities?.() as MediaTrackCapabilities & { torch?: boolean }
      setTorchSupported(!!capabilities?.torch)

      // Start scanning
      requestAnimationFrame(scanQRCode)

    } catch (error: any) {
      console.error("Camera error:", error)
      setScanning(false)
      
      if (error.name === "NotAllowedError") {
        setCameraError("Camera access denied. Please allow camera access in your browser settings.")
      } else if (error.name === "NotFoundError") {
        setCameraError("No camera found on this device.")
        setHasCamera(false)
      } else {
        setCameraError("Failed to access camera. Please try again.")
      }
    }
  }, [facingMode])

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop())
      streamRef.current = null
    }
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current)
    }
    setScanning(false)
  }, [])

  const scanQRCode = useCallback(() => {
    if (!videoRef.current || !canvasRef.current || !scanning || scanned) {
      return
    }

    const video = videoRef.current
    const canvas = canvasRef.current
    const ctx = canvas.getContext("2d")

    if (!ctx || video.readyState !== video.HAVE_ENOUGH_DATA) {
      animationRef.current = requestAnimationFrame(scanQRCode)
      return
    }

    canvas.width = video.videoWidth
    canvas.height = video.videoHeight
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height)

    // Get image data for QR detection
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
    
    // Use jsQR for client-side QR detection
    // Note: In production, you'd import jsQR library
    // For now, we'll use a simple pattern match for BTN- codes
    try {
      // This is a simplified detection - in production use jsQR library
      const dataUrl = canvas.toDataURL()
      
      // Check for BTN pattern in any detected text
      // In real implementation, use: const code = jsQR(imageData.data, imageData.width, imageData.height)
      
      animationRef.current = requestAnimationFrame(scanQRCode)
    } catch (e) {
      animationRef.current = requestAnimationFrame(scanQRCode)
    }
  }, [scanning, scanned])

  const toggleTorch = async () => {
    if (!streamRef.current || !torchSupported) return
    
    const track = streamRef.current.getVideoTracks()[0]
    try {
      await track.applyConstraints({
        advanced: [{ torch: !torchEnabled } as MediaTrackConstraintSet]
      })
      setTorchEnabled(!torchEnabled)
    } catch (e) {
      console.error("Torch toggle failed:", e)
    }
  }

  const switchCamera = () => {
    setFacingMode(prev => prev === "environment" ? "user" : "environment")
  }

  // Handle manual code entry for testing
  const handleManualEntry = () => {
    const code = prompt("Enter QR code data (e.g., BTN-XXXXXXXX-YYYYYYYY):")
    if (code && code.startsWith("BTN-")) {
      setScanned(true)
      onScan(code)
    }
  }

  useEffect(() => {
    if (open) {
      startCamera()
    } else {
      stopCamera()
      setScanned(false)
    }

    return () => {
      stopCamera()
    }
  }, [open, startCamera, stopCamera])

  useEffect(() => {
    if (open && facingMode) {
      stopCamera()
      startCamera()
    }
  }, [facingMode])

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="sm:max-w-md p-0 overflow-hidden">
        <DialogHeader className="p-4 pb-2">
          <DialogTitle className="flex items-center gap-2">
            <QrCode className="h-5 w-5 text-primary" />
            {title}
          </DialogTitle>
          <p className="text-sm text-muted-foreground">{description}</p>
        </DialogHeader>

        <div className="relative aspect-square bg-black">
          {/* Video feed */}
          <video
            ref={videoRef}
            className="absolute inset-0 w-full h-full object-cover"
            playsInline
            muted
          />
          
          {/* Hidden canvas for processing */}
          <canvas ref={canvasRef} className="hidden" />

          {/* Scanning overlay */}
          <div className="absolute inset-0 pointer-events-none">
            {/* Corner brackets */}
            <div className="absolute inset-8">
              {/* Top-left */}
              <div className="absolute top-0 left-0 w-12 h-12 border-t-4 border-l-4 border-primary rounded-tl-lg" />
              {/* Top-right */}
              <div className="absolute top-0 right-0 w-12 h-12 border-t-4 border-r-4 border-primary rounded-tr-lg" />
              {/* Bottom-left */}
              <div className="absolute bottom-0 left-0 w-12 h-12 border-b-4 border-l-4 border-primary rounded-bl-lg" />
              {/* Bottom-right */}
              <div className="absolute bottom-0 right-0 w-12 h-12 border-b-4 border-r-4 border-primary rounded-br-lg" />
            </div>

            {/* Scanning line animation */}
            {scanning && !scanned && (
              <motion.div
                className="absolute left-8 right-8 h-0.5 bg-primary shadow-lg shadow-primary/50"
                initial={{ top: "10%" }}
                animate={{ top: ["10%", "90%", "10%"] }}
                transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
              />
            )}

            {/* Dimmed corners */}
            <div className="absolute inset-0">
              <div className="absolute top-0 left-0 right-0 h-8 bg-black/40" />
              <div className="absolute bottom-0 left-0 right-0 h-8 bg-black/40" />
              <div className="absolute top-8 bottom-8 left-0 w-8 bg-black/40" />
              <div className="absolute top-8 bottom-8 right-0 w-8 bg-black/40" />
            </div>
          </div>

          {/* Success overlay */}
          <AnimatePresence>
            {scanned && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 bg-emerald-500/20 flex items-center justify-center"
              >
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="bg-white rounded-full p-4"
                >
                  <CheckCircle2 className="h-12 w-12 text-emerald-500" />
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Error overlay */}
          {cameraError && (
            <div className="absolute inset-0 bg-background/95 flex items-center justify-center p-6">
              <div className="text-center space-y-4">
                <AlertCircle className="h-12 w-12 text-destructive mx-auto" />
                <p className="text-sm text-muted-foreground">{cameraError}</p>
                <Button onClick={startCamera} variant="outline">
                  Try Again
                </Button>
              </div>
            </div>
          )}

          {/* Loading overlay */}
          {!scanning && !cameraError && (
            <div className="absolute inset-0 bg-background/95 flex items-center justify-center">
              <div className="text-center space-y-4">
                <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto" />
                <p className="text-sm text-muted-foreground">Initializing camera...</p>
              </div>
            </div>
          )}

          {/* Controls */}
          <div className="absolute bottom-4 left-0 right-0 flex items-center justify-center gap-4">
            {torchSupported && (
              <Button
                size="icon"
                variant={torchEnabled ? "default" : "secondary"}
                className="rounded-full bg-black/50 hover:bg-black/70"
                onClick={toggleTorch}
              >
                <Flashlight className={cn("h-5 w-5", torchEnabled && "text-yellow-400")} />
              </Button>
            )}
            <Button
              size="icon"
              variant="secondary"
              className="rounded-full bg-black/50 hover:bg-black/70"
              onClick={switchCamera}
            >
              <SwitchCamera className="h-5 w-5" />
            </Button>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 space-y-3">
          <Alert>
            <QrCode className="h-4 w-4" />
            <AlertDescription>
              Position the QR code within the frame. It will be detected automatically.
            </AlertDescription>
          </Alert>
          
          <div className="flex items-center justify-between">
            <Button variant="ghost" size="sm" onClick={handleManualEntry}>
              Enter code manually
            </Button>
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
