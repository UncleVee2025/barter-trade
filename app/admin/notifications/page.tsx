"use client"

import { AdminLayout } from "@/components/admin/admin-layout"
import { AdminNotifications } from "@/components/admin/admin-notifications"
import { ProtectedRoute } from "@/components/auth/protected-route"

export default function AdminNotificationsPage() {
  return (
    <ProtectedRoute requireAdmin>
      <AdminLayout>
        <AdminNotifications />
      </AdminLayout>
    </ProtectedRoute>
  )
}
