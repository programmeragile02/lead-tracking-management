"use client";

import { useState } from "react";
import useSWR from "swr";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { ProfileHeader } from "@/components/profile/profile-header";
import { ProfileInformation } from "@/components/profile/profile-information";
import { ProfileSettings } from "@/components/profile/profile-settings";
import { ProfileStats } from "@/components/profile/profile-stats";
import { Loader2, AlertCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export type ProfileUser = {
  id: number;
  name: string;
  email: string;
  phone: string | null;
  address: string | null;
  photo: string | null;
  roleName: string | null;
  roleCode: string | null;
  createdAt: string;
  lastLogin: string | null;
};

export type ProfileStatsData = {
  totalLeads: number;
  totalClosing: number;
  conversionRate: number; // 0-100
  totalClosingAmount: number;
};

type ProfileGetResponse = {
  ok: boolean;
  data: {
    user: ProfileUser;
    stats: ProfileStatsData;
  };
  error?: string;
};

const PROFILE_API = "/api/profile";

const fetcher = (url: string) =>
  fetch(url).then((res) => res.json() as Promise<ProfileGetResponse>);

export default function ProfilePage() {
  const { toast } = useToast();
  const { data, error, isLoading, mutate } = useSWR(PROFILE_API, fetcher);
  const [isEditing, setIsEditing] = useState(false);

  if (isLoading) {
    return (
      <DashboardLayout title="Profil Saya" role="sales">
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-6 h-6 animate-spin mr-2" />
          <span className="text-sm text-muted-foreground">
            Memuat profil...
          </span>
        </div>
      </DashboardLayout>
    );
  }

  if (error || !data?.ok) {
    return (
      <DashboardLayout title="Profil Saya" role="sales">
        <div className="flex flex-col items-center justify-center py-16 text-center space-y-3">
          <AlertCircle className="w-10 h-10 text-red-500" />
          <p className="font-semibold">Gagal memuat profil</p>
          <p className="text-sm text-muted-foreground">
            {data?.error || "Terjadi kesalahan. Coba muat ulang halaman."}
          </p>
        </div>
      </DashboardLayout>
    );
  }

  const user = data.data.user;
  const stats = data.data.stats;

  const handleUpdated = (updated: ProfileUser) => {
    // update hanya bagian user, stats tetap
    mutate(
      {
        ok: true,
        data: {
          user: updated,
          stats,
        },
      },
      false
    );
    setIsEditing(false);
    toast({
      title: "Profil diperbarui",
      description: "Informasi profil Anda berhasil disimpan.",
    });
  };

  const handleUpdateError = (message: string) => {
    toast({
      title: "Gagal menyimpan profil",
      description: message || "Terjadi kesalahan saat menyimpan data.",
      variant: "destructive",
    });
  };

  const handlePhotoUpdated = (updated: ProfileUser) => {
    mutate(
      {
        ok: true,
        data: {
          user: updated,
          stats,
        },
      },
      false
    );
    toast({
      title: "Foto profil diperbarui",
      description: "Foto profil Anda berhasil diganti.",
    });
  };

  return (
    <DashboardLayout title="Profil Saya" role="sales">
      <div className="space-y-6">
        <ProfileHeader
          user={user}
          isEditing={isEditing}
          onEditClick={() => setIsEditing((prev) => !prev)}
          onPhotoUpdated={handlePhotoUpdated}
        />

        <ProfileStats user={user} stats={stats} />

        <ProfileInformation
          user={user}
          isEditing={isEditing}
          onCancel={() => setIsEditing(false)}
          onUpdated={handleUpdated}
          onError={handleUpdateError}
        />
        <ProfileSettings />
      </div>
    </DashboardLayout>
  );
}
