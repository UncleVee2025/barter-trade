"use client"

import { useRouter } from "next/navigation"
import { usePathname } from "next/navigation"

import type React from "react"
import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Eye, EyeOff, Loader2, Check, AlertCircle, User, MapPin, Mail, Phone, Shield, ChevronRight, ChevronLeft, CheckCircle2, Sparkles } from "lucide-react"
import { cn } from "@/lib/utils"
import { useAuth } from "@/contexts/auth-context"
import { Card, CardContent } from "@/components/ui/card"
import { useNotifications } from "@/contexts/notification-context"

interface RegisterFormProps {
  onRegistrationSuccess?: (email: string) => void
}

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

// Major towns by region
const townsByRegion: Record<string, string[]> = {
  Khomas: ["Windhoek", "Brakwater", "Dordabis", "Groot Aub", "Hosea Kutako"],
  Erongo: ["Swakopmund", "Walvis Bay", "Henties Bay", "Omaruru", "Usakos", "Karibib", "Arandis"],
  Oshana: ["Oshakati", "Ondangwa", "Ongwediva"],
  Oshikoto: ["Tsumeb", "Omuthiya", "Otavi"],
  Otjozondjupa: ["Otjiwarongo", "Okahandja", "Grootfontein", "Okakarara"],
  Hardap: ["Mariental", "Rehoboth", "Maltahohe", "Aranos"],
  Karas: ["Keetmanshoop", "Luderitz", "Oranjemund", "Karasburg", "Bethanie"],
  "Kavango East": ["Rundu", "Divundu"],
  "Kavango West": ["Nkurenkuru"],
  Kunene: ["Opuwo", "Outjo", "Khorixas", "Kamanjab"],
  Ohangwena: ["Eenhana", "Helao Nafidi", "Okongo"],
  Omaheke: ["Gobabis", "Leonardville", "Witvlei"],
  Omusati: ["Outapi", "Okahao", "Ruacana", "Tsandi"],
  Zambezi: ["Katima Mulilo", "Bukalo"],
}

const genderOptions = [
  { value: "male", label: "Male" },
  { value: "female", label: "Female" },
  { value: "other", label: "Prefer not to say" },
]

interface FormData {
  fullName: string
  email: string
  phone: string
  gender: string
  region: string
  town: string
  streetAddress: string
  postalCode: string
  password: string
  confirmPassword: string
}

const initialFormData: FormData = {
  fullName: "",
  email: "",
  phone: "",
  gender: "",
  region: "",
  town: "",
  streetAddress: "",
  postalCode: "",
  password: "",
  confirmPassword: "",
}

export function RegisterForm({ onRegistrationSuccess }: RegisterFormProps) {
  const [formData, setFormData] = useState<FormData>(initialFormData)
  const [step, setStep] = useState(1)
  const [showPassword, setShowPassword] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<keyof FormData, string>>>({})
  const { register, isLoading } = useAuth()
  const { showToast } = useNotifications()
  const router = useRouter()
  const pathname = usePathname()

  const handleChange = (field: keyof FormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
    // Clear field error when user starts typing
    if (fieldErrors[field]) {
      setFieldErrors((prev) => ({ ...prev, [field]: undefined }))
    }
    // Reset town when region changes
    if (field === "region") {
      setFormData((prev) => ({ ...prev, [field]: value, town: "" }))
    }
  }

  const validateStep1 = () => {
    const errors: Partial<Record<keyof FormData, string>> = {}

    if (!formData.fullName || formData.fullName.trim().length < 2) {
      errors.fullName = "Please enter your full name (minimum 2 characters)"
    }

    if (!formData.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errors.email = "Please enter a valid email address"
    }

    if (!formData.phone || formData.phone.length < 8) {
      errors.phone = "Please enter a valid phone number"
    }

    if (!formData.gender) {
      errors.gender = "Please select your gender"
    }

    setFieldErrors(errors)
    return Object.keys(errors).length === 0
  }

  const validateStep2 = () => {
    const errors: Partial<Record<keyof FormData, string>> = {}

    if (!formData.region) {
      errors.region = "Please select your region"
    }

    if (!formData.town) {
      errors.town = "Please select or enter your town/city"
    }

    if (!formData.streetAddress || formData.streetAddress.length < 5) {
      errors.streetAddress = "Please enter your full street address"
    }

    setFieldErrors(errors)
    return Object.keys(errors).length === 0
  }

  const validateStep3 = () => {
    const errors: Partial<Record<keyof FormData, string>> = {}

    if (formData.password.length < 6) {
      errors.password = "Password must be at least 6 characters"
    }

    if (formData.password !== formData.confirmPassword) {
      errors.confirmPassword = "Passwords do not match"
    }

    setFieldErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleNextStep = () => {
    setError(null)
    if (step === 1 && validateStep1()) {
      setStep(2)
    } else if (step === 2 && validateStep2()) {
      setStep(3)
    }
  }

  const handlePrevStep = () => {
    setError(null)
    setStep((prev) => Math.max(1, prev - 1))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!validateStep3()) return

    // Combine address fields
    const fullAddress = `${formData.streetAddress}${formData.postalCode ? `, ${formData.postalCode}` : ""}`

    const result = await register({
      email: formData.email,
      password: formData.password,
      name: formData.fullName,
      phone: formData.phone,
      gender: formData.gender,
      region: formData.region,
      town: formData.town,
      streetAddress: fullAddress,
    })

    if (result.success) {
      setIsSuccess(true)
      // Show impressive success toast notification
      showToast({
        type: "success",
        title: "Account Created Successfully!",
        message: "Welcome to Barter Trade Namibia! Let's get you set up.",
        duration: 5000,
      })
      // Redirect to onboarding after registration
      setTimeout(() => {
        if (result.needsOnboarding) {
          router.push("/onboarding")
        } else if (onRegistrationSuccess) {
          onRegistrationSuccess(formData.email)
        }
      }, 1500)
    } else {
      setError(result.error || "Registration failed. Please try again.")
      showToast({
        type: "error",
        title: "Registration Failed",
        message: result.error || "Please check your details and try again.",
        duration: 5000,
      })
    }
  }

  const passwordsMatch = formData.password && formData.confirmPassword && formData.password === formData.confirmPassword

  const steps = [
    { number: 1, title: "Personal Info", icon: User },
    { number: 2, title: "Address", icon: MapPin },
    { number: 3, title: "Security", icon: Shield },
  ]

  const availableTowns = formData.region ? townsByRegion[formData.region] || [] : []

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* Error Banner */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="flex items-center gap-2 p-3 bg-destructive/10 border border-destructive/20 rounded-xl text-sm text-destructive"
          >
            <AlertCircle className="h-4 w-4 flex-shrink-0" />
            <span>{error}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Step Indicator */}
      <div className="flex items-center justify-between mb-6">
        {steps.map((s, index) => (
          <div key={s.number} className="flex items-center">
            <div
              className={cn(
                "flex items-center gap-2 px-3 py-2 rounded-xl transition-all duration-300",
                step === s.number
                  ? "bg-primary text-primary-foreground"
                  : step > s.number
                    ? "bg-green-500/10 text-green-500"
                    : "bg-muted text-muted-foreground"
              )}
            >
              <div
                className={cn(
                  "w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold",
                  step === s.number
                    ? "bg-primary-foreground/20"
                    : step > s.number
                      ? "bg-green-500/20"
                      : "bg-background/20"
                )}
              >
                {step > s.number ? <Check className="h-4 w-4" /> : s.number}
              </div>
              <span className="text-sm font-medium hidden sm:block">{s.title}</span>
            </div>
            {index < steps.length - 1 && (
              <div
                className={cn(
                  "w-8 sm:w-12 h-0.5 mx-1",
                  step > s.number ? "bg-green-500" : "bg-muted"
                )}
              />
            )}
          </div>
        ))}
      </div>

      {/* Step 1: Personal Information */}
      <AnimatePresence mode="wait">
        {step === 1 && (
          <motion.div
            key="step1"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
            className="space-y-4"
          >
            <Card className="border-0 shadow-none bg-muted/30">
              <CardContent className="p-4 space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="fullName" className="text-foreground font-medium">
                    Full Name (as on ID) *
                  </Label>
                  <Input
                    id="fullName"
                    type="text"
                    placeholder="Enter your full name"
                    value={formData.fullName}
                    onChange={(e) => handleChange("fullName", e.target.value)}
                    className={cn(
                      "h-12 bg-background border rounded-xl px-4",
                      "focus:ring-2 focus:ring-primary/20 focus:border-primary",
                      fieldErrors.fullName && "border-destructive focus:border-destructive"
                    )}
                  />
                  {fieldErrors.fullName && (
                    <p className="text-xs text-destructive">{fieldErrors.fullName}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email" className="text-foreground font-medium flex items-center gap-1">
                    <Mail className="h-3.5 w-3.5" /> Email Address *
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="name@example.com"
                    value={formData.email}
                    onChange={(e) => handleChange("email", e.target.value)}
                    className={cn(
                      "h-12 bg-background border rounded-xl px-4",
                      "focus:ring-2 focus:ring-primary/20 focus:border-primary",
                      fieldErrors.email && "border-destructive focus:border-destructive"
                    )}
                  />
                  {fieldErrors.email && (
                    <p className="text-xs text-destructive">{fieldErrors.email}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone" className="text-foreground font-medium flex items-center gap-1">
                    <Phone className="h-3.5 w-3.5" /> Phone Number *
                  </Label>
                  <Input
                    id="phone"
                    type="tel"
                    placeholder="+264 81 123 4567"
                    value={formData.phone}
                    onChange={(e) => handleChange("phone", e.target.value)}
                    className={cn(
                      "h-12 bg-background border rounded-xl px-4",
                      "focus:ring-2 focus:ring-primary/20 focus:border-primary",
                      fieldErrors.phone && "border-destructive focus:border-destructive"
                    )}
                  />
                  {fieldErrors.phone && (
                    <p className="text-xs text-destructive">{fieldErrors.phone}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="gender" className="text-foreground font-medium">
                    Gender *
                  </Label>
                  <Select value={formData.gender} onValueChange={(value) => handleChange("gender", value)}>
                    <SelectTrigger
                      className={cn(
                        "h-12 bg-background border rounded-xl px-4",
                        "focus:ring-2 focus:ring-primary/20 focus:border-primary",
                        fieldErrors.gender && "border-destructive focus:border-destructive"
                      )}
                    >
                      <SelectValue placeholder="Select your gender" />
                    </SelectTrigger>
                    <SelectContent>
                      {genderOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {fieldErrors.gender && (
                    <p className="text-xs text-destructive">{fieldErrors.gender}</p>
                  )}
                </div>
              </CardContent>
            </Card>

            <Button
              type="button"
              onClick={handleNextStep}
              className="w-full h-12 rounded-xl text-base font-medium bg-primary hover:bg-primary/90"
            >
              Continue
              <ChevronRight className="h-4 w-4 ml-2" />
            </Button>
          </motion.div>
        )}

        {/* Step 2: Address Details */}
        {step === 2 && (
          <motion.div
            key="step2"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
            className="space-y-4"
          >
            <Card className="border-0 shadow-none bg-muted/30">
              <CardContent className="p-4 space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="region" className="text-foreground font-medium">
                      Region *
                    </Label>
                    <Select value={formData.region} onValueChange={(value) => handleChange("region", value)}>
                      <SelectTrigger
                        className={cn(
                          "h-12 bg-background border rounded-xl px-4",
                          "focus:ring-2 focus:ring-primary/20 focus:border-primary",
                          fieldErrors.region && "border-destructive focus:border-destructive"
                        )}
                      >
                        <SelectValue placeholder="Select region" />
                      </SelectTrigger>
                      <SelectContent>
                        {namibiaRegions.map((region) => (
                          <SelectItem key={region} value={region}>
                            {region}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {fieldErrors.region && (
                      <p className="text-xs text-destructive">{fieldErrors.region}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="town" className="text-foreground font-medium">
                      Town/City *
                    </Label>
                    {availableTowns.length > 0 ? (
                      <Select value={formData.town} onValueChange={(value) => handleChange("town", value)}>
                        <SelectTrigger
                          className={cn(
                            "h-12 bg-background border rounded-xl px-4",
                            "focus:ring-2 focus:ring-primary/20 focus:border-primary",
                            fieldErrors.town && "border-destructive focus:border-destructive"
                          )}
                        >
                          <SelectValue placeholder="Select town" />
                        </SelectTrigger>
                        <SelectContent>
                          {availableTowns.map((town) => (
                            <SelectItem key={town} value={town}>
                              {town}
                            </SelectItem>
                          ))}
                          <SelectItem value="other">Other (type below)</SelectItem>
                        </SelectContent>
                      </Select>
                    ) : (
                      <Input
                        id="town"
                        type="text"
                        placeholder="Enter your town/city"
                        value={formData.town}
                        onChange={(e) => handleChange("town", e.target.value)}
                        className={cn(
                          "h-12 bg-background border rounded-xl px-4",
                          "focus:ring-2 focus:ring-primary/20 focus:border-primary",
                          fieldErrors.town && "border-destructive focus:border-destructive"
                        )}
                      />
                    )}
                    {formData.town === "other" && (
                      <Input
                        type="text"
                        placeholder="Enter your town name"
                        onChange={(e) => handleChange("town", e.target.value)}
                        className="h-12 bg-background border rounded-xl px-4 mt-2"
                      />
                    )}
                    {fieldErrors.town && (
                      <p className="text-xs text-destructive">{fieldErrors.town}</p>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="streetAddress" className="text-foreground font-medium flex items-center gap-1">
                    <MapPin className="h-3.5 w-3.5" /> Street Address *
                  </Label>
                  <Input
                    id="streetAddress"
                    type="text"
                    placeholder="e.g., 123 Independence Avenue, Klein Windhoek"
                    value={formData.streetAddress}
                    onChange={(e) => handleChange("streetAddress", e.target.value)}
                    className={cn(
                      "h-12 bg-background border rounded-xl px-4",
                      "focus:ring-2 focus:ring-primary/20 focus:border-primary",
                      fieldErrors.streetAddress && "border-destructive focus:border-destructive"
                    )}
                  />
                  {fieldErrors.streetAddress && (
                    <p className="text-xs text-destructive">{fieldErrors.streetAddress}</p>
                  )}
                  <p className="text-xs text-muted-foreground">
                    Your address helps us verify your identity and connect you with local traders
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="postalCode" className="text-foreground font-medium">
                    Postal Code (Optional)
                  </Label>
                  <Input
                    id="postalCode"
                    type="text"
                    placeholder="e.g., 10001"
                    value={formData.postalCode}
                    onChange={(e) => handleChange("postalCode", e.target.value)}
                    className="h-12 bg-background border rounded-xl px-4 focus:ring-2 focus:ring-primary/20 focus:border-primary"
                  />
                </div>
              </CardContent>
            </Card>

            <div className="flex gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={handlePrevStep}
                className="flex-1 h-12 rounded-xl text-base font-medium bg-transparent"
              >
                <ChevronLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
              <Button
                type="button"
                onClick={handleNextStep}
                className="flex-1 h-12 rounded-xl text-base font-medium bg-primary hover:bg-primary/90"
              >
                Continue
                <ChevronRight className="h-4 w-4 ml-2" />
              </Button>
            </div>
          </motion.div>
        )}

        {/* Step 3: Password */}
        {step === 3 && (
          <motion.div
            key="step3"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
            className="space-y-4"
          >
            <Card className="border-0 shadow-none bg-muted/30">
              <CardContent className="p-4 space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="password" className="text-foreground font-medium flex items-center gap-1">
                    <Shield className="h-3.5 w-3.5" /> Create Password *
                  </Label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="Minimum 6 characters"
                      value={formData.password}
                      onChange={(e) => handleChange("password", e.target.value)}
                      className={cn(
                        "h-12 bg-background border rounded-xl px-4 pr-12",
                        "focus:ring-2 focus:ring-primary/20 focus:border-primary",
                        fieldErrors.password && "border-destructive focus:border-destructive"
                      )}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  {fieldErrors.password && (
                    <p className="text-xs text-destructive">{fieldErrors.password}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirmPassword" className="text-foreground font-medium">
                    Confirm Password *
                  </Label>
                  <div className="relative">
                    <Input
                      id="confirmPassword"
                      type={showPassword ? "text" : "password"}
                      placeholder="Re-enter your password"
                      value={formData.confirmPassword}
                      onChange={(e) => handleChange("confirmPassword", e.target.value)}
                      className={cn(
                        "h-12 bg-background border rounded-xl px-4 pr-12",
                        "focus:ring-2 focus:ring-primary/20 focus:border-primary",
                        passwordsMatch && "border-green-500 focus:border-green-500",
                        fieldErrors.confirmPassword && "border-destructive focus:border-destructive"
                      )}
                    />
                    {passwordsMatch && (
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-green-500"
                      >
                        <Check className="h-4 w-4" />
                      </motion.div>
                    )}
                  </div>
                  {fieldErrors.confirmPassword && (
                    <p className="text-xs text-destructive">{fieldErrors.confirmPassword}</p>
                  )}
                </div>

                {/* Password strength indicator */}
                <div className="space-y-2">
                  <div className="flex gap-1">
                    {[...Array(4)].map((_, i) => (
                      <div
                        key={i}
                        className={cn(
                          "h-1 flex-1 rounded-full transition-colors",
                          formData.password.length >= (i + 1) * 2
                            ? formData.password.length >= 8
                              ? "bg-green-500"
                              : formData.password.length >= 6
                                ? "bg-yellow-500"
                                : "bg-red-500"
                            : "bg-muted"
                        )}
                      />
                    ))}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {formData.password.length < 6
                      ? "Password too short"
                      : formData.password.length < 8
                        ? "Good password"
                        : "Strong password"}
                  </p>
                </div>
              </CardContent>
            </Card>

            <div className="flex items-start gap-3">
              <input
                type="checkbox"
                id="terms"
                required
                className="mt-1 h-4 w-4 rounded border-input text-primary focus:ring-primary"
              />
              <label htmlFor="terms" className="text-sm text-muted-foreground">
                I agree to the{" "}
                <a href="#" className="text-primary hover:underline font-medium">
                  Terms of Service
                </a>{" "}
                and{" "}
                <a href="#" className="text-primary hover:underline font-medium">
                  Privacy Policy
                </a>
              </label>
            </div>

            <div className="flex gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={handlePrevStep}
                className="flex-1 h-12 rounded-xl text-base font-medium bg-transparent"
              >
                <ChevronLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
              <Button
                type="submit"
                disabled={isLoading || isSuccess}
                className={cn(
                  "flex-1 h-12 rounded-xl text-base font-medium transition-all duration-300",
                  isSuccess
                    ? "bg-green-500 hover:bg-green-500"
                    : "bg-primary hover:bg-primary/90 hover:shadow-lg hover:shadow-primary/25"
                )}
              >
                {isLoading ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : isSuccess ? (
                  <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="flex items-center gap-2">
                    <Check className="h-5 w-5" />
                    Account Created!
                  </motion.div>
                ) : (
                  "Create Account"
                )}
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </form>
  )
}
