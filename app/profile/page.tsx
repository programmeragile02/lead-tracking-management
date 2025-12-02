import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { ProfileHeader } from "@/components/profile/profile-header"
import { ProfileInformation } from "@/components/profile/profile-information"
import { ProfileSettings } from "@/components/profile/profile-settings"
import { ProfileStats } from "@/components/profile/profile-stats"

export default function ProfilePage() {
  return (
    <DashboardLayout title="Profil Saya" role="sales">
      <div className="space-y-6">
        <ProfileHeader />
        <ProfileStats />
        <ProfileInformation />
        <ProfileSettings />
      </div>
    </DashboardLayout>
  )
}
