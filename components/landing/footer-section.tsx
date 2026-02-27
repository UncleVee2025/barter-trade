"use client"

import { motion, useInView } from "framer-motion"
import { useRef } from "react"
import Link from "next/link"
import { 
  Facebook, 
  Twitter, 
  Instagram, 
  Linkedin, 
  Mail, 
  Phone, 
  MapPin,
  ArrowRight,
  Sparkles,
  Shield,
  Award
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

const footerLinks = {
  Platform: [
    { label: "Features", href: "#features" },
    { label: "How It Works", href: "#how-it-works" },
    { label: "Pricing", href: "#pricing" },
    { label: "Success Stories", href: "#testimonials" },
    { label: "Mobile App", href: "/app" },
  ],
  Company: [
    { label: "About Us", href: "/about" },
    { label: "Careers", href: "/careers" },
    { label: "Press Kit", href: "/press" },
    { label: "Contact", href: "/contact" },
    { label: "Blog", href: "/blog" },
  ],
  Resources: [
    { label: "Help Center", href: "/help" },
    { label: "Trading Guide", href: "/guide" },
    { label: "Safety Tips", href: "/safety" },
    { label: "Community Forum", href: "/community" },
    { label: "API Docs", href: "/developers" },
  ],
  Legal: [
    { label: "Privacy Policy", href: "/privacy" },
    { label: "Terms of Service", href: "/terms" },
    { label: "Cookie Policy", href: "/cookies" },
    { label: "Refund Policy", href: "/refunds" },
    { label: "Compliance", href: "/compliance" },
  ],
}

const socialLinks = [
  { icon: Facebook, href: "#", label: "Facebook" },
  { icon: Twitter, href: "#", label: "Twitter" },
  { icon: Instagram, href: "#", label: "Instagram" },
  { icon: Linkedin, href: "#", label: "LinkedIn" },
]

const certifications = [
  { icon: Shield, label: "SSL Secured" },
  { icon: Award, label: "Verified Platform" },
]

export function FooterSection() {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: "-100px" })

  return (
    <footer ref={ref} className="relative bg-card border-t border-border overflow-hidden">
      {/* Background pattern */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_100%,rgba(234,88,12,0.05),transparent_50%)]" />

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Newsletter section */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="py-12 border-b border-border"
        >
          <div className="flex flex-col lg:flex-row items-center justify-between gap-8">
            <div className="text-center lg:text-left">
              <h3 className="text-2xl font-bold text-foreground mb-2">Stay Updated</h3>
              <p className="text-muted-foreground">Get the latest trading tips and platform updates.</p>
            </div>
            <div className="flex w-full max-w-md gap-3">
              <Input
                type="email"
                placeholder="Enter your email"
                className="bg-background border-border rounded-xl h-12"
              />
              <Button className="bg-primary hover:bg-primary/90 rounded-xl h-12 px-6 gap-2 flex-shrink-0">
                Subscribe
                <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </motion.div>

        {/* Main footer content */}
        <div className="py-12 lg:py-16">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-8 lg:gap-12">
            {/* Brand column */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.5 }}
              className="col-span-2"
            >
              <Link href="/" className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-gold flex items-center justify-center shadow-lg shadow-primary/20">
                  <span className="text-primary-foreground font-bold text-xl">B</span>
                </div>
                <div>
                  <span className="font-bold text-foreground text-xl block leading-tight">Barter Trade</span>
                  <span className="text-primary font-medium text-sm block leading-tight">Namibia</span>
                </div>
              </Link>
              <p className="text-muted-foreground mb-6 max-w-xs leading-relaxed">
                Namibia&apos;s first real-time digital barter platform. Trade goods, services, and more without cash.
              </p>
              
              {/* Contact info */}
              <div className="space-y-3 text-sm">
                <a href="mailto:support@bartertrade.na" className="flex items-center gap-3 text-muted-foreground hover:text-foreground transition-colors group">
                  <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                    <Mail className="h-4 w-4 text-primary" />
                  </div>
                  <span>support@bartertrade.na</span>
                </a>
                <a href="tel:+26461234567" className="flex items-center gap-3 text-muted-foreground hover:text-foreground transition-colors group">
                  <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                    <Phone className="h-4 w-4 text-primary" />
                  </div>
                  <span>+264 61 123 4567</span>
                </a>
                <div className="flex items-center gap-3 text-muted-foreground">
                  <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                    <MapPin className="h-4 w-4 text-primary" />
                  </div>
                  <span>Windhoek, Namibia</span>
                </div>
              </div>
            </motion.div>

            {/* Links */}
            {Object.entries(footerLinks).map(([title, links], i) => (
              <motion.div
                key={title}
                initial={{ opacity: 0, y: 20 }}
                animate={isInView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.5, delay: 0.1 + i * 0.05 }}
              >
                <h3 className="font-semibold text-foreground mb-4">{title}</h3>
                <ul className="space-y-3">
                  {links.map((link) => (
                    <li key={link.label}>
                      <Link
                        href={link.href}
                        className="text-sm text-muted-foreground hover:text-primary transition-colors inline-flex items-center gap-1 group"
                      >
                        {link.label}
                        <ArrowRight className="h-3 w-3 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all" />
                      </Link>
                    </li>
                  ))}
                </ul>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Bottom section */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={isInView ? { opacity: 1 } : {}}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="py-8 border-t border-border"
        >
          <div className="flex flex-col lg:flex-row items-center justify-between gap-6">
            {/* Copyright & certifications */}
            <div className="flex flex-col sm:flex-row items-center gap-4">
              <p className="text-sm text-muted-foreground">
                {new Date().getFullYear()} Barter Trade Namibia. All rights reserved.
              </p>
              <div className="flex items-center gap-3">
                {certifications.map((cert, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-muted/50 rounded-full"
                  >
                    <cert.icon className="h-3.5 w-3.5 text-green-500" />
                    <span className="text-xs text-muted-foreground">{cert.label}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Social links */}
            <div className="flex items-center gap-2">
              {socialLinks.map((social) => (
                <Link
                  key={social.label}
                  href={social.href}
                  className="w-10 h-10 rounded-xl bg-muted/50 flex items-center justify-center text-muted-foreground hover:text-primary hover:bg-primary/10 transition-all"
                  aria-label={social.label}
                >
                  <social.icon className="h-5 w-5" />
                </Link>
              ))}
            </div>
          </div>
        </motion.div>
      </div>
    </footer>
  )
}
