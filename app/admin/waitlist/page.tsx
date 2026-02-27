import { AdminLayout } from "@/components/admin/admin-layout"
import { AdminWaitlist } from "@/components/admin/admin-waitlist"
import { ProtectedRoute } from "@/components/auth/protected-route"

export default function AdminWaitlistPage() {
  return (
    <ProtectedRoute requireAdmin>
      <AdminLayout>
        <AdminWaitlist />
      </AdminLayout>
    </ProtectedRoute>
  )
}
