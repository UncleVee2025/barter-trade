import { AdminLayout } from "@/components/admin/admin-layout"
import { AdminVouchers } from "@/components/admin/admin-vouchers"
import { ProtectedRoute } from "@/components/auth/protected-route"

export default function AdminVouchersPage() {
  return (
    <ProtectedRoute requireAdmin>
      <AdminLayout>
        <AdminVouchers />
      </AdminLayout>
    </ProtectedRoute>
  )
}
