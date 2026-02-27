"use client"

import { AdminLayout } from "@/components/admin/admin-layout"
import { ProtectedRoute } from "@/components/auth/protected-route"
import { AdminTopupRequests } from "@/components/admin/admin-topup-requests"

export default function AdminTopupsPage() {
  return (
    <ProtectedRoute requireAdmin>
      <AdminLayout>
        <AdminTopupRequests />
      </AdminLayout>
    </ProtectedRoute>
  )
}
