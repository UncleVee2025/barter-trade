"use client"

import React, { useState, useEffect, useMemo } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
  ArrowLeft,
  Smartphone,
  Car,
  PiggyBank,
  MapPin,
  Wrench,
  Package,
  Upload,
  X,
  Loader2,
  Check,
  Plus,
  Trash2,
  AlertCircle,
  Save,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useRouter } from "next/navigation"
import { useAuth } from "@/contexts/auth-context"
import { cn } from "@/lib/utils"
import { toast } from "@/hooks/use-toast"
import Image from "next/image"
import { Skeleton } from "@/components/ui/skeleton"

const categories = [
  { id: "electronics", label: "Electronics", icon: Smartphone, description: "Phones, TVs, computers" },
  { id: "vehicles", label: "Vehicles", icon: Car, description: "Cars, trucks, motorcycles" },
  { id: "livestock", label: "Livestock", icon: PiggyBank, description: "Cattle, goats, poultry" },
  { id: "land", label: "Land", icon: MapPin, description: "Plots, farms, commercial" },
  { id: "services", label: "Services", icon: Wrench, description: "Skills and labor" },
  { id: "goods", label: "Other Goods", icon: Package, description: "Furniture, appliances" },
]

const namibiaRegions = [
  "Erongo", "Hardap", "Karas", "Kavango East", "Kavango West", "Khomas",
  "Kunene", "Ohangwena", "Omaheke", "Omusati", "Oshana", "Oshikoto",
  "Otjozondjupa", "Zambezi",
]

const conditions = ["New", "Like New", "Good", "Fair", "For Parts"]

interface WantedItem {
  description: string
  estimatedValue: string
  isFlexible: boolean
}

interface EditListingProps {
  listingId: string
}

export function EditListing({ listingId }: EditListingProps) {
  const router = useRouter()
  const { user } = useAuth()
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [error, setError] = useState("")
  const fileInputRef = React.useRef<HTMLInputElement>(null)

  const [formData, setFormData] = useState({
    category: "",
    title: "",
    description: "",
    value: "",
    condition: "",
    region: "",
    town: "",
    images: [] as string[],
    acceptsPartialWallet: true,
    willingToTravel: false,
    wantedItems: [] as WantedItem[],
    status: "active" as string,
  })

  // Fetch listing data
  useEffect(() => {
    const fetchListing = async () => {
      try {
        const response = await fetch(`/api/listings/${listingId}`)
        if (!response.ok) {
          throw new Error("Failed to fetch listing")
        }
        const data = await response.json()
        const listing = data.listing

        // Check ownership
        if (listing.userId !== user?.id && user?.role !== "admin") {
          toast({ title: "Unauthorized", description: "You cannot edit this listing", variant: "destructive" })
          router.push("/dashboard/listings")
          return
        }

        // Parse trade preferences
        const tradePrefs = listing.tradePreferences?.split(",") || []

        setFormData({
          category: listing.category || "",
          title: listing.title || "",
          description: listing.description || "",
          value: listing.value?.toString() || "",
          condition: listing.condition || "",
          region: listing.location?.region || "",
          town: listing.location?.town || "",
          images: listing.images || [],
          acceptsPartialWallet: tradePrefs.includes("accepts_wallet"),
          willingToTravel: tradePrefs.includes("willing_to_travel"),
          wantedItems: listing.wantedItems?.map((item: { description: string; estimatedValue?: number; isFlexible?: boolean }) => ({
            description: item.description,
            estimatedValue: item.estimatedValue?.toString() || "",
            isFlexible: item.isFlexible ?? true,
          })) || [],
          status: listing.status || "active",
        })
      } catch (err) {
        setError("Failed to load listing")
        toast({ title: "Error", description: "Failed to load listing data", variant: "destructive" })
      } finally {
        setIsLoading(false)
      }
    }

    if (listingId && user) {
      fetchListing()
    }
  }, [listingId, user, router])

  const handleChange = (field: string, value: string | boolean | string[] | WantedItem[]) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
    setError("")
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

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0) return

    const remainingSlots = 6 - formData.images.length
    const filesToUpload = Array.from(files).slice(0, remainingSlots)

    if (filesToUpload.length === 0) {
      toast({ title: "Maximum images reached", description: "You can upload up to 6 images", variant: "destructive" })
      return
    }

    setIsUploading(true)
    const uploadedUrls: string[] = []

    for (const file of filesToUpload) {
      if (!file.type.startsWith("image/")) {
        toast({ title: "Invalid file", description: `${file.name} is not an image`, variant: "destructive" })
        continue
      }
      if (file.size > 5 * 1024 * 1024) {
        toast({ title: "File too large", description: `${file.name} exceeds 5MB`, variant: "destructive" })
        continue
      }

      try {
        const formDataUpload = new FormData()
        formDataUpload.append("file", file)

        const response = await fetch("/api/upload", { method: "POST", body: formDataUpload })
        if (!response.ok) throw new Error("Upload failed")

        const data = await response.json()
        uploadedUrls.push(data.url)
      } catch {
        toast({ title: "Upload failed", description: `Failed to upload ${file.name}`, variant: "destructive" })
      }
    }

    if (uploadedUrls.length > 0) {
      handleChange("images", [...formData.images, ...uploadedUrls])
      toast({ title: "Images uploaded", description: `${uploadedUrls.length} image(s) uploaded` })
    }

    setIsUploading(false)
    if (fileInputRef.current) fileInputRef.current.value = ""
  }

  const removeImage = (index: number) => {
    handleChange("images", formData.images.filter((_, i) => i !== index))
  }

  const handleSubmit = async () => {
    if (!formData.title || !formData.description || !formData.value || !formData.region) {
      setError("Please fill in all required fields")
      return
    }

    setIsSubmitting(true)
    setError("")

    try {
      const wantedItemsPayload = formData.wantedItems
        .filter((item) => item.description.trim())
        .map((item) => ({
          description: item.description.trim(),
          estimatedValue: item.estimatedValue ? Number.parseFloat(item.estimatedValue) : null,
          isFlexible: item.isFlexible,
        }))

      const tradePrefs: string[] = []
      if (formData.acceptsPartialWallet) tradePrefs.push("accepts_wallet")
      if (formData.willingToTravel) tradePrefs.push("willing_to_travel")

      const response = await fetch(`/api/listings/${listingId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: formData.title.trim(),
          description: formData.description.trim(),
          value: Number.parseFloat(formData.value),
          condition: formData.condition,
          region: formData.region,
          town: formData.town.trim() || null,
          images: formData.images,
          tradePreferences: tradePrefs.join(","),
          wantedItems: wantedItemsPayload,
          status: formData.status,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to update listing")
      }

      toast({ title: "Listing updated", description: "Your listing has been updated successfully" })
      router.push("/dashboard/listings")
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to update listing"
      setError(message)
      toast({ title: "Error", description: message, variant: "destructive" })
    } finally {
      setIsSubmitting(false)
    }
  }

  const isFormValid = formData.title.length >= 3 && formData.description.length >= 10 && 
    formData.value && Number.parseFloat(formData.value) > 0 && formData.region && formData.images.length > 0

  if (isLoading) {
    return (
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="flex items-center gap-4">
          <Skeleton className="h-10 w-10 rounded-lg" />
          <div className="space-y-2">
            <Skeleton className="h-6 w-32" />
            <Skeleton className="h-4 w-24" />
          </div>
        </div>
        <div className="space-y-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-12 w-full rounded-xl" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-foreground">Edit Listing</h1>
          <p className="text-muted-foreground">Update your listing details</p>
        </div>
      </div>

      {error && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6 p-4 bg-destructive/10 border border-destructive/20 rounded-xl flex items-center gap-3"
        >
          <AlertCircle className="h-5 w-5 text-destructive" />
          <p className="text-destructive">{error}</p>
        </motion.div>
      )}

      <div className="space-y-6">
        {/* Category (read-only) */}
        <div>
          <Label className="text-foreground">Category</Label>
          <div className="mt-2 p-4 bg-muted rounded-xl">
            {categories.find((c) => c.id === formData.category)?.label || formData.category}
            <span className="text-xs text-muted-foreground ml-2">(Cannot be changed)</span>
          </div>
        </div>

        {/* Title */}
        <div>
          <Label className="text-foreground">Title *</Label>
          <Input
            value={formData.title}
            onChange={(e) => handleChange("title", e.target.value)}
            placeholder="e.g., iPhone 13 Pro Max 256GB"
            className="mt-2 h-12 bg-muted border-0 rounded-xl"
          />
        </div>

        {/* Description */}
        <div>
          <Label className="text-foreground">Description *</Label>
          <Textarea
            value={formData.description}
            onChange={(e) => handleChange("description", e.target.value)}
            placeholder="Describe your item..."
            className="mt-2 min-h-[120px] bg-muted border-0 rounded-xl resize-none"
          />
        </div>

        {/* Value & Condition */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label className="text-foreground">Value (NAD) *</Label>
            <div className="relative mt-2">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground">N$</span>
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
            <Label className="text-foreground">Condition</Label>
            <Select value={formData.condition} onValueChange={(v) => handleChange("condition", v)}>
              <SelectTrigger className="mt-2 h-12 bg-muted border-0 rounded-xl">
                <SelectValue placeholder="Select condition" />
              </SelectTrigger>
              <SelectContent>
                {conditions.map((c) => (
                  <SelectItem key={c} value={c}>{c}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Region & Town */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label className="text-foreground">Region *</Label>
            <Select value={formData.region} onValueChange={(v) => handleChange("region", v)}>
              <SelectTrigger className="mt-2 h-12 bg-muted border-0 rounded-xl">
                <SelectValue placeholder="Select region" />
              </SelectTrigger>
              <SelectContent>
                {namibiaRegions.map((r) => (
                  <SelectItem key={r} value={r}>{r}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-foreground">Town/City</Label>
            <Input
              value={formData.town}
              onChange={(e) => handleChange("town", e.target.value)}
              placeholder="e.g., Windhoek"
              className="mt-2 h-12 bg-muted border-0 rounded-xl"
            />
          </div>
        </div>

        {/* Status */}
        <div>
          <Label className="text-foreground">Status</Label>
          <Select value={formData.status} onValueChange={(v) => handleChange("status", v)}>
            <SelectTrigger className="mt-2 h-12 bg-muted border-0 rounded-xl">
              <SelectValue placeholder="Select status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="sold">Sold</SelectItem>
              <SelectItem value="draft">Draft</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Images */}
        <div>
          <Label className="text-foreground">Images *</Label>
          <div className="mt-2 grid grid-cols-3 gap-3">
            {formData.images.map((url, idx) => (
              <div key={idx} className="relative aspect-square rounded-xl overflow-hidden bg-muted">
                <Image src={url || "/placeholder.svg"} alt={`Image ${idx + 1}`} fill className="object-cover" />
                <button
                  type="button"
                  onClick={() => removeImage(idx)}
                  className="absolute top-2 right-2 p-1.5 bg-background/80 rounded-full hover:bg-destructive hover:text-destructive-foreground transition-colors"
                >
                  <X className="h-4 w-4" />
                </button>
                {idx === 0 && (
                  <span className="absolute bottom-2 left-2 px-2 py-1 bg-primary text-primary-foreground text-xs rounded-full">
                    Primary
                  </span>
                )}
              </div>
            ))}
            {formData.images.length < 6 && (
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading}
                className="aspect-square rounded-xl border-2 border-dashed border-border hover:border-primary/50 transition-colors flex flex-col items-center justify-center gap-2"
              >
                {isUploading ? (
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                ) : (
                  <>
                    <Upload className="h-6 w-6 text-muted-foreground" />
                    <span className="text-xs text-muted-foreground">Add Photo</span>
                  </>
                )}
              </button>
            )}
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            onChange={handleImageUpload}
            className="hidden"
          />
        </div>

        {/* Wanted Items */}
        <div className="border-t border-border pt-6">
          <div className="flex items-center justify-between mb-3">
            <div>
              <Label className="text-foreground">What do you want in exchange?</Label>
              <p className="text-xs text-muted-foreground mt-1">Items you would accept for trade</p>
            </div>
            {formData.wantedItems.length < 5 && (
              <Button type="button" variant="outline" size="sm" onClick={addWantedItem} className="rounded-lg bg-transparent">
                <Plus className="h-4 w-4 mr-1" /> Add
              </Button>
            )}
          </div>

          <div className="space-y-3">
            {formData.wantedItems.map((item, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-3 bg-muted/50 rounded-xl space-y-3"
              >
                <div className="flex items-start gap-2">
                  <Input
                    value={item.description}
                    onChange={(e) => updateWantedItem(index, "description", e.target.value)}
                    placeholder="What would you accept?"
                    className="flex-1 h-10 bg-background border-0 rounded-lg"
                  />
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
                <div className="flex items-center gap-3">
                  <div className="flex-1 relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">N$</span>
                    <Input
                      type="number"
                      value={item.estimatedValue}
                      onChange={(e) => updateWantedItem(index, "estimatedValue", e.target.value)}
                      placeholder="Est. value"
                      className="h-9 pl-10 bg-background border-0 rounded-lg text-sm"
                    />
                  </div>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={item.isFlexible}
                      onChange={(e) => updateWantedItem(index, "isFlexible", e.target.checked)}
                      className="h-4 w-4 rounded border-border text-primary focus:ring-primary"
                    />
                    <span className="text-xs text-muted-foreground">Flexible</span>
                  </label>
                </div>
              </motion.div>
            ))}
          </div>

          {formData.wantedItems.length === 0 && (
            <button
              type="button"
              onClick={addWantedItem}
              className="w-full p-4 border-2 border-dashed border-border rounded-xl hover:border-primary/50 transition-colors text-center"
            >
              <Package className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
              <p className="text-sm text-muted-foreground">Click to add items you want in exchange</p>
            </button>
          )}
        </div>

        {/* Trade Preferences */}
        <div className="border-t border-border pt-6 space-y-3">
          <Label className="text-foreground">Trade Preferences</Label>
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={formData.acceptsPartialWallet}
              onChange={(e) => handleChange("acceptsPartialWallet", e.target.checked)}
              className="h-4 w-4 rounded border-border text-primary focus:ring-primary"
            />
            <span className="text-sm text-foreground">Accept partial wallet payment</span>
          </label>
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={formData.willingToTravel}
              onChange={(e) => handleChange("willingToTravel", e.target.checked)}
              className="h-4 w-4 rounded border-border text-primary focus:ring-primary"
            />
            <span className="text-sm text-foreground">Willing to travel for trade</span>
          </label>
        </div>

        {/* Submit */}
        <div className="pt-6 border-t border-border">
          <Button
            onClick={handleSubmit}
            disabled={!isFormValid || isSubmitting}
            className="w-full h-12 rounded-xl"
          >
            {isSubmitting ? (
              <Loader2 className="h-5 w-5 animate-spin mr-2" />
            ) : (
              <Save className="h-5 w-5 mr-2" />
            )}
            {isSubmitting ? "Saving..." : "Save Changes"}
          </Button>
        </div>
      </div>
    </div>
  )
}
