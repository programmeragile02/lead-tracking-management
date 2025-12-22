"use client";

import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Users, Crown, Target, UserRoundCog } from "lucide-react";
import { JabatanItem } from "./jabatan-list";

function getRoleLabel(role: JabatanItem["code"]) {
  switch (role) {
    case "MANAGER":
      return "Manager";
    case "TEAM_LEADER":
      return "Team Leader";
    case "SALES":
      return "Sales";
    case "SUPERADMIN":
      return "Super Admin";
  }
}

function getRoleTagline(role: JabatanItem["code"]) {
  switch (role) {
    case "MANAGER":
      return "Pengambil keputusan utama dan pengelola seluruh tim";
    case "TEAM_LEADER":
      return "Koordinator tim sales dan penghubung dengan manager";
    case "SALES":
      return "Eksekutor lapangan yang berinteraksi langsung dengan lead";
    case "SUPERADMIN":
      return "Admin untuk konfigurasi data master";
  }
}

function getRoleIcon(role: JabatanItem["code"]) {
  switch (role) {
    case "MANAGER":
      return Crown;
    case "TEAM_LEADER":
      return Users;
    case "SALES":
      return Target;
    case "SUPERADMIN":
      return UserRoundCog;
  }
}

function roleBadgeClass(role: JabatanItem["code"]) {
  switch (role) {
    case "MANAGER":
      return "bg-primary text-white";
    case "TEAM_LEADER":
      return "bg-orange-600 text-white";
    case "SALES":
      return "bg-amber-600 text-white";
    case "SUPERADMIN":
      return "bg-green-600 text-white";
  }
}

export function JabatanCard({ role }: { role: JabatanItem }) {
  const Icon = getRoleIcon(role.code);

  return (
    <Card className="relative p-5 bg-secondary border-border shadow-sm hover:shadow-lg transition-all duration-200 overflow-hidden">
      {/* highlight strip */}
      <div className="absolute inset-x-0 top-0 h-1 bg-primary" />

      <div className="flex items-start gap-4">
        <div className="mt-1">
          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
            <Icon className="h-5 w-5 text-primary" />
          </div>
        </div>

        <div className="flex-1 space-y-2">
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="font-semibold text-foreground text-base">
                {getRoleLabel(role.code)}
              </h3>
              <Badge className={roleBadgeClass(role.code)}>{role.code}</Badge>
            </div>
            <p className="text-xs text-muted-foreground">
              {role.description || getRoleTagline(role.code)}
            </p>
          </div>

          <div className="pt-2 border-t border-gray-100 flex items-center justify-between text-xs">
            <div className="flex flex-col">
              <span className="text-muted-foreground">Jumlah Pegawai</span>
              <span className="font-semibold text-foreground">
                {role.totalUsers} pegawai
              </span>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
}
