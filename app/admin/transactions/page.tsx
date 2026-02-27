"use client"

import { AdminLayout } from "@/components/admin/admin-layout"
import { AdminTransactions } from "@/components/admin/admin-transactions"
import { ProtectedRoute } from "@/components/auth/protected-route"

export default function AdminTransactionsPage() {
  return (
    <ProtectedRoute requireAdmin>
      <AdminLayout>
        <AdminTransactions />
      </AdminLayout>
    </ProtectedRoute>
  )
}
