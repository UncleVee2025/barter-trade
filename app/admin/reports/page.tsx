"use client"

import { AdminLayout } from "@/components/admin/admin-layout"
import { ProtectedRoute } from "@/components/auth/protected-route"
import { AdminReports } from "@/components/admin/admin-reports"

export default function AdminReportsPage() {
  return (
    <ProtectedRoute requireAdmin>
      <AdminLayout>
        <AdminReports />
      </AdminLayout>
    </ProtectedRoute>
  )
}
