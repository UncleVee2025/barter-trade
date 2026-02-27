import { EditListing } from "@/components/listings/edit-listing"
import { DashboardLayout } from "@/components/dashboard/dashboard-layout"
import { ProtectedRoute } from "@/components/auth/protected-route"

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function EditListingPage({ params }: PageProps) {
  const { id } = await params

  return (
    <ProtectedRoute>
      <DashboardLayout>
        <div className="p-4 md:p-6">
          <EditListing listingId={id} />
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  )
}
