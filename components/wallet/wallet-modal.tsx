"use client"

import React from "react"

import { useState, useRef } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
  X,
  CreditCard,
  Smartphone,
  Ticket,
  ArrowRight,
  ArrowDownLeft,
  ArrowUpRight,
  Sparkles,
  Shield,
  Zap,
  CheckCircle2,
  History,
  AlertCircle,
  Building2,
  Upload,
  ImageIcon,
  Loader2,
  Phone,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useWallet } from "@/contexts/wallet-context"
import { useNotifications } from "@/contexts/notification-context"
import { cn } from "@/lib/utils"
import { MOBILE_MONEY_BANKS, VOUCHER_AMOUNTS } from "@/lib/types"

interface WalletModalProps {
  isOpen?: boolean
  type?: "topup" | "transfer" | "history" | "voucher" | null
  defaultTab?: "topup" | "transfer" | "voucher"
  onClose: () => void
}

export function WalletModal({ isOpen, type, defaultTab, onClose }: WalletModalProps) {
  // Support both old (type) and new (isOpen + defaultTab) props
  const modalType = type || (isOpen ? defaultTab : null)
  
  if (!modalType && !isOpen) return null

  return (
    <AnimatePresence>
      {(modalType || isOpen) && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-sm"
            onClick={onClose}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 50 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 50 }}
            transition={{ type: "spring", stiffness: 350, damping: 28 }}
            className="fixed inset-x-0 bottom-0 sm:inset-x-4 md:inset-x-auto sm:left-1/2 sm:bottom-auto sm:top-1/2 sm:-translate-x-1/2 sm:-translate-y-1/2 z-[60] w-full sm:w-[calc(100%-2rem)] sm:max-w-md max-h-[90vh] sm:max-h-[90vh] overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Mobile drag handle */}
            <div className="sm:hidden w-12 h-1.5 bg-muted-foreground/30 rounded-full mx-auto mt-3 mb-2" />
            <div className="bg-card rounded-t-3xl sm:rounded-2xl shadow-2xl border border-border overflow-hidden max-h-[85vh] sm:max-h-[85vh] overflow-y-auto pb-safe">
              {(modalType === "topup" || defaultTab === "topup") && <TopUpContent onClose={onClose} />}
              {(modalType === "transfer" || defaultTab === "transfer") && <TransferContent onClose={onClose} />}
              {(modalType === "voucher" || defaultTab === "voucher") && <VoucherContent onClose={onClose} />}
              {modalType === "history" && <HistoryContent onClose={onClose} />}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}

function TopUpContent({ onClose }: { onClose: () => void }) {
  const [method, setMethod] = useState<"voucher" | "mobile" | null>(null)
  const [amount, setAmount] = useState("")
  const [selectedBank, setSelectedBank] = useState<string | null>(null)
  const [receiptFile, setReceiptFile] = useState<File | null>(null)
  const [receiptPreview, setReceiptPreview] = useState<string | null>(null)
  const [step, setStep] = useState<"method" | "amount" | "bank" | "receipt" | "processing" | "success" | "error">("method")
  const [errorMessage, setErrorMessage] = useState("")
  const [voucherCode, setVoucherCode] = useState("")
  const { redeemVoucher, topUp } = useWallet()
  const { showToast } = useNotifications()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      if (!file.type.startsWith("image/")) {
        showToast({
          type: "error",
          title: "Invalid File",
          message: "Please upload an image file",
          duration: 3000,
        })
        return
      }
      setReceiptFile(file)
      const reader = new FileReader()
      reader.onloadend = () => {
        setReceiptPreview(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleVoucherRedeem = async () => {
    if (!voucherCode || voucherCode.length !== 10) {
      setErrorMessage("Please enter a valid 10-digit voucher code")
      setStep("error")
      return
    }
    
    setStep("processing")
    const result = await redeemVoucher(voucherCode)

    if (result.success && result.amount) {
      setAmount(result.amount.toString())
      setStep("success")
      showToast({
        type: "success",
        title: "Voucher Redeemed!",
        message: `N$ ${result.amount} credit has been added to your wallet`,
        duration: 5000,
      })
      setTimeout(() => {
        onClose()
      }, 2000)
    } else {
      setErrorMessage(result.error || "Invalid voucher code")
      setStep("error")
    }
  }

  const handleMobileMoneySubmit = async () => {
    if (!amount || !selectedBank || !receiptFile) {
      setErrorMessage("Please complete all fields")
      setStep("error")
      return
    }

    setStep("processing")

    try {
      // Upload receipt image first
      const formData = new FormData()
      formData.append("file", receiptFile)
      formData.append("folder", "receipts")

      const uploadRes = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      })

      if (!uploadRes.ok) {
        throw new Error("Failed to upload receipt")
      }

      const { url: receiptUrl } = await uploadRes.json()

      // Submit top-up request
      const response = await fetch("/api/wallet/mobile-money", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: Number(amount),
          bank: selectedBank,
          receiptUrl,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to submit request")
      }

      setStep("success")
      showToast({
        type: "success",
        title: "Request Submitted",
        message: "Your credit top-up request has been submitted for approval",
        duration: 5000,
      })
      setTimeout(() => {
        onClose()
      }, 3000)
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Failed to submit request")
      setStep("error")
    }
  }

  if (step === "processing") {
    return (
      <div className="p-8 text-center">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Number.POSITIVE_INFINITY, ease: "linear" }}
          className="w-20 h-20 mx-auto mb-6"
        >
          <div className="w-full h-full rounded-full border-4 border-primary/20 border-t-primary" />
        </motion.div>
        <h3 className="text-xl font-semibold mb-2">Processing</h3>
        <p className="text-muted-foreground">
          {method === "voucher" ? "Validating voucher code..." : "Submitting your top-up request..."}
        </p>
      </div>
    )
  }

  if (step === "success") {
    return (
      <div className="p-8 text-center">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", stiffness: 200, damping: 15 }}
          className="w-20 h-20 mx-auto mb-6 bg-green-500/20 rounded-full flex items-center justify-center"
        >
          <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.2 }}>
            <CheckCircle2 className="w-10 h-10 text-green-500" />
          </motion.div>
        </motion.div>
        <motion.h3
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="text-xl font-semibold mb-2"
        >
          {method === "voucher" ? "Voucher Redeemed!" : "Request Submitted!"}
        </motion.h3>
        {method === "voucher" ? (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="text-3xl font-bold text-green-500"
          >
            +N$ {amount}
          </motion.p>
        ) : (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="text-muted-foreground"
          >
            Your N$ {amount} credit top-up request is pending approval. You will be notified once processed.
          </motion.p>
        )}
      </div>
    )
  }

  if (step === "error") {
    return (
      <div className="p-8 text-center">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="w-20 h-20 mx-auto mb-6 bg-red-500/20 rounded-full flex items-center justify-center"
        >
          <AlertCircle className="w-10 h-10 text-red-500" />
        </motion.div>
        <h3 className="text-xl font-semibold mb-2">Error</h3>
        <p className="text-muted-foreground mb-6">{errorMessage}</p>
        <Button onClick={() => setStep(method === "voucher" ? "method" : "receipt")} variant="outline" className="rounded-xl bg-transparent">
          Try Again
        </Button>
      </div>
    )
  }

  // Method Selection
  if (step === "method") {
    return (
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <motion.div
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: "spring", stiffness: 200, damping: 15 }}
              className="w-10 h-10 rounded-xl bg-gradient-to-br from-green-500 to-emerald-400 flex items-center justify-center"
            >
              <Sparkles className="h-5 w-5 text-white" />
            </motion.div>
            <div>
              <h2 className="text-lg font-bold text-foreground">Add Credit</h2>
              <p className="text-xs text-muted-foreground">Choose a method to add credit</p>
            </div>
          </div>
          <motion.button
            onClick={onClose}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            <X className="h-5 w-5" />
          </motion.button>
        </div>

        <div className="space-y-3">
          {/* Voucher Code Option */}
          <motion.button
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => {
              setMethod("voucher")
              setStep("amount")
            }}
            className="w-full flex items-center gap-4 p-4 rounded-2xl border-2 border-border hover:border-primary/50 bg-muted/50 transition-all text-left"
          >
            <div className="w-12 h-12 rounded-xl bg-gold/10 flex items-center justify-center">
              <Ticket className="h-6 w-6 text-gold" />
            </div>
            <div className="flex-1">
              <span className="font-medium text-foreground block">Voucher Code</span>
              <span className="text-sm text-muted-foreground">Enter 10-digit voucher code</span>
            </div>
            <ArrowRight className="h-5 w-5 text-muted-foreground" />
          </motion.button>

          {/* Mobile Money Option */}
          <motion.button
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => {
              setMethod("mobile")
              setStep("amount")
            }}
            className="w-full flex items-center gap-4 p-4 rounded-2xl border-2 border-border hover:border-primary/50 bg-muted/50 transition-all text-left"
          >
            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
              <Building2 className="h-6 w-6 text-primary" />
            </div>
            <div className="flex-1">
              <span className="font-medium text-foreground block">Mobile Money</span>
              <span className="text-sm text-muted-foreground">FNB, Bank Windhoek, Nedbank, Standard Bank</span>
            </div>
            <ArrowRight className="h-5 w-5 text-muted-foreground" />
          </motion.button>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="flex items-center gap-2 p-3 bg-primary/5 rounded-xl mt-6"
        >
          <Shield className="h-4 w-4 text-primary" />
          <span className="text-xs text-muted-foreground">All transactions are secure and encrypted</span>
        </motion.div>
      </div>
    )
  }

  // Voucher Code Entry
  if (step === "amount" && method === "voucher") {
    return (
      <div className="p-4 sm:p-6">
        <div className="flex items-center justify-between mb-4 sm:mb-6">
          <div className="flex items-center gap-3">
            <motion.div className="w-10 h-10 rounded-xl bg-gradient-to-br from-gold to-yellow-400 flex items-center justify-center shadow-lg shadow-amber-500/20">
              <Ticket className="h-5 w-5 text-white" />
            </motion.div>
            <div>
              <h2 className="text-lg font-bold text-foreground">Enter Voucher</h2>
              <p className="text-xs text-muted-foreground">Redeem your voucher code</p>
            </div>
          </div>
          <motion.button
            onClick={() => setStep("method")}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            className="text-muted-foreground hover:text-foreground p-2 rounded-xl hover:bg-muted/50"
          >
            <X className="h-5 w-5" />
          </motion.button>
        </div>

        <div className="mb-4">
          <Label className="text-foreground text-sm font-medium">Voucher Code</Label>
          <Input
            value={voucherCode}
            onChange={(e) => {
              // For production: Only allow numeric digits (10-digit codes)
              const cleanCode = e.target.value.replace(/\D/g, "").slice(0, 10)
              setVoucherCode(cleanCode)
            }}
            className="h-14 mt-2 text-center text-xl sm:text-2xl font-mono tracking-[0.3em] bg-muted border-0 rounded-xl focus:ring-2 focus:ring-primary/50"
            placeholder="0000000000"
            maxLength={10}
            autoComplete="off"
            inputMode="numeric"
            pattern="[0-9]*"
          />
          <p className="text-xs text-muted-foreground mt-2 text-center">
            Enter the 10-digit code from your voucher card
          </p>
          {voucherCode.length > 0 && voucherCode.length < 10 && (
            <p className="text-xs text-amber-500 mt-1 text-center">
              {10 - voucherCode.length} more digits needed
            </p>
          )}
        </div>

        {/* Voucher instructions */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-4 p-3 sm:p-4 rounded-xl bg-amber-500/10 border border-amber-500/20"
        >
          <div className="flex items-start gap-2">
            <Shield className="h-4 w-4 text-amber-500 mt-0.5 flex-shrink-0" />
            <p className="text-xs text-muted-foreground">
              Enter your voucher code exactly as shown. The credit will be added to your wallet instantly upon successful validation.
            </p>
          </div>
        </motion.div>

        <Button
          onClick={handleVoucherRedeem}
          disabled={voucherCode.length !== 10}
          className="w-full h-12 sm:h-14 rounded-2xl text-base font-semibold bg-gradient-to-r from-amber-500 to-primary hover:opacity-90 shadow-lg shadow-primary/25 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Zap className="mr-2 h-5 w-5" />
          {voucherCode.length === 10 ? "Redeem Voucher" : `Enter ${10 - voucherCode.length} More Digits`}
        </Button>
      </div>
    )
  }

  // Mobile Money Amount Selection
  if (step === "amount" && method === "mobile") {
    return (
      <div className="p-4 sm:p-6">
        <div className="flex items-center justify-between mb-4 sm:mb-6">
          <div className="flex items-center gap-3">
            <motion.div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-orange-400 flex items-center justify-center shadow-lg shadow-primary/20">
              <Building2 className="h-5 w-5 text-white" />
            </motion.div>
            <div>
              <h2 className="text-lg font-bold text-foreground">Select Amount</h2>
              <p className="text-xs text-muted-foreground">Choose top-up value</p>
            </div>
          </div>
          <motion.button
            onClick={() => setStep("method")}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            className="text-muted-foreground hover:text-foreground p-2 rounded-xl hover:bg-muted/50"
          >
            <X className="h-5 w-5" />
          </motion.button>
        </div>

        <div className="grid grid-cols-2 gap-2 sm:gap-3 mb-4 sm:mb-6">
          {VOUCHER_AMOUNTS.map((amt, i) => (
            <motion.button
              key={amt}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setAmount(amt.toString())}
              className={cn(
                "p-3 sm:p-4 rounded-xl border-2 transition-all",
                amount === amt.toString()
                  ? "border-primary bg-primary/10 shadow-lg shadow-primary/20"
                  : "border-border hover:border-primary/50 bg-muted/30"
              )}
            >
              <span className={cn("text-xl sm:text-2xl font-bold", amount === amt.toString() ? "text-primary" : "text-foreground")}>
                N$ {amt}
              </span>
            </motion.button>
          ))}
        </div>

        <Button
          onClick={() => setStep("bank")}
          disabled={!amount}
          className="w-full h-12 sm:h-14 rounded-2xl text-base font-semibold"
        >
          Continue
          <ArrowRight className="ml-2 h-5 w-5" />
        </Button>
      </div>
    )
  }

  // Bank Selection
  if (step === "bank") {
    return (
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <motion.div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-orange-400 flex items-center justify-center">
              <Building2 className="h-5 w-5 text-white" />
            </motion.div>
            <div>
              <h2 className="text-lg font-bold text-foreground">Select Bank</h2>
              <p className="text-xs text-muted-foreground">N$ {amount} via Mobile Money</p>
            </div>
          </div>
          <motion.button
            onClick={() => setStep("amount")}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            className="text-muted-foreground hover:text-foreground"
          >
            <X className="h-5 w-5" />
          </motion.button>
        </div>

        <div className="space-y-3 mb-6">
          {MOBILE_MONEY_BANKS.map((bank, i) => (
            <motion.button
              key={bank.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.05 }}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setSelectedBank(bank.id)}
              className={cn(
                "w-full flex items-center gap-4 p-4 rounded-xl border-2 transition-all text-left",
                selectedBank === bank.id
                  ? "border-primary bg-primary/10"
                  : "border-border hover:border-primary/50 bg-muted/50"
              )}
            >
              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center text-white font-bold text-lg"
                style={{ backgroundColor: bank.color }}
              >
                {bank.name.charAt(0)}
              </div>
              <div className="flex-1">
                <span className="font-medium text-foreground block">{bank.name}</span>
                <span className="text-sm text-muted-foreground">{bank.service}</span>
              </div>
              {selectedBank === bank.id && <CheckCircle2 className="h-5 w-5 text-primary" />}
            </motion.button>
          ))}
        </div>

        <Button
          onClick={() => setStep("receipt")}
          disabled={!selectedBank}
          className="w-full h-14 rounded-2xl text-base font-semibold"
        >
          Continue
          <ArrowRight className="ml-2 h-5 w-5" />
        </Button>
      </div>
    )
  }

  // Receipt Upload
  if (step === "receipt") {
    const selectedBankInfo = MOBILE_MONEY_BANKS.find((b) => b.id === selectedBank)
    return (
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <motion.div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-orange-400 flex items-center justify-center">
              <Upload className="h-5 w-5 text-white" />
            </motion.div>
            <div>
              <h2 className="text-lg font-bold text-foreground">Upload Receipt</h2>
              <p className="text-xs text-muted-foreground">Proof of payment</p>
            </div>
          </div>
          <motion.button
            onClick={() => setStep("bank")}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            className="text-muted-foreground hover:text-foreground"
          >
            <X className="h-5 w-5" />
          </motion.button>
        </div>

        {/* Summary */}
        <div className="bg-muted rounded-xl p-4 mb-6">
          <div className="flex justify-between items-center mb-2">
            <span className="text-muted-foreground">Amount</span>
            <span className="font-bold text-xl text-primary">N${amount}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-muted-foreground">Bank</span>
            <span className="font-medium">{selectedBankInfo?.name} - {selectedBankInfo?.service}</span>
          </div>
        </div>

        {/* Instructions */}
        <div className="bg-gradient-to-br from-primary/10 to-amber-500/10 rounded-xl p-4 mb-6 border border-primary/20">
          <div className="flex items-start gap-3">
            <Phone className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
            <div className="space-y-2">
              <p className="font-semibold text-foreground">Payment Instructions</p>
              <p className="text-sm text-muted-foreground">
                To top up your wallet using Mobile Money:
              </p>
              <ol className="text-sm text-muted-foreground space-y-1.5 list-decimal list-inside">
                <li>Send <span className="font-semibold text-primary">N$ {amount}</span> to:</li>
                <li className="pl-4">
                  <span className="font-mono font-bold text-lg text-foreground">+264 81 457 4899</span>
                </li>
                <li>Use your registered name as reference</li>
                <li>Take a screenshot of the payment confirmation</li>
                <li>Upload the screenshot below</li>
              </ol>
              <div className="mt-3 p-2 bg-muted rounded-lg">
                <p className="text-xs text-muted-foreground">
                  <strong>Bank:</strong> {selectedBankInfo?.name} - {selectedBankInfo?.service}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Upload Area */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileSelect}
          className="hidden"
        />
        
        {receiptPreview ? (
          <div className="relative mb-6">
            <img
              src={receiptPreview || "/placeholder.svg"}
              alt="Receipt preview"
              className="w-full h-48 object-contain bg-muted rounded-xl"
            />
            <button
              onClick={() => {
                setReceiptFile(null)
                setReceiptPreview(null)
              }}
              className="absolute top-2 right-2 w-8 h-8 bg-red-500 text-white rounded-full flex items-center justify-center"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        ) : (
          <button
            onClick={() => fileInputRef.current?.click()}
            className="w-full h-40 border-2 border-dashed border-border rounded-xl flex flex-col items-center justify-center gap-3 hover:border-primary/50 hover:bg-muted/50 transition-all mb-6"
          >
            <div className="w-12 h-12 rounded-xl bg-muted flex items-center justify-center">
              <ImageIcon className="h-6 w-6 text-muted-foreground" />
            </div>
            <div className="text-center">
              <p className="font-medium text-foreground">Upload Receipt</p>
              <p className="text-sm text-muted-foreground">Click or drag & drop</p>
            </div>
          </button>
        )}

        <Button
          onClick={handleMobileMoneySubmit}
          disabled={!receiptFile}
          className="w-full h-14 rounded-2xl text-base font-semibold"
        >
          Submit for Approval
          <ArrowRight className="ml-2 h-5 w-5" />
        </Button>
      </div>
    )
  }

  return null
}

interface LookupUser {
  id: string
  name: string
  phone: string | null
  email: string
  avatar: string | null
  isVerified: boolean
  phoneRaw: string | null
  emailRaw: string
}

function TransferContent({ onClose }: { onClose: () => void }) {
  const [recipient, setRecipient] = useState("")
  const [recipientName, setRecipientName] = useState("")
  const [amount, setAmount] = useState("")
  const [step, setStep] = useState<"form" | "confirm" | "processing" | "success" | "error">("form")
  const [errorMessage, setErrorMessage] = useState("")
  const [lookupResults, setLookupResults] = useState<LookupUser[]>([])
  const [isLookingUp, setIsLookingUp] = useState(false)
  const [showLookup, setShowLookup] = useState(false)
  const { transfer, balance } = useWallet()
  const { showToast } = useNotifications()

  const fee = amount ? Number.parseFloat(amount) * 0.05 : 0
  const recipientGets = amount ? Number.parseFloat(amount) - fee : 0

  // Detect if input is email or phone
  const isEmail = recipient.includes("@")
  const isValidPhone = /^\+?264\s?\d{2}\s?\d{3}\s?\d{4}$/.test(recipient.replace(/\s/g, "")) || 
                       /^0\d{2}\s?\d{3}\s?\d{4}$/.test(recipient.replace(/\s/g, ""))

  // Lookup users as user types
  const handleRecipientChange = async (value: string) => {
    setRecipient(value)
    setRecipientName("") // Clear selected name when typing
    
    if (value.length >= 3) {
      setIsLookingUp(true)
      setShowLookup(true)
      try {
        const response = await fetch(`/api/user/lookup?q=${encodeURIComponent(value)}`)
        if (response.ok) {
          const data = await response.json()
          setLookupResults(data.users || [])
        }
      } catch {
        setLookupResults([])
      } finally {
        setIsLookingUp(false)
      }
    } else {
      setLookupResults([])
      setShowLookup(false)
    }
  }

  // Select a user from lookup results
  const selectUser = (user: LookupUser) => {
    setRecipient(user.phoneRaw || user.emailRaw)
    setRecipientName(user.name)
    setShowLookup(false)
    setLookupResults([])
  }

  const handleTransfer = async () => {
    if (!recipient || !amount) return
    setStep("processing")

    const result = await transfer(recipient, Number.parseFloat(amount), isEmail)

    if (result.success) {
      setStep("success")
      showToast({
        type: "success",
        title: "Transfer Successful",
        message: `N$${recipientGets.toFixed(2)} sent successfully`,
        duration: 5000,
      })
      setTimeout(() => {
        onClose()
        setStep("form")
        setRecipient("")
        setAmount("")
      }, 2000)
    } else {
      setErrorMessage(result.error || "Transfer failed")
      setStep("error")
      showToast({
        type: "error",
        title: "Transfer Failed",
        message: result.error || "Please try again",
        duration: 5000,
      })
    }
  }

  if (step === "processing") {
    return (
      <div className="p-8 text-center">
        <motion.div className="relative w-24 h-24 mx-auto mb-6">
          <motion.div
            className="absolute inset-0 rounded-full border-4 border-primary/20"
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Number.POSITIVE_INFINITY, ease: "linear" }}
          />
          <motion.div
            className="absolute inset-2 rounded-full border-4 border-transparent border-t-primary"
            animate={{ rotate: -360 }}
            transition={{ duration: 1.5, repeat: Number.POSITIVE_INFINITY, ease: "linear" }}
          />
          <div className="absolute inset-0 flex items-center justify-center">
            <ArrowUpRight className="w-8 h-8 text-primary" />
          </div>
        </motion.div>
        <h3 className="text-xl font-semibold mb-2">Sending Credit</h3>
        <p className="text-muted-foreground">
          Transferring N$ {recipientGets.toFixed(2)} credit to {recipient}...
        </p>
      </div>
    )
  }

  if (step === "success") {
    return (
      <div className="p-8 text-center">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", stiffness: 200, damping: 15 }}
          className="w-20 h-20 mx-auto mb-6 bg-green-500/20 rounded-full flex items-center justify-center"
        >
          <CheckCircle2 className="w-10 h-10 text-green-500" />
        </motion.div>
        <h3 className="text-xl font-semibold mb-2">Transfer Successful!</h3>
        <p className="text-3xl font-bold text-foreground mb-1">N${recipientGets.toFixed(2)}</p>
        <p className="text-muted-foreground">Sent to {recipient}</p>
      </div>
    )
  }

  if (step === "error") {
    return (
      <div className="p-8 text-center">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="w-20 h-20 mx-auto mb-6 bg-red-500/20 rounded-full flex items-center justify-center"
        >
          <AlertCircle className="w-10 h-10 text-red-500" />
        </motion.div>
        <h3 className="text-xl font-semibold mb-2">Transfer Failed</h3>
        <p className="text-muted-foreground mb-6">{errorMessage}</p>
        <Button onClick={() => setStep("form")} variant="outline" className="rounded-xl bg-transparent">
          Try Again
        </Button>
      </div>
    )
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <motion.div
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: "spring", stiffness: 200, damping: 15 }}
            className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-orange-400 flex items-center justify-center"
          >
            <ArrowUpRight className="h-5 w-5 text-white" />
          </motion.div>
          <div>
            <h2 className="text-lg font-bold text-foreground">Send Credit</h2>
            <p className="text-xs text-muted-foreground">Transfer credit to another trader</p>
          </div>
        </div>
        <motion.button
          onClick={onClose}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          className="text-muted-foreground hover:text-foreground"
        >
          <X className="h-5 w-5" />
        </motion.button>
      </div>

      <div className="space-y-4">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <Label className="text-foreground text-sm font-medium">Recipient</Label>
          <div className="relative mt-2">
            <Phone className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input
              value={recipient}
              onChange={(e) => handleRecipientChange(e.target.value)}
              onFocus={() => lookupResults.length > 0 && setShowLookup(true)}
              onBlur={() => setTimeout(() => setShowLookup(false), 200)}
              className="h-12 pl-12 bg-muted border-0 rounded-xl"
              placeholder="Phone number or email"
            />
            {isLookingUp && (
              <Loader2 className="absolute right-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground animate-spin" />
            )}
            
            {/* Lookup results dropdown */}
            <AnimatePresence>
              {showLookup && lookupResults.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="absolute top-full left-0 right-0 mt-2 bg-card border border-border rounded-xl shadow-lg overflow-hidden z-50"
                >
                  {lookupResults.map((user) => (
                    <button
                      key={user.id}
                      onClick={() => selectUser(user)}
                      className="w-full flex items-center gap-3 p-3 hover:bg-muted transition-colors text-left"
                    >
                      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                        {user.avatar ? (
                          <img src={user.avatar || "/placeholder.svg"} alt="" className="w-full h-full rounded-full object-cover" />
                        ) : (
                          <span className="text-sm font-medium text-primary">
                            {user.name.charAt(0).toUpperCase()}
                          </span>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-foreground truncate flex items-center gap-1">
                          {user.name}
                          {user.isVerified && (
                            <CheckCircle2 className="h-3.5 w-3.5 text-blue-500 flex-shrink-0" />
                          )}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {user.phone || user.email}
                        </p>
                      </div>
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
          
          {/* Show selected recipient name */}
          {recipientName ? (
            <p className="text-sm text-green-500 mt-1 flex items-center gap-1">
              <CheckCircle2 className="h-3.5 w-3.5" />
              Sending to: {recipientName}
            </p>
          ) : (
            <p className="text-xs text-muted-foreground mt-1">
              Enter phone number or email to find a trader
            </p>
          )}
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <div className="flex items-center justify-between">
            <Label className="text-foreground text-sm font-medium">Amount</Label>
            <span className="text-xs text-muted-foreground">Balance: N${balance.toFixed(2)}</span>
          </div>
          <div className="relative mt-2">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground font-bold">N$</span>
            <Input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="h-14 pl-12 text-2xl font-bold bg-muted border-0 rounded-xl"
              placeholder="0.00"
              max={balance}
            />
          </div>
        </motion.div>

        <AnimatePresence>
          {amount && Number.parseFloat(amount) > 0 && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="bg-muted rounded-2xl p-4 space-y-3 overflow-hidden"
            >
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">You send</span>
                <span className="font-medium text-foreground">N${Number.parseFloat(amount).toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Platform fee (5%)</span>
                <span className="font-medium text-red-400">-N${fee.toFixed(2)}</span>
              </div>
              <div className="border-t border-border pt-3 flex justify-between">
                <span className="text-muted-foreground font-medium">Recipient gets</span>
                <motion.span
                  key={recipientGets}
                  initial={{ scale: 1.2 }}
                  animate={{ scale: 1 }}
                  className="font-bold text-green-500 text-lg"
                >
                  N${recipientGets.toFixed(2)}
                </motion.span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
          <Button
            onClick={handleTransfer}
            disabled={!recipient || !amount || Number.parseFloat(amount) > balance || Number(amount) < 5 || (!isEmail && !isValidPhone)}
            className="w-full h-14 rounded-2xl text-base font-semibold bg-primary hover:bg-primary/90 shadow-lg shadow-primary/25"
          >
            Send N${amount || "0"}
            <ArrowRight className="ml-2 h-5 w-5" />
          </Button>
        </motion.div>
      </div>
    </div>
  )
}

function VoucherContent({ onClose }: { onClose: () => void }) {
  const [code, setCode] = useState("")
  const [step, setStep] = useState<"input" | "processing" | "success" | "error">("input")
  const [redeemedAmount, setRedeemedAmount] = useState(0)
  const [errorMessage, setErrorMessage] = useState("")
  const { redeemVoucher } = useWallet()
  const { showToast } = useNotifications()

  const handleRedeem = async () => {
    if (!code || code.length < 3) return
    setStep("processing")

    const result = await redeemVoucher(code)

    if (result.success && result.amount) {
      setRedeemedAmount(result.amount)
      setStep("success")
      showToast({
        type: "success",
        title: "Voucher Redeemed!",
        message: `N$${result.amount} has been added to your wallet`,
        duration: 5000,
      })
      setTimeout(() => {
        onClose()
        setStep("input")
        setCode("")
      }, 2500)
    } else {
      setErrorMessage(result.error || "Invalid voucher code")
      setStep("error")
      showToast({
        type: "error",
        title: "Invalid Voucher",
        message: result.error || "Please check your code and try again",
        duration: 5000,
      })
    }
  }

  if (step === "processing") {
    return (
      <div className="p-8 text-center">
        <motion.div className="relative w-24 h-24 mx-auto mb-6">
          <motion.div
            className="absolute inset-0"
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Number.POSITIVE_INFINITY, ease: "linear" }}
          >
            <Ticket className="w-full h-full text-gold/20" />
          </motion.div>
          <motion.div
            className="absolute inset-0 flex items-center justify-center"
            animate={{ scale: [1, 1.1, 1] }}
            transition={{ duration: 1, repeat: Number.POSITIVE_INFINITY }}
          >
            <Zap className="w-10 h-10 text-gold" />
          </motion.div>
        </motion.div>
        <h3 className="text-xl font-semibold mb-2">Validating Voucher</h3>
        <p className="text-muted-foreground">Checking code {code}...</p>
      </div>
    )
  }

  if (step === "success") {
    return (
      <div className="p-8 text-center">
        <motion.div
          initial={{ scale: 0, rotate: -180 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: "spring", stiffness: 200, damping: 15 }}
          className="w-24 h-24 mx-auto mb-6 bg-gradient-to-br from-gold/20 to-primary/20 rounded-full flex items-center justify-center"
        >
          <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.3, type: "spring" }}>
            <Sparkles className="w-12 h-12 text-gold" />
          </motion.div>
        </motion.div>
        <motion.h3
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="text-xl font-semibold mb-2"
        >
          Voucher Redeemed!
        </motion.h3>
        <motion.div
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.5, type: "spring" }}
          className="text-4xl font-bold text-gold mb-2"
        >
          +N${redeemedAmount}
        </motion.div>
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="text-muted-foreground"
        >
          Added to your wallet
        </motion.p>
      </div>
    )
  }

  if (step === "error") {
    return (
      <div className="p-8 text-center">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="w-20 h-20 mx-auto mb-6 bg-red-500/20 rounded-full flex items-center justify-center"
        >
          <AlertCircle className="w-10 h-10 text-red-500" />
        </motion.div>
        <h3 className="text-xl font-semibold mb-2">Invalid Voucher</h3>
        <p className="text-muted-foreground mb-6">{errorMessage}</p>
        <Button onClick={() => setStep("input")} variant="outline" className="rounded-xl bg-transparent">
          Try Again
        </Button>
      </div>
    )
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <motion.div
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: "spring", stiffness: 200, damping: 15 }}
            className="w-10 h-10 rounded-xl bg-gradient-to-br from-gold to-yellow-400 flex items-center justify-center"
          >
            <Ticket className="h-5 w-5 text-white" />
          </motion.div>
          <div>
            <h2 className="text-lg font-bold text-foreground">Redeem Voucher</h2>
            <p className="text-xs text-muted-foreground">Enter your 10-digit code</p>
          </div>
        </div>
        <motion.button
          onClick={onClose}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          className="text-muted-foreground hover:text-foreground"
        >
          <X className="h-5 w-5" />
        </motion.button>
      </div>

      {/* Voucher card illustration */}
      <motion.div
        initial={{ rotateY: -10, opacity: 0 }}
        animate={{ rotateY: 0, opacity: 1 }}
        transition={{ delay: 0.1 }}
        className="relative bg-gradient-to-br from-gold/20 to-primary/20 rounded-2xl p-6 mb-6 overflow-hidden"
      >
        <div className="absolute top-0 right-0 w-32 h-32 bg-gold/10 rounded-full blur-2xl" />
        <div className="relative flex items-center justify-between">
          <div>
            <Ticket className="h-10 w-10 text-gold mb-2" />
            <div className="text-sm text-muted-foreground">Gift Voucher</div>
            <div className="text-2xl font-bold text-foreground">BT ???</div>
          </div>
          <div className="text-right">
            <div className="text-xs text-muted-foreground mb-1">Code</div>
            <div className="font-mono text-lg text-primary tracking-wider">{code || "XXXXXXXXXX"}</div>
          </div>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="mb-6"
      >
        <Label className="text-foreground text-sm font-medium">Voucher Code</Label>
        <Input
          value={code}
          onChange={(e) => setCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 20))}
          className="h-14 mt-2 text-center text-xl sm:text-2xl font-mono tracking-wider bg-muted border-0 rounded-xl uppercase"
          placeholder="Enter code"
          maxLength={20}
          autoComplete="off"
          autoCapitalize="characters"
        />
        <p className="text-xs text-muted-foreground mt-2 text-center">Enter your voucher code exactly as shown on your card or receipt</p>
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
        <Button
          onClick={handleRedeem}
          disabled={code.length < 3}
          className="w-full h-14 rounded-2xl text-base font-semibold bg-gradient-to-r from-gold to-primary hover:opacity-90 shadow-lg"
        >
          <Zap className="mr-2 h-5 w-5" />
          Redeem Voucher
        </Button>
      </motion.div>
    </div>
  )
}

function HistoryContent({ onClose }: { onClose: () => void }) {
  const { transactions } = useWallet()
  const [filter, setFilter] = useState<"all" | "credit" | "debit">("all")

  const filteredTransactions = transactions.filter((tx) => {
    if (filter === "all") return true
    return tx.type === filter
  })

  return (
    <div className="p-4 sm:p-6 max-h-[75vh] sm:max-h-[80vh] overflow-hidden flex flex-col">
      <div className="flex items-center justify-between mb-4 sm:mb-6">
        <div className="flex items-center gap-3">
          <motion.div
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: "spring", stiffness: 200, damping: 15 }}
            className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-400 flex items-center justify-center shadow-lg shadow-blue-500/20"
          >
            <History className="h-5 w-5 text-white" />
          </motion.div>
          <div>
            <h2 className="text-lg font-bold text-foreground">Transaction History</h2>
            <p className="text-xs text-muted-foreground">{transactions.length} transactions</p>
          </div>
        </div>
        <motion.button
          onClick={onClose}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          className="text-muted-foreground hover:text-foreground p-2 rounded-xl hover:bg-muted/50"
        >
          <X className="h-5 w-5" />
        </motion.button>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2 mb-4">
        {[
          { id: "all", label: "All" },
          { id: "credit", label: "Received" },
          { id: "debit", label: "Sent" },
        ].map((f, i) => (
          <motion.button
            key={f.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            onClick={() => setFilter(f.id as typeof filter)}
            className={cn(
              "px-4 py-2 rounded-xl text-sm font-medium transition-all",
              filter === f.id
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground hover:text-foreground",
            )}
          >
            {f.label}
          </motion.button>
        ))}
      </div>

      <div className="flex-1 overflow-auto space-y-2 pr-1">
        {filteredTransactions.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <History className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p>No transactions yet</p>
          </div>
        ) : (
          filteredTransactions.map((tx, i) => (
            <motion.div
              key={tx.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.03 }}
              whileHover={{ scale: 1.01, x: 4 }}
              className="flex items-center gap-3 p-3 rounded-xl bg-muted/50 hover:bg-muted transition-all cursor-pointer"
            >
              <div
                className={cn(
                  "w-10 h-10 rounded-xl flex items-center justify-center",
                  tx.type === "credit" ? "bg-green-500/10 text-green-500" : "bg-muted text-muted-foreground",
                )}
              >
                {tx.type === "credit" ? <ArrowDownLeft className="h-5 w-5" /> : <ArrowUpRight className="h-5 w-5" />}
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-medium text-foreground truncate">{tx.description}</div>
                <div className="text-xs text-muted-foreground flex items-center gap-2">
                  {tx.date}
                  {tx.status === "pending" && (
                    <span className="px-1.5 py-0.5 bg-amber-500/10 text-amber-500 rounded text-[10px] font-medium">
                      Pending
                    </span>
                  )}
                </div>
              </div>
              <div className={cn("text-sm font-semibold", tx.type === "credit" ? "text-green-500" : "text-foreground")}>
                {tx.type === "credit" ? "+" : "-"}N${tx.amount.toFixed(2)}
              </div>
            </motion.div>
          ))
        )}
      </div>
    </div>
  )
}
