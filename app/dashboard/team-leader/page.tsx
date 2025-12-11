import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { TeamLeaderDashboardContent } from "@/components/team-leader/team-leader-dashboard-content";

export default function TeamLeaderDashboardPage() {
  return (
    <DashboardLayout title="Dashboard Tim">
      <TeamLeaderDashboardContent />
    </DashboardLayout>
  );
}
