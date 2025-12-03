import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { OrgTree } from "@/components/organization/org-tree";

export default function OrgPage() {
  return (
    <DashboardLayout title="Struktur Organisasi" role="manager">
      <div className="space-y-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">
            Struktur Organisasi
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            Visualisasi hirarki pegawai dari Manager, Team Leader, hingga Sales
          </p>
        </div>

        <OrgTree />
      </div>
    </DashboardLayout>
  );
}
