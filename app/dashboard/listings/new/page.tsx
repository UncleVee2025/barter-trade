import { DashboardLayout } from "@/components/dashboard/dashboard-layout"
import { CreateListing } from "@/components/listings/create-listing"

export default function NewListingPage() {
  return (
    <DashboardLayout>
      <CreateListing />
    </DashboardLayout>
  )
}
