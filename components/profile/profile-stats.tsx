import { Target, Award, TrendingUp, Calendar } from "lucide-react";
import type { ProfileUser, ProfileStatsData } from "@/app/profile/page";

type ProfileStatsProps = {
  user: ProfileUser;
  stats: ProfileStatsData;
};

function getActiveDays(createdAt: string): number {
  const created = new Date(createdAt);
  const now = new Date();

  const start = new Date(
    created.getFullYear(),
    created.getMonth(),
    created.getDate()
  );
  const end = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  const diffMs = end.getTime() - start.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24)) + 1;

  return diffDays < 1 ? 1 : diffDays;
}

export function ProfileStats({ user, stats }: ProfileStatsProps) {
  const activeDays = getActiveDays(user.createdAt);
  const conversionLabel = `${stats.conversionRate.toFixed(1)}%`;

  const statsList = [
    {
      label: "Total Lead",
      value: stats.totalLeads.toString(),
      icon: Target,
      color: "bg-red-500",
    },
    {
      label: "Total Closing",
      value: stats.totalClosing.toString(),
      icon: Award,
      color: "bg-orange-500",
    },
    {
      label: "Tingkat Konversi",
      value: conversionLabel,
      icon: TrendingUp,
      color: "bg-red-600",
    },
    {
      label: "Hari Aktif",
      value: activeDays.toString(),
      icon: Calendar,
      color: "bg-orange-600",
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {statsList.map((stat) => (
        <div
          key={stat.label}
          className="bg-white rounded-xl p-4 shadow-md border-2 border-gray-100"
        >
          <div
            className={`w-12 h-12 rounded-lg ${stat.color} flex items-center justify-center mb-3`}
          >
            <stat.icon className="w-6 h-6 text-white" />
          </div>
          <p className="text-2xl font-bold text-gray-900 mb-1">{stat.value}</p>
          <p className="text-sm text-gray-600 font-medium">{stat.label}</p>
        </div>
      ))}
    </div>
  );
}
