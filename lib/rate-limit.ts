/**
 * Simple in-memory rate limiter for API routes
 * Tracks request counts per IP address with configurable limits
 */

interface RateLimitEntry {
  count: number
  resetTime: number
}

// In-memory store for rate limiting
// For production with multiple instances, consider using Redis/MySQL
const rateLimitStore = new Map<string, RateLimitEntry>()

// Clean up expired entries periodically
setInterval(() => {
  const now = Date.now()
  for (const [key, entry] of rateLimitStore.entries()) {
    if (entry.resetTime < now) {
      rateLimitStore.delete(key)
    }
  }
}, 60000) // Clean up every minute

export interface RateLimitConfig {
  /** Maximum number of requests allowed within the window */
  maxRequests: number
  /** Time window in milliseconds */
  windowMs: number
  /** Prefix for the rate limit key (e.g., 'login', 'register') */
  keyPrefix: string
}

export interface RateLimitResult {
  success: boolean
  remaining: number
  resetTime: number
  retryAfter?: number
}

/**
 * Check rate limit for a given identifier (usually IP address)
 */
export function checkRateLimit(
  identifier: string,
  config: RateLimitConfig
): RateLimitResult {
  const key = `${config.keyPrefix}:${identifier}`
  const now = Date.now()
  
  let entry = rateLimitStore.get(key)
  
  // If no entry or expired, create a new one
  if (!entry || entry.resetTime < now) {
    entry = {
      count: 0,
      resetTime: now + config.windowMs,
    }
  }
  
  // Increment the count
  entry.count++
  rateLimitStore.set(key, entry)
  
  const remaining = Math.max(0, config.maxRequests - entry.count)
  const success = entry.count <= config.maxRequests
  
  return {
    success,
    remaining,
    resetTime: entry.resetTime,
    retryAfter: success ? undefined : Math.ceil((entry.resetTime - now) / 1000),
  }
}

/**
 * Get IP address from request headers
 */
export function getClientIP(request: Request): string {
  // Check various headers for the real IP
  const forwardedFor = request.headers.get("x-forwarded-for")
  if (forwardedFor) {
    // x-forwarded-for can contain multiple IPs, take the first one
    return forwardedFor.split(",")[0].trim()
  }
  
  const realIP = request.headers.get("x-real-ip")
  if (realIP) {
    return realIP
  }
  
  // Fallback to a generic identifier
  return "unknown"
}

// Predefined rate limit configurations for different use cases
export const rateLimitConfigs = {
  // Strict limit for authentication endpoints
  auth: {
    maxRequests: 5,
    windowMs: 15 * 60 * 1000, // 15 minutes
    keyPrefix: "auth",
  } as RateLimitConfig,
  
  // Voucher redemption - prevent brute force
  voucher: {
    maxRequests: 10,
    windowMs: 60 * 60 * 1000, // 1 hour
    keyPrefix: "voucher",
  } as RateLimitConfig,
  
  // Wallet transfers - prevent abuse
  transfer: {
    maxRequests: 20,
    windowMs: 60 * 60 * 1000, // 1 hour
    keyPrefix: "transfer",
  } as RateLimitConfig,
  
  // API general - more lenient
  api: {
    maxRequests: 100,
    windowMs: 60 * 1000, // 1 minute
    keyPrefix: "api",
  } as RateLimitConfig,
  
  // Listing creation - prevent spam
  listing: {
    maxRequests: 10,
    windowMs: 60 * 60 * 1000, // 1 hour
    keyPrefix: "listing",
  } as RateLimitConfig,
  
  // Message sending - prevent spam
  message: {
    maxRequests: 50,
    windowMs: 60 * 1000, // 1 minute
    keyPrefix: "message",
  } as RateLimitConfig,
}

/**
 * Helper function to create a rate limit exceeded response
 */
export function rateLimitExceededResponse(result: RateLimitResult) {
  return new Response(
    JSON.stringify({
      error: "RATE_LIMIT_EXCEEDED",
      message: "Too many requests. Please try again later.",
      retryAfter: result.retryAfter,
    }),
    {
      status: 429,
      headers: {
        "Content-Type": "application/json",
        "Retry-After": String(result.retryAfter || 60),
        "X-RateLimit-Remaining": String(result.remaining),
        "X-RateLimit-Reset": String(result.resetTime),
      },
    }
  )
}
