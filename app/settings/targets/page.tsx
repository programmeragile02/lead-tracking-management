import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { TargetSettingsForm } from "@/components/settings/target-settings-form";

export default function TargetSettingsPage() {
  return (
    <DashboardLayout title="Target Settings" showBack>
      <div className="space-y-6">
        <p className="text-muted-foreground">
          Configure daily lead and monthly revenue targets
        </p>

        <TargetSettingsForm />
      </div>
    </DashboardLayout>
  );
}
