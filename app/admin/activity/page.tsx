"use client"

import { AdminLayout } from "@/components/admin/admin-layout"
import { ProtectedRoute } from "@/components/auth/protected-route"
import { AdminActivityFeed } from "@/components/admin/admin-activity-feed"

export default function AdminActivityPage() {
  return (
    <ProtectedRoute requireAdmin>
      <AdminLayout>
        <AdminActivityFeed />
      </AdminLayout>
    </ProtectedRoute>
  )
}
