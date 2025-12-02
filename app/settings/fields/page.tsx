import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { DynamicFieldsList } from "@/components/settings/dynamic-fields-list"

export default function FieldsSettingsPage() {
  return (
    <DashboardLayout title="Dynamic Lead Fields" role="manager" showBack>
      <div className="space-y-6">
        <p className="text-muted-foreground">Configure custom fields for lead data collection</p>

        <DynamicFieldsList />
      </div>
    </DashboardLayout>
  )
}
