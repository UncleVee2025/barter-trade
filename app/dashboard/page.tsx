import { DashboardLayout } from "@/components/dashboard/dashboard-layout"
import { DashboardHome } from "@/components/dashboard/dashboard-home"
import { ProtectedRoute } from "@/components/auth/protected-route"

export default function DashboardPage() {
  return (
    <ProtectedRoute>
      <DashboardLayout>
        <DashboardHome />
      </DashboardLayout>
    </ProtectedRoute>
  )
}
