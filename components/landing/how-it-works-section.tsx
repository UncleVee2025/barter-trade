"use client"

import { motion, useInView } from "framer-motion"
import { useRef, useState } from "react"
import { UserPlus, PackagePlus, MessageSquare, HandshakeIcon, ArrowRight, CheckCircle2, Sparkles, Play } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"

const steps = [
  {
    icon: UserPlus,
    step: "01",
    title: "Create Your Account",
    description: "Sign up in 30 seconds with email or phone. Complete verification to unlock all features and start building trust.",
    color: "from-blue-500 to-cyan-400",
    features: ["Quick signup", "ID verification", "Trust score"],
    time: "30 seconds"
  },
  {
    icon: PackagePlus,
    step: "02",
    title: "List Your Items",
    description: "Add photos, set your value, and describe what you'd accept in return. Listings go live instantly across all regions.",
    color: "from-primary to-orange-400",
    features: ["Smart pricing", "Multi-photo", "Instant publish"],
    time: "2 minutes"
  },
  {
    icon: MessageSquare,
    step: "03",
    title: "Negotiate & Connect",
    description: "Chat with interested traders in real-time. Send offers, counter-offers, and negotiate the perfect trade.",
    color: "from-gold to-yellow-400",
    features: ["Real-time chat", "Trade offers", "Location sharing"],
    time: "Variable"
  },
  {
    icon: HandshakeIcon,
    step: "04",
    title: "Complete Your Trade",
    description: "Meet up or arrange delivery. Confirm the trade through our secure escrow and rate your experience.",
    color: "from-green-500 to-emerald-400",
    features: ["Secure escrow", "Delivery options", "Rating system"],
    time: "Instant"
  },
]

export function HowItWorksSection() {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: "-100px" })
  const [activeStep, setActiveStep] = useState(0)

  return (
    <section id="how-it-works" ref={ref} className="relative py-24 lg:py-32 overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-b from-background via-card/30 to-background" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(234,88,12,0.05),transparent_70%)]" />

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Section header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-center mb-20"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={isInView ? { opacity: 1, scale: 1 } : {}}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 px-4 py-2 bg-gold/10 border border-gold/20 rounded-full mb-6"
          >
            <Sparkles className="h-4 w-4 text-gold" />
            <span className="text-sm font-medium text-gold">Simple 4-Step Process</span>
          </motion.div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-foreground mb-4 text-balance">
            Start Trading in <span className="text-primary">Minutes</span>
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto text-pretty">
            Our streamlined process makes trading easy and secure for everyone, from beginners to pros.
          </p>
        </motion.div>

        {/* Desktop timeline view */}
        <div className="hidden lg:block relative mb-20">
          {/* Connection line */}
          <div className="absolute top-28 left-[12.5%] right-[12.5%] h-1 bg-border rounded-full overflow-hidden">
            <motion.div
              initial={{ scaleX: 0 }}
              animate={isInView ? { scaleX: 1 } : {}}
              transition={{ duration: 1.5, delay: 0.5 }}
              className="h-full bg-gradient-to-r from-blue-500 via-primary via-gold to-green-500 origin-left"
            />
          </div>

          <div className="grid grid-cols-4 gap-8">
            {steps.map((step, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 40 }}
                animate={isInView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.5, delay: 0.3 + i * 0.15 }}
                onMouseEnter={() => setActiveStep(i)}
                className={cn(
                  "relative group cursor-pointer transition-all duration-300",
                  activeStep === i ? "scale-105" : "opacity-80 hover:opacity-100"
                )}
              >
                {/* Icon with number */}
                <div className="relative flex flex-col items-center mb-8">
                  <motion.div
                    whileHover={{ scale: 1.1, rotate: 5 }}
                    className={cn(
                      "relative w-20 h-20 rounded-3xl bg-gradient-to-br flex items-center justify-center shadow-xl z-10 transition-shadow duration-300",
                      step.color,
                      activeStep === i && "shadow-2xl"
                    )}
                  >
                    <step.icon className="h-9 w-9 text-white" />
                    {/* Pulse ring */}
                    {activeStep === i && (
                      <motion.div
                        initial={{ scale: 1, opacity: 0.5 }}
                        animate={{ scale: 1.5, opacity: 0 }}
                        transition={{ duration: 1.5, repeat: Infinity }}
                        className={cn("absolute inset-0 rounded-3xl bg-gradient-to-br", step.color)}
                      />
                    )}
                  </motion.div>
                  {/* Step number badge */}
                  <div className="absolute -top-2 -right-2 w-8 h-8 rounded-full bg-card border-2 border-primary flex items-center justify-center text-sm font-bold text-primary shadow-lg">
                    {step.step}
                  </div>
                </div>

                {/* Content */}
                <div className="text-center">
                  <div className="inline-flex items-center gap-2 px-3 py-1 bg-card border border-border rounded-full mb-3">
                    <span className="text-xs text-muted-foreground">Avg. time:</span>
                    <span className="text-xs font-semibold text-primary">{step.time}</span>
                  </div>
                  <h3 className="text-xl font-bold text-foreground mb-3">{step.title}</h3>
                  <p className="text-muted-foreground text-sm mb-4 leading-relaxed">{step.description}</p>
                  
                  {/* Feature pills */}
                  <div className="flex flex-wrap justify-center gap-2">
                    {step.features.map((feature, j) => (
                      <span
                        key={j}
                        className="flex items-center gap-1 px-2 py-1 text-xs text-foreground/70 bg-background/50 border border-border/50 rounded-full"
                      >
                        <CheckCircle2 className="h-3 w-3 text-green-500" />
                        {feature}
                      </span>
                    ))}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Mobile card view */}
        <div className="lg:hidden space-y-4">
          {steps.map((step, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: -20 }}
              animate={isInView ? { opacity: 1, x: 0 } : {}}
              transition={{ duration: 0.5, delay: i * 0.1 }}
              className="relative"
            >
              <div className="p-6 bg-card/80 backdrop-blur-sm border border-border rounded-2xl">
                <div className="flex items-start gap-4">
                  <div className={cn(
                    "w-14 h-14 rounded-2xl bg-gradient-to-br flex-shrink-0 flex items-center justify-center shadow-lg",
                    step.color
                  )}>
                    <step.icon className="h-7 w-7 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-xs font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-full">
                        STEP {step.step}
                      </span>
                      <span className="text-xs text-muted-foreground">{step.time}</span>
                    </div>
                    <h3 className="text-lg font-bold text-foreground mb-2">{step.title}</h3>
                    <p className="text-sm text-muted-foreground mb-3">{step.description}</p>
                    <div className="flex flex-wrap gap-2">
                      {step.features.map((feature, j) => (
                        <span
                          key={j}
                          className="flex items-center gap-1 px-2 py-1 text-xs text-foreground/70 bg-background/50 border border-border/50 rounded-full"
                        >
                          <CheckCircle2 className="h-3 w-3 text-green-500" />
                          {feature}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
              {/* Connector line */}
              {i < steps.length - 1 && (
                <div className="absolute left-10 top-full w-0.5 h-4 bg-gradient-to-b from-border to-transparent" />
              )}
            </motion.div>
          ))}
        </div>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5, delay: 0.8 }}
          className="text-center mt-16"
        >
          <div className="inline-flex flex-col sm:flex-row items-center gap-4">
            <Button
              size="lg"
              className="bg-primary hover:bg-primary/90 text-primary-foreground px-8 py-6 text-lg rounded-2xl shadow-xl shadow-primary/25 gap-2 group"
            >
              Get Started Now
              <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
            </Button>
            <Button
              variant="outline"
              size="lg"
              className="px-8 py-6 text-lg rounded-2xl border-border hover:bg-card gap-2 bg-transparent"
            >
              <Play className="h-5 w-5 text-primary" />
              Watch Tutorial
            </Button>
          </div>
          <p className="text-sm text-muted-foreground mt-4">
            No credit card required. Start trading in under 5 minutes.
          </p>
        </motion.div>
      </div>
    </section>
  )
}
