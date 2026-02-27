"use client"

import { DashboardLayout } from "@/components/dashboard/dashboard-layout"
import { ProtectedRoute } from "@/components/auth/protected-route"
import { WalletHistoryScreen } from "@/components/wallet/wallet-history-screen"

export default function WalletPage() {
  return (
    <ProtectedRoute>
      <DashboardLayout>
        <WalletHistoryScreen />
      </DashboardLayout>
    </ProtectedRoute>
  )
}
