import { DashboardLayout } from "@/components/dashboard/dashboard-layout"
import { BrowseListings } from "@/components/listings/browse-listings"

export default function BrowsePage() {
  return (
    <DashboardLayout>
      <BrowseListings />
    </DashboardLayout>
  )
}
