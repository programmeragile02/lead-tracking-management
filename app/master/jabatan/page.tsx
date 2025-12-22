import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { JabatanList } from "@/components/master/jabatan/jabatan-list";

export default function JabatanMasterPage() {
  return (
    <DashboardLayout title="Master Jabatan">
      <div className="space-y-4">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Master Jabatan</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Informasi hirarki jabatan dalam sistem: Super Admin, Manager, Team Leader, dan
            Sales.
          </p>
        </div>

        <JabatanList />
      </div>
    </DashboardLayout>
  );
}
