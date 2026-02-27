"use client"

import { AdminLayout } from "@/components/admin/admin-layout"
import { AdminAdvertisements } from "@/components/admin/admin-advertisements"
import { ProtectedRoute } from "@/components/auth/protected-route"

export default function AdminAdsPage() {
  return (
    <ProtectedRoute requireAdmin>
      <AdminLayout>
        <AdminAdvertisements />
      </AdminLayout>
    </ProtectedRoute>
  )
}
