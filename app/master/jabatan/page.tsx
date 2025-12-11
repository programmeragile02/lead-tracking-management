import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { JabatanList } from "@/components/master/jabatan/jabatan-list";

export default function JabatanMasterPage() {
  return (
    <DashboardLayout title="Master Jabatan">
      <div className="space-y-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Master Jabatan</h2>
          <p className="text-sm text-gray-500 mt-1">
            Informasi hirarki jabatan dalam sistem: Manager, Team Leader, dan
            Sales.
          </p>
        </div>

        <JabatanList />
      </div>
    </DashboardLayout>
  );
}
