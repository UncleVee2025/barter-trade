"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import Image from "next/image"
import { Menu, X, Sparkles, ArrowRight, ChevronDown, Zap, Shield, Globe2, Users } from "lucide-react"
import { cn } from "@/lib/utils"

const navLinks = [
  { 
    href: "#features", 
    label: "Features",
    hasDropdown: true,
    items: [
      { icon: Zap, label: "Instant Listings", description: "Create listings in seconds" },
      { icon: Shield, label: "Secure Trading", description: "Bank-grade security" },
      { icon: Globe2, label: "Nationwide", description: "14 regions connected" },
      { icon: Users, label: "Community", description: "50,000+ traders" },
    ]
  },
  { href: "#how-it-works", label: "How It Works" },
  { href: "#testimonials", label: "Success Stories" },
  { href: "#pricing", label: "Pricing" },
]

export function FloatingNavbar() {
  const [isScrolled, setIsScrolled] = useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null)

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50)
    }
    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  return (
    <>
      <motion.nav
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        className={cn(
          "fixed top-0 left-0 right-0 z-50 transition-all duration-500",
          isScrolled ? "py-3" : "py-4"
        )}
      >
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <motion.div
            layout
            className={cn(
              "flex items-center justify-between rounded-2xl px-4 sm:px-6 py-3 transition-all duration-500",
              isScrolled
                ? "bg-card/90 backdrop-blur-xl border border-border/50 shadow-xl shadow-black/5"
                : "bg-transparent"
            )}
          >
            {/* Logo */}
            <Link href="/" className="flex items-center gap-3 group">
              <motion.div
                whileHover={{ scale: 1.05, rotate: 5 }}
                whileTap={{ scale: 0.95 }}
                className="relative w-11 h-11 rounded-xl overflow-hidden shadow-lg shadow-primary/20"
              >
                <Image
                  src="/logo.png"
                  alt="Barter Trade Namibia"
                  width={44}
                  height={44}
                  className="object-contain"
                />
              </motion.div>
              <div className="hidden sm:block">
                <span className="font-bold text-foreground text-lg block leading-tight">Barter Trade</span>
                <span className="text-primary font-medium text-xs block leading-tight">Namibia</span>
              </div>
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden lg:flex items-center gap-1">
              {navLinks.map((link) => (
                <div
                  key={link.href}
                  className="relative"
                  onMouseEnter={() => link.hasDropdown && setActiveDropdown(link.href)}
                  onMouseLeave={() => setActiveDropdown(null)}
                >
                  <Link
                    href={link.href}
                    className="flex items-center gap-1 px-4 py-2 text-muted-foreground hover:text-foreground text-sm font-medium transition-colors rounded-lg hover:bg-muted/50"
                  >
                    {link.label}
                    {link.hasDropdown && (
                      <ChevronDown className={cn(
                        "h-4 w-4 transition-transform",
                        activeDropdown === link.href && "rotate-180"
                      )} />
                    )}
                  </Link>
                  
                  {/* Dropdown */}
                  <AnimatePresence>
                    {link.hasDropdown && activeDropdown === link.href && (
                      <motion.div
                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 10, scale: 0.95 }}
                        transition={{ duration: 0.2 }}
                        className="absolute top-full left-0 mt-2 w-72 p-2 bg-card/95 backdrop-blur-xl border border-border rounded-2xl shadow-2xl"
                      >
                        {link.items?.map((item, i) => (
                          <motion.a
                            key={i}
                            href={link.href}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: i * 0.05 }}
                            className="flex items-start gap-3 p-3 rounded-xl hover:bg-muted/50 transition-colors group"
                          >
                            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0 group-hover:bg-primary/20 transition-colors">
                              <item.icon className="h-5 w-5 text-primary" />
                            </div>
                            <div>
                              <span className="font-medium text-foreground text-sm block">{item.label}</span>
                              <span className="text-xs text-muted-foreground">{item.description}</span>
                            </div>
                          </motion.a>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              ))}
            </div>

            {/* CTA Buttons */}
            <div className="flex items-center gap-3">
              <Link href="/auth" className="hidden sm:block">
                <Button 
                  variant="ghost" 
                  className="text-foreground hover:bg-muted font-medium"
                >
                  Log In
                </Button>
              </Link>
              <Link href="/auth">
                <Button className="bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary text-primary-foreground rounded-xl gap-2 shadow-lg shadow-primary/20 font-medium px-5">
                  <Sparkles className="h-4 w-4" />
                  <span className="hidden sm:inline">Get Started</span>
                  <span className="sm:hidden">Start</span>
                </Button>
              </Link>
              <button
                onClick={() => setIsMobileMenuOpen(true)}
                className="lg:hidden p-2.5 text-foreground hover:bg-muted rounded-xl transition-colors"
              >
                <Menu className="h-5 w-5" />
              </button>
            </div>
          </motion.div>
        </div>
      </motion.nav>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm lg:hidden"
              onClick={() => setIsMobileMenuOpen(false)}
            />
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="fixed right-0 top-0 bottom-0 z-50 w-full max-w-sm bg-card border-l border-border lg:hidden"
            >
              <div className="flex items-center justify-between p-6 border-b border-border">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl overflow-hidden">
                    <Image
                      src="/logo.png"
                      alt="Barter Trade Namibia"
                      width={40}
                      height={40}
                      className="object-contain"
                    />
                  </div>
                  <div>
                    <span className="font-bold text-foreground">Barter Trade</span>
                    <span className="text-primary text-xs block">Namibia</span>
                  </div>
                </div>
                <button
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="p-2 text-muted-foreground hover:text-foreground rounded-lg hover:bg-muted transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="p-6 space-y-1">
                {navLinks.map((link, i) => (
                  <motion.div
                    key={link.href}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.1 }}
                  >
                    <Link
                      href={link.href}
                      onClick={() => setIsMobileMenuOpen(false)}
                      className="flex items-center justify-between p-4 text-foreground font-medium rounded-xl hover:bg-muted transition-colors"
                    >
                      {link.label}
                      <ArrowRight className="h-4 w-4 text-muted-foreground" />
                    </Link>
                  </motion.div>
                ))}
              </div>

              <div className="absolute bottom-0 left-0 right-0 p-6 space-y-3 border-t border-border bg-card">
                <Link href="/auth" className="block" onClick={() => setIsMobileMenuOpen(false)}>
                  <Button variant="outline" className="w-full rounded-xl py-6 bg-transparent">
                    Log In
                  </Button>
                </Link>
                <Link href="/auth" className="block" onClick={() => setIsMobileMenuOpen(false)}>
                  <Button className="w-full bg-gradient-to-r from-primary to-gold hover:from-primary/90 hover:to-gold/90 rounded-xl py-6 gap-2">
                    <Sparkles className="h-4 w-4" />
                    Get Started Free
                  </Button>
                </Link>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  )
}
