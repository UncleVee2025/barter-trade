"use client"

import { AdminLayout } from "@/components/admin/admin-layout"
import { ProtectedRoute } from "@/components/auth/protected-route"
import { AdminIdVerification } from "@/components/admin/admin-id-verification"

export default function AdminVerificationPage() {
  return (
    <ProtectedRoute requireAdmin>
      <AdminLayout>
        <AdminIdVerification />
      </AdminLayout>
    </ProtectedRoute>
  )
}
