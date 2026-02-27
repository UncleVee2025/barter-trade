import type React from "react"
import type { Metadata, Viewport } from "next"
import { Poppins, Geist_Mono } from "next/font/google"
import "./globals.css"
import { AuthProvider } from "@/contexts/auth-context"
import { SocketProvider } from "@/contexts/socket-context"
import { WalletProvider } from "@/contexts/wallet-context"
import { NotificationProvider } from "@/contexts/notification-context"
import { ToastContainer } from "@/components/ui/toast-container"
import { AnimatedToastContainer } from "@/components/ui/animated-toast"
import { ConnectionStatus } from "@/components/ui/connection-status"

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-poppins",
})
const _geistMono = Geist_Mono({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Barter Trade Namibia - Cashless Trading Platform",
  description:
    "Namibia's first real-time digital barter platform. Trade goods, land, livestock, vehicles, and services without cash.",
  keywords: ["barter", "trade", "namibia", "cashless", "trading", "exchange"],
  authors: [{ name: "Barter Trade Namibia" }],
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/logo.png", type: "image/png" },
    ],
    shortcut: "/logo.png",
    apple: "/logo.png",
  },
  openGraph: {
    title: "Barter Trade Namibia",
    description: "Namibia's first real-time digital barter platform",
    images: ["/logo.png"],
  },
    generator: 'v0.app'
}

export const viewport: Viewport = {
  themeColor: "#ea580c",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className={`${poppins.className} font-sans antialiased`}>
        <AuthProvider>
          <SocketProvider>
            <WalletProvider>
              <NotificationProvider>
                <ConnectionStatus />
                {children}
                <ToastContainer />
                <AnimatedToastContainer />
              </NotificationProvider>
            </WalletProvider>
          </SocketProvider>
        </AuthProvider>
      </body>
    </html>
  )
}
