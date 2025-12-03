"use client";

import { useEffect, useState } from "react";
import { JabatanCard } from "./jabatan-card";
import { BriefcaseBusiness, Loader2, Shield } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export type RoleCode = "MANAGER" | "TEAM_LEADER" | "SALES";

export interface JabatanItem {
  id: number;
  code: RoleCode;
  name: string;
  description?: string | null;
  isActive: boolean;
  totalUsers: number;
}

export function JabatanList() {
  const [roles, setRoles] = useState<JabatanItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      try {
        setLoading(true);
        setError(null);
        const res = await fetch("/api/roles");
        const json = await res.json();
        if (!res.ok || !json.ok)
          throw new Error(json.message || "Gagal memuat role");
        setRoles(json.data as JabatanItem[]);
      } catch (err: any) {
        setError(err?.message || "Gagal memuat role");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-10 text-gray-500 gap-2">
        <Loader2 className="h-5 w-5 animate-spin" />
        <span>Memuat data jabatan...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center text-sm text-red-600 py-10">{error}</div>
    );
  }

  if (roles.length === 0) {
    return (
      <div className="text-center text-sm text-gray-500 py-10">
        Belum ada data jabatan. Pastikan data jabatan sudah di-seed di database.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Ringkasan kecil di atas */}
      <Card className="p-4 bg-gradient-to-r from-primary/5 via-white to-secondary/5 border-primary/10 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center">
            <BriefcaseBusiness className="h-5 w-5 text-primary" />
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-800">
              Total Jabatan Terdaftar
            </p>
            <p className="text-xs text-gray-500">
              {roles.length} jabatan aktif digunakan di sistem
            </p>
          </div>
        </div>
        <div className="flex gap-2 flex-wrap">
          {roles.map((r) => (
            <Badge
              key={r.id}
              variant="outline"
              className="text-xs border-primary/30 text-primary bg-white/60"
            >
              {r.code} • {r.totalUsers} pegawai
            </Badge>
          ))}
        </div>
      </Card>

      {/* Cards per role */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {roles.map((role) => (
          <JabatanCard key={role.id} role={role} />
        ))}
      </div>
    </div>
  );
}
