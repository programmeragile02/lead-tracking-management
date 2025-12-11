import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { TeamLeaderTeamContent } from "@/components/team-leader/team-page-content";

export default function TeamLeaderTeamPage() {
  return (
    <DashboardLayout title="Tim Saya">
      <TeamLeaderTeamContent />
    </DashboardLayout>
  );
}
