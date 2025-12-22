import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { Button } from "@/components/ui/button";
import { Plus, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { EmployeeList } from "@/components/master/pegawai/pegawai-list";

export default function EmployeeMasterPage() {
  return (
    <DashboardLayout title="Master Pegawai">
      <div className="space-y-4">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Master Pegawai</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Kelola struktur tim mulai dari Manager, Team Leader, Sales, Super Admin
          </p>
        </div>

        <EmployeeList />
      </div>
    </DashboardLayout>
  );
}
