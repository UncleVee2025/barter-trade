"use client"

import { useState, useCallback } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { LoginForm } from "./login-form"
import { RegisterForm } from "./register-form"
import { ArrowLeft, Shield, Zap, Globe2 } from "lucide-react"
import Link from "next/link"
import Image from "next/image"

export function AuthScreen() {
  const [activeTab, setActiveTab] = useState<"login" | "register">("login")
  const [prefilledEmail, setPrefilledEmail] = useState<string>("")

  // Handle successful registration - switch to login with email pre-filled
  const handleRegistrationSuccess = useCallback((email: string) => {
    setPrefilledEmail(email)
    setActiveTab("login")
  }, [])

  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-background">
      {/* Left side - Full Mascot Image */}
      <div className="relative hidden lg:block lg:w-1/2 overflow-hidden">
        {/* Full-bleed mascot image */}
        <Image
          src="/images/mascot.jpg"
          alt="Barter Trade Namibia Mascot"
          fill
          className="object-cover object-center"
          priority
          sizes="50vw"
        />
        
        {/* Overlay gradient for text readability */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
        
        {/* Content overlay at top */}
        <div className="absolute top-0 left-0 right-0 p-8 z-10">
          <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
            {/* Back to home */}
            <Link
              href="/"
              className="inline-flex items-center gap-2 text-white/80 hover:text-white transition-colors mb-6"
            >
              <ArrowLeft className="h-4 w-4" />
              <span className="text-sm font-medium">Back to home</span>
            </Link>

            <div className="flex items-center gap-3">
              <motion.div
                whileHover={{ scale: 1.05, rotate: 5 }}
                className="w-14 h-14 rounded-2xl overflow-hidden shadow-lg bg-white/10 backdrop-blur-sm"
              >
                <Image 
                  src="/logo.png" 
                  alt="Barter Trade Namibia" 
                  width={56} 
                  height={56} 
                  className="object-contain"
                  priority
                />
              </motion.div>
              <div>
                <h1 className="text-xl font-bold text-white">Barter Trade</h1>
                <p className="text-primary text-sm font-medium">Namibia</p>
              </div>
            </div>
          </motion.div>
        </div>
        
        {/* Content overlay at bottom */}
        <div className="absolute bottom-0 left-0 right-0 p-8 z-10">
          <motion.div 
            initial={{ opacity: 0, y: 20 }} 
            animate={{ opacity: 1, y: 0 }} 
            transition={{ delay: 0.3, duration: 0.6 }}
          >
            <h2 className="text-3xl xl:text-4xl font-bold text-white mb-4 text-balance leading-tight">
              Trade Without Cash,
              <br />
              <span className="bg-gradient-to-r from-primary to-gold bg-clip-text text-transparent">
                Build Community
              </span>
            </h2>
            <p className="text-base text-white/80 max-w-md mb-6">
              Join thousands of Namibians trading goods, land, livestock, vehicles, and services.
            </p>

            {/* Trust indicators */}
            <div className="flex flex-wrap gap-4">
              {[
                { icon: Shield, text: "Secure & Trusted" },
                { icon: Zap, text: "Instant Transfers" },
                { icon: Globe2, text: "All 14 Regions" },
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-2 text-white/90 bg-white/10 backdrop-blur-sm px-3 py-2 rounded-full">
                  <item.icon className="h-4 w-4 text-primary" />
                  <span className="text-xs font-medium">{item.text}</span>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>

      {/* Right side - Auth forms */}
      <div className="flex-1 flex flex-col bg-card">
        {/* Mobile header with mascot */}
        <div className="lg:hidden bg-charcoal border-b border-border">
          <div className="flex items-center justify-between p-4">
            <Link href="/" className="flex items-center gap-2 text-muted-foreground">
              <ArrowLeft className="h-4 w-4" />
              <span className="text-sm">Back</span>
            </Link>
            <div className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-xl overflow-hidden">
                <Image 
                  src="/logo.png" 
                  alt="Barter Trade Namibia" 
                  width={36} 
                  height={36} 
                  className="object-contain"
                  priority
                />
              </div>
              <span className="text-foreground font-semibold">Barter Trade</span>
            </div>
            <div className="w-16" /> {/* Spacer for centering */}
          </div>
          
          {/* Mobile mascot - Full body display */}
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex justify-center pb-4"
          >
            <div className="relative w-36 h-48">
              <Image
                src="/images/mascot.jpg"
                alt="Barter Trade Namibia Mascot"
                fill
                className="object-contain drop-shadow-lg"
                priority
              />
            </div>
          </motion.div>
        </div>

        <div className="flex-1 flex flex-col justify-center px-6 py-8 lg:px-12 xl:px-20">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full max-w-md mx-auto"
          >
            <h2 className="text-2xl lg:text-3xl font-bold text-card-foreground mb-2">
              {activeTab === "login" ? "Welcome back" : "Create account"}
            </h2>
            <p className="text-muted-foreground mb-8">
              {activeTab === "login" ? "Sign in to continue trading" : "Start trading on Namibia's barter platform"}
            </p>

            {/* Tab switcher */}
            <div className="relative flex bg-muted rounded-xl p-1 mb-8">
              <motion.div
                className="absolute top-1 bottom-1 bg-card rounded-lg shadow-sm"
                initial={false}
                animate={{
                  left: activeTab === "login" ? "4px" : "50%",
                  width: "calc(50% - 4px)",
                }}
                transition={{ type: "spring", stiffness: 300, damping: 30 }}
              />
              <button
                onClick={() => setActiveTab("login")}
                className={`relative z-10 flex-1 py-2.5 text-sm font-medium rounded-lg transition-colors ${
                  activeTab === "login" ? "text-card-foreground" : "text-muted-foreground"
                }`}
              >
                Login
              </button>
              <button
                onClick={() => setActiveTab("register")}
                className={`relative z-10 flex-1 py-2.5 text-sm font-medium rounded-lg transition-colors ${
                  activeTab === "register" ? "text-card-foreground" : "text-muted-foreground"
                }`}
              >
                Register
              </button>
            </div>

            {/* Forms */}
            <AnimatePresence mode="wait">
              {activeTab === "login" ? (
                <motion.div
                  key="login"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ duration: 0.2 }}
                >
                  <LoginForm prefilledEmail={prefilledEmail} />
                </motion.div>
              ) : (
                <motion.div
                  key="register"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.2 }}
                >
                  <RegisterForm onRegistrationSuccess={handleRegistrationSuccess} />
                </motion.div>
              )}
            </AnimatePresence>

            {/* Terms and Privacy */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="mt-8 text-center text-xs text-muted-foreground"
            >
              <p>
                By continuing, you agree to our{" "}
                <a href="/terms" className="text-primary hover:underline">Terms of Service</a>
                {" "}and{" "}
                <a href="/privacy" className="text-primary hover:underline">Privacy Policy</a>
              </p>
            </motion.div>
          </motion.div>
        </div>
      </div>
    </div>
  )
}
