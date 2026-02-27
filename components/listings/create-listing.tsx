"use client"

import React from "react"

import { useState, useMemo } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { ArrowLeft, ArrowRight, Smartphone, Car, PiggyBank, MapPin, Wrench, Package, Upload, X, Loader2, Check, Info, Plus, Trash2, AlertCircle, Sparkles, Camera, CheckCircle2, FileText, Wallet, Shield, Star, Zap, Eye, TrendingUp, Crown, Flame, Building2, Home, TreePine, Factory, Tractor, Gauge, Fuel, Palette, Calendar, Hash, Ruler, FileCheck, Mountain, Droplets, Fence, Users, Award, Battery, HardDrive, Monitor, Cog as Cow, Bird, Dog } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useRouter } from "next/navigation"
import { useWallet } from "@/contexts/wallet-context"
import { useAuth } from "@/contexts/auth-context"
import { cn } from "@/lib/utils"
import { toast } from "@/hooks/use-toast"
import Image from "next/image"
import { Switch } from "@/components/ui/switch"
import { MobileImageUpload } from "@/components/ui/mobile-image-upload"
import { InsufficientCreditModal } from "@/components/wallet/insufficient-credit-modal"

// Enhanced categories with better icons and descriptions
const categories = [
  { 
    id: "electronics", 
    label: "Electronics", 
    icon: Smartphone, 
    description: "Phones, laptops, TVs",
    color: "from-blue-500 to-cyan-500",
    bgColor: "bg-blue-500/10",
    textColor: "text-blue-500"
  },
  { 
    id: "vehicles", 
    label: "Vehicles", 
    icon: Car, 
    description: "Cars, trucks, bikes",
    color: "from-orange-500 to-amber-500",
    bgColor: "bg-orange-500/10",
    textColor: "text-orange-500"
  },
  { 
    id: "livestock", 
    label: "Livestock", 
    icon: PiggyBank, 
    description: "Cattle, goats, poultry",
    color: "from-green-500 to-emerald-500",
    bgColor: "bg-green-500/10",
    textColor: "text-green-500"
  },
  { 
    id: "land", 
    label: "Land", 
    icon: MapPin, 
    description: "Plots, farms, property",
    color: "from-amber-600 to-yellow-500",
    bgColor: "bg-amber-500/10",
    textColor: "text-amber-600"
  },
  { 
    id: "services", 
    label: "Services", 
    icon: Wrench, 
    description: "Skills and labor",
    color: "from-purple-500 to-pink-500",
    bgColor: "bg-purple-500/10",
    textColor: "text-purple-500"
  },
  { 
    id: "goods", 
    label: "Other Goods", 
    icon: Package, 
    description: "Furniture, appliances",
    color: "from-slate-500 to-zinc-500",
    bgColor: "bg-slate-500/10",
    textColor: "text-slate-500"
  },
]

// Vehicle types with icons
const vehicleTypes = [
  { id: "sedan", label: "Sedan", icon: Car },
  { id: "hatchback", label: "Hatchback", icon: Car },
  { id: "suv", label: "SUV", icon: Car },
  { id: "mpv", label: "MPV", icon: Car },
  { id: "truck", label: "Truck", icon: Car },
  { id: "pickup", label: "Pickup", icon: Car },
  { id: "van", label: "Van", icon: Car },
  { id: "coupe", label: "Coupe", icon: Car },
  { id: "convertible", label: "Convertible", icon: Car },
  { id: "wagon", label: "Wagon", icon: Car },
  { id: "motorcycle", label: "Motorcycle", icon: Car },
  { id: "other", label: "Other", icon: Car },
]

const fuelTypes = [
  { id: "petrol", label: "Petrol" },
  { id: "diesel", label: "Diesel" },
  { id: "electric", label: "Electric" },
  { id: "hybrid", label: "Hybrid" },
  { id: "lpg", label: "LPG" },
  { id: "other", label: "Other" },
]

const transmissionTypes = [
  { id: "manual", label: "Manual" },
  { id: "automatic", label: "Automatic" },
  { id: "cvt", label: "CVT" },
  { id: "dct", label: "DCT" },
  { id: "other", label: "Other" },
]

// Land types with icons
const landTypes = [
  { id: "commercial", label: "Commercial Land", icon: Building2, description: "Business & retail plots" },
  { id: "residential", label: "Residential Land", icon: Home, description: "Housing & living plots" },
  { id: "communal", label: "Communal Land", icon: Users, description: "Traditional authority land" },
  { id: "agricultural", label: "Agricultural Land", icon: Tractor, description: "Farming & crop land" },
  { id: "industrial", label: "Industrial Land", icon: Factory, description: "Manufacturing zones" },
  { id: "mixed_use", label: "Mixed Use", icon: Building2, description: "Multi-purpose land" },
]

// Electronics types
const electronicsTypes = [
  { id: "smartphone", label: "Smartphone", icon: Smartphone },
  { id: "laptop", label: "Laptop", icon: Monitor },
  { id: "tablet", label: "Tablet", icon: Monitor },
  { id: "desktop", label: "Desktop PC", icon: Monitor },
  { id: "tv", label: "Television", icon: Monitor },
  { id: "gaming_console", label: "Gaming Console", icon: Monitor },
  { id: "camera", label: "Camera", icon: Camera },
  { id: "audio", label: "Audio Equipment", icon: Monitor },
  { id: "appliance", label: "Appliance", icon: Package },
  { id: "other", label: "Other", icon: Package },
]

// Livestock types
const livestockTypes = [
  { id: "cattle", label: "Cattle", icon: Cow },
  { id: "goats", label: "Goats", icon: PiggyBank },
  { id: "sheep", label: "Sheep", icon: PiggyBank },
  { id: "pigs", label: "Pigs", icon: PiggyBank },
  { id: "poultry", label: "Poultry", icon: Bird },
  { id: "horses", label: "Horses", icon: Dog },
  { id: "donkeys", label: "Donkeys", icon: Dog },
  { id: "other", label: "Other", icon: PiggyBank },
]

const namibiaRegions = [
  "Erongo",
  "Hardap",
  "Karas",
  "Kavango East",
  "Kavango West",
  "Khomas",
  "Kunene",
  "Ohangwena",
  "Omaheke",
  "Omusati",
  "Oshana",
  "Oshikoto",
  "Otjozondjupa",
  "Zambezi",
]

const conditions = ["New", "Like New", "Good", "Fair", "For Parts"]

// Popular car makes in Namibia
const carMakes = [
  "Toyota", "Volkswagen", "Ford", "Nissan", "BMW", "Mercedes-Benz", "Audi", 
  "Honda", "Mazda", "Hyundai", "Kia", "Isuzu", "Mitsubishi", "Suzuki",
  "Chevrolet", "Jeep", "Land Rover", "Lexus", "Subaru", "Volvo", "Other"
]

// Common vehicle colors
const vehicleColors = [
  "White", "Black", "Silver", "Grey", "Blue", "Red", "Brown", "Green", 
  "Gold", "Orange", "Yellow", "Purple", "Beige", "Other"
]

interface WantedItem {
  description: string
  estimatedValue: string
  isFlexible: boolean
}

interface VehicleDetails {
  vehicleType: string
  make: string
  model: string
  yearModel: string
  color: string
  mileage: string
  fuelType: string
  transmission: string
  engineSize: string
  serviceHistory: boolean
  accidentFree: boolean
}

interface LandDetails {
  landType: string
  sizeSqm: string
  hasTitleDeed: boolean
  titleDeedNumber: string
  isServiced: boolean
  villageName: string // For communal land
  region: string // For communal land
  traditionalAuthority: string // For communal land
  chiefName: string // For communal land
  communalCertificate: boolean // For communal land
  topography: string
  roadAccess: string
  waterSource: string
  electricitySource: string
  fencing: string
  nearestTown: string
  distanceToTown: string
}

interface ElectronicsDetails {
  electronicsType: string
  brand: string
  model: string
  storageCapacity: string
  ramSize: string
  screenSize: string
  batteryHealth: string
  color: string
  warrantyStatus: string
  originalAccessories: boolean
}

interface LivestockDetails {
  livestockType: string
  breed: string
  quantity: string
  gender: string
  ageMonths: string
  weightKg: string
  isVaccinated: boolean
  healthCertificate: boolean
  brandMark: string
}

interface ListingFormData {
  category: string
  title: string
  description: string
  value: string
  condition: string
  region: string
  city: string
  images: string[]
  acceptsPartialWallet: boolean
  willingToTravel: boolean
  wantedItems: WantedItem[]
  // Feature toggles
  isFeatured: boolean
  isHighlighted: boolean
  isPrioritySearch: boolean
  // Category-specific details
  vehicleDetails: VehicleDetails
  landDetails: LandDetails
  electronicsDetails: ElectronicsDetails
  livestockDetails: LivestockDetails
}

const FEATURE_PRICE = 100 // N$100 for each feature

export function CreateListing() {
  const router = useRouter()
  const { balance, refreshBalance } = useWallet()
  const { user } = useAuth()
  const [step, setStep] = useState(1)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  const [errorMessage, setErrorMessage] = useState("")
  const [isUploading, setIsUploading] = useState(false)
  const fileInputRef = React.useRef<HTMLInputElement>(null)
  const [formData, setFormData] = useState<ListingFormData>({
    category: "",
    title: "",
    description: "",
    value: "",
    condition: "",
    region: "",
    city: "",
    images: [],
    acceptsPartialWallet: true,
    willingToTravel: false,
    wantedItems: [],
    // Feature toggles
    isFeatured: false,
    isHighlighted: false,
    isPrioritySearch: false,
    // Category-specific details
    vehicleDetails: {
      vehicleType: "",
      make: "",
      model: "",
      yearModel: "",
      color: "",
      mileage: "",
      fuelType: "",
      transmission: "",
      engineSize: "",
      serviceHistory: false,
      accidentFree: true,
    },
    landDetails: {
      landType: "",
      sizeSqm: "",
      hasTitleDeed: false,
      titleDeedNumber: "",
      isServiced: false,
      villageName: "",
      region: "",
      traditionalAuthority: "",
      chiefName: "",
      communalCertificate: false,
      topography: "",
      roadAccess: "",
      waterSource: "",
      electricitySource: "",
      fencing: "",
      nearestTown: "",
      distanceToTown: "",
    },
    electronicsDetails: {
      electronicsType: "",
      brand: "",
      model: "",
      storageCapacity: "",
      ramSize: "",
      screenSize: "",
      batteryHealth: "",
      color: "",
      warrantyStatus: "",
      originalAccessories: false,
    },
    livestockDetails: {
      livestockType: "",
      breed: "",
      quantity: "1",
      gender: "",
      ageMonths: "",
      weightKg: "",
      isVaccinated: false,
      healthCertificate: false,
      brandMark: "",
    },
  })

  const handleChange = (field: keyof ListingFormData, value: string | boolean | string[] | WantedItem[]) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
    setErrorMessage("")
  }

  const handleVehicleChange = (field: keyof VehicleDetails, value: string | boolean) => {
    setFormData((prev) => ({
      ...prev,
      vehicleDetails: { ...prev.vehicleDetails, [field]: value },
    }))
  }

  const handleLandChange = (field: keyof LandDetails, value: string | boolean) => {
    setFormData((prev) => ({
      ...prev,
      landDetails: { ...prev.landDetails, [field]: value },
    }))
  }

  const handleElectronicsChange = (field: keyof ElectronicsDetails, value: string | boolean) => {
    setFormData((prev) => ({
      ...prev,
      electronicsDetails: { ...prev.electronicsDetails, [field]: value },
    }))
  }

  const handleLivestockChange = (field: keyof LivestockDetails, value: string | boolean) => {
    setFormData((prev) => ({
      ...prev,
      livestockDetails: { ...prev.livestockDetails, [field]: value },
    }))
  }

  // Wanted items handlers
  const addWantedItem = () => {
    if (formData.wantedItems.length >= 5) return
    setFormData((prev) => ({
      ...prev,
      wantedItems: [...prev.wantedItems, { description: "", estimatedValue: "", isFlexible: true }],
    }))
  }

  const updateWantedItem = (index: number, field: keyof WantedItem, value: string | boolean) => {
    setFormData((prev) => ({
      ...prev,
      wantedItems: prev.wantedItems.map((item, i) => (i === index ? { ...item, [field]: value } : item)),
    }))
  }

  const removeWantedItem = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      wantedItems: prev.wantedItems.filter((_, i) => i !== index),
    }))
  }

  // Calculate listing fee based on value
  const listingFee = useMemo(() => {
    const value = Number.parseFloat(formData.value) || 0
    if (value >= 100000) return 100
    if (value >= 40000) return 30
    if (value >= 20000) return 15
    return 5
  }, [formData.value])

  // Calculate feature fees
  const featureFees = useMemo(() => {
    let total = 0
    if (formData.isFeatured) total += FEATURE_PRICE
    if (formData.isHighlighted) total += FEATURE_PRICE
    if (formData.isPrioritySearch) total += FEATURE_PRICE
    return total
  }, [formData.isFeatured, formData.isHighlighted, formData.isPrioritySearch])

  const totalFee = listingFee + featureFees
  const canAffordFee = balance >= totalFee

  const handleSubmit = async () => {
    if (!canAffordFee) return
    if (!user) {
      setErrorMessage("You must be logged in to create a listing")
      return
    }

    setIsSubmitting(true)
    setErrorMessage("")

    try {
      // Prepare wanted items for API
      const wantedItemsPayload = formData.wantedItems
        .filter((item) => item.description.trim())
        .map((item) => ({
          description: item.description.trim(),
          estimatedValue: item.estimatedValue ? Number.parseFloat(item.estimatedValue) : null,
          isFlexible: item.isFlexible,
        }))

      // Build trade preferences string
      const tradePrefs: string[] = []
      if (formData.acceptsPartialWallet) tradePrefs.push("accepts_wallet")
      if (formData.willingToTravel) tradePrefs.push("willing_to_travel")

      // Prepare category-specific details
      let categoryDetails = {}
      if (formData.category === "vehicles") {
        categoryDetails = { vehicleDetails: formData.vehicleDetails }
      } else if (formData.category === "land") {
        categoryDetails = { landDetails: formData.landDetails }
      } else if (formData.category === "electronics") {
        categoryDetails = { electronicsDetails: formData.electronicsDetails }
      } else if (formData.category === "livestock") {
        categoryDetails = { livestockDetails: formData.livestockDetails }
      }

      const response = await fetch("/api/listings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: formData.title.trim(),
          description: formData.description.trim(),
          category: formData.category,
          type: formData.category === "services" ? "service" : "item",
          value: Number.parseFloat(formData.value),
          condition: formData.condition,
          region: formData.region,
          town: formData.city.trim() || null,
          images: formData.images,
          tradePreferences: tradePrefs.join(","),
          wantedItems: wantedItemsPayload,
          // Feature toggles
          isFeatured: formData.isFeatured,
          isHighlighted: formData.isHighlighted,
          isPrioritySearch: formData.isPrioritySearch,
          featureChargePaid: featureFees,
          // Category-specific details
          ...categoryDetails,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to create listing")
      }

      setIsSuccess(true)
      toast({
        title: "Listing created successfully!",
        description: `Your listing "${formData.title}" is now live.`,
      })

      // Refresh wallet balance (listing fee was deducted)
      refreshBalance()

      setTimeout(() => {
        router.push("/dashboard/listings")
      }, 1500)
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to create listing"
      setErrorMessage(message)
      toast({
        title: "Error creating listing",
        description: message,
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  // Compress image for mobile uploads
  const compressImage = async (file: File, maxWidth = 1200, quality = 0.8): Promise<Blob> => {
    return new Promise((resolve, reject) => {
      const img = document.createElement('img')
      img.onload = () => {
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
      img.onerror = () => reject(new Error('Failed to load image'))
      img.src = URL.createObjectURL(file)
    })
  }

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0) return

    const remainingSlots = 6 - formData.images.length
    const filesToUpload = Array.from(files).slice(0, remainingSlots)

    if (filesToUpload.length === 0) {
      toast({
        title: "Maximum images reached",
        description: "You can upload up to 6 images per listing",
        variant: "destructive",
      })
      return
    }

    setIsUploading(true)
    const uploadedUrls: string[] = []
    let uploadCount = 0

    for (const file of filesToUpload) {
      // Validate file type - be more lenient for mobile
      const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif', 'image/heic', 'image/heif']
      const isValidType = validTypes.includes(file.type.toLowerCase()) || file.name.match(/\.(jpg|jpeg|png|webp|gif|heic|heif)$/i)
      
      if (!isValidType) {
        toast({
          title: "Invalid file type",
          description: `${file.name} is not a supported image format. Use JPG, PNG, or WebP.`,
          variant: "destructive",
        })
        continue
      }

      // Validate file size (10MB max before compression)
      if (file.size > 10 * 1024 * 1024) {
        toast({
          title: "File too large",
          description: `${file.name} exceeds 10MB. Please choose a smaller image.`,
          variant: "destructive",
        })
        continue
      }

      try {
        // Compress large images (over 1MB) for mobile
        let fileToUpload: File | Blob = file
        if (file.size > 1024 * 1024) {
          try {
            fileToUpload = await compressImage(file)
          } catch {
            // If compression fails, use original file
            fileToUpload = file
          }
        }

        const formDataUpload = new FormData()
        formDataUpload.append("file", fileToUpload, file.name)
        formDataUpload.append("type", "listing")

        const response = await fetch("/api/upload", {
          method: "POST",
          body: formDataUpload,
        })

        if (!response.ok) {
          const data = await response.json()
          throw new Error(data.error || "Upload failed")
        }

        const data = await response.json()
        uploadedUrls.push(data.url)
        uploadCount++
        
        // Show progress toast for each successful upload
        toast({
          title: `Uploaded ${uploadCount}/${filesToUpload.length}`,
          description: `${file.name} uploaded successfully`,
        })
      } catch (error) {
        const message = error instanceof Error ? error.message : "Upload failed"
        toast({
          title: "Upload failed",
          description: `${file.name}: ${message}`,
          variant: "destructive",
        })
      }
    }

    if (uploadedUrls.length > 0) {
      handleChange("images", [...formData.images, ...uploadedUrls])
      toast({
        title: "Upload complete",
        description: `${uploadedUrls.length} image${uploadedUrls.length > 1 ? "s" : ""} added to your listing`,
      })
    }

    setIsUploading(false)
    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  const triggerFileInput = () => {
    fileInputRef.current?.click()
  }

  const removeImage = (index: number) => {
    handleChange(
      "images",
      formData.images.filter((_, i) => i !== index),
    )
  }

  const isStep1Valid = formData.category !== ""
  const isStep2Valid = formData.title.length >= 3 && formData.description.length >= 10 && formData.value && Number.parseFloat(formData.value) > 0 && formData.condition
  const isStep3Valid = formData.region && formData.images.length > 0

  // Step configuration for enterprise stepper
  const steps = [
    { number: 1, title: "Category", subtitle: "Select type", icon: Package },
    { number: 2, title: "Details", subtitle: "Item info", icon: FileText },
    { number: 3, title: "Media", subtitle: "Photos & location", icon: Camera },
    { number: 4, title: "Boost", subtitle: "Get seen", icon: Zap },
    { number: 5, title: "Review", subtitle: "Confirm & pay", icon: CheckCircle2 },
  ]

  const totalSteps = 5

  // Get selected category details
  const selectedCategory = categories.find(c => c.id === formData.category)

  return (
    <div className="max-w-3xl mx-auto">
      {/* Enterprise Header */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative mb-8"
      >
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => (step > 1 ? setStep(step - 1) : router.back())}
              className="rounded-full hover:bg-primary/10"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-foreground flex items-center gap-2">
                Create New Listing
                <Sparkles className="h-5 w-5 text-primary" />
              </h1>
              <p className="text-muted-foreground">List your item for trade in minutes</p>
            </div>
          </div>
          
          {/* Wallet Preview */}
          <div className="hidden sm:flex items-center gap-2 px-4 py-2 rounded-xl bg-muted/50 border border-border">
            <Wallet className="h-4 w-4 text-primary" />
            <span className="text-sm text-muted-foreground">Balance:</span>
            <span className="font-semibold text-foreground">N$ {balance.toFixed(2)}</span>
          </div>
        </div>

        {/* Enterprise Step Indicator */}
        <div className="relative">
          <div className="flex items-center justify-between">
            {steps.map((s, index) => (
              <div key={s.number} className="flex flex-col items-center relative z-10">
                <motion.div
                  initial={false}
                  animate={{
                    scale: step === s.number ? 1.1 : 1,
                    backgroundColor: step >= s.number ? "hsl(var(--primary))" : "hsl(var(--muted))"
                  }}
                  className={cn(
                    "w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center transition-all shadow-lg",
                    step >= s.number ? "bg-primary text-primary-foreground shadow-primary/30" : "bg-muted text-muted-foreground"
                  )}
                >
                  {step > s.number ? (
                    <Check className="h-4 w-4 sm:h-5 sm:w-5" />
                  ) : (
                    <s.icon className="h-4 w-4 sm:h-5 sm:w-5" />
                  )}
                </motion.div>
                <div className="mt-2 text-center">
                  <p className={cn(
                    "text-xs sm:text-sm font-medium",
                    step >= s.number ? "text-foreground" : "text-muted-foreground"
                  )}>
                    {s.title}
                  </p>
                  <p className="text-[10px] sm:text-xs text-muted-foreground hidden sm:block">{s.subtitle}</p>
                </div>
                
                {/* Connector line */}
                {index < steps.length - 1 && (
                  <div className="absolute top-5 sm:top-6 left-[calc(50%+20px)] sm:left-[calc(50%+24px)] w-[calc(100%-40px)] sm:w-[calc(100%-48px)] h-0.5 -z-10">
                    <div 
                      className={cn(
                        "h-full transition-all duration-500",
                        step > s.number ? "bg-primary" : "bg-muted"
                      )}
                      style={{ width: step > s.number ? '100%' : '0%' }}
                    />
                    <div className="absolute inset-0 bg-muted" />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </motion.div>

      <AnimatePresence mode="wait">
        {/* Step 1: Category Selection - Enhanced */}
        {step === 1 && (
          <motion.div
            key="step1"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-6"
          >
            <div>
              <h2 className="text-xl font-semibold text-foreground mb-2">What are you listing?</h2>
              <p className="text-muted-foreground">Select the category that best describes your item</p>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              {categories.map((cat) => (
                <motion.button
                  key={cat.id}
                  onClick={() => handleChange("category", cat.id)}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className={cn(
                    "relative flex flex-col items-center gap-3 p-5 rounded-2xl border-2 transition-all overflow-hidden",
                    formData.category === cat.id
                      ? "border-primary bg-primary/5 shadow-lg shadow-primary/10"
                      : "border-border hover:border-primary/50 bg-card",
                  )}
                >
                  {formData.category === cat.id && (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="absolute top-2 right-2"
                    >
                      <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center">
                        <Check className="h-4 w-4 text-primary-foreground" />
                      </div>
                    </motion.div>
                  )}
                  <div className={cn(
                    "w-14 h-14 rounded-2xl flex items-center justify-center bg-gradient-to-br",
                    cat.color
                  )}>
                    <cat.icon className="h-7 w-7 text-white" />
                  </div>
                  <div className="text-center">
                    <p className={cn(
                      "font-semibold text-base",
                      formData.category === cat.id ? "text-primary" : "text-foreground"
                    )}>
                      {cat.label}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">{cat.description}</p>
                  </div>
                </motion.button>
              ))}
            </div>

            <Button 
              onClick={() => setStep(2)} 
              disabled={!isStep1Valid} 
              className="w-full h-12 rounded-xl bg-gradient-to-r from-primary to-primary/80 text-primary-foreground"
            >
              Continue to Details
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </motion.div>
        )}

        {/* Step 2: Details - Enhanced with Category-Specific Fields */}
        {step === 2 && (
          <motion.div
            key="step2"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-6"
          >
            <div className="flex items-center gap-3">
              {selectedCategory && (
                <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center bg-gradient-to-br", selectedCategory.color)}>
                  <selectedCategory.icon className="h-5 w-5 text-white" />
                </div>
              )}
              <div>
                <h2 className="text-xl font-semibold text-foreground">Listing Details</h2>
                <p className="text-muted-foreground text-sm">Provide information about your {selectedCategory?.label.toLowerCase()}</p>
              </div>
            </div>

            <div className="space-y-5">
              {/* Basic fields for all categories */}
              <div>
                <Label className="text-foreground font-medium">Title</Label>
                <Input
                  value={formData.title}
                  onChange={(e) => handleChange("title", e.target.value)}
                  placeholder={
                    formData.category === "vehicles" ? "e.g., 2020 Toyota Hilux 2.8 GD-6" :
                    formData.category === "land" ? "e.g., 500sqm Residential Plot in Okuryangava" :
                    formData.category === "electronics" ? "e.g., iPhone 14 Pro Max 256GB" :
                    formData.category === "livestock" ? "e.g., 10 Healthy Boer Goats" :
                    "e.g., Item name and key details"
                  }
                  className="mt-2 h-12 bg-muted border-0 rounded-xl"
                />
              </div>

              {/* ===== VEHICLE-SPECIFIC FIELDS ===== */}
              {formData.category === "vehicles" && (
                <div className="space-y-4 p-4 bg-orange-500/5 rounded-2xl border border-orange-500/20">
                  <div className="flex items-center gap-2 text-orange-600 mb-2">
                    <Car className="h-5 w-5" />
                    <span className="font-semibold">Vehicle Details</span>
                  </div>

                  {/* Vehicle Type */}
                  <div>
                    <Label className="text-foreground text-sm">Vehicle Type</Label>
                    <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 mt-2">
                      {vehicleTypes.slice(0, 8).map((type) => (
                        <button
                          key={type.id}
                          type="button"
                          onClick={() => handleVehicleChange("vehicleType", type.id)}
                          className={cn(
                            "px-3 py-2 rounded-lg text-sm font-medium transition-all",
                            formData.vehicleDetails.vehicleType === type.id
                              ? "bg-orange-500 text-white"
                              : "bg-muted hover:bg-muted/80 text-foreground"
                          )}
                        >
                          {type.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    {/* Make */}
                    <div>
                      <Label className="text-foreground text-sm">Make</Label>
                      <Select value={formData.vehicleDetails.make} onValueChange={(v) => handleVehicleChange("make", v)}>
                        <SelectTrigger className="mt-1 h-11 bg-background border-0 rounded-xl">
                          <SelectValue placeholder="Select make" />
                        </SelectTrigger>
                        <SelectContent>
                          {carMakes.map((make) => (
                            <SelectItem key={make} value={make}>{make}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Model */}
                    <div>
                      <Label className="text-foreground text-sm">Model</Label>
                      <Input
                        value={formData.vehicleDetails.model}
                        onChange={(e) => handleVehicleChange("model", e.target.value)}
                        placeholder="e.g., Corolla, Hilux"
                        className="mt-1 h-11 bg-background border-0 rounded-xl"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    {/* Year */}
                    <div>
                      <Label className="text-foreground text-sm flex items-center gap-1">
                        <Calendar className="h-3 w-3" /> Year
                      </Label>
                      <Input
                        type="number"
                        value={formData.vehicleDetails.yearModel}
                        onChange={(e) => handleVehicleChange("yearModel", e.target.value)}
                        placeholder="2020"
                        min="1980"
                        max={new Date().getFullYear() + 1}
                        className="mt-1 h-11 bg-background border-0 rounded-xl"
                      />
                    </div>

                    {/* Color */}
                    <div>
                      <Label className="text-foreground text-sm flex items-center gap-1">
                        <Palette className="h-3 w-3" /> Color
                      </Label>
                      <Select value={formData.vehicleDetails.color} onValueChange={(v) => handleVehicleChange("color", v)}>
                        <SelectTrigger className="mt-1 h-11 bg-background border-0 rounded-xl">
                          <SelectValue placeholder="Color" />
                        </SelectTrigger>
                        <SelectContent>
                          {vehicleColors.map((color) => (
                            <SelectItem key={color} value={color}>{color}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Mileage */}
                    <div>
                      <Label className="text-foreground text-sm flex items-center gap-1">
                        <Gauge className="h-3 w-3" /> Mileage (km)
                      </Label>
                      <Input
                        type="number"
                        value={formData.vehicleDetails.mileage}
                        onChange={(e) => handleVehicleChange("mileage", e.target.value)}
                        placeholder="85000"
                        className="mt-1 h-11 bg-background border-0 rounded-xl"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    {/* Fuel Type */}
                    <div>
                      <Label className="text-foreground text-sm flex items-center gap-1">
                        <Fuel className="h-3 w-3" /> Fuel Type
                      </Label>
                      <Select value={formData.vehicleDetails.fuelType} onValueChange={(v) => handleVehicleChange("fuelType", v)}>
                        <SelectTrigger className="mt-1 h-11 bg-background border-0 rounded-xl">
                          <SelectValue placeholder="Select fuel type" />
                        </SelectTrigger>
                        <SelectContent>
                          {fuelTypes.map((fuel) => (
                            <SelectItem key={fuel.id} value={fuel.id}>{fuel.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Transmission */}
                    <div>
                      <Label className="text-foreground text-sm">Transmission</Label>
                      <Select value={formData.vehicleDetails.transmission} onValueChange={(v) => handleVehicleChange("transmission", v)}>
                        <SelectTrigger className="mt-1 h-11 bg-background border-0 rounded-xl">
                          <SelectValue placeholder="Select transmission" />
                        </SelectTrigger>
                        <SelectContent>
                          {transmissionTypes.map((trans) => (
                            <SelectItem key={trans.id} value={trans.id}>{trans.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {/* Vehicle Checkboxes */}
                  <div className="flex flex-wrap gap-4">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.vehicleDetails.serviceHistory}
                        onChange={(e) => handleVehicleChange("serviceHistory", e.target.checked)}
                        className="h-4 w-4 rounded border-border text-orange-500 focus:ring-orange-500"
                      />
                      <span className="text-sm">Service History</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.vehicleDetails.accidentFree}
                        onChange={(e) => handleVehicleChange("accidentFree", e.target.checked)}
                        className="h-4 w-4 rounded border-border text-orange-500 focus:ring-orange-500"
                      />
                      <span className="text-sm">Accident Free</span>
                    </label>
                  </div>
                </div>
              )}

              {/* ===== LAND-SPECIFIC FIELDS ===== */}
              {formData.category === "land" && (
                <div className="space-y-4 p-4 bg-amber-500/5 rounded-2xl border border-amber-500/20">
                  <div className="flex items-center gap-2 text-amber-600 mb-2">
                    <MapPin className="h-5 w-5" />
                    <span className="font-semibold">Land Details</span>
                  </div>

                  {/* Land Type */}
                  <div>
                    <Label className="text-foreground text-sm">Land Type</Label>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mt-2">
                      {landTypes.map((type) => (
                        <button
                          key={type.id}
                          type="button"
                          onClick={() => handleLandChange("landType", type.id)}
                          className={cn(
                            "flex items-center gap-2 px-3 py-3 rounded-xl text-sm font-medium transition-all text-left",
                            formData.landDetails.landType === type.id
                              ? "bg-amber-500 text-white"
                              : "bg-muted hover:bg-muted/80 text-foreground"
                          )}
                        >
                          <type.icon className="h-4 w-4 flex-shrink-0" />
                          <div>
                            <p className="font-medium text-xs">{type.label}</p>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Communal Land Specific Fields */}
                  {formData.landDetails.landType === "communal" && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      className="space-y-4 p-4 bg-amber-600/10 rounded-xl border border-amber-600/30"
                    >
                      <div className="flex items-center gap-2 text-amber-700">
                        <Users className="h-4 w-4" />
                        <span className="font-semibold text-sm">Communal Land Information</span>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label className="text-foreground text-sm">Village Name</Label>
                          <Input
                            value={formData.landDetails.villageName}
                            onChange={(e) => handleLandChange("villageName", e.target.value)}
                            placeholder="e.g., Oshakati Village"
                            className="mt-1 h-11 bg-background border-0 rounded-xl"
                          />
                        </div>
                        <div>
                          <Label className="text-foreground text-sm">Region</Label>
                          <Select value={formData.landDetails.region} onValueChange={(v) => handleLandChange("region", v)}>
                            <SelectTrigger className="mt-1 h-11 bg-background border-0 rounded-xl">
                              <SelectValue placeholder="Select region" />
                            </SelectTrigger>
                            <SelectContent>
                              {namibiaRegions.map((r) => (
                                <SelectItem key={r} value={r}>{r}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label className="text-foreground text-sm">Traditional Authority</Label>
                          <Input
                            value={formData.landDetails.traditionalAuthority}
                            onChange={(e) => handleLandChange("traditionalAuthority", e.target.value)}
                            placeholder="e.g., Ondonga Traditional Authority"
                            className="mt-1 h-11 bg-background border-0 rounded-xl"
                          />
                        </div>
                        <div>
                          <Label className="text-foreground text-sm">Chief/Headman Name</Label>
                          <Input
                            value={formData.landDetails.chiefName}
                            onChange={(e) => handleLandChange("chiefName", e.target.value)}
                            placeholder="Name of chief or headman"
                            className="mt-1 h-11 bg-background border-0 rounded-xl"
                          />
                        </div>
                      </div>

                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={formData.landDetails.communalCertificate}
                          onChange={(e) => handleLandChange("communalCertificate", e.target.checked)}
                          className="h-4 w-4 rounded border-border text-amber-500 focus:ring-amber-500"
                        />
                        <span className="text-sm">Has Communal Land Certificate</span>
                      </label>
                    </motion.div>
                  )}

                  <div className="grid grid-cols-2 gap-4">
                    {/* Size */}
                    <div>
                      <Label className="text-foreground text-sm flex items-center gap-1">
                        <Ruler className="h-3 w-3" /> Size (sqm)
                      </Label>
                      <Input
                        type="number"
                        value={formData.landDetails.sizeSqm}
                        onChange={(e) => handleLandChange("sizeSqm", e.target.value)}
                        placeholder="500"
                        className="mt-1 h-11 bg-background border-0 rounded-xl"
                      />
                    </div>

                    {/* Nearest Town */}
                    <div>
                      <Label className="text-foreground text-sm">Nearest Town</Label>
                      <Input
                        value={formData.landDetails.nearestTown}
                        onChange={(e) => handleLandChange("nearestTown", e.target.value)}
                        placeholder="e.g., Windhoek"
                        className="mt-1 h-11 bg-background border-0 rounded-xl"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    {/* Water Source */}
                    <div>
                      <Label className="text-foreground text-sm flex items-center gap-1">
                        <Droplets className="h-3 w-3" /> Water Source
                      </Label>
                      <Select value={formData.landDetails.waterSource} onValueChange={(v) => handleLandChange("waterSource", v)}>
                        <SelectTrigger className="mt-1 h-11 bg-background border-0 rounded-xl">
                          <SelectValue placeholder="Select" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="municipal">Municipal</SelectItem>
                          <SelectItem value="borehole">Borehole</SelectItem>
                          <SelectItem value="river">River</SelectItem>
                          <SelectItem value="none">None</SelectItem>
                          <SelectItem value="other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Road Access */}
                    <div>
                      <Label className="text-foreground text-sm">Road Access</Label>
                      <Select value={formData.landDetails.roadAccess} onValueChange={(v) => handleLandChange("roadAccess", v)}>
                        <SelectTrigger className="mt-1 h-11 bg-background border-0 rounded-xl">
                          <SelectValue placeholder="Select" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="tarred">Tarred Road</SelectItem>
                          <SelectItem value="gravel">Gravel Road</SelectItem>
                          <SelectItem value="dirt">Dirt Road</SelectItem>
                          <SelectItem value="none">No Road Access</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {/* Land Checkboxes */}
                  <div className="flex flex-wrap gap-4">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.landDetails.hasTitleDeed}
                        onChange={(e) => handleLandChange("hasTitleDeed", e.target.checked)}
                        className="h-4 w-4 rounded border-border text-amber-500 focus:ring-amber-500"
                      />
                      <span className="text-sm flex items-center gap-1">
                        <FileCheck className="h-3 w-3" /> Has Title Deed
                      </span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.landDetails.isServiced}
                        onChange={(e) => handleLandChange("isServiced", e.target.checked)}
                        className="h-4 w-4 rounded border-border text-amber-500 focus:ring-amber-500"
                      />
                      <span className="text-sm">Serviced (Water/Electricity)</span>
                    </label>
                  </div>
                </div>
              )}

              {/* ===== ELECTRONICS-SPECIFIC FIELDS ===== */}
              {formData.category === "electronics" && (
                <div className="space-y-4 p-4 bg-blue-500/5 rounded-2xl border border-blue-500/20">
                  <div className="flex items-center gap-2 text-blue-600 mb-2">
                    <Smartphone className="h-5 w-5" />
                    <span className="font-semibold">Electronics Details</span>
                  </div>

                  {/* Electronics Type */}
                  <div>
                    <Label className="text-foreground text-sm">Device Type</Label>
                    <div className="grid grid-cols-3 sm:grid-cols-5 gap-2 mt-2">
                      {electronicsTypes.map((type) => (
                        <button
                          key={type.id}
                          type="button"
                          onClick={() => handleElectronicsChange("electronicsType", type.id)}
                          className={cn(
                            "px-3 py-2 rounded-lg text-xs font-medium transition-all",
                            formData.electronicsDetails.electronicsType === type.id
                              ? "bg-blue-500 text-white"
                              : "bg-muted hover:bg-muted/80 text-foreground"
                          )}
                        >
                          {type.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-foreground text-sm">Brand</Label>
                      <Input
                        value={formData.electronicsDetails.brand}
                        onChange={(e) => handleElectronicsChange("brand", e.target.value)}
                        placeholder="e.g., Apple, Samsung"
                        className="mt-1 h-11 bg-background border-0 rounded-xl"
                      />
                    </div>
                    <div>
                      <Label className="text-foreground text-sm">Model</Label>
                      <Input
                        value={formData.electronicsDetails.model}
                        onChange={(e) => handleElectronicsChange("model", e.target.value)}
                        placeholder="e.g., iPhone 14 Pro"
                        className="mt-1 h-11 bg-background border-0 rounded-xl"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <Label className="text-foreground text-sm flex items-center gap-1">
                        <HardDrive className="h-3 w-3" /> Storage
                      </Label>
                      <Input
                        value={formData.electronicsDetails.storageCapacity}
                        onChange={(e) => handleElectronicsChange("storageCapacity", e.target.value)}
                        placeholder="256GB"
                        className="mt-1 h-11 bg-background border-0 rounded-xl"
                      />
                    </div>
                    <div>
                      <Label className="text-foreground text-sm flex items-center gap-1">
                        <Battery className="h-3 w-3" /> Battery
                      </Label>
                      <Input
                        value={formData.electronicsDetails.batteryHealth}
                        onChange={(e) => handleElectronicsChange("batteryHealth", e.target.value)}
                        placeholder="95%"
                        className="mt-1 h-11 bg-background border-0 rounded-xl"
                      />
                    </div>
                    <div>
                      <Label className="text-foreground text-sm flex items-center gap-1">
                        <Palette className="h-3 w-3" /> Color
                      </Label>
                      <Input
                        value={formData.electronicsDetails.color}
                        onChange={(e) => handleElectronicsChange("color", e.target.value)}
                        placeholder="Space Black"
                        className="mt-1 h-11 bg-background border-0 rounded-xl"
                      />
                    </div>
                  </div>

                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.electronicsDetails.originalAccessories}
                      onChange={(e) => handleElectronicsChange("originalAccessories", e.target.checked)}
                      className="h-4 w-4 rounded border-border text-blue-500 focus:ring-blue-500"
                    />
                    <span className="text-sm">Includes Original Accessories (box, charger, etc.)</span>
                  </label>
                </div>
              )}

              {/* ===== LIVESTOCK-SPECIFIC FIELDS ===== */}
              {formData.category === "livestock" && (
                <div className="space-y-4 p-4 bg-green-500/5 rounded-2xl border border-green-500/20">
                  <div className="flex items-center gap-2 text-green-600 mb-2">
                    <PiggyBank className="h-5 w-5" />
                    <span className="font-semibold">Livestock Details</span>
                  </div>

                  {/* Livestock Type */}
                  <div>
                    <Label className="text-foreground text-sm">Animal Type</Label>
                    <div className="grid grid-cols-4 gap-2 mt-2">
                      {livestockTypes.map((type) => (
                        <button
                          key={type.id}
                          type="button"
                          onClick={() => handleLivestockChange("livestockType", type.id)}
                          className={cn(
                            "px-3 py-2 rounded-lg text-sm font-medium transition-all",
                            formData.livestockDetails.livestockType === type.id
                              ? "bg-green-500 text-white"
                              : "bg-muted hover:bg-muted/80 text-foreground"
                          )}
                        >
                          {type.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <Label className="text-foreground text-sm">Breed</Label>
                      <Input
                        value={formData.livestockDetails.breed}
                        onChange={(e) => handleLivestockChange("breed", e.target.value)}
                        placeholder="e.g., Boer Goat"
                        className="mt-1 h-11 bg-background border-0 rounded-xl"
                      />
                    </div>
                    <div>
                      <Label className="text-foreground text-sm flex items-center gap-1">
                        <Hash className="h-3 w-3" /> Quantity
                      </Label>
                      <Input
                        type="number"
                        value={formData.livestockDetails.quantity}
                        onChange={(e) => handleLivestockChange("quantity", e.target.value)}
                        placeholder="1"
                        min="1"
                        className="mt-1 h-11 bg-background border-0 rounded-xl"
                      />
                    </div>
                    <div>
                      <Label className="text-foreground text-sm">Gender</Label>
                      <Select value={formData.livestockDetails.gender} onValueChange={(v) => handleLivestockChange("gender", v)}>
                        <SelectTrigger className="mt-1 h-11 bg-background border-0 rounded-xl">
                          <SelectValue placeholder="Select" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="male">Male</SelectItem>
                          <SelectItem value="female">Female</SelectItem>
                          <SelectItem value="mixed">Mixed</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-4">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.livestockDetails.isVaccinated}
                        onChange={(e) => handleLivestockChange("isVaccinated", e.target.checked)}
                        className="h-4 w-4 rounded border-border text-green-500 focus:ring-green-500"
                      />
                      <span className="text-sm">Vaccinated</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.livestockDetails.healthCertificate}
                        onChange={(e) => handleLivestockChange("healthCertificate", e.target.checked)}
                        className="h-4 w-4 rounded border-border text-green-500 focus:ring-green-500"
                      />
                      <span className="text-sm">Health Certificate</span>
                    </label>
                  </div>
                </div>
              )}

              {/* Description */}
              <div>
                <Label className="text-foreground font-medium">Description</Label>
                <Textarea
                  value={formData.description}
                  onChange={(e) => handleChange("description", e.target.value)}
                  placeholder="Describe your item in detail, including any special features, history, or reasons for trading..."
                  className="mt-2 min-h-[120px] bg-muted border-0 rounded-xl resize-none"
                />
              </div>

              {/* Value and Condition */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-foreground font-medium">Estimated Value (NAD)</Label>
                  <div className="relative mt-2">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground font-medium">N$</span>
                    <Input
                      type="number"
                      value={formData.value}
                      onChange={(e) => handleChange("value", e.target.value)}
                      placeholder="0"
                      className="h-12 pl-12 bg-muted border-0 rounded-xl"
                    />
                  </div>
                </div>

                <div>
                  <Label className="text-foreground font-medium">Condition</Label>
                  <Select value={formData.condition} onValueChange={(v) => handleChange("condition", v)}>
                    <SelectTrigger className="mt-2 h-12 bg-muted border-0 rounded-xl">
                      <SelectValue placeholder="Select condition" />
                    </SelectTrigger>
                    <SelectContent>
                      {conditions.map((c) => (
                        <SelectItem key={c} value={c}>
                          {c}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Wanted Items Section */}
              <div className="border-t border-border pt-4">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <Label className="text-foreground font-medium">What do you want in exchange?</Label>
                    <p className="text-xs text-muted-foreground mt-1">
                      Add items you would accept for this trade (optional but recommended)
                    </p>
                  </div>
                  {formData.wantedItems.length < 5 && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={addWantedItem}
                      className="rounded-lg bg-transparent"
                    >
                      <Plus className="h-4 w-4 mr-1" />
                      Add
                    </Button>
                  )}
                </div>

                {formData.wantedItems.length === 0 && (
                  <button
                    type="button"
                    onClick={addWantedItem}
                    className="w-full p-4 border-2 border-dashed border-border rounded-xl hover:border-primary/50 transition-colors text-center"
                  >
                    <Package className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                    <p className="text-sm text-muted-foreground">
                      Click to add items you want in exchange
                    </p>
                  </button>
                )}

                <div className="space-y-3">
                  {formData.wantedItems.map((item, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="p-3 bg-muted/50 rounded-xl space-y-3"
                    >
                      <div className="flex items-start gap-2">
                        <div className="flex-1">
                          <Input
                            value={item.description}
                            onChange={(e) => updateWantedItem(index, "description", e.target.value)}
                            placeholder="What would you accept? e.g., Microwave, iPhone, etc."
                            className="h-10 bg-background border-0 rounded-lg"
                          />
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => removeWantedItem(index)}
                          className="h-10 w-10 text-muted-foreground hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>

              {/* Fee preview */}
              {formData.value && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  className={cn(
                    "rounded-xl p-4 flex items-center gap-3",
                    canAffordFee ? "bg-primary/10" : "bg-destructive/10",
                  )}
                >
                  <Info className={cn("h-5 w-5", canAffordFee ? "text-primary" : "text-destructive")} />
                  <div className="flex-1">
                    <p className={cn("font-medium", canAffordFee ? "text-foreground" : "text-destructive")}>
                      Listing Fee: N${listingFee}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {canAffordFee
                        ? `Will be deducted from your wallet (Balance: N$${balance.toFixed(2)})`
                        : `Insufficient balance. Please top up your wallet.`}
                    </p>
                  </div>
                </motion.div>
              )}
            </div>

            <Button onClick={() => setStep(3)} disabled={!isStep2Valid} className="w-full h-12 rounded-xl">
              Continue
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </motion.div>
        )}

        {/* Step 3: Photos & Location */}
        {step === 3 && (
          <motion.div
            key="step3"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-5"
          >
            <div>
              <h2 className="text-xl font-semibold text-foreground mb-2">Photos & Location</h2>
              <p className="text-muted-foreground">Add photos and your location</p>
            </div>

            {/* Image upload - Enhanced Mobile Component */}
            <div>
              <Label className="text-foreground font-medium">Photos</Label>
              <p className="text-xs text-muted-foreground mb-3">Add up to 6 photos. First photo will be the cover.</p>
              <MobileImageUpload
                images={formData.images}
                maxImages={6}
                onImagesChange={(images) => handleChange("images", images)}
                uploadEndpoint="/api/upload"
                uploadType="listing"
              />
            </div>

            {/* Location */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-foreground font-medium">Region</Label>
                <Select value={formData.region} onValueChange={(v) => handleChange("region", v)}>
                  <SelectTrigger className="mt-2 h-12 bg-muted border-0 rounded-xl">
                    <SelectValue placeholder="Select region" />
                  </SelectTrigger>
                  <SelectContent>
                    {namibiaRegions.map((r) => (
                      <SelectItem key={r} value={r}>
                        {r}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="text-foreground font-medium">City/Town</Label>
                <Input
                  value={formData.city}
                  onChange={(e) => handleChange("city", e.target.value)}
                  placeholder="e.g., Windhoek"
                  className="mt-2 h-12 bg-muted border-0 rounded-xl"
                />
              </div>
            </div>

            {/* Trade preferences */}
            <div className="space-y-3">
              <Label className="text-foreground font-medium">Trade Preferences</Label>
              <div className="space-y-2">
                <label className="flex items-center gap-3 p-4 rounded-xl bg-muted/50 border border-border cursor-pointer hover:border-primary/50 transition-colors">
                  <input
                    type="checkbox"
                    checked={formData.acceptsPartialWallet}
                    onChange={(e) => handleChange("acceptsPartialWallet", e.target.checked)}
                    className="h-5 w-5 rounded border-border text-primary focus:ring-primary"
                  />
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <Wallet className="h-4 w-4 text-primary" />
                      <p className="font-medium text-foreground">Accept partial wallet payment</p>
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">Allow item + wallet amount offers</p>
                  </div>
                </label>
                <label className="flex items-center gap-3 p-4 rounded-xl bg-muted/50 border border-border cursor-pointer hover:border-primary/50 transition-colors">
                  <input
                    type="checkbox"
                    checked={formData.willingToTravel}
                    onChange={(e) => handleChange("willingToTravel", e.target.checked)}
                    className="h-5 w-5 rounded border-border text-primary focus:ring-primary"
                  />
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-primary" />
                      <p className="font-medium text-foreground">Willing to travel</p>
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">Meet buyers in nearby areas</p>
                  </div>
                </label>
              </div>
            </div>

            <Button onClick={() => setStep(4)} disabled={!isStep3Valid} className="w-full h-12 rounded-xl bg-gradient-to-r from-primary to-primary/80 text-primary-foreground">
              Continue to Boost Options
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </motion.div>
        )}

        {/* Step 4: Feature Toggles / Boost Options */}
        {step === 4 && (
          <motion.div
            key="step4"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-6"
          >
            <div>
              <h2 className="text-xl font-semibold text-foreground mb-2 flex items-center gap-2">
                <Zap className="h-5 w-5 text-yellow-500" />
                Boost Your Listing
              </h2>
              <p className="text-muted-foreground">Get more visibility and sell faster</p>
            </div>

            {/* FOMO Banner */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-amber-500 via-orange-500 to-red-500 p-[2px]"
            >
              <div className="relative bg-gradient-to-br from-amber-950/90 via-orange-950/90 to-red-950/90 rounded-2xl p-5">
                <div className="absolute top-0 right-0 w-32 h-32 bg-yellow-500/20 rounded-full blur-3xl" />
                <div className="relative">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-yellow-400 to-orange-500 flex items-center justify-center">
                      <Eye className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <h3 className="font-bold text-white text-lg">Do you want your product to be seen?</h3>
                      <p className="text-amber-200/80 text-sm">Boosted listings get 5x more views!</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-yellow-300 text-sm">
                    <Flame className="h-4 w-4 animate-pulse" />
                    <span>87% of featured listings sell within 3 days</span>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Feature Options */}
            <div className="space-y-4">
              {/* Featured Listing */}
              <motion.div
                whileHover={{ scale: 1.01 }}
                className={cn(
                  "relative rounded-2xl border-2 p-5 transition-all cursor-pointer",
                  formData.isFeatured 
                    ? "border-yellow-500 bg-yellow-500/5 shadow-lg shadow-yellow-500/10" 
                    : "border-border hover:border-yellow-500/50"
                )}
                onClick={() => handleChange("isFeatured", !formData.isFeatured)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-4">
                    <div className={cn(
                      "w-12 h-12 rounded-xl flex items-center justify-center transition-all",
                      formData.isFeatured ? "bg-gradient-to-br from-yellow-400 to-orange-500" : "bg-muted"
                    )}>
                      <Crown className={cn("h-6 w-6", formData.isFeatured ? "text-white" : "text-muted-foreground")} />
                    </div>
                    <div>
                      <h4 className="font-semibold text-foreground flex items-center gap-2">
                        Featured Listing
                        <span className="px-2 py-0.5 rounded-full bg-yellow-500/20 text-yellow-600 text-xs font-medium">
                          Popular
                        </span>
                      </h4>
                      <p className="text-sm text-muted-foreground mt-1">
                        Appear at the top of search results and browse pages
                      </p>
                      <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1"><Eye className="h-3 w-3" /> 5x more views</span>
                        <span className="flex items-center gap-1"><TrendingUp className="h-3 w-3" /> Top placement</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <span className="text-lg font-bold text-foreground">N${FEATURE_PRICE}</span>
                    <Switch
                      checked={formData.isFeatured}
                      onCheckedChange={(v) => handleChange("isFeatured", v)}
                      className="data-[state=checked]:bg-yellow-500"
                    />
                  </div>
                </div>
              </motion.div>

              {/* Highlighted Listing */}
              <motion.div
                whileHover={{ scale: 1.01 }}
                className={cn(
                  "relative rounded-2xl border-2 p-5 transition-all cursor-pointer",
                  formData.isHighlighted 
                    ? "border-purple-500 bg-purple-500/5 shadow-lg shadow-purple-500/10" 
                    : "border-border hover:border-purple-500/50"
                )}
                onClick={() => handleChange("isHighlighted", !formData.isHighlighted)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-4">
                    <div className={cn(
                      "w-12 h-12 rounded-xl flex items-center justify-center transition-all",
                      formData.isHighlighted ? "bg-gradient-to-br from-purple-400 to-pink-500" : "bg-muted"
                    )}>
                      <Sparkles className={cn("h-6 w-6", formData.isHighlighted ? "text-white" : "text-muted-foreground")} />
                    </div>
                    <div>
                      <h4 className="font-semibold text-foreground">Highlighted Badge</h4>
                      <p className="text-sm text-muted-foreground mt-1">
                        Stand out with a special badge on your listing
                      </p>
                      <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1"><Star className="h-3 w-3" /> Eye-catching design</span>
                        <span className="flex items-center gap-1"><Award className="h-3 w-3" /> Trust badge</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <span className="text-lg font-bold text-foreground">N${FEATURE_PRICE}</span>
                    <Switch
                      checked={formData.isHighlighted}
                      onCheckedChange={(v) => handleChange("isHighlighted", v)}
                      className="data-[state=checked]:bg-purple-500"
                    />
                  </div>
                </div>
              </motion.div>

              {/* Priority Search */}
              <motion.div
                whileHover={{ scale: 1.01 }}
                className={cn(
                  "relative rounded-2xl border-2 p-5 transition-all cursor-pointer",
                  formData.isPrioritySearch 
                    ? "border-blue-500 bg-blue-500/5 shadow-lg shadow-blue-500/10" 
                    : "border-border hover:border-blue-500/50"
                )}
                onClick={() => handleChange("isPrioritySearch", !formData.isPrioritySearch)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-4">
                    <div className={cn(
                      "w-12 h-12 rounded-xl flex items-center justify-center transition-all",
                      formData.isPrioritySearch ? "bg-gradient-to-br from-blue-400 to-cyan-500" : "bg-muted"
                    )}>
                      <TrendingUp className={cn("h-6 w-6", formData.isPrioritySearch ? "text-white" : "text-muted-foreground")} />
                    </div>
                    <div>
                      <h4 className="font-semibold text-foreground">Priority in Search</h4>
                      <p className="text-sm text-muted-foreground mt-1">
                        Rank higher when buyers search for items like yours
                      </p>
                      <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1"><Zap className="h-3 w-3" /> Higher ranking</span>
                        <span className="flex items-center gap-1"><Eye className="h-3 w-3" /> More exposure</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <span className="text-lg font-bold text-foreground">N${FEATURE_PRICE}</span>
                    <Switch
                      checked={formData.isPrioritySearch}
                      onCheckedChange={(v) => handleChange("isPrioritySearch", v)}
                      className="data-[state=checked]:bg-blue-500"
                    />
                  </div>
                </div>
              </motion.div>
            </div>

            {/* Feature Summary */}
            {featureFees > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="rounded-xl bg-gradient-to-br from-primary/10 to-primary/5 p-4 border border-primary/20"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Zap className="h-5 w-5 text-primary" />
                    <span className="font-medium text-foreground">Boost Features Selected</span>
                  </div>
                  <span className="text-lg font-bold text-primary">+ N${featureFees}</span>
                </div>
              </motion.div>
            )}

            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => setStep(5)}
                className="flex-1 h-12 rounded-xl bg-transparent"
              >
                Skip for now
              </Button>
              <Button 
                onClick={() => setStep(5)} 
                className="flex-1 h-12 rounded-xl bg-gradient-to-r from-primary to-primary/80 text-primary-foreground"
              >
                Review Listing
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </motion.div>
        )}

        {/* Step 5: Review & Confirm */}
        {step === 5 && (
          <motion.div
            key="step5"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-6"
          >
            <div>
              <h2 className="text-xl font-bold text-foreground mb-2 flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-primary" />
                Review Your Listing
              </h2>
              <p className="text-muted-foreground">Please review all details before publishing</p>
            </div>

            {/* Preview Card */}
            <div className="bg-gradient-to-br from-card via-card to-primary/5 rounded-2xl border border-border overflow-hidden">
              {/* Image Preview */}
              {formData.images.length > 0 && (
                <div className="relative aspect-video bg-muted">
                  <Image 
                    src={formData.images[0] || "/placeholder.svg"} 
                    alt="Preview" 
                    fill 
                    className="object-cover" 
                  />
                  {formData.images.length > 1 && (
                    <div className="absolute bottom-3 right-3 px-2 py-1 rounded-lg bg-black/60 text-white text-xs">
                      +{formData.images.length - 1} more
                    </div>
                  )}
                  <div className="absolute top-3 left-3 flex gap-2">
                    <span className="px-3 py-1.5 rounded-full bg-primary text-primary-foreground text-xs font-medium flex items-center gap-1">
                      <Star className="h-3 w-3" />
                      {selectedCategory?.label}
                    </span>
                    {formData.isFeatured && (
                      <span className="px-3 py-1.5 rounded-full bg-gradient-to-r from-yellow-400 to-orange-500 text-white text-xs font-medium flex items-center gap-1">
                        <Crown className="h-3 w-3" />
                        Featured
                      </span>
                    )}
                  </div>
                </div>
              )}
              
              <div className="p-5 space-y-4">
                <div>
                  <h3 className="text-xl font-bold text-foreground">{formData.title}</h3>
                  <p className="text-muted-foreground text-sm mt-1 line-clamp-2">{formData.description}</p>
                </div>

                <div className="flex flex-wrap gap-2">
                  <span className="px-3 py-1 rounded-full bg-muted text-sm">{formData.condition}</span>
                  <span className="px-3 py-1 rounded-full bg-muted text-sm flex items-center gap-1">
                    <MapPin className="h-3 w-3" />
                    {formData.region}{formData.city ? `, ${formData.city}` : ''}
                  </span>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-border">
                  <span className="text-muted-foreground">Estimated Value</span>
                  <span className="text-2xl font-bold text-foreground">
                    N$ {Number.parseFloat(formData.value || "0").toLocaleString()}
                  </span>
                </div>
              </div>
            </div>

            {/* Trade Preferences */}
            <div className="flex flex-wrap gap-3">
              {formData.acceptsPartialWallet && (
                <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-emerald-500/10 text-emerald-600 text-sm">
                  <Check className="h-4 w-4" />
                  Accepts wallet payment
                </div>
              )}
              {formData.willingToTravel && (
                <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-blue-500/10 text-blue-600 text-sm">
                  <Check className="h-4 w-4" />
                  Willing to travel
                </div>
              )}
              {formData.isFeatured && (
                <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-yellow-500/10 text-yellow-600 text-sm">
                  <Crown className="h-4 w-4" />
                  Featured
                </div>
              )}
              {formData.isHighlighted && (
                <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-purple-500/10 text-purple-600 text-sm">
                  <Sparkles className="h-4 w-4" />
                  Highlighted
                </div>
              )}
              {formData.isPrioritySearch && (
                <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-blue-500/10 text-blue-600 text-sm">
                  <TrendingUp className="h-4 w-4" />
                  Priority Search
                </div>
              )}
            </div>

            {/* Payment Summary */}
            <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 rounded-2xl p-5 text-white space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center">
                  <Wallet className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-slate-400 text-sm">Payment Summary</p>
                  <p className="font-semibold">Total Charges</p>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-slate-300">
                  <span>Current Balance</span>
                  <span>N$ {balance.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-slate-300">
                  <span>Listing Fee</span>
                  <span className="text-primary">- N$ {listingFee}</span>
                </div>
                {featureFees > 0 && (
                  <div className="flex justify-between text-slate-300">
                    <span>Boost Features</span>
                    <span className="text-yellow-400">- N$ {featureFees}</span>
                  </div>
                )}
                <div className="border-t border-slate-700 pt-2 flex justify-between font-bold text-lg">
                  <span>Balance After</span>
                  <span className={canAffordFee ? "text-emerald-400" : "text-rose-400"}>
                    N$ {(balance - totalFee).toFixed(2)}
                  </span>
                </div>
              </div>

              {!canAffordFee && (
                <div className="flex items-center gap-3 p-3 rounded-xl bg-rose-500/20 text-rose-300">
                  <AlertCircle className="h-5 w-5 flex-shrink-0" />
                  <p className="text-sm">Insufficient balance. Please top up your wallet to continue.</p>
                </div>
              )}
            </div>

            {/* Error Message */}
            {errorMessage && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center gap-3 p-4 rounded-xl bg-destructive/10 text-destructive"
              >
                <AlertCircle className="h-5 w-5 flex-shrink-0" />
                <p className="text-sm">{errorMessage}</p>
              </motion.div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => setStep(4)}
                className="flex-1 h-12 rounded-xl bg-transparent"
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={!canAffordFee || isSubmitting || isSuccess}
                className={cn(
                  "flex-1 h-12 rounded-xl transition-all",
                  isSuccess 
                    ? "bg-emerald-500 hover:bg-emerald-500" 
                    : "bg-gradient-to-r from-primary to-primary/80 text-primary-foreground shadow-lg shadow-primary/25"
                )}
              >
                {isSubmitting ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : isSuccess ? (
                  <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="flex items-center gap-2">
                    <Check className="h-5 w-5" />
                    Published!
                  </motion.div>
                ) : (
                  <>
                    <Shield className="mr-2 h-4 w-4" />
                    Publish Listing (N$ {totalFee})
                  </>
                )}
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
