"use client"

import React, { useState, useRef, useCallback } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Camera, ImageIcon, Upload, X, Loader2, AlertCircle } from "lucide-react"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { toast } from "@/hooks/use-toast"


interface MobileImageUploadProps {
  images: string[]
  maxImages?: number
  onImagesChange: (images: string[]) => void
  uploadEndpoint?: string
  uploadType?: string
  className?: string
  disabled?: boolean
}

// Compress image for mobile uploads
async function compressImage(file: File, maxWidth = 1200, quality = 0.8): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = document.createElement('img')
    img.crossOrigin = 'anonymous'
    
    img.onload = () => {
      URL.revokeObjectURL(img.src)
      const canvas = document.createElement('canvas')
      let { width, height } = img
      
      // Scale down if needed
      if (width > maxWidth) {
        height = (height * maxWidth) / width
        width = maxWidth
      }
      
      canvas.width = width
      canvas.height = height
      
      const ctx = canvas.getContext('2d')
      if (!ctx) {
        reject(new Error('Could not get canvas context'))
        return
      }
      
      // Use white background for transparency
      ctx.fillStyle = '#FFFFFF'
      ctx.fillRect(0, 0, width, height)
      ctx.drawImage(img, 0, 0, width, height)
      
      canvas.toBlob(
        (blob) => {
          if (blob) {
            resolve(blob)
          } else {
            reject(new Error('Failed to compress image'))
          }
        },
        'image/jpeg',
        quality
      )
    }
    
    img.onerror = () => {
      URL.revokeObjectURL(img.src)
      reject(new Error('Failed to load image for compression'))
    }
    
    img.src = URL.createObjectURL(file)
  })
}

// Detect if running on mobile device
function isMobileDevice(): boolean {
  if (typeof window === 'undefined') return false
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
}

export function MobileImageUpload({
  images,
  maxImages = 6,
  onImagesChange,
  uploadEndpoint = "/api/upload",
  uploadType = "listing",
  className,
  disabled = false,
}: MobileImageUploadProps) {
  const [isUploading, setIsUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState<Record<string, number>>({})
  const [uploadErrors, setUploadErrors] = useState<string[]>([])
  const fileInputRef = useRef<HTMLInputElement>(null)
  const cameraInputRef = useRef<HTMLInputElement>(null)

  const remainingSlots = maxImages - images.length

  const handleFileSelect = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0) return

    // Reset input value so the same file can be selected again
    e.target.value = ''

    const filesToUpload = Array.from(files).slice(0, remainingSlots)

    if (filesToUpload.length === 0) {
      toast({
        title: "Maximum images reached",
        description: `You can upload up to ${maxImages} images`,
        variant: "destructive",
      })
      return
    }

    setIsUploading(true)
    setUploadErrors([])
    const uploadedUrls: string[] = []
    const errors: string[] = []

    for (let i = 0; i < filesToUpload.length; i++) {
      const file = filesToUpload[i]
      const fileId = `file-${i}-${Date.now()}`
      
      // Validate file type - be lenient for mobile devices
      const validTypes = [
        'image/jpeg', 'image/jpg', 'image/png', 'image/webp', 
        'image/gif', 'image/heic', 'image/heif', 'image/bmp'
      ]
      const isValidType = validTypes.includes(file.type.toLowerCase()) || 
        file.name.match(/\.(jpg|jpeg|png|webp|gif|heic|heif|bmp)$/i)
      
      if (!isValidType) {
        errors.push(`${file.name}: Unsupported format. Use JPG, PNG, or WebP.`)
        continue
      }

      // Validate file size (15MB max before compression - generous for mobile)
      if (file.size > 15 * 1024 * 1024) {
        errors.push(`${file.name}: File too large. Maximum 15MB allowed.`)
        continue
      }

      try {
        setUploadProgress(prev => ({ ...prev, [fileId]: 10 }))

        // Compress image if over 1MB
        let fileToUpload: File | Blob = file
        if (file.size > 1024 * 1024) {
          try {
            setUploadProgress(prev => ({ ...prev, [fileId]: 30 }))
            fileToUpload = await compressImage(file, 1200, 0.85)
            setUploadProgress(prev => ({ ...prev, [fileId]: 50 }))
          } catch (compressionError) {
            console.warn('Compression failed, using original file:', compressionError)
            fileToUpload = file
          }
        }

        setUploadProgress(prev => ({ ...prev, [fileId]: 60 }))

        const formData = new FormData()
        formData.append("file", fileToUpload, file.name.replace(/\.[^/.]+$/, '.jpg'))
        formData.append("type", uploadType)

        const response = await fetch(uploadEndpoint, {
          method: "POST",
          body: formData,
        })

        setUploadProgress(prev => ({ ...prev, [fileId]: 90 }))

        if (!response.ok) {
          const data = await response.json().catch(() => ({}))
          throw new Error(data.error || `Upload failed (${response.status})`)
        }

        const data = await response.json()
        uploadedUrls.push(data.url)
        setUploadProgress(prev => ({ ...prev, [fileId]: 100 }))

        // Show success for each upload
        toast({
          title: "Image uploaded",
          description: `${i + 1}/${filesToUpload.length} uploaded successfully`,
        })
      } catch (error) {
        const message = error instanceof Error ? error.message : "Upload failed"
        errors.push(`${file.name}: ${message}`)
        setUploadProgress(prev => {
          const newProgress = { ...prev }
          delete newProgress[fileId]
          return newProgress
        })
      }
    }

    if (uploadedUrls.length > 0) {
      onImagesChange([...images, ...uploadedUrls])
    }

    if (errors.length > 0) {
      setUploadErrors(errors)
      toast({
        title: "Some uploads failed",
        description: `${uploadedUrls.length} of ${filesToUpload.length} images uploaded`,
        variant: "destructive",
      })
    }

    setIsUploading(false)
    setUploadProgress({})
  }, [images, maxImages, onImagesChange, remainingSlots, uploadEndpoint, uploadType])

  const removeImage = useCallback((index: number) => {
    const newImages = images.filter((_, i) => i !== index)
    onImagesChange(newImages)
  }, [images, onImagesChange])

  const openCamera = useCallback(() => {
    cameraInputRef.current?.click()
  }, [])

  const openGallery = useCallback(() => {
    fileInputRef.current?.click()
  }, [])

  const isMobile = isMobileDevice()

  return (
    <div className={cn("space-y-4", className)}>
      {/* Hidden file inputs */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*,.heic,.heif"
        multiple
        onChange={handleFileSelect}
        className="hidden"
        disabled={disabled || isUploading || remainingSlots <= 0}
      />
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleFileSelect}
        className="hidden"
        disabled={disabled || isUploading || remainingSlots <= 0}
      />

      {/* Image Grid */}
      <div className="grid grid-cols-3 gap-2">
        {/* Uploaded images */}
        {images.map((url, index) => (
          <motion.div
            key={url}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className="relative aspect-square rounded-xl overflow-hidden bg-muted group"
          >
                   <Image
              src={url || "/placeholder.svg"}
              alt={`Upload ${index + 1}`}
              fill
              className="object-cover"
            />

            {index === 0 && (
              <div className="absolute top-1 left-1 px-1.5 py-0.5 rounded-md bg-primary text-primary-foreground text-[10px] font-medium">
                Cover
              </div>
            )}
            <button
              onClick={() => removeImage(index)}
              className="absolute top-1 right-1 w-6 h-6 rounded-full bg-background/80 backdrop-blur-sm flex items-center justify-center text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
              disabled={isUploading}
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </motion.div>
        ))}

        {/* Upload progress indicators */}
        <AnimatePresence>
          {Object.entries(uploadProgress).map(([id, progress]) => (
            <motion.div
              key={id}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              className="relative aspect-square rounded-xl overflow-hidden bg-muted/50 flex items-center justify-center"
            >
              <div className="relative">
                <svg className="w-12 h-12 transform -rotate-90">
                  <circle
                    cx="24"
                    cy="24"
                    r="20"
                    stroke="currentColor"
                    strokeWidth="4"
                    fill="none"
                    className="text-muted"
                  />
                  <circle
                    cx="24"
                    cy="24"
                    r="20"
                    stroke="currentColor"
                    strokeWidth="4"
                    fill="none"
                    strokeDasharray={125.6}
                    strokeDashoffset={125.6 - (progress / 100) * 125.6}
                    className="text-primary transition-all duration-300"
                  />
                </svg>
                <span className="absolute inset-0 flex items-center justify-center text-xs font-medium">
                  {progress}%
                </span>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {/* Add more button */}
        {remainingSlots > 0 && !isUploading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="aspect-square"
          >
            {isMobile ? (
              <div className="h-full grid grid-cols-2 gap-1">
                <button
                  onClick={openCamera}
                  disabled={disabled}
                  className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-border hover:border-primary/50 hover:bg-primary/5 transition-all"
                >
                  <Camera className="h-5 w-5 text-muted-foreground mb-1" />
                  <span className="text-[9px] text-muted-foreground">Camera</span>
                </button>
                <button
                  onClick={openGallery}
                  disabled={disabled}
                  className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-border hover:border-primary/50 hover:bg-primary/5 transition-all"
                >
                  <ImageIcon className="h-5 w-5 text-muted-foreground mb-1" />
                  <span className="text-[9px] text-muted-foreground">Gallery</span>
                </button>
              </div>
            ) : (
              <button
                onClick={openGallery}
                disabled={disabled}
                className="w-full h-full flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-border hover:border-primary/50 hover:bg-primary/5 transition-all"
              >
                <Upload className="h-6 w-6 text-muted-foreground mb-1" />
                <span className="text-xs text-muted-foreground">Add Photo</span>
                <span className="text-[10px] text-muted-foreground/70">{remainingSlots} left</span>
              </button>
            )}
          </motion.div>
        )}
      </div>

      {/* Upload errors */}
      <AnimatePresence>
        {uploadErrors.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="p-3 rounded-xl bg-destructive/10 border border-destructive/20"
          >
            <div className="flex items-start gap-2">
              <AlertCircle className="h-4 w-4 text-destructive flex-shrink-0 mt-0.5" />
              <div className="flex-1 space-y-1">
                {uploadErrors.map((error, i) => (
                  <p key={i} className="text-xs text-destructive">
                    {error}
                  </p>
                ))}
              </div>
              <button
                onClick={() => setUploadErrors([])}
                className="text-muted-foreground hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Loading state */}
      {isUploading && (
        <div className="flex items-center justify-center gap-2 py-2">
          <Loader2 className="h-4 w-4 animate-spin text-primary" />
          <span className="text-sm text-muted-foreground">Uploading images...</span>
        </div>
      )}

      {/* Helper text */}
      {!isUploading && images.length === 0 && (
        <p className="text-xs text-muted-foreground text-center">
          {isMobile 
            ? "Tap Camera to take a photo or Gallery to choose from your device"
            : "Click to upload images. First image will be the cover photo."}
        </p>
      )}
    </div>
  )
}
