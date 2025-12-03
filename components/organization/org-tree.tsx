"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, Users, User, UserCircle } from "lucide-react";
import Image from "next/image";

type RoleCode = "MANAGER" | "TEAM_LEADER" | "SALES" | null;

type Employee = {
  id: number;
  name: string;
  email: string;
  photo?: string | null;
  roleCode: RoleCode;
  managerId?: number | null;
  teamLeaderId?: number | null;
};

type ManagerNode = {
  manager: Employee;
  teamLeaders: {
    tl: Employee;
    sales: Employee[];
  }[];
};

export function OrgTree() {
  const [data, setData] = useState<ManagerNode[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      try {
        setLoading(true);
        setError(null);
        const res = await fetch("/api/employees?onlyActive=true");
        const json = await res.json();
        if (!res.ok || !json.ok)
          throw new Error(json.message || "Gagal memuat struktur");

        const employees = json.data as Employee[];

        const managers = employees.filter((e) => e.roleCode === "MANAGER");
        const tls = employees.filter((e) => e.roleCode === "TEAM_LEADER");
        const sales = employees.filter((e) => e.roleCode === "SALES");

        const tree: ManagerNode[] = managers.map((m) => {
          const myTLs = tls.filter((tl) => tl.managerId === m.id);
          const tlNodes = myTLs.map((tl) => ({
            tl,
            sales: sales.filter((s) => s.teamLeaderId === tl.id),
          }));
          return { manager: m, teamLeaders: tlNodes };
        });

        setData(tree);
      } catch (err: any) {
        setError(err?.message || "Gagal memuat struktur");
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
        <span>Memuat struktur organisasi...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center text-sm text-red-600 py-10">{error}</div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="text-center text-sm text-gray-500 py-10">
        Belum ada data pegawai aktif untuk ditampilkan.
      </div>
    );
  }

  return (
    <div className="space-y-10">
      {data.map((node) => (
        <ManagerBranch key={node.manager.id} node={node} />
      ))}
    </div>
  );
}

function AvatarCircle({ employee }: { employee: Employee }) {
  return (
    <div className="relative w-16 h-16 rounded-full overflow-hidden border-4 border-white shadow-md bg-gradient-to-br from-primary/20 to-secondary/20">
      {employee.photo ? (
        <Image
          src={employee.photo}
          alt={employee.name}
          fill
          className="object-cover"
        />
      ) : (
        <div className="w-full h-full flex items-center justify-center text-primary/70 bg-primary/5">
          <UserCircle className="h-9 w-9" />
        </div>
      )}
    </div>
  );
}

function ManagerBranch({ node }: { node: ManagerNode }) {
  const { manager, teamLeaders } = node;

  return (
    <div className="flex flex-col items-center gap-6">
      {/* Manager */}
      <Card className="relative px-6 py-4 bg-white shadow-lg border-primary/10 flex flex-col items-center min-w-[260px]">
        <AvatarCircle employee={manager} />
        <div className="mt-3 text-center">
          <p className="text-xs uppercase tracking-[0.18em] text-primary font-semibold flex items-center justify-center gap-1">
            <Users className="h-3 w-3" />
            Manager
          </p>
          <p className="text-lg font-semibold text-gray-900 mt-1">
            {manager.name}
          </p>
          <p className="text-xs text-gray-500 mt-0.5">{manager.email}</p>
        </div>
      </Card>

      {/* Garis turun ke TL */}
      {teamLeaders.length > 0 && (
        <div className="flex flex-col items-center">
          <div className="w-px h-6 bg-gradient-to-b from-primary/40 to-primary/10" />
          <div className="flex items-start gap-4 md:gap-6 lg:gap-8 flex-wrap justify-center">
            {teamLeaders.map((tlNode) => (
              <TeamLeaderBranch key={tlNode.tl.id} node={tlNode} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function TeamLeaderBranch({
  node,
}: {
  node: { tl: Employee; sales: Employee[] };
}) {
  const { tl, sales } = node;

  return (
    <div className="flex flex-col items-center">
      {/* TL card */}
      <Card className="relative px-5 py-4 bg-gradient-to-br from-purple-50 to-white border-purple-100 shadow-md flex flex-col items-center min-w-[220px]">
        <AvatarCircle employee={tl} />
        <div className="mt-2 text-center">
          <Badge className="bg-purple-600 text-white text-[10px] px-2 py-0.5 rounded-full">
            Team Leader
          </Badge>
          <p className="text-sm font-semibold text-gray-900 mt-1">{tl.name}</p>
          <p className="text-xs text-gray-500">{tl.email}</p>
        </div>
      </Card>

      {/* garis turun & sales */}
      {sales.length > 0 && (
        <div className="flex flex-col items-center mt-3">
          <div className="w-px h-5 bg-purple-300" />
          <div className="flex flex-wrap gap-2 justify-center mt-2 max-w-md">
            {sales.map((s) => (
              <Card
                key={s.id}
                className="px-3 py-2 bg-emerald-50 border-emerald-100 flex items-center gap-2 min-w-[180px]"
              >
                <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center border border-emerald-100">
                  <User className="h-4 w-4 text-emerald-600" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-gray-900">
                    {s.name}
                  </p>
                  <p className="text-[11px] text-gray-500 truncate">
                    {s.email}
                  </p>
                  <Badge
                    variant="outline"
                    className="border-emerald-300 text-emerald-700 bg-white/60 mt-0.5 text-[10px] px-1.5 py-0"
                  >
                    Sales
                  </Badge>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
