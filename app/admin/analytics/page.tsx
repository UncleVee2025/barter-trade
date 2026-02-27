"use client"

import { AdminLayout } from "@/components/admin/admin-layout"
import { ProtectedRoute } from "@/components/auth/protected-route"
import { AdminAnalytics } from "@/components/admin/admin-analytics"

export default function AdminAnalyticsPage() {
  return (
    <ProtectedRoute requireAdmin>
      <AdminLayout>
        <AdminAnalytics />
      </AdminLayout>
    </ProtectedRoute>
  )
}
