import { AdminLayout } from "@/components/admin/admin-layout"
import { AdminUsers } from "@/components/admin/admin-users"
import { ProtectedRoute } from "@/components/auth/protected-route"

export default function AdminUsersPage() {
  return (
    <ProtectedRoute requireAdmin>
      <AdminLayout>
        <AdminUsers />
      </AdminLayout>
    </ProtectedRoute>
  )
}
