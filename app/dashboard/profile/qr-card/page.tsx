"use client"

import { useState } from "react"
import useSWR from "swr"
import { motion } from "framer-motion"
import { 
  QrCode, 
  CreditCard, 
  Download, 
  Share2,
  Shield,
  Star,
  Loader2,
  ScanLine,
  Info,
  CheckCircle,
  XCircle
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Progress } from "@/components/ui/progress"
import { DashboardLayout } from "@/components/dashboard/dashboard-layout"
import { QRCodeDisplay } from "@/components/profile/qr-code-display"
import { DigitalBusinessCard } from "@/components/profile/digital-business-card"
import { CertificationBadge, CertificationStatus } from "@/components/profile/certification-badge"
import { QRScannerModal } from "@/components/profile/qr-scanner-modal"
import { useAuth } from "@/contexts/auth-context"
import { toast } from "@/hooks/use-toast"
import { cn } from "@/lib/utils"

const fetcher = (url: string) => fetch(url).then(res => res.json())

export default function QRCardPage() {
  const { user } = useAuth()
  const [activeTab, setActiveTab] = useState("qr-code")
  const [isScannerOpen, setIsScannerOpen] = useState(false)
  const [isRequestingCertification, setIsRequestingCertification] = useState(false)

  // Fetch QR code data
  const { data: qrData, isLoading: qrLoading } = useSWR(
    "/api/user/qr-code",
    fetcher
  )

  // Fetch business card data
  const { data: cardData, isLoading: cardLoading } = useSWR(
    "/api/user/business-card",
    fetcher
  )

  // Fetch certification status
  const { data: certData, isLoading: certLoading, mutate: refreshCert } = useSWR(
    "/api/user/certification",
    fetcher
  )

  const handleRequestCertification = async () => {
    setIsRequestingCertification(true)
    try {
      const response = await fetch("/api/user/certification", {
        method: "POST"
      })
      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(data.message || data.error || "Failed to request certification")
      }
      
      toast({
        title: "Congratulations!",
        description: data.message || "You are now a certified trader!"
      })
      refreshCert()
    } catch (error) {
      toast({
        title: "Certification Request Failed",
        description: error instanceof Error ? error.message : "Unable to process your request",
        variant: "destructive"
      })
    } finally {
      setIsRequestingCertification(false)
    }
  }

  const isLoading = qrLoading || cardLoading || certLoading
  const isCertified = certData?.is_certified || false
  const eligibility = certData?.eligibility || {
    completedTrades: 0,
    positiveReviews: 0,
    requiredTrades: 10,
    isEligible: false
  }

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">QR Code & Business Card</h1>
            <p className="text-muted-foreground">Share your profile and verify other traders</p>
          </div>
          <Button 
            variant="outline" 
            onClick={() => setIsScannerOpen(true)}
            className="rounded-xl bg-transparent"
          >
            <ScanLine className="h-4 w-4 mr-2" />
            Scan Trader
          </Button>
        </div>

        {/* Certification Status Banner */}
        {!isLoading && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            {isCertified ? (
              <Alert className="border-green-500/30 bg-green-500/10">
                <Shield className="h-4 w-4 text-green-500" />
                <AlertTitle className="text-green-600">Certified Trader</AlertTitle>
                <AlertDescription className="text-green-600/80">
                  Your QR code and business card display your verified certification badge.
                  {certData?.certification_id && (
                    <span className="block mt-1 font-mono text-xs">
                      Certification ID: {certData.certification_id}
                    </span>
                  )}
                </AlertDescription>
              </Alert>
            ) : eligibility.isEligible ? (
              <Alert className="border-yellow-500/30 bg-yellow-500/10">
                <CheckCircle className="h-4 w-4 text-yellow-600" />
                <AlertTitle className="text-yellow-700">You&apos;re Eligible for Certification!</AlertTitle>
                <AlertDescription className="flex items-center justify-between">
                  <span className="text-yellow-600/80">
                    You&apos;ve met all requirements. Get certified to build trust with other traders.
                  </span>
                  <Button 
                    size="sm" 
                    onClick={handleRequestCertification}
                    disabled={isRequestingCertification}
                    className="ml-4"
                  >
                    {isRequestingCertification ? (
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    ) : (
                      <Shield className="h-4 w-4 mr-2" />
                    )}
                    Get Certified
                  </Button>
                </AlertDescription>
              </Alert>
            ) : (
              <Alert>
                <Info className="h-4 w-4" />
                <AlertTitle>Work Towards Certification</AlertTitle>
                <AlertDescription>
                  <div className="space-y-3 mt-2">
                    <p className="text-muted-foreground">
                      Complete the following requirements to become a certified trader:
                    </p>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="flex items-center gap-2">
                          {eligibility.completedTrades >= eligibility.requiredTrades ? (
                            <CheckCircle className="h-4 w-4 text-green-500" />
                          ) : (
                            <XCircle className="h-4 w-4 text-muted-foreground" />
                          )}
                          Complete {eligibility.requiredTrades} trades
                        </span>
                        <span className="font-medium">{eligibility.completedTrades}/{eligibility.requiredTrades}</span>
                      </div>
                      <Progress 
                        value={(eligibility.completedTrades / eligibility.requiredTrades) * 100} 
                        className="h-2"
                      />
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      {certData?.email_verified ? (
                        <CheckCircle className="h-4 w-4 text-green-500" />
                      ) : (
                        <XCircle className="h-4 w-4 text-muted-foreground" />
                      )}
                      <span>Verify your email address</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      {certData?.phone_verified ? (
                        <CheckCircle className="h-4 w-4 text-green-500" />
                      ) : (
                        <XCircle className="h-4 w-4 text-muted-foreground" />
                      )}
                      <span>Verify your phone number</span>
                    </div>
                  </div>
                </AlertDescription>
              </Alert>
            )}
          </motion.div>
        )}

        {/* Main Content Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-2 h-12 rounded-xl bg-muted p-1">
            <TabsTrigger 
              value="qr-code" 
              className="rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm"
            >
              <QrCode className="h-4 w-4 mr-2" />
              QR Code
            </TabsTrigger>
            <TabsTrigger 
              value="business-card"
              className="rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm"
            >
              <CreditCard className="h-4 w-4 mr-2" />
              Business Card
            </TabsTrigger>
          </TabsList>

          {/* QR Code Tab */}
          <TabsContent value="qr-code" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* QR Code Display */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
              >
                {qrLoading ? (
                  <Card className="rounded-2xl">
                    <CardContent className="p-8 flex items-center justify-center min-h-[400px]">
                      <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    </CardContent>
                  </Card>
                ) : qrData?.user ? (
                  <QRCodeDisplay
                    user={{
                      id: qrData.user.id,
                      name: qrData.user.name,
                      avatar: qrData.user.avatar,
                      location: qrData.user.location,
                      isCertified: qrData.user.isCertified,
                      certificationId: qrData.user.certificationId,
                      badgeType: qrData.user.badgeType,
                      totalTrades: qrData.user.totalTrades || 0,
                      rating: qrData.user.rating || 0
                    }}
                    profileUrl={qrData.profileUrl}
                    qrData={qrData.qrData}
                    size={200}
                    className="rounded-2xl"
                  />
                ) : (
                  <Card className="rounded-2xl">
                    <CardContent className="p-8 text-center">
                      <p className="text-muted-foreground">Unable to generate QR code</p>
                    </CardContent>
                  </Card>
                )}
              </motion.div>

              {/* QR Code Info */}
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 }}
              >
                <Card className="rounded-2xl h-full">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <QrCode className="h-5 w-5" />
                      Your Trading QR Code
                    </CardTitle>
                    <CardDescription>
                      Share your QR code to let others quickly verify your profile
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-3">
                      <h4 className="font-medium text-sm">What&apos;s included:</h4>
                      <ul className="space-y-2 text-sm text-muted-foreground">
                        <li className="flex items-center gap-2">
                          <CheckCircle className="h-4 w-4 text-green-500" />
                          Direct link to your profile
                        </li>
                        <li className="flex items-center gap-2">
                          <CheckCircle className="h-4 w-4 text-green-500" />
                          Your trading statistics
                        </li>
                        <li className="flex items-center gap-2">
                          <CheckCircle className="h-4 w-4 text-green-500" />
                          Certification status verification
                        </li>
                        <li className="flex items-center gap-2">
                          <CheckCircle className="h-4 w-4 text-green-500" />
                          Recent reviews and ratings
                        </li>
                      </ul>
                    </div>

                    <div className="pt-4 border-t">
                      <h4 className="font-medium text-sm mb-2">How to use:</h4>
                      <ol className="space-y-2 text-sm text-muted-foreground list-decimal list-inside">
                        <li>Download or share your QR code</li>
                        <li>Show it when meeting for trades</li>
                        <li>Other traders scan to verify your identity</li>
                        <li>Build trust with verified transactions</li>
                      </ol>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            </div>
          </TabsContent>

          {/* Business Card Tab */}
          <TabsContent value="business-card" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Business Card Display */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
              >
                {cardLoading ? (
                  <Card className="rounded-2xl">
                    <CardContent className="p-8 flex items-center justify-center min-h-[400px]">
                      <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    </CardContent>
                  </Card>
                ) : cardData?.user ? (
                  <DigitalBusinessCard
                    user={{
                      id: cardData.user.id,
                      name: cardData.user.name,
                      email: cardData.user.email,
                      phone: cardData.user.phone,
                      avatar: cardData.user.avatar,
                      location: cardData.user.location,
                      bio: cardData.user.bio,
                      isCertified: cardData.user.isCertified,
                      certificationId: cardData.user.certificationId,
                      certificationDate: cardData.user.certificationDate,
                      badgeType: cardData.user.badgeType,
                      memberSince: cardData.user.memberSince
                    }}
                    stats={{
                      totalTrades: cardData.stats?.totalTrades || 0,
                      rating: cardData.stats?.rating || 0,
                      activeListings: cardData.stats?.activeListings || 0
                    }}
                    categories={cardData.categories}
                    profileUrl={cardData.profileUrl}
                    variant="full"
                  />
                ) : (
                  <Card className="rounded-2xl">
                    <CardContent className="p-8 text-center">
                      <p className="text-muted-foreground">Unable to generate business card</p>
                    </CardContent>
                  </Card>
                )}
              </motion.div>

              {/* Business Card Info */}
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 }}
                className="space-y-4"
              >
                <Card className="rounded-2xl">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <CreditCard className="h-5 w-5" />
                      Digital Business Card
                    </CardTitle>
                    <CardDescription>
                      A professional card showcasing your trading profile
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-3">
                      <h4 className="font-medium text-sm">Card features:</h4>
                      <ul className="space-y-2 text-sm text-muted-foreground">
                        <li className="flex items-center gap-2">
                          <CheckCircle className="h-4 w-4 text-green-500" />
                          Professional gradient design
                        </li>
                        <li className="flex items-center gap-2">
                          <CheckCircle className="h-4 w-4 text-green-500" />
                          Certification badge display
                        </li>
                        <li className="flex items-center gap-2">
                          <CheckCircle className="h-4 w-4 text-green-500" />
                          Contact information
                        </li>
                        <li className="flex items-center gap-2">
                          <CheckCircle className="h-4 w-4 text-green-500" />
                          Embedded QR code
                        </li>
                        <li className="flex items-center gap-2">
                          <CheckCircle className="h-4 w-4 text-green-500" />
                          Trading statistics
                        </li>
                      </ul>
                    </div>
                  </CardContent>
                </Card>

                {/* Compact Card Preview */}
                {cardData?.user && (
                  <Card className="rounded-2xl">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm">Compact Version</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <DigitalBusinessCard
                        user={{
                          id: cardData.user.id,
                          name: cardData.user.name,
                          avatar: cardData.user.avatar,
                          location: cardData.user.location,
                          isCertified: cardData.user.isCertified,
                          certificationId: cardData.user.certificationId,
                          badgeType: cardData.user.badgeType
                        }}
                        stats={{
                          totalTrades: cardData.stats?.totalTrades || 0,
                          rating: cardData.stats?.rating || 0
                        }}
                        profileUrl={cardData.profileUrl}
                        variant="compact"
                      />
                    </CardContent>
                  </Card>
                )}
              </motion.div>
            </div>
          </TabsContent>
        </Tabs>

        {/* Scanner Modal */}
        <QRScannerModal
          open={isScannerOpen}
          onOpenChange={setIsScannerOpen}
          currentUserId={user?.id}
        />
      </div>
    </DashboardLayout>
  )
}
