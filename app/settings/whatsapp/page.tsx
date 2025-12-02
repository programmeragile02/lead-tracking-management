import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { WhatsAppAccountsList } from "@/components/settings/whatsapp-accounts-list"

export default function WhatsAppSettingsPage() {
  return (
    <DashboardLayout title="WhatsApp Accounts" role="manager" showBack>
      <div className="space-y-6">
        <p className="text-muted-foreground">Manage WhatsApp integration and account assignments</p>

        <WhatsAppAccountsList />
      </div>
    </DashboardLayout>
  )
}
