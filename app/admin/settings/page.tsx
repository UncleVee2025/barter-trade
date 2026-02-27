"use client"

import { AdminLayout } from "@/components/admin/admin-layout"
import { ProtectedRoute } from "@/components/auth/protected-route"
import { AdminSettings } from "@/components/admin/admin-settings"

export default function AdminSettingsPage() {
  return (
    <ProtectedRoute requireAdmin>
      <AdminLayout>
        <AdminSettings />
      </AdminLayout>
    </ProtectedRoute>
  )
}
