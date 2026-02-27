/**
 * Input validation utilities for API routes
 * Provides consistent validation and sanitization across the application
 */

// Email validation
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

// Phone number validation (Namibian format)
export function isValidPhone(phone: string): boolean {
  // Namibian phone numbers: +264 followed by 9 digits, or 081/085 etc
  const cleanPhone = phone.replace(/[\s\-\(\)]/g, "")
  const namibiaRegex = /^(\+264|0)?[8][0-9]{8}$/
  return namibiaRegex.test(cleanPhone)
}

// Password strength validation
export function validatePassword(password: string): { valid: boolean; errors: string[] } {
  const errors: string[] = []
  
  if (password.length < 6) {
    errors.push("Password must be at least 6 characters long")
  }
  if (password.length > 128) {
    errors.push("Password must be less than 128 characters")
  }
  
  return {
    valid: errors.length === 0,
    errors,
  }
}

// Name validation
export function isValidName(name: string): boolean {
  const trimmed = name.trim()
  return trimmed.length >= 2 && trimmed.length <= 100
}

// Sanitize string input - removes potentially dangerous characters
export function sanitizeString(input: string): string {
  return input
    .trim()
    .replace(/[<>]/g, "") // Remove angle brackets to prevent XSS
    .substring(0, 10000) // Limit length
}

// Sanitize for SQL queries (parameterized queries are preferred, but this is an extra layer)
export function sanitizeForDB(input: string): string {
  return input
    .trim()
    .replace(/[\x00-\x1F\x7F]/g, "") // Remove control characters
    .substring(0, 10000)
}

// Validate amount (for wallet operations)
export function validateAmount(amount: unknown): { valid: boolean; value: number; error?: string } {
  if (typeof amount !== "number" && typeof amount !== "string") {
    return { valid: false, value: 0, error: "Amount must be a number" }
  }
  
  const numAmount = Number(amount)
  
  if (Number.isNaN(numAmount)) {
    return { valid: false, value: 0, error: "Invalid amount format" }
  }
  
  if (numAmount <= 0) {
    return { valid: false, value: 0, error: "Amount must be greater than 0" }
  }
  
  if (numAmount > 1000000) {
    return { valid: false, value: 0, error: "Amount exceeds maximum limit" }
  }
  
  // Round to 2 decimal places
  const roundedAmount = Math.round(numAmount * 100) / 100
  
  return { valid: true, value: roundedAmount }
}

// Validate listing data
export interface ListingValidationResult {
  valid: boolean
  errors: Record<string, string>
}

export function validateListingData(data: Record<string, unknown>): ListingValidationResult {
  const errors: Record<string, string> = {}
  
  // Title validation
  if (!data.title || typeof data.title !== "string") {
    errors.title = "Title is required"
  } else if (data.title.trim().length < 3) {
    errors.title = "Title must be at least 3 characters"
  } else if (data.title.trim().length > 200) {
    errors.title = "Title must be less than 200 characters"
  }
  
  // Description validation
  if (!data.description || typeof data.description !== "string") {
    errors.description = "Description is required"
  } else if (data.description.trim().length < 10) {
    errors.description = "Description must be at least 10 characters"
  } else if (data.description.trim().length > 5000) {
    errors.description = "Description must be less than 5000 characters"
  }
  
  // Value validation
  const valueValidation = validateAmount(data.value)
  if (!valueValidation.valid) {
    errors.value = valueValidation.error || "Invalid value"
  }
  
  // Category validation
  if (!data.category || typeof data.category !== "string") {
    errors.category = "Category is required"
  }
  
  // Region validation
  if (!data.region || typeof data.region !== "string") {
    errors.region = "Region is required"
  }
  
  return {
    valid: Object.keys(errors).length === 0,
    errors,
  }
}

// Validate offer data
export function validateOfferData(data: Record<string, unknown>): ListingValidationResult {
  const errors: Record<string, string> = {}
  
  if (!data.listingId || typeof data.listingId !== "string") {
    errors.listingId = "Listing ID is required"
  }
  
  if (!data.type || !["cash", "trade", "mixed"].includes(data.type as string)) {
    errors.type = "Invalid offer type"
  }
  
  if (data.type === "cash" || data.type === "mixed") {
    if (data.cashAmount !== undefined) {
      const amountValidation = validateAmount(data.cashAmount)
      if (!amountValidation.valid) {
        errors.cashAmount = amountValidation.error || "Invalid cash amount"
      }
    }
  }
  
  if (data.message && typeof data.message === "string" && data.message.length > 1000) {
    errors.message = "Message must be less than 1000 characters"
  }
  
  return {
    valid: Object.keys(errors).length === 0,
    errors,
  }
}

// Validate UUID format
export function isValidUUID(id: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
  return uuidRegex.test(id)
}

// Validate ID format (supports both UUID and custom IDs)
export function isValidId(id: string): boolean {
  if (!id || typeof id !== "string") return false
  // Allow alphanumeric IDs between 8-36 characters
  return /^[a-zA-Z0-9\-_]{8,36}$/.test(id)
}

// Generic validation response helper
export function validationErrorResponse(errors: Record<string, string>) {
  return {
    error: "VALIDATION_ERROR",
    message: "Invalid input data",
    details: errors,
  }
}
