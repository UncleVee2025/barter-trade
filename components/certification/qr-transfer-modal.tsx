"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { 
  Send, 
  Wallet, 
  CheckCircle2, 
  AlertCircle,
  Loader2,
  ArrowRight
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
  DialogDescription,
  DialogFooter
} from "@/components/ui/dialog"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { useToast } from "@/hooks/use-toast"
import { cn } from "@/lib/utils"

interface QRTransferModalProps {
  open: boolean
  onClose: () => void
  recipientQrCode: string
  recipientName: string
}

type TransferStep = "amount" | "confirm" | "processing" | "success" | "error"

export function QRTransferModal({
  open,
  onClose,
  recipientQrCode,
  recipientName
}: QRTransferModalProps) {
  const [step, setStep] = useState<TransferStep>("amount")
  const [amount, setAmount] = useState("")
  const [note, setNote] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<{
    transaction_id?: string
    new_balance?: number
    message?: string
  } | null>(null)
  const { toast } = useToast()

  const resetModal = () => {
    setStep("amount")
    setAmount("")
    setNote("")
    setError(null)
    setResult(null)
  }

  const handleClose = () => {
    resetModal()
    onClose()
  }

  const handleAmountSubmit = () => {
    const numAmount = parseFloat(amount)
    
    if (isNaN(numAmount) || numAmount <= 0) {
      setError("Please enter a valid amount")
      return
    }
    
    if (numAmount < 1) {
      setError("Minimum transfer is N$1")
      return
    }
    
    if (numAmount > 10000) {
      setError("Maximum single transfer is N$10,000")
      return
    }

    setError(null)
    setStep("confirm")
  }

  const handleConfirmTransfer = async () => {
    setStep("processing")
    
    try {
      const res = await fetch("/api/wallet/qr-transfer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          qr_code: recipientQrCode,
          amount: parseFloat(amount),
          note: note.trim() || undefined
        })
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || "Transfer failed")
        setStep("error")
        return
      }

      setResult(data)
      setStep("success")
      
      toast({
        title: "Transfer Successful!",
        description: data.message,
      })

    } catch (err) {
      setError("Network error. Please try again.")
      setStep("error")
    }
  }

  const quickAmounts = [10, 50, 100, 500]

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && handleClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Send className="h-5 w-5 text-primary" />
            Send Credits
          </DialogTitle>
          <DialogDescription>
            Transfer credits to {recipientName}
          </DialogDescription>
        </DialogHeader>

        <AnimatePresence mode="wait">
          {/* Step 1: Enter Amount */}
          {step === "amount" && (
            <motion.div
              key="amount"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-4"
            >
              <div className="space-y-2">
                <Label htmlFor="amount">Amount (N$)</Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                    N$
                  </span>
                  <Input
                    id="amount"
                    type="number"
                    placeholder="0.00"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="pl-10 text-lg"
                    min="1"
                    max="10000"
                    step="0.01"
                  />
                </div>
              </div>

              {/* Quick amount buttons */}
              <div className="flex gap-2">
                {quickAmounts.map((qa) => (
                  <Button
                    key={qa}
                    variant="outline"
                    size="sm"
                    onClick={() => setAmount(String(qa))}
                    className={cn(
                      "flex-1 bg-transparent",
                      amount === String(qa) && "border-primary bg-primary/5"
                    )}
                  >
                    N${qa}
                  </Button>
                ))}
              </div>

              <div className="space-y-2">
                <Label htmlFor="note">Note (optional)</Label>
                <Textarea
                  id="note"
                  placeholder="Add a message..."
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  className="resize-none"
                  rows={2}
                  maxLength={100}
                />
              </div>

              {error && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <DialogFooter>
                <Button variant="outline" onClick={handleClose} className="bg-transparent">
                  Cancel
                </Button>
                <Button onClick={handleAmountSubmit} disabled={!amount}>
                  Continue
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </DialogFooter>
            </motion.div>
          )}

          {/* Step 2: Confirm */}
          {step === "confirm" && (
            <motion.div
              key="confirm"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-4"
            >
              <div className="bg-muted/50 rounded-lg p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">To</span>
                  <span className="font-medium">{recipientName}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Amount</span>
                  <span className="text-xl font-bold">N${parseFloat(amount).toFixed(2)}</span>
                </div>
                {note && (
                  <div className="flex items-start justify-between">
                    <span className="text-sm text-muted-foreground">Note</span>
                    <span className="text-sm text-right max-w-[200px]">{note}</span>
                  </div>
                )}
              </div>

              <Alert>
                <Wallet className="h-4 w-4" />
                <AlertDescription>
                  This amount will be deducted from your wallet balance.
                </AlertDescription>
              </Alert>

              <DialogFooter>
                <Button variant="outline" onClick={() => setStep("amount")} className="bg-transparent">
                  Back
                </Button>
                <Button onClick={handleConfirmTransfer}>
                  <Send className="mr-2 h-4 w-4" />
                  Confirm Transfer
                </Button>
              </DialogFooter>
            </motion.div>
          )}

          {/* Step 3: Processing */}
          {step === "processing" && (
            <motion.div
              key="processing"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="py-8 text-center space-y-4"
            >
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
              >
                <Loader2 className="h-12 w-12 mx-auto text-primary" />
              </motion.div>
              <p className="text-muted-foreground">Processing transfer...</p>
            </motion.div>
          )}

          {/* Step 4: Success */}
          {step === "success" && (
            <motion.div
              key="success"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              className="py-6 text-center space-y-4"
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", delay: 0.1 }}
                className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center mx-auto"
              >
                <CheckCircle2 className="h-8 w-8 text-emerald-600" />
              </motion.div>
              <div>
                <h3 className="text-lg font-semibold">Transfer Successful!</h3>
                <p className="text-muted-foreground">
                  N${parseFloat(amount).toFixed(2)} sent to {recipientName}
                </p>
              </div>
              {result?.new_balance !== undefined && (
                <div className="bg-muted/50 rounded-lg p-3">
                  <p className="text-sm text-muted-foreground">New Balance</p>
                  <p className="text-xl font-bold">N${result.new_balance.toFixed(2)}</p>
                </div>
              )}
              <Button onClick={handleClose} className="w-full">
                Done
              </Button>
            </motion.div>
          )}

          {/* Step 5: Error */}
          {step === "error" && (
            <motion.div
              key="error"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              className="py-6 text-center space-y-4"
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", delay: 0.1 }}
                className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center mx-auto"
              >
                <AlertCircle className="h-8 w-8 text-destructive" />
              </motion.div>
              <div>
                <h3 className="text-lg font-semibold">Transfer Failed</h3>
                <p className="text-muted-foreground">{error}</p>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" onClick={handleClose} className="flex-1 bg-transparent">
                  Cancel
                </Button>
                <Button onClick={() => setStep("amount")} className="flex-1">
                  Try Again
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </DialogContent>
    </Dialog>
  )
}
