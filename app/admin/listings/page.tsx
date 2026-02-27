import { AdminLayout } from "@/components/admin/admin-layout"
import { AdminListings } from "@/components/admin/admin-listings"
import { ProtectedRoute } from "@/components/auth/protected-route"

export default function AdminListingsPage() {
  return (
    <ProtectedRoute requireAdmin>
      <AdminLayout>
        <AdminListings />
      </AdminLayout>
    </ProtectedRoute>
  )
}
