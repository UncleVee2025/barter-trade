// Core types for the Barter Trade Namibia platform

export interface User {
  id: string
  email: string
  name: string
  phone?: string
  region: string
  avatar?: string
  role: "user" | "admin"
  walletBalance: number
  isVerified: boolean
  isBanned: boolean
  createdAt: Date
  lastSeen: Date
}

export interface Listing {
  id: string
  userId: string
  title: string
  description: string
  category: string
  subcategory?: string
  type: "item" | "service"
  value: number
  images: string[]
  location: {
    region: string
    town?: string
    coordinates?: { lat: number; lng: number }
  }
  status: "pending" | "active" | "sold" | "flagged" | "expired"
  views: number
  saves: number
  createdAt: Date
  expiresAt: Date
}

export interface Transaction {
  id: string
  type: "topup" | "transfer" | "listing_fee" | "voucher" | "trade"
  fromUserId?: string
  toUserId?: string
  amount: number
  fee: number
  status: "pending" | "completed" | "failed" | "refunded"
  reference?: string
  metadata?: Record<string, unknown>
  createdAt: Date
}

export interface TradeOffer {
  id: string
  senderId: string
  receiverId: string
  senderItems: string[]
  receiverItems: string[]
  walletAmount: number
  message?: string
  status: "pending" | "accepted" | "rejected" | "countered" | "expired"
  expiresAt: Date
  createdAt: Date
}

export interface Message {
  id: string
  conversationId: string
  senderId: string
  content: string
  type: "text" | "image" | "offer"
  offerId?: string
  readAt?: Date
  createdAt: Date
}

export interface Conversation {
  id: string
  participants: string[]
  listingId?: string
  lastMessage?: Message
  updatedAt: Date
  createdAt: Date
}

export interface Voucher {
  id: string
  code: string
  amount: number
  type: "scratch" | "online"
  status: "unused" | "used" | "disabled" | "expired"
  vendor?: string
  batchId?: string
  createdBy: string
  usedBy?: string
  usedByPhone?: string
  usedAt?: Date
  expiresAt: Date
  createdAt: Date
}

// Voucher type for database operations
// "exported" status means the voucher has been given to a vendor and is available for user redemption
export type VoucherStatus = "unused" | "used" | "disabled" | "expired" | "exported"
export type VoucherType = "scratch" | "online"

export interface Notification {
  id: string
  userId: string
  type: "trade" | "message" | "wallet" | "listing" | "system"
  title: string
  message: string
  data?: Record<string, unknown>
  isRead: boolean
  createdAt: Date
}

// Socket.IO event types
export interface ServerToClientEvents {
  "wallet:update": (data: { balance: number; transaction: Transaction }) => void
  "message:new": (message: Message) => void
  "message:typing": (data: { conversationId: string; userId: string }) => void
  "offer:update": (offer: TradeOffer) => void
  "notification:new": (notification: Notification) => void
  "user:online": (userId: string) => void
  "user:offline": (userId: string) => void
}

export interface ClientToServerEvents {
  "join:room": (roomId: string) => void
  "leave:room": (roomId: string) => void
  "message:send": (data: { conversationId: string; content: string; type: string }) => void
  "message:typing": (conversationId: string) => void
  "offer:send": (offer: Omit<TradeOffer, "id" | "createdAt">) => void
  "offer:respond": (data: { offerId: string; action: "accept" | "reject" | "counter" }) => void
}

// Fee structure
export const LISTING_FEES = {
  tier1: { maxValue: 500, fee: 5 },
  tier2: { maxValue: 2000, fee: 15 },
  tier3: { maxValue: 5000, fee: 30 },
  tier4: { maxValue: 10000, fee: 50 },
  tier5: { maxValue: Number.POSITIVE_INFINITY, fee: 100 },
} as const

export const TRANSFER_FEE_PERCENTAGE = 0.05 // 5%

// Standard voucher denominations for vendor sales
// All voucher codes are strictly 10-digit numeric
// FIXED VALUES ONLY: 10, 20, 50, 100, 200 - No other values allowed
export const VOUCHER_AMOUNTS = [10, 20, 50, 100, 200] as const

// Voucher validation helpers
export const MIN_VOUCHER_AMOUNT = 10
export const MAX_VOUCHER_AMOUNT = 200
export const VOUCHER_CODE_LENGTH = 10

// Mobile Money Banks for top-up
export const MOBILE_MONEY_BANKS = [
  { id: "fnb", name: "FNB", service: "E-Wallet", color: "#00A9E0" },
  { id: "bank-windhoek", name: "Bank Windhoek", service: "Easy Wallet", color: "#ED1C24" },
  { id: "nedbank", name: "Nedbank", service: "NedBank Money", color: "#007A33" },
  { id: "standard-bank", name: "Standard Bank", service: "Blue Voucher", color: "#0033A0" },
] as const

export type MobileMoneyBank = typeof MOBILE_MONEY_BANKS[number]["id"]

// Top-up request status for mobile money
export interface TopUpRequest {
  id: string
  userId: string
  amount: number
  bank: MobileMoneyBank
  bankName: string
  receiptUrl: string
  status: "pending" | "approved" | "rejected"
  voucherCode?: string
  rejectionReason?: string
  createdAt: Date
  processedAt?: Date
  processedBy?: string
}

export const NAMIBIAN_REGIONS = [
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
] as const

// Alias for backwards compatibility
export const NAMIBIA_REGIONS = NAMIBIAN_REGIONS

export const LISTING_CATEGORIES = [
  { id: "electronics", name: "Electronics", icon: "Smartphone" },
  { id: "vehicles", name: "Vehicles", icon: "Car" },
  { id: "home", name: "Home & Garden", icon: "Home" },
  { id: "fashion", name: "Fashion", icon: "Shirt" },
  { id: "sports", name: "Sports & Leisure", icon: "Dumbbell" },
  { id: "services", name: "Services", icon: "Wrench" },
  { id: "livestock", name: "Livestock", icon: "Beef" },
  { id: "agriculture", name: "Agriculture", icon: "Wheat" },
] as const
