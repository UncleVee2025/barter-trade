"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Wallet, Sparkles, ArrowRight, X, Zap, Shield, CreditCard, Ticket } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { useWallet } from "@/contexts/wallet-context"

interface InsufficientCreditModalProps {
  isOpen: boolean
  onClose: () => void
  requiredAmount: number
  actionDescription?: string
  onTopUp?: () => void
}

export function InsufficientCreditModal({
  isOpen,
  onClose,
  requiredAmount,
  actionDescription = "continue with this action",
  onTopUp,
}: InsufficientCreditModalProps) {
  const { balance } = useWallet()
  const shortfall = Math.max(0, requiredAmount - balance)

  if (!isOpen) return null

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[70] bg-black/60 backdrop-blur-sm"
            onClick={onClose}
          />
          
          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 50 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 50 }}
            transition={{ type: "spring", stiffness: 350, damping: 30 }}
            className="fixed inset-x-4 bottom-auto top-1/2 -translate-y-1/2 sm:inset-x-auto sm:left-1/2 sm:-translate-x-1/2 z-[70] w-auto sm:w-full sm:max-w-md"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="bg-card rounded-3xl shadow-2xl border border-border overflow-hidden">
              {/* Animated Header */}
              <div className="relative overflow-hidden bg-gradient-to-br from-amber-500/20 via-primary/10 to-orange-500/20 p-6 pb-8">
                {/* Animated background elements */}
                <div className="absolute inset-0 overflow-hidden">
                  <motion.div
                    animate={{
                      scale: [1, 1.2, 1],
                      opacity: [0.3, 0.5, 0.3],
                    }}
                    transition={{
                      duration: 3,
                      repeat: Infinity,
                      ease: "easeInOut",
                    }}
                    className="absolute -top-10 -right-10 w-40 h-40 rounded-full bg-amber-500/30 blur-3xl"
                  />
                  <motion.div
                    animate={{
                      scale: [1, 1.3, 1],
                      opacity: [0.2, 0.4, 0.2],
                    }}
                    transition={{
                      duration: 4,
                      repeat: Infinity,
                      ease: "easeInOut",
                      delay: 1,
                    }}
                    className="absolute -bottom-10 -left-10 w-40 h-40 rounded-full bg-primary/30 blur-3xl"
                  />
                </div>

                {/* Close button */}
                <button
                  onClick={onClose}
                  className="absolute top-4 right-4 w-8 h-8 rounded-full bg-background/50 backdrop-blur-sm flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
                >
                  <X className="h-4 w-4" />
                </button>

                {/* Icon with animation */}
                <div className="relative flex justify-center mb-4">
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", stiffness: 400, damping: 15, delay: 0.1 }}
                    className="relative"
                  >
                    <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center shadow-lg shadow-amber-500/30">
                      <Wallet className="h-10 w-10 text-white" />
                    </div>
                    {/* Floating sparkles */}
                    <motion.div
                      animate={{ y: [0, -8, 0], opacity: [0.5, 1, 0.5] }}
                      transition={{ duration: 2, repeat: Infinity }}
                      className="absolute -top-2 -right-2"
                    >
                      <Sparkles className="h-6 w-6 text-amber-500" />
                    </motion.div>
                  </motion.div>
                </div>

                {/* Title */}
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="text-center relative"
                >
                  <h2 className="text-xl font-bold text-foreground mb-1">
                    Insufficient Credit
                  </h2>
                  <p className="text-sm text-muted-foreground">
                    Top up your wallet to {actionDescription}
                  </p>
                </motion.div>
              </div>

              {/* Content */}
              <div className="p-6 space-y-5">
                {/* Balance breakdown */}
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="space-y-3"
                >
                  <div className="flex items-center justify-between p-3 rounded-xl bg-muted/50">
                    <span className="text-sm text-muted-foreground">Current Balance</span>
                    <span className="font-semibold text-foreground">N$ {balance.toLocaleString()}</span>
                  </div>
                  <div className="flex items-center justify-between p-3 rounded-xl bg-muted/50">
                    <span className="text-sm text-muted-foreground">Required Amount</span>
                    <span className="font-semibold text-foreground">N$ {requiredAmount.toLocaleString()}</span>
                  </div>
                  <div className="flex items-center justify-between p-3 rounded-xl bg-amber-500/10 border border-amber-500/20">
                    <span className="text-sm font-medium text-amber-600 dark:text-amber-400">Amount Needed</span>
                    <span className="font-bold text-amber-600 dark:text-amber-400">N$ {shortfall.toLocaleString()}</span>
                  </div>
                </motion.div>

                {/* Friendly message */}
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                  className="p-4 rounded-xl bg-gradient-to-br from-primary/5 to-amber-500/5 border border-primary/10"
                >
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <Zap className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-foreground mb-1">
                        Unlock More Trading Opportunities
                      </p>
                      <p className="text-xs text-muted-foreground leading-relaxed">
                        Top up your wallet to continue trading and access premium features. 
                        Credit can be added via voucher codes or mobile money transfer.
                      </p>
                    </div>
                  </div>
                </motion.div>

                {/* Top up methods preview */}
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 }}
                  className="flex gap-3"
                >
                  <div className="flex-1 p-3 rounded-xl bg-muted/30 border border-border/50 text-center">
                    <Ticket className="h-5 w-5 text-amber-500 mx-auto mb-1" />
                    <p className="text-[10px] text-muted-foreground">Voucher Code</p>
                  </div>
                  <div className="flex-1 p-3 rounded-xl bg-muted/30 border border-border/50 text-center">
                    <CreditCard className="h-5 w-5 text-primary mx-auto mb-1" />
                    <p className="text-[10px] text-muted-foreground">Mobile Money</p>
                  </div>
                </motion.div>

                {/* Action buttons */}
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.6 }}
                  className="space-y-3 pt-2"
                >
                  <Button
                    onClick={() => {
                      onClose()
                      onTopUp?.()
                    }}
                    className="w-full h-14 rounded-2xl text-base font-semibold bg-gradient-to-r from-amber-500 to-primary hover:opacity-90 shadow-lg shadow-primary/25"
                  >
                    <Wallet className="mr-2 h-5 w-5" />
                    Top Up Wallet
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                  <Button
                    onClick={onClose}
                    variant="ghost"
                    className="w-full h-12 rounded-xl text-muted-foreground hover:text-foreground"
                  >
                    Maybe Later
                  </Button>
                </motion.div>

                {/* Security badge */}
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.7 }}
                  className="flex items-center justify-center gap-2 pt-2"
                >
                  <Shield className="h-3.5 w-3.5 text-muted-foreground/60" />
                  <span className="text-[10px] text-muted-foreground/60">
                    All transactions are secure and encrypted
                  </span>
                </motion.div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
